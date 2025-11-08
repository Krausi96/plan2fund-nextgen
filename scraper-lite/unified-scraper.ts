#!/usr/bin/env ts-node

/**
 * UNIFIED SCRAPER - Clean, Simple, LLM-Supported
 * 
 * This replaces the complex multi-file structure with a simple, reliable scraper.
 * 
 * Usage:
 *   npm run scraper:unified -- --discover --max=50
 *   npm run scraper:unified -- --scrape --max=20
 *   npm run scraper:unified -- --full --max=20
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load env FIRST - before any imports that might use env vars
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath, override: false });
}
dotenv.config({ override: false });

// Check env vars after dotenv loads
const hasOpenAI = !!process.env.OPENAI_API_KEY;
const hasCustomLLM = !!process.env.CUSTOM_LLM_ENDPOINT;

import { 
  getPool, testConnection, savePageWithRequirements, isUrlInDatabase,
  getQueuedUrls, markUrlQueued, markJobDone, learnUrlPatternFromPage,
  normalizeMetadata, PageMetadata
} from './db/db';
import { getAllSeedUrls, findInstitutionByUrl, findInstitutionConfigByUrl } from './src/config/config';
import { fetchHtml, isOverviewPage, requiresLogin } from './src/utils';
import { isUrlExcluded } from './src/utils/blacklist';
import { normalizeFundingTypes, inferFundingType } from './src/utils/funding-types';
import { batchClassifyUrls, classifyUrl, UrlClassification } from './src/core/llm-discovery';
import { 
  recordClassificationFeedback,
  autoLearnQualityPatterns, 
  getImprovedClassificationPrompt, 
  getLearningStatus 
} from './src/learning/auto-learning';
import * as cheerio from 'cheerio';

// ============================================================================
// CONFIGURATION
// ============================================================================

function getConfig() {
  // Check at runtime to ensure env vars are loaded
  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  const hasCustomLLM = !!process.env.CUSTOM_LLM_ENDPOINT;
  // If API keys are set, ignore DISABLE_LLM (user wants to use LLM)
  const disableLLM = (process.env.DISABLE_LLM === 'true' || process.env.DISABLE_LLM === '1') && !hasOpenAI && !hasCustomLLM;
  
  // Check for FORCE_UPDATE flag (env var or command-line argument)
  const forceUpdate = process.env.FORCE_UPDATE === 'true' || 
                      process.env.FORCE_UPDATE === '1' ||
                      process.argv.includes('--force-update');
  
  return {
    // LLM-FIRST: Always use LLM for extraction (pattern extraction is unreliable)
    // Support both OpenAI and Custom LLM (Ollama, Groq, etc.)
    USE_LLM: !disableLLM && (hasOpenAI || hasCustomLLM),
    LLM_ONLY: true, // Skip pattern extraction, use LLM directly
    
    // Discovery Settings - Smart discovery for different funding types
    MAX_DISCOVERY: parseInt(process.env.LITE_MAX_DISCOVERY_PAGES || '50', 10),
    DISCOVER_FUNDING_TYPES: ['grant', 'loan', 'equity', 'guarantee'], // Look for different types
    
    // Scraping Settings
    MAX_SCRAPE: parseInt(process.env.LITE_MAX_URLS || '20', 10),
    
    // Update Settings
    FORCE_UPDATE: forceUpdate, // Re-scrape existing pages when true
    
    // Database
    DATABASE_URL: process.env.DATABASE_URL,
  };
}

const CONFIG = getConfig();

// ============================================================================
// DATABASE HELPERS
// ============================================================================

async function savePageToDatabase(page: PageMetadata): Promise<number> {
  if (!CONFIG.DATABASE_URL) {
    console.warn('⚠️  No DATABASE_URL - skipping save');
    return 0;
  }
  
  try {
    return await savePageWithRequirements(page);
  } catch (error: any) {
    console.error(`❌ Save failed: ${error.message}`);
    throw error;
  }
}

// ============================================================================
// DISCOVERY - Simple & Clean
// ============================================================================

async function discoverPrograms(): Promise<number> {
  console.log('🔍 Smart Discovery - Finding NEW URLs with different funding types...\n');
  
  if (!CONFIG.DATABASE_URL) {
    console.error('❌ DATABASE_URL required');
    return 0;
  }
  
  const pool = getPool();
  
  // Get existing funding types in database to find gaps
  const existingTypes = await pool.query(`
    SELECT DISTINCT funding_types, COUNT(*) as count
    FROM pages
    WHERE funding_types IS NOT NULL AND array_length(funding_types, 1) > 0
    GROUP BY funding_types
  `);
  
  const existingTypeSet = new Set<string>();
  existingTypes.rows.forEach((r: any) => {
    (r.funding_types || []).forEach((t: string) => existingTypeSet.add(t));
  });
  
  console.log(`📊 Existing funding types in DB: ${Array.from(existingTypeSet).join(', ') || 'None'}\n`);
  
  // Get seeds - focus on institutions with different funding types
  const seeds = getAllSeedUrls();
  console.log(`🌱 Checking ${seeds.length} seed URLs...\n`);
  
  // Batch check ALL seeds against database
  const seedCheck = await pool.query(
    `SELECT url FROM pages WHERE url = ANY($1::text[])`,
    [seeds]
  );
  const existingSeeds = new Set(seedCheck.rows.map((r: any) => r.url));
  
  // RE-CHECK OVERVIEW PAGES: Get overview pages that need re-checking (older than 7 days)
  const overviewPages = await pool.query(`
    SELECT url, fetched_at 
    FROM pages 
    WHERE url = ANY($1::text[])
      AND metadata_json->>'is_overview_page' = 'true'
      AND (fetched_at IS NULL OR fetched_at < NOW() - INTERVAL '7 days')
  `, [seeds]);
  
  const overviewUrlsToRecheck = new Set(overviewPages.rows.map((r: any) => r.url));
  
  // SMART SEED PROCESSING: Skip seeds already in DB (unless overview page)
  // Use LLM to quickly check if seed is overview page before fetching
  const seedsToCheck = seeds.filter(s => !existingSeeds.has(s) || overviewUrlsToRecheck.has(s));
  const seedsToProcess: string[] = [];
  
  // Quick LLM classification of seeds (batch)
  if (seedsToCheck.length > 0 && CONFIG.USE_LLM) {
    console.log(`🤖 Quick LLM classification of ${seedsToCheck.length} seeds...`);
    const seedClassifications = await batchClassifyUrls(
      seedsToCheck.map(url => ({ url }))
    );
    
    for (const classification of seedClassifications) {
      // Process if: not in DB, or is overview page, or LLM says it's an overview
      if (!existingSeeds.has(classification.url) || 
          overviewUrlsToRecheck.has(classification.url) ||
          classification.isOverviewPage) {
        seedsToProcess.push(classification.url);
      }
    }
  } else {
    seedsToProcess.push(...seedsToCheck);
  }
  
  console.log(`   ${seeds.length - seedsToProcess.length} already in DB, ${seedsToProcess.length} new/overview to check`);
  if (overviewUrlsToRecheck.size > 0) {
    console.log(`   🔄 Re-checking ${overviewUrlsToRecheck.size} overview pages for new programs\n`);
  } else {
    console.log(`\n`);
  }
  
  // Separate phases for clarity
  const newSeeds = seedsToProcess.filter(s => !existingSeeds.has(s));
  const overviewSeeds = seedsToProcess.filter(s => overviewUrlsToRecheck.has(s));
  
  if (newSeeds.length > 0) {
    console.log(`📋 Phase 1: Processing ${newSeeds.length} NEW seed URLs\n`);
  }
  if (overviewSeeds.length > 0) {
    console.log(`🔄 Phase 2: Re-checking ${overviewSeeds.length} overview pages (older than 7 days)\n`);
  }
  
  if (seedsToProcess.length === 0) {
    console.log('✅ All seeds already processed - looking for new links...\n');
  }
  
  const discovered: string[] = [];
  const seen = new Set<string>();
  let pagesProcessed = 0;
  
  // Process seeds and discover NEW links
  for (const seed of seedsToProcess.slice(0, CONFIG.MAX_DISCOVERY)) {
    if (pagesProcessed >= CONFIG.MAX_DISCOVERY) break;
    if (seen.has(seed)) continue;
    
    seen.add(seed);
    pagesProcessed++;
    
    try {
      // Determine why this seed is being processed (enhanced logging)
      let reason = '';
      let reasonDetails = '';
      
      if (overviewUrlsToRecheck.has(seed)) {
        const lastChecked = overviewPages.rows.find((r: any) => r.url === seed)?.fetched_at;
        const lastCheckedDate = lastChecked ? new Date(lastChecked) : null;
        const daysSince = lastCheckedDate 
          ? Math.floor((Date.now() - lastCheckedDate.getTime()) / (1000 * 60 * 60 * 24))
          : 'never';
        reason = `🔄 Overview page re-check`;
        reasonDetails = `Last checked: ${lastCheckedDate ? lastCheckedDate.toLocaleDateString() : 'never'} (${daysSince} days ago)`;
      } else if (!existingSeeds.has(seed)) {
        reason = `✅ New seed URL`;
        reasonDetails = `Not in database - first time processing`;
      } else if (CONFIG.FORCE_UPDATE) {
        reason = `🔄 Force update`;
        reasonDetails = `Already in DB but force update enabled`;
      } else {
        reason = `⏭️  Skipped`;
        reasonDetails = `Already in database (not overview, not force update)`;
      }
      
      console.log(`📄 [${pagesProcessed}/${CONFIG.MAX_DISCOVERY}] ${seed.substring(0, 60)}...`);
      console.log(`   ${reason}: ${reasonDetails}`);
      
      // Skip if already in DB and not overview and not force update
      if (existingSeeds.has(seed) && !overviewUrlsToRecheck.has(seed) && !CONFIG.FORCE_UPDATE) {
        continue; // Skip this seed
      }
      
      // Check blacklist (database + hardcoded)
      if (await isUrlExcluded(seed)) {
        console.log(`   ⏭️  Skipping blacklisted URL\n`);
        continue;
      }
      
      const result = await fetchHtml(seed);
      
      // Skip 404s
      if (result.status === 404) {
        console.log(`   ⏭️  HTTP 404 - Skipping\n`);
        continue;
      }
      const $ = cheerio.load(result.html);
      
      // Check if this is an overview page
      const isOverview = isOverviewPage(seed, result.html);
      if (isOverview) {
        console.log(`   📋 Overview page detected - extracting all program links...`);
        
        // FILTER EXPLORATION: Extract filter URLs from overview pages (e.g., FFG filter pages)
        try {
          const { extractFilterUrls } = await import('./src/utils/overview-filters');
          const filterUrls = extractFilterUrls(result.html, seed, 10); // Max 10 filter combinations
          
          if (filterUrls.length > 0) {
            console.log(`   🔍 Found ${filterUrls.length} filter combinations to explore...`);
            
            // Classify filter URLs with LLM
            if (CONFIG.USE_LLM) {
              const improvedPrompt = await getImprovedClassificationPrompt();
              const filterClassifications = await batchClassifyUrls(
                filterUrls.map(url => ({ url })),
                improvedPrompt
              );
              
              // Queue high-quality filter URLs
              let filterQueued = 0;
              // Check filter URLs against database
              const filterUrlCheck = await pool.query(
                `SELECT url FROM pages WHERE url = ANY($1::text[])`,
                [filterUrls]
              );
              const existingFilterUrls = new Set(filterUrlCheck.rows.map((r: any) => r.url));
              
              for (const classification of filterClassifications) {
                if (classification.isProgramPage !== 'no' && classification.qualityScore >= 50) {
                  if (!seen.has(classification.url) && !existingFilterUrls.has(classification.url)) {
                    discovered.push(classification.url);
                    seen.add(classification.url);
                    await markUrlQueued(classification.url, classification.qualityScore);
                    filterQueued++;
                  }
                }
              }
              
              if (filterQueued > 0) {
                console.log(`   ✅ Queued ${filterQueued} high-quality filter URLs`);
              }
            } else {
              // Fallback: queue all filter URLs if LLM not available
              const filterUrlCheck = await pool.query(
                `SELECT url FROM pages WHERE url = ANY($1::text[])`,
                [filterUrls]
              );
              const existingFilterUrls = new Set(filterUrlCheck.rows.map((r: any) => r.url));
              
              let filterQueued = 0;
              for (const filterUrl of filterUrls.slice(0, 5)) {
                if (!seen.has(filterUrl) && !existingFilterUrls.has(filterUrl)) {
                  discovered.push(filterUrl);
                  seen.add(filterUrl);
                  await markUrlQueued(filterUrl, 50);
                  filterQueued++;
                }
              }
              if (filterQueued > 0) {
                console.log(`   ✅ Queued ${filterQueued} filter URLs (LLM disabled)`);
              }
            }
          }
        } catch (error: any) {
          // Silently fail - filter exploration is optional
          console.warn(`   ⚠️  Filter exploration failed: ${error.message}`);
        }
      }
      
      // LLM-BASED FILTERING: Extract ALL links, then classify with LLM
      const links: Array<{ url: string; title: string }> = [];
      $('a[href]').each((_, el) => {
        const href = $(el).attr('href');
        const text = $(el).text().trim();
        if (!href) return;
        
        try {
          const fullUrl = new URL(href, seed).href;
          const urlLower = fullUrl.toLowerCase();
          
          // Must be from same institution
          if (!fullUrl.includes(new URL(seed).hostname)) return;
          
          // Basic exclusions (PDFs, obvious non-program pages)
          if (urlLower.match(/\.(pdf|doc|docx|zip)$/i)) return;
          if (urlLower.includes('/news/') || urlLower.includes('/press/') || 
              urlLower.includes('/contact/') || urlLower.includes('/about/') ||
              urlLower.includes('/team/') || urlLower.includes('/imprint/')) return;
          
          // CRITICAL: Filter out email-protection URLs (they return 404)
          if (urlLower.includes('cdn-cgi/l/email-protection') || 
              urlLower.includes('email-protection#') ||
              urlLower.includes('cdn-cgi/l/email')) return;
          
          // Filter out other common 404 patterns
          if (urlLower.includes('/sitemap/') || 
              urlLower.includes('/accessibility/') ||
              urlLower.includes('/data-protection/') ||
              urlLower.includes('/disclaimer/') ||
              urlLower.includes('/request-ifg/')) return;
          
          links.push({ url: fullUrl, title: text });
        } catch {
          // Invalid URL
        }
      });
      
      // Batch check against database first
      const uniqueLinks = Array.from(new Set(links.map(l => l.url)));
      if (uniqueLinks.length === 0) {
        console.log(`   ✅ Found 0 links\n`);
        continue;
      }
      
      // Additional filtering: Remove email-protection and known 404 URLs
      const filteredLinks = uniqueLinks.filter(url => {
        const urlLower = url.toLowerCase();
        return !urlLower.includes('cdn-cgi/l/email-protection') &&
               !urlLower.includes('email-protection#') &&
               !urlLower.includes('cdn-cgi/l/email') &&
               !urlLower.includes('/sitemap/') &&
               !urlLower.includes('/accessibility/') &&
               !urlLower.includes('/data-protection/') &&
               !urlLower.includes('/disclaimer/') &&
               !urlLower.includes('/request-ifg/');
      });
      
      if (filteredLinks.length === 0) {
        console.log(`   ✅ Found 0 valid links (after filtering)\n`);
        continue;
      }
      
      const linkCheck = await pool.query(
        `SELECT url FROM pages WHERE url = ANY($1::text[])`,
        [filteredLinks]
      );
      const existingLinks = new Set(linkCheck.rows.map((r: any) => r.url));
      const newLinks = links.filter(l => filteredLinks.includes(l.url) && !existingLinks.has(l.url) && !seen.has(l.url));
      
      if (newLinks.length === 0) {
        console.log(`   ✅ Found ${uniqueLinks.length} links, all already in DB\n`);
        continue;
      }
      
      // LLM CLASSIFICATION: Batch classify new links with improved prompts
      if (CONFIG.USE_LLM && newLinks.length > 0) {
        console.log(`   🤖 Classifying ${newLinks.length} links with LLM...`);
        
        // Get improved prompt (learns from past mistakes)
        const improvedPrompt = await getImprovedClassificationPrompt();
        
        const classifications = await batchClassifyUrls(
          newLinks.map(l => ({ url: l.url, title: l.title })),
          improvedPrompt
        );
        
        // Only queue high-quality program pages
        for (const classification of classifications) {
          if (classification.isProgramPage === 'no') continue;
          if (classification.qualityScore < 50) continue;
          
          discovered.push(classification.url);
          seen.add(classification.url);
          await markUrlQueued(classification.url, classification.qualityScore);
        }
        
        const queued = classifications.filter(c => 
          c.isProgramPage !== 'no' && c.qualityScore >= 50
        ).length;
        console.log(`   ✅ Classified: ${queued} high-quality program pages queued\n`);
      } else {
        // Fallback: queue all new links if LLM not available
        for (const link of newLinks.slice(0, CONFIG.MAX_DISCOVERY * 2)) {
          if (discovered.length >= CONFIG.MAX_DISCOVERY * 2) break;
          discovered.push(link.url);
          seen.add(link.url);
          await markUrlQueued(link.url, 50); // Default quality score
        }
        console.log(`   ✅ Found ${uniqueLinks.length} links, ${newLinks.length} NEW programs queued\n`);
      }
      
      // Mark overview pages in database for future re-checking
      if (isOverview) {
        try {
          await pool.query(`
            UPDATE pages 
            SET metadata_json = jsonb_set(
              COALESCE(metadata_json, '{}'::jsonb), 
              '{is_overview_page}', 
              'true'::jsonb
            ),
            fetched_at = NOW()
            WHERE url = $1
          `, [seed]);
        } catch {
          // Silently fail
        }
      }
      
    } catch (error: any) {
      console.warn(`   ⚠️  Failed: ${error.message}\n`);
    }
  }
  
  console.log(`✅ Discovery complete: ${discovered.length} NEW programs queued\n`);
  return discovered.length;
}

// ============================================================================
// SCRAPING - With LLM Support
// ============================================================================

async function scrapePrograms(): Promise<number> {
  console.log('🧮 LLM-First Scraping...\n');
  
  if (!CONFIG.DATABASE_URL) {
    console.error('❌ DATABASE_URL required');
    return 0;
  }
  
  if (!CONFIG.USE_LLM) {
    console.error('❌ LLM required for extraction. Set OPENAI_API_KEY or CUSTOM_LLM_ENDPOINT in .env.local\n');
    return 0;
  }
  
  const urls = await getQueuedUrls(CONFIG.MAX_SCRAPE);
  
  // Debug: Check queue status
  const pool = getPool();
  const queueCheck = await pool.query('SELECT COUNT(*) as total FROM scraping_jobs WHERE status = $1', ['queued']);
  console.log(`🔍 Debug: ${queueCheck.rows[0].total} URLs in queue, getQueuedUrls returned ${urls.length}`);
  
  if (urls.length === 0) {
    console.log('ℹ️  No queued URLs to scrape\n');
    return 0;
  }
  
  // Parallel processing: Process 8 URLs concurrently (increased from 5 for speed)
  // Can increase to 10 if rate limits allow, but 8 is safer
  const CONCURRENCY = parseInt(process.env.SCRAPER_CONCURRENCY || '8', 10);
  
  console.log(`📋 Scraping ${urls.length} programs with LLM (${CONCURRENCY} parallel)...\n`);
  
  let saved = 0;
  let skipped = 0;
  let updated = 0;
  const processUrl = async (url: string, index: number): Promise<{ saved: boolean; skipped: boolean; updated: boolean }> => {
    console.log(`[${index + 1}/${urls.length}] ${url.substring(0, 60)}...`);
    
    // Check if URL already exists
    const exists = await isUrlInDatabase(url);
    if (exists && !CONFIG.FORCE_UPDATE) {
      console.log(`   ⏭️  Already in database, skipping (use --force-update to re-scrape)\n`);
      return { saved: false, skipped: true, updated: false };
    }
    
    if (exists && CONFIG.FORCE_UPDATE) {
      console.log(`   🔄 Force update: Re-scraping existing page...`);
    }
    
    try {
      // Check blacklist (database + hardcoded)
      if (await isUrlExcluded(url)) {
        console.log(`   ⏭️  Skipping blacklisted URL\n`);
        await pool.query('UPDATE scraping_jobs SET status = $1, last_error = $2 WHERE url = $3', 
          ['failed', 'Blacklisted URL', url]);
        // Learn exclusion pattern
        const host = new URL(url).hostname.replace('www.', '');
        await learnUrlPatternFromPage(url, host, false);
        return { saved: false, skipped: true, updated: false };
      }
      
      // Fetch HTML
      const result = await fetchHtml(url);
      
      // Check for 404
      if (result.status === 404) {
        console.log(`   ⏭️  HTTP 404 - Page not found, marking as failed\n`);
        await pool.query('UPDATE scraping_jobs SET status = $1, last_error = $2 WHERE url = $3', 
          ['failed', 'HTTP 404 - Page not found', url]);
        // Learn exclusion pattern from 404
        const host = new URL(url).hostname.replace('www.', '');
        await learnUrlPatternFromPage(url, host, false);
        return { saved: false, skipped: true, updated: false };
      }
      
      // Check if requires login
      if (requiresLogin(url, result.html)) {
        console.log(`   🔐 Login required - attempting authentication...`);
        
        // Try to login if institution has login config
        const institution = findInstitutionConfigByUrl(url);
        let loginSuccess = false;
        
        if (institution?.loginConfig?.enabled) {
          try {
            const { loginToSite, fetchHtmlWithAuth } = await import('./src/utils/login');
            
            // Build login config with credentials from env vars
            const loginConfig = {
              ...institution.loginConfig,
              url: institution.loginConfig.loginUrl || institution.loginConfig.url || '',
              email: institution.loginConfig.email || process.env[`${institution.id?.toUpperCase()}_EMAIL`] || '',
              password: institution.loginConfig.password || process.env[`${institution.id?.toUpperCase()}_PASSWORD`] || '',
            };
            
            if (loginConfig.url && loginConfig.email && loginConfig.password) {
              const loginResult = await loginToSite(loginConfig);
              
              if (loginResult.success && loginResult.cookies) {
                console.log(`   ✅ Login successful - fetching with authentication...`);
                
                // Fetch page with auth
                const authResult = await fetchHtmlWithAuth(url, loginConfig);
                result.html = authResult.html;
                result.status = authResult.status;
                loginSuccess = true;
              } else {
                console.log(`   ❌ Login failed: ${loginResult.error || 'Unknown error'}`);
              }
            } else {
              console.log(`   ⚠️  No login credentials configured (check env vars or institution config)`);
            }
          } catch (error: any) {
            console.log(`   ⚠️  Login error: ${error.message}`);
          }
        }
        
        // If login failed or no config, mark as failed
        if (!loginSuccess) {
          console.log(`   ⏭️  Marking as failed (no login or login failed)\n`);
          await pool.query('UPDATE scraping_jobs SET status = $1, last_error = $2 WHERE url = $3', 
            ['failed', 'Requires login', url]);
          // Learn exclusion pattern from login requirement
          const host = new URL(url).hostname.replace('www.', '');
          await learnUrlPatternFromPage(url, host, false);
          return { saved: false, skipped: true, updated: false };
        }
        
        // Continue with authenticated HTML
        console.log(`   ✅ Using authenticated content...`);
      }
      
      const $ = cheerio.load(result.html);
      const title = $('title').text() || '';
      const description = $('meta[name="description"]').attr('content') || '';
      
      // LLM-FIRST: Use LLM directly (skip unreliable pattern extraction)
      console.log(`   🤖 Extracting with LLM...`);
      const { extractWithLLM } = await import('./src/core/llm-extract');
      const { computeUrlHash, getCachedExtraction, storeCachedExtraction } = await import('./src/core/llmCache');
      
      // Check cache first
      const urlHash = computeUrlHash(url);
      const modelVersion = process.env.SCRAPER_MODEL_VERSION || 'gpt-4o-mini-v1';
      let llmResult = getCachedExtraction(urlHash, modelVersion);
      
      if (!llmResult) {
        llmResult = await extractWithLLM({
          html: result.html,
          url,
          title,
          description
        });
        storeCachedExtraction(urlHash, llmResult, modelVersion, url);
        console.log(`   ✅ LLM extraction complete`);
      } else {
        console.log(`   💾 Using cached LLM extraction`);
      }
      
      // Extract funding type from URL/institution
      const institution = findInstitutionByUrl(url);
      const institutionFundingTypes = institution?.fundingTypes || [];
      
      // Prioritize LLM-extracted funding types, fallback to institution config, then infer from URL
      let fundingTypes: string[] = [];
      if (llmResult.metadata?.funding_types && llmResult.metadata.funding_types.length > 0) {
        // Normalize LLM-extracted types (remove duplicates, map to canonical)
        fundingTypes = normalizeFundingTypes(llmResult.metadata.funding_types);
      }
      
      // If normalized types are empty, try inference
      if (fundingTypes.length === 0) {
        fundingTypes = inferFundingType(url, institutionFundingTypes, result.html);
      }
      
      // If still empty, use institution default (normalized)
      if (fundingTypes.length === 0 && institutionFundingTypes.length > 0) {
        fundingTypes = normalizeFundingTypes(institutionFundingTypes);
      }
      
      // If still empty after all attempts, leave empty (don't use "unknown")
      // Empty array is better than "unknown" - can be inferred later
      
      // Detect page type
      const isOverview = isOverviewPage(url, result.html);
      const needsLogin = requiresLogin(url, result.html);
      
      // Extract geographic info for metadata (quick reference)
      // If geographic requirements exist, extract country/region from them
      let regionForMetadata = llmResult.metadata?.region || institution?.region || null;
      if (!regionForMetadata && llmResult.categorized_requirements?.geographic) {
        // Try to extract region from geographic requirements
        const geoReqs = llmResult.categorized_requirements.geographic;
        if (geoReqs.length > 0) {
          const geoValue = geoReqs[0].value || '';
          // Extract country names from geographic description
          const countryMatch = geoValue.match(/\b(Austria|Germany|EU|Switzerland|France|Italy|Spain|Netherlands|Belgium|Poland|Czech|Slovakia|Hungary|Romania|Bulgaria|Croatia|Slovenia)\b/i);
          if (countryMatch) {
            regionForMetadata = countryMatch[1];
          }
        }
      }
      
      // Normalize and save
      const normalized = normalizeMetadata({
        url,
        title: llmResult.metadata?.title || title,
        description: llmResult.metadata?.description || description,
        funding_amount_min: llmResult.metadata?.funding_amount_min,
        funding_amount_max: llmResult.metadata?.funding_amount_max,
        currency: llmResult.metadata?.currency || 'EUR',
        deadline: llmResult.metadata?.deadline,
        open_deadline: llmResult.metadata?.open_deadline || false,
        contact_email: llmResult.metadata?.contact_email,
        contact_phone: llmResult.metadata?.contact_phone,
        funding_types: fundingTypes, // Use extracted/inferred funding types
        program_focus: llmResult.metadata?.program_focus || [],
        region: regionForMetadata, // Save geographic info in metadata (quick reference)
        categorized_requirements: llmResult.categorized_requirements || {},
        metadata_json: {
          ...llmResult.metadata,
          funding_types: fundingTypes,
          institution: institution?.name || null,
          extraction_method: 'llm',
          model_version: modelVersion,
          is_overview_page: isOverview,
          requires_login: needsLogin,
          region: regionForMetadata // Also in metadata_json for consistency
        },
        fetched_at: new Date().toISOString()
      });
      
      const pageId = await savePageToDatabase(normalized);
      
      // Track if this was an update
      const wasUpdate = exists && CONFIG.FORCE_UPDATE;
      
      // PATTERN LEARNING: Learn from successful extraction
      try {
        const host = new URL(url).hostname.replace('www.', '');
      const reqCount = Object.values(normalized.categorized_requirements || {}).reduce(
        (sum: number, arr: any[]) => sum + (Array.isArray(arr) ? arr.length : 0), 0
      );
      const isGoodPage = reqCount >= 5; // Good if 5+ requirements extracted
      
      // Learn pattern: include if good, exclude if bad
      await learnUrlPatternFromPage(url, host, isGoodPage);
      
      // If page has no requirements, it might be a false positive - learn exclusion
      if (reqCount === 0) {
        await learnUrlPatternFromPage(url, host, false);
      }
      } catch {
        // Silently fail - learning is optional
      }
      
      // Mark job as done
      await markJobDone(url);
      
      const amount = normalized.funding_amount_min || normalized.funding_amount_max 
        ? `${normalized.funding_amount_min || 'N/A'}-${normalized.funding_amount_max || 'N/A'} EUR`
        : 'N/A';
      
      const reqCount = Object.values(normalized.categorized_requirements || {}).reduce(
        (sum: number, arr: any[]) => sum + (Array.isArray(arr) ? arr.length : 0), 0
      );
      
      // FEEDBACK LOOP: Record classification accuracy
      try {
        // Get the predicted classification from scraping_jobs
        const pool = getPool();
        const jobResult = await pool.query(
          'SELECT quality_score FROM scraping_jobs WHERE url = $1',
          [url]
        );
        const predictedQuality = jobResult.rows[0]?.quality_score || 50;
        const predictedIsProgram: 'yes' | 'no' | 'maybe' = predictedQuality >= 50 ? 'yes' : 'maybe';
        
        await recordClassificationFeedback(
          url,
          predictedIsProgram,
          predictedQuality,
          reqCount
        );
      } catch {
        // Silently fail - feedback is optional
      }
      
      console.log(`   ✅ Saved (ID: ${pageId}): ${amount}, ${reqCount} requirements\n`);
      return { saved: true, skipped: false, updated: wasUpdate };
      
    } catch (error: any) {
      if (error?.code === 'insufficient_quota' || error?.status === 429) {
        console.error(`   ❌ OpenAI quota exhausted. Add payment: https://platform.openai.com/account/billing\n`);
      } else {
        console.error(`   ❌ Failed: ${error.message}\n`);
      }
      
      // Mark as failed
      try {
        const pool = getPool();
        await pool.query('UPDATE scraping_jobs SET status = $1, last_error = $2 WHERE url = $3', 
          ['failed', error.message.substring(0, 200), url]);
      } catch {
        // Silently fail
      }
      return { saved: false, skipped: false, updated: false };
    }
  };
  
  // Process URLs in parallel batches
  for (let i = 0; i < urls.length; i += CONCURRENCY) {
    const batch = urls.slice(i, i + CONCURRENCY);
    const results = await Promise.all(
      batch.map((url, idx) => processUrl(url, i + idx))
    );
    
    for (const result of results) {
      if (result.saved) saved++;
      if (result.skipped) skipped++;
      if (result.updated) updated++;
    }
  }
  
  // AUTO-LEARNING: Check if we should learn quality patterns
  try {
    const { shouldLearnQualityPatterns } = await import('./src/learning/auto-learning');
    const shouldLearn = await shouldLearnQualityPatterns();
    if (shouldLearn) {
      console.log('\n🧠 Auto-learning quality patterns...');
      await autoLearnQualityPatterns();
    }
  } catch (error: any) {
    // Silently fail
    console.warn(`⚠️  Auto-learning check failed: ${error.message}`);
  }
  
  // Show learning status
  try {
    const status = await getLearningStatus();
    if (status.totalFeedback > 0) {
      console.log(`\n📊 Learning Status:`);
      console.log(`   Classification Accuracy: ${status.classificationAccuracy.toFixed(1)}%`);
      console.log(`   Quality Rules Learned: ${status.qualityRulesLearned}`);
      console.log(`   URL Patterns Learned: ${status.urlPatternsLearned}`);
    }
  } catch {
    // Silently fail
  }
  
  // AUTO RE-SCRAPING: Check for re-scrape tasks (overview pages, low-confidence blacklisted URLs)
  try {
    const { getReScrapeTasks } = await import('./src/rescraping/unified-rescraping');
    const reScrapeTasks = await getReScrapeTasks(7, 30, 5); // 7 days for overview, 30 for blacklist, max 5 tasks
    
    if (reScrapeTasks.length > 0) {
      console.log(`\n🔄 Found ${reScrapeTasks.length} re-scrape tasks (overview pages, low-confidence blacklisted URLs)`);
      console.log(`   Processing ${Math.min(reScrapeTasks.length, 3)} tasks...`);
      
      // Process a few re-scrape tasks (don't overwhelm the system)
      // Use the same processUrl function but with force update
      const originalForceUpdate = CONFIG.FORCE_UPDATE;
      CONFIG.FORCE_UPDATE = true; // Enable force update for re-scraping
      
      for (const task of reScrapeTasks.slice(0, 3)) {
        try {
          console.log(`   🔄 Re-scraping: ${task.url.substring(0, 60)}... (${task.type}, priority: ${task.priority})`);
          
          // Check if URL exists and needs re-scraping
          const exists = await isUrlInDatabase(task.url);
          if (!exists) {
            // New URL - queue it normally
            await markUrlQueued(task.url, 50);
            console.log(`   ✅ Queued for scraping\n`);
            continue;
          }
          
          // Re-scrape existing URL
          const result = await processUrl(task.url, 0);
          
          if (result.saved || result.updated) {
            const { markReScrapeCompleted } = await import('./src/rescraping/unified-rescraping');
            await markReScrapeCompleted(task.url, task.type, true);
            console.log(`   ✅ Re-scrape completed\n`);
          } else {
            console.log(`   ⏭️  Re-scrape skipped\n`);
          }
        } catch (error: any) {
          console.warn(`   ⚠️  Re-scrape failed: ${error.message}\n`);
        }
      }
      
      CONFIG.FORCE_UPDATE = originalForceUpdate; // Restore original setting
    }
  } catch (error: any) {
    // Silently fail - re-scraping is optional
    console.warn(`⚠️  Re-scraping check failed: ${error.message}`);
  }
  
  // AUTO BLACKLIST RE-CHECK: Periodically re-check low-confidence exclusions
  try {
    const pool = getPool();
    const lastRecheck = await pool.query(`
      SELECT MAX(updated_at) as last_check
      FROM url_patterns
      WHERE pattern_type = 'exclude' AND confidence < 0.8
    `);
    
    const lastCheck = lastRecheck.rows[0]?.last_check;
    const daysSinceLastCheck = lastCheck 
      ? (Date.now() - new Date(lastCheck).getTime()) / (1000 * 60 * 60 * 24)
      : 999;
    
    // Re-check blacklist every 7 days
    if (daysSinceLastCheck >= 7) {
      console.log(`\n🔍 Re-checking blacklisted URLs (last check: ${lastCheck ? new Date(lastCheck).toLocaleDateString() : 'never'})...`);
      const { runRecheckCycle } = await import('./src/utils/blacklist-recheck');
      await runRecheckCycle();
      console.log(`   ✅ Blacklist re-check complete\n`);
    }
  } catch (error: any) {
    // Silently fail - blacklist re-check is optional
    console.warn(`⚠️  Blacklist re-check failed: ${error.message}`);
  }
  
  if (CONFIG.FORCE_UPDATE && updated > 0) {
    console.log(`✅ Scraping complete: ${saved} saved (${updated} updated), ${skipped} skipped\n`);
  } else {
    console.log(`✅ Scraping complete: ${saved} saved, ${skipped} skipped\n`);
  }
  return saved;
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const command = args.find(a => ['discover', 'scrape', 'full'].includes(a)) || 'full';
  
  // Parse max limits
  const maxArg = args.find(a => a.startsWith('--max='));
  if (maxArg) {
    const max = parseInt(maxArg.split('=')[1], 10);
    if (command === 'discover' || command === 'full') CONFIG.MAX_DISCOVERY = max;
    if (command === 'scrape' || command === 'full') CONFIG.MAX_SCRAPE = max;
  }
  
  // Refresh config at runtime to get latest env vars
  Object.assign(CONFIG, getConfig());
  
  // Debug: Check what's actually in process.env
  const debugOpenAI = process.env.OPENAI_API_KEY ? `✅ (${process.env.OPENAI_API_KEY.substring(0, 10)}...)` : '❌';
  const debugCustom = process.env.CUSTOM_LLM_ENDPOINT ? `✅ (${process.env.CUSTOM_LLM_ENDPOINT})` : '❌';
  const debugDisable = process.env.DISABLE_LLM ? `⚠️  Set to: ${process.env.DISABLE_LLM}` : '✅ Not set';
  
  console.log('🚀 Unified Scraper - LLM-First\n');
  console.log(`Configuration:`);
  console.log(`  - OPENAI_API_KEY: ${debugOpenAI}`);
  console.log(`  - CUSTOM_LLM_ENDPOINT: ${debugCustom}`);
  console.log(`  - DISABLE_LLM: ${debugDisable}`);
  
  // Re-check config after all env vars are confirmed loaded
  const finalConfig = getConfig();
  const llmType = process.env.CUSTOM_LLM_ENDPOINT ? 'Custom LLM' : process.env.OPENAI_API_KEY ? 'OpenAI' : 'None';
  console.log(`  - LLM: ${finalConfig.USE_LLM ? `✅ Enabled (${llmType})` : '❌ Disabled'}`);
  
  // Update CONFIG with final values
  Object.assign(CONFIG, finalConfig);
  console.log(`  - Database: ${CONFIG.DATABASE_URL ? '✅ Connected' : '❌ Not set'}`);
  console.log(`  - Max Discovery: ${CONFIG.MAX_DISCOVERY}`);
  console.log(`  - Max Scrape: ${CONFIG.MAX_SCRAPE}`);
  console.log(`  - Force Update: ${CONFIG.FORCE_UPDATE ? '✅ Enabled (will re-scrape existing pages)' : '❌ Disabled (skips existing pages)'}`);
  console.log(`  - Smart Discovery: Finds NEW URLs with different funding types\n`);
  
  // Test database
  if (CONFIG.DATABASE_URL) {
    const connected = await testConnection();
    if (!connected) {
      console.error('❌ Database connection failed\n');
      process.exit(1);
    }
    console.log('✅ Database connection OK\n');
  }
  
  try {
    if (command === 'discover' || command === 'full') {
      await discoverPrograms();
    }
    
    if (command === 'scrape' || command === 'full') {
      await scrapePrograms();
    }
    
    console.log('✅ Complete!\n');
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { discoverPrograms, scrapePrograms };


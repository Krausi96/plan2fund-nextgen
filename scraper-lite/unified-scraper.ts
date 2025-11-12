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
import { runIntegratedAutoCycle } from './src/learning/integrated-auto-cycle';
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
    // REMOVED LIMIT - discover from ALL seeds to reach 2500 programs
    MAX_DISCOVERY: parseInt(process.env.LITE_MAX_DISCOVERY_PAGES || '9999', 10),
    DISCOVER_FUNDING_TYPES: ['grant', 'loan', 'equity', 'guarantee'], // Look for different types
    
    // Scraping Settings - Dynamic batch size based on queue size
    // REMOVED LIMIT - process ALL queued URLs to reach 2500 programs
    MAX_SCRAPE: parseInt(process.env.LITE_MAX_URLS || '99999', 10),
    
    // Update Settings
    FORCE_UPDATE: forceUpdate, // Re-scrape existing pages when true
    
    // Database
    DATABASE_URL: process.env.DATABASE_URL,
  };
}

const CONFIG = getConfig();

// ============================================================================
// HARDCODED FILTERS & HEURISTICS
// ============================================================================

import { HARD_SKIP_URL_PATTERNS, SUSPICIOUS_CONTENT_KEYWORDS, EXCLUSION_KEYWORDS } from './src/utils/blacklist';

// All exclusion patterns and keywords are now imported from blacklist.ts (single source of truth)

function shouldSkipUrl(url: string): boolean {
  if (!url) return true;
  const lower = url.toLowerCase();

  // Skip anchors and javascript links
  if (lower.startsWith('javascript:') || lower === '#' || lower.endsWith('#')) {
    return true;
  }

  // Skip obvious fragments or tracking parameters that indicate navigation only
  if (lower.includes('#') && !lower.includes('programme') && !lower.includes('program')) {
    return true;
  }

  // Skip known bad patterns
  if (HARD_SKIP_URL_PATTERNS.some(pattern => pattern.test(lower))) {
    return true;
  }

  // Skip suspicious keywords unless clearly a program
  if (EXCLUSION_KEYWORDS.some(keyword => lower.includes(keyword))) {
    if (!/(programm|program|foerder|förder|funding|grant|loan|appel|appel-a-projet|accelerateur|accelerator|scheme|subsidy)/i.test(lower)) {
      return true;
    }
  }

  // Skip obvious file downloads
  if (lower.match(/\.(pdf|docx?|xlsx?|pptx?|zip|rar|ics)(?:\?|$)/)) {
    return true;
  }

  return false;
}

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
  
  // Get seeds - includes hardcoded + discovered seeds from DB (self-expanding!)
  const seeds = await getAllSeedUrls();
  console.log(`🌱 Checking ${seeds.length} seed URLs (includes discovered seeds from DB)...\n`);
  
  // DISCOVERY CACHING: Skip seeds checked in last 24 hours (unless overview page or force update)
  const recentlyChecked = await pool.query(`
    SELECT url, last_checked, source_type
    FROM discovered_seed_urls
    WHERE url = ANY($1::text[])
      AND last_checked > NOW() - INTERVAL '24 hours'
      AND is_active = true
  `, [seeds]);
  const recentlyCheckedSet = new Set(recentlyChecked.rows.map((r: any) => r.url));
  
  // Always re-check overview pages (they discover new programs)
  const overviewPages = await pool.query(`
    SELECT url FROM pages
    WHERE url = ANY($1::text[])
      AND metadata_json->>'is_overview_page' = 'true'
  `, [seeds]);
  const overviewSet = new Set(overviewPages.rows.map((r: any) => r.url));
  
  // Optimized: Batch check ALL seeds against database and queue
  const seedCheck = await pool.query(
    `SELECT url FROM pages WHERE url = ANY($1::text[])
     UNION
     SELECT url FROM scraping_jobs WHERE url = ANY($1::text[]) AND status IN ('queued', 'completed')`,
    [seeds]
  );
  const existingSeeds = new Set(seedCheck.rows.map((r: any) => r.url));
  
  // Filter out recently checked seeds (unless overview page or force update)
  const seedsToCheck = seeds.filter(seed => {
    if (CONFIG.FORCE_UPDATE) return true; // Force update: check all
    if (overviewSet.has(seed)) return true; // Always check overview pages
    if (recentlyCheckedSet.has(seed)) {
      console.log(`   ⏭️  Skipping recently checked seed (cached): ${seed.substring(0, 60)}...`);
      return false; // Skip recently checked
    }
    return true;
  });
  
  console.log(`📋 After caching: ${seedsToCheck.length}/${seeds.length} seeds to check (${seeds.length - seedsToCheck.length} cached)\n`);
  
  // RE-CHECK OVERVIEW PAGES: Get overview pages that need re-checking (older than 7 days)
  // Note: This is now handled by the caching logic above, but keep for backward compatibility
  const overviewPagesToRecheck = await pool.query(`
    SELECT url, fetched_at 
    FROM pages 
    WHERE url = ANY($1::text[])
      AND metadata_json->>'is_overview_page' = 'true'
      AND (fetched_at IS NULL OR fetched_at < NOW() - INTERVAL '7 days')
  `, [seedsToCheck]);
  
  const overviewUrlsToRecheck = new Set(overviewPagesToRecheck.rows.map((r: any) => r.url));
  
  // SMART SEED PROCESSING: Skip seeds already in DB (unless overview page)
  // Use LLM to quickly check if seed is overview page before fetching
  // Note: seedsToCheck is already filtered above with caching, so this is for backward compatibility
  const seedsToProcessFiltered = seedsToCheck.filter(s => !existingSeeds.has(s) || overviewUrlsToRecheck.has(s));
  const seedsToProcess: string[] = seedsToProcessFiltered;
  
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
    if (shouldSkipUrl(seed)) {
      console.log(`   ⏭️  Skipping known non-program seed: ${seed.substring(0, 80)}...\n`);
      continue;
    }
    
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
      
      // IMPROVED: Handle HTTP errors immediately - auto-blacklist 403/404
      if (result.status === 403 || result.status === 404) {
        console.log(`   ⏭️  HTTP ${result.status} - Auto-blacklisting URL\n`);
        const host = new URL(seed).hostname.replace('www.', '');
        const { addManualExclusion } = await import('./src/utils/blacklist');
        await addManualExclusion(seed, host, `HTTP ${result.status} - Auto-blacklisted during discovery`);
        // Also mark in discovered_seed_urls as inactive
        try {
          await pool.query(`
            UPDATE discovered_seed_urls 
            SET is_active = false, last_error = $1
            WHERE url = $2
          `, [`HTTP ${result.status}`, seed]);
        } catch {
          // Silently fail
        }
        continue;
      }
      const $ = cheerio.load(result.html);
      
      // Check if this is an overview page
      const isOverview = isOverviewPage(seed, result.html);
      
      // SAVE AS DISCOVERED SEED: If this is an overview/listing page, save it as a new seed URL
      if (isOverview) {
        console.log(`   📋 Overview page detected - saving as discovered seed URL...`);
        
        // Save as discovered seed URL (self-expanding discovery!)
        try {
          const institution = findInstitutionByUrl(seed);
          await pool.query(`
            INSERT INTO discovered_seed_urls (url, source_type, institution_id, priority, is_active)
            VALUES ($1, $2, $3, $4, true)
            ON CONFLICT (url) DO UPDATE SET
              last_checked = NOW(),
              is_active = true,
              priority = GREATEST(discovered_seed_urls.priority, EXCLUDED.priority)
          `, [
            seed,
            'overview_page',
            institution?.id || null,
            70 // High priority for overview pages
          ]);
          console.log(`   ✅ Saved as discovered seed URL (will be checked in future cycles)`);
        } catch (error: any) {
          // Silently fail
        }
        
        console.log(`   📋 Extracting all program links...`);
        
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
              // Optimized: Check both pages and queue
              const filterUrlCheck = await pool.query(
                `SELECT url FROM pages WHERE url = ANY($1::text[])
                 UNION
                 SELECT url FROM scraping_jobs WHERE url = ANY($1::text[]) AND status = 'queued'`,
                [filterUrls]
              );
              const existingFilterUrls = new Set(filterUrlCheck.rows.map((r: any) => r.url));
              
              for (const classification of filterClassifications) {
                if (classification.isProgramPage !== 'no' && classification.qualityScore >= 30) { // Lowered from 50 to 30
                  if (!seen.has(classification.url) && !existingFilterUrls.has(classification.url) && !shouldSkipUrl(classification.url)) {
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
              // Optimized: Check both pages and queue
              const filterUrlCheck = await pool.query(
                `SELECT url FROM pages WHERE url = ANY($1::text[])
                 UNION
                 SELECT url FROM scraping_jobs WHERE url = ANY($1::text[]) AND status = 'queued'`,
                [filterUrls]
              );
              const existingFilterUrls = new Set(filterUrlCheck.rows.map((r: any) => r.url));
              
              let filterQueued = 0;
              for (const filterUrl of filterUrls.slice(0, 50)) { // Increased from 5 to 50
                if (!seen.has(filterUrl) && !existingFilterUrls.has(filterUrl) && !shouldSkipUrl(filterUrl)) {
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
          
          // Filter out social media share links and mailto
          if (urlLower.includes('facebook.com') || urlLower.includes('linkedin.com') ||
              urlLower.includes('twitter.com') || urlLower.includes('x.com') ||
              urlLower.includes('mailto:') || urlLower.includes('sharer') ||
              urlLower.includes('sharearticle')) return;
          
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
          
          if (shouldSkipUrl(fullUrl)) return;
          
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
      
      // IMPROVED: Institution-aware discovery limits - prevent single institution dominance
      // Group links by institution and limit per institution
      const linksByInstitution: Record<string, string[]> = {};
      filteredLinks.forEach(link => {
        let institution = 'Other';
        if (link.includes('wko.at')) institution = 'WKO';
        else if (link.includes('aws.at')) institution = 'AWS';
        else if (link.includes('ffg.at')) institution = 'FFG';
        else if (link.includes('bmk.gv.at')) institution = 'BMK';
        else if (link.includes('erstebank.at')) institution = 'Erste Bank';
        else if (link.includes('sparkasse.at')) institution = 'Sparkasse';
        
        if (!linksByInstitution[institution]) {
          linksByInstitution[institution] = [];
        }
        linksByInstitution[institution].push(link);
      });
      
      // REMOVED LIMIT - discover ALL links to reach 2500 programs
      const MAX_PER_INSTITUTION = 9999;
      const balancedLinks: string[] = [];
      for (const [institution, instLinks] of Object.entries(linksByInstitution)) {
        const limited = instLinks.slice(0, MAX_PER_INSTITUTION);
        balancedLinks.push(...limited);
        if (instLinks.length > MAX_PER_INSTITUTION) {
          console.log(`   ⚖️  Limited ${institution} links: ${instLinks.length} → ${MAX_PER_INSTITUTION} (preventing dominance)`);
        }
      }
      
      // Use balanced links for classification
      const linksToClassify = balancedLinks.length > 0 ? balancedLinks : filteredLinks;
      
      // Optimized: Check both pages and queue in one query (use balanced links)
      const linkCheck = await pool.query(
        `SELECT url FROM pages WHERE url = ANY($1::text[])
         UNION
         SELECT url FROM scraping_jobs WHERE url = ANY($1::text[]) AND status = 'queued'`,
        [linksToClassify]
      );
      const existingLinks = new Set(linkCheck.rows.map((r: any) => r.url));
      const newLinks = links.filter(l => linksToClassify.includes(l.url) && !existingLinks.has(l.url) && !seen.has(l.url));
      
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
        
        // Queue ALL program pages (lower threshold to 30 to get more variety)
        for (const classification of classifications) {
          if (classification.isProgramPage === 'no') continue;
          if (classification.qualityScore < 30) continue; // Lowered from 50 to 30 for more programs
          
          discovered.push(classification.url);
          seen.add(classification.url);
          await markUrlQueued(classification.url, classification.qualityScore);
        }
        
        const queued = classifications.filter(c => 
          c.isProgramPage !== 'no' && c.qualityScore >= 30
        ).length;
        console.log(`   ✅ Classified: ${queued} high-quality program pages queued\n`);
      } else {
        // Fallback: queue all new links if LLM not available
        // Process ALL new links (no limit) for aggressive discovery
        for (const link of newLinks) {
          if (discovered.length >= CONFIG.MAX_DISCOVERY * 10) break; // Safety limit only
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
          
          // Also update discovered seed URL last_checked
          await pool.query(`
            UPDATE discovered_seed_urls 
            SET last_checked = NOW()
            WHERE url = $1
          `, [seed]);
        } catch {
          // Silently fail
        }
      }
      
      // SAVE HIGH-QUALITY LISTING PAGES AS SEEDS: If we found many new links, this might be a listing page
      // Count links discovered from this seed
      const linksFromThisSeed = discovered.filter(d => {
        try {
          const discoveredUrl = new URL(d);
          const seedUrl = new URL(seed);
          return discoveredUrl.hostname === seedUrl.hostname;
        } catch {
          return false;
        }
      });
      
      // If we discovered 5+ links from this page, save it as a seed
      if (linksFromThisSeed.length >= 5 && !isOverview) {
        try {
          const institution = findInstitutionByUrl(seed);
          await pool.query(`
            INSERT INTO discovered_seed_urls (url, source_type, institution_id, priority, is_active)
            VALUES ($1, $2, $3, $4, true)
            ON CONFLICT (url) DO UPDATE SET
              last_checked = NOW(),
              is_active = true,
              priority = GREATEST(discovered_seed_urls.priority, EXCLUDED.priority)
          `, [
            seed,
            'listing_page',
            institution?.id || null,
            60 // Medium-high priority for listing pages
          ]);
          console.log(`   ✅ Saved as discovered seed URL (found ${linksFromThisSeed.length} links)`);
        } catch (error: any) {
          // Silently fail
        }
      }
      
    } catch (error: any) {
      console.warn(`   ⚠️  Failed: ${error.message}\n`);
    }
  }
  
  // DISCOVER FROM SCRAPED PAGES: Extract links from already-scraped pages
  console.log(`\n🔍 Phase 3: Discovering new URLs from scraped pages...\n`);
  try {
    const scrapedPages = await pool.query(`
      SELECT url, raw_html_path 
      FROM pages 
      WHERE raw_html_path IS NOT NULL 
        AND raw_html_path != ''
        AND metadata_json->>'is_overview_page' != 'true'
        AND fetched_at > NOW() - INTERVAL '30 days'
      ORDER BY fetched_at DESC
      LIMIT 500
    `);
    
    if (scrapedPages.rows.length > 0) {
      console.log(`   📄 Checking ${scrapedPages.rows.length} recently scraped pages for new links...`);
      let newFromScraped = 0;
      
      for (const page of scrapedPages.rows.slice(0, 1000)) { // Increased to 1000 for aggressive discovery
        try {
          // Read HTML from file
          let html = '';
          if (page.raw_html_path) {
            try {
              const fs = await import('fs');
              const path = await import('path');
              const htmlPath = path.resolve(process.cwd(), page.raw_html_path);
              if (fs.existsSync(htmlPath)) {
                html = fs.readFileSync(htmlPath, 'utf-8');
              } else {
                continue; // Skip if file doesn't exist
              }
            } catch {
              continue; // Skip if can't read file
            }
          } else {
            continue; // Skip if no HTML path
          }
          
          const $ = cheerio.load(html);
          const pageUrl = page.url;
          const pageHost = new URL(pageUrl).hostname.replace('www.', '');
          
          const links: string[] = [];
          $('a[href]').each((_, el) => {
            const href = $(el).attr('href');
            if (!href) return;
            
            try {
              const fullUrl = new URL(href, pageUrl).href;
              const urlLower = fullUrl.toLowerCase();
              
              // Must be from same host
              if (!fullUrl.includes(pageHost)) return;
              
              // Skip already filtered patterns
              if (urlLower.match(/\.(pdf|doc|docx|zip)$/i)) return;
              if (urlLower.includes('/news/') || urlLower.includes('/press/') || 
                  urlLower.includes('/contact/') || urlLower.includes('/about/') ||
                  urlLower.includes('/team/') || urlLower.includes('/imprint/')) return;
              if (urlLower.includes('facebook.com') || urlLower.includes('linkedin.com') ||
                  urlLower.includes('twitter.com') || urlLower.includes('x.com') ||
                  urlLower.includes('mailto:') || urlLower.includes('sharer') ||
                  urlLower.includes('sharearticle')) return;
              if (urlLower.includes('cdn-cgi/l/email-protection') || 
                  urlLower.includes('email-protection#') ||
                  urlLower.includes('cdn-cgi/l/email')) return;
              if (urlLower.includes('/sitemap/') || urlLower.includes('/accessibility/') ||
                  urlLower.includes('/data-protection/') || urlLower.includes('/disclaimer/')) return;
              if (shouldSkipUrl(fullUrl)) return;
              
              links.push(fullUrl);
            } catch {
              // Invalid URL
            }
          });
          
          if (links.length === 0) continue;
          
          // Optimized: Check both pages and queue in one query
          const linkCheck = await pool.query(
            `SELECT url FROM pages WHERE url = ANY($1::text[])
             UNION
             SELECT url FROM scraping_jobs WHERE url = ANY($1::text[]) AND status = 'queued'`,
            [links]
          );
          const existingLinks = new Set(linkCheck.rows.map((r: any) => r.url));
          const newLinks = links.filter(l => !existingLinks.has(l) && !seen.has(l));
          
          if (newLinks.length === 0) continue;
          
          // Check blacklist
          const validLinks: string[] = [];
          for (const link of newLinks) {
            if (!(await isUrlExcluded(link))) {
              validLinks.push(link);
            }
          }
          
          if (validLinks.length === 0) continue;
          
          // Classify with LLM
          if (CONFIG.USE_LLM && validLinks.length > 0) {
            const improvedPrompt = await getImprovedClassificationPrompt();
            const classifications = await batchClassifyUrls(
              validLinks.map(l => ({ url: l })),
              improvedPrompt
            );
            
            for (const classification of classifications) {
              if (classification.isProgramPage !== 'no' && classification.qualityScore >= 50) {
                if (!seen.has(classification.url)) {
                  discovered.push(classification.url);
                  seen.add(classification.url);
                  await markUrlQueued(classification.url, classification.qualityScore);
                  newFromScraped++;
                  
                  // If this is an overview/listing page, save as discovered seed
                  if (classification.isOverviewPage && classification.qualityScore >= 60) {
                    try {
                      const institution = findInstitutionByUrl(classification.url);
                      await pool.query(`
                        INSERT INTO discovered_seed_urls (url, source_type, institution_id, priority, is_active)
                        VALUES ($1, $2, $3, $4, true)
                        ON CONFLICT (url) DO UPDATE SET
                          is_active = true,
                          priority = GREATEST(discovered_seed_urls.priority, EXCLUDED.priority)
                      `, [
                        classification.url,
                        'overview_page',
                        institution?.id || null,
                        classification.qualityScore
                      ]);
                    } catch {
                      // Silently fail
                    }
                  }
                }
              }
            }
          } else {
            // Queue without LLM
            for (const link of validLinks.slice(0, 100)) { // Increased from 5 to 100
              if (!seen.has(link)) {
                discovered.push(link);
                seen.add(link);
                await markUrlQueued(link, 50);
                newFromScraped++;
              }
            }
          }
        } catch (error: any) {
          // Silently continue
        }
      }
      
      if (newFromScraped > 0) {
        console.log(`   ✅ Discovered ${newFromScraped} new URLs from scraped pages\n`);
      } else {
        console.log(`   ✅ No new URLs found in scraped pages\n`);
      }
    }
  } catch (error: any) {
    console.warn(`   ⚠️  Discovery from scraped pages failed: ${error.message}\n`);
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
  
  // IMPROVED: Dynamic batch size based on queue size
  const pool = getPool();
  const queueCheck = await pool.query('SELECT COUNT(*) as total FROM scraping_jobs WHERE status = $1', ['queued']);
  const totalQueued = parseInt(queueCheck.rows[0].total, 10);
  
  // Dynamic batch size: Process more URLs when queue is large
  let dynamicBatchSize = CONFIG.MAX_SCRAPE;
  if (totalQueued > 500) {
    dynamicBatchSize = 200; // Large queue: process 200 per cycle
  } else if (totalQueued > 200) {
    dynamicBatchSize = 100; // Medium queue: process 100 per cycle
  } else if (totalQueued > 100) {
    dynamicBatchSize = 75; // Small-medium queue: process 75 per cycle
  }
  // else: use default (50)
  
  const urls = await getQueuedUrls(dynamicBatchSize, CONFIG.FORCE_UPDATE);
  
  // IMPROVED: Progress tracking and queue statistics
  
  // Get institution statistics
  const instStats = await pool.query(`
    SELECT 
      CASE 
        WHEN url LIKE '%aws.at%' THEN 'AWS'
        WHEN url LIKE '%ffg.at%' THEN 'FFG'
        WHEN url LIKE '%wko.at%' THEN 'WKO'
        WHEN url LIKE '%bmk.gv.at%' THEN 'BMK'
        WHEN url LIKE '%erstebank.at%' THEN 'Erste Bank'
        WHEN url LIKE '%sparkasse.at%' THEN 'Sparkasse'
        ELSE 'Other'
      END as institution,
      COUNT(*) as count
    FROM scraping_jobs
    WHERE status = 'queued'
    GROUP BY institution
    ORDER BY count DESC
    LIMIT 10
  `);
  
  console.log(`📊 Queue Status:`);
  console.log(`   Total queued: ${totalQueued} URLs`);
  console.log(`   Batch size: ${dynamicBatchSize} (dynamic based on queue size)`);
  console.log(`   Processing: ${urls.length} URLs (${Math.min(100, Math.round((urls.length / Math.max(1, totalQueued)) * 100))}% of queue)`);
  if (totalQueued > 0 && urls.length > 0) {
    const estimatedTime = Math.ceil((totalQueued / urls.length) * 2); // ~2 seconds per URL
    const cyclesNeeded = Math.ceil(totalQueued / urls.length);
    console.log(`   Estimated time to process all: ~${estimatedTime} minutes (${cyclesNeeded} cycles)`);
  }
  if (instStats.rows.length > 0) {
    console.log(`\n📈 Queue by Institution:`);
    instStats.rows.forEach((row: any) => {
      const percentage = Math.round((row.count / totalQueued) * 100);
      console.log(`   ${row.institution}: ${row.count} URLs (${percentage}%)`);
    });
  }
  console.log('');
  
  if (urls.length === 0) {
    console.log('ℹ️  No queued URLs to scrape\n');
    return 0;
  }
  
  // Parallel processing: Adjust based on LLM provider
  // Groq free tier: 6000 tokens/min → use 3 concurrent
  // Gemini free tier: 10 requests/min → use 2 concurrent
  // Gemini paid tier: 1,000 requests/min → use 40-50 concurrent (optimized)
  // OpenAI/paid tiers: can handle 20+ concurrent
  let defaultConcurrency = 20;
  if (process.env.CUSTOM_LLM_ENDPOINT?.includes('groq.com')) {
    defaultConcurrency = 3;
  } else if (process.env.CUSTOM_LLM_ENDPOINT?.includes('generativelanguage.googleapis.com')) {
    // Gemini paid tier: 1,000 req/min = ~16 req/sec
    // Optimized: Use 50 concurrent for maximum speed (rate limit queue will manage actual rate)
    // With better caching and error handling, we can push higher
    defaultConcurrency = 50; // Gemini paid tier: 1,000 req/min (optimized from 30)
  }
  const CONCURRENCY = parseInt(process.env.SCRAPER_CONCURRENCY || String(defaultConcurrency), 10);
  
  console.log(`📋 Scraping ${urls.length} programs with LLM (${CONCURRENCY} parallel)...\n`);
  
  let saved = 0;
  let skipped = 0;
  let updated = 0;
  const processUrl = async (url: string, index: number): Promise<{ saved: boolean; skipped: boolean; updated: boolean }> => {
    console.log(`[${index + 1}/${urls.length}] ${url.substring(0, 60)}...`);
    
    // FIX #3: Check URL patterns early (contact/info pages) - before any processing
    if (shouldSkipUrl(url)) {
      console.log(`   ⏭️  Skipping non-program URL (contact/info/page pattern)\n`);
      await pool.query('UPDATE scraping_jobs SET status = $1, last_error = $2 WHERE url = $3', 
        ['failed', 'Non-program URL (contact/info/page)', url]);
      const host = new URL(url).hostname.replace('www.', '');
      await learnUrlPatternFromPage(url, host, false);
      return { saved: false, skipped: true, updated: false };
    }
    
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
        // Don't learn pattern here - pattern already exists (that's why it's blacklisted)
        // Learning happens after scraping if page has no requirements
        return { saved: false, skipped: true, updated: false };
      }
      
      // Fetch HTML
      const result = await fetchHtml(url);
      
      // Check for 404 - auto-blacklist immediately (high confidence)
      if (result.status === 404) {
        console.log(`   ⏭️  HTTP 404 - Auto-blacklisting URL\n`);
        await pool.query('UPDATE scraping_jobs SET status = $1, last_error = $2 WHERE url = $3', 
          ['failed', 'HTTP 404 - Page not found', url]);
        // Auto-blacklist 404 URLs with high confidence (0.9)
        const host = new URL(url).hostname.replace('www.', '');
        const { addManualExclusion } = await import('./src/utils/blacklist');
        await addManualExclusion(url, host, 'HTTP 404 - Page not found');
        // Learn pattern with high confidence for 404s (they're definitely invalid)
        await learnUrlPatternFromPage(url, host, false);
        return { saved: false, skipped: true, updated: false };
      }
      
      // Skip known non-program URLs (after redirects)
      const finalUrl = (result as any)?.finalUrl as string | undefined;
      if (finalUrl && shouldSkipUrl(finalUrl)) {
        console.log(`   ⏭️  Skipping redirected non-program URL: ${finalUrl.substring(0, 100)}\n`);
        await pool.query('UPDATE scraping_jobs SET status = $1, last_error = $2 WHERE url = $3', 
          ['failed', 'Non-program URL (pattern)', url]);
        const host = new URL(finalUrl).hostname.replace('www.', '');
        await learnUrlPatternFromPage(url, host, false);
        return { saved: false, skipped: true, updated: false };
      }
      if (shouldSkipUrl(url)) {
        console.log(`   ⏭️  Skipping URL based on pattern\n`);
        await pool.query('UPDATE scraping_jobs SET status = $1, last_error = $2 WHERE url = $3', 
          ['failed', 'Non-program URL (pattern)', url]);
        const host = new URL(url).hostname.replace('www.', '');
        await learnUrlPatternFromPage(url, host, false);
        return { saved: false, skipped: true, updated: false };
      }
      
      // FIX #3: Check if requires login and tag appropriately
      const needsLogin = requiresLogin(url, result.html);
      const institution = findInstitutionConfigByUrl(url);
      let loginSuccess = false;
      let loginPossible = false;
      
      if (needsLogin) {
        console.log(`   🔐 Login required detected - attempting authentication...`);
        
        // Check if page has some public content (login_possible vs login_required)
        const $check = cheerio.load(result.html);
        const hasPublicContent = $check('body').text().length > 500 && 
                                !$check('input[type="password"]').length;
        loginPossible = hasPublicContent;
        
        // Try to login if institution has login config
        if (institution?.loginConfig?.enabled) {
          try {
            const { loginToSite, fetchHtmlWithAuth } = await import('./src/utils/login');
            
            // Build login config with credentials from env vars
            // Try multiple env var formats: INSTITUTION_{ID}_EMAIL or {ID}_EMAIL
            const envPrefix = institution.id?.toUpperCase().replace('INSTITUTION_', '') || '';
            const loginConfig = {
              ...institution.loginConfig,
              url: institution.loginConfig.loginUrl || institution.loginConfig.url || '',
              email: institution.loginConfig.email || 
                     process.env[`INSTITUTION_${envPrefix}_EMAIL`] || 
                     process.env[`${envPrefix}_EMAIL`] || '',
              password: institution.loginConfig.password || 
                        process.env[`INSTITUTION_${envPrefix}_PASSWORD`] || 
                        process.env[`${envPrefix}_PASSWORD`] || '',
            };
            
            if (loginConfig.url && loginConfig.email && loginConfig.password) {
              const loginResult = await loginToSite(loginConfig);
              
              if (loginResult.success && loginResult.cookies) {
                console.log(`   ✅ Login successful - fetching with authentication...`);
                
                // Fetch page with auth
                const authResult = await fetchHtmlWithAuth(url, loginConfig, institution.id);
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
        
        // If login failed or no config, mark as failed but tag in metadata
        if (!loginSuccess) {
          console.log(`   ⏭️  Marking as failed (no login or login failed) - will tag as login_required\n`);
          await pool.query('UPDATE scraping_jobs SET status = $1, last_error = $2 WHERE url = $3', 
            ['failed', 'Requires login', url]);
          // Don't learn exclusion pattern - we want to scrape these separately
          // Just mark as login_required for separate scraping script
          return { saved: false, skipped: true, updated: false };
        }
        
        // Continue with authenticated HTML
        console.log(`   ✅ Using authenticated content...`);
      }
      
      // Lightweight content heuristics to avoid unnecessary LLM calls
      const textContent = result.html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
        .replace(/<!--[\s\S]*?-->/g, ' ')
        .replace(/<\/?[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      const hasNumbers = /\d/.test(textContent);
      const isVeryShort = textContent.length < 300; // More lenient - only skip if < 300 chars
      const suspiciousContent = SUSPICIOUS_CONTENT_KEYWORDS.some(pattern => pattern.test(textContent));
      // Only skip if very short AND no numbers AND suspicious (more lenient filtering)
      const shouldSkipContent = isVeryShort && !hasNumbers && suspiciousContent;
      if (shouldSkipContent) {
        console.log(`   ⏭️  Skipping low-value content (likely non-program)\n`);
        await pool.query('UPDATE scraping_jobs SET status = $1, last_error = $2 WHERE url = $3', 
          ['failed', 'Low value content (informational)', url]);
        const host = new URL(url).hostname.replace('www.', '');
        await learnUrlPatternFromPage(url, host, false);
        return { saved: false, skipped: true, updated: false };
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
      const institutionForFunding = findInstitutionByUrl(url);
      const institutionFundingTypes = institutionForFunding?.fundingTypes || [];
      
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
      // needsLogin already checked above at line 1011
      
      // Extract geographic info for metadata (quick reference)
      // If geographic requirements exist, extract country/region from them
      let regionForMetadata = llmResult.metadata?.region || institutionForFunding?.region || null;
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
      
      // IMPROVED: Calculate quality score and category
      const { assessPageQuality } = await import('./src/utils/quality-scoring');
      const qualityAssessment = assessPageQuality({
        url,
        title: llmResult.metadata?.title || null,
        description: llmResult.metadata?.description || null,
        funding_amount_min: llmResult.metadata?.funding_amount_min || null,
        funding_amount_max: llmResult.metadata?.funding_amount_max || null,
        currency: llmResult.metadata?.currency || null,
        deadline: llmResult.metadata?.deadline || null,
        open_deadline: llmResult.metadata?.open_deadline || false,
        contact_email: llmResult.metadata?.contact_email || null,
        contact_phone: llmResult.metadata?.contact_phone || null,
        funding_types: fundingTypes,
        program_focus: llmResult.metadata?.program_focus || [],
        region: regionForMetadata,
        categorized_requirements: llmResult.categorized_requirements || {},
      });
      
      // Log quality assessment
      if (qualityAssessment.dataQuality === 'poor' || !qualityAssessment.isValid) {
        console.warn(`   ⚠️  Quality: ${qualityAssessment.dataQuality} (${qualityAssessment.qualityScore}/100) - ${qualityAssessment.issues.length} issues`);
      } else if (qualityAssessment.warnings.length > 0) {
        console.log(`   ℹ️  Quality: ${qualityAssessment.dataQuality} (${qualityAssessment.qualityScore}/100) - ${qualityAssessment.warnings.length} warnings`);
      }

      const requirementValues = Object.values(llmResult.categorized_requirements || {}) as unknown[];
      const requirementCount = requirementValues.reduce<number>((sum, value) => {
        if (Array.isArray(value)) {
          return sum + value.length;
        }
        return sum;
      }, 0);
      
      // Check for critical requirement categories
      const hasEligibility = llmResult.categorized_requirements?.eligibility && Array.isArray(llmResult.categorized_requirements.eligibility) && llmResult.categorized_requirements.eligibility.length > 0;
      const hasFinancial = llmResult.categorized_requirements?.financial && Array.isArray(llmResult.categorized_requirements.financial) && llmResult.categorized_requirements.financial.length > 0;
      const hasFundingDetails = llmResult.categorized_requirements?.funding_details && Array.isArray(llmResult.categorized_requirements.funding_details) && llmResult.categorized_requirements.funding_details.length > 0;
      const hasAmount = (llmResult.metadata?.funding_amount_min != null && llmResult.metadata?.funding_amount_min !== undefined) ||
                        (llmResult.metadata?.funding_amount_max != null && llmResult.metadata?.funding_amount_max !== undefined);
      const hasDeadline = llmResult.metadata?.deadline != null || llmResult.metadata?.open_deadline === true;
      const hasDescription = llmResult.metadata?.description && llmResult.metadata.description.length > 50;
      
      // Stricter quality check: Need at least 2 of: requirements (3+), amount, deadline, description
      const qualityIndicators = [
        requirementCount >= 3,
        hasAmount,
        hasDeadline,
        hasDescription,
        hasEligibility || hasFinancial || hasFundingDetails
      ];
      const qualityScore = qualityIndicators.filter(Boolean).length;
      
      // FIX #1: Filter overview pages - only parse if 10+ requirements
      // (deadline/amount not always required, e.g. banks have ongoing applications)
      if (isOverview && requirementCount < 10) {
        console.log(`   ⏭️  Skipping overview page (insufficient requirements: ${requirementCount} reqs, need 10+)\n`);
        await pool.query('UPDATE scraping_jobs SET status = $1, last_error = $2 WHERE url = $3', 
          ['failed', `Overview page with insufficient requirements (${requirementCount} reqs)`, url]);
        const host = new URL(url).hostname.replace('www.', '');
        // Don't learn exclusion pattern - overview pages are valid for discovery
        return { saved: false, skipped: true, updated: false };
      }
      
      // FIX #1: Filter overview pages - only parse if 10+ requirements
      // (deadline/amount not always required, e.g. banks have ongoing applications)
      if (isOverview && requirementCount < 10) {
        console.log(`   ⏭️  Skipping overview page (insufficient requirements: ${requirementCount} < 10)\n`);
        await pool.query('UPDATE scraping_jobs SET status = $1, last_error = $2 WHERE url = $3', 
          ['failed', `Overview page with insufficient requirements (${requirementCount} < 10)`, url]);
        // Don't learn exclusion pattern - overview pages are useful for discovery
        return { saved: false, skipped: true, updated: false };
      }
      
      // Reject if: very few requirements AND missing critical data
      if (requirementCount <= 2 && qualityScore < 2) {
        console.log(`   ⏭️  Skipping low-quality program (insufficient data: ${requirementCount} reqs, ${qualityScore}/5 quality indicators)\n`);
        await pool.query('UPDATE scraping_jobs SET status = $1, last_error = $2 WHERE url = $3', 
          ['failed', `Low-quality extraction (${requirementCount} reqs, missing critical data)`, url]);
        const host = new URL(url).hostname.replace('www.', '');
        await learnUrlPatternFromPage(url, host, false);
        return { saved: false, skipped: true, updated: false };
      }
      
      // Normalize and save (with enhanced metadata)
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
          institution: institutionForFunding?.name || null,
          extraction_method: 'llm',
          model_version: modelVersion,
          is_overview_page: isOverview,
          // FIX #3: Enhanced login tagging
          login_required: needsLogin && !loginSuccess,
          login_possible: loginPossible,
          login_successful: loginSuccess,
          requires_login: needsLogin, // Keep for backward compatibility
          region: regionForMetadata, // Also in metadata_json for consistency
          // Enhanced metadata
          program_category: qualityAssessment.category,
          quality_score: qualityAssessment.qualityScore,
          completeness_score: qualityAssessment.completenessScore,
          data_quality: qualityAssessment.dataQuality,
          has_funding_amount: !!(llmResult.metadata?.funding_amount_min || llmResult.metadata?.funding_amount_max),
          has_deadline: !!(llmResult.metadata?.deadline || llmResult.metadata?.open_deadline),
          is_ongoing: !!(llmResult.metadata?.open_deadline && !llmResult.metadata?.deadline),
          requires_repayment: (fundingTypes || []).includes('loan') || (fundingTypes || []).includes('bank_loan'),
          requires_equity: (fundingTypes || []).includes('equity') || (fundingTypes || []).includes('venture_capital'),
          is_gründungsprogramm: (fundingTypes || []).includes('gründungsprogramm'),
          is_intellectual_property: (fundingTypes || []).includes('intellectual_property') || (fundingTypes || []).includes('patent_support'),
          is_export_support: (fundingTypes || []).includes('export_support'),
          is_innovation_support: (fundingTypes || []).includes('innovation_support'),
          institution_type: (institutionForFunding as any)?.type || 'unknown',
          quality_issues: qualityAssessment.issues,
          quality_warnings: qualityAssessment.warnings,
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
        
        // Quality-based learning:
        // - 5+ requirements: Good page (learn inclusion pattern)
        // - 0 requirements: Bad page (learn exclusion pattern, keep blacklisted)
        // - 1-4 requirements: Neutral (don't learn, might be valid but incomplete)
        const isGoodPage = reqCount >= 5;
        const isBadPage = reqCount === 0;
        
        if (isGoodPage) {
          // Learn inclusion pattern for good pages
          await learnUrlPatternFromPage(url, host, true);
        } else if (isBadPage) {
          // Learn exclusion pattern for bad pages (no requirements)
          await learnUrlPatternFromPage(url, host, false);
          
          // Also add to blacklist if not already there (keep low-quality pages blacklisted)
          const { addManualExclusion } = await import('./src/utils/blacklist');
          try {
            await addManualExclusion(url, host, 'No requirements extracted - low quality page');
          } catch {
            // Might already exist, ignore
          }
        }
        // For 1-4 requirements, don't learn pattern (might be valid but incomplete extraction)
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
      // Improved error handling with better categorization
      const errorMsg = error?.message || String(error);
      const errorStatus = error?.status || error?.code;
      
      // Categorize errors
      const isNetworkError = 
        errorMsg.includes('timeout') ||
        errorMsg.includes('timed out') ||
        errorMsg.includes('network') ||
        errorMsg.includes('ECONNRESET') ||
        errorMsg.includes('ETIMEDOUT') ||
        errorMsg.includes('ENOTFOUND') ||
        errorMsg.includes('ECONNREFUSED');
      
      const isServerError = 
        errorStatus === 504 || // Gateway timeout
        errorStatus === 503 || // Service unavailable
        errorStatus === 502 || // Bad gateway
        errorStatus === 408;   // Request timeout
      
      const isRateLimit = 
        error?.code === 'insufficient_quota' || 
        errorStatus === 429;
      
      const isRetryable = isNetworkError || isServerError;
      
      // Handle rate limits with exponential backoff
      if (isRateLimit) {
        console.error(`   ❌ Rate limit/quota exhausted. Error: ${errorMsg.substring(0, 100)}\n`);
        // Re-queue with longer delay (10 minutes)
        try {
          const pool = getPool();
          await pool.query(`
            UPDATE scraping_jobs 
            SET status = 'queued', 
                last_error = $1,
                updated_at = NOW() + INTERVAL '10 minutes'
            WHERE url = $2
          `, [`Rate limit: ${errorMsg.substring(0, 150)}`, url]);
          console.log(`   🔄 Re-queued for retry (will process in 10 minutes)\n`);
        } catch {
          // Silently fail
        }
        return { saved: false, skipped: false, updated: false };
      }
      
      // IMPROVED: Retry network/server errors with exponential backoff
      // Track retry count in error metadata
      const retryCount = (error as any).retryCount || 0;
      const maxRetries = 5; // Increased from 3 to 5 for better resilience
      
      if (isRetryable && retryCount < maxRetries) {
        // Exponential backoff with jitter: 2s, 4s, 8s, 16s, 32s
        const baseDelay = isNetworkError ? 2000 : 5000;
        const exponentialDelay = baseDelay * Math.pow(2, retryCount);
        // Add jitter (±20%) to prevent thundering herd
        const jitter = exponentialDelay * 0.2 * (Math.random() * 2 - 1);
        const retryDelay = Math.max(1000, exponentialDelay + jitter);
        const nextRetry = retryCount + 1;
        
        console.warn(`   ⚠️  Retryable error (${errorStatus || 'network'}) [attempt ${nextRetry}/${maxRetries}]: ${errorMsg.substring(0, 50)}... Retrying in ${Math.round(retryDelay/1000)}s...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        
        try {
          // Recursive retry with incremented retry count
          return await processUrl(url, index);
        } catch (retryError: any) {
          // If retry count exceeded, fall through to re-queue logic
          if ((retryError as any).retryCount >= maxRetries) {
            console.error(`   ❌ Max retries (${maxRetries}) exceeded\n`);
          }
          // Re-throw to continue to re-queue logic
          throw retryError;
        }
      }
      
      // Log error with category
      const errorCategory = isRateLimit ? 'rate_limit' : 
                           isNetworkError ? 'network' : 
                           isServerError ? 'server' : 
                           'other';
      console.error(`   ❌ Failed (${errorCategory}): ${errorMsg.substring(0, 100)}\n`);
      if (errorCategory === 'other' && error?.stack) {
        console.error(`   ↳ Stack trace:\n${error.stack}`);
      }
      
      // Mark as failed (or queued for retry if retryable)
      try {
        const pool = getPool();
        if (isRetryable) {
          // Re-queue retryable errors for later processing (5 minutes for network, 10 for server)
          const retryDelay = isNetworkError ? '5 minutes' : '10 minutes';
          await pool.query(`
            UPDATE scraping_jobs 
            SET status = 'queued', 
                last_error = $1,
                updated_at = NOW() + INTERVAL '${retryDelay}'
            WHERE url = $2
          `, [`${errorCategory}: ${errorMsg.substring(0, 150)}`, url]);
          console.log(`   🔄 Re-queued for retry (will process in ${retryDelay})\n`);
        } else {
          // Mark non-retryable errors as failed
          await pool.query('UPDATE scraping_jobs SET status = $1, last_error = $2 WHERE url = $3', 
            ['failed', `${errorCategory}: ${errorMsg.substring(0, 150)}`, url]);
        }
      } catch {
        // Silently fail
      }
      return { saved: false, skipped: false, updated: false };
    }
  };
  
  // IMPROVED: Process URLs in parallel batches with progress tracking
  const startTime = Date.now();
  for (let i = 0; i < urls.length; i += CONCURRENCY) {
    const batch = urls.slice(i, i + CONCURRENCY);
    const batchNum = Math.floor(i / CONCURRENCY) + 1;
    const totalBatches = Math.ceil(urls.length / CONCURRENCY);
    
    // Progress tracking
    const processed = i;
    const remaining = urls.length - processed;
    const progressPercent = Math.round((processed / urls.length) * 100);
    const elapsed = Math.round((Date.now() - startTime) / 1000);
    const avgTimePerUrl = elapsed / Math.max(1, processed);
    const estimatedRemaining = Math.round((remaining * avgTimePerUrl) / 60);
    
    console.log(`\n📦 Batch ${batchNum}/${totalBatches} (${processed}/${urls.length} - ${progressPercent}%)`);
    if (remaining > 0 && processed > 0) {
      console.log(`   ⏱️  ETA: ~${estimatedRemaining} minutes remaining`);
    }
    
    const results = await Promise.all(
      batch.map((url, idx) => processUrl(url, i + idx))
    );
    
    for (const result of results) {
      if (result.saved) saved++;
      if (result.skipped) skipped++;
      if (result.updated) updated++;
    }
  }
  
  // Final statistics
  const totalTime = Math.round((Date.now() - startTime) / 1000);
  console.log(`\n📊 Batch Processing Complete:`);
  console.log(`   Time: ${totalTime}s (${Math.round(totalTime / 60)} minutes)`);
  console.log(`   Average: ${Math.round(totalTime / Math.max(1, urls.length))}s per URL`);
  
  // IMPROVED: Automatic queue balancing after scraping
  try {
    const { runQueueBalancing } = await import('./src/utils/queue-balancing');
    await runQueueBalancing();
  } catch (error: any) {
    // Silently fail - queue balancing is optional
  }
  
  // AUTO-LEARNING: Automatically learns patterns after scraping
  // This happens automatically - no manual scripts needed!
  try {
    const { shouldLearnQualityPatterns } = await import('./src/learning/auto-learning');
    const shouldLearn = await shouldLearnQualityPatterns();
    if (shouldLearn) {
      console.log('\n🧠 Auto-learning quality patterns (automatic - no manual scripts needed)...');
      await autoLearnQualityPatterns();
      console.log('   ✅ Learning complete - patterns applied automatically\n');
    } else {
      console.log('\n📊 Learning: Not enough data yet (need 50+ examples per funding type)');
      console.log('   💡 Continue scraping - learning happens automatically when ready\n');
    }
  } catch (error: any) {
    console.warn(`⚠️  Auto-learning check failed: ${error.message}`);
  }
  
  // Show learning status (automatic feedback)
  try {
    const status = await getLearningStatus();
    if (status.totalFeedback > 0) {
      console.log(`\n📊 Learning Status (automatic):`);
      console.log(`   Classification Accuracy: ${status.classificationAccuracy.toFixed(1)}%`);
      console.log(`   Quality Rules Learned: ${status.qualityRulesLearned} (automatic)`);
      console.log(`   URL Patterns Learned: ${status.urlPatternsLearned} (automatic)`);
      console.log(`   Total Feedback Records: ${status.totalFeedback} (automatic)\n`);
    }
  } catch {
    // Silently fail
  }
  
  // INTEGRATED AUTO-CYCLE: Discovery → Learning → Improvement
  // Foolproof autonomous cycle that runs after each batch of 50 pages (more frequent)
  const totalProcessed = saved + updated;
  // Run auto-cycle more frequently: every 50 pages to ensure continuous cleanup and improvement
  if (totalProcessed > 0 && (totalProcessed % 50 === 0 || totalProcessed >= 25)) {
    try {
      console.log(`\n🔄 Running integrated auto-cycle (${totalProcessed} pages processed)...`);
      await runIntegratedAutoCycle(pool, totalProcessed, 50);
    } catch (error: any) {
      console.warn(`⚠️  Integrated auto-cycle failed: ${error.message}`);
      console.error(error);
    }
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
      
      for (const task of reScrapeTasks.slice(0, 20)) { // Increased from 3 to 20
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
// PHASE 4: AUTOMATIC QUALITY IMPROVEMENTS (Fully Autonomous)
// ============================================================================

/**
 * Automatic quality improvements after scraping
 * - Cleans up 404 URLs
 * - Identifies and re-queues low-quality pages
 * - Runs quality analysis
 */
async function automaticQualityImprovements(): Promise<void> {
  console.log('\n🔧 Phase 4: Automatic Quality Improvements...\n');
  
  const pool = getPool();
  let improvements = 0;
  
  try {
    // 1. Clean up 404 URLs - Auto-blacklist failed 404 URLs
    console.log('🧹 Cleaning up 404 URLs...');
    const failed404 = await pool.query(`
      SELECT DISTINCT url, last_error
      FROM scraping_jobs
      WHERE status = 'failed'
        AND (last_error LIKE '%404%' OR last_error LIKE '%Not Found%')
        AND updated_at > NOW() - INTERVAL '7 days'
        AND url NOT IN (
          SELECT pattern FROM url_patterns WHERE pattern_type = 'exclude'
        )
      LIMIT 500
    `);
    
    if (failed404.rows.length > 0) {
      const { addManualExclusion } = await import('./src/utils/blacklist');
      let blacklisted = 0;
      
      for (const row of failed404.rows) {
        try {
          const url = row.url;
          const host = new URL(url).hostname.replace('www.', '');
          await addManualExclusion(url, host, 'HTTP 404 - Auto-cleaned');
          await pool.query(`
            UPDATE scraping_jobs
            SET status = 'failed', last_error = 'HTTP 404 - Blacklisted'
            WHERE url = $1
          `, [url]);
          blacklisted++;
        } catch {
          // Skip invalid URLs
        }
      }
      
      if (blacklisted > 0) {
        console.log(`   ✅ Auto-blacklisted ${blacklisted} 404 URLs`);
        improvements += blacklisted;
      }
    } else {
      console.log('   ✅ No new 404 URLs to clean up');
    }
    
    // 2. Identify and re-queue low-quality pages
    console.log('\n📊 Identifying low-quality pages...');
    const lowQuality = await pool.query(`
      SELECT 
        p.id,
        p.url,
        p.title,
        COUNT(r.id) as req_count
      FROM pages p
      LEFT JOIN requirements r ON p.id = r.page_id
      WHERE p.funding_types IS NOT NULL
        AND p.url NOT LIKE '%/contact%'
        AND p.url NOT LIKE '%/team%'
        AND p.url NOT LIKE '%/accessibility%'
        AND p.url NOT LIKE '%/login%'
        AND p.url NOT LIKE '%/newsletter%'
        AND p.url NOT LIKE '%/faq%'
        AND p.url NOT LIKE '%/events%'
        AND p.url NOT LIKE '%/workshops%'
        AND p.title NOT ILIKE '%team%'
        AND p.title NOT ILIKE '%contact%'
        AND p.title NOT ILIKE '%accessibility%'
        AND p.title NOT ILIKE '%login%'
        AND p.title NOT ILIKE '%newsletter%'
        AND p.title NOT ILIKE '%faq%'
        AND p.fetched_at > NOW() - INTERVAL '7 days'
      GROUP BY p.id, p.url, p.title
      HAVING COUNT(r.id) < 5
      ORDER BY COUNT(r.id) ASC
      LIMIT 200
    `);
    
    if (lowQuality.rows.length > 0) {
      let requeued = 0;
      for (const page of lowQuality.rows) {
        // Mark for re-scraping
        await pool.query(`
          UPDATE scraping_jobs 
          SET status = 'queued', updated_at = NOW(), quality_score = 50
          WHERE url = $1
        `, [page.url]);
        requeued++;
      }
      
      if (requeued > 0) {
        console.log(`   ✅ Re-queued ${requeued} low-quality pages for re-scraping`);
        improvements += requeued;
      }
    } else {
      console.log('   ✅ No low-quality pages found');
    }
    
    // 3. Quality metrics summary
    console.log('\n📈 Quality Metrics:');
    const qualityStats = await pool.query(`
      SELECT 
        COUNT(DISTINCT p.id) as total_pages,
        COUNT(DISTINCT p.id) FILTER (WHERE req_counts.req_count >= 5) as good_pages,
        COUNT(DISTINCT p.id) FILTER (WHERE req_counts.req_count < 5) as low_quality,
        AVG(req_counts.req_count) as avg_requirements,
        COUNT(DISTINCT p.id) FILTER (WHERE p.description IS NOT NULL AND p.description != '') as with_description,
        COUNT(DISTINCT p.id) FILTER (WHERE p.funding_amount_min IS NOT NULL OR p.funding_amount_max IS NOT NULL) as with_amount,
        COUNT(DISTINCT p.id) FILTER (WHERE p.deadline IS NOT NULL) as with_deadline
      FROM pages p
      LEFT JOIN (
        SELECT page_id, COUNT(*) as req_count
        FROM requirements
        GROUP BY page_id
      ) req_counts ON p.id = req_counts.page_id
      WHERE p.funding_types IS NOT NULL
        AND p.fetched_at > NOW() - INTERVAL '7 days'
    `);
    
    if (qualityStats.rows.length > 0) {
      const stats = qualityStats.rows[0];
      const total = parseInt(stats.total_pages || '0');
      const good = parseInt(stats.good_pages || '0');
      const withDesc = parseInt(stats.with_description || '0');
      const withAmount = parseInt(stats.with_amount || '0');
      const withDeadline = parseInt(stats.with_deadline || '0');
      
      if (total > 0) {
        console.log(`   📄 Total Pages: ${total}`);
        console.log(`   ✅ Good Pages (5+ reqs): ${good} (${Math.round(good/total*100)}%)`);
        console.log(`   📝 With Description: ${withDesc} (${Math.round(withDesc/total*100)}%)`);
        console.log(`   💰 With Amount: ${withAmount} (${Math.round(withAmount/total*100)}%)`);
        console.log(`   📅 With Deadline: ${withDeadline} (${Math.round(withDeadline/total*100)}%)`);
      }
    }
    
    if (improvements > 0) {
      console.log(`\n✅ Automatic improvements: ${improvements} actions taken`);
    } else {
      console.log('\n✅ No improvements needed - quality is good!');
    }
    
  } catch (error: any) {
    console.error(`   ⚠️  Quality improvements error: ${error.message}`);
    // Don't fail the whole cycle if quality improvements fail
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const command = args.find(a => ['discover', 'scrape', 'full'].includes(a)) || 'full';
  
  // Refresh config at runtime to get latest env vars FIRST
  Object.assign(CONFIG, getConfig());
  
  // Parse max limits AFTER config is set (so it overrides defaults)
  const maxArg = args.find(a => a.startsWith('--max='));
  if (maxArg) {
    const max = parseInt(maxArg.split('=')[1], 10);
    if (!isNaN(max)) {
      if (command === 'discover' || command === 'full') CONFIG.MAX_DISCOVERY = max;
      if (command === 'scrape' || command === 'full') CONFIG.MAX_SCRAPE = max;
    }
  }
  
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
    // IMPROVED: Smart cycle order - Process queue FIRST, then discover
    // This prevents queue from growing indefinitely
    const pool = getPool();
    const queueCheck = await pool.query('SELECT COUNT(*) as total FROM scraping_jobs WHERE status = $1', ['queued']);
    const queueSize = parseInt(queueCheck.rows[0].total, 10);
    
    // Smart cycle logic based on queue size
    const isLargeQueue = queueSize > 500;
    const isMediumQueue = queueSize > 200 && queueSize <= 500;
    
    if (command === 'full') {
      console.log(`\n📊 Queue Status: ${queueSize} URLs queued`);
      if (isLargeQueue) {
        console.log(`   ⚠️  Large queue detected - focusing on processing (skipping discovery)\n`);
      } else if (isMediumQueue) {
        console.log(`   ℹ️  Medium queue - prioritizing scraping (limited discovery)\n`);
      } else {
        console.log(`   ✅ Small queue - full cycle (discover + scrape)\n`);
      }
    }
    
    // IMPROVED ORDER: Scrape FIRST (process existing queue), then discover
    if (command === 'scrape' || command === 'full') {
      await scrapePrograms();
    }
    
    // Discovery: Only if queue is manageable or explicitly requested
    if (command === 'discover') {
      await discoverPrograms();
    } else if (command === 'full') {
      if (isLargeQueue) {
        console.log('   ⏭️  Skipping discovery - queue too large, focus on processing\n');
      } else if (isMediumQueue) {
        const originalMaxDiscovery = CONFIG.MAX_DISCOVERY;
        CONFIG.MAX_DISCOVERY = Math.min(CONFIG.MAX_DISCOVERY, 200); // Increased from 20 to 200
        await discoverPrograms();
        CONFIG.MAX_DISCOVERY = originalMaxDiscovery;
      } else {
        await discoverPrograms();
      }
    }
    
    // Phase 4: Automatic Quality Improvements (NEW - Fully Autonomous)
    if (command === 'full') {
      await automaticQualityImprovements();
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


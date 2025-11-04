// Consolidated scraper: discovery + scraping + state management
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';
import { fetchHtml } from './utils';
import { extractMeta } from './extract';
import { normalizeMetadata } from './extract';
import { normalizeUrl, sameHost, isDownload, isQueryListing, isProgramDetailPage, isOverviewPage } from './utils';
import { autoDiscoveryPatterns, findInstitutionByUrl } from './config';

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

export interface LiteJob {
  url: string;
  status: 'queued' | 'running' | 'done' | 'failed';
  depth: number;
  seed: string;
  lastError?: string;
}

export interface LitePage {
  url: string;
  title: string;
  description: string;
  funding_amount_min?: number | null;
  funding_amount_max?: number | null;
  currency?: string | null;
  deadline?: string | null;
  open_deadline?: boolean;
  contact_email?: string | null;
  contact_phone?: string | null;
  categorized_requirements: Record<string, any[]>;
  fetched_at: string;
}

interface LiteState {
  jobs: LiteJob[];
  pages: LitePage[];
  seen: Record<string, boolean>;
}

const dataDir = path.join(__dirname, '..', 'data', 'lite');
const statePath = path.join(dataDir, 'state.json');

export function loadState(): LiteState {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(statePath)) {
    const init: LiteState = { jobs: [], pages: [], seen: {} };
    fs.writeFileSync(statePath, JSON.stringify(init, null, 2));
    return init;
  }
  try {
    return JSON.parse(fs.readFileSync(statePath, 'utf8')) as LiteState;
  } catch {
    return { jobs: [], pages: [], seen: {} };
  }
}

export function saveState(s: LiteState): void {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(statePath, JSON.stringify(s, null, 2));
}

// ============================================================================
// DISCOVERY
// ============================================================================

export async function discover(seeds: string[], maxDepth = 1, maxPages = 20): Promise<void> {
  const state = loadState();
  const queue: Array<{ url: string; depth: number; seed: string } > = [];
  
  // Discovery diagnostics tracking
  const diagnostics = {
    totalLinks: 0,
    rejected: {
      emailProtection: 0,
      differentHost: 0,
      download: 0,
      alreadySeen: 0,
      exclusionKeyword: 0,
      notDetailPage: 0,
      queryListing: 0
    },
    accepted: 0,
    queuedForDepth: 0,
    programsFoundByDepth: {} as Record<number, number>
  };
  
  // Adaptive depth: Track if we're finding programs at current depth
  let programsFoundAtCurrentDepth = 0;
  let currentDepth = 0;
  
  for (const s of seeds) {
    queue.push({ url: s, depth: 0, seed: s });
    state.seen[s] = true;
  }

  while (queue.length && maxPages > 0) {
    const { url, depth, seed } = queue.shift()!;
    
    // Track depth changes for adaptive behavior
    if (depth !== currentDepth) {
      if (programsFoundAtCurrentDepth > 0 && depth > currentDepth) {
        // Found programs at previous depth, continue exploring
        console.log(`  ✅ Found ${programsFoundAtCurrentDepth} programs at depth ${currentDepth}, continuing exploration`);
      }
      currentDepth = depth;
      programsFoundAtCurrentDepth = 0;
    }
    
    try {
      const fetchResult = await fetchHtml(url);
      const $ = cheerio.load(fetchResult.html);
      
      // FUTURISTIC APPROACH: Detect overview pages and extract all program links
      const isOverview = isOverviewPage(url, fetchResult.html);
      if (isOverview) {
        console.log(`  🔍 Overview page detected: ${url.substring(0, 60)}...`);
        // Extract all program detail links from overview page
        let extractedFromOverview = 0;
        $('a[href]').each((_, a) => {
          const href = $(a).attr('href') || '';
          const full = normalizeUrl(url, href);
          diagnostics.totalLinks++;
          
          if (!full) return;
          if (full.includes('email-protection') || full.includes('cdn-cgi')) {
            diagnostics.rejected.emailProtection++;
            return;
          }
          if (!sameHost(seed, full)) {
            diagnostics.rejected.differentHost++;
            return;
          }
          if (isDownload(full)) {
            diagnostics.rejected.download++;
            return;
          }
          if (state.seen[full]) {
            diagnostics.rejected.alreadySeen++;
            return;
          }
          
          // Check if it's a program detail page
          if (isProgramDetailPage(full) && !isQueryListing(full)) {
            state.seen[full] = true;
            state.jobs.push({ url: full, status: 'queued', depth: depth + 1, seed });
            extractedFromOverview++;
            diagnostics.accepted++;
            diagnostics.programsFoundByDepth[depth + 1] = (diagnostics.programsFoundByDepth[depth + 1] || 0) + 1;
            programsFoundAtCurrentDepth++;
          } else {
            diagnostics.rejected.notDetailPage++;
          }
        });
        console.log(`     Extracted ${extractedFromOverview} program links from overview page`);
        maxPages--;
        continue; // Skip normal link processing for overview pages (already extracted links)
      }
      
      // Normal discovery: process links from non-overview pages
      // IMPROVEMENT: Check ALL links (not just first 100) for complete coverage
      const anchors = $('a[href]').toArray(); // Check all links for 100% coverage
      for (const a of anchors) {
        const href = $(a).attr('href') || '';
        const full = normalizeUrl(url, href);
        diagnostics.totalLinks++;
        
        if (!full) continue;
        // Skip email protection and other junk URLs
        if (full.includes('email-protection') || full.includes('cdn-cgi')) {
          diagnostics.rejected.emailProtection++;
          continue;
        }
        if (!sameHost(seed, full)) {
          diagnostics.rejected.differentHost++;
          continue;
        }
        if (isDownload(full)) {
          diagnostics.rejected.download++;
          continue;
        }
        if (state.seen[full]) {
          diagnostics.rejected.alreadySeen++;
          continue;
        }
        state.seen[full] = true;
        
        // KEYWORD-BASED FILTERING
        const urlLower = full.toLowerCase();
        const pathLower = new URL(full).pathname.toLowerCase();
        
        // EXCLUDE: Skip if contains exclusion keywords
        const hasExclusionKeyword = autoDiscoveryPatterns.exclusionKeywords.some(k => 
          urlLower.includes(k.toLowerCase()) || pathLower.includes(k.toLowerCase())
        );
        if (hasExclusionKeyword) {
          diagnostics.rejected.exclusionKeyword++;
          continue;
        }
        
        // INSTITUTION-SPECIFIC KEYWORDS (priority match)
        const institution = findInstitutionByUrl(full);
        let hasInstitutionKeyword = false;
        if (institution && institution.keywords && institution.keywords.length > 0) {
          hasInstitutionKeyword = institution.keywords.some(k => 
            urlLower.includes(k.toLowerCase()) || pathLower.includes(k.toLowerCase())
          );
        }
        
        // INCLUDE: Check for funding/program keywords (global fallback)
        const hasFundingKeyword = autoDiscoveryPatterns.fundingKeywords.some(k => 
          urlLower.includes(k.toLowerCase()) || pathLower.includes(k.toLowerCase())
        );
        const hasProgramKeyword = autoDiscoveryPatterns.programKeywords.some(k => 
          urlLower.includes(k.toLowerCase()) || pathLower.includes(k.toLowerCase())
        );
        
        // IMPROVEMENT: More lenient exploration - explore more URLs even if not detail pages
        // We can explore intermediate pages to find detail pages deeper in the structure
        const shouldExplore = depth < maxDepth && !isQueryListing(full);
        // If we found programs at this depth and depth < maxDepth, allow one more level
        const adaptiveMaxDepth = programsFoundAtCurrentDepth > 2 ? Math.min(maxDepth + 1, 5) : maxDepth;
        const canExplore = depth < adaptiveMaxDepth && !isQueryListing(full);
        
        // IMPROVEMENT: Also explore if URL has funding keywords (might lead to detail pages)
        const hasRelevantKeyword = hasFundingKeyword || hasProgramKeyword || hasInstitutionKeyword;
        const shouldExploreForKeywords = hasRelevantKeyword && depth < Math.max(maxDepth, 4) && !isQueryListing(full);
        
        if (shouldExplore || canExplore || shouldExploreForKeywords) {
          queue.push({ url: full, depth: depth + 1, seed });
          diagnostics.queuedForDepth++;
        }
        
        // RELAXED: Accept URLs with relevant keywords even if not strict detail pages
        // This helps discover more program pages that might have different URL structures
        const isDetailPage = isProgramDetailPage(full);
        const hasRelevantContent = hasFundingKeyword || hasProgramKeyword || hasInstitutionKeyword;
        
        // Accept if: strict detail page OR (has relevant keywords AND not excluded)
        if ((isDetailPage || hasRelevantContent) && !isQueryListing(full)) {
          state.jobs.push({ url: full, status: 'queued', depth: depth + 1, seed });
          diagnostics.accepted++;
          diagnostics.programsFoundByDepth[depth + 1] = (diagnostics.programsFoundByDepth[depth + 1] || 0) + 1;
          programsFoundAtCurrentDepth++;
        } else {
          diagnostics.rejected.notDetailPage++;
        }
      }
            maxPages--;
          } catch (e) {
            // ignore individual page failures
          }
        }
  
  // Print discovery diagnostics
  console.log(`\n📊 Discovery Diagnostics:`);
  console.log(`   Total links processed: ${diagnostics.totalLinks}`);
  console.log(`   Programs found: ${diagnostics.accepted}`);
  console.log(`   Queued for deeper exploration: ${diagnostics.queuedForDepth}`);
  console.log(`   Rejected:`);
  console.log(`     - Exclusion keywords: ${diagnostics.rejected.exclusionKeyword}`);
  console.log(`     - Not detail pages: ${diagnostics.rejected.notDetailPage}`);
  console.log(`     - Already seen: ${diagnostics.rejected.alreadySeen}`);
  console.log(`     - Different host: ${diagnostics.rejected.differentHost}`);
  console.log(`     - Downloads: ${diagnostics.rejected.download}`);
  console.log(`   Programs by depth:`, diagnostics.programsFoundByDepth);
  
  // Warning if low acceptance rate
  const acceptanceRate = diagnostics.totalLinks > 0 ? (diagnostics.accepted / diagnostics.totalLinks * 100).toFixed(1) : '0';
  if (parseFloat(acceptanceRate) < 1) {
    console.log(`   ⚠️  Low acceptance rate: ${acceptanceRate}% - may need to relax URL filtering`);
  }
  
  saveState(state);
}

// ============================================================================
// SCRAPING
// ============================================================================

export async function scrape(maxUrls = 10, targets: string[] = []): Promise<void> {
  // VERIFY DATABASE CONNECTION AT START
  if (process.env.DATABASE_URL) {
    try {
      const { testConnection } = require('./db/neon-client');
      const dbConnected = await testConnection();
      if (dbConnected) {
        console.log('✅ Database connection verified');
      } else {
        console.warn('⚠️  Database connection failed - will use JSON fallback');
      }
    } catch (e: any) {
      console.warn(`⚠️  Database check failed: ${e.message} - will use JSON fallback`);
    }
  } else {
    console.warn('⚠️  DATABASE_URL not set - using JSON fallback only');
  }
  
  const state = loadState();
  let jobs = state.jobs.filter(j => j.status === 'queued');
  
  // SKIP URLs ALREADY IN DATABASE (prevent duplicate scraping)
  // Only check if DATABASE_URL is set and we're not explicitly rescraping
  if (process.env.DATABASE_URL && !targets.length) {
    try {
      const { getPageByUrl } = require('./db/page-repository');
      const { testConnection } = require('./db/neon-client');
      const dbConnected = await testConnection();
      
      if (dbConnected) {
        // const jobsBefore = jobs.length; // Unused for now
        const existingUrls = new Set<string>();
        
        // Check first 100 URLs in batch (to avoid too many DB queries)
        const checkBatch = jobs.slice(0, Math.min(100, jobs.length));
        for (const job of checkBatch) {
          const existing = await getPageByUrl(job.url);
          if (existing) {
            existingUrls.add(job.url);
            // Mark as done if already in database (skip re-scraping)
            job.status = 'done';
            console.log(`  ⏭️  Skipping (already in DB): ${job.url.slice(0, 60)}...`);
          }
        }
        
        // Filter out jobs that are already in database
        jobs = jobs.filter(j => !existingUrls.has(j.url));
        
        if (existingUrls.size > 0) {
          console.log(`  ⏭️  Skipped ${existingUrls.size} URLs already in database (preventing duplicate scraping)`);
        }
      }
    } catch (e: any) {
      // If DB check fails, continue with all jobs (don't block scraping)
      console.warn(`  ⚠️  Could not check database for existing URLs: ${e.message}`);
    }
  }
  
  // Apply target filter if provided
  if (targets.length > 0) {
    jobs = jobs.filter(j => targets.some(t => j.url.includes(t)));
  }
  
  // Limit to maxUrls
  jobs = jobs.slice(0, maxUrls);
  
  console.log(`📋 Scraping ${jobs.length} jobs...`);

  for (const job of jobs) {
    (job as any).status = 'running';
    try {
      // Filter query parameter URLs during scraping too (catch URLs added before fix)
      if (isQueryListing(job.url)) {
        console.log(`  ⚠️  Skipping query parameter URL: ${job.url.slice(0, 60)}...`);
        (job as any).status = 'failed';
        (job as any).lastError = 'Query parameter listing page (filtered)';
        continue;
      }
      
      const fetchResult = await fetchHtml(job.url);
      
      // COMPREHENSIVE ERROR HANDLING: Wrap extraction in try-catch to prevent .rea errors
      let meta;
      try {
        meta = extractMeta(fetchResult.html, job.url);
        
        // VALIDATE: Ensure extracted data makes sense
        // Check if funding amounts are reasonable
        if (meta.funding_amount_min !== null && meta.funding_amount_min !== undefined) {
          if (meta.funding_amount_min < 100 && meta.funding_amount_max && meta.funding_amount_max < 1000) {
            // Very small amounts - might be wrong (page numbers, years, etc.)
            // Only keep if we have strong context (e.g., description mentions funding)
            const hasFundingContext = meta.description && /\b(förderung|funding|finanzierung|grant|subvention|zuschuss)\b/i.test(meta.description);
            if (!hasFundingContext) {
              meta.funding_amount_min = null;
              meta.funding_amount_max = null;
            }
          }
        }
        
        // Validate deadline makes sense
        if (meta.deadline) {
          // Check if deadline is reasonable (not a year like "2025")
          if (/^\d{4}$/.test(meta.deadline.trim())) {
            meta.deadline = null;
          }
        }
        
        // Validate contact email is not a date range
        if (meta.contact_email) {
          if (/^\d{4}-\d{4}$/.test(meta.contact_email.trim())) {
            meta.contact_email = null;
          }
        }
        
      } catch (extractError: any) {
        const errorMsg = extractError?.message || String(extractError);
        // Check if it's the .rea error - add more context
        if (errorMsg.includes('rea') || errorMsg.includes('undefined')) {
          console.error(`  ❌ Extraction error (likely HTML structure issue) for ${job.url.slice(0, 60)}...`);
          // Try to extract at least basic metadata even if full extraction fails
          try {
            const $ = require('cheerio').load(fetchResult.html);
            const title = $('title').text() || $('h1').first().text() || '';
            const description = $('meta[name="description"]').attr('content') || $('p').first().text() || '';
            meta = {
              title: title.trim() || null,
              description: description.trim() || null,
              funding_amount_min: null,
              funding_amount_max: null,
              deadline: null,
              contact_email: null,
              contact_phone: null,
              categorized_requirements: {},
              metadata_json: {}
            };
            console.log(`  ⚠️  Extracted minimal metadata (full extraction failed)`);
          } catch (fallbackError: any) {
            throw new Error(`Extraction failed: ${errorMsg}`);
          }
        } else {
          throw new Error(`Extraction failed: ${errorMsg}`);
        }
      }
      
      // DEBUG: Log extraction results
      if (meta.funding_amount_min || meta.funding_amount_max || meta.deadline || meta.contact_email || meta.contact_phone) {
        console.log(`  💰 Extracted: ${meta.funding_amount_min || 'N/A'}-${meta.funding_amount_max || 'N/A'} EUR, deadline: ${meta.deadline || 'N/A'}, contact: ${meta.contact_email || meta.contact_phone || 'N/A'}`);
      }
      
      // Assign institution metadata
      const institution = findInstitutionByUrl(job.url);
      const fundingTypes = institution?.fundingTypes || [];
      
      // CRITICAL FIX: Always assign funding_type (never null)
      // Helper to extract funding type from URL if not found
      function extractFundingTypeFromUrl(url: string): string | null {
        const urlLower = url.toLowerCase();
        if (urlLower.includes('/equity/') || urlLower.includes('venture') || urlLower.includes('/vc-') || urlLower.includes('/funds/')) return 'equity';
        if (urlLower.includes('/loan/') || urlLower.includes('/kredit/') || urlLower.includes('/darlehen/') || urlLower.includes('financing')) return 'loan';
        if (urlLower.includes('/grant/') || urlLower.includes('/foerderung/') || urlLower.includes('/subsidy/') || urlLower.includes('funding')) return 'grant';
        if (urlLower.includes('/leasing/')) return 'leasing';
        if (urlLower.includes('/guarantee/') || urlLower.includes('/buergschaft/')) return 'guarantee';
        if (urlLower.includes('/crowdfunding/') || urlLower.includes('crowdinvesting')) return 'crowdfunding';
        if (urlLower.includes('bank')) return 'bank_loan';
        return null;
      }
      
      // Try: institution fundingTypes → metadata funding_type → extract from URL → 'unknown'
      const metadataJsonRaw = meta.metadata_json || {};
      const fundingType = fundingTypes.length > 0 
        ? fundingTypes[0] 
        : ((metadataJsonRaw as any)?.funding_type 
          || extractFundingTypeFromUrl(job.url)
          || 'unknown');
      
      // Build metadata_json with funding_type (singular) for easier querying
      const metadataJson: any = {
        ...metadataJsonRaw,
        funding_type: fundingType, // Always assigned (never null)
        institution: institution?.name || null,
        application_method: (metadataJsonRaw as any)?.application_method || null,
        requires_account: (metadataJsonRaw as any)?.requires_account || false,
        form_fields: (metadataJsonRaw as any)?.form_fields || null,
        // Preserve funding_amount_status if present (indicates unknown/variable amounts)
        funding_amount_status: (metadataJsonRaw as any)?.funding_amount_status || null
      };
      
      const rawMetadata = {
        url: job.url,
        title: meta.title,
        description: meta.description,
        funding_amount_min: (meta.funding_amount_min !== undefined && meta.funding_amount_min !== null) ? meta.funding_amount_min : null,
        funding_amount_max: (meta.funding_amount_max !== undefined && meta.funding_amount_max !== null) ? meta.funding_amount_max : null,
        currency: meta.currency ?? null,
        deadline: meta.deadline ?? null,
        open_deadline: meta.open_deadline ?? false,
        contact_email: meta.contact_email ?? null,
        contact_phone: meta.contact_phone ?? null,
        categorized_requirements: meta.categorized_requirements,
        metadata_json: metadataJson,
        raw_html_path: fetchResult.rawHtmlPath || null,
        // Institution-assigned fields (fallback to extracted data if not set)
        funding_types: fundingTypes.length > 0 ? fundingTypes : (metadataJson.funding_type ? [metadataJson.funding_type] : []),
        region: institution?.region || (metadataJson.geography as any)?.region || metadataJson.region || null,
        program_focus: (institution?.programFocus && institution.programFocus.length > 0) ? institution.programFocus : (metadataJson.program_topics || []),
        fetched_at: new Date().toISOString()
      };
      
      const rec = normalizeMetadata(rawMetadata);
      
      // QUALITY CHECK: Ensure minimum data quality before saving
      const hasMinimumData = !!(
        rec.title && rec.title.trim().length > 5 &&
        (rec.description && rec.description.trim().length > 20) &&
        rec.url && rec.url.length > 10
      );
      
      if (!hasMinimumData) {
        console.log(`  ⚠️  Skipping low-quality page (missing title/description): ${job.url.slice(0, 60)}...`);
        (job as any).status = 'failed';
        (job as any).lastError = 'Insufficient data quality (missing title/description)';
        continue;
      }
      
      // Save to NEON database with transaction support
      try {
        const { savePageWithRequirements } = require('./db/page-repository');
        const { markJobDone } = require('./db/job-repository');
        const { testConnection } = require('./db/neon-client');
        
        // Check if DATABASE_URL is set and connection works
        if (!process.env.DATABASE_URL) {
          throw new Error('DATABASE_URL environment variable is not set. Please configure it in .env.local');
        }
        
        // Test connection before attempting save
        const connectionOk = await testConnection();
        if (!connectionOk) {
          throw new Error('Database connection test failed');
        }
        
        // Use atomic transaction to ensure page + requirements are saved together
        console.log(`  💾 Attempting to save to database: ${job.url.slice(0, 60)}...`);
        const pageId = await savePageWithRequirements(rec);
        await markJobDone(job.url);
        
        // LEARNING: Track extraction success for automatic pattern improvement
        try {
          const { trackExtractionOutcome } = require('./extract-learning');
          
          await trackExtractionOutcome(pageId, job.url, {
            deadline: !!(rec.deadline || rec.open_deadline),
            funding_amount: !!(rec.funding_amount_min || rec.funding_amount_max),
            contact_email: !!rec.contact_email,
            contact_phone: !!rec.contact_phone,
            timeline: Object.keys(rec.categorized_requirements || {}).includes('timeline') && 
                     (rec.categorized_requirements?.timeline || []).length > 0,
            financial: Object.keys(rec.categorized_requirements || {}).includes('financial') && 
                      (rec.categorized_requirements?.financial || []).length > 0,
            trl_level: Object.keys(rec.categorized_requirements || {}).includes('trl_level') && 
                      (rec.categorized_requirements?.trl_level || []).length > 0,
            market_size: Object.keys(rec.categorized_requirements || {}).includes('market_size') && 
                         (rec.categorized_requirements?.market_size || []).length > 0
          });
        } catch (learningError: any) {
          // Silently fail - don't break scraping if learning fails
          console.warn(`  ⚠️  Learning tracking failed: ${learningError.message}`);
        }
        
        // Also update local state for compatibility
        state.pages = state.pages.filter(p => p.url !== job.url);
        state.pages.push(rec as any);
        (job as any).status = 'done';
        
        const recHasMeta = !!(rec.funding_amount_min || rec.funding_amount_max || rec.deadline || rec.contact_email || rec.contact_phone);
        if (recHasMeta) {
          console.log(`  ✅ Saved to DB (ID: ${pageId}): ${rec.funding_amount_min || 'N/A'}-${rec.funding_amount_max || 'N/A'} EUR, deadline: ${rec.deadline || (rec.open_deadline ? 'Open' : 'N/A')}`);
        } else {
          console.log(`  ✅ Saved to DB (ID: ${pageId}): ${job.url.slice(0, 60)}...`);
        }
      } catch (dbError: any) {
        const errorMsg = dbError.message || String(dbError);
        console.error(`  ❌ DB save failed for ${job.url.slice(0, 60)}...`);
        console.error(`     Error: ${errorMsg}`);
        if (errorMsg.includes('DATABASE_URL')) {
          console.error(`  ⚠️  Please set DATABASE_URL in .env.local to enable database storage`);
        } else if (errorMsg.includes('validation')) {
          console.error(`  ⚠️  Data validation failed - check title, description, and URL`);
        } else if (errorMsg.includes('connection')) {
          console.error(`  ⚠️  Database connection issue - check DATABASE_URL and network`);
        }
        
        // GUARANTEED FALLBACK: Always save to JSON if DB fails
        try {
          state.pages = state.pages.filter(p => p.url !== job.url);
          state.pages.push(rec as any);
          (job as any).status = 'done';
          console.log(`  ⚠️  Saved to JSON only (DB failed): ${job.url.slice(0, 60)}...`);
        } catch (jsonError: any) {
          // Even JSON fallback failed - critical error
          console.error(`  ❌❌ CRITICAL: Both DB and JSON save failed for ${job.url.slice(0, 60)}...`);
          (job as any).status = 'failed';
          (job as any).lastError = `Save failed: ${errorMsg} | JSON fallback: ${jsonError.message}`;
        }
      }
    } catch (e: any) {
      // Retry logic: Don't mark as permanently failed - reset to queued for retry (max 3 attempts)
      const attempts = ((job as any).attempts || 0) + 1;
      if (attempts < 3) {
        (job as any).status = 'queued';
        (job as any).attempts = attempts;
        (job as any).lastError = (e?.message || String(e)).slice(0, 100);
        console.log(`  ⚠️  ${job.url.slice(0, 60)}... (retry ${attempts}/3: ${(e?.message || String(e)).slice(0, 40)})`);
      } else {
        (job as any).status = 'failed';
        (job as any).lastError = (e?.message || String(e)).slice(0, 100);
        console.log(`  ❌ ${job.url.slice(0, 60)}... (failed after 3 attempts: ${(e?.message || String(e)).slice(0, 40)})`);
      }
    }
  }

  // POST-SCRAPE CLEANUP: Remove invalid URLs based on blacklist patterns + feedback loop
  // VERY SPECIFIC patterns only - don't be too aggressive to avoid blocking valid pages
  const badPatterns = [
    // Non-funding content (very specific patterns)
    /landwirtschaft|forstwirtschaft|bauen-wohnen|wohnbau|wohnbeihilfe|verkehrsinfrastruktur/i,
    /agriculture|forestry|housing|construction|traffic|bahninfrastruktur/i,
    /privatkunden|private|consumer|endkunde/i,
    /raumplanung|bauordnung|baurecht|bauprojekt|immobilie/i,
    // VERY SPECIFIC: ESF language variant homepages ONLY (not general filtering)
    /^https?:\/\/ec\.europa\.eu\/esf\/home\.jsp\?langId=[a-z]{2}$/i,
    /^https?:\/\/ec\.europa\.eu\/esf\/main\.jsp\?catId=\d+&langId=[a-z]{2}$/i
  ];
  
  // INFO/FAQ/ABOUT page patterns (from institutionConfig exclusionKeywords)
  const infoPagePatterns = [
    /\/info\/|\/information\/|\/informations\//i,
    /\/faq\/|\/frequently-asked\/|\/fragen\/|\/questions\/|\/help\/|\/hilfe\//i,
    /\/about\/|\/ueber\/|\/über\/|\/chi-siamo\//i,
    /\/contact\/|\/kontakt\//i,
    /\/overview\/|\/übersicht\/|\/uebersicht\/|\/general\//i,
    /\/home\/|\/startseite\/|\/index\/|\/main\//i,
    /\/sitemap\/|\/navigation\/|\/menu\//i,
    /\/news\/|\/press\/|\/media\/|\/newsletter\//i,
  ];
  
  // Check if title/description suggests info/FAQ page
  function isInfoPage(p: any): boolean {
    const title = (p.title || '').toLowerCase();
    const desc = (p.description || '').toLowerCase();
    const url = (p.url || '').toLowerCase();
    
    // Check URL patterns
    if (infoPagePatterns.some(pattern => pattern.test(url))) {
      return true;
    }
    
    // Check title patterns (very specific to avoid false positives)
    const infoTitlePatterns = [
      /^(about|info|information|faq|frequently asked|contact|help|über|ueber)\s/i,
      /^(allgemeine informationen|general information|informazioni generali)\s/i,
      /(faq|frequently asked|häufig gestellte|domande frequenti)$/i,
      /^(contact us|kontakt|contatti|contactez-nous)$/i,
    ];
    if (infoTitlePatterns.some(pattern => pattern.test(title))) {
      return true;
    }
    
    // Check description patterns (only if very obvious)
    const infoDescPatterns = [
      /^(this page|diese seite|cette page|questa pagina)/i,
      /^(for more information|für weitere informationen|pour plus d'informations)/i,
      /^(contact us|kontaktieren sie uns|contactez-nous)/i,
    ];
    if (infoDescPatterns.some(pattern => pattern.test(desc))) {
      return true;
    }
    
    return false;
  }
  
  // Check if page is a bank/equity program (should be KEPT even with null amounts)
  function isBankOrEquityProgram(p: any): boolean {
    const title = (p.title || '').toLowerCase();
    const url = (p.url || '').toLowerCase();
    const fundingTypes = (p.funding_types || []).map((t: string) => t.toLowerCase());
    
    // Check funding types
    if (fundingTypes.some((t: string) => ['equity', 'loan', 'bank_loan', 'venture', 'investment'].includes(t))) {
      return true;
    }
    
    // Check title/URL for equity/loan keywords (but not if it's an info page)
    const equityLoanKeywords = ['equity', 'loan', 'kredit', 'investment', 'venture', 'beteiligung', 'financing'];
    if (equityLoanKeywords.some(kw => title.includes(kw) || url.includes(kw))) {
      // Only if it's NOT an info page
      if (!isInfoPage(p)) {
        return true;
      }
    }
    
    return false;
  }
  
  const beforeCleanup = state.pages.length;
  
  // FEEDBACK LOOP: Auto-blacklist URLs with 0 requirements (likely non-program pages)
  // BUT: Be careful - only filter if truly has no value (no requirements AND no metadata)
  // IMPORTANT: Keep bank/equity programs even with null amounts!
  state.pages = state.pages.filter(p => {
    const url = (p.url || '').toLowerCase();
    
    // Pattern-based exclusions (very specific patterns only)
    if (badPatterns.some(pattern => pattern.test(url))) {
      return false;
    }
    
    // CRITICAL: Keep bank/equity programs even if they look like they might be filtered
    const isBankEquity = isBankOrEquityProgram(p);
    if (isBankEquity) {
      return true; // Always keep bank/equity programs
    }
    
    // Filter out obvious info/FAQ/about pages
    if (isInfoPage(p)) {
      // Only filter if it truly has no value (no requirements AND no meaningful metadata)
      const reqs = p.categorized_requirements || {};
      const totalRequirementsCount = Object.values(reqs)
        .filter(Array.isArray)
        .reduce((sum, items) => sum + (Array.isArray(items) ? items.length : 0), 0);
      
      const hasFundingMetadata = !!(p.funding_amount_min || p.funding_amount_max || p.deadline || p.open_deadline || p.contact_email || p.contact_phone);
      
      // If it's an info page with no requirements and no funding metadata, filter it out
      if (totalRequirementsCount === 0 && !hasFundingMetadata) {
        return false;
      }
      // Otherwise keep it (might have some value)
    }
    
    // Auto-blacklist: URLs with 0 requirements (likely category/info pages, not program detail pages)
    const reqs = p.categorized_requirements || {};
    
    // CRITICAL categories - at least one must be present for page to be valuable
    const criticalCategories = ['eligibility', 'financial', 'documents', 'project', 'timeline'];
    const hasCriticalCategory = criticalCategories.some(cat => {
      const items = reqs[cat] || [];
      return Array.isArray(items) && items.length > 0;
    });
    
    // FIXED: Properly count requirements - handle nested array structure
    const totalRequirementsCount = Object.values(reqs)
      .filter(Array.isArray)
      .reduce((sum, items) => sum + (Array.isArray(items) ? items.length : 0), 0);
    
    if (totalRequirementsCount === 0) {
      // Keep if it has CRITICAL category OR title + description OR funding/deadline/contact metadata
      // DON'T filter aggressively - keep pages with any metadata
      const hasMetadata = (p.title && p.title.trim().length > 10) && (p.description && p.description.trim().length > 20);
      const hasFundingMetadata = !!(p.funding_amount_min || p.funding_amount_max || p.deadline || p.open_deadline || p.contact_email || p.contact_phone);
      if (!hasCriticalCategory && !hasMetadata && !hasFundingMetadata) {
        return false; // No critical requirements AND no metadata = likely useless
      }
    } else if (totalRequirementsCount > 0 && !hasCriticalCategory) {
      // Has requirements but none are critical - might still be valuable if has metadata
      // BE LESS AGGRESSIVE: Only filter if truly has almost nothing
      const hasFundingMetadata = !!(p.funding_amount_min || p.funding_amount_max || p.deadline || p.open_deadline || p.contact_email || p.contact_phone);
      const hasTitleDesc = (p.title && p.title.trim().length > 10) && (p.description && p.description.trim().length > 20);
      if (!hasFundingMetadata && !hasTitleDesc && totalRequirementsCount < 2) {
        // Very few non-critical requirements (less than 2), no metadata, and no title/desc = likely low value
        return false;
      }
    }
    
    return true;
  });
  
  const removedCount = beforeCleanup - state.pages.length;
  if (removedCount > 0) {
    console.log(`🧹 Cleaned up ${removedCount} invalid/low-quality pages`);
  }
  
  saveState(state);
  console.log(`💾 Saved ${state.pages.length} pages`);
}


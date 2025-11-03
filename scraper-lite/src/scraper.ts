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
        
        // ONLY queue detail pages (not category/overview pages)
        // This is critical - we only want to scrape actual program detail pages
        const isDetailPage = isProgramDetailPage(full);
        
        if (isDetailPage && !isQueryListing(full)) {
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
  const acceptanceRate = diagnostics.totalLinks > 0 ? (diagnostics.accepted / diagnostics.totalLinks * 100).toFixed(1) : 0;
  if (parseFloat(acceptanceRate) < 1) {
    console.log(`   ⚠️  Low acceptance rate: ${acceptanceRate}% - may need to relax URL filtering`);
  }
  
  saveState(state);
}

// ============================================================================
// SCRAPING
// ============================================================================

export async function scrape(maxUrls = 10, targets: string[] = []): Promise<void> {
  const state = loadState();
  let jobs = state.jobs.filter(j => j.status === 'queued');
  
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
      const fetchResult = await fetchHtml(job.url);
      const meta = extractMeta(fetchResult.html, job.url);
      
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
      const fundingType = fundingTypes.length > 0 
        ? fundingTypes[0] 
        : (meta.metadata_json?.funding_type 
          || extractFundingTypeFromUrl(job.url)
          || 'unknown');
      
      // Build metadata_json with funding_type (singular) for easier querying
      const metadataJson = {
        ...(meta.metadata_json || {}),
        funding_type: fundingType, // Always assigned (never null)
        institution: institution?.name || null,
        application_method: meta.metadata_json?.application_method || null,
        requires_account: meta.metadata_json?.requires_account || false,
        form_fields: meta.metadata_json?.form_fields || null
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
        region: institution?.region || metadataJson.geography?.region || metadataJson.region || null,
        program_focus: institution?.programFocus.length > 0 ? institution.programFocus : (metadataJson.program_topics || []),
        fetched_at: new Date().toISOString()
      };
      
      const rec = normalizeMetadata(rawMetadata);
      
      // Save to NEON database
      try {
        const { savePage, saveRequirements } = require('./db/page-repository');
        const { markJobDone } = require('./db/job-repository');
        
        // Check if DATABASE_URL is set
        if (!process.env.DATABASE_URL) {
          throw new Error('DATABASE_URL environment variable is not set. Please configure it in .env.local');
        }
        
        const pageId = await savePage(rec);
        await saveRequirements(pageId, rec.categorized_requirements);
        await markJobDone(job.url);
        
        // Also update local state for compatibility
        state.pages = state.pages.filter(p => p.url !== job.url);
        state.pages.push(rec as any);
        (job as any).status = 'done';
        
        const recHasMeta = !!(rec.funding_amount_min || rec.funding_amount_max || rec.deadline || rec.contact_email || rec.contact_phone);
        if (recHasMeta) {
          console.log(`  ✅ Saved to DB: ${rec.funding_amount_min || 'N/A'}-${rec.funding_amount_max || 'N/A'} EUR, deadline: ${rec.deadline || (rec.open_deadline ? 'Open' : 'N/A')}`);
        }
        console.log(`  ✅ ${job.url.slice(0, 60)}...`);
      } catch (dbError: any) {
        const errorMsg = dbError.message || String(dbError);
        if (errorMsg.includes('DATABASE_URL')) {
          console.error(`  ❌ DB save failed: ${errorMsg}`);
          console.error(`  ⚠️  Please set DATABASE_URL in .env.local to enable database storage`);
        } else {
          console.error(`  ❌ DB save failed: ${errorMsg}`);
        }
        // Fallback to JSON-only
        state.pages = state.pages.filter(p => p.url !== job.url);
        state.pages.push(rec as any);
        (job as any).status = 'done';
        console.log(`  ⚠️  Saved to JSON only (DB failed): ${job.url.slice(0, 60)}...`);
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
  const badPatterns = [
    /landwirtschaft|forstwirtschaft|bauen-wohnen|wohnbau|wohnbeihilfe|verkehrsinfrastruktur/i,
    /agriculture|forestry|housing|construction|traffic|bahninfrastruktur/i,
    /privatkunden|private|consumer|endkunde/i,
    /raumplanung|bauordnung|baurecht|bauprojekt|immobilie/i
  ];
  
  const beforeCleanup = state.pages.length;
  
  // FEEDBACK LOOP: Auto-blacklist URLs with 0 requirements (likely non-program pages)
  state.pages = state.pages.filter(p => {
    const url = (p.url || '').toLowerCase();
    
    // Pattern-based exclusions
    if (badPatterns.some(pattern => pattern.test(url))) {
      return false;
    }
    
    // Auto-blacklist: URLs with 0 requirements (likely category/info pages, not program detail pages)
    const reqs = p.categorized_requirements || {};
    const totalRequirements = Object.values(reqs).flat().filter(Array.isArray).reduce((sum, items) => sum + items.length, 0);
    
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
      const hasMetadata = (p.title && p.title.trim().length > 10) && (p.description && p.description.trim().length > 20);
      const hasFundingMetadata = !!(p.funding_amount_min || p.funding_amount_max || p.deadline || p.open_deadline || p.contact_email || p.contact_phone);
      if (!hasCriticalCategory && !hasMetadata && !hasFundingMetadata) {
        return false; // No critical requirements AND no metadata = likely useless
      }
    } else if (totalRequirementsCount > 0 && !hasCriticalCategory) {
      // Has requirements but none are critical - might still be valuable if has metadata
      const hasFundingMetadata = !!(p.funding_amount_min || p.funding_amount_max || p.deadline || p.open_deadline || p.contact_email || p.contact_phone);
      const hasTitleDesc = (p.title && p.title.trim().length > 10) && (p.description && p.description.trim().length > 20);
      if (!hasFundingMetadata && !hasTitleDesc && totalRequirementsCount < 3) {
        // Very few non-critical requirements, no metadata, and no title/desc = likely low value
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


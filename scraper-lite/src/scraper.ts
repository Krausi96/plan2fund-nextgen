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

// PERFORMANCE: Cache for seen URLs to avoid repeated DB queries
// OPTIMIZATION: Increased cache size and TTL for better performance
const seenUrlCache = new Map<string, { saved: boolean; timestamp: number }>();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes (increased from 5)
const MAX_CACHE_SIZE = 50000; // Limit cache size to prevent memory issues

export function saveState(s: LiteState): void {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  
  // PERFORMANCE OPTIMIZATION: If using database, don't keep pages in state (they're in DB)
  // Only keep jobs and seen URLs in state
  const stateToSave: LiteState = {
    jobs: s.jobs,
    pages: process.env.DATABASE_URL ? [] : s.pages, // Empty pages if using DB - they're stored there
    seen: s.seen
  };
  
  // PERFORMANCE: Use writeFileSync but with smaller payload
  fs.writeFileSync(statePath, JSON.stringify(stateToSave, null, 2));
}

// PERFORMANCE: Clear stale cache entries
function clearStaleCache() {
  const now = Date.now();
  let cleared = 0;
  for (const [url, data] of seenUrlCache.entries()) {
    if (now - data.timestamp > CACHE_TTL) {
      seenUrlCache.delete(url);
      cleared++;
    }
  }
  // OPTIMIZATION: If cache is too large, clear oldest entries
  if (seenUrlCache.size > MAX_CACHE_SIZE) {
    const entries = Array.from(seenUrlCache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp);
    const toRemove = entries.slice(0, seenUrlCache.size - MAX_CACHE_SIZE);
    toRemove.forEach(([url]) => seenUrlCache.delete(url));
  }
}

// ============================================================================
// DISCOVERY
// ============================================================================

export async function discover(seeds: string[], maxDepth = 1, maxPages = 20): Promise<void> {
  const state = loadState();
  const queue: Array<{ url: string; depth: number; seed: string } > = [];
  
  // AUTONOMOUS: Check database for seen URLs (not just JSON)
  const { markUrlSeen, checkUrlsSeen } = require('./db/seen-urls-repository');
  let useDatabaseSeen = false;
  
  if (process.env.DATABASE_URL) {
    try {
      // Test if database is available
      const { testConnection } = require('./db/neon-client');
      useDatabaseSeen = await testConnection();
    } catch (e) {
      // Fallback to JSON
    }
  }
  
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
  
  // EFFICIENCY FIX: Pre-check seed URLs - skip if already in database
  const seedUrlsToProcess: string[] = [];
  if (useDatabaseSeen && seeds.length > 0) {
    try {
      const { getPool } = require('./db/neon-client');
      const pool = getPool();
      // Batch check which seed URLs are already in pages table
      const seedPlaceholders = seeds.map((_, i) => `$${i + 1}`).join(',');
      const seedCheckResult = await pool.query(
        `SELECT url FROM pages WHERE url IN (${seedPlaceholders})`,
        seeds
      );
      const existingSeedUrls = new Set(seedCheckResult.rows.map((r: any) => r.url));
      
      // Only add seed URLs that are NOT already in database
      for (const s of seeds) {
        if (!existingSeedUrls.has(s)) {
          seedUrlsToProcess.push(s);
        } else {
          console.log(`  ⏭️  Skipping seed URL (already in database): ${s.substring(0, 60)}...`);
          state.seen[s] = true;
          // Mark as seen but don't add to queue
          await markUrlSeen(s, null, 0);
        }
      }
    } catch (e) {
      // Fallback: process all seeds if database check fails
      seedUrlsToProcess.push(...seeds);
    }
  } else {
    seedUrlsToProcess.push(...seeds);
  }
  
  // Only add non-processed seed URLs to queue
  for (const s of seedUrlsToProcess) {
    queue.push({ url: s, depth: 0, seed: s });
    state.seen[s] = true;
    // AUTONOMOUS: Mark seed URLs as seen in database
    if (useDatabaseSeen) {
      await markUrlSeen(s, null, 0);
    }
  }
  
  if (seedUrlsToProcess.length === 0) {
    console.log(`  ⚠️  All seed URLs are already in database - no new discovery needed`);
    return; // Early return if all seeds are already processed
  }
  
  console.log(`  📊 Processing ${seedUrlsToProcess.length}/${seeds.length} seed URLs (${seeds.length - seedUrlsToProcess.length} already in database)`);

  // CRITICAL: Add timeout to prevent discovery from running too long
  const DISCOVERY_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes max for discovery
  const discoveryStartTime = Date.now();
  
  while (queue.length && maxPages > 0) {
    // Check timeout - if discovery takes > 5 minutes, stop
    if (Date.now() - discoveryStartTime > DISCOVERY_TIMEOUT_MS) {
      console.log(`  ⏰ Discovery timeout after ${DISCOVERY_TIMEOUT_MS / 1000}s - stopping to prevent hanging`);
      break;
    }
    
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
        // EFFICIENCY FIX: Check if overview page is already processed before extracting links
        let shouldSkipOverview = false;
        if (useDatabaseSeen) {
          try {
            const { getPool } = require('./db/neon-client');
            const pool = getPool();
            const overviewCheck = await pool.query('SELECT url FROM pages WHERE url = $1', [url]);
            if (overviewCheck.rows.length > 0) {
              shouldSkipOverview = true;
              console.log(`  ⏭️  Skipping overview page (already processed): ${url.substring(0, 60)}...`);
            }
          } catch (e) {
            // Continue if check fails
          }
        }
        
        if (shouldSkipOverview) {
          maxPages--;
          continue; // Skip this overview page
        }
        
        console.log(`  🔍 Overview page detected: ${url.substring(0, 60)}...`);
        
        // OPTIMIZATION: Mark overview page as seen immediately to prevent re-processing
        // Don't wait for DB - mark in state first, then async mark in DB
        state.seen[url] = true;
        if (useDatabaseSeen) {
          markUrlSeen(url, null, depth).catch(() => {}); // Fire and forget - don't block
        }
        
        // Extract all program detail links from overview page
        let extractedFromOverview = 0;
        
        // OPTIMIZATION: Pre-filter links before processing to reduce work
        const candidateLinks: Array<{url: string, linkText: string, parentText: string}> = [];
        $('a[href]').each((_, a) => {
          const href = $(a).attr('href') || '';
          const full = normalizeUrl(url, href);
          if (!full) return;
          
          // OPTIMIZATION: Quick pre-filter - skip obvious non-program links
          if (full.includes('email-protection') || full.includes('cdn-cgi')) return;
          if (!sameHost(seed, full)) return;
          if (isDownload(full)) return;
          if (isQueryListing(full)) return;
          
          const linkText = $(a).text().toLowerCase().trim();
          const parentText = $(a).closest('article, .card, .program, .foerderung, .funding, [class*="program"], [class*="foerderung"], div, section').text().toLowerCase().trim();
          
          candidateLinks.push({ url: full, linkText, parentText });
        });
        
        // CRITICAL: Skip database check entirely for overview pages to prevent hanging
        // Just use cache and state.seen - much faster
        const allOverviewUrls = candidateLinks.map(l => l.url);
        let dbSeenUrls = new Set<string>();
        
        // OPTIMIZATION: Only use cache and JSON state - no database queries
        // This prevents hanging on slow database connections
        for (const full of allOverviewUrls) {
          const cached = seenUrlCache.get(full);
          if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
            if (cached.saved) {
              dbSeenUrls.add(full);
            }
          } else if (state.seen[full]) {
            // Check JSON state (fast, no DB query)
            dbSeenUrls.add(full);
          }
        }
        
        // OPTIMIZATION: Limit processing to prevent hanging on very large overview pages
        const maxLinksToProcess = 50; // Process max 50 links per overview page (reduced from 100)
        const linksToProcess = candidateLinks.slice(0, maxLinksToProcess);
        
        console.log(`  📋 Processing ${linksToProcess.length} links from overview page (${candidateLinks.length} total, limiting to ${maxLinksToProcess} for performance)`);
        
        let processedCount = 0;
        // Process each candidate link
        for (const { url: full, linkText, parentText } of linksToProcess) {
          processedCount++;
          // Log progress every 10 links to see where it might hang
          if (processedCount % 10 === 0) {
            console.log(`    ⏳ Processed ${processedCount}/${linksToProcess.length} links...`);
          }
          diagnostics.totalLinks++;
          
          if (full.includes('email-protection') || full.includes('cdn-cgi')) {
            diagnostics.rejected.emailProtection++;
            continue;
          }
          if (!sameHost(seed, full)) {
            diagnostics.rejected.differentHost++;
            continue;
          }
          // IMPROVEMENT: Early PDF/direct file detection - skip before processing
          if (isDownload(full)) {
            diagnostics.rejected.download++;
            continue;
          }
          // Also check for direct PDF links (even without .pdf extension)
          if (full.toLowerCase().includes('/pdf') || full.toLowerCase().includes('/document') || full.toLowerCase().match(/\.(pdf|docx?|xlsx?|pptx?)(?:$|[?#])/i)) {
            diagnostics.rejected.download++;
            continue;
          }
          // AUTONOMOUS: Check both JSON and database for seen URLs
          // BUT: Only skip if URL was actually SAVED (not just queued/rejected)
          const isSeenInJson = state.seen[full];
          
          // PERFORMANCE: Use batch-checked results instead of individual queries
          // CRITICAL: Simplified - just check if seen, don't check if saved (too slow)
          let wasSeen = false;
          if (useDatabaseSeen) {
            // Check cache first
            const cached = seenUrlCache.get(full);
            if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
              // If cached as saved, skip it
              if (cached.saved) {
                wasSeen = true;
              }
            } else if (dbSeenUrls.has(full)) {
              // If in seen table, skip it (but don't mark as saved unless we know)
              wasSeen = true;
            }
          }
          
          // Skip if URL was seen (either in JSON state or in database)
          // RELAXED: Don't check if saved - just check if seen to prevent rediscovery
          if (wasSeen || (isSeenInJson && !process.env.DATABASE_URL)) {
            diagnostics.rejected.alreadySeen++;
            continue;
          }
          
          // If URL was queued but not saved (rejected/failed), allow re-discovery
          // This allows re-trying URLs that were previously rejected
          if (isQueryListing(full)) {
            diagnostics.rejected.queryListing++;
            continue;
          }
          
          // SAFETY: Exclude invalid links first (keep strict filters)
          const urlLower = full.toLowerCase();
          const pathLower = new URL(full).pathname.toLowerCase();
          
          // IMPROVED: Better filtering for non-program pages
          // Check exclusion keywords - first check learned patterns, then fallback to hardcoded
          let hasExclusionKeyword = false;
          
          // Check learned exclusion keywords from database (if available)
          if (process.env.DATABASE_URL) {
            try {
              const { getInstitutionPatterns } = require('./db/institution-pattern-repository');
              const hostKey = new URL(full).hostname.replace('www.', '');
              const learnedExclusions = await getInstitutionPatterns(hostKey, 'exclusion_keyword', 0.4);
              
              for (const pattern of learnedExclusions) {
                if (urlLower.includes(pattern.pattern.toLowerCase()) || pathLower.includes(pattern.pattern.toLowerCase())) {
                  hasExclusionKeyword = true;
                  break;
                }
              }
            } catch (e) {
              // Fallback to hardcoded if database fails
            }
          }
          
          // Fallback to hardcoded exclusion keywords
          if (!hasExclusionKeyword) {
            hasExclusionKeyword = autoDiscoveryPatterns.exclusionKeywords.some(k => 
              urlLower.includes(k.toLowerCase()) || pathLower.includes(k.toLowerCase())
            );
          }
          // IMPROVED: More comprehensive exclusion patterns for non-program pages
          const isNonProgramPage = (
            urlLower.includes('/news/') || urlLower.includes('/press/') || 
            urlLower.includes('/contact/') || urlLower.includes('/kontakt/') ||
            urlLower.includes('/events/') || urlLower.includes('/veranstaltungen/') ||
            urlLower.includes('/veranstaltung/') || // Added: singular form
            urlLower.includes('events-workshop') || urlLower.includes('events-workshops') ||
            urlLower.includes('/success-stories/') || urlLower.includes('/success-story/') || // Added: success stories
            urlLower.includes('/success-stories') || urlLower.includes('/success-story') || // Without trailing slash
            urlLower.includes('/gefoerderte-projekte/') || urlLower.includes('/geförderte-projekte/') || // Added: funded projects
            urlLower.includes('/karriere/') || urlLower.includes('/career/') ||
            urlLower.includes('/jobs/') || urlLower.includes('/stellen/') ||
            urlLower.includes('/impressum/') || urlLower.includes('/imprint/') ||
            urlLower.includes('/datenschutz/') || urlLower.includes('/privacy/') ||
            urlLower.includes('/legal/') || urlLower.includes('/rechtliches/') ||
            urlLower.includes('/über-uns/') || urlLower.includes('/about/') ||
            urlLower.includes('/team/') || urlLower.includes('/mitarbeiter/') ||
            urlLower.includes('/aufsichtsrat/') || urlLower.includes('/management/') ||
            urlLower.includes('/organisation/') || urlLower.includes('/organization/') ||
            // CRITICAL: Exclude guidelines/policy pages (not funding programs)
            urlLower.includes('/richtlinien/') || urlLower.includes('/richtlinie/') ||
            urlLower.includes('/guidelines/') || urlLower.includes('/guideline/') ||
            urlLower.includes('/policy/') || urlLower.includes('/policies/') ||
            urlLower.includes('/bestimmungen/') || urlLower.includes('/bedingungen/') ||
            urlLower.includes('/terms/') || urlLower.includes('/conditions/') ||
            urlLower.includes('/regulations/') || urlLower.includes('/regeln/') ||
            urlLower.includes('/vorschriften/') || urlLower.includes('/standards/') ||
            urlLower.includes('/anleitung/') || urlLower.includes('/instructions/') ||
            urlLower.includes('/handbuch/') || urlLower.includes('/manual/')
          );
          // STRICTER: Exclude if it matches exclusion keywords OR is clearly a non-program page
          if (hasExclusionKeyword || isNonProgramPage) {
            diagnostics.rejected.exclusionKeyword++;
            continue;
          }
          
          // STRICT: For overview pages, ONLY accept links that:
          // 1. Are program detail pages (strict check via isProgramDetailPage) - REQUIRED
          // 2. AND pass learned pattern checks (if available)
          // 3. AND have funding keywords (additional validation)
          // REMOVED: Ultra-relaxed criteria that accepted anything with depth/keywords
          const contextText = linkText + ' ' + parentText.substring(0, 300);
          
          // ENHANCED: More comprehensive funding keyword patterns
          const fundingKeywordPattern = /(foerderung|förderung|funding|grant|programm|program|call|ausschreibung|finanzierung|financing|subvention|darlehen|kredit|loan|investition|innovation|research|forschung|startup|unternehmen|kmu|sme|beihilfe|subsidy|support|unterstützung|ausschreibungen|foerderungen|programme|equity|venture|seed|preseed|incubator|accelerator|fellowship|scholarship|stipendium|zuschuss|finanzhilfe|foerderbetrag|foerderhoehe|finanzierungsvolumen|fördervolumen|startup.grant|innovation.funding|digitalisierung|digitalization|ai.start|deep.tech|growth.investment|first.incubator|innovation.protection|erp.loan|guarantee|bürgschaft|innovation.voucher|bridge|collective.research|spin.off|diversitec|diversity|tech4people|international.market.entry|creative.industry|quality.of.life|startklar|ideenreich|wachstumsschritt|greensinvest|cybersicher|lebensnah)/i;
          const hasFundingKeyword = fundingKeywordPattern.test(urlLower) || fundingKeywordPattern.test(pathLower);
          const hasFundingInText = fundingKeywordPattern.test(linkText);
          const hasFundingInContext = fundingKeywordPattern.test(contextText);
          
          // CRITICAL: Must pass isProgramDetailPage check (uses learned patterns)
          const isDetailPage = await isProgramDetailPage(full);
          const isSameHost = sameHost(seed, full);
          
          // Check URL structure: URLs with depth (2+ path segments) are more likely to be program pages
          const urlPath = new URL(full).pathname;
          const pathSegments = urlPath.split('/').filter(s => s.length > 0);
          const hasUrlDepth = pathSegments.length >= 2; // Has at least 2 path segments
          
          // Navigation link check
          const isNavigationLink = linkText.match(/^(contact|kontakt|impressum|about|über|news|presse|press|legal|rechtliches|datenschutz|more|mehr|weiter|→|›|»|next|previous|back|zurück|home|start|index|sitemap)$/i);
          
          // STRICT: Only accept if:
          // 1. isProgramDetailPage() returns true (uses learned patterns and institution-specific rules)
          // 2. AND has funding keywords (additional validation)
          // 3. AND is same host (security)
          // 4. AND not navigation link
          // REMOVED: All the "ultra-relaxed" criteria that accepted anything
          if (isDetailPage && 
              isSameHost && 
              hasFundingKeyword && 
              !isQueryListing(full) && 
              !isNavigationLink) {
            state.seen[full] = true;
            // AUTONOMOUS: Mark as seen in database
            if (useDatabaseSeen) {
              await markUrlSeen(full, url, depth + 1);
            }
            state.jobs.push({ url: full, status: 'queued', depth: depth + 1, seed });
            extractedFromOverview++;
            diagnostics.accepted++;
            diagnostics.programsFoundByDepth[depth + 1] = (diagnostics.programsFoundByDepth[depth + 1] || 0) + 1;
            programsFoundAtCurrentDepth++;
          } else {
            diagnostics.rejected.notDetailPage++;
          }
        }
        console.log(`     Extracted ${extractedFromOverview} program links from overview page (${candidateLinks.length} total links, ${diagnostics.rejected.alreadySeen} already seen)`);
        if (extractedFromOverview === 0 && candidateLinks.length > 0) {
          // DEBUG: Show why links were rejected
          const sampleRejected = candidateLinks.slice(0, 5).map(l => l.url.substring(0, 60)).join(', ');
          console.log(`     ⚠️  Sample rejected URLs: ${sampleRejected}`);
        }
        maxPages--;
        continue; // Skip normal link processing for overview pages (already extracted links)
      }
      
      // Normal discovery: process links from non-overview pages
      // IMPROVEMENT: Check ALL links (not just first 100) for complete coverage
      const anchors = $('a[href]').toArray(); // Check all links for 100% coverage
      
      // Collect all links first, then batch-check database
      const allLinks: string[] = [];
      for (const a of anchors) {
        const href = $(a).attr('href') || '';
        const full = normalizeUrl(url, href);
        if (full) allLinks.push(full);
      }
      
      // AUTONOMOUS: Batch check database for seen URLs
      let dbSeenUrls = new Set<string>();
      let dbSavedUrls = new Set<string>(); // PERFORMANCE: Batch check which URLs were actually saved
      if (useDatabaseSeen && allLinks.length > 0) {
        dbSeenUrls = await checkUrlsSeen(allLinks);
        
        // PERFORMANCE: Batch check which seen URLs were actually saved to pages table
        if (dbSeenUrls.size > 0) {
          try {
            const { getPool } = require('./db/neon-client');
            const pool = getPool();
            // PERFORMANCE: Smaller batch size for reliability (100 instead of 500)
            const urlsToCheck = Array.from(dbSeenUrls).slice(0, 100); // Limit batch size for reliability
            if (urlsToCheck.length > 0) {
              const queryPromise = pool.query(
                `SELECT url FROM pages WHERE url IN (${urlsToCheck.map((_, i) => `$${i + 1}`).join(',')})`,
                urlsToCheck
              );
              const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Batch check timeout')), 5000)
              );
              const result = await Promise.race([queryPromise, timeoutPromise]) as any;
              if (result && result.rows) {
                result.rows.forEach((row: any) => {
                  dbSavedUrls.add(row.url);
                  // Update cache
                  seenUrlCache.set(row.url, { saved: true, timestamp: Date.now() });
                });
              }
            }
          } catch (e: any) {
            // If batch check fails, continue without it - fallback to individual checks if needed
            console.warn(`  ⚠️  Batch check failed, continuing with individual checks: ${e?.message || String(e)}`);
          }
        }
      }
      
      // Process each link
      for (const full of allLinks) {
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
        // AUTONOMOUS: Check both JSON and database for seen URLs
        // BUT: Only skip if URL was actually SAVED (not just queued/rejected)
        const isSeenInJson = state.seen[full];
        
        // PERFORMANCE: Use batch-checked results instead of individual queries
        let wasActuallySaved = false;
        if (useDatabaseSeen) {
          // Check cache first
          const cached = seenUrlCache.get(full);
          if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
            wasActuallySaved = cached.saved;
          } else if (dbSavedUrls.has(full)) {
            // Use batch-checked result
            wasActuallySaved = true;
            seenUrlCache.set(full, { saved: true, timestamp: Date.now() });
          }
        }
        
        // Only skip if URL was actually saved (not just queued/rejected)
        // PERFORMANCE: Skip expensive array check if using DB
        if (wasActuallySaved || (isSeenInJson && !process.env.DATABASE_URL && state.pages.some(p => p.url === full))) {
          diagnostics.rejected.alreadySeen++;
          continue;
        }
        
        // CRITICAL FIX: Only mark as seen if we're going to queue it
        // Don't mark as seen if we're going to skip it (already processed)
        // This prevents rediscovering URLs that were already processed
        
        // Check if URL was already processed (even if rejected)
        let wasAlreadyProcessed = false;
        if (useDatabaseSeen) {
          try {
            const { getPool } = require('./db/neon-client');
            const pool = getPool();
            // Check if URL was processed (scraped, even if rejected)
            const processedCheck = await pool.query(
              'SELECT url FROM seen_urls WHERE url = $1 AND processed = true',
              [full]
            );
            if (processedCheck.rows.length > 0) {
              wasAlreadyProcessed = true;
            }
          } catch (e) {
            // If check fails, continue
          }
        }
        
        // Skip if already processed (even if rejected)
        if (wasAlreadyProcessed) {
          diagnostics.rejected.alreadySeen++;
          continue;
        }
        
        // Mark as seen only if we're going to queue it
        state.seen[full] = true;
        // AUTONOMOUS: Mark as seen in database (batch later for performance)
        if (useDatabaseSeen) {
          await markUrlSeen(full, url, depth + 1);
        }
        
        // KEYWORD-BASED FILTERING
        const urlLower = full.toLowerCase();
        const pathLower = new URL(full).pathname.toLowerCase();
        
        // EXCLUDE: Skip if contains exclusion keywords
        const hasExclusionKeyword = autoDiscoveryPatterns.exclusionKeywords.some(k => 
          urlLower.includes(k.toLowerCase()) || pathLower.includes(k.toLowerCase())
        );
        // Also exclude events-workshop pages
        const isEventWorkshop = urlLower.includes('events-workshop') || urlLower.includes('events-workshops');
        
        // PATH-BASED EXCLUSIONS (stricter - check for patterns in URL path)
        const isNonProgramPath = (
          pathLower.includes('/success-stories/') ||
          pathLower.includes('/success-story/') ||
          pathLower.includes('/service/cases/') ||
          pathLower.includes('/gefoerderte-projekte/') ||
          pathLower.includes('/veranstaltung/') ||
          pathLower.includes('/veranstaltungen/') ||
          pathLower.includes('/event/') ||
          pathLower.includes('/events/')
        );
        
        if (hasExclusionKeyword || isEventWorkshop || isNonProgramPath) {
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
        
        // STRICT: Only accept URLs that pass isProgramDetailPage check (uses learned patterns)
        // This ensures we only discover URLs that match learned patterns or institution-specific rules
        const isDetailPage = await isProgramDetailPage(full);
        const hasRelevantContent = hasFundingKeyword || hasProgramKeyword || hasInstitutionKeyword;
        
        // STRICT: Only accept if:
        // 1. isProgramDetailPage() returns true (uses learned patterns)
        // 2. AND has relevant keywords (additional validation)
        // 3. AND not query listing
        // REMOVED: Relaxed acceptance that allowed anything with keywords
        if (isDetailPage && hasRelevantContent && !isQueryListing(full)) {
          state.seen[full] = true;
          // AUTONOMOUS: Mark as seen in database
          if (useDatabaseSeen) {
            await markUrlSeen(full, url, depth + 1);
          }
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
// QUALITY SCORING SYSTEM (STRICT CRITERIA)
// ============================================================================

/**
 * STRICT QUALITY DEFINITIONS - What pages MUST have to pass:
 * 
 * EXCELLENT (90-100): Complete program page
 *   - 4+ critical categories
 *   - Funding amount (min or max)
 *   - Deadline (or open deadline)
 *   → KEEP, SKIP (already perfect)
 * 
 * GOOD (70-89): Minimum viable program page
 *   - 3+ critical categories
 *   - Funding amount (min or max)
 *   → KEEP, SKIP (useful data exists)
 * 
 * FAIR (40-69): Incomplete program page
 *   - 2 critical categories OR (funding amount + 1 critical category)
 *   → RE-SCRAPE ONCE to improve, then save
 * 
 * POOR (0-39): Not a program page
 *   - Less than 2 critical categories AND no funding amount
 *   → REJECT immediately (don't save to database)
 * 
 * TARGET: 85-90% of pages should be GOOD+ quality after filtering
 * 
 * CRITICAL CATEGORIES (based on docs/REQUIREMENT_CATEGORIES_PRIORITY.md):
 * 
 * 🔴 CRITICAL (Must Have - Core Filtering):
 *   1. geographic - Question 1 (location) - Filters ~75% of programs
 *   2. eligibility - Question 2 (company_type) - Filters ~50% of remaining
 *   3. financial - Question 3 (funding_amount) - Always needed
 * 
 * 🟡 ESSENTIAL (Questions 4-8):
 *   4. use_of_funds - Question 4 (how funds can be used)
 *   5. team - Question 5 (team_size)
 *   6. impact - Question 6 (impact type)
 *   7. timeline - Questions 7 & 8 (deadline, project_duration)
 * 
 * Total critical+essential: 7 categories
 * Total categories available: 19
 */

export const CRITICAL_CATEGORIES = [
  'geographic',      // 🔴 CRITICAL - Question 1
  // Eligibility - split into subcategories
  'company_type', 'company_stage', 'industry_restriction', 'eligibility_criteria', // 🔴 CRITICAL - Question 2
  'financial',      // 🔴 CRITICAL - Question 3
  'use_of_funds',   // 🟡 ESSENTIAL - Question 4
  'team',           // 🟡 ESSENTIAL - Question 5
  // Impact - split into subcategories
  'environmental_impact', 'social_impact', 'economic_impact', 'innovation_impact', // 🟡 ESSENTIAL - Question 6
  'timeline'        // 🟡 ESSENTIAL - Questions 7-8
] as const;

export interface QualityScore {
  score: number; // 0-100
  tier: 'excellent' | 'good' | 'fair' | 'poor';
  shouldSkip: boolean; // Skip re-scraping if true
  shouldRescrape: boolean; // Re-scrape if true
  shouldSave: boolean; // Save to database if true (false = reject poor pages)
  reason: string; // Why this decision
}

export interface PageQualityData {
  reqCount: number;
  criticalCategories: number; // How many of the 5 critical categories
  hasAmount: boolean;
  hasDeadline: boolean;
  hasContact: boolean;
  totalCategories: number; // Out of 19 possible
  poorQualityAttempts?: number;
  isServiceProgram?: boolean; // Service programs don't require funding amount
}

/**
 * STRICT quality scoring - only passes pages that meet minimum program requirements
 */
export function calculatePageQuality(data: PageQualityData): QualityScore {
  const {
    criticalCategories,
    hasAmount,
    hasDeadline,
    hasContact,
    poorQualityAttempts = 0,
    isServiceProgram = false
  } = data;

  // INTELLIGENT: Service programs don't require funding amount
  // For service programs, quality is based on: eligibility, documents, timeline, contact, IP
  // For funding programs, quality is based on: funding amount + other criteria
  
  // TIER 1: EXCELLENT (90-100) - Complete program page
  // For funding programs: 5+ critical categories AND funding amount AND deadline
  // For service programs: 5+ critical categories AND deadline (no funding required)
  if (criticalCategories >= 5 && ((isServiceProgram && hasDeadline) || (!isServiceProgram && hasAmount && hasDeadline))) {
    return {
      score: 90 + Math.min(criticalCategories * 2, 10),
      tier: 'excellent',
      shouldSkip: true,
      shouldRescrape: false,
      shouldSave: true,
      reason: `Excellent: ${criticalCategories}/${isServiceProgram ? '10' : '13'} critical categories + funding + deadline (complete program page)`
    };
  }

  // TIER 2: GOOD (50-89) - Minimum viable program page
  // RELAXED: Require 1+ critical categories
  // For funding programs: funding amount preferred but not required
  // For service programs: funding amount not required
  if (criticalCategories >= 1) {
    const programType = isServiceProgram ? 'service' : 'funding';
    return {
      score: 50 + (criticalCategories * 10) + ((isServiceProgram ? 0 : hasAmount) ? 10 : 0) + (hasDeadline ? 5 : 0) + (hasContact ? 3 : 0), // Contact less important (3 instead of 5)
      tier: 'good',
      shouldSkip: true,
      shouldRescrape: false,
      shouldSave: true,
      reason: `Good: ${criticalCategories}/${isServiceProgram ? '10' : '13'} critical categories${isServiceProgram ? ' (service program)' : (hasAmount ? ' + funding amount' : ' (funding amount not required)')} (minimum viable ${programType} program)`
    };
  }

  // TIER 3: FAIR (40-69) - Incomplete program page
  // RELAXED: Require 1+ critical category OR funding amount (for funding programs)
  // For service programs: Require 1+ critical category (no funding required)
  // Accept pages with partial information
  if (criticalCategories >= 1 || (!isServiceProgram && hasAmount)) {
    // If page has 4+ critical categories, it's good enough - save it
    if (criticalCategories >= 4) {
      return {
        score: 60 + (criticalCategories * 5),
        tier: 'fair',
        shouldSkip: true,
        shouldRescrape: false,
        shouldSave: true, // 4+ categories is good enough to save
        reason: `Fair: ${criticalCategories}/13 critical categories${hasAmount ? ' + funding' : ''} (good enough to save)`
      };
    }
    
    // Check if we've already tried
    if (poorQualityAttempts >= 1) {
      // Already tried once, save it (might be useful but incomplete)
      return {
        score: 50,
        tier: 'fair',
        shouldSkip: true,
        shouldRescrape: false,
        shouldSave: true,
        reason: `Fair (after 1 attempt): ${criticalCategories}/13 critical categories${hasAmount ? ' + funding' : ''} (incomplete but saved)`
      };
    }
    
    // First attempt - try to improve
    return {
      score: 50 + (criticalCategories * 10),
      tier: 'fair',
      shouldSkip: false,
      shouldRescrape: true,
      shouldSave: false, // Don't save yet, re-scrape first
      reason: `Fair: ${criticalCategories}/13 critical categories${hasAmount ? ' + funding' : ''} (will re-scrape to improve)`
    };
  }

  // TIER 4: POOR (0-39) - Not a program page
  // For funding programs: REJECT if less than 2 critical categories OR no funding amount
  // For service programs: REJECT if less than 2 critical categories (no funding required)
  if (poorQualityAttempts >= 1) {
    // Already tried once - definitely not a program page
    const programType = isServiceProgram ? 'service' : 'funding';
    const maxCategories = isServiceProgram ? 6 : 7;
    return {
      score: 20,
      tier: 'poor',
      shouldSkip: true,
      shouldRescrape: false,
      shouldSave: false, // REJECT: Not a program page
      reason: `POOR: Rejected - Only ${criticalCategories}/${isServiceProgram ? '10' : '13'} critical categories${isServiceProgram ? '' : (hasAmount ? '' : ', no funding amount')} (not a ${programType} program page)`
    };
  }

  // First attempt at poor quality page - try once more
  const programType = isServiceProgram ? 'service' : 'funding';
  const maxCategories = isServiceProgram ? 6 : 7;
  return {
    score: 30,
    tier: 'poor',
    shouldSkip: false,
    shouldRescrape: true,
    shouldSave: false, // Don't save yet, try once more
      reason: `Poor (attempt 1/2): Only ${criticalCategories}/${isServiceProgram ? '10' : '13'} critical categories${isServiceProgram ? '' : (hasAmount ? '' : ', no funding amount')} (probably not a ${programType} program)`
  };
}

/**
 * Get quality data from database row
 */
export function getQualityDataFromRow(row: {
  req_count: number;
  critical_categories?: number;
  funding_amount_min?: number | null;
  funding_amount_max?: number | null;
  deadline?: string | null;
  open_deadline?: boolean;
  contact_email?: string | null;
  contact_phone?: string | null;
  total_categories?: number;
}): PageQualityData {
  return {
    reqCount: parseInt(row.req_count?.toString() || '0'),
    criticalCategories: row.critical_categories || 0,
    hasAmount: !!(row.funding_amount_min || row.funding_amount_max),
    hasDeadline: !!(row.deadline || row.open_deadline),
    hasContact: !!(row.contact_email || row.contact_phone),
    totalCategories: row.total_categories || 0
  };
}

// ============================================================================
// SCRAPING
// ============================================================================

export async function scrape(maxUrls = 10, targets: string[] = []): Promise<void> {
  // VERIFY DATABASE CONNECTION AT START
  if (process.env.DATABASE_URL) {
    try {
      const { testConnection } = require('./db/neon-client');
      // CRITICAL FIX: Add timeout to prevent hanging at start
      const testPromise = testConnection();
      const testTimeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Initial connection test timeout')), 5000)
      );
      const dbConnected = await Promise.race([testPromise, testTimeout]) as boolean;
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
  
  console.log(`  📊 Found ${jobs.length} queued jobs to process`);
  
  // SKIP URLs ALREADY IN DATABASE (prevent duplicate scraping)
  // Only check if DATABASE_URL is set and we're not explicitly rescraping
  if (process.env.DATABASE_URL && !targets.length && jobs.length > 0) {
    try {
      console.log(`  🔍 Checking database for existing URLs...`);
      const { getPool } = require('./db/neon-client');
      const { testConnection } = require('./db/neon-client');
      // CRITICAL FIX: Add timeout to prevent hanging
      const testPromise = testConnection();
      const testTimeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection test timeout')), 5000)
      );
      const dbConnected = await Promise.race([testPromise, testTimeout]).catch(() => false) as boolean;
      
      if (dbConnected) {
        const existingUrls = new Set<string>();
        const pool = getPool();
        
        // IMPROVEMENT: Check ALL URLs in batch (not just first 100) using bulk query
        // This is more efficient than one-by-one queries
        // FIX: Increased batch size to 500 to check more URLs (was 100, causing jobs to stay queued)
        const urlsToCheck = jobs.map(j => j.url).slice(0, 500); // Check up to 500 URLs per query
        
        if (urlsToCheck.length > 0) {
          console.log(`  🔍 Checking ${urlsToCheck.length} URLs against database (batch size: 500)...`);
          
          // Add timeout to database query (10 seconds)
          const queryPromise = pool.query(
            `SELECT p.url, p.id, 
              COUNT(r.id) as req_count,
              COUNT(DISTINCT CASE WHEN r.category IN ('geographic', 'eligibility', 'financial', 'use_of_funds', 'team', 'impact', 'timeline') THEN r.category END) as critical_categories,
              COUNT(DISTINCT r.category) as total_categories,
              p.funding_amount_min, p.funding_amount_max,
              p.deadline, p.open_deadline,
              p.contact_email, p.contact_phone
             FROM pages p
             LEFT JOIN requirements r ON p.id = r.page_id
             WHERE p.url IN (${urlsToCheck.map((_, i) => `$${i + 1}`).join(',')})
             GROUP BY p.id, p.url, p.funding_amount_min, p.funding_amount_max, p.deadline, p.open_deadline, p.contact_email, p.contact_phone`,
            urlsToCheck
          );
          
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Database query timeout after 10s')), 10000)
          );
          
          let result;
          try {
            result = await Promise.race([queryPromise, timeoutPromise]) as any;
            console.log(`  ✅ Found ${result.rows.length} existing pages in database`);
          } catch (queryError: any) {
            if (queryError.message.includes('timeout')) {
              console.warn(`  ⏱️  Database query timeout - skipping database check, will scrape all`);
              result = { rows: [] };
            } else {
              throw queryError;
            }
          }
          
          // SMART QUALITY-BASED SKIPPING: Use tiered scoring system
          // (calculatePageQuality is now in this file)
          
          // FIX: Track all URLs that should be skipped (including duplicates)
          const urlsToSkip = new Set<string>();
          
          for (const row of result.rows) {
            // Use pre-calculated values from the query (no additional queries needed!)
            const criticalCategories = parseInt(row.critical_categories || '0');
            const totalCategories = parseInt(row.total_categories || '0');
            
            // Build quality data (use pre-calculated values)
            const qualityData = {
              reqCount: parseInt(row.req_count || '0'),
              criticalCategories,
              hasAmount: !!(row.funding_amount_min || row.funding_amount_max),
              hasDeadline: !!(row.deadline || row.open_deadline),
              hasContact: !!(row.contact_email || row.contact_phone),
              totalCategories,
              poorQualityAttempts: 0 // Will be set from job if exists
            };
            
            // FIX: Find ALL jobs with this URL (not just first one) to prevent duplicates
            const jobsWithUrl = jobs.filter(j => j.url === row.url);
            
            for (const job of jobsWithUrl) {
              qualityData.poorQualityAttempts = (job as any).poorQualityAttempts || 0;
              
              // Calculate quality score
              const quality = calculatePageQuality(qualityData);
              
              // Decision: Skip or re-scrape based on quality tier
              if (quality.shouldSkip) {
                // If it's poor quality, we should re-scrape to potentially remove it (not skip)
                if (quality.tier === 'poor' && quality.score < 30) {
                  // Poor quality page - re-scrape to see if we can improve or remove it
                  console.log(`  🔄 Will re-scrape poor quality (${quality.score}/100) to potentially remove: ${row.url.slice(0, 60)}... - ${quality.reason}`);
                  if (job === jobsWithUrl[0]) {
                    (job as any).poorQualityAttempts = (qualityData.poorQualityAttempts || 0) + 1;
                    // Don't skip - let it re-scrape
                  } else {
                    job.status = 'done';
                    urlsToSkip.add(row.url);
                  }
                } else {
                  // Good quality - skip (no update needed)
                  urlsToSkip.add(row.url);
                  existingUrls.add(row.url);
                  job.status = 'done';
                  if (quality.tier === 'poor') {
                    console.log(`  ⏭️  Skipping ${quality.tier} quality (${quality.score}/100): ${row.url.slice(0, 60)}... - ${quality.reason}`);
                  }
                }
              } else if (quality.shouldRescrape) {
                // Mark for re-scraping (only keep first job, mark others as done to prevent duplicates)
                if (job === jobsWithUrl[0]) {
                  (job as any).poorQualityAttempts = (qualityData.poorQualityAttempts || 0) + 1;
                  console.log(`  🔄 Will re-scrape ${quality.tier} quality (${quality.score}/100): ${row.url.slice(0, 60)}... - ${quality.reason}`);
                } else {
                  // Duplicate job - mark as done
                  job.status = 'done';
                  urlsToSkip.add(row.url);
                }
              }
            }
          }
          
          // FIX: Filter out ALL jobs with URLs that should be skipped (including duplicates)
          jobs = jobs.filter(j => !urlsToSkip.has(j.url) && !existingUrls.has(j.url));
          
          if (existingUrls.size > 0) {
            console.log(`  ⏭️  Skipped ${existingUrls.size} URLs already in database with good data quality`);
          }
          console.log(`  📊 ${jobs.length} jobs remaining after database check`);
          
          // CRITICAL FIX: Pool is singleton, don't close it - just ensure connections are released
          // The pool manages connections automatically, we just need to ensure queries complete
        }
      } else {
        console.log(`  ⚠️  Database not connected - will scrape all ${jobs.length} jobs`);
      }
    } catch (e: any) {
      // If DB check fails, continue with all jobs (don't block scraping)
      console.warn(`  ⚠️  Could not check database for existing URLs: ${e.message} - continuing with all jobs`);
    }
  } else if (jobs.length === 0) {
    console.log(`  ℹ️  No jobs to check (jobs list is empty)`);
  }
  
  // Apply target filter if provided
  if (targets.length > 0) {
    jobs = jobs.filter(j => targets.some(t => j.url.includes(t)));
  }
  
  // FIX: Limit to maxUrls BEFORE processing (was limiting but jobs were already filtered)
  // This ensures we only process the requested number of jobs
  const originalJobsCount = jobs.length;
  jobs = jobs.slice(0, maxUrls);
  
  if (jobs.length === 0) {
    console.log(`📋 No jobs to scrape (all already processed or skipped)`);
    return;
  }
  
  // FIX: Log if we're limiting the batch size
  if (originalJobsCount > maxUrls) {
    console.log(`📋 Scraping ${jobs.length} jobs (limited from ${originalJobsCount} queued jobs by maxUrls=${maxUrls})...`);
  } else {
    console.log(`📋 Scraping ${jobs.length} jobs...`);
  }
  const scrapeStartTime = Date.now();

  for (let i = 0; i < jobs.length; i++) {
    const job = jobs[i];
    const jobStartTime = Date.now();
    (job as any).status = 'running';
    console.log(`  [${i + 1}/${jobs.length}] Processing: ${job.url.substring(0, 60)}...`);
    try {
      // Filter query parameter URLs during scraping too (catch URLs added before fix)
      if (isQueryListing(job.url)) {
        console.log(`  ⚠️  Skipping query parameter URL: ${job.url.slice(0, 60)}...`);
        (job as any).status = 'failed';
        (job as any).lastError = 'Query parameter listing page (filtered)';
        continue;
      }
      
      // Add timeout to prevent hanging (30 seconds per page)
      let fetchResult;
      try {
        console.log(`    🔍 Fetching HTML...`);
        const fetchPromise = fetchHtml(job.url);
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Fetch timeout after 30s')), 30000)
        );
        fetchResult = await Promise.race([fetchPromise, timeoutPromise]) as any;
        const fetchTime = ((Date.now() - jobStartTime) / 1000).toFixed(1);
        console.log(`    ✅ HTML fetched in ${fetchTime}s`);
      } catch (fetchError: any) {
        if (fetchError.message.includes('timeout')) {
          console.log(`  ⏱️  Timeout fetching ${job.url.substring(0, 60)}...`);
          (job as any).status = 'failed';
          (job as any).lastError = 'Fetch timeout';
          continue;
        }
        throw fetchError;
      }
      
      // COMPREHENSIVE ERROR HANDLING: Wrap extraction in try-catch to prevent .rea errors
      let meta;
      try {
        console.log(`    🔍 Extracting metadata...`);
        const extractStartTime = Date.now();
        
        // MEMORY: Limit HTML size for very large pages (prevent memory exhaustion)
        const htmlSize = fetchResult.html.length;
        const MAX_HTML_SIZE = 2 * 1024 * 1024; // 2MB limit for extraction
        let htmlToProcess = fetchResult.html;
        if (htmlSize > MAX_HTML_SIZE) {
          console.log(`    ⚠️  Large HTML (${(htmlSize / 1024 / 1024).toFixed(1)}MB), truncating to 2MB for faster extraction...`);
          htmlToProcess = fetchResult.html.substring(0, MAX_HTML_SIZE);
        }
        
        // MEMORY: Extract metadata and immediately clear large HTML from memory
        // PERFORMANCE: Increase timeout to 30s for complex pages (was 15s)
        // Extraction can be slow on pages with many regex patterns
        // FIX: extractMeta is now async to support learned patterns (quality improvement on retry)
        const extractPromise = extractMeta(htmlToProcess, job.url);
        const extractTimeout = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Extraction timeout after 30s')), 30000)
        );
        meta = await Promise.race([extractPromise, extractTimeout]) as any;
        const extractTime = ((Date.now() - extractStartTime) / 1000).toFixed(1);
        console.log(`    ✅ Metadata extracted in ${extractTime}s`);
        
        // MEMORY: Clear large HTML strings after extraction to free memory
        htmlToProcess = '' as any;
        if (fetchResult.html && fetchResult.html.length > 500000) {
          (fetchResult as any).html = null; // Allow GC to reclaim memory
        }
        
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
        
        // FIX: Validate deadline - only keep pages with future deadlines (not past)
        // Don't scrape pages with past deadlines - they're expired
        if (meta.deadline) {
          // Check if deadline is reasonable (not a year like "2025")
          if (/^\d{4}$/.test(meta.deadline.trim())) {
            meta.deadline = null;
          } else {
            // VALIDATION: Check if deadline is in the past (expired)
            try {
              // Parse deadline (format: DD.MM.YYYY)
              const deadlineMatch = meta.deadline.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
              if (deadlineMatch) {
                const d = parseInt(deadlineMatch[1], 10);
                const mo = parseInt(deadlineMatch[2], 10);
                const y = parseInt(deadlineMatch[3], 10);
                const deadlineDate = new Date(y, mo - 1, d);
                const now = new Date();
                now.setHours(0, 0, 0, 0); // Compare dates only, not times
                deadlineDate.setHours(0, 0, 0, 0);
                
                // FIX: If deadline is in the past, reject the page (don't scrape expired programs)
                if (deadlineDate < now) {
                  const daysPast = Math.floor((now.getTime() - deadlineDate.getTime()) / (1000 * 60 * 60 * 24));
                  console.log(`  ❌ REJECTED: Deadline in past (${daysPast} days ago): ${meta.deadline} - skipping expired program`);
                  
                  // Mark job as failed and mark URL as processed
                  (job as any).status = 'failed';
                  (job as any).lastError = `Rejected: Deadline expired (${daysPast} days ago)`;
                  
                  // Mark as processed to prevent rediscovery
                  try {
                    const { markUrlProcessed } = require('./db/seen-urls-repository');
                    await markUrlProcessed(job.url);
                  } catch (e) {
                    // Silently fail
                  }
                  
                  continue; // Skip this page - don't save it
                }
              }
            } catch (e) {
              // Invalid date format, skip validation
            }
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
            
            // ENHANCED: Try to extract basic requirements even with partial extraction
            const text = fetchResult.html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
            let partialRequirements: Record<string, any[]> = {};
            
            // Try to extract at least some basic requirements
            try {
              const { extractAllRequirements } = require('./extract');
              partialRequirements = await extractAllRequirements(text, fetchResult.html, job.url);
            } catch (reqError) {
              // Requirements extraction also failed, use empty
              partialRequirements = {};
            }
            
            meta = {
              title: title.trim() || null,
              description: description.trim() || null,
              funding_amount_min: null,
              funding_amount_max: null,
              deadline: null,
              contact_email: null,
              contact_phone: null,
              categorized_requirements: partialRequirements, // Use partial requirements if available
              metadata_json: {}
            };
            
            console.log(`  ⚠️  Extracted minimal metadata (full extraction failed, but have ${Object.keys(partialRequirements).length} requirement categories)`);
          } catch (fallbackError: any) {
            // Even fallback failed - create minimal page with just URL and title
            const $ = require('cheerio').load(fetchResult.html);
            const title = $('title').text() || $('h1').first().text() || job.url;
            
            meta = {
              title: title.trim() || job.url,
              description: null,
              funding_amount_min: null,
              funding_amount_max: null,
              deadline: null,
              contact_email: null,
              contact_phone: null,
              categorized_requirements: {}, // Empty but still save
              metadata_json: {}
            };
            
            console.log(`  ⚠️  Using minimal fallback (title only) - will still try to save if quality check passes`);
          }
        } else {
          throw new Error(`Extraction failed: ${errorMsg}`);
        }
      }
      
      // CRITICAL FIX: Skip overview pages - don't save them as program pages
      // Overview pages are listing pages, not actual program pages
      try {
        const { isOverviewPage } = require('./utils');
        const isOverview = isOverviewPage(job.url, fetchResult.html);
        if (isOverview) {
          console.log(`  ⚠️  Skipping overview page (not a program detail page): ${job.url.slice(0, 60)}...`);
          (job as any).status = 'failed';
          (job as any).lastError = 'Overview page (not a program detail page)';
          continue; // Don't save overview pages
        }
      } catch (e) {
        // Continue if check fails
      }
      
      // VALIDATE: Check for suspicious funding amounts
      if (meta.funding_amount_min && meta.funding_amount_max) {
        if (meta.funding_amount_min === meta.funding_amount_max && meta.funding_amount_min < 1000) {
          console.log(`  ⚠️  Suspicious funding amount: ${meta.funding_amount_min}-${meta.funding_amount_max} EUR (min === max and < 1000)`);
          // Flag but don't reject - might be correct for small programs
        }
        if (meta.funding_amount_min > meta.funding_amount_max) {
          console.log(`  ⚠️  Invalid funding range: ${meta.funding_amount_min} > ${meta.funding_amount_max}`);
          // Swap if min > max
          const temp = meta.funding_amount_min;
          meta.funding_amount_min = meta.funding_amount_max;
          meta.funding_amount_max = temp;
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
      
      // ENHANCED: Extract funding amounts from financial requirements and update metadata
      // This ensures amounts found in descriptions are also in metadata
      if (meta.categorized_requirements && meta.categorized_requirements.financial && meta.categorized_requirements.financial.length > 0) {
        const financialAmounts: number[] = [];
        meta.categorized_requirements.financial.forEach((f: any) => {
          if (f.type === 'funding_amount_min' || f.type === 'funding_amount_max') {
            const numValue = Number(f.value);
            if (!isNaN(numValue) && numValue >= 100 && numValue <= 1_000_000_000_000) {
              financialAmounts.push(numValue);
            }
          }
        });
        
        if (financialAmounts.length > 0) {
          // Update metadata if not already set or if we found better values
          if (!rawMetadata.funding_amount_min || (Math.min(...financialAmounts) < (rawMetadata.funding_amount_min || Infinity))) {
            rawMetadata.funding_amount_min = Math.min(...financialAmounts);
          }
          if (!rawMetadata.funding_amount_max || (Math.max(...financialAmounts) > (rawMetadata.funding_amount_max || 0))) {
            rawMetadata.funding_amount_max = Math.max(...financialAmounts);
          }
        }
      }
      
      const rec = normalizeMetadata(rawMetadata);
      
        // RELAXED QUALITY CHECK: Accept pages with partial data (extraction errors are OK)
        // Only reject if we have absolutely nothing useful
        const hasMinimumData = !!(
          rec.url && rec.url.length > 10 &&
          (rec.title && rec.title.trim().length > 3) // Relaxed: only need 3 chars for title
        );
        
        // ENHANCED: Also accept if we have any requirements (even if title/description are minimal)
        const hasAnyRequirements = Object.keys(rec.categorized_requirements || {}).length > 0;
        const hasAnyMetadata = !!(rec.funding_amount_min || rec.funding_amount_max || rec.deadline || rec.open_deadline || rec.contact_email || rec.contact_phone);
        
        if (!hasMinimumData && !hasAnyRequirements && !hasAnyMetadata) {
          const poorQualityAttempts = ((job as any).poorQualityAttempts || 0) + 1;
          const MAX_POOR_QUALITY_ATTEMPTS = 2;
          
          if (poorQualityAttempts >= MAX_POOR_QUALITY_ATTEMPTS) {
            console.log(`  ⚠️  Skipping page with no usable data (${poorQualityAttempts} attempts): ${job.url.slice(0, 60)}...`);
            (job as any).status = 'failed';
            (job as any).lastError = 'Insufficient data quality after multiple attempts';
            
            // CRITICAL: Mark as processed even if rejected (prevents rediscovery)
            try {
              const { markUrlProcessed } = require('./db/seen-urls-repository');
              await markUrlProcessed(job.url);
            } catch (e) {
              // Silently fail
            }
          } else {
            console.log(`  ⚠️  Page with minimal data (attempt ${poorQualityAttempts}/${MAX_POOR_QUALITY_ATTEMPTS}), will retry: ${job.url.slice(0, 60)}...`);
            (job as any).status = 'queued'; // Re-queue for retry
            (job as any).poorQualityAttempts = poorQualityAttempts;
          }
          continue;
        }
        
        // SMART QUALITY CHECK: Use tiered scoring system
        // (calculatePageQuality is now in this file)
        
        // INTELLIGENT: Detect service programs (no funding amount) vs funding programs
        // Service programs: AMS, IP services, consulting, advisory - don't require funding amount
        const lowerText = (rec.description || rec.title || '').toLowerCase();
        const lowerUrl = job.url.toLowerCase();
        const serviceKeywords = [
          'beratung', 'consulting', 'advisory', 'service',
          'intellectual property', 'ip', 'patent', 'geistiges eigentum',
          'employment', 'beschäftigung', 'ams', 'arbeitsmarkt',
          'support', 'unterstützung', 'assistance', 'hilfe'
        ];
        const hasServiceKeywords = serviceKeywords.some(k => 
          lowerText.includes(k) || lowerUrl.includes(k)
        );
        const hasFundingAmount = !!(rec.funding_amount_min || rec.funding_amount_max);
        const isServiceProgram = hasServiceKeywords && !hasFundingAmount;
        const isHybridProgram = hasServiceKeywords && hasFundingAmount;
        
        // For service programs, use different critical categories (don't require financial)
        // Updated to use split categories
        const criticalCategoriesForFunding = [
          'geographic', 
          'company_type', 'company_stage', 'industry_restriction', 'eligibility_criteria', // Eligibility split
          'financial', 
          'use_of_funds', 
          'team', 
          'environmental_impact', 'social_impact', 'economic_impact', 'innovation_impact', // Impact split
          'timeline'
        ];
        const criticalCategoriesForService = [
          'company_type', 'company_stage', 'industry_restriction', 'eligibility_criteria', // Eligibility split
          'documents', 
          'timeline', 
          'geographic', 
          'intellectual_property', 
          'team'
        ];
        
        const criticalCategories = (isServiceProgram || isHybridProgram 
          ? criticalCategoriesForService 
          : criticalCategoriesForFunding).filter(
          cat => (rec.categorized_requirements?.[cat] || []).length > 0
        ).length;
        
        const qualityData = {
          reqCount: Object.values(rec.categorized_requirements || {}).flat().length,
          criticalCategories,
          hasAmount: hasFundingAmount,
          hasDeadline: !!(rec.deadline || rec.open_deadline),
          hasContact: !!(rec.contact_email || rec.contact_phone),
          totalCategories: Object.keys(rec.categorized_requirements || {}).filter(
            cat => (rec.categorized_requirements?.[cat] || []).length > 0
          ).length,
          poorQualityAttempts: (job as any).poorQualityAttempts || 0,
          isServiceProgram: isServiceProgram || isHybridProgram // Don't require funding amount for service programs
        };
        
        const quality = calculatePageQuality(qualityData);
        
        // Log quality assessment
        console.log(`  📊 Quality: ${quality.tier.toUpperCase()} (${quality.score}/100) - ${quality.reason}`);
        
        // Decision based on quality tier - CRITICAL: Don't save poor pages
        // ONLY ACCEPTABLE PROGRAMS ARE SAVED TO DATABASE
        if (!quality.shouldSave) {
          // Page is too poor quality - don't save to database
          if (quality.tier === 'poor' && quality.shouldRescrape) {
            // Poor quality, will retry
            console.log(`  ⚠️  Poor quality (attempt ${qualityData.poorQualityAttempts + 1}/2), will retry: ${job.url.slice(0, 60)}...`);
            (job as any).status = 'queued'; // Re-queue for retry
            (job as any).poorQualityAttempts = qualityData.poorQualityAttempts + 1;
            continue; // Don't save yet, retry
          } else if (quality.tier === 'poor' && quality.shouldSkip) {
            // Poor quality after max attempts - REJECT (don't save)
            console.log(`  ❌ REJECTED: Poor quality after ${qualityData.poorQualityAttempts} attempts - NOT saving to database (only acceptable programs saved): ${job.url.slice(0, 60)}...`);
            
            // FIX: Remove existing poor quality page from database if it exists (cleanup bad data)
            try {
              const { getPool } = require('./db/neon-client');
              const pool = getPool();
              const existingPageResult = await pool.query('SELECT id FROM pages WHERE url = $1', [job.url]);
              if (existingPageResult.rows.length > 0) {
                const pageId = existingPageResult.rows[0].id;
                // Delete poor quality page and its requirements
                await pool.query('DELETE FROM requirements WHERE page_id = $1', [pageId]);
                await pool.query('DELETE FROM pages WHERE id = $1', [pageId]);
                console.log(`  🗑️  Removed existing poor quality page from database: ${job.url.slice(0, 60)}...`);
              }
            } catch (e: any) {
              // Silently fail - don't break scraping if cleanup fails
              console.warn(`  ⚠️  Could not remove poor quality page: ${e.message}`);
            }
            
            (job as any).status = 'failed';
            (job as any).lastError = `Rejected: Poor quality - ${quality.reason}`;
            
            // CRITICAL: Mark as processed even if rejected (prevents rediscovery)
            try {
              const { markUrlProcessed } = require('./db/seen-urls-repository');
              await markUrlProcessed(job.url);
            } catch (e) {
              // Silently fail
            }
            
            continue; // Don't save - reject poor pages (only acceptable programs in DB)
          } else if (quality.tier === 'fair' && quality.shouldRescrape) {
            // Fair quality, will retry
            console.log(`  ⚠️  Fair quality, will re-scrape: ${job.url.slice(0, 60)}...`);
            (job as any).status = 'queued';
            (job as any).poorQualityAttempts = qualityData.poorQualityAttempts + 1;
            continue; // Don't save yet, retry
          }
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
        // CRITICAL FIX: Add timeout to testConnection call to prevent hanging
        console.log(`    🔍 Testing database connection...`);
        const testConnectionPromise = testConnection();
        const testConnectionTimeout = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Connection test timeout after 5s')), 5000)
        );
        
        let connectionOk: boolean;
        try {
          connectionOk = await Promise.race([testConnectionPromise, testConnectionTimeout]) as boolean;
        } catch (e: any) {
          if (e.message && e.message.includes('timeout')) {
            throw new Error('Database connection test timeout - database may be slow');
          }
          connectionOk = false;
        }
        
        if (!connectionOk) {
          throw new Error('Database connection test failed');
        }
        console.log(`    ✅ Database connection OK`);
        
        // Use atomic transaction to ensure page + requirements are saved together
        // CRITICAL FIX: Add timeout to prevent hanging on database save (30 seconds max)
        console.log(`    💾 Attempting to save to database...`);
        const saveStartTime = Date.now();
        
        const savePromise = savePageWithRequirements(rec);
        const saveTimeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Database save timeout after 30s')), 30000)
        );
        
        let pageId: number;
        try {
          pageId = await Promise.race([savePromise, saveTimeoutPromise]) as number;
          const saveTime = ((Date.now() - saveStartTime) / 1000).toFixed(1);
          console.log(`  ⏱️  Database save completed in ${saveTime}s`);
        } catch (saveError: any) {
          if (saveError.message.includes('timeout')) {
            throw new Error(`Database save timeout after 30s - connection may be exhausted`);
          }
          throw saveError;
        }
        
        // Mark job done with timeout
        const markDonePromise = markJobDone(job.url);
        const markDoneTimeout = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Mark job done timeout after 10s')), 10000)
        );
        await Promise.race([markDonePromise, markDoneTimeout]);
        
        // AUTONOMOUS: Mark URL as processed in seen_urls table
        try {
          const { markUrlProcessed } = require('./db/seen-urls-repository');
          await markUrlProcessed(job.url);
        } catch (e) {
          // Silently fail if table doesn't exist
        }
        
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
        
        // LEARNING: Learn institution-specific URL patterns from successful pages
        try {
          const { learnUrlPatternFromPage } = require('./db/institution-pattern-repository');
          const host = new URL(job.url).hostname.replace('www.', '');
          const quality = getQualityDataFromRow({
            req_count: Object.values(rec.categorized_requirements || {}).reduce((sum: number, arr: any[]) => sum + (Array.isArray(arr) ? arr.length : 0), 0),
            critical_categories: Object.keys(rec.categorized_requirements || {}).filter(cat => 
              ['eligibility', 'financial', 'documents', 'timeline', 'project'].includes(cat)
            ).length,
            funding_amount_min: rec.funding_amount_min,
            funding_amount_max: rec.funding_amount_max,
            deadline: rec.deadline,
            open_deadline: rec.open_deadline,
            contact_email: rec.contact_email,
            contact_phone: rec.contact_phone
          });
          const qualityScore = calculatePageQuality(quality);
          const isGoodPage = qualityScore.tier === 'excellent' || qualityScore.tier === 'good';
          await learnUrlPatternFromPage(job.url, host, isGoodPage);
        } catch (e) {
          // Silently fail
        }
        
        // PERFORMANCE: Update cache when page is saved
        seenUrlCache.set(job.url, { saved: true, timestamp: Date.now() });
        
        // Also update local state for compatibility (only if not using DB)
        if (!process.env.DATABASE_URL) {
          state.pages = state.pages.filter(p => p.url !== job.url);
          state.pages.push(rec as any);
        }
        (job as any).status = 'done';
        
        // PERFORMANCE: Don't save state after every job - save at end of batch
        // State is saved at end of scrape() function
        
        const recHasMeta = !!(rec.funding_amount_min || rec.funding_amount_max || rec.deadline || rec.contact_email || rec.contact_phone);
        const jobTime = ((Date.now() - jobStartTime) / 1000).toFixed(1);
        if (recHasMeta) {
          console.log(`  ✅ Saved to DB (ID: ${pageId}) in ${jobTime}s: ${rec.funding_amount_min || 'N/A'}-${rec.funding_amount_max || 'N/A'} EUR, deadline: ${rec.deadline || (rec.open_deadline ? 'Open' : 'N/A')}`);
        } else {
          console.log(`  ✅ Saved to DB (ID: ${pageId}) in ${jobTime}s: ${job.url.slice(0, 60)}...`);
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
      const errorMsg = (e?.message || String(e)).slice(0, 100);
      
      if (errorMsg.includes('timeout')) {
        // Timeout errors - don't retry, just mark as failed
        (job as any).status = 'failed';
        (job as any).lastError = errorMsg;
        console.log(`  ⏱️  ${job.url.slice(0, 60)}... (timeout - skipping)`);
      } else if (attempts < 3) {
        (job as any).status = 'queued';
        (job as any).attempts = attempts;
        (job as any).lastError = errorMsg;
        console.log(`  ⚠️  ${job.url.slice(0, 60)}... (retry ${attempts}/3: ${errorMsg.slice(0, 40)})`);
      } else {
        (job as any).status = 'failed';
        (job as any).lastError = errorMsg;
        console.log(`  ❌ ${job.url.slice(0, 60)}... (failed after 3 attempts: ${errorMsg.slice(0, 40)})`);
      }
      
      // CRITICAL: Mark URL as processed even if failed (prevents rediscovery)
      try {
        const { markUrlProcessed } = require('./db/seen-urls-repository');
        await markUrlProcessed(job.url);
      } catch (e) {
        // Silently fail if table doesn't exist
      }
    }
  }

  const totalScrapeTime = ((Date.now() - scrapeStartTime) / 1000).toFixed(1);
  console.log(`📊 Scraping complete: ${jobs.length} jobs processed in ${totalScrapeTime}s`);

  // PERFORMANCE: Clear stale cache entries periodically
  clearStaleCache();
  
  // PERFORMANCE: Save state once at end of batch (not after each job)
  saveState(state);

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
    // Updated to use split categories
    const criticalCategories = [
      'company_type', 'company_stage', 'industry_restriction', 'eligibility_criteria', // Eligibility split
      'financial', 
      'documents', 
      'innovation_focus', 'technology_area', 'research_domain', 'sector_focus', // Project split
      'timeline'
    ];
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
  
  // PERFORMANCE: State already saved above, just log final count
  const finalPageCount = process.env.DATABASE_URL ? 'in database' : state.pages.length;
  console.log(`💾 Final state: ${state.jobs.filter(j => j.status === 'queued').length} queued jobs, ${finalPageCount} pages`);
}


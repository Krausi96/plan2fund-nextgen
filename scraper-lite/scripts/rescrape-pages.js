#!/usr/bin/env node
/**
 * Re-scrape existing pages to populate metadata with the fixed normalizeMetadata function.
 * 
 * This script:
 * 1. Loads existing pages from state.json
 * 2. Re-queues them for scraping (if not already queued)
 * 3. Optionally filters to pages without metadata
 * 
 * Usage:
 *   node scripts/rescrape-pages.js                    # Re-queue all pages
 *   node scripts/rescrape-pages.js --missing-only     # Only pages without metadata
 *   node scripts/rescrape-pages.js --dry-run          # Show what would be queued
 */

require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'commonjs', moduleResolution: 'node', esModuleInterop: true } });

const fs = require('fs');
const path = require('path');
const { loadState, saveState } = require('../src/scraper.ts');

const dataDir = path.join(__dirname, '..', 'data', 'lite');
const statePath = path.join(dataDir, 'state.json');

function hasMetadata(page) {
  return !!(page.funding_amount_min || page.funding_amount_max || page.deadline || 
           page.contact_email || page.contact_phone);
}

async function main() {
  const args = process.argv.slice(2);
  const missingOnly = args.includes('--missing-only');
  const dryRun = args.includes('--dry-run');
  
  console.log('🔄 Re-scraping Pages Script\n');
  
  const state = loadState();
  const pages = state.pages || [];
  const jobs = state.jobs || [];
  
  // Get URLs already queued or running
  const activeJobUrls = new Set(
    jobs
      .filter(j => j.status === 'queued' || j.status === 'running')
      .map(j => j.url)
  );
  
  // Get URLs of done/failed jobs (for seed URL tracking)
  const existingJobUrls = new Set(jobs.map(j => j.url));
  
  // Filter pages to re-scrape
  let pagesToRescrape = pages;
  if (missingOnly) {
    pagesToRescrape = pages.filter(p => !hasMetadata(p));
    console.log(`📋 Filtering to pages without metadata...`);
  }
  
  // Remove pages that are already queued
  pagesToRescrape = pagesToRescrape.filter(p => !activeJobUrls.has(p.url));
  
  console.log(`📊 Current State:`);
  console.log(`   Total pages: ${pages.length}`);
  console.log(`   Pages with metadata: ${pages.filter(hasMetadata).length} (${Math.round(pages.filter(hasMetadata).length / pages.length * 100)}%)`);
  console.log(`   Active jobs (queued/running): ${activeJobUrls.size}`);
  console.log(`   Pages to re-scrape: ${pagesToRescrape.length}`);
  
  if (dryRun) {
    console.log(`\n🔍 DRY RUN - Would queue ${pagesToRescrape.length} pages:`);
    pagesToRescrape.slice(0, 10).forEach(p => {
      console.log(`   - ${p.url.slice(0, 80)}...`);
    });
    if (pagesToRescrape.length > 10) {
      console.log(`   ... and ${pagesToRescrape.length - 10} more`);
    }
    console.log(`\n✅ Run without --dry-run to actually queue these pages`);
    return;
  }
  
  if (pagesToRescrape.length === 0) {
    console.log(`\n✅ No pages to re-scrape (all are already queued or have metadata)`);
    return;
  }
  
  // Find seed URLs for each page (try to match from existing jobs or use a default)
  const urlToSeed = new Map();
  jobs.forEach(j => {
    if (!urlToSeed.has(j.url)) {
      urlToSeed.set(j.url, j.seed);
    }
  });
  
  // Queue pages for re-scraping
  let queued = 0;
  pagesToRescrape.forEach(page => {
    // Find seed URL (from existing job or infer from page URL)
    let seed = urlToSeed.get(page.url);
    if (!seed) {
      // Try to find seed by matching domain
      const pageUrl = new URL(page.url);
      const matchingJob = jobs.find(j => {
        try {
          const jobUrl = new URL(j.url);
          return jobUrl.hostname === pageUrl.hostname;
        } catch {
          return false;
        }
      });
      seed = matchingJob?.seed || page.url; // Fallback to page URL itself
    }
    
    // Only add if not already in jobs
    if (!existingJobUrls.has(page.url)) {
      state.jobs.push({
        url: page.url,
        status: 'queued',
        depth: 0,
        seed: seed
      });
      queued++;
    }
  });
  
  saveState(state);
  
  console.log(`\n✅ Queued ${queued} pages for re-scraping`);
  console.log(`\n📝 Next steps:`);
  console.log(`   1. Run: LITE_MAX_URLS=100 node run-lite.js scrape`);
  console.log(`   2. Monitor with: node scripts/monitor-improvements.js`);
  console.log(`   3. Check metadata rate should increase from ${Math.round(pages.filter(hasMetadata).length / pages.length * 100)}%`);
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});



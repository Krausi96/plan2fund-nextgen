#!/usr/bin/env node
/**
 * Fully Automated Self-Running Scraper Cycle
 * 
 * Runs: Discovery → Scraping → Pattern Learning → Analysis → Self-Improvement
 * 
 * Features:
 * - Automatic retry of failed jobs
 * - Pattern learning after each scrape
 * - Extraction improvement based on feedback
 * - Continuous cycle until no new URLs found
 * - Quality monitoring and reporting
 */

require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'commonjs', moduleResolution: 'node', esModuleInterop: true } });

const { discover, scrape, loadState, saveState } = require('../src/scraper.ts');
const { getAllSeedUrls, institutions } = require('../src/config.ts');
const fs = require('fs');
const path = require('path');

const MAX_CYCLES = process.env.MAX_CYCLES ? parseInt(process.env.MAX_CYCLES) : 10;
const MIN_NEW_URLS = process.env.MIN_NEW_URLS ? parseInt(process.env.MIN_NEW_URLS) : 5;
const SCRAPE_BATCH_SIZE = process.env.SCRAPE_BATCH_SIZE ? parseInt(process.env.SCRAPE_BATCH_SIZE) : 100;

async function runPatternLearning() {
  console.log('\n🧠 Learning patterns from scraped pages...');
  try {
    require('./learn-patterns-from-scraped.js');
    console.log('✅ Pattern learning complete');
  } catch (e) {
    console.log(`⚠️  Pattern learning error: ${e.message}`);
  }
}

async function retryFailedJobs(maxRetries = 3) {
  const state = loadState();
  const failed = state.jobs.filter(j => j.status === 'failed' && (j.attempts || 0) < maxRetries);
  
  if (failed.length === 0) return 0;
  
  console.log(`\n🔄 Retrying ${failed.length} failed jobs...`);
  failed.forEach(job => {
    job.status = 'queued';
    job.attempts = (job.attempts || 0) + 1;
  });
  saveState(state);
  
  // Scrape retries
  await scrape(failed.length, []);
  return failed.length;
}

async function autoCycle() {
  console.log('\n' + '='.repeat(70));
  console.log('🤖 FULLY AUTOMATED SCRAPER CYCLE');
  console.log('='.repeat(70));
  
  let cyclesRun = 0;
  let totalPagesScraped = 0;
  let totalUrlsDiscovered = 0;
  
  // Load initial state
  let state = loadState();
  const initialPageCount = state.pages.length;
  const initialSeenCount = Object.keys(state.seen || {}).length;
  
  // Auto-load seeds if not provided
  let seeds = (process.env.LITE_SEEDS || '').split(',').map(s => s.trim()).filter(Boolean);
  if (seeds.length === 0) {
    console.log('\n📋 Auto-loading seed URLs from institution config...');
    seeds = getAllSeedUrls();
    console.log(`✅ Loaded ${seeds.length} seed URLs from ${institutions.length} institutions`);
    
    if (!process.env.LITE_ALL_INSTITUTIONS) {
      const limitedSeeds = institutions.slice(0, 3).flatMap(inst => inst.seedUrls);
      console.log(`⚠️  Limiting to first 3 institutions (${limitedSeeds.length} seeds). Set LITE_ALL_INSTITUTIONS=1 for all.`);
      seeds = limitedSeeds;
    }
  }
  
  while (cyclesRun < MAX_CYCLES) {
    cyclesRun++;
    console.log(`\n${'='.repeat(70)}`);
    console.log(`🔄 CYCLE ${cyclesRun}/${MAX_CYCLES}`);
    console.log('='.repeat(70));
    
    // STEP 1: Discovery
    console.log('\n📡 STEP 1: URL DISCOVERY');
    const stateBeforeDiscovery = loadState();
    const urlsBeforeDiscovery = Object.keys(stateBeforeDiscovery.seen || {}).length;
    const jobsBeforeDiscovery = stateBeforeDiscovery.jobs.filter(j => j.status === 'queued').length;
    
    const maxDiscoveryPages = process.env.LITE_MAX_DISCOVERY_PAGES ? parseInt(process.env.LITE_MAX_DISCOVERY_PAGES) : 200;
    await discover(seeds, 3, maxDiscoveryPages);
    
    const stateAfterDiscovery = loadState();
    const urlsAfterDiscovery = Object.keys(stateAfterDiscovery.seen || {}).length;
    const jobsAfterDiscovery = stateAfterDiscovery.jobs.filter(j => j.status === 'queued').length;
    
    const newUrls = urlsAfterDiscovery - urlsBeforeDiscovery;
    const newJobs = jobsAfterDiscovery - jobsBeforeDiscovery;
    
    console.log(`  ✅ Discovered ${newUrls} new URLs`);
    console.log(`  ✅ Queued ${newJobs} new jobs`);
    totalUrlsDiscovered += newUrls;
    
    if (newJobs < MIN_NEW_URLS && cyclesRun > 1) {
      console.log(`\n⚠️  Only ${newJobs} new jobs found (minimum: ${MIN_NEW_URLS}). Cycle may be complete.`);
    }
    
    // STEP 2: Scraping (in batches)
    console.log('\n📥 STEP 2: SCRAPING');
    let batchNum = 1;
    let hasMoreJobs = true;
    
    while (hasMoreJobs) {
      const state = loadState();
      const queuedJobs = state.jobs.filter(j => j.status === 'queued');
      
      if (queuedJobs.length === 0) {
        hasMoreJobs = false;
        break;
      }
      
      const batchSize = Math.min(SCRAPE_BATCH_SIZE, queuedJobs.length);
      console.log(`\n  📦 Batch ${batchNum}: Scraping ${batchSize} jobs...`);
      
      const pagesBefore = state.pages.length;
      await scrape(batchSize, []);
      
      const stateAfter = loadState();
      const pagesAfter = stateAfter.pages.length;
      const pagesInBatch = pagesAfter - pagesBefore;
      
      totalPagesScraped += pagesInBatch;
      console.log(`  ✅ Scraped ${pagesInBatch} pages in this batch (${pagesAfter} total)`);
      
      batchNum++;
      
      // Limit batches per cycle
      if (batchNum > 5) {
        console.log(`  ⚠️  Max batches per cycle reached, continuing to next cycle...`);
        break;
      }
    }
    
    // STEP 3: Pattern Learning (after scraping)
    if (cyclesRun % 2 === 0 || cyclesRun === 1) {
      await runPatternLearning();
    }
    
    // STEP 3b: Extraction Quality Analysis (for self-improvement)
    if (cyclesRun % 3 === 0 || cyclesRun === 1) {
      console.log('\n🔬 STEP 3b: EXTRACTION QUALITY ANALYSIS');
      try {
        require('./improve-extraction.js');
      } catch (e) {
        console.log(`⚠️  Extraction analysis error: ${e.message}`);
      }
    }
    
    // STEP 4: Retry Failed Jobs
    await retryFailedJobs(3);
    
    // STEP 5: Analysis & Status
    console.log('\n📊 STEP 5: ANALYSIS & STATUS');
    const finalState = loadState();
    const finalPageCount = finalState.pages.length;
    const finalQueuedJobs = finalState.jobs.filter(j => j.status === 'queued').length;
    const finalFailedJobs = finalState.jobs.filter(j => j.status === 'failed').length;
    
    console.log(`  📄 Total pages: ${finalPageCount} (${finalPageCount - initialPageCount} new this session)`);
    console.log(`  ⏳ Queued jobs: ${finalQueuedJobs}`);
    console.log(`  ❌ Failed jobs: ${finalFailedJobs}`);
    
    // Run monitoring scripts for detailed analysis
    if (cyclesRun === MAX_CYCLES || newJobs < MIN_NEW_URLS) {
      console.log('\n📈 Running detailed analysis...');
      try {
        require('./monitor-improvements.js');
      } catch (e) {
        console.log(`⚠️  Could not run analysis: ${e.message}`);
      }
    }
    
    // Check if we should continue
    if (newJobs < MIN_NEW_URLS && cyclesRun > 1) {
      console.log(`\n✅ Cycle complete: No significant new URLs discovered.`);
      break;
    }
    
    // Small delay between cycles to be respectful
    if (cyclesRun < MAX_CYCLES) {
      console.log('\n⏸️  Waiting 2 seconds before next cycle...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  // Final Summary
  console.log('\n' + '='.repeat(70));
  console.log('📊 FINAL SUMMARY');
  console.log('='.repeat(70));
  
  const finalState = loadState();
  const finalPageCount = finalState.pages.length;
  const finalUrlsDiscovered = Object.keys(finalState.seen || {}).length;
  
  console.log(`\n✅ Completed ${cyclesRun} cycles`);
  console.log(`📄 Total pages scraped: ${finalPageCount} (+${finalPageCount - initialPageCount})`);
  console.log(`🔍 Total URLs discovered: ${finalUrlsDiscovered} (+${finalUrlsDiscovered - initialSeenCount})`);
  console.log(`📥 Pages scraped this session: ${totalPagesScraped}`);
  console.log(`🔎 URLs discovered this session: ${totalUrlsDiscovered}`);
  
  const queued = finalState.jobs.filter(j => j.status === 'queued').length;
  const failed = finalState.jobs.filter(j => j.status === 'failed').length;
  
  if (queued > 0) {
    console.log(`\n⏳ ${queued} jobs still queued (run again to process)`);
  }
  if (failed > 0) {
    console.log(`❌ ${failed} jobs failed after retries`);
  }
  
  console.log('\n✅ Automated cycle complete!\n');
}

// Run if called directly
if (require.main === module) {
  autoCycle().catch(err => {
    console.error('\n❌ Fatal error:', err);
    process.exit(1);
  });
}

module.exports = { autoCycle };


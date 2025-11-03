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

const { discover, scrape, loadState, saveState } = require('../../src/scraper.ts');
const { getAllSeedUrls, institutions } = require('../../src/config.ts');
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

async function autoRescrapeLowQualityPages() {
  // Check database for pages with missing critical categories
  const path = require('path');
  require('dotenv').config({ path: path.join(__dirname, '../../../.env.local') });
  require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'commonjs', moduleResolution: 'node', esModuleInterop: true } });
  
  const { getPool } = require(path.join(__dirname, '../../src/db/neon-client.ts'));
  const pool = getPool();
  
  try {
    // Find pages missing critical categories (eligibility, financial, documents, timeline, project)
    const result = await pool.query(`
      WITH page_categories AS (
        SELECT 
          p.id,
          p.url,
          COUNT(DISTINCT CASE WHEN r.category = 'eligibility' THEN 1 END) as has_eligibility,
          COUNT(DISTINCT CASE WHEN r.category = 'financial' THEN 1 END) as has_financial,
          COUNT(DISTINCT CASE WHEN r.category = 'documents' THEN 1 END) as has_documents,
          COUNT(DISTINCT CASE WHEN r.category = 'timeline' THEN 1 END) as has_timeline,
          COUNT(DISTINCT CASE WHEN r.category = 'project' THEN 1 END) as has_project
        FROM pages p
        LEFT JOIN requirements r ON p.id = r.page_id
        GROUP BY p.id, p.url
      )
      SELECT url
      FROM page_categories
      WHERE (has_eligibility = 0 OR has_financial = 0 OR has_documents = 0 OR has_timeline = 0 OR has_project = 0)
      LIMIT 20
    `);
    
    if (result.rows.length > 0) {
      console.log(`  🔍 Found ${result.rows.length} pages with missing critical categories`);
      
      // Add to queue for rescraping
      const state = loadState();
      const urlsToRescrape = result.rows.map(r => r.url);
      let addedCount = 0;
      
      urlsToRescrape.forEach(url => {
        // Only add if not already in queue or done
        const exists = state.jobs.find(j => j.url === url && (j.status === 'queued' || j.status === 'running' || j.status === 'done'));
        const inPages = state.pages.find(p => p.url === url);
        
        if (!exists && !inPages) {
          state.jobs.push({
            url: url,
            status: 'queued',
            depth: 0,
            seed: url,
            attempts: 0
          });
          addedCount++;
        }
      });
      
      if (addedCount > 0) {
        saveState(state);
        console.log(`  ✅ Added ${addedCount} low-quality pages to queue for rescraping`);
      } else {
        console.log(`  ℹ️  All low-quality pages already in queue or processed`);
      }
    } else {
      console.log(`  ✅ All pages have critical categories - no rescraping needed`);
    }
    
    await pool.end();
  } catch (e) {
    console.log(`  ⚠️  Could not check for low-quality pages: ${e.message}`);
    if (pool) {
      try {
        await pool.end();
      } catch {}
    }
  }
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
        require('../manual/improve-extraction.js');
      } catch (e) {
        console.log(`⚠️  Extraction analysis error: ${e.message}`);
      }
    }
    
    // STEP 4: Database Quality Check & Component Data Verification
    if (cyclesRun % 2 === 0 || cyclesRun === 1) {
      console.log('\n✅ STEP 4: DATABASE QUALITY CHECK');
      try {
        require('../manual/verify-database-quality.js');
      } catch (e) {
        console.log(`⚠️  Quality check error: ${e.message}`);
      }
      
      // Verify component data format
      console.log('\n✅ STEP 4b: COMPONENT DATA VERIFICATION');
      try {
        require('../manual/test-question-engine-data.js');
      } catch (e) {
        console.log(`⚠️  Component verification error: ${e.message}`);
      }
    }
    
    // STEP 5: Auto-Rescrape Pages with Missing Critical Categories
    if (cyclesRun % 4 === 0 && cyclesRun > 2) {
      console.log('\n🔄 STEP 5: AUTO-RESCRAPE LOW QUALITY PAGES');
      try {
        await autoRescrapeLowQualityPages();
      } catch (e) {
        console.log(`⚠️  Auto-rescrape error: ${e.message}`);
      }
    }
    
    // STEP 6: Retry Failed Jobs
    await retryFailedJobs(3);
    
    // STEP 7: Analysis & Status
    console.log('\n📊 STEP 7: ANALYSIS & STATUS');
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


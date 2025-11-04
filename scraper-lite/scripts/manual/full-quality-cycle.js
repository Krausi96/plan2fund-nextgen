#!/usr/bin/env node
/**
 * Full Quality Improvement Cycle - Manual Script
 * 
 * Runs a complete cycle from scratch to improve data quality:
 * 1. Initial Quality Assessment
 * 2. Discovery (find new URLs)
 * 3. Scraping (extract data)
 * 4. Pattern Learning
 * 5. Quality Analysis
 * 6. Improvement Suggestions
 * 7. Re-scrape Low Quality Pages
 * 8. Final Quality Report
 * 
 * Usage: node scripts/manual/full-quality-cycle.js
 */

require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'commonjs', moduleResolution: 'node', esModuleInterop: true } });

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env.local') });

const { discover, scrape, loadState } = require('../../src/scraper.ts');
const { getAllSeedUrls, institutions } = require('../../src/config.ts');

const MAX_DISCOVERY_PAGES = process.env.LITE_MAX_DISCOVERY_PAGES ? parseInt(process.env.LITE_MAX_DISCOVERY_PAGES) : 500;
const SCRAPE_BATCH_SIZE = process.env.SCRAPE_BATCH_SIZE ? parseInt(process.env.SCRAPE_BATCH_SIZE) : 50;
const MAX_CYCLES = process.env.MAX_CYCLES ? parseInt(process.env.MAX_CYCLES) : 3;

async function runScript(scriptPath, description) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`📋 ${description}`);
  console.log('='.repeat(70));
  try {
    const script = require(scriptPath);
    if (typeof script === 'function') {
      await script();
    } else if (script && typeof script.default === 'function') {
      await script.default();
    } else {
      // Script runs on require
      console.log('✅ Script executed');
    }
  } catch (e) {
    console.error(`❌ Error running ${scriptPath}:`, e.message);
    console.error(e.stack);
    return false;
  }
  return true;
}

async function fullQualityCycle() {
  console.log('\n' + '='.repeat(70));
  console.log('🚀 FULL QUALITY IMPROVEMENT CYCLE');
  console.log('='.repeat(70));
  console.log(`Max Discovery Pages: ${MAX_DISCOVERY_PAGES}`);
  console.log(`Scrape Batch Size: ${SCRAPE_BATCH_SIZE}`);
  console.log(`Max Cycles: ${MAX_CYCLES}`);
  console.log('='.repeat(70));

  const startTime = Date.now();

  // STEP 1: Initial Quality Assessment
  console.log('\n📊 STEP 1: INITIAL QUALITY ASSESSMENT');
  await runScript('../manual/verify-database-quality.js', 'Checking initial database quality');

  // STEP 2: Discovery Phase
  console.log('\n🔍 STEP 2: DISCOVERY PHASE');
  let seeds = getAllSeedUrls();
  if (!process.env.LITE_ALL_INSTITUTIONS) {
    seeds = institutions.slice(0, 3).flatMap(inst => inst.seedUrls);
    console.log(`📋 Using first 3 institutions (${seeds.length} seed URLs)`);
  } else {
    console.log(`📋 Using all institutions (${seeds.length} seed URLs)`);
  }

  let cyclesRun = 0;
  let totalUrlsDiscovered = 0;
  let totalPagesScraped = 0;

  while (cyclesRun < MAX_CYCLES) {
    cyclesRun++;
    console.log(`\n${'='.repeat(70)}`);
    console.log(`🔄 CYCLE ${cyclesRun} / ${MAX_CYCLES}`);
    console.log('='.repeat(70));

    // 2a. Discovery
    const stateBefore = loadState();
    const seenBefore = Object.keys(stateBefore.seen || {}).length;
    const jobsBefore = stateBefore.jobs.filter(j => j.status === 'queued').length;

    console.log(`\n  🔍 Discovering URLs (max ${MAX_DISCOVERY_PAGES} pages)...`);
    await discover(seeds, 2, MAX_DISCOVERY_PAGES);

    const stateAfter = loadState();
    const seenAfter = Object.keys(stateAfter.seen || {}).length;
    const jobsAfter = stateAfter.jobs.filter(j => j.status === 'queued').length;
    const newUrls = seenAfter - seenBefore;
    const newJobs = jobsAfter - jobsBefore;

    console.log(`  ✅ Discovered ${newUrls} new URLs, ${newJobs} new jobs queued`);
    totalUrlsDiscovered += newUrls;

    if (newJobs === 0 && cyclesRun > 1) {
      console.log('  ⚠️  No new URLs found, stopping discovery');
      break;
    }

    // 2b. Scraping
    console.log(`\n  📦 Scraping ${Math.min(SCRAPE_BATCH_SIZE, jobsAfter)} pages...`);
    const pagesBefore = stateAfter.pages.length;
    await scrape(SCRAPE_BATCH_SIZE, []);
    const stateScraped = loadState();
    const pagesAfter = stateScraped.pages.length;
    const pagesScraped = pagesAfter - pagesBefore;
    totalPagesScraped += pagesScraped;
    console.log(`  ✅ Scraped ${pagesScraped} pages (${pagesAfter} total)`);

    // 2c. Pattern Learning (every 2 cycles)
    if (cyclesRun % 2 === 0) {
      console.log('\n  🧠 Learning patterns from scraped data...');
      await runScript('../automatic/learn-patterns-from-scraped.js', 'Pattern learning');
    }
  }

  // STEP 3: Comprehensive Quality Analysis
  console.log('\n📊 STEP 3: COMPREHENSIVE QUALITY ANALYSIS');
  await runScript('../manual/comprehensive-quality-analysis.js', 'Running comprehensive quality analysis');

  // STEP 4: Extraction Improvement Analysis
  console.log('\n🔧 STEP 4: EXTRACTION IMPROVEMENT ANALYSIS');
  await runScript('../manual/improve-extraction.js', 'Analyzing extraction patterns');

  // STEP 5: Category Usefulness Analysis
  console.log('\n📋 STEP 5: CATEGORY USEFULNESS ANALYSIS');
  await runScript('../manual/analyze-category-usefulness.js', 'Analyzing requirement categories');

  // STEP 6: Re-scrape Low Quality Pages
  console.log('\n🔄 STEP 6: RE-SCRAPING LOW QUALITY PAGES');
  await runScript('../manual/rescrape-pages.js', 'Re-scraping pages with missing data');

  // STEP 7: Validate Improvements
  console.log('\n✅ STEP 7: VALIDATING IMPROVEMENTS');
  await runScript('../manual/validate-improvements.js', 'Validating data quality improvements');

  // STEP 8: Final Quality Report
  console.log('\n📊 STEP 8: FINAL QUALITY REPORT');
  await runScript('../manual/verify-database-quality.js', 'Final quality check');

  // STEP 9: System Verification
  console.log('\n🔍 STEP 9: SYSTEM VERIFICATION');
  await runScript('../manual/verify-system.js', 'Verifying system integrity');

  // Summary
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000 / 60).toFixed(1);

  console.log('\n' + '='.repeat(70));
  console.log('✅ FULL QUALITY CYCLE COMPLETE');
  console.log('='.repeat(70));
  console.log(`⏱️  Duration: ${duration} minutes`);
  console.log(`🔍 URLs Discovered: ${totalUrlsDiscovered}`);
  console.log(`📄 Pages Scraped: ${totalPagesScraped}`);
  console.log(`🔄 Cycles Completed: ${cyclesRun}`);
  console.log('='.repeat(70));
  console.log('\n📊 Check the quality reports above for detailed metrics.');
  console.log('💡 Run individual scripts to focus on specific improvements.');
}

if (require.main === module) {
  fullQualityCycle().catch(err => {
    console.error('\n❌ Fatal error:', err);
    process.exit(1);
  });
}

module.exports = { fullQualityCycle };


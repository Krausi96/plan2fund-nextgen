#!/usr/bin/env node
/**
 * Quick Quality Improvement - Manual Script
 * 
 * Runs quality improvement scripts without full discovery/scraping cycle.
 * Focuses on analyzing existing data and improving extraction.
 * 
 * Usage: node scripts/manual/quick-quality-improvement.js
 */

require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'commonjs', moduleResolution: 'node', esModuleInterop: true } });

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env.local') });

async function runScript(scriptPath, description) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`📋 ${description}`);
  console.log('='.repeat(70));
  try {
    require(scriptPath);
    console.log('✅ Completed');
  } catch (e) {
    console.error(`❌ Error:`, e.message);
    return false;
  }
  return true;
}

async function quickQualityImprovement() {
  console.log('\n' + '='.repeat(70));
  console.log('🚀 QUICK QUALITY IMPROVEMENT CYCLE');
  console.log('='.repeat(70));
  console.log('Focus: Analyzing existing data and improving extraction patterns');
  console.log('='.repeat(70));

  const startTime = Date.now();

  // STEP 1: Initial Quality Assessment
  console.log('\n📊 STEP 1: INITIAL QUALITY ASSESSMENT');
  await runScript('../manual/verify-database-quality.js', 'Checking database quality');

  // STEP 2: Comprehensive Quality Analysis
  console.log('\n📊 STEP 2: COMPREHENSIVE QUALITY ANALYSIS');
  await runScript('../manual/comprehensive-quality-analysis.js', 'Running comprehensive analysis');

  // STEP 3: Extraction Improvement Analysis
  console.log('\n🔧 STEP 3: EXTRACTION IMPROVEMENT ANALYSIS');
  await runScript('../manual/improve-extraction.js', 'Analyzing extraction patterns');

  // STEP 4: Category Usefulness Analysis
  console.log('\n📋 STEP 4: CATEGORY USEFULNESS ANALYSIS');
  await runScript('../manual/analyze-category-usefulness.js', 'Analyzing requirement categories');

  // STEP 5: Discovery Coverage Analysis
  console.log('\n🔍 STEP 5: DISCOVERY COVERAGE ANALYSIS');
  await runScript('../manual/analyze-discovery-coverage.js', 'Analyzing URL discovery coverage');

  // STEP 6: URL Quality Check
  console.log('\n✅ STEP 6: URL QUALITY CHECK');
  await runScript('../manual/quality-check-urls.js', 'Checking URL quality');

  // STEP 7: Final Quality Report
  console.log('\n📊 STEP 7: FINAL QUALITY REPORT');
  await runScript('../manual/verify-database-quality.js', 'Final quality check');

  // Summary
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000 / 60).toFixed(1);

  console.log('\n' + '='.repeat(70));
  console.log('✅ QUICK QUALITY IMPROVEMENT CYCLE COMPLETE');
  console.log('='.repeat(70));
  console.log(`⏱️  Duration: ${duration} minutes`);
  console.log('='.repeat(70));
  console.log('\n💡 Next steps:');
  console.log('   - Review the analysis reports above');
  console.log('   - Run "full-quality-cycle.js" for discovery + scraping');
  console.log('   - Run "rescrape-pages.js" to re-scrape low quality pages');
}

if (require.main === module) {
  quickQualityImprovement().catch(err => {
    console.error('\n❌ Fatal error:', err);
    process.exit(1);
  });
}

module.exports = { quickQualityImprovement };


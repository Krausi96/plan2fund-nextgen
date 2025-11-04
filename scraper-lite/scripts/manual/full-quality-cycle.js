#!/usr/bin/env node
/**
 * Full Quality Improvement Cycle - Wrapper for auto-cycle.js
 * 
 * This is a wrapper around the existing auto-cycle.js script.
 * It runs the automated cycle with quality checks enabled.
 * 
 * Usage: node scripts/manual/full-quality-cycle.js
 * 
 * Note: This script calls the existing auto-cycle.js which already includes:
 * - Discovery → Scraping → Pattern Learning → Quality Analysis → Validation
 */

require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'commonjs', moduleResolution: 'node', esModuleInterop: true } });

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env.local') });

async function fullQualityCycle() {
  console.log('\n' + '='.repeat(70));
  console.log('🚀 FULL QUALITY IMPROVEMENT CYCLE');
  console.log('='.repeat(70));
  console.log('📋 This script uses the existing auto-cycle.js');
  console.log('   which already includes all quality checks.');
  console.log('='.repeat(70));
  
  // Set recommended defaults if not already set
  if (!process.env.MAX_CYCLES) {
    process.env.MAX_CYCLES = '3';
  }
  if (!process.env.SCRAPE_BATCH_SIZE) {
    process.env.SCRAPE_BATCH_SIZE = '50';
  }
  if (!process.env.LITE_MAX_DISCOVERY_PAGES) {
    process.env.LITE_MAX_DISCOVERY_PAGES = '500';
  }
  
  console.log(`\n⚙️  Configuration:`);
  console.log(`   MAX_CYCLES: ${process.env.MAX_CYCLES}`);
  console.log(`   SCRAPE_BATCH_SIZE: ${process.env.SCRAPE_BATCH_SIZE}`);
  console.log(`   LITE_MAX_DISCOVERY_PAGES: ${process.env.LITE_MAX_DISCOVERY_PAGES}`);
  console.log(`   LITE_ALL_INSTITUTIONS: ${process.env.LITE_ALL_INSTITUTIONS || '0 (first 3 only)'}`);
  console.log('\n' + '='.repeat(70));
  console.log('🔄 Running auto-cycle.js (includes all quality checks)...');
  console.log('='.repeat(70));
  
  // Run the existing auto-cycle.js which already does everything
  require('../automatic/auto-cycle.js');
}

if (require.main === module) {
  fullQualityCycle().catch(err => {
    console.error('\n❌ Fatal error:', err);
    process.exit(1);
  });
}

module.exports = { fullQualityCycle };


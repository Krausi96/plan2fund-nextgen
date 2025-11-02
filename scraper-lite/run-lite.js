#!/usr/bin/env node
require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'commonjs', moduleResolution: 'node', esModuleInterop: true } });

const { discover, scrape } = require('./src/scraper.ts');
const { getAllSeedUrls, institutions } = require('./src/config.ts');

async function main() {
  const args = process.argv.slice(2);
  const mode = args[0] || 'full-cycle';
  
  // Auto-load seeds from config if not provided
  let seedsArg = (process.env.LITE_SEEDS || '').split(',').map(s => s.trim()).filter(Boolean);
  if (seedsArg.length === 0 && (mode === 'discover' || mode === 'full-cycle')) {
    console.log('📋 No LITE_SEEDS provided, auto-loading from institution config...');
    seedsArg = getAllSeedUrls();
    console.log(`✅ Loaded ${seedsArg.length} seed URLs from ${institutions.length} institutions`);
    // Limit to first 3 institutions for initial test to avoid overload
    if (!process.env.LITE_ALL_INSTITUTIONS) {
      const limitedSeeds = institutions.slice(0, 3).flatMap(inst => inst.seedUrls);
      console.log(`⚠️  Limiting to first 3 institutions (${limitedSeeds.length} seeds) for safety. Set LITE_ALL_INSTITUTIONS=1 for all.`);
      seedsArg = limitedSeeds;
    }
  }
  
  const maxUrls = parseInt(process.env.LITE_MAX_URLS || '10', 10);
  const targets = (process.env.LITE_TARGETS || '').split(',').map(s => s.trim()).filter(Boolean);

  if (mode === 'full-cycle') {
    // FULL CYCLE: Discovery → Scrape → Analyze (integrated)
    console.log('🔄 Full Cycle: Discovery → Scrape → Analyze\n');
    
    // Step 1: Discovery (with overview page detection)
    console.log('═══════════════════════════════════════════════════════════');
    console.log('STEP 1: URL DISCOVERY (with overview page detection)');
    console.log('═══════════════════════════════════════════════════════════');
    if (seedsArg.length === 0) {
      console.log('❌ No seeds available. Check institution config or set LITE_SEEDS.');
      process.exit(1);
    }
    console.log(`🔍 Discovering from ${seedsArg.length} seed URLs...`);
    const maxDepth = 3;
    const maxPages = process.env.LITE_MAX_DISCOVERY_PAGES ? parseInt(process.env.LITE_MAX_DISCOVERY_PAGES) : 200;
    await discover(seedsArg, maxDepth, maxPages);
    
    const { loadState } = require('./src/scraper.ts');
    const stateAfterDiscovery = loadState();
    console.log(`\n✅ Discovery complete:`);
    console.log(`   URLs discovered: ${Object.keys(stateAfterDiscovery.seen).length}`);
    console.log(`   Jobs queued: ${stateAfterDiscovery.jobs.length}`);
    
    // Step 2: Scraping
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('STEP 2: SCRAPING');
    console.log('═══════════════════════════════════════════════════════════');
    await scrape(maxUrls, targets);
    
    const stateAfterScrape = loadState();
    console.log(`\n✅ Scraping complete:`);
    console.log(`   Pages scraped: ${stateAfterScrape.pages.length}`);
    
    // Step 3: Analysis (runs automatically in scrape cleanup, but show summary)
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('STEP 3: ANALYSIS & QUALITY CHECK');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('   Run: node scripts/monitor-improvements.js');
    console.log('   Run: node scripts/monitor-metadata.js');
    console.log('\n✅ Full cycle complete!');
    
  } else if (mode === 'discover') {
    if (seedsArg.length === 0) {
      console.log('❌ No seeds available. Check institution config or set LITE_SEEDS.');
      process.exit(1);
    }
    console.log(`🔍 Discovering from ${seedsArg.length} seed URLs...`);
    const maxDepth = 3;
    const maxPages = process.env.LITE_MAX_DISCOVERY_PAGES ? parseInt(process.env.LITE_MAX_DISCOVERY_PAGES) : 150;
    await discover(seedsArg, maxDepth, maxPages);
    console.log('✅ Discovery complete');
  } else if (mode === 'scrape') {
    await scrape(maxUrls, targets);
    console.log('✅ Scrape complete');
  } else if (mode === 'auto' || mode === 'auto-cycle') {
    // Fully automated self-running cycle
    const { autoCycle } = require('./scripts/auto-cycle.js');
    await autoCycle();
  } else {
    console.log('Usage: node scraper-lite/run-lite.js [discover|scrape|full-cycle|auto]');
    console.log('  auto:       Fully automated self-running cycle (recommended)');
    console.log('  full-cycle: Discover → Scrape → Analyze');
    console.log('  discover:   URL discovery only');
    console.log('  scrape:     Scrape queued URLs only');
  }
}

main().catch(err => { console.error(err); process.exit(1); });



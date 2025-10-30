// Discovery-only script - fast URL discovery, no scraping
// Usage: node scripts/run-discovery-only.js [incremental|deep]

require('ts-node').register({
  transpileOnly: true,
  compilerOptions: {
    module: 'commonjs',
    moduleResolution: 'node',
    esModuleInterop: true,
    skipLibCheck: true
  }
});

const { WebScraperService } = require('../src/lib/webScraperService');
const { institutions } = require('../src/lib/institutionConfig');
const fs = require('fs');
const path = require('path');

async function runDiscoveryOnly() {
  const discoveryMode = process.argv[2] === 'deep' ? 'deep' : 'incremental';
  
  console.log('🔍 DISCOVERY ONLY - Fast URL Discovery (No Scraping)');
  console.log('='.repeat(60));
  console.log(`📊 Mode: ${discoveryMode.toUpperCase()}`);
  console.log(`📊 Total Institutions: ${institutions.length}`);
  console.log(`⏰ Started at: ${new Date().toISOString()}\n`);
  
  const scraper = new WebScraperService();
  
  const results = [];
  const batchSize = 3; // Process 3 institutions in parallel for stability
  const allInstitutions = institutions.filter(inst => inst.autoDiscovery);
  
  console.log(`🚀 Starting discovery for ${allInstitutions.length} institutions...`);
  console.log(`⚡ Processing ${batchSize} at a time\n`);
  
  for (let i = 0; i < allInstitutions.length; i += batchSize) {
    const batch = allInstitutions.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(allInstitutions.length / batchSize);
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🔄 BATCH ${batchNum} of ${totalBatches}`);
    console.log(`${'='.repeat(60)}\n`);
    
    const batchStart = Date.now();
    
    // Load state before batch to get initial counts
    const initialState = {};
    batch.forEach(inst => {
      const statePath = path.join(__dirname, '..', 'data', 'discovery-state.json');
      if (fs.existsSync(statePath)) {
        const cache = JSON.parse(fs.readFileSync(statePath, 'utf8'));
        const state = cache[inst.name] || { unscrapedUrls: [], knownUrls: [] };
        initialState[inst.name] = {
          beforeUnscraped: (state.unscrapedUrls || []).length,
          beforeKnown: (state.knownUrls || []).length
        };
      } else {
        initialState[inst.name] = { beforeUnscraped: 0, beforeKnown: 0 };
      }
    });
    
    const batchPromises = batch.map(async (institution) => {
      try {
        console.log(`⚡ [${institution.name}] Starting discovery...`);
        const result = await scraper.discoverUrlsOnly(institution, 45000, discoveryMode); // 45 seconds per institution
        
        // Load updated state to get actual counts
        const statePath = path.join(__dirname, '..', 'data', 'discovery-state.json');
        let afterUnscraped = 0;
        let afterKnown = 0;
        if (fs.existsSync(statePath)) {
          const cache = JSON.parse(fs.readFileSync(statePath, 'utf8'));
          const state = cache[institution.name] || { unscrapedUrls: [], knownUrls: [] };
          afterUnscraped = (state.unscrapedUrls || []).length;
          afterKnown = (state.knownUrls || []).length;
        }
        
        const beforeUnscraped = initialState[institution.name]?.beforeUnscraped || 0;
        const beforeKnown = initialState[institution.name]?.beforeKnown || 0;
        const newDetailPages = afterUnscraped - beforeUnscraped;
        const newTotalUrls = afterKnown - beforeKnown;
        
        console.log(`✅ [${institution.name}] Completed in ${(result.timeElapsed/1000).toFixed(1)}s`);
        console.log(`   📊 New detail pages (scrapable): ${newDetailPages > 0 ? '+' : ''}${newDetailPages} (total: ${afterUnscraped})`);
        console.log(`   📊 New total URLs found: ${newTotalUrls > 0 ? '+' : ''}${newTotalUrls} (total: ${afterKnown})`);
        
        return {
          institution: institution.name,
          newDetailPages,
          newTotalUrls,
          totalDetailPages: afterUnscraped,
          totalUrls: afterKnown,
          timeElapsed: result.timeElapsed
        };
      } catch (error) {
        console.error(`❌ [${institution.name}] Error: ${error.message}`);
        return {
          institution: institution.name,
          newDetailPages: 0,
          newTotalUrls: 0,
          totalDetailPages: 0,
          totalUrls: 0,
          timeElapsed: 0,
          error: error.message
        };
      }
    });
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    const batchTime = ((Date.now() - batchStart) / 1000).toFixed(1);
    console.log(`\n✅ Batch ${batchNum} completed in ${batchTime}s`);
  }
  
  // Final summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 DISCOVERY SUMMARY');
  console.log('='.repeat(60));
  
  const totalNewDetailPages = results.reduce((sum, r) => sum + (r.newDetailPages || 0), 0);
  const totalDetailPages = results.reduce((sum, r) => sum + (r.totalDetailPages || 0), 0);
  const totalNewUrls = results.reduce((sum, r) => sum + (r.newTotalUrls || 0), 0);
  const totalTime = results.reduce((sum, r) => sum + (r.timeElapsed || 0), 0);
  const successful = results.filter(r => !r.error && (r.newDetailPages > 0 || r.newTotalUrls > 0));
  
  console.log(`\n   ✅ Institutions Processed: ${results.length}`);
  console.log(`   ✅ Successful: ${successful.length}`);
  console.log(`   📊 New Scrapable Detail Pages: ${totalNewDetailPages > 0 ? '+' : ''}${totalNewDetailPages}`);
  console.log(`   📊 Total Scrapable Detail Pages: ${totalDetailPages}`);
  console.log(`   📊 New Total URLs Found: ${totalNewUrls > 0 ? '+' : ''}${totalNewUrls}`);
  console.log(`   ⏱️  Total Time: ${(totalTime / 1000 / 60).toFixed(1)} minutes`);
  console.log(`   ⚡ Speed: ${(totalNewDetailPages / (totalTime / 1000 / 60)).toFixed(1)} detail pages/minute`);
  
  console.log(`\n   🏆 Top 10 Institutions by New Detail Pages:`);
  results
    .sort((a, b) => (b.newDetailPages || 0) - (a.newDetailPages || 0))
    .slice(0, 10)
    .forEach((r, i) => {
      console.log(`   ${i+1}. ${r.institution}: ${r.newDetailPages || 0} new detail pages (total: ${r.totalDetailPages || 0})`);
    });
  
  // Save results
  const outputFile = path.join(__dirname, '..', 'data', 'discovery-results.json');
  fs.writeFileSync(outputFile, JSON.stringify({
    summary: {
      totalNewDetailPages,
      totalDetailPages,
      totalNewUrls,
      totalTime,
      successful: successful.length,
      totalInstitutions: results.length
    },
    results,
    generatedAt: new Date().toISOString(),
    discoveryMode
  }, null, 2));
  
  console.log(`\n💾 Results saved to: ${outputFile}`);
  console.log(`\n⏰ Completed at: ${new Date().toISOString()}`);
  console.log('='.repeat(60));
  console.log(`\n✅ Next step: Run scraper with:`);
  console.log(`   node scripts/run-scraper-direct.js cycle incremental`);
  console.log(`   (Will process the ${totalDetailPages} discovered detail pages)`);
  
  // Cleanup
  if (scraper.browser) {
    await scraper.browser.close();
  }
  
  return results;
}

// Run if executed directly
if (require.main === module) {
  runDiscoveryOnly()
    .then(() => {
      console.log('\n✅ Discovery completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { runDiscoveryOnly };


// Run 5 fast discovery cycles and compare results
// Load TypeScript source directly (Next.js compiles on-the-fly)
require('ts-node').register({
  transpileOnly: true,
  compilerOptions: {
    module: 'commonjs',
    moduleResolution: 'node',  // Override bundler for ts-node
    esModuleInterop: true,
    skipLibCheck: true
  }
});

const { WebScraperService } = require('../src/lib/webScraperService');
const { institutions } = require('../src/lib/institutionConfig');
const fs = require('fs');
const path = require('path');

async function runDiscoveryCycles() {
  const scraper = new WebScraperService();
  
  // Process ALL institutions in parallel batches (MUCH faster!)
  const results = [];
  const batchSize = 5; // Process 5 institutions in parallel
  const allInstitutions = institutions.filter(inst => inst.autoDiscovery);
  
  console.log(`🚀 Starting fast discovery for ${allInstitutions.length} institutions...`);
  console.log(`⚡ Processing ${batchSize} at a time (30s max each)\n`);
  
  for (let i = 0; i < allInstitutions.length; i += batchSize) {
    const batch = allInstitutions.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(allInstitutions.length / batchSize);
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🔄 BATCH ${batchNum} of ${totalBatches} (${batch.length} institutions)`);
    console.log(`${'='.repeat(60)}\n`);
    
    const batchStart = Date.now();
    const batchPromises = batch.map(async (institution) => {
      try {
        console.log(`⚡ Starting: ${institution.name}`);
        const result = await scraper.discoverUrlsOnly(institution, 30000, 'incremental');
        console.log(`✅ ${institution.name}: ${result.newUrls} new URLs in ${(result.timeElapsed/1000).toFixed(1)}s`);
        return { institution: institution.name, ...result };
      } catch (error) {
        console.error(`❌ ${institution.name}: ${error.message}`);
        return { institution: institution.name, newUrls: 0, totalUrls: 0, timeElapsed: 0, error: error.message };
      }
    });
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    console.log(`\n✅ Batch ${batchNum} completed in ${((Date.now() - batchStart) / 1000).toFixed(1)}s\n`);
  }
  
  // Final summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 FINAL SUMMARY');
  console.log('='.repeat(60));
  
  const totalNewUrls = results.reduce((sum, r) => sum + (r.newUrls || 0), 0);
  const totalTime = results.reduce((sum, r) => sum + (r.timeElapsed || 0), 0);
  const successful = results.filter(r => !r.error && r.newUrls > 0);
  
  console.log(`\n   Total Institutions: ${results.length}`);
  console.log(`   Successful: ${successful.length}`);
  console.log(`   Total New URLs: ${totalNewUrls}`);
  console.log(`   Total Time: ${(totalTime / 1000 / 60).toFixed(1)} minutes`);
  console.log(`   Efficiency: ${(totalNewUrls / (totalTime / 1000 / 60)).toFixed(1)} URLs/minute`);
  
  console.log(`\n   Top 10 Institutions by New URLs:`);
  results
    .sort((a, b) => (b.newUrls || 0) - (a.newUrls || 0))
    .slice(0, 10)
    .forEach((r, i) => {
      console.log(`   ${i+1}. ${r.institution}: ${r.newUrls || 0} new URLs`);
    });
  
  // Save results
  const outputFile = path.join(__dirname, '..', 'data', 'discovery-results.json');
  fs.writeFileSync(outputFile, JSON.stringify({
    summary: { totalNewUrls, totalTime, successful: successful.length, totalInstitutions: results.length },
    results,
    generatedAt: new Date().toISOString()
  }, null, 2));
  
  console.log(`\n💾 Results saved to: ${outputFile}`);
  
  // Cleanup
  if (scraper.browser && scraper.browser.close) {
    await scraper.browser.close();
  }
  
  return results;
}


// Run if executed directly
if (require.main === module) {
  runDiscoveryCycles()
    .then(() => {
      console.log('\n✅ All cycles completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { runDiscoveryCycles };


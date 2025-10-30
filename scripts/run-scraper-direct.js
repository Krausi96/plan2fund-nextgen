// Direct scraper - bypasses API completely
// Usage: node scripts/run-scraper-direct.js [cycle|full] [incremental|deep]

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

async function runScraperDirect() {
  // Parse arguments
  const cycleOnly = process.argv[2] === 'cycle' || process.argv[2] === undefined;
  const discoveryMode = process.argv[3] === 'deep' ? 'deep' : 'incremental';
  
  console.log('🚀 DIRECT SCRAPER (bypasses API)');
  console.log('=' .repeat(60));
  console.log(`📊 Mode: ${cycleOnly ? 'CYCLE' : 'FULL'}`);
  console.log(`📊 Discovery: ${discoveryMode.toUpperCase()}`);
  console.log(`📊 Total Institutions: ${institutions.length}`);
  console.log(`⏰ Started at: ${new Date().toISOString()}\n`);
  
  const scraper = new WebScraperService();
  
  try {
    const startTime = Date.now();
    
    // Run scraper directly
    const programs = await scraper.scrapeAllPrograms(cycleOnly, discoveryMode);
    
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ SCRAPER COMPLETED');
    console.log('='.repeat(60));
    console.log(`\n📊 Results:`);
    console.log(`   Total Programs: ${programs.length}`);
    console.log(`   Time Elapsed: ${elapsed}s`);
    console.log(`   New Programs: ${programs.length > 0 ? programs.length : 0}`);
    
    // Show sample programs
    if (programs.length > 0) {
      console.log(`\n   Sample Programs (first 10):`);
      programs.slice(0, 10).forEach((p, i) => {
        console.log(`   ${i+1}. ${p.name}`);
        console.log(`      Institution: ${p.institution}`);
        console.log(`      Type: ${p.type}`);
        console.log(`      URL: ${p.source_url}`);
        console.log(`      Requirements: ${Object.keys(p.categorized_requirements || {}).length} categories`);
        console.log('');
      });
    }
    
    // Check discovery state
    const discoveryStatePath = path.join(__dirname, '..', 'data', 'discovery-state.json');
    if (fs.existsSync(discoveryStatePath)) {
      const state = JSON.parse(fs.readFileSync(discoveryStatePath, 'utf8'));
      let totalUnscraped = 0;
      Object.values(state).forEach((instState) => {
        if (instState && instState.unscrapedUrls) {
          totalUnscraped += instState.unscrapedUrls.length;
        }
      });
      console.log(`\n📊 Discovery Status:`);
      console.log(`   Total Unscraped URLs: ${totalUnscraped}`);
      Object.entries(state).slice(0, 5).forEach((entry) => {
        const name = entry[0];
        const instState = entry[1];
        const count = (instState && instState.unscrapedUrls) ? instState.unscrapedUrls.length : 0;
        console.log(`   ${name}: ${count} unscraped`);
      });
    }
    
    console.log(`\n⏰ Completed at: ${new Date().toISOString()}`);
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('\n❌ SCRAPER ERROR:');
    console.error(error);
    if (error instanceof Error) {
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  runScraperDirect()
    .then(() => {
      console.log('\n✅ Done!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { runScraperDirect };


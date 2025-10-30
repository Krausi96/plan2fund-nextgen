// Run multiple scraper cycles with analysis after each
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
const fs = require('fs');
const path = require('path');

const scrapedPath = path.join(__dirname, '..', 'data', 'scraped-programs-latest.json');
const analysisPath = path.join(__dirname, '..', 'data', 'cycle-analysis.json');

async function analyzeCycle(cycleNum, beforeCount, afterCount) {
  console.log('\n' + '='.repeat(60));
  console.log(`📊 CYCLE ${cycleNum} ANALYSIS`);
  console.log('='.repeat(60));
  
  const beforeData = beforeCount > 0 ? JSON.parse(fs.readFileSync(scrapedPath, 'utf8')) : { programs: [] };
  const afterData = JSON.parse(fs.readFileSync(scrapedPath, 'utf8'));
  
  const beforePrograms = beforeData.programs || [];
  const afterPrograms = afterData.programs || [];
  
  const newPrograms = afterPrograms.length - beforePrograms.length;
  
  // Analyze new programs
  const newProgramsData = afterPrograms.slice(beforePrograms.length);
  
  const withFunding = newProgramsData.filter(p => p.funding_amount_max).length;
  const withDeadline = newProgramsData.filter(p => p.deadline).length;
  const withFundingPercent = newProgramsData.length > 0 ? ((withFunding / newProgramsData.length) * 100).toFixed(1) : 0;
  const withDeadlinePercent = newProgramsData.length > 0 ? ((withDeadline / newProgramsData.length) * 100).toFixed(1) : 0;
  
  // Overall stats
  const totalWithFunding = afterPrograms.filter(p => p.funding_amount_max).length;
  const totalWithDeadline = afterPrograms.filter(p => p.deadline).length;
  const totalFundingPercent = afterPrograms.length > 0 ? ((totalWithFunding / afterPrograms.length) * 100).toFixed(1) : 0;
  const totalDeadlinePercent = afterPrograms.length > 0 ? ((totalWithDeadline / afterPrograms.length) * 100).toFixed(1) : 0;
  
  console.log(`\n📈 Results:`);
  console.log(`   Programs before: ${beforePrograms.length}`);
  console.log(`   Programs after:  ${afterPrograms.length}`);
  console.log(`   New programs:    +${newPrograms}`);
  
  console.log(`\n💰 Funding Extraction (New Programs):`);
  console.log(`   With funding amount: ${withFunding}/${newProgramsData.length} (${withFundingPercent}%)`);
  console.log(`   Average amount: ${withFunding > 0 ? (newProgramsData.filter(p => p.funding_amount_max).reduce((sum, p) => sum + (p.funding_amount_max || 0), 0) / withFunding / 1000).toFixed(0) + 'k EUR' : 'N/A'}`);
  
  console.log(`\n📅 Deadline Extraction (New Programs):`);
  console.log(`   With deadline: ${withDeadline}/${newProgramsData.length} (${withDeadlinePercent}%)`);
  
  console.log(`\n📊 Overall Stats (All Programs):`);
  console.log(`   Total programs: ${afterPrograms.length}`);
  console.log(`   With funding: ${totalWithFunding} (${totalFundingPercent}%)`);
  console.log(`   With deadline: ${totalWithDeadline} (${totalDeadlinePercent}%)`);
  
  // Check discovery state
  const discoveryStatePath = path.join(__dirname, '..', 'data', 'discovery-state.json');
  let totalUnscraped = 0;
  if (fs.existsSync(discoveryStatePath)) {
    const state = JSON.parse(fs.readFileSync(discoveryStatePath, 'utf8'));
    Object.values(state).forEach((instState) => {
      if (instState && instState.unscrapedUrls) {
        totalUnscraped += instState.unscrapedUrls.length;
      }
    });
    console.log(`\n📋 Discovery Status:`);
    console.log(`   Remaining unscraped URLs: ${totalUnscraped}`);
  }
  
  // Save analysis
  let analyses = [];
  if (fs.existsSync(analysisPath)) {
    analyses = JSON.parse(fs.readFileSync(analysisPath, 'utf8'));
  }
  
  analyses.push({
    cycle: cycleNum,
    timestamp: new Date().toISOString(),
    beforeCount: beforePrograms.length,
    afterCount: afterPrograms.length,
    newPrograms,
    extraction: {
      funding: { count: withFunding, percent: withFundingPercent },
      deadline: { count: withDeadline, percent: withDeadlinePercent }
    },
    overall: {
      total: afterPrograms.length,
      withFunding: { count: totalWithFunding, percent: totalFundingPercent },
      withDeadline: { count: totalWithDeadline, percent: totalDeadlinePercent }
    }
  });
  
  fs.writeFileSync(analysisPath, JSON.stringify(analyses, null, 2));
  
  console.log(`\n💾 Analysis saved to: ${analysisPath}`);
  console.log('='.repeat(60) + '\n');
  
  return {
    newPrograms,
    withFunding,
    withDeadline,
    totalUnscraped
  };
}

async function runCycles() {
  const numCycles = parseInt(process.argv[2]) || 2; // Default to 2 for shorter cycles
  const scraper = new WebScraperService();
  
  console.log('🚀 MULTI-CYCLE SCRAPER WITH ANALYSIS');
  console.log('='.repeat(60));
  console.log(`📊 Running ${numCycles} cycles...`);
  console.log(`⏰ Started at: ${new Date().toISOString()}\n`);
  
  // Get initial count
  let beforeCount = 0;
  if (fs.existsSync(scrapedPath)) {
    const data = JSON.parse(fs.readFileSync(scrapedPath, 'utf8'));
    beforeCount = (data.programs || []).length;
  }
  
  const cycleResults = [];
  
  const discoveryModeEnv = process.env.SCRAPE_ONLY === '1' ? 'none' : 'incremental';
  for (let i = 1; i <= numCycles; i++) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🔄 CYCLE ${i} of ${numCycles}`);
    console.log(`${'='.repeat(60)}\n`);
    
    const cycleStart = Date.now();
    
    try {
      const programs = await scraper.scrapeAllPrograms(true, discoveryModeEnv); // cycle mode, env-controlled discovery
      const cycleTime = ((Date.now() - cycleStart) / 1000 / 60).toFixed(1);
      
      console.log(`\n✅ Cycle ${i} completed in ${cycleTime} minutes`);
      
      // Analyze this cycle
      const analysis = await analyzeCycle(i, beforeCount, programs.length);
      cycleResults.push({ cycle: i, ...analysis, time: cycleTime });
      
      // Update before count for next cycle
      beforeCount = programs.length;
      
      // Brief pause between cycles
      if (i < numCycles) {
        console.log(`\n⏸️  Pausing 5 seconds before next cycle...\n`);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
      
    } catch (error) {
      console.error(`\n❌ Cycle ${i} failed:`, error.message);
      cycleResults.push({ cycle: i, error: error.message });
      break;
    }
  }
  
  // Final summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 FINAL SUMMARY');
  console.log('='.repeat(60));
  
  const totalNew = cycleResults.reduce((sum, r) => sum + (r.newPrograms || 0), 0);
  const totalFunding = cycleResults.reduce((sum, r) => sum + (r.withFunding || 0), 0);
  const totalDeadline = cycleResults.reduce((sum, r) => sum + (r.withDeadline || 0), 0);
  const totalTime = cycleResults.reduce((sum, r) => sum + (parseFloat(r.time || 0)), 0);
  
  console.log(`\n📈 Total across all cycles:`);
  console.log(`   New programs scraped: ${totalNew}`);
  console.log(`   With funding amounts: ${totalFunding}`);
  console.log(`   With deadlines: ${totalDeadline}`);
  console.log(`   Total time: ${totalTime.toFixed(1)} minutes`);
  
  console.log(`\n📊 Per-cycle breakdown:`);
  cycleResults.forEach(r => {
    if (r.error) {
      console.log(`   Cycle ${r.cycle}: ❌ Error - ${r.error}`);
    } else {
      console.log(`   Cycle ${r.cycle}: +${r.newPrograms} programs (${r.time} min) - 💰${r.withFunding} funding, 📅${r.withDeadline} deadlines`);
    }
  });
  
  console.log('\n' + '='.repeat(60));
  
  if (scraper.browser) {
    await scraper.browser.close();
  }
}

if (require.main === module) {
  runCycles()
    .then(() => {
      console.log('\n✅ All cycles completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { runCycles };


// Test script to verify extraction improvements
// Re-scrapes sample programs to see if funding/deadline extraction works

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
const testOutputPath = path.join(__dirname, '..', 'data', 'extraction-test-results.json');

async function testExtraction() {
  console.log('🧪 EXTRACTION TEST');
  console.log('='.repeat(60));
  
  // Load existing programs
  const existingData = JSON.parse(fs.readFileSync(scrapedPath, 'utf8'));
  const programs = existingData.programs || [];
  
  // Select 10 diverse sample programs
  const samples = programs
    .filter(p => p.source_url && !p.source_url.includes('error') && !p.name.toLowerCase().includes('nicht gefunden'))
    .slice(0, 10);
  
  console.log(`📊 Testing extraction on ${samples.length} sample programs\n`);
  
  const scraper = new WebScraperService();
  
  // Initialize browser
  console.log('\n🌐 Initializing browser...');
  await scraper.init();
  console.log('✅ Browser ready\n');
  
  const results = [];
  
  for (let i = 0; i < samples.length; i++) {
    const program = samples[i];
    console.log(`\n[${i+1}/${samples.length}] Testing: ${program.name}`);
    console.log(`   URL: ${program.source_url}`);
    console.log(`   Institution: ${program.institution}`);
    
    // Find institution config
    const { institutions } = require('../src/lib/institutionConfig');
    const institution = institutions.find(inst => inst.name === program.institution);
    
    if (!institution) {
      console.log(`   ⚠️  Institution config not found, skipping`);
      results.push({
        original: program,
        scraped: null,
        error: 'Institution config not found'
      });
      continue;
    }
    
    try {
      // Scrape the URL
      const scraped = await scraper.scrapeProgramFromUrl(program.source_url, institution);
      
      if (scraped) {
        const before = {
          funding_amount_max: program.funding_amount_max || null,
          deadline: program.deadline || null
        };
        const after = {
          funding_amount_max: scraped.funding_amount_max || null,
          deadline: scraped.deadline || null
        };
        
        console.log(`   📊 BEFORE: Funding=${before.funding_amount_max || 'null'}, Deadline=${before.deadline || 'null'}`);
        console.log(`   📊 AFTER:  Funding=${after.funding_amount_max || 'null'}, Deadline=${after.deadline || 'null'}`);
        
        const improved = {
          funding: !before.funding_amount_max && after.funding_amount_max,
          deadline: !before.deadline && after.deadline || (before.deadline && after.deadline && after.deadline.length > before.deadline.length)
        };
        
        if (improved.funding) console.log(`   ✅ Funding amount extracted!`);
        if (improved.deadline) console.log(`   ✅ Deadline extracted/improved!`);
        if (!improved.funding && !improved.deadline && !before.funding_amount_max && !before.deadline) {
          console.log(`   ⚠️  Still no funding/deadline (may not exist on page)`);
        }
        
        results.push({
          original: before,
          scraped: after,
          improved,
          url: program.source_url,
          name: program.name
        });
      } else {
        console.log(`   ❌ Failed to scrape`);
        results.push({
          original: program,
          scraped: null,
          error: 'Scraping failed'
        });
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      results.push({
        original: program,
        scraped: null,
        error: error.message
      });
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  
  const withFunding = results.filter(r => r.scraped && r.scraped.funding_amount_max).length;
  const withDeadline = results.filter(r => r.scraped && r.scraped.deadline).length;
  const improvedFunding = results.filter(r => r.improved && r.improved.funding).length;
  const improvedDeadline = results.filter(r => r.improved && r.improved.deadline).length;
  
  console.log(`\n✅ Programs with funding amount: ${withFunding}/${samples.length} (${((withFunding/samples.length)*100).toFixed(1)}%)`);
  console.log(`✅ Programs with deadline: ${withDeadline}/${samples.length} (${((withDeadline/samples.length)*100).toFixed(1)}%)`);
  console.log(`\n🚀 Improvements detected:`);
  console.log(`   Funding: ${improvedFunding} programs improved`);
  console.log(`   Deadline: ${improvedDeadline} programs improved`);
  
  // Save results
  fs.writeFileSync(testOutputPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    totalTested: samples.length,
    results,
    summary: {
      withFunding,
      withDeadline,
      improvedFunding,
      improvedDeadline
    }
  }, null, 2));
  
  console.log(`\n💾 Results saved to: ${testOutputPath}`);
  
  if (scraper.browser) {
    await scraper.browser.close();
  }
}

if (require.main === module) {
  testExtraction()
    .then(() => {
      console.log('\n✅ Test completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Test failed:', error);
      process.exit(1);
    });
}

module.exports = { testExtraction };


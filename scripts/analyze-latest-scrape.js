// Quick analysis of latest scrape results
require('ts-node').register({
  transpileOnly: true,
  compilerOptions: {
    module: 'commonjs',
    moduleResolution: 'node',
    esModuleInterop: true,
    skipLibCheck: true
  }
});

const fs = require('fs');
const path = require('path');

const scrapedPath = path.join(__dirname, '..', 'data', 'scraped-programs-latest.json');

console.log('📊 LATEST SCRAPE ANALYSIS');
console.log('='.repeat(60));

if (!fs.existsSync(scrapedPath)) {
  console.log('❌ No scraped data found');
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(scrapedPath, 'utf8'));
const programs = data.programs || [];

// Get newest programs (last 50)
const newPrograms = programs.slice(-50);
const beforePrograms = programs.slice(0, -50);

console.log(`\n📈 OVERALL:`);
console.log(`   Total programs: ${programs.length}`);
console.log(`   Newest 50 programs analyzed\n`);

// Funding extraction
const withFunding = newPrograms.filter(p => p.funding_amount_max).length;
const fundingPercent = ((withFunding / newPrograms.length) * 100).toFixed(1);
console.log(`💰 FUNDING EXTRACTION:`);
console.log(`   With funding amount: ${withFunding}/${newPrograms.length} (${fundingPercent}%)`);
if (withFunding > 0) {
  const amounts = newPrograms
    .filter(p => p.funding_amount_max)
    .map(p => p.funding_amount_max);
  const avg = (amounts.reduce((a, b) => a + b, 0) / amounts.length / 1000).toFixed(0);
  const max = (Math.max(...amounts) / 1000).toFixed(0);
  console.log(`   Average: ${avg}k EUR, Max: ${max}k EUR`);
}

// Deadline extraction
const withDeadline = newPrograms.filter(p => p.deadline).length;
const deadlinePercent = ((withDeadline / newPrograms.length) * 100).toFixed(1);
console.log(`\n📅 DEADLINE EXTRACTION:`);
console.log(`   With deadline: ${withDeadline}/${newPrograms.length} (${deadlinePercent}%)`);

// Requirements quality
console.log(`\n📋 REQUIREMENTS QUALITY (newest 50):`);
let totalReqItems = 0;
let specificItems = 0;
let fromTable = 0;
let fromDefinitionList = 0;
let fromStructured = 0;
let genericItems = 0;

newPrograms.forEach(p => {
  const reqs = p.categorized_requirements || {};
  Object.values(reqs).forEach(items => {
    if (items && Array.isArray(items)) {
      items.forEach(item => {
      totalReqItems++;
      const val = (item?.value || '').toLowerCase();
      const source = item?.source || '';
      
      // Count by source
      if (source === 'table') fromTable++;
      else if (source === 'definition_list') fromDefinitionList++;
      else if (source === 'structured_section') fromStructured++;
      
      // Check if specific
      const isSpecific = val.length > 15 && 
                        !val.includes('required') && 
                        !val.includes('unknown') &&
                        (val.match(/\d+/) || val.length > 30);
      
      if (isSpecific) {
        specificItems++;
      } else {
        genericItems++;
      }
      });
    }
  });
});

console.log(`   Total requirement items: ${totalReqItems}`);
console.log(`   Specific items: ${specificItems} (${totalReqItems > 0 ? ((specificItems/totalReqItems)*100).toFixed(1) : 0}%)`);
console.log(`   Generic items: ${genericItems} (${totalReqItems > 0 ? ((genericItems/totalReqItems)*100).toFixed(1) : 0}%)`);
console.log(`\n   Sources:`);
console.log(`   - From tables: ${fromTable}`);
console.log(`   - From definition lists: ${fromDefinitionList}`);
console.log(`   - From structured sections: ${fromStructured}`);
console.log(`   - From text parsing: ${totalReqItems - fromTable - fromDefinitionList - fromStructured}`);

// Category coverage
const categories = ['eligibility', 'documents', 'financial', 'technical', 'legal', 'timeline', 
                    'geographic', 'team', 'project', 'compliance', 'impact', 'capex_opex', 
                    'use_of_funds', 'revenue_model', 'market_size', 'co_financing', 'trl_level', 'consortium'];

const categoryCoverage = {};
categories.forEach(cat => {
  const filled = newPrograms.filter(p => {
    const reqs = p.categorized_requirements || {};
    const items = reqs[cat];
    return items && Array.isArray(items) && items.length > 0;
  }).length;
  categoryCoverage[cat] = filled;
});

console.log(`\n📊 CATEGORY COVERAGE (programs with data):`);
categories.forEach(cat => {
  const pct = ((categoryCoverage[cat] / newPrograms.length) * 100).toFixed(0);
  if (categoryCoverage[cat] > 0) {
    console.log(`   ${cat.padEnd(20)}: ${categoryCoverage[cat].toString().padStart(2)}/${newPrograms.length} (${pct}%)`);
  }
});

// Sample examples
console.log(`\n📄 SAMPLE PROGRAMS (newest 5):`);
newPrograms.slice(-5).forEach((p, i) => {
  console.log(`\n${i+1}. ${p.name}`);
  console.log(`   Institution: ${p.institution}`);
  console.log(`   Funding: ${p.funding_amount_max ? p.funding_amount_max + ' ' + (p.currency || 'EUR') : 'Not found'}`);
  console.log(`   Deadline: ${p.deadline || 'Not found'}`);
  const reqCount = Object.values(p.categorized_requirements || {}).reduce((sum, arr) => sum + (arr && Array.isArray(arr) ? arr.length : 0), 0);
  console.log(`   Requirements: ${reqCount} items`);
});

console.log('\n' + '='.repeat(60));
console.log('✅ Analysis complete');


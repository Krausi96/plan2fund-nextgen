// Quick quality check for scraped programs
const fs = require('fs');
const path = require('path');

const scrapedPath = path.join(__dirname, '..', 'data', 'scraped-programs-latest.json');

if (!fs.existsSync(scrapedPath)) {
  console.log('❌ No scraped programs file found');
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(scrapedPath, 'utf8'));
const programs = data.programs || [];

console.log('📊 SCRAPED DATA QUALITY ANALYSIS');
console.log('='.repeat(60));
console.log(`Total Programs: ${programs.length}`);
console.log('\n');

// Check 18 requirement categories
const categories = [
  'eligibility', 'documents', 'financial', 'technical', 'legal',
  'timeline', 'geographic', 'team', 'project', 'compliance',
  'impact', 'capex_opex', 'use_of_funds', 'revenue_model',
  'market_size', 'co_financing', 'trl_level', 'consortium'
];

let categoryStats = {};
categories.forEach(cat => {
  const withCategory = programs.filter(p => 
    p.categorized_requirements?.[cat] && 
    p.categorized_requirements[cat].length > 0
  ).length;
  categoryStats[cat] = {
    filled: withCategory,
    percentage: ((withCategory / programs.length) * 100).toFixed(1)
  };
});

console.log('📋 18 Requirement Categories Coverage:');
console.log('-'.repeat(60));
categories.forEach(cat => {
  const stat = categoryStats[cat];
  const bar = '█'.repeat(Math.floor(stat.percentage / 5));
  console.log(`${cat.padEnd(20)} ${stat.filled.toString().padStart(4)}/${programs.length} (${stat.percentage.padStart(5)}%) ${bar}`);
});

// Check key fields
console.log('\n📝 Key Fields Coverage:');
console.log('-'.repeat(60));
const withName = programs.filter(p => p.name && p.name.length > 3).length;
const withDescription = programs.filter(p => p.description && p.description.length > 20).length;
const withFundingAmount = programs.filter(p => p.max_funding_amount || p.funding_amount).length;
const withDeadline = programs.filter(p => p.deadline || p.application_deadline).length;
const withContact = programs.filter(p => p.contact_email || p.contact_phone || p.contact_info).length;
const withUrl = programs.filter(p => p.source_url).length;

console.log(`Name:              ${withName.toString().padStart(4)}/${programs.length} (${((withName/programs.length)*100).toFixed(1).padStart(5)}%)`);
console.log(`Description:       ${withDescription.toString().padStart(4)}/${programs.length} (${((withDescription/programs.length)*100).toFixed(1).padStart(5)}%)`);
console.log(`Funding Amount:     ${withFundingAmount.toString().padStart(4)}/${programs.length} (${((withFundingAmount/programs.length)*100).toFixed(1).padStart(5)}%)`);
console.log(`Deadline:          ${withDeadline.toString().padStart(4)}/${programs.length} (${((withDeadline/programs.length)*100).toFixed(1).padStart(5)}%)`);
console.log(`Contact Info:      ${withContact.toString().padStart(4)}/${programs.length} (${((withContact/programs.length)*100).toFixed(1).padStart(5)}%)`);
console.log(`Source URL:        ${withUrl.toString().padStart(4)}/${programs.length} (${((withUrl/programs.length)*100).toFixed(1).padStart(5)}%)`);

// By institution
console.log('\n🏛️  Programs by Institution:');
console.log('-'.repeat(60));
const byInstitution = {};
programs.forEach(p => {
  const inst = p.institution || 'Unknown';
  byInstitution[inst] = (byInstitution[inst] || 0) + 1;
});

Object.entries(byInstitution)
  .sort((a, b) => b[1] - a[1])
  .forEach(([inst, count]) => {
    console.log(`${inst.padEnd(50)} ${count.toString().padStart(4)}`);
  });

// Sample problematic program
console.log('\n🔍 Sample Analysis:');
console.log('-'.repeat(60));
const emptyPrograms = programs.filter(p => {
  const catCount = Object.values(p.categorized_requirements || {}).reduce((sum, arr) => sum + (arr?.length || 0), 0);
  return catCount < 3;
});

if (emptyPrograms.length > 0) {
  console.log(`⚠️  Programs with <3 categories filled: ${emptyPrograms.length}`);
  console.log(`   Sample: ${emptyPrograms[0].name} (${emptyPrograms[0].institution})`);
  console.log(`   URL: ${emptyPrograms[0].source_url}`);
}

console.log('\n' + '='.repeat(60));



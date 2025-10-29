const fs = require('fs');

const data = JSON.parse(fs.readFileSync('data/scraped-programs-latest.json', 'utf8'));

console.log('\n📊 REQUIREMENTS ANALYSIS\n');
console.log('='.repeat(60));

const programs = data.programs;
console.log(`Total programs: ${programs.length}\n`);

// Analyze requirements population
const categories = [
  'eligibility', 'documents', 'financial', 'technical', 'legal', 
  'timeline', 'geographic', 'team', 'project', 'compliance', 
  'impact', 'capex_opex', 'use_of_funds', 'revenue_model', 
  'market_size', 'co_financing', 'trl_level', 'consortium'
];

const categoryStats = {};
categories.forEach(cat => {
  categoryStats[cat] = {
    populated: 0,
    total: 0,
    avgItems: 0
  };
});

let programsWithRequirements = 0;
let programsWithFullRequirements = 0;

programs.forEach(prog => {
  const reqs = prog.categorized_requirements || {};
  const hasAny = Object.keys(reqs).length > 0;
  
  if (hasAny) {
    programsWithRequirements++;
  }
  
  let totalCategories = 0;
  let totalItems = 0;
  
  categories.forEach(cat => {
    const items = reqs[cat] || [];
    categoryStats[cat].total++;
    if (items.length > 0) {
      categoryStats[cat].populated++;
      totalCategories++;
      totalItems += items.length;
      categoryStats[cat].avgItems += items.length;
    }
  });
  
  if (totalCategories >= 5) {
    programsWithFullRequirements++;
  }
});

console.log(`Programs with ANY requirements: ${programsWithRequirements} / ${programs.length} (${Math.round(100 * programsWithRequirements / programs.length)}%)`);
console.log(`Programs with 5+ categories: ${programsWithFullRequirements} / ${programs.length} (${Math.round(100 * programsWithFullRequirements / programs.length)}%)`);
console.log('\n📋 Category Population Stats:\n');

categories.forEach(cat => {
  const stats = categoryStats[cat];
  const pct = Math.round(100 * stats.populated / stats.total);
  const avg = stats.populated > 0 ? (stats.avgItems / stats.populated).toFixed(1) : '0';
  console.log(`  ${cat.padEnd(15)}: ${stats.populated.toString().padStart(3)}/${stats.total} (${pct.toString().padStart(3)}%) | Avg items: ${avg}`);
});

// Sample programs with most requirements
console.log('\n🏆 Top 5 Programs by Requirements Count:\n');
const sortedByReqs = programs.map(p => ({
  name: p.name.substring(0, 50),
  url: p.source_url,
  totalCategories: categories.filter(cat => (p.categorized_requirements?.[cat] || []).length > 0).length,
  totalItems: categories.reduce((sum, cat) => sum + (p.categorized_requirements?.[cat] || []).length, 0)
})).sort((a, b) => b.totalItems - a.totalItems);

sortedByReqs.slice(0, 5).forEach((p, i) => {
  console.log(`${i + 1}. ${p.name}`);
  console.log(`   Categories: ${p.totalCategories}/18, Items: ${p.totalItems}`);
  console.log(`   URL: ${p.url.substring(0, 70)}...\n`);
});

// Check for programs with rich data
console.log('\n💎 Programs with Structured Data (funding amounts, deadlines, contact):\n');
const structuredData = programs.filter(p => 
  p.funding_amount_min || p.funding_amount_max || p.deadline || p.contact_email || p.contact_phone
);

console.log(`  ${structuredData.length} / ${programs.length} programs have structured data`);
if (structuredData.length > 0) {
  console.log(`  Sample: ${structuredData[0].name}`);
  console.log(`    Funding: ${structuredData[0].funding_amount_min || 'N/A'} - ${structuredData[0].funding_amount_max || 'N/A'}`);
  console.log(`    Deadline: ${structuredData[0].deadline || 'N/A'}`);
  console.log(`    Contact: ${structuredData[0].contact_email || structuredData[0].contact_phone || 'N/A'}`);
}


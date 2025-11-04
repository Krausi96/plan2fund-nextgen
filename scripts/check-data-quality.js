// Check data quality: Compare JSON fallback vs what database should have
// Run with: node scripts/check-data-quality.js

const path = require('path');
const fs = require('fs');

async function checkDataQuality() {
  console.log('🔍 Checking data quality for wizard...\n');
  
  // Load JSON fallback
  const jsonPath = path.join(process.cwd(), 'scraper-lite', 'data', 'legacy', 'scraped-programs-latest.json');
  if (!fs.existsSync(jsonPath)) {
    console.error('❌ JSON fallback not found');
    return;
  }
  
  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const programs = data.programs || [];
  
  console.log(`📊 Total programs: ${programs.length}\n`);
  
  // Check categorized_requirements
  let withReqs = 0;
  let withoutReqs = 0;
  let totalCategories = 0;
  let programsByCategoryCount = {};
  
  programs.forEach(program => {
    const categorized = program.categorized_requirements;
    if (!categorized || typeof categorized !== 'object') {
      withoutReqs++;
      return;
    }
    
    withReqs++;
    const categoryCount = Object.keys(categorized).length;
    totalCategories += categoryCount;
    programsByCategoryCount[categoryCount] = (programsByCategoryCount[categoryCount] || 0) + 1;
  });
  
  console.log(`📋 Categorized Requirements:`);
  console.log(`  Programs with requirements: ${withReqs} (${Math.round(withReqs/programs.length*100)}%)`);
  console.log(`  Programs without requirements: ${withoutReqs} (${Math.round(withoutReqs/programs.length*100)}%)`);
  console.log(`  Average categories per program: ${Math.round(totalCategories/withReqs)}`);
  console.log(`\n  Distribution by category count:`);
  Object.entries(programsByCategoryCount)
    .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
    .forEach(([count, num]) => {
      console.log(`    ${count} categories: ${num} programs`);
    });
  
  // Check requirement types
  const requirementTypes = new Map();
  programs.forEach(program => {
    const categorized = program.categorized_requirements;
    if (!categorized || typeof categorized !== 'object') return;
    
    Object.entries(categorized).forEach(([category, items]) => {
      if (!Array.isArray(items)) return;
      
      items.forEach(item => {
        if (!item || typeof item !== 'object') return;
        const reqType = item.type || 'unknown';
        const key = `${category}:${reqType}`;
        requirementTypes.set(key, (requirementTypes.get(key) || 0) + 1);
      });
    });
  });
  
  console.log(`\n📊 Requirement Types Found: ${requirementTypes.size}`);
  console.log(`  Top 20 most common:`);
  Array.from(requirementTypes.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .forEach(([key, count]) => {
      const percentage = Math.round((count / programs.length) * 100);
      console.log(`    ${key}: ${count} programs (${percentage}%)`);
    });
  
  // Estimate question generation
  const MIN_FREQUENCY = Math.max(3, Math.floor(programs.length * 0.05));
  console.log(`\n🎯 Question Generation Estimate:`);
  console.log(`  Minimum frequency threshold: ${MIN_FREQUENCY} programs (5% of ${programs.length})`);
  const eligibleReqs = Array.from(requirementTypes.entries())
    .filter(([_, count]) => count >= MIN_FREQUENCY)
    .length;
  console.log(`  Eligible requirement types: ${eligibleReqs}`);
  console.log(`  Estimated questions (max 10): ${Math.min(eligibleReqs, 10)}`);
  
  // Check for potential issues
  console.log(`\n⚠️ Potential Issues:`);
  if (withReqs < programs.length * 0.9) {
    console.log(`  ❌ Less than 90% of programs have requirements (${Math.round(withReqs/programs.length*100)}%)`);
  }
  if (totalCategories / withReqs < 5) {
    console.log(`  ❌ Average categories per program is low (${Math.round(totalCategories/withReqs)})`);
  }
  if (eligibleReqs < 5) {
    console.log(`  ❌ Few eligible requirement types for questions (${eligibleReqs})`);
    console.log(`     This could cause only ${eligibleReqs} questions to be generated!`);
  }
}

checkDataQuality().catch(console.error);


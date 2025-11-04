// Check data completeness: How many programs have requirements?
// Run with: node scripts/check-data-completeness.js

const path = require('path');
const fs = require('fs');

async function checkDataCompleteness() {
  console.log('🔍 Checking data completeness...\n');
  
  let programs = [];
  let source = 'unknown';
  
  // Try database first
  try {
    const { getPool } = require('../scraper-lite/src/db/neon-client');
    const { getAllPages } = require('../scraper-lite/src/db/page-repository');
    const pool = getPool();
    
    const pages = await getAllPages(1000);
    
    if (pages.length > 0) {
      console.log(`✅ Database: ${pages.length} pages found`);
      
      // Check requirements
      const reqResult = await pool.query('SELECT COUNT(*) as total FROM requirements');
      const totalReqs = parseInt(reqResult.rows[0].total);
      console.log(`✅ Database: ${totalReqs} total requirements`);
      
      // Check pages with requirements
      const pagesWithReqsResult = await pool.query('SELECT COUNT(DISTINCT page_id) as total FROM requirements');
      const pagesWithReqs = parseInt(pagesWithReqsResult.rows[0].total);
      console.log(`✅ Database: ${pagesWithReqs} pages have requirements`);
      
      // Load programs with requirements
      programs = await Promise.all(pages.map(async (page) => {
        const reqResult = await pool.query(
          'SELECT category, type, value, required, source, description, format, requirements FROM requirements WHERE page_id = $1',
          [page.id]
        );
        
        const categorized_requirements = {};
        reqResult.rows.forEach((row) => {
          if (!categorized_requirements[row.category]) {
            categorized_requirements[row.category] = [];
          }
          
          let parsedValue = row.value;
          try {
            if (typeof row.value === 'string' && (row.value.startsWith('{') || row.value.startsWith('['))) {
              parsedValue = JSON.parse(row.value);
            }
          } catch (e) {}
          
          categorized_requirements[row.category].push({
            type: row.type,
            value: parsedValue,
            required: row.required,
            source: row.source,
            description: row.description,
            format: row.format
          });
        });
        
        return {
          id: `page_${page.id}`,
          name: page.title || page.url,
          categorized_requirements,
          hasRequirements: Object.keys(categorized_requirements).length > 0
        };
      }));
      
      source = 'database';
    }
  } catch (error) {
    console.warn(`⚠️ Database error: ${error.message}`);
    console.log('🔄 Trying JSON fallback...\n');
  }
  
  // Fallback to JSON
  if (programs.length === 0) {
    const jsonPath = path.join(process.cwd(), 'scraper-lite', 'data', 'legacy', 'scraped-programs-latest.json');
    if (fs.existsSync(jsonPath)) {
      const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      programs = (data.programs || []).map(p => ({
        id: p.id,
        name: p.name,
        categorized_requirements: p.categorized_requirements || {},
        hasRequirements: p.categorized_requirements && Object.keys(p.categorized_requirements).length > 0
      }));
      source = 'json';
      console.log(`✅ JSON: ${programs.length} programs loaded`);
    }
  }
  
  if (programs.length === 0) {
    console.error('❌ No programs found in database or JSON');
    return;
  }
  
  console.log(`\n📊 Data Completeness Analysis (Source: ${source}):`);
  console.log('='.repeat(60));
  
  // Programs with/without requirements
  const withReqs = programs.filter(p => p.hasRequirements).length;
  const withoutReqs = programs.length - withReqs;
  console.log(`\n📦 Programs:`);
  console.log(`  Total: ${programs.length}`);
  console.log(`  With requirements: ${withReqs} (${Math.round(withReqs/programs.length*100)}%)`);
  console.log(`  Without requirements: ${withoutReqs} (${Math.round(withoutReqs/programs.length*100)}%)`);
  
  // Category distribution
  const categoryCounts = {};
  const typeCounts = {};
  let totalRequirements = 0;
  
  programs.forEach(program => {
    if (!program.categorized_requirements) return;
    
    Object.entries(program.categorized_requirements).forEach(([category, items]) => {
      if (!Array.isArray(items)) return;
      
      categoryCounts[category] = (categoryCounts[category] || 0) + items.length;
      
      items.forEach(item => {
        if (item && item.type) {
          const key = `${category}:${item.type}`;
          typeCounts[key] = (typeCounts[key] || 0) + 1;
          totalRequirements++;
        }
      });
    });
  });
  
  console.log(`\n📊 Requirements:`);
  console.log(`  Total requirements: ${totalRequirements}`);
  console.log(`  Average per program: ${Math.round(totalRequirements/programs.length)}`);
  
  console.log(`\n📋 Categories (how many programs have each category):`);
  const sortedCategories = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20);
  sortedCategories.forEach(([category, count]) => {
    const percentage = Math.round((count / programs.length) * 100);
    console.log(`  ${category}: ${count} programs (${percentage}%)`);
  });
  
  console.log(`\n🔧 Top Requirement Types (frequency):`);
  const sortedTypes = Object.entries(typeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20);
  sortedTypes.forEach(([type, count]) => {
    const percentage = Math.round((count / programs.length) * 100);
    console.log(`  ${type}: ${count} programs (${percentage}%)`);
  });
  
  // Check for missing data patterns
  console.log(`\n⚠️ Missing Data Patterns:`);
  const categories = ['geographic', 'team', 'financial', 'project', 'technical', 'consortium', 'impact', 'eligibility'];
  categories.forEach(cat => {
    const hasCategory = programs.filter(p => 
      p.categorized_requirements && 
      p.categorized_requirements[cat] && 
      p.categorized_requirements[cat].length > 0
    ).length;
    const percentage = Math.round((hasCategory / programs.length) * 100);
    console.log(`  ${cat}: ${hasCategory}/${programs.length} (${percentage}%)`);
  });
  
  console.log(`\n✅ Data completeness check complete!`);
}

checkDataCompleteness().catch(console.error);


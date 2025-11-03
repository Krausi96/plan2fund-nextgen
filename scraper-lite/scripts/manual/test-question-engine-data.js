/**
 * Test script to verify QuestionEngine receives correct data structure
 * Tests: Database → API → QuestionEngine format
 */

const path = require('path');

async function testQuestionEngineData() {
  console.log('🧪 Testing QuestionEngine Data Structure...\n');
  
  try {
    // Register ts-node to handle TypeScript imports
    require('ts-node').register({
      transpileOnly: true,
      compilerOptions: {
        module: 'commonjs',
        esModuleInterop: true
      }
    });
    
    // Import database functions
    const { getAllPages } = require('../src/db/page-repository.ts');
    const { getPool } = require('../src/db/neon-client.ts');
    const pool = getPool();
    
    // Get sample pages
    const pages = await getAllPages(5);
    console.log(`✅ Found ${pages.length} pages in database\n`);
    
    if (pages.length === 0) {
      console.error('❌ No pages found in database!');
      return;
    }
    
    // Check each page
    for (const page of pages) {
      console.log(`\n📄 Testing page: ${page.title || page.url} (ID: ${page.id})`);
      
      // Get requirements
      const reqResult = await pool.query(
        'SELECT category, type, value, required, source, description, format FROM requirements WHERE page_id = $1',
        [page.id]
      );
      
      console.log(`  📋 Requirements count: ${reqResult.rows.length}`);
      
      // Group by category (like API does)
      const categorized_requirements = {};
      reqResult.rows.forEach((row) => {
        if (!categorized_requirements[row.category]) {
          categorized_requirements[row.category] = [];
        }
        
        // Parse value if JSON
        let parsedValue = row.value;
        try {
          if (typeof row.value === 'string' && (row.value.startsWith('{') || row.value.startsWith('['))) {
            parsedValue = JSON.parse(row.value);
          }
        } catch (e) {
          // Not JSON
        }
        
        categorized_requirements[row.category].push({
          type: row.type,
          value: parsedValue,
          required: row.required,
          source: row.source,
          description: row.description,
          format: row.format
        });
      });
      
      // Build eligibility_criteria
      const eligibility_criteria = {};
      if (categorized_requirements.geographic) {
        const location = categorized_requirements.geographic.find(r => r.type === 'location');
        if (location) eligibility_criteria.location = location.value;
      }
      
      if (categorized_requirements.team) {
        const maxAge = categorized_requirements.team.find(r => r.type === 'max_company_age');
        if (maxAge) eligibility_criteria.max_company_age = parseInt(maxAge.value) || null;
        
        const minTeam = categorized_requirements.team.find(r => r.type === 'min_team_size');
        if (minTeam) eligibility_criteria.min_team_size = parseInt(minTeam.value) || null;
      }
      
      if (categorized_requirements.financial) {
        const revenue = categorized_requirements.financial.find(r => r.type === 'revenue_range' || r.type === 'revenue');
        if (revenue && typeof revenue.value === 'object') {
          eligibility_criteria.revenue_min = revenue.value.min;
          eligibility_criteria.revenue_max = revenue.value.max;
        }
      }
      
      // Create program object (like API does)
      const program = {
        id: `page_${page.id}`,
        name: page.title || page.url,
        type: (page.funding_types && page.funding_types.length > 0) ? page.funding_types[0] : 'grant',
        eligibility_criteria,
        categorized_requirements
      };
      
      // Verify structure
      console.log(`  ✅ Program ID: ${program.id}`);
      console.log(`  ✅ Has eligibility_criteria: ${Object.keys(program.eligibility_criteria).length > 0 ? 'YES' : 'NO'}`);
      console.log(`  ✅ Has categorized_requirements: ${Object.keys(program.categorized_requirements).length > 0 ? 'YES' : 'NO'}`);
      console.log(`  ✅ Categories found: ${Object.keys(program.categorized_requirements).join(', ') || 'NONE'}`);
      
      // Check what QuestionEngine expects
      const hasLocation = !!program.eligibility_criteria.location || !!(program.categorized_requirements.geographic && program.categorized_requirements.geographic.length > 0);
      const hasAge = !!program.eligibility_criteria.max_company_age || !!(program.categorized_requirements.team && program.categorized_requirements.team.find(r => r.type === 'max_company_age'));
      const hasRevenue = !!program.eligibility_criteria.revenue_min || !!(program.categorized_requirements.financial && program.categorized_requirements.financial.length > 0);
      
      console.log(`  📊 QuestionEngine compatibility:`);
      console.log(`     - Location data: ${hasLocation ? '✅' : '❌'}`);
      console.log(`     - Age data: ${hasAge ? '✅' : '❌'}`);
      console.log(`     - Revenue data: ${hasRevenue ? '✅' : '❌'}`);
    }
    
    console.log('\n✅ Data structure test complete!');
    console.log('\n💡 Next: Test API endpoint to verify same structure');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error(error.stack);
  }
}

// Export for use in auto-cycle
if (require.main === module) {
  testQuestionEngineData();
} else {
  module.exports = { testQuestionEngineData };
}


/**
 * Show Actual Requirement Structure - What's actually in the database
 */

require('dotenv').config({ path: '.env.local' });

require('ts-node').register({
  transpileOnly: true,
  compilerOptions: {
    module: 'commonjs',
    target: 'ES2020',
    esModuleInterop: true,
    allowSyntheticDefaultImports: true,
    skipLibCheck: true,
    moduleResolution: 'node'
  }
});

async function showRequirements() {
  const { getPool } = require('../scraper-lite/src/db/neon-client');
  const pool = getPool();
  
  console.log('📊 ACTUAL DATABASE REQUIREMENT STRUCTURE');
  console.log('='.repeat(80));
  console.log();
  
  // Get top requirement types with sample values
  const result = await pool.query(`
    SELECT 
      category, 
      type, 
      COUNT(*) as count,
      COUNT(DISTINCT value) as unique_values
    FROM requirements 
    WHERE category IN ('geographic', 'eligibility', 'financial', 'consortium', 'team', 'impact')
    GROUP BY category, type
    ORDER BY count DESC
    LIMIT 30
  `);
  
  console.log('📋 TOP REQUIREMENT TYPES:');
  console.log();
  
  for (const row of result.rows) {
    console.log(`${row.category}:${row.type}`);
    console.log(`   Count: ${row.count} requirements`);
    console.log(`   Unique values: ${row.unique_values}`);
    
    // Get sample values
    const samples = await pool.query(`
      SELECT value 
      FROM requirements 
      WHERE category = $1 AND type = $2 
      AND value IS NOT NULL 
      AND value != ''
      LIMIT 5
    `, [row.category, row.type]);
    
    console.log(`   Sample values:`);
    samples.rows.forEach((s, idx) => {
      const val = String(s.value || '').substring(0, 80);
      console.log(`     ${idx + 1}. ${val}${val.length >= 80 ? '...' : ''}`);
    });
    console.log();
  }
  
  // Check what location values actually look like
  console.log('\n🌍 LOCATION REQUIREMENTS (actual values):');
  console.log('-'.repeat(80));
  const locationReqs = await pool.query(`
    SELECT DISTINCT value 
    FROM requirements 
    WHERE category = 'geographic' 
    AND (type = 'location' OR type = 'specific_location' OR type = 'region')
    AND value IS NOT NULL
    LIMIT 20
  `);
  locationReqs.rows.forEach((r, idx) => {
    console.log(`${idx + 1}. ${r.value}`);
  });
  
  // Check company type values
  console.log('\n🏢 COMPANY TYPE REQUIREMENTS (actual values):');
  console.log('-'.repeat(80));
  const companyReqs = await pool.query(`
    SELECT DISTINCT value 
    FROM requirements 
    WHERE category = 'eligibility' 
    AND (type = 'company_type' OR type = 'company_stage')
    AND value IS NOT NULL
    LIMIT 20
  `);
  companyReqs.rows.forEach((r, idx) => {
    console.log(`${idx + 1}. ${r.value}`);
  });
  
  await pool.end();
}

showRequirements().catch(console.error);


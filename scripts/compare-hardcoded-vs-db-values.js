/**
 * Compare Hardcoded Options vs Database Values
 * Shows what would change if we extract from DB
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

async function showComparison() {
  const { getPool } = require('../scraper-lite/src/db/neon-client');
  const pool = getPool();
  
  console.log('📊 HARDCODED vs DATABASE VALUES COMPARISON');
  console.log('='.repeat(80));
  console.log();
  
  // 1. Location
  console.log('1. LOCATION');
  console.log('-'.repeat(80));
  console.log('Current (Hardcoded): eu, international, austria, germany, vienna');
  console.log('\nActual DB Values:');
  const locationVals = await pool.query(`
    SELECT DISTINCT value 
    FROM requirements 
    WHERE category = 'geographic' 
    AND type IN ('location', 'specific_location', 'region', 'city', 'country')
    AND value IS NOT NULL
    LIMIT 15
  `);
  locationVals.rows.forEach((r, idx) => {
    const val = String(r.value).substring(0, 60);
    console.log(`   ${idx + 1}. ${val}${val.length >= 60 ? '...' : ''}`);
  });
  console.log('\n💡 Change: Would extract "Austria", "EU", "Tyrol", "Vienna" from messy addresses');
  console.log();
  
  // 2. Company Type
  console.log('2. COMPANY_TYPE');
  console.log('-'.repeat(80));
  console.log('Current (Hardcoded): startup, sme, large, research');
  console.log('\nActual DB Values:');
  const companyVals = await pool.query(`
    SELECT DISTINCT value 
    FROM requirements 
    WHERE category = 'eligibility' 
    AND type IN ('company_type', 'company_stage')
    AND value IS NOT NULL
    LIMIT 15
  `);
  companyVals.rows.forEach((r, idx) => {
    const val = String(r.value).substring(0, 60);
    console.log(`   ${idx + 1}. ${val}${val.length >= 60 ? '...' : ''}`);
  });
  console.log('\n💡 Change: Would extract "Startup", "Company", "Ideation / Concept Stage" and normalize');
  console.log();
  
  // 3. Funding Amount
  console.log('3. FUNDING_AMOUNT');
  console.log('-'.repeat(80));
  console.log('Current (Hardcoded): €200k-€500k, Over €500k');
  console.log('\nActual DB Values:');
  const fundingVals = await pool.query(`
    SELECT DISTINCT value 
    FROM requirements 
    WHERE category = 'financial' 
    AND type IN ('funding_amount', 'funding_amount_max')
    AND value IS NOT NULL
    LIMIT 15
  `);
  fundingVals.rows.forEach((r, idx) => {
    const val = String(r.value).substring(0, 60);
    console.log(`   ${idx + 1}. ${val}${val.length >= 60 ? '...' : ''}`);
  });
  console.log('\n💡 Change: Would parse "30,21 €", "6 million", "18 million" and create proper ranges');
  console.log();
  
  // 4. Impact
  console.log('4. IMPACT');
  console.log('-'.repeat(80));
  console.log('Current (Hardcoded): sustainability, employment, social, climate, economic');
  console.log('\nActual DB Values:');
  const impactVals = await pool.query(`
    SELECT DISTINCT type, value 
    FROM requirements 
    WHERE category = 'impact'
    AND value IS NOT NULL
    LIMIT 15
  `);
  impactVals.rows.forEach((r, idx) => {
    const val = String(r.value || r.type).substring(0, 60);
    console.log(`   ${idx + 1}. [${r.type}] ${val}${val.length >= 60 ? '...' : ''}`);
  });
  console.log('\n💡 Change: Would extract impact types: sustainability, climate_environmental, social, employment');
  console.log();
  
  // 5. Auto-generated questions (garbage)
  console.log('5. AUTO-GENERATED QUESTIONS (Timeline, Documents, etc.)');
  console.log('-'.repeat(80));
  console.log('Current Problem: Using raw scraped text as options');
  console.log('Examples of garbage options:');
  console.log('   - "georg bauerscience educationt +43 (0) 664 88 32 60 38georg"');
  console.log('   - "unbedingt notwendig, während andere uns helfen..."');
  console.log('   - "zeitraum gespeichert"');
  console.log('\n💡 Change: Would either:');
  console.log('   a) Skip these questions (they\'re informational, not filters)');
  console.log('   b) Extract clean values only (if they can be filtered)');
  console.log();
  
  await pool.end();
  
  console.log('\n📊 SUMMARY: What Would Change');
  console.log('='.repeat(80));
  console.log('\n✅ PROS of extracting from DB:');
  console.log('   - Options match actual database values');
  console.log('   - Higher accuracy (programs match answers)');
  console.log('   - Questions adapt to actual data');
  console.log('\n❌ CONS of extracting from DB:');
  console.log('   - Need normalization/cleaning (messy scraped data)');
  console.log('   - Need grouping (similar values together)');
  console.log('   - Need validation (can\'t use garbage like phone numbers)');
  console.log('   - More complex logic');
  console.log('\n💡 ALTERNATIVE: Keep hardcoded options BUT:');
  console.log('   - Fix matching logic to map DB values to hardcoded options');
  console.log('   - Example: DB has "Startup" → map to hardcoded "startup"');
  console.log('   - Example: DB has "Austria" → map to hardcoded "austria"');
  console.log('   - This is simpler and still works if matching is correct');
}

showComparison().catch(console.error);


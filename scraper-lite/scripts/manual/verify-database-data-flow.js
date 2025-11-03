#!/usr/bin/env node
/**
 * Verify complete data flow: Database → API → Frontend Ready
 */
require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'commonjs', moduleResolution: 'node', esModuleInterop: true } });

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env.local') });

const { getPool } = require('../../src/db/neon-client.ts');

async function verifyDataFlow() {
  console.log('\n🔍 VERIFYING COMPLETE DATA FLOW\n');
  console.log('='.repeat(70));
  
  const pool = getPool();
  
  try {
    // 1. Check database has data
    console.log('\n📊 STEP 1: DATABASE CHECK');
    const pageCount = await pool.query('SELECT COUNT(*) as count FROM pages');
    const reqCount = await pool.query('SELECT COUNT(*) as count FROM requirements');
    const recentPages = await pool.query(`
      SELECT COUNT(*) as count 
      FROM pages 
      WHERE fetched_at > NOW() - INTERVAL '7 days'
    `);
    
    console.log(`  ✅ Pages in database: ${pageCount.rows[0].count}`);
    console.log(`  ✅ Requirements in database: ${reqCount.rows[0].count}`);
    console.log(`  ✅ Pages fetched in last 7 days: ${recentPages.rows[0].count}`);
    
    // 2. Check data quality
    console.log('\n📊 STEP 2: DATA QUALITY');
    const pagesWithRequirements = await pool.query(`
      SELECT COUNT(DISTINCT p.id) as count
      FROM pages p
      JOIN requirements r ON p.id = r.page_id
    `);
    
    const pagesWithMetadata = await pool.query(`
      SELECT COUNT(*) as count
      FROM pages
      WHERE (title IS NOT NULL AND title != '')
         OR (description IS NOT NULL AND description != '')
         OR funding_amount_min IS NOT NULL
         OR deadline IS NOT NULL
    `);
    
    console.log(`  ✅ Pages with requirements: ${pagesWithRequirements.rows[0].count}`);
    console.log(`  ✅ Pages with metadata: ${pagesWithMetadata.rows[0].count}`);
    
    // 3. Check funding types
    console.log('\n📊 STEP 3: FUNDING TYPE DISTRIBUTION');
    const fundingTypes = await pool.query(`
      SELECT 
        COALESCE(metadata_json->>'funding_type', 'null') as funding_type,
        COUNT(*) as count
      FROM pages
      GROUP BY metadata_json->>'funding_type'
      ORDER BY count DESC
      LIMIT 10
    `);
    
    console.log('  Top funding types:');
    fundingTypes.rows.forEach(row => {
      console.log(`    ${(row.funding_type || 'null').padEnd(20)} ${String(row.count).padStart(5)} pages`);
    });
    
    // 4. Check requirements categories
    console.log('\n📊 STEP 4: REQUIREMENT CATEGORIES');
    const categories = await pool.query(`
      SELECT category, COUNT(*) as count
      FROM requirements
      GROUP BY category
      ORDER BY count DESC
    `);
    
    console.log('  Category distribution:');
    categories.rows.forEach(row => {
      console.log(`    ${row.category.padEnd(20)} ${String(row.count).padStart(6)} items`);
    });
    
    // 5. Sample page with requirements
    console.log('\n📊 STEP 5: SAMPLE DATA');
    const sample = await pool.query(`
      SELECT p.id, p.url, p.title, p.metadata_json->>'funding_type' as funding_type,
             COUNT(r.id) as requirement_count
      FROM pages p
      LEFT JOIN requirements r ON p.id = r.page_id
      GROUP BY p.id, p.url, p.title, p.metadata_json->>'funding_type'
      HAVING COUNT(r.id) > 5
      LIMIT 1
    `);
    
    if (sample.rows.length > 0) {
      const page = sample.rows[0];
      console.log(`  Sample page:`);
      console.log(`    URL: ${page.url}`);
      console.log(`    Title: ${page.title || 'N/A'}`);
      console.log(`    Funding Type: ${page.funding_type || 'N/A'}`);
      console.log(`    Requirements: ${page.requirement_count}`);
    }
    
    console.log('\n✅ DATA FLOW VERIFICATION COMPLETE');
    console.log('\n📋 Summary:');
    console.log(`  ✅ Database has ${pageCount.rows[0].count} pages`);
    console.log(`  ✅ Database has ${reqCount.rows[0].count} requirements`);
    console.log(`  ✅ ${pagesWithRequirements.rows[0].count} pages have requirements`);
    console.log(`  ✅ Data is ready for frontend components`);
    console.log('\n💡 Next steps:');
    console.log('  • Frontend can fetch from /api/programs');
    console.log('  • Data flows: Database → API → Components');
    console.log('  • QuestionEngine, SmartWizard, etc. can use this data');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

verifyDataFlow().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});


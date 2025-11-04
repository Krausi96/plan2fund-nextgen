/**
 * Check Database Rows - Verify actual data in database
 */

require('dotenv').config({ path: '.env.local' });

// Register ts-node
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

async function checkDatabase() {
  const { getPool } = require('../scraper-lite/src/db/neon-client');
  const pool = getPool();
  
  console.log('📊 DATABASE ROW COUNT CHECK');
  console.log('='.repeat(80));
  console.log();
  
  try {
    // Count pages
    const pagesResult = await pool.query('SELECT COUNT(*) as count FROM pages');
    const pageCount = parseInt(pagesResult.rows[0].count);
    console.log(`📄 Pages table: ${pageCount} rows`);
    
    // Count requirements
    const reqResult = await pool.query('SELECT COUNT(*) as count FROM requirements');
    const reqCount = parseInt(reqResult.rows[0].count);
    console.log(`📋 Requirements table: ${reqCount} rows`);
    
    // Count by category
    const categoryResult = await pool.query(`
      SELECT category, COUNT(*) as count 
      FROM requirements 
      GROUP BY category 
      ORDER BY count DESC
    `);
    console.log(`\n📊 Requirements by Category:`);
    categoryResult.rows.forEach((row, idx) => {
      console.log(`   ${idx + 1}. ${row.category}: ${row.count} requirements`);
    });
    
    // Count by type (top 20)
    const typeResult = await pool.query(`
      SELECT category, type, COUNT(*) as count 
      FROM requirements 
      GROUP BY category, type 
      ORDER BY count DESC
      LIMIT 20
    `);
    console.log(`\n📊 Top 20 Requirement Types:`);
    typeResult.rows.forEach((row, idx) => {
      console.log(`   ${idx + 1}. ${row.category}:${row.type} - ${row.count} requirements`);
    });
    
    // Check pages with requirements
    const pagesWithReqsResult = await pool.query(`
      SELECT COUNT(DISTINCT page_id) as count 
      FROM requirements
    `);
    const pagesWithReqs = parseInt(pagesWithReqsResult.rows[0].count);
    console.log(`\n📊 Pages with requirements: ${pagesWithReqs} / ${pageCount}`);
    
    // Check geographic requirements specifically
    const geoResult = await pool.query(`
      SELECT type, COUNT(*) as count 
      FROM requirements 
      WHERE category = 'geographic'
      GROUP BY type 
      ORDER BY count DESC
    `);
    console.log(`\n🌍 Geographic Requirements:`);
    geoResult.rows.forEach((row) => {
      console.log(`   ${row.type}: ${row.count} requirements`);
    });
    
    // Check eligibility requirements
    const eligibilityResult = await pool.query(`
      SELECT type, COUNT(*) as count 
      FROM requirements 
      WHERE category = 'eligibility'
      GROUP BY type 
      ORDER BY count DESC
    `);
    console.log(`\n✅ Eligibility Requirements:`);
    eligibilityResult.rows.forEach((row) => {
      console.log(`   ${row.type}: ${row.count} requirements`);
    });
    
    // Check financial requirements
    const financialResult = await pool.query(`
      SELECT type, COUNT(*) as count 
      FROM requirements 
      WHERE category = 'financial'
      GROUP BY type 
      ORDER BY count DESC
    `);
    console.log(`\n💰 Financial Requirements:`);
    financialResult.rows.forEach((row) => {
      console.log(`   ${row.type}: ${row.count} requirements`);
    });
    
    // Sample a few pages to see what data looks like
    console.log(`\n📄 Sample Pages (first 5):`);
    const samplePages = await pool.query(`
      SELECT id, title, url, region, fetched_at 
      FROM pages 
      ORDER BY id 
      LIMIT 5
    `);
    samplePages.rows.forEach((page, idx) => {
      console.log(`   ${idx + 1}. ID: ${page.id}, Title: ${page.title?.substring(0, 50) || 'N/A'}...`);
      console.log(`      URL: ${page.url}`);
      console.log(`      Region: ${page.region || 'N/A'}`);
    });
    
    // Check requirements for first page
    if (samplePages.rows.length > 0) {
      const firstPageId = samplePages.rows[0].id;
      const firstPageReqs = await pool.query(`
        SELECT category, type, value 
        FROM requirements 
        WHERE page_id = $1 
        LIMIT 10
      `, [firstPageId]);
      console.log(`\n📋 Sample Requirements for Page ${firstPageId}:`);
      firstPageReqs.rows.forEach((req, idx) => {
        const valueStr = String(req.value || '').substring(0, 60);
        console.log(`   ${idx + 1}. ${req.category}:${req.type} = ${valueStr}...`);
      });
    }
    
    await pool.end();
    
    console.log(`\n✅ Database check complete!`);
    console.log(`\n📊 SUMMARY:`);
    console.log(`   Total Pages: ${pageCount}`);
    console.log(`   Total Requirements: ${reqCount}`);
    console.log(`   Pages with Requirements: ${pagesWithReqs}`);
    console.log(`   Avg Requirements per Page: ${(reqCount / pagesWithReqs).toFixed(1)}`);
    
  } catch (error) {
    console.error('❌ Database check failed:', error);
    if (error.stack) {
      console.error(error.stack);
    }
    await pool.end();
    process.exit(1);
  }
}

checkDatabase();


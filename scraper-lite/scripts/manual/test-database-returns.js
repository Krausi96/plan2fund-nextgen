#!/usr/bin/env node
/**
 * Test Database Returns - Verify scraper-lite saves and retrieves data correctly
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env.local') });
require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'commonjs', moduleResolution: 'node', esModuleInterop: true } });

const { getPool } = require('../src/db/neon-client.ts');
const { searchPages, getAllPages } = require('../src/db/page-repository.ts');
const fs = require('fs');
const path = require('path');

async function testDatabaseReturns() {
  console.log('\n🔍 Testing Database Returns & Storage Verification\n');
  console.log('='.repeat(70));
  
  const pool = getPool();
  
  try {
    // 1. Check database connection
    console.log('\n1️⃣ Database Connection:');
    await pool.query('SELECT NOW()');
    console.log('   ✅ Database connection working');
    
    // 2. Check pages table
    console.log('\n2️⃣ Pages Table:');
    const pageCount = await pool.query('SELECT COUNT(*) as count FROM pages');
    console.log(`   Total pages: ${pageCount.rows[0].count}`);
    
    // 3. Check requirements table
    console.log('\n3️⃣ Requirements Table:');
    const reqCount = await pool.query('SELECT COUNT(*) as count FROM requirements');
    console.log(`   Total requirements: ${reqCount.rows[0].count}`);
    
    // 4. Check document requirements specifically
    console.log('\n4️⃣ Document Requirements:');
    const docReqs = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN required = true THEN 1 END) as required,
        COUNT(CASE WHEN required = false THEN 1 END) as optional,
        COUNT(CASE WHEN description IS NOT NULL THEN 1 END) as with_structure,
        COUNT(CASE WHEN format IS NOT NULL THEN 1 END) as with_format
      FROM requirements
      WHERE category = 'documents'
    `);
    
    const docStats = docReqs.rows[0];
    console.log(`   Total documents: ${docStats.total}`);
    console.log(`   Required: ${docStats.required} (${((docStats.required/docStats.total)*100).toFixed(1)}%)`);
    console.log(`   Optional: ${docStats.optional} (${((docStats.optional/docStats.total)*100).toFixed(1)}%)`);
    console.log(`   With structure: ${docStats.with_structure} (${((docStats.with_structure/docStats.total)*100).toFixed(1)}%)`);
    console.log(`   With format: ${docStats.with_format} (${((docStats.with_format/docStats.total)*100).toFixed(1)}%)`);
    
    // 5. Sample page with documents
    console.log('\n5️⃣ Sample Page with Documents:');
    const samplePage = await pool.query(`
      SELECT 
        p.id,
        p.url,
        p.title,
        COUNT(r.id) as doc_count,
        COUNT(CASE WHEN r.required = true THEN 1 END) as required_docs
      FROM pages p
      LEFT JOIN requirements r ON p.id = r.page_id AND r.category = 'documents'
      GROUP BY p.id, p.url, p.title
      HAVING COUNT(r.id) > 0
      LIMIT 1
    `);
    
    if (samplePage.rows.length > 0) {
      const page = samplePage.rows[0];
      console.log(`   Page: ${page.title || page.url}`);
      console.log(`   Document count: ${page.doc_count}`);
      console.log(`   Required documents: ${page.required_docs}`);
      
      // Get actual documents
      const docs = await pool.query(`
        SELECT type, value, required, description, format
        FROM requirements
        WHERE page_id = $1 AND category = 'documents'
        LIMIT 5
      `, [page.id]);
      
      console.log(`\n   Sample documents:`);
      docs.rows.forEach((doc, i) => {
        console.log(`   ${i + 1}. ${doc.value.substring(0, 60)}`);
        console.log(`      Required: ${doc.required ? '✅ Yes' : '⚪ No'}`);
        if (doc.description) console.log(`      Structure: ${doc.description.substring(0, 50)}...`);
        if (doc.format) console.log(`      Format: ${doc.format}`);
      });
    } else {
      console.log('   ⚠️  No pages with documents found');
    }
    
    // 6. Test page-repository functions
    console.log('\n6️⃣ Testing page-repository Functions:');
    try {
      const allPages = await getAllPages(5);
      console.log(`   getAllPages(5): ${allPages.length} pages`);
      
      const searchResults = await searchPages({ limit: 5 });
      console.log(`   searchPages({limit: 5}): ${searchResults.length} pages`);
      
      if (allPages.length > 0) {
        const testPage = allPages[0];
        console.log(`\n   Sample page from repository:`);
        console.log(`   ID: ${testPage.id}`);
        console.log(`   Title: ${testPage.title || 'N/A'}`);
        console.log(`   URL: ${testPage.url}`);
        console.log(`   Requirements available: ${testPage.categorized_requirements ? 'Yes' : 'No'}`);
      }
    } catch (error) {
      console.log(`   ❌ Error testing repository: ${error.message}`);
    }
    
    // 7. Check fallback storage (JSON files)
    console.log('\n7️⃣ Fallback Storage (JSON Files):');
    const jsonPaths = [
      path.join(__dirname, '..', 'data', 'lite', 'state.json'),
      path.join(__dirname, '..', 'data', 'legacy', 'scraped-programs-latest.json'),
      path.join(__dirname, '..', 'data', 'legacy', 'migrated-programs.json')
    ];
    
    let jsonFound = false;
    jsonPaths.forEach(jsonPath => {
      if (fs.existsSync(jsonPath)) {
        const stats = fs.statSync(jsonPath);
        const sizeKB = (stats.size / 1024).toFixed(2);
        console.log(`   ✅ ${path.basename(jsonPath)}: ${sizeKB} KB`);
        jsonFound = true;
      } else {
        console.log(`   ⚪ ${path.basename(jsonPath)}: Not found`);
      }
    });
    
    if (!jsonFound) {
      console.log('   ⚠️  No JSON fallback files found (database is primary)');
    }
    
    // 8. Verify data structure
    console.log('\n8️⃣ Data Structure Verification:');
    const structureCheck = await pool.query(`
      SELECT 
        COUNT(DISTINCT p.id) as pages,
        COUNT(DISTINCT r.page_id) as pages_with_requirements,
        COUNT(DISTINCT r.category) as categories_used,
        AVG(req_count) as avg_requirements_per_page
      FROM pages p
      LEFT JOIN (
        SELECT page_id, category, COUNT(*) as req_count
        FROM requirements
        GROUP BY page_id, category
      ) r ON p.id = r.page_id
    `);
    
    const stats = structureCheck.rows[0];
    console.log(`   Pages in database: ${stats.pages}`);
    console.log(`   Pages with requirements: ${stats.pages_with_requirements}`);
    console.log(`   Categories used: ${stats.categories_used}`);
    console.log(`   Avg requirements per page: ${parseFloat(stats.avg_requirements_per_page || 0).toFixed(1)}`);
    
    // 9. Check for required documents specifically
    console.log('\n9️⃣ Required Documents Analysis:');
    const requiredDocs = await pool.query(`
      SELECT 
        r.page_id,
        r.value,
        r.description,
        r.format,
        p.title,
        p.url
      FROM requirements r
      JOIN pages p ON r.page_id = p.id
      WHERE r.category = 'documents' AND r.required = true
      LIMIT 10
    `);
    
    console.log(`   Found ${requiredDocs.rows.length} required documents (showing first 10):`);
    requiredDocs.rows.forEach((doc, i) => {
      console.log(`   ${i + 1}. ${doc.value.substring(0, 50)}`);
      console.log(`      Page: ${doc.title || doc.url.substring(0, 40)}`);
      if (doc.description) console.log(`      Structure: ${doc.description.substring(0, 40)}...`);
    });
    
    console.log('\n✅ Database returns test complete!\n');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testDatabaseReturns();


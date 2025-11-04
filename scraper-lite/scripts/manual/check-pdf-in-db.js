#!/usr/bin/env node
/**
 * Check how PDFs are stored in database
 */
require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'commonjs', moduleResolution: 'node', esModuleInterop: true } });
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env.local') });

const { getPool } = require('../../src/db/neon-client.ts');

async function checkPdfInDb() {
  const pool = getPool();
  
  try {
    console.log('\n📄 PDFs in Database:\n');
    
    const result = await pool.query(`
      SELECT 
        id, 
        url, 
        title, 
        description,
        (SELECT COUNT(*) FROM requirements WHERE page_id = pages.id) as req_count,
        metadata_json,
        raw_html_path,
        fetched_at
      FROM pages 
      WHERE url LIKE '%.pdf%' 
      ORDER BY id DESC 
      LIMIT 5
    `);
    
    if (result.rows.length === 0) {
      console.log('No PDFs found in database yet.');
      return;
    }
    
    result.rows.forEach((r, i) => {
      console.log(`${i + 1}. PDF Record:`);
      console.log(`   ID: ${r.id}`);
      console.log(`   URL: ${r.url}`);
      console.log(`   Title: ${r.title?.slice(0, 80) || 'N/A'}...`);
      console.log(`   Description: ${r.description?.slice(0, 80) || 'N/A'}...`);
      console.log(`   Requirements: ${r.req_count}`);
      console.log(`   Metadata: ${JSON.stringify(r.metadata_json || {}).slice(0, 150)}...`);
      console.log(`   Raw HTML Path: ${r.raw_html_path || 'N/A'}`);
      console.log(`   Fetched At: ${r.fetched_at}`);
      console.log('');
    });
    
    // Count total PDFs
    const count = await pool.query(`
      SELECT COUNT(*) as count 
      FROM pages 
      WHERE url LIKE '%.pdf%'
    `);
    
    console.log(`\n📊 Total PDFs in database: ${count.rows[0].count}`);
    
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  checkPdfInDb().catch(err => {
    console.error('\n❌ Fatal error:', err);
    process.exit(1);
  });
}

module.exports = { checkPdfInDb };


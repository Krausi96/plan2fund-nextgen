#!/usr/bin/env node
/**
 * Quick verification - outputs to console
 */
require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'commonjs', moduleResolution: 'node', esModuleInterop: true } });

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env.local') });

const { getPool } = require('../../src/db/neon-client.ts');

async function quickVerify() {
  const pool = getPool();
  
  try {
    console.log('\n🔍 QUICK VERIFICATION\n');
    
    // Check null funding_types
    const nullCheck = await pool.query(`
      SELECT COUNT(*) as count
      FROM pages
      WHERE metadata_json->>'funding_type' IS NULL 
         OR metadata_json->>'funding_type' = 'null'
         OR metadata_json->>'funding_type' = ''
    `);
    const nulls = parseInt(nullCheck.rows[0].count);
    console.log(`✅ Null funding_types: ${nulls} ${nulls === 0 ? '(PERFECT!)' : '(NEEDS FIX)'}`);
    
    // Total pages
    const totalCheck = await pool.query('SELECT COUNT(*) as count FROM pages');
    const total = parseInt(totalCheck.rows[0].count);
    console.log(`📊 Total pages: ${total}`);
    
    // Funding type distribution
    const distCheck = await pool.query(`
      SELECT 
        COALESCE(metadata_json->>'funding_type', 'null') as funding_type,
        COUNT(*) as count
      FROM pages
      GROUP BY metadata_json->>'funding_type'
      ORDER BY count DESC
      LIMIT 10
    `);
    console.log(`\n📊 Top funding types:`);
    distCheck.rows.forEach(row => {
      console.log(`  ${(row.funding_type || 'null').padEnd(20)} ${String(row.count).padStart(4)}`);
    });
    
    // Requirements coverage
    const reqCheck = await pool.query(`
      SELECT 
        COUNT(DISTINCT p.id) as with_reqs,
        COUNT(*) FILTER (WHERE r.id IS NULL) as without_reqs
      FROM pages p
      LEFT JOIN requirements r ON p.id = r.page_id
    `);
    const withReqs = parseInt(reqCheck.rows[0].with_reqs);
    const withoutReqs = parseInt(reqCheck.rows[0].without_reqs);
    console.log(`\n📊 Requirements coverage:`);
    console.log(`  With requirements: ${withReqs}`);
    console.log(`  Without requirements: ${withoutReqs}`);
    
    // Critical categories
    const catCheck = await pool.query(`
      SELECT category, COUNT(DISTINCT page_id) as count
      FROM requirements
      WHERE category IN ('eligibility', 'financial', 'documents', 'timeline', 'project')
      GROUP BY category
      ORDER BY count DESC
    `);
    console.log(`\n📊 Critical categories:`);
    catCheck.rows.forEach(row => {
      console.log(`  ${row.category.padEnd(15)} ${String(row.count).padStart(4)} pages`);
    });
    
    console.log('\n✅ Verification complete!\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

quickVerify();


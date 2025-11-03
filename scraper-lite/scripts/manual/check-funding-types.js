#!/usr/bin/env node
/**
 * Check URLs parsed per funding type
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env.local') });
require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'commonjs', moduleResolution: 'node', esModuleInterop: true } });

const { getPool } = require(path.join(__dirname, '../../src/db/neon-client.ts'));

async function checkFundingTypes() {
  console.log('\n📊 URLs per Funding Type\n');
  console.log('='.repeat(70));
  
  const pool = getPool();
  
  try {
    // Check both metadata_json->>'funding_type' and funding_types array
    const result = await pool.query(`
      SELECT 
        COALESCE(metadata_json->>'funding_type', 'null') as funding_type,
        COUNT(*) as count,
        COUNT(DISTINCT metadata_json->>'institution') as institutions,
        array_agg(DISTINCT metadata_json->>'institution') FILTER (WHERE metadata_json->>'institution' IS NOT NULL) as institution_list
      FROM pages
      GROUP BY metadata_json->>'funding_type'
      ORDER BY count DESC
    `);
    
    let total = 0;
    result.rows.forEach(r => {
      total += parseInt(r.count);
      console.log(`  ${(r.funding_type || 'null').padEnd(20)} ${String(r.count).padStart(6)} URLs (${r.institutions} institutions)`);
    });
    
    console.log('\n' + '='.repeat(70));
    console.log(`  TOTAL: ${total} URLs\n`);
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkFundingTypes();


#!/usr/bin/env node
/**
 * Fix pages with null funding_type in database
 */
require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'commonjs', moduleResolution: 'node', esModuleInterop: true } });

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env.local') });

const { getPool } = require('../../src/db/neon-client.ts');
const { findInstitutionByUrl } = require('../../src/config.ts');

async function fixNullFundingTypes() {
  console.log('\n🔧 FIXING NULL FUNDING TYPES\n');
  console.log('='.repeat(70));
  
  const pool = getPool();
  
  try {
    // 1. Find pages with null funding_type
    console.log('\n📊 Finding pages with null funding_type...');
    const nullPages = await pool.query(`
      SELECT id, url, metadata_json->>'institution' as institution
      FROM pages
      WHERE metadata_json->>'funding_type' IS NULL OR metadata_json->>'funding_type' = 'null'
      LIMIT 100
    `);
    
    console.log(`  Found ${nullPages.rows.length} pages with null funding_type`);
    
    if (nullPages.rows.length === 0) {
      console.log('\n✅ No pages with null funding_type found!');
      return;
    }
    
    // 2. Fix each page
    console.log('\n🔧 Fixing funding types...');
    let fixed = 0;
    
    for (const page of nullPages.rows) {
      try {
        // Try to find institution by URL
        const institution = findInstitutionByUrl(page.url);
        
        let fundingType = null;
        
        if (institution && institution.fundingTypes && institution.fundingTypes.length > 0) {
          fundingType = institution.fundingTypes[0];
        } else {
          // Try to extract from URL
          const urlLower = page.url.toLowerCase();
          if (urlLower.includes('/equity/') || urlLower.includes('venture') || urlLower.includes('vc-')) {
            fundingType = 'equity';
          } else if (urlLower.includes('/loan/') || urlLower.includes('/kredit/') || urlLower.includes('/darlehen/')) {
            fundingType = 'loan';
          } else if (urlLower.includes('/grant/') || urlLower.includes('/foerderung/') || urlLower.includes('/subsidy/')) {
            fundingType = 'grant';
          } else if (urlLower.includes('/leasing/')) {
            fundingType = 'leasing';
          } else if (urlLower.includes('/guarantee/') || urlLower.includes('/buergschaft/')) {
            fundingType = 'guarantee';
          } else if (urlLower.includes('/crowdfunding/') || urlLower.includes('crowdinvesting')) {
            fundingType = 'crowdfunding';
          } else {
            fundingType = 'unknown';
          }
        }
        
        // Update database
        await pool.query(`
          UPDATE pages
          SET metadata_json = jsonb_set(
            metadata_json,
            '{funding_type}',
            $1::jsonb
          )
          WHERE id = $2
        `, [`"${fundingType}"`, page.id]);
        
        fixed++;
        
        if (fixed % 50 === 0) {
          console.log(`  Fixed ${fixed}/${nullPages.rows.length}...`);
        }
      } catch (e) {
        console.error(`  Error fixing page ${page.id}: ${e.message}`);
      }
    }
    
    console.log(`\n✅ Fixed ${fixed} pages`);
    
    // 3. Verify
    console.log('\n📊 Verification...');
    const remaining = await pool.query(`
      SELECT COUNT(*) as count
      FROM pages
      WHERE metadata_json->>'funding_type' IS NULL OR metadata_json->>'funding_type' = 'null'
    `);
    
    console.log(`  Remaining null funding_types: ${remaining.rows[0].count}`);
    
    console.log('\n✅ Fix complete!\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

fixNullFundingTypes().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});




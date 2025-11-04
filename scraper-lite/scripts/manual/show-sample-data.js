#!/usr/bin/env node
/**
 * Show sample extracted data from 3 URLs
 */

require('ts-node').register({ transpileOnly: true });
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env.local') });

const { getPool } = require('../../src/db/neon-client.ts');

async function showSampleData() {
  const pool = getPool();
  
  try {
    console.log('\n📊 Sample Data from 3 URLs\n');
    console.log('='.repeat(80));
    
    // Get 3 diverse pages
    const result = await pool.query(`
      SELECT 
        p.id,
        p.url,
        p.title,
        p.description,
        p.funding_amount_min,
        p.funding_amount_max,
        p.deadline,
        p.open_deadline,
        p.contact_email,
        p.contact_phone,
        p.currency,
        p.funding_types,
        p.program_focus,
        p.region,
        p.metadata_json,
        (SELECT COUNT(*) FROM requirements r WHERE r.page_id = p.id) as req_count,
        (SELECT COUNT(DISTINCT r.category) FROM requirements r WHERE r.page_id = p.id) as category_count
      FROM pages p
      WHERE p.title IS NOT NULL 
        AND p.description IS NOT NULL
        AND p.description != ''
      ORDER BY 
        (SELECT COUNT(*) FROM requirements r WHERE r.page_id = p.id) DESC,
        RANDOM()
      LIMIT 3
    `);
    
    if (result.rows.length === 0) {
      console.log('❌ No pages found in database');
      return;
    }
    
    for (let i = 0; i < result.rows.length; i++) {
      const page = result.rows[i];
      console.log(`\n\n🔍 Sample ${i + 1}: ${page.url}\n`);
      console.log(`ID: ${page.id}`);
      console.log(`Title: ${page.title || 'N/A'}`);
      console.log(`Description: ${(page.description || '').substring(0, 200)}${page.description && page.description.length > 200 ? '...' : ''}`);
      console.log(`\n💰 Funding:`);
      console.log(`  Min: ${page.funding_amount_min || 'N/A'} ${page.currency || ''}`);
      console.log(`  Max: ${page.funding_amount_max || 'N/A'} ${page.currency || ''}`);
      console.log(`  Status: ${page.metadata_json?.funding_amount_status || 'extracted'}`);
      console.log(`\n📅 Timeline:`);
      console.log(`  Deadline: ${page.deadline || (page.open_deadline ? 'Open' : 'N/A')}`);
      console.log(`\n📞 Contact:`);
      console.log(`  Email: ${page.contact_email || 'N/A'}`);
      console.log(`  Phone: ${page.contact_phone || 'N/A'}`);
      console.log(`\n📋 Requirements:`);
      console.log(`  Total Requirements: ${page.req_count || 0}`);
      console.log(`  Categories: ${page.category_count || 0}`);
      
      // Get requirements by category
      const reqsResult = await pool.query(`
        SELECT category, COUNT(*) as count
        FROM requirements
        WHERE page_id = $1
        GROUP BY category
        ORDER BY count DESC
      `, [page.id]);
      
      if (reqsResult.rows.length > 0) {
        console.log(`  Categories found:`);
        reqsResult.rows.forEach(row => {
          console.log(`    - ${row.category}: ${row.count} requirements`);
        });
      }
      
      // Get sample requirements
      const sampleReqs = await pool.query(`
        SELECT category, type, value, meaningfulness_score
        FROM requirements
        WHERE page_id = $1
        ORDER BY meaningfulness_score DESC NULLS LAST, category
        LIMIT 5
      `, [page.id]);
      
      if (sampleReqs.rows.length > 0) {
        console.log(`\n  Sample Requirements:`);
        sampleReqs.rows.forEach(req => {
          const value = (req.value || '').substring(0, 100);
          const score = req.meaningfulness_score ? ` (score: ${req.meaningfulness_score})` : '';
          console.log(`    [${req.category}] ${value}${score}`);
        });
      }
      
      console.log(`\n🏷️  Metadata:`);
      console.log(`  Funding Types: ${page.funding_types?.join(', ') || 'N/A'}`);
      console.log(`  Program Focus: ${page.program_focus?.join(', ') || 'N/A'}`);
      console.log(`  Region: ${page.region || 'N/A'}`);
      
      if (page.metadata_json && Object.keys(page.metadata_json).length > 0) {
        console.log(`  Additional Metadata:`);
        Object.entries(page.metadata_json).forEach(([key, value]) => {
          if (key !== 'funding_amount_status') {
            console.log(`    ${key}: ${JSON.stringify(value)}`);
          }
        });
      }
      
      console.log('\n' + '-'.repeat(80));
    }
    
    console.log('\n✅ Sample data displayed\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

showSampleData().catch(console.error);


#!/usr/bin/env node
/**
 * Run Larger Batch
 * 
 * Runs a larger discovery + scraping batch to get more pages saved
 */

require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'commonjs', moduleResolution: 'node', esModuleInterop: true } });

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env.local') });

const { discover, scrape, loadState } = require('../../src/scraper.ts');
const { getAllSeedUrls } = require('../../src/config.ts');
const { getPool } = require('../../src/db/neon-client.ts');

async function runLargerBatch() {
  console.log('\n🚀 RUNNING LARGER BATCH\n');
  console.log('='.repeat(70));
  
  try {
    // Step 1: Discovery (20 pages max, depth 3)
    console.log('\n1️⃣  Discovery (20 pages max, depth 3)...');
    const seeds = getAllSeedUrls().slice(0, 10); // First 10 seed URLs from different institutions
    console.log(`   Using ${seeds.length} seed URLs from different institutions`);
    
    await discover(seeds, 3, 20); // Max 20 pages, depth 3
    console.log('   ✅ Discovery complete');
    
    // Check what was discovered
    const state = loadState();
    const queuedJobs = state.jobs.filter(j => j.status === 'queued');
    console.log(`   📊 Jobs queued: ${queuedJobs.length}`);
    
    if (queuedJobs.length === 0) {
      console.log('\n   ⚠️  No new programs found!');
      return;
    }
    
    // Show sample URLs
    console.log(`\n   📋 Sample discovered URLs:`);
    queuedJobs.slice(0, 10).forEach((job, i) => {
      console.log(`      ${i + 1}. ${job.url}`);
    });
    
    // Step 2: Scraping (50 pages max)
    console.log('\n2️⃣  Scraping (50 pages max)...');
    await scrape(50); // 50 pages
    console.log('   ✅ Scraping complete');
    
    // Step 3: Check results
    console.log('\n3️⃣  Checking results...');
    const pool = getPool();
    
    const pageCount = await pool.query('SELECT COUNT(*) as count FROM pages');
    const reqCount = await pool.query('SELECT COUNT(*) as count FROM requirements');
    
    console.log(`   📊 Pages saved: ${pageCount.rows[0].count}`);
    console.log(`   📊 Requirements saved: ${reqCount.rows[0].count}`);
    
    if (parseInt(pageCount.rows[0].count) > 0) {
      console.log('\n   ✅ SUCCESS: Found and saved new programs!');
      
      // Show sample pages
      const samplePages = await pool.query(`
        SELECT url, title, 
               (SELECT COUNT(*) FROM requirements WHERE page_id = pages.id) as req_count
        FROM pages
        ORDER BY id DESC
        LIMIT 10
      `);
      
      console.log(`\n   📄 Sample saved pages:`);
      samplePages.rows.forEach((page, i) => {
        console.log(`      ${i + 1}. ${page.url}`);
        console.log(`         Title: ${(page.title || 'N/A').substring(0, 60)}`);
        console.log(`         Requirements: ${page.req_count}`);
      });
    } else {
      console.log('\n   ⚠️  No pages saved - all were rejected as low quality');
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('✅ Larger batch complete!\n');
    
  } catch (e) {
    console.error('❌ Error:', e.message);
    if (e.stack) console.error('Stack:', e.stack);
    throw e;
  }
}

if (require.main === module) {
  runLargerBatch().catch(e => {
    console.error('❌ Fatal error:', e);
    process.exit(1);
  });
}

module.exports = { runLargerBatch };



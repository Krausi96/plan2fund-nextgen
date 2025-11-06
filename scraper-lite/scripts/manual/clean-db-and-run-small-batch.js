#!/usr/bin/env node
/**
 * Clean Database and Run Small Batch
 * 
 * Cleans database completely, then runs a small batch of 10 pages
 * with different funding types for analysis
 */

require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'commonjs', moduleResolution: 'node', esModuleInterop: true } });

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env.local') });

const { getPool } = require('../../src/db/neon-client.ts');
const { discover, scrape, loadState } = require('../../src/scraper.ts');
const { getAllSeedUrls } = require('../../src/config.ts');

async function cleanAndRun() {
  console.log('\n🧹 CLEANING DATABASE\n');
  console.log('='.repeat(70));
  
  const pool = getPool();
  
  try {
    // Clean all tables
    console.log('Deleting all requirements...');
    await pool.query('DELETE FROM requirements');
    console.log('✅ Requirements deleted');
    
    console.log('Deleting all pages...');
    await pool.query('DELETE FROM pages');
    console.log('✅ Pages deleted');
    
    console.log('Deleting all seen URLs...');
    await pool.query('DELETE FROM seen_urls');
    console.log('✅ Seen URLs deleted');
    
    console.log('Deleting all extraction patterns...');
    await pool.query('DELETE FROM extraction_patterns');
    console.log('✅ Extraction patterns deleted');
    
    console.log('Deleting all institution patterns...');
    try {
      await pool.query('DELETE FROM institution_patterns');
      console.log('✅ Institution patterns deleted');
    } catch (e) {
      console.log('⚠️  Institution patterns table does not exist (skipping)');
    }
    
    console.log('\n✅ Database cleaned completely!\n');
    
    // Reset state.json
    const fs = require('fs');
    const statePath = path.join(__dirname, '../../state.json');
    if (fs.existsSync(statePath)) {
      fs.writeFileSync(statePath, JSON.stringify({
        jobs: [],
        seen: {},
        pages: []
      }, null, 2));
      console.log('✅ State.json reset');
    }
    
    // Run small batch
    console.log('\n🚀 RUNNING SMALL BATCH (10 pages)\n');
    console.log('='.repeat(70));
    
    // Get diverse seed URLs (different funding types)
    const allSeeds = getAllSeedUrls();
    const diverseSeeds = [];
    
    // Try to get URLs from different institutions
    const seenHosts = new Set();
    for (const seed of allSeeds) {
      try {
        const host = new URL(seed).hostname.replace('www.', '');
        if (!seenHosts.has(host) && diverseSeeds.length < 10) {
          diverseSeeds.push(seed);
          seenHosts.add(host);
        }
      } catch (e) {
        // Skip invalid URLs
      }
    }
    
    // If we don't have 10, just take first 10
    if (diverseSeeds.length < 10) {
      diverseSeeds.push(...allSeeds.slice(0, 10 - diverseSeeds.length));
    }
    
    console.log(`Using ${diverseSeeds.length} diverse seed URLs from different institutions`);
    
    // Step 1: Discovery (10 pages max, depth 2)
    console.log('\n1️⃣  Discovery (10 pages max, depth 2)...');
    await discover(diverseSeeds.slice(0, 10), 2, 10);
    console.log('   ✅ Discovery complete');
    
    // Check what was discovered
    const state = loadState();
    const queuedJobs = state.jobs.filter(j => j.status === 'queued');
    console.log(`   📊 Jobs queued: ${queuedJobs.length}`);
    
    if (queuedJobs.length === 0) {
      console.log('\n   ⚠️  No new programs found!');
      return;
    }
    
    // Show discovered URLs
    console.log(`\n   📋 Discovered URLs:`);
    queuedJobs.slice(0, 20).forEach((job, i) => {
      console.log(`      ${i + 1}. ${job.url}`);
    });
    
    // Step 2: Scraping (10 pages max)
    console.log('\n2️⃣  Scraping (10 pages max)...');
    await scrape(10);
    console.log('   ✅ Scraping complete');
    
    // Step 3: Check results
    console.log('\n3️⃣  Checking results...');
    const pageCount = await pool.query('SELECT COUNT(*) as count FROM pages');
    const reqCount = await pool.query('SELECT COUNT(*) as count FROM requirements');
    
    console.log(`   📊 Pages saved: ${pageCount.rows[0].count}`);
    console.log(`   📊 Requirements saved: ${reqCount.rows[0].count}`);
    
    if (parseInt(pageCount.rows[0].count) > 0) {
      console.log('\n   ✅ SUCCESS: Found and saved new programs!');
    } else {
      console.log('\n   ⚠️  No pages saved - all were rejected as low quality');
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('✅ Clean and run complete!\n');
    
  } catch (e) {
    console.error('❌ Error:', e.message);
    if (e.stack) console.error('Stack:', e.stack);
    throw e;
  }
}

if (require.main === module) {
  cleanAndRun().catch(e => {
    console.error('❌ Fatal error:', e);
    process.exit(1);
  });
}

module.exports = { cleanAndRun };


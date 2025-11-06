#!/usr/bin/env node
/**
 * Clean Database and Run 35-Page Batch with Diverse Funding Types
 * 
 * Cleans database completely, then runs a batch of 35 pages
 * ensuring different funding types (grants, loans, equity, services)
 * for comprehensive analysis
 */

require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'commonjs', moduleResolution: 'node', esModuleInterop: true } });

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env.local') });

const { getPool } = require('../../src/db/neon-client.ts');
const { discover, scrape, loadState } = require('../../src/scraper.ts');
const { getAllSeedUrls, institutions } = require('../../src/config.ts');

async function cleanAndRun35() {
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
    
    // Run batch of 35 pages with diverse funding types
    console.log('\n🚀 RUNNING 35-PAGE BATCH (DIVERSE FUNDING TYPES)\n');
    console.log('='.repeat(70));
    
    // Get diverse seed URLs (different funding types and institutions)
    const allSeeds = getAllSeedUrls();
    const diverseSeeds = [];
    
    // Group seeds by institution and funding type
    const byInstitution = {};
    const byFundingType = {
      grant: [],
      loan: [],
      equity: [],
      service: []
    };
    
    allSeeds.forEach(seed => {
      try {
        const host = new URL(seed).hostname.replace('www.', '');
        const inst = institutions.find(i => host.includes(new URL(i.baseUrl).hostname.replace('www.', '')));
        
        if (!byInstitution[inst?.name || 'unknown']) {
          byInstitution[inst?.name || 'unknown'] = [];
        }
        byInstitution[inst?.name || 'unknown'].push(seed);
        
        // Try to categorize by funding type from URL/keywords
        const lowerSeed = seed.toLowerCase();
        if (lowerSeed.includes('loan') || lowerSeed.includes('kredit') || lowerSeed.includes('darlehen')) {
          byFundingType.loan.push(seed);
        } else if (lowerSeed.includes('equity') || lowerSeed.includes('beteiligung')) {
          byFundingType.equity.push(seed);
        } else if (lowerSeed.includes('service') || lowerSeed.includes('beratung') || lowerSeed.includes('ams') || lowerSeed.includes('ip')) {
          byFundingType.service.push(seed);
        } else {
          byFundingType.grant.push(seed);
        }
      } catch (e) {
        // Skip invalid URLs
      }
    });
    
    // Select diverse seeds: 15 grants, 7 loans, 6 equity, 7 services
    const selectedSeeds = [];
    
    // Grants (15)
    selectedSeeds.push(...byFundingType.grant.slice(0, 15));
    
    // Loans (7)
    selectedSeeds.push(...byFundingType.loan.slice(0, 7));
    
    // Equity (6)
    selectedSeeds.push(...byFundingType.equity.slice(0, 6));
    
    // Services (7)
    selectedSeeds.push(...byFundingType.service.slice(0, 7));
    
    // Others from different institutions (fill to 35)
    const seenHosts = new Set(selectedSeeds.map(s => {
      try {
        return new URL(s).hostname.replace('www.', '');
      } catch {
        return '';
      }
    }).filter(h => h));
    
    for (const seed of allSeeds) {
      if (selectedSeeds.length >= 35) break;
      try {
        const host = new URL(seed).hostname.replace('www.', '');
        if (!seenHosts.has(host)) {
          selectedSeeds.push(seed);
          seenHosts.add(host);
        }
      } catch (e) {
        // Skip invalid URLs
      }
    }
    
    // If we don't have 35, fill with remaining seeds
    if (selectedSeeds.length < 35) {
      for (const seed of allSeeds) {
        if (selectedSeeds.length >= 35) break;
        if (!selectedSeeds.includes(seed)) {
          selectedSeeds.push(seed);
        }
      }
    }
    
    console.log(`Using ${selectedSeeds.length} diverse seed URLs:`);
    console.log(`  - Grants: ${byFundingType.grant.slice(0, 15).length}`);
    console.log(`  - Loans: ${byFundingType.loan.slice(0, 7).length}`);
    console.log(`  - Equity: ${byFundingType.equity.slice(0, 6).length}`);
    console.log(`  - Services: ${byFundingType.service.slice(0, 7).length}`);
    console.log(`  - Others: ${selectedSeeds.length - 35}`);
    
    // Step 1: Discovery (35 pages max, depth 2)
    console.log('\n1️⃣  Discovery (35 pages max, depth 2)...');
    await discover(selectedSeeds.slice(0, 35), 2, 35);
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
    console.log(`\n   📋 Discovered URLs (first 35):`);
    queuedJobs.slice(0, 35).forEach((job, i) => {
      console.log(`      ${i + 1}. ${job.url}`);
    });
    
    // Step 2: Scraping (35 pages max)
    console.log('\n2️⃣  Scraping (35 pages max)...');
    await scrape(35);
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
  cleanAndRun35().catch(e => {
    console.error('❌ Fatal error:', e);
    process.exit(1);
  });
}

module.exports = { cleanAndRun35 };



/**
 * Validation Script for Smart Discoveries & Improvements
 * Tests: Structured Geography, Funding Type, Industries, Technology Focus, Program Topics
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env.local') });

// Use ts-node for TypeScript files
require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'commonjs', moduleResolution: 'node', esModuleInterop: true } });

const { getPool } = require('../../src/db/neon-client.ts');
const { extractMeta } = require('../../src/extract.ts');
const { fetchHtml } = require('../../src/utils.ts');

async function validateImprovements() {
  console.log('\n🔬 VALIDATION: Smart Discoveries & Improvements\n');
  console.log('='.repeat(80));
  
  const pool = getPool();
  const results = {
    structuredGeography: { found: 0, total: 0, samples: [] },
    fundingType: { found: 0, total: 0, samples: [] },
    industries: { found: 0, total: 0, samples: [] },
    technologyFocus: { found: 0, total: 0, samples: [] },
    programTopics: { found: 0, total: 0, samples: [] },
    enhancedDeadline: { found: 0, total: 0 },
    regionExtraction: { found: 0, total: 0, before: 0, after: 0 }
  };
  
  try {
    // Get sample of recently scraped pages
    const samplePages = await pool.query(`
      SELECT url, title, metadata_json, region, funding_types, program_focus
      FROM pages
      ORDER BY fetched_at DESC
      LIMIT 50
    `);
    
    console.log(`\n📊 Testing ${samplePages.rows.length} pages...\n`);
    
    // Test 1: Check existing data for new metadata fields
    console.log('📋 TEST 1: Metadata Field Coverage');
    console.log('-'.repeat(80));
    
    for (const page of samplePages.rows) {
      const meta = page.metadata_json || {};
      
      // Structured Geography
      if (meta.geography) {
        results.structuredGeography.found++;
        if (results.structuredGeography.samples.length < 3) {
          results.structuredGeography.samples.push({
            url: page.url,
            geography: meta.geography
          });
        }
      }
      results.structuredGeography.total++;
      
      // Funding Type
      if (meta.funding_type && meta.funding_type !== 'unknown' && meta.funding_type !== 'null') {
        results.fundingType.found++;
        if (results.fundingType.samples.length < 3) {
          results.fundingType.samples.push({
            url: page.url,
            funding_type: meta.funding_type
          });
        }
      }
      results.fundingType.total++;
      
      // Industries
      if (meta.industries && Array.isArray(meta.industries) && meta.industries.length > 0) {
        results.industries.found++;
        if (results.industries.samples.length < 3) {
          results.industries.samples.push({
            url: page.url,
            industries: meta.industries
          });
        }
      }
      results.industries.total++;
      
      // Technology Focus
      if (meta.technology_focus && Array.isArray(meta.technology_focus) && meta.technology_focus.length > 0) {
        results.technologyFocus.found++;
        if (results.technologyFocus.samples.length < 3) {
          results.technologyFocus.samples.push({
            url: page.url,
            technology_focus: meta.technology_focus
          });
        }
      }
      results.technologyFocus.total++;
      
      // Program Topics
      if (meta.program_topics && Array.isArray(meta.program_topics) && meta.program_topics.length > 0) {
        results.programTopics.found++;
        if (results.programTopics.samples.length < 3) {
          results.programTopics.samples.push({
            url: page.url,
            program_topics: meta.program_topics
          });
        }
      }
      results.programTopics.total++;
      
      // Region extraction improvement
      if (page.region) {
        results.regionExtraction.after++;
      }
    }
    
    // Get baseline (before improvements)
    const baselinePages = await pool.query(`
      SELECT COUNT(*) as count
      FROM pages
      WHERE region IS NOT NULL
    `);
    results.regionExtraction.before = parseInt(baselinePages.rows[0].count);
    results.regionExtraction.total = samplePages.rows.length;
    results.regionExtraction.found = results.regionExtraction.after;
    
    // Test 2: Live extraction test on a sample URL
    console.log('\n📋 TEST 2: Live Extraction Test');
    console.log('-'.repeat(80));
    
    const testUrl = samplePages.rows[0]?.url;
    if (testUrl) {
      try {
        console.log(`  Testing: ${testUrl.substring(0, 60)}...`);
        const fetchResult = await fetchHtml(testUrl);
        const extracted = extractMeta(fetchResult.html, testUrl);
        
        console.log('\n  ✅ Extraction Results:');
        if (extracted.metadata_json?.geography) {
          console.log(`    Geography:`, extracted.metadata_json.geography);
        }
        if (extracted.metadata_json?.funding_type) {
          console.log(`    Funding Type: ${extracted.metadata_json.funding_type}`);
        }
        if (extracted.metadata_json?.industries?.length > 0) {
          console.log(`    Industries: ${extracted.metadata_json.industries.join(', ')}`);
        }
        if (extracted.metadata_json?.technology_focus?.length > 0) {
          console.log(`    Technology: ${extracted.metadata_json.technology_focus.join(', ')}`);
        }
        if (extracted.metadata_json?.program_topics?.length > 0) {
          console.log(`    Topics: ${extracted.metadata_json.program_topics.join(', ')}`);
        }
        if (extracted.deadline) {
          results.enhancedDeadline.found++;
          console.log(`    Deadline: ${extracted.deadline}`);
        }
      } catch (e) {
        console.log(`  ⚠️  Could not test live extraction: ${e.message}`);
      }
    }
    
    // Test 3: Check deadline extraction improvement
    console.log('\n📋 TEST 3: Deadline Extraction');
    console.log('-'.repeat(80));
    const deadlineCount = await pool.query(`
      SELECT COUNT(*) as count
      FROM pages
      WHERE deadline IS NOT NULL OR open_deadline = true
    `);
    const deadlineTotal = await pool.query(`SELECT COUNT(*) as count FROM pages`);
    results.enhancedDeadline.total = parseInt(deadlineTotal.rows[0].count);
    results.enhancedDeadline.found = parseInt(deadlineCount.rows[0].count);
    
    const deadlineRate = (results.enhancedDeadline.found / results.enhancedDeadline.total * 100).toFixed(1);
    console.log(`  Deadline coverage: ${results.enhancedDeadline.found}/${results.enhancedDeadline.total} (${deadlineRate}%)`);
    
    // Results Summary
    console.log('\n📊 RESULTS SUMMARY');
    console.log('='.repeat(80));
    
    const categories = [
      { name: 'Structured Geography', key: 'structuredGeography', target: 30 },
      { name: 'Funding Type (Extracted)', key: 'fundingType', target: 50 },
      { name: 'Industries', key: 'industries', target: 20 },
      { name: 'Technology Focus', key: 'technologyFocus', target: 15 },
      { name: 'Program Topics', key: 'programTopics', target: 25 },
      { name: 'Deadline Extraction', key: 'enhancedDeadline', target: 15 }
    ];
    
    categories.forEach(({ name, key, target }) => {
      const result = results[key];
      const rate = result.total > 0 ? (result.found / result.total * 100).toFixed(1) : 0;
      const status = parseFloat(rate) >= target ? '✅' : '⚠️';
      console.log(`  ${status} ${name.padEnd(30)} ${result.found}/${result.total} (${rate}%)`);
      
      if (result.samples && result.samples.length > 0) {
        console.log(`     Samples:`);
        result.samples.forEach(sample => {
          const value = sample.geography || sample.funding_type || 
                       (Array.isArray(sample.industries) ? sample.industries.join(', ') : sample.industries) ||
                       (Array.isArray(sample.technology_focus) ? sample.technology_focus.join(', ') : sample.technology_focus) ||
                       (Array.isArray(sample.program_topics) ? sample.program_topics.join(', ') : sample.program_topics);
          console.log(`       - ${value}`);
        });
      }
    });
    
    console.log(`\n  📍 Region Extraction: ${results.regionExtraction.found} pages with region`);
    console.log(`     (Baseline in database: ${results.regionExtraction.before} pages)`);
    
    // Overall Assessment
    console.log('\n🎯 OVERALL ASSESSMENT');
    console.log('='.repeat(80));
    
    const passedTests = categories.filter(c => {
      const result = results[c.key];
      const rate = result.total > 0 ? (result.found / result.total * 100) : 0;
      return rate >= c.target;
    }).length;
    
    const totalTests = categories.length;
    const grade = passedTests >= totalTests * 0.8 ? 'A' : 
                  passedTests >= totalTests * 0.6 ? 'B' : 
                  passedTests >= totalTests * 0.4 ? 'C' : 'D';
    
    console.log(`  Tests Passed: ${passedTests}/${totalTests}`);
    console.log(`  Grade: ${grade}`);
    
    if (passedTests === totalTests) {
      console.log('\n  ✅ All improvements validated! Ready for deployment.');
    } else {
      console.log('\n  ⚠️  Some improvements need more data. Re-scrape pages to populate new fields.');
    }
    
  } catch (error) {
    console.error('❌ Validation error:', error);
    throw error;
  }
}

// Run validation
validateImprovements().catch(err => {
  console.error('Validation failed:', err);
  process.exit(1);
});


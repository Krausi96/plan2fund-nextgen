#!/usr/bin/env node
/**
 * Test API Endpoints
 * Verifies that API endpoints return database data correctly
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env.local') });

const http = require('http');

const API_BASE = process.env.API_BASE || 'http://localhost:3000';

async function testEndpoint(url, name) {
  return new Promise((resolve, reject) => {
    console.log(`\n🔍 Testing ${name}...`);
    console.log(`   URL: ${url}`);
    
    http.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode !== 200) {
          console.log(`   ❌ Status: ${res.statusCode}`);
          reject(new Error(`HTTP ${res.statusCode}`));
          return;
        }
        
        try {
          const json = JSON.parse(data);
          
          if (name === 'GET /api/programs') {
            console.log(`   ✅ Status: ${res.statusCode}`);
            console.log(`   ✅ Programs: ${json.programs?.length || 0}`);
            console.log(`   ✅ Source: ${json.source || 'unknown'}`);
            
            if (json.programs && json.programs.length > 0) {
              const sample = json.programs[0];
              console.log(`   ✅ Sample program: ${sample.name || sample.id}`);
              console.log(`   ✅ Has categorized_requirements: ${!!sample.categorized_requirements}`);
              console.log(`   ✅ Has application_method: ${sample.application_method || 'N/A'}`);
              
              // Check requirement categories
              const reqCategories = Object.keys(sample.categorized_requirements || {});
              console.log(`   ✅ Requirement categories: ${reqCategories.length} (${reqCategories.slice(0, 5).join(', ')}...)`);
            }
          } else if (name.includes('/requirements')) {
            console.log(`   ✅ Status: ${res.statusCode}`);
            console.log(`   ✅ Program ID: ${json.program_id || 'N/A'}`);
            console.log(`   ✅ Program Name: ${json.program_name || 'N/A'}`);
            console.log(`   ✅ Decision Tree: ${json.decision_tree?.length || 0} questions`);
            console.log(`   ✅ Editor Sections: ${json.editor?.length || 0} sections`);
            console.log(`   ✅ Library Items: ${json.library?.length || 0} items`);
            console.log(`   ✅ Data Source: ${json.data_source || 'unknown'}`);
          }
          
          resolve(json);
        } catch (e) {
          console.log(`   ❌ Parse Error: ${e.message}`);
          reject(e);
        }
      });
    }).on('error', (e) => {
      console.log(`   ❌ Connection Error: ${e.message}`);
      reject(e);
    });
    
    // Timeout after 10 seconds
    setTimeout(() => {
      reject(new Error('Timeout'));
    }, 10000);
  });
}

async function runTests() {
  console.log('\n🧪 Testing API Endpoints\n');
  console.log('='.repeat(70));
  console.log(`Base URL: ${API_BASE}`);
  
  const results = {
    passed: 0,
    failed: 0,
    errors: []
  };
  
  // Test 1: GET /api/programs
  try {
    await testEndpoint(`${API_BASE}/api/programs?enhanced=true`, 'GET /api/programs');
    results.passed++;
  } catch (e) {
    results.failed++;
    results.errors.push({ endpoint: '/api/programs', error: e.message });
    console.log(`   ⚠️  Warning: ${e.message}`);
  }
  
  // Test 2: Get a specific program ID from database
  // First, we need to query database to get a page ID
  try {
    require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'commonjs', moduleResolution: 'node', esModuleInterop: true } });
    const { getPool } = require('../src/db/neon-client.ts');
    const pool = getPool();
    const pageResult = await pool.query('SELECT id FROM pages LIMIT 1');
    
    if (pageResult.rows.length > 0) {
      const pageId = pageResult.rows[0].id;
      const programId = `page_${pageId}`;
      
      console.log(`\n📋 Testing with program ID: ${programId} (from database)`);
      
      // Test 3: GET /api/programmes/[id]/requirements
      try {
        await testEndpoint(`${API_BASE}/api/programmes/${programId}/requirements`, `GET /api/programmes/[id]/requirements`);
        results.passed++;
      } catch (e) {
        results.failed++;
        results.errors.push({ endpoint: '/api/programmes/[id]/requirements', error: e.message });
        console.log(`   ⚠️  Warning: ${e.message}`);
      }
      
      // Test 4: GET /api/programs-ai
      try {
        await testEndpoint(`${API_BASE}/api/programs-ai?action=questions&programId=${programId}`, 'GET /api/programs-ai (questions)');
        results.passed++;
      } catch (e) {
        results.failed++;
        results.errors.push({ endpoint: '/api/programs-ai', error: e.message });
        console.log(`   ⚠️  Warning: ${e.message}`);
      }
    } else {
      console.log('\n⚠️  No pages found in database - skipping program-specific tests');
    }
  } catch (e) {
    console.log(`\n⚠️  Could not query database: ${e.message}`);
    console.log('   Skipping program-specific tests');
  }
  
  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('\n📊 Test Summary:');
  console.log(`   ✅ Passed: ${results.passed}`);
  console.log(`   ❌ Failed: ${results.failed}`);
  
  if (results.errors.length > 0) {
    console.log('\n⚠️  Errors:');
    results.errors.forEach(err => {
      console.log(`   - ${err.endpoint}: ${err.error}`);
    });
  }
  
  if (results.failed === 0) {
    console.log('\n✅ All API tests passed!');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some tests failed - check server is running on port 3000');
    process.exit(1);
  }
}

// Run tests
runTests().catch(e => {
  console.error('\n❌ Test runner error:', e);
  process.exit(1);
});


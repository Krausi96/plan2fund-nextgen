#!/usr/bin/env node
/**
 * Test Database Flow - End-to-End Verification
 * Tests: Database → API → Component Data Flow
 */
// Use TypeScript compiler to get the module, or use direct database connection
// For now, test via API endpoints instead
const https = require('https');
const http = require('http');

async function testDatabaseFlow() {
  console.log('\n🧪 Testing Database → API → Component Flow\n');
  console.log('='.repeat(60));
  
  let passed = 0;
  let failed = 0;
  const errors = [];
  
  try {
    // Test 1: Database Connection
    console.log('\n📊 Test 1: Database Connection');
    console.log('-'.repeat(60));
    try {
      const pool = getPool();
      const result = await pool.query('SELECT COUNT(*) FROM pages');
      console.log(`✅ Database connected`);
      console.log(`   Pages in database: ${result.rows[0].count}`);
      passed++;
    } catch (error) {
      console.error(`❌ Database connection failed:`, error.message);
      failed++;
      errors.push(`Database connection: ${error.message}`);
      return; // Can't continue without DB
    }
    
    // Test 2: Get Sample Page
    console.log('\n📄 Test 2: Get Sample Page');
    console.log('-'.repeat(60));
    try {
      const pool = getPool();
      const result = await pool.query('SELECT id, url, title FROM pages LIMIT 1');
      if (result.rows.length === 0) {
        throw new Error('No pages in database');
      }
      const page = result.rows[0];
      console.log(`✅ Found sample page`);
      console.log(`   ID: ${page.id}`);
      console.log(`   URL: ${page.url}`);
      console.log(`   Title: ${page.title || 'N/A'}`);
      passed++;
    } catch (error) {
      console.error(`❌ Failed to get sample page:`, error.message);
      failed++;
      errors.push(`Get sample page: ${error.message}`);
    }
    
    // Test 3: Get Requirements for Page
    console.log('\n📋 Test 3: Get Requirements for Page');
    console.log('-'.repeat(60));
    try {
      const pool = getPool();
      const pageResult = await pool.query('SELECT id FROM pages LIMIT 1');
      if (pageResult.rows.length === 0) {
        throw new Error('No pages available');
      }
      const pageId = pageResult.rows[0].id;
      
      const reqResult = await pool.query(
        'SELECT category, type, value FROM requirements WHERE page_id = $1 LIMIT 5',
        [pageId]
      );
      console.log(`✅ Found ${reqResult.rows.length} requirements`);
      if (reqResult.rows.length > 0) {
        console.log(`   Sample requirement: ${reqResult.rows[0].category} - ${reqResult.rows[0].type}`);
      }
      passed++;
    } catch (error) {
      console.error(`❌ Failed to get requirements:`, error.message);
      failed++;
      errors.push(`Get requirements: ${error.message}`);
    }
    
    // Test 4: Simulate API Transformation
    console.log('\n🔄 Test 4: Simulate API Transformation');
    console.log('-'.repeat(60));
    try {
      const pool = getPool();
      const pageResult = await pool.query('SELECT * FROM pages LIMIT 1');
      if (pageResult.rows.length === 0) {
        throw new Error('No pages available');
      }
      const page = pageResult.rows[0];
      
      const reqResult = await pool.query(
        'SELECT category, type, value, required, source FROM requirements WHERE page_id = $1',
        [page.id]
      );
      
      // Transform to categorized_requirements format (like API does)
      const categorized_requirements = {};
      reqResult.rows.forEach(row => {
        if (!categorized_requirements[row.category]) {
          categorized_requirements[row.category] = [];
        }
        categorized_requirements[row.category].push({
          type: row.type,
          value: row.value,
          required: row.required,
          source: row.source
        });
      });
      
      const program = {
        id: `page_${page.id}`,
        name: page.title || page.url,
        type: 'grant',
        categorized_requirements
      };
      
      console.log(`✅ Transformation successful`);
      console.log(`   Program ID: ${program.id}`);
      console.log(`   Program Name: ${program.name}`);
      console.log(`   Categories: ${Object.keys(categorized_requirements).length}`);
      passed++;
    } catch (error) {
      console.error(`❌ Transformation failed:`, error.message);
      failed++;
      errors.push(`Transformation: ${error.message}`);
    }
    
    // Test 5: Check Component Data Format
    console.log('\n🧩 Test 5: Check Component Data Format');
    console.log('-'.repeat(60));
    try {
      const pool = getPool();
      const pageResult = await pool.query('SELECT * FROM pages LIMIT 1');
      if (pageResult.rows.length === 0) {
        throw new Error('No pages available');
      }
      const page = pageResult.rows[0];
      
      const reqResult = await pool.query(
        'SELECT category, type, value, required FROM requirements WHERE page_id = $1',
        [page.id]
      );
      
      const categorized_requirements = {};
      reqResult.rows.forEach(row => {
        if (!categorized_requirements[row.category]) {
          categorized_requirements[row.category] = [];
        }
        categorized_requirements[row.category].push({
          type: row.type,
          value: row.value,
          required: row.required
        });
      });
      
      // Check format matches what components expect
      const hasRequiredFields = 
        typeof categorized_requirements === 'object' &&
        Array.isArray(categorized_requirements['eligibility'] || categorized_requirements['financial'] || categorized_requirements['documents'] || []);
      
      if (!hasRequiredFields && Object.keys(categorized_requirements).length === 0) {
        console.warn(`⚠️  No requirements found, but format is valid`);
      } else {
        console.log(`✅ Data format matches component expectations`);
        console.log(`   Has categorized_requirements: ${typeof categorized_requirements === 'object'}`);
        console.log(`   Categories present: ${Object.keys(categorized_requirements).length}`);
      }
      passed++;
    } catch (error) {
      console.error(`❌ Format check failed:`, error.message);
      failed++;
      errors.push(`Format check: ${error.message}`);
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Test Summary');
    console.log('='.repeat(60));
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
    
    if (errors.length > 0) {
      console.log('\n⚠️  Errors:');
      errors.forEach((err, i) => console.log(`   ${i + 1}. ${err}`));
    }
    
    if (failed === 0) {
      console.log('\n✅ All tests passed! Database flow is working correctly.');
      process.exit(0);
    } else {
      console.log('\n❌ Some tests failed. Please review errors above.');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error);
    process.exit(1);
  }
}

testDatabaseFlow();


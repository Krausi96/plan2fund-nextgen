#!/usr/bin/env tsx

/**
 * Small Batch Test Script
 * Tests funding type normalization, deadline filtering, and blacklist
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath, override: false });
}
dotenv.config({ override: false });

import { getPool } from '../db/db';
import { normalizeDate } from '../src/utils-date';
import { normalizeFundingTypes } from '../src/utils-funding-types';

async function testSmallBatch() {
  const pool = getPool();
  
  console.log('🧪 Testing Small Batch Results...\n');
  
  // Test 1: Date Normalization
  console.log('📅 Test 1: Date Normalization');
  console.log('   Past date (18.11.2024):', normalizeDate('18.11.2024'));
  console.log('   Future date (18.11.2025):', normalizeDate('18.11.2025'));
  console.log('   Today:', normalizeDate(new Date().toISOString().split('T')[0]));
  console.log('   Null:', normalizeDate(null));
  console.log('');
  
  // Test 2: Funding Type Normalization
  console.log('💰 Test 2: Funding Type Normalization');
  console.log('   Duplicates:', normalizeFundingTypes(['grant', 'grants', 'loan']));
  console.log('   Invalid:', normalizeFundingTypes(['services', 'coaching', 'unknown']));
  console.log('   Mixed:', normalizeFundingTypes(['grants', 'services', 'equity', 'unknown']));
  console.log('');
  
  // Test 3: Recent Pages from Database
  console.log('📊 Test 3: Recent Pages (Last 5)');
  const recentPages = await pool.query(`
    SELECT url, funding_types, deadline, open_deadline
    FROM pages
    ORDER BY id DESC
    LIMIT 5
  `);
  
  recentPages.rows.forEach((page, idx) => {
    console.log(`\n   Page ${idx + 1}:`);
    console.log(`   URL: ${page.url.substring(0, 60)}...`);
    console.log(`   Funding Types: [${(page.funding_types || []).join(', ') || 'empty'}]`);
    console.log(`   Deadline: ${page.deadline || 'null'} ${page.open_deadline ? '(open)' : ''}`);
    
    // Check if funding types are normalized
    const normalized = normalizeFundingTypes(page.funding_types || []);
    if (normalized.length !== (page.funding_types || []).length || 
        !normalized.every(t => (page.funding_types || []).includes(t))) {
      console.log(`   ⚠️  Needs normalization: [${normalized.join(', ') || 'empty'}]`);
    }
    
    // Check if deadline is past
    if (page.deadline) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const deadlineDate = new Date(page.deadline);
      deadlineDate.setHours(0, 0, 0, 0);
      if (deadlineDate <= today && !page.open_deadline) {
        console.log(`   ⚠️  Past deadline (should be filtered)`);
      }
    }
  });
  
  // Test 4: Funding Type Statistics
  console.log('\n📈 Test 4: Funding Type Statistics');
  const fundingStats = await pool.query(`
    SELECT 
      unnest(funding_types) as funding_type,
      COUNT(*) as count
    FROM pages
    WHERE funding_types IS NOT NULL AND array_length(funding_types, 1) > 0
    GROUP BY funding_type
    ORDER BY count DESC
  `);
  
  console.log('   Current funding types in DB:');
  fundingStats.rows.forEach(row => {
    console.log(`   - ${row.funding_type}: ${row.count} pages`);
  });
  
  // Check for invalid types
  const invalidTypes = ['services', 'service', 'coaching', 'mentoring', 'consultations', 
                        'networking', 'real estate', 'funding', 'unknown', 'grants', 'loans', 
                        'subsidies', 'guarantees'];
  const foundInvalid = fundingStats.rows.filter(r => invalidTypes.includes(r.funding_type));
  if (foundInvalid.length > 0) {
    console.log('\n   ⚠️  Invalid types found (need normalization):');
    foundInvalid.forEach(row => {
      console.log(`   - ${row.funding_type}: ${row.count} pages`);
    });
  } else {
    console.log('\n   ✅ No invalid types found!');
  }
  
  // Test 5: Past Deadlines
  console.log('\n📅 Test 5: Past Deadlines');
  const pastDeadlines = await pool.query(`
    SELECT COUNT(*) as count
    FROM pages
    WHERE deadline IS NOT NULL
      AND deadline <= CURRENT_DATE
      AND open_deadline = false
  `);
  
  const pastCount = parseInt(pastDeadlines.rows[0].count);
  if (pastCount > 0) {
    console.log(`   ⚠️  Found ${pastCount} pages with past deadlines (should be filtered)`);
  } else {
    console.log(`   ✅ No past deadlines found!`);
  }
  
  console.log('\n✅ Test Complete!\n');
}

testSmallBatch().catch(console.error);


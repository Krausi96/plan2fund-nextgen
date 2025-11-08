#!/usr/bin/env tsx

/**
 * Test Next Batch Features
 * Tests: Filter exploration, unified re-scraping, login detection
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
import { fetchHtml } from '../src/utils';
import { isOverviewPage } from '../src/utils';
import { extractFilterUrls, extractFilterOptions } from '../src/utils/overview-filters';
import { getReScrapeTasks, getReScrapeStats } from '../src/rescraping/unified-rescraping';
import { requiresLogin } from '../src/utils';

async function testNextBatchFeatures() {
  console.log('🧪 Testing Next Batch Features...\n');
  
  // Test 1: Filter Exploration
  console.log('📋 Test 1: Filter Exploration');
  try {
    // Test with a known overview page (FFG fundings page)
    const testUrl = 'https://www.ffg.at/en/fundings';
    console.log(`   Testing: ${testUrl}`);
    
    const result = await fetchHtml(testUrl);
    if (result.status === 200) {
      const isOverview = isOverviewPage(testUrl, result.html);
      console.log(`   ✅ Overview page detected: ${isOverview}`);
      
      if (isOverview) {
        const filterOptions = extractFilterOptions(result.html, testUrl);
        const filterCount = Object.keys(filterOptions).length;
        console.log(`   ✅ Filter options found: ${filterCount} filter types`);
        
        if (filterCount > 0) {
          Object.entries(filterOptions).forEach(([name, options]) => {
            console.log(`      - ${name}: ${options.length} options`);
          });
          
          // Test filter URL generation
          const filterUrls = extractFilterUrls(result.html, testUrl, 5);
          console.log(`   ✅ Generated ${filterUrls.length} filter URLs`);
          if (filterUrls.length > 0) {
            console.log(`      Example: ${filterUrls[0].substring(0, 80)}...`);
          }
        } else {
          console.log(`   ⚠️  No filter options found (might not be a filter page)`);
        }
      }
    } else {
      console.log(`   ⚠️  Failed to fetch: HTTP ${result.status}`);
    }
  } catch (error: any) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  
  console.log('');
  
  // Test 2: Unified Re-Scraping
  console.log('🔄 Test 2: Unified Re-Scraping');
  try {
    const stats = await getReScrapeStats();
    console.log(`   ✅ Re-scrape stats:`);
    console.log(`      - Overview pages: ${stats.overview}`);
    console.log(`      - Blacklisted URLs: ${stats.blacklist}`);
    console.log(`      - Manual: ${stats.manual}`);
    console.log(`      - Total: ${stats.total}`);
    
    if (stats.total > 0) {
      const tasks = await getReScrapeTasks(7, 30, 10);
      console.log(`   ✅ Retrieved ${tasks.length} re-scrape tasks`);
      if (tasks.length > 0) {
        console.log(`      Example task:`);
        console.log(`         URL: ${tasks[0].url.substring(0, 60)}...`);
        console.log(`         Type: ${tasks[0].type}`);
        console.log(`         Priority: ${tasks[0].priority}`);
        console.log(`         Reason: ${tasks[0].reason}`);
      }
    } else {
      console.log(`   ℹ️  No re-scrape tasks found (this is OK if DB is fresh)`);
    }
  } catch (error: any) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  
  console.log('');
  
  // Test 3: Login Detection
  console.log('🔐 Test 3: Login Detection');
  try {
    // Test with a known login page (AWS FörderManager)
    const loginUrl = 'https://www.aws.at/en/aws-foerdermanager';
    console.log(`   Testing: ${loginUrl}`);
    
    const result = await fetchHtml(loginUrl);
    if (result.status === 200) {
      const needsLogin = requiresLogin(loginUrl, result.html);
      console.log(`   ✅ Login required: ${needsLogin}`);
      
      if (needsLogin) {
        console.log(`   ✅ Correctly detected login page`);
      } else {
        console.log(`   ⚠️  Login page not detected (might have changed)`);
      }
    } else {
      console.log(`   ⚠️  Failed to fetch: HTTP ${result.status}`);
    }
    
    // Test with a regular page (should not require login)
    const regularUrl = 'https://www.ffg.at/en/fundings';
    const regularResult = await fetchHtml(regularUrl);
    if (regularResult.status === 200) {
      const needsLogin = requiresLogin(regularUrl, regularResult.html);
      console.log(`   Testing regular page: ${regularUrl}`);
      console.log(`   ✅ Login required: ${needsLogin} (should be false)`);
    }
  } catch (error: any) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  
  console.log('');
  
  // Test 4: Integration Check
  console.log('🔗 Test 4: Integration Check');
  try {
    const pool = getPool();
    
    // Check if overview pages are marked correctly
    const overviewPages = await pool.query(`
      SELECT COUNT(*) as count
      FROM pages
      WHERE metadata_json->>'is_overview_page' = 'true'
    `);
    console.log(`   ✅ Overview pages in DB: ${overviewPages.rows[0].count}`);
    
    // Check if login pages are marked correctly
    const loginPages = await pool.query(`
      SELECT COUNT(*) as count
      FROM pages
      WHERE metadata_json->>'requires_login' = 'true'
    `);
    console.log(`   ✅ Login pages in DB: ${loginPages.rows[0].count}`);
    
    // Check blacklist patterns
    const blacklistPatterns = await pool.query(`
      SELECT COUNT(*) as count
      FROM url_patterns
      WHERE pattern_type = 'exclude'
    `);
    console.log(`   ✅ Blacklist patterns: ${blacklistPatterns.rows[0].count}`);
    
  } catch (error: any) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  
  console.log('');
  console.log('✅ All Tests Complete!\n');
}

testNextBatchFeatures().catch(console.error);


#!/usr/bin/env ts-node

/**
 * Analyze URL Discovery Quality
 * 
 * Checks:
 * - Blacklisting/skipping effectiveness
 * - New URL discovery
 * - Funding type categorization
 * - Program focus categorization
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
const envPath = path.resolve(process.cwd(), '.env.local');
if (require('fs').existsSync(envPath)) {
  dotenv.config({ path: envPath });
}
dotenv.config();

import { getPool } from '../../db/db';

async function analyzeDiscovery(): Promise<void> {
  const pool = getPool();
  console.log('🔍 Discovery Quality Analysis\n');
  console.log('='.repeat(60));
  
  // 1. Check seen_urls (blacklisting)
  const seenUrls = await pool.query(`
    SELECT 
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE processed = true) as processed,
      COUNT(*) FILTER (WHERE processed = false) as unprocessed,
      COUNT(DISTINCT source_url) as unique_sources
    FROM seen_urls
  `);
  
  console.log('\n📋 Seen URLs (Blacklisting):');
  console.log(`   Total discovered: ${seenUrls.rows[0].total}`);
  console.log(`   Processed: ${seenUrls.rows[0].processed}`);
  console.log(`   Unprocessed: ${seenUrls.rows[0].unprocessed}`);
  console.log(`   Unique sources: ${seenUrls.rows[0].unique_sources}`);
  
  // 2. Check scraping_jobs (queue)
  const jobs = await pool.query(`
    SELECT 
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE status = 'queued') as queued,
      COUNT(*) FILTER (WHERE status = 'done') as done,
      COUNT(*) FILTER (WHERE status = 'failed') as failed,
      COUNT(DISTINCT seed_url) as unique_seeds
    FROM scraping_jobs
  `);
  
  console.log('\n📥 Scraping Jobs:');
  console.log(`   Total jobs: ${jobs.rows[0].total}`);
  console.log(`   Queued: ${jobs.rows[0].queued}`);
  console.log(`   Done: ${jobs.rows[0].done}`);
  console.log(`   Failed: ${jobs.rows[0].failed}`);
  console.log(`   Unique seed URLs: ${jobs.rows[0].unique_seeds}`);
  
  // 3. Check pages (what was actually scraped)
  const pages = await pool.query(`
    SELECT 
      COUNT(*) as total,
      COUNT(DISTINCT url) as unique_urls,
      COUNT(*) FILTER (WHERE funding_types IS NOT NULL AND array_length(funding_types, 1) > 0) as with_funding_types,
      COUNT(*) FILTER (WHERE program_focus IS NOT NULL AND array_length(program_focus, 1) > 0) as with_program_focus
    FROM pages
  `);
  
  console.log('\n📄 Scraped Pages:');
  console.log(`   Total: ${pages.rows[0].total}`);
  console.log(`   Unique URLs: ${pages.rows[0].unique_urls}`);
  console.log(`   With funding types: ${pages.rows[0].with_funding_types}`);
  console.log(`   With program focus: ${pages.rows[0].with_program_focus}`);
  
  // 4. Funding type distribution
  const fundingTypes = await pool.query(`
    SELECT 
      unnest(funding_types) as funding_type,
      COUNT(*) as count
    FROM pages
    WHERE funding_types IS NOT NULL AND array_length(funding_types, 1) > 0
    GROUP BY funding_type
    ORDER BY count DESC
  `);
  
  console.log('\n💰 Funding Types:');
  if (fundingTypes.rows.length > 0) {
    fundingTypes.rows.forEach((row: any) => {
      console.log(`   ${row.funding_type}: ${row.count} pages`);
    });
  } else {
    console.log('   None found');
  }
  
  // 5. Program focus distribution
  const programFocus = await pool.query(`
    SELECT 
      unnest(program_focus) as focus,
      COUNT(*) as count
    FROM pages
    WHERE program_focus IS NOT NULL AND array_length(program_focus, 1) > 0
    GROUP BY focus
    ORDER BY count DESC
    LIMIT 20
  `);
  
  console.log('\n🎯 Program Focus:');
  if (programFocus.rows.length > 0) {
    programFocus.rows.forEach((row: any) => {
      console.log(`   ${row.focus}: ${row.count} pages`);
    });
  } else {
    console.log('   None found');
  }
  
  // 6. Check URL patterns (learned patterns)
  const urlPatterns = await pool.query(`
    SELECT 
      host,
      pattern_type,
      pattern,
      confidence,
      usage_count,
      success_rate
    FROM url_patterns
    ORDER BY usage_count DESC
    LIMIT 10
  `);
  
  console.log('\n🔗 URL Patterns (Learned):');
  if (urlPatterns.rows.length > 0) {
    urlPatterns.rows.forEach((row: any, i: number) => {
      console.log(`   ${i + 1}. ${row.host} - ${row.pattern_type}: ${row.pattern}`);
      console.log(`      Confidence: ${parseFloat(row.confidence || '0').toFixed(2)}, Usage: ${row.usage_count}, Success: ${parseFloat(row.success_rate || '0').toFixed(1)}%`);
    });
  } else {
    console.log('   No patterns learned yet');
  }
  
  // 7. Check for duplicate URLs
  const duplicates = await pool.query(`
    SELECT 
      url,
      COUNT(*) as count
    FROM pages
    GROUP BY url
    HAVING COUNT(*) > 1
  `);
  
  console.log('\n⚠️  Duplicate URLs:');
  if (duplicates.rows.length > 0) {
    console.log(`   Found ${duplicates.rows.length} duplicate URLs`);
    duplicates.rows.forEach((row: any) => {
      console.log(`   ${row.url}: ${row.count} times`);
    });
  } else {
    console.log('   ✅ No duplicates found');
  }
  
  // 8. Check URL categorization quality
  const uncategorized = await pool.query(`
    SELECT 
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE funding_types IS NULL OR array_length(funding_types, 1) = 0) as no_funding_type,
      COUNT(*) FILTER (WHERE program_focus IS NULL OR array_length(program_focus, 1) = 0) as no_focus
    FROM pages
  `);
  
  console.log('\n📊 Categorization Quality:');
  console.log(`   Total pages: ${uncategorized.rows[0].total}`);
  console.log(`   Without funding type: ${uncategorized.rows[0].no_funding_type} (${uncategorized.rows[0].total > 0 ? ((uncategorized.rows[0].no_funding_type / uncategorized.rows[0].total) * 100).toFixed(1) : 0}%)`);
  console.log(`   Without program focus: ${uncategorized.rows[0].no_focus} (${uncategorized.rows[0].total > 0 ? ((uncategorized.rows[0].no_focus / uncategorized.rows[0].total) * 100).toFixed(1) : 0}%)`);
  
  process.exit(0);
}

analyzeDiscovery().catch(err => {
  console.error('❌ Analysis failed:', err);
  process.exit(1);
});


#!/usr/bin/env ts-node

/**
 * Full Cycle Test - Clean DB, Run Batches, Analyze Results
 * 
 * Usage:
 *   npm run test:full-cycle -- --batches=3 --discover=10 --scrape=5
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
const envPath = path.resolve(process.cwd(), '.env.local');
if (require('fs').existsSync(envPath)) {
  dotenv.config({ path: envPath });
}
dotenv.config();

import { getPool } from '../../db/db';

interface TestConfig {
  batches: number;
  discoverPerBatch: number;
  scrapePerBatch: number;
  cleanDatabase: boolean;
}

async function cleanDatabase(): Promise<void> {
  const pool = getPool();
  console.log('🧹 Cleaning database...\n');
  
  // Delete in order (respecting foreign keys)
  await pool.query('DELETE FROM requirements');
  await pool.query('DELETE FROM extraction_metrics');
  await pool.query('DELETE FROM scraping_jobs');
  await pool.query('DELETE FROM seen_urls');
  await pool.query('DELETE FROM url_patterns');
  await pool.query('DELETE FROM institution_patterns');
  await pool.query('DELETE FROM extraction_patterns');
  await pool.query('DELETE FROM pages');
  
  console.log('✅ Database cleaned\n');
}

async function runBatch(batchNum: number, discoverMax: number, scrapeMax: number): Promise<{
  discovered: number;
  scraped: number;
  saved: number;
  errors: number;
}> {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📦 BATCH ${batchNum}`);
  console.log('='.repeat(60));
  
  // Run discovery
  console.log('\n🔍 Running discovery...');
  const { execSync } = require('child_process');
  let discovered = 0;
  try {
    const discoverOutput = execSync(
      `npx tsx scraper-lite/unified-scraper.ts discover --max=${discoverMax}`,
      { encoding: 'utf-8', cwd: process.cwd() }
    );
    console.log(discoverOutput);
    // Extract number from output
    const match = discoverOutput.match(/NEW programs queued[:\s]+(\d+)/);
    discovered = match ? parseInt(match[1]) : 0;
  } catch (error: any) {
    console.error('❌ Discovery error:', error.message);
  }
  
  // Run scraping
  console.log('\n🧮 Running scraping...');
  let scraped = 0;
  let saved = 0;
  let errors = 0;
  try {
    const scrapeOutput = execSync(
      `npx tsx scraper-lite/unified-scraper.ts scrape --max=${scrapeMax}`,
      { encoding: 'utf-8', cwd: process.cwd() }
    );
    console.log(scrapeOutput);
    // Extract numbers from output
    const savedMatch = scrapeOutput.match(/saved[:\s]+(\d+)/);
    const skippedMatch = scrapeOutput.match(/skipped[:\s]+(\d+)/);
    saved = savedMatch ? parseInt(savedMatch[1]) : 0;
    scraped = saved + (skippedMatch ? parseInt(skippedMatch[1]) : 0);
    errors = scraped - saved;
  } catch (error: any) {
    console.error('❌ Scraping error:', error.message);
    errors++;
  }
  
  return { discovered, scraped, saved, errors };
}

async function analyzeResults(): Promise<void> {
  const pool = getPool();
  console.log('\n📊 Analyzing Results...\n');
  
  // Pages summary
  const pages = await pool.query(`
    SELECT 
      COUNT(*) as total,
      COUNT(DISTINCT url) as unique_urls,
      COUNT(*) FILTER (WHERE funding_amount_min IS NOT NULL) as with_amount_min,
      COUNT(*) FILTER (WHERE funding_amount_max IS NOT NULL) as with_amount_max,
      COUNT(*) FILTER (WHERE deadline IS NOT NULL) as with_deadline,
      COUNT(*) FILTER (WHERE contact_email IS NOT NULL) as with_email,
      COUNT(DISTINCT funding_types) as unique_funding_types
    FROM pages
  `);
  
  console.log('📄 Pages:');
  console.log(`   Total: ${pages.rows[0].total}`);
  console.log(`   Unique URLs: ${pages.rows[0].unique_urls}`);
  console.log(`   With amount_min: ${pages.rows[0].with_amount_min}`);
  console.log(`   With amount_max: ${pages.rows[0].with_amount_max}`);
  console.log(`   With deadline: ${pages.rows[0].with_deadline}`);
  console.log(`   With email: ${pages.rows[0].with_email}`);
  
  // Requirements summary
  const reqs = await pool.query(`
    SELECT 
      COUNT(*) as total,
      COUNT(DISTINCT page_id) as pages_with_reqs,
      COUNT(DISTINCT category) as unique_categories,
      COUNT(*) FILTER (WHERE extraction_method = 'llm') as llm_count,
      COUNT(*) FILTER (WHERE extraction_method = 'pattern') as pattern_count,
      COUNT(*) FILTER (WHERE extraction_method = 'hybrid') as hybrid_count,
      AVG(confidence) as avg_confidence,
      COUNT(*) FILTER (WHERE confidence >= 0.8) as high_confidence,
      COUNT(*) FILTER (WHERE confidence < 0.5) as low_confidence
    FROM requirements
  `);
  
  console.log('\n📋 Requirements:');
  console.log(`   Total: ${reqs.rows[0].total}`);
  console.log(`   Pages with requirements: ${reqs.rows[0].pages_with_reqs}`);
  console.log(`   Unique categories: ${reqs.rows[0].unique_categories}`);
  console.log(`   LLM: ${reqs.rows[0].llm_count}, Pattern: ${reqs.rows[0].pattern_count}, Hybrid: ${reqs.rows[0].hybrid_count}`);
  console.log(`   Avg confidence: ${parseFloat(reqs.rows[0].avg_confidence || '0').toFixed(2)}`);
  console.log(`   High confidence (≥0.8): ${reqs.rows[0].high_confidence}`);
  console.log(`   Low confidence (<0.5): ${reqs.rows[0].low_confidence}`);
  
  // Category breakdown
  const categories = await pool.query(`
    SELECT 
      category,
      COUNT(*) as count,
      AVG(confidence) as avg_conf,
      COUNT(*) FILTER (WHERE extraction_method = 'llm') as llm_count
    FROM requirements
    GROUP BY category
    ORDER BY count DESC
  `);
  
  console.log('\n📂 Categories:');
  categories.rows.forEach((row: any) => {
    console.log(`   ${row.category}: ${row.count} (LLM: ${row.llm_count}, avg conf: ${parseFloat(row.avg_conf || '0').toFixed(2)})`);
  });
  
  // Queue status
  const queue = await pool.query(`
    SELECT 
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE status = 'queued') as queued,
      COUNT(*) FILTER (WHERE status = 'done') as done,
      COUNT(*) FILTER (WHERE status = 'failed') as failed
    FROM scraping_jobs
  `);
  
  console.log('\n📥 Queue:');
  console.log(`   Total: ${queue.rows[0].total}`);
  console.log(`   Queued: ${queue.rows[0].queued}`);
  console.log(`   Done: ${queue.rows[0].done}`);
  console.log(`   Failed: ${queue.rows[0].failed}`);
  
  // Pattern learning
  const patterns = await pool.query(`
    SELECT 
      COUNT(*) as total,
      COUNT(DISTINCT host) as unique_hosts
    FROM extraction_patterns
  `);
  
  console.log('\n🧠 Pattern Learning:');
  console.log(`   Extraction patterns: ${patterns.rows[0].total}`);
  console.log(`   Unique hosts: ${patterns.rows[0].unique_hosts}`);
  
  const urlPatterns = await pool.query(`
    SELECT COUNT(*) as total FROM url_patterns
  `);
  console.log(`   URL patterns: ${urlPatterns.rows[0].total}`);
}

async function main() {
  const args = process.argv.slice(2);
  
  const config: TestConfig = {
    batches: parseInt(args.find(a => a.startsWith('--batches='))?.split('=')[1] || '3'),
    discoverPerBatch: parseInt(args.find(a => a.startsWith('--discover='))?.split('=')[1] || '10'),
    scrapePerBatch: parseInt(args.find(a => a.startsWith('--scrape='))?.split('=')[1] || '5'),
    cleanDatabase: args.includes('--clean')
  };
  
  console.log('🧪 Full Cycle Test');
  console.log('='.repeat(60));
  console.log(`Batches: ${config.batches}`);
  console.log(`Discover per batch: ${config.discoverPerBatch}`);
  console.log(`Scrape per batch: ${config.scrapePerBatch}`);
  console.log(`Clean database: ${config.cleanDatabase}`);
  console.log('='.repeat(60));
  
  if (config.cleanDatabase) {
    await cleanDatabase();
  }
  
  const results = [];
  for (let i = 1; i <= config.batches; i++) {
    const batchResult = await runBatch(i, config.discoverPerBatch, config.scrapePerBatch);
    results.push(batchResult);
    
    // Wait a bit between batches
    if (i < config.batches) {
      console.log('\n⏳ Waiting 2 seconds before next batch...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  // Final analysis
  await analyzeResults();
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  const totalDiscovered = results.reduce((sum, r) => sum + r.discovered, 0);
  const totalScraped = results.reduce((sum, r) => sum + r.scraped, 0);
  const totalSaved = results.reduce((sum, r) => sum + r.saved, 0);
  const totalErrors = results.reduce((sum, r) => sum + r.errors, 0);
  
  console.log(`Total discovered: ${totalDiscovered}`);
  console.log(`Total scraped: ${totalScraped}`);
  console.log(`Total saved: ${totalSaved}`);
  console.log(`Total errors: ${totalErrors}`);
  console.log(`Success rate: ${totalScraped > 0 ? ((totalSaved / totalScraped) * 100).toFixed(1) : 0}%`);
  
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});


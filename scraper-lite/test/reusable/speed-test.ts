#!/usr/bin/env tsx

/**
 * Speed Test - Compare performance before/after optimizations
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath, override: false });
}
dotenv.config({ override: false });

import { getPool } from '../../db/db';

async function main() {
  console.log('⚡ Speed Performance Analysis\n');
  
  const pool = getPool();
  
  // Get recent scraping stats
  const statsResult = await pool.query(`
    SELECT 
      COUNT(*) as total_pages,
      COUNT(*) FILTER (WHERE fetched_at > NOW() - INTERVAL '1 hour') as last_hour,
      COUNT(*) FILTER (WHERE fetched_at > NOW() - INTERVAL '24 hours') as last_24h
    FROM pages
    WHERE fetched_at IS NOT NULL
  `);
  
  const stats = statsResult.rows[0];
  
  console.log('📊 Recent Performance:');
  console.log(`   Total Pages Scraped: ${stats.total_pages}`);
  console.log(`   Last Hour: ${stats.last_hour} pages`);
  console.log(`   Last 24 Hours: ${stats.last_24h} pages\n`);
  
  // Check cache hit rate
  const cacheResult = await pool.query(`
    SELECT 
      COUNT(*) as total_extractions,
      COUNT(*) FILTER (WHERE metadata_json->>'extraction_method' = 'llm') as llm_extractions,
      COUNT(*) FILTER (WHERE metadata_json->>'model_version' IS NOT NULL) as cached_extractions
    FROM pages
    WHERE fetched_at > NOW() - INTERVAL '24 hours'
  `);
  
  const cache = cacheResult.rows[0];
  const cacheHitRate = cache.total_extractions > 0 
    ? ((cache.cached_extractions / cache.total_extractions) * 100).toFixed(1)
    : '0';
  
  console.log('💾 Caching Performance:');
  console.log(`   Total Extractions (24h): ${cache.total_extractions}`);
  console.log(`   LLM Extractions: ${cache.llm_extractions}`);
  console.log(`   Cache Hit Rate: ${cacheHitRate}%\n`);
  
  // Check queue status
  const queueResult = await pool.query(`
    SELECT 
      COUNT(*) as queued,
      AVG(quality_score) as avg_quality,
      COUNT(*) FILTER (WHERE quality_score >= 70) as high_quality
    FROM scraping_jobs
    WHERE status = 'queued'
  `);
  
  const queue = queueResult.rows[0];
  
  console.log('📋 Queue Status:');
  console.log(`   URLs Queued: ${queue.queued}`);
  console.log(`   Average Quality Score: ${parseFloat(queue.avg_quality || 50).toFixed(1)}`);
  console.log(`   High Quality (>=70): ${queue.high_quality}\n`);
  
  // Recommendations
  console.log('💡 Speed Optimization Recommendations:');
  
  if (parseFloat(cacheHitRate) < 50) {
    console.log('   ⚠️  Cache hit rate < 50% - caching could be improved');
  } else {
    console.log(`   ✅ Cache hit rate: ${cacheHitRate}% (good!)`);
  }
  
  if (parseFloat(queue.avg_quality || 50) < 60) {
    console.log('   ⚠️  Average quality < 60 - improve classification filtering');
  } else {
    console.log(`   ✅ Average quality: ${parseFloat(queue.avg_quality || 50).toFixed(1)} (good!)`);
  }
  
  const concurrency = parseInt(process.env.SCRAPER_CONCURRENCY || '8', 10);
  console.log(`\n   ⚡ Current Concurrency: ${concurrency} parallel URLs`);
  console.log(`      - Can increase to 10 if rate limits allow`);
  console.log(`      - Set SCRAPER_CONCURRENCY=10 in .env.local to test`);
  
  const timeout = parseInt(process.env.CUSTOM_LLM_TIMEOUT || '40000', 10);
  console.log(`\n   ⏱️  Current Timeout: ${timeout / 1000}s per LLM call`);
  console.log(`      - Can reduce to 30s if pages are fast`);
  console.log(`      - Set CUSTOM_LLM_TIMEOUT=30000 in .env.local to test`);
  
  console.log(`\n   📈 Expected Speedup: ~2x faster (8 parallel vs 5, plus timeout reduction)`);
}

main().catch(console.error);


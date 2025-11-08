#!/usr/bin/env ts-node

/**
 * Database Status Check
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
const envPath = path.resolve(process.cwd(), '.env.local');
if (require('fs').existsSync(envPath)) {
  dotenv.config({ path: envPath });
}
dotenv.config();

import { getPool } from '../db/db';

async function checkStatus(): Promise<void> {
  const pool = getPool();
  
  console.log('📊 Database Status\n');
  
  // Pages summary
  const pages = await pool.query(`
    SELECT 
      COUNT(*) as total,
      COUNT(DISTINCT url) as unique_urls,
      MIN(fetched_at) as oldest,
      MAX(fetched_at) as newest
    FROM pages
  `);
  console.log('📄 Pages:');
  console.log(`   Total: ${pages.rows[0].total}`);
  console.log(`   Unique URLs: ${pages.rows[0].unique_urls}`);
  console.log(`   Oldest: ${pages.rows[0].oldest || 'N/A'}`);
  console.log(`   Newest: ${pages.rows[0].newest || 'N/A'}\n`);
  
  // Requirements summary
  const reqs = await pool.query(`
    SELECT 
      COUNT(*) as total,
      COUNT(DISTINCT page_id) as pages_with_reqs,
      AVG(confidence) as avg_confidence
    FROM requirements
  `);
  console.log('📋 Requirements:');
  console.log(`   Total: ${reqs.rows[0].total}`);
  console.log(`   Pages with requirements: ${reqs.rows[0].pages_with_reqs}`);
  console.log(`   Avg confidence: ${parseFloat(reqs.rows[0].avg_confidence || '0').toFixed(2)}\n`);
  
  // Queue summary
  const queue = await pool.query(`
    SELECT 
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE status = 'queued') as queued,
      COUNT(*) FILTER (WHERE status = 'done') as done,
      COUNT(*) FILTER (WHERE status = 'failed') as failed
    FROM scraping_jobs
  `);
  console.log('📥 Queue:');
  console.log(`   Total jobs: ${queue.rows[0].total}`);
  console.log(`   Queued: ${queue.rows[0].queued}`);
  console.log(`   Done: ${queue.rows[0].done}`);
  console.log(`   Failed: ${queue.rows[0].failed}\n`);
  
  // Funding types
  const fundingTypes = await pool.query(`
    SELECT 
      unnest(funding_types) as funding_type,
      COUNT(*) as count
    FROM pages
    WHERE funding_types IS NOT NULL AND array_length(funding_types, 1) > 0
    GROUP BY funding_type
    ORDER BY count DESC
  `);
  console.log('💰 Funding Types:');
  if (fundingTypes.rows.length > 0) {
    fundingTypes.rows.forEach((row: any) => {
      console.log(`   ${row.funding_type}: ${row.count} pages`);
    });
  } else {
    console.log('   None found');
  }
  
  process.exit(0);
}

checkStatus().catch(err => {
  console.error(err);
  process.exit(1);
});


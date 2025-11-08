#!/usr/bin/env ts-node

import * as dotenv from 'dotenv';
import * as path from 'path';
const envPath = path.resolve(process.cwd(), '.env.local');
if (require('fs').existsSync(envPath)) {
  dotenv.config({ path: envPath });
}
dotenv.config();

import { getPool } from '../../db/db';

async function checkQueue() {
  const pool = getPool();
  
  console.log('📋 Checking Scraping Queue...\n');
  
  // All jobs
  const allJobs = await pool.query(`
    SELECT url, status, created_at, updated_at
    FROM scraping_jobs
    ORDER BY created_at DESC
    LIMIT 20
  `);
  
  console.log(`Total jobs: ${allJobs.rows.length}\n`);
  
  // Queued jobs that can be scraped (not in pages)
  const queued = await pool.query(`
    SELECT j.url, j.status, j.created_at
    FROM scraping_jobs j
    LEFT JOIN pages p ON j.url = p.url
    WHERE j.status = 'queued' AND p.id IS NULL
    ORDER BY j.created_at ASC
    LIMIT 10
  `);
  
  console.log(`✅ Queued jobs available for scraping: ${queued.rows.length}`);
  if (queued.rows.length > 0) {
    queued.rows.forEach((row: any, i: number) => {
      const url = row.url || '';
      console.log(`  ${i + 1}. ${url.substring(0, 70)}${url.length > 70 ? '...' : ''}`);
    });
  } else {
    console.log('  (All queued URLs are already in pages table)');
  }
  
  // Check why URLs might not be available
  const allQueued = await pool.query(`
    SELECT COUNT(*) as total FROM scraping_jobs WHERE status = 'queued'
  `);
  const inPages = await pool.query(`
    SELECT COUNT(*) as total 
    FROM scraping_jobs j
    INNER JOIN pages p ON j.url = p.url
    WHERE j.status = 'queued'
  `);
  
  console.log(`\n📊 Queue Statistics:`);
  console.log(`  Total queued: ${allQueued.rows[0].total}`);
  console.log(`  Already in pages: ${inPages.rows[0].total}`);
  console.log(`  Available to scrape: ${parseInt(allQueued.rows[0].total) - parseInt(inPages.rows[0].total)}`);
  
  // Recent jobs
  console.log(`\nRecent jobs (last 10):`);
  allJobs.rows.slice(0, 10).forEach((row: any, i: number) => {
    console.log(`  ${i + 1}. [${row.status}] ${row.url.substring(0, 50)}...`);
  });
  
  process.exit(0);
}

checkQueue().catch(err => {
  console.error(err);
  process.exit(1);
});


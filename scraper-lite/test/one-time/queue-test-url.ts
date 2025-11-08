#!/usr/bin/env ts-node

import * as dotenv from 'dotenv';
import * as path from 'path';
const envPath = path.resolve(process.cwd(), '.env.local');
if (require('fs').existsSync(envPath)) {
  dotenv.config({ path: envPath });
}
dotenv.config();

import { getPool } from '../../db/db';

async function queueTestUrl() {
  const pool = getPool();
  
  // Queue a known good AWS URL
  const testUrl = 'https://www.aws.at/en/aws-erp-loan/';
  
  console.log(`📋 Queueing test URL: ${testUrl}\n`);
  
  // Check if already in pages
  const inPages = await pool.query('SELECT id FROM pages WHERE url = $1', [testUrl]);
  if (inPages.rows.length > 0) {
    console.log('⚠️  URL already in pages table, skipping\n');
    process.exit(0);
  }
  
  // Queue it
  await pool.query(`
    INSERT INTO scraping_jobs (url, status, depth, seed_url)
    VALUES ($1, 'queued', 0, $1)
    ON CONFLICT (url) DO UPDATE SET status = 'queued', updated_at = NOW()
  `, [testUrl]);
  
  console.log('✅ Test URL queued!\n');
  console.log('Now run: npm run scraper:unified -- scrape --max=1\n');
  
  process.exit(0);
}

queueTestUrl().catch(err => {
  console.error(err);
  process.exit(1);
});


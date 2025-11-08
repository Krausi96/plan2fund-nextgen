#!/usr/bin/env ts-node

import * as dotenv from 'dotenv';
import * as path from 'path';
const envPath = path.resolve(process.cwd(), '.env.local');
if (require('fs').existsSync(envPath)) {
  dotenv.config({ path: envPath });
}
dotenv.config();

import { getPool } from '../../db/db';

async function cleanBadUrls() {
  const pool = getPool();
  
  console.log('🧹 Cleaning bad URLs from queue...\n');
  
  // Delete email protection and invalid URLs
  const result = await pool.query(`
    DELETE FROM scraping_jobs
    WHERE url LIKE '%email-protection%'
       OR url LIKE '%cdn-cgi%'
       OR url LIKE '%team-contact%'
       OR url LIKE '%contact=%'
    RETURNING url
  `);
  
  console.log(`✅ Deleted ${result.rows.length} invalid URLs\n`);
  
  // Show remaining
  const remaining = await pool.query(`
    SELECT COUNT(*) as count
    FROM scraping_jobs
    WHERE status = 'queued'
  `);
  
  console.log(`Remaining queued jobs: ${remaining.rows[0].count}\n`);
  
  process.exit(0);
}

cleanBadUrls().catch(err => {
  console.error(err);
  process.exit(1);
});


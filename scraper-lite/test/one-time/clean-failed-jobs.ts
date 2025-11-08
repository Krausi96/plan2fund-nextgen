#!/usr/bin/env tsx

/**
 * Clean Failed Jobs from Queue
 * Removes email-protection URLs and other known 404 URLs from scraping_jobs
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

async function cleanFailedJobs() {
  const pool = getPool();
  
  console.log('🧹 Cleaning failed jobs from queue...\n');
  
  // Find and mark failed jobs
  const failedPatterns = [
    '%cdn-cgi/l/email-protection%',
    '%email-protection#%',
    '%/sitemap/%',
    '%/accessibility/%',
    '%/data-protection/%',
    '%/disclaimer/%',
    '%/request-ifg/%',
  ];
  
  let totalMarked = 0;
  
  for (const pattern of failedPatterns) {
    const result = await pool.query(`
      UPDATE scraping_jobs
      SET status = 'failed', 
          last_error = 'Known 404 URL pattern',
          updated_at = NOW()
      WHERE status = 'queued' 
        AND url LIKE $1
    `, [pattern]);
    
    totalMarked += result.rowCount || 0;
    if (result.rowCount && result.rowCount > 0) {
      console.log(`   ✅ Marked ${result.rowCount} jobs as failed (pattern: ${pattern})`);
    }
  }
  
  // Also mark existing failed jobs with 404 errors
  const existingFailed = await pool.query(`
    UPDATE scraping_jobs
    SET last_error = 'HTTP 404 - Page not found'
    WHERE status = 'failed' 
      AND (last_error IS NULL OR last_error = '')
      AND url LIKE '%cdn-cgi%'
  `);
  
  console.log(`\n✅ Cleanup complete: ${totalMarked} jobs marked as failed\n`);
  
  // Show stats
  const stats = await pool.query(`
    SELECT 
      status,
      COUNT(*) as count
    FROM scraping_jobs
    GROUP BY status
    ORDER BY status
  `);
  
  console.log('📊 Queue Status:');
  stats.rows.forEach((row: any) => {
    console.log(`   ${row.status}: ${row.count}`);
  });
  
  await pool.end();
}

cleanFailedJobs().catch(console.error);


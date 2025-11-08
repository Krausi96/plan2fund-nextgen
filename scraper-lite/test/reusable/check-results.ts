#!/usr/bin/env ts-node

/**
 * Check scraper results in database
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
const envPath = path.resolve(process.cwd(), '.env.local');
if (require('fs').existsSync(envPath)) {
  dotenv.config({ path: envPath });
}
dotenv.config();

import { getPool } from '../../db/db';

async function checkResults(): Promise<void> {
  const pool = getPool();
  
  console.log('📊 Scraper Results Summary\n');
  
  // Total pages
  const pagesResult = await pool.query('SELECT COUNT(*) as total FROM pages');
  console.log(`📄 Total pages in database: ${pagesResult.rows[0].total}\n`);
  
  // Recent pages (last 10)
  const recentPages = await pool.query(`
    SELECT id, url, title, funding_amount_min, funding_amount_max, deadline, fetched_at
    FROM pages
    ORDER BY fetched_at DESC
    LIMIT 10
  `);
  
  console.log('📋 Recent pages (last 10):');
  recentPages.rows.forEach((row: any, i: number) => {
    const url = (row.url || '').substring(0, 60);
    const title = (row.title || 'No title').substring(0, 50);
    const amount = row.funding_amount_min || row.funding_amount_max 
      ? `${row.funding_amount_min || 'N/A'}-${row.funding_amount_max || 'N/A'} EUR`
      : 'N/A';
    console.log(`   ${i + 1}. [ID: ${row.id}] ${title}...`);
    console.log(`      URL: ${url}...`);
    console.log(`      Amount: ${amount}, Deadline: ${row.deadline || 'N/A'}`);
  });
  
  // Requirements summary
  const reqSummary = await pool.query(`
    SELECT 
      COUNT(*) as total_requirements,
      COUNT(DISTINCT page_id) as pages_with_requirements,
      COUNT(DISTINCT category) as unique_categories,
      extraction_method,
      COUNT(*) FILTER (WHERE extraction_method = 'pattern') as pattern_count,
      COUNT(*) FILTER (WHERE extraction_method = 'llm') as llm_count,
      COUNT(*) FILTER (WHERE extraction_method = 'hybrid') as hybrid_count,
      AVG(confidence) as avg_confidence
    FROM requirements
    GROUP BY extraction_method
    ORDER BY total_requirements DESC
  `);
  
  console.log('\n📊 Requirements Summary:');
  if (reqSummary.rows.length > 0) {
    reqSummary.rows.forEach((row: any) => {
      console.log(`   Method: ${row.extraction_method || 'pattern'}`);
      console.log(`   - Total: ${row.total_requirements}`);
      console.log(`   - Pages: ${row.pages_with_requirements}`);
      console.log(`   - Categories: ${row.unique_categories}`);
      console.log(`   - Avg Confidence: ${parseFloat(row.avg_confidence || '1.0').toFixed(2)}`);
      console.log('');
    });
  } else {
    console.log('   No requirements found');
  }
  
  // Category breakdown
  const categoryBreakdown = await pool.query(`
    SELECT category, COUNT(*) as count, extraction_method
    FROM requirements
    GROUP BY category, extraction_method
    ORDER BY count DESC
    LIMIT 20
  `);
  
  console.log('📂 Top Categories:');
  categoryBreakdown.rows.forEach((row: any, i: number) => {
    console.log(`   ${i + 1}. ${row.category}: ${row.count} (${row.extraction_method || 'pattern'})`);
  });
  
  process.exit(0);
}

checkResults().catch(err => {
  console.error(err);
  process.exit(1);
});


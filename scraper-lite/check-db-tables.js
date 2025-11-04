#!/usr/bin/env node
/**
 * Quick check: See what tables have data after running a cycle
 * Usage: node scraper-lite/check-db-tables.js
 */

require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'commonjs', moduleResolution: 'node', esModuleInterop: true } });

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const { getPool } = require('./src/db/neon-client');

async function checkTables() {
  console.log('\n' + '='.repeat(70));
  console.log('📊 DATABASE TABLE STATUS CHECK');
  console.log('='.repeat(70) + '\n');

  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not set in .env.local');
    process.exit(1);
  }

  const pool = getPool();

  try {
    // Check pages table
    const pagesResult = await pool.query('SELECT COUNT(*) as count FROM pages');
    const pagesCount = parseInt(pagesResult.rows[0].count);
    console.log(`📄 pages:              ${pagesCount.toLocaleString()} rows`);

    // Check requirements table
    const reqsResult = await pool.query('SELECT COUNT(*) as count FROM requirements');
    const reqsCount = parseInt(reqsResult.rows[0].count);
    console.log(`📋 requirements:       ${reqsCount.toLocaleString()} rows`);

    // Check scraping_jobs table
    const jobsResult = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'queued') as queued,
        COUNT(*) FILTER (WHERE status = 'done') as done,
        COUNT(*) FILTER (WHERE status = 'failed') as failed
      FROM scraping_jobs
    `);
    const jobs = jobsResult.rows[0];
    console.log(`🔧 scraping_jobs:       ${parseInt(jobs.total).toLocaleString()} total (${jobs.queued} queued, ${jobs.done} done, ${jobs.failed} failed)`);

    // Check seen_urls table
    const seenResult = await pool.query('SELECT COUNT(*) as count FROM seen_urls');
    const seenCount = parseInt(seenResult.rows[0].count);
    console.log(`👁️  seen_urls:          ${seenCount.toLocaleString()} rows`);

    // Check url_patterns table
    const patternsResult = await pool.query('SELECT COUNT(*) as count FROM url_patterns');
    const patternsCount = parseInt(patternsResult.rows[0].count);
    console.log(`🔗 url_patterns:        ${patternsCount.toLocaleString()} rows`);

    // Sample recent pages
    console.log('\n📊 Recent Pages (last 5):');
    const recentPages = await pool.query(`
      SELECT id, url, title, funding_amount_min, funding_amount_max, fetched_at
      FROM pages
      ORDER BY fetched_at DESC
      LIMIT 5
    `);
    recentPages.rows.forEach((page, i) => {
      console.log(`   ${i + 1}. [ID: ${page.id}] ${(page.title || page.url).substring(0, 60)}...`);
      console.log(`      💰 ${page.funding_amount_min || 'N/A'}-${page.funding_amount_max || 'N/A'} EUR | 📅 ${page.fetched_at ? new Date(page.fetched_at).toLocaleDateString() : 'N/A'}`);
    });

    // Requirements by category
    console.log('\n📋 Requirements by Category:');
    const categoryCounts = await pool.query(`
      SELECT category, COUNT(*) as count
      FROM requirements
      GROUP BY category
      ORDER BY count DESC
      LIMIT 10
    `);
    categoryCounts.rows.forEach(row => {
      console.log(`   ${row.category.padEnd(20)} ${parseInt(row.count).toLocaleString()} requirements`);
    });

    // Summary
    console.log('\n' + '='.repeat(70));
    console.log('✅ Tables being filled:');
    if (pagesCount > 0) console.log('   ✅ pages');
    if (reqsCount > 0) console.log('   ✅ requirements');
    if (parseInt(jobs.total) > 0) console.log('   ✅ scraping_jobs');
    if (seenCount > 0) console.log('   ✅ seen_urls');
    if (patternsCount > 0) console.log('   ✅ url_patterns');
    
    console.log('\n⚠️  Empty tables:');
    if (pagesCount === 0) console.log('   ⚠️  pages');
    if (reqsCount === 0) console.log('   ⚠️  requirements');
    if (parseInt(jobs.total) === 0) console.log('   ⚠️  scraping_jobs');
    if (seenCount === 0) console.log('   ⚠️  seen_urls');
    if (patternsCount === 0) console.log('   ⚠️  url_patterns');
    
    console.log('='.repeat(70) + '\n');

  } catch (error) {
    console.error('❌ Error checking database:', error.message);
    console.error(error.stack);
  } finally {
    await pool.end();
  }
}

checkTables().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});


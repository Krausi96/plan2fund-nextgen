#!/usr/bin/env node
/**
 * Analyze if we need new URLs or better extraction
 * Based on database stats and existing scripts
 */
require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'commonjs', moduleResolution: 'node', esModuleInterop: true } });
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env.local') });

const { getPool } = require('../../src/db/neon-client.ts');
const fs = require('fs');

async function analyzeNeedForNewScrape() {
  console.log('\n' + '='.repeat(70));
  console.log('🔍 ANALYZING: Do We Need New URLs or Better Extraction?');
  console.log('='.repeat(70));
  
  const pool = getPool();
  
  try {
    // 1. Database stats
    console.log('\n📊 DATABASE STATUS:');
    console.log('-'.repeat(70));
    
    const dbStats = await pool.query(`
      SELECT 
        COUNT(*) as total_pages,
        COUNT(DISTINCT url) as unique_urls,
        COUNT(*) FILTER (WHERE fetched_at > NOW() - INTERVAL '7 days') as recent_7d,
        COUNT(*) FILTER (WHERE fetched_at > NOW() - INTERVAL '30 days') as recent_30d,
        COUNT(*) FILTER (WHERE fetched_at < NOW() - INTERVAL '90 days') as old_90d,
        AVG((SELECT COUNT(*) FROM requirements r WHERE r.page_id = p.id)) as avg_reqs_per_page
      FROM pages p
    `);
    
    const stats = dbStats.rows[0];
    console.log(`   Total pages: ${stats.total_pages}`);
    console.log(`   Unique URLs: ${stats.unique_urls}`);
    console.log(`   Pages scraped (last 7 days): ${stats.recent_7d}`);
    console.log(`   Pages scraped (last 30 days): ${stats.recent_30d}`);
    console.log(`   Pages older than 90 days: ${stats.old_90d}`);
    console.log(`   Avg requirements/page: ${parseFloat(stats.avg_reqs_per_page || 0).toFixed(1)}`);
    
    // 2. State.json analysis
    console.log('\n📄 STATE.JSON STATUS:');
    console.log('-'.repeat(70));
    
    const statePath = path.join(__dirname, '../../data/lite/state.json');
    let stateData = null;
    let queued = 0;
    let recent30d = parseInt(stats.recent_30d);
    try {
      stateData = JSON.parse(fs.readFileSync(statePath, 'utf8'));
      const seen = Object.keys(stateData.seen || {}).length;
      const jobs = stateData.jobs || [];
      queued = jobs.filter(j => j.status === 'queued').length;
      const completed = jobs.filter(j => j.status === 'completed').length;
      const failed = jobs.filter(j => j.status === 'failed').length;
      const pagesInState = stateData.pages?.length || 0;
      
      console.log(`   URLs seen: ${seen}`);
      console.log(`   Total jobs: ${jobs.length}`);
      console.log(`   Queued jobs: ${queued}`);
      console.log(`   Completed jobs: ${completed}`);
      console.log(`   Failed jobs: ${failed}`);
      console.log(`   Pages in state: ${pagesInState}`);
      
      if (queued > 0) {
        console.log(`   ⚠️  ${queued} URLs still queued - need to scrape existing queue`);
      } else {
        console.log(`   ✅ No URLs in queue - may need new discovery`);
      }
    } catch (e) {
      console.log(`   ⚠️  Could not read state.json: ${e.message}`);
    }
    
    // 3. Quality analysis
    console.log('\n📈 DATA QUALITY ANALYSIS:');
    console.log('-'.repeat(70));
    
    const qualityStats = await pool.query(`
      SELECT 
        COUNT(DISTINCT page_id) as pages_with_reqs,
        COUNT(*) FILTER (WHERE meaningfulness_score >= 80) as high_quality,
        COUNT(*) FILTER (WHERE meaningfulness_score >= 50) as medium_quality,
        COUNT(*) FILTER (WHERE meaningfulness_score < 50) as low_quality,
        AVG(meaningfulness_score) as avg_meaningfulness
      FROM requirements
      WHERE meaningfulness_score IS NOT NULL
    `);
    
    const qStats = qualityStats.rows[0];
    const totalPages = parseInt(stats.total_pages);
    const pagesWithReqs = parseInt(qStats.pages_with_reqs || 0);
    const reqCoverage = ((pagesWithReqs / totalPages) * 100).toFixed(1);
    
    console.log(`   Pages with requirements: ${pagesWithReqs} / ${totalPages} (${reqCoverage}%)`);
    console.log(`   High quality requirements (80+): ${qStats.high_quality} (${((qStats.high_quality / (parseInt(qStats.high_quality) + parseInt(qStats.medium_quality) + parseInt(qStats.low_quality))) * 100).toFixed(1)}%)`);
    console.log(`   Medium quality (50-79): ${qStats.medium_quality} (${((qStats.medium_quality / (parseInt(qStats.high_quality) + parseInt(qStats.medium_quality) + parseInt(qStats.low_quality))) * 100).toFixed(1)}%)`);
    console.log(`   Low quality (<50): ${qStats.low_quality} (${((qStats.low_quality / (parseInt(qStats.high_quality) + parseInt(qStats.medium_quality) + parseInt(qStats.low_quality))) * 100).toFixed(1)}%)`);
    console.log(`   Avg meaningfulness: ${parseFloat(qStats.avg_meaningfulness || 0).toFixed(1)}/100`);
    
    // 4. Category coverage gaps
    console.log('\n📋 CATEGORY COVERAGE GAPS:');
    console.log('-'.repeat(70));
    
    const categoryGaps = await pool.query(`
      SELECT 
        category,
        COUNT(DISTINCT page_id) as pages,
        (SELECT COUNT(*) FROM pages) as total_pages,
        ROUND((COUNT(DISTINCT page_id)::numeric / (SELECT COUNT(*) FROM pages)) * 100, 1) as coverage_pct
      FROM requirements
      GROUP BY category
      ORDER BY coverage_pct ASC
      LIMIT 10
    `);
    
    console.log('   Lowest coverage categories:');
    categoryGaps.rows.forEach(row => {
      const status = parseFloat(row.coverage_pct) < 50 ? '❌' : parseFloat(row.coverage_pct) < 70 ? '⚠️ ' : '✅';
      console.log(`   ${status} ${row.category.padEnd(20)} ${row.pages} pages (${row.coverage_pct}%)`);
    });
    
    // 5. Pages with few categories (rescrape opportunity)
    console.log('\n🔄 RESCRAPE OPPORTUNITIES:');
    console.log('-'.repeat(70));
    
    const fewCategories = await pool.query(`
      SELECT 
        COUNT(*) as pages,
        COUNT(*) FILTER (WHERE (SELECT COUNT(DISTINCT category) FROM requirements r WHERE r.page_id = p.id) = 0) as no_reqs,
        COUNT(*) FILTER (WHERE (SELECT COUNT(DISTINCT category) FROM requirements r WHERE r.page_id = p.id) < 5) as less_than_5,
        COUNT(*) FILTER (WHERE (SELECT COUNT(DISTINCT category) FROM requirements r WHERE r.page_id = p.id) < 10) as less_than_10
      FROM pages p
    `);
    
    const fCat = fewCategories.rows[0];
    console.log(`   Pages with 0 categories: ${fCat.no_reqs}`);
    console.log(`   Pages with < 5 categories: ${fCat.less_than_5}`);
    console.log(`   Pages with < 10 categories: ${fCat.less_than_10}`);
    
    // 6. Metadata completeness
    console.log('\n📝 METADATA COMPLETENESS:');
    console.log('-'.repeat(70));
    
    const metadata = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE title IS NOT NULL AND title != '') as has_title,
        COUNT(*) FILTER (WHERE description IS NOT NULL AND description != '') as has_desc,
        COUNT(*) FILTER (WHERE funding_amount_min IS NOT NULL OR funding_amount_max IS NOT NULL) as has_amount,
        COUNT(*) FILTER (WHERE deadline IS NOT NULL) as has_deadline,
        COUNT(*) FILTER (WHERE contact_email IS NOT NULL OR contact_phone IS NOT NULL) as has_contact,
        COUNT(*) as total
      FROM pages
    `);
    
    const meta = metadata.rows[0];
    console.log(`   Title: ${meta.has_title} / ${meta.total} (${((meta.has_title / meta.total) * 100).toFixed(1)}%)`);
    console.log(`   Description: ${meta.has_desc} / ${meta.total} (${((meta.has_desc / meta.total) * 100).toFixed(1)}%)`);
    console.log(`   Funding amount: ${meta.has_amount} / ${meta.total} (${((meta.has_amount / meta.total) * 100).toFixed(1)}%)`);
    console.log(`   Deadline: ${meta.has_deadline} / ${meta.total} (${((meta.has_deadline / meta.total) * 100).toFixed(1)}%)`);
    console.log(`   Contact: ${meta.has_contact} / ${meta.total} (${((meta.has_contact / meta.total) * 100).toFixed(1)}%)`);
    
    // 7. RECOMMENDATIONS
    console.log('\n💡 RECOMMENDATIONS:');
    console.log('='.repeat(70));
    
    const needsNewUrls = stateData && queued === 0 && recent30d < 100;
    const needsRescrape = parseInt(fCat.less_than_5) > 100;
    const needsBetterExtraction = parseFloat(qStats.avg_meaningfulness || 0) < 70;
    
    if (needsNewUrls) {
      console.log('\n✅ NEED NEW URL DISCOVERY:');
      console.log('   • Only ' + stats.recent_30d + ' pages scraped in last 30 days');
      console.log('   • No URLs in queue');
      console.log('   • Run: node scripts/automatic/auto-cycle.js');
      console.log('   • Or: node scripts/manual/discover.js --max-pages 500');
    }
    
    if (needsRescrape) {
      console.log('\n✅ NEED RESCRAPE (IMPROVE EXISTING DATA):');
      console.log('   • ' + fCat.less_than_5 + ' pages have < 5 categories');
      console.log('   • ' + fCat.no_reqs + ' pages have no requirements');
      console.log('   • Run: node scripts/manual/rescrape-all.js --missing --limit=500');
      console.log('   • Or: node scripts/manual/rescrape-low-requirements.js');
    }
    
    if (needsBetterExtraction) {
      console.log('\n✅ NEED BETTER EXTRACTION (IMPROVE MEANINGFULNESS):');
      console.log('   • Average meaningfulness: ' + parseFloat(qStats.avg_meaningfulness || 0).toFixed(1));
      console.log('   • ' + qStats.low_quality + ' low-quality requirements');
      console.log('   • Improve extraction patterns in src/extract.ts');
      console.log('   • Then rescrape: node scripts/manual/rescrape-all.js --limit=200');
    }
    
    if (!needsNewUrls && !needsRescrape && !needsBetterExtraction) {
      console.log('\n✅ DATA QUALITY IS GOOD:');
      console.log('   • Good coverage and meaningfulness');
      console.log('   • No urgent need for new URLs or rescrape');
      console.log('   • Periodic maintenance rescrape recommended');
    }
    
    // 8. Summary score
    const score = (
      (pagesWithReqs / totalPages * 0.3) +
      (parseFloat(qStats.avg_meaningfulness || 0) / 100 * 0.3) +
      (meta.has_amount / meta.total * 0.2) +
      (parseInt(stats.recent_30d) > 50 ? 0.2 : 0.1)
    ) * 100;
    
    console.log('\n📊 OVERALL ASSESSMENT:');
    console.log('='.repeat(70));
    console.log(`   Data Quality Score: ${score.toFixed(1)}/100`);
    
    if (score >= 70) {
      console.log('   ✅ Excellent - data is in good shape');
    } else if (score >= 50) {
      console.log('   ⚠️  Good - some improvements possible');
    } else {
      console.log('   ❌ Needs improvement - prioritize rescrape or new URLs');
    }
    
    console.log('\n' + '='.repeat(70));
    
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  analyzeNeedForNewScrape().catch(err => {
    console.error('\n❌ Fatal error:', err);
    process.exit(1);
  });
}

module.exports = { analyzeNeedForNewScrape };


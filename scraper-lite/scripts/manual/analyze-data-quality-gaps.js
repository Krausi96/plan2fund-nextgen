#!/usr/bin/env node
/**
 * Analyze data quality gaps and what needs attention
 */
require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'commonjs', moduleResolution: 'node', esModuleInterop: true } });
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env.local') });

const { getPool } = require('../../src/db/neon-client.ts');

async function analyzeDataQualityGaps() {
  console.log('\n' + '='.repeat(70));
  console.log('📊 DATA QUALITY GAP ANALYSIS');
  console.log('='.repeat(70));
  
  const pool = getPool();
  
  try {
    // 1. Metadata gaps
    console.log('\n📝 METADATA GAPS (Priority Fix):');
    console.log('-'.repeat(70));
    
    const metadataGaps = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE deadline IS NOT NULL OR open_deadline = true) as has_deadline,
        COUNT(*) FILTER (WHERE funding_amount_min IS NOT NULL OR funding_amount_max IS NOT NULL) as has_amount,
        COUNT(*) FILTER (WHERE contact_email IS NOT NULL OR contact_phone IS NOT NULL) as has_contact,
        COUNT(*) FILTER (WHERE region IS NOT NULL) as has_region,
        COUNT(*) FILTER (WHERE funding_types IS NOT NULL AND array_length(funding_types, 1) > 0) as has_funding_types
      FROM pages
    `);
    
    const m = metadataGaps.rows[0];
    const total = parseInt(m.total);
    
    console.log(`   Deadline:        ${m.has_deadline}/${total} (${((m.has_deadline/total)*100).toFixed(1)}%)`);
    console.log(`   Funding Amount:  ${m.has_amount}/${total} (${((m.has_amount/total)*100).toFixed(1)}%)`);
    console.log(`   Contact:         ${m.has_contact}/${total} (${((m.has_contact/total)*100).toFixed(1)}%)`);
    console.log(`   Region:          ${m.has_region}/${total} (${((m.has_region/total)*100).toFixed(1)}%)`);
    console.log(`   Funding Types:   ${m.has_funding_types}/${total} (${((m.has_funding_types/total)*100).toFixed(1)}%)`);
    
    // 2. Category gaps
    console.log('\n📋 CATEGORY COVERAGE GAPS:');
    console.log('-'.repeat(70));
    
    const categoryGaps = await pool.query(`
      SELECT 
        category,
        COUNT(DISTINCT page_id) as page_count,
        COUNT(*) as requirement_count
      FROM requirements
      GROUP BY category
      ORDER BY page_count ASC
    `);
    
    const totalPages = await pool.query(`SELECT COUNT(*) as count FROM pages`);
    const totalPagesCount = parseInt(totalPages.rows[0].count);
    
    categoryGaps.rows.forEach(row => {
      const coverage = ((parseInt(row.page_count) / totalPagesCount) * 100).toFixed(1);
      const status = coverage < 20 ? '❌' : (coverage < 50 ? '⚠️' : '✅');
      console.log(`   ${status} ${row.category.padEnd(20)} ${row.page_count.toString().padStart(4)} pages (${coverage}%) | ${row.requirement_count} requirements`);
    });
    
    // 3. Critical category gaps
    console.log('\n🎯 CRITICAL CATEGORY GAPS:');
    console.log('-'.repeat(70));
    
    const criticalGaps = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(DISTINCT p.id) FILTER (
          WHERE EXISTS (SELECT 1 FROM requirements r WHERE r.page_id = p.id AND r.category = 'eligibility')
        ) as has_eligibility,
        COUNT(DISTINCT p.id) FILTER (
          WHERE EXISTS (SELECT 1 FROM requirements r WHERE r.page_id = p.id AND r.category = 'financial')
        ) as has_financial,
        COUNT(DISTINCT p.id) FILTER (
          WHERE EXISTS (SELECT 1 FROM requirements r WHERE r.page_id = p.id AND r.category = 'documents')
        ) as has_documents,
        COUNT(DISTINCT p.id) FILTER (
          WHERE EXISTS (SELECT 1 FROM requirements r WHERE r.page_id = p.id AND r.category = 'timeline')
        ) as has_timeline,
        COUNT(DISTINCT p.id) FILTER (
          WHERE EXISTS (SELECT 1 FROM requirements r WHERE r.page_id = p.id AND r.category = 'project')
        ) as has_project
      FROM pages p
    `);
    
    const c = criticalGaps.rows[0];
    const totalPages2 = parseInt(c.total);
    
    console.log(`   Eligibility:  ${c.has_eligibility}/${totalPages2} (${((c.has_eligibility/totalPages2)*100).toFixed(1)}%)`);
    console.log(`   Financial:    ${c.has_financial}/${totalPages2} (${((c.has_financial/totalPages2)*100).toFixed(1)}%)`);
    console.log(`   Documents:    ${c.has_documents}/${totalPages2} (${((c.has_documents/totalPages2)*100).toFixed(1)}%)`);
    console.log(`   Timeline:     ${c.has_timeline}/${totalPages2} (${((c.has_timeline/totalPages2)*100).toFixed(1)}%) ⚠️ LOW`);
    console.log(`   Project:      ${c.has_project}/${totalPages2} (${((c.has_project/totalPages2)*100).toFixed(1)}%)`);
    
    // 4. Pages with all critical categories
    const allCritical = await pool.query(`
      SELECT COUNT(DISTINCT p.id) as count
      FROM pages p
      WHERE 
        EXISTS (SELECT 1 FROM requirements r WHERE r.page_id = p.id AND r.category = 'eligibility')
        AND EXISTS (SELECT 1 FROM requirements r WHERE r.page_id = p.id AND r.category = 'financial')
        AND EXISTS (SELECT 1 FROM requirements r WHERE r.page_id = p.id AND r.category = 'documents')
        AND EXISTS (SELECT 1 FROM requirements r WHERE r.page_id = p.id AND r.category = 'timeline')
        AND EXISTS (SELECT 1 FROM requirements r WHERE r.page_id = p.id AND r.category = 'project')
    `);
    
    console.log(`\n   ⭐ Pages with ALL critical categories: ${allCritical.rows[0].count}/${totalPages2} (${((allCritical.rows[0].count/totalPages2)*100).toFixed(1)}%)`);
    
    // 5. Meaningfulness gaps
    console.log('\n📈 MEANINGFULNESS GAPS:');
    console.log('-'.repeat(70));
    
    const meaningfulness = await pool.query(`
      SELECT 
        COUNT(*) as total,
        AVG(meaningfulness_score) as avg_score,
        COUNT(*) FILTER (WHERE meaningfulness_score >= 80) as high_quality,
        COUNT(*) FILTER (WHERE meaningfulness_score >= 50 AND meaningfulness_score < 80) as medium_quality,
        COUNT(*) FILTER (WHERE meaningfulness_score < 50) as low_quality
      FROM requirements
      WHERE meaningfulness_score IS NOT NULL
    `);
    
    const mf = meaningfulness.rows[0];
    const totalReqs = parseInt(mf.total);
    
    console.log(`   Average Score:     ${parseFloat(mf.avg_score).toFixed(1)}/100`);
    console.log(`   High Quality (80+): ${mf.high_quality} (${((mf.high_quality/totalReqs)*100).toFixed(1)}%)`);
    console.log(`   Medium (50-79):     ${mf.medium_quality} (${((mf.medium_quality/totalReqs)*100).toFixed(1)}%)`);
    console.log(`   Low Quality (<50):  ${mf.low_quality} (${((mf.low_quality/totalReqs)*100).toFixed(1)}%)`);
    
    // 6. Recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    console.log('='.repeat(70));
    
    const timelineMissing = totalPages2 - parseInt(c.has_timeline);
    const deadlineMissing = totalPages2 - parseInt(m.has_deadline);
    const amountMissing = totalPages2 - parseInt(m.has_amount);
    
    if (timelineMissing > 100) {
      console.log(`\n   ⚠️  PRIORITY 1: Timeline coverage (${timelineMissing} pages missing)`);
      console.log(`      Run: node scripts/manual/rescrape-all.js --missing --limit=${timelineMissing}`);
    }
    
    if (deadlineMissing > 500) {
      console.log(`\n   ⚠️  PRIORITY 2: Deadline metadata (${deadlineMissing} pages missing)`);
      console.log(`      Improve deadline extraction in src/extract.ts`);
    }
    
    if (amountMissing > 500) {
      console.log(`\n   ⚠️  PRIORITY 3: Funding amount metadata (${amountMissing} pages missing)`);
      console.log(`      Improve financial extraction in src/extract.ts`);
    }
    
    if (parseInt(mf.low_quality) > 1000) {
      console.log(`\n   ⚠️  PRIORITY 4: Low meaningfulness (${mf.low_quality} requirements)`);
      console.log(`      Improve meaningfulness scoring in src/extract.ts`);
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
  analyzeDataQualityGaps().catch(err => {
    console.error('\n❌ Fatal error:', err);
    process.exit(1);
  });
}

module.exports = { analyzeDataQualityGaps };


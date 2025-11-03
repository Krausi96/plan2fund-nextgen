#!/usr/bin/env node
/**
 * Verify Database Data Quality
 * Checks requirement distribution, data completeness, and component readiness
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env.local') });
require('dotenv').config({ path: path.join(__dirname, '../../.env.local') });
require('dotenv').config();

require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'commonjs', moduleResolution: 'node', esModuleInterop: true } });

const { getPool } = require(path.join(__dirname, '../../src/db/neon-client.ts'));

const EXPECTED_CATEGORIES = [
  'eligibility', 'documents', 'financial', 'technical', 'legal',
  'timeline', 'geographic', 'team', 'project', 'compliance',
  'impact', 'capex_opex', 'use_of_funds', 'revenue_model',
  'market_size', 'co_financing', 'trl_level', 'consortium'
];

const CRITICAL_CATEGORIES = ['eligibility', 'financial', 'documents', 'project', 'timeline'];

async function verifyQuality() {
  console.log('\n🔍 Verifying Database Data Quality...\n');
  
  const pool = getPool();
  
  try {
    // 1. Basic counts
    const pageCount = await pool.query('SELECT COUNT(*) as count FROM pages');
    const reqCount = await pool.query('SELECT COUNT(*) as count FROM requirements');
    
    console.log('📊 Basic Statistics:');
    console.log(`   Pages: ${pageCount.rows[0].count}`);
    console.log(`   Requirements: ${reqCount.rows[0].count}`);
    console.log(`   Avg Requirements/Page: ${(reqCount.rows[0].count / pageCount.rows[0].count).toFixed(1)}\n`);
    
    // 2. Requirement distribution by category
    console.log('📋 Requirement Distribution by Category:');
    const categoryDist = await pool.query(`
      SELECT 
        category,
        COUNT(*) as count,
        COUNT(DISTINCT page_id) as pages
      FROM requirements
      GROUP BY category
      ORDER BY count DESC
    `);
    
    const foundCategories = new Set();
    categoryDist.rows.forEach(row => {
      foundCategories.add(row.category);
      console.log(`   ${row.category.padEnd(20)} ${String(row.count).padStart(6)} items, ${row.pages} pages`);
    });
    
    // 3. Missing categories
    console.log('\n⚠️  Missing Categories:');
    const missing = EXPECTED_CATEGORIES.filter(cat => !foundCategories.has(cat));
    if (missing.length > 0) {
      missing.forEach(cat => console.log(`   - ${cat}`));
    } else {
      console.log('   ✅ All 18 categories present!');
    }
    
    // 4. Pages with requirements
    console.log('\n📄 Pages with Requirements:');
    const pagesWithReqs = await pool.query(`
      SELECT 
        COUNT(DISTINCT page_id) as count
      FROM requirements
    `);
    const totalPages = parseInt(pageCount.rows[0].count);
    const pagesWithReqsCount = parseInt(pagesWithReqs.rows[0].count);
    const percentage = ((pagesWithReqsCount / totalPages) * 100).toFixed(1);
    console.log(`   ${pagesWithReqsCount} / ${totalPages} pages (${percentage}%)`);
    
    // 5. Pages with critical categories
    console.log('\n🎯 Pages with Critical Categories:');
    for (const category of CRITICAL_CATEGORIES) {
      const result = await pool.query(`
        SELECT COUNT(DISTINCT page_id) as count
        FROM requirements
        WHERE category = $1
      `, [category]);
      const count = parseInt(result.rows[0].count);
      const pct = ((count / totalPages) * 100).toFixed(1);
      console.log(`   ${category.padEnd(15)} ${String(count).padStart(4)} pages (${pct}%)`);
    }
    
    // 6. Pages with all critical categories
    console.log('\n⭐ Pages with ALL Critical Categories:');
    const allCritical = await pool.query(`
      SELECT COUNT(DISTINCT page_id) as count
      FROM requirements
      WHERE category IN ('eligibility', 'financial', 'documents', 'project', 'timeline')
      GROUP BY page_id
      HAVING COUNT(DISTINCT category) = 5
    `);
    const allCriticalCount = allCritical.rows.length;
    const allCriticalPct = ((allCriticalCount / totalPages) * 100).toFixed(1);
    console.log(`   ${allCriticalCount} / ${totalPages} pages (${allCriticalPct}%)`);
    
    // 7. Metadata completeness
    console.log('\n📝 Metadata Completeness:');
    const metadataStats = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE title IS NOT NULL) as has_title,
        COUNT(*) FILTER (WHERE description IS NOT NULL) as has_description,
        COUNT(*) FILTER (WHERE funding_amount_min IS NOT NULL) as has_min_amount,
        COUNT(*) FILTER (WHERE funding_amount_max IS NOT NULL) as has_max_amount,
        COUNT(*) FILTER (WHERE deadline IS NOT NULL) as has_deadline,
        COUNT(*) FILTER (WHERE contact_email IS NOT NULL) as has_email,
        COUNT(*) FILTER (WHERE region IS NOT NULL) as has_region,
        COUNT(*) as total
      FROM pages
    `);
    const stats = metadataStats.rows[0];
    console.log(`   Title:         ${stats.has_title} / ${stats.total} (${((stats.has_title/stats.total)*100).toFixed(1)}%)`);
    console.log(`   Description:   ${stats.has_description} / ${stats.total} (${((stats.has_description/stats.total)*100).toFixed(1)}%)`);
    console.log(`   Min Amount:    ${stats.has_min_amount} / ${stats.total} (${((stats.has_min_amount/stats.total)*100).toFixed(1)}%)`);
    console.log(`   Max Amount:    ${stats.has_max_amount} / ${stats.total} (${((stats.has_max_amount/stats.total)*100).toFixed(1)}%)`);
    console.log(`   Deadline:      ${stats.has_deadline} / ${stats.total} (${((stats.has_deadline/stats.total)*100).toFixed(1)}%)`);
    console.log(`   Contact Email: ${stats.has_email} / ${stats.total} (${((stats.has_email/stats.total)*100).toFixed(1)}%)`);
    console.log(`   Region:        ${stats.has_region} / ${stats.total} (${((stats.has_region/stats.total)*100).toFixed(1)}%)`);
    
    // 8. Component readiness assessment
    console.log('\n✅ Component Readiness Assessment:');
    
    const hasEnoughData = pagesWithReqsCount > 100;
    const hasCriticalCategories = allCriticalCount > 50;
    const hasMetadata = stats.has_title > 500 && stats.has_description > 500;
    
    console.log(`   SmartWizard/QuestionEngine:     ${hasEnoughData ? '✅' : '❌'} (${pagesWithReqsCount} pages with requirements)`);
    console.log(`   RequirementsChecker:            ${hasCriticalCategories ? '✅' : '⚠️ '} (${allCriticalCount} pages with all critical categories)`);
    console.log(`   Library/AdvancedSearch:         ${hasMetadata ? '✅' : '⚠️ '} (${stats.has_title} pages with metadata)`);
    console.log(`   EnhancedAIChat:                 ${hasEnoughData ? '✅' : '❌'} (${reqCount.rows[0].count} requirements available)`);
    
    console.log('\n✅ Quality check complete!\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Export for use in auto-cycle
if (require.main === module) {
  verifyQuality();
} else {
  module.exports = { verifyQuality };
}


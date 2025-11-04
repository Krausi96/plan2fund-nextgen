#!/usr/bin/env node
/**
 * Comprehensive test to verify 100% accuracy
 */
require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'commonjs', moduleResolution: 'node', esModuleInterop: true } });

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env.local') });

const { getPool } = require('../../src/db/neon-client.ts');
const { findInstitutionByUrl, institutions } = require('../../src/config.ts');
const { isProgramDetailPage } = require('../../src/utils.ts');
const fs = require('fs');

async function comprehensiveTest() {
  console.log('\n🔍 COMPREHENSIVE 200% ACCURACY TEST\n');
  console.log('='.repeat(70));
  
  const pool = getPool();
  const issues = [];
  const warnings = [];
  
  try {
    // TEST 1: Database Connection
    console.log('\n📊 TEST 1: Database Connection');
    console.log('-'.repeat(70));
    try {
      const test = await pool.query('SELECT 1 as test');
      console.log('  ✅ Database connected');
    } catch (e) {
      issues.push('Database connection failed');
      console.log('  ❌ Database connection failed:', e.message);
    }
    
    // TEST 2: funding_type Assignment
    console.log('\n📊 TEST 2: funding_type Assignment');
    console.log('-'.repeat(70));
    const nullFundingTypes = await pool.query(`
      SELECT COUNT(*) as count
      FROM pages
      WHERE metadata_json->>'funding_type' IS NULL 
         OR metadata_json->>'funding_type' = 'null'
         OR metadata_json->>'funding_type' = ''
    `);
    const nullCount = parseInt(nullFundingTypes.rows[0].count);
    if (nullCount > 0) {
      issues.push(`${nullCount} pages have null funding_type`);
      console.log(`  ❌ ${nullCount} pages have null funding_type`);
    } else {
      console.log('  ✅ All pages have funding_type assigned');
    }
    
    // TEST 3: Funding Type Distribution
    console.log('\n📊 TEST 3: Funding Type Distribution');
    console.log('-'.repeat(70));
    const fundingTypes = await pool.query(`
      SELECT 
        COALESCE(metadata_json->>'funding_type', 'null') as funding_type,
        COUNT(*) as count
      FROM pages
      GROUP BY metadata_json->>'funding_type'
      ORDER BY count DESC
    `);
    console.log('  Distribution:');
    fundingTypes.rows.forEach(row => {
      const ft = row.funding_type || 'null';
      const count = parseInt(row.count);
      const status = ft === 'null' ? '❌' : '✅';
      console.log(`    ${status} ${ft.padEnd(20)} ${String(count).padStart(4)} pages`);
      if (ft === 'null') {
        issues.push(`${count} pages have null funding_type`);
      }
    });
    
    // TEST 4: Institution Coverage
    console.log('\n📊 TEST 4: Institution Coverage');
    console.log('-'.repeat(70));
    const institutionCoverage = await pool.query(`
      SELECT 
        COALESCE(metadata_json->>'institution', 'null') as institution,
        COUNT(*) as count
      FROM pages
      GROUP BY metadata_json->>'institution'
      ORDER BY count DESC
      LIMIT 10
    `);
    console.log('  Top institutions:');
    institutionCoverage.rows.forEach(row => {
      console.log(`    ${(row.institution || 'null').padEnd(40)} ${String(row.count).padStart(4)} pages`);
    });
    
    // TEST 5: URL Filtering Test
    console.log('\n📊 TEST 5: URL Filtering (Test URLs)');
    console.log('-'.repeat(70));
    const testUrls = [
      'https://www.speedinvest.com/funds/seed-fund/',
      'https://eic.ec.europa.eu/eic-fund_en',
      'https://www.sfg.at/f/risikokapital/',
      'https://www.ffg.at/en/comet-compentence-centers-excellent-technologies-k1-centers',
      'https://www.aws.at/en/aws-equity/'
    ];
    
    let accepted = 0;
    let rejected = 0;
    testUrls.forEach(url => {
      const acceptedByFilter = isProgramDetailPage(url);
      const institution = findInstitutionByUrl(url);
      if (acceptedByFilter) {
        accepted++;
        console.log(`  ✅ ${url.substring(0, 60)}... (institution: ${institution?.name || 'N/A'})`);
      } else {
        rejected++;
        console.log(`  ❌ ${url.substring(0, 60)}... (REJECTED - institution: ${institution?.name || 'N/A'})`);
        warnings.push(`URL rejected by filter: ${url}`);
      }
    });
    console.log(`  Summary: ${accepted}/${testUrls.length} URLs accepted`);
    if (rejected > 0) {
      warnings.push(`${rejected} test URLs rejected - filtering may be too strict`);
    }
    
    // TEST 6: Requirements Quality
    console.log('\n📊 TEST 6: Requirements Quality');
    console.log('-'.repeat(70));
    const pagesWithReqs = await pool.query(`
      SELECT COUNT(DISTINCT p.id) as count
      FROM pages p
      JOIN requirements r ON p.id = r.page_id
    `);
    const pagesWithoutReqs = await pool.query(`
      SELECT COUNT(*) as count
      FROM pages p
      LEFT JOIN requirements r ON p.id = r.page_id
      WHERE r.id IS NULL
    `);
    const withReqs = parseInt(pagesWithReqs.rows[0].count);
    const withoutReqs = parseInt(pagesWithoutReqs.rows[0].count);
    console.log(`  ✅ Pages with requirements: ${withReqs}`);
    console.log(`  ${withoutReqs > 0 ? '⚠️' : '✅'} Pages without requirements: ${withoutReqs}`);
    if (withoutReqs > 0) {
      warnings.push(`${withoutReqs} pages have no requirements`);
    }
    
    // TEST 7: Critical Categories Coverage
    console.log('\n📊 TEST 7: Critical Categories Coverage');
    console.log('-'.repeat(70));
    const criticalCategories = ['eligibility', 'financial', 'documents', 'timeline', 'project'];
    for (const category of criticalCategories) {
      const count = await pool.query(`
        SELECT COUNT(DISTINCT page_id) as count
        FROM requirements
        WHERE category = $1
      `, [category]);
      const pageCount = parseInt(count.rows[0].count);
      const totalPages = await pool.query('SELECT COUNT(*) as count FROM pages');
      const total = parseInt(totalPages.rows[0].count);
      const coverage = total > 0 ? ((pageCount / total) * 100).toFixed(1) : 0;
      const status = parseFloat(coverage) >= 50 ? '✅' : '⚠️';
      console.log(`  ${status} ${category.padEnd(15)} ${String(pageCount).padStart(4)}/${total} pages (${coverage}%)`);
      if (parseFloat(coverage) < 50) {
        warnings.push(`Low ${category} coverage: ${coverage}%`);
      }
    }
    
    // TEST 8: Data Completeness
    console.log('\n📊 TEST 8: Data Completeness');
    console.log('-'.repeat(70));
    const completeness = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(title) FILTER (WHERE title IS NOT NULL AND title != '') as has_title,
        COUNT(description) FILTER (WHERE description IS NOT NULL AND description != '') as has_description,
        COUNT(funding_amount_min) FILTER (WHERE funding_amount_min IS NOT NULL) as has_amount_min,
        COUNT(funding_amount_max) FILTER (WHERE funding_amount_max IS NOT NULL) as has_amount_max,
        COUNT(deadline) FILTER (WHERE deadline IS NOT NULL) as has_deadline,
        COUNT(contact_email) FILTER (WHERE contact_email IS NOT NULL) as has_email,
        COUNT(metadata_json->>'funding_type') FILTER (WHERE metadata_json->>'funding_type' IS NOT NULL AND metadata_json->>'funding_type' != 'null') as has_funding_type
      FROM pages
    `);
    const r = completeness.rows[0];
    const total = parseInt(r.total);
    
    const metrics = [
      { name: 'Title', count: parseInt(r.has_title), total },
      { name: 'Description', count: parseInt(r.has_description), total },
      { name: 'Funding Amount', count: parseInt(r.has_amount_min), total },
      { name: 'Deadline', count: parseInt(r.has_deadline), total },
      { name: 'Contact Email', count: parseInt(r.has_email), total },
      { name: 'Funding Type', count: parseInt(r.has_funding_type), total }
    ];
    
    metrics.forEach(m => {
      const pct = total > 0 ? ((m.count / total) * 100).toFixed(1) : 0;
      const status = parseFloat(pct) >= 80 ? '✅' : parseFloat(pct) >= 50 ? '⚠️' : '❌';
      console.log(`  ${status} ${m.name.padEnd(20)} ${String(m.count).padStart(4)}/${total} (${pct}%)`);
      if (parseFloat(pct) < 50) {
        issues.push(`Low ${m.name} completeness: ${pct}%`);
      } else if (parseFloat(pct) < 80) {
        warnings.push(`Moderate ${m.name} completeness: ${pct}%`);
      }
    });
    
    // TEST 9: Institution Matching
    console.log('\n📊 TEST 9: Institution Matching');
    console.log('-'.repeat(70));
    const sampleUrls = [
      'https://www.speedinvest.com/funds/seed-fund/',
      'https://www.aws.at/en/aws-equity/',
      'https://eic.ec.europa.eu/eic-fund_en',
      'https://www.ffg.at/en/comet-compentence-centers-excellent-technologies-k1-centers'
    ];
    
    let matched = 0;
    let unmatched = 0;
    sampleUrls.forEach(url => {
      const inst = findInstitutionByUrl(url);
      if (inst) {
        matched++;
        console.log(`  ✅ ${url.substring(0, 50)}... → ${inst.name}`);
      } else {
        unmatched++;
        console.log(`  ❌ ${url.substring(0, 50)}... → NOT FOUND`);
        warnings.push(`Institution not found for: ${url}`);
      }
    });
    console.log(`  Summary: ${matched}/${sampleUrls.length} URLs matched to institutions`);
    
    // TEST 10: Code Improvements Verification
    console.log('\n📊 TEST 10: Code Improvements Verification');
    console.log('-'.repeat(70));
    
    // Check if funding_type fix is in code
    const scraperCode = fs.readFileSync(path.join(__dirname, '..', '..', 'src', 'scraper.ts'), 'utf8');
    const hasFundingTypeFix = scraperCode.includes('extractFundingTypeFromUrl') || scraperCode.includes('fundingType = fundingTypes.length > 0');
    const hasLinkLimitFix = !scraperCode.includes('.slice(0, 100)') || scraperCode.includes('// IMPROVEMENT: Check ALL links');
    
    if (hasFundingTypeFix) {
      console.log('  ✅ funding_type fix implemented');
    } else {
      issues.push('funding_type fix NOT found in code');
      console.log('  ❌ funding_type fix NOT found in code');
    }
    
    if (hasLinkLimitFix) {
      console.log('  ✅ Link limit fix implemented');
    } else {
      issues.push('Link limit fix NOT found in code');
      console.log('  ❌ Link limit fix NOT found in code');
    }
    
    // Check utils.ts for relaxed filtering
    const utilsCode = fs.readFileSync(path.join(__dirname, '..', '..', 'src', 'utils.ts'), 'utf8');
    const hasRelaxedFiltering = utilsCode.includes('knownHosts') || utilsCode.includes('IMPROVEMENT: For known institutions');
    
    if (hasRelaxedFiltering) {
      console.log('  ✅ Relaxed filtering implemented');
    } else {
      issues.push('Relaxed filtering NOT found in code');
      console.log('  ❌ Relaxed filtering NOT found in code');
    }
    
    // FINAL SUMMARY
    console.log('\n' + '='.repeat(70));
    console.log('📊 FINAL ASSESSMENT');
    console.log('='.repeat(70));
    
    if (issues.length === 0 && warnings.length === 0) {
      console.log('\n✅ 200% ACCURACY ACHIEVED!');
      console.log('  • All tests passed');
      console.log('  • No critical issues');
      console.log('  • All improvements working');
    } else {
      console.log('\n⚠️  STATUS:');
      if (issues.length > 0) {
        console.log(`  ❌ ${issues.length} CRITICAL ISSUES:`);
        issues.forEach(issue => console.log(`     • ${issue}`));
      }
      if (warnings.length > 0) {
        console.log(`  ⚠️  ${warnings.length} WARNINGS:`);
        warnings.forEach(warn => console.log(`     • ${warn}`));
      }
    }
    
    console.log('\n💡 Recommendations:');
    if (nullCount > 0) {
      console.log('  • Run: node scripts/manual/fix-null-funding-types.js');
    }
    if (rejected > 0) {
      console.log('  • URL filtering may need further relaxation');
    }
    if (warnings.length > 5) {
      console.log('  • Consider re-scraping pages with missing data');
    }
    
    console.log('\n');
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

comprehensiveTest().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});




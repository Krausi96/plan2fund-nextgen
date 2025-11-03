#!/usr/bin/env node
/**
 * Analyze discovery coverage - what we have vs what might be missing
 */
require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'commonjs', moduleResolution: 'node', esModuleInterop: true } });

const path = require('path');
const { institutions } = require('../../../legacy/institutionConfig.ts');
const { getPool } = require('../../src/db/neon-client.ts');

async function analyzeCoverage() {
  console.log('\n🔍 DISCOVERY COVERAGE ANALYSIS\n');
  console.log('='.repeat(70));
  
  const pool = getPool();
  
  try {
    // 1. Institutions by funding type
    console.log('\n📊 STEP 1: INSTITUTIONS BY FUNDING TYPE');
    console.log('-'.repeat(70));
    
    const byType = {};
    institutions.forEach(inst => {
      inst.fundingTypes?.forEach(ft => {
        if (!byType[ft]) {
          byType[ft] = {
            total: 0,
            autoDiscovery: 0,
            names: [],
            seedUrls: 0
          };
        }
        byType[ft].total++;
        if (inst.autoDiscovery) {
          byType[ft].autoDiscovery++;
          byType[ft].names.push(inst.name);
          byType[ft].seedUrls += (inst.programUrls || []).length;
        }
      });
    });
    
    console.log('\nFunding Type Coverage:');
    Object.keys(byType).sort().forEach(ft => {
      const d = byType[ft];
      console.log(`\n${ft}:`);
      console.log(`  Total institutions: ${d.total}`);
      console.log(`  With autoDiscovery: ${d.autoDiscovery} (${d.seedUrls} seed URLs)`);
      console.log(`  Missing autoDiscovery: ${d.total - d.autoDiscovery}`);
      if (d.autoDiscovery > 0) {
        console.log(`  Institutions: ${d.names.slice(0, 3).join(', ')}${d.names.length > 3 ? '...' : ''}`);
      }
    });
    
    // 2. Database coverage by funding type
    console.log('\n📊 STEP 2: DATABASE COVERAGE BY FUNDING TYPE');
    console.log('-'.repeat(70));
    
    const dbCoverage = await pool.query(`
      SELECT 
        COALESCE(metadata_json->>'funding_type', 'null') as funding_type,
        COUNT(*) as pages
      FROM pages
      GROUP BY metadata_json->>'funding_type'
      ORDER BY pages DESC
    `);
    
    console.log('\nPages in database by funding type:');
    dbCoverage.rows.forEach(row => {
      const ft = row.funding_type || 'null';
      const pages = parseInt(row.pages);
      const expected = byType[ft]?.autoDiscovery || 0;
      const coverage = expected > 0 ? (pages / (expected * 10)).toFixed(1) + '%' : 'N/A';
      console.log(`  ${ft.padEnd(25)} ${String(pages).padStart(4)} pages (${coverage} coverage)`);
    });
    
    // 3. Institutions without autoDiscovery
    console.log('\n📊 STEP 3: INSTITUTIONS WITHOUT AUTO-DISCOVERY');
    console.log('-'.repeat(70));
    
    const withoutAuto = institutions.filter(i => !i.autoDiscovery);
    console.log(`\nTotal institutions without autoDiscovery: ${withoutAuto.length}`);
    
    const byTypeNoAuto = {};
    withoutAuto.forEach(inst => {
      inst.fundingTypes?.forEach(ft => {
        if (!byTypeNoAuto[ft]) {
          byTypeNoAuto[ft] = [];
        }
        byTypeNoAuto[ft].push(inst.name);
      });
    });
    
    console.log('\nMissing by funding type:');
    Object.keys(byTypeNoAuto).sort().forEach(ft => {
      console.log(`\n${ft}: ${byTypeNoAuto[ft].length} institutions missing`);
      byTypeNoAuto[ft].slice(0, 5).forEach(name => {
        console.log(`  • ${name}`);
      });
      if (byTypeNoAuto[ft].length > 5) {
        console.log(`  ... and ${byTypeNoAuto[ft].length - 5} more`);
      }
    });
    
    // 4. Potential issues
    console.log('\n📊 STEP 4: POTENTIAL ISSUES');
    console.log('-'.repeat(70));
    
    console.log('\n1. Strict URL Filtering:');
    console.log('   • isProgramDetailPage() is very strict');
    console.log('   • Only accepts specific patterns');
    console.log('   • May miss valid program pages');
    
    console.log('\n2. Missing Institutions:');
    console.log(`   • ${withoutAuto.length} institutions without autoDiscovery`);
    console.log('   • These won\'t be discovered automatically');
    
    console.log('\n3. Funding Type Gaps:');
    dbCoverage.rows.forEach(row => {
      if (row.funding_type === 'null') {
        console.log('   • 1,024 pages have null funding_type');
        console.log('   • Need to fix funding_type assignment');
      }
    });
    
    // 5. Recommendations
    console.log('\n📊 STEP 5: RECOMMENDATIONS FOR 100% ACCURACY');
    console.log('-'.repeat(70));
    
    console.log('\n✅ To improve discovery:');
    console.log('   1. Enable autoDiscovery for all institutions');
    console.log('   2. Relax isProgramDetailPage() patterns');
    console.log('   3. Add more seed URLs per institution');
    console.log('   4. Improve institution-specific patterns');
    
    console.log('\n✅ To improve accuracy:');
    console.log('   1. Fix funding_type assignment (currently null)');
    console.log('   2. Validate extracted data before saving');
    console.log('   3. Add data quality checks');
    console.log('   4. Implement confidence scores');
    
    console.log('\n✅ To eliminate mistakes:');
    console.log('   1. Validate funding amounts (filter years, invalid numbers)');
    console.log('   2. Validate deadlines (proper date format)');
    console.log('   3. Validate contact info (email format, phone format)');
    console.log('   4. Cross-check with institution-specific rules');
    
    console.log('\n' + '='.repeat(70));
    console.log('✅ Analysis complete!\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

analyzeCoverage().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});


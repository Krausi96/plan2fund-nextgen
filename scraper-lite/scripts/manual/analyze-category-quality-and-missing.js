#!/usr/bin/env node
/**
 * Analyze Category Quality and Missing Data
 * Identifies which categories are low quality and which are missing
 */

require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'commonjs', moduleResolution: 'node', esModuleInterop: true } });

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env.local') });

const { getPool } = require('../../src/db/neon-client.ts');
const { calculateMeaningfulnessScore } = require('../../src/extract.ts');

async function analyzeCategoryQuality() {
  const pool = getPool();
  
  console.log('\n🔍 CATEGORY QUALITY & MISSING DATA ANALYSIS\n');
  console.log('='.repeat(100));
  
  // Get all pages
  const pages = await pool.query(`
    SELECT id, url, title, funding_amount_min, funding_amount_max, deadline, open_deadline
    FROM pages
    ORDER BY id DESC
    LIMIT 100
  `);
  
  console.log(`\n📄 Analyzing ${pages.rows.length} pages\n`);
  
  if (pages.rows.length === 0) {
    console.log('   ⚠️  No pages found in database');
    await pool.end();
    return;
  }
  
  // Get all requirements
  const requirements = await pool.query(`
    SELECT 
      r.category,
      r.type,
      r.value,
      r.source,
      r.meaningfulness_score,
      p.id as page_id,
      p.url,
      p.title
    FROM requirements r
    JOIN pages p ON r.page_id = p.id
    ORDER BY p.id DESC, r.category
  `);
  
  console.log(`📊 Total Requirements: ${requirements.rows.length}\n`);
  
  // Analyze by category
  const categoryStats = {};
  const allCategories = [
    'company_type', 'company_stage', 'industry_restriction', 'eligibility_criteria',
    'documents', 'financial', 'technical', 'legal', 'timeline', 'geographic', 'team',
    'innovation_focus', 'technology_area', 'research_domain', 'sector_focus',
    'compliance', 'environmental_impact', 'social_impact', 'economic_impact', 'innovation_impact',
    'capex_opex', 'use_of_funds', 'revenue_model', 'market_size', 'co_financing', 'trl_level', 'consortium',
    'diversity', 'application_process', 'evaluation_criteria', 'repayment_terms',
    'equity_terms', 'intellectual_property', 'success_metrics', 'restrictions'
  ];
  
  // Initialize all categories
  allCategories.forEach(cat => {
    categoryStats[cat] = {
      total: 0,
      pages: new Set(),
      avgScore: 0,
      minScore: 100,
      maxScore: 0,
      lowQuality: 0, // score <30
      mediumQuality: 0, // 30-69
      highQuality: 0, // 70-100
      sources: {},
      sampleValues: []
    };
  });
  
  // Process requirements
  requirements.rows.forEach(req => {
    const cat = req.category;
    if (!categoryStats[cat]) {
      categoryStats[cat] = {
        total: 0,
        pages: new Set(),
        avgScore: 0,
        minScore: 100,
        maxScore: 0,
        lowQuality: 0,
        mediumQuality: 0,
        highQuality: 0,
        sources: {},
        sampleValues: []
      };
    }
    
    const stats = categoryStats[cat];
    stats.total++;
    stats.pages.add(req.page_id);
    
    const score = req.meaningfulness_score || calculateMeaningfulnessScore(req.value);
    stats.avgScore += score;
    stats.minScore = Math.min(stats.minScore, score);
    stats.maxScore = Math.max(stats.maxScore, score);
    
    if (score < 30) stats.lowQuality++;
    else if (score < 70) stats.mediumQuality++;
    else stats.highQuality++;
    
    if (!stats.sources[req.source]) {
      stats.sources[req.source] = 0;
    }
    stats.sources[req.source]++;
    
    if (stats.sampleValues.length < 3) {
      stats.sampleValues.push({
        value: req.value.substring(0, 100),
        score: score,
        source: req.source
      });
    }
  });
  
  // Calculate averages and coverage
  const totalPages = pages.rows.length;
  const results = [];
  
  Object.entries(categoryStats).forEach(([category, stats]) => {
    const coverage = (stats.pages.size / totalPages) * 100;
    const avgScore = stats.total > 0 ? stats.avgScore / stats.total : 0;
    const lowQualityPct = stats.total > 0 ? (stats.lowQuality / stats.total) * 100 : 0;
    
    results.push({
      category,
      coverage,
      total: stats.total,
      pages: stats.pages.size,
      avgScore,
      minScore: stats.minScore === 100 ? 0 : stats.minScore,
      maxScore: stats.maxScore,
      lowQualityPct,
      highQualityPct: stats.total > 0 ? (stats.highQuality / stats.total) * 100 : 0,
      missing: stats.total === 0,
      sources: stats.sources,
      sampleValues: stats.sampleValues
    });
  });
  
  // Sort by coverage (lowest first)
  results.sort((a, b) => {
    if (a.missing && !b.missing) return -1;
    if (!a.missing && b.missing) return 1;
    return a.coverage - b.coverage;
  });
  
  console.log('\n📊 CATEGORY ANALYSIS BY COVERAGE & QUALITY\n');
  console.log('-'.repeat(100));
  
  // Missing categories
  const missing = results.filter(r => r.missing);
  console.log(`\n❌ MISSING CATEGORIES (0% coverage, 0 items):`);
  if (missing.length > 0) {
    missing.forEach(r => {
      console.log(`   - ${r.category} (0 pages, 0 items)`);
    });
  } else {
    console.log('   ✅ No missing categories');
  }
  
  // Low coverage categories
  const lowCoverage = results.filter(r => !r.missing && r.coverage < 30);
  console.log(`\n⚠️  LOW COVERAGE CATEGORIES (<30% coverage):`);
  if (lowCoverage.length > 0) {
    lowCoverage.forEach(r => {
      console.log(`   - ${r.category}: ${r.coverage.toFixed(1)}% (${r.pages}/${totalPages} pages, ${r.total} items, avg score: ${r.avgScore.toFixed(1)})`);
      if (r.sampleValues.length > 0) {
        console.log(`     Sample: "${r.sampleValues[0].value.substring(0, 60)}..." (score: ${r.sampleValues[0].score.toFixed(1)})`);
      }
    });
  } else {
    console.log('   ✅ No low coverage categories');
  }
  
  // Low quality categories
  const lowQuality = results.filter(r => !r.missing && r.lowQualityPct > 20);
  console.log(`\n⚠️  LOW QUALITY CATEGORIES (>20% low quality items):`);
  if (lowQuality.length > 0) {
    lowQuality.forEach(r => {
      console.log(`   - ${r.category}: ${r.lowQualityPct.toFixed(1)}% low quality (${r.lowQuality}/${r.total} items)`);
      console.log(`     Coverage: ${r.coverage.toFixed(1)}%, Avg score: ${r.avgScore.toFixed(1)}`);
    });
  } else {
    console.log('   ✅ No low quality categories');
  }
  
  // High coverage categories
  const highCoverage = results.filter(r => !r.missing && r.coverage >= 70);
  console.log(`\n✅ HIGH COVERAGE CATEGORIES (≥70% coverage):`);
  if (highCoverage.length > 0) {
    highCoverage.forEach(r => {
      console.log(`   - ${r.category}: ${r.coverage.toFixed(1)}% (${r.pages}/${totalPages} pages, ${r.total} items, avg score: ${r.avgScore.toFixed(1)})`);
    });
  } else {
    console.log('   ⚠️  No high coverage categories');
  }
  
  // Detailed analysis
  console.log('\n\n📋 DETAILED CATEGORY BREAKDOWN\n');
  console.log('-'.repeat(100));
  
  results.forEach(r => {
    const status = r.missing ? '❌ MISSING' : 
                   r.coverage < 30 ? '⚠️  LOW' : 
                   r.coverage >= 70 ? '✅ HIGH' : '🟡 MEDIUM';
    
    console.log(`\n${status} ${r.category}:`);
    console.log(`   Coverage: ${r.coverage.toFixed(1)}% (${r.pages}/${totalPages} pages)`);
    console.log(`   Total items: ${r.total}`);
    if (r.total > 0) {
      console.log(`   Quality: ${r.avgScore.toFixed(1)} avg (${r.minScore.toFixed(1)}-${r.maxScore.toFixed(1)})`);
      console.log(`   Low quality: ${r.lowQualityPct.toFixed(1)}% (${r.lowQuality}/${r.total} items)`);
      console.log(`   High quality: ${r.highQualityPct.toFixed(1)}% (${r.highQuality}/${r.total} items)`);
      console.log(`   Sources: ${Object.entries(r.sources).map(([s, c]) => `${s}(${c})`).join(', ')}`);
      if (r.sampleValues.length > 0) {
        console.log(`   Sample values:`);
        r.sampleValues.forEach(sv => {
          console.log(`     - "${sv.value}..." (score: ${sv.score.toFixed(1)}, source: ${sv.source})`);
        });
      }
    }
  });
  
  // Summary
  console.log('\n\n📊 SUMMARY\n');
  console.log('-'.repeat(100));
  
  const missingCount = missing.length;
  const lowCoverageCount = lowCoverage.length;
  const lowQualityCount = lowQuality.length;
  const highCoverageCount = highCoverage.length;
  
  console.log(`\nTotal categories: ${allCategories.length}`);
  console.log(`Missing: ${missingCount} (${((missingCount / allCategories.length) * 100).toFixed(1)}%)`);
  console.log(`Low coverage (<30%): ${lowCoverageCount} (${((lowCoverageCount / allCategories.length) * 100).toFixed(1)}%)`);
  console.log(`Low quality (>20%): ${lowQualityCount} (${((lowQualityCount / allCategories.length) * 100).toFixed(1)}%)`);
  console.log(`High coverage (≥70%): ${highCoverageCount} (${((highCoverageCount / allCategories.length) * 100).toFixed(1)}%)`);
  
  console.log('\n' + '='.repeat(100));
  console.log('✅ Analysis complete!\n');
  
  await pool.end();
}

analyzeCategoryQuality().catch(console.error);


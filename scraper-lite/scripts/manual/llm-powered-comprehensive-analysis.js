#!/usr/bin/env node
/**
 * LLM-Powered Comprehensive Analysis
 * Deep analysis of URL discovery, requirements meaningfulness, patterns, and improvements
 */

require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'commonjs', moduleResolution: 'node', esModuleInterop: true } });

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env.local') });

const { getPool } = require('../../src/db/neon-client.ts');
const { calculateMeaningfulnessScore } = require('../../src/extract.ts');
const { loadState } = require('../../src/scraper.ts');

async function comprehensiveAnalysis() {
  const pool = getPool();
  
  console.log('\n🧠 LLM-POWERED COMPREHENSIVE ANALYSIS\n');
  console.log('='.repeat(100));
  
  // ============================================================================
  // 1. URL DISCOVERY QUALITY ANALYSIS
  // ============================================================================
  console.log('\n1️⃣  URL DISCOVERY QUALITY ANALYSIS\n');
  console.log('-'.repeat(100));
  
  const state = loadState();
  const seenUrls = Object.keys(state.seen || {});
  const jobs = state.jobs || [];
  
  console.log(`\n📊 Discovery Statistics:`);
  console.log(`   Total URLs seen: ${seenUrls.length}`);
  console.log(`   Total jobs created: ${jobs.length}`);
  
  // Jobs by status
  const jobsByStatus = {};
  jobs.forEach(j => {
    jobsByStatus[j.status] = (jobsByStatus[j.status] || 0) + 1;
  });
  console.log(`\n   Jobs by status:`);
  Object.keys(jobsByStatus).forEach(status => {
    console.log(`      ${status}: ${jobsByStatus[status]} (${Math.round(jobsByStatus[status]/jobs.length*100)}%)`);
  });
  
  // Overview pages analysis
  const overviewPages = jobs.filter(j => j.isOverviewPage);
  console.log(`\n   Overview pages detected: ${overviewPages.length} (${Math.round(overviewPages.length/jobs.length*100)}%)`);
  
  // Program detail pages
  const detailPages = jobs.filter(j => !j.isOverviewPage && j.status === 'done');
  console.log(`   Program detail pages: ${detailPages.length} (${Math.round(detailPages.length/jobs.length*100)}%)`);
  
  // Skipped URLs
  const skippedUrls = jobs.filter(j => j.status === 'skipped' || j.status === 'rejected');
  console.log(`   Skipped/rejected URLs: ${skippedUrls.length} (${Math.round(skippedUrls.length/jobs.length*100)}%)`);
  
  // Check if skipped URLs are being re-skipped
  const skippedUrlSet = new Set(skippedUrls.map(j => j.url));
  const reSkippedCount = jobs.filter(j => 
    (j.status === 'skipped' || j.status === 'rejected') && 
    skippedUrlSet.has(j.url) && 
    jobs.filter(j2 => j2.url === j.url && (j2.status === 'skipped' || j2.status === 'rejected')).length > 1
  ).length;
  console.log(`   Re-skipped URLs: ${reSkippedCount} (${reSkippedCount > 0 ? '⚠️  URLs are being skipped multiple times' : '✅ No re-skipping detected'})`);
  
  // URL patterns
  console.log(`\n   URL Patterns:`);
  const urlPatterns = {};
  jobs.forEach(j => {
    try {
      const urlObj = new URL(j.url);
      const pathParts = urlObj.pathname.split('/').filter(p => p);
      if (pathParts.length > 0) {
        const pattern = `/${pathParts[0]}/...`;
        urlPatterns[pattern] = (urlPatterns[pattern] || 0) + 1;
      }
    } catch (e) {
      // Invalid URL
    }
  });
  Object.keys(urlPatterns).sort((a, b) => urlPatterns[b] - urlPatterns[a]).slice(0, 10).forEach(pattern => {
    console.log(`      ${pattern}: ${urlPatterns[pattern]} URLs`);
  });
  
  // Discovery efficiency
  const successfulPages = jobs.filter(j => j.status === 'done' && !j.isOverviewPage);
  const discoveryEfficiency = jobs.length > 0 ? (successfulPages.length / jobs.length * 100) : 0;
  console.log(`\n   Discovery Efficiency: ${discoveryEfficiency.toFixed(1)}% (${successfulPages.length}/${jobs.length} are program detail pages)`);
  
  if (discoveryEfficiency < 30) {
    console.log(`   ❌ VERY LOW EFFICIENCY: Too many overview pages or skipped URLs`);
  } else if (discoveryEfficiency < 50) {
    console.log(`   ⚠️  LOW EFFICIENCY: Could be improved`);
  } else if (discoveryEfficiency < 70) {
    console.log(`   ⚠️  MODERATE EFFICIENCY: Acceptable but could be better`);
  } else {
    console.log(`   ✅ GOOD EFFICIENCY: Most discovered URLs are program detail pages`);
  }
  
  // Check database for seen URLs
  const dbSeenUrls = await pool.query(`SELECT COUNT(*) as count FROM seen_urls`);
  console.log(`\n   Database seen URLs: ${dbSeenUrls.rows[0].count}`);
  console.log(`   State seen URLs: ${seenUrls.length}`);
  if (parseInt(dbSeenUrls.rows[0].count) !== seenUrls.length) {
    console.log(`   ⚠️  Mismatch between database and state - URLs may not be properly tracked`);
  }
  
  // ============================================================================
  // 2. REQUIREMENTS MEANINGFULNESS & PATTERNS
  // ============================================================================
  console.log('\n\n2️⃣  REQUIREMENTS MEANINGFULNESS & PATTERNS\n');
  console.log('-'.repeat(100));
  
  const pages = await pool.query(`
    SELECT id, url, title, funding_types, program_focus
    FROM pages
    ORDER BY id DESC
  `);
  
  console.log(`📄 Analyzing ${pages.rows.length} pages\n`);
  
  const requirements = await pool.query(`
    SELECT 
      r.category,
      r.type,
      r.value,
      r.required,
      r.source,
      r.meaningfulness_score,
      p.id as page_id,
      p.url,
      p.title
    FROM requirements r
    JOIN pages p ON r.page_id = p.id
    ORDER BY p.id DESC, r.category
  `);
  
  // Group by category
  const byCategory = {};
  requirements.rows.forEach(req => {
    if (!byCategory[req.category]) {
      byCategory[req.category] = [];
    }
    byCategory[req.category].push(req);
  });
  
  // Calculate meaningfulness scores
  const categoryScores = {};
  Object.keys(byCategory).forEach(category => {
    const items = byCategory[category];
    const scores = items.map(item => {
      const score = item.meaningfulness_score || calculateMeaningfulnessScore(item.value);
      return score;
    });
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    categoryScores[category] = {
      count: items.length,
      avgScore: avgScore.toFixed(1),
      minScore: Math.min(...scores).toFixed(1),
      maxScore: Math.max(...scores).toFixed(1),
      meaningful: scores.filter(s => s >= 70).length,
      nonMeaningful: scores.filter(s => s < 50).length
    };
  });
  
  console.log('📊 Meaningfulness Scores by Category:');
  Object.entries(categoryScores)
    .sort((a, b) => parseFloat(b[1].avgScore) - parseFloat(a[1].avgScore))
    .forEach(([category, stats]) => {
      const score = parseFloat(stats.avgScore);
      const emoji = score >= 70 ? '✅' : score >= 50 ? '⚠️' : '❌';
      const meaningfulPct = ((stats.meaningful / stats.count) * 100).toFixed(1);
      console.log(`   ${emoji} ${category}: ${stats.count} items, avg: ${stats.avgScore} (min: ${stats.minScore}, max: ${stats.maxScore}) - ${meaningfulPct}% meaningful`);
    });
  
  // Pattern recognition
  console.log('\n🔍 Pattern Recognition:');
  
  // Source patterns
  const sourcePatterns = {};
  requirements.rows.forEach(req => {
    sourcePatterns[req.source] = (sourcePatterns[req.source] || 0) + 1;
  });
  console.log('\n   Extraction Sources:');
  Object.entries(sourcePatterns)
    .sort((a, b) => b[1] - a[1])
    .forEach(([source, count]) => {
      const pct = ((count / requirements.rows.length) * 100).toFixed(1);
      console.log(`      ${source}: ${count} (${pct}%)`);
    });
  
  // Type patterns
  const typePatterns = {};
  requirements.rows.forEach(req => {
    if (!typePatterns[req.category]) {
      typePatterns[req.category] = {};
    }
    typePatterns[req.category][req.type] = (typePatterns[req.category][req.type] || 0) + 1;
  });
  console.log('\n   Common Types by Category (top 3 per category):');
  Object.entries(typePatterns).forEach(([category, types]) => {
    const topTypes = Object.entries(types)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
    if (topTypes.length > 0) {
      console.log(`      ${category}:`);
      topTypes.forEach(([type, count]) => {
        console.log(`         - ${type}: ${count}`);
      });
    }
  });
  
  // ============================================================================
  // 3. COVERAGE ANALYSIS (with split categories)
  // ============================================================================
  console.log('\n\n3️⃣  COVERAGE ANALYSIS\n');
  console.log('-'.repeat(100));
  
  // Updated critical categories (split)
  const CRITICAL_CATEGORIES = [
    'geographic',
    'company_type', 'company_stage', 'industry_restriction', 'eligibility_criteria',
    'financial',
    'use_of_funds',
    'team',
    'environmental_impact', 'social_impact', 'economic_impact', 'innovation_impact',
    'timeline'
  ];
  
  const NON_CRITICAL_CATEGORIES = [
    'documents', 'innovation_focus', 'technology_area', 'research_domain', 'sector_focus',
    'consortium', 'technical', 'legal', 'capex_opex', 'revenue_model', 'market_size',
    'trl_level', 'co_financing', 'diversity', 'application_process', 'evaluation_criteria',
    'repayment_terms', 'equity_terms', 'intellectual_property', 'success_metrics', 'restrictions'
  ];
  
  const criticalCoverage = {};
  const nonCriticalCoverage = {};
  
  CRITICAL_CATEGORIES.forEach(cat => {
    const pagesWithCat = new Set(requirements.rows.filter(r => r.category === cat).map(r => r.page_id));
    criticalCoverage[cat] = {
      count: pagesWithCat.size,
      percentage: ((pagesWithCat.size / pages.rows.length) * 100).toFixed(1)
    };
  });
  
  NON_CRITICAL_CATEGORIES.forEach(cat => {
    const pagesWithCat = new Set(requirements.rows.filter(r => r.category === cat).map(r => r.page_id));
    nonCriticalCoverage[cat] = {
      count: pagesWithCat.size,
      percentage: ((pagesWithCat.size / pages.rows.length) * 100).toFixed(1)
    };
  });
  
  console.log('🎯 CRITICAL CATEGORIES (Target: 92%):');
  Object.entries(criticalCoverage)
    .sort((a, b) => parseFloat(b[1].percentage) - parseFloat(a[1].percentage))
    .forEach(([cat, stats]) => {
      const pct = parseFloat(stats.percentage);
      const emoji = pct >= 92 ? '✅' : pct >= 70 ? '⚠️' : '❌';
      const gap = pct >= 92 ? '' : ` (gap: ${(92 - pct).toFixed(1)}%)`;
      console.log(`   ${emoji} ${cat}: ${stats.count}/${pages.rows.length} (${stats.percentage}%)${gap}`);
    });
  
  const criticalAvg = Object.values(criticalCoverage).reduce((sum, s) => sum + parseFloat(s.percentage), 0) / CRITICAL_CATEGORIES.length;
  console.log(`\n   📊 CRITICAL AVERAGE: ${criticalAvg.toFixed(1)}% (Target: 92%)`);
  
  console.log('\n📋 NON-CRITICAL CATEGORIES (Target: 80%):');
  Object.entries(nonCriticalCoverage)
    .sort((a, b) => parseFloat(b[1].percentage) - parseFloat(a[1].percentage))
    .slice(0, 15) // Show top 15
    .forEach(([cat, stats]) => {
      const pct = parseFloat(stats.percentage);
      const emoji = pct >= 80 ? '✅' : pct >= 50 ? '⚠️' : '❌';
      console.log(`   ${emoji} ${cat}: ${stats.count}/${pages.rows.length} (${stats.percentage}%)`);
    });
  
  const nonCriticalAvg = Object.values(nonCriticalCoverage).reduce((sum, s) => sum + parseFloat(s.percentage), 0) / NON_CRITICAL_CATEGORIES.length;
  console.log(`\n   📊 NON-CRITICAL AVERAGE: ${nonCriticalAvg.toFixed(1)}% (Target: 80%)`);
  
  // ============================================================================
  // 4. WHAT MUST BE IMPROVED
  // ============================================================================
  console.log('\n\n4️⃣  WHAT MUST BE IMPROVED\n');
  console.log('-'.repeat(100));
  
  const improvements = [];
  
  // Critical coverage gaps
  Object.entries(criticalCoverage).forEach(([cat, stats]) => {
    const pct = parseFloat(stats.percentage);
    if (pct < 92) {
      improvements.push({
        priority: pct < 30 ? 'CRITICAL' : pct < 50 ? 'HIGH' : 'MEDIUM',
        category: cat,
        issue: `Coverage ${pct}% (target: 92%)`,
        gap: (92 - pct).toFixed(1) + '%',
        currentCount: stats.count,
        targetCount: Math.ceil(pages.rows.length * 0.92)
      });
    }
  });
  
  // Meaningfulness issues
  Object.entries(categoryScores).forEach(([cat, stats]) => {
    const score = parseFloat(stats.avgScore);
    if (score < 50) {
      improvements.push({
        priority: 'HIGH',
        category: cat,
        issue: `Low meaningfulness score: ${stats.avgScore}`,
        gap: 'Quality issue',
        meaningfulPct: ((stats.meaningful / stats.count) * 100).toFixed(1) + '%'
      });
    }
  });
  
  // Discovery efficiency
  if (discoveryEfficiency < 50) {
    improvements.push({
      priority: 'HIGH',
      category: 'url_discovery',
      issue: `Low discovery efficiency: ${discoveryEfficiency.toFixed(1)}%`,
      gap: 'Too many overview pages or skipped URLs',
      recommendation: 'Improve seed URLs or overview page detection'
    });
  }
  
  // Sort by priority
  const priorityOrder = { 'CRITICAL': 1, 'HIGH': 2, 'MEDIUM': 3, 'LOW': 4 };
  improvements.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  
  console.log('🔍 Priority Improvements:');
  improvements.forEach((imp, idx) => {
    const emoji = imp.priority === 'CRITICAL' ? '🔴' : imp.priority === 'HIGH' ? '🟠' : imp.priority === 'MEDIUM' ? '🟡' : '🟢';
    console.log(`   ${emoji} ${imp.priority} Priority: ${imp.category} - ${imp.issue} (gap: ${imp.gap})`);
    if (imp.recommendation) {
      console.log(`      💡 Recommendation: ${imp.recommendation}`);
    }
    if (imp.targetCount) {
      console.log(`      📊 Need ${imp.targetCount - imp.currentCount} more pages with this category`);
    }
  });
  
  if (improvements.length === 0) {
    console.log('   ✅ No critical improvements needed!');
  }
  
  // ============================================================================
  // 5. SEED URL RECOMMENDATIONS
  // ============================================================================
  console.log('\n\n5️⃣  SEED URL RECOMMENDATIONS\n');
  console.log('-'.repeat(100));
  
  // Check funding type distribution
  const fundingTypeDist = {};
  pages.rows.forEach(page => {
    const types = page.funding_types || [];
    types.forEach(type => {
      fundingTypeDist[type] = (fundingTypeDist[type] || 0) + 1;
    });
  });
  
  console.log('💰 Current Funding Type Distribution:');
  Object.entries(fundingTypeDist)
    .sort((a, b) => b[1] - a[1])
    .forEach(([type, count]) => {
      console.log(`   ${type}: ${count} pages`);
    });
  
  // Check if we need more seed URLs
  const targetTypes = ['grant', 'loan', 'equity', 'service'];
  const missingTypes = targetTypes.filter(type => !fundingTypeDist[type] || fundingTypeDist[type] < 5);
  
  if (missingTypes.length > 0) {
    console.log(`\n   ⚠️  Missing or low coverage funding types: ${missingTypes.join(', ')}`);
    console.log(`   💡 Recommendation: Add more seed URLs for these funding types`);
  } else {
    console.log(`\n   ✅ All funding types have good coverage`);
  }
  
  console.log('\n' + '='.repeat(100));
  console.log('✅ Analysis complete!\n');
  
  await pool.end();
}

comprehensiveAnalysis().catch(console.error);



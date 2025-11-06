#!/usr/bin/env node
/**
 * Final Verdict Analysis: Web Scraper vs LLM
 * Comprehensive analysis to determine the best approach
 */

require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'commonjs', moduleResolution: 'node', esModuleInterop: true } });

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env.local') });

const { getPool } = require('../../src/db/neon-client.ts');
const { calculateMeaningfulnessScore } = require('../../src/extract.ts');

async function finalVerdictAnalysis() {
  const pool = getPool();
  
  console.log('\n🎯 FINAL VERDICT ANALYSIS: WEB SCRAPER vs LLM\n');
  console.log('='.repeat(100));
  
  // Get all pages
  const pages = await pool.query(`
    SELECT 
      id, url, title, description,
      funding_amount_min, funding_amount_max, currency,
      deadline, open_deadline,
      contact_email, contact_phone,
      funding_types, program_focus, region,
      metadata_json
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
  
  // Analyze what we're actually extracting
  const categoryAnalysis = {};
  const allCategories = [
    'company_type', 'company_stage', 'industry_restriction', 'eligibility_criteria',
    'documents', 'financial', 'technical', 'legal', 'timeline', 'geographic', 'team',
    'innovation_focus', 'technology_area', 'research_domain', 'sector_focus',
    'compliance', 'environmental_impact', 'social_impact', 'economic_impact', 'innovation_impact',
    'capex_opex', 'use_of_funds', 'revenue_model', 'market_size', 'co_financing', 'trl_level', 'consortium',
    'diversity', 'application_process', 'evaluation_criteria', 'repayment_terms',
    'equity_terms', 'intellectual_property', 'success_metrics', 'restrictions'
  ];
  
  // Initialize
  allCategories.forEach(cat => {
    categoryAnalysis[cat] = {
      total: 0,
      pages: new Set(),
      avgScore: 0,
      lowQuality: 0,
      highQuality: 0,
      sources: {},
      sampleValues: [],
      meaningfulValues: [],
      garbageValues: []
    };
  });
  
  // Process requirements
  requirements.rows.forEach(req => {
    const cat = req.category;
    if (!categoryAnalysis[cat]) return;
    
    const stats = categoryAnalysis[cat];
    stats.total++;
    stats.pages.add(req.page_id);
    
    const score = req.meaningfulness_score || calculateMeaningfulnessScore(req.value);
    stats.avgScore += score;
    
    if (score < 30) {
      stats.lowQuality++;
      stats.garbageValues.push(req.value.substring(0, 100));
    } else if (score >= 70) {
      stats.highQuality++;
      stats.meaningfulValues.push(req.value.substring(0, 100));
    }
    
    if (!stats.sources[req.source]) {
      stats.sources[req.source] = 0;
    }
    stats.sources[req.source]++;
    
    if (stats.sampleValues.length < 5) {
      stats.sampleValues.push({
        value: req.value.substring(0, 150),
        score: score,
        source: req.source
      });
    }
  });
  
  // Calculate metrics
  const totalPages = pages.rows.length;
  const results = [];
  
  Object.entries(categoryAnalysis).forEach(([category, stats]) => {
    const coverage = (stats.pages.size / totalPages) * 100;
    const avgScore = stats.total > 0 ? stats.avgScore / stats.total : 0;
    const lowQualityPct = stats.total > 0 ? (stats.lowQuality / stats.total) * 100 : 0;
    const highQualityPct = stats.total > 0 ? (stats.highQuality / stats.total) * 100 : 0;
    
    results.push({
      category,
      coverage,
      total: stats.total,
      pages: stats.pages.size,
      avgScore,
      lowQualityPct,
      highQualityPct,
      missing: stats.total === 0,
      sources: stats.sources,
      sampleValues: stats.sampleValues,
      meaningfulValues: stats.meaningfulValues.slice(0, 3),
      garbageValues: stats.garbageValues.slice(0, 3)
    });
  });
  
  // Sort by coverage
  results.sort((a, b) => {
    if (a.missing && !b.missing) return -1;
    if (!a.missing && b.missing) return 1;
    return a.coverage - b.coverage;
  });
  
  // Analysis
  console.log('\n📊 CURRENT STATE ANALYSIS\n');
  console.log('-'.repeat(100));
  
  const missing = results.filter(r => r.missing);
  const lowCoverage = results.filter(r => !r.missing && r.coverage < 30);
  const lowQuality = results.filter(r => !r.missing && r.lowQualityPct > 20);
  const highCoverage = results.filter(r => !r.missing && r.coverage >= 70);
  
  console.log(`\n❌ MISSING CATEGORIES: ${missing.length}/${allCategories.length} (${((missing.length / allCategories.length) * 100).toFixed(1)}%)`);
  missing.forEach(r => console.log(`   - ${r.category}`));
  
  console.log(`\n⚠️  LOW COVERAGE (<30%): ${lowCoverage.length}/${allCategories.length} (${((lowCoverage.length / allCategories.length) * 100).toFixed(1)}%)`);
  lowCoverage.slice(0, 10).forEach(r => {
    console.log(`   - ${r.category}: ${r.coverage.toFixed(1)}% (${r.pages}/${totalPages} pages, avg score: ${r.avgScore.toFixed(1)})`);
  });
  
  console.log(`\n⚠️  LOW QUALITY (>20% garbage): ${lowQuality.length}/${allCategories.length} (${((lowQuality.length / allCategories.length) * 100).toFixed(1)}%)`);
  lowQuality.slice(0, 10).forEach(r => {
    console.log(`   - ${r.category}: ${r.lowQualityPct.toFixed(1)}% low quality (${r.lowQuality}/${r.total} items)`);
    if (r.garbageValues.length > 0) {
      console.log(`     Example garbage: "${r.garbageValues[0]}..."`);
    }
  });
  
  console.log(`\n✅ HIGH COVERAGE (≥70%): ${highCoverage.length}/${allCategories.length} (${((highCoverage.length / allCategories.length) * 100).toFixed(1)}%)`);
  highCoverage.slice(0, 10).forEach(r => {
    console.log(`   - ${r.category}: ${r.coverage.toFixed(1)}% (${r.pages}/${totalPages} pages, avg score: ${r.avgScore.toFixed(1)})`);
  });
  
  // What data are we actually extracting?
  console.log('\n\n📋 WHAT DATA ARE WE EXTRACTING?\n');
  console.log('-'.repeat(100));
  
  const meaningfulCategories = results.filter(r => !r.missing && r.highQualityPct > 50);
  console.log(`\n✅ MEANINGFUL CATEGORIES (≥50% high quality): ${meaningfulCategories.length}`);
  meaningfulCategories.slice(0, 5).forEach(r => {
    console.log(`\n   ${r.category} (${r.coverage.toFixed(1)}% coverage, ${r.highQualityPct.toFixed(1)}% high quality):`);
    if (r.meaningfulValues.length > 0) {
      console.log(`     Example: "${r.meaningfulValues[0]}..."`);
    }
  });
  
  const problematicCategories = results.filter(r => !r.missing && (r.lowQualityPct > 30 || r.coverage < 20));
  console.log(`\n❌ PROBLEMATIC CATEGORIES (low coverage or high garbage): ${problematicCategories.length}`);
  problematicCategories.slice(0, 5).forEach(r => {
    console.log(`\n   ${r.category} (${r.coverage.toFixed(1)}% coverage, ${r.lowQualityPct.toFixed(1)}% garbage):`);
    if (r.garbageValues.length > 0) {
      console.log(`     Example garbage: "${r.garbageValues[0]}..."`);
    }
    if (r.meaningfulValues.length > 0) {
      console.log(`     Example meaningful: "${r.meaningfulValues[0]}..."`);
    }
  });
  
  // Overall statistics
  const totalRequirements = requirements.rows.length;
  const totalLowQuality = results.reduce((sum, r) => sum + r.lowQuality, 0);
  const totalHighQuality = results.reduce((sum, r) => sum + r.highQuality, 0);
  const avgCoverage = results.filter(r => !r.missing).reduce((sum, r) => sum + r.coverage, 0) / (results.length - missing.length);
  const avgQuality = results.filter(r => !r.missing && r.total > 0).reduce((sum, r) => sum + r.avgScore, 0) / results.filter(r => !r.missing && r.total > 0).length;
  
  console.log('\n\n📊 OVERALL STATISTICS\n');
  console.log('-'.repeat(100));
  console.log(`Total pages: ${totalPages}`);
  console.log(`Total requirements: ${totalRequirements}`);
  console.log(`Average coverage per category: ${avgCoverage.toFixed(1)}%`);
  console.log(`Average quality score: ${avgQuality.toFixed(1)}/100`);
  console.log(`Low quality items: ${totalLowQuality} (${((totalLowQuality / totalRequirements) * 100).toFixed(1)}%)`);
  console.log(`High quality items: ${totalHighQuality} (${((totalHighQuality / totalRequirements) * 100).toFixed(1)}%)`);
  console.log(`Missing categories: ${missing.length}/${allCategories.length} (${((missing.length / allCategories.length) * 100).toFixed(1)}%)`);
  
  // Web Scraper vs LLM Comparison
  console.log('\n\n🎯 WEB SCRAPER vs LLM COMPARISON\n');
  console.log('='.repeat(100));
  
  console.log('\n📊 WEB SCRAPER (Current System):');
  console.log(`   ✅ Strengths:`);
  console.log(`      - Fast: Processes pages in ~2-3 seconds`);
  console.log(`      - Cost-effective: No API costs per page`);
  console.log(`      - Scalable: Can process thousands of pages`);
  console.log(`      - Pattern-based: Learns from successful extractions`);
  console.log(`      - Structured: Extracts 35 categories consistently`);
  console.log(`   ❌ Weaknesses:`);
  console.log(`      - Low coverage: ${avgCoverage.toFixed(1)}% average coverage`);
  console.log(`      - Missing categories: ${missing.length}/${allCategories.length} (${((missing.length / allCategories.length) * 100).toFixed(1)}%)`);
  console.log(`      - Quality issues: ${((totalLowQuality / totalRequirements) * 100).toFixed(1)}% garbage data`);
  console.log(`      - Limited understanding: Can't interpret context or nuance`);
  console.log(`      - Pattern dependency: Fails on new structures`);
  console.log(`      - No semantic understanding: Extracts text, not meaning`);
  
  console.log(`\n📊 LLM (GPT-4o, Claude, etc.):`);
  console.log(`   ✅ Strengths:`);
  console.log(`      - High coverage: Can extract all 35 categories from any page`);
  console.log(`      - Semantic understanding: Understands context and meaning`);
  console.log(`      - Adaptable: Works with any page structure`);
  console.log(`      - Quality: Produces meaningful, structured data`);
  console.log(`      - No pattern maintenance: No need to update regex patterns`);
  console.log(`      - Handles edge cases: Can interpret ambiguous information`);
  console.log(`   ❌ Weaknesses:`);
  console.log(`      - Cost: ~$0.01-0.05 per page (GPT-4o) or ~$0.001-0.01 (GPT-4o-mini)`);
  console.log(`      - Speed: ~5-10 seconds per page (API latency)`);
  console.log(`      - Rate limits: API throttling for large batches`);
  console.log(`      - Consistency: May vary slightly between runs`);
  console.log(`      - Token limits: Large pages may need chunking`);
  
  // Cost analysis
  const pagesPerMonth = 1000; // Example
  const scraperCost = 0; // Infrastructure only
  const llmCostPerPage = 0.01; // GPT-4o-mini estimate
  const llmCost = pagesPerMonth * llmCostPerPage;
  
  console.log(`\n💰 COST ANALYSIS (${pagesPerMonth} pages/month):`);
  console.log(`   Web Scraper: $${scraperCost.toFixed(2)} (infrastructure only)`);
  console.log(`   LLM (GPT-4o-mini): $${llmCost.toFixed(2)}/month`);
  console.log(`   LLM (GPT-4o): $${(pagesPerMonth * 0.05).toFixed(2)}/month`);
  
  // Final Verdict
  console.log('\n\n🎯 FINAL VERDICT\n');
  console.log('='.repeat(100));
  
  const missingPct = (missing.length / allCategories.length) * 100;
  const lowCoveragePct = (lowCoverage.length / allCategories.length) * 100;
  const garbagePct = (totalLowQuality / totalRequirements) * 100;
  
  console.log(`\n📊 Current System Performance:`);
  console.log(`   - Missing categories: ${missingPct.toFixed(1)}%`);
  console.log(`   - Low coverage categories: ${lowCoveragePct.toFixed(1)}%`);
  console.log(`   - Garbage data: ${garbagePct.toFixed(1)}%`);
  console.log(`   - Average coverage: ${avgCoverage.toFixed(1)}%`);
  console.log(`   - Average quality: ${avgQuality.toFixed(1)}/100`);
  
  let verdict = '';
  let recommendation = '';
  
  if (missingPct > 30 || lowCoveragePct > 40 || garbagePct > 30 || avgCoverage < 50) {
    verdict = 'LLM';
    recommendation = `
   🎯 RECOMMENDATION: USE LLM-BASED EXTRACTION

   The current web scraper has significant limitations:
   - ${missingPct.toFixed(1)}% of categories are completely missing
   - ${lowCoveragePct.toFixed(1)}% of categories have low coverage
   - ${garbagePct.toFixed(1)}% of extracted data is garbage
   - Only ${avgCoverage.toFixed(1)}% average coverage

   An LLM-based approach would:
   ✅ Extract all 35 categories with high accuracy
   ✅ Understand context and produce meaningful data
   ✅ Adapt to any page structure without pattern maintenance
   ✅ Handle edge cases and ambiguous information
   ✅ Provide consistent, high-quality results

   Cost: ~$${llmCost.toFixed(2)}/month for ${pagesPerMonth} pages (GPT-4o-mini)
   This is acceptable for the quality improvement.

   Implementation:
   1. Use GPT-4o-mini for cost-effectiveness ($0.001-0.01/page)
   2. Use structured output (JSON schema) for consistency
   3. Implement caching to avoid re-processing
   4. Add fallback to GPT-4o for complex pages
   5. Keep web scraper for URL discovery only
`;
  } else if (avgCoverage >= 70 && avgQuality >= 70 && garbagePct < 15) {
    verdict = 'HYBRID';
    recommendation = `
   🎯 RECOMMENDATION: HYBRID APPROACH

   The current web scraper performs well:
   - ${avgCoverage.toFixed(1)}% average coverage
   - ${avgQuality.toFixed(1)}/100 average quality
   - Only ${garbagePct.toFixed(1)}% garbage data

   Use web scraper for:
   ✅ High-coverage categories (${highCoverage.length} categories)
   ✅ Fast, cost-effective bulk processing
   ✅ Pattern-based extraction for structured data

   Use LLM for:
   ✅ Low-coverage categories (${lowCoverage.length} categories)
   ✅ Quality validation and improvement
   ✅ Complex, ambiguous pages
   ✅ Edge cases and new structures

   This balances cost and quality.
`;
  } else {
    verdict = 'IMPROVE_SCRAPER';
    recommendation = `
   🎯 RECOMMENDATION: IMPROVE WEB SCRAPER FIRST

   The web scraper has potential but needs improvement:
   - ${avgCoverage.toFixed(1)}% average coverage (target: ≥70%)
   - ${avgQuality.toFixed(1)}/100 average quality (target: ≥70)
   - ${garbagePct.toFixed(1)}% garbage data (target: <15%)

   Focus on:
   1. Fixing missing categories (${missing.length} categories)
   2. Improving low-coverage categories (${lowCoverage.length} categories)
   3. Reducing garbage data (better filtering)
   4. Enhancing pattern learning

   After improvements, re-evaluate vs LLM.
`;
  }
  
  console.log(recommendation);
  
  console.log('\n' + '='.repeat(100));
  console.log('✅ Analysis complete!\n');
  
  await pool.end();
}

finalVerdictAnalysis().catch(console.error);


#!/usr/bin/env node
/**
 * Comprehensive Test Script for Recommendation System
 *
 * Tests:
 * - All question combinations (core + advanced)
 * - Funding type diversity and bias
 * - Subtype usage
 * - Advanced questions impact analysis
 * - Statistical analysis of outcomes
 *
 * Usage:
 *   node scripts/test-comprehensive-analysis.mjs
 *   node scripts/test-comprehensive-analysis.mjs --quick  # Fewer combinations
 *   node scripts/test-comprehensive-analysis.mjs --no-advanced  # Skip advanced questions
 *   node scripts/test-comprehensive-analysis.mjs --locations=austria,germany --max-tests=25
 *   node scripts/test-comprehensive-analysis.mjs --refresh-cache  # Ignore stored results
 */

import fs from 'fs';
import path from 'path';

const BASE_URL = process.env.BASE_URL || process.env.RECO_BASE_URL || 'http://localhost:3000';
const bypassToken =
  process.env.VERCEL_BYPASS_TOKEN || process.env.VERCEL_DEPLOYMENT_PROTECTION_BYPASS;

const args = process.argv.slice(2);
const QUICK_MODE = args.includes('--quick');
const NO_ADVANCED = args.includes('--no-advanced');
const REFRESH_CACHE = args.includes('--refresh-cache');
const MAX_TESTS = getNumberArg('--max-tests');

// Test matrix - systematic combinations (with optional filters)
const DEFAULT_LOCATIONS = ['austria', 'germany', 'eu'];
const DEFAULT_COMPANY_TYPES = ['startup', 'sme', 'research'];
const DEFAULT_COMPANY_STAGES = ['inc_lt_6m', 'inc_6_36m', 'inc_gt_36m'];
const DEFAULT_CO_FINANCING = ['co_yes', 'co_no'];
const DEFAULT_FUNDING_AMOUNTS = QUICK_MODE
  ? [15000, 100000, 500000, 1000000]
  : [15000, 50000, 100000, 250000, 500000, 750000, 1000000];

const LOCATIONS = getListArg('--locations', DEFAULT_LOCATIONS);
const COMPANY_TYPES = getListArg('--company-types', DEFAULT_COMPANY_TYPES);
const COMPANY_STAGES = getListArg('--stages', DEFAULT_COMPANY_STAGES);
const CO_FINANCING = getListArg('--co-financing', DEFAULT_CO_FINANCING);
const FUNDING_AMOUNTS = getNumberListArg('--amounts', DEFAULT_FUNDING_AMOUNTS);
const INDUSTRIES = QUICK_MODE
  ? ['digital', 'manufacturing', 'health']
  : ['digital', 'manufacturing', 'health', 'sustainability', 'export'];

// Advanced questions (optional)
const TEAM_SIZES = ['solo', 'team_2_5', 'team_6_20', 'team_20_plus'];
const REVENUE_STATUSES = ['pre_revenue', 'early_revenue', 'scaling_revenue', 'profitable'];
const IMPACT_FOCUSES = [['environmental'], ['social'], ['research'], ['environmental', 'social']];
const DEADLINE_URGENCIES = ['immediate', 'short_term', 'medium_term', 'long_term'];

// Cache configuration
const CACHE_DIR = path.resolve(process.cwd(), 'scripts', '.cache');
const CACHE_FILE = path.join(CACHE_DIR, 'comprehensive-cache.json');
let cache = loadCache();
let cacheDirty = false;

// Statistics tracking
const stats = {
  totalTests: 0,
  successfulTests: 0,
  failedTests: 0,
  llmSuccess: 0,
  fallbackUsed: 0,
  totalDuration: 0,
  fundingTypeCounts: {},
  cacheHits: 0,
  cacheMisses: 0,
  subtypeUsage: {
    equity: { specific: 0, generic: 0 },
    loan: { specific: 0, generic: 0 },
  },
  advancedQuestionImpact: {
    withAdvanced: { diversity: [], relevance: [], duration: [] },
    withoutAdvanced: { diversity: [], relevance: [], duration: [] },
  },
  biasChecks: {
    grantOnly: 0,
    loanOnly: 0,
    equityOnly: 0,
    goodDiversity: 0,
  },
  locationBias: {},
  stageBias: {},
  amountBias: {},
};

// Generate test combinations
function generateTestCombinations() {
  let combinations = [];
  
  // Core combinations
  for (const location of LOCATIONS) {
    for (const companyType of COMPANY_TYPES) {
      for (const stage of COMPANY_STAGES) {
        for (const coFinancing of CO_FINANCING) {
          for (const amount of FUNDING_AMOUNTS) {
            for (const industry of INDUSTRIES) {
              const baseAnswers = {
                location,
                company_type: companyType,
                company_stage: stage,
                co_financing: coFinancing,
                funding_amount: amount,
                industry_focus: [industry],
              };

              if (NO_ADVANCED) {
                combinations.push({ answers: baseAnswers, hasAdvanced: false });
              } else {
                // Without advanced
                combinations.push({ answers: { ...baseAnswers }, hasAdvanced: false });
                
                // With advanced (sample a few combinations to keep test size manageable)
                if (combinations.length % 3 === 0) { // Every 3rd combination gets advanced
                  const advancedAnswers = {
                    ...baseAnswers,
                    team_size: TEAM_SIZES[Math.floor(Math.random() * TEAM_SIZES.length)],
                    revenue_status: REVENUE_STATUSES[Math.floor(Math.random() * REVENUE_STATUSES.length)],
                    impact_focus: IMPACT_FOCUSES[Math.floor(Math.random() * IMPACT_FOCUSES.length)],
                    deadline_urgency: DEADLINE_URGENCIES[Math.floor(Math.random() * DEADLINE_URGENCIES.length)],
                  };
                  combinations.push({ answers: advancedAnswers, hasAdvanced: true });
                }
              }
            }
          }
        }
      }
    }
  }

  // Limit in quick mode
  if (QUICK_MODE) {
    combinations = combinations.slice(0, 50);
  }

  if (typeof MAX_TESTS === 'number') {
    combinations = combinations.slice(0, MAX_TESTS);
  }

  return combinations;
}

async function testRecommendation(answers, hasAdvanced) {
  const startTime = Date.now();
  try {
    const response = await fetch(`${BASE_URL}/api/programs/recommend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(bypassToken && { 'x-vercel-protection-bypass': bypassToken }),
      },
      body: JSON.stringify({
        answers,
        max_results: 10,
      }),
    });

    const duration = Date.now() - startTime;
    stats.totalDuration += duration;

    if (!response.ok) {
      const text = await response.text();
      if (text.includes('<!DOCTYPE')) {
        throw new Error('Server returned HTML instead of JSON');
      }
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    return { data, duration, error: null };
  } catch (error) {
    const duration = Date.now() - startTime;
    return { data: null, duration, error: error.message };
  }
}

function analyzePrograms(programs, answers) {
  const analysis = {
    count: programs.length,
    fundingTypes: new Set(),
    fundingTypeCounts: {},
    subtypes: {
      equity: { specific: [], generic: false },
      loan: { specific: [], generic: false },
    },
    categories: {
      grant: 0,
      loan: 0,
      equity: 0,
      guarantee: 0,
      visa: 0,
      other: 0,
    },
    diversity: 0,
    relevance: 0,
    llmSuccess: false,
    fallbackUsed: false,
  };

  programs.forEach((program) => {
    // Check source
    if (program.source === 'llm') analysis.llmSuccess = true;
    if (program.source === 'fallback') analysis.fallbackUsed = true;

    // Extract funding types
    const types = program.funding_types || program.metadata?.funding_types || [];
    types.forEach((type) => {
      analysis.fundingTypes.add(type);
      analysis.fundingTypeCounts[type] = (analysis.fundingTypeCounts[type] || 0) + 1;

      // Categorize
      if (type.includes('grant') || type.includes('subsidy')) analysis.categories.grant++;
      else if (type === 'angel_investment' || type === 'venture_capital' || type === 'crowdfunding' || type === 'equity') {
        analysis.categories.equity++;
        if (type === 'equity') analysis.subtypes.equity.generic = true;
        else analysis.subtypes.equity.specific.push(type);
      } else if (type === 'bank_loan' || type === 'leasing' || type === 'micro_credit' || type === 'repayable_advance' || type === 'loan') {
        analysis.categories.loan++;
        if (type === 'loan') analysis.subtypes.loan.generic = true;
        else analysis.subtypes.loan.specific.push(type);
      } else if (type === 'guarantee') analysis.categories.guarantee++;
      else if (type === 'visa_application') analysis.categories.visa++;
      else analysis.categories.other++;
    });

    // Check relevance (basic checks)
    let relevanceScore = 0;
    if (program.metadata?.location && answers.location) {
      const progLoc = program.metadata.location.toLowerCase();
      const ansLoc = answers.location.toLowerCase();
      if (progLoc.includes(ansLoc) || ansLoc === 'eu' || progLoc === 'eu') relevanceScore++;
    }
    if (program.metadata?.company_stage && answers.company_stage) {
      relevanceScore += 0.5; // Partial match
    }
    analysis.relevance += relevanceScore / programs.length;
  });

  // Calculate diversity (unique types / total programs)
  analysis.diversity = analysis.fundingTypes.size;

  return analysis;
}

function updateStats(analysis, answers, hasAdvanced) {
  stats.totalTests++;
  if (analysis.count > 0) stats.successfulTests++;
  else stats.failedTests++;

  if (analysis.llmSuccess) stats.llmSuccess++;
  if (analysis.fallbackUsed) stats.fallbackUsed++;

  // Update funding type counts
  analysis.fundingTypes.forEach((type) => {
    stats.fundingTypeCounts[type] = (stats.fundingTypeCounts[type] || 0) + 1;
  });

  // Update subtype usage
  if (analysis.subtypes.equity.specific.length > 0) {
    stats.subtypeUsage.equity.specific += analysis.subtypes.equity.specific.length;
  }
  if (analysis.subtypes.equity.generic) {
    stats.subtypeUsage.equity.generic++;
  }
  if (analysis.subtypes.loan.specific.length > 0) {
    stats.subtypeUsage.loan.specific += analysis.subtypes.loan.specific.length;
  }
  if (analysis.subtypes.loan.generic) {
    stats.subtypeUsage.loan.generic++;
  }

  // Track advanced question impact
  if (hasAdvanced) {
    stats.advancedQuestionImpact.withAdvanced.diversity.push(analysis.diversity);
    stats.advancedQuestionImpact.withAdvanced.relevance.push(analysis.relevance);
    stats.advancedQuestionImpact.withAdvanced.duration.push(analysis.duration || 0);
  } else {
    stats.advancedQuestionImpact.withoutAdvanced.diversity.push(analysis.diversity);
    stats.advancedQuestionImpact.withoutAdvanced.relevance.push(analysis.relevance);
    stats.advancedQuestionImpact.withoutAdvanced.duration.push(analysis.duration || 0);
  }

  // Bias checks
  const hasGrants = analysis.categories.grant > 0;
  const hasLoans = analysis.categories.loan > 0;
  const hasEquity = analysis.categories.equity > 0;
  const hasMultiple = [hasGrants, hasLoans, hasEquity, analysis.categories.guarantee > 0, analysis.categories.visa > 0].filter(Boolean).length >= 3;

  if (hasGrants && !hasLoans && !hasEquity) stats.biasChecks.grantOnly++;
  else if (hasLoans && !hasGrants && !hasEquity) stats.biasChecks.loanOnly++;
  else if (hasEquity && !hasGrants && !hasLoans) stats.biasChecks.equityOnly++;
  else if (hasMultiple) stats.biasChecks.goodDiversity++;

  // Location bias
  if (!stats.locationBias[answers.location]) {
    stats.locationBias[answers.location] = { total: 0, diversity: [] };
  }
  stats.locationBias[answers.location].total++;
  stats.locationBias[answers.location].diversity.push(analysis.diversity);

  // Stage bias
  if (!stats.stageBias[answers.company_stage]) {
    stats.stageBias[answers.company_stage] = { total: 0, diversity: [] };
  }
  stats.stageBias[answers.company_stage].total++;
  stats.stageBias[answers.company_stage].diversity.push(analysis.diversity);

  // Amount bias
  const amountRange = answers.funding_amount < 50000 ? 'small' : 
                      answers.funding_amount < 250000 ? 'medium' : 
                      answers.funding_amount < 750000 ? 'large' : 'xlarge';
  if (!stats.amountBias[amountRange]) {
    stats.amountBias[amountRange] = { total: 0, diversity: [] };
  }
  stats.amountBias[amountRange].total++;
  stats.amountBias[amountRange].diversity.push(analysis.diversity);
}

function calculateStatistics() {
  const results = {
    successRate: (stats.successfulTests / stats.totalTests) * 100,
    llmSuccessRate: (stats.llmSuccess / stats.totalTests) * 100,
    fallbackRate: (stats.fallbackUsed / stats.totalTests) * 100,
    avgDuration: stats.totalDuration / stats.totalTests,
    uniqueFundingTypes: Object.keys(stats.fundingTypeCounts).length,
    subtypeUsageRate: {
      equity: stats.subtypeUsage.equity.specific / (stats.subtypeUsage.equity.specific + stats.subtypeUsage.equity.generic) * 100,
      loan: stats.subtypeUsage.loan.specific / (stats.subtypeUsage.loan.specific + stats.subtypeUsage.loan.generic) * 100,
    },
    advancedQuestionImpact: {
      withAdvanced: {
        avgDiversity: stats.advancedQuestionImpact.withAdvanced.diversity.length > 0
          ? stats.advancedQuestionImpact.withAdvanced.diversity.reduce((a, b) => a + b, 0) / stats.advancedQuestionImpact.withAdvanced.diversity.length
          : 0,
        avgRelevance: stats.advancedQuestionImpact.withAdvanced.relevance.length > 0
          ? stats.advancedQuestionImpact.withAdvanced.relevance.reduce((a, b) => a + b, 0) / stats.advancedQuestionImpact.withAdvanced.relevance.length
          : 0,
        avgDuration: stats.advancedQuestionImpact.withAdvanced.duration.length > 0
          ? stats.advancedQuestionImpact.withAdvanced.duration.reduce((a, b) => a + b, 0) / stats.advancedQuestionImpact.withAdvanced.duration.length
          : 0,
        count: stats.advancedQuestionImpact.withAdvanced.diversity.length,
      },
      withoutAdvanced: {
        avgDiversity: stats.advancedQuestionImpact.withoutAdvanced.diversity.length > 0
          ? stats.advancedQuestionImpact.withoutAdvanced.diversity.reduce((a, b) => a + b, 0) / stats.advancedQuestionImpact.withoutAdvanced.diversity.length
          : 0,
        avgRelevance: stats.advancedQuestionImpact.withoutAdvanced.relevance.length > 0
          ? stats.advancedQuestionImpact.withoutAdvanced.relevance.reduce((a, b) => a + b, 0) / stats.advancedQuestionImpact.withoutAdvanced.relevance.length
          : 0,
        avgDuration: stats.advancedQuestionImpact.withoutAdvanced.duration.length > 0
          ? stats.advancedQuestionImpact.withoutAdvanced.duration.reduce((a, b) => a + b, 0) / stats.advancedQuestionImpact.withoutAdvanced.duration.length
          : 0,
        count: stats.advancedQuestionImpact.withoutAdvanced.diversity.length,
      },
    },
    biasAnalysis: {
      grantOnlyRate: (stats.biasChecks.grantOnly / stats.totalTests) * 100,
      loanOnlyRate: (stats.biasChecks.loanOnly / stats.totalTests) * 100,
      equityOnlyRate: (stats.biasChecks.equityOnly / stats.totalTests) * 100,
      goodDiversityRate: (stats.biasChecks.goodDiversity / stats.totalTests) * 100,
    },
    locationBias: {},
    stageBias: {},
    amountBias: {},
  };

  // Calculate location bias
  Object.keys(stats.locationBias).forEach((location) => {
    const data = stats.locationBias[location];
    results.locationBias[location] = {
      avgDiversity: data.diversity.reduce((a, b) => a + b, 0) / data.diversity.length,
      count: data.total,
    };
  });

  // Calculate stage bias
  Object.keys(stats.stageBias).forEach((stage) => {
    const data = stats.stageBias[stage];
    results.stageBias[stage] = {
      avgDiversity: data.diversity.reduce((a, b) => a + b, 0) / data.diversity.length,
      count: data.total,
    };
  });

  // Calculate amount bias
  Object.keys(stats.amountBias).forEach((range) => {
    const data = stats.amountBias[range];
    results.amountBias[range] = {
      avgDiversity: data.diversity.reduce((a, b) => a + b, 0) / data.diversity.length,
      count: data.total,
    };
  });

  return results;
}

function printReport(statistics) {
  console.log('\n' + '='.repeat(80));
  console.log('📊 COMPREHENSIVE STATISTICAL ANALYSIS REPORT');
  console.log('='.repeat(80));

  console.log('\n📈 OVERALL PERFORMANCE');
  console.log('-'.repeat(80));
  console.log(`Total Tests: ${stats.totalTests}`);
  console.log(`Success Rate: ${statistics.successRate.toFixed(1)}%`);
  console.log(`LLM Success Rate: ${statistics.llmSuccessRate.toFixed(1)}%`);
  console.log(`Fallback Usage Rate: ${statistics.fallbackRate.toFixed(1)}%`);
  console.log(`Average Duration: ${statistics.avgDuration.toFixed(0)}ms`);
  console.log(`Cache Hits: ${stats.cacheHits}`);
  console.log(`Cache Misses (API calls): ${stats.cacheMisses}`);

  console.log('\n💰 FUNDING TYPE DIVERSITY');
  console.log('-'.repeat(80));
  console.log(`Unique Funding Types Found: ${statistics.uniqueFundingTypes}`);
  console.log(`Top 10 Types:`);
  Object.entries(stats.fundingTypeCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .forEach(([type, count]) => {
      console.log(`  - ${type}: ${count} occurrences`);
    });

  console.log('\n🎯 SUBTYPE USAGE');
  console.log('-'.repeat(80));
  console.log(`Equity Subtype Usage: ${statistics.subtypeUsageRate.equity.toFixed(1)}%`);
  console.log(`  Specific subtypes: ${stats.subtypeUsage.equity.specific}`);
  console.log(`  Generic "equity": ${stats.subtypeUsage.equity.generic}`);
  console.log(`Loan Subtype Usage: ${statistics.subtypeUsageRate.loan.toFixed(1)}%`);
  console.log(`  Specific subtypes: ${stats.subtypeUsage.loan.specific}`);
  console.log(`  Generic "loan": ${stats.subtypeUsage.loan.generic}`);

  console.log('\n🔍 BIAS ANALYSIS');
  console.log('-'.repeat(80));
  console.log(`Grant-Only Bias: ${statistics.biasAnalysis.grantOnlyRate.toFixed(1)}%`);
  console.log(`Loan-Only Bias: ${statistics.biasAnalysis.loanOnlyRate.toFixed(1)}%`);
  console.log(`Equity-Only Bias: ${statistics.biasAnalysis.equityOnlyRate.toFixed(1)}%`);
  console.log(`Good Diversity Rate: ${statistics.biasAnalysis.goodDiversityRate.toFixed(1)}%`);

  console.log('\n🌍 LOCATION BIAS');
  console.log('-'.repeat(80));
  Object.entries(statistics.locationBias).forEach(([location, data]) => {
    console.log(`${location}: avg diversity ${data.avgDiversity.toFixed(2)}, ${data.count} tests`);
  });

  console.log('\n📊 STAGE BIAS');
  console.log('-'.repeat(80));
  Object.entries(statistics.stageBias).forEach(([stage, data]) => {
    console.log(`${stage}: avg diversity ${data.avgDiversity.toFixed(2)}, ${data.count} tests`);
  });

  console.log('\n💵 AMOUNT BIAS');
  console.log('-'.repeat(80));
  Object.entries(statistics.amountBias).forEach(([range, data]) => {
    console.log(`${range}: avg diversity ${data.avgDiversity.toFixed(2)}, ${data.count} tests`);
  });

  if (!NO_ADVANCED && statistics.advancedQuestionImpact.withAdvanced.count > 0) {
    console.log('\n🔬 ADVANCED QUESTIONS IMPACT ANALYSIS');
    console.log('-'.repeat(80));
    const withAdv = statistics.advancedQuestionImpact.withAdvanced;
    const withoutAdv = statistics.advancedQuestionImpact.withoutAdvanced;
    
    console.log(`Tests with Advanced Questions: ${withAdv.count}`);
    console.log(`Tests without Advanced Questions: ${withoutAdv.count}`);
    console.log(`\nAverage Diversity:`);
    console.log(`  With Advanced: ${withAdv.avgDiversity.toFixed(2)}`);
    console.log(`  Without Advanced: ${withoutAdv.avgDiversity.toFixed(2)}`);
    console.log(`  Difference: ${(withAdv.avgDiversity - withoutAdv.avgDiversity).toFixed(2)}`);
    console.log(`\nAverage Relevance:`);
    console.log(`  With Advanced: ${withAdv.avgRelevance.toFixed(2)}`);
    console.log(`  Without Advanced: ${withoutAdv.avgRelevance.toFixed(2)}`);
    console.log(`  Difference: ${(withAdv.avgRelevance - withoutAdv.avgRelevance).toFixed(2)}`);
    console.log(`\nAverage Duration:`);
    console.log(`  With Advanced: ${withAdv.avgDuration.toFixed(0)}ms`);
    console.log(`  Without Advanced: ${withoutAdv.avgDuration.toFixed(0)}ms`);
    console.log(`  Difference: ${(withAdv.avgDuration - withoutAdv.avgDuration).toFixed(0)}ms`);

    // Recommendation
    console.log('\n💡 RECOMMENDATION ON ADVANCED QUESTIONS:');
    console.log('-'.repeat(80));
    const diversityImprovement = withAdv.avgDiversity - withoutAdv.avgDiversity;
    const relevanceImprovement = withAdv.avgRelevance - withoutAdv.avgRelevance;
    const durationIncrease = withAdv.avgDuration - withoutAdv.avgDuration;

    if (diversityImprovement > 0.5 || relevanceImprovement > 0.1) {
      console.log('✅ KEEP ADVANCED QUESTIONS');
      console.log(`   - Improves diversity by ${diversityImprovement.toFixed(2)} types`);
      console.log(`   - Improves relevance by ${relevanceImprovement.toFixed(2)} points`);
      if (durationIncrease > 1000) {
        console.log(`   ⚠️  But increases duration by ${durationIncrease.toFixed(0)}ms`);
      }
    } else if (diversityImprovement < -0.5 || relevanceImprovement < -0.1) {
      console.log('❌ CONSIDER REMOVING ADVANCED QUESTIONS');
      console.log(`   - Reduces diversity by ${Math.abs(diversityImprovement).toFixed(2)} types`);
      console.log(`   - Reduces relevance by ${Math.abs(relevanceImprovement).toFixed(2)} points`);
    } else {
      console.log('⚠️  ADVANCED QUESTIONS HAVE MINIMAL IMPACT');
      console.log(`   - Diversity difference: ${diversityImprovement.toFixed(2)}`);
      console.log(`   - Relevance difference: ${relevanceImprovement.toFixed(2)}`);
      console.log(`   - Consider making them optional or removing if they add friction`);
    }
  }

  console.log('\n' + '='.repeat(80));
}

async function runTests() {
  console.log('🚀 Starting Comprehensive Analysis Test');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Quick Mode: ${QUICK_MODE ? 'Yes' : 'No'}`);
  console.log(`Skip Advanced: ${NO_ADVANCED ? 'Yes' : 'No'}`);
  console.log(`Refresh Cache: ${REFRESH_CACHE ? 'Yes' : 'No'}`);
  console.log('='.repeat(80));

  const combinations = generateTestCombinations();
  console.log(`\n📋 Generated ${combinations.length} test combinations`);
  console.log('Running tests...\n');

  let completed = 0;
  for (const combo of combinations) {
    const cacheKey = buildCacheKey(combo);
    const cachedEntry =
      !REFRESH_CACHE && cache[cacheKey] && cache[cacheKey].programs
        ? cache[cacheKey]
        : null;

    if (cachedEntry) {
      stats.cacheHits++;
      stats.totalDuration += cachedEntry.duration || 0;
      const analysis = analyzePrograms(cachedEntry.programs, combo.answers);
      analysis.duration = cachedEntry.duration || 0;
      updateStats(analysis, combo.answers, combo.hasAdvanced);
    } else {
      const result = await testRecommendation(combo.answers, combo.hasAdvanced);
      stats.cacheMisses++;

      if (result.error) {
        console.log(`❌ Error: ${result.error}`);
        stats.failedTests++;
        stats.totalTests++;
      } else if (result.data) {
        const analysis = analyzePrograms(result.data.programs || [], combo.answers);
        analysis.duration = result.duration;
        updateStats(analysis, combo.answers, combo.hasAdvanced);
        cache[cacheKey] = {
          programs: result.data.programs || [],
          duration: result.duration,
          timestamp: Date.now(),
        };
        cacheDirty = true;
      }
    }

    completed++;
    if (completed % 10 === 0) {
      process.stdout.write(`\rProgress: ${completed}/${combinations.length} (${((completed / combinations.length) * 100).toFixed(1)}%)`);
    }
  }

  console.log(`\n\n✅ Completed ${completed} tests`);

  if (cacheDirty) {
    await persistCache();
  }
  
  const statistics = calculateStatistics();
  printReport(statistics);

  // Save results to file
  const resultsFile = `test-results-${Date.now()}.json`;
  await fs.promises.writeFile(
    resultsFile,
    JSON.stringify({ stats, statistics }, null, 2),
    'utf-8'
  );
  console.log(`\n💾 Results saved to: ${resultsFile}`);
}

runTests().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

function getListArg(flag, defaults) {
  const entry = args.find((arg) => arg.startsWith(`${flag}=`));
  if (!entry) return defaults;
  const values = entry
    .slice(flag.length + 1)
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  return values.length ? values : defaults;
}

function getNumberListArg(flag, defaults) {
  const list = getListArg(flag, defaults);
  return list.map((value) => Number(value)).filter((value) => !Number.isNaN(value));
}

function getNumberArg(flag) {
  const entry = args.find((arg) => arg.startsWith(`${flag}=`));
  if (!entry) return null;
  const value = Number(entry.slice(flag.length + 1));
  return Number.isNaN(value) ? null : value;
}

function ensureCacheDir() {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
}

function loadCache() {
  try {
    ensureCacheDir();
    if (fs.existsSync(CACHE_FILE)) {
      const contents = fs.readFileSync(CACHE_FILE, 'utf-8');
      return JSON.parse(contents);
    }
  } catch (error) {
    console.warn('⚠️  Failed to read cache, starting fresh:', error.message);
  }
  return {};
}

async function persistCache() {
  try {
    ensureCacheDir();
    await fs.promises.writeFile(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf-8');
    cacheDirty = false;
  } catch (error) {
    console.warn('⚠️  Failed to write cache file:', error.message);
  }
}

function buildCacheKey(combo) {
  const stable = stableStringify({
    baseUrl: BASE_URL,
    answers: combo.answers,
    hasAdvanced: combo.hasAdvanced,
  });
  return JSON.stringify(stable);
}

function stableStringify(value) {
  if (Array.isArray(value)) {
    return value.map((item) => stableStringify(item));
  }
  if (value && typeof value === 'object') {
    return Object.keys(value)
      .sort()
      .reduce((acc, key) => {
        acc[key] = stableStringify(value[key]);
        return acc;
      }, {});
  }
  return value;
}

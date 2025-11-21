#!/usr/bin/env node
/**
 * Test script to check funding type diversity with focus on IMPORTANT types and subtypes
 * Tests: Equity subtypes, Loan subtypes, Grants, Visa, Guarantees
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

const testCases = [
  {
    name: 'Early Stage - Need Equity Subtypes',
    answers: {
      location: 'Austria',
      company_type: 'startup',
      company_stage: 'inc_lt_6m',
      funding_amount: 100000,
      industry_focus: 'digital',
      co_financing: 'co_yes',
    },
    expectedTypes: ['angel_investment', 'grant', 'bank_loan'],
  },
  {
    name: 'Scaleup - Need VC',
    answers: {
      location: 'Germany',
      company_type: 'startup',
      company_stage: 'inc_gt_36m',
      funding_amount: 750000,
      industry_focus: 'sustainability',
      co_financing: 'co_yes',
    },
    expectedTypes: ['venture_capital', 'grant', 'bank_loan', 'guarantee'],
  },
  {
    name: 'SME - Need Loan Subtypes',
    answers: {
      location: 'Germany',
      company_type: 'SME',
      company_stage: 'inc_gt_36m',
      funding_amount: 250000,
      industry_focus: 'manufacturing',
      co_financing: 'co_yes',
    },
    expectedTypes: ['bank_loan', 'leasing', 'grant', 'guarantee'],
  },
  {
    name: 'Small Amount - Need Micro Credit',
    answers: {
      location: 'Austria',
      company_type: 'startup',
      company_stage: 'inc_lt_6m',
      funding_amount: 15000,
      industry_focus: 'digital',
      co_financing: 'co_yes',
    },
    expectedTypes: ['micro_credit', 'crowdfunding', 'grant'],
  },
  {
    name: 'International - Need Visa',
    answers: {
      location: 'EU',
      company_type: 'startup',
      company_stage: 'inc_lt_6m',
      funding_amount: 50000,
      industry_focus: 'digital',
      co_financing: 'co_yes',
    },
    expectedTypes: ['visa_application', 'grant', 'angel_investment'],
  },
  {
    name: 'Export Focus - Need Guarantees',
    answers: {
      location: 'Germany',
      company_type: 'SME',
      company_stage: 'inc_6_36m',
      funding_amount: 200000,
      industry_focus: 'export',
      co_financing: 'co_yes',
    },
    expectedTypes: ['guarantee', 'grant', 'bank_loan'],
  },
];

async function testRecommendation(testCase) {
  try {
    const response = await fetch(`${BASE_URL}/api/programs/recommend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        answers: testCase.answers,
        max_results: 10,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      if (text.includes('<!DOCTYPE')) {
        throw new Error('Server returned HTML instead of JSON - API route not working');
      }
      throw new Error(`HTTP ${response.status}: ${text.substring(0, 200)}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    return { error: error.message };
  }
}

function analyzeFundingTypes(programs) {
  const typeCounts = {};
  const subtypes = {
    equity: ['angel_investment', 'venture_capital', 'crowdfunding', 'equity'],
    loan: ['bank_loan', 'leasing', 'micro_credit', 'repayable_advance', 'loan'],
    grant: ['grant'],
    guarantee: ['guarantee'],
    visa: ['visa_application'],
    other: ['subsidy', 'convertible'],
  };

  programs.forEach((program) => {
    const types = program.funding_types || (program.type ? [program.type] : ['grant']);
    types.forEach((type) => {
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });
  });

  // Group by category
  const categories = {
    equity: 0,
    loan: 0,
    grant: 0,
    guarantee: 0,
    visa: 0,
    other: 0,
  };

  Object.keys(typeCounts).forEach((type) => {
    if (subtypes.equity.includes(type)) categories.equity += typeCounts[type];
    else if (subtypes.loan.includes(type)) categories.loan += typeCounts[type];
    else if (subtypes.grant.includes(type)) categories.grant += typeCounts[type];
    else if (subtypes.guarantee.includes(type)) categories.guarantee += typeCounts[type];
    else if (subtypes.visa.includes(type)) categories.visa += typeCounts[type];
    else categories.other += typeCounts[type];
  });

  // Check for specific subtypes
  const foundSubtypes = {
    equity: subtypes.equity.filter((st) => typeCounts[st] > 0),
    loan: subtypes.loan.filter((st) => typeCounts[st] > 0),
  };

  return { typeCounts, categories, foundSubtypes, total: programs.length };
}

async function runTests() {
  console.log('🧪 Testing Funding Type Diversity (Refined - Important Types)\n');
  console.log('='.repeat(80));

  const results = [];

  for (const testCase of testCases) {
    console.log(`\n📋 Testing: ${testCase.name}`);
    const startTime = Date.now();

    const data = await testRecommendation(testCase);
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    if (data.error) {
      console.log(`   ❌ Error: ${data.error}`);
      results.push({ testCase, error: data.error, duration });
      continue;
    }

    const programs = data.programs || [];
    const analysis = analyzeFundingTypes(programs);

    console.log(`   ⏱️  Duration: ${duration}s`);
    console.log(`   📦 Programs: ${programs.length}`);
    console.log(`   💰 Funding Types Found: ${Object.keys(analysis.typeCounts).length}`);

    // Show category distribution
    console.log(`   📊 Category Distribution:`);
    console.log(`      - Grants: ${analysis.categories.grant} (${((analysis.categories.grant / analysis.total) * 100).toFixed(0)}%)`);
    console.log(`      - Loans: ${analysis.categories.loan} (${((analysis.categories.loan / analysis.total) * 100).toFixed(0)}%)`);
    console.log(`      - Equity: ${analysis.categories.equity} (${((analysis.categories.equity / analysis.total) * 100).toFixed(0)}%)`);
    console.log(`      - Guarantees: ${analysis.categories.guarantee} (${((analysis.categories.guarantee / analysis.total) * 100).toFixed(0)}%)`);
    console.log(`      - Visa: ${analysis.categories.visa} (${((analysis.categories.visa / analysis.total) * 100).toFixed(0)}%)`);

    // Show subtypes
    if (analysis.foundSubtypes.equity.length > 0) {
      console.log(`   ✅ Equity Subtypes: ${analysis.foundSubtypes.equity.join(', ')}`);
    } else {
      console.log(`   ⚠️  No equity subtypes found (only generic "equity"?)`);
    }

    if (analysis.foundSubtypes.loan.length > 0) {
      console.log(`   ✅ Loan Subtypes: ${analysis.foundSubtypes.loan.join(', ')}`);
    } else {
      console.log(`   ⚠️  No loan subtypes found (only generic "loan"?)`);
    }

    // Check expected types
    const foundExpected = testCase.expectedTypes.filter((et) => analysis.typeCounts[et] > 0);
    const missingExpected = testCase.expectedTypes.filter((et) => !analysis.typeCounts[et]);

    if (missingExpected.length > 0) {
      console.log(`   ⚠️  Missing Expected Types: ${missingExpected.join(', ')}`);
    }

    // Show all types found
    console.log(`   📋 All Types: ${Object.keys(analysis.typeCounts).join(', ')}`);

    results.push({ testCase, analysis, programs, duration });
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 DIVERSITY SUMMARY');
  console.log('='.repeat(80));

  const allTypes = new Set();
  const allSubtypes = {
    equity: new Set(),
    loan: new Set(),
  };

  results.forEach((result) => {
    if (result.analysis) {
      Object.keys(result.analysis.typeCounts).forEach((type) => allTypes.add(type));
      result.analysis.foundSubtypes.equity.forEach((st) => allSubtypes.equity.add(st));
      result.analysis.foundSubtypes.loan.forEach((st) => allSubtypes.loan.add(st));
    }
  });

  console.log(`\n📦 Total Unique Funding Types: ${allTypes.size}`);
  console.log(`   Types: ${Array.from(allTypes).sort().join(', ')}`);

  console.log(`\n✅ Equity Subtypes Found: ${allSubtypes.equity.size}`);
  console.log(`   ${Array.from(allSubtypes.equity).sort().join(', ') || 'None'}`);

  console.log(`\n✅ Loan Subtypes Found: ${allSubtypes.loan.size}`);
  console.log(`   ${Array.from(allSubtypes.loan).sort().join(', ') || 'None'}`);

  // Check for important types
  const importantTypes = [
    'angel_investment',
    'venture_capital',
    'crowdfunding',
    'bank_loan',
    'leasing',
    'micro_credit',
    'guarantee',
    'visa_application',
  ];

  const foundImportant = importantTypes.filter((it) => allTypes.has(it));
  const missingImportant = importantTypes.filter((it) => !allTypes.has(it));

  console.log(`\n🎯 Important Types Coverage: ${foundImportant.length}/${importantTypes.length} (${((foundImportant.length / importantTypes.length) * 100).toFixed(0)}%)`);
  if (foundImportant.length > 0) {
    console.log(`   ✅ Found: ${foundImportant.join(', ')}`);
  }
  if (missingImportant.length > 0) {
    console.log(`   ❌ Missing: ${missingImportant.join(', ')}`);
  }

  return results;
}

runTests().catch(console.error);








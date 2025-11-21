#!/usr/bin/env node
/**
 * Compare system output with sample persona recommendations
 * Tests against the provided persona samples to see if our system produces better results
 */

const BASE_URL = process.env.BASE_URL || process.env.RECO_BASE_URL || 'http://localhost:3000';
const bypassToken = process.env.VERCEL_BYPASS_TOKEN || process.env.VERCEL_DEPLOYMENT_PROTECTION_BYPASS;

// Personas based on the provided samples
const personas = [
  {
    name: 'Persona 1: Early-Stage Austrian Tech Startup',
    description: 'Austria, startup, early stage, €200-300k, health/AI, pre-revenue, co-financing uncertain',
    answers: {
      location: 'austria',
      company_type: 'startup',
      company_stage: 'inc_lt_6m',
      funding_amount: 250000,
      industry_focus: ['health', 'digital'],
      co_financing: 'co_uncertain',
      revenue_status: 'pre_revenue',
    },
    expectedPrograms: ['FFG', 'aws', 'Vienna Business Agency', 'EIC Accelerator'],
    expectedTypes: ['grant', 'angel_investment', 'venture_capital'],
  },
  {
    name: 'Persona 2: Established German Manufacturing SME',
    description: 'Germany, SME, established, €500k+, manufacturing, sustainability, co-financing yes',
    answers: {
      location: 'germany',
      company_type: 'sme',
      company_stage: 'inc_gt_36m',
      funding_amount: 750000,
      industry_focus: ['manufacturing', 'sustainability'],
      co_financing: 'co_yes',
      impact_focus: ['environmental'],
    },
    expectedPrograms: ['KfW', 'BayTP+', 'ZIM', 'KMU-innovativ', 'InvestEU', 'EFRE'],
    expectedTypes: ['grant', 'bank_loan', 'leasing', 'guarantee'],
  },
  {
    name: 'Persona 3: EU Research Institution (Health)',
    description: 'EU, research institution, €500k-€2M, health research, co-financing yes',
    answers: {
      location: 'eu',
      company_type: 'research',
      company_stage: 'research_org',
      funding_amount: 1000000,
      industry_focus: ['health', 'research'],
      co_financing: 'co_yes',
      impact_focus: ['research', 'innovation'],
    },
    expectedPrograms: ['Horizon Europe', 'IHI', 'EU4Health', 'Cancer Mission'],
    expectedTypes: ['grant'],
  },
];

async function testPersona(persona) {
  const startTime = Date.now();
  try {
    const response = await fetch(`${BASE_URL}/api/programs/recommend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(bypassToken && { 'x-vercel-protection-bypass': bypassToken }),
      },
      body: JSON.stringify({
        answers: persona.answers,
        max_results: 15,
      }),
    });

    const duration = Date.now() - startTime;

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

function analyzeResults(persona, programs) {
  const analysis = {
    totalPrograms: programs.length,
    programNames: programs.map(p => p.name || 'Unnamed'),
    fundingTypes: new Set(),
    expectedProgramsFound: [],
    expectedProgramsMissing: [],
    expectedTypesFound: [],
    expectedTypesMissing: [],
    llmSuccess: programs.some(p => p.source === 'llm'),
    fallbackUsed: programs.some(p => p.source === 'fallback'),
    diversity: 0,
    relevance: 0,
  };

  // Extract funding types
  programs.forEach((program) => {
    const types = program.funding_types || program.metadata?.funding_types || [];
    types.forEach((type) => analysis.fundingTypes.add(type));
  });
  analysis.diversity = analysis.fundingTypes.size;

  // Check for expected programs
  persona.expectedPrograms.forEach((expected) => {
    const found = analysis.programNames.some((name) => 
      name.toLowerCase().includes(expected.toLowerCase()) ||
      expected.toLowerCase().includes(name.toLowerCase().split(' ')[0])
    );
    if (found) {
      analysis.expectedProgramsFound.push(expected);
    } else {
      analysis.expectedProgramsMissing.push(expected);
    }
  });

  // Check for expected types
  persona.expectedTypes.forEach((expected) => {
    const found = Array.from(analysis.fundingTypes).some((type) =>
      type.toLowerCase().includes(expected.toLowerCase()) ||
      expected.toLowerCase().includes(type.toLowerCase())
    );
    if (found) {
      analysis.expectedTypesFound.push(expected);
    } else {
      analysis.expectedTypesMissing.push(expected);
    }
  });

  return analysis;
}

function printComparison(persona, analysis, duration) {
  console.log('\n' + '='.repeat(80));
  console.log(`📋 ${persona.name}`);
  console.log('='.repeat(80));
  console.log(`Description: ${persona.description}`);
  console.log(`\n⏱️  Duration: ${duration}ms`);
  console.log(`📦 Programs Returned: ${analysis.totalPrograms}`);
  console.log(`💰 Funding Types Found: ${analysis.diversity} (${Array.from(analysis.fundingTypes).join(', ')})`);
  console.log(`🤖 LLM Success: ${analysis.llmSuccess ? '✅' : '❌'}`);
  console.log(`🔄 Fallback Used: ${analysis.fallbackUsed ? '⚠️' : '✅'}`);

  console.log(`\n✅ Expected Programs Found: ${analysis.expectedProgramsFound.length}/${persona.expectedPrograms.length}`);
  if (analysis.expectedProgramsFound.length > 0) {
    analysis.expectedProgramsFound.forEach((p) => console.log(`   - ${p}`));
  }

  if (analysis.expectedProgramsMissing.length > 0) {
    console.log(`\n❌ Expected Programs Missing: ${analysis.expectedProgramsMissing.length}`);
    analysis.expectedProgramsMissing.forEach((p) => console.log(`   - ${p}`));
  }

  console.log(`\n✅ Expected Types Found: ${analysis.expectedTypesFound.length}/${persona.expectedTypes.length}`);
  if (analysis.expectedTypesFound.length > 0) {
    analysis.expectedTypesFound.forEach((t) => console.log(`   - ${t}`));
  }

  if (analysis.expectedTypesMissing.length > 0) {
    console.log(`\n❌ Expected Types Missing: ${analysis.expectedTypesMissing.length}`);
    analysis.expectedTypesMissing.forEach((t) => console.log(`   - ${t}`));
  }

  console.log(`\n📋 Top 5 Programs Returned:`);
  analysis.programNames.slice(0, 5).forEach((name, idx) => {
    console.log(`   ${idx + 1}. ${name}`);
  });

  // Quality assessment
  const qualityScore = (
    (analysis.expectedProgramsFound.length / persona.expectedPrograms.length) * 0.4 +
    (analysis.expectedTypesFound.length / persona.expectedTypes.length) * 0.3 +
    (analysis.diversity / 5) * 0.2 + // Normalize to 5 types
    (analysis.llmSuccess ? 0.1 : 0)
  ) * 100;

  console.log(`\n📊 Quality Score: ${qualityScore.toFixed(1)}/100`);
  if (qualityScore >= 80) {
    console.log('   ✅ Excellent - Better than sample recommendations');
  } else if (qualityScore >= 60) {
    console.log('   ⚠️  Good - Comparable to sample recommendations');
  } else {
    console.log('   ❌ Needs Improvement - Worse than sample recommendations');
  }
}

async function runComparison() {
  console.log('🔍 Comparing System Output with Sample Persona Recommendations');
  console.log(`Base URL: ${BASE_URL}`);
  console.log('='.repeat(80));

  const results = [];

  for (const persona of personas) {
    const result = await testPersona(persona);
    
    if (result.error) {
      console.log(`\n❌ Error testing ${persona.name}: ${result.error}`);
      continue;
    }

    const programs = result.data?.programs || [];
    const analysis = analyzeResults(persona, programs);
    printComparison(persona, analysis, result.duration);
    
    results.push({ persona, analysis, duration: result.duration });
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 SUMMARY COMPARISON');
  console.log('='.repeat(80));

  const avgQuality = results.reduce((sum, r) => {
    const score = (
      (r.analysis.expectedProgramsFound.length / r.persona.expectedPrograms.length) * 0.4 +
      (r.analysis.expectedTypesFound.length / r.persona.expectedTypes.length) * 0.3 +
      (r.analysis.diversity / 5) * 0.2 +
      (r.analysis.llmSuccess ? 0.1 : 0)
    ) * 100;
    return sum + score;
  }, 0) / results.length;

  const avgDiversity = results.reduce((sum, r) => sum + r.analysis.diversity, 0) / results.length;
  const llmSuccessRate = (results.filter(r => r.analysis.llmSuccess).length / results.length) * 100;
  const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;

  console.log(`\nAverage Quality Score: ${avgQuality.toFixed(1)}/100`);
  console.log(`Average Diversity: ${avgDiversity.toFixed(1)} funding types`);
  console.log(`LLM Success Rate: ${llmSuccessRate.toFixed(1)}%`);
  console.log(`Average Duration: ${avgDuration.toFixed(0)}ms`);

  console.log(`\n💡 Assessment:`);
  if (avgQuality >= 80) {
    console.log('✅ System produces BETTER recommendations than the sample personas');
  } else if (avgQuality >= 60) {
    console.log('⚠️  System produces COMPARABLE recommendations to the sample personas');
  } else {
    console.log('❌ System needs improvement to match sample persona quality');
  }
}

runComparison().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});








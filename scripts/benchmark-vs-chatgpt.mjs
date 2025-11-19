#!/usr/bin/env node

/**
 * Benchmark Script: Compare our recommendation system vs ChatGPT
 * Generates diverse Q&A combinations and tests both systems
 * 
 * Usage:
 *   node scripts/benchmark-vs-chatgpt.mjs [count]
 *   Default: 100 tests
 *   Example: node scripts/benchmark-vs-chatgpt.mjs 20
 */

import OpenAI from 'openai';
import fs from 'fs/promises';
import path from 'path';

const DEFAULT_BASE_URL = 'http://localhost:3000';
const baseUrl = (process.env.RECO_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, '');
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY environment variable required');
  process.exit(1);
}

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// Answer value pools for diversity
const LOCATIONS = ['austria', 'germany', 'eu', 'international'];
const COMPANY_TYPES = ['prefounder', 'startup', 'sme', 'research', 'other'];
const COMPANY_STAGES = ['idea', 'pre_company', 'inc_lt_6m', 'inc_6_36m', 'inc_gt_36m', 'research_org'];
const CO_FINANCING = ['co_yes', 'co_no', 'co_uncertain'];
const INDUSTRIES = ['digital', 'sustainability', 'health', 'manufacturing', 'export'];
const FUNDING_AMOUNTS = [5000, 15000, 50000, 100000, 250000, 500000, 750000, 1000000];
const TEAM_SIZES = ['solo', 'team_2_5', 'team_6_20', 'team_20_plus'];
const REVENUE_STATUSES = ['pre_revenue', 'early_revenue', 'scaling_revenue', 'profitable'];
const IMPACT_FOCI = ['environmental', 'social', 'regional', 'research', 'innovation'];
const USE_OF_FUNDS = ['product_development', 'hiring', 'equipment', 'marketing', 'internationalization', 'working_capital'];

// Generate 100 diverse answer combinations
function generateDiverseAnswers(count = 100) {
  const combinations = [];
  const used = new Set();
  
  for (let i = 0; i < count; i++) {
    let attempts = 0;
    let key;
    
    // Ensure uniqueness
    do {
      const location = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
      const companyType = COMPANY_TYPES[Math.floor(Math.random() * COMPANY_TYPES.length)];
      const companyStage = COMPANY_STAGES[Math.floor(Math.random() * COMPANY_STAGES.length)];
      const coFinancing = CO_FINANCING[Math.floor(Math.random() * CO_FINANCING.length)];
      const fundingAmount = FUNDING_AMOUNTS[Math.floor(Math.random() * FUNDING_AMOUNTS.length)];
      
      // Random industry selection (1-3 industries)
      const numIndustries = Math.floor(Math.random() * 3) + 1;
      const industryFocus = Array.from({ length: numIndustries }, () => 
        INDUSTRIES[Math.floor(Math.random() * INDUSTRIES.length)]
      ).filter((v, i, a) => a.indexOf(v) === i); // Remove duplicates
      
      // Optional advanced fields (50% chance)
      const teamSize = Math.random() > 0.5 ? TEAM_SIZES[Math.floor(Math.random() * TEAM_SIZES.length)] : undefined;
      const revenueStatus = Math.random() > 0.5 ? REVENUE_STATUSES[Math.floor(Math.random() * REVENUE_STATUSES.length)] : undefined;
      const impactFocus = Math.random() > 0.5 ? Array.from({ length: Math.floor(Math.random() * 2) + 1 }, () =>
        IMPACT_FOCI[Math.floor(Math.random() * IMPACT_FOCI.length)]
      ).filter((v, i, a) => a.indexOf(v) === i) : undefined;
      const useOfFunds = Math.random() > 0.5 ? Array.from({ length: Math.floor(Math.random() * 2) + 1 }, () =>
        USE_OF_FUNDS[Math.floor(Math.random() * USE_OF_FUNDS.length)]
      ).filter((v, i, a) => a.indexOf(v) === i) : undefined;
      
      key = `${location}-${companyType}-${companyStage}-${coFinancing}-${fundingAmount}`;
      attempts++;
      
      if (!used.has(key) || attempts > 100) {
        used.add(key);
        
        const answers = {
          location,
          company_type: companyType,
          company_stage: companyStage,
          funding_amount: fundingAmount,
          industry_focus: industryFocus,
          co_financing: coFinancing,
        };
        
        if (teamSize) answers.team_size = teamSize;
        if (revenueStatus) answers.revenue_status = revenueStatus;
        if (impactFocus) answers.impact_focus = impactFocus;
        if (useOfFunds) answers.use_of_funds = useOfFunds;
        
        combinations.push({
          id: i + 1,
          answers,
        });
        break;
      }
    } while (attempts < 100);
  }
  
  return combinations;
}

// Build ChatGPT prompt equivalent to our system
function buildChatGPTPrompt(answers) {
  const profile = [];
  
  if (answers.location) {
    profile.push(`Location: ${answers.location}`);
  }
  if (answers.company_type) {
    profile.push(`Company type: ${answers.company_type}`);
  }
  if (answers.company_stage) {
    profile.push(`Company stage: ${answers.company_stage}`);
  }
  if (answers.funding_amount) {
    profile.push(`Funding need: €${answers.funding_amount.toLocaleString()}`);
  }
  if (answers.industry_focus) {
    const industries = Array.isArray(answers.industry_focus) ? answers.industry_focus : [answers.industry_focus];
    profile.push(`Industry focus: ${industries.join(', ')}`);
  }
  if (answers.co_financing) {
    profile.push(`Co-financing: ${answers.co_financing}`);
  }
  if (answers.use_of_funds) {
    const useCases = Array.isArray(answers.use_of_funds) ? answers.use_of_funds : [answers.use_of_funds];
    profile.push(`Use of funds: ${useCases.join(', ')}`);
  }
  if (answers.team_size) {
    profile.push(`Team size: ${answers.team_size}`);
  }
  if (answers.revenue_status) {
    profile.push(`Revenue status: ${answers.revenue_status}`);
  }
  if (answers.impact_focus) {
    const impacts = Array.isArray(answers.impact_focus) ? answers.impact_focus : [answers.impact_focus];
    profile.push(`Impact focus: ${impacts.join(', ')}`);
  }
  
  return `You are an expert on European funding programs. Recommend up to 10 funding programs that match this profile:

${profile.join('\n')}

Rules:
1. Location: Only programs available in the specified location or EU-wide.
2. Compatibility: Company type and stage must match the user.
3. Funding range: Align with user's need (be lenient but relevant).
4. Funding types: Use these primary types: grant, loan, equity, guarantee, subsidy, venture_capital, angel_investment, crowdfunding, coaching, mentoring, networking, acceleration_program, export_support, innovation_support.
5. Provide diversity: If user can provide co-financing, include a mix of grants, loans, equity, and guarantees. If not, only grants/subsidies.

For each program, provide:
- Program name
- Organization (e.g., FFG, AWS, KfW, EU Commission)
- Funding types (can be multiple)
- Funding amount range (min-max in EUR)
- Location/region
- Brief description (2-3 sentences explaining what it offers and why it matches)
- Key requirements: co-financing needs, deadlines, key constraints

Format as a numbered list with clear structure.`;
}

// Test our system
async function testOurSystem(answers) {
  const start = Date.now();
  try {
    const response = await fetch(`${baseUrl}/api/programs/recommend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers, max_results: 10 }),
    });
    
    const data = await response.json();
    const duration = Date.now() - start;
    
    return {
      success: response.ok && data.programs && data.programs.length > 0,
      duration,
      programCount: data.programs?.length || 0,
      programs: data.programs || [],
      fallbackUsed: data.debug?.fallbackUsed || false,
      llmError: data.debug?.llmError || null,
      raw: data,
    };
  } catch (error) {
    return {
      success: false,
      duration: Date.now() - start,
      programCount: 0,
      programs: [],
      error: error.message,
    };
  }
}

// Test ChatGPT
async function testChatGPT(answers) {
  const start = Date.now();
  try {
    const prompt = buildChatGPTPrompt(answers);
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are an expert on European funding programs. Provide clear, structured recommendations.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 2000,
      temperature: 0.2,
    });
    
    const content = completion.choices[0]?.message?.content || '';
    const duration = Date.now() - start;
    
    // Better parsing: count numbered items or program names
    // Look for numbered lists (1., 2., etc.) or program name patterns
    const numberedItems = content.match(/^\d+[\.\)]\s+[A-Z][^\n]{20,}/gm) || [];
    const programNamePatterns = content.match(/(?:^|\n)(?:Program|Funding|Grant|Loan|Scheme|Initiative|AWS|FFG|KfW|Horizon|EIC)[^\n]{10,}/gi) || [];
    const estimatedCount = Math.max(numberedItems.length, Math.min(programNamePatterns.length, 10));
    
    return {
      success: true,
      duration,
      estimatedProgramCount: estimatedCount,
      content,
      raw: completion,
    };
  } catch (error) {
    return {
      success: false,
      duration: Date.now() - start,
      estimatedProgramCount: 0,
      content: '',
      error: error.message,
    };
  }
}

// Compare results
function compareResults(ourResult, chatgptResult, testId) {
  const comparison = {
    testId,
    ourSystem: {
      success: ourResult.success,
      programCount: ourResult.programCount,
      duration: ourResult.duration,
      fallbackUsed: ourResult.fallbackUsed || false,
      hasError: !!ourResult.error,
    },
    chatgpt: {
      success: chatgptResult.success,
      estimatedProgramCount: chatgptResult.estimatedProgramCount,
      duration: chatgptResult.duration,
      hasError: !!chatgptResult.error,
    },
    winner: null,
    notes: [],
  };
  
  // Determine winner
  if (!ourResult.success && !chatgptResult.success) {
    comparison.winner = 'tie';
    comparison.notes.push('Both failed');
  } else if (!ourResult.success) {
    comparison.winner = 'chatgpt';
    comparison.notes.push('Our system failed');
  } else if (!chatgptResult.success) {
    comparison.winner = 'ours';
    comparison.notes.push('ChatGPT failed');
  } else {
    // Both succeeded - compare quality
    const ourCount = ourResult.programCount;
    const chatgptCount = chatgptResult.estimatedProgramCount;
    
    if (ourCount > chatgptCount) {
      comparison.winner = 'ours';
      comparison.notes.push(`More programs: ${ourCount} vs ${chatgptCount}`);
    } else if (chatgptCount > ourCount) {
      comparison.winner = 'chatgpt';
      comparison.notes.push(`More programs: ${chatgptCount} vs ${ourCount}`);
    } else {
      comparison.winner = 'tie';
      comparison.notes.push(`Same program count: ${ourCount}`);
    }
    
    // Speed comparison
    if (ourResult.duration < chatgptResult.duration) {
      comparison.notes.push(`Faster: ${ourResult.duration}ms vs ${chatgptResult.duration}ms`);
    } else {
      comparison.notes.push(`Slower: ${ourResult.duration}ms vs ${chatgptResult.duration}ms`);
    }
  }
  
  return comparison;
}

// Main execution
async function main() {
  const testCount = parseInt(process.argv[2]) || 100;
  
  console.log('🚀 Starting benchmark: Our System vs ChatGPT');
  console.log(`📡 Base URL: ${baseUrl}`);
  console.log(`🤖 OpenAI API: ${OPENAI_API_KEY ? 'Configured' : 'Missing'}`);
  console.log(`📊 Test Count: ${testCount}\n`);
  
  // Generate test cases
  console.log(`📝 Generating ${testCount} diverse Q&A combinations...`);
  const testCases = generateDiverseAnswers(testCount);
  console.log(`✅ Generated ${testCases.length} test cases\n`);
  
  const results = [];
  const comparisons = [];
  let ourWins = 0;
  let chatgptWins = 0;
  let ties = 0;
  
  // Process in batches to avoid overwhelming the system
  const BATCH_SIZE = 10;
  const DELAY_BETWEEN_BATCHES = 2000; // 2 seconds
  
  for (let i = 0; i < testCases.length; i += BATCH_SIZE) {
    const batch = testCases.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(testCases.length / BATCH_SIZE);
    
    console.log(`\n📦 Processing batch ${batchNum}/${totalBatches} (tests ${i + 1}-${Math.min(i + BATCH_SIZE, testCases.length)})`);
    
    // Process batch in parallel
    const batchPromises = batch.map(async (testCase) => {
      const testId = testCase.id;
      console.log(`  ⏳ Test ${testId}: Testing both systems...`);
      
      // Run both tests in parallel
      const [ourResult, chatgptResult] = await Promise.all([
        testOurSystem(testCase.answers),
        testChatGPT(testCase.answers),
      ]);
      
      const comparison = compareResults(ourResult, chatgptResult, testId);
      
      if (comparison.winner === 'ours') ourWins++;
      else if (comparison.winner === 'chatgpt') chatgptWins++;
      else ties++;
      
      return {
        testCase,
        ourResult,
        chatgptResult,
        comparison,
      };
    });
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    // Log batch summary
    const batchWins = batchResults.filter(r => r.comparison.winner === 'ours').length;
    const batchChatGPTWins = batchResults.filter(r => r.comparison.winner === 'chatgpt').length;
    const batchTies = batchResults.filter(r => r.comparison.winner === 'tie').length;
    
    console.log(`  ✅ Batch ${batchNum} complete: Ours: ${batchWins}, ChatGPT: ${batchChatGPTWins}, Ties: ${batchTies}`);
    
    // Delay between batches (except last batch)
    if (i + BATCH_SIZE < testCases.length) {
      console.log(`  ⏸️  Waiting ${DELAY_BETWEEN_BATCHES}ms before next batch...`);
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
    }
  }
  
  // Calculate statistics
  const ourSuccessRate = (results.filter(r => r.ourResult.success).length / results.length) * 100;
  const chatgptSuccessRate = (results.filter(r => r.chatgptResult.success).length / results.length) * 100;
  const ourAvgDuration = results.reduce((sum, r) => sum + r.ourResult.duration, 0) / results.length;
  const chatgptAvgDuration = results.reduce((sum, r) => sum + r.chatgptResult.duration, 0) / results.length;
  const ourAvgProgramCount = results.filter(r => r.ourResult.success).reduce((sum, r) => sum + r.ourResult.programCount, 0) / results.filter(r => r.ourResult.success).length || 0;
  const ourFallbackRate = (results.filter(r => r.ourResult.fallbackUsed).length / results.length) * 100;
  
  // Generate report
  const report = {
    summary: {
      totalTests: results.length,
      ourWins,
      chatgptWins,
      ties,
      ourWinRate: (ourWins / results.length) * 100,
      chatgptWinRate: (chatgptWins / results.length) * 100,
      tieRate: (ties / results.length) * 100,
    },
    metrics: {
      ourSystem: {
        successRate: ourSuccessRate,
        avgDuration: ourAvgDuration,
        avgProgramCount: ourAvgProgramCount,
        fallbackRate: ourFallbackRate,
      },
      chatgpt: {
        successRate: chatgptSuccessRate,
        avgDuration: chatgptAvgDuration,
      },
    },
    results: results.map(r => ({
      testId: r.testCase.id,
      answers: r.testCase.answers,
      comparison: r.comparison,
      ourPrograms: r.ourResult.programs.slice(0, 5).map(p => ({
        name: p.name,
        funding_types: p.funding_types,
        organization: p.metadata?.organization,
        description: p.metadata?.description?.substring(0, 150),
        co_financing: p.metadata?.co_financing_required,
      })),
      chatgptFull: r.chatgptResult.content,
      chatgptPreview: r.chatgptResult.content?.substring(0, 1000),
    })),
  };
  
  // Save results
  const outputDir = path.join(process.cwd(), 'benchmark-results');
  await fs.mkdir(outputDir, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath = path.join(outputDir, `benchmark-${timestamp}.json`);
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
  
  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 BENCHMARK RESULTS SUMMARY');
  console.log('='.repeat(60));
  console.log(`\n🎯 Overall Winner:`);
  console.log(`   Our System: ${ourWins} wins (${(ourWins / results.length * 100).toFixed(1)}%)`);
  console.log(`   ChatGPT: ${chatgptWins} wins (${(chatgptWins / results.length * 100).toFixed(1)}%)`);
  console.log(`   Ties: ${ties} (${(ties / results.length * 100).toFixed(1)}%)`);
  
  console.log(`\n📈 Success Rates:`);
  console.log(`   Our System: ${ourSuccessRate.toFixed(1)}%`);
  console.log(`   ChatGPT: ${chatgptSuccessRate.toFixed(1)}%`);
  
  console.log(`\n⏱️  Average Response Times:`);
  console.log(`   Our System: ${ourAvgDuration.toFixed(0)}ms`);
  console.log(`   ChatGPT: ${chatgptAvgDuration.toFixed(0)}ms`);
  
  console.log(`\n📦 Our System Metrics:`);
  console.log(`   Avg Programs per Success: ${ourAvgProgramCount.toFixed(1)}`);
  console.log(`   Fallback Usage: ${ourFallbackRate.toFixed(1)}%`);
  
  console.log(`\n💾 Full results saved to: ${reportPath}`);
  console.log('='.repeat(60) + '\n');
}

main().catch(console.error);


/**
 * Simplified Test Script: 5 Diverse Personas
 * Tests 5 maximally diverse personas to identify:
 * - What questions are actually needed
 * - What complexity can be removed
 * - Which personas get 0 results and why
 */

interface UserAnswers {
  location?: string;
  company_type?: string;
  company_stage?: string | number;
  company_stage_classified?: string;
  legal_type?: string;
  team_size?: string | number;
  revenue_status?: string;
  co_financing?: string;
  industry_focus?: string | string[];
  funding_amount?: string | number;
  use_of_funds?: string | string[];
  impact?: string | string[];
  deadline_urgency?: string | number;
  project_duration?: string | number;
  [key: string]: any;
}

interface Persona {
  name: string;
  description: string;
  answers: UserAnswers;
}

// 5 MAXIMALLY DIVERSE PERSONAS covering all extremes
const personas: Persona[] = [
  {
    name: "1. Early-Stage Startup (Vienna, Digital, €100k)",
    description: "Very early startup, 3 months old, digital, small funding, pre-revenue",
    answers: {
      location: 'austria',
      location_region: 'vienna',
      company_type: 'startup',
      company_stage: 3, // 3 months
      company_stage_classified: 'early_stage',
      legal_type: 'gmbh',
      funding_amount: 100000, // €100k
      industry_focus: ['digital'],
      use_of_funds: ['rd', 'personnel'],
      impact: ['economic'],
      co_financing: 'co_no',
      team_size: 2,
      revenue_status: 'pre_revenue',
      project_duration: 12,
      deadline_urgency: 3,
    }
  },
  {
    name: "2. Pre-Founder (Solo, Idea Stage, €50k)",
    description: "Pre-incorporation, solo founder, idea stage, minimal funding",
    answers: {
      location: 'austria',
      company_type: 'prefounder',
      company_stage: -6, // Pre-incorporation
      company_stage_classified: 'pre_company',
      legal_type: 'einzelunternehmer',
      funding_amount: 50000, // €50k
      industry_focus: ['digital'],
      use_of_funds: ['rd'],
      impact: ['economic'],
      co_financing: 'co_no',
      team_size: 1,
      revenue_status: 'pre_revenue',
      project_duration: 6,
      deadline_urgency: 1,
    }
  },
  {
    name: "3. Scale-Up (Vienna, Multi-Industry, €1.5M)",
    description: "Large funding need, growth stage, multiple industries, can co-finance",
    answers: {
      location: 'austria',
      location_region: 'vienna',
      company_type: 'startup',
      company_stage: 24, // 24 months
      company_stage_classified: 'growth_stage',
      legal_type: 'gmbh',
      funding_amount: 1500000, // €1.5M
      industry_focus: ['digital', 'sustainability', 'health'],
      use_of_funds: ['rd', 'personnel', 'marketing', 'expansion'],
      impact: ['economic', 'environmental', 'social'],
      co_financing: 'co_yes',
      co_financing_percentage: '30%',
      team_size: 25,
      revenue_status: 'growing_revenue',
      project_duration: 36,
      deadline_urgency: 12,
    }
  },
  {
    name: "4. Research Institution (EU, Sustainability, €2M)",
    description: "Research institution, EU-wide, large funding, sustainability focus",
    answers: {
      location: 'eu',
      company_type: 'research',
      company_stage: 120, // 10 years (mature research org)
      company_stage_classified: 'mature',
      legal_type: 'verein',
      funding_amount: 2000000, // €2M
      industry_focus: ['sustainability'],
      use_of_funds: ['rd', 'equipment'],
      impact: ['environmental', 'social'],
      co_financing: 'co_yes',
      co_financing_percentage: '20%',
      team_size: 50,
      revenue_status: 'not_applicable',
      project_duration: 48,
      deadline_urgency: 6,
    }
  },
  {
    name: "5. SME Manufacturing (Salzburg, €400k)",
    description: "Established SME, manufacturing, regional, medium funding",
    answers: {
      location: 'austria',
      location_region: 'salzburg',
      company_type: 'sme',
      company_stage: 60, // 5 years
      company_stage_classified: 'mature',
      legal_type: 'gmbh',
      funding_amount: 400000, // €400k
      industry_focus: ['manufacturing'],
      use_of_funds: ['equipment', 'expansion'],
      impact: ['economic'],
      co_financing: 'co_yes',
      co_financing_percentage: '40%',
      team_size: 15,
      revenue_status: 'growing_revenue',
      project_duration: 24,
      deadline_urgency: 9,
    }
  },
];

interface TestResult {
  persona: string;
  programCount: number;
  responseTime: number;
  source: string;
  programs: any[];
  extractionQuality: {
    hasLocation: boolean;
    hasCompanyType: boolean;
    hasFundingAmount: boolean;
    categoryCount: number;
    categories: string[];
  };
}

async function testPersona(persona: Persona): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    const response = await fetch('http://localhost:3000/api/programs/recommend', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        answers: persona.answers,
        max_results: 20,
        extract_all: false,
        use_seeds: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const responseTime = Date.now() - startTime;

    // Analyze extraction quality
    const programs = data.programs || [];
    const extractionQuality = {
      hasLocation: 0,
      hasCompanyType: 0,
      hasFundingAmount: 0,
      categoryCount: 0,
      categories: [] as string[],
    };

    programs.forEach((program: any) => {
      const reqs = program.categorized_requirements || {};
      const metadata = program.metadata || {};
      
      // Check critical fields
      if (reqs.geographic && reqs.geographic.length > 0) extractionQuality.hasLocation++;
      if (reqs.eligibility && reqs.eligibility.some((r: any) => r.type === 'company_type')) {
        extractionQuality.hasCompanyType++;
      }
      if (metadata.funding_amount_min || metadata.funding_amount_max) {
        extractionQuality.hasFundingAmount++;
      }
      
      // Count categories
      const categories = Object.keys(reqs);
      extractionQuality.categories.push(...categories);
      extractionQuality.categoryCount += categories.length;
    });

    // Calculate averages
    if (programs.length > 0) {
      extractionQuality.hasLocation = Math.round((extractionQuality.hasLocation / programs.length) * 100);
      extractionQuality.hasCompanyType = Math.round((extractionQuality.hasCompanyType / programs.length) * 100);
      extractionQuality.hasFundingAmount = Math.round((extractionQuality.hasFundingAmount / programs.length) * 100);
      extractionQuality.categoryCount = Math.round(extractionQuality.categoryCount / programs.length);
    }

    return {
      persona: persona.name,
      programCount: programs.length,
      responseTime,
      source: data.source || 'unknown',
      programs,
      extractionQuality,
    };
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    console.error(`❌ Error testing ${persona.name}:`, error.message);
    return {
      persona: persona.name,
      programCount: 0,
      responseTime,
      source: 'error',
      programs: [],
      extractionQuality: {
        hasLocation: 0,
        hasCompanyType: 0,
        hasFundingAmount: 0,
        categoryCount: 0,
        categories: [],
      },
    };
  }
}

function analyzeResults(results: TestResult[]) {
  console.log('\n\n');
  console.log('='.repeat(80));
  console.log('📊 ANALYSIS: What Questions Are Actually Needed?');
  console.log('='.repeat(80));
  
  const zeroResults = results.filter(r => r.programCount === 0);
  const hasResults = results.filter(r => r.programCount > 0);
  
  console.log(`\n✅ Personas with results: ${hasResults.length}/${results.length}`);
  console.log(`❌ Personas with 0 results: ${zeroResults.length}/${results.length}`);
  
  if (zeroResults.length > 0) {
    console.log('\n⚠️  Personas getting 0 results:');
    zeroResults.forEach(r => {
      console.log(`   - ${r.persona}`);
    });
  }
  
  // Analyze which answers correlate with 0 results
  console.log('\n🔍 Pattern Analysis:');
  zeroResults.forEach(r => {
    const persona = personas.find(p => p.name === r.persona);
    if (persona) {
      console.log(`\n   ${r.persona}:`);
      console.log(`   - Company Type: ${persona.answers.company_type}`);
      console.log(`   - Company Stage: ${persona.answers.company_stage} months (${persona.answers.company_stage_classified})`);
      console.log(`   - Funding Amount: €${persona.answers.funding_amount?.toLocaleString()}`);
      console.log(`   - Location: ${persona.answers.location}${persona.answers.location_region ? ` (${persona.answers.location_region})` : ''}`);
    }
  });
  
  // Extraction quality analysis
  console.log('\n📈 Extraction Quality (Average across all personas):');
  const avgLocation = results.reduce((sum, r) => sum + r.extractionQuality.hasLocation, 0) / results.length;
  const avgCompanyType = results.reduce((sum, r) => sum + r.extractionQuality.hasCompanyType, 0) / results.length;
  const avgFundingAmount = results.reduce((sum, r) => sum + r.extractionQuality.hasFundingAmount, 0) / results.length;
  const avgCategories = results.reduce((sum, r) => sum + r.extractionQuality.categoryCount, 0) / results.length;
  
  console.log(`   - Location extraction: ${Math.round(avgLocation)}%`);
  console.log(`   - Company type extraction: ${Math.round(avgCompanyType)}%`);
  console.log(`   - Funding amount extraction: ${Math.round(avgFundingAmount)}%`);
  console.log(`   - Average categories per program: ${Math.round(avgCategories)}`);
  
  // Response time analysis
  const avgResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;
  console.log(`\n⏱️  Average response time: ${Math.round(avgResponseTime / 1000)}s`);
  
  // Complexity reduction recommendations
  console.log('\n\n');
  console.log('='.repeat(80));
  console.log('💡 RECOMMENDATIONS: How to Reduce Complexity');
  console.log('='.repeat(80));
  
  console.log('\n1. CRITICAL QUESTIONS (Must Keep):');
  console.log('   ✅ location - 100% needed for matching');
  console.log('   ✅ company_type - Critical for filtering');
  console.log('   ✅ funding_amount - Essential for relevance');
  
  console.log('\n2. IMPORTANT QUESTIONS (Keep but Simplify):');
  console.log('   ⚠️  company_stage - Important but complex (months vs stages)');
  console.log('   ⚠️  industry_focus - Useful but can be optional');
  
  console.log('\n3. OPTIONAL QUESTIONS (Consider Removing):');
  console.log('   ❓ revenue_status - Low impact, can infer from stage');
  console.log('   ❓ project_duration - Rarely used in matching');
  console.log('   ❓ deadline_urgency - Not used in matching');
  console.log('   ❓ impact - Nice to have but not critical');
  console.log('   ❓ use_of_funds - Can be inferred from industry');
  console.log('   ❓ co_financing - Important but can be optional');
  console.log('   ❓ team_size - Low impact on matching');
  console.log('   ❓ legal_type - Rarely used in matching');
  
  console.log('\n4. SIMPLIFICATION SUGGESTIONS:');
  console.log('   📝 Reduce minimum questions from 6 to 4 (location, company_type, funding_amount, company_stage)');
  console.log('   📝 Make industry_focus optional (default to "all industries")');
  console.log('   📝 Remove or make optional: revenue_status, project_duration, deadline_urgency');
  console.log('   📝 Simplify company_stage: Use simple stages (idea, early, growth, mature) instead of months');
  console.log('   📝 Remove location_region text input - just use main location');
  
  console.log('\n5. MATCHING IMPROVEMENTS:');
  if (zeroResults.length > 0) {
    console.log('   ⚠️  Lower threshold further or improve pre-founder/early-stage matching');
    console.log('   ⚠️  Add better fallback for large funding amounts (€1M+)');
    console.log('   ⚠️  Improve EU location matching');
  }
  
  console.log('\n');
}

async function main() {
  console.log('🧪 Testing 5 Maximally Diverse Personas');
  console.log('Checking: Result diversity, extraction quality, complexity analysis\n');
  
  const results: TestResult[] = [];
  
  for (let i = 0; i < personas.length; i++) {
    const persona = personas[i];
    console.log('\n' + '='.repeat(80));
    console.log(`PERSONA ${i + 1}: ${persona.name}`);
    console.log('='.repeat(80));
    console.log(`Description: ${persona.description}`);
    console.log(`Answers: ${Object.keys(persona.answers).length} fields provided`);
    
    const result = await testPersona(persona);
    results.push(result);
    
    console.log(`\n✅ Results: ${result.programCount} programs`);
    console.log(`⏱️  Response time: ${Math.round(result.responseTime / 1000)}s`);
    console.log(`📊 Source: ${result.source}`);
    console.log(`📈 Extraction quality:`);
    console.log(`   - Location: ${result.extractionQuality.hasLocation}%`);
    console.log(`   - Company Type: ${result.extractionQuality.hasCompanyType}%`);
    console.log(`   - Funding Amount: ${result.extractionQuality.hasFundingAmount}%`);
    console.log(`   - Avg Categories: ${result.extractionQuality.categoryCount}`);
    
    // Wait between requests to avoid rate limiting
    if (i < personas.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  // Final analysis
  analyzeResults(results);
  
  console.log('\n✅ Test complete!\n');
}

main().catch(console.error);

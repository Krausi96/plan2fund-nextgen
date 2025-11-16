/**
 * Test Script: Multiple Personas Testing
 * Tests 5 different user personas to check for:
 * - Result diversity
 * - Question bias
 * - Requirement flaws
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

// Define 15+ diverse Austrian personas covering all scenarios
const personas: Persona[] = [
  {
    name: "Early Stage Startup (Vienna, Digital)",
    description: "New startup in Vienna, digital focus, pre-revenue, needs seed funding",
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
      project_duration: 12, // 12 months
      deadline_urgency: 3, // 3 months
    }
  },
  {
    name: "Growth Stage Startup (Vienna, Multi-Industry)",
    description: "Growth stage startup in Vienna, multiple industries, needs scale funding",
    answers: {
      location: 'austria',
      location_region: 'vienna',
      company_type: 'startup',
      company_stage: 18, // 18 months
      company_stage_classified: 'growth_stage',
      legal_type: 'gmbh',
      funding_amount: 800000, // €800k
      industry_focus: ['digital', 'sustainability', 'health'],
      use_of_funds: ['rd', 'personnel', 'marketing'],
      impact: ['economic', 'environmental', 'social'],
      co_financing: 'co_yes',
      co_financing_percentage: '25%',
      team_size: 12,
      revenue_status: 'early_revenue',
      project_duration: 24, // 24 months
      deadline_urgency: 6, // 6 months
    }
  },
  {
    name: "Pre-Founder (Solo, Idea Stage)",
    description: "Pre-incorporation, solo founder, idea stage, needs initial funding",
    answers: {
      location: 'austria',
      company_type: 'prefounder',
      company_stage: -6, // -6 months (pre-incorporation)
      company_stage_classified: 'pre_company',
      legal_type: 'einzelunternehmer',
      funding_amount: 50000, // €50k
      industry_focus: ['digital'],
      use_of_funds: ['rd'],
      impact: ['economic'],
      co_financing: 'co_no',
      team_size: 1,
      revenue_status: 'pre_revenue',
      project_duration: 6, // 6 months
      deadline_urgency: 1, // 1 month
    }
  },
  {
    name: "SME Manufacturing (Vienna, €200k-€500k)",
    description: "Established SME in Vienna, manufacturing, needs growth capital",
    answers: {
      location: 'austria',
      location_region: 'vienna',
      company_type: 'sme',
      company_stage: 60, // 60 months (5 years)
      company_stage_classified: 'mature',
      legal_type: 'gmbh',
      funding_amount: 350000, // €350k
      industry_focus: ['manufacturing'],
      use_of_funds: ['equipment', 'working_capital'],
      impact: ['economic', 'environmental'],
      co_financing: 'co_yes',
      co_financing_percentage: '30%',
      team_size: 25,
      revenue_status: 'growing_revenue',
      project_duration: 36, // 36 months
      deadline_urgency: 12, // 12 months
    }
  },
  {
    name: "Research Institution (University, Sustainability)",
    description: "University research project, sustainability focus, Austria",
    answers: {
      location: 'austria',
      company_type: 'research',
      company_stage: 0, // Not applicable
      company_stage_classified: 'research_org',
      legal_type: 'verein',
      funding_amount: 500000, // €500k
      industry_focus: ['sustainability'],
      use_of_funds: ['rd', 'equipment'],
      impact: ['environmental', 'social'],
      co_financing: 'co_uncertain',
      team_size: 8,
      revenue_status: 'not_applicable',
      project_duration: 48, // 48 months
      deadline_urgency: 6, // 6 months
    }
  },
  {
    name: "Early Stage Startup (Tyrol, Digital)",
    description: "New startup in Tyrol, digital focus, needs seed funding",
    answers: {
      location: 'austria',
      location_region: 'tyrol',
      company_type: 'startup',
      company_stage: 6, // 6 months
      company_stage_classified: 'early_stage',
      legal_type: 'gmbh',
      funding_amount: 150000, // €150k
      industry_focus: ['digital'],
      use_of_funds: ['rd', 'personnel'],
      impact: ['economic'],
      co_financing: 'co_no',
      team_size: 3,
      revenue_status: 'pre_revenue',
      project_duration: 12, // 12 months
      deadline_urgency: 3, // 3 months
    }
  },
  {
    name: "SME (Salzburg, Manufacturing, €200k-€500k)",
    description: "Established SME in Salzburg, manufacturing, needs equipment funding",
    answers: {
      location: 'austria',
      location_region: 'salzburg',
      company_type: 'sme',
      company_stage: 48, // 48 months (4 years)
      company_stage_classified: 'mature',
      legal_type: 'gmbh',
      funding_amount: 400000, // €400k
      industry_focus: ['manufacturing'],
      use_of_funds: ['equipment'],
      impact: ['economic'],
      co_financing: 'co_yes',
      co_financing_percentage: '40%',
      team_size: 20,
      revenue_status: 'growing_revenue',
      project_duration: 24, // 24 months
      deadline_urgency: 6, // 6 months
    }
  },
  {
    name: "Micro Startup (Lower Austria, €5k-€50k)",
    description: "Very early stage startup, minimal funding needed",
    answers: {
      location: 'austria',
      location_region: 'lower austria',
      company_type: 'startup',
      company_stage: 1, // 1 month
      company_stage_classified: 'early_stage',
      legal_type: 'einzelunternehmer',
      funding_amount: 25000, // €25k
      industry_focus: ['digital'],
      use_of_funds: ['rd'],
      impact: ['economic'],
      co_financing: 'co_no',
      team_size: 1,
      revenue_status: 'pre_revenue',
      project_duration: 6, // 6 months
      deadline_urgency: 2, // 2 months
    }
  },
  {
    name: "Scale-Up (Vienna, €1M-€2M)",
    description: "Mature startup, needs large-scale funding for expansion",
    answers: {
      location: 'austria',
      location_region: 'vienna',
      company_type: 'startup',
      company_stage: 36, // 36 months (3 years)
      company_stage_classified: 'mature',
      legal_type: 'gmbh',
      funding_amount: 1500000, // €1.5M
      industry_focus: ['digital', 'health'],
      use_of_funds: ['personnel', 'marketing', 'equipment'],
      impact: ['economic', 'social'],
      co_financing: 'co_yes',
      co_financing_percentage: '20%',
      team_size: 30,
      revenue_status: 'growing_revenue',
      project_duration: 36, // 36 months
      deadline_urgency: 12, // 12 months
    }
  },
  {
    name: "Research Institution (Vienna, Health)",
    description: "University research project in Vienna, health focus",
    answers: {
      location: 'austria',
      location_region: 'vienna',
      company_type: 'research',
      company_stage: 0, // Not applicable
      company_stage_classified: 'research_org',
      legal_type: 'verein',
      funding_amount: 750000, // €750k
      industry_focus: ['health'],
      use_of_funds: ['rd', 'equipment'],
      impact: ['social', 'economic'],
      co_financing: 'co_yes',
      co_financing_percentage: '30%',
      team_size: 15,
      revenue_status: 'not_applicable',
      project_duration: 48, // 48 months
      deadline_urgency: 6, // 6 months
    }
  },
  {
    name: "SME (Styria, Sustainability, €100k-€200k)",
    description: "SME in Styria, sustainability focus, needs green funding",
    answers: {
      location: 'austria',
      location_region: 'styria',
      company_type: 'sme',
      company_stage: 30, // 30 months (2.5 years)
      company_stage_classified: 'mature',
      legal_type: 'gmbh',
      funding_amount: 150000, // €150k
      industry_focus: ['sustainability'],
      use_of_funds: ['equipment', 'rd'],
      impact: ['environmental', 'economic'],
      co_financing: 'co_yes',
      co_financing_percentage: '25%',
      team_size: 15,
      revenue_status: 'early_revenue',
      project_duration: 24, // 24 months
      deadline_urgency: 6, // 6 months
    }
  },
  {
    name: "Early Stage Startup (Upper Austria, Manufacturing)",
    description: "New startup in Upper Austria, manufacturing focus",
    answers: {
      location: 'austria',
      location_region: 'upper austria',
      company_type: 'startup',
      company_stage: 4, // 4 months
      company_stage_classified: 'early_stage',
      legal_type: 'gmbh',
      funding_amount: 200000, // €200k
      industry_focus: ['manufacturing'],
      use_of_funds: ['equipment', 'rd'],
      impact: ['economic', 'environmental'],
      co_financing: 'co_no',
      team_size: 4,
      revenue_status: 'pre_revenue',
      project_duration: 18, // 18 months
      deadline_urgency: 4, // 4 months
    }
  },
  {
    name: "Growth Stage Startup (Carinthia, Digital)",
    description: "Growth stage startup in Carinthia, digital focus",
    answers: {
      location: 'austria',
      location_region: 'carinthia',
      company_type: 'startup',
      company_stage: 24, // 24 months (2 years)
      company_stage_classified: 'growth_stage',
      legal_type: 'gmbh',
      funding_amount: 600000, // €600k
      industry_focus: ['digital'],
      use_of_funds: ['personnel', 'marketing'],
      impact: ['economic'],
      co_financing: 'co_yes',
      co_financing_percentage: '20%',
      team_size: 10,
      revenue_status: 'early_revenue',
      project_duration: 24, // 24 months
      deadline_urgency: 6, // 6 months
    }
  },
  {
    name: "SME (Vorarlberg, €500k-€1M)",
    description: "Established SME in Vorarlberg, needs large funding",
    answers: {
      location: 'austria',
      location_region: 'vorarlberg',
      company_type: 'sme',
      company_stage: 72, // 72 months (6 years)
      company_stage_classified: 'mature',
      legal_type: 'gmbh',
      funding_amount: 750000, // €750k
      industry_focus: ['manufacturing', 'digital'],
      use_of_funds: ['equipment', 'working_capital', 'personnel'],
      impact: ['economic'],
      co_financing: 'co_yes',
      co_financing_percentage: '35%',
      team_size: 40,
      revenue_status: 'growing_revenue',
      project_duration: 36, // 36 months
      deadline_urgency: 12, // 12 months
    }
  },
  {
    name: "Pre-Founder (Burgenland, Idea Stage)",
    description: "Pre-incorporation founder in Burgenland, idea stage",
    answers: {
      location: 'austria',
      location_region: 'burgenland',
      company_type: 'prefounder',
      company_stage: -3, // -3 months (pre-incorporation)
      company_stage_classified: 'pre_company',
      legal_type: 'einzelunternehmer',
      funding_amount: 30000, // €30k
      industry_focus: ['sustainability'],
      use_of_funds: ['rd'],
      impact: ['environmental'],
      co_financing: 'co_no',
      team_size: 1,
      revenue_status: 'pre_revenue',
      project_duration: 6, // 6 months
      deadline_urgency: 1, // 1 month
    }
  },
  {
    name: "Research Institution (EU, Sustainability, €2M+)",
    description: "Large EU research project, sustainability focus, needs major funding",
    answers: {
      location: 'eu',
      company_type: 'research',
      company_stage: 0, // Not applicable
      company_stage_classified: 'research_org',
      legal_type: 'verein',
      funding_amount: 2000000, // €2M
      industry_focus: ['sustainability'],
      use_of_funds: ['rd', 'equipment', 'personnel'],
      impact: ['environmental', 'social', 'economic'],
      co_financing: 'co_yes',
      co_financing_percentage: '40%',
      team_size: 25,
      revenue_status: 'not_applicable',
      project_duration: 60, // 60 months
      deadline_urgency: 12, // 12 months
    }
  }
];

async function testPersona(persona: Persona, index: number): Promise<any> {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`PERSONA ${index + 1}: ${persona.name}`);
  console.log('='.repeat(80));
  console.log(`Description: ${persona.description}`);
  console.log(`Answers:`, JSON.stringify(persona.answers, null, 2));
  
  const apiUrl = process.env.API_URL || 'http://localhost:3000';
  const endpoint = `${apiUrl}/api/programs/recommend`;

  try {
    const startTime = Date.now();
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        answers: persona.answers,
        max_results: 20,
        extract_all: false,
        use_seeds: false,
      }),
    });

    const duration = Date.now() - startTime;
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Error: ${response.status} - ${errorText.substring(0, 200)}`);
      return { persona: persona.name, error: true, programs: [] };
    }

    const data = await response.json();
    const programs = data.programs || [];
    
    console.log(`\n📊 Results:`);
    console.log(`  Status: ${response.status} OK`);
    console.log(`  Response Time: ${duration}ms`);
    console.log(`  Programs Generated: ${programs.length}`);
    console.log(`  Source: ${data.source}`);
    
    if (programs.length > 0) {
      console.log(`\n📋 Programs:`);
      programs.forEach((p: any, idx: number) => {
        console.log(`  ${idx + 1}. ${p.name || 'Unnamed'}`);
        console.log(`     Type: ${p.type || p.program_type || 'N/A'}`);
        console.log(`     Funding: €${p.metadata?.funding_amount_min || 0} - €${p.metadata?.funding_amount_max || 0}`);
        console.log(`     Location: ${p.metadata?.region || p.categorized_requirements?.geographic?.[0]?.value || 'N/A'}`);
        const reqCategories = p.categorized_requirements || {};
        const categoryCount = Object.keys(reqCategories).length;
        console.log(`     Requirements: ${categoryCount} categories`);
        if (categoryCount > 0) {
          const categoryList = Object.keys(reqCategories).slice(0, 5).join(', ');
          console.log(`     Categories: ${categoryList}${categoryCount > 5 ? '...' : ''}`);
        }
      });
    } else {
      console.log(`  ⚠️  No programs generated`);
    }

    return {
      persona: persona.name,
      description: persona.description,
      answers: persona.answers,
      responseTime: duration,
      programCount: programs.length,
      programs: programs.map((p: any) => ({
        name: p.name,
        type: p.type || p.program_type,
        funding: `${p.metadata?.funding_amount_min || 0}-${p.metadata?.funding_amount_max || 0}`,
        location: p.metadata?.region || p.categorized_requirements?.geographic?.[0]?.value,
        categories: Object.keys(p.categorized_requirements || {}).length,
        categorized_requirements: p.categorized_requirements || {},
        metadata: p.metadata || {},
      })),
      source: data.source,
    };
  } catch (error: any) {
    console.error(`❌ Error: ${error.message}`);
    return { persona: persona.name, error: true, programs: [] };
  }
}

async function analyzeResults(results: any[]) {
  console.log(`\n\n${'='.repeat(80)}`);
  console.log('ANALYSIS: Result Diversity & Potential Issues');
  console.log('='.repeat(80));

  // Check result diversity
  const allProgramNames = new Set<string>();
  results.forEach(r => {
    if (r.programs) {
      r.programs.forEach((p: any) => allProgramNames.add(p.name));
    }
  });

  console.log(`\n📊 Diversity Analysis:`);
  console.log(`  Total unique programs across all personas: ${allProgramNames.size}`);
  console.log(`  Average programs per persona: ${(results.reduce((sum, r) => sum + (r.programCount || 0), 0) / results.length).toFixed(1)}`);
  
  // Program overlap analysis
  const programCounts: Record<string, number> = {};
  results.forEach(r => {
    if (r.programs) {
      r.programs.forEach((p: any) => {
        programCounts[p.name] = (programCounts[p.name] || 0) + 1;
      });
    }
  });

  console.log(`\n🔄 Program Overlap:`);
  const overlapping = Object.entries(programCounts).filter(([_, count]) => count > 1);
  if (overlapping.length > 0) {
    console.log(`  Programs appearing in multiple personas:`);
    overlapping.forEach(([name, count]) => {
      console.log(`    - ${name}: appears in ${count} personas`);
    });
  } else {
    console.log(`  ✅ Good diversity - no programs overlap`);
  }

  // Check for bias issues
  console.log(`\n⚠️  Potential Issues & Bias:`);
  
  // 1. Check if all personas get similar results
  const programCountsArray = results.map(r => r.programCount || 0);
  const minPrograms = Math.min(...programCountsArray);
  const maxPrograms = Math.max(...programCountsArray);
  if (maxPrograms - minPrograms > 3) {
    console.log(`  ⚠️  Inconsistent result counts: ${minPrograms}-${maxPrograms} programs`);
    console.log(`     Some personas get significantly more/fewer results`);
  }

  // 2. Check location bias
  const locationResults = results.map(r => ({
    persona: r.persona,
    location: r.answers?.location,
    programs: r.programs?.map((p: any) => p.location).filter(Boolean) || [],
  }));
  
  const locationMismatches = locationResults.filter(r => {
    if (!r.location || r.programs.length === 0) return false;
    return !r.programs.some(loc => 
      loc.toLowerCase().includes(r.location.toLowerCase()) ||
      (r.location === 'austria' && loc.toLowerCase().includes('österreich'))
    );
  });
  
  if (locationMismatches.length > 0) {
    console.log(`  ⚠️  Location mismatch detected:`);
    locationMismatches.forEach(m => {
      console.log(`     ${m.persona} (${m.location}) got programs for: ${m.programs.join(', ')}`);
    });
  }

  // 3. Check company type bias
  const typeResults = results.map(r => ({
    persona: r.persona,
    companyType: r.answers?.company_type,
    programs: r.programs?.map((p: any) => p.type).filter(Boolean) || [],
  }));
  
  console.log(`\n  Company Type Matching:`);
  typeResults.forEach(r => {
    console.log(`    ${r.persona}: ${r.companyType} → ${r.programs.length} programs`);
  });

  // 4. Check funding amount matching
  console.log(`\n  Funding Amount Matching:`);
  results.forEach(r => {
    const requested = r.answers?.funding_amount;
    const programs = r.programs || [];
    const matching = programs.filter((p: any) => {
      const [min, max] = p.funding.split('-').map((n: string) => parseInt(n));
      return requested && min <= requested && requested <= max;
    });
    console.log(`    ${r.persona}: €${requested} → ${matching.length}/${programs.length} programs match amount`);
  });

  // 5. Extraction quality analysis
  console.log(`\n📊 Extraction Quality Analysis:`);
  const allPrograms = results.flatMap(r => r.programs || []);
  const expectedCategories = [
    'geographic', 'eligibility', 'financial', 'project', 'funding_details',
    'timeline', 'team', 'impact', 'application', 'documentation',
    'evaluation', 'reporting', 'compliance', 'other', 'metadata'
  ];
  
  const categoryCoverage: Record<string, number> = {};
  expectedCategories.forEach(cat => {
    categoryCoverage[cat] = allPrograms.filter(p => 
      p.categorized_requirements && p.categorized_requirements[cat]
    ).length;
  });
  
  console.log(`  Category Coverage (${allPrograms.length} total programs):`);
  Object.entries(categoryCoverage)
    .sort(([, a], [, b]) => b - a)
    .forEach(([cat, count]) => {
      const percentage = allPrograms.length > 0 ? (count / allPrograms.length * 100).toFixed(0) : '0';
      console.log(`    ${cat}: ${count}/${allPrograms.length} (${percentage}%)`);
    });
  
  // Check critical fields
  const criticalFields = {
    location: allPrograms.filter(p => 
      p.categorized_requirements?.geographic || p.metadata?.region
    ).length,
    company_type: allPrograms.filter(p => 
      p.categorized_requirements?.eligibility?.some((r: any) => r.type === 'company_type')
    ).length,
    funding_amount: allPrograms.filter(p => 
      p.metadata?.funding_amount_min || p.metadata?.funding_amount_max
    ).length,
  };
  
  console.log(`\n  Critical Fields Extraction:`);
  Object.entries(criticalFields).forEach(([field, count]) => {
    const percentage = allPrograms.length > 0 ? (count / allPrograms.length * 100).toFixed(0) : '0';
    const status = count === allPrograms.length ? '✅' : count > allPrograms.length * 0.8 ? '⚠️' : '❌';
    console.log(`    ${status} ${field}: ${count}/${allPrograms.length} (${percentage}%)`);
  });

  // 6. Question requirement analysis
  console.log(`\n📋 Question Analysis:`);
  const allAnswers = results.map(r => Object.keys(r.answers || {})).flat();
  const answerFrequency: Record<string, number> = {};
  allAnswers.forEach(key => {
    answerFrequency[key] = (answerFrequency[key] || 0) + 1;
  });
  
  console.log(`  Questions answered across personas:`);
  Object.entries(answerFrequency)
    .sort(([, a], [, b]) => b - a)
    .forEach(([key, count]) => {
      const percentage = (count / results.length * 100).toFixed(0);
      console.log(`    ${key}: ${count}/${results.length} (${percentage}%)`);
    });

  // 7. Missing answers analysis
  const allQuestionKeys = [
    'location', 'company_type', 'company_stage', 'funding_amount',
    'industry_focus', 'use_of_funds', 'impact', 'co_financing',
    'team_size', 'revenue_status', 'project_duration', 'deadline_urgency'
  ];
  
  console.log(`\n  Missing Answers (potential optional questions):`);
  allQuestionKeys.forEach(key => {
    const answered = results.filter(r => r.answers?.[key] !== undefined).length;
    if (answered < results.length) {
      console.log(`    ${key}: ${answered}/${results.length} answered (${results.length - answered} missing)`);
    }
  });
}

async function testAllPersonas() {
  console.log(`🧪 Testing ${personas.length} Different Personas`);
  console.log('Checking for result diversity, bias, extraction quality, and question flaws\n');

  const results: any[] = [];
  
  for (let i = 0; i < personas.length; i++) {
    const result = await testPersona(personas[i], i);
    results.push(result);
    
    // Wait between requests to avoid rate limiting
    if (i < personas.length - 1) {
      console.log(`\n⏳ Waiting 5 seconds before next persona...`);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }

  // Analyze results
  await analyzeResults(results);

  // Summary
  console.log(`\n\n${'='.repeat(80)}`);
  console.log('SUMMARY');
  console.log('='.repeat(80));
  console.log(`✅ Tested ${personas.length} personas`);
  const totalPrograms = results.reduce((sum, r) => sum + (r.programCount || 0), 0);
  console.log(`✅ Total programs generated: ${totalPrograms}`);
  console.log(`✅ Average programs per persona: ${(totalPrograms / personas.length).toFixed(1)}`);
  console.log(`✅ Unique programs: ${new Set(results.flatMap(r => r.programs?.map((p: any) => p.name) || [])).size}`);
  
  // Personas with 0 results
  const zeroResults = results.filter(r => (r.programCount || 0) === 0);
  if (zeroResults.length > 0) {
    console.log(`\n⚠️  Personas with 0 results (${zeroResults.length}):`);
    zeroResults.forEach(r => {
      console.log(`  - ${r.persona}`);
    });
  }
  
  // Personas with many results
  const manyResults = results.filter(r => (r.programCount || 0) >= 10);
  if (manyResults.length > 0) {
    console.log(`\n✅ Personas with 10+ results (${manyResults.length}):`);
    manyResults.forEach(r => {
      console.log(`  - ${r.persona}: ${r.programCount} programs`);
    });
  }
  
  console.log(`\n📊 Results per persona:`);
  results.forEach(r => {
    const status = (r.programCount || 0) === 0 ? '❌' : (r.programCount || 0) < 3 ? '⚠️' : '✅';
    console.log(`  ${status} ${r.persona}: ${r.programCount || 0} programs (${r.responseTime || 0}ms)`);
  });
}

// Run tests
testAllPersonas().catch(console.error);


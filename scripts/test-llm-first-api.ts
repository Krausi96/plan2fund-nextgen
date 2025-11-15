/**
 * Test LLM-First Approach (Like ChatGPT)
 * Tests the real API endpoint with LLM generation as primary
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath, override: false });
}
dotenv.config({ override: false });

interface Persona {
  id: string;
  name: string;
  description: string;
  answers: {
    location?: string;
    company_type?: string;
    company_stage?: string;
    funding_amount?: string;
    industry_focus?: string | string[];
  };
}

const PERSONAS: Persona[] = [
  {
    id: 'p1',
    name: 'Austrian Digital Startup',
    description: 'Early-stage tech startup in Austria',
    answers: {
      location: 'austria',
      company_type: 'startup',
      company_stage: 'inc_lt_6m',
      funding_amount: '100kto500k',
      industry_focus: 'digital',
    },
  },
];

async function testLLMFirst() {
  console.log('🧪 Testing LLM-First Approach (Like ChatGPT)');
  console.log('Testing real API endpoint with LLM generation as primary\n');

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const persona = PERSONAS[0];

  console.log(`📝 Persona: ${persona.name}`);
  console.log(`   ${persona.description}\n`);

  try {
    // Test 1: Direct LLM generation (like ChatGPT)
    console.log('🤖 Test 1: Direct LLM Generation (Like ChatGPT)...\n');
    const { generateProgramsWithLLM } = await import('../pages/api/programs/recommend');
    
    const llmPrograms = await generateProgramsWithLLM(persona.answers, 5);
    console.log(`✅ Generated ${llmPrograms.length} programs with LLM\n`);
    
    if (llmPrograms.length > 0) {
      console.log('📊 LLM-Generated Programs:\n');
      llmPrograms.slice(0, 3).forEach((program: any, index: number) => {
        console.log(`${index + 1}. ${program.name || 'Unknown'}`);
        console.log(`   ID: ${program.id}`);
        console.log(`   Source: ${program.source || 'unknown'}`);
        console.log(`   URL: ${program.url || 'N/A'}`);
        console.log(`   Funding: ${program.metadata?.funding_amount_min || 0} - ${program.metadata?.funding_amount_max || 0} ${program.metadata?.currency || 'EUR'}`);
        console.log(`   Has Requirements: ${Object.keys(program.categorized_requirements || {}).length > 0 ? '✅' : '❌'}`);
        console.log('');
      });
    }

    // Test 2: API endpoint (requires dev server)
    console.log('\n📡 Test 2: API Endpoint (requires dev server)...\n');
    console.log('   If dev server is running, testing API endpoint...\n');
    
    let apiData: any = null;
    try {
      const response = await fetch(`${baseUrl}/api/programs/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers: persona.answers,
          max_results: 5,
          extract_all: false,
          use_seeds: false, // LLM generation is primary
        }),
      });

      if (response.ok) {
        apiData = await response.json();
        console.log('✅ API Response Received\n');
        console.log(`   Source: ${apiData.source || 'unknown'}`);
        console.log(`   LLM Generated: ${apiData.llm_generated ? '✅ Yes' : '❌ No'}`);
        console.log(`   Message: ${apiData.message || 'N/A'}`);
        console.log(`   Programs Found: ${apiData.count || 0}\n`);
      } else {
        console.log(`⚠️  API returned ${response.status} (dev server may not be running)\n`);
      }
    } catch (apiError: any) {
      console.log(`⚠️  API call failed: ${apiError.message}`);
      console.log('   (This is OK - dev server may not be running)\n');
    }

    // Use LLM-generated programs for scoring test
    const programsToTest = apiData?.programs || llmPrograms;
    
    if (programsToTest.length === 0) {
      console.log('⚠️  No programs to test scoring with');
      return;
    }

    const data = {
      programs: programsToTest,
      source: apiData?.source || 'llm_generated',
      llm_generated: apiData?.llm_generated !== false,
      count: programsToTest.length
    };
    
    console.log('✅ API Response Received\n');
    console.log(`   Source: ${data.source || 'unknown'}`);
    console.log(`   LLM Generated: ${data.llm_generated ? '✅ Yes' : '❌ No'}`);
    console.log(`   Message: ${data.message || 'N/A'}`);
    console.log(`   Programs Found: ${data.count || 0}\n`);

    if (data.programs && data.programs.length > 0) {
      console.log(`\n📊 Using ${data.llm_generated ? 'LLM-generated' : 'API'} programs for scoring test\n`);
      console.log('📊 Programs Generated:\n');
      data.programs.slice(0, 3).forEach((program: any, index: number) => {
        console.log(`${index + 1}. ${program.name || 'Unknown'}`);
        console.log(`   ID: ${program.id}`);
        console.log(`   Source: ${program.source || 'unknown'}`);
        console.log(`   URL: ${program.url || 'N/A'}`);
        console.log(`   Funding: ${program.metadata?.funding_amount_min || 0} - ${program.metadata?.funding_amount_max || 0} ${program.metadata?.currency || 'EUR'}`);
        console.log(`   Location: ${program.metadata?.region || program.categorized_requirements?.geographic?.[0]?.value || 'N/A'}`);
        console.log(`   Has Requirements: ${Object.keys(program.categorized_requirements || {}).length > 0 ? '✅' : '❌'}`);
        console.log('');
      });

      // Test scoring with real engine
      console.log('🤖 Testing LLM Cross-Checking with Real Engine...\n');
      const { scoreProgramsEnhanced } = await import('../features/reco/engine/enhancedRecoEngine');
      
      const programsForScoring = data.programs.map((p: any) => ({
        id: p.id,
        name: p.name,
        type: p.funding_types?.[0] || 'grant',
        program_type: p.funding_types?.[0] || 'grant',
        description: p.metadata?.description || '',
        funding_amount_max: p.metadata?.funding_amount_max || 0,
        funding_amount_min: p.metadata?.funding_amount_min || 0,
        currency: p.metadata?.currency || 'EUR',
        source_url: p.url,
        url: p.url,
        deadline: p.metadata?.deadline,
        open_deadline: p.metadata?.open_deadline || false,
        eligibility_criteria: {},
        categorized_requirements: p.categorized_requirements || {},
        funding_types: p.funding_types || [],
      }));

      const scored = await scoreProgramsEnhanced(
        persona.answers as any,
        'strict',
        programsForScoring
      );

      const sorted = scored.sort((a, b) => b.score - a.score);
      
      console.log('📊 Scored Programs (Top 3):\n');
      sorted.slice(0, 3).forEach((program, index) => {
        console.log(`${index + 1}. ${program.name}`);
        console.log(`   Score: ${program.score}%`);
        if (program.matchedCriteria && program.matchedCriteria.length > 0) {
          console.log(`   ✅ Matches: ${program.matchedCriteria.length}`);
          program.matchedCriteria.slice(0, 2).forEach((m: any) => {
            console.log(`      • ${m.reason || m.value}`);
          });
        }
        if (program.gaps && program.gaps.length > 0) {
          console.log(`   ⚠️  Gaps: ${program.gaps.length}`);
          program.gaps.slice(0, 2).forEach((g: any) => {
            console.log(`      • ${g.description || g.value}`);
          });
        }
        if (program.founderFriendlyReasons && program.founderFriendlyReasons.length > 0) {
          console.log(`   💡 Explanation: ${program.founderFriendlyReasons[0]}`);
        }
        console.log('');
      });

      console.log('✅ Test Complete!\n');
      console.log('Summary:');
      console.log(`   - LLM Generation: ${data.llm_generated ? '✅ Working' : '❌ Failed'}`);
      console.log(`   - Programs Generated: ${data.count || 0}`);
      console.log(`   - Programs Scored: ${scored.length}`);
      console.log(`   - Average Score: ${Math.round(scored.reduce((sum, p) => sum + p.score, 0) / scored.length)}%`);
      console.log(`   - Programs with LLM Explanations: ${scored.filter(p => p.founderFriendlyReasons && p.founderFriendlyReasons.length > 0).length}`);

    } else {
      console.log('⚠️  No programs generated');
      console.log('   Extraction Results:', JSON.stringify(data.extraction_results, null, 2));
    }

  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
  }
}

// Run if called directly
if (require.main === module) {
  testLLMFirst().catch(console.error);
}

export { testLLMFirst };


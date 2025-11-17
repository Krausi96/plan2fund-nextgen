/**
 * Test a single persona to debug 0 results issue
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
  location_region?: string;
  [key: string]: any;
}

// Test Persona 1: Early-Stage Startup (getting 0 results)
const persona: UserAnswers = {
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
};

async function testPersona() {
  console.log('🧪 Testing Early-Stage Startup Persona');
  console.log('📋 Answers:', JSON.stringify(persona, null, 2));
  console.log('\n');
  
  const startTime = Date.now();
  
  try {
    const response = await fetch('http://localhost:3000/api/programs/recommend', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        answers: persona,
        max_results: 20,
        extract_all: false,
        use_seeds: false, // Disable seeds to focus on LLM generation
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const responseTime = Date.now() - startTime;

    console.log('\n📊 RESULTS:');
    console.log(`✅ Programs found: ${data.programs?.length || 0}`);
    console.log(`⏱️  Response time: ${Math.round(responseTime / 1000)}s`);
    console.log(`📊 Source: ${data.source || 'unknown'}`);
    console.log(`📝 Message: ${data.message || 'N/A'}`);
    
    if (data.extraction_results && data.extraction_results.length > 0) {
      console.log('\n📋 Extraction Results:');
      data.extraction_results.forEach((result: any, index: number) => {
        console.log(`  ${index + 1}. ${JSON.stringify(result, null, 2)}`);
        if (result.error) {
          console.log(`     ❌ ERROR: ${result.error}`);
        }
        if (result.details) {
          console.log(`     📋 Details: ${JSON.stringify(result.details, null, 2)}`);
        }
      });
    }
    
    // Check if there's an error in the response
    if (data.error) {
      console.log(`\n❌ API ERROR: ${data.error}`);
      console.log(`   Message: ${data.message || 'N/A'}`);
    }
    
    if (data.programs && data.programs.length > 0) {
      console.log('\n📋 Programs:');
      data.programs.forEach((program: any, index: number) => {
        console.log(`\n  ${index + 1}. ${program.name || 'Unnamed'}`);
        console.log(`     - Source: ${program.source || 'unknown'}`);
        console.log(`     - Institution: ${program.institution_id || 'N/A'}`);
        console.log(`     - Funding: ${program.metadata?.funding_amount_min || 'N/A'} - ${program.metadata?.funding_amount_max || 'N/A'}`);
        console.log(`     - Categories: ${Object.keys(program.categorized_requirements || {}).length}`);
      });
    } else {
      console.log('\n❌ NO PROGRAMS FOUND');
      console.log('This is the issue we need to debug!');
    }
    
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    console.error(`\n❌ Error:`, error.message);
    console.error(`⏱️  Response time: ${Math.round(responseTime / 1000)}s`);
  }
}

testPersona().catch(console.error);


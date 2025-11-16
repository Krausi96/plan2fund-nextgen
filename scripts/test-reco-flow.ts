/**
 * Test Script: Reco Answer Processing Flow
 * Simulates the Q&A process and tests program generation
 * 
 * Usage: npm run test:reco-flow
 * Or: npx tsx scripts/test-reco-flow.ts
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

// Simulate realistic user answers
const testAnswers: UserAnswers = {
  location: 'austria',
  company_type: 'startup',
  company_stage: 12, // 12 months
  company_stage_classified: 'launch_stage',
  legal_type: 'gmbh',
  funding_amount: 500000, // €500k
  industry_focus: ['digital', 'sustainability'],
  use_of_funds: ['rd', 'personnel'],
  impact: ['economic', 'environmental'],
  co_financing: 'co_yes',
  co_financing_percentage: '30%',
  team_size: 5,
  revenue_status: 'pre_revenue',
  project_duration: 24, // 24 months
  deadline_urgency: 6, // 6 months
};

async function testRecoFlow() {
  console.log('🧪 Testing Reco Answer Processing Flow\n');
  console.log('='.repeat(60));
  console.log('STEP 1: Simulated User Answers');
  console.log('='.repeat(60));
  console.log(JSON.stringify(testAnswers, null, 2));
  console.log('\n');

  const apiUrl = process.env.API_URL || 'http://localhost:3000';
  const endpoint = `${apiUrl}/api/programs/recommend`;

  console.log('='.repeat(60));
  console.log('STEP 2: Calling API Endpoint');
  console.log('='.repeat(60));
  console.log(`URL: ${endpoint}`);
  console.log(`Method: POST`);
  console.log(`Body:`, {
    answers: testAnswers,
    max_results: 20,
    extract_all: false,
    use_seeds: false,
  });
  console.log('\n');

  try {
    // Use global fetch (Node 18+) or require node-fetch if needed
    const fetchFn = typeof fetch !== 'undefined' ? fetch : require('node-fetch');
    
    console.log('📡 Sending request...\n');
    const startTime = Date.now();

    const response = await fetchFn(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        answers: testAnswers,
        max_results: 20,
        extract_all: false,
        use_seeds: false,
      }),
    });

    const duration = Date.now() - startTime;
    console.log(`⏱️  Response time: ${duration}ms`);
    console.log(`📊 Status: ${response.status} ${response.statusText}\n`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error Response:');
      console.error(errorText);
      return;
    }

    const data = await response.json();

    console.log('='.repeat(60));
    console.log('STEP 3: API Response');
    console.log('='.repeat(60));
    console.log(`Success: ${data.success}`);
    console.log(`Count: ${data.count}`);
    console.log(`Programs Length: ${data.programs?.length || 0}`);
    console.log(`Source: ${data.source}`);
    console.log(`LLM Generated: ${data.llm_generated}`);
    console.log(`Message: ${data.message}\n`);

    if (data.extraction_results && data.extraction_results.length > 0) {
      console.log('='.repeat(60));
      console.log('STEP 4: Extraction Results');
      console.log('='.repeat(60));
      data.extraction_results.forEach((result: any, index: number) => {
        console.log(`\nResult ${index + 1}:`);
        console.log(`  Source: ${result.source}`);
        if (result.message) console.log(`  Message: ${result.message}`);
        if (result.error) console.log(`  Error: ${result.error}`);
        if (result.details) console.log(`  Details:`, result.details);
      });
      console.log('\n');
    }

    if (data.programs && data.programs.length > 0) {
      console.log('='.repeat(60));
      console.log('STEP 5: Generated Programs');
      console.log('='.repeat(60));
      
      data.programs.forEach((program: any, index: number) => {
        console.log(`\n📋 Program ${index + 1}:`);
        console.log(`  ID: ${program.id}`);
        console.log(`  Name: ${program.name || 'N/A'}`);
        console.log(`  Type: ${program.type || program.program_type || 'N/A'}`);
        console.log(`  URL: ${program.url || program.source_url || 'N/A'}`);
        
        if (program.metadata) {
          console.log(`  Metadata:`);
          if (program.metadata.funding_amount_min || program.metadata.funding_amount_max) {
            console.log(`    Funding: €${program.metadata.funding_amount_min || 0} - €${program.metadata.funding_amount_max || 0}`);
          }
          if (program.metadata.description) {
            console.log(`    Description: ${program.metadata.description.substring(0, 100)}...`);
          }
        }

        if (program.categorized_requirements) {
          const categories = Object.keys(program.categorized_requirements);
          console.log(`  Requirements Categories: ${categories.length}`);
          categories.forEach(cat => {
            const items = program.categorized_requirements[cat];
            if (Array.isArray(items) && items.length > 0) {
              console.log(`    ${cat}: ${items.length} items`);
              // Show first item as example
              if (items[0]) {
                console.log(`      Example: ${items[0].type} = ${items[0].value}`);
              }
            }
          });
        } else {
          console.log(`  Requirements: None extracted`);
        }
      });
    } else {
      console.log('='.repeat(60));
      console.log('STEP 5: No Programs Generated');
      console.log('='.repeat(60));
      console.log('⚠️  No programs were returned from the API.');
      console.log('This could indicate:');
      console.log('  1. LLM is not configured (check OPENAI_API_KEY or CUSTOM_LLM_ENDPOINT)');
      console.log('  2. LLM generation failed (check server logs)');
      console.log('  3. Programs were filtered out by matching logic');
      console.log('  4. API error occurred');
    }

    console.log('\n');
    console.log('='.repeat(60));
    console.log('STEP 6: Testing Scoring (if programs exist)');
    console.log('='.repeat(60));

    if (data.programs && data.programs.length > 0) {
      // Test scoring by calling the scoring function
      // Note: This would require importing the scoring engine
      // For now, we'll just show the programs that would be scored
      console.log(`\n✅ ${data.programs.length} programs ready for scoring`);
      console.log('Scoring would be done in enhancedRecoEngine.ts');
      console.log('Each program would receive a score (0-100) and explanations');
    }

    console.log('\n');
    console.log('='.repeat(60));
    console.log('Test Complete!');
    console.log('='.repeat(60));

  } catch (error: any) {
    console.error('\n❌ Error during test:');
    console.error('Message:', error.message);
    
    if (error.code === 'ECONNREFUSED' || error.message?.includes('fetch failed')) {
      console.error('\n💡 Server Connection Error');
      console.error('The Next.js development server is not running.');
      console.error('\nTo run this test:');
      console.error('  1. Start the server in a separate terminal:');
      console.error('     npm run dev');
      console.error('  2. Wait for "Ready" message');
      console.error('  3. Run this test again:');
      console.error('     npm run test:reco-flow');
      console.error('\nOr set API_URL environment variable:');
      console.error('  API_URL=http://your-server:port npm run test:reco-flow');
    } else {
      console.error('Stack:', error.stack);
    }
    
    process.exit(1);
  }
}

// Run the test
testRecoFlow().catch(console.error);


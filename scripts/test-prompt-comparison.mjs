#!/usr/bin/env node

/**
 * Direct Prompt Comparison Test
 * Tests the exact same prompt through both:
 * 1. Our system (via API)
 * 2. ChatGPT directly (via OpenAI API)
 * 
 * This shows exactly what each system returns for the SAME input
 */

import OpenAI from 'openai';

const DEFAULT_BASE_URL = 'http://localhost:3000';
const baseUrl = (process.env.RECO_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, '');
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY environment variable required');
  process.exit(1);
}

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// Sample test case - you can modify this
const testAnswers = {
  location: 'austria',
  company_type: 'startup',
  company_stage: 'inc_lt_6m',
  funding_amount: 50000,
  industry_focus: ['digital'],
  co_financing: 'co_no',
};

// Build the exact prompt our system uses
function buildOurSystemPrompt(answers) {
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
  
  const fundingPreference = answers.co_financing === 'co_no' 
    ? { allowMix: false }
    : { allowMix: true };
  
  let instructions = `You are an expert on European funding programs.
Return up to 10 programs that match this profile:

${profile.join('\n')}

Rules:
1. Location: Only programs available in the specified location or EU-wide.
2. Compatibility: Company type and stage must match the user.
3. Funding range: Align with user's need (be lenient but relevant).
4. Funding types: Use these primary types (use most specific):
   - Financial: grant, loan, equity, guarantee, subsidy, convertible, venture_capital, angel_investment, crowdfunding
   - Support: coaching, mentoring, networking, acceleration_program
   - Specialized: export_support, innovation_support
   Programs can have multiple types (e.g., ["grant", "coaching"]).
5. Unknown values: Return null but keep the key.
6. Description: 2-3 sentences explaining what the program offers and why it matches the user (location, stage, amount, industry).
7. Requirements: Include in description: co-financing needs, deadlines, key constraints.
8. Metadata: organization (e.g., "FFG", "AWS"), co_financing_required (boolean), co_financing_percentage (number or null), application_deadlines (string or null), typical_timeline (string or null), competitiveness ("high", "medium", "low" or null).

Return JSON only with this exact structure:
{
  "programs": [
    {
      "id": "string",
      "name": "string",
      "website": "https://example.com",
      "funding_types": ["grant","loan"],
      "funding_amount_min": 5000,
      "funding_amount_max": 20000,
      "currency": "EUR",
      "location": "Austria",
      "company_type": "startup",
      "company_stage": "inc_lt_6m",
      "description": "2-3 sentences: what the program offers, why it matches this user (location/stage/amount/industry), and key requirements (co-financing, deadlines)",
      "metadata": {
        "region": "Austria",
        "program_focus": ["digital","innovation"],
        "organization": "FFG",
        "co_financing_required": false,
        "co_financing_percentage": null,
        "application_deadlines": null,
        "typical_timeline": "2-3 months",
        "competitiveness": "medium"
      },
      "categorized_requirements": {}
    }
  ]
}`;

  if (fundingPreference.allowMix) {
    instructions += `\n9. DIVERSITY: Provide a mix of funding types. Include grants AND non-grant options (loans, equity, guarantees) when applicable. Do NOT default to only grants.`;
  } else {
    instructions += `\n9. RESTRICTION: User can only work with grants/subsidies. Do not suggest loans, guarantees, or equity.`;
  }

  return instructions;
}

// Test our system via API
async function testOurSystem(answers) {
  console.log('\n🔵 Testing OUR SYSTEM (via API)...');
  const start = Date.now();
  
  try {
    const response = await fetch(`${baseUrl}/api/programs/recommend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers, max_results: 10 }),
    });
    
    const data = await response.json();
    const duration = Date.now() - start;
    
    console.log(`✅ Success in ${duration}ms`);
    console.log(`📦 Programs returned: ${data.programs?.length || 0}`);
    console.log(`🔄 Fallback used: ${data.debug?.fallbackUsed || false}`);
    if (data.debug?.llmError) {
      console.log(`⚠️  LLM Error: ${data.debug.llmError}`);
    }
    
    return {
      success: response.ok && data.programs && data.programs.length > 0,
      duration,
      programs: data.programs || [],
      raw: data,
    };
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return {
      success: false,
      duration: Date.now() - start,
      programs: [],
      error: error.message,
    };
  }
}

// Test ChatGPT directly with same prompt
async function testChatGPTDirect(answers) {
  console.log('\n🟢 Testing CHATGPT DIRECTLY (same prompt)...');
  const start = Date.now();
  
  try {
    const prompt = buildOurSystemPrompt(answers);
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Return funding programs as JSON only.' },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 4000,
      temperature: 0.2,
    });
    
    const content = completion.choices[0]?.message?.content || '';
    const duration = Date.now() - start;
    
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      console.log(`⚠️  Failed to parse JSON: ${e.message}`);
      console.log(`📄 Raw response preview: ${content.substring(0, 500)}...`);
      return {
        success: false,
        duration,
        programs: [],
        rawContent: content,
        error: 'Failed to parse JSON',
      };
    }
    
    const programs = Array.isArray(parsed?.programs) ? parsed.programs : [];
    
    console.log(`✅ Success in ${duration}ms`);
    console.log(`📦 Programs returned: ${programs.length}`);
    
    return {
      success: true,
      duration,
      programs,
      rawContent: content,
      parsed,
    };
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return {
      success: false,
      duration: Date.now() - start,
      programs: [],
      error: error.message,
    };
  }
}

// Display comparison
function displayComparison(ourResult, chatgptResult, answers) {
  console.log('\n' + '='.repeat(80));
  console.log('📊 COMPARISON RESULTS');
  console.log('='.repeat(80));
  
  console.log('\n📝 Test Input:');
  console.log(JSON.stringify(answers, null, 2));
  
  console.log('\n🔵 OUR SYSTEM:');
  console.log(`   Success: ${ourResult.success ? '✅' : '❌'}`);
  console.log(`   Duration: ${ourResult.duration}ms`);
  console.log(`   Programs: ${ourResult.programs.length}`);
  if (ourResult.programs.length > 0) {
    console.log(`   First 3 programs:`);
    ourResult.programs.slice(0, 3).forEach((p, i) => {
      console.log(`      ${i + 1}. ${p.name || 'Unnamed'}`);
      console.log(`         Types: ${p.funding_types?.join(', ') || 'N/A'}`);
      console.log(`         Org: ${p.metadata?.organization || 'N/A'}`);
      console.log(`         Desc: ${p.metadata?.description?.substring(0, 100) || 'N/A'}...`);
    });
  }
  
  console.log('\n🟢 CHATGPT (Direct):');
  console.log(`   Success: ${chatgptResult.success ? '✅' : '❌'}`);
  console.log(`   Duration: ${chatgptResult.duration}ms`);
  console.log(`   Programs: ${chatgptResult.programs.length}`);
  if (chatgptResult.programs.length > 0) {
    console.log(`   First 3 programs:`);
    chatgptResult.programs.slice(0, 3).forEach((p, i) => {
      console.log(`      ${i + 1}. ${p.name || 'Unnamed'}`);
      console.log(`         Types: ${p.funding_types?.join(', ') || 'N/A'}`);
      console.log(`         Org: ${p.metadata?.organization || 'N/A'}`);
      console.log(`         Desc: ${p.description?.substring(0, 100) || p.metadata?.description?.substring(0, 100) || 'N/A'}...`);
    });
  }
  
  console.log('\n📈 METRICS:');
  console.log(`   Speed: ${ourResult.duration < chatgptResult.duration ? '🔵 Our system' : '🟢 ChatGPT'} is faster (${Math.abs(ourResult.duration - chatgptResult.duration)}ms difference)`);
  console.log(`   Program Count: ${ourResult.programs.length} vs ${chatgptResult.programs.length}`);
  console.log(`   Success: ${ourResult.success && chatgptResult.success ? '✅ Both succeeded' : ourResult.success ? '🔵 Only our system' : chatgptResult.success ? '🟢 Only ChatGPT' : '❌ Both failed'}`);
  
  console.log('\n' + '='.repeat(80));
}

// Main execution
async function main() {
  console.log('🚀 Direct Prompt Comparison Test');
  console.log('='.repeat(80));
  console.log('\nThis test compares:');
  console.log('1. Our system (via /api/programs/recommend)');
  console.log('2. ChatGPT directly (using the EXACT same prompt)');
  console.log('\nBoth use the same prompt structure and rules.\n');
  
  // Test both
  const [ourResult, chatgptResult] = await Promise.all([
    testOurSystem(testAnswers),
    testChatGPTDirect(testAnswers),
  ]);
  
  // Display comparison
  displayComparison(ourResult, chatgptResult, testAnswers);
  
  // Show the prompt used
  console.log('\n📄 PROMPT USED (same for both):');
  console.log('-'.repeat(80));
  const prompt = buildOurSystemPrompt(testAnswers);
  console.log(prompt.substring(0, 1000) + '...\n');
  console.log('(Full prompt is ~' + prompt.length + ' characters)');
  console.log('='.repeat(80) + '\n');
}

main().catch(console.error);





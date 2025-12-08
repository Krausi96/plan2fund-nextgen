/**
 * Test Script: ProgramFinder Recommendations (Reco)
 * 
 * Tests the /api/programs/recommend endpoint to identify issues with:
 * - LLM configuration
 * - API response format
 * - Program generation
 * - Error handling
 */

import dotenv from 'dotenv';
import * as path from 'path';

// Load .env.local first (Next.js convention), then fall back to .env
dotenv.config({ path: path.join(process.cwd(), '.env.local') });
dotenv.config({ path: path.join(process.cwd(), '.env') });

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
const API_ENDPOINT = `${BASE_URL}/api/programs/recommend`;

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  details?: any;
}

const results: TestResult[] = [];

function log(message: string, type: 'info' | 'success' | 'error' | 'warn' = 'info') {
  const prefix = {
    info: 'ℹ️',
    success: '✅',
    error: '❌',
    warn: '⚠️'
  }[type];
  console.log(`${prefix} ${message}`);
}

function addResult(name: string, passed: boolean, error?: string, details?: any) {
  results.push({ name, passed, error, details });
  if (passed) {
    log(`${name}: PASSED`, 'success');
  } else {
    log(`${name}: FAILED${error ? ` - ${error}` : ''}`, 'error');
    if (details) {
      console.log('   Details:', JSON.stringify(details, null, 2));
    }
  }
}

async function testEnvironmentVariables() {
  log('\n=== Test 1: Environment Variables ===', 'info');
  
  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  const hasCustomLLM = !!process.env.CUSTOM_LLM_ENDPOINT;
  
  // Debug: Show what we found (masked for security)
  const openAIValue = process.env.OPENAI_API_KEY;
  const customLLMValue = process.env.CUSTOM_LLM_ENDPOINT;
  
  log(`Checking OPENAI_API_KEY: ${openAIValue ? `Set (${openAIValue.substring(0, 10)}...)` : 'Not set'}`, 'info');
  log(`Checking CUSTOM_LLM_ENDPOINT: ${customLLMValue ? `Set (${customLLMValue.substring(0, 30)}...)` : 'Not set'}`, 'info');
  
  if (!hasOpenAI && !hasCustomLLM) {
    addResult(
      'Environment Variables',
      false,
      'Missing LLM configuration',
      { 
        OPENAI_API_KEY: hasOpenAI, 
        CUSTOM_LLM_ENDPOINT: hasCustomLLM,
        note: 'Check .env.local file exists and contains CUSTOM_LLM_ENDPOINT or OPENAI_API_KEY'
      }
    );
    return false;
  }
  
  addResult(
    'Environment Variables',
    true,
    undefined,
    { 
      OPENAI_API_KEY: hasOpenAI ? 'Set' : 'Not set',
      CUSTOM_LLM_ENDPOINT: hasCustomLLM ? 'Set' : 'Not set'
    }
  );
  return true;
}

async function testAPIEndpoint() {
  log('\n=== Test 2: API Endpoint Availability ===', 'info');
  
  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers: {} })
    });
    
    // Even if it returns 400 (missing fields), the endpoint exists
    if (response.status === 400 || response.status === 405) {
      addResult('API Endpoint Available', true);
      return true;
    }
    
    if (response.status === 404) {
      addResult('API Endpoint Available', false, 'Endpoint not found (404)');
      return false;
    }
    
    addResult('API Endpoint Available', true, undefined, { status: response.status });
    return true;
  } catch (error: any) {
    addResult('API Endpoint Available', false, error.message);
    return false;
  }
}

async function testRequiredFields() {
  log('\n=== Test 3: Required Fields Validation ===', 'info');
  
  const testAnswers = {
    location: 'Austria',
    company_type: 'startup',
    funding_amount: 50000,
    company_stage: 12
  };
  
  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers: testAnswers, max_results: 5 })
    });
    
    const data = await response.json();
    
    if (response.status === 400 && data.missing) {
      addResult(
        'Required Fields Validation',
        false,
        'Missing required fields',
        { missing: data.missing }
      );
      return false;
    }
    
    if (response.status === 200) {
      addResult('Required Fields Validation', true);
      return true;
    }
    
    addResult(
      'Required Fields Validation',
      false,
      `Unexpected status: ${response.status}`,
      data
    );
    return false;
  } catch (error: any) {
    addResult('Required Fields Validation', false, error.message);
    return false;
  }
}

async function testProgramGeneration() {
  log('\n=== Test 4: Program Generation ===', 'info');
  
  const testAnswers = {
    location: 'Austria',
    company_type: 'startup',
    funding_amount: 50000,
    company_stage: 12,
    revenue_status: 'pre_revenue',
    industry_focus: ['technology'],
    co_financing: 'co_no'
  };
  
  try {
    log('Sending request to API...', 'info');
    const startTime = Date.now();
    
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        answers: testAnswers,
        max_results: 10,
        extract_all: false,
        use_seeds: false
      })
    });
    
    const latency = Date.now() - startTime;
    log(`Response received in ${latency}ms`, 'info');
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      addResult(
        'Program Generation',
        false,
        `HTTP ${response.status}: ${response.statusText}`,
        errorData
      );
      return false;
    }
    
    const data = await response.json();
    
    // Check response structure
    if (!data.success) {
      addResult(
        'Program Generation',
        false,
        'Response indicates failure',
        { success: data.success, error: data.error }
      );
      return false;
    }
    
    // Check if programs were returned
    if (!Array.isArray(data.programs)) {
      addResult(
        'Program Generation',
        false,
        'Programs array missing or invalid',
        { programs: data.programs }
      );
      return false;
    }
    
    if (data.programs.length === 0) {
      // Check debug info
      const debug = data.debug || {};
      if (debug.llmError) {
        addResult(
          'Program Generation',
          false,
          'LLM error occurred',
          {
            llmError: debug.llmError,
            fallbackUsed: debug.fallbackUsed,
            deterministicFallbackUsed: debug.deterministicFallbackUsed
          }
        );
      } else if (debug.llmProgramCount === 0) {
        addResult(
          'Program Generation',
          false,
          'LLM returned 0 programs',
          {
            llmRaw: debug.llmRaw ? debug.llmRaw.substring(0, 500) : 'No raw response',
            fallbackUsed: debug.fallbackUsed
          }
        );
      } else {
        addResult(
          'Program Generation',
          false,
          'No programs after filtering',
          {
            llmProgramCount: debug.llmProgramCount,
            afterFiltering: debug.afterFiltering
          }
        );
      }
      return false;
    }
    
    // Validate program structure
    const firstProgram = data.programs[0];
    const hasRequiredFields = firstProgram.id && firstProgram.name;
    
    if (!hasRequiredFields) {
      addResult(
        'Program Generation',
        false,
        'Program missing required fields',
        { program: firstProgram }
      );
      return false;
    }
    
    addResult(
      'Program Generation',
      true,
      undefined,
      {
        programCount: data.programs.length,
        latency: `${latency}ms`,
        llmProvider: data.debug?.llmProvider,
        llmStats: data.debug ? {
          promptTokens: data.debug.llmPromptTokens,
          completionTokens: data.debug.llmCompletionTokens,
          totalTokens: data.debug.llmTotalTokens,
          latencyMs: data.debug.llmLatencyMs
        } : undefined,
        fallbackUsed: data.debug?.fallbackUsed,
        sampleProgram: {
          id: firstProgram.id,
          name: firstProgram.name,
          hasRequirements: !!firstProgram.categorized_requirements
        }
      }
    );
    return true;
  } catch (error: any) {
    addResult('Program Generation', false, error.message);
    return false;
  }
}

async function testErrorHandling() {
  log('\n=== Test 5: Error Handling ===', 'info');
  
  // Test with invalid data
  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers: { invalid: 'data' } })
    });
    
    const data = await response.json();
    
    // Should return 400 with missing fields
    if (response.status === 400 && data.missing) {
      addResult('Error Handling', true, undefined, {
        status: response.status,
        missingFields: data.missing
      });
      return true;
    }
    
    addResult(
      'Error Handling',
      false,
      'Unexpected response for invalid input',
      { status: response.status, data }
    );
    return false;
  } catch (error: any) {
    addResult('Error Handling', false, error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('\n🧪 ProgramFinder Recommendations (Reco) Test Suite\n');
  console.log(`Testing endpoint: ${API_ENDPOINT}\n`);
  
  const envOk = await testEnvironmentVariables();
  if (!envOk) {
    log('\n⚠️  Skipping API tests due to missing environment variables', 'warn');
    printSummary();
    return;
  }
  
  await testAPIEndpoint();
  await testRequiredFields();
  await testProgramGeneration();
  await testErrorHandling();
  
  printSummary();
}

function printSummary() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Summary');
  console.log('='.repeat(60));
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;
  
  console.log(`Total Tests: ${total}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  
  if (failed > 0) {
    console.log('\n❌ Failed Tests:');
    results
      .filter(r => !r.passed)
      .forEach(r => {
        console.log(`   - ${r.name}`);
        if (r.error) console.log(`     Error: ${r.error}`);
      });
  }
  
  console.log('\n' + '='.repeat(60));
  
  // Exit with error code if any tests failed
  if (failed > 0) {
    process.exit(1);
  }
}

// Run tests
runAllTests().catch(error => {
  console.error('Fatal error running tests:', error);
  process.exit(1);
});


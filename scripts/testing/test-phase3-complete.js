// Phase 3 Complete AI System Test Script
// Tests all Phase 3 features: Decision Trees, Templates, AI Editor, Readiness Checks, Document Library

const https = require('https');
const http = require('http');

// Configuration
const BASE_URL = process.env.TEST_URL || 'https://plan2fund-nextgen.vercel.app';
const TEST_PROGRAM_ID = 'aws_preseed_sample';

// Test results storage
const testResults = {
  phase3: {
    step1: { name: 'Dynamic Decision Trees', status: 'pending', tests: [] },
    step2: { name: 'Program-Specific Templates', status: 'pending', tests: [] },
    step3: { name: 'Enhanced AI-Powered Editor', status: 'pending', tests: [] },
    step4: { name: 'Intelligent Readiness Checks', status: 'pending', tests: [] },
    step5: { name: 'Document Library', status: 'pending', tests: [] }
  },
  summary: {
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    overallStatus: 'pending'
  }
};

// Utility function to make HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https');
    const client = isHttps ? https : http;
    
    const requestOptions = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    const req = client.request(url, requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (error) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

// Test helper function
async function runTest(testName, testFunction) {
  console.log(`\n🧪 Running: ${testName}`);
  testResults.summary.totalTests++;
  
  try {
    const result = await testFunction();
    console.log(`✅ PASSED: ${testName}`);
    console.log(`   Result: ${JSON.stringify(result, null, 2).substring(0, 200)}...`);
    testResults.summary.passedTests++;
    return { status: 'passed', result };
  } catch (error) {
    console.log(`❌ FAILED: ${testName}`);
    console.log(`   Error: ${error.message}`);
    testResults.summary.failedTests++;
    return { status: 'failed', error: error.message };
  }
}

// ========== PHASE 3 STEP 1: Dynamic Decision Trees ==========

async function testDecisionTreeGeneration() {
  const response = await makeRequest(`${BASE_URL}/api/decision-tree?programId=${TEST_PROGRAM_ID}&action=generate`);
  
  if (response.status !== 200) {
    throw new Error(`API returned status ${response.status}: ${JSON.stringify(response.data)}`);
  }
  
  if (!response.data.success) {
    throw new Error(`API returned error: ${response.data.error}`);
  }
  
  if (!response.data.data || !Array.isArray(response.data.data.questions)) {
    throw new Error('Invalid response format: missing questions array');
  }
  
  return {
    questionsCount: response.data.data.questions.length,
    programName: response.data.data.program?.name,
    totalQuestions: response.data.data.total_questions
  };
}

async function testDecisionTreeValidation() {
  const testAnswers = {
    company_stage: 'mvp',
    industry: 'technology',
    team_size: 3,
    funding_amount: 100000,
    has_business_plan: true,
    has_financial_projections: true
  };
  
  const response = await makeRequest(`${BASE_URL}/api/decision-tree`, {
    method: 'POST',
    body: {
      action: 'validate',
      programId: TEST_PROGRAM_ID,
      answers: testAnswers
    }
  });
  
  if (response.status !== 200) {
    throw new Error(`API returned status ${response.status}: ${JSON.stringify(response.data)}`);
  }
  
  return {
    validationStatus: response.data.success,
    score: response.data.data?.score || 0
  };
}

// ========== PHASE 3 STEP 2: Program-Specific Templates ==========

async function testProgramTemplateGeneration() {
  const response = await makeRequest(`${BASE_URL}/api/program-templates?programId=${TEST_PROGRAM_ID}&action=generate`);
  
  if (response.status !== 200) {
    throw new Error(`API returned status ${response.status}: ${JSON.stringify(response.data)}`);
  }
  
  if (!response.data.success) {
    throw new Error(`API returned error: ${response.data.error}`);
  }
  
  if (!response.data.data || !Array.isArray(response.data.data.sections)) {
    throw new Error('Invalid response format: missing sections array');
  }
  
  return {
    sectionsCount: response.data.data.sections.length,
    programName: response.data.data.program_name,
    targetAudience: response.data.data.target_audience
  };
}

async function testTemplateSections() {
  const response = await makeRequest(`${BASE_URL}/api/program-templates?programId=${TEST_PROGRAM_ID}&action=sections`);
  
  if (response.status !== 200) {
    throw new Error(`API returned status ${response.status}: ${JSON.stringify(response.data)}`);
  }
  
  return {
    sectionsCount: response.data.data?.length || 0,
    hasRequiredSections: response.data.data?.some(s => s.required) || false
  };
}

// ========== PHASE 3 STEP 3: Enhanced AI-Powered Editor ==========

async function testAIAssistantBasic() {
  const response = await makeRequest(`${BASE_URL}/api/ai-assistant`, {
    method: 'POST',
    body: {
      action: 'generate',
      sectionId: 'executive_summary',
      content: 'Test content for AI assistance'
    }
  });
  
  if (response.status !== 200) {
    throw new Error(`API returned status ${response.status}: ${JSON.stringify(response.data)}`);
  }
  
  if (!response.data.success) {
    throw new Error(`API returned error: ${response.data.error}`);
  }
  
  return {
    hasContent: !!response.data.content,
    wordCount: response.data.wordCount || 0,
    hasSuggestions: Array.isArray(response.data.suggestions)
  };
}

async function testAIAssistantTemplate() {
  const response = await makeRequest(`${BASE_URL}/api/ai-assistant`, {
    method: 'POST',
    body: {
      action: 'template',
      sectionId: 'executive_summary',
      content: 'Test content',
      programTemplate: {
        program_name: 'Test Program',
        sections: []
      },
      currentTemplateSection: {
        id: 'executive_summary',
        title: 'Executive Summary',
        required: true
      }
    }
  });
  
  if (response.status !== 200) {
    throw new Error(`API returned status ${response.status}: ${JSON.stringify(response.data)}`);
  }
  
  return {
    hasProgramSpecific: response.data.programSpecific || false,
    hasSectionGuidance: Array.isArray(response.data.sectionGuidance)
  };
}

// ========== PHASE 3 STEP 4: Intelligent Readiness Checks ==========

async function testIntelligentReadinessCheck() {
  const testPlanContent = {
    executive_summary: 'This is a test executive summary with sufficient content for testing purposes.',
    financials: 'Financial projections and budget information would go here.',
    market_analysis: 'Market research and competitive analysis content.'
  };
  
  const response = await makeRequest(`${BASE_URL}/api/intelligent-readiness`, {
    method: 'POST',
    body: {
      action: 'check',
      programId: TEST_PROGRAM_ID,
      planContent: testPlanContent
    }
  });
  
  if (response.status !== 200) {
    throw new Error(`API returned status ${response.status}: ${JSON.stringify(response.data)}`);
  }
  
  if (!response.data.success) {
    throw new Error(`API returned error: ${response.data.error}`);
  }
  
  return {
    checksCount: Array.isArray(response.data.data) ? response.data.data.length : 0,
    hasScores: response.data.data?.some(c => typeof c.score === 'number') || false
  };
}

async function testIntelligentReadinessSummary() {
  const testPlanContent = {
    executive_summary: 'Test content',
    financials: 'Test financial content'
  };
  
  const response = await makeRequest(`${BASE_URL}/api/intelligent-readiness`, {
    method: 'POST',
    body: {
      action: 'summary',
      programId: TEST_PROGRAM_ID,
      planContent: testPlanContent
    }
  });
  
  if (response.status !== 200) {
    throw new Error(`API returned status ${response.status}: ${JSON.stringify(response.data)}`);
  }
  
  return {
    hasScore: typeof response.data.data?.score === 'number',
    hasStatus: ['ready', 'needs_work', 'not_ready'].includes(response.data.data?.status),
    hasRecommendations: Array.isArray(response.data.data?.recommendations)
  };
}

// ========== PHASE 3 STEP 5: Document Library ==========

async function testDocumentLibraryAccess() {
  const response = await makeRequest(`${BASE_URL}/library`);
  
  if (response.status !== 200) {
    throw new Error(`Library page returned status ${response.status}`);
  }
  
  // Check if the page contains expected content
  const hasDocumentLibrary = response.data.includes('Document Library');
  const hasPhase3Features = response.data.includes('AI-Powered Document Guidance') || 
                           response.data.includes('Enhanced with AI recommendations');
  
  return {
    pageAccessible: true,
    hasDocumentLibrary,
    hasPhase3Features
  };
}

async function testDocumentLibraryWithProgram() {
  const response = await makeRequest(`${BASE_URL}/library?programId=${TEST_PROGRAM_ID}`);
  
  if (response.status !== 200) {
    throw new Error(`Library page with program returned status ${response.status}`);
  }
  
  return {
    pageAccessible: true,
    hasProgramContext: response.data.includes('programId') || response.data.includes('program')
  };
}

// ========== MAIN TEST EXECUTION ==========

async function runPhase3Tests() {
  console.log('🚀 Starting Phase 3 Complete AI System Tests');
  console.log(`📍 Testing against: ${BASE_URL}`);
  console.log(`🎯 Test Program: ${TEST_PROGRAM_ID}`);
  console.log('=' * 60);

  // Step 1: Dynamic Decision Trees
  console.log('\n📋 PHASE 3 STEP 1: Dynamic Decision Trees');
  testResults.phase3.step1.tests.push(
    await runTest('Decision Tree Generation', testDecisionTreeGeneration)
  );
  testResults.phase3.step1.tests.push(
    await runTest('Decision Tree Validation', testDecisionTreeValidation)
  );
  testResults.phase3.step1.status = testResults.phase3.step1.tests.every(t => t.status === 'passed') ? 'completed' : 'failed';

  // Step 2: Program-Specific Templates
  console.log('\n📋 PHASE 3 STEP 2: Program-Specific Templates');
  testResults.phase3.step2.tests.push(
    await runTest('Program Template Generation', testProgramTemplateGeneration)
  );
  testResults.phase3.step2.tests.push(
    await runTest('Template Sections', testTemplateSections)
  );
  testResults.phase3.step2.status = testResults.phase3.step2.tests.every(t => t.status === 'passed') ? 'completed' : 'failed';

  // Step 3: Enhanced AI-Powered Editor
  console.log('\n📋 PHASE 3 STEP 3: Enhanced AI-Powered Editor');
  testResults.phase3.step3.tests.push(
    await runTest('AI Assistant Basic', testAIAssistantBasic)
  );
  testResults.phase3.step3.tests.push(
    await runTest('AI Assistant Template', testAIAssistantTemplate)
  );
  testResults.phase3.step3.status = testResults.phase3.step3.tests.every(t => t.status === 'passed') ? 'completed' : 'failed';

  // Step 4: Intelligent Readiness Checks
  console.log('\n📋 PHASE 3 STEP 4: Intelligent Readiness Checks');
  testResults.phase3.step4.tests.push(
    await runTest('Intelligent Readiness Check', testIntelligentReadinessCheck)
  );
  testResults.phase3.step4.tests.push(
    await runTest('Intelligent Readiness Summary', testIntelligentReadinessSummary)
  );
  testResults.phase3.step4.status = testResults.phase3.step4.tests.every(t => t.status === 'passed') ? 'completed' : 'failed';

  // Step 5: Document Library
  console.log('\n📋 PHASE 3 STEP 5: Document Library');
  testResults.phase3.step5.tests.push(
    await runTest('Document Library Access', testDocumentLibraryAccess)
  );
  testResults.phase3.step5.tests.push(
    await runTest('Document Library with Program', testDocumentLibraryWithProgram)
  );
  testResults.phase3.step5.status = testResults.phase3.step5.tests.every(t => t.status === 'passed') ? 'completed' : 'failed';

  // Calculate overall status
  const completedSteps = Object.values(testResults.phase3).filter(step => step.status === 'completed').length;
  const totalSteps = Object.keys(testResults.phase3).length;
  
  testResults.summary.overallStatus = completedSteps === totalSteps ? 'completed' : 'partial';
  
  // Print summary
  console.log('\n' + '=' * 60);
  console.log('📊 PHASE 3 TEST SUMMARY');
  console.log('=' * 60);
  
  Object.entries(testResults.phase3).forEach(([stepKey, step]) => {
    const status = step.status === 'completed' ? '✅' : '❌';
    console.log(`${status} ${step.name}: ${step.status.toUpperCase()}`);
  });
  
  console.log(`\n📈 Overall Results:`);
  console.log(`   Total Tests: ${testResults.summary.totalTests}`);
  console.log(`   Passed: ${testResults.summary.passedTests}`);
  console.log(`   Failed: ${testResults.summary.failedTests}`);
  console.log(`   Success Rate: ${Math.round((testResults.summary.passedTests / testResults.summary.totalTests) * 100)}%`);
  console.log(`   Overall Status: ${testResults.summary.overallStatus.toUpperCase()}`);
  
  if (testResults.summary.overallStatus === 'completed') {
    console.log('\n🎉 PHASE 3 COMPLETE AI SYSTEM: ALL TESTS PASSED!');
    console.log('🚀 Ready for production deployment!');
  } else {
    console.log('\n⚠️  PHASE 3 COMPLETE AI SYSTEM: SOME TESTS FAILED');
    console.log('🔧 Review failed tests and fix issues before deployment');
  }
  
  return testResults;
}

// Run the tests
if (require.main === module) {
  runPhase3Tests().catch(console.error);
}

module.exports = { runPhase3Tests, testResults };

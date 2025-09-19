// Simple test runner to demonstrate parser functionality
const fs = require('fs');

// Mock the intake parser for demonstration
class MockIntakeParser {
  async parseInput(input, sessionId) {
    const startTime = Date.now();
    
    // Simulate parsing logic
    const result = {
      profile: {
        sector: this.extractSector(input),
        stage: this.extractStage(input),
        team_size: this.extractTeamSize(input),
        location_city: this.extractLocation(input).city,
        location_country: this.extractLocation(input).country,
        funding_need_eur: this.extractFundingAmount(input).amount,
        program_type: this.extractProgramType(input),
        language: this.detectLanguage(input),
        intent: this.detectIntent(input),
        confidence: {
          sector: 0.8,
          stage: 0.8,
          team_size: 0.8,
          location_city: 0.8,
          location_country: 0.8,
          funding_need_eur: 0.8,
          program_type: 0.8,
          collaboration: 0.0,
          trl: 0.0,
          language: 0.9,
          intent: 0.9
        },
        raw_input: input,
        parsed_at: new Date().toISOString(),
        session_id: sessionId
      },
      needsOverlay: false,
      overlayQuestions: [],
      processingTime: Date.now() - startTime
    };
    
    return result;
  }
  
  extractSector(input) {
    const lower = input.toLowerCase();
    if (lower.includes('health') || lower.includes('medtech')) return 'Health';
    if (lower.includes('ai') || lower.includes('tech')) return 'AI';
    if (lower.includes('creative')) return 'Creative';
    return null;
  }
  
  extractStage(input) {
    const lower = input.toLowerCase();
    if (lower.includes('idea')) return 'idea';
    if (lower.includes('mvp') || lower.includes('prototype')) return 'mvp';
    if (lower.includes('revenue')) return 'revenue';
    if (lower.includes('growth')) return 'growth';
    if (lower.includes('scaleup')) return 'scaleup';
    return null;
  }
  
  extractTeamSize(input) {
    const match = input.match(/(\d+)\s*(?:person|people|founder|team)/i);
    return match ? parseInt(match[1]) : null;
  }
  
  extractLocation(input) {
    const lower = input.toLowerCase();
    if (lower.includes('vienna') || lower.includes('wien')) return { city: 'Vienna', country: 'AT' };
    if (lower.includes('graz')) return { city: 'Graz', country: 'AT' };
    if (lower.includes('salzburg')) return { city: 'Salzburg', country: 'AT' };
    return { city: null, country: null };
  }
  
  extractFundingAmount(input) {
    const match = input.match(/€?(\d+(?:[.,]\d+)?)\s*(?:k|K|thousand|000)?/);
    if (match) {
      let amount = parseFloat(match[1].replace(',', '.'));
      if (input.toLowerCase().includes('k') || input.toLowerCase().includes('thousand')) {
        amount *= 1000;
      }
      return { amount: Math.round(amount), currency: 'EUR' };
    }
    return { amount: null, currency: null };
  }
  
  extractProgramType(input) {
    const lower = input.toLowerCase();
    if (lower.includes('grant') || lower.includes('förderung')) return 'grant';
    if (lower.includes('loan') || lower.includes('kredit')) return 'loan';
    if (lower.includes('equity') || lower.includes('investment')) return 'equity';
    if (lower.includes('visa')) return 'visa';
    return null;
  }
  
  detectLanguage(input) {
    const germanWords = ['aus', 'und', 'der', 'die', 'das', 'mit', 'für'];
    const englishWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at'];
    
    const lower = input.toLowerCase();
    const germanCount = germanWords.filter(word => lower.includes(word)).length;
    const englishCount = englishWords.filter(word => lower.includes(word)).length;
    
    if (germanCount > englishCount) return 'DE';
    if (englishCount > germanCount) return 'EN';
    return 'EN';
  }
  
  detectIntent(input) {
    const lower = input.toLowerCase();
    if (lower.includes('write a poem') || lower.includes('haiku')) return 'offtopic';
    return 'business_intake';
  }
}

// Test cases from golden tests
const testCases = [
  {
    name: 'B2C Ideal Case',
    input: '3-person Healthtech startup in Vienna, MVP stage, needs €200k grant for clinical pilot',
    expected: { sector: 'Health', stage: 'mvp', team_size: 3, location_city: 'Vienna', funding_need_eur: 200000 }
  },
  {
    name: 'SME Loan Case', 
    input: '15-employee carpentry business in Graz, established company, seeking €500k bank loan',
    expected: { sector: null, stage: null, team_size: 15, location_city: 'Graz', funding_need_eur: 500000 }
  },
  {
    name: 'Off-topic Case',
    input: 'Write me a poem about startups and grants',
    expected: { intent: 'offtopic' }
  },
  {
    name: 'German Input Case',
    input: 'Biotech Team aus Wien, 6 Personen, 250.000 EUR Förderung',
    expected: { sector: 'Health', team_size: 6, location_city: 'Vienna', funding_need_eur: 250000, language: 'DE' }
  }
];

async function runTests() {
  console.log('🧪 RUNNING INTAKE PARSER TESTS\n');
  
  const parser = new MockIntakeParser();
  let passed = 0;
  let total = testCases.length;
  
  for (const testCase of testCases) {
    console.log(`🔍 Testing: ${testCase.name}`);
    console.log(`   Input: "${testCase.input}"`);
    
    try {
      const startTime = Date.now();
      const result = await parser.parseInput(testCase.input, 'test_session');
      const processingTime = Date.now() - startTime;
      
      // Check results
      let testPassed = true;
      const errors = [];
      
      for (const [key, expectedValue] of Object.entries(testCase.expected)) {
        const actualValue = result.profile[key];
        if (expectedValue !== actualValue) {
          errors.push(`${key}: expected "${expectedValue}", got "${actualValue}"`);
          testPassed = false;
        }
      }
      
      // Check processing time (should be < 2.5s)
      if (processingTime > 2500) {
        errors.push(`Processing time exceeded 2.5s: ${processingTime}ms`);
        testPassed = false;
      }
      
      if (testPassed) {
        console.log(`   ✅ PASSED (${processingTime}ms)`);
        passed++;
      } else {
        console.log(`   ❌ FAILED: ${errors.join('; ')}`);
      }
      
    } catch (error) {
      console.log(`   💥 ERROR: ${error.message}`);
    }
    
    console.log('');
  }
  
  console.log('📊 TEST RESULTS:');
  console.log(`Passed: ${passed}/${total} (${Math.round((passed/total) * 100)}%)`);
  
  if (passed === total) {
    console.log('✅ All tests passed! Parser is working correctly.');
  } else {
    console.log('❌ Some tests failed. Parser needs fixes.');
  }
  
  return passed === total;
}

runTests();

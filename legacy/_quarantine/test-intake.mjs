#!/usr/bin/env node

// Simple test for intake parser using ES modules
import { intakeParser } from '../src/lib/intakeParser.ts';

async function testIntake() {
  console.log('🧪 Testing Intake Parser...\n');
  
  const testCases = [
    {
      name: 'Valid Business Case',
      input: 'Healthtech startup in Vienna, 3 founders, MVP stage, seeking €200k grant',
      expectedIntent: 'business_intake'
    },
    {
      name: 'Off-topic Case',
      input: 'Write me a poem about startups',
      expectedIntent: 'offtopic'
    },
    {
      name: 'Missing Information Case',
      input: 'Startup needs funding',
      expectedIntent: 'business_intake'
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n🔍 Testing: ${testCase.name}`);
    console.log(`Input: "${testCase.input}"`);
    
    try {
      const startTime = Date.now();
      const result = await intakeParser.parseInput(testCase.input, 'test_session');
      const processingTime = Date.now() - startTime;
      
      console.log(`✅ Parsed in ${processingTime}ms`);
      console.log(`Intent: ${result.profile.intent}`);
      console.log(`Needs Overlay: ${result.needsOverlay}`);
      console.log(`Overlay Questions: ${result.overlayQuestions.join(', ')}`);
      
      // Check performance
      if (processingTime > 2500) {
        console.log(`⚠️  Performance warning: ${processingTime}ms exceeds 2.5s threshold`);
      } else {
        console.log(`✅ Performance OK: ${processingTime}ms ≤ 2.5s`);
      }
      
      // Check intent
      if (result.profile.intent === testCase.expectedIntent) {
        console.log(`✅ Intent correct: ${result.profile.intent}`);
      } else {
        console.log(`❌ Intent mismatch: expected ${testCase.expectedIntent}, got ${result.profile.intent}`);
      }
      
    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
    }
  }
  
  console.log('\n✅ Intake parser test completed');
}

testIntake().catch(console.error);

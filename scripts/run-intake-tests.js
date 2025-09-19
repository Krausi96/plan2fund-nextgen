#!/usr/bin/env node

// Simple test runner for intake parser
const { intakeParser } = require('../src/lib/intakeParser.ts');

async function testBasicParsing() {
  console.log('🧪 Testing Basic Intake Parsing...\n');
  
  const testInput = 'Healthtech startup in Vienna, 3 founders, MVP stage, seeking €200k grant';
  console.log(`Input: "${testInput}"`);
  
  try {
    const startTime = Date.now();
    const result = await intakeParser.parseInput(testInput, 'test_session');
    const processingTime = Date.now() - startTime;
    
    console.log(`\n✅ Parsing completed in ${processingTime}ms`);
    console.log('Profile:', JSON.stringify(result.profile, null, 2));
    console.log('Needs Overlay:', result.needsOverlay);
    console.log('Overlay Questions:', result.overlayQuestions);
    
    // Check performance
    if (processingTime > 2500) {
      console.log(`⚠️  Performance warning: ${processingTime}ms exceeds 2.5s threshold`);
    } else {
      console.log(`✅ Performance OK: ${processingTime}ms ≤ 2.5s`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testBasicParsing();

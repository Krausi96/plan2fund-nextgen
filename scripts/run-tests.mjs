#!/usr/bin/env node

// Test runner for intake parser
import { runCITests } from '../tests/intake/ci-tests.ts';

async function main() {
  console.log('🚀 Starting Intake Parser Tests...\n');
  
  try {
    const success = await runCITests();
    
    if (success) {
      console.log('\n✅ All tests passed!');
      process.exit(0);
    } else {
      console.log('\n❌ Some tests failed!');
      process.exit(1);
    }
  } catch (error) {
    console.error('💥 Test runner error:', error);
    process.exit(1);
  }
}

main();

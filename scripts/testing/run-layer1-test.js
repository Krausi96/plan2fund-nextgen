#!/usr/bin/env node

/**
 * LAYER 1 TEST RUNNER
 * Simple script to run Layer 1 tests
 * 
 * Usage: node scripts/testing/run-layer1-test.js
 */

const Layer1TestSuite = require('./test-layer1-complete');

console.log('🚀 Starting Layer 1 Test Suite...\n');

const testSuite = new Layer1TestSuite();
testSuite.runAllTests()
  .then(() => {
    console.log('\n✅ Test suite completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test suite failed:', error);
    process.exit(1);
  });

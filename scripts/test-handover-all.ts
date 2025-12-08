/**
 * Main Test Runner: All Handover Tests
 * 
 * Runs all test suites from the handover document:
 * 1. ProgramFinder Recommendations (Reco)
 * 2. Editor Program Connection
 * 3. Template Extraction
 * 
 * Note: This script imports and runs the test suites directly.
 * For sequential execution with better isolation, run each test separately:
 *   npm run test:handover:reco
 *   npm run test:handover:editor
 *   npm run test:handover:templates
 */

console.log('\n🚀 Handover Test Suite - All Tests\n');
console.log('This script runs all test suites sequentially.\n');
console.log('For better isolation, run each test suite separately:\n');
console.log('  npm run test:handover:reco       - Test ProgramFinder recommendations');
console.log('  npm run test:handover:editor     - Test Editor program connection');
console.log('  npm run test:handover:templates   - Test template extraction\n');
console.log('Or run this script to execute all tests:\n');

// Import and run each test suite
async function runAllSuites() {
  const results: Array<{ name: string; passed: boolean; error?: string }> = [];
  
  const suites = [
    { name: 'ProgramFinder Recommendations', module: './test-handover-reco' },
    { name: 'Editor Program Connection', module: './test-handover-editor' },
    { name: 'Template Extraction', module: './test-handover-templates' }
  ];
  
  for (const suite of suites) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🧪 Running: ${suite.name}`);
    console.log('='.repeat(60));
    
    try {
      // Dynamic import and execute
      await import(suite.module);
      results.push({ name: suite.name, passed: true });
    } catch (error: any) {
      results.push({
        name: suite.name,
        passed: false,
        error: error.message || 'Unknown error'
      });
    }
    
    // Small delay between test suites
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  printFinalSummary(results);
}

function printFinalSummary(results: Array<{ name: string; passed: boolean; error?: string }>) {
  console.log('\n' + '='.repeat(60));
  console.log('📊 Final Test Summary');
  console.log('='.repeat(60));
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;
  
  console.log(`\nTotal Test Suites: ${total}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  
  if (failed > 0) {
    console.log('\n❌ Failed Test Suites:');
    results
      .filter(r => !r.passed)
      .forEach(r => {
        console.log(`   - ${r.name}`);
        if (r.error) console.log(`     Error: ${r.error}`);
      });
  } else {
    console.log('\n🎉 All test suites passed!');
  }
  
  console.log('\n' + '='.repeat(60));
  
  // Exit with error code if any test suites failed
  if (failed > 0) {
    process.exit(1);
  }
}

// Run all test suites
runAllSuites().catch(error => {
  console.error('Fatal error running test suites:', error);
  process.exit(1);
});


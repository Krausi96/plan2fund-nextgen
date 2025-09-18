// Test runner for intake layer
const { runCITests } = require('../tests/intake/ci-tests.ts');

async function main() {
  console.log('🧪 Running Intake Layer Tests...\n');
  
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

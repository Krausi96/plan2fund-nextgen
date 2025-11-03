#!/usr/bin/env node
/**
 * Run all next steps automatically
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('\n🎯 RUNNING NEXT STEPS FOR 100% ACCURACY\n');
console.log('='.repeat(70));

// Step 1: Fix null funding types
console.log('\n📊 STEP 1: Fixing null funding types in database...');
try {
  require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'commonjs', moduleResolution: 'node', esModuleInterop: true } });
  require('../fix-null-funding-types.js');
  console.log('✅ Step 1 complete');
} catch (e) {
  console.log(`⚠️  Step 1 error: ${e.message}`);
}

// Step 2: Backup and reset state
console.log('\n📊 STEP 2: Resetting state for re-discovery...');
try {
  const statePath = path.join(__dirname, '..', '..', 'data', 'lite', 'state.json');
  if (fs.existsSync(statePath)) {
    const backupPath = statePath + '.backup.' + Date.now();
    fs.copyFileSync(statePath, backupPath);
    console.log(`✅ Backup created: ${backupPath}`);
  }
  require('../reset-state.js');
  const args = ['reset'];
  process.argv = ['node', 'reset-state.js', ...args];
  require('../reset-state.js');
  console.log('✅ Step 2 complete');
} catch (e) {
  console.log(`⚠️  Step 2 error: ${e.message}`);
}

// Step 3: Run cycle with improvements
console.log('\n📊 STEP 3: Running cycle with improvements...');
console.log('   (This will discover from all 63 institutions)');
console.log('   (Limited to 50 pages for testing)');
console.log('\n   Run manually with:');
console.log('   $env:LITE_ALL_INSTITUTIONS=1');
console.log('   $env:MAX_CYCLES=2');
console.log('   $env:LITE_MAX_DISCOVERY_PAGES=100');
console.log('   node scripts/automatic/auto-cycle.js');

console.log('\n✅ Next steps script complete!');
console.log('\n💡 To run full cycle, execute the commands above manually\n');


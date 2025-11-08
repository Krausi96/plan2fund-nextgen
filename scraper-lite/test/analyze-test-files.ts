#!/usr/bin/env tsx

/**
 * Analyze Test Files - Which to Keep vs Integrate
 */

import * as fs from 'fs';
import * as path from 'path';

const testDir = path.join(__dirname, '..', 'test');

function analyzeTestFiles() {
  console.log('📋 Test Files Analysis\n');
  console.log('='.repeat(80));
  
  const files: Array<{ path: string; category: string; purpose: string }> = [];
  
  // Reusable tests
  const reusable = [
    { file: 'analyze-requirements.ts', purpose: 'Quality analysis - KEEP (monitoring)' },
    { file: 'analyze-requirement-values.ts', purpose: 'Deep value analysis - KEEP (debugging)' },
    { file: 'analyze-extracted-data.ts', purpose: 'Data quality - KEEP (monitoring)' },
    { file: 'monitor-learning.ts', purpose: 'Learning status - KEEP (monitoring)' },
    { file: 'show-actual-data.ts', purpose: 'Sample data - KEEP (debugging)' },
    { file: 'speed-test.ts', purpose: 'Performance - KEEP (monitoring)' },
    { file: 'check-queue.ts', purpose: 'Queue status - KEEP (monitoring)' },
    { file: 'check-results.ts', purpose: 'Results check - KEEP (monitoring)' },
    { file: 'analyze-discovery.ts', purpose: 'Discovery analysis - KEEP (monitoring)' },
  ];
  
  // One-time tests
  const oneTime = [
    { file: 'full-cycle-test.ts', purpose: 'Full cycle - INTEGRATE into main flow' },
    { file: 'test-next-batch-features.ts', purpose: 'Feature test - KEEP (testing new features)' },
    { file: 'test-small-batch.ts', purpose: 'Small batch - INTEGRATE into main flow' },
  ];
  
  // Utility scripts
  const utilities = [
    { file: 'normalize-funding-types.ts', purpose: 'Normalization - KEEP (maintenance)' },
    { file: 'fix-category-names.ts', purpose: 'Fix script - KEEP (one-time fix, but useful)' },
    { file: 'recheck-blacklist.ts', purpose: 'Blacklist recheck - INTEGRATE into main flow' },
    { file: 'manage-blacklist.ts', purpose: 'Blacklist management - KEEP (manual tool)' },
    { file: 'learn-requirement-patterns.ts', purpose: 'Pattern learning - INTEGRATE (auto-learning)' },
    { file: 'db-status.ts', purpose: 'DB status - KEEP (monitoring)' },
  ];
  
  console.log('\n✅ KEEP (Reusable Monitoring/Debugging):\n');
  [...reusable, ...utilities.filter(u => u.purpose.includes('KEEP'))].forEach(f => {
    console.log(`   - ${f.file}`);
    console.log(`     ${f.purpose}`);
  });
  
  console.log('\n🔄 INTEGRATE (Should be automatic):\n');
  [...oneTime.filter(o => o.purpose.includes('INTEGRATE')), 
   ...utilities.filter(u => u.purpose.includes('INTEGRATE'))].forEach(f => {
    console.log(`   - ${f.file}`);
    console.log(`     ${f.purpose}`);
  });
  
  console.log('\n📊 Summary:\n');
  console.log(`   Keep: ${reusable.length + utilities.filter(u => u.purpose.includes('KEEP')).length} files`);
  console.log(`   Integrate: ${oneTime.filter(o => o.purpose.includes('INTEGRATE')).length + utilities.filter(u => u.purpose.includes('INTEGRATE')).length} files`);
  console.log(`   Total: ${reusable.length + oneTime.length + utilities.length} files`);
}

analyzeTestFiles();


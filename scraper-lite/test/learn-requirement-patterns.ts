#!/usr/bin/env tsx

/**
 * Test Requirement Pattern Learning
 * Run this to learn patterns from existing requirements
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath, override: false });
}
dotenv.config({ override: false });

import { autoLearnRequirementPatterns, getStoredRequirementPatterns } from '../src/learning/auto-learning';

async function main() {
  console.log('🧠 Learning Requirement Patterns\n');
  
  const patterns = await autoLearnRequirementPatterns();
  
  if (!patterns || patterns.length === 0) {
    console.log('⚠️  No patterns learned. Make sure you have at least 1000 requirements in the database.\n');
    return;
  }
  
  console.log(`\n✅ Learned patterns for ${patterns.length} categories:\n`);
  
  patterns.forEach(pattern => {
    console.log(`📁 ${pattern.category}:`);
    if (pattern.genericValues.length > 0) {
      console.log(`   Generic values to filter: ${pattern.genericValues.slice(0, 5).join(', ')}${pattern.genericValues.length > 5 ? '...' : ''}`);
    }
    if (pattern.duplicatePatterns.length > 0) {
      console.log(`   Duplicate patterns: ${pattern.duplicatePatterns.length} found`);
      pattern.duplicatePatterns.slice(0, 3).forEach(dup => {
        console.log(`     - Keep: "${dup.keep.substring(0, 50)}"`);
        console.log(`       Remove: ${dup.remove.slice(0, 2).map((r: string) => `"${r.substring(0, 30)}"`).join(', ')}`);
      });
    }
    if (pattern.typicalValues.length > 0) {
      console.log(`   Typical good values: ${pattern.typicalValues.slice(0, 3).map((v: string) => `"${v.substring(0, 40)}"`).join(', ')}`);
    }
    console.log('');
  });
  
  // Show stored patterns
  const stored = await getStoredRequirementPatterns();
  console.log(`\n📊 Stored patterns: ${stored.length} categories\n`);
}

main().catch(console.error);


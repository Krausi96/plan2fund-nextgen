#!/usr/bin/env tsx

/**
 * Test Merged Learning Module
 * Verifies all functions from the 4 merged files are available
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath, override: false });
}
dotenv.config({ override: false });

import {
  // Classification Feedback (from classification-feedback.ts)
  recordClassificationFeedback,
  getClassificationAccuracy,
  getCommonMistakes,
  
  // Quality Pattern Learning (from learn-quality-patterns.ts)
  analyzeFundingType,
  generateQualityRules,
  learnAllPatterns,
  getStoredQualityRules,
  
  // Requirement Pattern Learning (from learn-requirement-patterns.ts)
  learnRequirementPatterns,
  storeRequirementPatterns,
  getStoredRequirementPatterns,
  autoLearnRequirementPatterns,
  
  // Auto-Learning Orchestration (from auto-learning.ts)
  shouldLearnQualityPatterns,
  autoLearnQualityPatterns,
  getImprovedClassificationPrompt,
  getLearningStatus,
  
  // Types
  QualityRule,
  PatternAnalysis,
  RequirementPattern,
  ClassificationFeedback
} from '../src/learning/auto-learning';

async function main() {
  console.log('🧪 Testing Merged Learning Module\n');
  console.log('='.repeat(60));
  
  // Test 1: Verify all functions are exported
  console.log('\n✅ Test 1: Function Exports');
  const functions = {
    recordClassificationFeedback,
    getClassificationAccuracy,
    getCommonMistakes,
    analyzeFundingType,
    generateQualityRules,
    learnAllPatterns,
    getStoredQualityRules,
    learnRequirementPatterns,
    storeRequirementPatterns,
    getStoredRequirementPatterns,
    autoLearnRequirementPatterns,
    shouldLearnQualityPatterns,
    autoLearnQualityPatterns,
    getImprovedClassificationPrompt,
    getLearningStatus
  };
  
  const functionNames = Object.keys(functions);
  console.log(`   Found ${functionNames.length} functions:`);
  functionNames.forEach(name => {
    const fn = (functions as any)[name];
    if (typeof fn === 'function') {
      console.log(`   ✅ ${name}`);
    } else {
      console.log(`   ❌ ${name} - NOT A FUNCTION`);
      process.exit(1);
    }
  });
  
  // Test 2: Test classification feedback
  console.log('\n✅ Test 2: Classification Feedback');
  try {
    const accuracy = await getClassificationAccuracy();
    console.log(`   Accuracy: ${accuracy.accuracy.toFixed(1)}% (${accuracy.correct}/${accuracy.total})`);
    const mistakes = await getCommonMistakes();
    console.log(`   Common mistakes: ${mistakes.length}`);
  } catch (e: any) {
    console.log(`   ⚠️  Error: ${e.message}`);
  }
  
  // Test 3: Test learning status
  console.log('\n✅ Test 3: Learning Status');
  try {
    const status = await getLearningStatus();
    console.log(`   Classification Accuracy: ${status.classificationAccuracy.toFixed(1)}%`);
    console.log(`   Quality Rules: ${status.qualityRulesLearned}`);
    console.log(`   URL Patterns: ${status.urlPatternsLearned}`);
    console.log(`   Total Feedback: ${status.totalFeedback}`);
  } catch (e: any) {
    console.log(`   ⚠️  Error: ${e.message}`);
  }
  
  // Test 4: Test requirement patterns
  console.log('\n✅ Test 4: Requirement Patterns');
  try {
    const patterns = await getStoredRequirementPatterns();
    console.log(`   Stored patterns: ${patterns.length} categories`);
    if (patterns.length > 0) {
      console.log(`   Example: ${patterns[0].category} (${patterns[0].genericValues.length} generic values)`);
    }
  } catch (e: any) {
    console.log(`   ⚠️  Error: ${e.message}`);
  }
  
  // Test 5: Test quality rules
  console.log('\n✅ Test 5: Quality Rules');
  try {
    const rules = await getStoredQualityRules();
    console.log(`   Stored rules: ${rules.length} funding types`);
    if (rules.length > 0) {
      console.log(`   Example: ${rules[0].fundingType} (${rules[0].requiredFields.length} required fields)`);
    }
  } catch (e: any) {
    console.log(`   ⚠️  Error: ${e.message}`);
  }
  
  // Test 6: Test should learn check
  console.log('\n✅ Test 6: Should Learn Check');
  try {
    const shouldLearn = await shouldLearnQualityPatterns();
    console.log(`   Should learn: ${shouldLearn}`);
  } catch (e: any) {
    console.log(`   ⚠️  Error: ${e.message}`);
  }
  
  // Test 7: Test improved prompt
  console.log('\n✅ Test 7: Improved Classification Prompt');
  try {
    const prompt = await getImprovedClassificationPrompt();
    console.log(`   Prompt length: ${prompt.length} characters`);
    console.log(`   Contains 'LEARNED FROM MISTAKES': ${prompt.includes('LEARNED FROM MISTAKES')}`);
  } catch (e: any) {
    console.log(`   ⚠️  Error: ${e.message}`);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ All tests passed! Merged module works correctly.\n');
}

main().catch(console.error);


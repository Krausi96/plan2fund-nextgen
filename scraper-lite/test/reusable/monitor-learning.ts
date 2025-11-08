#!/usr/bin/env tsx

/**
 * Monitor Learning System
 * Shows classification accuracy, learned patterns, and learning status
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
  getClassificationAccuracy, 
  getCommonMistakes,
  getLearningStatus, 
  getStoredQualityRules 
} from '../../src/learning/auto-learning';
import { getPool } from '../../db/db';

async function main() {
  console.log('📊 Learning System Monitor\n');
  
  const status = await getLearningStatus();
  const accuracy = await getClassificationAccuracy();
  const mistakes = await getCommonMistakes();
  const rules = await getStoredQualityRules();
  
  console.log('🎯 Classification Accuracy:');
  console.log(`   Total Classifications: ${accuracy.total}`);
  console.log(`   Correct: ${accuracy.correct}`);
  console.log(`   Accuracy: ${accuracy.accuracy.toFixed(1)}%`);
  console.log(`   False Positives: ${accuracy.falsePositives} (classified as program but weren't)`);
  console.log(`   False Negatives: ${accuracy.falseNegatives} (were programs but classified as no)\n`);
  
  if (mistakes.length > 0) {
    console.log('⚠️  Recent Mistakes (Last 10):');
    mistakes.slice(0, 10).forEach((m, idx) => {
      console.log(`   ${idx + 1}. ${m.url.substring(0, 60)}...`);
      console.log(`      Predicted: ${m.predicted}, Actual: ${m.actual ? 'Program' : 'Not Program'}`);
      console.log(`      ${m.reason}\n`);
    });
  }
  
  console.log('🧠 Learned Patterns:');
  console.log(`   Quality Rules: ${status.qualityRulesLearned}`);
  console.log(`   URL Patterns: ${status.urlPatternsLearned}`);
  console.log(`   Total Feedback: ${status.totalFeedback}\n`);
  
  if (rules.length > 0) {
    console.log('📋 Quality Rules by Funding Type:');
    rules.forEach(rule => {
      console.log(`   ${rule.fundingType}:`);
      console.log(`      Required: ${rule.requiredFields.join(', ') || 'None'}`);
      console.log(`      Optional: ${rule.optionalFields.join(', ') || 'None'}`);
      console.log(`      Threshold: ${rule.completenessThreshold}%\n`);
    });
  }
  
  // Check URL patterns
  try {
    const pool = getPool();
    const patternsResult = await pool.query(`
      SELECT host, pattern, confidence, success_rate, usage_count
      FROM url_patterns
      ORDER BY success_rate DESC, usage_count DESC
      LIMIT 10
    `);
    
    if (patternsResult.rows.length > 0) {
      console.log('🔗 Top URL Patterns:');
      patternsResult.rows.forEach((p: any, idx: number) => {
        console.log(`   ${idx + 1}. ${p.host} - ${p.pattern}`);
        console.log(`      Confidence: ${(p.confidence * 100).toFixed(0)}%, Success: ${p.success_rate}%, Used: ${p.usage_count}x\n`);
      });
    }
  } catch (error: any) {
    console.warn(`   ⚠️  Could not load URL patterns: ${error.message}\n`);
  }
  
  console.log('💡 Recommendations:');
  if (accuracy.accuracy < 80) {
    console.log('   ⚠️  Classification accuracy is below 80% - consider improving prompts');
  }
  if (accuracy.falsePositives > accuracy.falseNegatives * 2) {
    console.log('   ⚠️  Too many false positives - increase quality threshold or improve exclusion rules');
  }
  if (status.qualityRulesLearned === 0) {
    console.log('   ℹ️  No quality rules learned yet - need 50+ examples per funding type');
  }
  if (mistakes.length > 0 && mistakes.filter(m => !m.actual).length > mistakes.filter(m => m.actual).length) {
    console.log('   ⚠️  Many false positives - improve exclusion patterns in prompts');
  }
}

main().catch(console.error);


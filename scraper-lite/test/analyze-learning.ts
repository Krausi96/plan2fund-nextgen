/**
 * Analyze what the learning system has learned
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load env FIRST - before any imports that might use env vars
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath, override: false });
}
dotenv.config({ override: false });

import { getPool } from '../db/db';
import { 
  getStoredQualityRules, 
  getStoredRequirementPatterns,
  getClassificationAccuracy,
  getCommonMistakes,
  getLearningStatus
} from '../src/learning/auto-learning';

async function analyzeLearning() {
  const pool = getPool();
  
  console.log('🔍 LEARNING ANALYSIS REPORT\n');
  console.log('='.repeat(60));
  
  // 1. Overall Learning Status
  console.log('\n📊 OVERALL LEARNING STATUS');
  console.log('-'.repeat(60));
  const status = await getLearningStatus();
  console.log(`   Classification Accuracy: ${status.classificationAccuracy.toFixed(1)}%`);
  console.log(`   Quality Rules Learned: ${status.qualityRulesLearned}`);
  console.log(`   URL Patterns Learned: ${status.urlPatternsLearned}`);
  console.log(`   Total Feedback Records: ${status.totalFeedback}`);
  
  // 2. Quality Rules
  console.log('\n📋 QUALITY RULES LEARNED');
  console.log('-'.repeat(60));
  const qualityRules = await getStoredQualityRules();
  if (qualityRules.length === 0) {
    console.log('   ⚠️  No quality rules learned yet');
    console.log('   💡 Need 50+ examples per funding type to learn patterns');
  } else {
    for (const rule of qualityRules) {
      console.log(`\n   ${rule.fundingType.toUpperCase()}:`);
      console.log(`      Required Fields: ${rule.requiredFields.join(', ') || 'none'}`);
      console.log(`      Optional Fields: ${rule.optionalFields.join(', ') || 'none'}`);
      console.log(`      Completeness Threshold: ${rule.completenessThreshold}%`);
      if (Object.keys(rule.typicalValues).length > 0) {
        console.log(`      Typical Values:`);
        for (const [key, value] of Object.entries(rule.typicalValues)) {
          console.log(`         ${key}: ${JSON.stringify(value)}`);
        }
      }
    }
  }
  
  // 3. Requirement Patterns
  console.log('\n📝 REQUIREMENT PATTERNS LEARNED');
  console.log('-'.repeat(60));
  const reqPatterns = await getStoredRequirementPatterns();
  if (reqPatterns.length === 0) {
    console.log('   ⚠️  No requirement patterns learned yet');
  } else {
    for (const pattern of reqPatterns) {
      console.log(`\n   Category: ${pattern.category}`);
      if (pattern.genericValues.length > 0) {
        console.log(`      Generic Values (filtered): ${pattern.genericValues.slice(0, 5).join(', ')}${pattern.genericValues.length > 5 ? '...' : ''}`);
      }
      if (pattern.duplicatePatterns && pattern.duplicatePatterns.length > 0) {
        console.log(`      Duplicate Patterns:`);
        for (const dup of pattern.duplicatePatterns.slice(0, 3)) {
          console.log(`         "${dup.keep}" (removes: ${dup.remove.join(', ')})`);
        }
      }
      if (pattern.typicalValues.length > 0) {
        console.log(`      Typical Values: ${pattern.typicalValues.slice(0, 3).join(', ')}${pattern.typicalValues.length > 3 ? '...' : ''}`);
      }
    }
  }
  
  // 4. Classification Accuracy Details
  console.log('\n🎯 CLASSIFICATION ACCURACY DETAILS');
  console.log('-'.repeat(60));
  const accuracy = await getClassificationAccuracy();
  console.log(`   Overall Accuracy: ${accuracy.accuracy.toFixed(1)}%`);
  console.log(`   Total Predictions: ${accuracy.total}`);
  console.log(`   Correct: ${accuracy.correct}`);
  console.log(`   Incorrect: ${accuracy.incorrect}`);
  console.log(`   True Positives: ${accuracy.truePositives}`);
  console.log(`   True Negatives: ${accuracy.trueNegatives}`);
  console.log(`   False Positives: ${accuracy.falsePositives}`);
  console.log(`   False Negatives: ${accuracy.falseNegatives}`);
  
  // 5. Common Mistakes
  console.log('\n❌ COMMON MISTAKES');
  console.log('-'.repeat(60));
  const mistakes = await getCommonMistakes(10);
  if (mistakes.length === 0) {
    console.log('   ✅ No common mistakes identified yet');
  } else {
    for (const mistake of mistakes) {
      console.log(`\n   Pattern: ${mistake.pattern}`);
      console.log(`      Count: ${mistake.count}`);
      console.log(`      Example: ${mistake.exampleUrl}`);
    }
  }
  
  // 6. URL Patterns
  console.log('\n🔗 URL PATTERNS LEARNED');
  console.log('-'.repeat(60));
  const urlPatterns = await pool.query(`
    SELECT pattern, confidence, usage_count, pattern_type, reason
    FROM url_patterns
    ORDER BY usage_count DESC, confidence DESC
    LIMIT 20
  `);
  
  if (urlPatterns.rows.length === 0) {
    console.log('   ⚠️  No URL patterns learned yet');
  } else {
    console.log(`   Found ${urlPatterns.rows.length} patterns (showing top 20):\n`);
    for (const pattern of urlPatterns.rows) {
      const type = pattern.pattern_type === 'exclude' ? '🚫 BLACKLIST' : '✅ ALLOW';
      console.log(`   ${type} | Confidence: ${pattern.confidence}% | Used: ${pattern.usage_count || 0}x`);
      console.log(`      Pattern: ${pattern.pattern}`);
      if (pattern.reason) {
        console.log(`      Reason: ${pattern.reason}`);
      }
    }
  }
  
  // 7. Database Statistics
  console.log('\n📈 DATABASE STATISTICS');
  console.log('-'.repeat(60));
  const stats = await pool.query(`
    SELECT 
      COUNT(*) as total_pages,
      COUNT(DISTINCT unnest(funding_types)) as funding_types,
      COUNT(*) FILTER (WHERE array_length(requirements, 1) >= 5) as good_pages,
      COUNT(*) FILTER (WHERE array_length(requirements, 1) < 5) as low_quality_pages,
      AVG(array_length(requirements, 1)) as avg_requirements
    FROM pages
    WHERE funding_types IS NOT NULL
  `);
  
  if (stats.rows[0]) {
    const s = stats.rows[0];
    console.log(`   Total Pages: ${s.total_pages}`);
    console.log(`   Funding Types: ${s.funding_types}`);
    console.log(`   Good Pages (5+ reqs): ${s.good_pages}`);
    console.log(`   Low Quality Pages (<5 reqs): ${s.low_quality_pages}`);
    console.log(`   Average Requirements: ${parseFloat(s.avg_requirements || 0).toFixed(1)}`);
  }
  
  // 8. Funding Type Distribution
  console.log('\n💰 FUNDING TYPE DISTRIBUTION');
  console.log('-'.repeat(60));
  const fundingDist = await pool.query(`
    SELECT 
      unnest(funding_types) as funding_type,
      COUNT(*) as count
    FROM pages
    WHERE funding_types IS NOT NULL
    GROUP BY unnest(funding_types)
    ORDER BY count DESC
  `);
  
  for (const row of fundingDist.rows) {
    console.log(`   ${row.funding_type}: ${row.count} pages`);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ Analysis complete!\n');
  
  await pool.end();
}

analyzeLearning().catch(console.error);


#!/usr/bin/env tsx

/**
 * Full Cycle Demo - Small Batch
 * Demonstrates: Discovery → Scraping → Learning → Feedback Integration
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath, override: false });
}
dotenv.config({ override: false });

import { getPool } from '../db/db';
import { 
  getClassificationAccuracy, 
  getCommonMistakes,
  getLearningStatus,
  getStoredQualityRules,
  getStoredRequirementPatterns
} from '../src/learning/auto-learning';

async function main() {
  console.log('🔄 Full Cycle Demo - Small Batch\n');
  console.log('='.repeat(80));
  
  const pool = getPool();
  
  // Get initial state
  console.log('\n📊 INITIAL STATE:\n');
  const initialPages = await pool.query('SELECT COUNT(*) as count FROM pages');
  const initialReqs = await pool.query('SELECT COUNT(*) as count FROM requirements');
  const initialFeedback = await pool.query('SELECT COUNT(*) as count FROM classification_feedback');
  const initialPatterns = await pool.query('SELECT COUNT(*) as count FROM url_patterns');
  
  console.log(`   Pages: ${initialPages.rows[0].count}`);
  console.log(`   Requirements: ${initialReqs.rows[0].count}`);
  console.log(`   Classification Feedback: ${initialFeedback.rows[0].count}`);
  console.log(`   URL Patterns: ${initialPatterns.rows[0].count}`);
  
  // Get learning status
  const initialLearning = await getLearningStatus();
  console.log(`   Learning Status:`);
  console.log(`     - Classification Accuracy: ${initialLearning.classificationAccuracy.toFixed(1)}%`);
  console.log(`     - Quality Rules: ${initialLearning.qualityRulesLearned}`);
  console.log(`     - Requirement Patterns: ${(await getStoredRequirementPatterns()).length}`);
  
  console.log('\n' + '='.repeat(80));
  console.log('\n🚀 RUNNING FULL CYCLE (Discovery + Scraping)...\n');
  
  // Run discovery + scraping (small batch)
  const { execSync } = require('child_process');
  
  try {
    console.log('📡 Phase 1: Discovery (max 5 pages)...');
    execSync('npm run scraper:unified -- discover --max=5', { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    console.log('\n📡 Phase 2: Scraping (max 3 pages)...');
    execSync('npm run scraper:unified -- scrape --max=3', { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
  } catch (error: any) {
    console.error(`\n⚠️  Error during cycle: ${error.message}`);
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('\n📊 FINAL STATE:\n');
  
  // Get final state
  const finalPages = await pool.query('SELECT COUNT(*) as count FROM pages');
  const finalReqs = await pool.query('SELECT COUNT(*) as count FROM requirements');
  const finalFeedback = await pool.query('SELECT COUNT(*) as count FROM classification_feedback');
  const finalPatterns = await pool.query('SELECT COUNT(*) as count FROM url_patterns');
  
  const pagesAdded = parseInt(finalPages.rows[0].count) - parseInt(initialPages.rows[0].count);
  const reqsAdded = parseInt(finalReqs.rows[0].count) - parseInt(initialReqs.rows[0].count);
  const feedbackAdded = parseInt(finalFeedback.rows[0].count) - parseInt(initialFeedback.rows[0].count);
  const patternsAdded = parseInt(finalPatterns.rows[0].count) - parseInt(initialPatterns.rows[0].count);
  
  console.log(`   Pages: ${finalPages.rows[0].count} (+${pagesAdded})`);
  console.log(`   Requirements: ${finalReqs.rows[0].count} (+${reqsAdded})`);
  console.log(`   Classification Feedback: ${finalFeedback.rows[0].count} (+${feedbackAdded})`);
  console.log(`   URL Patterns: ${finalPatterns.rows[0].count} (+${patternsAdded})`);
  
  // Get updated learning status
  const finalLearning = await getLearningStatus();
  console.log(`   Learning Status:`);
  console.log(`     - Classification Accuracy: ${finalLearning.classificationAccuracy.toFixed(1)}%`);
  console.log(`     - Quality Rules: ${finalLearning.qualityRulesLearned}`);
  console.log(`     - Requirement Patterns: ${(await getStoredRequirementPatterns()).length}`);
  
  // Show what was extracted
  console.log('\n' + '='.repeat(80));
  console.log('\n📋 WHAT WE EXTRACTED (Last 3 pages):\n');
  
  const recentPages = await pool.query(`
    SELECT 
      p.url, p.title, p.funding_types, 
      COUNT(r.id) as req_count,
      ARRAY_AGG(DISTINCT r.category) FILTER (WHERE r.category IS NOT NULL) as categories
    FROM pages p
    LEFT JOIN requirements r ON p.id = r.page_id
    WHERE p.fetched_at > NOW() - INTERVAL '10 minutes'
    GROUP BY p.id, p.url, p.title, p.funding_types
    ORDER BY p.fetched_at DESC
    LIMIT 3
  `);
  
  recentPages.rows.forEach((page: any, i: number) => {
    console.log(`${i + 1}. ${page.title || page.url.substring(0, 60)}`);
    console.log(`   URL: ${page.url.substring(0, 70)}`);
    console.log(`   Funding Types: ${(page.funding_types || []).join(', ') || 'None'}`);
    console.log(`   Requirements: ${page.req_count} (${(page.categories || []).slice(0, 5).join(', ')})`);
    console.log('');
  });
  
  // Show what we learned
  console.log('='.repeat(80));
  console.log('\n🧠 WHAT WE LEARNED:\n');
  
  // Classification feedback
  if (feedbackAdded > 0) {
    const accuracy = await getClassificationAccuracy();
    console.log(`📊 Classification Feedback:`);
    console.log(`   Total: ${accuracy.total} classifications`);
    console.log(`   Accuracy: ${accuracy.accuracy.toFixed(1)}%`);
    console.log(`   False Positives: ${accuracy.falsePositives}`);
    console.log(`   False Negatives: ${accuracy.falseNegatives}`);
    
    const mistakes = await getCommonMistakes();
    if (mistakes.length > 0) {
      console.log(`   Recent Mistakes: ${mistakes.length}`);
      mistakes.slice(0, 3).forEach((m: any, i: number) => {
        console.log(`     ${i + 1}. ${m.reason}: ${m.url.substring(0, 60)}`);
      });
    }
    console.log('');
  }
  
  // URL patterns
  if (patternsAdded > 0) {
    const newPatterns = await pool.query(`
      SELECT pattern, pattern_type, confidence, usage_count
      FROM url_patterns
      WHERE created_at > NOW() - INTERVAL '10 minutes'
      ORDER BY confidence DESC
      LIMIT 5
    `);
    
    if (newPatterns.rows.length > 0) {
      console.log(`🔗 URL Patterns Learned:`);
      newPatterns.rows.forEach((p: any, i: number) => {
        console.log(`   ${i + 1}. ${p.pattern_type}: ${p.pattern.substring(0, 50)} (conf: ${p.confidence}, used: ${p.usage_count})`);
      });
      console.log('');
    }
  }
  
  // Requirement patterns
  const reqPatterns = await getStoredRequirementPatterns();
  if (reqPatterns.length > 0) {
    console.log(`📋 Requirement Patterns (${reqPatterns.length} categories):`);
    reqPatterns.slice(0, 3).forEach((p: any, i: number) => {
      console.log(`   ${i + 1}. ${p.category}:`);
      console.log(`      - Generic values to filter: ${p.genericValues.length}`);
      console.log(`      - Duplicate patterns: ${p.duplicatePatterns.length}`);
      console.log(`      - Typical good values: ${p.typicalValues.length}`);
    });
    console.log('');
  }
  
  // Quality rules
  const qualityRules = await getStoredQualityRules();
  if (qualityRules.length > 0) {
    console.log(`✨ Quality Rules (${qualityRules.length} funding types):`);
    qualityRules.slice(0, 3).forEach((r: any, i: number) => {
      console.log(`   ${i + 1}. ${r.fundingType}:`);
      console.log(`      - Required fields: ${r.requiredFields.length}`);
      console.log(`      - Optional fields: ${r.optionalFields.length}`);
    });
    console.log('');
  }
  
  // Check if feedback is automatically integrated
  console.log('='.repeat(80));
  console.log('\n🔄 FEEDBACK INTEGRATION:\n');
  
  const improvedPrompt = await import('../src/learning/auto-learning').then(m => m.getImprovedClassificationPrompt());
  const usesMistakes = improvedPrompt.includes('LEARNED FROM MISTAKES');
  const usesAccuracy = improvedPrompt.includes('Current accuracy');
  
  console.log(`   ✅ Classification feedback recorded: ${feedbackAdded > 0 ? 'YES' : 'NO'}`);
  console.log(`   ✅ Improved prompt uses mistakes: ${usesMistakes ? 'YES' : 'NO'}`);
  console.log(`   ✅ Improved prompt shows accuracy: ${usesAccuracy ? 'YES' : 'NO'}`);
  console.log(`   ✅ Auto-learning triggered: ${finalLearning.qualityRulesLearned > initialLearning.qualityRulesLearned ? 'YES' : 'NO (not enough pages yet)'}`);
  console.log(`   ✅ Requirement patterns applied: ${reqPatterns.length > 0 ? 'YES (during extraction)' : 'NO (not learned yet)'}`);
  
  console.log('\n' + '='.repeat(80));
  console.log('\n✅ Full Cycle Complete!\n');
}

main().catch(console.error);


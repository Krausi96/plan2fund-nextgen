#!/usr/bin/env tsx

/**
 * Show Full Cycle Status
 * Quick overview of what's extracted, learned, and automatically integrated
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
  console.log('🔄 Full Cycle Status - What We Extract, Learn & Integrate\n');
  console.log('='.repeat(80));
  
  const pool = getPool();
  
  // 1. WHAT WE EXTRACT
  console.log('\n📋 WHAT WE EXTRACT:\n');
  
  const pages = await pool.query('SELECT COUNT(*) as count FROM pages');
  const reqs = await pool.query('SELECT COUNT(*) as count FROM requirements');
  const categories = await pool.query(`
    SELECT category, COUNT(*) as count
    FROM requirements
    GROUP BY category
    ORDER BY count DESC
    LIMIT 10
  `);
  
  console.log(`   Pages: ${pages.rows[0].count}`);
  console.log(`   Requirements: ${reqs.rows[0].count}`);
  console.log(`   Top Categories:`);
  categories.rows.forEach((r: any, i: number) => {
    console.log(`     ${i + 1}. ${r.category}: ${r.count} requirements`);
  });
  
  // Recent extractions
  const recent = await pool.query(`
    SELECT 
      p.url, p.title, p.funding_types,
      COUNT(r.id) as req_count
    FROM pages p
    LEFT JOIN requirements r ON p.id = r.page_id
    WHERE p.fetched_at > NOW() - INTERVAL '24 hours'
    GROUP BY p.id, p.url, p.title, p.funding_types
    ORDER BY p.fetched_at DESC
    LIMIT 5
  `);
  
  if (recent.rows.length > 0) {
    console.log(`\n   Recent Extractions (last 24h):`);
    recent.rows.forEach((p: any, i: number) => {
      console.log(`     ${i + 1}. ${p.title || p.url.substring(0, 50)}`);
      console.log(`        Types: ${(p.funding_types || []).join(', ') || 'None'}`);
      console.log(`        Requirements: ${p.req_count}`);
    });
  }
  
  // 2. WHAT WE LEARN
  console.log('\n' + '='.repeat(80));
  console.log('\n🧠 WHAT WE LEARN:\n');
  
  // Classification feedback
  const accuracy = await getClassificationAccuracy();
  console.log(`   📊 Classification Feedback:`);
  console.log(`      Total: ${accuracy.total} classifications`);
  console.log(`      Accuracy: ${accuracy.accuracy.toFixed(1)}%`);
  console.log(`      False Positives: ${accuracy.falsePositives}`);
  console.log(`      False Negatives: ${accuracy.falseNegatives}`);
  
  const mistakes = await getCommonMistakes();
  if (mistakes.length > 0) {
    console.log(`      Recent Mistakes: ${mistakes.length}`);
    mistakes.slice(0, 3).forEach((m: any, i: number) => {
      console.log(`        ${i + 1}. ${m.reason}: ${m.url.substring(0, 50)}`);
    });
  }
  
  // URL patterns
  const patterns = await pool.query('SELECT COUNT(*) as count FROM url_patterns');
  console.log(`\n   🔗 URL Patterns: ${patterns.rows[0].count} learned`);
  
  // Quality rules
  const qualityRules = await getStoredQualityRules();
  console.log(`\n   ✨ Quality Rules: ${qualityRules.length} funding types`);
  if (qualityRules.length > 0) {
    qualityRules.slice(0, 3).forEach((r: any, i: number) => {
      console.log(`      ${i + 1}. ${r.fundingType}: ${r.requiredFields.length} required, ${r.optionalFields.length} optional`);
    });
  }
  
  // Requirement patterns
  const reqPatterns = await getStoredRequirementPatterns();
  console.log(`\n   📋 Requirement Patterns: ${reqPatterns.length} categories`);
  if (reqPatterns.length > 0) {
    reqPatterns.slice(0, 3).forEach((p: any, i: number) => {
      console.log(`      ${i + 1}. ${p.category}:`);
      console.log(`         - Generic values: ${p.genericValues.length}`);
      console.log(`         - Duplicate patterns: ${p.duplicatePatterns.length}`);
      console.log(`         - Typical values: ${p.typicalValues.length}`);
    });
  }
  
  // 3. AUTOMATIC INTEGRATION
  console.log('\n' + '='.repeat(80));
  console.log('\n🔄 AUTOMATIC INTEGRATION:\n');
  
  const status = await getLearningStatus();
  
  // Check if improved prompts are being used
  const { getImprovedClassificationPrompt } = await import('../src/learning/auto-learning');
  const improvedPrompt = await getImprovedClassificationPrompt();
  const usesMistakes = improvedPrompt.includes('LEARNED FROM MISTAKES');
  const usesAccuracy = improvedPrompt.includes('Current accuracy');
  
  console.log(`   ✅ Classification Feedback: ${accuracy.total > 0 ? 'RECORDED' : 'Not yet'}`);
  console.log(`   ✅ Improved Prompts: ${usesMistakes ? 'USING MISTAKES' : 'Not yet'}`);
  console.log(`   ✅ Accuracy in Prompts: ${usesAccuracy ? 'SHOWN' : 'Not yet'}`);
  console.log(`   ✅ Quality Rules: ${status.qualityRulesLearned > 0 ? 'LEARNED' : 'Not yet (need 50+ pages per type)'}`);
  console.log(`   ✅ Requirement Patterns: ${reqPatterns.length > 0 ? 'APPLIED' : 'Not yet (need 1000+ requirements)'}`);
  console.log(`   ✅ URL Patterns: ${status.urlPatternsLearned > 0 ? 'LEARNED' : 'Not yet'}`);
  
  // Re-scraping status
  const reScrapeTasks = await pool.query(`
    SELECT COUNT(*) as count
    FROM pages
    WHERE metadata_json->>'is_overview_page' = 'true'
      AND (fetched_at IS NULL OR fetched_at < NOW() - INTERVAL '7 days')
  `);
  console.log(`   ✅ Re-Scraping: ${parseInt(reScrapeTasks.rows[0].count) > 0 ? `${reScrapeTasks.rows[0].count} tasks pending` : 'Up to date'}`);
  
  // Blacklist re-check status
  const lastRecheck = await pool.query(`
    SELECT MAX(updated_at) as last_check
    FROM url_patterns
    WHERE pattern_type = 'exclude' AND confidence < 0.8
  `);
  const lastCheck = lastRecheck.rows[0]?.last_check;
  const daysSince = lastCheck 
    ? Math.floor((Date.now() - new Date(lastCheck).getTime()) / (1000 * 60 * 60 * 24))
    : 999;
  console.log(`   ✅ Blacklist Re-Check: ${daysSince < 7 ? `Last check ${daysSince} days ago` : 'Due for re-check'}`);
  
  console.log('\n' + '='.repeat(80));
  console.log('\n✅ Full Cycle Status Complete!\n');
  console.log('💡 Run a small batch to see it in action:');
  console.log('   npm run scraper:unified -- full --max=3\n');
}

main().catch(console.error);


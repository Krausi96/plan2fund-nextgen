/**
 * Autonomous Learning System
 * Automatically learns patterns and improves over time
 */

import { getPool } from '../../db/db';
import { learnAllPatterns, QualityRule } from './learn-quality-patterns';
import { getClassificationAccuracy, getCommonMistakes } from './classification-feedback';

/**
 * Check if it's time to learn quality patterns automatically
 * Runs every 100 new pages
 */
export async function shouldLearnQualityPatterns(): Promise<boolean> {
  try {
    const pool = getPool();
    const result = await pool.query(`
      SELECT COUNT(*) as count
      FROM pages
      WHERE fetched_at > NOW() - INTERVAL '7 days'
    `);
    
    const newPagesCount = parseInt(result.rows[0].count) || 0;
    
    // Learn patterns every 100 new pages
    return newPagesCount >= 100 && newPagesCount % 100 === 0;
  } catch {
    return false;
  }
}

/**
 * Automatically learn quality patterns if enough examples exist
 */
export async function autoLearnQualityPatterns(): Promise<QualityRule[] | null> {
  try {
    const pool = getPool();
    
    // Check if we have enough examples (at least 50 per funding type)
    const typesResult = await pool.query(`
      SELECT 
        unnest(funding_types) as funding_type,
        COUNT(*) as count
      FROM pages
      WHERE funding_types IS NOT NULL AND array_length(funding_types, 1) > 0
      GROUP BY unnest(funding_types)
      HAVING COUNT(*) >= 50
    `);
    
    if (typesResult.rows.length === 0) {
      console.log('📊 Not enough examples yet for pattern learning (need 50+ per type)');
      return null;
    }
    
    console.log(`🧠 Auto-learning quality patterns for ${typesResult.rows.length} funding types...`);
    const rules = await learnAllPatterns();
    
    // Store learned rules in database
    await storeQualityRules(rules);
    
    return rules;
  } catch (error: any) {
    console.warn(`⚠️  Auto-learning failed: ${error.message}`);
    return null;
  }
}

/**
 * Store quality rules in database for later use
 */
async function storeQualityRules(rules: QualityRule[]): Promise<void> {
  try {
    const pool = getPool();
    
    // Create table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS quality_rules (
        id SERIAL PRIMARY KEY,
        funding_type VARCHAR(50) NOT NULL,
        required_fields JSONB,
        optional_fields JSONB,
        typical_values JSONB,
        completeness_threshold INTEGER,
        learned_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(funding_type)
      )
    `);
    
    // Store each rule
    for (const rule of rules) {
      await pool.query(`
        INSERT INTO quality_rules (
          funding_type, required_fields, optional_fields, typical_values, completeness_threshold
        ) VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (funding_type) DO UPDATE SET
          required_fields = EXCLUDED.required_fields,
          optional_fields = EXCLUDED.optional_fields,
          typical_values = EXCLUDED.typical_values,
          completeness_threshold = EXCLUDED.completeness_threshold,
          learned_at = NOW()
      `, [
        rule.fundingType,
        JSON.stringify(rule.requiredFields),
        JSON.stringify(rule.optionalFields),
        JSON.stringify(rule.typicalValues),
        rule.completenessThreshold
      ]);
    }
    
    console.log(`✅ Stored ${rules.length} quality rules in database`);
  } catch (error: any) {
    console.warn(`⚠️  Failed to store quality rules: ${error.message}`);
  }
}

/**
 * Get stored quality rules
 */
export async function getStoredQualityRules(): Promise<QualityRule[]> {
  try {
    const pool = getPool();
    const result = await pool.query(`
      SELECT funding_type, required_fields, optional_fields, typical_values, completeness_threshold
      FROM quality_rules
      ORDER BY learned_at DESC
    `);
    
    return result.rows.map((r: any) => ({
      fundingType: r.funding_type,
      requiredFields: r.required_fields || [],
      optionalFields: r.optional_fields || [],
      typicalValues: r.typical_values || {},
      completenessThreshold: r.completeness_threshold || 70
    }));
  } catch {
    return [];
  }
}

/**
 * Generate improved classification prompt based on past mistakes
 */
export async function getImprovedClassificationPrompt(): Promise<string> {
  const mistakes = await getCommonMistakes();
  const accuracy = await getClassificationAccuracy();
  
  let prompt = `Classify this URL to determine if it's a funding program page.

URL: {url}
Title: {title}
Description: {description}

Respond with JSON:
{
  "isProgramPage": "yes" | "no" | "maybe",
  "fundingType": "grant" | "loan" | "equity" | "guarantee" | "subsidy" | "unknown",
  "qualityScore": 0-100,
  "isOverviewPage": true | false,
  "reason": "brief explanation"
}

Rules:
- "yes" = Definitely a funding program page (has specific program details, funding amounts, eligibility)
- "maybe" = Could be, needs verification
- "no" = Not a funding program (news, contact, about, team, imprint, privacy, etc.)
- qualityScore: 0-100 based on how likely it contains useful program information
- isOverviewPage: true if this lists multiple programs

EXCLUDE these URL patterns (NOT programs):
- /about-us/, /about/, /ueber/, /chi-siamo/
- /contact/, /kontakt/, /contact-us/
- /team/, /team-members/
- /news/, /press/, /media/
- /imprint/, /impressum/, /privacy/, /datenschutz/
- /legal/, /terms/, /conditions/`;

  // Add examples from mistakes
  if (mistakes.length > 0) {
    prompt += `\n\nLEARNED FROM MISTAKES:\n`;
    const falsePositives = mistakes.filter(m => !m.actual).slice(0, 3);
    const falseNegatives = mistakes.filter(m => m.actual).slice(0, 3);
    
    if (falsePositives.length > 0) {
      prompt += `\nFalse Positives (classified as program but weren't):\n`;
      falsePositives.forEach(m => {
        prompt += `- ${m.url}\n`;
      });
    }
    
    if (falseNegatives.length > 0) {
      prompt += `\nFalse Negatives (were programs but classified as no):\n`;
      falseNegatives.forEach(m => {
        prompt += `- ${m.url}\n`;
      });
    }
  }
  
  if (accuracy.accuracy > 0) {
    prompt += `\n\nCurrent accuracy: ${accuracy.accuracy.toFixed(1)}%`;
  }
  
  return prompt;
}

/**
 * Monitor and report learning status
 */
export async function getLearningStatus(): Promise<{
  classificationAccuracy: number;
  qualityRulesLearned: number;
  urlPatternsLearned: number;
  totalFeedback: number;
}> {
  try {
    const pool = getPool();
    const accuracy = await getClassificationAccuracy();
    
    const rulesResult = await pool.query('SELECT COUNT(*) as count FROM quality_rules');
    const patternsResult = await pool.query('SELECT COUNT(*) as count FROM url_patterns');
    const feedbackResult = await pool.query('SELECT COUNT(*) as count FROM classification_feedback');
    
    return {
      classificationAccuracy: accuracy.accuracy,
      qualityRulesLearned: parseInt(rulesResult.rows[0].count) || 0,
      urlPatternsLearned: parseInt(patternsResult.rows[0].count) || 0,
      totalFeedback: parseInt(feedbackResult.rows[0].count) || 0
    };
  } catch {
    return {
      classificationAccuracy: 0,
      qualityRulesLearned: 0,
      urlPatternsLearned: 0,
      totalFeedback: 0
    };
  }
}


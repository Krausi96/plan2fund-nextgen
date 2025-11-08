/**
 * Autonomous Learning System
 * Unified learning module - combines all learning functionality
 * 
 * Merged from:
 * - auto-learning.ts (orchestration)
 * - classification-feedback.ts (feedback tracking)
 * - learn-quality-patterns.ts (quality pattern learning)
 * - learn-requirement-patterns.ts (requirement pattern learning)
 */

import { getPool } from '../../db/db';
import { isCustomLLMEnabled, callCustomLLM } from '../../../shared/lib/customLLM';
import OpenAI from 'openai';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface QualityRule {
  fundingType: string;
  requiredFields: string[]; // Fields that must be present
  optionalFields: string[]; // Fields that are nice to have
  typicalValues: Record<string, any>; // Typical values for fields
  completenessThreshold: number; // Minimum completeness score (0-100)
}

export interface PatternAnalysis {
  fundingType: string;
  totalExamples: number;
  commonFields: Array<{ field: string; presentIn: number; percentage: number }>;
  typicalAmounts: { min?: number; max?: number; currency?: string };
  typicalDeadlines: { hasDeadline: number; rolling: number };
  requiredFields: string[];
  optionalFields: string[];
}

export interface RequirementPattern {
  category: string;
  genericValues: string[]; // Values to filter out (e.g., "SME", "all", "none specified")
  duplicatePatterns: Array<{ pattern: string; keep: string; remove: string[] }>; // Deduplication rules
  typicalValues: string[]; // Good example values
}

export interface ClassificationFeedback {
  url: string;
  predictedIsProgram: 'yes' | 'no' | 'maybe';
  predictedQuality: number;
  actualIsProgram: boolean; // True if page was successfully scraped with 5+ requirements
  actualQuality: number; // Number of requirements extracted
  wasCorrect: boolean;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Lazy initialization - only create client if API key exists
function getOpenAIClient(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) return null;
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

// ============================================================================
// CLASSIFICATION FEEDBACK (from classification-feedback.ts)
// ============================================================================

/**
 * Record feedback after scraping a page
 */
export async function recordClassificationFeedback(
  url: string,
  predictedIsProgram: 'yes' | 'no' | 'maybe',
  predictedQuality: number,
  actualRequirementCount: number
): Promise<void> {
  try {
    const pool = getPool();
    const actualIsProgram = actualRequirementCount >= 5; // Good page if 5+ requirements
    const wasCorrect = 
      (predictedIsProgram === 'yes' && actualIsProgram) ||
      (predictedIsProgram === 'no' && !actualIsProgram) ||
      (predictedIsProgram === 'maybe' && actualIsProgram); // "maybe" is correct if it's a program
    
    await pool.query(`
      INSERT INTO classification_feedback (
        url, predicted_is_program, predicted_quality,
        actual_is_program, actual_quality, was_correct, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
      ON CONFLICT (url) DO UPDATE SET
        actual_is_program = EXCLUDED.actual_is_program,
        actual_quality = EXCLUDED.actual_quality,
        was_correct = EXCLUDED.was_correct,
        updated_at = NOW()
    `, [url, predictedIsProgram, predictedQuality, actualIsProgram, actualRequirementCount, wasCorrect]);
  } catch (error: any) {
    // Silently fail - feedback is optional
    console.warn(`Failed to record feedback for ${url}: ${error.message}`);
  }
}

/**
 * Get classification accuracy statistics
 */
export async function getClassificationAccuracy(): Promise<{
  total: number;
  correct: number;
  accuracy: number;
  falsePositives: number; // Classified as program but wasn't
  falseNegatives: number; // Classified as not program but was
}> {
  try {
    const pool = getPool();
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE was_correct = true) as correct,
        COUNT(*) FILTER (WHERE predicted_is_program IN ('yes', 'maybe') AND actual_is_program = false) as false_positives,
        COUNT(*) FILTER (WHERE predicted_is_program = 'no' AND actual_is_program = true) as false_negatives
      FROM classification_feedback
    `);
    
    const row = result.rows[0];
    const total = parseInt(row.total) || 0;
    const correct = parseInt(row.correct) || 0;
    const accuracy = total > 0 ? (correct / total) * 100 : 0;
    
    return {
      total,
      correct,
      accuracy,
      falsePositives: parseInt(row.false_positives) || 0,
      falseNegatives: parseInt(row.false_negatives) || 0
    };
  } catch {
    return { total: 0, correct: 0, accuracy: 0, falsePositives: 0, falseNegatives: 0 };
  }
}

/**
 * Get common mistakes to improve prompts
 */
export async function getCommonMistakes(): Promise<Array<{
  url: string;
  predicted: string;
  actual: boolean;
  reason: string;
}>> {
  try {
    const pool = getPool();
    const result = await pool.query(`
      SELECT url, predicted_is_program, actual_is_program
      FROM classification_feedback
      WHERE was_correct = false
      ORDER BY created_at DESC
      LIMIT 20
    `);
    
    return result.rows.map((r: any) => ({
      url: r.url,
      predicted: r.predicted_is_program,
      actual: r.actual_is_program,
      reason: r.actual_is_program 
        ? 'False negative: Was a program but classified as no/maybe'
        : 'False positive: Not a program but classified as yes/maybe'
    }));
  } catch {
    return [];
  }
}

// ============================================================================
// QUALITY PATTERN LEARNING (from learn-quality-patterns.ts)
// ============================================================================

/**
 * Analyze 50 examples of a funding type to learn patterns
 */
export async function analyzeFundingType(fundingType: string, limit: number = 50): Promise<PatternAnalysis> {
  const pool = getPool();
  
  // Get examples from database
  const result = await pool.query(`
    SELECT 
      p.url, p.title, p.description,
      p.funding_amount_min, p.funding_amount_max, p.currency,
      p.deadline, p.open_deadline,
      p.funding_types, p.program_focus, p.region,
      p.metadata_json,
      COUNT(r.id) as requirement_count
    FROM pages p
    LEFT JOIN requirements r ON p.id = r.page_id
    WHERE $1 = ANY(p.funding_types)
    ORDER BY p.fetched_at DESC
    LIMIT $2
  `, [fundingType, limit]);

  if (result.rows.length === 0) {
    throw new Error(`No examples found for funding type: ${fundingType}`);
  }

  const examples = result.rows;
  
  // Analyze with LLM
  const analysisPrompt = `Analyze these ${examples.length} examples of ${fundingType} funding programs to identify patterns.

Examples:
${examples.map((ex: any, idx: number) => `
${idx + 1}. ${ex.title || ex.url}
   Amount: ${ex.funding_amount_min || 'N/A'} - ${ex.funding_amount_max || 'N/A'} ${ex.currency || ''}
   Deadline: ${ex.deadline || (ex.open_deadline ? 'Rolling' : 'N/A')}
   Requirements: ${ex.requirement_count || 0}
   Focus: ${(ex.program_focus || []).join(', ') || 'N/A'}
`).join('\n')}

Analyze and respond with JSON:
{
  "commonFields": [
    {"field": "funding_amount", "presentIn": 45, "percentage": 90},
    {"field": "deadline", "presentIn": 30, "percentage": 60},
    ...
  ],
  "typicalAmounts": {
    "min": 10000,
    "max": 500000,
    "currency": "EUR"
  },
  "typicalDeadlines": {
    "hasDeadline": 30,
    "rolling": 20
  },
  "requiredFields": ["funding_amount", "eligibility"],
  "optionalFields": ["deadline", "contact_email"],
  "completenessThreshold": 70
}

Rules:
- requiredFields: Fields present in >80% of examples
- optionalFields: Fields present in 20-80% of examples
- typicalAmounts: Most common amount ranges
- completenessThreshold: Minimum score for a page to be considered "complete"`;

  try {
    let responseText: string | null = null;

    if (isCustomLLMEnabled()) {
      try {
        const customResponse = await callCustomLLM({
          messages: [
            { role: 'system', content: 'You are a data quality analyst. Respond only with valid JSON.' },
            { role: 'user', content: analysisPrompt }
          ],
          responseFormat: 'json',
          temperature: 0.3,
          maxTokens: 2000,
        });
        responseText = customResponse.output;
      } catch {
        // Fall through to OpenAI
      }
    }

    if (!responseText) {
      const openai = getOpenAIClient();
      if (!openai) {
        throw new Error('OpenAI API key not set. Set OPENAI_API_KEY or CUSTOM_LLM_ENDPOINT in .env.local');
      }
      const completion = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || process.env.SCRAPER_MODEL_VERSION || "gpt-4o-mini",
        messages: [
          { role: 'system', content: 'You are a data quality analyst. Respond only with valid JSON.' },
          { role: 'user', content: analysisPrompt }
        ],
        response_format: { type: "json_object" },
        max_tokens: 2000,
        temperature: 0.3,
      });
      responseText = completion.choices[0]?.message?.content || '{}';
    }

    const parsed = typeof responseText === 'string' ? JSON.parse(responseText) : responseText;

    return {
      fundingType,
      totalExamples: examples.length,
      commonFields: parsed.commonFields || [],
      typicalAmounts: parsed.typicalAmounts || {},
      typicalDeadlines: parsed.typicalDeadlines || { hasDeadline: 0, rolling: 0 },
      requiredFields: parsed.requiredFields || [],
      optionalFields: parsed.optionalFields || [],
    };
  } catch (error: any) {
    throw new Error(`Failed to analyze funding type: ${error.message}`);
  }
}

/**
 * Generate quality rules from analysis
 */
export function generateQualityRules(analysis: PatternAnalysis): QualityRule {
  return {
    fundingType: analysis.fundingType,
    requiredFields: analysis.requiredFields,
    optionalFields: analysis.optionalFields,
    typicalValues: {
      amounts: analysis.typicalAmounts,
      deadlines: analysis.typicalDeadlines
    },
    completenessThreshold: 70 // Default, can be adjusted per type
  };
}

/**
 * Learn patterns for all funding types
 */
export async function learnAllPatterns(): Promise<QualityRule[]> {
  const pool = getPool();
  
  // Get all funding types from database
  const typesResult = await pool.query(`
    SELECT DISTINCT unnest(funding_types) as funding_type
    FROM pages
    WHERE funding_types IS NOT NULL AND array_length(funding_types, 1) > 0
    ORDER BY funding_type
  `);

  const fundingTypes = typesResult.rows.map((r: any) => r.funding_type);
  
  console.log(`📊 Learning patterns for ${fundingTypes.length} funding types: ${fundingTypes.join(', ')}\n`);

  const rules: QualityRule[] = [];

  for (const fundingType of fundingTypes) {
    try {
      console.log(`🔍 Analyzing ${fundingType}...`);
      const analysis = await analyzeFundingType(fundingType, 50);
      const rule = generateQualityRules(analysis);
      rules.push(rule);
      console.log(`   ✅ ${fundingType}: ${rule.requiredFields.length} required, ${rule.optionalFields.length} optional fields\n`);
    } catch (error: any) {
      console.warn(`   ⚠️  Failed to analyze ${fundingType}: ${error.message}\n`);
    }
  }

  return rules;
}

// ============================================================================
// REQUIREMENT PATTERN LEARNING (from learn-requirement-patterns.ts)
// ============================================================================

/**
 * Learn requirement patterns from existing data
 */
export async function learnRequirementPatterns(): Promise<RequirementPattern[]> {
  const pool = getPool();
  
  // Get all categories with their values
  const categoriesResult = await pool.query(`
    SELECT 
      category,
      value,
      meaningfulness_score,
      COUNT(*) as count
    FROM requirements
    WHERE value IS NOT NULL
    GROUP BY category, value, meaningfulness_score
    ORDER BY category, count DESC
  `);
  
  // Group by category
  const byCategory: Record<string, Array<{ value: string; meaning: number | null; count: number }>> = {};
  categoriesResult.rows.forEach((r: any) => {
    if (!byCategory[r.category]) {
      byCategory[r.category] = [];
    }
    byCategory[r.category].push({
      value: r.value,
      meaning: r.meaningfulness_score,
      count: r.count
    });
  });
  
  const patterns: RequirementPattern[] = [];
  
  // Analyze each category
  for (const [category, values] of Object.entries(byCategory)) {
    // Find generic values (low meaningfulness, high frequency)
    const genericValues = values
      .filter(v => (v.meaning !== null && v.meaning < 10) || 
                   ['SME', 'all', 'none specified', 'N/A', 'Not specified', 'Nicht angegeben', 'Keine Angabe', ''].includes(v.value.trim()))
      .map(v => v.value)
      .slice(0, 20); // Top 20 generic values
    
    // Find potential duplicates (similar values with different meaningfulness)
    const duplicates: Array<{ pattern: string; keep: string; remove: string[] }> = [];
    const valueMap = new Map<string, { meaning: number | null; count: number }>();
    
    values.forEach(v => {
      const key = v.value.toLowerCase().trim();
      const existing = valueMap.get(key);
      if (!existing || (v.meaning !== null && (existing.meaning === null || v.meaning > existing.meaning))) {
        valueMap.set(key, { meaning: v.meaning, count: v.count });
      }
    });
    
    // Find similar values (fuzzy matching)
    const similarGroups: string[][] = [];
    const processed = new Set<string>();
    
    values.forEach(v1 => {
      if (processed.has(v1.value)) return;
      const group = [v1.value];
      processed.add(v1.value);
      
      values.forEach(v2 => {
        if (v1.value === v2.value || processed.has(v2.value)) return;
        
        // Check if similar (one contains the other, or very similar)
        const v1Lower = v1.value.toLowerCase();
        const v2Lower = v2.value.toLowerCase();
        
        if (v1Lower.includes(v2Lower) || v2Lower.includes(v1Lower)) {
          // Keep the one with higher meaningfulness
          const keep = (v1.meaning || 0) >= (v2.meaning || 0) ? v1.value : v2.value;
          const remove = keep === v1.value ? v2.value : v1.value;
          
          if (!duplicates.find(d => d.keep === keep)) {
            duplicates.push({ pattern: v1Lower, keep, remove: [remove] });
          } else {
            const dup = duplicates.find(d => d.keep === keep);
            if (dup && !dup.remove.includes(remove)) {
              dup.remove.push(remove);
            }
          }
          
          group.push(v2.value);
          processed.add(v2.value);
        }
      });
      
      if (group.length > 1) {
        similarGroups.push(group);
      }
    });
    
    // Get typical good values (high meaningfulness)
    const typicalValues = values
      .filter(v => v.meaning !== null && v.meaning >= 50)
      .sort((a, b) => (b.meaning || 0) - (a.meaning || 0))
      .slice(0, 10)
      .map(v => v.value);
    
    if (genericValues.length > 0 || duplicates.length > 0 || typicalValues.length > 0) {
      patterns.push({
        category,
        genericValues,
        duplicatePatterns: duplicates.slice(0, 10), // Top 10 duplicates
        typicalValues
      });
    }
  }
  
  return patterns;
}

/**
 * Store learned patterns in database
 */
export async function storeRequirementPatterns(patterns: RequirementPattern[]): Promise<void> {
  const pool = getPool();
  
  // Create table if it doesn't exist
  await pool.query(`
    CREATE TABLE IF NOT EXISTS requirement_patterns (
      id SERIAL PRIMARY KEY,
      category VARCHAR(50) NOT NULL,
      generic_values JSONB,
      duplicate_patterns JSONB,
      typical_values JSONB,
      learned_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(category)
    )
  `);
  
  // Store each pattern
  for (const pattern of patterns) {
    await pool.query(`
      INSERT INTO requirement_patterns (
        category, generic_values, duplicate_patterns, typical_values
      ) VALUES ($1, $2, $3, $4)
      ON CONFLICT (category) DO UPDATE SET
        generic_values = EXCLUDED.generic_values,
        duplicate_patterns = EXCLUDED.duplicate_patterns,
        typical_values = EXCLUDED.typical_values,
        learned_at = NOW()
    `, [
      pattern.category,
      JSON.stringify(pattern.genericValues),
      JSON.stringify(pattern.duplicatePatterns),
      JSON.stringify(pattern.typicalValues)
    ]);
  }
}

/**
 * Get stored requirement patterns
 */
export async function getStoredRequirementPatterns(): Promise<RequirementPattern[]> {
  try {
    const pool = getPool();
    const result = await pool.query(`
      SELECT category, generic_values, duplicate_patterns, typical_values
      FROM requirement_patterns
      ORDER BY category
    `);
    
    return result.rows.map((r: any) => ({
      category: r.category,
      genericValues: r.generic_values || [],
      duplicatePatterns: r.duplicate_patterns || [],
      typicalValues: r.typical_values || []
    }));
  } catch {
    return [];
  }
}

/**
 * Auto-learn requirement patterns (called by auto-learning system)
 */
export async function autoLearnRequirementPatterns(): Promise<RequirementPattern[] | null> {
  try {
    const pool = getPool();
    
    // Check if we have enough requirements (at least 1000)
    const countResult = await pool.query(`
      SELECT COUNT(*) as count FROM requirements
    `);
    
    const totalReqs = parseInt(countResult.rows[0].count) || 0;
    if (totalReqs < 1000) {
      console.log('📊 Not enough requirements yet for pattern learning (need 1000+)');
      return null;
    }
    
    console.log(`🧠 Auto-learning requirement patterns from ${totalReqs} requirements...`);
    const patterns = await learnRequirementPatterns();
    
    // Store learned patterns
    await storeRequirementPatterns(patterns);
    
    console.log(`✅ Learned patterns for ${patterns.length} categories`);
    return patterns;
  } catch (error: any) {
    console.warn(`⚠️  Auto-learning requirement patterns failed: ${error.message}`);
    return null;
  }
}

// ============================================================================
// AUTO-LEARNING ORCHESTRATION
// ============================================================================

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
    
    // Also learn requirement patterns
    console.log(`🧠 Auto-learning requirement patterns...`);
    await autoLearnRequirementPatterns();
    
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

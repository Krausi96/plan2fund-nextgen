/**
 * LLM-Based Quality Pattern Learning
 * Analyzes examples to learn what makes a good funding program page
 */

import { getPool } from '../db/db';
import { isCustomLLMEnabled, callCustomLLM } from '../../../shared/lib/customLLM';
import OpenAI from 'openai';

// Lazy initialization - only create client if API key exists
function getOpenAIClient(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) return null;
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

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
${examples.map((ex, idx) => `
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


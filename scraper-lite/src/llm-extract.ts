/**
 * LLM-Based Extraction Service
 * Uses OpenAI GPT-4o-mini to extract all 35 requirement categories from HTML
 * Replaces pattern-based extraction with semantic understanding
 */

import OpenAI from 'openai';
import * as cheerio from 'cheerio';
import { REQUIREMENT_CATEGORIES, RequirementItem, calculateMeaningfulnessScore } from './extract';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface LLMExtractionRequest {
  html: string;
  url: string;
  title?: string;
  description?: string;
}

interface LLMExtractionResponse {
  categorized_requirements: Record<string, RequirementItem[]>;
  metadata: {
    funding_amount_min?: number | null;
    funding_amount_max?: number | null;
    currency?: string;
    deadline?: string | null;
    open_deadline?: boolean;
    contact_email?: string | null;
    contact_phone?: string | null;
    funding_types?: string[];
    program_focus?: string[];
    region?: string;
  };
}

/**
 * Extract all requirements using LLM
 */
export async function extractWithLLM(
  request: LLMExtractionRequest
): Promise<LLMExtractionResponse> {
  const { html, url, title, description } = request;

  // Check if we're in test mode (no API key)
  const isTestMode = !process.env.OPENAI_API_KEY;
  
  if (isTestMode) {
    console.warn('⚠️  LLM extraction: No OPENAI_API_KEY found, using fallback extraction');
    // Fallback to pattern-based extraction if no API key
    const { extractAllRequirements, extractMeta } = await import('./extract');
    const $ = cheerio.load(html);
    const text = $('body').text();
    const categorized = await extractAllRequirements(text, url);
    const meta = extractMeta($, html, url);
    return {
      categorized_requirements: categorized,
      metadata: meta
    };
  }

  // Clean HTML and extract text
  const $ = cheerio.load(html);
  
  // Remove script, style, and other non-content elements
  $('script, style, nav, footer, header, aside, .advertisement, .cookie-banner').remove();
  
  // Extract main content
  const mainContent = $('main, article, .content, #content, .main-content').first();
  const contentText = mainContent.length > 0 
    ? mainContent.text() 
    : $('body').text();
  
  // Limit content size (GPT-4o-mini has token limits)
  const MAX_CONTENT_LENGTH = 50000; // ~12,500 tokens
  const truncatedContent = contentText.length > MAX_CONTENT_LENGTH
    ? contentText.substring(0, MAX_CONTENT_LENGTH) + '... [content truncated]'
    : contentText;

  // Create structured prompt
  const systemPrompt = createSystemPrompt();
  const userPrompt = createUserPrompt({
    url,
    title: title || 'Unknown',
    description: description || '',
    content: truncatedContent
  });

  try {
    // Call OpenAI API with structured output
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Cost-effective model
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" }, // Structured output
      max_tokens: 4000, // Large enough for all categories
      temperature: 0.3, // Lower temperature for more consistent extraction
    });

    const responseText = completion.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(responseText);

    // Transform LLM response to our format
    return transformLLMResponse(parsed, url);
  } catch (error) {
    console.error('LLM extraction failed:', error);
    
    // Fallback to pattern-based extraction
    console.warn('⚠️  Falling back to pattern-based extraction');
    const { extractAllRequirements, extractMeta } = await import('./extract');
    const text = $('body').text();
    const categorized = await extractAllRequirements(text, url);
    const meta = extractMeta($, html, url);
    return {
      categorized_requirements: categorized,
      metadata: meta
    };
  }
}

/**
 * Create system prompt for LLM extraction
 */
function createSystemPrompt(): string {
  return `You are an expert at extracting structured data from funding program web pages.

Your task is to extract all relevant information about a funding program and return it as structured JSON.

REQUIREMENT CATEGORIES (extract all that apply):
1. Eligibility:
   - company_type: Type of company eligible (e.g., "SME", "Startup", "Large company")
   - company_stage: Stage of company (e.g., "Early stage", "Growth stage", "Mature")
   - industry_restriction: Industry restrictions or focus areas
   - eligibility_criteria: General eligibility requirements

2. Documents: Required documents for application

3. Financial:
   - funding_amount_min: Minimum funding amount (number)
   - funding_amount_max: Maximum funding amount (number)
   - currency: Currency code (e.g., "EUR", "USD")
   - funding_amount_status: Status (e.g., "fixed", "variable", "contact_for_amount")

4. Technical: Technical requirements or specifications

5. Legal: Legal requirements or compliance needs

6. Timeline:
   - deadline: Application deadline (date string)
   - open_deadline: Whether deadline is rolling/open (boolean)
   - duration: Project duration

7. Geographic: Geographic eligibility (countries, regions)

8. Team: Team size, composition, or requirements

9. Project:
   - innovation_focus: Innovation focus areas
   - technology_area: Technology areas
   - research_domain: Research domains
   - sector_focus: Sector focus

10. Compliance: Compliance requirements

11. Impact:
    - environmental_impact: Environmental impact requirements
    - social_impact: Social impact requirements
    - economic_impact: Economic impact requirements
    - innovation_impact: Innovation impact requirements

12. Other:
    - capex_opex: Capital vs operational expenditure
    - use_of_funds: How funds can be used
    - revenue_model: Revenue model requirements
    - market_size: Market size requirements
    - co_financing: Co-financing requirements
    - trl_level: Technology readiness level
    - consortium: Consortium requirements
    - diversity: Diversity requirements
    - application_process: Application process description
    - evaluation_criteria: Evaluation criteria
    - repayment_terms: Repayment terms (for loans)
    - equity_terms: Equity terms (for equity funding)
    - intellectual_property: IP requirements
    - success_metrics: Success metrics or KPIs
    - restrictions: Restrictions or limitations

OUTPUT FORMAT (JSON):
{
  "metadata": {
    "funding_amount_min": number | null,
    "funding_amount_max": number | null,
    "currency": "EUR" | "USD" | etc.,
    "deadline": "YYYY-MM-DD" | null,
    "open_deadline": boolean,
    "contact_email": "email@example.com" | null,
    "contact_phone": "+43..." | null,
    "funding_types": ["grants", "loans", "equity", "services"],
    "program_focus": ["innovation", "research", "startup", etc.],
    "region": "Austria" | "Germany" | "EU" | etc.
  },
  "requirements": {
    "category_name": [
      {
        "type": "requirement_type",
        "value": "requirement value",
        "required": true | false,
        "source": "llm_extraction"
      }
    ]
  }
}

RULES:
- Extract ALL categories that have relevant information
- If information is not available, omit the category (don't include empty arrays)
- Be specific and accurate - extract actual values, not generic descriptions
- For financial amounts, extract numbers only (no currency symbols in numbers)
- For dates, use ISO format (YYYY-MM-DD)
- For boolean values, use true/false
- Include meaningfulness: only extract specific, actionable information
- If information is ambiguous or unclear, omit it rather than guessing
- Extract contact information (email, phone) from the page
- Identify funding types (grants, loans, equity, services) from context
- Determine region from URL, content, or institution name`;
}

/**
 * Create user prompt with page content
 */
function createUserPrompt(context: {
  url: string;
  title: string;
  description: string;
  content: string;
}): string {
  return `Extract all funding program information from this page:

URL: ${context.url}
Title: ${context.title}
Description: ${context.description}

Page Content:
${context.content}

Extract all relevant information and return as JSON following the specified format.`;
}

/**
 * Transform LLM JSON response to our internal format
 */
function transformLLMResponse(
  llmResponse: any,
  url: string
): LLMExtractionResponse {
  const categorized: Record<string, RequirementItem[]> = {};
  
  // Transform requirements
  if (llmResponse.requirements && typeof llmResponse.requirements === 'object') {
    Object.entries(llmResponse.requirements).forEach(([category, items]: [string, any]) => {
      if (Array.isArray(items)) {
        categorized[category] = items.map((item: any) => ({
          type: item.type || 'general',
          value: String(item.value || ''),
          required: item.required !== undefined ? Boolean(item.required) : false,
          source: 'llm_extraction',
          description: item.description,
          format: item.format,
          meaningfulness_score: calculateMeaningfulnessScore(item.value || '')
        })).filter((item: RequirementItem) => 
          item.value && item.value.trim().length > 0
        );
      }
    });
  }

  // Transform metadata
  const metadata = {
    funding_amount_min: llmResponse.metadata?.funding_amount_min ?? null,
    funding_amount_max: llmResponse.metadata?.funding_amount_max ?? null,
    currency: llmResponse.metadata?.currency || 'EUR',
    deadline: llmResponse.metadata?.deadline || null,
    open_deadline: llmResponse.metadata?.open_deadline || false,
    contact_email: llmResponse.metadata?.contact_email || null,
    contact_phone: llmResponse.metadata?.contact_phone || null,
    funding_types: llmResponse.metadata?.funding_types || [],
    program_focus: llmResponse.metadata?.program_focus || [],
    region: llmResponse.metadata?.region || null
  };

  return {
    categorized_requirements: categorized,
    metadata
  };
}

/**
 * Hybrid extraction: Use LLM for missing categories, pattern-based for high-coverage categories
 */
export async function extractHybrid(
  html: string,
  url: string,
  title?: string,
  description?: string
): Promise<LLMExtractionResponse> {
  // First, try pattern-based extraction for fast, high-coverage categories
  const { extractAllRequirements, extractMeta } = await import('./extract');
  const $ = cheerio.load(html);
  const text = $('body').text();
  
  const patternBased = await extractAllRequirements(text, url);
  const meta = extractMeta($, html, url);
  
  // Identify missing categories
  const highCoverageCategories = ['financial', 'innovation_focus']; // Categories that work well with patterns
  const missingCategories = REQUIREMENT_CATEGORIES.filter(cat => 
    !highCoverageCategories.includes(cat) && 
    (!patternBased[cat] || patternBased[cat].length === 0)
  );
  
  // If many categories are missing, use LLM for all
  if (missingCategories.length > 10) {
    console.log(`📊 Many categories missing (${missingCategories.length}), using full LLM extraction`);
    return extractWithLLM({ html, url, title, description });
  }
  
  // Otherwise, use LLM only for missing categories
  if (missingCategories.length > 0) {
    console.log(`📊 Using LLM to fill ${missingCategories.length} missing categories: ${missingCategories.join(', ')}`);
    const llmResult = await extractWithLLM({ html, url, title, description });
    
    // Merge: pattern-based for high coverage, LLM for missing
    const merged: Record<string, RequirementItem[]> = { ...patternBased };
    missingCategories.forEach(cat => {
      if (llmResult.categorized_requirements[cat] && llmResult.categorized_requirements[cat].length > 0) {
        merged[cat] = llmResult.categorized_requirements[cat];
      }
    });
    
    // Merge metadata (prefer LLM if available)
    const mergedMeta = {
      ...meta,
      ...llmResult.metadata,
      // Prefer pattern-based for financial (it works well)
      funding_amount_min: meta.funding_amount_min ?? llmResult.metadata.funding_amount_min,
      funding_amount_max: meta.funding_amount_max ?? llmResult.metadata.funding_amount_max,
      currency: meta.currency || llmResult.metadata.currency
    };
    
    return {
      categorized_requirements: merged,
      metadata: mergedMeta
    };
  }
  
  // All categories covered by patterns
  return {
    categorized_requirements: patternBased,
    metadata: meta
  };
}


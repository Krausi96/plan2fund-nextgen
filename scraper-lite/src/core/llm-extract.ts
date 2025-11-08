/**
 * LLM-Based Extraction Service
 * Uses OpenAI GPT-4o-mini to extract all 35 requirement categories from HTML
 * Replaces pattern-based extraction with semantic understanding
 */

import OpenAI from 'openai';
import * as cheerio from 'cheerio';
// Types defined inline (extract.ts was moved to legacy)
export interface RequirementItem {
  type: string;
  value: any;
  confidence?: number;
  meaningfulness_score?: number;
  source?: string;
  description?: string;
  format?: string;
}

// REQUIREMENT_CATEGORIES - Now using dynamic categories from LLM prompt
// Categories: eligibility, documents, financial, technical, legal, timeline,
// geographic, team, project, compliance, impact, application, funding_details,
// restrictions, terms

function calculateMeaningfulnessScore(text: any): number {
  // Handle non-string values (numbers, objects, etc.)
  const textStr = typeof text === 'string' ? text : (text ? String(text) : '');
  if (!textStr || textStr.trim().length === 0) return 0;
  
  const trimmed = textStr.trim();
  const length = trimmed.length;
  
  // Single words, booleans, acronyms get 0 (not meaningful requirements)
  const singleWordPatterns = [
    /^(yes|no|true|false|both|none|all|any)$/i,
    /^(sme|startup|large|small|medium)$/i,
    /^(eur|usd|gbp|chf)$/i,
    /^(grant|loan|equity|guarantee|subsidy)$/i,
    /^[A-Z]{2,10}$/, // Acronyms like "COST", "EU", "AMS"
  ];
  
  if (singleWordPatterns.some(pattern => pattern.test(trimmed))) {
    return 0;
  }
  
  // Filter negative information (should be caught earlier, but double-check)
  const negativePatterns = [
    /^no\s+specific/i,
    /^none\s+mentioned/i,
    /^not\s+specified/i,
  ];
  if (negativePatterns.some(pattern => pattern.test(trimmed))) {
    return 0;
  }
  
  // Very short text (< 10 chars) is usually not meaningful
  // Exception: Technical standards like "TRL 6", numbers like "250"
  const isTechnicalStandard = /^(trl|iso|iec|en)\s*\d+/i.test(trimmed);
  const isNumber = /^\d+$/.test(trimmed);
  
  if (length < 10 && !isTechnicalStandard && !isNumber) {
    return Math.max(0, length * 2); // Max 18 for very short text
  }
  
  // Base score from length (longer = more meaningful, but cap at 50)
  let score = Math.min(50, length / 2);
  
  // Boost for specific indicators
  const hasNumbers = /\d/.test(trimmed);
  const hasSpecificTerms = /(must|required|minimum|maximum|at least|at most|between|from|to|within|deadline|duration|years?|months?|days?|percent|%)/i.test(trimmed);
  const hasActionableTerms = /(submit|provide|include|attach|complete|fill|upload|send|apply|register)/i.test(trimmed);
  const hasQuantifiers = /(\d+\s*(eur|usd|%|years?|months?|days?|employees?|members?|pages?|documents?))/i.test(trimmed);
  const hasGeographicContext = /(based in|located in|headquarters in|registered in|from|eligible in|must be in)/i.test(trimmed);
  
  if (hasNumbers) score += 20;
  if (hasSpecificTerms) score += 20;
  if (hasActionableTerms) score += 10;
  if (hasQuantifiers) score += 15;
  if (hasGeographicContext) score += 15; // Boost for geographic descriptions with context
  
  // Penalize generic phrases
  const genericPhrases = [
    /^(general|common|standard|typical|usual|basic)$/i,
    /^(see|check|contact|refer|visit|click)$/i,
  ];
  if (genericPhrases.some(pattern => pattern.test(trimmed))) {
    score = Math.max(0, score - 20);
  }
  
  return Math.min(100, Math.max(0, score));
}
import { isCustomLLMEnabled, callCustomLLM } from '../../../shared/lib/customLLM';

// Dynamic import for data collection (only in Node.js environment)
let trackScraperQuality: any = null;
if (typeof window === 'undefined') {
  // Server-side only
  import('../../../shared/lib/dataCollection').then(module => {
    trackScraperQuality = module.trackScraperQuality;
  }).catch(() => {
    // Silently fail if module not available
  });
}

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

  // LLM-First: No fallback, LLM is required
  const hasLLM = !!(process.env.OPENAI_API_KEY || process.env.CUSTOM_LLM_ENDPOINT);
  
  if (!hasLLM) {
    throw new Error('LLM extraction required: Set OPENAI_API_KEY or CUSTOM_LLM_ENDPOINT');
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

  const messages = [
    { role: "system" as const, content: systemPrompt },
    { role: "user" as const, content: userPrompt }
  ];

  try {
    let responseText: string | null = null;
    let extractionProvider: 'custom_llm' | 'openai_llm' = 'openai_llm';

    if (isCustomLLMEnabled()) {
      try {
        const customResponse = await callCustomLLM({
          messages,
          responseFormat: 'json',
          temperature: 0.3,
          maxTokens: 4000,
        });
        responseText = customResponse.output;
        extractionProvider = 'custom_llm';
      } catch (customError: any) {
        // Better error logging
        const errorMsg = customError?.message || String(customError);
        const errorStatus = customError?.status || 'unknown';
        
        // Check if it's a rate limit - OpenRouter free tier has limits
        if (errorStatus === 429) {
          console.warn(`⚠️  OpenRouter rate limit hit (429). Free tier has limits. Waiting 5s...`);
          // Wait longer for rate limits
          await new Promise(resolve => setTimeout(resolve, 5000));
          try {
            const retryResponse = await callCustomLLM({
              messages,
              responseFormat: 'json',
              temperature: 0.3,
              maxTokens: 4000,
            });
            responseText = retryResponse.output;
            extractionProvider = 'custom_llm';
            console.log('✅ Custom LLM retry succeeded');
          } catch (retryError: any) {
            console.warn(`⚠️  Custom LLM retry failed (${retryError?.status || 'unknown'}), falling back to OpenAI: ${retryError?.message || retryError}`);
          }
        } else if (errorStatus === 504 || errorMsg.includes('timeout') || errorMsg.includes('timed out')) {
          console.warn(`⚠️  Custom LLM timeout (${errorStatus}). OpenRouter may be slow. Falling back to OpenAI.`);
        } else {
          console.warn(`⚠️  Custom LLM unavailable (${errorStatus}), falling back to OpenAI: ${errorMsg}`);
        }
      }
    }

    if (!responseText) {
      // Use cheaper model if specified, otherwise default to gpt-4o-mini
      const model = process.env.OPENAI_MODEL || process.env.SCRAPER_MODEL_VERSION || "gpt-4o-mini";
      
      // Retry logic for rate limits (429 errors)
      let retries = 3;
      let lastError: any = null;
      
      while (retries > 0) {
        try {
          const completion = await openai.chat.completions.create({
            model: model.startsWith('text-embedding') ? 'gpt-4o-mini' : model, // Embedding models can't be used for chat
            messages,
            response_format: { type: "json_object" },
            max_tokens: 4000,
            temperature: 0.3,
          });
          responseText = completion.choices[0]?.message?.content || '{}';
          extractionProvider = 'openai_llm';
          break; // Success, exit retry loop
        } catch (apiError: any) {
          lastError = apiError;
          
          // Handle rate limit (429) with exponential backoff
          if (apiError?.status === 429 || apiError?.code === 'insufficient_quota') {
            if (retries > 1) {
              const waitTime = Math.pow(2, 3 - retries) * 1000; // 1s, 2s, 4s
              console.warn(`⚠️  Rate limit hit (${apiError?.code || '429'}), retrying in ${waitTime}ms... (${retries - 1} attempts left)`);
              await new Promise(resolve => setTimeout(resolve, waitTime));
              retries--;
              continue;
            } else {
              // Last retry failed, throw to trigger fallback
              throw apiError;
            }
          } else {
            // Non-rate-limit error, throw immediately
            throw apiError;
          }
        }
      }
      
      if (!responseText) {
        throw lastError || new Error('Failed to get LLM response after retries');
      }
    }

    // Try to extract JSON from response (OpenRouter might add text before/after JSON)
    let parsed: any;
    try {
      // First try direct parse
      parsed = typeof responseText === 'string' ? JSON.parse(responseText) : responseText;
    } catch (parseError: any) {
      // If that fails, try to extract JSON from text (OpenRouter sometimes adds "Here is the JSON:" prefix)
      if (typeof responseText === 'string') {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            parsed = JSON.parse(jsonMatch[0]);
            console.warn('⚠️  Extracted JSON from text response');
          } catch {
            throw new Error(`Failed to parse LLM response: ${parseError?.message || parseError}. Response: ${responseText.substring(0, 200)}`);
          }
        } else {
          throw new Error(`Failed to parse LLM response: ${parseError?.message || parseError}. Response: ${responseText.substring(0, 200)}`);
        }
      } else {
        throw new Error(`Failed to parse LLM response: ${parseError?.message || parseError}`);
      }
    }

    const result = transformLLMResponse(parsed, url);
    
    if (trackScraperQuality && typeof window === 'undefined') {
      const institution = extractInstitutionFromUrl(url);
      const pageType = detectPageType(url, html);
      const totalRequirements = Object.values(result.categorized_requirements).reduce(
        (sum, items) => sum + items.length, 0
      );
      const accuracy = totalRequirements > 0 ? Math.min(1.0, totalRequirements / 20) : 0;
      const confidence = extractionProvider === 'custom_llm' ? 0.85 : 0.8;

      trackScraperQuality({
        institution,
        pageType,
        extractionMethod: extractionProvider,
        accuracy,
        confidence,
        timestamp: new Date().toISOString()
      }).catch((err: any) => console.error('Failed to track scraper quality:', err));
    }

    return result;
  } catch (error) {
    console.error('LLM extraction failed:', error);
    
    // LLM-only: No pattern fallback (extract.ts was moved to legacy)
    // Re-throw the error so the caller can handle it
    throw error;
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
   - company_type: FULL description of company type (e.g., "Small and medium-sized enterprises (SMEs) with less than 250 employees", NOT just "SME")
   - company_stage: Stage of company (e.g., "Early stage", "Growth stage", "Mature")
   - industry_restriction: Industry restrictions or focus areas
   - eligibility_criteria: General eligibility requirements (FULL descriptions, not single words)

2. Documents: Required documents for application
   - required_documents: FULL list of required documents (preferred over single document types)
   - document_type: Type of document (only if specific type is mentioned)
   - format: Document format requirements

3. Financial:
   - repayment_terms: Repayment terms for loans (e.g., "Must repay within 5 years at 2% interest")
   - equity_terms: Equity terms for equity funding (e.g., "Must have an equity stake of at least 20%")
   - co_financing: Co-financing requirements (e.g., "Minimum 30% own contribution")
   - guarantee_fee: Guarantee fee details (e.g., "from 2.0% p.a. onward")
   - guarantee_ratio: Guarantee ratio (e.g., "up to 80%")
   NOTE: funding_amount_min, funding_amount_max, currency, funding_amount_status go in METADATA only, not requirements

4. Technical: Technical requirements or specifications
   - technical_requirement: Technical requirements
   - trl_level: Technology readiness level (e.g., "Must be at TRL level 6")

5. Legal: Legal requirements or compliance needs
   - legal_requirement: Legal requirements

6. Timeline:
   - deadline: Application deadline (date string)
   - open_deadline: Whether deadline is rolling/open (boolean)
   - duration: Project duration

7. Geographic: Geographic eligibility
   - geographic_eligibility: FULL geographic descriptions (e.g., "Companies based in Austria, Germany, or EU member states", NOT just "Austria")
   - Extract country, region, state, city if given
   - If no geographic requirement, omit this category (don't extract "None" or "No restriction")

8. Team: Team size, composition, or requirements
   - team_size: Team size requirements
   - team_composition: Team composition requirements

9. Project:
   - innovation_focus: Innovation focus areas
   - technology_area: Technology areas
   - research_domain: Research domains
   - sector_focus: Sector focus

10. Compliance: Compliance requirements
    - compliance_requirement: Compliance requirements

11. Impact:
    - environmental_impact: Environmental impact requirements
    - social_impact: Social impact requirements
    - economic_impact: Economic impact requirements
    - innovation_impact: Innovation impact requirements

12. Application: Application process and evaluation
    - application_process: Application process description (e.g., "Companies must submit a business plan, CV, and project description")
    - evaluation_criteria: Evaluation criteria (e.g., "Innovation and research focus, company size and experience")

13. Funding_Details: How funds can be used and funding structure
    - use_of_funds: How funds can be used (e.g., "Acquiring and developing R&D infrastructure")
    - capex_opex: Capital vs operational expenditure (e.g., "Both capital and operational expenditures are eligible")
    - revenue_model: Revenue model requirements
    - market_size: Market size requirements

14. Restrictions: Restrictions and limitations
    - restrictions: Restrictions or limitations
    - intellectual_property: IP requirements
    - consortium: Consortium requirements
    - diversity: Diversity requirements

15. Terms: Terms and conditions
    - success_metrics: Success metrics or KPIs
    - trl_level: Technology readiness level (if not in Technical)

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
- **CRITICAL: Extract FULL descriptions, not single words**
  * BAD: "SME", "Austria", "EUR", "Fixed"
  * GOOD: "Small and medium-sized enterprises (SMEs) with less than 250 employees", "Companies based in Austria, Germany, or EU member states"
- **DO NOT extract negative information**: Skip "No specific requirements mentioned", "None mentioned", "Not specified", "No restrictions"
- Be specific and accurate - extract actual values, not generic descriptions
- For financial amounts, extract numbers only (no currency symbols in numbers) - these go in METADATA
- For dates, use ISO format (YYYY-MM-DD)
- For boolean values, use true/false
- Include meaningfulness: only extract specific, actionable information
- If information is ambiguous or unclear, omit it rather than guessing
- Extract contact information (email, phone) from the page
- **CRITICAL: ALWAYS identify funding types** - Look for keywords like "grant", "loan", "equity", "guarantee", "subsidy", "financing", "investment", "Förderung", "Kredit", "Beteiligung"
- Funding types must be one of: "grant", "loan", "equity", "guarantee", "subsidy", "venture_capital", "bank_loan"
- If funding type is unclear, infer from:
  * URL patterns (/grant/, /loan/, /equity/, /guarantee/)
  * Page content (mentions of "non-repayable" = grant, "repay" = loan, "equity stake" = equity)
  * Institution type (research agencies = grant, banks = loan, VCs = equity)
- **Geographic**: Extract FULL descriptions with context (e.g., "Companies must be based in Austria, Germany, or EU member states with headquarters in Vienna")
  * Save country, region, state, city if given
  * If no geographic requirement found, omit geographic category (don't extract "None" or "No restriction")
- Determine region from URL, content, or institution name (for metadata.region)
- **IMPORTANT**: funding_types is REQUIRED - if not found, use "unknown" but try hard to identify it`;
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
  _url: string
): LLMExtractionResponse {
  const categorized: Record<string, RequirementItem[]> = {};
  
  // Category mapping: Map "other" subcategories to new categories
  const categoryMapping: Record<string, string> = {
    // Map old "other" subcategories to new categories
    'application_process': 'application',
    'evaluation_criteria': 'application',
    'use_of_funds': 'funding_details',
    'capex_opex': 'funding_details',
    'revenue_model': 'funding_details',
    'market_size': 'funding_details',
    'co_financing': 'funding_details', // Keep in financial OR funding_details
    'restrictions': 'restrictions',
    'intellectual_property': 'restrictions',
    'consortium': 'restrictions',
    'diversity': 'restrictions',
    'success_metrics': 'terms',
    'repayment_terms': 'financial', // Move to financial
    'equity_terms': 'financial', // Move to financial
  };

  // Filter negative information patterns
  const negativePatterns = [
    /^no\s+specific/i,
    /^none\s+mentioned/i,
    /^not\s+specified/i,
    /^no\s+restrictions/i,
    /^no\s+requirements/i,
    /^no\s+.*mentioned/i,
    /^none$/i,
    /^n\/a$/i,
    /^na$/i,
  ];

  function isNegativeInformation(value: string): boolean {
    const trimmed = value.trim();
    return negativePatterns.some(pattern => pattern.test(trimmed));
  }

  // Transform requirements
  if (llmResponse.requirements && typeof llmResponse.requirements === 'object') {
    Object.entries(llmResponse.requirements).forEach(([category, items]: [string, any]) => {
      if (Array.isArray(items)) {
        items.forEach((item: any) => {
          const value = String(item.value || '').trim();
          
          // Skip empty values
          if (!value || value.length === 0) return;
          
          // Skip negative information
          if (isNegativeInformation(value)) return;
          
          // Skip metadata fields that shouldn't be requirements
          const type = item.type || 'general';
          if (type === 'currency' || type === 'funding_amount_status' || 
              type === 'funding_amount_min' || type === 'funding_amount_max') {
            return; // These go in metadata only
          }
          
          // Map category if needed
          let finalCategory = category.toLowerCase();
          if (categoryMapping[type]) {
            finalCategory = categoryMapping[type];
          } else if (category === 'other' && categoryMapping[type]) {
            finalCategory = categoryMapping[type];
          }
          
          // Initialize category array if needed
          if (!categorized[finalCategory]) {
            categorized[finalCategory] = [];
          }
          
          // Calculate meaningfulness
          const meaningfulness = calculateMeaningfulnessScore(value);
          
          // Only add if meaningfulness >= 30 (or null, which means we'll calculate it)
          if (meaningfulness >= 30 || meaningfulness === null) {
            categorized[finalCategory].push({
              type: type,
              value: value,
              source: 'llm_extraction',
              description: item.description,
              format: item.format,
              meaningfulness_score: meaningfulness
            });
          }
        });
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
 * Extract institution name from URL
 */
function extractInstitutionFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    // Extract domain name (e.g., "bmwk.de" from "www.bmwk.de")
    const parts = hostname.split('.');
    if (parts.length >= 2) {
      return parts[parts.length - 2]; // Second-to-last part
    }
    return hostname;
  } catch {
    return 'unknown';
  }
}

/**
 * Detect page type from URL and HTML structure
 */
function detectPageType(url: string, html: string): string {
  const urlLower = url.toLowerCase();
  const htmlLower = html.toLowerCase();
  
  if (urlLower.includes('/program') || urlLower.includes('/foerderung')) {
    return 'program_page';
  }
  if (htmlLower.includes('application') || htmlLower.includes('bewerbung')) {
    return 'application_page';
  }
  if (htmlLower.includes('requirement') || htmlLower.includes('voraussetzung')) {
    return 'requirements_page';
  }
  return 'general_page';
}

/**
 * Hybrid extraction: REMOVED - LLM-only now
 */
export async function extractHybrid(
  html: string,
  url: string,
  title?: string,
  description?: string
): Promise<LLMExtractionResponse> {
  // LLM-only: No pattern fallback (extract.ts was moved to legacy)
  return extractWithLLM({ html, url, title, description });
}

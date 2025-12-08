/**
 * LLM-Based Extraction Service
 * Extracts program requirements from HTML/text using LLM
 * Used by scraper tools to extract structured data from funding program pages
 */

import OpenAI from 'openai';
import * as cheerio from 'cheerio';
import { isCustomLLMEnabled, callCustomLLM } from '@/shared/lib/ai/customLLM';

// ============================================================================
// TYPES
// ============================================================================

export interface RequirementItem {
  type: string;
  value: any;
  confidence?: number;
  meaningfulness_score?: number;
  source?: string;
  description?: string;
  format?: string;
  required?: boolean;
}

export interface LLMExtractionRequest {
  html?: string;
  text?: string;
  url: string;
  title?: string;
  description?: string;
}

export interface LLMExtractionResponse {
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

// ============================================================================
// LLM CLIENT INITIALIZATION
// ============================================================================

let openai: OpenAI | null = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

// ============================================================================
// EXTRACTION FUNCTIONS
// ============================================================================

function sanitizeLLMResponse(text: string): string {
  let cleaned = text.trim();
  cleaned = cleaned.replace(/```json/gi, '```');
  cleaned = cleaned.replace(/```/g, '');
  cleaned = cleaned.replace(/^Here is the JSON requested:\s*/i, '');
  cleaned = cleaned.replace(/^Here is .*?JSON:\s*/i, '');
  cleaned = cleaned.replace(/^Response:\s*/i, '');
  const firstCurly = cleaned.indexOf('{');
  const firstBracket = cleaned.indexOf('[');
  const starts: number[] = [];
  if (firstCurly >= 0) starts.push(firstCurly);
  if (firstBracket >= 0) starts.push(firstBracket);
  if (starts.length > 0) {
    const start = Math.min(...starts);
    const endCurly = cleaned.lastIndexOf('}');
    const endBracket = cleaned.lastIndexOf(']');
    const end = Math.max(endCurly, endBracket);
    if (end >= start) {
      cleaned = cleaned.slice(start, end + 1);
    }
  }
  return cleaned.trim();
}

function calculateMeaningfulnessScore(text: any): number {
  const textStr = typeof text === 'string' ? text : (text ? String(text) : '');
  if (!textStr || textStr.trim().length === 0) return 0;
  
  const trimmed = textStr.trim();
  const length = trimmed.length;
  
  // Single words, booleans, acronyms get 0
  const singleWordPatterns = [
    /^(yes|no|true|false|both|none|all|any)$/i,
    /^(sme|startup|large|small|medium)$/i,
    /^(eur|usd|gbp|chf)$/i,
    /^(grant|loan|equity|guarantee|subsidy)$/i,
    /^[A-Z]{2,10}$/,
  ];
  
  if (singleWordPatterns.some(pattern => pattern.test(trimmed))) {
    return 0;
  }
  
  // Filter negative information
  const negativePatterns = [
    /^no\s+specific/i,
    /^none\s+mentioned/i,
    /^not\s+specified/i,
  ];
  if (negativePatterns.some(pattern => pattern.test(trimmed))) {
    return 0;
  }
  
  // Very short text (< 10 chars) is usually not meaningful
  const isTechnicalStandard = /^(trl|iso|iec|en)\s*\d+/i.test(trimmed);
  const isNumber = /^\d+$/.test(trimmed);
  
  if (length < 10 && !isTechnicalStandard && !isNumber) {
    return Math.max(0, length * 2);
  }
  
  // Base score from length
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
  if (hasGeographicContext) score += 15;
  
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

/**
 * Extract all requirements using LLM
 */
export async function extractWithLLM(
  request: LLMExtractionRequest
): Promise<LLMExtractionResponse> {
  const { html, text, url, title, description } = request;

  const hasLLM = !!(process.env.OPENAI_API_KEY || process.env.CUSTOM_LLM_ENDPOINT);
  
  if (!hasLLM) {
    throw new Error('LLM extraction required: Set OPENAI_API_KEY or CUSTOM_LLM_ENDPOINT');
  }

  // Extract content: Use text if provided, otherwise parse HTML
  let contentText: string;
  
  if (text) {
    contentText = text;
  } else if (html) {
    const $ = cheerio.load(html);
    $('script, style, nav, footer, header, aside, .advertisement, .cookie-banner').remove();
    const mainContent = $('main, article, .content, #content, .main-content').first();
    contentText = mainContent.length > 0 
      ? mainContent.text() 
      : $('body').text();
  } else {
    throw new Error('Either html or text must be provided');
  }
  
  // Limit content size
  const MAX_CONTENT_LENGTH = 50000;
  const truncatedContent = contentText.length > MAX_CONTENT_LENGTH
    ? contentText.substring(0, MAX_CONTENT_LENGTH) + '... [content truncated]'
    : contentText;

  const systemPrompt = createSystemPrompt();
  const isTextMode = !!text;
  const userPrompt = createUserPrompt({
    url,
    title: title || 'Unknown',
    description: description || '',
    content: truncatedContent,
    isTextMode
  });

  const messages = [
    { role: "system" as const, content: systemPrompt },
    { role: "user" as const, content: userPrompt }
  ];

  try {
    let responseText: string | null = null;

    if (isCustomLLMEnabled()) {
      try {
        let retries = 3;
        let customResponse;
        while (retries > 0) {
          try {
            customResponse = await callCustomLLM({
              messages,
              responseFormat: 'json',
              temperature: 0.3,
              maxTokens: 4000,
            });
            break;
          } catch (rateLimitError: any) {
            if (rateLimitError?.status === 429 && retries > 0) {
              let waitSeconds = 5;
              const errorMsg = rateLimitError?.message || String(rateLimitError);
              const waitMatch = errorMsg.match(/(?:try again|Please retry|retryDelay)[^\d]*([\d.]+)s/i) 
                || errorMsg.match(/retryDelay["\s:]+([\d.]+)s/i);
              if (waitMatch) {
                waitSeconds = parseFloat(waitMatch[1]) + 1;
              }
              console.warn(`   ⚠️  Rate limit (429), waiting ${waitSeconds}s before retry...`);
              await new Promise(resolve => setTimeout(resolve, waitSeconds * 1000));
              retries--;
            } else {
              throw rateLimitError;
            }
          }
        }
        if (!customResponse) {
          throw new Error('Failed after retries');
        }
        responseText = customResponse.output;
      } catch (customError: any) {
        const errorMsg = customError?.message || String(customError);
        const errorStatus = customError?.status || 'unknown';
        
        if (errorStatus === 429) {
          throw customError;
        } else if (errorStatus === 504 || errorMsg.includes('timeout') || errorMsg.includes('timed out')) {
          console.warn(`⚠️  Custom LLM timeout (${errorStatus}). Retrying once...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
          try {
            const retryResponse = await callCustomLLM({
              messages,
              responseFormat: 'json',
              temperature: 0.3,
              maxTokens: 4000,
            });
            responseText = retryResponse.output;
            console.log('✅ Custom LLM retry succeeded after timeout');
          } catch (retryError: any) {
            throw new Error(`Custom LLM timeout retry failed (${retryError?.status || 'unknown'}): ${retryError?.message || retryError}`);
          }
        } else {
          throw new Error(`Custom LLM unavailable (${errorStatus}): ${errorMsg}`);
        }
      }
    }

    // Use OpenAI if custom LLM is NOT enabled
    if (!responseText && !isCustomLLMEnabled()) {
      const model = process.env.OPENAI_MODEL || process.env.SCRAPER_MODEL_VERSION || "gpt-4o-mini";
      
      let retries = 3;
      let lastError: any = null;
      
      while (retries > 0) {
        try {
          if (!openai) {
            throw new Error('OpenAI client not initialized. Set OPENAI_API_KEY or use CUSTOM_LLM_ENDPOINT');
          }
          const completion = await openai.chat.completions.create({
            model: model.startsWith('text-embedding') ? 'gpt-4o-mini' : model,
            messages,
            response_format: { type: "json_object" },
            max_tokens: 4000,
            temperature: 0.3,
          });
          responseText = completion.choices[0]?.message?.content || '{}';
          break;
        } catch (apiError: any) {
          lastError = apiError;
          
          if (apiError?.status === 429 || apiError?.code === 'insufficient_quota') {
            if (retries > 1) {
              const waitTime = Math.pow(2, 3 - retries) * 1000;
              console.warn(`⚠️  Rate limit hit (${apiError?.code || '429'}), retrying in ${waitTime}ms... (${retries - 1} attempts left)`);
              await new Promise(resolve => setTimeout(resolve, waitTime));
              retries--;
              continue;
            } else {
              throw apiError;
            }
          } else {
            throw apiError;
          }
        }
      }
      
      if (!responseText) {
        throw lastError || new Error('Failed to get LLM response after retries');
      }
    } else if (!responseText && isCustomLLMEnabled()) {
      throw new Error('Custom LLM is enabled but failed to provide response. Check custom LLM configuration.');
    }

    // Parse JSON response
    let parsed: any;
    try {
      if (typeof responseText === 'string') {
        const sanitized = sanitizeLLMResponse(responseText);
        parsed = JSON.parse(sanitized);
      } else {
        parsed = responseText;
      }
    } catch (parseError: any) {
      if (typeof responseText === 'string') {
        const jsonObjectMatch = responseText.match(/\{[\s\S]*\}/);
        const jsonArrayMatch = responseText.match(/\[[\s\S]*\]/);
        const jsonMatch = jsonObjectMatch || jsonArrayMatch;
        
        if (jsonMatch) {
          let jsonStr = sanitizeLLMResponse(jsonMatch[0]);
          
          // Try to fix incomplete JSON
          const needsRepair = parseError.message?.includes('Unterminated string') || 
                             parseError.message?.includes('Unexpected end') ||
                             parseError.message?.includes('Expected');
          
          if (needsRepair) {
            // Close incomplete objects/arrays
            let openBraces = (jsonStr.match(/\{/g) || []).length;
            let closeBraces = (jsonStr.match(/\}/g) || []).length;
            let openBrackets = (jsonStr.match(/\[/g) || []).length;
            let closeBrackets = (jsonStr.match(/\]/g) || []).length;
            
            jsonStr = jsonStr.replace(/,\s*([}\]])/g, '$1');
            
            while (openBrackets > closeBrackets) {
              jsonStr += ']';
              closeBrackets++;
            }
            
            while (openBraces > closeBraces) {
              jsonStr += '}';
              closeBraces++;
            }
          }
          
          try {
            parsed = JSON.parse(jsonStr);
            console.warn('⚠️  Extracted/fixed JSON from response');
          } catch (fixError: any) {
            throw new Error(`Failed to parse LLM response: ${parseError?.message || parseError}. Response preview: ${responseText.substring(0, 300)}...`);
          }
        } else {
          throw new Error(`Failed to parse LLM response: ${parseError?.message || parseError}. Response: ${responseText.substring(0, 200)}`);
        }
      } else {
        throw new Error(`Failed to parse LLM response: ${parseError?.message || parseError}`);
      }
    }

    const result = transformLLMResponse(parsed, url);
    return result;
  } catch (error) {
    console.error('LLM extraction failed:', error);
    throw error;
  }
}

/**
 * Create system prompt for LLM extraction
 */
function createSystemPrompt(): string {
  return `You are an expert at extracting structured data from funding program web pages.

Your task is to extract all relevant information about a funding program and return it as structured JSON.

OUTPUT RULES:
- Respond with a single JSON object only. Do NOT include explanations, comments, or Markdown fences.
- The JSON must match this structure: {"metadata": {...}, "requirements": {"category": [{"type": "...", "value": "..."}]}}
- Always include "funding_types" (array) inside metadata using canonical values.

REQUIREMENT CATEGORIES (extract all that apply):
1. Eligibility: company_type, company_stage, industry_restriction, eligibility_criteria
2. Documents: required_documents, document_type, format
3. Financial: repayment_terms, interest_rate, equity_terms, co_financing, funding_rate, grant_ratio, guarantee_fee, guarantee_ratio
4. Technical: technical_requirement, trl_level
5. Legal: legal_requirement
6. Timeline: deadline, open_deadline, duration, application_window
7. Geographic: geographic_eligibility
8. Team: team_size, team_composition
9. Project: innovation_focus, technology_area, research_domain, sector_focus
10. Compliance: compliance_requirement
11. Impact: environmental_impact, social_impact, economic_impact, innovation_impact
12. Application: application_process, evaluation_criteria, application_form, application_requirement
13. Funding_Details: use_of_funds, capex_opex, revenue_model, market_size, project_details
14. Restrictions: restrictions, intellectual_property, consortium, diversity
15. Terms: success_metrics, trl_level

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
    "funding_types": ["grant", "loan", "equity", "guarantee", "subsidy"],
    "program_focus": ["innovation", "research", "startup"],
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
- Extract FULL descriptions, not single words
- DO NOT extract negative information: Skip "No specific requirements mentioned", "None mentioned"
- Be specific and accurate - extract actual values, not generic descriptions
- ALWAYS extract description - Look for program description, overview, summary
- DO NOT extract metadata fields as requirements: currency, funding_amount_min, funding_amount_max, deadline, open_deadline go in METADATA only
- ALWAYS extract funding amounts - Look for "up to", "maximum", "minimum", "between", "from X to Y"
- ALWAYS extract deadline - Look for "deadline", "application deadline", "submission date"
- For financial amounts, extract numbers only (no currency symbols in numbers)
- For dates, use ISO format (YYYY-MM-DD)
- For boolean values, use true/false
- ALWAYS identify funding types - Look for keywords like "grant", "loan", "equity", "guarantee", "subsidy"
- Funding types must be one of: "grant", "loan", "equity", "guarantee", "subsidy", "convertible", "venture_capital", "bank_loan", "leasing", "crowdfunding", "angel_investment", "micro_credit", "repayable_advance"
- Extract contact information (email, phone) from the page
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
  isTextMode?: boolean;
}): string {
  const isTextMode = context.isTextMode || false;
  const contentLabel = isTextMode ? 'Program Information' : 'Page Content';
  const searchInstructions = isTextMode 
    ? 'Extract from the program information provided below'
    : 'Search in: First paragraphs, <p> tags, sections with "overview", "description", "summary", "about", "intro"';
  
  return `Extract all funding program information ${isTextMode ? 'from this program description' : 'from this page'}:

URL: ${context.url}
Title: ${context.title}
Description: ${context.description}

${contentLabel}:
${context.content}

**IMPORTANT: Pay special attention to these critical topics:**

1. **Description (REQUIRED)**: 
   - ${searchInstructions}
   - Extract: 2-5 complete sentences explaining what the program is, who it's for, and what it offers

2. **Funding Amount (REQUIRED)**:
   - Search in: "Funding amount", "Förderhöhe", "Fördersumme", tables, funding details sections
   - Look for: "up to €X", "maximum X EUR", "minimum X", "between X and Y"
   - Extract: Numbers only (remove commas, spaces, currency symbols)
   - If single amount: use the SAME value for both min and max

3. **Deadline & Duration (REQUIRED)**:
   - Search in: "Deadline", "Application Deadline", "Submission Date", "Bewerbungsfrist"
   - Look for: "deadline: DD.MM.YYYY", "application by YYYY-MM-DD"
   - Convert to ISO: YYYY-MM-DD format
   - Rolling deadlines: "ongoing", "rolling", "open" → set open_deadline: true, deadline: null

4. **Financial Terms (CRITICAL for Loans/Guarantees/Equity)**:
   - For loans, guarantees: ALWAYS extract interest rates and repayment_terms
   - For grants/subsidies: Capture funding rates / grant ratios / co-financing requirements
   - For equity: Extract equity terms (stake expectations, dilution)

5. **Company Stage & Innovation Focus (CRITICAL)**:
   - ALWAYS extract company_stage when mentioned
   - ALWAYS extract innovation_focus when themes are mentioned
   - ALWAYS extract use_of_funds when funding purpose is described

6. **Eligibility & Financial Requirements (CRITICAL)**:
   - ALWAYS extract eligibility requirements
   - ALWAYS extract company_type - This is REQUIRED
   - ALWAYS extract financial requirements

7. **Timeline, Team, Application & Documents (CRITICAL)**:
   - ALWAYS extract timeline information if mentioned
   - ALWAYS extract team requirements if mentioned
   - ALWAYS extract application process if mentioned
   - ALWAYS extract required documents if mentioned

Extract all relevant information and return ONLY the JSON object described above with no additional text.`;
}

/**
 * Transform LLM JSON response to our internal format
 */
function transformLLMResponse(
  llmResponse: any,
  _url: string
): LLMExtractionResponse {
  void _url;
  const categorized: Record<string, RequirementItem[]> = {};
  
  const categoryMapping: Record<string, string> = {
    'application_process': 'application',
    'evaluation_criteria': 'application',
    'application_form': 'application',
    'application_requirement': 'application',
    'use_of_funds': 'funding_details',
    'capex_opex': 'funding_details',
    'revenue_model': 'funding_details',
    'market_size': 'funding_details',
    'co_financing': 'funding_details',
    'restrictions': 'restrictions',
    'intellectual_property': 'restrictions',
    'consortium': 'restrictions',
    'diversity': 'restrictions',
    'success_metrics': 'terms',
    'repayment_terms': 'financial',
    'equity_terms': 'financial',
    'interest_rate': 'financial',
    'funding_rate': 'financial',
    'grant_ratio': 'financial',
    'minimum_investment_volume': 'financial',
    'premium': 'financial',
    'other_financial_benefits': 'financial',
    'guarantee_fee': 'financial',
    'guarantee_ratio': 'financial',
    'duration': 'timeline',
    'application_window': 'timeline',
    'deadline_status': 'timeline',
    'project_details': 'funding_details',
  };

  const negativePatterns = [
    /^no\s+specific/i,
    /^none\s+mentioned/i,
    /^not\s+specified/i,
    /^no\s+restrictions/i,
    /^no\s+requirements/i,
    /^none$/i,
    /^n\/a$/i,
    /^na$/i,
    /^not\s+applicable/i,
    /^unknown$/i,
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
          
          if (!value || value.length === 0) return;
          if (isNegativeInformation(value)) return;
          if (value.length < 10 && !/^(trl|iso|iec|en)\s*\d+/i.test(value) && !/^\d+$/.test(value)) {
            return;
          }
          
          const type = item.type || 'general';
          if (type === 'currency' || type === 'funding_amount_status' || 
              type === 'funding_amount_min' || type === 'funding_amount_max' ||
              type === 'deadline' || type === 'open_deadline') {
            return;
          }
          
          if (/^(yes|no|true|false|both|none|all|any|sme|startup|large|small|medium|eur|usd|gbp|chf|grant|loan|equity|guarantee|subsidy)$/i.test(value.trim())) {
            return;
          }
          
          let finalCategory = category.toLowerCase();
          if (categoryMapping[type]) {
            finalCategory = categoryMapping[type];
          } else if (category === 'other' && categoryMapping[type]) {
            finalCategory = categoryMapping[type];
          }
          
          if (!categorized[finalCategory]) {
            categorized[finalCategory] = [];
          }
          
          const meaningfulness = calculateMeaningfulnessScore(value);
          
          if (meaningfulness >= 5 || meaningfulness === null) {
            categorized[finalCategory].push({
              type: type,
              value: value,
              source: 'llm_extraction',
              description: item.description,
              format: item.format,
              meaningfulness_score: meaningfulness,
              required: item.required !== undefined ? item.required : true
            });
          }
        });
      }
    });
  }

  // Ensure company_type is always extracted (fallback if missing)
  if (!categorized.eligibility || !categorized.eligibility.some((req: any) => req.type === 'company_type')) {
    const urlLower = _url.toLowerCase();
    const description = (llmResponse.metadata?.description || '').toLowerCase();
    const programFocus = (llmResponse.metadata?.program_focus || []).join(' ').toLowerCase();
    const allText = `${urlLower} ${description} ${programFocus}`;
    
    let inferredValue = 'Companies eligible for this program';
    
    if (allText.includes('startup') || allText.includes('start-up') || allText.includes('accelerator')) {
      inferredValue = 'Startups and early-stage companies';
    } else if (allText.includes('sme') || allText.includes('small and medium')) {
      inferredValue = 'Small and medium-sized enterprises (SMEs)';
    } else if (allText.includes('research') || allText.includes('university')) {
      inferredValue = 'Research institutions and universities';
    } else if (allText.includes('large') || allText.includes('enterprise')) {
      inferredValue = 'Large enterprises';
    }
    
    if (!categorized.eligibility) {
      categorized.eligibility = [];
    }
    categorized.eligibility.push({
      type: 'company_type',
      value: inferredValue,
      source: 'llm_extraction_inferred',
      meaningfulness_score: 50,
      required: true
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

  if (!metadata.deadline && metadata.open_deadline === false) {
    metadata.open_deadline = true;
  }

  return {
    categorized_requirements: categorized,
    metadata
  };
}

/**
 * Hybrid extraction: LLM-only (no pattern fallback)
 */
export async function extractHybrid(
  html: string,
  url: string,
  title?: string,
  description?: string
): Promise<LLMExtractionResponse> {
  return extractWithLLM({ html, url, title, description });
}


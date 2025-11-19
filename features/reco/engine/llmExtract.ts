/**
 * LLM-Based Extraction Service
 * Uses OpenAI GPT-4o-mini to extract all 35 requirement categories from HTML
 * Replaces pattern-based extraction with semantic understanding
 */

import OpenAI from 'openai';
import * as cheerio from 'cheerio';
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

/**
 * Calculate meaningfulness score (0-100)
 * Lower threshold to 10 to capture ALL valid requirements (100% completeness)
 */
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
import { isCustomLLMEnabled, callCustomLLM } from '@/shared/lib/ai/customLLM';

// Removed: scraper quality tracking (was never actually used due to logic bug)

// Initialize OpenAI client (only if OPENAI_API_KEY is set)
let openai: OpenAI | null = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

interface LLMExtractionRequest {
  html?: string; // Optional: HTML content (for web scraping)
  text?: string; // Optional: Plain text content (for program descriptions)
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
  const { html, text, url, title, description } = request;

  // LLM-First: No fallback, LLM is required
  const hasLLM = !!(process.env.OPENAI_API_KEY || process.env.CUSTOM_LLM_ENDPOINT);
  
  if (!hasLLM) {
    throw new Error('LLM extraction required: Set OPENAI_API_KEY or CUSTOM_LLM_ENDPOINT');
  }

  // Extract content: Use text if provided, otherwise parse HTML
  let contentText: string;
  
  if (text) {
    // Plain text mode (for program descriptions)
    contentText = text;
  } else if (html) {
    // HTML mode (for web scraping)
    const $ = cheerio.load(html);
    
    // Remove script, style, and other non-content elements
    $('script, style, nav, footer, header, aside, .advertisement, .cookie-banner').remove();
    
    // Extract main content
    const mainContent = $('main, article, .content, #content, .main-content').first();
    contentText = mainContent.length > 0 
      ? mainContent.text() 
      : $('body').text();
  } else {
    throw new Error('Either html or text must be provided');
  }
  
  // Limit content size (GPT-4o-mini has token limits)
  const MAX_CONTENT_LENGTH = 50000; // ~12,500 tokens
  const truncatedContent = contentText.length > MAX_CONTENT_LENGTH
    ? contentText.substring(0, MAX_CONTENT_LENGTH) + '... [content truncated]'
    : contentText;

  // Create structured prompt
  const systemPrompt = createSystemPrompt();
  const isTextMode = !!text; // Check if we're in text mode (not HTML)
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
        // Direct call - Gemini paid tier (1,000 req/min) can handle 30 concurrent easily
        // Simple retry logic handles 429 errors if we ever hit them
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
            break; // Success
          } catch (rateLimitError: any) {
            if (rateLimitError?.status === 429 && retries > 0) {
              // Parse wait time from error
              let waitSeconds = 5; // Default 5 seconds
              const errorMsg = rateLimitError?.message || String(rateLimitError);
              const waitMatch = errorMsg.match(/(?:try again|Please retry|retryDelay)[^\d]*([\d.]+)s/i) 
                || errorMsg.match(/retryDelay["\s:]+([\d.]+)s/i);
              if (waitMatch) {
                waitSeconds = parseFloat(waitMatch[1]) + 1; // Add 1s buffer
              }
              console.warn(`   ⚠️  Rate limit (429), waiting ${waitSeconds}s before retry...`);
              await new Promise(resolve => setTimeout(resolve, waitSeconds * 1000));
              retries--;
            } else {
              throw rateLimitError; // Not a rate limit error, or out of retries
            }
          }
        }
        if (!customResponse) {
          throw new Error('Failed after retries');
        }
        responseText = customResponse.output;
      } catch (customError: any) {
        // Handle errors (429 already handled above with retry logic)
        const errorMsg = customError?.message || String(customError);
        const errorStatus = customError?.status || 'unknown';
        
        // 429 errors should have been handled by retry logic above
        if (errorStatus === 429) {
          // Shouldn't reach here if retry logic worked, but just in case
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
        } else if (errorStatus === 402) {
          // 402 might be model access issue - check if model is available
          console.warn(`⚠️  Custom LLM returned 402 (${errorMsg}). This might be a model access issue. Check if the model is available.`);
          throw new Error(`Custom LLM access denied (402): ${errorMsg}. Check model availability and API key.`);
        } else {
          // Don't fall back to OpenAI - throw error instead
          throw new Error(`Custom LLM unavailable (${errorStatus}): ${errorMsg}`);
        }
      }
    }

    // Only use OpenAI if custom LLM is NOT enabled
    if (!responseText && !isCustomLLMEnabled()) {
      // Use cheaper model if specified, otherwise default to gpt-4o-mini
      const model = process.env.OPENAI_MODEL || process.env.SCRAPER_MODEL_VERSION || "gpt-4o-mini";
      
      // Retry logic for rate limits (429 errors)
      let retries = 3;
      let lastError: any = null;
      
      while (retries > 0) {
        try {
          if (!openai) {
            throw new Error('OpenAI client not initialized. Set OPENAI_API_KEY or use CUSTOM_LLM_ENDPOINT');
          }
          const completion = await openai.chat.completions.create({
            model: model.startsWith('text-embedding') ? 'gpt-4o-mini' : model, // Embedding models can't be used for chat
            messages,
            response_format: { type: "json_object" },
            max_tokens: 4000,
            temperature: 0.3,
          });
          responseText = completion.choices[0]?.message?.content || '{}';
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
    } else if (!responseText && isCustomLLMEnabled()) {
      // Custom LLM was enabled but failed - don't fall back to OpenAI
      throw new Error('Custom LLM is enabled but failed to provide response. Check custom LLM configuration.');
    }

    // Try to extract JSON from response (OpenRouter might add text before/after JSON)
    // Gemini might truncate JSON, so try to fix incomplete JSON
    let parsed: any;
    try {
      // First try direct parse after sanitizing wrappers
      if (typeof responseText === 'string') {
        const sanitized = sanitizeLLMResponse(responseText);
        parsed = JSON.parse(sanitized);
      } else {
        parsed = responseText;
      }
    } catch (parseError: any) {
      // If that fails, try to extract JSON from text (OpenRouter sometimes adds "Here is the JSON:" prefix)
      if (typeof responseText === 'string') {
        // Try to find JSON object or array
        const jsonObjectMatch = responseText.match(/\{[\s\S]*\}/);
        const jsonArrayMatch = responseText.match(/\[[\s\S]*\]/);
        const jsonMatch = jsonObjectMatch || jsonArrayMatch;
        
        if (jsonMatch) {
          let jsonStr = sanitizeLLMResponse(jsonMatch[0]);
          
          // Enhanced JSON repair for truncation
          const needsRepair = parseError.message?.includes('Unterminated string') || 
                             parseError.message?.includes('Unexpected end') ||
                             parseError.message?.includes('Expected') ||
                             parseError.message?.includes('position');
          
          if (needsRepair) {
            // Step 1: Fix unterminated strings
            // Find all string positions and check if they're closed
            const stringPattern = /"([^"\\]|\\.)*"/g;
            const matches: Array<{start: number, end: number}> = [];
            let match;
            while ((match = stringPattern.exec(jsonStr)) !== null) {
              matches.push({ start: match.index, end: match.index + match[0].length });
            }
            
            // Check if last quote is unclosed
            const lastQuoteIdx = jsonStr.lastIndexOf('"');
            if (lastQuoteIdx >= 0) {
              const isInString = matches.some(m => lastQuoteIdx >= m.start && lastQuoteIdx < m.end);
              if (!isInString) {
                // Find the start of the unterminated string
                let stringStart = lastQuoteIdx;
                // Go backwards to find the opening quote
                while (stringStart > 0 && jsonStr[stringStart - 1] !== '"' && jsonStr[stringStart - 1] !== '\\') {
                  stringStart--;
                }
                if (jsonStr[stringStart - 1] === '"') {
                  // Close the string
                  jsonStr = jsonStr.substring(0, lastQuoteIdx + 1) + '"';
                }
              }
            }
            
            // Step 2: Close incomplete arrays/objects
            let openBraces = (jsonStr.match(/\{/g) || []).length;
            let closeBraces = (jsonStr.match(/\}/g) || []).length;
            let openBrackets = (jsonStr.match(/\[/g) || []).length;
            let closeBrackets = (jsonStr.match(/\]/g) || []).length;
            
            // Remove trailing commas before closing
            jsonStr = jsonStr.replace(/,\s*([}\]])/g, '$1');
            
            // Close incomplete arrays first (they're inside objects)
            while (openBrackets > closeBrackets) {
              jsonStr += ']';
              closeBrackets++;
            }
            
            // Close incomplete objects
            while (openBraces > closeBraces) {
              jsonStr += '}';
              closeBraces++;
            }
            
            // Step 3: Try to fix common truncation patterns
            // If we have "metadata": { ... but cut off, try to close it
            if (jsonStr.includes('"metadata"') && !jsonStr.includes('"requirements"')) {
              // Try to extract what we have from metadata and create minimal valid structure
              const metadataMatch = jsonStr.match(/"metadata"\s*:\s*\{([\s\S]*)/);
              if (metadataMatch) {
                const metadataContent = metadataMatch[1];
                // Try to close metadata object and add empty requirements
                jsonStr = jsonStr.substring(0, jsonStr.indexOf('"metadata"')) + 
                         `{"metadata":${metadataContent.replace(/,\s*$/, '')}},"requirements":{}}`;
              }
            }
          }
          
          try {
            parsed = JSON.parse(jsonStr);
            console.warn('⚠️  Extracted/fixed JSON from response');
          } catch (fixError: any) {
            // Last resort: try to extract partial data
            try {
              // Try to extract just metadata if requirements are cut off
              const metadataMatch = jsonStr.match(/"metadata"\s*:\s*\{([\s\S]*?)\}/);
              if (metadataMatch) {
                const metadataStr = `{"metadata":${metadataMatch[0].substring(metadataMatch[0].indexOf('{'))},"requirements":{}}`;
                parsed = JSON.parse(metadataStr);
                console.warn('⚠️  Extracted partial JSON (metadata only)');
              } else {
                throw fixError;
              }
        } catch (lastResortError) {
          void lastResortError;
          throw new Error(`Failed to parse LLM response: ${parseError?.message || parseError}. Response preview: ${responseText.substring(0, 300)}...`);
            }
          }
        } else {
          throw new Error(`Failed to parse LLM response: ${parseError?.message || parseError}. Response: ${responseText.substring(0, 200)}`);
        }
      } else {
        throw new Error(`Failed to parse LLM response: ${parseError?.message || parseError}`);
      }
    }

    const result = transformLLMResponse(parsed, url);
    
    // Extraction quality validation
    const validation = validateExtractionQuality(result, url);
    if (!validation.isValid) {
      console.warn(`⚠️ Extraction quality issues for ${url}:`, validation.issues);
    }
    
    // Removed: scraper quality tracking (was never actually used)

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

OUTPUT RULES:
- Respond with a single JSON object only. Do NOT include explanations, comments, or Markdown fences.
- The JSON must match this structure: {"metadata": {...}, "requirements": {"category": [{"type": "...", "value": "..."}]}}
- Always include "funding_types" (array) inside metadata using the canonical values listed below.

REQUIREMENT CATEGORIES (extract all that apply):
1. Eligibility: **CRITICAL - ALWAYS EXTRACT**
   - company_type: FULL description of company type (e.g., "Small and medium-sized enterprises (SMEs) with less than 250 employees", NOT just "SME") - **CRITICAL: ALWAYS extract company type - this is REQUIRED for every program**
     * Look for: "startup", "SME", "small business", "medium enterprise", "large company", "research institution", "university", "nonprofit", "company type", "eligible companies", "Unternehmen", "Start-up", "KMU", "Unternehmenstyp"
     * Examples: "Program for startups and SMEs", "Eligible: Small and medium-sized enterprises", "Open to startups, scale-ups, and established companies"
     * **IMPORTANT**: If no explicit company type is mentioned, infer from context (e.g., "innovation program" → likely startups/SMEs, "research grant" → research institutions)
   - company_stage: Stage of company (e.g., "Early stage", "Growth stage", "Mature", "Startup", "Scale-up", "Established company", "Incorporated less than 3 years", "Newly founded company", "Company must be less than 5 years old", "Young enterprises", "Start-ups and spin-offs") - **CRITICAL: Extract this whenever company maturity/age is mentioned**
     * Look for: "startup", "early stage", "growth stage", "scale-up", "established", "incorporated", "founded", "company age", "years in business", "newly founded", "young company", "mature company", "less than X years", "founded after", "established before"
     * Examples: "Companies must be less than 3 years old", "Start-ups and spin-offs from research institutions", "Early-stage companies with innovative business models"
   - industry_restriction: Industry restrictions or focus areas
   - eligibility_criteria: General eligibility requirements (FULL descriptions, not single words)

2. Documents: **CRITICAL - ALWAYS EXTRACT IF MENTIONED**
   - required_documents: FULL list of required documents (e.g., "Business plan, financial statements, CV, project description", "Must submit: pitch deck, financial projections, team CVs") - **CRITICAL: Extract whenever documents are mentioned**
     * Look for: "required documents", "must submit", "documents needed", "application documents", "Bewerbungsunterlagen", "erforderliche Dokumente", "einreichen", "submit", "provide"
     * Examples: "Required documents: business plan, financial statements, and team CVs", "Must submit pitch deck and financial projections", "Application requires: project description, budget, and timeline"
   - document_type: Type of document (only if specific type is mentioned) - **Extract specific document types**
   - format: Document format requirements (e.g., "PDF format required", "Maximum 10 pages", "Must be in English or German") - **Extract if format/specifications are mentioned**

3. Financial:
   - repayment_terms: Repayment terms for repayable instruments (loans, guarantees, repayable advances) (e.g., "Must repay within 5 years at 2% interest", "Repayment over 10 years with 2-year grace period", "Amortization period of 7 years", "Repayment schedule: 2-year grace period, then monthly installments over 5 years") - **CRITICAL: Extract for ALL loans, bank products, guarantees, repayable advances**
     * Look for: "repayment", "Rückzahlung", "repay within X years", "grace period", "tilgung", "amortization", "repayment period", "repayment schedule", "maturity", "Laufzeit", "Rückzahlungsfrist"
     * Examples: "Loan must be repaid within 10 years", "2-year grace period, then monthly installments", "Repayment period: 5-7 years depending on project"
   - interest_rate: Interest rate information (fixed/variable, APR, margins) (e.g., "Fixed 2.5% p.a." or "EURIBOR + 1.5%") - **CRITICAL: Extract whenever interest/margin is mentioned for loans/banks**
   - equity_terms: Equity terms (stake, dilution, conversion conditions) (e.g., "Equity stake of at least 20%", "Convertible note with 5% discount")
   - co_financing: Co-financing requirements (e.g., "Minimum 30% own contribution", "Must provide 40% co-financing")
   - funding_rate: Funding / grant rate or subsidy intensity (e.g., "Funding rate up to 80% of eligible costs")
   - grant_ratio: Grant/loan ratio or subsidy split
   - guarantee_fee: Guarantee fee details (e.g., "from 2.0% p.a. onward")
   - guarantee_ratio: Guarantee ratio or coverage (e.g., "up to 80% guarantee")
   - minimum_investment_volume: Minimum investment volume required
   - premium: Insurance or guarantee premium details
   - other_financial_benefits: Any other financial benefit (tax relief, bonuses, additional subsidies)
   NOTE: funding_amount_min, funding_amount_max, currency, funding_amount_status go in METADATA only, not requirements

4. Technical: Technical requirements or specifications
   - technical_requirement: Technical requirements
   - trl_level: Technology readiness level (e.g., "Must be at TRL level 6")

5. Legal: Legal requirements or compliance needs
   - legal_requirement: Legal requirements

6. Timeline: **CRITICAL - ALWAYS EXTRACT IF MENTIONED**
   - deadline: Application deadline (date string) - **ALWAYS extract if any deadline information exists**
   - open_deadline: Whether deadline is rolling/open (boolean) - **ALWAYS extract if deadline status is mentioned**
   - duration: Project or support duration (e.g., "Support lasts 12 months", "Program duration: 6 months", "Funding period: 24 months") - **CRITICAL: Extract whenever program/project duration is mentioned**
     * Look for: "duration", "lasts", "period", "timeframe", "months", "years", "Dauer", "Laufzeit", "Zeitraum", "Programmdauer", "Förderdauer"
     * Examples: "Acceleration program lasts 6 months", "Support available for 24 months", "Project duration: 12-18 months"
   - application_window: Application or call window (e.g., "Calls open each March and September", "Application period: January to March", "Deadline: Quarterly") - **Extract if application windows/periods are mentioned**

7. Geographic: Geographic eligibility
   - geographic_eligibility: FULL geographic descriptions (e.g., "Companies based in Austria, Germany, or EU member states", NOT just "Austria")
   - Extract country, region, state, city if given
   - If no geographic requirement, omit this category (don't extract "None" or "No restriction")

8. Team: **CRITICAL - ALWAYS EXTRACT IF MENTIONED**
   - team_size: Team size requirements (e.g., "Minimum 2 team members", "Team must have at least 3 people", "Solo founders not eligible") - **CRITICAL: Extract whenever team size is mentioned**
     * Look for: "team size", "team members", "founders", "employees", "personnel", "Mitarbeiter", "Teamgröße", "Gründer", "minimum team", "team must have"
     * Examples: "Program requires minimum 2 founders", "Team size: 3-10 people", "Solo entrepreneurs not eligible"
   - team_composition: Team composition requirements (e.g., "Must have technical and business co-founders", "Team should include at least one researcher") - **Extract if specific team roles/composition is required**
     * Look for: "co-founder", "team composition", "team structure", "roles", "skills", "expertise", "background"
     * Examples: "Team must include technical and business expertise", "Requires at least one co-founder with industry experience"

9. Project:
   - innovation_focus: Innovation focus areas (e.g., "Digital transformation", "AI and machine learning", "Green technology", "Circular economy", "Sustainable energy solutions", "Climate protection", "Resource efficiency", "Smart manufacturing", "Industry 4.0") - **CRITICAL: Extract whenever innovation themes are mentioned**
     * Look for: "digital transformation", "AI", "sustainability", "green tech", "circular economy", "innovation focus", "strategic priorities", "focus areas", "thematic focus", "innovation themes", "Digitalisierung", "Nachhaltigkeit", "Klimaschutz", "Ressourceneffizienz"
     * Examples: "Program focuses on digital transformation and Industry 4.0", "Innovation priorities include sustainability and circular economy", "Thematic focus: Green technology and climate protection"
   - technology_area: Technology areas (e.g., "Biotechnology", "Nanotechnology", "IoT", "Blockchain", "Quantum computing") - **CRITICAL: Extract specific technology domains mentioned**
   - research_domain: Research domains
   - sector_focus: Sector focus

10. Compliance: Compliance requirements
    - compliance_requirement: Compliance requirements

11. Impact:
    - environmental_impact: Environmental impact requirements
    - social_impact: Social impact requirements
    - economic_impact: Economic impact requirements
    - innovation_impact: Innovation impact requirements

12. Application: **CRITICAL - ALWAYS EXTRACT IF MENTIONED**
    - application_process: Application process description (e.g., "Companies must submit a business plan, CV, and project description", "Two-stage application: pre-proposal and full proposal", "Online application via portal") - **CRITICAL: Extract whenever application steps/process is described**
      * Look for: "application process", "how to apply", "application steps", "submission process", "Bewerbungsverfahren", "Einreichung", "Antragsverfahren", "application via", "submit", "application portal"
      * Examples: "Two-stage application process: pre-proposal and full proposal", "Apply online through the funding portal", "Submit business plan and financial statements"
    - evaluation_criteria: Evaluation criteria (e.g., "Innovation and research focus, company size and experience", "Evaluation based on: innovation potential, market opportunity, team quality") - **CRITICAL: Extract whenever evaluation/selection criteria are mentioned**
      * Look for: "evaluation criteria", "selection criteria", "assessment", "evaluation based on", "Bewertungskriterien", "Auswahlkriterien", "evaluated on", "judged by"
      * Examples: "Programs evaluated on innovation potential, market opportunity, and team quality", "Selection criteria: technical feasibility and commercial viability"
    - application_form: Specific application form or portal requirements (e.g., "Apply via online portal", "Download application form from website", "Submit via email") - **Extract if specific application method/form is mentioned**
    - application_requirement: Additional application prerequisites (e.g., "Provide business plan not older than 3 months", "Must have registered company", "Pitch deck required") - **Extract if additional prerequisites are mentioned**

13. Funding_Details: How funds can be used and funding structure
    - use_of_funds: How funds can be used (e.g., "Acquiring and developing R&D infrastructure", "Personnel costs", "Equipment purchase", "Marketing and sales", "Product development", "Working capital", "Investment in machinery", "Research and development activities", "Expansion of production facilities") - **CRITICAL: Extract whenever funding purpose/usage is described, even if brief**
     * Look for: "use for", "purpose", "can be used for", "eligible costs", "funding covers", "personnel", "equipment", "R&D", "marketing", "working capital", "investment", "expansion", "machinery", "infrastructure", "Verwendungszweck", "Einsatz", "kann verwendet werden für"
     * Examples: "Funds can be used for personnel costs, equipment, and R&D infrastructure", "Eligible costs include machinery, IT systems, and working capital", "Funding covers up to 80% of eligible investment costs"
    - capex_opex: Capital vs operational expenditure (e.g., "Both capital and operational expenditures are eligible")
    - revenue_model: Revenue model requirements
    - market_size: Market size requirements
    - project_details: Required project information (deliverables, milestones, KPIs)
    - funding_rate: Funding rate or coverage percentage (if not already captured)
    - other_financial_benefits: Non-cash benefits tied to funding (e.g., mentoring, services bundled with funding)

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
- **CRITICAL: ALWAYS extract description** - Look for program description, overview, summary, or introduction text. Extract 2-5 sentences describing what the program is about. This is REQUIRED.
  * Search in: <p> tags, <div class="description">, <div class="overview">, <section class="intro">, first few paragraphs, meta description
  * Include: What the program does, who it's for, main benefits, key features
  * Format: 2-5 complete sentences, not bullet points or fragments
- **CRITICAL: DO NOT extract metadata fields as requirements**:
  * These go in METADATA only: currency, funding_amount_min, funding_amount_max, funding_amount_status, deadline, open_deadline
  * These are NOT requirements: "EUR", "USD", "fixed", "variable", "50000", "12000000"
  * If you see these values, put them in metadata, NOT in requirements
- **CRITICAL: ALWAYS extract funding amounts** - Look for "up to", "maximum", "minimum", "between", "from X to Y", "EUR", "€", numbers with currency. Extract both min and max if available. If only one amount, use it for both min and max.
  * Patterns: "up to €X", "maximum X EUR", "minimum X", "between X and Y", "from X to Y EUR", "X - Y EUR", "bis zu X€", "maximal X Euro", "mindestens X", "zwischen X und Y"
  * Also check: Tables, funding details sections, "Funding amount", "Förderhöhe", "Fördersumme", "Förderbetrag"
  * Extract: Numbers only (remove commas, spaces, currency symbols) - e.g., "€50,000" → 50000, "100.000 EUR" → 100000
  * If range: Extract min and max separately. If single amount: Use for both min and max
  * If percentage: Convert to absolute amount if base amount is mentioned, otherwise skip
- **CRITICAL: ALWAYS extract deadline** - Look for "deadline", "application deadline", "submission date", "due date", "closing date", "Bewerbungsfrist", "Einreichfrist". Extract date in ISO format (YYYY-MM-DD). If rolling/open deadline, set open_deadline to true.
  * Patterns: "deadline: DD.MM.YYYY", "application by YYYY-MM-DD", "submission until DD/MM/YYYY", "Einreichfrist: DD.MM.YYYY", "Bewerbungsfrist bis DD.MM.YYYY"
  * Also check: "Deadline", "Application Deadline", "Submission Date", "Due Date", "Closing Date", "Bewerbungsfrist", "Einreichfrist", "Stichtag"
  * Date formats: DD.MM.YYYY, DD/MM/YYYY, YYYY-MM-DD, "DD Month YYYY" (e.g., "15 March 2025")
  * Convert to ISO: YYYY-MM-DD format (e.g., "15.03.2025" → "2025-03-15")
  * Rolling deadlines: "ongoing", "rolling", "open", "laufend", "kontinuierlich" → set open_deadline: true, deadline: null
  * If multiple deadlines: Extract the next/earliest one
- For financial amounts, extract numbers only (no currency symbols in numbers) - these go in METADATA
- For dates, use ISO format (YYYY-MM-DD)
- For boolean values, use true/false
- Include meaningfulness: only extract specific, actionable information
- If information is ambiguous or unclear, omit it rather than guessing
- Extract contact information (email, phone) from the page
- **CRITICAL: ALWAYS identify funding types** - Look for keywords like "grant", "loan", "equity", "guarantee", "subsidy", "financing", "investment", "Förderung", "Kredit", "Beteiligung"
- Funding types must be one of: "grant", "loan", "equity", "guarantee", "subsidy", "convertible", "venture_capital", "bank_loan", "leasing", "crowdfunding", "angel_investment", "micro_credit", "repayable_advance", "visa_application", "gründungsprogramm", "coaching", "mentoring", "consultation", "networking", "workshop", "support_program", "consulting_support", "acceleration_program", "export_insurance", "intellectual_property", "patent_support", "export_support", "innovation_support"
- If funding type is unclear, infer from:
  * URL patterns (/grant/, /loan/, /equity/, /guarantee/)
  * Page content (mentions of "non-repayable" = grant, "repay" = loan, "equity stake" = equity)
  * Institution type (research agencies = grant, banks = loan, VCs = equity)
- **Geographic**: Extract FULL descriptions with context (e.g., "Companies must be based in Austria, Germany, or EU member states with headquarters in Vienna")
  * Save country, region, state, city if given
  * If no geographic requirement found, omit geographic category (don't extract "None" or "No restriction")
- Determine region from URL, content, or institution name (for metadata.region)
- **IMPORTANT**: funding_types is REQUIRED - if not found, use "unknown" but try hard to identify it
- For purely non-repayable grants, ONLY extract repayment_terms if the text explicitly states beneficiaries must repay funds; otherwise skip repayment_terms
- Always note interest_rate when a repayable instrument (loan, guarantee, micro credit, repayable advance) mentions percentages or margins
- Capture program duration whenever mentioned, even if only an approximate timeframe

CLASSIFICATION RULES:
1. Distinguish between:
   - Funding programs (grants, loans, equity) - actual money provided
   - Support programs (Gründungsprogramm, coaching, mentoring) - support services, may include funding
   - Services (consultation, workshops) - paid services, not funding
   - Information pages (about, contact) - not programs

2. Funding Type Validation:
   - Grants: Should have deadline OR open_deadline = true (grants typically have application deadlines)
   - Loans/Banks: Typically NO deadline (ongoing application process)
   - Services: NO funding amount, NO deadline (these are service offerings)
   - Gründungsprogramm: Support program (AMS, ÖSBS), may have optional deadline and funding

3. Specialized Programs:
   - Intellectual Property: IP support, patent assistance programs
   - Export Support: Export assistance programs
   - Innovation Support: Innovation support (may or may not include funding)

4. Quality Indicators:
   - Good page: Has funding amount, deadline (or open_deadline), requirements (5+), description
   - Poor page: Missing funding amount, deadline, requirements
   - Service page: No funding amount, no deadline, mentions "service", "consultation", "coaching", "workshop"

5. Funding Types to Identify:
   - Financial: grant, loan, equity, bank_loan, leasing, crowdfunding, subsidy, guarantee, venture_capital, angel_investment
   - Support: gründungsprogramm, coaching, mentoring, consultation, networking, workshop
   - Specialized: intellectual_property, patent_support, export_support, innovation_support`;
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

**IMPORTANT: Pay special attention to these SIX critical topics:**

1. **Description (REQUIRED)**: 
   - ${searchInstructions}
   - Extract: 2-5 complete sentences explaining what the program is, who it's for, and what it offers
   - Include: Purpose, target audience, main benefits, key features
   ${!isTextMode ? '- If not found in main content, check meta description or page title for context' : ''}

2. **Funding Amount (REQUIRED)**:
   - Search in: "Funding amount", "Förderhöhe", "Fördersumme", "Förderbetrag", tables, funding details sections
   - Look for: "up to €X", "maximum X EUR", "minimum X", "between X and Y", "from X to Y EUR", "X - Y EUR", "bis zu X€", "maximal X Euro", "mindestens X", "zwischen X und Y"
   - Extract: Numbers only (remove commas, spaces, currency symbols)
   - Examples: "€50,000" → 50000, "100.000 EUR" → 100000, "between 10,000 and 50,000 EUR" → min: 10000, max: 50000
   - If single (fixed) amount: use the SAME value for both min and max (this indicates a fixed amount)
   - If percentage only: Skip (need absolute amount)
   - **CRITICAL**: For bank loans, guarantees, leasing - these may NOT have fixed amounts but should still extract if mentioned

3. **Deadline & Duration (REQUIRED)**:
   - Search in: "Deadline", "Application Deadline", "Submission Date", "Due Date", "Closing Date", "Bewerbungsfrist", "Einreichfrist", "Stichtag"
   - Look for: "deadline: DD.MM.YYYY", "application by YYYY-MM-DD", "submission until DD/MM/YYYY", "Einreichfrist: DD.MM.YYYY"
   - Date formats: DD.MM.YYYY, DD/MM/YYYY, YYYY-MM-DD, "DD Month YYYY" (e.g., "15 March 2025")
   - Convert to ISO: YYYY-MM-DD format (e.g., "15.03.2025" → "2025-03-15")
   - Rolling deadlines: "ongoing", "rolling", "open", "laufend", "kontinuierlich" → set open_deadline: true, deadline: null
   - **CRITICAL**: Bank loans, guarantees, leasing typically have NO deadline (ongoing) - set open_deadline: true
   - If multiple deadlines: Extract the next/earliest one
   - ALWAYS capture program duration if mentioned (e.g., "Acceleration program lasts 6 months", "Support available for 24 months")
   - Capture application windows (calls open/close periods) in timeline.application_window when provided

4. **Financial Terms (CRITICAL for Loans/Guarantees/Equity)**:
   - For loans, leasing, guarantees, repayable advances, bank products:
     * **ALWAYS extract interest rates** (fixed/variable, margin, APR) - Look for "interest rate", "Zinssatz", "margin", "APR", percentages with "p.a." or "per annum", "EURIBOR", "LIBOR"
     * **ALWAYS extract repayment_terms** (duration, grace period, repayment schedule) - Look for "repayment", "Rückzahlung", "repay within X years", "grace period", "tilgung", "amortization", "repayment period"
     * **CRITICAL**: Use type "repayment_terms" in "financial" category, NOT generic "financial" types
     * Example: {"category": "financial", "type": "repayment_terms", "value": "Must repay within 10 years with 2-year grace period"}
     * Capture guarantee coverage ratios, premiums, minimum investment amount
   - For grants/subsidies:
     * Capture funding rates / grant ratios / subsidy intensity
     * Co-financing requirements (own contribution percentages)
   - For equity or venture capital programs:
     * Extract equity terms (stake expectations, dilution, convertible conditions)
   - Use requirement types: interest_rate, repayment_terms, co_financing, funding_rate, grant_ratio, minimum_investment_volume, premium, equity_terms, guarantee_fee, guarantee_ratio

5. **Company Stage & Innovation Focus (CRITICAL)**:
   - **ALWAYS extract company_stage** when mentioned: Look for "startup", "early stage", "growth stage", "scale-up", "established", "incorporated", "founded", "company age", "years in business", "newly founded", "young company", "mature company"
   - **CRITICAL**: Use type "company_stage" in "eligibility" category, NOT generic "eligibility_criteria"
   - Example: {"category": "eligibility", "type": "company_stage", "value": "Companies must be less than 3 years old"}
   - **ALWAYS extract innovation_focus** when themes are mentioned: Look for "digital transformation", "AI", "sustainability", "green tech", "circular economy", "innovation focus", "strategic priorities", "focus areas"
   - **CRITICAL**: Use type "innovation_focus" in "project" category, NOT generic "sector_focus" or "technology_area"
   - Example: {"category": "project", "type": "innovation_focus", "value": "Digital transformation and Industry 4.0"}
   - **ALWAYS extract technology_area** when specific technologies are mentioned: Look for "biotechnology", "nanotechnology", "IoT", "blockchain", "quantum", "robotics", "automation", "AI", "machine learning"
   - **ALWAYS extract use_of_funds** when funding purpose is described: Look for "use for", "purpose", "can be used for", "eligible costs", "funding covers", "personnel", "equipment", "R&D", "marketing", "working capital", "investment", "expansion"
   - **CRITICAL**: Use type "use_of_funds" in "funding_details" category, NOT generic "project_details" or "other"
   - Example: {"category": "funding_details", "type": "use_of_funds", "value": "Funds can be used for personnel costs, equipment, and R&D infrastructure"}

6. **Eligibility & Financial Requirements (CRITICAL)**:
   - **ALWAYS extract eligibility requirements** - Look for "eligible", "requirements", "must be", "qualify", "criteria", "voraussetzungen", "Anforderungen"
   - **CRITICAL: ALWAYS extract company_type** - This is REQUIRED. If not explicitly mentioned, infer from context (e.g., "innovation program" → startups/SMEs, "research grant" → research institutions, "startup accelerator" → startups)
   - **ALWAYS extract financial requirements** - Look for "co-financing", "own contribution", "matching funds", "Eigenmittel", "Eigenkapital", "minimum investment", "collateral"
   - If page has NO eligibility, financial, or funding_details requirements AND no funding amount, it's likely NOT a funding program - mark accordingly

7. **Timeline, Team, Application & Documents (CRITICAL - OFTEN MISSING)**:
   - **ALWAYS extract timeline information** if mentioned: duration, deadlines, application windows, project timelines
   - **ALWAYS extract team requirements** if mentioned: team size, team composition, founder requirements
   - **ALWAYS extract application process** if mentioned: how to apply, application steps, evaluation criteria, application forms
   - **ALWAYS extract required documents** if mentioned: what documents must be submitted, document formats, document requirements

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
  
  // Category mapping: Map "other" subcategories to new categories
  const categoryMapping: Record<string, string> = {
    // Map old "other" subcategories to new categories
    'application_process': 'application',
    'evaluation_criteria': 'application',
    'application_form': 'application',
    'application_requirement': 'application',
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
    'financial_statements': 'documents',
    'business_plan': 'documents',
    'proof_of_address': 'documents',
    'identification': 'documents',
    'funding_rate_requirement': 'financial',
    'grant_ratio_requirement': 'financial',
  };

  // Filter negative information patterns (comprehensive - catch all junk)
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
    /^not\s+applicable/i,
    /^not\s+available/i,
    /^no\s+data/i,
    /^no\s+information/i,
    /^unknown$/i,
    /^tbd$/i,
    /^to\s+be\s+determined/i,
    /^see\s+above$/i,
    /^see\s+below$/i,
    /^see\s+website$/i,
    /^contact\s+us$/i,
    /^please\s+contact/i,
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
          
          // Skip negative information (comprehensive junk filtering)
          if (isNegativeInformation(value)) return;
          
          // Skip very short values that are likely junk (< 10 chars, unless technical)
          if (value.length < 10 && !/^(trl|iso|iec|en)\s*\d+/i.test(value) && !/^\d+$/.test(value)) {
            return; // Too short, likely junk
          }
          
          // Skip metadata fields that shouldn't be requirements
          const type = item.type || 'general';
          if (type === 'currency' || type === 'funding_amount_status' || 
              type === 'funding_amount_min' || type === 'funding_amount_max' ||
              type === 'deadline' || type === 'open_deadline') {
            return; // These go in metadata only
          }
          
          // Skip single-word generic values (junk)
          if (/^(yes|no|true|false|both|none|all|any|sme|startup|large|small|medium|eur|usd|gbp|chf|grant|loan|equity|guarantee|subsidy)$/i.test(value.trim())) {
            return; // Generic single word, not a requirement
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
          
          // Lower threshold to 10 to capture ALL valid requirements (100% completeness)
          // Still filters out truly generic values (score 0)
          if (meaningfulness >= 5 || meaningfulness === null) {
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

  // Ensure company_type is always extracted (fallback if missing)
  if (!categorized.eligibility || !categorized.eligibility.some((req: any) => req.type === 'company_type')) {
    // Try to infer from context (URL, description, program focus)
    const urlLower = _url.toLowerCase();
    const description = (llmResponse.metadata?.description || '').toLowerCase();
    const programFocus = (llmResponse.metadata?.program_focus || []).join(' ').toLowerCase();
    const allText = `${urlLower} ${description} ${programFocus}`;
    
    let inferredValue = 'Companies eligible for this program'; // Default generic
    
    // Infer from keywords in order of specificity
    if (allText.includes('startup') || allText.includes('start-up') || allText.includes('accelerator') || 
        allText.includes('incubator') || allText.includes('seed') || allText.includes('early-stage')) {
      inferredValue = 'Startups and early-stage companies';
    } else if (allText.includes('sme') || allText.includes('small and medium') || allText.includes('mittelstand') || 
               allText.includes('kmü') || allText.includes('small business')) {
      inferredValue = 'Small and medium-sized enterprises (SMEs)';
    } else if (allText.includes('research') || allText.includes('university') || allText.includes('academic') || 
               allText.includes('institution') || allText.includes('research organization')) {
      inferredValue = 'Research institutions and universities';
    } else if (allText.includes('large') || allText.includes('enterprise') || allText.includes('corporation')) {
      inferredValue = 'Large enterprises';
    }
    
    // Add inferred company_type to eligibility
    if (!categorized.eligibility) {
      categorized.eligibility = [];
    }
    categorized.eligibility.push({
      type: 'company_type',
      value: inferredValue,
      source: 'llm_extraction_inferred',
      meaningfulness_score: 50 // Lower score for inferred values
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
 * Validate extraction quality
 */
function validateExtractionQuality(
  result: LLMExtractionResponse,
  _url: string
): { isValid: boolean; qualityScore: number; issues: string[] } {
  const issues: string[] = [];
  let qualityScore = 100;
  
  // Check metadata completeness
  if (!result.metadata.funding_amount_min && !result.metadata.funding_amount_max) {
    issues.push('Missing funding amount');
    qualityScore -= 20;
  }
  
  if (!result.metadata.deadline && !result.metadata.open_deadline) {
    issues.push('Missing deadline information');
    qualityScore -= 10;
  }
  
  if (!result.metadata.funding_types || result.metadata.funding_types.length === 0) {
    issues.push('Missing funding types');
    qualityScore -= 15;
  }
  
  // Check categorized requirements
  const totalRequirements = Object.values(result.categorized_requirements).reduce(
    (sum, items) => sum + items.length, 0
  );
  
  if (totalRequirements === 0) {
    issues.push('No requirements extracted');
    qualityScore -= 30;
  } else if (totalRequirements < 3) {
    issues.push(`Low requirement count: ${totalRequirements}`);
    qualityScore -= 15;
  }
  
  // Check for critical categories
  const hasGeographic = result.categorized_requirements.geographic && result.categorized_requirements.geographic.length > 0;
  const hasEligibility = result.categorized_requirements.eligibility && result.categorized_requirements.eligibility.length > 0;
  
  if (!hasGeographic) {
    issues.push('Missing geographic requirements');
    qualityScore -= 10;
  }
  
  if (!hasEligibility) {
    issues.push('Missing eligibility requirements');
    qualityScore -= 10;
  }
  
  // Check for meaningful requirements (not just junk)
  const meaningfulCount = Object.values(result.categorized_requirements).reduce((sum, items) => {
    return sum + items.filter((item: any) => {
      const meaningfulness = item.meaningfulness_score || 0;
      return meaningfulness >= 20; // Only count meaningful requirements
    }).length;
  }, 0);
  
  if (meaningfulCount < totalRequirements * 0.5) {
    issues.push(`Low meaningfulness: ${meaningfulCount}/${totalRequirements} requirements are meaningful`);
    qualityScore -= 10;
  }
  
  qualityScore = Math.max(0, qualityScore);
  const isValid = qualityScore >= 60; // Minimum quality threshold
  
  return { isValid, qualityScore, issues };
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

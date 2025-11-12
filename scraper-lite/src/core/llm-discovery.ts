/**
 * LLM-Based URL Discovery & Classification
 * Uses LLM to intelligently classify URLs before queuing
 */

import { isCustomLLMEnabled, callCustomLLM } from '../../../shared/lib/customLLM';
import OpenAI from 'openai';

// Lazy initialization - only create client if API key exists
function getOpenAIClient(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) return null;
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

export interface UrlClassification {
  url: string;
  isProgramPage: 'yes' | 'no' | 'maybe';
  fundingType?: 'grant' | 'loan' | 'equity' | 'guarantee' | 'subsidy' | 'unknown';
  qualityScore: number; // 0-100
  isOverviewPage?: boolean;
  reason?: string;
}

/**
 * Quick classification of a single URL (using URL + title only, no HTML fetch)
 */
export async function classifyUrl(
  url: string, 
  title?: string, 
  description?: string,
  customPrompt?: string
): Promise<UrlClassification> {
  // Use custom prompt if provided (for improved prompts with learned examples)
  const prompt = customPrompt 
    ? customPrompt.replace('{url}', url).replace('{title}', title || 'N/A').replace('{description}', description || 'N/A')
    : `Classify this URL to determine if it's a funding program page.

URL: ${url}
Title: ${title || 'N/A'}
Description: ${description || 'N/A'}

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

EXCLUDE these URL patterns (NOT programs - mark as "no"):
- /about-us/, /about/, /ueber/, /chi-siamo/
- /contact/, /kontakt/, /contact-us/, /team-contact/
- /team/, /team-members/, /team-members/
- /news/, /press/, /media/, /newsletter/
- /imprint/, /impressum/, /privacy/, /datenschutz/, /data-protection/
- /legal/, /terms/, /conditions/
- /accessibility/, /accessibility-statement/
- /login/, /sign-in/, /register/
- /events/, /workshops/, /events-workshops/
- /faq/, /frequently-asked-questions/
- Pages with titles like "Team", "Contact", "Accessibility", "Login", "Newsletter", "FAQ"

IMPORTANT: If URL or title suggests it's NOT a funding program page, mark as "no" with qualityScore 0-20.`;

  try {
    let responseText: string | null = null;

    if (isCustomLLMEnabled()) {
      try {
        const customResponse = await callCustomLLM({
          messages: [
            { role: 'system', content: 'You are a URL classifier for funding programs. Respond only with valid JSON.' },
            { role: 'user', content: prompt }
          ],
          responseFormat: 'json',
          temperature: 0.2,
          maxTokens: 200,
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
          { role: 'system', content: 'You are a URL classifier for funding programs. Respond only with valid JSON.' },
          { role: 'user', content: prompt }
        ],
        response_format: { type: "json_object" },
        max_tokens: 200,
        temperature: 0.2,
      });
      responseText = completion.choices[0]?.message?.content || '{}';
    }

    const parsed = typeof responseText === 'string' ? JSON.parse(responseText) : responseText;
    
    return {
      url,
      isProgramPage: parsed.isProgramPage || 'maybe',
      fundingType: parsed.fundingType || 'unknown',
      qualityScore: Math.max(0, Math.min(100, Number(parsed.qualityScore) || 50)),
      isOverviewPage: parsed.isOverviewPage || false,
      reason: parsed.reason
    };
  } catch (error: any) {
    // Default to "maybe" if classification fails
    return {
      url,
      isProgramPage: 'maybe',
      fundingType: 'unknown',
      qualityScore: 50,
      isOverviewPage: false,
      reason: `Classification failed: ${error.message}`
    };
  }
}

/**
 * Batch classify multiple URLs at once (more efficient)
 * Note: Gemini doesn't support batch classification well, so we skip batch for Gemini
 */
export async function batchClassifyUrls(
  urls: Array<{ url: string; title?: string; description?: string }>,
  customPrompt?: string
): Promise<UrlClassification[]> {
  if (urls.length === 0) return [];
  
  // Check if using Gemini - skip batch classification (doesn't work well)
  const isGemini = process.env.CUSTOM_LLM_ENDPOINT?.includes('generativelanguage.googleapis.com');
  
  if (isGemini) {
    // Gemini: Use individual classification with rate limiting
    // Paid tier: 1,000 req/min - rate limit queue handles throttling
    console.log(`   ⚠️  Gemini detected - using individual classification with rate limiting`);
    const results: UrlClassification[] = [];
    
    // Process in parallel batches for speed (paid tier can handle high concurrency)
    const BATCH_SIZE = 20; // Process 20 at a time in parallel (rate limit queue will throttle)
    for (let i = 0; i < urls.length; i += BATCH_SIZE) {
      const batch = urls.slice(i, i + BATCH_SIZE);
      
      // Process batch in parallel - rate limit queue handles throttling
      const batchResults = await Promise.all(
        batch.map(async (urlData) => {
          try {
            return await classifyUrl(urlData.url, urlData.title, urlData.description, customPrompt);
          } catch (error: any) {
            return {
              url: urlData.url,
              isProgramPage: 'maybe' as const,
              fundingType: 'unknown' as const,
              qualityScore: 50,
              isOverviewPage: false,
              reason: `Classification failed: ${error.message}`
            };
          }
        })
      );
      
      results.push(...batchResults);
    }
    
    return results;
  }
  
  // Dynamic batch sizing for optimal performance
  // Smaller batches for large URL counts to prevent timeouts
  let BATCH_SIZE = 30;
  if (urls.length > 200) {
    BATCH_SIZE = 10; // Large batches: smaller size to prevent timeouts
  } else if (urls.length > 50) {
    BATCH_SIZE = 20; // Medium batches: moderate size
  }
  // Small batches (<50): use 30 for speed
  const results: UrlClassification[] = [];
  
  for (let i = 0; i < urls.length; i += BATCH_SIZE) {
    const batch = urls.slice(i, i + BATCH_SIZE);
    
    const batchPrompt = `Classify these URLs to determine if they're funding program pages.

URLs:
${batch.map((u, idx) => `${idx + 1}. URL: ${u.url}\n   Title: ${u.title || 'N/A'}\n   Description: ${u.description || 'N/A'}`).join('\n\n')}

${customPrompt ? customPrompt.replace(/\{url\}|\{title\}|\{description\}/g, '') : ''}

Respond with JSON array:
[
  {
    "url": "exact URL from list",
    "isProgramPage": "yes" | "no" | "maybe",
    "fundingType": "grant" | "loan" | "equity" | "guarantee" | "subsidy" | "unknown",
    "qualityScore": 0-100,
    "isOverviewPage": true | false,
    "reason": "brief explanation"
  },
  ...
]

Rules:
- "yes" = Definitely a funding program page
- "maybe" = Could be, needs verification
- "no" = Not a funding program (news, contact, about, etc.)
- qualityScore: 0-100 based on how likely it contains useful program information`;

    try {
      let responseText: string | null = null;

      if (isCustomLLMEnabled()) {
        try {
          const customResponse = await callCustomLLM({
            messages: [
              { role: 'system', content: 'You are a URL classifier. Respond only with valid JSON array.' },
              { role: 'user', content: batchPrompt }
            ],
            responseFormat: 'json',
            temperature: 0.2,
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
            { role: 'system', content: 'You are a URL classifier. Respond only with valid JSON array.' },
            { role: 'user', content: batchPrompt }
          ],
          response_format: { type: "json_object" },
          max_tokens: 2000,
          temperature: 0.2,
        });
        responseText = completion.choices[0]?.message?.content || '[]';
      }

      // Try to extract JSON array
      let parsed: any[];
      try {
        const jsonMatch = responseText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        } else {
          parsed = JSON.parse(responseText);
          if (!Array.isArray(parsed)) {
            parsed = Object.values(parsed);
          }
        }
      } catch {
        // Fallback: classify individually
        const individual = await Promise.all(
          batch.map(u => classifyUrl(u.url, u.title, u.description))
        );
        results.push(...individual);
        continue;
      }

      // Map results back to URLs
      const batchResults = batch.map(u => {
        const match = parsed.find((p: any) => p.url === u.url);
        if (match) {
          return {
            url: u.url,
            isProgramPage: match.isProgramPage || 'maybe',
            fundingType: match.fundingType || 'unknown',
            qualityScore: Math.max(0, Math.min(100, Number(match.qualityScore) || 50)),
            isOverviewPage: match.isOverviewPage || false,
            reason: match.reason
          };
        }
        // Default if not found
        return {
          url: u.url,
          isProgramPage: 'maybe' as const,
          fundingType: 'unknown' as const,
          qualityScore: 50,
          isOverviewPage: false,
          reason: 'Not found in batch response'
        };
      });

      results.push(...batchResults);
    } catch (error: any) {
      // Fallback: classify individually
      console.warn(`⚠️  Batch classification failed, classifying individually: ${error.message}`);
      const individual = await Promise.all(
        batch.map(u => classifyUrl(u.url, u.title, u.description))
      );
      results.push(...individual);
    }
  }
  
  return results;
}


/**
 * RESPONSE PARSERS
 * Consolidated LLM response parsing logic
 * Consolidates: llmUtils.ts parsing functions
 */

/**
 * Parse program recommendation response from LLM
 * Extracts program data from JSON response (handles markdown wrappers and truncation)
 */
export function parseProgramResponse(responseText: string): {
  programs: Array<Record<string, any>>;
} {
  try {
    // Remove markdown code blocks if present (Gemini wraps in ```json)
    let cleanedText = responseText.trim();
    if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }
    
    cleanedText = cleanedText.trim();
    
    const parsed = JSON.parse(cleanedText);
    if (Array.isArray(parsed)) {
      return { programs: parsed };
    }
    if (parsed.programs && Array.isArray(parsed.programs)) {
      return { programs: parsed.programs };
    }
    return { programs: [] };
  } catch (error) {
    console.warn('[parseProgramResponse] Failed to parse LLM response:', error);
    
    // Fallback 1: Try to repair truncated JSON by finding last brace and balancing
    try {
      let truncated = responseText.trim();
      const lastBrace = truncated.lastIndexOf('}');
      if (lastBrace > 0) {
        let repaired = truncated.substring(0, lastBrace + 1);
        const openBraces = (repaired.match(/\{/g) || []).length;
        const closeBraces = (repaired.match(/\}/g) || []).length;
        const openBrackets = (repaired.match(/\[/g) || []).length;
        const closeBrackets = (repaired.match(/\]/g) || []).length;
        
        for (let i = closeBrackets; i < openBrackets; i++) repaired += ']';
        for (let i = closeBraces; i < openBraces; i++) repaired += '}';
        
        console.log('[parseProgramResponse] 🔧 Attempting repair: balanced braces/brackets');
        const repairedParsed = JSON.parse(repaired);
        if (repairedParsed.programs && Array.isArray(repairedParsed.programs) && repairedParsed.programs.length > 0) {
          return { programs: repairedParsed.programs };
        }
      }
    } catch (e) {
      console.warn('[parseProgramResponse] Repair attempt failed:', e);
    }
    
    // Fallback 2: Extract largest valid JSON fragment
    try {
      const matches = Array.from(responseText.matchAll(/\{[\s\S]*\}/g));
      for (const match of matches.reverse()) {
        try {
          const candidate = JSON.parse(match[0]);
          if (candidate.programs && Array.isArray(candidate.programs) && candidate.programs.length > 0) {
            return { programs: candidate.programs };
          }
        } catch {}
      }
    } catch (fallbackError) {
      console.warn('[parseProgramResponse] Fragment extraction failed');
    }
    
    return { programs: [] };
  }
}

/**
 * Custom error type for truncated JSON responses
 */
export class LLMTruncatedJsonError extends Error {
  constructor(message: string, public partialText: string) {
    super(message);
    this.name = 'LLMTruncatedJsonError';
  }
}

/**
 * Parse blueprint response from LLM
 * Extracts blueprint structure, requirements, and guidance
 */
export function parseBlueprintResponse(responseText: string): Record<string, any> {
  const trimmed = responseText.trim();

  // Guardrail: Detect truncated JSON (starts with { or [ but ends without closing braces)
  const startsWithJson = /^[{\[]/.test(trimmed);
  const endsWithCloseBrace = /[}\]]$/.test(trimmed);
  
  if (startsWithJson && !endsWithCloseBrace) {
    console.warn('[parseBlueprintResponse] Detected truncated JSON - starts with {/[ but ends without closing brace');
    throw new LLMTruncatedJsonError('LLM returned truncated JSON', trimmed);
  }

  try {
    const parsed = JSON.parse(trimmed);
    
    return parsed;
  } catch (error) {
    console.warn('[parseBlueprintResponse] Failed to parse blueprint response:', error);
    
    // If it's already our truncated error, rethrow
    if (error instanceof LLMTruncatedJsonError) {
      throw error;
    }
    
    // Attempt to repair truncated JSON
    try {
      let repaired = trimmed;
      
      // Find the last complete closing bracket
      const lastCloseBrace = repaired.lastIndexOf('}');
      if (lastCloseBrace > 0) {
        repaired = repaired.substring(0, lastCloseBrace + 1);
      }
      
      // Balance brackets
      const openBraces = (repaired.match(/\{/g) || []).length;
      const closeBraces = (repaired.match(/\}/g) || []).length;
      const openBrackets = (repaired.match(/\[/g) || []).length;
      const closeBrackets = (repaired.match(/\]/g) || []).length;
      
      for (let i = closeBrackets; i < openBrackets; i++) repaired += ']';
      for (let i = closeBraces; i < openBraces; i++) repaired += '}';
      
      const repaired_parsed = JSON.parse(repaired);
      return repaired_parsed;
    } catch (repairError) {
      console.warn('[parseBlueprintResponse] Repair failed, returning empty structure');
    }
    
    return {
      sections: [],
      validation: {},
      guidance: [],
    };
  }
}

/**
 * Parse section content response from LLM
 * Extracts generated section text
 */
export function parseSectionContentResponse(responseText: string): string {
  return responseText.trim();
}

/**
 * Parse compliance check response from LLM
 * Extracts JSON compliance data
 */
export function parseComplianceResponse(responseText: string): {
  score: number;
  met: string[];
  missing: string[];
  suggestions: string[];
  mistakes: string[];
} {
  try {
    const parsed = JSON.parse(responseText);
    return {
      score: parsed.score || 0,
      met: parsed.met || [],
      missing: parsed.missing || [],
      suggestions: parsed.suggestions || [],
      mistakes: parsed.mistakes || [],
    };
  } catch (error) {
    console.warn('[parseComplianceResponse] Failed to parse compliance response:', error);
    return {
      score: 0,
      met: [],
      missing: [],
      suggestions: [],
      mistakes: [],
    };
  }
}

/**
 * Extract text content between markers
 * Useful for parsing structured LLM outputs
 */
export function extractBetweenMarkers(text: string, startMarker: string, endMarker: string): string {
  const start = text.indexOf(startMarker);
  if (start === -1) return '';

  const content = text.substring(start + startMarker.length);
  const end = content.indexOf(endMarker);

  return end === -1 ? content : content.substring(0, end);
}

/**
 * Parse JSON from LLM response with fallback
 * Attempts to extract valid JSON even from incomplete responses
 */
export function parseJSONFromResponse(responseText: string): Record<string, any> | null {
  try {
    return JSON.parse(responseText);
  } catch (e) {
    // Try to find valid JSON within response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}

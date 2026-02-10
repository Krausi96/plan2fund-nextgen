/**
 * RESPONSE PARSERS
 * Consolidated LLM response parsing logic
 * Consolidates: llmUtils.ts parsing functions
 */

/**
 * Parse program recommendation response from LLM
 * Extracts program data from JSON response
 */
export function parseProgramResponse(responseText: string): {
  programs: Array<Record<string, any>>;
} {
  try {
    const parsed = JSON.parse(responseText);
    if (Array.isArray(parsed)) {
      return { programs: parsed };
    }
    if (parsed.programs && Array.isArray(parsed.programs)) {
      return { programs: parsed.programs };
    }
    return { programs: [] };
  } catch (error) {
    console.warn('[parseProgramResponse] Failed to parse LLM response:', error);
    return { programs: [] };
  }
}

/**
 * Parse blueprint response from LLM
 * Extracts blueprint structure, requirements, and guidance
 */
export function parseBlueprintResponse(responseText: string): Record<string, any> {
  try {
    return JSON.parse(responseText);
  } catch (error) {
    console.warn('[parseBlueprintResponse] Failed to parse blueprint response:', error);
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

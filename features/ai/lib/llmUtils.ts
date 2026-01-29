/**
 * Shared LLM Utility Functions
 */

/**
 * Sanitize LLM JSON response text
 */
export function sanitizeLLMResponse(text: string): string {
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

/**
 * Generic LLM response parser with validation
 * @param responseText Raw LLM response text
 * @param validator Function to validate and transform parsed data
 * @returns Validated and transformed data
 */
export function parseLLMResponse<T>(
  responseText: string, 
  validator: (data: any) => T
): T {
  try {
    const sanitized = sanitizeLLMResponse(responseText);
    const parsed = JSON.parse(sanitized);
    return validator(parsed);
  } catch (error) {
    console.error('[llm-utils] Failed to parse LLM JSON:', (error as Error).message);
    throw new Error('Invalid LLM response format');
  }
}

/**
 * Specific parser for program recommendation responses
 * Returns structured object with programs array and validation metadata
 */
export function parseProgramResponse(responseText: string): { programs: any[] } {
  // Validate input
  if (!responseText || typeof responseText !== 'string' || responseText.trim().length === 0) {
    console.error('[parseProgramResponse] Empty or invalid response text');
    return { programs: [] };
  }
  
  try {
    const sanitized = sanitizeLLMResponse(responseText);
    
    // Additional validation after sanitization
    if (!sanitized || sanitized.length === 0) {
      console.error('[parseProgramResponse] Sanitization produced empty result');
      return { programs: [] };
    }
    
    const parsed = JSON.parse(sanitized);
    
    // Validate parsed structure
    if (!parsed || typeof parsed !== 'object') {
      console.error('[parseProgramResponse] Invalid JSON structure - expected object, got:', typeof parsed);
      return { programs: [] };
    }
    
    // Handle both { programs: [...] } and direct array formats
    let programs: any[];
    if (Array.isArray(parsed)) {
      // Direct array format: [{ name: "...", ... }]
      programs = parsed;
    } else if (Array.isArray(parsed.programs)) {
      // Standard format: { programs: [...] }
      programs = parsed.programs;
    } else {
      console.error('[parseProgramResponse] Missing or invalid programs array in response');
      return { programs: [] };
    }
    
    // Validate programs array is not empty and contains objects
    if (programs.length === 0) {
      console.warn('[parseProgramResponse] Empty programs array returned by LLM');
    } else if (!programs.every(p => p && typeof p === 'object')) {
      console.error('[parseProgramResponse] Programs array contains non-object items');
      return { programs: [] };
    }
    
    return { programs };
    
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[parseProgramResponse] JSON parse failed:', errorMsg);
    console.error('[parseProgramResponse] Failed text (first 200 chars):', responseText.substring(0, 200));
    return { programs: [] };
  }
}

/**
 * Specific parser for blueprint generation responses
 */
export function parseBlueprintResponse(responseText: string) {
  return parseLLMResponse(responseText, (data: any) => {
    // Validate required blueprint structure
    const requiredFields = [
      'documents', 'sections', 'structuredRequirements', 'financial', 
      'market', 'team', 'risk', 'formatting', 'aiGuidance', 'diagnostics'
    ];
    
    for (const field of requiredFields) {
      if (!data[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
    
    return data;
  });
}

/**
 * Shared LLM Utility Functions
 * Eliminates duplication between recommend.ts and blueprintGenerator.ts
 */

/**
 * Sanitize LLM JSON response text
 * Removes markdown formatting and extracts pure JSON
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
 */
export function parseProgramResponse(responseText: string) {
  return parseLLMResponse(responseText, (data: any) => {
    return Array.isArray(data?.programs) ? data.programs : [];
  });
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

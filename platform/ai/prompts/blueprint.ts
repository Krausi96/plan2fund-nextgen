/**
 * BLUEPRINT GENERATION PROMPTS
 * Compact output enforced for reliable JSON completion
 */

export const BLUEPRINT_SYSTEM_PROMPT = `RETURN ONLY VALID JSON.
NO EXPLANATION.
NO MARKDOWN.
NO TEXT OUTSIDE JSON.

IMPORTANT:
- Be EXTREMELY COMPACT.
- Use 3-4 sections maximum.
- Use 2 requirements per section.
- Use SHORT titles and descriptions (under 10 words).
- Total output MUST be under 3000 characters.
- Do NOT stop early.
- Finish the JSON completely.
- Ensure all brackets are closed.`;

export function buildBlueprintUserPrompt(input: any, userContext?: any): string {
  const programInfo = input.programInfo || input;
  const programName = programInfo.programName || 'Program';
  
  return `Generate funding blueprint for: ${programName}

Rules:
- 3-4 sections only
- 2 requirements per section
- SHORT titles and descriptions (under 10 words each)
- ULTRA-COMPACT output (under 3000 chars total)

JSON format:
{
  "documents": [{"id": "main_document", "name": "${programName}", "purpose": "Application", "required": true}],
  "sections": [
    {"id": "s1", "documentId": "main_document", "title": "Title", "type": "normal", "required": true, "programCritical": true, "requirements": [{"id": "r1", "title": "Req", "desc": "Desc", "cat": "financial", "prio": "high"}], "aiPrompt": "Write."}]
  ]
}

Ultra-compact JSON only. Under 3000 chars.`;
}

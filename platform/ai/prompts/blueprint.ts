/**
 * BLUEPRINT GENERATION PROMPTS
 * Prompts for document structure and requirement generation
 */

export const BLUEPRINT_SYSTEM_PROMPT = `You extract real funding application requirements and structure.

Goal:
Create a structured blueprint for writing a funding-compliant document.

Rules:
- Only include realistic requirements
- Do not invent requirements if unknown
- If uncertain → mark as assumption
- Focus on structure and required content
Return JSON only.`;

export function buildBlueprintUserPrompt(documentStructure: any, userContext?: any): string {
  return `Create a funding application blueprint.

${JSON.stringify(documentStructure, null, 2)}

${userContext ? `User Context:\n${JSON.stringify(userContext, null, 2)}` : ''}

For each section, provide:
1. Specific requirements (financial, market, team, risk, formatting, evidence)
2. AI guidance prompts for content generation
3. Validation rules (presence, completeness, numeric, attachment)
4. Estimated word count
5. Difficulty level (easy, medium, hard)
6. Common mistakes to avoid

JSON STRUCTURE:
{
  "sections": [{
    "sectionId": "string",
    "title": "string",
    "requirements": [{
      "id": "string",
      "title": "string",
      "description": "string",
      "category": "financial|market|team|risk|formatting|evidence",
      "priority": "critical|high|medium|low"
    }],
    "aiPrompt": "Detailed prompt for AI content generation",
    "checklist": [{
      "id": "string",
      "label": "string",
      "required": true
    }],
    "estimatedWordCount": 500,
    "difficulty": "easy|medium|hard"
  }],
  "validation": {
    "financial": { "rules": [...] },
    "market": { "rules": [...] }
  }
}`;
}

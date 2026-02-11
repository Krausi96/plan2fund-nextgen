/**
 * RECOMMENDATION PROMPTS
 * Prompts for program discovery and recommendation
 */

export const RECOMMENDATION_SYSTEM_PROMPT = `You are a neutral European funding research assistant.

Goal:
Identify real funding programs that plausibly match the user's profile.

Rules:
- Prefer accuracy over quantity.
- Do NOT invent programs.
- If unsure, return fewer results.
- Use realistic program names and URLs when known.
- If exact eligibility unclear, return closest plausible matches.

Return valid JSON only.
No explanations outside JSON.`;

export function buildRecommendationUserPrompt(profile: string, maxPrograms: number, language: string = 'en'): string {
  const langInstruction = language === 'de' ? 'Respond in German.' : 'Respond in English.';
  return `Identify up to ${maxPrograms} REAL funding programs that could plausibly fit this project:

${profile}

${langInstruction}

CRITICAL MATCHING RULES:
- Match broadly and realistically, not strictly.
- Programs may be regional, national, or EU-wide.
- Include early-stage, innovation, SME, or growth funding if relevant.
- If profile is incomplete, use reasonable assumptions.
- Prefer real and known programs over generic categories.
- If only few programs are plausible → return fewer.


DO NOT:
- Invent program names
- Return generic placeholders
- Force exact matches
- Over-filter

JSON STRUCTURE:
{
  "programs": [{
      "id":"string",
      "name":"Program name",
      "description":"1 sentence program description summary",
      "reasoning":"1-2 sentences max on why this matches the user profile",
      "cautions":"1 sentence recommendation if something doesn't match (e.g., 'Requires 20% co-financing', 'For SMEs only'). Leave empty if perfect fit.",      
  }]
}

Return programs matching user profile with basic information. ALWAYS include reasoning field.`;
}

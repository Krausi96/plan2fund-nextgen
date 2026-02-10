/**
 * RECOMMENDATION PROMPTS
 * Prompts for program discovery and recommendation
 */

export const RECOMMENDATION_SYSTEM_PROMPT = `You are an expert on European funding programs. 
Your role is to recommend funding programs that closely match the user's profile and needs.
Return programs as valid JSON only, no other text.`;

export function buildRecommendationUserPrompt(profile: string, maxPrograms: number): string {
  return `You are an expert on European funding programs. Return up to ${maxPrograms} programs matching this profile:

${profile}

CRITICAL MATCHING RULES:
1. Location: Must be available in user's location or EU-wide
2. Organisation stage: Must accept user's stage (allow adjacent stages)
3. Funding amount: Accept programs with range €X/3 to €X*3 (±200% tolerance)
4. Co-financing: If user cannot provide co-financing, ONLY grants/subsidies/support
5. Revenue status: Pre-revenue → grants/angel/crowdfunding; Early revenue → all except large VC; Established → all types

FUNDING TYPES (use most specific subtype):
- Equity: angel_investment, venture_capital, crowdfunding, equity
- Loans: bank_loan, leasing, micro_credit, repayable_advance, loan
- Grants: grant
- Other: guarantee, visa_application, subsidy, convertible

PROGRAM REQUIREMENTS:
- Use REAL program names (e.g., "AWS Seedfinancing", "FFG Basisprogramm", "Horizon Europe", "EIC Accelerator")
- NO generic names like "General Category" or "General Program"
- Description: 2-3 sentences (what it offers, why it matches, key requirements)
- Extract ALL fields at root level (not nested in metadata)

JSON STRUCTURE:
{
  "programs": [{
    "id": "string",
    "name": "string",
    "website": "https://example.com",
    "description": "2-3 sentences",
    "funding_types": ["grant","loan"],
    "funding_amount_min": 5000,
    "funding_amount_max": 20000,
    "currency": "EUR",
    "location": "Austria",
    "organisation_type": "startup",
    "company_stage": "idea"
  }]
}

Return programs matching user profile with basic information.`;
}

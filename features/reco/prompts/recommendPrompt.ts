/**
 * Simplified LLM Prompt for Program Recommendations
 * Reduced from ~2000 tokens to ~800 tokens
 */

interface PromptContext {
  profile: string;
  maxPrograms: number;
  fundingPreference: {
    allowMix: boolean;
    values: string[];
  };
  attempt?: number;
}

export function buildRecommendPrompt(context: PromptContext): string {
  const { profile, maxPrograms, fundingPreference, attempt = 1 } = context;

  const baseInstructions = `You are an expert on European funding programs. Return up to ${maxPrograms} programs matching this profile:

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
- Include metadata: organization, co_financing_required, co_financing_percentage, application_deadlines, typical_timeline, competitiveness

JSON STRUCTURE:
{
  "programs": [{
    "id": "string",
    "name": "string",
    "website": "https://example.com",
    "funding_types": ["grant","loan"],
    "funding_amount_min": 5000,
    "funding_amount_max": 20000,
    "currency": "EUR",
    "location": "Austria",
    "company_type": "startup",
    "company_stage": "inc_lt_6m",
    "description": "2-3 sentences",
    "metadata": {
      "region": "Austria",
      "program_focus": ["digital","innovation"],
      "organization": "FFG",
      "co_financing_required": false,
      "co_financing_percentage": null,
      "application_deadlines": null,
      "typical_timeline": "2-3 months",
      "competitiveness": "medium"
    },
    "categorized_requirements": {}
  }]
}`;

  // Add diversity requirement if user can provide co-financing
  const diversitySection = fundingPreference.allowMix
    ? `\n\nDIVERSITY: Return mix of funding types with specific subtypes:
- ${Math.round(maxPrograms * 0.35)} grants, ${Math.round(maxPrograms * 0.3)} loans (with subtypes), ${Math.round(maxPrograms * 0.2)} equity (with subtypes), ${Math.round(maxPrograms * 0.125)} guarantees
- Use SPECIFIC subtypes (bank_loan, angel_investment, etc.) not generic types`
    : `\n\nRESTRICTION: User cannot provide co-financing → ONLY grants, subsidies, support types (no loans/equity/guarantees)`;

  // Add retry instructions if needed
  const retrySection =
    attempt > 1
      ? `\n\nRETRY (Attempt ${attempt}): Be more lenient. Minimum ${Math.min(3, maxPrograms)} programs required. Consider EU-wide programs if local ones unavailable.`
      : '';

  // Add program knowledge (concise)
  const knowledgeBase = `\n\nKEY PROGRAMS:
- Austria: AWS Seedfinancing, FFG Basisprogramm, FFG Bridge
- Germany: KfW programs, ZIM, EXIST-Gründerstipendium
- EU-wide: Horizon Europe, EIC Accelerator, COSME, LIFE
- Research: Horizon Europe, Marie Curie, ERC grants
- Startups: EXIST, AWS Seedfinancing, EIC Accelerator
- SMEs: KfW loans, ZIM, COSME`;

  return baseInstructions + diversitySection + retrySection + knowledgeBase;
}





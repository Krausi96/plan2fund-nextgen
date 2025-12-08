/**
 * Program Recommendation Prompt Builder
 * 
 * Purpose: Build LLM prompts for generating program recommendations
 * Used by: /api/programs/recommend endpoint
 * 
 * What it does:
 * - Takes user profile and funding preferences
 * - Builds structured prompt with matching rules
 * - Returns prompt string for LLM to generate program recommendations
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
    "region": "Austria",
    "company_type": "startup",
    "company_stage": "inc_lt_6m",
    "program_focus": ["digital","innovation"],
    "co_financing_required": false,
    "co_financing_percentage": null,
    "deadline": "2024-12-31",
    "open_deadline": false,
    "use_of_funds": ["product_development","hiring"],
    "impact_focus": ["environmental","social"],
    "organization": "FFG",
    "typical_timeline": "2-3 months",
    "competitiveness": "medium",
    "categorized_requirements": {
      "documents": [
        {
          "value": "Business plan",
          "description": "Detailed business plan required",
          "format": "pdf",
          "required": true,
          "requirements": ["Must include 3-year financial projections", "Include market analysis"]
        }
      ],
      "project": [
        {
          "value": "Project description",
          "description": "Describe your project in detail",
          "required": true,
          "requirements": "Explain the innovation and market opportunity",
          "type": "project_details"
        }
      ],
      "financial": [
        {
          "value": "Financial projections",
          "description": "3-year financial projections required",
          "required": true,
          "requirements": "Include P&L, cash flow, and balance sheet",
          "type": "repayment_terms"
        }
      ],
      "technical": [
        {
          "value": "Technical specifications",
          "description": "Technical details of your project",
          "required": false,
          "requirements": "Describe technology readiness level (TRL)",
          "type": "trl_level"
        }
      ]
    }
  }]
}

FIELD REQUIREMENTS:
- deadline: ISO date format (YYYY-MM-DD) or null if not specified
- open_deadline: boolean (true if rolling/ongoing deadlines, false if specific date)
- use_of_funds: array of strings (what the funding can be used for) or null
- impact_focus: array of strings (environmental, social, regional, research, education) or null
- program_focus: array of strings (industry/thematic focus areas)
- All other fields: extract as shown above

CATEGORIZED REQUIREMENTS (extract from program description):
Extract program requirements into 4 categories. This enables the editor to create program-specific templates.

DECISION RULE:
- If program requires a SEPARATE FILE/DOCUMENT to upload → Put in "documents"
  Examples: "Business Plan PDF", "Financial Statements Excel", "Technical Specification PDF", "CV", "Project Proposal PDF"
- If program requires CONTENT WITHIN THE BUSINESS PLAN → Put in "project", "financial", or "technical"
  Examples: "Project Description" section, "Financial Plan" section, "Technical Approach" section

1. "documents" - Separate files to upload:
   - Extract: Required documents that are separate files (PDFs, Word docs, Excel, etc.)
   - Structure: { "value": "Document name", "description": "...", "format": "pdf"|"docx"|"xlsx", "required": true|false, "requirements": [...] }
   - Examples: Business plan PDF, Financial statements, Technical specification, CV, Project proposal

2. "project" - Business plan sections (project-related):
   - Extract: Sections to write within the business plan about the project
   - Structure: { "value": "Section title", "description": "...", "required": true|false, "requirements": "..."|[...], "type": "project_details"|"market_size"|"revenue_model"|"capex_opex" }
   - Examples: Project description, Market analysis, Business model, Project timeline

3. "financial" - Business plan sections (financial-related):
   - Extract: Sections to write within the business plan about finances
   - Structure: { "value": "Section title", "description": "...", "required": true|false, "requirements": "..."|[...], "type": "repayment_terms"|"interest_rate"|"equity_terms"|"funding_rate"|"grant_ratio"|"guarantee_fee"|"guarantee_ratio" }
   - Examples: Financial plan, Budget breakdown, Financial projections, Cost breakdown

4. "technical" - Business plan sections (technical-related):
   - Extract: Sections to write within the business plan about technical aspects
   - Structure: { "value": "Section title", "description": "...", "required": true|false, "requirements": "..."|[...], "type": "technical_requirement"|"trl_level" }
   - Examples: Technical approach, Innovation description, Technology readiness, Technical specifications

EXTRACTION GUIDELINES:
- Extract from program description, requirements page, or application guidelines
- If no specific requirements mentioned, use empty arrays: "documents": [], "project": [], "financial": [], "technical": []
- Be specific: Extract actual document names and section titles mentioned
- Format: Use lowercase for format ("pdf", "docx", "xlsx")
- Required: Default to true unless explicitly stated as optional
- Requirements: Extract specific instructions or leave as empty array if none
`;

  // Add diversity requirement if user can provide co-financing
  const diversitySection = fundingPreference.allowMix
    ? `\n\nDIVERSITY: Return mix of funding types with specific subtypes:\n- ${Math.round(maxPrograms * 0.35)} grants, ${Math.round(maxPrograms * 0.3)} loans (with subtypes), ${Math.round(maxPrograms * 0.2)} equity (with subtypes), ${Math.round(maxPrograms * 0.125)} guarantees\n- Use SPECIFIC subtypes (bank_loan, angel_investment, etc.) not generic types`
    : `\n\nRESTRICTION: User cannot provide co-financing → ONLY grants, subsidies, support types (no loans/equity/guarantees)`;

  // Add retry instructions if needed
  const retrySection =
    attempt > 1
      ? `\n\nRETRY (Attempt ${attempt}): Be more lenient. Minimum ${Math.min(3, maxPrograms)} programs required. Consider EU-wide programs if local ones unavailable.`
      : '';

  // Add program knowledge (concise)
  const knowledgeBase = `\n\nKEY PROGRAMS:\n- Austria: AWS Seedfinancing, FFG Basisprogramm, FFG Bridge\n- Germany: KfW programs, ZIM, EXIST-Gründerstipendium\n- EU-wide: Horizon Europe, EIC Accelerator, COSME, LIFE\n- Research: Horizon Europe, Marie Curie, ERC grants\n- Startups: EXIST, AWS Seedfinancing, EIC Accelerator\n- SMEs: KfW loans, ZIM, COSME`;

  return baseInstructions + diversitySection + retrySection + knowledgeBase;
}





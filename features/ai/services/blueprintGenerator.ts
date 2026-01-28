/**
 * Blueprint Generator Service
 * Converts ProgramProfile to detailed structured requirements
 * Called AFTER program selection, works with existing program data
 */

import { callCustomLLM, ChatRequest } from '../clients/customLLM';

// Questionnaire-to-Program Mapping Functions
export interface QuestionnaireAnswers {
  organisation_type: string;
  company_stage: string;
  revenue_status: string;
  location: string;
  industry_focus: string[];
  funding_amount: number;
  co_financing: string;
}

/**
 * Converts questionnaire answers to normalized ProgramProfile structure
 * This centralizes the type alignment logic that was previously in recommend.ts
 */
export function convertQuestionnaireToProgramProfile(
  answers: QuestionnaireAnswers
): any {
  return {
    // Organization mapping
    organisationType: mapOrganisationType(answers.organisation_type),
    companyStage: mapCompanyStage(answers.company_stage),
    
    // Geographic and industry
    location: answers.location,
    industryFocus: answers.industry_focus,
    
    // Funding parameters
    fundingAmount: {
      min: answers.funding_amount,
      max: calculateFundingRange(answers.funding_amount, answers.company_stage),
      currency: 'EUR'
    },
    
    // Co-financing preference
    coFinancing: answers.co_financing === 'co_yes',
    
    // Revenue status
    hasRevenue: answers.revenue_status === 'yes',
    
    // Derived program preferences
    preferredFundingTypes: deriveFundingPreferences(answers),
    useOfFunds: deriveUseOfFunds(answers)
  };
}

function mapOrganisationType(orgType: string): string[] {
  const mapping: Record<string, string[]> = {
    'startup': ['grant', 'equity', 'subsidy'],
    'sme': ['loan', 'grant', 'guarantee'],
    'research': ['grant', 'subsidy', 'research_funding'],
    'corporate': ['loan', 'equity', 'grant']
  };
  return mapping[orgType] || ['grant'];
}

function mapCompanyStage(stage: string): string {
  const mapping: Record<string, string> = {
    'idea': 'early_stage',
    'MVP': 'growth_stage',
    'revenue': 'established'
  };
  return mapping[stage] || 'early_stage';
}

function calculateFundingRange(amount: number, stage: string): number {
  // Calculate reasonable upper bound based on company stage
  const multipliers: Record<string, number> = {
    'idea': 2.0,    // Early stage can ask for more relative to current need
    'MVP': 1.8,
    'revenue': 1.5   // Established companies typically need less buffer
  };
  
  const multiplier = multipliers[stage] || 1.8;
  return Math.round(amount * multiplier);
}

function deriveFundingPreferences(answers: QuestionnaireAnswers): string[] {
  const preferences: string[] = [];
  
  // Based on organisation type
  if (answers.organisation_type === 'startup') {
    preferences.push('grant', 'equity');
  } else if (answers.organisation_type === 'sme') {
    preferences.push('loan', 'grant');
  }
  
  // Based on co-financing willingness
  if (answers.co_financing === 'co_yes') {
    preferences.push('co_financed_programs');
  }
  
  // Based on revenue status
  if (answers.revenue_status === 'yes') {
    preferences.push('working_capital', 'expansion_funding');
  } else {
    preferences.push('seed_funding', 'startup_grants');
  }
  
  return [...new Set(preferences)]; // Remove duplicates
}

function deriveUseOfFunds(answers: QuestionnaireAnswers): string[] {
  const useOfFunds: string[] = [];
  
  // Map industry focus to likely use of funds
  const industryMappings: Record<string, string[]> = {
    'technology': ['R&D', 'product_development', 'market_expansion'],
    'healthcare': ['R&D', 'clinical_trials', 'regulatory_compliance'],
    'manufacturing': ['equipment', 'production_scaling', 'quality_systems'],
    'green_energy': ['R&D', 'sustainability_initiatives', 'carbon_reduction'],
    'digitalization': ['software_development', 'automation', 'process_optimization']
  };
  
  answers.industry_focus.forEach(industry => {
    const mappings = industryMappings[industry.toLowerCase()] || ['general_business_purposes'];
    useOfFunds.push(...mappings);
  });
  
  return [...new Set(useOfFunds)];
}

// Shared Interfaces for Application Requirements
export interface ApplicationRequirements {
  documents?: Array<{
    document_name: string;
    required: boolean;
    format: string;
    authority: string;
    reuseable: boolean;
  }>;
  sections?: Array<{
    title: string;
    required: boolean;
    subsections: Array<{ title: string; required: boolean }>;
  }>;
  financial_requirements?: {
    financial_statements_required: string[];
    years_required: number[];
    co_financing_proof_required: boolean;
    own_funds_proof_required: boolean;
  };
}

export interface EnhancedBlueprint {
  documents: Array<{
    name: string;
    purpose: string;
    required: boolean;
  }>;
  sections: Array<{
    documentId: string;
    title: string;
    required: boolean;
    programCritical: boolean;
  }>;
  structuredRequirements: Array<{
    category: 'financial' | 'market' | 'team' | 'risk' | 'formatting' | 'evidence';
    scope: 'global' | 'document' | 'section';
    severity: 'blocker' | 'major' | 'minor';
    description: string;
    evidenceType: string;
    validationLogic: string;
  }>;
  financial: {
    modelsRequired: string[];
    yearsRequired: number[];
    coFinancingChecks: string[];
    budgetStructure: string;
  };
  market: {
    tamSamSom: boolean;
    competitionDepth: string;
    customerProof: string[];
  };
  team: {
    orgStructure: string;
    cvRules: string[];
    keyRoles: string[];
  };
  risk: {
    categories: string[];
    mitigation: string[];
    regulatoryRisks: string[];
  };
  formatting: {
    pageLimits: string;
    language: string;
    annexRules: string;
  };
  aiGuidance: {
    perSectionChecklist: Array<{ section: string; items: string[] }>;
    perSectionPrompts: Array<{ section: string; prompt: string }>;
  };
  diagnostics: {
    confidenceScore: number;
    conflicts: string[];
    assumptions: string[];
    missingDataFlags: string[];
  };
}

interface ProgramInfo {
  id: string;
  name: string;
  description: string;
  funding_types: string[];
  application_requirements?: any;
}

export async function generateEnhancedBlueprint(
  program: ProgramInfo,
  userContext: Record<string, any>
): Promise<EnhancedBlueprint> {
  try {
    console.log(`[blueprint] Generating enhanced blueprint for: ${program.name}`);
    
    // Build detailed prompt for blueprint generation
    const prompt = buildBlueprintPrompt(program, userContext);
    
    const request: ChatRequest = {
      messages: [
        { 
          role: 'system', 
          content: 'You are an expert funding program analyst. Generate detailed structured requirements for document blueprints.' 
        },
        { 
          role: 'user', 
          content: prompt 
        }
      ],
      responseFormat: 'json',
      temperature: 0.3,
      maxTokens: 8000,
      taskType: 'blueprint_generation'
    };
    
    const response = await callCustomLLM(request);
    
    // Parse and validate the response
    const parsed = parseBlueprintResponse(response.output);
    
    console.log(`[blueprint] Successfully generated blueprint for ${program.name}`);
    return parsed;
    
  } catch (error) {
    console.error(`[blueprint] Failed to generate blueprint for ${program.name}:`, error);
    // Return fallback blueprint structure
    return createFallbackBlueprint(program);
  }
}

function buildBlueprintPrompt(program: ProgramInfo, userContext: Record<string, any>): string {
  return `TASK: BLUEPRINT GENERATION FOR "${program.name}"

CONTEXT:
Program: ${program.name}
Description: ${program.description}
Funding Types: ${program.funding_types.join(', ')}
User Profile: Location=${userContext.location}, Stage=${userContext.company_stage}, Funding Need=€${userContext.funding_amount}

PARSE AND GENERATE DETAILED STRUCTURED REQUIREMENTS:

DOCUMENTS:
List all required documents with:
- name (specific document title)
- purpose (why it's needed)
- required (true/false)

SECTIONS  /Chapter:
Hierarchical section structure with:
- documentId (reference to parent document)
- title (section heading)
- Subsection / Subchapter
- required (true/false)  
- programCritical (true/false - essential for approval)

STRUCTURED REQUIREMENTS (each requirement MUST have ALL fields):
- category: financial | market | team | risk | formatting | evidence
- scope: global | document | section
- severity: blocker | major | minor
- description: detailed requirement explanation
- evidenceType: specific evidence needed
- validationLogic: human-readable validation rules

FINANCIAL REQUIREMENTS:
- modelsRequired: list of financial models / graphs /tables / KPIs needed (3-year projections, cash flow, ROI etc.)
- yearsRequired: array of years [1, 3, 5]
- coFinancingChecks: validation rules for co-financing
- budgetStructure: required budget breakdown format

MARKET ANALYSIS:
- tamSamSom: boolean (TAM/SAM/SOM calculation required)
- competitionDepth: required competition analysis level
- customerProof: list of customer validation requirements

TEAM STRUCTURE:
- orgStructure: required organizational documentation
- cvRules: resume/CV submission requirements
- keyRoles: essential team positions to highlight

RISK ASSESSMENT:
- categories: risk types to address
- mitigation: required risk mitigation strategies
- regulatoryRisks: compliance requirements

FORMATTING STANDARDS:
- pageLimits: page count restrictions
- language: required language(s)
- annexRules: supplementary document rules

AI GUIDANCE:
- perSectionChecklist: validation items per section
- perSectionPrompts: content generation guidance per section

DIAGNOSTICS:
- confidenceScore: 0-100 quality score
- conflicts: potential conflicting requirements
- assumptions: key assumptions made
- missingDataFlags: data gaps identified

RETURN VALID JSON ONLY with this exact structure:
{
  "documents": [{"name": "string", "purpose": "string", "required": true}],
  "sections": [{"documentId": "string", "title": "string", "required": true, "programCritical": true}],
  "structuredRequirements": [{
    "category": "financial",
    "scope": "document", 
    "severity": "major",
    "description": "detailed requirement",
    "evidenceType": "specific evidence",
    "validationLogic": "validation rules"
  }],
  "financial": {
    "modelsRequired": ["3-year projections"],
    "yearsRequired": [1, 3, 5],
    "coFinancingChecks": ["minimum 20% self-funding"],
    "budgetStructure": "detailed breakdown required"
  },
  "market": {
    "tamSamSom": true,
    "competitionDepth": "detailed competitor analysis",
    "customerProof": ["customer letters", "market research"]
  },
  "team": {
    "orgStructure": "organizational chart required",
    "cvRules": ["executive resumes", "key personnel CVs"],
    "keyRoles": ["CEO", "CTO", "Finance Director"]
  },
  "risk": {
    "categories": ["market", "technical", "financial"],
    "mitigation": ["risk register", "mitigation plans"],
    "regulatoryRisks": ["data protection", "industry compliance"]
  },
  "formatting": {
    "pageLimits": "maximum 50 pages",
    "language": "English",
    "annexRules": "numbered annexes with table of contents"
  },
  "aiGuidance": {
    "perSectionChecklist": [{"section": "Executive Summary", "items": ["clear value proposition", "market opportunity"]}],
    "perSectionPrompts": [{"section": "Financial Plan", "prompt": "Detail 3-year financial projections with assumptions"}]
  },
  "diagnostics": {
    "confidenceScore": 85,
    "conflicts": ["page limit vs detailed financials"],
    "assumptions": ["market growth rate 5% annually"],
    "missingDataFlags": ["customer references needed"]
  }
}`;
}

function parseBlueprintResponse(responseText: string): EnhancedBlueprint {
  try {
    // Sanitize and parse JSON response
    let cleaned = responseText.trim();
    cleaned = cleaned.replace(/```json/gi, '').replace(/```/g, '');
    
    const firstCurly = cleaned.indexOf('{');
    const lastCurly = cleaned.lastIndexOf('}');
    
    if (firstCurly >= 0 && lastCurly > firstCurly) {
      cleaned = cleaned.slice(firstCurly, lastCurly + 1);
    }
    
    const parsed = JSON.parse(cleaned);
    
    // Validate required structure
    const requiredFields = [
      'documents', 'sections', 'structuredRequirements', 'financial', 
      'market', 'team', 'risk', 'formatting', 'aiGuidance', 'diagnostics'
    ];
    
    for (const field of requiredFields) {
      if (!parsed[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
    
    return parsed as EnhancedBlueprint;
    
  } catch (error) {
    console.error('[blueprint] Failed to parse blueprint response:', error);
    throw new Error('Invalid blueprint response format');
  }
}

function createFallbackBlueprint(_program: ProgramInfo): EnhancedBlueprint {
  return {
    documents: [
      { name: "Business Plan", purpose: "Core project description", required: true },
      { name: "Financial Projections", purpose: "3-year financial forecast", required: true }
    ],
    sections: [
      { documentId: "main", title: "Executive Summary", required: true, programCritical: true },
      { documentId: "main", title: "Project Description", required: true, programCritical: true }
    ],
    structuredRequirements: [
      {
        category: "financial",
        scope: "document",
        severity: "major",
        description: "Provide detailed 3-year financial projections",
        evidenceType: "Excel spreadsheet",
        validationLogic: "Must include revenue, costs, and cash flow projections"
      }
    ],
    financial: {
      modelsRequired: ["3-year projections", "cash flow analysis"],
      yearsRequired: [1, 3],
      coFinancingChecks: ["self-funding verification"],
      budgetStructure: "detailed line-item breakdown"
    },
    market: {
      tamSamSom: true,
      competitionDepth: "basic competitor analysis",
      customerProof: ["market research", "customer interviews"]
    },
    team: {
      orgStructure: "organizational chart",
      cvRules: ["key personnel resumes"],
      keyRoles: ["project lead", "finance manager"]
    },
    risk: {
      categories: ["market", "financial"],
      mitigation: ["basic risk assessment"],
      regulatoryRisks: ["standard compliance"]
    },
    formatting: {
      pageLimits: "reasonable length",
      language: "English",
      annexRules: "clear labeling"
    },
    aiGuidance: {
      perSectionChecklist: [{ section: "Executive Summary", items: ["value proposition", "market size"] }],
      perSectionPrompts: [{ section: "Financial Plan", prompt: "Include 3-year projections" }]
    },
    diagnostics: {
      confidenceScore: 70,
      conflicts: [],
      assumptions: ["standard application process"],
      missingDataFlags: ["detailed requirements pending"]
    }
  };
}
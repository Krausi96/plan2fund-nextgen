/**
 * Blueprint Generator Service
 * Converts ProgramProfile to detailed structured requirements
 * Called AFTER program selection, works with existing program data
 * Core responsibility: Generate detailed application requirements from program + user context
 */

import { callCustomLLM, ChatRequest } from '../clients/customLLM';
import { parseBlueprintResponse } from '../lib/llmUtils';

// Export interfaces for external use
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
    const parsed = parseBlueprintResponseLocal(response.output);
    
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

SECTIONS / Chapters:
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

function parseBlueprintResponseLocal(responseText: string): EnhancedBlueprint {
  try {
    return parseBlueprintResponse(responseText) as EnhancedBlueprint;
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
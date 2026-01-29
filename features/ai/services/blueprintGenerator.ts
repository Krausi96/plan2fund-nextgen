/**
 * Blueprint Generator Service
 * Core responsibility: Generate detailed application requirements from program + user context
 */

import { callCustomLLM, ChatRequest } from '../clients/customLLM';
import { parseBlueprintResponse } from '../lib/llmUtils';
import { createFallbackBlueprint } from '../lib/blueprintUtils';

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

/**
 * Build optimized blueprint generation prompt with token budget prioritization
 * Priority order: Core structure > Financial > User context > Detailed guidance
 */
function buildBlueprintPrompt(program: ProgramInfo, userContext: Record<string, any>): string {
  // PRIORITY 1: Core program information (always included)
  const coreSection = `TASK: BLUEPRINT GENERATION FOR "${program.name}"

PROGRAM:
Name: ${program.name}
Description: ${program.description || 'Not specified'}
Funding Types: ${program.funding_types?.join(', ') || 'Not specified'}`;

  // PRIORITY 2: User context (include if available, keep concise)
  const userSection = userContext && Object.keys(userContext).length > 0
    ? `\nUSER CONTEXT: Location=${userContext.location || 'N/A'}, Stage=${userContext.company_stage || 'N/A'}, Funding=${userContext.funding_amount ? '€' + userContext.funding_amount : 'N/A'}`
    : '';

  // PRIORITY 3: Essential requirements structure (always included)
  const structureSection = `

GENERATE STRUCTURED BLUEPRINT:

DOCUMENTS: Required documents with name, purpose, required flag
SECTIONS: Hierarchical sections with documentId, title, required, programCritical flags
STRUCTURED REQUIREMENTS: Category (financial|market|team|risk|formatting|evidence), scope, severity, description, evidenceType, validationLogic

FINANCIAL: modelsRequired, yearsRequired, coFinancingChecks, budgetStructure
MARKET: tamSamSom, competitionDepth, customerProof
TEAM: orgStructure, cvRules, keyRoles
RISK: categories, mitigation, regulatoryRisks
FORMATTING: pageLimits, language, annexRules`;

  // PRIORITY 4: AI Guidance (include if token budget allows)
  const guidanceSection = `
AI GUIDANCE: perSectionChecklist, perSectionPrompts
DIAGNOSTICS: confidenceScore (0-100), conflicts, assumptions, missingDataFlags`;

  // PRIORITY 5: Example structure (minimal, essential fields only)
  const exampleSection = `

RETURN VALID JSON:
{
  "documents": [{"name": "string", "purpose": "string", "required": true}],
  "sections": [{"documentId": "string", "title": "string", "required": true, "programCritical": true}],
  "structuredRequirements": [{"category": "financial", "scope": "document", "severity": "major", "description": "...", "evidenceType": "...", "validationLogic": "..."}],
  "financial": {"modelsRequired": [], "yearsRequired": [], "coFinancingChecks": [], "budgetStructure": ""},
  "market": {"tamSamSom": true, "competitionDepth": "", "customerProof": []},
  "team": {"orgStructure": "", "cvRules": [], "keyRoles": []},
  "risk": {"categories": [], "mitigation": [], "regulatoryRisks": []},
  "formatting": {"pageLimits": "", "language": "", "annexRules": ""},
  "aiGuidance": {"perSectionChecklist": [], "perSectionPrompts": []},
  "diagnostics": {"confidenceScore": 0, "conflicts": [], "assumptions": [], "missingDataFlags": []}
}`;

  // Combine sections in priority order
  // Total estimated tokens: ~500-600 (vs 800-900 previously)
  return coreSection + userSection + structureSection + guidanceSection + exampleSection;
}

function parseBlueprintResponseLocal(responseText: string): EnhancedBlueprint {
  try {
    return parseBlueprintResponse(responseText) as EnhancedBlueprint;
  } catch (error) {
    console.error('[blueprint] Failed to parse blueprint response:', error);
    throw new Error('Invalid blueprint response format');
  }
}
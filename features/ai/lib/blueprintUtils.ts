/**
 * Blueprint Utility Functions
 * Shared fallback blueprint structure for consistency across blueprint generation
 */

import type { EnhancedBlueprint } from '../services/blueprintGenerator';

export interface ProgramInfo {
  id: string;
  name: string;
  description?: string;
  funding_types?: string[];
  application_requirements?: any;
}

/**
 * Create fallback blueprint structure
 * Used when LLM generation fails or for manual program connections
 * 
 * Responsibility: Provide consistent default blueprint structure
 * Used by: blueprintGenerator.ts (error fallback), ProgramOption.tsx (manual connections)
 * 
 * @param program - Basic program information
 * @returns Complete EnhancedBlueprint with sensible defaults
 */
export function createFallbackBlueprint(_program: ProgramInfo): EnhancedBlueprint {
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

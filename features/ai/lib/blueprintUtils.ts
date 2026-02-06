/**
 * Blueprint Utility Functions
 * Shared fallback blueprint structure for consistency across blueprint generation
 */

import type { Blueprint } from '../services/blueprintGenerator';

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
 * @param _program - Basic program information (unused, kept for API compatibility)
 * @returns Complete Blueprint with sensible defaults
 */
export function createFallbackBlueprint(_program: ProgramInfo): Blueprint {
  return {
    programId: "fallback",
    programName: "Fallback Program",
    structure: {
      documents: [
        { id: "main", name: "Business Plan", required: true },
        { id: "financial", name: "Financial Projections", required: true }
      ],
      sections: [
        { id: "executive-summary", documentId: "main", title: "Executive Summary", required: true, critical: true },
        { id: "project-description", documentId: "main", title: "Project Description", required: true, critical: true }
      ]
    },
    requirements: {
      global: [
        {
          id: "financial-projections",
          description: "Provide detailed 3-year financial projections",
          severity: "major",
          evidence: "Excel spreadsheet"
        }
      ],
      bySection: {
        "executive-summary": [
          { id: "value-prop", description: "Clearly state value proposition", severity: "major" },
          { id: "market-size", description: "Define target market size", severity: "major" }
        ]
      }
    },
    validation: {
      financial: {
        yearsRequired: 3,
        coFinancingRequired: false,
        currency: "USD"
      },
      formatting: {
        maxPages: 50,
        language: "en",
        annexRequired: true
      },
      submission: {
        mandatoryDocuments: ["business-plan", "financial-projections"]
      }
    },
    guidance: {
      sectionTips: {
        "executive-summary": ["Keep concise", "Highlight unique value"]
      },
      generationPrompts: {
        "financial-projections": "Generate realistic 3-year financial projections based on market analysis"
      }
    },
    diagnostics: {
      confidence: 70,
      assumptions: ["Standard business plan structure"],
      missingInfo: ["Specific program requirements pending"]
    }
  };
}
/**
 * Blueprint types consolidated from features/editor/lib/types/ai/
 * Central location for AI-generated blueprint and requirement types
 */

import type { DocumentStructure } from './project';

export interface Blueprint {
  id: string;
  programId?: string; // Legacy: ID of source program
  programName?: string; // Legacy: name of source program
  documentStructureId: string;
  structure?: { // Legacy: blueprint structure sections
    sections: BlueprintSection[];
  };
  sections: BlueprintSection[];
  validation: {
    financial?: ValidationCategory;
    market?: ValidationCategory;
    team?: ValidationCategory;
    risk?: ValidationCategory;
    formatting?: ValidationCategory;
    evidence?: ValidationCategory;
  };
  guidance: AIGuidance[] | { generationPrompts?: Record<string, string> }; // Support both formats
  requirements?: { // Legacy: requirements by section
    bySection?: Record<string, RequirementItem[]>;
  } & RequirementItem[];
  diagnostics?: BlueprintDiagnostics;
  createdAt: string;
  updatedAt: string;
}

export interface BlueprintSection {
  sectionId: string;
  title: string;
  requirements: RequirementItem[];
  aiPrompt: string;
  checklist: ChecklistItem[];
  estimatedWordCount?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export interface RequirementItem {
  id: string;
  title: string;
  description: string;
  category: 'financial' | 'market' | 'team' | 'risk' | 'formatting' | 'evidence';
  priority: 'critical' | 'high' | 'medium' | 'low';
  examples?: string[];
}

export interface ChecklistItem {
  id: string;
  label: string;
  required: boolean;
  helpText?: string;
}

export interface ValidationCategory {
  rules: ValidationRule[];
  examples?: string[];
  commonMistakes?: string[];
}

export interface ValidationRule {
  id: string;
  type: 'presence' | 'completeness' | 'numeric' | 'attachment' | 'format';
  condition: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface AIGuidance {
  sectionId: string;
  title: string;
  prompt: string;
  checklist: string[];
  tips?: string[];
  examples?: string[];
  commonPitfalls?: string[];
}

export interface BlueprintDiagnostics {
  confidence: number;
  warnings: string[];
  missingFields: string[];
  suggestions: string[];
  completeness: number; // percentage
  qualityScore?: number; // 0-100
}

/**
 * Request to generate a blueprint from document structure
 */
export interface BlueprintRequest {
  documentStructure: DocumentStructure;
  programId?: string;
  userContext?: {
    organisation_type?: string;
    company_stage?: string;
    location?: string;
    funding_amount?: number;
    industry_focus?: string[];
    co_financing?: string;
  };
  options?: {
    includeExamples?: boolean;
    includeCommonMistakes?: boolean;
    detailLevel?: 'brief' | 'standard' | 'detailed';
  };
}

/**
 * Response from blueprint generation
 */
export interface BlueprintResponse {
  blueprint: Blueprint;
  success: boolean;
  errors?: string[];
  warnings?: string[];
  metadata?: {
    generatedAt: string;
    processingTimeMs: number;
    modelUsed?: string;
  };
}

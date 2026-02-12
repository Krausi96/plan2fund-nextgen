/**
 * Document validation schemas using Zod
 * Consolidated from pages/api/programs/blueprint.ts and document structure validation
 * Used by both frontend and backend API validation
 */

import { z } from 'zod';
import type { BlueprintRequest } from '../types';

/**
 * Document Structure schema
 * Validates the unified output from both program and document flows
 * OPTION A: Requirements are owned by sections, not at DocumentStructure level
 */
export const DocumentStructureSchema = z.object({
  documents: z.array(z.object({
    id: z.string(),
    name: z.string(),
    purpose: z.string(),
    required: z.boolean(),
    order: z.number().optional(),
    type: z.enum(['core', 'template', 'custom']).optional(),
  })),
  sections: z.array(z.object({
    id: z.string(),
    documentId: z.string(),
    title: z.string(),
    type: z.enum(['normal', 'metadata', 'references', 'appendices', 'ancillary']),
    required: z.boolean(),
    programCritical: z.boolean(),
    content: z.string().optional(),
    aiGuidance: z.array(z.string()).optional(),
    hints: z.array(z.string()).optional(),
    order: z.number().optional(),
    // OPTION A: Requirements owned directly by section
    requirements: z.array(z.object({
      id: z.string(),
      category: z.enum(['financial', 'market', 'team', 'risk', 'formatting', 'evidence']),
      title: z.string(),
      description: z.string(),
      priority: z.enum(['critical', 'high', 'medium', 'low']),
      examples: z.array(z.string()).optional(),
    })).optional(),
    // Subsections
    subsections: z.array(z.object({
      id: z.string(),
      title: z.string(),
      content: z.string().optional(),
      rawText: z.string().optional(),
      order: z.number().optional(),
    })).optional(),
    // Legacy: rawSubsections for template compatibility
    rawSubsections: z.array(z.object({
      id: z.string(),
      title: z.string(),
      rawText: z.string().optional(),
    })).optional(),
  })),
  // NO requirements array here - moved to section level
  validationRules: z.array(z.object({
    id: z.string(),
    type: z.enum(['presence', 'completeness', 'numeric', 'attachment']),
    sectionId: z.string(),
    rule: z.string(),
    severity: z.enum(['error', 'warning']),
  })),
  aiGuidance: z.array(z.object({
    sectionId: z.string(),
    prompt: z.string(),
    checklist: z.array(z.string()),
    examples: z.array(z.string()).optional(),
  })),
  renderingRules: z.object({
    titlePage: z.object({
      enabled: z.boolean(),
      fields: z.array(z.string()).optional(),
    }).optional(),
    tableOfContents: z.object({
      enabled: z.boolean(),
      format: z.enum(['numbered', 'bulleted']).optional(),
    }).optional(),
    references: z.object({
      enabled: z.boolean(),
      style: z.enum(['APA', 'Chicago', 'Harvard']).optional(),
    }).optional(),
    appendices: z.object({
      enabled: z.boolean(),
      maxCount: z.number().optional(),
    }).optional(),
  }),
  conflicts: z.array(z.object({
    id: z.string(),
    type: z.string(),
    description: z.string(),
    severity: z.enum(['high', 'medium', 'low']),
    resolution: z.string().optional(),
  })),
  warnings: z.array(z.object({
    id: z.string(),
    message: z.string(),
    context: z.string().optional(),
  })),
  confidenceScore: z.number().min(0).max(100),
  metadata: z.object({
    source: z.enum(['program', 'document', 'template']),
    generatedAt: z.string().datetime(),
    version: z.string(),
  }),
});

export type ValidatedDocumentStructure = z.infer<typeof DocumentStructureSchema>;

/**
 * Blueprint Request schema
 * Validates requests to generate blueprints
 */
export const BlueprintRequestSchema = z.object({
  documentStructure: DocumentStructureSchema,
  programId: z.string().optional(),
  userContext: z.object({
    organisation_type: z.string().optional(),
    company_stage: z.string().optional(),
    location: z.string().optional(),
    funding_amount: z.number().optional(),
    industry_focus: z.array(z.string()).optional(),
    co_financing: z.string().optional(),
  }).optional(),
  options: z.object({
    includeExamples: z.boolean().optional(),
    includeCommonMistakes: z.boolean().optional(),
    detailLevel: z.enum(['brief', 'standard', 'detailed']).optional(),
  }).optional(),
}) satisfies z.ZodType<BlueprintRequest>;

export type ValidatedBlueprintRequest = z.infer<typeof BlueprintRequestSchema>;

/**
 * Blueprint schema
 * Validates generated blueprints
 */
export const BlueprintSchema = z.object({
  id: z.string(),
  documentStructureId: z.string(),
  sections: z.array(z.object({
    sectionId: z.string(),
    title: z.string(),
    requirements: z.array(z.object({
      id: z.string(),
      title: z.string(),
      description: z.string(),
      category: z.enum(['financial', 'market', 'team', 'risk', 'formatting', 'evidence']),
      priority: z.enum(['critical', 'high', 'medium', 'low']),
      examples: z.array(z.string()).optional(),
    })),
    aiPrompt: z.string(),
    checklist: z.array(z.object({
      id: z.string(),
      label: z.string(),
      required: z.boolean(),
      helpText: z.string().optional(),
    })),
    estimatedWordCount: z.number().optional(),
    difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  })),
  validation: z.object({
    financial: z.any().optional(),
    market: z.any().optional(),
    team: z.any().optional(),
    risk: z.any().optional(),
    formatting: z.any().optional(),
    evidence: z.any().optional(),
  }),
  guidance: z.array(z.any()),
  diagnostics: z.object({
    confidence: z.number(),
    warnings: z.array(z.string()),
    missingFields: z.array(z.string()),
    suggestions: z.array(z.string()),
    completeness: z.number(),
    qualityScore: z.number().optional(),
  }).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type ValidatedBlueprint = z.infer<typeof BlueprintSchema>;

/**
 * Validate document structure
 */
export function validateDocumentStructure(data: unknown): ValidatedDocumentStructure | null {
  try {
    return DocumentStructureSchema.parse(data);
  } catch (error) {
    console.warn('[documentSchemas] DocumentStructure validation failed:', error);
    return null;
  }
}

/**
 * Validate blueprint request
 */
export function validateBlueprintRequest(data: unknown): ValidatedBlueprintRequest | null {
  try {
    return BlueprintRequestSchema.parse(data);
  } catch (error) {
    console.warn('[documentSchemas] BlueprintRequest validation failed:', error);
    return null;
  }
}

/**
 * Validate blueprint
 */
export function validateBlueprint(data: unknown): ValidatedBlueprint | null {
  try {
    return BlueprintSchema.parse(data);
  } catch (error) {
    console.warn('[documentSchemas] Blueprint validation failed:', error);
    return null;
  }
}

// Barrel exports
export const documentSchemas = {
  DocumentStructureSchema,
  BlueprintRequestSchema,
  BlueprintSchema,
} as const;

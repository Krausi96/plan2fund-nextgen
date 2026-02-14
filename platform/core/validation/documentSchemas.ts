/**
 * Document Structure Validation Schemas
 * Zod schemas for runtime validation of document structures
 */

import { z } from 'zod';
// import type { BlueprintRequest } from '../types'; // Blueprint types removed

/**
 * Document Structure schema
 * Validates the complete document structure with sections and requirements
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
    title: z.string(),
    required: z.boolean(),
    source: z.enum(['program', 'template', 'upload', 'user']),
    requirements: z.array(z.object({
      id: z.string(),
      category: z.enum(['financial', 'market', 'team', 'risk', 'formatting', 'evidence']),
      title: z.string(),
      description: z.string(),
      priority: z.enum(['critical', 'high', 'medium', 'low']),
      examples: z.array(z.string()).optional(),
    })),
    children: z.array(z.object({
      id: z.string(),
      title: z.string(),
      required: z.boolean(),
      source: z.enum(['program', 'template', 'upload', 'user']),
      requirements: z.array(z.object({
        id: z.string(),
        category: z.enum(['financial', 'market', 'team', 'risk', 'formatting', 'evidence']),
        title: z.string(),
        description: z.string(),
        priority: z.enum(['critical', 'high', 'medium', 'low']),
        examples: z.array(z.string()).optional(),
      })),
    })).optional(),
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
  metadata: z.object({
    source: z.enum(['program', 'template', 'upload', 'free']),
    createdAt: z.string().datetime(),
    programId: z.string().optional(),
  }),
});

export type ValidatedDocumentStructure = z.infer<typeof DocumentStructureSchema>;

/**
 * Blueprint Request schema
 * Validates requests for blueprint generation
 */
export const BlueprintRequestSchema = z.object({
  programId: z.string(),
  programName: z.string(),
  description: z.string().optional(),
  deliverables: z.array(z.string()).optional(),
  fundingType: z.string().optional(),
  organization: z.string().optional(),
  region: z.string().optional(),
  customization: z.object({
    includeExamples: z.boolean().optional(),
    includeCommonMistakes: z.boolean().optional(),
    detailLevel: z.enum(['brief', 'standard', 'detailed']).optional(),
  }).optional(),
});
// }) satisfies z.ZodType<BlueprintRequest>; // Blueprint types removed

// export type ValidatedBlueprintRequest = z.infer<typeof BlueprintRequestSchema>; // Blueprint types removed

/**
 * Validate document structure
 */
export function validateDocumentStructure(data: unknown): ValidatedDocumentStructure | null {
  try {
    return DocumentStructureSchema.parse(data);
  } catch (error) {
    console.error('[validateDocumentStructure] Validation failed:', error);
    return null;
  }
}
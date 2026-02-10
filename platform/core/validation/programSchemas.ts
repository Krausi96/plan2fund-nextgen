/**
 * Program validation schemas using Zod
 * Consolidated from features/reco/lib/programPersistence.ts and pages/api/programs/recommend.ts
 * Used by both frontend (persistence) and backend (API validation)
 */

import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';

/**
 * User answers schema from questionnaire (from pages/api/programs/recommend.ts)
 * Validates incoming recommendation requests
 */
export const UserAnswersSchema = z.object({
  // Required fields (validated at runtime)
  location: z.string().min(1, 'Location is required'),
  organisation_type: z.string().min(1, 'Organisation type is required'),
  funding_amount: z.number().positive('Funding amount must be positive'),
  company_stage: z.enum(['idea', 'MVP', 'revenue', 'growth']),

  // Optional fields (with type validation)
  revenue_status: z.union([z.number().min(0), z.literal(0)]).optional(),
  revenue_status_category: z.string().optional(),
  industry_focus: z.array(z.string()).min(1).optional(),
  co_financing: z.enum(['co_yes', 'co_no', 'co_flexible']).optional(),
  co_financing_percentage: z.string().optional(),
  legal_form: z.string().optional(),
  deadline_urgency: z.string().optional(),
  use_of_funds: z.array(z.string()).optional(),
  impact_focus: z.array(z.string()).optional(),
  organisation_type_other: z.string().optional(),
  organisation_type_sub: z.enum(['no_company', 'has_company']).optional(),
  location_region: z.string().optional(),
  funding_intent: z.string().optional(),
}).strict(); // Reject unknown fields

export type ValidatedUserAnswers = z.infer<typeof UserAnswersSchema>;

/**
 * Persisted program schema from programPersistence.ts
 * Used to validate program data before localStorage persistence
 */
export const PersistedProgramSchema = z.object({
  id: z.string().min(1, 'Program ID is required').max(200, 'Program ID too long'),
  name: z.string().min(1, 'Program name is required').max(500, 'Program name too long'),
  type: z.string().max(100).optional(),
  organization: z.string().max(300).optional(),
  application_requirements: z.any().optional(),

  // New fields for decision-critical information
  repayable: z.boolean().nullable().optional(),
  repayable_percentage: z.number().nullable().optional(),
  repayable_type: z.enum(['grant', 'loan', 'mixed', 'convertible']).nullable().optional(),

  timeline: z.object({
    application_deadline: z.string().nullable().optional(),
    decision_time: z.string().nullable().optional(),
    funding_start: z.string().nullable().optional(),
  }).optional(),

  effort_level: z.enum(['low', 'medium', 'heavy']).optional(),

  // Renamed fields (kept for compatibility)
  organisation_type: z.string().nullable().optional(),
  eligible_company_types: z.array(z.string()).nullable().optional(),
  eligible_stage: z.string().nullable().optional(),
});

export type PersistedProgram = z.infer<typeof PersistedProgramSchema>;

/**
 * Sanitize a string value to prevent XSS
 * Used before validation
 */
function sanitizeString(value: unknown, maxLength: number = 500): string {
  if (typeof value !== 'string') {
    return '';
  }
  // Trim and sanitize
  const sanitized = DOMPurify.sanitize(value.trim(), {
    ALLOWED_TAGS: [], // No HTML tags allowed in plain text fields
    ALLOWED_ATTR: []
  });
  // Return truncated value
  return sanitized.slice(0, maxLength);
}

/**
 * Validate and sanitize persisted program data
 * Returns null if validation fails
 */
export function validateAndSanitizeProgram(data: unknown): PersistedProgram | null {
  if (!data || typeof data !== 'object') {
    return null;
  }

  const raw = data as Record<string, unknown>;

  // Pre-sanitize string fields before validation
  const preSanitized = {
    id: sanitizeString(raw.id, 200),
    name: sanitizeString(raw.name, 500),
    type: sanitizeString(raw.type, 100),
    organization: sanitizeString(raw.organization, 300),
    application_requirements: raw.application_requirements,

    // New fields
    repayable: raw.repayable,
    repayable_percentage: raw.repayable_percentage,
    repayable_type: raw.repayable_type,
    timeline: raw.timeline,
    effort_level: raw.effort_level,
    organisation_type: sanitizeString(raw.organisation_type, 300),
    eligible_company_types: raw.eligible_company_types,
    eligible_stage: sanitizeString(raw.eligible_stage, 100),
  };

  const result = PersistedProgramSchema.safeParse(preSanitized);
  if (!result.success) {
    console.warn('[programSchemas] Validation failed:', result.error.issues);
    return null;
  }

  return result.data;
}

/**
 * Validate user answers from questionnaire
 */
export function validateUserAnswers(data: unknown): ValidatedUserAnswers | null {
  try {
    return UserAnswersSchema.parse(data);
  } catch (error) {
    console.warn('[programSchemas] UserAnswers validation failed:', error);
    return null;
  }
}

// Barrel exports
export const programSchemas = {
  UserAnswersSchema,
  PersistedProgramSchema,
} as const;

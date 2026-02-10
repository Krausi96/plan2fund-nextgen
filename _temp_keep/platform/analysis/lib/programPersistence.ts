/**
 * Program Persistence Utilities
 * Consolidated from features/reco/lib/programPersistence.ts
 * Shared localStorage helpers for ProgramFinder with validation and sanitization
 */

import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';

/**
 * Zod schema for validating persisted program data
 */
const PersistedProgramSchema = z.object({
  id: z.string().min(1, 'Program ID is required').max(200, 'Program ID too long'),
  name: z.string().min(1, 'Program name is required').max(500, 'Program name too long'),
  type: z.string().max(100).optional(),
  organization: z.string().max(300).optional(),
  application_requirements: z.any().optional(),
  
  repayable: z.boolean().nullable().optional(),
  repayable_percentage: z.number().nullable().optional(),
  repayable_type: z.enum(['grant', 'loan', 'mixed', 'convertible']).nullable().optional(),
  
  timeline: z.object({
    application_deadline: z.string().nullable().optional(),
    decision_time: z.string().nullable().optional(),
    funding_start: z.string().nullable().optional(),
  }).optional(),
  
  effort_level: z.enum(['low', 'medium', 'heavy']).optional(),
  
  organisation_type: z.string().nullable().optional(),
  eligible_company_types: z.array(z.string()).nullable().optional(),
  eligible_stage: z.string().nullable().optional(),
});

export type PersistedProgram = z.infer<typeof PersistedProgramSchema>;

/**
 * Sanitize a string value to prevent XSS
 */
function sanitizeString(value: unknown, maxLength: number = 500): string {
  if (typeof value !== 'string') {
    return '';
  }
  const sanitized = DOMPurify.sanitize(value.trim(), {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  });
  return sanitized.slice(0, maxLength);
}

/**
 * Validate and sanitize persisted program data
 */
export function validateAndSanitize(data: unknown): PersistedProgram | null {
  if (!data || typeof data !== 'object') {
    return null;
  }

  const raw = data as Record<string, unknown>;
  
  const preSanitized = {
    id: sanitizeString(raw.id, 200),
    name: sanitizeString(raw.name, 500),
    type: sanitizeString(raw.type, 100),
    organization: sanitizeString(raw.organization, 300),
    application_requirements: raw.application_requirements,
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
    console.warn('[programPersistence] Validation failed:', result.error.issues);
    return null;
  }

  return result.data;
}

const STORAGE_KEY = 'selectedProgram';

/**
 * Save selected program to localStorage
 */
export function saveSelectedProgram(program: PersistedProgram): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    const validation = PersistedProgramSchema.safeParse(program);
    if (!validation.success) {
      console.warn('[programPersistence] Invalid program data:', validation.error.issues);
      return false;
    }

    const dataToStore: PersistedProgram = {
      id: sanitizeString(program.id, 200),
      name: sanitizeString(program.name, 500),
      type: sanitizeString(program.type, 100),
      organization: sanitizeString(program.organization, 300),
      application_requirements: program.application_requirements,
      repayable: program.repayable,
      repayable_percentage: program.repayable_percentage,
      repayable_type: program.repayable_type,
      timeline: program.timeline,
      effort_level: program.effort_level,
      organisation_type: sanitizeString(program.organisation_type, 300),
      eligible_company_types: program.eligible_company_types,
      eligible_stage: sanitizeString(program.eligible_stage, 100),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToStore));
    return true;
  } catch (error) {
    console.warn('[programPersistence] Could not save program selection:', error);
    return false;
  }
}

/**
 * Load selected program from localStorage
 */
export function loadSelectedProgram(): PersistedProgram | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return null;
    }

    const parsed = JSON.parse(stored);
    const validated = validateAndSanitize(parsed);
    if (!validated) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    return validated;
  } catch (error) {
    console.warn('[programPersistence] Could not load program selection:', error);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch { /* ignore */ }
    return null;
  }
}

/**
 * Clear selected program from localStorage
 */
export function clearSelectedProgram(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn('[programPersistence] Could not clear program selection:', error);
  }
}

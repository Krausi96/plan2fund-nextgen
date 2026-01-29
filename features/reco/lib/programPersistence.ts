/**
 * Program Persistence Utilities
 * Shared localStorage helpers for ProgramFinder and EditorProgramFinder
 * Includes validation and sanitization for security
 */

import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';

/**
 * Zod schema for validating persisted program data
 * Ensures runtime type safety for localStorage data
 */
const PersistedProgramSchema = z.object({
  id: z.string().min(1, 'Program ID is required').max(200, 'Program ID too long'),
  name: z.string().min(1, 'Program name is required').max(500, 'Program name too long'),
  type: z.string().max(100).optional(),
  organization: z.string().max(300).optional(),
  application_requirements: z.any().optional(),
});

/**
 * Type inferred from schema for type-safe access
 */
export type PersistedProgram = z.infer<typeof PersistedProgramSchema>;

/**
 * Sanitize a string value to prevent XSS
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
function validateAndSanitize(data: unknown): PersistedProgram | null {
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
    application_requirements: raw.application_requirements
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
 * Used by both ProgramFinder and EditorProgramFinder
 * 
 * @param program - Program data to persist
 * @returns true if successful, false otherwise
 */
export function saveSelectedProgram(program: PersistedProgram): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    // Validate input before storing
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
      application_requirements: program.application_requirements
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
 * Includes validation and sanitization for security
 * 
 * @returns Persisted program data or null if not found/invalid
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
    
    // Validate and sanitize on load
    const validated = validateAndSanitize(parsed);
    if (!validated) {
      // Clear invalid data
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    return validated;
  } catch (error) {
    console.warn('[programPersistence] Could not load program selection:', error);
    // Clear corrupted data
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

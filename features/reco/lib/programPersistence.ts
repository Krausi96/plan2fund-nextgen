/**
 * Program Persistence Utilities
 * Shared localStorage helpers for ProgramFinder and EditorProgramFinder
 */

export interface PersistedProgram {
  id: string;
  name: string;
  type?: string;
  organization?: string;
  application_requirements?: any;
  [key: string]: any; // Allow additional fields
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
    const dataToStore: PersistedProgram = {
      id: program.id,
      name: program.name,
      type: program.type,
      organization: program.organization,
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
 * 
 * @returns Persisted program data or null if not found
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
    return parsed as PersistedProgram;
  } catch (error) {
    console.warn('[programPersistence] Could not load program selection:', error);
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

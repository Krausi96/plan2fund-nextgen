/**
 * Program Catalog Module
 * Loads and serves funding program definitions
 * Single source of truth for all program data
 */

import type { FundingProgram } from '@/platform/core/types/program';

/**
 * Load program definitions from static data, database, or API
 * This is where all program data sources converge
 */
export async function loadProgramCatalog(): Promise<FundingProgram[]> {
  // TODO: Implement catalog loading from actual data source
  // For now, return empty array - will be implemented with data layer
  return [];
}

/**
 * Get a single program by ID
 */
export async function getProgramById(id: string): Promise<FundingProgram | null> {
  const catalog = await loadProgramCatalog();
  return catalog.find(p => p.id === id) || null;
}

/**
 * Search programs by criteria (used by match.ts)
 */
export async function searchPrograms(_criteria: Record<string, any>): Promise<FundingProgram[]> {
  const catalog = await loadProgramCatalog();
  // TODO: Implement search/filter logic
  return catalog;
}

/**
 * Platform Programs Module
 * Central hub for all funding program logic
 * Exports: catalog, matching, recommendations
 */

export { loadProgramCatalog, getProgramById, searchPrograms } from './catalog';
export { matchPrograms, filterEligiblePrograms, type MatchScore } from './match';
export { recommendPrograms, searchRecommendedPrograms, type GeneratedProgram, type RecommendationResult } from './recommend';

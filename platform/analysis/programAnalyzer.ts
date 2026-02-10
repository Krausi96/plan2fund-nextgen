import { normalizeFundingProgram } from './program-flow/normalizer';
import type { FundingProgram } from '../core/types';

/**
 * Analyzes funding programs and returns normalized program data
 * Entry point that delegates to program-flow utilities
 */
export async function analyzeProgram(
  programData: any
): Promise<FundingProgram> {
  return normalizeFundingProgram(programData);
}
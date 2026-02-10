/**
 * Program Recommendation Orchestration Module
 * Unified entry point for program recommendations
 * Integrates catalog → matching → LLM generation → caching
 */

import type { Program } from '@/platform/core/types/program';
import { loadProgramCatalog, searchPrograms } from './catalog';
import { matchPrograms, filterEligiblePrograms } from './match';
import { callAI } from '@/platform/ai/orchestrator';

export interface GeneratedProgram extends Program {
  source?: string;
}

export interface RecommendationResult {
  programs: GeneratedProgram[];
  stats: {
    matched: number;
    generated: number;
    cached: boolean;
    provider?: string;
  };
}

/**
 * Main recommendation orchestrator
 * Coordinates catalog → matching → LLM generation
 */
export async function recommendPrograms(
  userAnswers: Record<string, any>,
  maxResults: number = 10
): Promise<RecommendationResult> {
  // Step 1: Load catalog
  const catalog = await loadProgramCatalog();
  
  // Step 2: Filter eligible programs
  const eligible = filterEligiblePrograms(catalog, userAnswers);
  
  // Step 3: Deterministic matching (no LLM)
  const matches = matchPrograms(eligible, userAnswers);
  
  // Step 4: If not enough deterministic matches, use LLM to generate
  let recommended: GeneratedProgram[] = [];
  let provider = 'deterministic';
  
  if (matches.length < maxResults) {
    try {
      // Call LLM for additional program generation
      const llmResult = await callAI({
        type: 'recommendPrograms',
        payload: {
          answers: userAnswers,
          maxPrograms: maxResults,
        },
      });
      
      if (llmResult.success && llmResult.data?.programs) {
        recommended = llmResult.data.programs;
        provider = llmResult.llmStats?.provider || 'openai';
      }
    } catch (error) {
      console.error('[recommend] LLM generation failed, using deterministic only:', error);
    }
  }
  
  // Return combined results
  return {
    programs: recommended.length > 0 ? recommended : matches as any,
    stats: {
      matched: matches.length,
      generated: recommended.length,
      cached: false,
      provider,
    },
  };
}

/**
 * Search for programs by keywords
 * Simple text-based search across catalog
 */
export async function searchRecommendedPrograms(
  query: string
): Promise<GeneratedProgram[]> {
  const results = await searchPrograms({ query });
  return results as any;
}

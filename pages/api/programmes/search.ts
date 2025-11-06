/**
 * Programme Search API
 * Unified endpoint for semantic and rule-based search
 * Based on strategic analysis report recommendations
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { scoreProgramsEnhanced, EnhancedProgramResult } from '@/features/reco/engine/enhancedRecoEngine';

interface SearchRequest {
  query?: string; // Project description for semantic search
  filters?: {
    fundingAmount?: { min?: number; max?: number };
    companyStage?: string;
    trl?: string;
    location?: string;
    fundingType?: string;
    industry?: string;
  };
  answers?: Record<string, any>; // For guided mode
  mode?: 'guided' | 'manual';
  limit?: number;
}

interface SearchResponse {
  success: boolean;
  programs: EnhancedProgramResult[];
  total: number;
  semanticScore?: number; // If semantic search was used
  ruleBasedScore?: number; // Rule-based score
  combinedScore?: number; // Combined score
  explanations?: string[]; // Top factors influencing ranking
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SearchResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      programs: [], 
      total: 0 
    });
  }

  try {
    const body: SearchRequest = req.body;
    const { query, filters, answers, mode = 'manual', limit = 50 } = body;

    // Load programs from database
    const programsResponse = await fetch(`${req.headers.origin || 'http://localhost:3000'}/api/programs?enhanced=true`);
    if (!programsResponse.ok) {
      throw new Error('Failed to load programs');
    }
    const programsData = await programsResponse.json();
    const allPrograms = programsData.programs || [];

    // Combine answers and filters
    const searchParams = {
      ...answers,
      ...filters,
      project_description: query
    };

    // Rule-based scoring (EnhancedReco)
    const ruleBasedResults = scoreProgramsEnhanced(allPrograms, searchParams);
    
    // TODO: Add semantic search layer
    // For now, return rule-based results with explanations
    const results = ruleBasedResults.slice(0, limit).map(program => ({
      ...program,
      // Add explanations from reasons and risks
      explanations: [
        ...(program.reasons || []).slice(0, 3),
        ...(program.risks || []).slice(0, 2).map((r: string) => `Note: ${r}`)
      ]
    }));

    return res.status(200).json({
      success: true,
      programs: results,
      total: ruleBasedResults.length,
      ruleBasedScore: results[0]?.score,
      explanations: results[0]?.explanations || []
    });
  } catch (error: any) {
    console.error('Search API error:', error);
    return res.status(500).json({
      success: false,
      programs: [],
      total: 0,
      explanations: []
    });
  }
}


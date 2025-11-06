/**
 * Programme Search API
 * Unified endpoint for semantic and rule-based search
 * Based on strategic analysis report recommendations
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { scoreProgramsEnhanced, EnhancedProgramResult } from '@/features/reco/engine/enhancedRecoEngine';
import { generateEmbedding, findSimilarPrograms, createProgramDescription } from '@/shared/lib/embeddings';
import { Pool } from 'pg';

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
    
    // Semantic search (if query provided)
    let semanticResults: Array<{ id: string; similarity: number }> = [];
    let semanticScore = 0;
    
    if (query && query.trim().length > 0 && process.env.OPENAI_API_KEY) {
      try {
        // Generate embedding for user query
        const queryEmbedding = await generateEmbedding(query);
        
        if (queryEmbedding.length > 0 && process.env.DATABASE_URL) {
          // Load program embeddings from database
          const pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.DATABASE_URL.includes('neon.tech') ? { rejectUnauthorized: false } : false
          });
          
          try {
            const embeddingsResult = await pool.query(
              `SELECT page_id, embedding, description_text 
               FROM programme_embeddings 
               WHERE model_version = 'text-embedding-3-small'`
            );
          
            if (embeddingsResult.rows.length > 0) {
              // Calculate similarities
              const programEmbeddings = embeddingsResult.rows.map((row: any) => ({
                id: String(row.page_id),
                embedding: row.embedding
              }));
              
              semanticResults = findSimilarPrograms(queryEmbedding, programEmbeddings, 50);
              semanticScore = semanticResults[0]?.similarity || 0;
            } else {
              // No embeddings in DB yet - generate on the fly for top programs
              console.log('No embeddings in DB, generating on-the-fly...');
              const topPrograms = ruleBasedResults.slice(0, 20);
              const descriptions = topPrograms.map(p => createProgramDescription(p));
              const embeddings = await generateEmbeddings(descriptions);
              
              const programEmbeddings = topPrograms.map((program, i) => ({
                id: program.id,
                embedding: embeddings[i] || []
              })).filter(p => p.embedding.length > 0);
              
              semanticResults = findSimilarPrograms(queryEmbedding, programEmbeddings, 50);
              semanticScore = semanticResults[0]?.similarity || 0;
            }
          } finally {
            await pool.end();
          }
        }
      } catch (semanticError: any) {
        console.warn('Semantic search failed, using rule-based only:', semanticError?.message);
      }
    }
    
    // Combine rule-based and semantic scores
    const combinedResults = ruleBasedResults.map(program => {
      const semanticMatch = semanticResults.find(s => s.id === program.id);
      const semanticWeight = 0.3; // 30% semantic, 70% rule-based
      const ruleWeight = 0.7;
      
      const combinedScore = semanticMatch
        ? (program.score * ruleWeight) + (semanticMatch.similarity * 100 * semanticWeight)
        : program.score;
      
      return {
        ...program,
        score: Math.round(combinedScore),
        semanticScore: semanticMatch?.similarity || 0,
        ruleBasedScore: program.score,
        // Add explanations from reasons and risks
        explanations: [
          ...(program.reasons || []).slice(0, 3),
          ...(program.risks || []).slice(0, 2).map((r: string) => `Note: ${r}`),
          ...(semanticMatch ? [`Semantic match: ${Math.round(semanticMatch.similarity * 100)}%`] : [])
        ]
      };
    }).sort((a, b) => b.score - a.score); // Sort by combined score
    
    const results = combinedResults.slice(0, limit);

    return res.status(200).json({
      success: true,
      programs: results,
      total: combinedResults.length,
      semanticScore: semanticScore,
      ruleBasedScore: results[0]?.ruleBasedScore,
      combinedScore: results[0]?.score,
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


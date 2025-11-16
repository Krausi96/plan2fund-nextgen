/**
 * Embeddings Service
 * Generates and stores embeddings for semantic search
 * Based on strategic analysis report recommendations
 */

import OpenAI from 'openai';

// Lazy initialization - only create client when actually needed (not during build)
let openai: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
}

const MODEL = 'text-embedding-3-small'; // Cost-effective, good quality
const EMBEDDING_DIMENSION = 1536;

/**
 * Generate embedding for text
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  if (!process.env.OPENAI_API_KEY) {
    console.warn('No OPENAI_API_KEY - semantic search disabled');
    return [];
  }

  try {
    const response = await getOpenAI().embeddings.create({
      model: MODEL,
      input: text.trim(),
      dimensions: EMBEDDING_DIMENSION
    });

    return response.data[0].embedding;
  } catch (error: any) {
    console.error('Error generating embedding:', error?.message || String(error));
    return [];
  }
}

/**
 * Generate embeddings for multiple texts (batch)
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  if (!process.env.OPENAI_API_KEY || texts.length === 0) {
    return [];
  }

  try {
    const response = await getOpenAI().embeddings.create({
      model: MODEL,
      input: texts.map(t => t.trim()),
      dimensions: EMBEDDING_DIMENSION
    });

    return response.data.map(item => item.embedding);
  } catch (error: any) {
    console.error('Error generating embeddings:', error?.message || String(error));
    return [];
  }
}

/**
 * Calculate cosine similarity between two embeddings
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) {
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;

  return dotProduct / denominator;
}

/**
 * Find most similar programs using cosine similarity
 */
export function findSimilarPrograms(
  queryEmbedding: number[],
  programEmbeddings: Array<{ id: string; embedding: number[] }>,
  topK: number = 10
): Array<{ id: string; similarity: number }> {
  if (queryEmbedding.length === 0) {
    return [];
  }

  const similarities = programEmbeddings
    .map(program => ({
      id: program.id,
      similarity: cosineSimilarity(queryEmbedding, program.embedding)
    }))
    .filter(item => item.similarity > 0) // Only positive similarities
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);

  return similarities;
}

/**
 * Create program description text for embedding
 */
export function createProgramDescription(program: any): string {
  const parts: string[] = [];
  
  if (program.title) parts.push(program.title);
  if (program.description) parts.push(program.description);
  
  // Add requirement categories
  if (program.categorized_requirements) {
    Object.entries(program.categorized_requirements).forEach(([category, items]: [string, any]) => {
      if (Array.isArray(items) && items.length > 0) {
        const values = items.map((item: any) => item.value || '').filter(Boolean).join(', ');
        if (values) {
          parts.push(`${category}: ${values}`);
        }
      }
    });
  }
  
  // Add metadata
  if (program.funding_types && program.funding_types.length > 0) {
    parts.push(`Funding types: ${program.funding_types.join(', ')}`);
  }
  if (program.program_focus && program.program_focus.length > 0) {
    parts.push(`Focus: ${program.program_focus.join(', ')}`);
  }
  if (program.region) {
    parts.push(`Region: ${program.region}`);
  }
  
  return parts.join('. ');
}


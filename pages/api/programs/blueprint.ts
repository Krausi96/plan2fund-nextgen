/**
 * Blueprint Generation API Endpoint
 * Converts FundingProgram to detailed blueprint data
 * Called AFTER program selection, not during recommendation
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { createHash } from 'crypto';
import { generateBlueprint } from '@/platform/generation/blueprintGenerator';
// @ts-ignore - Blueprint not exported from blueprintGenerator, but used internally
import type { Blueprint } from '@/platform/generation/blueprintGenerator';
import { checkBlueprintRateLimit, rateLimitHeaders, rateLimitExceededResponse } from '@/platform/api/utils/rateLimit';

// ============================================================================
// ZOD VALIDATION SCHEMA
// ============================================================================

/**
 * Zod schema for validating blueprint generation request
 * Ensures fundingProgram and userContext have correct structure
 */
const BlueprintRequestSchema = z.object({
  fundingProgram: z.object({
    id: z.string().min(1, 'Program ID is required'),
    name: z.string().min(1, 'Program name is required'),
    fundingTypes: z.array(z.string()).optional(),
    rawData: z.object({
      description: z.string().optional()
    }).passthrough().optional(), // Allow additional fields
    applicationRequirements: z.any().optional()
  }).passthrough(), // Allow additional FundingProgram fields
  
  userContext: z.object({
    location: z.string().optional(),
    company_stage: z.string().optional(),
    funding_amount: z.number().optional(),
  }).passthrough().optional() // Allow additional context fields
});

// ============================================================================
// IN-MEMORY CACHE
// ============================================================================

/**
 * In-memory cache for blueprint generation
 * Key: SHA-256 hash of program ID (simple strategy)
 * Value: { blueprint, timestamp, programId, programName }
 * TTL: 24 hours (blueprints are program-specific, rarely change)
 */
interface CachedBlueprint {
  blueprint: Blueprint;
  timestamp: number;
  programId: string;
  programName: string;
}

const blueprintCache = new Map<string, CachedBlueprint>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * Generate cache key from program ID
 * Simple strategy: blueprints are primarily program-dependent
 */
function getCacheKey(programId: string): string {
  return createHash('sha256').update(programId).digest('hex');
}

/**
 * Clean expired cache entries (called periodically)
 */
function cleanExpiredBlueprintCache(): void {
  const now = Date.now();
  let expiredCount = 0;
  
  for (const [key, value] of blueprintCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      blueprintCache.delete(key);
      expiredCount++;
    }
  }
  
  if (expiredCount > 0 && process.env.NODE_ENV !== 'production') {
    console.log(`[blueprint][cache] Cleaned ${expiredCount} expired entries`);
  }
}

// Clean cache every hour
setInterval(cleanExpiredBlueprintCache, 60 * 60 * 1000);

// ============================================================================
// API HANDLER
// ============================================================================

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ============================================================================
  // RATE LIMIT CHECK
  // ============================================================================
  
  const rateLimitResult = checkBlueprintRateLimit(req);
  
  // Set rate limit headers on all responses
  Object.entries(rateLimitHeaders(rateLimitResult)).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
  
  if (!rateLimitResult.allowed) {
    console.warn(`[blueprint] Rate limit exceeded for IP`);
    const response = rateLimitExceededResponse(rateLimitResult);
    return res.status(429).json(response);
  }

  // ============================================================================
  // STEP 1: Validate Input with Zod
  // ============================================================================
  
  try {
    const validated = BlueprintRequestSchema.parse(req.body);
    const { fundingProgram, userContext } = validated;
    
    // ============================================================================
    // STEP 2: Check Cache
    // ============================================================================
    
    const cacheKey = getCacheKey(fundingProgram.id);
    const cached = blueprintCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      const cacheAgeHours = Math.floor((Date.now() - cached.timestamp) / (1000 * 60 * 60));
      console.log(`[blueprint][cache] HIT - program: ${fundingProgram.name} (age: ${cacheAgeHours}h)`);
      
      return res.status(200).json({
        success: true,
        programId: fundingProgram.id,
        programName: fundingProgram.name,
        blueprint: cached.blueprint,
        generatedAt: new Date(cached.timestamp).toISOString(),
        cached: true,
        cacheAgeHours
      });
    }
    
    console.log(`[blueprint][cache] MISS - program: ${fundingProgram.name}`);
    
    // ============================================================================
    // STEP 3: Generate Blueprint with LLM
    // ============================================================================
    
    console.log(`[blueprint] Generating blueprint for: ${fundingProgram.name}`);

    // Convert FundingProgram to the format expected by blueprint generator
    const programInfo = {
      id: fundingProgram.id,
      name: fundingProgram.name,
      description: fundingProgram.rawData?.description || '',
      funding_types: fundingProgram.fundingTypes || [],
      application_requirements: fundingProgram.applicationRequirements
    };

    // Generate enhanced blueprint
    const blueprint = await generateBlueprint(programInfo, userContext || {});

    console.log(`[blueprint] Successfully generated blueprint for: ${fundingProgram.name}`);
    
    // ============================================================================
    // STEP 4: Store in Cache
    // ============================================================================
    
    blueprintCache.set(cacheKey, {
      blueprint,
      timestamp: Date.now(),
      programId: fundingProgram.id,
      programName: fundingProgram.name
    });
    
    console.log(`[blueprint][cache] SET - program: ${fundingProgram.name} (cache size: ${blueprintCache.size})`);

    return res.status(200).json({
      success: true,
      programId: fundingProgram.id,
      programName: fundingProgram.name,
      blueprint: blueprint,
      generatedAt: new Date().toISOString(),
      cached: false
    });
    
  } catch (error) {
    // ============================================================================
    // ERROR HANDLING
    // ============================================================================
    
    // Zod validation error
    if (error instanceof z.ZodError) {
      const fieldErrors = error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
        received: issue.code === 'invalid_type' ? (issue as any).received : undefined,
      }));
      
      console.error('[blueprint] Validation failed:', fieldErrors);
      
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        validation_errors: fieldErrors,
      });
    }
    
    // Blueprint generation error
    console.error('[blueprint] Blueprint generation failed:', error);
    
    return res.status(500).json({
      success: false,
      error: (error as Error)?.message || 'Failed to generate blueprint',
      programId: req.body?.fundingProgram?.id
    });
  }
}
/**
 * Blueprint Generation API - Lightweight Adapter
 * Only handles: rate limiting, response formatting
 * All LLM logic delegated to orchestrator
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { checkBlueprintRateLimit, rateLimitHeaders, rateLimitExceededResponse } from '@/platform/api/utils/rateLimit';
import { runAI } from '@/platform/ai/core/runAI';
import { findSession } from '@/shared/user/database/repository';
import { getSessionTokenFromCookie } from '@/shared/user/auth/withAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limiting
  const rateLimitResult = checkBlueprintRateLimit(req);
  Object.entries(rateLimitHeaders(rateLimitResult)).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
  if (!rateLimitResult.allowed) {
    return res.status(429).json(rateLimitExceededResponse(rateLimitResult));
  }

  const requestBody = req.body || {};
  
  // Extract data from request body
  const { documentStructure, fundingProgram, userContext, programId, existingBlueprintId } = requestBody;
  
  // FIX 1: Guard against duplicate blueprint generation
  if (existingBlueprintId) {
    // Return early with signal to use existing blueprint
    return res.status(200).json({
      success: true,
      blueprint: { id: existingBlueprintId, cached: true, alreadyExists: true },
      cached: true,
      debug: { message: 'Blueprint already exists, returning from client-side store' }
    });
  }

  // Call orchestrator (handles validation, caching, LLM, parsing)
  // Extract user ID from session if available
  const sessionToken = getSessionTokenFromCookie(req.headers.cookie);
  let userId = 'anonymous';
  
  if (sessionToken) {
    const session = await findSession(sessionToken);
    if (session) {
      userId = `user_${session.user_id}`;
    }
  }

  // Pass the documentStructure directly to the orchestrator
  // If documentStructure is not provided, construct it from fundingProgram
  
  // Create CLEAN program input - only essential fields
  const cleanProgramInput = fundingProgram ? {
    programName: fundingProgram.name,
    description: fundingProgram.rawData?.description || fundingProgram.description || '',
    deliverables: fundingProgram.deliverables || [],
    fundingType: fundingProgram.type || 'grant',
    organization: fundingProgram.organization || 'Unknown',
    region: fundingProgram.region || 'Global'
  } : { programName: 'Unknown Program', description: '', deliverables: [], fundingType: 'grant' };
  
  console.log('[Blueprint API] Clean program input:', JSON.stringify(cleanProgramInput).length, 'chars');
  
  const payload = {
    programInfo: cleanProgramInput,
    userContext
  };

  const result = await runAI({
    userId,
    task: 'generateBlueprint',
    payload,
  });

  if (!result.success) {
    return res.status(400).json({
      success: false,
      error: result.error || 'Failed to generate blueprint',
      ...(result.data && { validation_errors: result.data }),
    });
  }

  // FIX 3: Create unique blueprint ID
  const blueprintId = programId ? `bp_${programId}_${Date.now()}` : `bp_${Date.now()}`;
  
  return res.status(200).json({
    success: true,
    programId: fundingProgram?.id,
    programName: fundingProgram?.name,
    blueprint: result.data,
    blueprintId: blueprintId,
    cached: result.cached || false,
    debug: result.llmStats,
  });
}

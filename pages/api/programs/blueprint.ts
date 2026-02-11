/**
 * Blueprint Generation API - Lightweight Adapter
 * Only handles: rate limiting, response formatting
 * All LLM logic delegated to orchestrator
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { checkBlueprintRateLimit, rateLimitHeaders, rateLimitExceededResponse } from '@/platform/api/utils/rateLimit';
import { callAI } from '@/platform/ai/orchestrator';

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

  const { fundingProgram, userContext } = req.body || {};

  // Call orchestrator (handles validation, caching, LLM, parsing)
  const result = await callAI({
    type: 'generateBlueprint',
    payload: { fundingProgram, userContext },
  });

  if (!result.success) {
    return res.status(400).json({
      success: false,
      error: result.error || 'Failed to generate blueprint',
      ...(result.data && { validation_errors: result.data }),
    });
  }

  return res.status(200).json({
    success: true,
    programId: fundingProgram?.id,
    programName: fundingProgram?.name,
    blueprint: result.data,
    cached: result.cached || false,
  });
}

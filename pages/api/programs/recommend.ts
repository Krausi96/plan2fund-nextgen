/**
 * Program Recommendation API - Lightweight Adapter
 * Only handles: rate limiting, validation, caching, response formatting
 * All LLM logic delegated to orchestrator
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { checkRecommendRateLimit, rateLimitHeaders, rateLimitExceededResponse } from '@/platform/api/utils/rateLimit';
import { runAI } from '@/platform/ai/core/runAI';
import { findSession } from '@/shared/user/database/repository';
import { getSessionTokenFromCookie } from '@/shared/user/auth/withAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limiting
  const rateLimitResult = checkRecommendRateLimit(req);
  Object.entries(rateLimitHeaders(rateLimitResult)).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
  if (!rateLimitResult.allowed) {
    return res.status(429).json(rateLimitExceededResponse(rateLimitResult));
  }

  const { answers, max_results: maxResults = 10, language = 'en' } = req.body || {};

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

  const result = await runAI({
    userId,
    task: 'recommendPrograms',
    payload: { answers, max_results: maxResults, language },
  });

  if (!result.success) {
    return res.status(400).json({
      success: false,
      error: result.error || 'Failed to generate recommendations',
      ...(result.data && { validation_errors: result.data }),
    });
  }

  return res.status(200).json({
    success: true,
    programs: result.data,
    count: result.data?.length || 0,
    cached: result.cached || false,
    debug: result.llmStats,
    ...(result.cacheAge !== undefined && { cacheAge: result.cacheAge }),
  });
}

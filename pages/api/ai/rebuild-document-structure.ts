/**
 * Document Structure Reconstruction API
 * Reconstructs document structure from raw text using LLM
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { runAI } from '@/platform/ai/core/runAI';
import { findSession } from '@/shared/user/database/repository';
import { getSessionTokenFromCookie } from '@/shared/user/auth/withAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { rawText, fileName } = req.body || {};

  if (!rawText) {
    return res.status(400).json({ 
      success: false, 
      error: 'Missing rawText in request body' 
    });
  }

  // Extract user ID from session if available
  const sessionToken = getSessionTokenFromCookie(req.headers.cookie);
  let userId = 'anonymous';
  
  if (sessionToken) {
    const session = await findSession(sessionToken);
    if (session) {
      userId = `user_${session.user_id}`;
    }
  }

  try {
    const result = await runAI({
      userId,
      task: 'rebuildDocumentStructure',
      payload: { rawText, fileName },
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error || 'Failed to reconstruct document structure',
      });
    }

    return res.status(200).json({
      success: true,
      data: result.data,
      cached: result.cached || false,
      debug: result.llmStats,
      ...(result.cacheAge !== undefined && { cacheAge: result.cacheAge }),
    });
  } catch (error) {
    console.error('[rebuild-document-structure] API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error during document structure reconstruction',
    });
  }
}
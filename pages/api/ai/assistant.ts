// ========= PLAN2FUND — AI ASSISTANT ENDPOINT =========
// AI Assistant API for Editor
// Lightweight adapter: handles auth, rate limiting, response formatting
// All LLM logic delegated to orchestrator

import { NextApiRequest, NextApiResponse } from 'next';
import { runAI } from '@/platform/ai/core/runAI';
import { findSession } from '@/shared/user/database/repository';
import { getSessionTokenFromCookie } from '@/shared/user/auth/withAuth';

interface AIResponse {
  content: string;
  wordCount: number;
  suggestions: string[];
  citations: string[];
  programSpecific: boolean;
  sectionGuidance: string[];
  complianceTips: string[];
  readinessScore: number;
  suggestedKPIs?: Array<{
    name: string;
    value: number;
    unit?: string;
    description?: string;
  }>;
  recommendedActions?: Array<{
    type: 'create_table' | 'create_kpi' | 'add_image' | 'add_reference' | 'configure_formatting';
    reason: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  debug?: {
    provider: 'custom' | 'openai';
    model?: string;
    latencyMs: number;
    tokens?: {
      prompt: number;
      completion: number;
      total: number;
    };
  };
  cached?: boolean;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AIResponse | { error: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, context, conversationHistory, action } = req.body || {};

    if (!message || !context || !action) {
      return res.status(400).json({ error: 'Missing required parameters: message, context, and action' });
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

    // Call orchestrator (handles prompts, LLM, parsing)
    const result = await runAI({
      userId,
      task: 'writeSection',
      payload: {
        message,
        context,
        action,
        conversationHistory,
        temperature: 0.7,
        maxTokens: 1000,
      },
    });
    
    if (!result.success) {
      return res.status(400).json({
        error: result.error || 'Failed to generate AI response',
      });
    }
    
    // Return the parsed response from orchestrator
    return res.status(200).json({
      ...result.data,
      debug: result.llmStats,
      cached: result.cached || false,
    });

  } catch (error) {
    console.error('[Assistant API] Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error'
    });
  }
}

import { NextApiRequest, NextApiResponse } from 'next';
import { callAI } from '@/platform/ai/orchestrator';

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

  try {
    const result = await callAI({
      type: "rebuildDocumentStructure",
      payload: { rawText, fileName }
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error('[rebuild-structure] API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error during document structure reconstruction',
    });
  }
}
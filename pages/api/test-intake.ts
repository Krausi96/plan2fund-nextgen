// API endpoint to test intake parser
import { NextApiRequest, NextApiResponse } from 'next';
import { intakeParser } from '@/lib/intakeParser';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { input } = req.body;

  if (!input) {
    return res.status(400).json({ error: 'Input required' });
  }

  try {
    const startTime = Date.now();
    const result = await intakeParser.parseInput(input, 'api_test_session');
    const processingTime = Date.now() - startTime;

    res.status(200).json({
      success: true,
      result: {
        profile: result.profile,
        needsOverlay: result.needsOverlay,
        overlayQuestions: result.overlayQuestions,
        processingTime
      }
    });
  } catch (error) {
    console.error('Intake parser error:', error);
    res.status(500).json({ 
      error: 'Failed to parse input',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

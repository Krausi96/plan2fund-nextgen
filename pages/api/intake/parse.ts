// Intake Parser API Endpoint
import type { NextApiRequest, NextApiResponse } from 'next';
import { IntakeEngine, validateFundingProfile } from '@/lib/intakeEngine';
import analytics from '@/lib/analytics';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { input, sessionId, userId } = req.body;

    if (!input || typeof input !== 'string') {
      return res.status(400).json({ error: 'Input is required and must be a string' });
    }

    if (!sessionId || typeof sessionId !== 'string') {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    // Validate input length
    if (input.length > 10000) {
      return res.status(400).json({ error: 'Input too long (max 10,000 characters)' });
    }

    // Track intake parsing start
    await analytics.trackEvent({
      event: 'intake_parse_start',
      properties: {
        inputLength: input.length,
        sessionId,
        userId
      }
    });

    // Parse input
    const intakeEngine = new IntakeEngine();
    const result = await intakeEngine.parseInput(input, sessionId, userId);

    // Validate result
    const validatedProfile = validateFundingProfile(result.profile);
    if (!validatedProfile) {
      return res.status(500).json({ error: 'Failed to validate parsed profile' });
    }

    // Track successful parsing
    await analytics.trackEvent({
      event: 'intake_parse_success',
      properties: {
        sessionId,
        userId,
        needsOverlay: result.needsOverlay,
        overlayQuestions: result.overlayQuestions.length,
        processingTime: result.processingTime,
        confidence: {
          sector: result.profile.confidence.sector,
          stage: result.profile.confidence.stage,
          team_size: result.profile.confidence.team_size,
          location_city: result.profile.confidence.location_city,
          funding_need_eur: result.profile.confidence.funding_need_eur,
          program_type: result.profile.confidence.program_type
        }
      }
    });

    return res.status(200).json({
      success: true,
      profile: validatedProfile,
      needsOverlay: result.needsOverlay,
      overlayQuestions: result.overlayQuestions,
      processingTime: result.processingTime
    });

  } catch (error) {
    console.error('Error in intake parsing API:', error);
    
    // Track parsing error
    await analytics.trackError(error as Error, 'intake_parse_api');
    
    return res.status(500).json({ 
      error: 'Failed to parse input',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
}

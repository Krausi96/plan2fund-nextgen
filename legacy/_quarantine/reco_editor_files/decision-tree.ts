// Decision Tree Recommendation API
import type { NextApiRequest, NextApiResponse } from 'next';
import { decisionTreeEngine } from '@/lib/decisionTree';
import { validateUserProfile } from '@/lib/schemas/userProfile';
import analytics from '@/lib/analytics';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { answers, userProfile, currentNodeId = 'program_type' } = req.body;

    if (!answers || typeof answers !== 'object') {
      return res.status(400).json({ error: 'Answers are required' });
    }

    // Set user profile if provided
    if (userProfile) {
      const validatedProfile = validateUserProfile(userProfile);
      if (validatedProfile) {
        decisionTreeEngine.setUserProfile(validatedProfile);
      }
    }

    // Process decision tree
    const result = await decisionTreeEngine.processDecisionTree(answers, currentNodeId);

    // Track analytics
    await analytics.trackWizardComplete(answers, result.recommendations);

    // Create gap ticket if no matches
    if (result.recommendations.length === 0 && result.gaps.length > 0) {
      decisionTreeEngine.createGapTicket(answers, result.gaps);
      await analytics.trackGapTicketCreated('NO_MATCHES', { answers, gaps: result.gaps });
    }

    return res.status(200).json({
      success: true,
      result: {
        recommendations: result.recommendations,
        explanations: result.explanations,
        gaps: result.gaps,
        fallbackPrograms: result.fallbackPrograms,
        hasMatches: result.recommendations.length > 0
      }
    });
  } catch (error) {
    console.error('Error in decision tree recommendation:', error);
    
    // Track error
    await analytics.trackError(error as Error, 'decision_tree_recommendation');
    
    return res.status(500).json({ 
      error: 'Failed to process decision tree recommendation',
      fallback: {
        recommendations: [],
        explanations: ['An error occurred while processing your request. Please try again.'],
        gaps: ['System error'],
        fallbackPrograms: []
      }
    });
  }
}

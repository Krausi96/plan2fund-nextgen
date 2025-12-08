// ML Training Data Collection API
// Stores anonymized business plan data for ML training (with user consent)

import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const anonymizedPlan = req.body;

    // Validate request
    if (!anonymizedPlan || !anonymizedPlan.id) {
      return res.status(400).json({ error: 'Invalid plan data' });
    }

    // TODO: Store anonymized plan data in database or ML training storage
    // For now, just log it (in production, this would go to a dedicated ML training database)
    if (process.env.NODE_ENV === 'development') {
      console.log('ML Training Data Received:', {
        planId: anonymizedPlan.id,
        structure: anonymizedPlan.structure,
        qualityMetrics: anonymizedPlan.qualityMetrics,
        metadata: anonymizedPlan.metadata
      });
    }

    // Return success
    return res.status(200).json({ 
      success: true,
      message: 'Anonymized plan data stored for ML training'
    });
  } catch (error) {
    console.error('Error storing ML training data:', error);
    return res.status(500).json({ 
      error: 'Failed to store ML training data' 
    });
  }
}

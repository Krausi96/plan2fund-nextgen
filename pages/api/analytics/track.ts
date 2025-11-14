// Analytics Event Tracking API
import type { NextApiRequest, NextApiResponse } from 'next';
import analytics from '@/shared/user/analytics';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { event, properties, userId, sessionId } = req.body;

    if (!event) {
      return res.status(400).json({ error: 'Event is required' });
    }

    // Set user ID if provided
    if (userId) {
      analytics.setUserId(userId);
    }

    // Track the event
    await analytics.trackEvent({
      event,
      properties: properties || {},
      userId,
      sessionId
    });

    return res.status(200).json({
      success: true,
      message: 'Event tracked successfully'
    });
  } catch (error) {
    console.error('Error tracking event:', error);
    return res.status(500).json({ error: 'Failed to track event' });
  }
}

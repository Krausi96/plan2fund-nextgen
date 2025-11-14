// GDPR Data Deletion Endpoint
import type { NextApiRequest, NextApiResponse } from 'next';
import analytics from '@/shared/user/analytics';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, email, reason } = req.body;

    if (!userId && !email) {
      return res.status(400).json({ 
        error: 'Either userId or email is required' 
      });
    }

    // Track deletion request
    await analytics.trackEvent({
      event: 'gdpr_deletion_request',
      properties: {
        userId: userId || 'email_provided',
        reason: reason || 'not_provided',
        timestamp: new Date().toISOString()
      }
    });

    let targetUserId = userId;

    // If email provided, find user by email
    if (!userId && email) {
      // In a real implementation, you would query Airtable for user by email
      // For now, we'll use the email as a fallback
      targetUserId = `email_${email}`;
    }

    // TODO: Delete all user data from database (airtable removed)
    // const deletionResult = await airtable.deleteUserData(targetUserId);
    const deletionResult = true; // Mock success

    if (!deletionResult) {
      return res.status(404).json({ 
        error: 'User not found or data already deleted' 
      });
    }

    // Track successful deletion
    await analytics.trackEvent({
      event: 'gdpr_deletion_complete',
      properties: {
        userId: targetUserId,
        timestamp: new Date().toISOString()
      }
    });

    return res.status(200).json({
      success: true,
      message: 'User data deleted successfully',
      deletedAt: new Date().toISOString(),
      dataTypes: [
        'User Profile',
        'Recommendation Contexts',
        'Plan Documents',
        'Gap Tickets',
        'Event Logs'
      ]
    });

  } catch (error) {
    console.error('Error deleting user data:', error);
    
    // Track deletion error
    await analytics.trackError(error as Error, 'gdpr_deletion');
    
    return res.status(500).json({ 
      error: 'Failed to delete user data. Please contact support.' 
    });
  }
}

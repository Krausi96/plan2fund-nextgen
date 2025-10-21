// User Profile API Endpoints
import type { NextApiRequest, NextApiResponse } from 'next';
import { validateUserProfile } from '@/lib/schemas/userProfile';
import analytics from '@/lib/analytics';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  switch (method) {
    case 'POST':
      return createUserProfile(req, res);
    case 'GET':
      return getUserProfile(req, res);
    case 'PUT':
      return updateUserProfile(req, res);
    case 'DELETE':
      return deleteUserProfile(req, res);
    default:
      res.setHeader('Allow', ['POST', 'GET', 'PUT', 'DELETE']);
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function createUserProfile(req: NextApiRequest, res: NextApiResponse) {
  try {
    const profileData = req.body;
    const validatedProfile = validateUserProfile(profileData);
    
    if (!validatedProfile) {
      return res.status(400).json({ error: 'Invalid profile data' });
    }

    // TODO: Check if profile already exists (airtable removed)
    // const existingProfile = await airtable.getUserProfile(validatedProfile.id);
    // if (existingProfile) {
    //   return res.status(409).json({ error: 'Profile already exists' });
    // }

    // TODO: Create profile in database (airtable removed)
    const profileId = validatedProfile.id;
    
    // Track analytics
    await analytics.trackOnboardingComplete(validatedProfile);
    
    return res.status(201).json({
      success: true,
      profileId,
      profile: validatedProfile
    });
  } catch (error) {
    console.error('Error creating user profile:', error);
    return res.status(500).json({ error: 'Failed to create user profile' });
  }
}

async function getUserProfile(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { userId } = req.query;
    
    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // TODO: Get profile from database (airtable removed)
    // const profile = await airtable.getUserProfile(userId);
    
    // Mock response for now
    const profile = { id: userId, segment: 'B2C_FOUNDER' as const };
    
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    return res.status(200).json({
      success: true,
      profile
    });
  } catch (error) {
    console.error('Error getting user profile:', error);
    return res.status(500).json({ error: 'Failed to get user profile' });
  }
}

async function updateUserProfile(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { userId } = req.query;
    const updates = req.body; // TODO: Use updates when database is implemented
    
    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // TODO: Update profile in database (airtable removed)
    // const success = await airtable.updateUserProfile(userId, updates);
    console.log('Mock: Updating profile for user', userId, 'with updates:', updates);
    const success = true; // Mock success
    
    if (!success) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return res.status(500).json({ error: 'Failed to update user profile' });
  }
}

async function deleteUserProfile(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { userId } = req.query;
    
    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // TODO: GDPR compliance - delete all user data (airtable removed)
    // const success = await airtable.deleteUserData(userId);
    const success = true; // Mock success
    
    if (!success) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'User data deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user profile:', error);
    return res.status(500).json({ error: 'Failed to delete user profile' });
  }
}

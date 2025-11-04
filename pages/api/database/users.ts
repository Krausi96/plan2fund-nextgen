// Database API - Users
// This provides API endpoints for user operations
// Currently uses localStorage, but can be easily swapped to real database

import type { NextApiRequest, NextApiResponse } from 'next';
import database from '@/shared/lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  switch (method) {
    case 'GET':
      return getUser(req, res);
    case 'POST':
      return createUser(req, res);
    case 'PUT':
      return updateUser(req, res);
    case 'DELETE':
      return deleteUser(req, res);
    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function getUser(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { userId } = req.query;
    
    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const user = await database.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json({ success: true, user });
  } catch (error) {
    console.error('Error getting user:', error);
    return res.status(500).json({ error: 'Failed to get user' });
  }
}

async function createUser(req: NextApiRequest, res: NextApiResponse) {
  try {
    const userData = req.body;
    
    if (!userData.id) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const user = await database.createUser(userData);
    
    return res.status(201).json({ success: true, user });
  } catch (error) {
    console.error('Error creating user:', error);
    return res.status(500).json({ error: 'Failed to create user' });
  }
}

async function updateUser(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { userId } = req.query;
    const updates = req.body;
    
    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const success = await database.updateUser(userId, updates);
    
    if (!success) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json({ success: true, message: 'User updated successfully' });
  } catch (error) {
    console.error('Error updating user:', error);
    return res.status(500).json({ error: 'Failed to update user' });
  }
}

async function deleteUser(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { userId } = req.query;
    
    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const success = await database.deleteUser(userId);
    
    if (!success) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return res.status(500).json({ error: 'Failed to delete user' });
  }
}


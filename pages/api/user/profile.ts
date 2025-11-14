// User Profile API Endpoints
// NOTE: This endpoint is now a wrapper around the new auth system
// Use /api/auth/session for getting current user
import type { NextApiRequest, NextApiResponse } from 'next';
import { findUserById, updateLastActive } from '@/shared/user/database/repository';
import { getSessionTokenFromCookie } from '@/shared/user/auth/utils';
import { findSession } from '@/shared/user/database/repository';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  switch (method) {
    case 'GET':
      return getUserProfile(req, res);
    case 'PUT':
      return updateUserProfile(req, res);
    default:
      res.setHeader('Allow', ['GET', 'PUT']);
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function getUserProfile(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Get session from cookie
    const sessionToken = getSessionTokenFromCookie(req.headers.cookie);
    if (!sessionToken) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Find session
    const session = await findSession(sessionToken);
    if (!session) {
      return res.status(401).json({ error: 'Invalid session' });
    }

    // Get user
    const user = await findUserById(session.user_id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update last active
    await updateLastActive(session.user_id);

    // Convert to profile format
    const profile = {
      id: String(user.id),
      segment: user.segment || 'B2C_FOUNDER',
      programType: user.program_type || 'GRANT',
      industry: user.industry || 'GENERAL',
      language: user.language || 'EN',
      payerType: user.payer_type || 'INDIVIDUAL',
      experience: user.experience || 'NEWBIE',
      createdAt: user.created_at,
      lastActiveAt: user.last_active_at,
      gdprConsent: user.gdpr_consent || true
    };

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
    // Get session from cookie
    const sessionToken = getSessionTokenFromCookie(req.headers.cookie);
    if (!sessionToken) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Find session
    const session = await findSession(sessionToken);
    if (!session) {
      return res.status(401).json({ error: 'Invalid session' });
    }

    const updates = req.body;
    const pool = (await import('../../../scraper-lite/db/db')).getPool();
    
    // Build update query dynamically
    const allowedFields = ['segment', 'program_type', 'industry', 'language', 'payer_type', 'experience', 'name'];
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramIndex = 1;

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        updateFields.push(`${field} = $${paramIndex}`);
        updateValues.push(updates[field]);
        paramIndex++;
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    updateValues.push(session.user_id);
    const query = `UPDATE users SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramIndex} RETURNING *`;
    
    const result = await pool.query(query, updateValues);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return res.status(500).json({ error: 'Failed to update user profile' });
  }
}

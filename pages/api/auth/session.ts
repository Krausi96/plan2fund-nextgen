import type { NextApiRequest, NextApiResponse } from 'next';
import { findSession, findUserById } from '@/shared/user/database/repository';
import { getSessionTokenFromCookie } from '@/shared/user/auth/utils';

/**
 * Get current user session
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const sessionToken = getSessionTokenFromCookie(req.headers.cookie);
    
    if (!sessionToken) {
      return res.status(401).json({ error: 'No session found' });
    }

    const session = await findSession(sessionToken);
    
    if (!session) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    const user = await findUserById(session.user_id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Return user data (without password hash)
    const { password_hash, ...userWithoutPassword } = user;

    return res.status(200).json({
      success: true,
      user: userWithoutPassword
    });
  } catch (error: any) {
    console.error('Session check error:', error);
    return res.status(500).json({ error: 'Failed to verify session', details: error.message });
  }
}


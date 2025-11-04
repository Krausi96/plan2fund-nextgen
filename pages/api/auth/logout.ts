import type { NextApiRequest, NextApiResponse } from 'next';
import { deleteSession } from '@/shared/db/user-repository';
import { getSessionTokenFromCookie } from '@/shared/lib/auth-utils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const sessionToken = getSessionTokenFromCookie(req.headers.cookie);
    
    if (sessionToken) {
      await deleteSession(sessionToken);
    }

    // Clear cookie
    res.setHeader('Set-Cookie', 'pf_session=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0');

    return res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error: any) {
    console.error('Logout error:', error);
    return res.status(500).json({ error: 'Failed to logout', details: error.message });
  }
}


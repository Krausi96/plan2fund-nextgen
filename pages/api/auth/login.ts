import type { NextApiRequest, NextApiResponse } from 'next';
import { findUserByEmail, verifyPassword, updateLastActive, createSession } from '@/shared/user/database/repository';
import { generateSessionToken } from '@/shared/user/auth/withAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password, rememberMe } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Find user
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Verify password (if user has one)
    if (user.password_hash) {
      if (!password) {
        return res.status(401).json({ error: 'Password is required' });
      }
      const isValid = await verifyPassword(user, password);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
    } else {
      // User has no password (social login only) - allow login without password
      // This is for backward compatibility with existing users
    }

    // Update last active
    await updateLastActive(user.id);

    // Create session with expiration based on rememberMe
    const sessionToken = generateSessionToken();
    const expiresAt = new Date();
    const sessionDays = rememberMe ? 30 : 7; // 30 days if remember me, 7 days otherwise
    expiresAt.setDate(expiresAt.getDate() + sessionDays);

    await createSession(
      user.id,
      sessionToken,
      expiresAt,
      req.headers['x-forwarded-for'] as string || req.socket.remoteAddress,
      req.headers['user-agent']
    );

    // Return user data (without password hash)
    const { password_hash, ...userWithoutPassword } = user;

    // Set cookie with appropriate expiration
    const maxAge = sessionDays * 24 * 60 * 60; // Convert days to seconds
    res.setHeader('Set-Cookie', `pf_session=${sessionToken}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${maxAge}`);

    return res.status(200).json({
      success: true,
      user: userWithoutPassword,
      sessionToken
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Failed to login', details: error.message });
  }
}


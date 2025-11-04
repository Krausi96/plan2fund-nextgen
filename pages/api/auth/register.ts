import type { NextApiRequest, NextApiResponse } from 'next';
import { createUser, findUserByEmail } from '@/shared/db/user-repository';
import { createSession } from '@/shared/db/user-repository';
import { generateSessionToken } from '@/shared/lib/auth-utils';

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
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Check if user already exists
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    // Create user
    const user = await createUser({
      email,
      password,
      name
    });

    // Create session
    const sessionToken = generateSessionToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

    await createSession(
      user.id,
      sessionToken,
      expiresAt,
      req.headers['x-forwarded-for'] as string || req.socket.remoteAddress,
      req.headers['user-agent']
    );

    // Return user data (without password hash)
    const { password_hash, ...userWithoutPassword } = user;

    res.setHeader('Set-Cookie', `pf_session=${sessionToken}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${30 * 24 * 60 * 60}`);

    return res.status(201).json({
      success: true,
      user: userWithoutPassword,
      sessionToken
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Failed to create account', details: error.message });
  }
}


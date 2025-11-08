/**
 * Get User Usage API
 * Returns current usage counts for a user
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId } = req.query;

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'Missing userId' });
    }

    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Get usage for current month
    const result = await pool.query(
      `SELECT * FROM user_usage WHERE user_id = $1 AND month = $2`,
      [userId, currentMonth]
    );

    if (result.rows.length === 0) {
      // Return zero usage
      return res.status(200).json({
        plans: 0,
        pdf_exports: 0,
        ai_requests: 0,
        lastResetDate: now.toISOString()
      });
    }

    const usage = result.rows[0];
    res.status(200).json({
      plans: usage.plans || 0,
      pdf_exports: usage.pdf_exports || 0,
      ai_requests: usage.ai_requests || 0,
      lastResetDate: usage.last_updated || now.toISOString()
    });
  } catch (error: any) {
    console.error('Get usage error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}


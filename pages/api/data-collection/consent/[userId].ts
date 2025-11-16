/**
 * Get User Consent API
 * Returns user consent status
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

    const result = await pool.query(
      `SELECT consent FROM user_consent 
       WHERE user_id = $1 AND consent_type = 'data_collection'
       ORDER BY updated_at DESC LIMIT 1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(200).json({ consent: false });
    }

    res.status(200).json({ consent: result.rows[0].consent });
  } catch (error: any) {
    console.error('Error fetching consent:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}






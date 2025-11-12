/**
 * User Consent API
 * Manages user consent for data collection and ML training
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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, consent, consentType, timestamp } = req.body;

    if (!userId || typeof consent !== 'boolean') {
      return res.status(400).json({ error: 'Missing userId or consent value' });
    }

    // Create table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_consent (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        consent_type VARCHAR(50) NOT NULL,
        consent BOOLEAN NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, consent_type)
      )
    `);

    // Insert or update consent
    await pool.query(
      `INSERT INTO user_consent (user_id, consent_type, consent, updated_at)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, consent_type) 
       DO UPDATE SET consent = EXCLUDED.consent, updated_at = EXCLUDED.updated_at`,
      [userId, consentType || 'data_collection', consent, timestamp || new Date()]
    );

    res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Error setting consent:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}




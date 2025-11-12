/**
 * User Feedback Submission API
 * Collects user feedback on AI suggestions, templates, etc.
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
    const { userId, type, itemId, action, rating, comment, timestamp } = req.body;

    if (!userId || !type || !itemId || !action) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_feedback (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        feedback_type VARCHAR(50) NOT NULL,
        item_id VARCHAR(255) NOT NULL,
        action VARCHAR(50) NOT NULL,
        rating INTEGER,
        comment TEXT,
        submitted_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Insert feedback
    await pool.query(
      `INSERT INTO user_feedback 
       (user_id, feedback_type, item_id, action, rating, comment, submitted_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        userId,
        type,
        itemId,
        action,
        rating || null,
        comment || null,
        timestamp || new Date()
      ]
    );

    res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}




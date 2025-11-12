/**
 * Usage Tracking API
 * Tracks user usage for freemium limits
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
    const { userId, action } = req.body;

    if (!userId || !action) {
      return res.status(400).json({ error: 'Missing userId or action' });
    }

    // Get or create usage record
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Check if usage table exists, create if not
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_usage (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        month VARCHAR(7) NOT NULL,
        plans INTEGER DEFAULT 0,
        pdf_exports INTEGER DEFAULT 0,
        ai_requests INTEGER DEFAULT 0,
        last_updated TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, month)
      )
    `);

    // Get or create usage for current month
    const result = await pool.query(
      `SELECT * FROM user_usage WHERE user_id = $1 AND month = $2`,
      [userId, currentMonth]
    );

    if (result.rows.length === 0) {
      // Create new record
      const field = action === 'create_plan' ? 'plans' :
                    action === 'export_pdf' ? 'pdf_exports' :
                    'ai_requests';
      
      await pool.query(
        `INSERT INTO user_usage (user_id, month, ${field}) VALUES ($1, $2, 1)`,
        [userId, currentMonth]
      );
    } else {
      // Update existing record
      const field = action === 'create_plan' ? 'plans' :
                    action === 'export_pdf' ? 'pdf_exports' :
                    'ai_requests';
      
      await pool.query(
        `UPDATE user_usage SET ${field} = ${field} + 1, last_updated = NOW() WHERE user_id = $1 AND month = $2`,
        [userId, currentMonth]
      );
    }

    res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Usage tracking error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}




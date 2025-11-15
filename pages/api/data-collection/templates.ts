/**
 * Template Usage Tracking API
 * Tracks which templates are used and how often they're edited
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
    const { templateId, templateType, wasEdited, timestamp } = req.body;

    // Create table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS template_usage (
        id SERIAL PRIMARY KEY,
        template_id VARCHAR(255) NOT NULL,
        template_type VARCHAR(50) NOT NULL,
        was_edited BOOLEAN DEFAULT FALSE,
        used_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(template_id, template_type, DATE_TRUNC('day', used_at))
      )
    `);

    // Insert or update usage
    await pool.query(
      `INSERT INTO template_usage (template_id, template_type, was_edited, used_at)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT DO NOTHING`,
      [templateId, templateType, wasEdited, timestamp || new Date()]
    );

    res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Error tracking template usage:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}





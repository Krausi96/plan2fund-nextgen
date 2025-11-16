/**
 * Store Anonymized Plans API
 * Stores anonymized business plan data for ML training
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
    const plan = req.body;

    // Create table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS anonymized_plans (
        id VARCHAR(255) PRIMARY KEY,
        structure JSONB NOT NULL,
        quality_metrics JSONB NOT NULL,
        program_matched JSONB,
        outcome JSONB,
        metadata JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Insert anonymized plan
    await pool.query(
      `INSERT INTO anonymized_plans (id, structure, quality_metrics, program_matched, outcome, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO UPDATE SET
         structure = EXCLUDED.structure,
         quality_metrics = EXCLUDED.quality_metrics,
         program_matched = EXCLUDED.program_matched,
         outcome = EXCLUDED.outcome,
         metadata = EXCLUDED.metadata`,
      [
        plan.id,
        JSON.stringify(plan.structure),
        JSON.stringify(plan.qualityMetrics),
        plan.programMatched ? JSON.stringify(plan.programMatched) : null,
        plan.outcome ? JSON.stringify(plan.outcome) : null,
        JSON.stringify(plan.metadata)
      ]
    );

    res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Error storing anonymized plan:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}






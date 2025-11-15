/**
 * Scraper Quality Metrics API
 * Tracks extraction accuracy and method effectiveness
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
    const metric = req.body;

    // Create table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS scraper_quality_metrics (
        id SERIAL PRIMARY KEY,
        institution VARCHAR(255) NOT NULL,
        page_type VARCHAR(100),
        extraction_method VARCHAR(50) NOT NULL,
        accuracy DECIMAL(3,2) NOT NULL,
        confidence DECIMAL(3,2) NOT NULL,
        extraction_pattern TEXT,
        recorded_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Insert metric
    await pool.query(
      `INSERT INTO scraper_quality_metrics 
       (institution, page_type, extraction_method, accuracy, confidence, extraction_pattern)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        metric.institution,
        metric.pageType,
        metric.extractionMethod,
        metric.accuracy,
        metric.confidence,
        metric.extractionPattern || null
      ]
    );

    res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Error tracking scraper quality:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}





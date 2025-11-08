/**
 * Data Collection Export API
 * Returns anonymized datasets for fine-tuning or analytics.
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

type DatasetKey = 'plans' | 'templates' | 'scraper' | 'feedback' | 'consent';

const DATASET_SELECTORS: Record<DatasetKey, string> = {
  plans: `SELECT id, structure, quality_metrics, program_matched, outcome, metadata, created_at
          FROM anonymized_plans
          ORDER BY created_at DESC`,
  templates: `SELECT template_id, template_type, was_edited, used_at
              FROM template_usage
              ORDER BY used_at DESC`,
  scraper: `SELECT institution, page_type, extraction_method, accuracy, confidence, extraction_pattern, recorded_at
            FROM scraper_quality_metrics
            ORDER BY recorded_at DESC`,
  feedback: `SELECT user_id, feedback_type, item_id, action, rating, comment, submitted_at
             FROM user_feedback
             ORDER BY submitted_at DESC`,
  consent: `SELECT user_id, consent_type, consent, updated_at
            FROM user_consent
            ORDER BY updated_at DESC`,
};

async function fetchDataset(key: DatasetKey) {
  if (!DATASET_SELECTORS[key]) return [];
  const result = await pool.query(DATASET_SELECTORS[key]);
  return result.rows || [];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const datasetParam = req.query.dataset;

    if (datasetParam && typeof datasetParam === 'string') {
      const datasetKey = datasetParam as DatasetKey;
      if (!DATASET_SELECTORS[datasetKey]) {
        return res.status(400).json({ error: `Unknown dataset "${datasetParam}"` });
      }
      const data = await fetchDataset(datasetKey);
      return res.status(200).json({ dataset: datasetKey, count: data.length, data });
    }

    const [plans, templates, scraper, feedback, consent] = await Promise.all([
      fetchDataset('plans'),
      fetchDataset('templates'),
      fetchDataset('scraper'),
      fetchDataset('feedback'),
      fetchDataset('consent'),
    ]);

    return res.status(200).json({
      generatedAt: new Date().toISOString(),
      totals: {
        plans: plans.length,
        templates: templates.length,
        scraper: scraper.length,
        feedback: feedback.length,
        consent: consent.length,
      },
      plans,
      templates,
      scraper,
      feedback,
      consent,
    });
  } catch (error: any) {
    console.error('Data collection export failed:', error);
    return res.status(500).json({ error: error?.message || 'Internal server error' });
  }
}


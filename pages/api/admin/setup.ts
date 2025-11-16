import type { NextApiRequest, NextApiResponse } from 'next';
import { getPool } from '../../../shared/lib/database';
import fs from 'fs';
import path from 'path';

/**
 * Setup database tables - Run this once after creating database
 * GET /api/admin/setup - Run the schema
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Security: Only allow in development or with admin key
  const adminKey = req.query.key as string;
  if (process.env.NODE_ENV === 'production' && adminKey !== process.env.ADMIN_SETUP_KEY) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    const pool = getPool();
    const schemaPath = path.join(process.cwd(), 'shared/db/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Execute schema
    await pool.query(schema);

    return res.status(200).json({
      success: true,
      message: 'Database tables created successfully',
      tables: ['users', 'oauth_providers', 'user_sessions', 'user_plans', 'user_recommendations']
    });
  } catch (error: any) {
    console.error('Database setup error:', error);
    return res.status(500).json({
      error: 'Failed to setup database',
      details: error.message
    });
  }
}


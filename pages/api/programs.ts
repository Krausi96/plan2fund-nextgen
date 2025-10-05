// Programs API endpoint
import { NextApiRequest, NextApiResponse } from 'next';
import { Pool } from 'pg';

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { type } = req.query;
    
    let query = `
      SELECT id, name, description, program_type, funding_amount_min, funding_amount_max, 
             source_url, deadline, is_active, scraped_at
      FROM programs 
      WHERE is_active = true
    `;
    
    const params = [];
    if (type) {
      query += ` AND program_type = $1`;
      params.push(type);
    }
    
    query += ` ORDER BY scraped_at DESC`;
    
    const result = await pool.query(query, params);
    
    const programs = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      type: row.program_type,
      requirements: {},
      notes: row.description,
      maxAmount: row.funding_amount_max,
      link: row.source_url
    }));
    
    return res.status(200).json({
      success: true,
      programs,
      count: programs.length,
      message: `Found ${programs.length} programs`
    });
  } catch (error) {
    console.error('Programs API Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

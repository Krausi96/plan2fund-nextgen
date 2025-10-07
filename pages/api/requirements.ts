// API endpoint for all program requirements
import { NextApiRequest, NextApiResponse } from 'next';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const { type, programType, category } = req.query;
      
      // Get requirements based on filters
      const requirements = await getRequirements({
        type: type as string,
        programType: programType as string,
        category: category as string
      });
      
      return res.status(200).json(requirements);
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in requirements API:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function getRequirements(filters: {
  type?: string;
  programType?: string;
  category?: string;
}) {
  const client = await pool.connect();
  
  try {
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    let paramCount = 0;

    // Add program type filter
    if (filters.programType) {
      paramCount++;
      whereClause += ` AND p.program_type = $${paramCount}`;
      params.push(filters.programType);
    }

    // Add category filter
    if (filters.category) {
      paramCount++;
      whereClause += ` AND pc.category = $${paramCount}`;
      params.push(filters.category);
    }

    let query = '';
    let result: any = {};

    if (!filters.type || filters.type === 'decision_tree') {
      // Get decision tree questions
      query = `
        SELECT dtq.*, p.name as program_name, p.program_type, p.program_category
        FROM decision_tree_questions dtq
        JOIN programs p ON dtq.program_id = p.id
        LEFT JOIN program_categories pc ON p.id = pc.program_id
        ${whereClause}
        ORDER BY dtq.program_id, dtq.id
      `;
      const decisionTreeResult = await client.query(query, params);
      result.decision_tree = decisionTreeResult.rows;
    }

    if (!filters.type || filters.type === 'editor') {
      // Get editor sections
      query = `
        SELECT es.*, p.name as program_name, p.program_type, p.program_category
        FROM editor_sections es
        JOIN programs p ON es.program_id = p.id
        LEFT JOIN program_categories pc ON p.id = pc.program_id
        ${whereClause}
        ORDER BY es.program_id, es.id
      `;
      const editorResult = await client.query(query, params);
      result.editor = editorResult.rows;
    }

    if (!filters.type || filters.type === 'library') {
      // Get library details
      query = `
        SELECT ld.*, p.name as program_name, p.program_type, p.program_category
        FROM library_details ld
        JOIN programs p ON ld.program_id = p.id
        LEFT JOIN program_categories pc ON p.id = pc.program_id
        ${whereClause}
        ORDER BY ld.program_id, ld.id
      `;
      const libraryResult = await client.query(query, params);
      result.library = libraryResult.rows;
    }

    return result;
  } finally {
    client.release();
  }
}

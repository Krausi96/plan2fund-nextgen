// Programs AI API endpoint for Library and enhanced features
import { NextApiRequest, NextApiResponse } from 'next';
import { Pool } from 'pg';

// Database connection
let pool: Pool | null = null;

const getPool = () => {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: false
    });
  }
  return pool;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { action, programId } = req.query;

    const dbPool = getPool();

    if (action === 'programs') {
      // Get program-specific recommendations for Library
      try {
        let query = `
          SELECT id, name, description, program_type, funding_amount_min, funding_amount_max,
                 source_url, target_personas, tags,
                 decision_tree_questions, editor_sections, readiness_criteria, ai_guidance
          FROM programs 
          WHERE is_active = true
        `;
        
        const params = [];
        if (programId) {
          query += ` AND id = $1`;
          params.push(programId);
        }
        
        query += ` ORDER BY scraped_at DESC LIMIT 10`;
        
        console.log('Executing query:', query);
        console.log('With params:', params);
        
        const result = await dbPool.query(query, params);
        console.log('Query result rows:', result.rows.length);
        
        const programs = result.rows.map(row => ({
          id: row.id,
          name: row.name,
          description: row.description,
          type: row.program_type,
          funding: {
            min: row.funding_amount_min,
            max: row.funding_amount_max
          },
          source_url: row.source_url,
          target_personas: row.target_personas || [],
          tags: row.tags || [],
          decision_tree_questions: row.decision_tree_questions || [],
          editor_sections: row.editor_sections || [],
          readiness_criteria: row.readiness_criteria || [],
          ai_guidance: row.ai_guidance || null
        }));

        return res.status(200).json({
          success: true,
          data: programs,
          count: programs.length,
          message: `Found ${programs.length} programs for Library`
        });
      } catch (dbError) {
        console.error('Database error in programs-ai:', dbError);
        return res.status(500).json({
          success: false,
          error: 'Database query failed',
          details: dbError instanceof Error ? dbError.message : 'Unknown error'
        });
      }
    }

    if (action === 'guidance') {
      // Get AI guidance for specific program
      if (!programId) {
        return res.status(400).json({ 
          success: false, 
          error: 'programId is required for guidance action' 
        });
      }

      const result = await dbPool.query(
        `SELECT ai_guidance, decision_tree_questions, editor_sections, readiness_criteria
         FROM programs WHERE id = $1 AND is_active = true`,
        [programId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ 
          success: false, 
          error: 'Program not found' 
        });
      }

      const program = result.rows[0];
      
      return res.status(200).json({
        success: true,
        data: {
          ai_guidance: program.ai_guidance,
          decision_tree_questions: program.decision_tree_questions || [],
          editor_sections: program.editor_sections || [],
          readiness_criteria: program.readiness_criteria || []
        },
        message: 'AI guidance retrieved successfully'
      });
    }

    return res.status(400).json({ 
      success: false, 
      error: 'Invalid action. Use "programs" or "guidance"' 
    });

  } catch (error) {
    console.error('Programs AI API error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
}
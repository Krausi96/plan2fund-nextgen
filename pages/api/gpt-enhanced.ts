// GPT-Enhanced API endpoint for testing new features
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
    const { action, programId } = req.query;

    switch (action) {
      case 'programs':
        // Get all GPT-enhanced programs
        const result = await pool.query(`
          SELECT id, name, description, program_type, funding_amount_min, funding_amount_max, 
                 source_url, deadline, is_active, scraped_at,
                 target_personas, tags, decision_tree_questions, 
                 editor_sections, readiness_criteria, ai_guidance
          FROM programs 
          WHERE is_active = true
          ORDER BY scraped_at DESC
        `);
        
        const programs = result.rows.map(row => ({
          id: row.id,
          name: row.name,
          type: row.program_type,
          requirements: {},
          notes: row.description,
          maxAmount: row.funding_amount_max,
          link: row.source_url,
          target_personas: row.target_personas ? JSON.parse(row.target_personas) : [],
          tags: row.tags ? JSON.parse(row.tags) : [],
          decision_tree_questions: row.decision_tree_questions ? JSON.parse(row.decision_tree_questions) : [],
          editor_sections: row.editor_sections ? JSON.parse(row.editor_sections) : [],
          readiness_criteria: row.readiness_criteria ? JSON.parse(row.readiness_criteria) : [],
          ai_guidance: row.ai_guidance ? JSON.parse(row.ai_guidance) : null
        }));
        
        return res.status(200).json({
          success: true,
          data: programs,
          count: programs.length,
          message: `Found ${programs.length} GPT-enhanced programs`
        });

      case 'questions':
        if (!programId) {
          return res.status(400).json({ error: 'programId is required for questions action' });
        }
        const questionsResult = await pool.query(`
          SELECT decision_tree_questions 
          FROM programs 
          WHERE id = $1 AND is_active = true
        `, [programId]);
        
        const questions = questionsResult.rows.length > 0 && questionsResult.rows[0].decision_tree_questions 
          ? JSON.parse(questionsResult.rows[0].decision_tree_questions) 
          : [];
        
        return res.status(200).json({
          success: true,
          data: questions,
          count: questions.length,
          message: `Found ${questions.length} decision tree questions for program ${programId}`
        });

      case 'sections':
        if (!programId) {
          return res.status(400).json({ error: 'programId is required for sections action' });
        }
        const sectionsResult = await pool.query(`
          SELECT editor_sections 
          FROM programs 
          WHERE id = $1 AND is_active = true
        `, [programId]);
        
        const sections = sectionsResult.rows.length > 0 && sectionsResult.rows[0].editor_sections 
          ? JSON.parse(sectionsResult.rows[0].editor_sections) 
          : [];
        
        return res.status(200).json({
          success: true,
          data: sections,
          count: sections.length,
          message: `Found ${sections.length} editor sections for program ${programId}`
        });

      case 'criteria':
        if (!programId) {
          return res.status(400).json({ error: 'programId is required for criteria action' });
        }
        const criteriaResult = await pool.query(`
          SELECT readiness_criteria 
          FROM programs 
          WHERE id = $1 AND is_active = true
        `, [programId]);
        
        const criteria = criteriaResult.rows.length > 0 && criteriaResult.rows[0].readiness_criteria 
          ? JSON.parse(criteriaResult.rows[0].readiness_criteria) 
          : [];
        
        return res.status(200).json({
          success: true,
          data: criteria,
          count: criteria.length,
          message: `Found ${criteria.length} readiness criteria for program ${programId}`
        });

      case 'guidance':
        if (!programId) {
          return res.status(400).json({ error: 'programId is required for guidance action' });
        }
        const guidanceResult = await pool.query(`
          SELECT ai_guidance 
          FROM programs 
          WHERE id = $1 AND is_active = true
        `, [programId]);
        
        const guidance = guidanceResult.rows.length > 0 && guidanceResult.rows[0].ai_guidance 
          ? JSON.parse(guidanceResult.rows[0].ai_guidance) 
          : null;
        
        return res.status(200).json({
          success: true,
          data: guidance,
          message: guidance ? `Found AI guidance for program ${programId}` : `No AI guidance found for program ${programId}`
        });

      default:
        return res.status(400).json({ 
          error: 'Invalid action. Use: programs, questions, sections, criteria, or guidance',
          availableActions: ['programs', 'questions', 'sections', 'criteria', 'guidance']
        });
    }
  } catch (error) {
    console.error('GPT-Enhanced API Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
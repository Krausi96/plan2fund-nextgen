// Dynamic Decision Tree API - Phase 3 Step 1
import { NextApiRequest, NextApiResponse } from 'next';
import { Pool } from 'pg';
import { createDecisionTreeEngine } from '../../src/lib/dynamicDecisionTree';

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { programId, action } = req.method === 'GET' ? req.query : req.body;

    // Check database connection
    if (!process.env.DATABASE_URL) {
      return res.status(500).json({
        success: false,
        error: 'Database connection not configured',
        message: 'DATABASE_URL environment variable is missing'
      });
    }

    switch (action) {
      case 'generate':
        if (!programId) {
          return res.status(400).json({
            success: false,
            error: 'Program ID is required',
            message: 'Please provide a programId parameter'
          });
        }

        // Get program data from database
        const programResult = await pool.query(`
          SELECT id, name, description, program_type, funding_amount_min, funding_amount_max, 
                 deadline, eligibility_criteria, requirements, target_personas, tags, 
                 decision_tree_questions, editor_sections, readiness_criteria, ai_guidance
          FROM programs 
          WHERE id = $1 AND is_active = true
        `, [programId]);

        if (programResult.rows.length === 0) {
          return res.status(404).json({
            success: false,
            error: 'Program not found',
            message: `Program with ID ${programId} not found or inactive`
          });
        }

        const program = programResult.rows[0];
        
        // Create decision tree engine
        const engine = createDecisionTreeEngine([program]);
        const decisionTree = engine.generateDecisionTree(programId as string);

        return res.status(200).json({
          success: true,
          data: decisionTree,
          program: {
            id: program.id,
            name: program.name,
            description: program.description
          },
          message: `Generated decision tree with ${decisionTree.total_questions} questions`
        });

      case 'validate':
        if (req.method !== 'POST') {
          return res.status(405).json({ error: 'POST method required for validation' });
        }

        const { answers } = req.body;
        if (!answers || !programId) {
          return res.status(400).json({
            success: false,
            error: 'Answers and programId are required',
            message: 'Please provide answers object and programId'
          });
        }

        // Get program data for validation
        const validationResult = await pool.query(`
          SELECT id, name, eligibility_criteria, funding_amount_min, funding_amount_max, 
                 target_personas, tags, decision_tree_questions
          FROM programs 
          WHERE id = $1 AND is_active = true
        `, [programId]);

        if (validationResult.rows.length === 0) {
          return res.status(404).json({
            success: false,
            error: 'Program not found',
            message: `Program with ID ${programId} not found`
          });
        }

        const programForValidation = validationResult.rows[0];
        const engineForValidation = createDecisionTreeEngine([programForValidation]);
        const validation = engineForValidation.validateAnswers(answers);

        return res.status(200).json({
          success: true,
          data: validation,
          message: validation.valid ? 'Answers are valid' : 'Answers have validation errors'
        });

      case 'list':
        // Get all programs with decision tree capabilities
        const programsResult = await pool.query(`
          SELECT id, name, description, program_type, target_personas, tags,
                 decision_tree_questions
          FROM programs 
          WHERE is_active = true 
          AND (decision_tree_questions IS NOT NULL OR target_personas IS NOT NULL)
          ORDER BY name
        `);

        const programs = programsResult.rows.map(row => ({
          id: row.id,
          name: row.name,
          description: row.description,
          program_type: row.program_type,
          target_personas: row.target_personas || [],
          tags: row.tags || [],
          has_decision_tree: !!row.decision_tree_questions,
          question_count: row.decision_tree_questions ? row.decision_tree_questions.length : 0
        }));

        return res.status(200).json({
          success: true,
          data: programs,
          count: programs.length,
          message: `Found ${programs.length} programs with decision tree capabilities`
        });

      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid action',
          message: 'Valid actions are: generate, validate, list'
        });
    }

  } catch (error) {
    console.error('Decision tree API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to process decision tree request',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    });
  }
}

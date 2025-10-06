// Web Scraper API Endpoint - Phase 2 Step 2 (Database Integration)
import { NextApiRequest, NextApiResponse } from 'next';
import { Pool } from 'pg';

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST to run scraper.' });
  }

  // Check database connection
  if (!process.env.DATABASE_URL) {
    return res.status(500).json({
      success: false,
      error: 'Database connection not configured',
      message: 'DATABASE_URL environment variable is missing'
    });
  }

  try {
    const { source, action } = req.body;
    
    if (action === 'test') {
      // Test mode - return sample data
      const samplePrograms = [
        {
          id: 'aws_preseed_test',
          name: 'AWS Preseed - Test Program',
          description: 'Test program for AWS Preseed funding',
          program_type: 'grant',
          funding_amount_min: 50000,
          funding_amount_max: 200000,
          currency: 'EUR',
          deadline: new Date('2024-12-31'),
          eligibility_criteria: { min_team_size: 2, max_age: 5 },
          requirements: { business_plan: true, pitch_deck: true },
          contact_info: { email: 'test@aws.at', phone: '+43 1 234 567' },
          source_url: 'https://aws.at/preseed',
          scraped_at: new Date(),
          confidence_score: 0.9,
          is_active: true,
          target_personas: ['startup', 'sme'],
          tags: ['innovation', 'startup', 'non-dilutive'],
          decision_tree_questions: [
            {
              id: 'q1',
              question: 'What is your company stage?',
              type: 'single',
              options: [
                { value: 'idea', label: 'Idea Stage' },
                { value: 'mvp', label: 'MVP/Prototype' },
                { value: 'revenue', label: 'Generating Revenue' }
              ]
            }
          ],
          editor_sections: [
            {
              id: 'executive_summary',
              title: 'Executive Summary',
              required: true,
              ai_prompts: ['Summarize your business idea in 2-3 sentences']
            }
          ],
          readiness_criteria: [
            {
              id: 'business_plan',
              description: 'Complete business plan required',
              required: true
            }
          ],
          ai_guidance: {
            context: 'This program supports early-stage startups with innovative ideas',
            suggestions: ['Focus on market validation', 'Prepare financial projections']
          }
        }
      ];

      return res.status(200).json({
        success: true,
        data: samplePrograms,
        count: samplePrograms.length,
        message: `Test mode: Generated ${samplePrograms.length} sample programs`,
        timestamp: new Date().toISOString()
      });
    }

    if (action === 'save') {
      // Save sample data to database
      const sampleProgram = {
        id: 'aws_preseed_live',
        name: 'AWS Preseed - Live Program',
        description: 'Live program for AWS Preseed funding',
        program_type: 'grant',
        funding_amount_min: 50000,
        funding_amount_max: 200000,
        currency: 'EUR',
        deadline: new Date('2024-12-31'),
        eligibility_criteria: { min_team_size: 2, max_age: 5 },
        requirements: { business_plan: true, pitch_deck: true },
        contact_info: { email: 'info@aws.at', phone: '+43 1 234 567' },
        source_url: 'https://aws.at/preseed',
        scraped_at: new Date(),
        confidence_score: 0.9,
        is_active: true,
        target_personas: ['startup', 'sme'],
        tags: ['innovation', 'startup', 'non-dilutive'],
        decision_tree_questions: [
          {
            id: 'q1',
            question: 'What is your company stage?',
            type: 'single',
            options: [
              { value: 'idea', label: 'Idea Stage' },
              { value: 'mvp', label: 'MVP/Prototype' },
              { value: 'revenue', label: 'Generating Revenue' }
            ]
          }
        ],
        editor_sections: [
          {
            id: 'executive_summary',
            title: 'Executive Summary',
            required: true,
            ai_prompts: ['Summarize your business idea in 2-3 sentences']
          }
        ],
        readiness_criteria: [
          {
            id: 'business_plan',
            description: 'Complete business plan required',
            required: true
          }
        ],
        ai_guidance: {
          context: 'This program supports early-stage startups with innovative ideas',
          suggestions: ['Focus on market validation', 'Prepare financial projections']
        }
      };

      // Insert into database
      const result = await pool.query(`
        INSERT INTO programs (
          id, name, description, program_type, funding_amount_min, funding_amount_max,
          currency, deadline, eligibility_criteria, requirements, contact_info,
          source_url, scraped_at, confidence_score, is_active,
          target_personas, tags, decision_tree_questions, editor_sections,
          readiness_criteria, ai_guidance
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          program_type = EXCLUDED.program_type,
          funding_amount_min = EXCLUDED.funding_amount_min,
          funding_amount_max = EXCLUDED.funding_amount_max,
          currency = EXCLUDED.currency,
          deadline = EXCLUDED.deadline,
          eligibility_criteria = EXCLUDED.eligibility_criteria,
          requirements = EXCLUDED.requirements,
          contact_info = EXCLUDED.contact_info,
          source_url = EXCLUDED.source_url,
          scraped_at = EXCLUDED.scraped_at,
          confidence_score = EXCLUDED.confidence_score,
          is_active = EXCLUDED.is_active,
          target_personas = EXCLUDED.target_personas,
          tags = EXCLUDED.tags,
          decision_tree_questions = EXCLUDED.decision_tree_questions,
          editor_sections = EXCLUDED.editor_sections,
          readiness_criteria = EXCLUDED.readiness_criteria,
          ai_guidance = EXCLUDED.ai_guidance
        RETURNING id
      `, [
        sampleProgram.id,
        sampleProgram.name,
        sampleProgram.description,
        sampleProgram.program_type,
        sampleProgram.funding_amount_min,
        sampleProgram.funding_amount_max,
        sampleProgram.currency,
        sampleProgram.deadline,
        JSON.stringify(sampleProgram.eligibility_criteria),
        JSON.stringify(sampleProgram.requirements),
        JSON.stringify(sampleProgram.contact_info),
        sampleProgram.source_url,
        sampleProgram.scraped_at,
        sampleProgram.confidence_score,
        sampleProgram.is_active,
        JSON.stringify(sampleProgram.target_personas),
        JSON.stringify(sampleProgram.tags),
        JSON.stringify(sampleProgram.decision_tree_questions),
        JSON.stringify(sampleProgram.editor_sections),
        JSON.stringify(sampleProgram.readiness_criteria),
        JSON.stringify(sampleProgram.ai_guidance)
      ]);

      return res.status(200).json({
        success: true,
        data: { id: result.rows[0].id },
        message: `Successfully saved program to database: ${sampleProgram.name}`,
        timestamp: new Date().toISOString()
      });
    }

    return res.status(400).json({
      error: 'Invalid action',
      message: 'Use action: "test" to generate sample data, or "save" to save to database',
      availableActions: ['test', 'save']
    });

  } catch (error) {
    console.error('Scraper API Error:', error);
    return res.status(500).json({
      error: 'Scraper failed',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: new Date().toISOString()
    });
  }
}
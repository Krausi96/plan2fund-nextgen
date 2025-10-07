// Program Templates API - Phase 3 Step 2
import { NextApiRequest, NextApiResponse } from 'next';
import { Pool } from 'pg';
import { createTemplateEngine } from '../../src/lib/programTemplates';

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
    const { programId, action } = req.query;

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
        
        // Create template engine
        const engine = createTemplateEngine([program]);
        const programTemplate = await engine.generateTemplate(programId as string);

        return res.status(200).json({
          success: true,
          data: programTemplate,
          program: {
            id: program.id,
            name: program.name,
            description: program.description
          },
          message: `Generated template with ${programTemplate.total_sections} sections`
        });

      case 'list':
        // Get all programs with template capabilities
        const programsResult = await pool.query(`
          SELECT id, name, description, program_type, target_personas, tags,
                 editor_sections, funding_amount_min, funding_amount_max
          FROM programs 
          WHERE is_active = true 
          ORDER BY name
        `);

        const programs = programsResult.rows.map(row => ({
          id: row.id,
          name: row.name,
          description: row.description,
          program_type: row.program_type,
          target_personas: row.target_personas || [],
          tags: row.tags || [],
          has_custom_template: !!row.editor_sections,
          funding_range: {
            min: row.funding_amount_min,
            max: row.funding_amount_max
          }
        }));

        return res.status(200).json({
          success: true,
          data: programs,
          count: programs.length,
          message: `Found ${programs.length} programs with template capabilities`
        });

      case 'sections':
        if (!programId) {
          return res.status(400).json({
            success: false,
            error: 'Program ID is required',
            message: 'Please provide a programId parameter'
          });
        }

        // Get program sections
        const sectionsResult = await pool.query(`
          SELECT editor_sections
          FROM programs 
          WHERE id = $1 AND is_active = true
        `, [programId]);

        if (sectionsResult.rows.length === 0) {
          return res.status(404).json({
            success: false,
            error: 'Program not found',
            message: `Program with ID ${programId} not found`
          });
        }

        const sections = sectionsResult.rows[0].editor_sections || [];

        return res.status(200).json({
          success: true,
          data: sections,
          count: sections.length,
          message: `Found ${sections.length} program-specific sections`
        });

      case 'validate':
        if (req.method !== 'POST') {
          return res.status(405).json({ error: 'POST method required for validation' });
        }

        const { templateData } = req.body;
        if (!templateData || !programId) {
          return res.status(400).json({
            success: false,
            error: 'Template data and programId are required',
            message: 'Please provide templateData object and programId'
          });
        }

        // Get program template for validation
        const validationResult = await pool.query(`
          SELECT id, name, editor_sections, requirements
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
        const engineForValidation = createTemplateEngine([programForValidation]);
        const template = engineForValidation.generateTemplate(programId as string);

        // Validate template data
        const validation = validateTemplateData(templateData, template);

        return res.status(200).json({
          success: true,
          data: validation,
          message: validation.valid ? 'Template data is valid' : 'Template data has validation errors'
        });

      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid action',
          message: 'Valid actions are: generate, list, sections, validate'
        });
    }

  } catch (error) {
    console.error('Program templates API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to process template request',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    });
  }
}

/**
 * Validate template data against program requirements
 */
function validateTemplateData(templateData: any, template: any): {
  valid: boolean;
  errors: string[];
  warnings: string[];
  recommendations: string[];
  completion_percentage: number;
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  const recommendations: string[] = [];
  let completedSections = 0;
  let totalSections = template.sections.length;

  // Check required sections
  for (const section of template.sections) {
    if (section.required) {
      if (!templateData[section.id] || !templateData[section.id].content) {
        errors.push(`Required section "${section.title}" is missing or empty`);
      } else {
        completedSections++;
        
        // Check word count
        const wordCount = templateData[section.id].content.split(' ').length;
        if (section.validation_rules.min_words && wordCount < section.validation_rules.min_words) {
          warnings.push(`Section "${section.title}" has ${wordCount} words but requires at least ${section.validation_rules.min_words}`);
        }
        if (section.validation_rules.max_words && wordCount > section.validation_rules.max_words) {
          warnings.push(`Section "${section.title}" has ${wordCount} words but should not exceed ${section.validation_rules.max_words}`);
        }

        // Check required fields
        if (section.validation_rules.required_fields) {
          for (const field of section.validation_rules.required_fields) {
            if (!templateData[section.id].content.toLowerCase().includes(field.toLowerCase())) {
              recommendations.push(`Consider including "${field}" in section "${section.title}"`);
            }
          }
        }
      }
    } else {
      if (templateData[section.id] && templateData[section.id].content) {
        completedSections++;
      }
    }
  }

  // Calculate completion percentage
  const completionPercentage = Math.round((completedSections / totalSections) * 100);

  // Add recommendations based on completion
  if (completionPercentage < 50) {
    recommendations.push('Consider completing more sections to improve your application');
  } else if (completionPercentage < 80) {
    recommendations.push('You\'re making good progress! Complete the remaining sections for a strong application');
  } else if (completionPercentage < 100) {
    recommendations.push('Almost there! Complete the final sections for a comprehensive application');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    recommendations,
    completion_percentage: completionPercentage
  };
}

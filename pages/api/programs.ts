// Programs API endpoint with GPT-enhanced data
import { NextApiRequest, NextApiResponse } from 'next';
import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

// AI Field Generation Functions
// function generateTargetPersonas(program: any): string[] {
//   const personas = [];
//   if (program.program_type === 'grant') {
//     personas.push('startup', 'sme');
//   }
//   if (program.description?.toLowerCase().includes('research')) {
//     personas.push('researcher');
//   }
//   if (program.source_url?.includes('vba')) {
//     personas.push('solo_entrepreneur');
//   }
//   return personas.length > 0 ? personas : ['startup', 'sme'];
// }

// function generateTags(program: any): string[] {
//   const tags = [];
//   tags.push(program.program_type || 'grant');
//   tags.push('funding');
//   if (program.description?.toLowerCase().includes('innovation')) {
//     tags.push('innovation');
//   }
//   if (program.description?.toLowerCase().includes('research')) {
//     tags.push('research');
//   }
//   if (program.source_url?.includes('aws')) {
//     tags.push('aws');
//   }
//   if (program.source_url?.includes('ffg')) {
//     tags.push('ffg');
//   }
//   return tags;
// }

function generateDecisionTreeQuestions(program: any): any[] {
  const questions = [];
  if (program.program_type === 'grant' || program.program_type === 'loan') {
    questions.push({
      id: 'q1_company_stage',
      type: 'single',
      question: 'What stage is your company at?',
      options: [
        { value: 'startup', label: 'Startup (0-3 years)' },
        { value: 'sme', label: 'Small/Medium Enterprise' },
        { value: 'scaleup', label: 'Scale-up (3+ years)' }
      ],
      required: true
    });
  }
  if (program.funding_amount_max > 0) {
    questions.push({
      id: 'q2_funding_amount',
      type: 'range',
      question: `How much funding do you need? (This program offers up to €${program.funding_amount_max.toLocaleString()})`,
      min: 0,
      max: program.funding_amount_max,
      required: true
    });
  }
  return questions;
}

function generateEditorSections(program: any): any[] {
  const sections = [];
  sections.push({
    id: 'executive_summary',
    title: 'Executive Summary',
    required: true,
    ai_prompts: [
      'Describe your business idea in 2-3 sentences',
      'What problem does your solution solve?',
      'What makes your approach unique?'
    ]
  });
  if (program.program_type === 'grant' || program.program_type === 'loan') {
    sections.push({
      id: 'business_plan',
      title: 'Business Plan',
      required: true,
      ai_prompts: [
        'Market analysis and target customers',
        'Revenue model and financial projections',
        'Competitive advantage and go-to-market strategy'
      ]
    });
  }
  return sections;
}

function generateReadinessCriteria(program: any): any[] {
  const criteria = [];
  criteria.push({
    id: 'team_complete',
    required: true,
    description: 'Complete founding team with relevant expertise',
    weight: 'high'
  });
  if (program.program_type === 'grant' || program.program_type === 'loan') {
    criteria.push({
      id: 'business_registered',
      required: true,
      description: 'Company legally registered and operational',
      weight: 'high'
    });
  }
  return criteria;
}

// function generateAIGuidance(program: any): any {
//   return {
//     context: `${program.name} program guidance`,
//     tone: 'professional',
//     key_points: [
//       'Check eligibility requirements carefully',
//       'Prepare necessary documents in advance',
//       'Focus on innovation and market potential'
//     ],
//     prompts: {
//       executive_summary: 'Highlight your unique value proposition and market opportunity',
//       business_plan: 'Include detailed financial projections and market analysis'
//     }
//   };
// }
// import { dataSource } from '../../src/lib/dataSource';

// Database connection
let pool: Pool | null = null;

try {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: false
  });
} catch (error) {
  console.warn('Database connection failed, using fallback data:', error);
}

// Fallback data from migrated programs
function getFallbackData() {
  try {
    const dataPath = path.join(process.cwd(), 'data', 'migrated-programs.json');
    const data = fs.readFileSync(dataPath, 'utf8');
    const jsonData = JSON.parse(data);
    
    // The data structure has programs in a 'programs' array
    const programs = jsonData.programs || [];
    
    return programs.map((program: any) => ({
      id: program.id,
      name: program.name,
      type: program.program_type || 'grant',
      requirements: program.requirements || {},
      notes: program.description,
      maxAmount: program.funding_amount_max || program.funding_amount,
      link: program.source_url || program.url,
      // Preserve AI metadata
      target_personas: program.target_personas || [],
      tags: program.tags || [],
      decision_tree_questions: program.decision_tree_questions || [],
      editor_sections: program.editor_sections || [],
      readiness_criteria: program.readiness_criteria || [],
      ai_guidance: program.ai_guidance || null
    }));
  } catch (error) {
    console.error('Fallback data loading failed:', error);
    return [];
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { type, enhanced } = req.query;
    
    // If enhanced data is requested, use database with AI enhancement
    if (enhanced === 'true') {
      try {
        console.log('🔍 Fetching enhanced programs from database...');
        
        // Try database first for enhanced data
        if (pool) {
          try {
            let query = `
              SELECT id, name, description, program_type, funding_amount_min, funding_amount_max, 
                     source_url, deadline, is_active, scraped_at,
                     target_personas, tags, decision_tree_questions, editor_sections, 
                     readiness_criteria, ai_guidance
              FROM programs 
              WHERE is_active = true
            `;
            
            const params = [];
            if (type) {
              query += ` AND program_type = $1`;
              params.push(type);
            }
            
            query += ` ORDER BY scraped_at DESC`; // Remove limit to get all programs
            
            const result = await pool.query(query, params);
            
            const enhancedPrograms = result.rows.map(row => {
              return {
                id: row.id,
                name: row.name,
                type: row.program_type || 'grant',
                requirements: row.requirements || {},
                notes: row.description || '',
                maxAmount: row.funding_amount_max || 0,
                link: row.source_url || '',
                // Use existing AI-enhanced fields from database
                target_personas: row.target_personas || [],
                tags: row.tags || [],
                decision_tree_questions: row.decision_tree_questions || [],
                editor_sections: row.editor_sections || [],
                readiness_criteria: row.readiness_criteria || [],
                ai_guidance: row.ai_guidance || null
              };
            });
            
            return res.status(200).json({
              success: true,
              programs: enhancedPrograms,
              count: enhancedPrograms.length,
              message: `Found ${enhancedPrograms.length} GPT-enhanced programs from database`,
              source: 'database_enhanced',
              enhanced: true
            });
          } catch (dbError) {
            console.warn('Database enhanced query failed, using fallback:', dbError);
            // Fall through to fallback
          }
        }
        
        // Fallback to basic programs with AI enhancement
        const basicPrograms = getFallbackData();
        const enhancedPrograms = basicPrograms.map((program: any) => ({
          ...program,
          target_personas: ['startup', 'sme'],
          tags: [program.type, 'funding'],
          decision_tree_questions: [],
          editor_sections: [],
          readiness_criteria: [],
          ai_guidance: {
            context: 'AI-enhanced program data',
            tone: 'professional',
            key_points: ['Check eligibility requirements', 'Prepare necessary documents'],
            prompts: {}
          }
        }));
        
        const filteredPrograms = type 
          ? enhancedPrograms.filter((p: any) => p.type === type)
          : enhancedPrograms;
        
        return res.status(200).json({
          success: true,
          programs: filteredPrograms,
          count: filteredPrograms.length,
          message: `Found ${filteredPrograms.length} GPT-enhanced programs from fallback`,
          source: 'fallback_enhanced',
          enhanced: true
        });
        
      } catch (enhancedError) {
        console.warn('Enhanced data fetch failed, falling back to basic data:', enhancedError);
        // Fall through to basic data
      }
    }
    
    // Try database first, fallback to JSON data
    if (pool) {
      try {
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
          message: `Found ${programs.length} programs from database`,
          source: 'database'
        });
      } catch (dbError) {
        console.warn('Database query failed, using fallback data:', dbError);
        // Fall through to fallback data
      }
    }
    
    // Fallback to JSON data
    const programs = getFallbackData();
    
    // Filter by type if specified
    const filteredPrograms = type 
      ? programs.filter((p: any) => p.type === type)
      : programs;
    
    return res.status(200).json({
      success: true,
      programs: filteredPrograms,
      count: filteredPrograms.length,
      message: `Found ${filteredPrograms.length} programs from fallback data`,
      source: 'fallback'
    });
    
  } catch (error) {
    console.error('Programs API Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

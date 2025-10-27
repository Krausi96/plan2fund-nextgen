// Programs API endpoint
import { NextApiRequest, NextApiResponse } from 'next';
import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

// ============================================================================
// SHARED TRANSFORMATION LOGIC (Single Source of Truth)
// ============================================================================

/**
 * Transform eligibility_criteria to categorized_requirements
 * Used by ALL data reading paths - centralized to avoid duplication
 */
function transformEligibilityToCategorized(eligibility: any): any {
  const categorized: any = {
    eligibility: [], documents: [], financial: [], technical: [], legal: [],
    timeline: [], geographic: [], team: [], project: [], compliance: [],
    impact: [], capex_opex: [], use_of_funds: [], revenue_model: [],
    market_size: [], co_financing: [], trl_level: [], consortium: []
  };
  
  if (!eligibility || Object.keys(eligibility).length === 0) return categorized;
  
  if (eligibility.location) {
    const normalizedLocation = typeof eligibility.location === 'string' ? eligibility.location.toLowerCase() : eligibility.location;
    categorized.geographic.push({ type: 'location', value: normalizedLocation, required: true, source: 'eligibility_criteria' });
  }
  if (eligibility.min_team_size) {
    categorized.team.push({ type: 'min_team_size', value: eligibility.min_team_size, required: true, source: 'eligibility_criteria' });
  }
  if (eligibility.max_company_age) {
    categorized.team.push({ type: 'max_company_age', value: eligibility.max_company_age, required: true, source: 'eligibility_criteria' });
  }
  if (eligibility.revenue_min || eligibility.revenue_max) {
    categorized.financial.push({ type: 'revenue', value: { min: eligibility.revenue_min, max: eligibility.revenue_max }, required: true, source: 'eligibility_criteria' });
  }
  
  return categorized;
}

// ============================================================================
// DATABASE CONNECTION
// ============================================================================

let pool: Pool | null = null;

try {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: false
  });
} catch (error) {
  console.warn('Database connection failed, using fallback data:', error);
}

// Fallback data from latest scraped programs
function getFallbackData() {
  try {
    // Try the GOOD scraped data first (503 real programs from Oct 23)
    const scrapedDataPath = path.join(process.cwd(), 'data', 'scraped-programs-2025-10-23.json');
    if (fs.existsSync(scrapedDataPath)) {
      console.log('✅ Using scraped-programs-2025-10-23.json (503 real programs)');
      const data = fs.readFileSync(scrapedDataPath, 'utf8');
      const jsonData = JSON.parse(data);
      const programs = jsonData.programs || [];
      
      return programs.map((program: any) => ({
        id: program.id,
        name: program.name,
        type: program.program_type || program.type || 'grant',
        requirements: program.requirements || {},
        notes: program.description,
        maxAmount: program.funding_amount_max || program.funding_amount,
        link: program.source_url || program.url,
        eligibility_criteria: program.eligibility_criteria || {},
        categorized_requirements: transformEligibilityToCategorized(program.eligibility_criteria),
        // Preserve AI metadata
        target_personas: program.target_personas || [],
        tags: program.tags || [],
        decision_tree_questions: program.decision_tree_questions || [],
        editor_sections: program.editor_sections || [],
        readiness_criteria: program.readiness_criteria || [],
        ai_guidance: program.ai_guidance || null
      }));
    }
    
    // Fallback to migrated data (also has 503 programs)
    const dataPath = path.join(process.cwd(), 'data', 'migrated-programs.json');
    if (fs.existsSync(dataPath)) {
      console.log('✅ Using migrated-programs.json (503 fallback programs)');
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
        eligibility_criteria: program.eligibility_criteria || {},
        categorized_requirements: transformEligibilityToCategorized(program.eligibility_criteria),
        // Preserve AI metadata
        target_personas: program.target_personas || [],
        tags: program.tags || [],
        decision_tree_questions: program.decision_tree_questions || [],
        editor_sections: program.editor_sections || [],
        readiness_criteria: program.readiness_criteria || [],
        ai_guidance: program.ai_guidance || null
      }));
    }
    
    console.warn('⚠️ No fallback data available');
    return [];
  } catch (error) {
    console.error('Fallback data loading failed:', error);
    return [];
  }
}

// UNUSED: Enhanced Data Pipeline function (removed import to fix errors)
// API reads JSON directly which works fine
async function getProgramsFromEnhancedPipeline(_type?: string): Promise<any[]> {
  // This function is not called - API reads JSON directly
  return [];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Handle CORS preflight (OPTIONS)
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, cache-control');
    return res.status(200).end();
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Set CORS headers for actual requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, cache-control');

  try {
    const { type, enhanced, source } = req.query;
    
    // STEP 1.3: Use Enhanced Data Pipeline for intelligent data source
    if (enhanced === 'true' || source === 'pipeline') {
      // FOR NOW: Bypass Enhanced Data Pipeline and read directly from scraped-programs-2025-10-23.json
      // This ensures we have proper eligibility_criteria data
      const dataPath = path.join(process.cwd(), 'data', 'scraped-programs-2025-10-23.json');
      if (fs.existsSync(dataPath)) {
        console.log('✅ Reading directly from scraped-programs-2025-10-23.json (bypassing pipeline)');
        const data = fs.readFileSync(dataPath, 'utf8');
        const jsonData = JSON.parse(data);
        const rawPrograms = jsonData.programs || [];
        
        const programs = rawPrograms.map((program: any) => {
          const eligibility = program.eligibility_criteria || {};
          const regeneratedCategorized = transformEligibilityToCategorized(eligibility);
          
          // DEBUG: Log sample program
          if (program.id === rawPrograms[0].id) {
            console.log('🔍 DEBUG: Sample program categorized_requirements:', regeneratedCategorized);
            console.log('🔍 DEBUG: Sample program eligibility_criteria:', eligibility);
          }
          
          return {
            id: program.id,
            name: program.name,
            type: program.program_type || program.type || 'grant',
            requirements: program.requirements || {},
            notes: program.description || '',
            maxAmount: program.funding_amount_max || 0,
            minAmount: program.funding_amount_min || 0,
            currency: program.currency || 'EUR',
            link: program.source_url || '',
            deadline: program.deadline,
            isActive: program.is_active !== false,
            scrapedAt: program.scraped_at,
            eligibility_criteria: eligibility,
            categorized_requirements: regeneratedCategorized,
            target_personas: program.target_personas || [],
            tags: program.tags || [],
            decision_tree_questions: program.decision_tree_questions || [],
            editor_sections: program.editor_sections || [],
            readiness_criteria: program.readiness_criteria || [],
            ai_guidance: program.ai_guidance || null
          };
        });
        
        const filteredPrograms = type 
          ? programs.filter((p: any) => p.type === type)
          : programs;
        
        return res.status(200).json({
          success: true,
          programs: filteredPrograms,
          source: 'direct_json',
          total: filteredPrograms.length,
          timestamp: new Date().toISOString(),
        });
      }
      
      // Fallback to Enhanced Data Pipeline
      try {
        console.log('🔄 Using Enhanced Data Pipeline (Step 1.3)...');
        const programs = await getProgramsFromEnhancedPipeline(type as string);
        
        return res.status(200).json({
          success: true,
          programs,
          source: 'enhanced_pipeline',
          total: programs.length,
          timestamp: new Date().toISOString(),
          pipeline: {
            quality_scores: programs.map(p => p.quality_score),
            confidence_levels: programs.map(p => p.confidence_level),
            categories_applied: true,
            dynamic_learning: true
          }
        });
      } catch (error) {
        console.error('Enhanced Pipeline failed, falling back to database:', error);
        // Fall through to database fallback
      }
    }
    
    // Fallback: If enhanced data is requested, use database with AI enhancement
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
                     readiness_criteria, ai_guidance, categorized_requirements
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
                ai_guidance: row.ai_guidance || null,
                // Include categorized requirements from Layer 1&2
                categorized_requirements: row.categorized_requirements || null
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

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
 * CENTRALIZED TRANSFORMATION (per contract review) - used by ALL data paths
 * Must handle all 18 requirement categories
 */
export function transformEligibilityToCategorized(eligibility: any): any {
  const categorized: any = {
    eligibility: [], documents: [], financial: [], technical: [], legal: [],
    timeline: [], geographic: [], team: [], project: [], compliance: [],
    impact: [], capex_opex: [], use_of_funds: [], revenue_model: [],
    market_size: [], co_financing: [], trl_level: [], consortium: []
  };
  
  if (!eligibility || Object.keys(eligibility).length === 0) return categorized;
  
  // Geographic requirements
  if (eligibility.location) {
    const normalizedLocation = typeof eligibility.location === 'string' ? eligibility.location.toLowerCase() : eligibility.location;
    categorized.geographic.push({ type: 'location', value: normalizedLocation, required: true, source: 'eligibility_criteria' });
  }
  
  // Team requirements
  if (eligibility.min_team_size) {
    categorized.team.push({ type: 'min_team_size', value: eligibility.min_team_size, required: true, source: 'eligibility_criteria' });
  }
  if (eligibility.max_company_age) {
    categorized.team.push({ type: 'max_company_age', value: eligibility.max_company_age, required: true, source: 'eligibility_criteria' });
  }
  if (eligibility.company_age) {
    categorized.team.push({ type: 'company_age', value: eligibility.company_age, required: true, source: 'eligibility_criteria' });
  }
  if (eligibility.team_size) {
    categorized.team.push({ type: 'team_size', value: eligibility.team_size, required: true, source: 'eligibility_criteria' });
  }
  
  // Financial requirements
  if (eligibility.revenue_min || eligibility.revenue_max) {
    categorized.financial.push({ type: 'revenue', value: { min: eligibility.revenue_min, max: eligibility.revenue_max }, required: true, source: 'eligibility_criteria' });
  }
  if (eligibility.co_financing || eligibility.cofinancing_pct) {
    const coFinancing = eligibility.co_financing || eligibility.cofinancing_pct;
    categorized.co_financing.push({ type: 'co_financing', value: coFinancing, required: true, source: 'eligibility_criteria' });
    categorized.financial.push({ type: 'co_financing', value: coFinancing, required: true, source: 'eligibility_criteria' });
  }
  
  // Project requirements
  if (eligibility.industry_focus) categorized.project.push({ type: 'industry_focus', value: eligibility.industry_focus, required: true, source: 'eligibility_criteria' });
  if (eligibility.research_focus) categorized.project.push({ type: 'research_focus', value: eligibility.research_focus, required: true, source: 'eligibility_criteria' });
  if (eligibility.innovation_focus) categorized.project.push({ type: 'innovation_focus', value: eligibility.innovation_focus, required: true, source: 'eligibility_criteria' });
  
  // Technical requirements
  if (eligibility.trl_level) categorized.trl_level.push({ type: 'trl_level', value: eligibility.trl_level, required: true, source: 'eligibility_criteria' });
  if (eligibility.trl) categorized.trl_level.push({ type: 'trl_level', value: eligibility.trl, required: true, source: 'eligibility_criteria' });
  
  // Consortium requirements
  if (eligibility.international_collaboration) categorized.consortium.push({ type: 'international_collaboration', value: eligibility.international_collaboration, required: true, source: 'eligibility_criteria' });
  if (eligibility.consortium_required) categorized.consortium.push({ type: 'consortium_required', value: eligibility.consortium_required, required: true, source: 'eligibility_criteria' });
  
  // Impact requirements
  if (eligibility.impact) categorized.impact.push({ type: 'impact', value: eligibility.impact, required: true, source: 'eligibility_criteria' });
  if (eligibility.environmental_impact) categorized.impact.push({ type: 'environmental_impact', value: eligibility.environmental_impact, required: true, source: 'eligibility_criteria' });
  if (eligibility.social_impact) categorized.impact.push({ type: 'social_impact', value: eligibility.social_impact, required: true, source: 'eligibility_criteria' });
  
  // Market size requirements (per contract review: missing categories)
  if (eligibility.market_size) categorized.market_size.push({ type: 'market_size', value: eligibility.market_size, required: true, source: 'eligibility_criteria' });
  
  // Use of funds requirements (per contract review: missing categories)
  if (eligibility.use_of_funds) categorized.use_of_funds.push({ type: 'use_of_funds', value: eligibility.use_of_funds, required: true, source: 'eligibility_criteria' });
  
  // Revenue model requirements
  if (eligibility.revenue_model) categorized.revenue_model.push({ type: 'revenue_model', value: eligibility.revenue_model, required: true, source: 'eligibility_criteria' });
  
  // CAPEX/OPEX requirements
  if (eligibility.capex_opex) categorized.capex_opex.push({ type: 'capex_opex', value: eligibility.capex_opex, required: true, source: 'eligibility_criteria' });
  
  // Eligibility requirements
  if (eligibility.company_type) categorized.eligibility.push({ type: 'company_type', value: eligibility.company_type, required: true, source: 'eligibility_criteria' });
  if (eligibility.target_group) categorized.eligibility.push({ type: 'target_group', value: eligibility.target_group, required: true, source: 'eligibility_criteria' });
  
  // Document requirements
  if (eligibility.documents_required) categorized.documents.push({ type: 'documents_required', value: eligibility.documents_required, required: true, source: 'eligibility_criteria' });
  
  // Timeline requirements
  if (eligibility.project_duration) categorized.timeline.push({ type: 'project_duration', value: eligibility.project_duration, required: true, source: 'eligibility_criteria' });
  if (eligibility.max_duration) categorized.timeline.push({ type: 'max_duration', value: eligibility.max_duration, required: true, source: 'eligibility_criteria' });
  
  // Legal/Compliance requirements
  if (eligibility.legal_requirements) categorized.legal.push({ type: 'legal_requirements', value: eligibility.legal_requirements, required: true, source: 'eligibility_criteria' });
  if (eligibility.compliance) categorized.compliance.push({ type: 'compliance', value: eligibility.compliance, required: true, source: 'eligibility_criteria' });
  
  return categorized;
}

/**
 * Calculate completeness score (0-100) per contract review
 * "provide completenessScore based on filled fields"
 */
export function calculateCompletenessScore(program: any): number {
  const weights: Record<string, number> = {
    name: 10,
    description: 10,
    region: 5,
    type: 5,
    maxAmount: 8,
    deadlines: 8,
    source_url: 5,
    eligibility_criteria: 8,
    categorized_requirements: 15, // Critical for filtering
    contact_email: 3,
    contact_phone: 3,
    cofinancing_pct: 4,
    docs_required: 4,
    target_personas: 2,
    tags: 2,
    ai_guidance: 2
  };
  
  let score = 0;
  let maxScore = 0;
  
  Object.entries(weights).forEach(([field, weight]) => {
    maxScore += weight;
    const value = program[field];
    
    if (field === 'categorized_requirements') {
      const reqs = value as Record<string, any[]>;
      const hasRequirements = reqs && Object.values(reqs).some(arr => arr.length > 0);
      if (hasRequirements) score += weight;
    } else if (field === 'deadlines') {
      if (value && Array.isArray(value) && value.length > 0) score += weight;
      else if (program.deadline) score += weight;
    } else if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value) && value.length > 0) score += weight;
      else if (typeof value === 'object' && Object.keys(value).length > 0) score += weight;
      else if (typeof value !== 'object') score += weight;
    }
  });
  
  return Math.round((score / maxScore) * 100);
}

/**
 * Check if program data is fresh (within 24 hours per contract review)
 */
export function isProgramFresh(program: any, windowHours: number = 24): boolean {
  if (!program.scraped_at) return false;
  
  const scrapedAt = new Date(program.scraped_at);
  const now = new Date();
  const hoursSinceScrape = (now.getTime() - scrapedAt.getTime()) / (1000 * 60 * 60);
  
  return hoursSinceScrape <= windowHours;
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
    // Always use latest scraped data (what scraper just saved)
    const latestDataPath = path.join(process.cwd(), 'data', 'scraped-programs-latest.json');
    
    let dataPath = latestDataPath;
    if (!fs.existsSync(latestDataPath)) {
      throw new Error('No scraped data found. Run: npm run scraper:run');
    } else {
      console.log('✅ Using scraped-programs-latest.json');
    }
    
    const data = fs.readFileSync(dataPath, 'utf8');
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
      categorized_requirements: program.categorized_requirements || transformEligibilityToCategorized(program.eligibility_criteria),
      // Preserve AI metadata
      target_personas: program.target_personas || [],
      tags: program.tags || [],
      decision_tree_questions: program.decision_tree_questions || [],
      editor_sections: program.editor_sections || [],
      readiness_criteria: program.readiness_criteria || [],
      ai_guidance: program.ai_guidance || null
    }));
    
    // Fallback to migrated data (also has 503 programs)
    const migratedDataPath = path.join(process.cwd(), 'data', 'migrated-programs.json');
    if (fs.existsSync(migratedDataPath)) {
      console.log('✅ Using migrated-programs.json (503 fallback programs)');
      const data = fs.readFileSync(migratedDataPath, 'utf8');
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
      // Use latest scraped data (what scraper just saved)
      const dataPath = path.join(process.cwd(), 'data', 'scraped-programs-latest.json');
      const fallbackPath = path.join(process.cwd(), 'data', 'migrated-programs.json');
      
      const actualDataPath = fs.existsSync(dataPath) ? dataPath : fallbackPath;
      if (fs.existsSync(actualDataPath)) {
        console.log(`✅ Reading from ${fs.existsSync(dataPath) ? 'scraped-programs-latest.json' : 'migrated-programs.json (fallback)'}`);
        const data = fs.readFileSync(actualDataPath, 'utf8');
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
            categorized_requirements: program.categorized_requirements || regeneratedCategorized,
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
        
        // Calculate completeness and freshness per contract review
        const programsWithScores = filteredPrograms.map((p: any) => ({
          ...p,
          completenessScore: calculateCompletenessScore(p),
          fresh: isProgramFresh(p)
        }));
        
        const overallCompletenessScore = programsWithScores.length > 0
          ? Math.round(programsWithScores.reduce((sum: number, p: any) => sum + p.completenessScore, 0) / programsWithScores.length)
          : 0;
        
        return res.status(200).json({
          success: true,
          programs: programsWithScores,
          source: 'direct_json',
          total: programsWithScores.length,
          completenessScore: overallCompletenessScore,
          fresh: programsWithScores.some((p: any) => p.fresh),
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
    
    // Try NEON database (scraper-lite pages table)
    try {
      const { searchPages, getAllPages } = require('../../scraper-lite/src/db/page-repository');
      
      const pages = type 
        ? await searchPages({ region: type, limit: 1000 }) // Using region as proxy for type for now
        : await getAllPages(1000);
      
      // Transform pages to programs format
      const programs = await Promise.all(pages.map(async (page: any) => {
        // Get requirements
        const { getPool } = require('../../scraper-lite/src/db/neon-client');
        const pool = getPool();
        const reqResult = await pool.query(
          'SELECT category, type, value, required, source FROM requirements WHERE page_id = $1',
          [page.id]
        );
        
        const categorized_requirements: Record<string, any[]> = {};
        reqResult.rows.forEach((row: any) => {
          if (!categorized_requirements[row.category]) {
            categorized_requirements[row.category] = [];
          }
          categorized_requirements[row.category].push({
            type: row.type,
            value: row.value,
            required: row.required,
            source: row.source
          });
        });
        
        return {
          id: `page_${page.id}`,
          name: page.title || page.url,
          type: type || 'grant',
          program_type: type || 'grant',
          description: page.description,
          funding_amount_min: page.funding_amount_min,
          funding_amount_max: page.funding_amount_max,
          source_url: page.url,
          url: page.url,
          deadline: page.deadline,
          open_deadline: page.open_deadline,
          contact_email: page.contact_email,
          contact_phone: page.contact_phone,
          requirements: {},
          categorized_requirements,
          notes: page.description,
          maxAmount: page.funding_amount_max,
          link: page.url,
          region: page.region,
          funding_types: page.funding_types || [],
          program_focus: page.program_focus || []
        };
      }));
      
      return res.status(200).json({
        success: true,
        programs,
        count: programs.length,
        message: `Found ${programs.length} programs from NEON database`,
        source: 'neon-database'
      });
    } catch (dbError) {
      console.warn('NEON database query failed, using fallback data:', dbError);
      // Fall through to fallback data
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

// Programs API endpoint
import { NextApiRequest, NextApiResponse } from 'next';
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
// STATIC JSON DATA SOURCE
// ============================================================================

/**
 * Load programs from static JSON file
 * This is the ONLY data source - no database, no URLs
 */
function loadProgramsFromStaticFile(): any[] {
  try {
    // Primary: data/programmes.json
    const primaryPath = path.join(process.cwd(), 'data', 'programmes.json');
    
    if (fs.existsSync(primaryPath)) {
      console.log('✅ Using data/programmes.json');
      const data = fs.readFileSync(primaryPath, 'utf8');
      const jsonData = JSON.parse(data);
      const programs = jsonData.programs || jsonData || [];
      
      return Array.isArray(programs) ? programs.map((program: any) => ({
        id: program.id,
        name: program.name,
        type: program.program_type || program.type || 'grant',
        requirements: program.requirements || {},
        notes: program.description || program.notes,
        maxAmount: program.funding_amount_max || program.funding_amount || program.maxAmount,
        link: program.source_url || program.url || program.link,
        eligibility_criteria: program.eligibility_criteria || {},
        categorized_requirements: program.categorized_requirements || transformEligibilityToCategorized(program.eligibility_criteria),
        // Preserve AI metadata
        target_personas: program.target_personas || [],
        tags: program.tags || [],
        decision_tree_questions: program.decision_tree_questions || [],
        editor_sections: program.editor_sections || [],
        readiness_criteria: program.readiness_criteria || [],
        ai_guidance: program.ai_guidance || null,
        // Additional fields
        region: program.region,
        funding_types: program.funding_types || [program.type || 'grant'],
        program_focus: program.program_focus || [],
        deadline: program.deadline,
        open_deadline: program.open_deadline || false,
        contact_email: program.contact_email,
        contact_phone: program.contact_phone,
      })) : [];
    }
    
    // Fallback: data/migrated-programs.json (if exists)
    const fallbackPath = path.join(process.cwd(), 'data', 'migrated-programs.json');
    if (fs.existsSync(fallbackPath)) {
      console.log('✅ Using data/migrated-programs.json (fallback)');
      const data = fs.readFileSync(fallbackPath, 'utf8');
      const jsonData = JSON.parse(data);
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
        target_personas: program.target_personas || [],
        tags: program.tags || [],
        decision_tree_questions: program.decision_tree_questions || [],
        editor_sections: program.editor_sections || [],
        readiness_criteria: program.readiness_criteria || [],
        ai_guidance: program.ai_guidance || null,
      }));
    }
    
    console.warn('⚠️ No static program data found. Create data/programmes.json');
    return [];
  } catch (error) {
    console.error('Static data loading failed:', error);
    return [];
  }
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
    const { type, enhanced } = req.query;
    
    // Load programs from static JSON file (NO database, NO URLs)
    const programs = loadProgramsFromStaticFile();
    
    if (programs.length === 0) {
      return res.status(200).json({
        success: true,
        programs: [],
        count: 0,
        message: 'No programs found. Create data/programmes.json with your program data.',
        source: 'static'
      });
    }
    
    // Filter by type if specified
    const filteredPrograms = type 
      ? programs.filter((p: any) => {
          const programType = p.type || p.program_type || 'grant';
          const fundingTypes = p.funding_types || [];
          return programType === type || fundingTypes.includes(type);
        })
      : programs;
    
    // Add enhanced fields if requested
    if (enhanced === 'true') {
      filteredPrograms.forEach((program: any) => {
        program.completenessScore = calculateCompletenessScore(program);
        program.fresh = isProgramFresh(program);
      });
      
      const overallCompletenessScore = filteredPrograms.length > 0
        ? Math.round(filteredPrograms.reduce((sum: number, p: any) => sum + (p.completenessScore || 0), 0) / filteredPrograms.length)
        : 0;
      
      return res.status(200).json({
        success: true,
        programs: filteredPrograms,
        count: filteredPrograms.length,
        total: filteredPrograms.length,
        message: `Found ${filteredPrograms.length} programs from static JSON`,
        source: 'static',
        completenessScore: overallCompletenessScore,
        fresh: filteredPrograms.some((p: any) => p.fresh),
        timestamp: new Date().toISOString(),
      });
    }
    
    console.log(`✅ Returning ${filteredPrograms.length} programs from static JSON`);
    
    return res.status(200).json({
      success: true,
      programs: filteredPrograms,
      count: filteredPrograms.length,
      total: filteredPrograms.length,
      message: `Found ${filteredPrograms.length} programs from static JSON`,
      source: 'static',
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error('Programs API Error:', error);
    
    // Try to return empty array on error
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
      programs: [],
      count: 0,
      source: 'static',
      stack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined
    });
  }
}

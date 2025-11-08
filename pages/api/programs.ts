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
// DATABASE CONNECTION
// ============================================================================

// Database connection handled by scraper-lite/src/db/neon-client.ts
// No need for separate pool here

// Fallback data from latest scraped programs
function getFallbackData() {
  try {
    // Always use latest scraped data (what scraper just saved)
    const latestDataPath = path.join(process.cwd(), 'scraper-lite', 'data', 'legacy', 'scraped-programs-latest.json');
    
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

// Removed: Enhanced Data Pipeline function (database is now primary source)

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
    
    // PRIMARY: Try NEON database first (scraper-lite pages table)
    // This is the source of truth - always use database if available
    try {
      // Check DATABASE_URL first
      if (!process.env.DATABASE_URL) {
        console.warn('⚠️ DATABASE_URL not set, using JSON fallback');
        throw new Error('DATABASE_URL not configured');
      }
      
      // Add timeout to database operations
      const DB_TIMEOUT = 10000; // 10 seconds
      const databasePromise = (async () => {
        // Use dynamic import for TypeScript modules (works better with Next.js)
        // This matches the pattern used in pages/api/user/profile.ts
        const { searchPages, getAllPages } = await import('../../scraper-lite/db/db');
        
        const pages = type && typeof type === 'string'
          ? await searchPages({ region: type, limit: 1000 }) // Using region as proxy for type for now
          : await getAllPages(1000);
        
        return pages;
      })();
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database query timeout')), DB_TIMEOUT)
      );
      
      const pages = await Promise.race([databasePromise, timeoutPromise]) as any[];
      
      if (pages.length === 0) {
        console.warn('⚠️ No pages found in database, using JSON fallback');
        throw new Error('No pages in database');
      }
      
      // Transform pages to programs format with requirements
      const programs = await Promise.all(pages.map(async (page: any) => {
        try {
          // Get requirements for this page
          // Use dynamic import for TypeScript modules (works better with Next.js)
          // This matches the pattern used in pages/api/user/profile.ts
          const { getPool } = await import('../../scraper-lite/db/db');
          const pool = getPool();
          const reqResult = await pool.query(
            'SELECT category, type, value, required, source, description, format, requirements FROM requirements WHERE page_id = $1',
            [page.id]
          );
        
        // Group requirements by category
        const categorized_requirements: Record<string, any[]> = {};
        reqResult.rows.forEach((row: any) => {
          if (!categorized_requirements[row.category]) {
            categorized_requirements[row.category] = [];
          }
          // Parse value if it's JSON stored as TEXT
          let parsedValue: any = row.value;
          try {
            if (typeof row.value === 'string' && (row.value.startsWith('{') || row.value.startsWith('['))) {
              parsedValue = JSON.parse(row.value);
            }
          } catch (e) {
            // Not JSON, use as-is
          }
          
          categorized_requirements[row.category].push({
            type: row.type,
            value: parsedValue,
            required: row.required,
            source: row.source,
            description: row.description,
            format: row.format,
            // Include nested requirements if present
            requirements: row.requirements ? (typeof row.requirements === 'string' ? JSON.parse(row.requirements) : row.requirements) : undefined
          });
        });
        
        // Build eligibility_criteria from categorized_requirements for backward compatibility
        // QuestionEngine checks BOTH eligibility_criteria AND categorized_requirements
        const eligibility_criteria: any = {};
        
        // Geographic requirements
        // Handle both 'location' and 'specific_location' for backward compatibility
        if (categorized_requirements.geographic) {
          const location = categorized_requirements.geographic.find((r: any) => 
            r.type === 'location' || r.type === 'specific_location'
          );
          if (location) eligibility_criteria.location = location.value;
        }
        
        // Team/Age requirements
        if (categorized_requirements.team) {
          const maxAge = categorized_requirements.team.find((r: any) => r.type === 'max_company_age');
          if (maxAge) {
            eligibility_criteria.max_company_age = typeof maxAge.value === 'number' ? maxAge.value : parseInt(String(maxAge.value)) || null;
          }
          
          const minTeam = categorized_requirements.team.find((r: any) => r.type === 'min_team_size');
          if (minTeam) {
            eligibility_criteria.min_team_size = typeof minTeam.value === 'number' ? minTeam.value : parseInt(String(minTeam.value)) || null;
          }
        }
        
        // Financial requirements
        if (categorized_requirements.financial) {
          const revenue = categorized_requirements.financial.find((r: any) => r.type === 'revenue_range' || r.type === 'revenue');
          if (revenue && typeof revenue.value === 'object' && revenue.value !== null) {
            eligibility_criteria.revenue_min = revenue.value.min;
            eligibility_criteria.revenue_max = revenue.value.max;
          }
          
          const coFinancing = categorized_requirements.financial.find((r: any) => r.type === 'co_financing');
          if (coFinancing) {
            eligibility_criteria.cofinancing_pct = typeof coFinancing.value === 'number' ? coFinancing.value : parseFloat(String(coFinancing.value)) || null;
          }
        }
        
        // Project requirements
        if (categorized_requirements.project) {
          const industry = categorized_requirements.project.find((r: any) => r.type === 'industry_focus');
          if (industry) eligibility_criteria.industry_focus = industry.value;
          
          const research = categorized_requirements.project.find((r: any) => r.type === 'research_focus');
          if (research) eligibility_criteria.research_focus = research.value;
        }
        
        // Technical requirements
        if (categorized_requirements.technical || categorized_requirements.trl_level) {
          const trl = (categorized_requirements.technical || []).find((r: any) => r.type === 'trl_level') ||
                     (categorized_requirements.trl_level || []).find((r: any) => r.type === 'trl_level');
          if (trl) eligibility_criteria.trl_level = trl.value;
        }
        
        // Consortium requirements
        if (categorized_requirements.consortium) {
          const collab = categorized_requirements.consortium.find((r: any) => r.type === 'international_collaboration');
          if (collab) eligibility_criteria.international_collaboration = collab.value;
        }
        
        // Impact requirements
        if (categorized_requirements.impact) {
          const impact = categorized_requirements.impact.find((r: any) => r.type === 'impact');
          if (impact) eligibility_criteria.impact = impact.value;
        }
        
        // Determine program type from funding_types or use query param
        const programType = (page.funding_types && page.funding_types.length > 0) 
          ? page.funding_types[0] 
          : (type as string) || 'grant';
        
        // Parse metadata_json if it's a string
        let metadata: {
          application_method?: string | null;
          requires_account?: boolean;
          form_fields?: Array<{name?: string, label?: string, required: boolean}>;
          [key: string]: any;
        } = {};
        try {
          metadata = typeof page.metadata_json === 'string' 
            ? JSON.parse(page.metadata_json) 
            : (page.metadata_json || {});
        } catch (e) {
          metadata = {};
        }

        const program: any = {
          id: `page_${page.id}`,
          name: page.title || page.url,
          type: programType,
          program_type: programType,
          description: page.description,
          funding_amount_min: page.funding_amount_min,
          funding_amount_max: page.funding_amount_max,
          currency: page.currency || 'EUR',
          source_url: page.url,
          url: page.url,
          deadline: page.deadline,
          open_deadline: page.open_deadline || false,
          contact_email: page.contact_email,
          contact_phone: page.contact_phone,
          requirements: {},
          eligibility_criteria, // Now properly derived from categorized_requirements
          categorized_requirements,
          notes: page.description,
          maxAmount: page.funding_amount_max || 0,
          minAmount: page.funding_amount_min || 0,
          link: page.url,
          region: page.region,
          funding_types: page.funding_types || [],
          program_focus: page.program_focus || [],
          scrapedAt: page.fetched_at,
          isActive: true,
          // Application method from metadata
          application_method: metadata.application_method || null,
          requires_account: metadata.requires_account || false,
          form_fields: metadata.form_fields || []
        };
        
        // Add enhanced fields if requested
        if (enhanced === 'true') {
          program.completenessScore = calculateCompletenessScore(program);
          program.fresh = isProgramFresh(program);
        }
        
        return program;
        } catch (pageError: any) {
          console.error(`Error processing page ${page.id}:`, pageError?.message || pageError);
          // Return a basic program structure even if requirements fail
          return {
            id: `page_${page.id}`,
            name: page.title || page.url,
            type: page.funding_types?.[0] || 'grant',
            program_type: page.funding_types?.[0] || 'grant',
            description: page.description,
            funding_amount_max: page.funding_amount_max,
            currency: page.currency || 'EUR',
            source_url: page.url,
            url: page.url,
            deadline: page.deadline,
            open_deadline: page.open_deadline || false,
            contact_email: page.contact_email,
            contact_phone: page.contact_phone,
            requirements: {},
            eligibility_criteria: {},
            categorized_requirements: {},
            notes: page.description,
            maxAmount: page.funding_amount_max || 0,
            minAmount: page.funding_amount_min || 0,
            link: page.url,
            region: page.region,
            funding_types: page.funding_types || [],
            program_focus: page.program_focus || [],
            scrapedAt: page.fetched_at,
            isActive: true
          };
        }
      }));
      
      // Filter by type if specified
      const filteredPrograms = type 
        ? programs.filter((p: any) => p.type === type || (p.funding_types && p.funding_types.includes(type)))
        : programs;
      
      const overallCompletenessScore = enhanced === 'true' && filteredPrograms.length > 0
        ? Math.round(filteredPrograms.reduce((sum: number, p: any) => sum + (p.completenessScore || 0), 0) / filteredPrograms.length)
        : 0;
      
      console.log(`✅ Returning ${filteredPrograms.length} programs from database`);
      
      return res.status(200).json({
        success: true,
        programs: filteredPrograms,
        count: filteredPrograms.length,
        total: filteredPrograms.length,
        message: `Found ${filteredPrograms.length} programs from NEON database`,
        source: 'database',
        completenessScore: enhanced === 'true' ? overallCompletenessScore : undefined,
        fresh: enhanced === 'true' ? filteredPrograms.some((p: any) => p.fresh) : undefined,
        timestamp: new Date().toISOString(),
      });
    } catch (dbError: any) {
      console.warn('⚠️ NEON database query failed, using fallback data...');
      console.warn('   Error type:', dbError?.constructor?.name || 'Unknown');
      console.warn('   Error message:', dbError?.message || String(dbError));
      console.warn('   Full error:', JSON.stringify(dbError, Object.getOwnPropertyNames(dbError)));
      
      // Provide specific diagnostics
      if (dbError?.message?.includes('Cannot find module') || dbError?.message?.includes('Failed to load')) {
        console.error('❌ CRITICAL: Database module loading failed.');
        console.error('   Possible fixes:');
        console.error('   1. Restart Next.js dev server (npm run dev)');
        console.error('   2. Check that scraper-lite/src/db/*.ts files exist');
        console.error('   3. Verify tsconfig.json includes scraper-lite directory');
      } else if (dbError?.message?.includes('DATABASE_URL')) {
        console.error('❌ CRITICAL: DATABASE_URL not configured.');
        console.error('   Add DATABASE_URL to .env.local file');
      } else if (dbError?.message?.includes('connection') || dbError?.message?.includes('ECONNREFUSED') || dbError?.code === 'ECONNREFUSED') {
        console.error('❌ CRITICAL: Database connection failed.');
        console.error('   Check DATABASE_URL and network connectivity');
        console.error('   Connection string:', process.env.DATABASE_URL ? 'Set' : 'NOT SET');
      } else if (dbError?.stack) {
        console.warn('   Stack trace:', dbError.stack.split('\n').slice(0, 5).join('\n'));
      }
      
      // Fall through to fallback data
      // Don't re-throw, let it fall through to fallback
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
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      type: typeof error
    });
    
    // Try to return fallback data even on error
    try {
      const fallbackPrograms = getFallbackData();
      if (fallbackPrograms.length > 0) {
        console.log(`⚠️ Using fallback data (${fallbackPrograms.length} programs) due to error`);
        return res.status(200).json({
          success: true,
          programs: fallbackPrograms,
          count: fallbackPrograms.length,
          message: `Found ${fallbackPrograms.length} programs from fallback data (error occurred)`,
          source: 'fallback',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    } catch (fallbackError) {
      console.error('Fallback data also failed:', fallbackError);
    }
    
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined
    });
  }
}

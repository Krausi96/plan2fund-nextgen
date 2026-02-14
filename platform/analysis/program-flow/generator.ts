/**
 * STRUCTURE GENERATION UTILITIES
 * 
 * Contains functions for generating DocumentStructures from program data.
 */

// @ts-ignore - Legacy code with evolved API
import type { FundingProgram, DocumentStructure } from '@/platform/core/types';
import { callAI } from '@/platform/ai/orchestrator';

// ============================================================================
// FEATURE FLAG & CACHE
// ============================================================================

// Feature flag: enable/disable requirement enrichment
const ENABLE_REQUIREMENT_ENRICHMENT = true;

// Cache for enriched requirements by program ID (avoids repeated LLM calls)
const requirementCache = new Map<string, Record<string, any[]>>();

// ============================================================================
// REQUIREMENT ENRICHMENT
// ============================================================================

/**
 * Generate all section requirements in one LLM call
 * Uses section IDs as keys (not titles) to avoid translation/edit issues
 * Returns map of section ID → requirement arrays
 */
export async function enrichAllSectionRequirementsAtOnce(
  sections: any[],
  program: any
): Promise<Record<string, any[]>> {
  // Check cache first (by program ID)
  const cacheKey = program.id || `program_${Date.now()}`;
  if (requirementCache.has(cacheKey)) {
    console.log(`[enrichRequirements] Cache HIT for program: ${program.name}`);
    return requirementCache.get(cacheKey) || {};
  }

  // Build section list for prompt (use IDs, not titles)
  const sectionsList = sections
    .filter(s => !s.title.includes('Introduction to')) // Skip placeholders
    .map(s => `id: ${s.id} | title: ${s.title}`)
    .join('\n');

  if (!sectionsList) {
    console.log('[enrichRequirements] No sections to enrich');
    return {};
  }

  console.log(`[enrichRequirements] Calling LLM for program: ${program.name}, type: ${program.type}`);
  
  // Debug: Check environment variables availability
  console.log("LLM config check", {
    hasOpenAI: !!process.env.OPENAI_API_KEY,
    hasCustomEndpoint: !!process.env.CUSTOM_LLM_ENDPOINT,
    hasCustomKey: !!process.env.CUSTOM_LLM_API_KEY,
    hasCustomProvider: !!process.env.CUSTOM_LLM_PROVIDER
  });

  // Generate different prompts based on type
  // Prompt is now built via the API call to the server endpoint

  try {
    // Debug: Check environment variables availability
    console.log("LLM config check", {
      hasOpenAI: !!process.env.OPENAI_API_KEY,
      hasCustomEndpoint: !!process.env.CUSTOM_LLM_ENDPOINT,
      hasCustomKey: !!process.env.CUSTOM_LLM_API_KEY,
      hasCustomProvider: !!process.env.CUSTOM_LLM_PROVIDER
    });

    // Sanitize data to prevent JSON serialization issues
    const sanitizeString = (input: any): any => {
      if (typeof input !== 'string') return input;
      try {
        // Properly escape all special characters for JSON
        return JSON.stringify(input).slice(1, -1); // Remove surrounding quotes from JSON string
      } catch (e) {
        // Fallback sanitization
        return input
          .replace(/[\x00-\x1f\x7f]/g, '') // Remove control characters
          .replace(/"/g, '') // Remove quotes that might break JSON
          .replace(/\\/g, '') // Remove backslashes
          .substring(0, 1000); // Limit length
      }
    };
    
    // Deep sanitize the program data
    const sanitizedProgram = {
      ...program,
      name: sanitizeString(program.name),
      type: sanitizeString(program.type),
      id: sanitizeString(program.id),
      // Sanitize other string properties if they exist
      ...Object.fromEntries(
        Object.entries(program)
          .filter(([_, value]) => typeof value === 'string')
          .map(([key, value]) => [key, sanitizeString(value)])
      ),
    };
    
    // Deep sanitize the sections data - ONLY SEND TITLES AND IDS, NOT FULL CONTENT
    const sanitizedSections = sections.map((section: any) => ({
      id: sanitizeString(section.id),
      title: sanitizeString(section.title),
      // DO NOT send content to avoid massive prompts - only send essential data
      requirements: Array.isArray(section.requirements) ? section.requirements : [],
      // Sanitize any other string properties
      ...Object.fromEntries(
        Object.entries(section)
          .filter(([key, value]) => key !== 'id' && key !== 'title' && key !== 'content' && key !== 'requirements' && typeof value === 'string')
          .map(([key, value]) => [key, sanitizeString(value)])
      ),
    }));
    
    // Prepare the sanitized data to send
    const requestData = { program: sanitizedProgram, sections: sanitizedSections };
    
    // Validate that we can serialize the data to JSON
    let jsonString: string;
    try {
      jsonString = JSON.stringify(requestData);
    } catch (serializeError) {
      console.error('[enrichRequirements] Failed to serialize data to JSON:', serializeError);
      return {}; // Return empty map on error
    }
    
    // Call the unified server-side API to generate requirements
    // This ensures we have access to environment variables and proper LLM configuration
    const response = await fetch('/api/requirements/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sections: sanitizedSections,
        program: sanitizedProgram,
        type: 'funding'
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.warn('[enrichRequirements] API call failed:', errorData.error || response.statusText);
      return {}; // Return empty map on error (will use fallback)
    }
    
    const result = await response.json();
    const enrichedReqs = result.data;
    
    console.log("[enrichRequirements] Parsed requirements:", enrichedReqs);
    
    // Cache the result
    requirementCache.set(cacheKey, enrichedReqs);
    console.log(`[enrichRequirements] Generated and cached requirements for: ${program.name}`);
    
    return enrichedReqs;
  } catch (error) {
    console.warn('[enrichRequirements] LLM call failed:', error instanceof Error ? error.message : String(error));
    return {}; // Return empty map on error (will use fallback)
  }
}

/**
 * Create deterministic fallback requirements (never return empty)
 * Ensures AI assistant always has guidance even if enrichment fails
 */
export function createFallbackRequirements(): any[] {
  return [
    {
      id: `req_fallback_clarity`,
      category: 'general',
      title: 'Clear Objectives & Scope',
      description: 'Clearly define what you are proposing and why it matters to the funder',
      priority: 'high',
      examples: []
    },
    {
      id: `req_fallback_feasibility`,
      category: 'general',
      title: 'Feasibility & Realistic Approach',
      description: 'Show your plan is achievable with adequate resources and team capability',
      priority: 'high',
      examples: []
    },
    {
      id: `req_fallback_metrics`,
      category: 'general',
      title: 'Key Metrics & Evidence',
      description: 'Include data, KPIs, and evidence supporting your claims and assumptions',
      priority: 'medium',
      examples: []
    }
  ];
}

// DEPRECATED: generateDocumentStructureFromProfile removed - use buildDocumentStructure instead

// ============================================================================
// FUNDING OVERLAY (merge funding requirements into existing structure)
// ============================================================================

/**
 * Overlay funding program requirements onto an existing DocumentStructure.
 * Used when user connects a funding program AFTER uploading/starting a document.
 *
 * DO NOT regenerate structure - only merge requirements.
 *
 * @param existingStructure - DocumentStructure with generic requirements
 * @param fundingProgram - FundingProgram with funding-specific requirements
 * @returns Updated DocumentStructure with funding requirements overlaid
 */
export async function overlayFundingRequirements(
  existingStructure: any,
  fundingProgram: any
): Promise<{
  structure: any;
  addedSections: string[];
  gapAnalysis: { section: string; missing: string[] }[];
}> {
  console.log(`[overlayFunding] Overlaying requirements for program: ${fundingProgram.name}`);

  const addedSections: string[] = [];
  const gapAnalysis: { section: string; missing: string[] }[] = [];

  // Get funding-specific requirements from program
  const fundingSections = fundingProgram.applicationRequirements?.sections || [];
  
  // Create a map of existing section titles for matching
  const existingSectionMap = new Map<
    string,
    { section: any; requirements: any[] }
  >();

  existingStructure.sections.forEach((section: any) => {
    const key = section.title.toLowerCase().trim();
    existingSectionMap.set(key, {
      section,
      requirements: section.requirements || []
    });
  });
  
  // Generate funding requirements dynamically using the existing function
  // This handles cases where funding programs don't have predefined requirements
  console.log(`[overlayFunding] Generating funding requirements for program:`, {
    name: fundingProgram.name,
    type: fundingProgram.type,
    id: fundingProgram.id,
    applicationRequirements: fundingProgram.applicationRequirements?.sections?.length
  });
  
  const generatedFundingRequirements = await enrichAllSectionRequirementsAtOnce(
    existingStructure.sections, 
    fundingProgram
  );
  
  console.log(`[overlayFunding] Generated funding requirements for ${Object.keys(generatedFundingRequirements).length} sections`, generatedFundingRequirements);
  
  // Debug: check if sections have proper IDs
  console.log(`[overlayFunding] Section IDs in structure:`, existingStructure.sections.map((s: any) => ({id: s.id, title: s.title})));
  
  // Process each existing section - apply relevant funding requirements
  const updatedSections = existingStructure.sections.map((section: any) => {
    // Get dynamically generated funding requirements for this section
    const sectionGeneratedReqs = generatedFundingRequirements[section.id] || [];
    
    // Convert generated requirements to proper format
    const generatedFundingReqs = sectionGeneratedReqs.map((req: any, idx: number) => ({
      id: `funding_gen_${section.id}_${idx}`,
      category: req.category || 'funding',
      title: req.title || req.description || `Funding requirement: ${req.title || 'General requirement'}`,
      description: req.description || `Funding requirement from ${fundingProgram.name}`,
      priority: req.priority || 'high',
      examples: req.examples || [],
      source: 'funding-generated'
    }));
    
    // Also incorporate any existing funding requirements from the program
    const allFundingReqs: any[] = [...generatedFundingReqs];
    
    // Add any predefined funding requirements from the program
    for (const fundingSection of fundingSections) {
      if (fundingSection.requirements && fundingSection.requirements.length > 0) {
        const sectionFundingReqs = fundingSection.requirements.map((req: any, idx: number) => ({
          id: `funding_${section.id}_${fundingSection.title.substring(0, 10).replace(/[^a-zA-Z0-9]/g, '')}_${idx}`,
          category: req.category || 'funding',
          title: req.title || req.description || `Funding requirement: ${req.title || 'General requirement'}`,
          description: req.description || `Funding requirement from ${fundingProgram.name} for ${fundingSection.title}`,
          priority: req.priority || 'high',
          examples: req.examples || [],
          source: 'funding-overlay'
        }));
        
        allFundingReqs.push(...sectionFundingReqs);
      }
    }
    
    // Combine existing requirements with funding requirements
    const existingRequirements = section.requirements || [];
    
    // Mark existing requirements as generic
    const genericReqs = existingRequirements.map((req: any) => ({
      ...req,
      source: req.source || 'generic'
    }));
    
    // Combine all requirements
    const combinedRequirements = [...genericReqs, ...allFundingReqs];
    
    console.log(`[overlayFunding] ${section.title}: merged ${allFundingReqs.length} funding + ${genericReqs.length} generic requirements = ${combinedRequirements.length} total`);
    
    return {
      ...section,
      requirements: combinedRequirements
    };
  });

  // Find and add MISSING sections required by funding program
  fundingSections.forEach((fundingSection: any) => {
    const key = fundingSection.title.toLowerCase().trim();
    const exists = existingSectionMap.has(key);

    if (!exists) {
      // Add missing section
      const newSection = {
        id: `sec_missing_${fundingSection.title.replace(/\s+/g, '_').toLowerCase()}`,
        documentId: existingStructure.documents[0]?.id || 'main_document',
        title: fundingSection.title,
        type: fundingSection.required ? 'required' as const : 'optional' as const,
        required: fundingSection.required || false,
        programCritical: true,
        content: '',
        requirements: (fundingSection.requirements || []).map((req: any, idx: number) => ({
          id: `funding_missing_${idx}`,
          category: req.category || 'funding',
          title: req.title || req.description || '',
          description: req.description || `Required for ${fundingProgram.name}`,
          priority: req.priority || 'high',
          examples: req.examples || [],
          source: 'funding-added'
        }))
      };

      updatedSections.push(newSection);
      addedSections.push(fundingSection.title);

      // Track gap
      gapAnalysis.push({
        section: fundingSection.title,
        missing: ['Section was missing from uploaded document - added']
      });

      console.log(`[overlayFunding] Added missing section: ${fundingSection.title}`);
    }
  });

  // Update the structure
  const updatedStructure = {
    ...existingStructure,
    sections: updatedSections,
    metadata: {
      ...existingStructure.metadata,
      source: 'overlay',
      fundingProgramId: fundingProgram.id,
      fundingProgramName: fundingProgram.name,
      overlaidAt: new Date().toISOString(),
      genericRequirementsCount: updatedSections.reduce(
        (sum, s) => sum + (s.requirements?.filter((r: any) => r.source === 'generic' || !r.source).length || 0),
        0
      ),
      fundingRequirementsCount: updatedSections.reduce(
        (sum, s) => sum + (s.requirements?.filter((r: any) => r.source?.includes('funding')).length || 0),
        0
      )
    }
  };

  console.log(`[overlayFunding] Complete: ${addedSections.length} sections added, overlay finished`);

  return {
    structure: updatedStructure,
    addedSections,
    gapAnalysis
  };
}

/**
 * Check if a DocumentStructure already has funding requirements overlaid
 */
export function hasFundingOverlay(structure: any): boolean {
  return structure.metadata?.source === 'overlay' ||
    !!structure.metadata?.fundingProgramId;
}

/**
 * Get funding program info from structure if overlaid
 */
export function getFundingOverlayInfo(structure: any): {
  programId: string;
  programName: string;
  overlaidAt: string;
} | null {
  if (!hasFundingOverlay(structure)) return null;

  return {
    programId: structure.metadata.fundingProgramId,
    programName: structure.metadata.fundingProgramName,
    overlaidAt: structure.metadata.overlaidAt
  };
}

/**
 * STRUCTURE GENERATION UTILITIES
 * 
 * Contains functions for generating DocumentStructures from program data.
 */

// @ts-ignore - Legacy code with evolved API
import type { FundingProgram, DocumentStructure } from '@/platform/core/types';
import { callLLM } from '@/platform/ai/llmClient';

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

  // Generate different prompts based on type
  const isGeneric = program.type === 'generic';

  const prompt = isGeneric
    ? `Generate quality requirements for improving these sections of a document.

Document: ${program.name}

Sections (use section IDs as keys in response):
${sectionsList}

For EACH section, provide 3-4 key quality criteria for excellent document writing.

JSON FORMAT (return exactly this structure, use section IDs as keys):
{
  "section_id_1": [
    {"title": "Clarity requirement", "description": "Clear communication", "priority": "high"},
    {"title": "Evidence requirement", "description": "Support claims", "priority": "high"}
  ],
  "section_id_2": [
    {"title": "...", "description": "...", "priority": "..."}
  ]
}

Return ONLY valid JSON. No other text.`
    : `Generate funding application requirements for these sections of a ${program.type || 'grant'} application.

Program: ${program.name}

Sections (use section IDs as keys in response):
${sectionsList}

For EACH section, provide 3-4 key requirements that funders evaluate.

JSON FORMAT (return exactly this structure, use section IDs as keys):
{
  "section_id_1": [
    {"title": "Requirement title", "description": "Why this matters", "priority": "high"},
    {"title": "Second requirement", "description": "Explanation", "priority": "high"}
  ],
  "section_id_2": [
    {"title": "...", "description": "...", "priority": "..."}
  ]
}

Return ONLY valid JSON. No other text.`;

  try {
    const response = await callLLM({
      messages: [
        {
          role: 'system',
          content: 'You are a funding expert. Generate precise, concise funding requirements for grant applications. Return only JSON.'
        },
        { role: 'user', content: prompt }
      ],
      responseFormat: 'json',
      temperature: 0.2,
      maxTokens: 1200
    });

    const enrichedReqs = JSON.parse(response.output);
    
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

/**
 * Generate DocumentStructure from FundingProgram
 * Creates complete document structure for generation
 * 
 * @ts-ignore - Type mismatches due to FundingProgram API evolution
 */
export async function generateDocumentStructureFromProfile(profile: any): Promise<any> {
  // Generate documents from parsed requirements
  const documents = profile.applicationRequirements.documents.length > 0 
    ? profile.applicationRequirements.documents.map((doc, index) => ({
        id: `doc_${index}_${doc.document_name.replace(/\s+/g, '_').toLowerCase()}`,
        name: doc.document_name,
        purpose: `Required for ${profile.name}`,
        required: doc.required,
        templateId: doc.format === 'pdf' ? 'pdf_template' : 'default_template'
      }))
    : [{
        id: 'main_document',
        name: `${profile.name} Application`,
        purpose: `Main document for ${profile.name}`,
        required: true
      }];

  // Determine the primary document ID for sections
  const primaryDocumentId = documents[0].id;
  
  // Generate sections from parsed requirements
  let sections = profile.applicationRequirements.sections.map((section, sectionIndex) => {
    // Create subsections for this section (optional, may be undefined)
    const rawSubsections = (section.subsections || []).map((subsection, subIndex) => ({
      id: `subsec_${sectionIndex}_${subIndex}_${subsection.title.replace(/\s+/g, '_').toLowerCase()}`,
      title: subsection.title,
      rawText: '' // Initially empty, will be filled by the AI or user
    }));
    
    // Generate requirements owned by this section (OPTION A - requirements attached to section)
    const sectionRequirements = (section.requirements || []).map((req, reqIndex) => ({
      id: `req_section_${sectionIndex}_${reqIndex}`,
      category: req.category || 'market',
      title: req.title || req.description || '',
      description: req.description || '',
      priority: req.priority || 'high',
      examples: req.examples || []
    }));
    
    // Determine appropriate document for this section based on content
    let sectionDocumentId = primaryDocumentId; // Default to primary document
    
    // Map sections to appropriate documents based on keywords and business logic
    const sectionLower = section.title.toLowerCase();
    
    // Try to find a document that matches the section content
    if (sectionLower.includes('financial') || sectionLower.includes('finance')) {
      // Try to find Financial Statements document
      const financialDoc = documents.find(doc => 
        doc.name.toLowerCase().includes('financial') || 
        doc.name.toLowerCase().includes('statement')
      );
      if (financialDoc) {
        sectionDocumentId = financialDoc.id;
      }
    } else if (sectionLower.includes('project') || sectionLower.includes('business') || sectionLower.includes('description')) {
      // Try to find Business Plan document
      const businessPlanDoc = documents.find(doc => 
        doc.name.toLowerCase().includes('business') || 
        doc.name.toLowerCase().includes('plan')
      );
      if (businessPlanDoc) {
        sectionDocumentId = businessPlanDoc.id;
      }
    } else if (sectionLower.includes('market') || sectionLower.includes('competition')) {
      // Try to find a suitable document for market sections
      const marketDoc = documents.find(doc => 
        doc.name.toLowerCase().includes('business') || 
        doc.name.toLowerCase().includes('plan') ||
        doc.name.toLowerCase().includes('marketing')
      );
      if (marketDoc) {
        sectionDocumentId = marketDoc.id;
      }
    } else if (sectionLower.includes('team') || sectionLower.includes('qualification') || sectionLower.includes('personnel')) {
      // Team sections often go in business plan
      const businessPlanDoc = documents.find(doc => 
        doc.name.toLowerCase().includes('business') || 
        doc.name.toLowerCase().includes('plan')
      );
      if (businessPlanDoc) {
        sectionDocumentId = businessPlanDoc.id;
      }
    } else if (sectionLower.includes('innovation') || sectionLower.includes('technology') || sectionLower.includes('patent')) {
      // Innovation sections might go in proof of innovation or business plan
      const innovationDoc = documents.find(doc => 
        doc.name.toLowerCase().includes('innovation') || 
        doc.name.toLowerCase().includes('patent') ||
        doc.name.toLowerCase().includes('technical')
      );
      if (innovationDoc) {
        sectionDocumentId = innovationDoc.id;
      } else {
        // Default to business plan if no specific innovation document
        const businessPlanDoc = documents.find(doc => 
          doc.name.toLowerCase().includes('business') || 
          doc.name.toLowerCase().includes('plan')
        );
        if (businessPlanDoc) {
          sectionDocumentId = businessPlanDoc.id;
        }
      }
    } else if (sectionLower.includes('objective') || sectionLower.includes('goal') || sectionLower.includes('summary')) {
      // Executive summaries and objectives often go in business plan
      const businessPlanDoc = documents.find(doc => 
        doc.name.toLowerCase().includes('business') || 
        doc.name.toLowerCase().includes('plan')
      );
      if (businessPlanDoc) {
        sectionDocumentId = businessPlanDoc.id;
      }
    }
    
    // If no specific document found and we have a business plan document, default to business plan
    // Otherwise, fall back to primary document
    if (sectionDocumentId === primaryDocumentId) {
      const businessPlanDoc = documents.find(doc => 
        doc.name.toLowerCase().includes('business') || 
        doc.name.toLowerCase().includes('plan')
      );
      if (businessPlanDoc) {
        sectionDocumentId = businessPlanDoc.id;
      }
    }
    
    // OPTION A: Requirements owned directly by section
    return {
      id: `sec_${sectionIndex}_${section.title.replace(/\s+/g, '_').toLowerCase()}`,
      documentId: sectionDocumentId, // Associate section with appropriate document
      title: section.title,
      type: section.required ? 'required' : 'optional' as 'required' | 'optional' | 'conditional',
      required: section.required,
      programCritical: true,
      content: '',
      aiGuidance: [],
      // OPTION A: Requirements owned directly by section (not at DocumentStructure level)
      requirements: sectionRequirements,
      // Preserve subsections
      rawSubsections: rawSubsections
    };
  });
  
  // ============================================================================
  // ENRICH SECTION REQUIREMENTS (if enabled)
  // ============================================================================
  
  if (ENABLE_REQUIREMENT_ENRICHMENT) {
    console.log('[enrichRequirements] Starting requirement enrichment for program:', profile.name);
    
    const enrichedRequirements = await enrichAllSectionRequirementsAtOnce(sections, profile);
    
    sections = sections.map((section) => {
      // Skip enrichment if already has requirements
      if (section.requirements && section.requirements.length > 0) {
        console.log(`[enrichRequirements] ${section.title}: already has ${section.requirements.length} requirements, skipping enrichment`);
        return section;
      }
      
      // Skip special/placeholder sections - but still give them fallback requirements
      if (section.title.includes('Introduction to')) {
        // Placeholder sections still need requirements for AI assistant
        return {
          ...section,
          requirements: section.requirements && section.requirements.length > 0 
            ? section.requirements 
            : createFallbackRequirements()
        };
      }
      
      // Get enriched requirements from map using section ID (not title)
      const enrichedReqs = enrichedRequirements[section.id] || [];
      
      // Map to requirement format
      const formattedReqs = enrichedReqs.length > 0
        ? enrichedReqs.map((req: any, idx: number) => ({
            id: `req_${section.id}_${idx}`,
            category: req.category || 'general',
            title: req.title || '',
            description: req.description || '',
            priority: req.priority || 'high',
            examples: req.examples || []
          }))
        : createFallbackRequirements(); // Fallback if LLM returns nothing
      
      console.log(`[enrichRequirements] ${section.title}: assigned ${formattedReqs.length} requirements (${enrichedReqs.length > 0 ? 'from LLM' : 'fallback'})`);
      
      return {
        ...section,
        requirements: formattedReqs
      };
    });
  }
  
  // After initial assignment, handle empty documents without disrupting semantic assignments
  const documentIds = documents.map(doc => doc.id);
  if (documentIds.length > 1 && sections.length > 0) {
    // Group sections by document to identify empty documents
    const sectionsByDocument: Record<string, any[]> = {};
    documentIds.forEach(id => sectionsByDocument[id] = []);
    
    sections.forEach(section => {
      if (sectionsByDocument[section.documentId]) {
        sectionsByDocument[section.documentId].push(section);
      } else {
        // If section doesn't match any known document, assign to first document
        sectionsByDocument[documentIds[0]].push(section);
      }
    });
    
    // Identify documents with no sections
    const emptyDocuments = documentIds.filter(id => sectionsByDocument[id].length === 0);
    
    // Only add placeholder sections to truly empty documents without disturbing semantic assignments
    if (emptyDocuments.length > 0) {
      // For each empty document, add a placeholder section if needed
      emptyDocuments.forEach(emptyDocId => {
        const emptyDoc = documents.find(doc => doc.id === emptyDocId);
        if (emptyDoc) {
          // Add a placeholder section that makes sense for this document type
          const placeholderSection = {
            id: `placeholder_${emptyDocId}_intro`,
            documentId: emptyDocId,
            title: `Introduction to ${emptyDoc.name}`,
            type: 'optional' as const,
            required: false,
            programCritical: false,
            content: '',
            aiGuidance: [],
            // Placeholder sections also need fallback requirements
            requirements: createFallbackRequirements(),
            rawSubsections: []
          };
          
          // Add the placeholder section to the sections array
          sections.push(placeholderSection);
        }
      });
    }
  }
  
  // Generate validation rules (not tied to specific sections)
  const validationRules = [
    // Presence validation for required documents
    ...profile.applicationRequirements.documents.filter(doc => doc.required).map((doc, index) => ({
      id: `val_doc_presence_${index}`,
      type: 'presence' as const,
      sectionId: '', // Document-level rule
      rule: `${doc.document_name} is required and must be submitted`,
      severity: 'error' as const
    })),
    // Financial statement validation
    ...(profile.applicationRequirements.financialRequirements?.financial_statements_required || []).map((stmt, index) => ({
      id: `val_financial_${index}`,
      type: 'presence' as const,
      sectionId: '', // Document-level rule
      rule: `${stmt} statement is required for financial evaluation`,
      severity: 'error' as const
    }))
  ];
  
  // Generate AI guidance (per-section)
  const aiGuidance = sections.map(section => ({
    sectionId: section.id,
    prompt: `Write professional content for ${section.title}`,
    checklist: [`Cover all ${section.title} aspects`, `Maintain professional tone`],
    examples: [`Example content for ${section.title}...`]
  }));
  
  // ============================================================================
  // VALIDATION LOGGING
  // ============================================================================
  
  console.log('[VALIDATION] Document structure generated:');
  sections.forEach(section => {
    const reqCount = section.requirements?.length || 0;
    const hasEmpty = reqCount === 0 && !section.title.includes('Introduction to');
    console.log(`  - ${section.title}: ${reqCount} requirements${hasEmpty ? ' ⚠️ WARNING: EMPTY!' : ''}`);
  });
  
  // OPTION A: No global requirements array anymore
  // Requirements are owned by sections directly
  return {
    structureId: `structure_${profile.id}_${Date.now()}`,
    version: '1.0',
    source: 'program' as const,
    documents,
    sections, // Each section now contains its own requirements array
    // NO requirements array here - moved to section level
    validationRules,
    aiGuidance,
    renderingRules: {
      titlePage: { includeLogo: true, includeDate: true },
      tableOfContents: { autoGenerate: true },
      references: { citationStyle: 'APA' },
      appendices: { autoNumber: true }
    },
    conflicts: [],
    warnings: profile.applicationRequirements.documents.some(doc => !doc.reuseable) ?
      ['Some documents cannot be reused for other applications'] : [],
    confidenceScore: profile.applicationRequirements.documents.length > 0 &&
                    profile.applicationRequirements.sections.length > 0 ? 90 : 60,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'program_utils'
  };
}

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
export function overlayFundingRequirements(
  existingStructure: any,
  fundingProgram: any
): {
  structure: any;
  addedSections: string[];
  gapAnalysis: { section: string; missing: string[] }[];
} {
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

  // Process each funding section
  const updatedSections = existingStructure.sections.map((section: any) => {
    const key = section.title.toLowerCase().trim();
    const existing = existingSectionMap.get(key);

    if (existing) {
      // Find matching funding section
      const fundingSection = fundingSections.find(
        (fs: any) => fs.title.toLowerCase().trim() === key
      );

      if (fundingSection?.requirements && fundingSection.requirements.length > 0) {
        // Merge funding requirements with existing generic ones
        const fundingReqs = fundingSection.requirements.map((req: any, idx: number) => ({
          id: `funding_${section.id}_${idx}`,
          category: req.category || 'funding',
          title: req.title || req.description || '',
          description: req.description || `Funding requirement: ${req.title}`,
          priority: req.priority || 'high',
          examples: req.examples || [],
          source: 'funding-overlay'
        }));

        // Mark existing requirements as non-funding
        const genericReqs = existing.requirements.map((req: any) => ({
          ...req,
          source: req.source || 'generic'
        }));

        console.log(`[overlayFunding] ${section.title}: merged ${fundingReqs.length} funding + ${genericReqs.length} generic requirements`);

        return {
          ...section,
          requirements: [...genericReqs, ...fundingReqs]
        };
      }

      return section; // No funding requirements for this section
    }

    return section;
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

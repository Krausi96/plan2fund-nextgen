/**
 * STRUCTURE BUILDER - THE CRITICAL CONVERGENCE POINT
 * 
 * Unified document structure generation from EITHER:
 * 1. FundingProgram (from program selection flow)
 * 2. ParsedDocumentData (from document upload/template flow)
 * 
 * Resolves dual-flow conflicts:
 * - Section-to-document mapping: ONE unified semantic algorithm
 * - Special section detection: Canonical IDs from documentParser
 * - Section ordering: Memory-aware constraints (e.g., "Introduction to Application Form" last)
 * 
 * Output: Complete DocumentStructure for all downstream consumers
 */

import type {
  DocumentStructure,
  Document,
  Section,
  Requirement,
  // ValidationRule, // REMOVED - legacy
  // AIGuidance, // REMOVED - legacy
  RenderingRules,
  FundingProgram,
  ProjectProfile,
} from '@/platform/core/types';
import { enrichAllSectionRequirementsAtOnce, createFallbackRequirements } from '@/platform/analysis/program-flow/generator';
import type {
  ParsedDocumentData,
  DetectionMap,
  SectionDetection,
  SpecialSection,
} from '@/platform/core/types/project';

/**
 * MAIN ENTRY POINT: Build complete DocumentStructure
 * 
 * @param source - Either FundingProgram or ParsedDocumentData
 * @param detectionResults - Optional detection map (used for program path)
 * @param options - Configuration options
 * @returns Complete DocumentStructure with all derived properties
 */
export async function buildDocumentStructure(
  params: {
    projectProfile?: ProjectProfile;
    fundingProgram?: FundingProgram;
    parsedDocument?: ParsedDocumentData;
    templateSections?: Array<{ id: string; title: string; required?: boolean; [key: string]: any }>;
    productType?: 'submission' | 'strategy';
    documentName?: string;
    // Overlay mode - merge funding requirements into existing structure
    existingStructure?: DocumentStructure;
  },
  detectionResults?: DetectionMap,
  options?: {
    includeSpecialSections?: boolean;
    applyOrdering?: boolean;
  }
): Promise<DocumentStructure> {
  const opts = {
    includeSpecialSections: true,
    applyOrdering: true,
    ...options,
  };

  // Route to appropriate builder based on provided parameters
  if (params.existingStructure && params.fundingProgram) {
    // Overlay mode - merge funding requirements into existing structure
    return await buildOverlay(params.existingStructure, params.fundingProgram, opts);
  } else if (params.templateSections && params.productType && params.documentName) {
    // Template/Free flow
    return buildFromTemplate(params.templateSections, params.productType, params.documentName);
  } else if (params.fundingProgram) {
    // Program flow
    return await buildFromProgram(params.fundingProgram, detectionResults, opts);
  } else if (params.parsedDocument) {
    // Upload flow
    return buildFromDocument(params.parsedDocument, opts);
  } else {
    throw new Error('Invalid parameters: must provide either templateSections+productType+documentName, fundingProgram, or parsedDocument');
  }
}

/**
 * Build DocumentStructure from template sections (MASTER_SECTIONS).
 * 
 * This is the SOLE way to create a document structure from templates.
 * Ensures canonical ordering and memory constraints are applied.
 * 
 * @param templateSections - Sections from MASTER_SECTIONS
 * @param productType - Product type ('submission' | 'strategy')
 * @param documentName - Name for the main document
 * @returns DocumentStructure with canonical ordering applied
 */
export function buildFromTemplate(
  templateSections: Array<{ id: string; title: string; required?: boolean; [key: string]: any }>,
  productType: 'submission' | 'strategy',
  documentName: string
): DocumentStructure {
  // Convert template sections to DocumentStructure sections
  const sections = templateSections.map((template) => ({
    id: template.id,
    title: template.title,
    required: template.required ?? true,
    source: 'template' as const,
    requirements: [],
  }));

  const structure: DocumentStructure = {
    documents: [
      {
        id: 'main_document',
        name: documentName,
        purpose: productType === 'submission' ? 'Business plan document' : 'Strategy document',
        required: true,
        type: 'template',
      },
    ],
    sections,
    renderingRules: {},
    metadata: {
      source: 'template',
      createdAt: new Date().toISOString(),
    },
  };

  return structure;
}

/**
 * Build from FundingProgram (program selection flow)
 */
async function buildFromProgram(
  program: FundingProgram,
  detectionResults?: DetectionMap,
  options?: any
): Promise<DocumentStructure> {
  // 1. Create base structure from program
  let structure: DocumentStructure = {
    documents: createDocumentsFromProgram(program),
    sections: createSectionsFromProgram(program),
    renderingRules: generateRenderingRules(detectionResults),
    metadata: {
      source: 'program',
      createdAt: new Date().toISOString(),
    },
  };

  // 2. Apply unified section-to-document mapping
  mapSectionsToDocuments(structure);

  // 3. Apply unified special section detection
  if (options?.includeSpecialSections && detectionResults) {
    applySpecialSectionDetection(structure, detectionResults);
  }

  // 4. Apply unified memory-aware section ordering
  if (options?.applyOrdering) {
    applySectionOrdering(structure);
  }

  // 5. Finalize requirements using the single canonical function
  structure = await finalizeSectionRequirements(structure, program);

  return structure;
}

/**
 * Build from ParsedDocumentData (document upload/template flow)
 */
function buildFromDocument(
  parsedData: ParsedDocumentData,
  options?: any
): DocumentStructure {
  const structure = { ...parsedData.structure };

  // 1. Ensure documents have proper IDs
  if (!structure.documents.length) {
    structure.documents.push({
      id: 'main_document',
      name: parsedData.metadata.fileName || 'Document',
      purpose: 'Primary document',
      required: true,
      type: 'core',
    });
  }

  // 2. Assign sections to documents (unified semantic strategy)
  mapSectionsToDocuments(structure);

  // 3. Apply detection results for special sections
  if (options?.includeSpecialSections && parsedData.detection) {
    applySpecialSectionDetection(structure, parsedData.detection);
  }

  // 4. Apply memory-aware ordering
  if (options?.applyOrdering) {
    applySectionOrdering(structure);
  }

  // 5. Update metadata
  structure.metadata = {
    source: 'upload',
    createdAt: new Date().toISOString(),
  };

  return structure;
}

/**
 * CONFLICT RESOLUTION 1: Unified Section-to-Document Mapping
 * 
 * Semantic analysis of section titles against document purposes
 * Creates intelligent mappings for both sources identically
 */
function mapSectionsToDocuments(structure: DocumentStructure): void {
  const mainDoc = structure.documents[0];
  if (!mainDoc) return;

  const sectionKeywords = {
    financial: ['financial', 'budget', 'forecast', 'cash flow', 'balance sheet', 'p&l', 'profit'],
    market: ['market', 'industry', 'competitor', 'analysis', 'potential', 'opportunity', 'swot'],
    team: ['team', 'management', 'experience', 'cv', 'credentials', 'organization', 'personnel'],
    operational: ['operation', 'production', 'process', 'supply', 'logistics', 'implementation'],
    risk: ['risk', 'mitigation', 'assumption', 'contingency', 'challenge', 'sensitivity'],
    legal: ['legal', 'compliance', 'regulation', 'license', 'permit', 'governance', 'trademark'],
  };

  for (const section of structure.sections) {
    // Skip if already assigned
    // @ts-ignore - documentId property handled by legacy code
    if ((section as any).documentId && (section as any).documentId !== '') {
      continue;
    }

    const titleLower = section.title.toLowerCase();
    
    // Find best matching document by semantic analysis
    let bestMatch = mainDoc.id;
    let bestScore = 0;

    for (const [docPurpose, keywords] of Object.entries(sectionKeywords)) {
      const score = keywords.filter(kw => titleLower.includes(kw)).length;
      if (score > bestScore) {
        bestScore = score;
        // Find document with matching purpose or use main
        const matchedDoc = structure.documents.find(d => 
          d.purpose?.toLowerCase().includes(docPurpose)
        );
        if (matchedDoc) {
          bestMatch = matchedDoc.id;
        }
      }
    }

    (section as any).documentId = bestMatch;
  }
}

/**
 * CONFLICT RESOLUTION 2: Unified Special Section Detection
 * 
 * Applies detection results consistently for both sources
 * Canonicalizes special section IDs
 */
function applySpecialSectionDetection(
  structure: DocumentStructure,
  detection: DetectionMap
): void {
  const SPECIAL_SECTION_IDS = {
    title_page: 'metadata',
    table_of_contents: 'ancillary',
    references: 'references',
    appendices: 'appendices',
  };

  // Check for detected special sections
  if (detection.titlePageConfidence > 0.6 || !structure.sections.some(s => s.id === SPECIAL_SECTION_IDS.title_page)) {
    addOrUpdateSpecialSection(structure, SPECIAL_SECTION_IDS.title_page, 'Title Page', 'title_page');
  }
  if (detection.tocConfidence > 0.6 || !structure.sections.some(s => s.id === SPECIAL_SECTION_IDS.table_of_contents)) {
    addOrUpdateSpecialSection(structure, SPECIAL_SECTION_IDS.table_of_contents, 'Table of Contents', 'table_of_contents');
  }
  if (detection.referencesConfidence > 0.6 || !structure.sections.some(s => s.id === SPECIAL_SECTION_IDS.references)) {
    addOrUpdateSpecialSection(structure, SPECIAL_SECTION_IDS.references, 'References', 'references');
  }
  if (detection.appendicesConfidence > 0.6 || !structure.sections.some(s => s.id === SPECIAL_SECTION_IDS.appendices)) {
    addOrUpdateSpecialSection(structure, SPECIAL_SECTION_IDS.appendices, 'Appendices', 'appendices');
  }
  
  // Also add other special sections that might be missing
  if (!structure.sections.some(s => s.id === 'tables_data')) {
    addOrUpdateSpecialSection(structure, 'tables_data', 'Tables and Data', 'tables_data');
  }
  if (!structure.sections.some(s => s.id === 'figures_images')) {
    addOrUpdateSpecialSection(structure, 'figures_images', 'Figures and Images', 'figures_images');
  }
}

function addOrUpdateSpecialSection(
  structure: DocumentStructure,
  id: string,
  title: string,
  _type: string
): void {
  const exists = structure.sections.find(s => s.id === id);
  if (!exists) {
    // Determine appropriate type based on section ID
    let sectionType: 'metadata' | 'references' | 'appendices' | 'ancillary' | 'normal' = 'normal';
    if (id === 'metadata') sectionType = 'metadata';
    else if (id === 'ancillary') sectionType = 'ancillary';
    else if (id === 'references') sectionType = 'references';
    else if (id === 'appendices') sectionType = 'appendices';
    else if (id === 'tables_data' || id === 'figures_images') sectionType = 'ancillary';
    
    structure.sections.push({
      id,
      title,
      required: id === 'metadata' || id === 'ancillary', // Title page and TOC are usually required
      source: 'template',
      requirements: [],
    });
  }
}

/**
 * CONFLICT RESOLUTION 3: Unified Memory-Aware Section Ordering
 * 
 * Applies consistent ordering policy for both sources
 * MEMORY CONSTRAINT: "Introduction to Application Form" must be last
 * 
 * Delegates to sortSectionsForSingleDocument - the SOLE ordering function
 */
function applySectionOrdering(structure: DocumentStructure): void {
  const mainDocSections = structure.sections.filter(s => (s as any).documentId === structure.documents[0]?.id);
  const otherSections = structure.sections.filter(s => (s as any).documentId !== structure.documents[0]?.id);

  // Apply unified ordering to main doc sections
  const orderedMainSections = sortSectionsForSingleDocument(mainDocSections);

  // Other sections (appendix docs) follow main doc sections
  structure.sections = [...orderedMainSections, ...otherSections];
}

/**
 * Helper functions for building from program
 */

function createDocumentsFromProgram(_program: FundingProgram): Document[] {
  return [
    {
      id: 'main_application',
      name: 'Application Document',
      purpose: 'Main funding application',
      required: true,
      type: 'core',
    },
    {
      id: 'supplementary',
      name: 'Supplementary Documents',
      purpose: 'Supporting documents and annexes',
      required: false,
      type: 'custom',
    },
  ];
}

function createSectionsFromProgram(program: FundingProgram): Section[] {
  const sections: Section[] = [];

  // Add sections from program requirements
  if (program.applicationRequirements?.sections) {
    program.applicationRequirements.sections.forEach((req, idx) => {
      sections.push({
        id: `section_${idx}`,
        title: req.title || `Section ${idx + 1}`,
        required: req.required || false,
        source: 'program',
        requirements: [],
      });
    });
  }

  return sections;
}

function extractRequirementsFromProgram(program: FundingProgram): Requirement[] {
  const requirements: Requirement[] = [];

  // Add financial requirements
  if (program.applicationRequirements?.financialRequirements) {
    program.applicationRequirements.financialRequirements.forEach((freq, idx) => {
      requirements.push({
        id: `fin_${idx}`,
        category: 'financial',
        title: `Financial Requirement ${idx + 1}`,
        description: freq.description || '',
        priority: 'medium',
      });
    });
  }

  return requirements;
}

// function generateValidationRulesFromProgram(_program: FundingProgram): ValidationRule[] { // REMOVED - legacy
//   return [];
// }

// function generateAIGuidanceFromProgram(_program: FundingProgram): AIGuidance[] { // REMOVED - legacy
//   return [];
// }

/**
 * Build overlay - merge funding requirements into existing structure
 */
async function buildOverlay(
  existingStructure: DocumentStructure,
  fundingProgram: FundingProgram,
  options?: any
): Promise<DocumentStructure> {
  console.log(`[buildOverlay] Overlaying requirements for program: ${fundingProgram.name}`);

  // Get funding-specific requirements from program
  const fundingSections = fundingProgram.applicationRequirements?.sections || [];
  
  // Generate funding requirements dynamically
  const generatedFundingRequirements = await enrichAllSectionRequirementsAtOnce(
    existingStructure.sections, 
    fundingProgram
  );
  
  // Instead of applying overlay logic here, we'll use the finalizeSectionRequirements function
  // which is the single canonical function for requirement handling
  let tempStructure = {
    ...existingStructure,
    sections: existingStructure.sections.map(section => ({
      ...section,
      // Clear requirements to let finalizeSectionRequirements handle them
      requirements: []
    }))
  };

  // Use the canonical finalize function to handle all requirements
  let updatedStructure = await finalizeSectionRequirements(tempStructure, fundingProgram);

  // Find and add MISSING sections required by funding program
  const addedSections: string[] = [];
  fundingSections.forEach((fundingSection: any) => {
    const exists = updatedStructure.sections.some(s => s.title.toLowerCase().trim() === fundingSection.title.toLowerCase().trim());

    if (!exists) {
      // Add missing section
      const newSection = {
        id: `sec_missing_${fundingSection.title.replace(/\s+/g, '_').toLowerCase()}`,
        title: fundingSection.title,
        required: fundingSection.required || false,
        source: 'program' as const,
        requirements: []
      };

      // Add this new section to the structure
      updatedStructure.sections.push(newSection);
      addedSections.push(fundingSection.title);

      console.log(`[buildOverlay] Added missing section: ${fundingSection.title}`);
    }
  });

  // Update the structure with overlay metadata
  updatedStructure = {
    ...updatedStructure,
    metadata: {
      ...updatedStructure.metadata,
      source: 'program' as const,
      programId: fundingProgram.id,
      createdAt: new Date().toISOString(),
    }
  };

  console.log(`[buildOverlay] Complete: ${addedSections.length} sections added, overlay finished`);

  return updatedStructure;
}

/**
 * Finalize section requirements - the ONE canonical function that writes to section.requirements[]
 * 
 * This function is the ONLY place where requirements are written to section.requirements[].
 * It merges all requirement sources: program, template, AI enrichment, and fallbacks.
 * After this runs, requirements are FINAL and nothing else may inject after this.
 */
export async function finalizeSectionRequirements(
  structure: DocumentStructure,
  program?: FundingProgram
): Promise<DocumentStructure> {
  console.log('[finalizeSectionRequirements] Starting requirement finalization');
  
  // Get enriched requirements from LLM if program is provided
  let enrichedRequirements = {};
  if (program) {
    enrichedRequirements = await enrichAllSectionRequirementsAtOnce(structure.sections, program);
  }
  
  // Process each section to finalize its requirements
  const updatedSections = structure.sections.map((section) => {
    // Get existing requirements (these could be from templates or other sources)
    const existingRequirements = section.requirements || [];
    
    // Get AI-enriched requirements for this section
    const aiEnrichedReqs = (enrichedRequirements as Record<string, any[]>)[section.id] || [];
    
    // Template requirements - any existing requirements that came from templates
    const templateReqs = existingRequirements.filter((req: any) => !req.source || req.source === 'template');
    
    // Program requirements - requirements from funding program data
    const programReqs = existingRequirements.filter((req: any) => req.source === 'program');
    
    // AI requirements - requirements from AI enrichment
    const aiReqs = aiEnrichedReqs.map((req: any, idx: number) => ({
      id: req.id || `ai_${section.id}_${idx}`,
      category: req.category || 'general',
      title: req.title || '',
      description: req.description || '',
      priority: req.priority || 'medium',
      examples: req.examples || [],
      source: 'ai' as const,
      type: req.type || 'content'
    }));
    
    // Fallback requirements - only if no requirements exist after merging others
    const hasAnyRequirements = templateReqs.length > 0 || programReqs.length > 0 || aiReqs.length > 0;
    const fallbackReqs = !hasAnyRequirements 
      ? createFallbackRequirements().map((req: any) => ({
          ...req,
          source: 'fallback' as const,
          type: 'content' as const
        }))
      : [];
    
    // Combine all requirements in priority order: program -> ai -> template -> fallback
    const finalRequirements = [
      ...programReqs.map((req: any) => ({
        ...req,
        source: req.source || 'program',
        type: req.type || 'content'
      })),
      ...aiReqs,
      ...templateReqs.map((req: any) => ({
        ...req,
        source: req.source || 'template',
        type: req.type || 'content'
      })),
      ...fallbackReqs
    ];
    
    console.log(`[finalizeSectionRequirements] ${section.title}: ${finalRequirements.length} final requirements`);
    
    return {
      ...section,
      requirements: finalRequirements
    };
  });
  
  console.log('[finalizeSectionRequirements] Requirement finalization complete');
  
  return {
    ...structure,
    sections: updatedSections
  };
}



function generateRenderingRules(detection?: DetectionMap): RenderingRules {
  return {
    titlePage: {
      enabled: (detection?.titlePageConfidence || 0) > 0.6,
      fields: [],
    },
    tableOfContents: {
      enabled: (detection?.tocConfidence || 0) > 0.6,
      format: 'bulleted',
    },
    references: {
      enabled: (detection?.referencesConfidence || 0) > 0.6,
      style: 'APA',
    },
    appendices: {
      enabled: (detection?.appendicesConfidence || 0) > 0.6,
      maxCount: 10,
    },
  };
}

// ============================================================================
// SECTION ORDERING - SOLE canonical ordering function
// ============================================================================

/**
 * Sort sections for single document.
 * 
 * CANONICAL ORDER:
 * 1. Special UI sections: metadata (Title Page), ancillary (TOC) - ALWAYS first (by ID)
 * 2. Template sections: sorted by `order` property (1-99)
 * 3. End sections: references, tables, figures, appendices (by ID)
 * 4. Memory constraints: "Introduction to Application Form" etc. - ALWAYS last
 * 
 * @param sections - Sections to sort
 * @returns Sections sorted by canonical order
 */
export function sortSectionsForSingleDocument<T extends { id: string; title?: string; order?: number }>(
  sections: T[]
): T[] {
  // Memory constraints for special positioning
  const mustBeLast = ['introduction to application form', 'how to apply', 'submission instructions'];
  
  // Special UI sections that must always come FIRST (before any template sections)
  const specialFirstIds = ['metadata', 'ancillary'];
  
  // Sections that must come at the END (after all template sections)
  const endSectionIds = ['references', 'tables_data', 'figures_images', 'appendices'];

  // Separate sections into canonical groups
  const specialFirst: T[] = [];
  const templateSections: T[] = [];
  const endSections: T[] = [];
  const last: T[] = [];

  for (const section of sections) {
    const titleLower = section.title?.toLowerCase() || '';
    const isMustBeLast = mustBeLast.some(pat => titleLower.includes(pat.toLowerCase()));

    if (specialFirstIds.includes(section.id)) {
      // Special UI sections always come first (by ID, not order)
      specialFirst.push(section);
    } else if (endSectionIds.includes(section.id)) {
      // End sections always come at the end (by ID, not order)
      endSections.push(section);
    } else if (isMustBeLast) {
      // Memory constraints: "Introduction to Application Form" etc. always last
      last.push(section);
    } else {
      // Normal template sections - sorted by order property
      templateSections.push(section);
    }
  }

  // Sort template sections by order property
  const sortByOrder = <S extends { order?: number; id: string }>(items: S[]): S[] => {
    return [...items].sort((a, b) => {
      const orderA = a.order ?? 99;
      const orderB = b.order ?? 99;
      if (orderA !== orderB) return orderA - orderB;
      return a.id.localeCompare(b.id);
    });
  };

  // CANONICAL ORDER: specialFirst → templateSections → endSections → last
  return [...specialFirst, ...sortByOrder(templateSections), ...sortByOrder(endSections), ...last];
}

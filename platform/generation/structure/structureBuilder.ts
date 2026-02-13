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
  ValidationRule,
  AIGuidance,
  RenderingRules,
  FundingProgram,
} from '@/platform/core/types';
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
export function buildDocumentStructure(
  source: FundingProgram | ParsedDocumentData,
  detectionResults?: DetectionMap,
  options?: {
    includeSpecialSections?: boolean;
    applyOrdering?: boolean;
  }
): DocumentStructure {
  const opts = {
    includeSpecialSections: true,
    applyOrdering: true,
    ...options,
  };

  // Determine source type
  const isProgram = 'fundingTypes' in source && Array.isArray((source as FundingProgram).fundingTypes);
  
  if (isProgram) {
    return buildFromProgram(source as FundingProgram, detectionResults, opts);
  } else {
    return buildFromDocument(source as ParsedDocumentData, opts);
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
    documentId: 'main_document',
    title: template.title,
    type: 'normal' as const,
    required: template.required ?? true,
    programCritical: false,
    aiGuidance: template.aiPrompt ? [template.aiPrompt] : [`Write detailed content for ${template.title}`],
    checklist: template.checklist || [`Address ${template.title} requirements`],
    rawSubsections: template.rawSubsections,
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
    validationRules: [],
    aiGuidance: [],
    renderingRules: {},
    conflicts: [],
    warnings: [{ id: 'template-only', message: 'Standard template - no program requirements applied' }],
    confidenceScore: 70,
    metadata: {
      source: 'template',
      generatedAt: new Date().toISOString(),
      version: '1.0',
    },
  };

  // Apply unified memory-aware section ordering (includes canonical order)
  applySectionOrdering(structure);

  return structure;
}

/**
 * Build from FundingProgram (program selection flow)
 */
function buildFromProgram(
  program: FundingProgram,
  detectionResults?: DetectionMap,
  options?: any
): DocumentStructure {
  // 1. Create base structure from program
  const structure: DocumentStructure = {
    documents: createDocumentsFromProgram(program),
    sections: createSectionsFromProgram(program),
    validationRules: generateValidationRulesFromProgram(program),
    aiGuidance: generateAIGuidanceFromProgram(program),
    renderingRules: generateRenderingRules(detectionResults),
    conflicts: [],
    warnings: [],
    confidenceScore: program.analysis?.confidence || 70,
    metadata: {
      source: 'program',
      generatedAt: new Date().toISOString(),
      version: '1.0',
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
    source: 'document',
    generatedAt: new Date().toISOString(),
    version: '1.0',
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
    if (section.documentId && section.documentId !== '') {
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

    section.documentId = bestMatch;
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
      documentId: structure.documents[0]?.id || '',
      title,
      type: sectionType,
      required: id === 'metadata' || id === 'ancillary', // Title page and TOC are usually required
      programCritical: false,
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
  const mainDocSections = structure.sections.filter(s => s.documentId === structure.documents[0]?.id);
  const otherSections = structure.sections.filter(s => s.documentId !== structure.documents[0]?.id);

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
        documentId: 'main_application',
        title: req.title || `Section ${idx + 1}`,
        type: 'normal',
        required: req.required || false,
        programCritical: req.programCritical || false,
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

function generateValidationRulesFromProgram(_program: FundingProgram): ValidationRule[] {
  return [];
}

function generateAIGuidanceFromProgram(_program: FundingProgram): AIGuidance[] {
  return [];
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
// SECTION ORDERING - SINGLE SOURCE OF TRUTH
// ============================================================================

// Canonical ordering for single document sections (special sections + template sections)
const SINGLE_DOC_CANONICAL_ORDER = [
  // Special sections (UI-injected)
  'metadata',
  'ancillary',
  // Template semantic sections (defined order)
  'executive_summary',
  'business_model_canvas',
  'go_to_market_strategy',
  'vision_and_objectives',
  'milestones_next_steps',
  'unit_economics',
  'project_description',
  'company_management',
  'industry_market_competition',
  'market_analysis',
  'team',
  'financial',
  'performance_financial_planning',
  'operations',
  'marketing',
  'marketing_sales',
  'risk',
  'legal',
  'problem_solution',
  // Shared special sections (appended at end)
  'references',
  'tables_data',
  'figures_images',
  'appendices',
];

// Special section IDs for detection
const SPECIAL_SECTION_IDS = {
  METADATA: 'metadata',
  ANCILLARY: 'ancillary',
  REFERENCES: 'references',
  APPENDICES: 'appendices',
  TABLES_DATA: 'tables_data',
  FIGURES_IMAGES: 'figures_images',
} as const;

/**
 * Sort sections for single document with canonical ordering AND memory constraints.
 * 
 * This is the SOLE location for section ordering in the application.
 * Both canonical order AND memory-aware constraints are applied here.
 * 
 * @param sections - Sections to sort
 * @returns Sections sorted by canonical order with memory constraints applied
 */
export function sortSectionsForSingleDocument<T extends { id: string; title?: string }>(
  sections: T[]
): T[] {
  // Memory constraints for special positioning
  const mustBeLast = ['introduction to application form', 'how to apply', 'submission instructions'];
  const shouldBeFirst = ['executive summary', 'overview', 'introduction'];

  // Build order map from canonical order
  const orderMap = new Map<string, number>(
    SINGLE_DOC_CANONICAL_ORDER.map((id, index) => [id, index])
  );

  // Separate sections into memory-aware groups
  const first: T[] = [];
  const middle: T[] = [];
  const last: T[] = [];

  for (const section of sections) {
    const titleLower = section.title?.toLowerCase() || '';
    const isMustBeLast = mustBeLast.some(pat => titleLower.includes(pat.toLowerCase()));
    const shouldBeFirstMatch = shouldBeFirst.some(pat => titleLower.includes(pat.toLowerCase()));

    if (isMustBeLast) {
      last.push(section);
    } else if (shouldBeFirstMatch) {
      first.push(section);
    } else {
      middle.push(section);
    }
  }

  // Sort each group by canonical order
  const sortByCanonical = <S extends { id: string }>(items: S[]): S[] => {
    return [...items].sort((a, b) => {
      const orderA = orderMap.get(a.id);
      const orderB = orderMap.get(b.id);

      // Special sections always at end of canonical
      const isSpecialA = Object.values(SPECIAL_SECTION_IDS).includes(a.id as typeof SPECIAL_SECTION_IDS[keyof typeof SPECIAL_SECTION_IDS]);
      const isSpecialB = Object.values(SPECIAL_SECTION_IDS).includes(b.id as typeof SPECIAL_SECTION_IDS[keyof typeof SPECIAL_SECTION_IDS]);

      if (isSpecialA && !isSpecialB) return 1;
      if (!isSpecialA && isSpecialB) return -1;

      // Both in canonical order
      if (orderA !== undefined && orderB !== undefined) {
        return orderA - orderB;
      }

      // Unknown sections - preserve relative order
      return 0;
    });
  };

  // Combine: first -> middle (sorted) -> last (sorted)
  // Within middle, special sections go to their canonical positions
  return [...sortByCanonical(first), ...sortByCanonical(middle), ...sortByCanonical(last)];
}

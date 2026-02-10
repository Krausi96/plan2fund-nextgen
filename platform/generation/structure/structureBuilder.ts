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
    requirements: extractRequirementsFromProgram(program),
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
 */
function applySectionOrdering(structure: DocumentStructure): void {
  // Memory constraint: specific sections must be in specific positions
  const mustBeLast = ['introduction to application form', 'how to apply', 'submission instructions'];
  const shouldBeFirst = ['executive summary', 'overview', 'introduction'];

  const mainDocSections = structure.sections.filter(s => s.documentId === structure.documents[0]?.id);
  const otherSections = structure.sections.filter(s => s.documentId !== structure.documents[0]?.id);

  // Partition: first, middle, last
  const first: Section[] = [];
  const middle: Section[] = [];
  const last: Section[] = [];

  for (const section of mainDocSections) {
    const titleLower = section.title.toLowerCase();
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

  // Reconstruct sections array with ordered main doc sections
  const reordered = [...first, ...middle, ...last, ...otherSections];
  structure.sections = reordered;
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
        type: 'financial',
        title: `Financial Requirement ${idx + 1}`,
        description: freq.description || '',
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

/**
 * SECTION UTILITIES
 * 
 * Contains various section-related utility functions including sorting, list handling, and metadata.
 */

import {
  METADATA_SECTION_ID,
  ANCILLARY_SECTION_ID,
  REFERENCES_SECTION_ID,
  APPENDICES_SECTION_ID,
  TABLES_DATA_SECTION_ID,
  FIGURES_IMAGES_SECTION_ID
} from '@/features/editor/lib/constants';

import type { SectionTemplate } from '@/features/editor/lib/types/types';

// Define the canonical section order
const CANONICAL_SECTION_ORDER = [
  METADATA_SECTION_ID,      // Title Page - must be first
  ANCILLARY_SECTION_ID,     // Table of Contents - must be second
  'executive_summary',
  'company_description',
  'project_description',
  'market_analysis',
  'financial_plan',
  'team_qualifications',
  'risk_assessment',
  'business_model_canvas',
  'go_to_market_strategy',
  'unit_economics',
  'milestones_next_steps',
  'company_overview',
  'about_company',
  'company_information',
  REFERENCES_SECTION_ID,    // References
  TABLES_DATA_SECTION_ID,   // Tables/Data
  FIGURES_IMAGES_SECTION_ID, // Figures/Images
  APPENDICES_SECTION_ID     // Appendices
];

// Create a map for fast lookup
const SECTION_ORDER_MAP = new Map(CANONICAL_SECTION_ORDER.map((id, index) => [id, index]));

/**
 * Sort sections according to hierarchical document order
 * For single document: Maintains canonical order
 * For multiple documents: Orders as Main doc → Appendices → Shared sections
 */
export function sortSectionsByCanonicalOrder<T extends { id: string; documentId: string }>(
  sections: T[],
  documents: Array<{ id: string; name: string; purpose: string; required: boolean }> = []
): T[] {
  const hasMultipleDocuments = documents.length > 1;
  
  if (!hasMultipleDocuments) {
    // For single document, use original logic
    // Identify special sections that should be at the end
    const endingSpecialSections = new Set([
      REFERENCES_SECTION_ID,
      TABLES_DATA_SECTION_ID,
      FIGURES_IMAGES_SECTION_ID,
      APPENDICES_SECTION_ID
    ]);
    
    return [...sections].sort((a, b) => {
      const orderA = SECTION_ORDER_MAP.get(a.id);
      const orderB = SECTION_ORDER_MAP.get(b.id);
      
      const isEndingA = endingSpecialSections.has(a.id);
      const isEndingB = endingSpecialSections.has(b.id);
      
      // If both sections are in the canonical order, sort by their defined positions
      if (orderA !== undefined && orderB !== undefined) {
        return orderA - orderB;
      }
      
      // If only one section is in canonical order
      if (orderA !== undefined) {
        if (isEndingA) {
          // A is a canonical ending special section
          return 1; // Ending special sections come after non-canonical sections
        } else {
          return -1; // Introductory canonical sections come before non-canonical sections
        }
      }
      
      if (orderB !== undefined) {
        if (isEndingB) {
          // B is a canonical ending special section
          return -1; // Non-canonical sections come before ending special sections
        } else {
          return 1; // Introductory canonical sections come before non-canonical sections
        }
      }
      
      // If neither is in canonical order, determine based on whether they're ending special sections
      if (isEndingA && isEndingB) {
        // Both are ending special sections, sort by canonical order
        return (orderA || 0) - (orderB || 0);
      }
      
      // Ending special sections come after non-ending sections
      if (isEndingA) return 1;
      if (isEndingB) return -1;
      
      // Both are regular non-canonical sections, maintain their relative order
      // This ensures they appear between the intro special sections and ending special sections
      return 0;
    });
  } else {
    // For multiple documents, implement hierarchical sorting
    const mainDocumentId = documents[0]?.id || 'main_document';
    
    // Identify appendix document IDs
    const appendixDocumentIds = new Set(documents.slice(1).map(doc => doc.id));
    
    // Identify shared sections
    const sharedSectionIds = new Set([
      REFERENCES_SECTION_ID,
      TABLES_DATA_SECTION_ID,
      FIGURES_IMAGES_SECTION_ID
    ]);
    
    return [...sections].sort((a, b) => {
      // Determine document hierarchy position
      const isMainA = a.documentId === mainDocumentId;
      const isMainB = b.documentId === mainDocumentId;
      
      const isAppendixA = appendixDocumentIds.has(a.documentId);
      const isAppendixB = appendixDocumentIds.has(b.documentId);
      
      const isSharedA = sharedSectionIds.has(a.id);
      const isSharedB = sharedSectionIds.has(b.id);
      
      // Main document sections come first
      if (isMainA && !isMainB) return -1;
      if (!isMainA && isMainB) return 1;
      
      // Appendix sections come after main document but before shared sections
      if (isAppendixA && !isAppendixB) {
        // If B is a shared section, A (appendix) comes before
        if (isSharedB) return -1;
        return -1; // Both appendices, sort by document order later
      }
      if (!isAppendixA && isAppendixB) {
        // If A is a shared section, B (appendix) comes before
        if (isSharedA) return 1;
        return 1;
      }
      
      // Shared sections come last
      if (isSharedA && !isSharedB) return 1; // Shared sections come last
      if (!isSharedA && isSharedB) return -1;
      
      // Within same document type, use canonical order
      const orderA = SECTION_ORDER_MAP.get(a.id);
      const orderB = SECTION_ORDER_MAP.get(b.id);
      
      // If both sections have canonical order, sort by that
      if (orderA !== undefined && orderB !== undefined) {
        return orderA - orderB;
      }
      
      // If only one has canonical order, prioritize it
      if (orderA !== undefined) return -1;
      if (orderB !== undefined) return 1;
      
      // If both in same document and no canonical order, maintain relative order
      // For appendices, sort by document order
      if (isAppendixA && isAppendixB && a.documentId !== b.documentId) {
        // Determine document index
        const docIndexA = documents.findIndex(doc => doc.id === a.documentId);
        const docIndexB = documents.findIndex(doc => doc.id === b.documentId);
        return docIndexA - docIndexB;
      }
      
      // Default: maintain original order
      return 0;
    });
  }
}

/**
 * Get complete section list including special sections for display purposes
 * Combines template sections with special sections (Title Page, TOC, References, Appendices)
 * 
 * @param templateSections - Sections from MASTER_SECTIONS or document structure
 * @returns Complete section list with proper icons and ordering
 */
export function getCompleteSectionList(
  templateSections: SectionTemplate[]): SectionTemplate[] {
  // All special sections are now included in templateSections via MASTER_SECTIONS
  // No need for separate specialSections or trailingSections arrays
  
  // Add icons to all sections
  const sectionsWithIcons = templateSections.map(section => ({
    ...section,
    icon: section.icon || '🧾' // Default icon for sections without specific icons
  }));
  
  return sectionsWithIcons;
}

/**
 * Get section icon by section ID
 * Maps section IDs to appropriate emoji icons
 * 
 * @param sectionId - Section identifier
 * @returns Emoji icon string
 */
export function getSectionIcon(sectionId: string): string {
  const iconMap: Record<string, string> = {
    [METADATA_SECTION_ID]: '📕',
    [ANCILLARY_SECTION_ID]: '📑',
    [REFERENCES_SECTION_ID]: '📚',
    'tables_data': '📊',
    'figures_images': '🖼️',
    [APPENDICES_SECTION_ID]: '📎',
    // Default for regular sections
    'default': '🧾'
  };
  
  return iconMap[sectionId] || iconMap['default'];
}

/**
 * Check if section is a special section
 * 
 * @param sectionId - Section identifier
 * @returns boolean indicating if it's a special section
 */
export function isSpecialSection(sectionId: string): boolean {
  return [
    METADATA_SECTION_ID,
    ANCILLARY_SECTION_ID,
    REFERENCES_SECTION_ID,
    APPENDICES_SECTION_ID,
    'tables_data',
    'figures_images'
  ].includes(sectionId);
}

// Define special section types
export type SpecialSectionType = 'metadata' | 'ancillary' | 'references' | 'appendices' | 'tables_data' | 'figures_images';

// Interface for special section configuration
interface SpecialSectionConfig {
  id: string;
  type: 'required' | 'optional';
  icon: string;
  titleKey: string;
}

// Mapping of special section types to their configurations
const SPECIAL_SECTION_CONFIG: Record<SpecialSectionType, SpecialSectionConfig> = {
  metadata: {
    id: METADATA_SECTION_ID,
    type: 'required',
    icon: '📕',
    titleKey: 'editor.section.metadata'
  },
  ancillary: {
    id: ANCILLARY_SECTION_ID,
    type: 'required',
    icon: '📑',
    titleKey: 'editor.section.ancillary'
  },
  references: {
    id: REFERENCES_SECTION_ID,
    type: 'optional',
    icon: '📚',
    titleKey: 'editor.section.references'
  },
  appendices: {
    id: APPENDICES_SECTION_ID,
    type: 'optional',
    icon: '📎',
    titleKey: 'editor.section.appendices'
  },
  tables_data: {
    id: TABLES_DATA_SECTION_ID,
    type: 'optional',
    icon: '📊',
    titleKey: 'editor.section.tablesData'
  },
  figures_images: {
    id: FIGURES_IMAGES_SECTION_ID,
    type: 'optional',
    icon: '🖼️',
    titleKey: 'editor.section.figuresImages'
  }
};

/**
 * Get special section configuration by type
 */
export function getSpecialSectionConfig(type: SpecialSectionType): SpecialSectionConfig {
  return SPECIAL_SECTION_CONFIG[type];
}

/**
 * Create a special section object
 */
export function createSpecialSection(
  type: SpecialSectionType,
  documentId: string,
  t: (key: string) => string,
  customTitle?: string
): any {
  const config = SPECIAL_SECTION_CONFIG[type];
  
  return {
    id: config.id,
    documentId,
    title: customTitle || t(config.titleKey as any) || getDefaultTitle(type),
    type: config.type,
    required: config.type === 'required',
    programCritical: false,
    icon: config.icon
  };
}

/**
 * Get default title for special section type
 */
function getDefaultTitle(type: SpecialSectionType): string {
  const titles: Record<SpecialSectionType, string> = {
    metadata: 'Title Page',
    ancillary: 'Table of Contents',
    references: 'References',
    appendices: 'Appendices',
    tables_data: 'Tables and Data',
    figures_images: 'Figures and Images'
  };
  return titles[type];
}

/**
 * Enhance document structure with missing special sections
 */
export function enhanceWithSpecialSectionsCentralized(
  documentStructure: any,
  t: (key: string) => string,
  hasMultipleDocuments: boolean = false
): any {
  if (!documentStructure) return null;
  
  // Convert template sections if needed
  const baseSections = Array.isArray(documentStructure.sections)
    ? documentStructure.sections.map((section: any) =>
        typeof section === 'object' && 'id' in section && 'title' in section
          ? section
          : convertSectionTemplate(section as unknown as any)
    )
    : [];
  
  if (!hasMultipleDocuments) {
    // For single document, ensure all special sections exist
    const existingSectionIds = new Set(baseSections.map((s: any) => s.id));
    const specialSectionsToAdd = [];
    
    // Check each special section type
    (Object.keys(SPECIAL_SECTION_CONFIG) as SpecialSectionType[]).forEach(type => {
      const config = SPECIAL_SECTION_CONFIG[type];
      if (!existingSectionIds.has(config.id)) {
        specialSectionsToAdd.push(
          createSpecialSection(type, 'main_document', t)
        );
      }
    });
    
    // Don't add appendices section if we have multiple documents or existing appendices
    const hasExistingAppendices = baseSections.some((section: any) =>
      section.title.toLowerCase().includes('appendix') ||
      section.title.toLowerCase().includes('appendices') ||
      section.id.startsWith('appendix_')
    );
    
    if (!existingSectionIds.has(APPENDICES_SECTION_ID) && !hasMultipleDocuments && !hasExistingAppendices) {
      specialSectionsToAdd.push(
        createSpecialSection('appendices', 'main_document', t)
      );
    }
    
    return {
      ...documentStructure,
      sections: [
        ...specialSectionsToAdd.filter(s => [METADATA_SECTION_ID, ANCILLARY_SECTION_ID].includes(s.id)),
        ...baseSections,
        ...specialSectionsToAdd.filter(s => ![METADATA_SECTION_ID, ANCILLARY_SECTION_ID].includes(s.id))
      ]
    };
  } else {
    // For multiple documents, create hierarchical structure
    const mainDocumentId = documentStructure.documents[0]?.id || 'main_document';
    
    // Separate sections by document
    const sectionsByDocument: Record<string, any[]> = {};
    documentStructure.documents.forEach((doc: any) => sectionsByDocument[doc.id] = []);
    
    baseSections.forEach((section: any) => {
      const targetDocId = section.documentId || mainDocumentId;
      if (sectionsByDocument[targetDocId]) {
        sectionsByDocument[targetDocId].push(section);
      } else {
        sectionsByDocument[mainDocumentId].push(section);
      }
    });
    
    // Process main document sections
    const mainDocumentSections = sectionsByDocument[mainDocumentId] || [];
    const mainDocumentSectionIds = new Set(mainDocumentSections.map((s: any) => s.id));
    
    // Add missing special sections to main document
    const mainSpecialSectionsToAdd: any[] = [];
    
    // Only add metadata and ancillary to main document
    ['metadata', 'ancillary'].forEach(type => {
      const typedType = type as SpecialSectionType;
      const config = SPECIAL_SECTION_CONFIG[typedType];
      if (!mainDocumentSectionIds.has(config.id)) {
        mainSpecialSectionsToAdd.push(
          createSpecialSection(typedType, mainDocumentId, t)
        );
      }
    });
    
    // Check for existing appendices
    const hasExistingAppendices = baseSections.some((section: any) =>
      section.title.toLowerCase().includes('appendix') ||
      section.title.toLowerCase().includes('appendices') ||
      section.id.startsWith('appendix_')
    );
    
    // Filter out the generic APPENDICES_SECTION_ID from main document sections when there are multiple documents
    const filteredMainDocumentSections = mainDocumentSections.filter((section: any) =>
      section.id !== APPENDICES_SECTION_ID
    );
    
    // Combine main sections
    const mainSectionsOrdered = [
      ...mainSpecialSectionsToAdd,
      ...filteredMainDocumentSections
    ];
    
    // Process additional documents as appendices
    const additionalDocuments = documentStructure.documents.slice(1);
    const appendixSections: any[] = [];
    
    if (hasExistingAppendices || additionalDocuments.length === 0) {
      // If we have existing appendices, process normally
      additionalDocuments.forEach((doc: any, index: number) => {
        const docSections = sectionsByDocument[doc.id] || [];
        const appendixLetter = String.fromCharCode(65 + index); // A, B, C...
        const expectedAppendixTitle = `Appendix ${appendixLetter}: ${doc.name}`;
        
        const filteredDocSections = docSections.filter((section: any) =>
          section.title !== expectedAppendixTitle &&
          section.id !== APPENDICES_SECTION_ID
        );
        
        appendixSections.push(...filteredDocSections);
      });
    } else {
      // Create appendix sections from additional documents
      additionalDocuments.forEach((doc: any) => {
        const docSections = sectionsByDocument[doc.id] || [];
        const filteredDocSections = docSections.filter((section: any) =>
          section.id !== APPENDICES_SECTION_ID
        );
        
        appendixSections.push(...filteredDocSections);
      });
    }
    
    // Add shared sections (references, tables, figures) at the end
    const allSectionIds = new Set([...Array.from(mainDocumentSectionIds), ...appendixSections.map((s: any) => s.id)]);
    const sharedSectionsToAdd: any[] = [];
    
    // Add shared special sections
    ['references', 'tables_data', 'figures_images'].forEach(type => {
      const typedType = type as SpecialSectionType;
      const config = SPECIAL_SECTION_CONFIG[typedType];
      if (!allSectionIds.has(config.id)) {
        sharedSectionsToAdd.push(
          createSpecialSection(typedType, mainDocumentId, t)
        );
      }
    });
    
    // Filter out appendices section if we have individual appendices
    const hasMultipleDocuments = documentStructure.documents.length > 1;
    const filteredSharedSectionsToAdd = hasMultipleDocuments
      ? sharedSectionsToAdd.filter((section: any) => section.id !== APPENDICES_SECTION_ID)
      : sharedSectionsToAdd;
    
    // Combine all sections
    const allSections = [
      ...mainSectionsOrdered,
      ...appendixSections,
      ...filteredSharedSectionsToAdd
    ];
    
    // Final cleanup: ensure no APPENDICES_SECTION_ID remains when there are multiple documents
    const finalSections = hasMultipleDocuments
      ? allSections.filter((section: any) => section.id !== APPENDICES_SECTION_ID)
      : allSections;
    
    return {
      ...documentStructure,
      sections: finalSections
    };
  }
}

// Helper function to convert section template (copied from enhanceWithSpecialSections.ts)
function convertSectionTemplate(template: any): any {
  return {
    id: template.id,
    documentId: template.documentId || 'main_document',
    title: template.title || template.name || '',
    type: (template.required ? 'required' : 'optional') as 'required' | 'optional' | 'conditional',
    required: template.required !== false,
    programCritical: false,
    aiPrompt: template.aiPrompt || `Write detailed content for ${template.title || template.name}`,
    checklist: template.checklist || [`Address ${template.title || template.name} requirements`],
    // Preserve subsections if they exist in the template
    ...(template.rawSubsections && { rawSubsections: template.rawSubsections })
  };
}
/**
 * Organize Document Structure for UI Rendering
 * Utility for organizing document structure for hierarchical UI display
 * 
 * NOTE: Section ordering is handled by structureBuilder.sortSectionsForSingleDocument()
 * This module ONLY handles UI-specific transformations (placeholder injection, hierarchical grouping)
 */

import type { DocumentStructure } from '@/platform/core/types';
import { sortSectionsForSingleDocument } from '@/platform/generation/structure/structureBuilder';

// Re-export for backward compatibility
export { sortSectionsForSingleDocument } from '@/platform/generation/structure/structureBuilder';

// Special section IDs
const SPECIAL_SECTION_IDS = {
  METADATA: 'metadata',
  ANCILLARY: 'ancillary',
  REFERENCES: 'references',
  APPENDICES: 'appendices',
  TABLES_DATA: 'tables_data',
  FIGURES_IMAGES: 'figures_images',
} as const;

/**
 * Hierarchical document view for UI rendering
 */
export interface HierarchicalDocumentView {
  mainDocument: {
    id: string;
    name: string;
    sections: unknown[];
  };
  appendices: Array<{
    id: string;
    name: string;
    displayName: string;
    sections: unknown[];
  }>;
  sharedSections: unknown[];
}

/**
 * Organize document structure for UI rendering with hierarchical view
 */
export function organizeForUiRendering(
  documentStructure: DocumentStructure | null
): HierarchicalDocumentView | null {
  if (!documentStructure) return null;

  const { documents, sections } = documentStructure;

  if (!documents || documents.length === 0) {
    return {
      mainDocument: {
        id: 'main_document',
        name: 'Main Document',
        sections: [],
      },
      appendices: [],
      sharedSections: [],
    };
  }

  // Get main document
  const mainDocument = documents[0];
  const mainDocumentId = mainDocument.id;

  // Assign sections to their documents
  const sectionsByDocument: Record<string, unknown[]> = {};
  documents.forEach((doc: { id: string }) => {
    sectionsByDocument[doc.id] = [];
  });

  // Separate special sections that should stay in main document vs. those that go to shared vs. those that go to appendices
  const specialSectionsInMain: Array<{ id: string; documentId?: string }> = [];
  const appendixSections: Array<{ id: string; documentId?: string }> = [];
  
  sections.forEach((section: { id: string; documentId?: string }) => {
    // Special sections that should remain in the main document (metadata, ancillary/TOC)
    if (section.id === SPECIAL_SECTION_IDS.METADATA || section.id === SPECIAL_SECTION_IDS.ANCILLARY) {
      specialSectionsInMain.push(section);
    } else if (section.id === SPECIAL_SECTION_IDS.APPENDICES) {
      // Appendices sections are stored separately
      appendixSections.push(section);
    } else {
      // Regular sections go to their designated document
      const targetDocumentId = section.documentId || mainDocumentId;
      if (sectionsByDocument[targetDocumentId]) {
        sectionsByDocument[targetDocumentId].push(section);
      } else {
        sectionsByDocument[mainDocumentId].push(section);
      }
    }
  });
  
  // Add appendix sections to main document if there are no additional documents (single document mode)
  // If there are appendix sections to add, they should replace any existing appendices section to avoid duplication
  if (documents.length <= 1 && appendixSections.length > 0) {
    // Remove any existing appendices sections from the main document to avoid duplication
    sectionsByDocument[mainDocumentId] = sectionsByDocument[mainDocumentId].filter((s: any) => s.id !== SPECIAL_SECTION_IDS.APPENDICES);
    
    // Add the appendix sections
    sectionsByDocument[mainDocumentId].push(...appendixSections);
  }

  // Organize main document sections: combine special sections + document-specific sections
  // NOTE: Sections are already sorted by structureBuilder.sortSectionsForSingleDocument()
  const organizedMainSections = [
    ...specialSectionsInMain,
    ...(sectionsByDocument[mainDocumentId] || [])
  ];
  

  
  // Ensure title page and TOC are present in main document when missing
  const hasTitlePage = organizedMainSections.some(s => (s as { id: string }).id === SPECIAL_SECTION_IDS.METADATA);
  const hasToc = organizedMainSections.some(s => (s as { id: string }).id === SPECIAL_SECTION_IDS.ANCILLARY);
  
  // Add title page if missing
  if (!hasTitlePage) {
    const titlePageSection = {
      id: SPECIAL_SECTION_IDS.METADATA,
    };

    organizedMainSections.unshift(titlePageSection as typeof organizedMainSections[0] as any);
  }
  
  // Add TOC if missing
  if (!hasToc) {
    const tocSection = {
      id: SPECIAL_SECTION_IDS.ANCILLARY,
    };

    // Insert after title page if it exists
    const titlePageIndex = organizedMainSections.findIndex(s => (s as { id: string }).id === SPECIAL_SECTION_IDS.METADATA);
    organizedMainSections.splice(titlePageIndex >= 0 ? titlePageIndex + 1 : 0, 0, tocSection as typeof organizedMainSections[0] as any);
  }
  
  // Handle appendices section in single document mode
  if (documents.length <= 1) {
    const hasAppendices = organizedMainSections.some(s => (s as { id: string }).id === SPECIAL_SECTION_IDS.APPENDICES);

    
    // Only add a placeholder appendices section if there are no appendix sections to add
    // and no appendices section already exists
    if (!hasAppendices && appendixSections.length === 0) {
      // Add a placeholder appendices section if none exists
      const appendicesSection = {
        id: SPECIAL_SECTION_IDS.APPENDICES,
      };

      organizedMainSections.push(appendicesSection as typeof organizedMainSections[0] as any);
    }
    // If there are appendix sections to add, they've already been added to main document
    // via the appendixSections logic above, so no need to add a placeholder
  }
  
  // Organize appendices (additional documents)
  const appendices = documents.slice(1).map((doc: { id: string; name: string }, index: number) => {
    const appendixLetter = String.fromCharCode(65 + index);
    return {
      id: doc.id,
      name: doc.name,
      displayName: `Appendix ${appendixLetter}: ${doc.name}`,
      sections: sectionsByDocument[doc.id] || [],
    };
  });

  // Shared sections (References, Tables, Figures) - only these specific sections go to shared sections
  const SHARED_SECTION_IDS = [
    SPECIAL_SECTION_IDS.REFERENCES,
    SPECIAL_SECTION_IDS.TABLES_DATA,
    SPECIAL_SECTION_IDS.FIGURES_IMAGES,
  ];

  // Extract shared sections from main document sections
  const sharedSectionsUnfiltered = organizedMainSections.filter(section => {
    const sectionId = (section as { id: string }).id;
    return SHARED_SECTION_IDS.includes(sectionId as typeof SHARED_SECTION_IDS[number]);
  });
  
  // Remove shared sections from main document sections, but handle appendices specially
  let finalMainSections = organizedMainSections.filter(section => {
    const sectionId = (section as { id: string }).id;
    // Don't remove appendices from main sections since they should stay in main document
    if (sectionId === SPECIAL_SECTION_IDS.APPENDICES) {
      return true; // Keep appendices in main sections
    }
    // Remove other shared sections (references, tables, figures) from main document
    return !SHARED_SECTION_IDS.includes(sectionId as typeof SHARED_SECTION_IDS[number]);
  });
  
  // For single document mode, ensure appendices are positioned at the end and remove duplicates
  if (documents.length <= 1) {
    // Extract appendices sections
    const appendicesSections = finalMainSections.filter((s: any) => s.id === SPECIAL_SECTION_IDS.APPENDICES);
    // Extract non-appendices sections
    const nonAppendicesSections = finalMainSections.filter((s: any) => s.id !== SPECIAL_SECTION_IDS.APPENDICES);
    
    // Remove ALL duplicates by taking only the first occurrence of appendices
    if (appendicesSections.length > 0) {
      finalMainSections = [...nonAppendicesSections, appendicesSections[0]];
    } else {
      finalMainSections = nonAppendicesSections;
    }
  }
  
  // Update sharedSections to use the filtered version
  let sharedSections = sharedSectionsUnfiltered;

  // Add default shared sections if not present
  const hasReferences = sharedSections.some(s => (s as { id: string }).id === SPECIAL_SECTION_IDS.REFERENCES);
  const hasTables = sharedSections.some(s => (s as { id: string }).id === SPECIAL_SECTION_IDS.TABLES_DATA);
  const hasFigures = sharedSections.some(s => (s as { id: string }).id === SPECIAL_SECTION_IDS.FIGURES_IMAGES);

  if (!hasReferences) {
    sharedSections.push({
      id: SPECIAL_SECTION_IDS.REFERENCES,
    });
  }

  if (!hasTables) {
    sharedSections.push({
      id: SPECIAL_SECTION_IDS.TABLES_DATA,
    });
  }

  if (!hasFigures) {
    sharedSections.push({
      id: SPECIAL_SECTION_IDS.FIGURES_IMAGES,
    });
  }

  // For single document mode, we want appendices to be part of the main flow
  let finalAppendices = appendices;
  
  // If we're in single document mode and have appendices sections, add them to the main document
  if (documents.length <= 1 && appendixSections.length > 0) {
    // Add appendices sections to main document sections
    const typedAppendixSections = appendixSections as unknown as typeof finalMainSections;
    finalMainSections.push(...typedAppendixSections);
  } else if (documents.length > 1 && appendixSections.length > 0) {
    // In multi-doc mode, if there are standalone appendix sections, add them to appendices
    if (appendixSections.length > 0) {
      const typedAppendixSections = appendixSections as unknown as typeof finalMainSections;
      finalAppendices = [...finalAppendices, {
        id: SPECIAL_SECTION_IDS.APPENDICES,
        name: 'Additional Appendices',
        displayName: 'Appendix: Additional Content',
        sections: typedAppendixSections,
      }];
    }
  }
  
  // Final processing: deduplicate and ensure proper ordering
  // Separate appendices sections from other sections
  const seenIds = new Set<string>();
  const uniqueNonAppendices: typeof finalMainSections = [];
  let uniqueAppendicesSection: typeof finalMainSections[0] | undefined;
  
  for (const section of finalMainSections) {
    const sectionId = (section as { id: string }).id;
    if (!seenIds.has(sectionId)) {
      seenIds.add(sectionId);
      if (sectionId === SPECIAL_SECTION_IDS.APPENDICES && !uniqueAppendicesSection) {
        uniqueAppendicesSection = section;
      } else if (sectionId !== SPECIAL_SECTION_IDS.APPENDICES) {
        uniqueNonAppendices.push(section);
      }
    }
  }
  
  // Combine sections and apply deduplication
  const deduplicatedMainSections = uniqueAppendicesSection 
    ? [...uniqueNonAppendices, uniqueAppendicesSection]
    : uniqueNonAppendices;
  
  // For single document view, sections are already ordered by structureBuilder
  // Preserve canonical order - do NOT append sharedSections (breaks ordering)
  if (documents.length <= 1) {
    // In single document mode, keep all sections in canonical order from structureBuilder
    return {
      mainDocument: {
        id: mainDocument.id,
        name: mainDocument.name,
        sections: deduplicatedMainSections, // Already in canonical order
      },
      appendices: [],
      sharedSections: [],
    };
  }
  
  // For multi-document view, keep separate structure
  return {
    mainDocument: {
      id: mainDocument.id,
      name: mainDocument.name,
      sections: deduplicatedMainSections,
    },
    appendices: finalAppendices,
    sharedSections,
  };
}

/**
 * Get section icon by section ID
 */
export function getSectionIcon(sectionId: string): string {
  const iconMap: Record<string, string> = {
    [SPECIAL_SECTION_IDS.METADATA]: '📕',
    [SPECIAL_SECTION_IDS.ANCILLARY]: '📑',
    [SPECIAL_SECTION_IDS.REFERENCES]: '📚',
    [SPECIAL_SECTION_IDS.TABLES_DATA]: '📊',
    [SPECIAL_SECTION_IDS.FIGURES_IMAGES]: '🖼️',
    [SPECIAL_SECTION_IDS.APPENDICES]: '📎',
    default: '🧾',
  };

  return iconMap[sectionId] || iconMap.default;
}

/**
 * Check if section is special
 */
export function isSpecialSection(id: string): boolean {
  return Object.values(SPECIAL_SECTION_IDS).includes(id as typeof SPECIAL_SECTION_IDS[keyof typeof SPECIAL_SECTION_IDS]);
}

/**
 * Get complete list of sections
 */
export function getCompleteSectionList(documentStructure: DocumentStructure | null) {
  if (!documentStructure) return [];
  return documentStructure.sections || [];
}

/**
 * Organize Document Structure for UI Rendering
 * Utility for organizing document structure for hierarchical UI display
 */

import type { DocumentStructure } from '@/platform/core/types';

// Special section IDs
const SPECIAL_SECTION_IDS = {
  METADATA: 'section_title_page',
  ANCILLARY: 'section_toc',
  REFERENCES: 'section_references',
  APPENDICES: 'section_appendices',
  TABLES_DATA: 'section_tables',
  FIGURES_IMAGES: 'section_figures',
} as const;

// Canonical ordering for single document
const SINGLE_DOC_CANONICAL_ORDER = [
  SPECIAL_SECTION_IDS.METADATA,
  SPECIAL_SECTION_IDS.ANCILLARY,
  'section_executive_summary',
  'section_problem_solution',
  'section_market_analysis',
  'section_team',
  'section_financial',
  'section_operations',
  'section_marketing',
  'section_risk',
  SPECIAL_SECTION_IDS.REFERENCES,
  SPECIAL_SECTION_IDS.TABLES_DATA,
  SPECIAL_SECTION_IDS.FIGURES_IMAGES,
  SPECIAL_SECTION_IDS.APPENDICES,
];

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
 * Sort sections according to canonical order for single document
 */
export function sortSectionsForSingleDocument<T extends { id: string }>(
  sections: T[]
): T[] {
  const orderMap = new Map<string, number>(
    SINGLE_DOC_CANONICAL_ORDER.map((id, index) => [id, index])
  );

  return [...sections].sort((a, b) => {
    const orderA = orderMap.get(a.id);
    const orderB = orderMap.get(b.id);

    // Title page always comes first
    if (a.id === SPECIAL_SECTION_IDS.METADATA && b.id !== SPECIAL_SECTION_IDS.METADATA) return -1;
    if (b.id === SPECIAL_SECTION_IDS.METADATA && a.id !== SPECIAL_SECTION_IDS.METADATA) return 1;

    // TOC comes second
    if (a.id === SPECIAL_SECTION_IDS.ANCILLARY && b.id !== SPECIAL_SECTION_IDS.ANCILLARY) return -1;
    if (b.id === SPECIAL_SECTION_IDS.ANCILLARY && a.id !== SPECIAL_SECTION_IDS.ANCILLARY) return 1;

    if (orderA !== undefined && orderB !== undefined) {
      return orderA - orderB;
    }

    // Special sections go to end
    const isSpecialA = Object.values(SPECIAL_SECTION_IDS).includes(a.id as typeof SPECIAL_SECTION_IDS[keyof typeof SPECIAL_SECTION_IDS]);
    const isSpecialB = Object.values(SPECIAL_SECTION_IDS).includes(b.id as typeof SPECIAL_SECTION_IDS[keyof typeof SPECIAL_SECTION_IDS]);

    if (isSpecialA && !isSpecialB) return 1;
    if (!isSpecialA && isSpecialB) return -1;

    return 0;
  });
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

  sections.forEach((section: { documentId?: string }) => {
    const targetDocumentId = section.documentId || mainDocumentId;
    if (sectionsByDocument[targetDocumentId]) {
      sectionsByDocument[targetDocumentId].push(section);
    } else {
      sectionsByDocument[mainDocumentId].push(section);
    }
  });

  // Organize main document sections
  const mainDocumentSections = sectionsByDocument[mainDocumentId] || [];
  const organizedMainSections = sortSectionsForSingleDocument(mainDocumentSections as Array<{ id: string }>);

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

  // Shared sections (References, Tables, Figures)
  const SHARED_SECTION_IDS = [
    SPECIAL_SECTION_IDS.REFERENCES,
    SPECIAL_SECTION_IDS.TABLES_DATA,
    SPECIAL_SECTION_IDS.FIGURES_IMAGES,
  ];

  const sharedSections = Object.values(sectionsByDocument)
    .flat()
    .filter(section => {
      const sectionId = (section as { id: string }).id;
      return SHARED_SECTION_IDS.includes(sectionId as typeof SHARED_SECTION_IDS[number]);
    });

  // Add default shared sections if not present
  const hasReferences = sharedSections.some(s => (s as { id: string }).id === SPECIAL_SECTION_IDS.REFERENCES);
  const hasTables = sharedSections.some(s => (s as { id: string }).id === SPECIAL_SECTION_IDS.TABLES_DATA);
  const hasFigures = sharedSections.some(s => (s as { id: string }).id === SPECIAL_SECTION_IDS.FIGURES_IMAGES);

  if (!hasReferences) {
    sharedSections.push({
      id: SPECIAL_SECTION_IDS.REFERENCES,
      documentId: mainDocumentId,
      title: 'References',
      type: 'references' as const,
      required: false,
      programCritical: false,
    });
  }

  if (!hasTables) {
    sharedSections.push({
      id: SPECIAL_SECTION_IDS.TABLES_DATA,
      documentId: mainDocumentId,
      title: 'Tables and Data',
      type: 'ancillary' as const,
      required: false,
      programCritical: false,
    });
  }

  if (!hasFigures) {
    sharedSections.push({
      id: SPECIAL_SECTION_IDS.FIGURES_IMAGES,
      documentId: mainDocumentId,
      title: 'Figures and Images',
      type: 'ancillary' as const,
      required: false,
      programCritical: false,
    });
  }

  return {
    mainDocument: {
      id: mainDocument.id,
      name: mainDocument.name,
      sections: organizedMainSections,
    },
    appendices,
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

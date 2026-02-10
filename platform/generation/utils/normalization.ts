/**
 * Document Normalization Utilities
 * Consolidated from features/editor/lib/document-flow/normalizeDocumentStructure.ts
 */

import type { DocumentStructure, Section } from '@/platform/core/types';

import { sortSectionsForSingleDocument } from '@/features/editor/lib/utils/organizeForUiRendering';

// Special section IDs
const METADATA_SECTION_ID = 'section_title_page';
const ANCILLARY_SECTION_ID = 'section_toc';
const REFERENCES_SECTION_ID = 'section_references';
const APPENDICES_SECTION_ID = 'section_appendices';
const TABLES_DATA_SECTION_ID = 'section_tables';
const FIGURES_IMAGES_SECTION_ID = 'section_figures';

/**
 * Normalize document structure to ensure consistency
 */
export function normalizeDocumentStructure(
  structure: DocumentStructure
): DocumentStructure {
  if (!structure) {
    throw new Error('Invalid document structure');
  }

  // Ensure all sections belong to a single document
  if (structure.documents.length === 0) {
    const enhancedStructure = {
      ...structure,
      documents: [
        {
          id: 'main_document',
          name: 'Main Document',
          purpose: 'Primary document',
          required: true,
        },
      ],
      sections: structure.sections.map((section: Section) => ({
        ...section,
        documentId: 'main_document',
      })),
    };

    const orderedSections = sortSectionsForSingleDocument(enhancedStructure.sections);

    return {
      ...enhancedStructure,
      sections: orderedSections,
    };
  }

  // Assign sections to main document if not assigned
  const mainDocumentId = structure.documents[0].id;
  const sectionsWithDocId = structure.sections.map((section: Section) => ({
    ...section,
    documentId: section.documentId || mainDocumentId,
  }));

  const orderedSections = sortSectionsForSingleDocument(sectionsWithDocId);

  return {
    ...structure,
    sections: orderedSections,
  };
}

/**
 * Merge uploaded content with special sections
 */
export function mergeUploadedContentWithSpecialSections(
  uploadedContent: {
    title?: string;
    sections: Array<{ title: string; content?: string; type?: string }>;
    hasTitlePage?: boolean;
    hasTOC?: boolean;
    totalPages?: number;
    wordCount?: number;
  },
  existingStructure: DocumentStructure | null = null
): DocumentStructure {
  const baseStructure: DocumentStructure = existingStructure || {
    documents: [
      {
        id: 'main_document',
        name: uploadedContent.title || 'Uploaded Document',
        purpose: 'Primary document from upload',
        required: true,
      },
    ],
    sections: uploadedContent.sections
      .filter(section => section.title.trim() !== '')
      .map((section, index) => ({
        id: getCanonicalSectionId(section.title),
        documentId: 'main_document',
        title: section.title,
        type: 'normal' as const,
        required: index < 3,
        programCritical: false,
        content: section.content,
      })),
    requirements: [],
    validationRules: [],
    aiGuidance: [],
    renderingRules: {},
    conflicts: [],
    warnings: [],
    confidenceScore: 75,
    metadata: {
      source: 'document',
      generatedAt: new Date().toISOString(),
      version: '1.0',
    },
  };

  // Apply detection and deduplication
  const deduplicatedSections = deduplicateSections(baseStructure.sections);
  const orderedSections = sortSectionsForSingleDocument(deduplicatedSections);

  return {
    ...baseStructure,
    sections: orderedSections,
  };
}

/**
 * Get canonical section ID for a given title
 */
function getCanonicalSectionId(title: string): string {
  if (!title) return `section_${Date.now()}`;

  const lowerTitle = title.toLowerCase().trim();

  if (lowerTitle.includes('title') && lowerTitle.includes('page')) {
    return METADATA_SECTION_ID;
  } else if (
    (lowerTitle.includes('table') && lowerTitle.includes('content')) ||
    lowerTitle.includes('toc') ||
    lowerTitle.includes('inhaltsverzeichnis')
  ) {
    return ANCILLARY_SECTION_ID;
  } else if (
    lowerTitle.includes('reference') ||
    lowerTitle.includes('quellen') ||
    lowerTitle.includes('literatur')
  ) {
    return REFERENCES_SECTION_ID;
  } else if (
    lowerTitle.includes('appendix') ||
    lowerTitle.includes('appendices') ||
    lowerTitle.includes('anhang') ||
    lowerTitle.includes('annex')
  ) {
    return APPENDICES_SECTION_ID;
  } else if (
    (lowerTitle.includes('table') && !lowerTitle.includes('content')) ||
    lowerTitle.includes('data') ||
    lowerTitle.includes('tabellen')
  ) {
    return TABLES_DATA_SECTION_ID;
  } else if (
    lowerTitle.includes('figure') ||
    lowerTitle.includes('image') ||
    lowerTitle.includes('grafik') ||
    lowerTitle.includes('abbildung')
  ) {
    return FIGURES_IMAGES_SECTION_ID;
  }

  const sanitizedTitle = lowerTitle.replace(/[^a-z0-9]/g, '_');
  return `section_${sanitizedTitle}`;
}

/**
 * Deduplicate sections by title
 */
function deduplicateSections(
  sections: Section[]
): Section[] {
  const seen = new Map<string, string>();

  return sections.filter(section => {
    const normalizedTitle = section.title.replace(/Appx$/, '');

    if (seen.has(normalizedTitle)) {
      return false;
    }

    seen.set(normalizedTitle, section.id);
    return true;
  });
}
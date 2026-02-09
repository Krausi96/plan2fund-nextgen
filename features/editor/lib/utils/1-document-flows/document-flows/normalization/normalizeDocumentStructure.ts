/**
 * DOCUMENT NORMALIZATION UTILITIES
 * 
 * Contains functions for normalizing document structures from various sources
 * (programs, templates, uploads) into a consistent format.
 */

import type { DocumentStructure } from '../../../../types/types';
import { sortSectionsForSingleDocument } from '../organizeForUiRendering';
import { enhanceWithSpecialSections } from '../sections/enhancement/sectionEnhancement';
import { unifiedDetectAndApply, unifiedDeduplicateSections } from '../common/documentProcessingUtils';
import {
  METADATA_SECTION_ID,
  ANCILLARY_SECTION_ID,
  REFERENCES_SECTION_ID,
  APPENDICES_SECTION_ID,
  TABLES_DATA_SECTION_ID,
  FIGURES_IMAGES_SECTION_ID
} from '../../../../constants';

/**
 * Normalize document structure to ensure consistency across all sources
 * 
 * This function takes a document structure from any source (program, template, upload)
 * and normalizes it by:
 * 1. Ensuring all required special sections exist
 * 2. Properly organizing sections into a single document
 * 3. Applying canonical ordering
 * 
 * @param structure - Initial document structure from any source
 * @param t - Translation function for special section titles
 * @returns Normalized document structure with all special sections included
 */
export function normalizeDocumentStructure(
  structure: DocumentStructure,
  _t: (key: string) => string
): DocumentStructure {
  // Ensure all special sections exist in the structure
  const normalizedStructure = structure;

  // Handle case where enhanceWithSpecialSections might return null
  if (!normalizedStructure) {
    throw new Error('Failed to enhance document structure with special sections');
  }

  // Make sure all sections belong to a single document if they don't already
  if (normalizedStructure.documents.length === 0) {
    // If no documents defined, create a default main document
    const enhancedStructure = {
      ...normalizedStructure,
      structureId: normalizedStructure.structureId || `normalized-${Date.now()}`,
      documents: [
        {
          id: 'main_document',
          name: 'Main Document',
          purpose: 'Primary document',
          required: true
        }
      ],
      sections: normalizedStructure.sections.map((section: any) => ({
        ...section,
        documentId: 'main_document' // Assign all sections to the main document
      }))
    };
    
    // Apply canonical ordering to ensure sections are in the proper order
    const orderedSections = sortSectionsForSingleDocument(enhancedStructure.sections);
    
    return {
      ...enhancedStructure,
      sections: orderedSections
    };
  }

  // If there are multiple documents but content sections aren't assigned properly,
  // ensure that special sections are in the main document
  const mainDocumentId = normalizedStructure.documents[0].id;
  
  const structureWithCorrectDocuments = {
    ...normalizedStructure,
    structureId: normalizedStructure.structureId || `normalized-${Date.now()}`,
    sections: normalizedStructure.sections.map((section: any) => ({
      ...section,
      documentId: section.documentId || mainDocumentId
    }))
  };
  
  // Apply canonical ordering to ensure sections are in the proper order
  const orderedSections = sortSectionsForSingleDocument(structureWithCorrectDocuments.sections);
  
  return {
    ...structureWithCorrectDocuments,
    sections: orderedSections
  };
}

/**
 * Merge uploaded document content with special sections
 * 
 * This function specifically handles merging content from uploaded documents
 * (DOCX/PDF) with special sections (title page, TOC, references, etc.)
 * 
 * @param uploadedContent - Content extracted from uploaded document
 * @param existingStructure - Existing document structure (optional)
 * @param t - Translation function for special section titles
 * @returns Merged document structure combining uploaded content with special sections
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
  existingStructure: DocumentStructure | null = null,
  t: (key: string) => string
): DocumentStructure {
  // Create initial structure from uploaded content
  const baseStructure: DocumentStructure = existingStructure || {
    structureId: `merged-${Date.now()}`,
    version: '1.0',
    source: 'template' as const,
    documents: [
      { 
        id: 'main_document', 
        name: uploadedContent.title || 'Uploaded Document', 
        purpose: 'Primary document from upload', 
        required: true 
      }
    ],
    sections: uploadedContent.sections
      .filter(section => section.title.trim() !== '') // Filter out sections with empty titles
      .map((section, index) => ({
        id: getCanonicalSectionId(section.title), // Use canonical ID if it's a known special section
        documentId: 'main_document',
        title: section.title,
        type: index < 3 ? 'required' : 'optional' as 'required' | 'optional' | 'conditional',
        required: index < 3,
        programCritical: false,
        ...(section.content && { content: section.content }),
        ...(section.type && { sectionType: section.type }),
        // Preserve subsections if they exist in the section
        ...((section as any).rawSubsections && { rawSubsections: (section as any).rawSubsections })
      })),
    requirements: [],
    validationRules: [],
    aiGuidance: [],
    renderingRules: {},
    conflicts: [],
    warnings: [],
    confidenceScore: 75,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'upload-merger'
  };
  
  // Apply detection and enhancement to enrich existing sections
  let structureWithDetectedContent = unifiedDetectAndApply(baseStructure, uploadedContent);
  
  // But avoid duplicating sections that were already detected
  const enhancedStructure = enhanceWithSpecialSections(structureWithDetectedContent, t) || structureWithDetectedContent;
  
  // Remove duplicate sections first to clean up the structure using unified utility
  const deduplicatedStructure = {
    ...enhancedStructure,
    sections: unifiedDeduplicateSections(enhancedStructure.sections)
  };
  
  // Apply canonical ordering AFTER deduplication to ensure proper final order
  const orderedSections = sortSectionsForSingleDocument(deduplicatedStructure.sections);
  
  const finalStructure = {
    ...deduplicatedStructure,
    sections: orderedSections
  };
  
  return finalStructure;
}


/**
 * Get the canonical section ID for a given section title
 * Maps known special section titles to their canonical IDs
 * 
 * @param title - Section title
 * @returns Canonical section ID or a generated ID if not a known special section
 */
function getCanonicalSectionId(title: string): string {
  if (!title) return `section_${Date.now()}`;
  
  const lowerTitle = title.toLowerCase().trim();
  
  // Map known special section titles to their canonical IDs
  if (lowerTitle.includes('title') && lowerTitle.includes('page')) {
    return METADATA_SECTION_ID;
  } else if ((lowerTitle.includes('table') && lowerTitle.includes('content')) || lowerTitle.includes('toc') || lowerTitle.includes('inhaltsverzeichnis')) {
    return ANCILLARY_SECTION_ID;
  } else if (lowerTitle.includes('reference') || lowerTitle.includes('quellen') || lowerTitle.includes('literatur')) {
    return REFERENCES_SECTION_ID;
  } else if (lowerTitle.includes('appendix') || lowerTitle.includes('appendices') || lowerTitle.includes('anhang') || lowerTitle.includes('annex')) {
    return APPENDICES_SECTION_ID;
  } else if ((lowerTitle.includes('table') && !lowerTitle.includes('content')) || lowerTitle.includes('data') || lowerTitle.includes('tabellen')) {
    return TABLES_DATA_SECTION_ID;
  } else if (lowerTitle.includes('figure') || lowerTitle.includes('image') || lowerTitle.includes('grafik') || lowerTitle.includes('abbildung')) {
    return FIGURES_IMAGES_SECTION_ID;
  }
  
  // For all other sections (regardless of name), create a sanitized ID
  const sanitizedTitle = lowerTitle.replace(/[^a-z0-9]/g, '_');
  return `section_${sanitizedTitle}`;
}
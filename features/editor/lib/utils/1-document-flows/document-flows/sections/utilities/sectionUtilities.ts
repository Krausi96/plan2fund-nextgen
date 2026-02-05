/**
 * SECTION UTILITIES
 * 
 * Contains various section-related utility functions including sorting, list handling, and metadata.
 * DEPRECATED: Use functions from sectionDetection.ts, sectionSorting.ts, and sectionEnhancement.ts instead
 */

import { getSectionIcon as getSectionIconNew, isSpecialSection as isSpecialSectionNew } from '../enhancement/sectionDetection';
import { sortSectionsByCanonicalOrder as sortSectionsByCanonicalOrderNew } from '../enhancement/sectionSorting';
import { enhanceWithSpecialSections as enhanceWithSpecialSectionsNew, createSpecialSection as createSpecialSectionNew } from '../enhancement/sectionEnhancement';

import type { SectionTemplate } from '@/features/editor/lib/types/types';

// Import constants from the correct location
import {
  METADATA_SECTION_ID,
  ANCILLARY_SECTION_ID,
  REFERENCES_SECTION_ID,
  APPENDICES_SECTION_ID,
  TABLES_DATA_SECTION_ID,
  FIGURES_IMAGES_SECTION_ID
} from '@/features/editor/lib/constants';

/**
 * Sort sections according to hierarchical document order
 * For single document: Maintains canonical order
 * For multiple documents: Orders as Main doc → Appendices → Shared sections
 * @deprecated Use sortSectionsByCanonicalOrder from sectionSorting.ts instead
 */
export function sortSectionsByCanonicalOrder<T extends { id: string; documentId: string }>(
  sections: T[],
  documents: Array<{ id: string; name: string; purpose: string; required: boolean }> = []
): T[] {
  return sortSectionsByCanonicalOrderNew(sections, documents);
}

/**
 * Get complete section list including special sections for display purposes
 * Combines template sections with special sections (Title Page, TOC, References, Appendices)
 * 
 * @param templateSections - Sections from MASTER_SECTIONS or document structure
 * @returns Complete section list with proper icons and ordering
 * @deprecated Use section utilities from the new modular files instead
 */
export function getCompleteSectionList(
  templateSections: SectionTemplate[]): SectionTemplate[] {
  // All special sections are now included in templateSections via MASTER_SECTIONS
  // No need for separate specialSections or trailingSections arrays
  
  // Add icons to all sections
  const sectionsWithIcons = templateSections.map(section => ({
    ...section,
    icon: section.icon || getSectionIconNew(section.id) // Default icon for sections without specific icons
  }));
  
  return sectionsWithIcons;
}

/**
 * Get section icon by section ID
 * Maps section IDs to appropriate emoji icons
 * 
 * @param sectionId - Section identifier
 * @returns Emoji icon string
 * @deprecated Use getSectionIcon from sectionDetection.ts instead
 */
export function getSectionIcon(sectionId: string): string {
  return getSectionIconNew(sectionId);
}

/**
 * Check if section is a special section
 * 
 * @param sectionId - Section identifier
 * @returns boolean indicating if it's a special section
 * @deprecated Use isSpecialSection from sectionDetection.ts instead
 */
export function isSpecialSection(sectionId: string): boolean {
  return isSpecialSectionNew(sectionId);
}

// Define special section types
export type SpecialSectionType = 'metadata' | 'ancillary' | 'references' | 'appendices' | 'tables_data' | 'figures_images';

/**
 * Get special section configuration by type
 * @deprecated Use getSpecialSectionConfig from sectionDetection.ts instead
 */
export function getSpecialSectionConfig(type: SpecialSectionType) {
  // This function is kept for backward compatibility
  // The actual implementation is in sectionDetection.ts
  const configMap: Record<SpecialSectionType, any> = {
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
  return configMap[type];
}

/**
 * Create a special section object
 * @deprecated Use createSpecialSection from sectionEnhancement.ts instead
 */
export function createSpecialSection(
  type: SpecialSectionType,
  documentId: string,
  t: (key: string) => string,
  customTitle?: string
): any {
  return createSpecialSectionNew(type, documentId, t, customTitle);
}

/**
 * Enhance document structure with missing special sections
 * @deprecated Use enhanceWithSpecialSections from sectionEnhancement.ts instead
 */
export function enhanceWithSpecialSectionsCentralized(
  documentStructure: any,
  t: (key: string) => string,
  hasMultipleDocuments: boolean = false
): any {
  return enhanceWithSpecialSectionsNew(documentStructure, t, hasMultipleDocuments);
}
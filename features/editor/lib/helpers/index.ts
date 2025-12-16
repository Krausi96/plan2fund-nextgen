/**
 * CENTRALIZED HELPERS EXPORT
 * 
 * Re-exports all helper functions and constants for easy importing
 */

// Section helpers
export {
  METADATA_SECTION_ID,
  ANCILLARY_SECTION_ID,
  REFERENCES_SECTION_ID,
  APPENDICES_SECTION_ID,
  SPECIAL_SECTION_IDS,
  isSpecialSectionId,
  isMetadataSection,
  isAncillarySection,
  isReferencesSection,
  isAppendicesSection,
  getSpecialSectionTitleFromT,
  getSectionTitle,
  createMetadataSectionSimplified,
  createAncillarySectionSimplified,
  createReferencesSectionSimplified,
  createAppendicesSectionSimplified,
  buildSectionsForConfig,
  buildSectionsForSidebar,
  combineSectionTemplatesWithSpecial,
  type BuildSectionsOptions,
  type SectionWithMetadata,
} from './sections';

// Document helpers
export {
  buildDocumentsForConfig,
  buildDocumentsForBar,
  getDocumentCounts,
  type BuildDocumentsOptions,
  type DocumentWithMetadata,
} from './documents';

// Re-export other helpers
export * from './editorHelpers';
export * from './componentPropsHelpers';
export * from './templateHandlersHelpers';
export * from './editorContextHelpers';

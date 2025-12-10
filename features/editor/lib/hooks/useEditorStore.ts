// Compatibility layer - re-exports from new store structure
// This file maintains backward compatibility while the codebase is migrated

// Re-export store and actions
export { useEditorStore, useEditorActions } from './core/store';

// Re-export types
export type { EditorStoreState, EditorActions, ProgressSummary, AISuggestionIntent, AISuggestionOptions } from './core/store/types';

// Re-export metadata and program helpers (consolidated in editorHelpers)
export {
  METADATA_SECTION_ID,
  ANCILLARY_SECTION_ID,
  REFERENCES_SECTION_ID,
  APPENDICES_SECTION_ID,
  defaultTitlePage,
  defaultAncillary,
  isMetadataSection,
  isMetadataComplete,
  getMetadataFieldValue,
  REQUIRED_METADATA_FIELDS,
  type RequiredMetadataField,
  mapProgramTypeToFunding,
  normalizeProgramInput
} from '../helpers/editorHelpers';


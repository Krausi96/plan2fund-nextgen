/**
 * Generation Layer - Consolidated from features/editor/lib/document-flow/
 * 
 * Unified generation utilities for:
 * - Document structure generation from programs
 * - Document structure generation from uploads
 * - Unified output: DocumentStructure
 */

export {
  processUploadedDocument,
  type DocumentProcessingResult
} from './lib/documentProcessor';

export {
  normalizeDocumentStructure,
  mergeUploadedContentWithSpecialSections
} from './lib/normalization';

export {
  organizeForUiRendering,
  type HierarchicalDocumentView
} from './lib/organizeForUiRendering';

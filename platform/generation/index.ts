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
} from './documentProcessor';

export {
  normalizeDocumentStructure,
  mergeUploadedContentWithSpecialSections
} from './normalization';

export {
  organizeForUiRendering,
  type HierarchicalDocumentView
} from './organizeForUiRendering';

export {
  buildDocumentStructure,
  type ParsedDocumentData,
  type DetectionMap,
  type SectionDetection,
  type SpecialSection
} from './structureBuilder';

export {
  generateBlueprint,
  type RequirementItem,
  type Blueprint
} from './blueprintGenerator';

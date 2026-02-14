/**
 * Generation Layer - Public API
 */

// DocumentStructure builder - single source of truth
export {
  buildDocumentStructure
} from './structure';

// DEPRECATED: Blueprint types removed - consolidated into DocumentStructure

export type {
  ParsedDocumentData,
  DetectionMap,
  SectionDetection,
  SpecialSection
} from '@/platform/core/types/project';

export {
  writeSection
} from './plan';

// Note: Blueprint generation moved to orchestrator (callAI with type 'generateBlueprint')

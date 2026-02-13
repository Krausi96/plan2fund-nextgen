/**
 * Generation Layer - Public API
 */

// DocumentStructure builder - single source of truth
export {
  buildDocumentStructure
} from './structure';

export type {
  Blueprint
} from '@/platform/core/types';

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

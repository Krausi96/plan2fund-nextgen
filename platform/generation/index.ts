/**
 * Generation Layer - Public API
 */
export {
  normalizeDocumentStructure,
  mergeUploadedContentWithSpecialSections
} from './utils';

export {
  buildDocumentStructure
} from './structure';

export {
  generateBlueprint,
  type RequirementItem
} from './blueprint';

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
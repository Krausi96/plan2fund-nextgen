/**
 * Generation Layer - Public API
 */
export {
  normalizeDocumentStructure,
  mergeUploadedContentWithSpecialSections
} from './normalization';

export {
  buildDocumentStructure
} from './structureBuilder';

export {
  generateBlueprint,
  type RequirementItem
} from './blueprintGenerator';

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
} from './sectionWriter';
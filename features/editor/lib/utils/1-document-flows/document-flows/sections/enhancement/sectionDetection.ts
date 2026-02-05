/**
 * SECTION DETECTION
 * 
 * Contains functions for detecting and identifying special sections in document structures
 */

import {
  METADATA_SECTION_ID,
  ANCILLARY_SECTION_ID,
  REFERENCES_SECTION_ID,
  APPENDICES_SECTION_ID,
  TABLES_DATA_SECTION_ID,
  FIGURES_IMAGES_SECTION_ID
} from '@/features/editor/lib/constants';

// Define special section types
export type SpecialSectionType = 'metadata' | 'ancillary' | 'references' | 'appendices' | 'tables_data' | 'figures_images';

// Interface for special section configuration
interface SpecialSectionConfig {
  id: string;
  type: 'required' | 'optional';
  icon: string;
  titleKey: string;
}

// Mapping of special section types to their configurations
const SPECIAL_SECTION_CONFIG: Record<SpecialSectionType, SpecialSectionConfig> = {
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

/**
 * Get special section configuration by type
 */
export function getSpecialSectionConfig(type: SpecialSectionType): SpecialSectionConfig {
  return SPECIAL_SECTION_CONFIG[type];
}

/**
 * Check if section is a special section
 * 
 * @param sectionId - Section identifier
 * @returns boolean indicating if it's a special section
 */
export function isSpecialSection(sectionId: string): boolean {
  return [
    METADATA_SECTION_ID,
    ANCILLARY_SECTION_ID,
    REFERENCES_SECTION_ID,
    APPENDICES_SECTION_ID,
    'tables_data',
    'figures_images'
  ].includes(sectionId);
}

/**
 * Get section icon by section ID
 * Maps section IDs to appropriate emoji icons
 * 
 * @param sectionId - Section identifier
 * @returns Emoji icon string
 */
export function getSectionIcon(sectionId: string): string {
  const iconMap: Record<string, string> = {
    [METADATA_SECTION_ID]: '📕',
    [ANCILLARY_SECTION_ID]: '📑',
    [REFERENCES_SECTION_ID]: '📚',
    'tables_data': '📊',
    'figures_images': '🖼️',
    [APPENDICES_SECTION_ID]: '📎',
    // Default for regular sections
    'default': '🧾'
  };
  
  return iconMap[sectionId] || iconMap['default'];
}

/**
 * Get default title for special section type
 */
function getDefaultTitle(type: SpecialSectionType): string {
  const titles: Record<SpecialSectionType, string> = {
    metadata: 'Title Page',
    ancillary: 'Table of Contents',
    references: 'References',
    appendices: 'Appendices',
    tables_data: 'Tables and Data',
    figures_images: 'Figures and Images'
  };
  return titles[type];
}
// Template constants and collections
// CANONICAL SOURCE for all section/template definitions
//
// ORDER DEFINITION:
// Order logic is applied by sortSectionsForSingleDocument() at:
//   platform/generation/structure/structureBuilder.ts
//
// Order values:
//   - Template sections: 1-99 (defined in product catalogs)
//   - metadata (Title Page): 1
//   - ancillary (TOC): 2
//   - references: 100
//   - tables_data: 101
//   - figures_images: 102
//   - appendices: 103

import type { ProductOption, ProductType, SectionTemplate, DocumentTemplate } from '@/platform/core/types';

// ============================================================================
// PRODUCT OPTIONS
// ============================================================================

/**
 * Default product options available in the editor.
 */
export const DEFAULT_PRODUCT_OPTIONS: ProductOption[] = [
  { value: 'submission', label: 'planTypes.custom.title', description: 'planTypes.custom.description', icon: '📋' },
  { value: 'strategy', label: 'planTypes.strategy.title', description: 'planTypes.strategy.description', icon: '💡' },
];

export function getSelectedProductMeta(options: ProductOption[], product: ProductType | null): ProductOption | null {
  if (!product) return null;
  return options.find((option) => option.value === product) ?? null;
}

// ============================================================================
// SPECIAL SECTION IDs AND DEFINITIONS
// ============================================================================

export const SPECIAL_SECTION_IDS = {
  METADATA: 'metadata',
  ANCILLARY: 'ancillary',
  REFERENCES: 'references',
  APPENDICES: 'appendices',
  TABLES_DATA: 'tables_data',
  FIGURES_IMAGES: 'figures_images'
} as const;

// Special section definitions - CANONICAL SOURCE with order values
export const SPECIAL_SECTIONS = {
  [SPECIAL_SECTION_IDS.METADATA]: { id: 'metadata', title: 'Title Page', icon: '📕', required: true, category: 'general', order: 1 },
  [SPECIAL_SECTION_IDS.ANCILLARY]: { id: 'ancillary', title: 'Table of Contents', icon: '📑', required: true, category: 'general', order: 2 },
  [SPECIAL_SECTION_IDS.REFERENCES]: { id: 'references', title: 'References', icon: '📚', required: false, category: 'general', order: 100 },
  [SPECIAL_SECTION_IDS.TABLES_DATA]: { id: 'tables_data', title: 'Tables/Data', icon: '📊', required: false, category: 'general', order: 101 },
  [SPECIAL_SECTION_IDS.FIGURES_IMAGES]: { id: 'figures_images', title: 'Figures/Images', icon: '🖼️', required: false, category: 'general', order: 102 },
  [SPECIAL_SECTION_IDS.APPENDICES]: { id: 'appendices', title: 'Appendices', icon: '📎', required: false, category: 'general', order: 103 }
} as const;

// Backward compatibility exports
export const METADATA_SECTION_ID = SPECIAL_SECTION_IDS.METADATA;
export const ANCILLARY_SECTION_ID = SPECIAL_SECTION_IDS.ANCILLARY;
export const REFERENCES_SECTION_ID = SPECIAL_SECTION_IDS.REFERENCES;
export const APPENDICES_SECTION_ID = SPECIAL_SECTION_IDS.APPENDICES;
export const TABLES_DATA_SECTION_ID = SPECIAL_SECTION_IDS.TABLES_DATA;
export const FIGURES_IMAGES_SECTION_ID = SPECIAL_SECTION_IDS.FIGURES_IMAGES;

// ============================================================================
// SECTION HELPERS
// ============================================================================

export function isSpecialSectionId(sectionId: string): boolean {
  return Object.values(SPECIAL_SECTION_IDS).includes(sectionId as any);
}

export function getSpecialSection(id: string) {
  return SPECIAL_SECTIONS[id as keyof typeof SPECIAL_SECTIONS] || null;
}

export function getSectionTitle(sectionId: string, originalTitle: string, t?: (key: any) => string): string {
  if (sectionId === METADATA_SECTION_ID) return t?.('editor.section.metadata' as any) || 'Title Page';
  if (sectionId === ANCILLARY_SECTION_ID) return t?.('editor.section.ancillary' as any) || 'Table of Contents';
  if (sectionId === REFERENCES_SECTION_ID) return t?.('editor.section.references' as any) || 'References';
  if (sectionId === APPENDICES_SECTION_ID) return t?.('editor.section.appendices' as any) || 'Appendices';
  if (sectionId.startsWith('custom_')) return originalTitle || 'Untitled Section';
  const translationKey = `editor.section.${sectionId}` as any;
  const translated = t?.(translationKey);
  return (translated && typeof translated === 'string' && translated !== translationKey) ? translated : originalTitle;
}

// ============================================================================
// SECTION CATALOGS
// ============================================================================

import { BUSINESS_PLAN_SECTIONS } from '../catalog/products/business_plan';
import { STRATEGY_SECTIONS } from '../catalog/products/strategy';

// Convert SPECIAL_SECTIONS to SectionTemplate format
export const SHARED_SPECIAL_SECTIONS: SectionTemplate[] = Object.values(SPECIAL_SECTIONS).map((section) => ({
  id: section.id,
  title: section.title,
  description: `Special section: ${section.title}`,
  required: section.required,
  category: section.category,
  origin: 'template',
  icon: section.icon,
  order: section.order,
}));

// Master sections collection
// Special sections MUST come first for sortSectionsForSingleDocument to work correctly
export const MASTER_SECTIONS: Record<string, SectionTemplate[]> = {
  strategy: [...SHARED_SPECIAL_SECTIONS, ...STRATEGY_SECTIONS],
  submission: [...SHARED_SPECIAL_SECTIONS, ...BUSINESS_PLAN_SECTIONS],
};

// Document templates
export const MASTER_DOCUMENTS_BY_PRODUCT: Record<string, DocumentTemplate[]> = {
  strategy: [],
  submission: [],
};
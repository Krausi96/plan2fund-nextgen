/**
 * ============================================================================
 * EDITOR CONSTANTS
 * ============================================================================
 * 
 * Constants, IDs, and product options used throughout the editor.
 * 
 * USED BY:
 *   - Store (editorStore.ts)
 *   - Selectors (useEditorSelectors.ts)
 *   - Components (Sidebar, DocumentsBar, etc.)
 * ============================================================================
 */

import type { ProductOption, ProductType } from './types/types';

// ============================================================================
// PRODUCT OPTIONS
// ============================================================================

/**
 * Default product options available in the editor.
 * 
 * Defines the three product types users can select:
 * - Submission: For grant applications
 * - Review: For document revisions
 * - Strategy: For strategic planning
 * 
 * Used in ProductSelection component and throughout the editor.
 */
export const DEFAULT_PRODUCT_OPTIONS: ProductOption[] = [
  {
    value: 'submission',
    label: 'planTypes.custom.title',
    description: 'planTypes.custom.description',
    icon: '📋',
  },

  {
    value: 'strategy',
    label: 'planTypes.strategy.title',
    description: 'planTypes.strategy.description',
    icon: '💡',
  },
  {
    value: 'upgrade',
    label: 'planTypes.upgrade.title',
    description: 'planTypes.upgrade.description',
    icon: '♻️',
  },
];

/**
 * Get product metadata (label, description, icon) for a given product type.
 * 
 * Looks up product option from array by value. Used to display product information
 * in UI components like ProductSelection and Sidebar.
 * 
 * @param options - Array of product options to search
 * @param product - Product type value ('submission', 'review', 'strategy', or null)
 * @returns Product option object with label/description/icon, or `null` if not found
 * 
 * @example
 * ```tsx
 * const meta = getSelectedProductMeta(DEFAULT_PRODUCT_OPTIONS, 'submission');
 * // Returns: { value: 'submission', label: 'Submission', description: '...', icon: '📋' }
 * 
 * <span>{meta?.label}</span> // "Submission"
 * ```
 */
export function getSelectedProductMeta(
  options: ProductOption[],
  product: ProductType | null
): ProductOption | null {
  if (!product) return null;
  return options.find((option) => option.value === product) ?? null;
}

// ============================================================================
// SECTION ID CONSTANTS
// ============================================================================

// Enhanced Special section IDs and definitions with icons
export const SPECIAL_SECTION_IDS = {
  METADATA: 'metadata',
  ANCILLARY: 'ancillary',
  REFERENCES: 'references',
  APPENDICES: 'appendices',
  TABLES_DATA: 'tables_data',
  FIGURES_IMAGES: 'figures_images'
} as const;

// Special section definitions with icons
export const SPECIAL_SECTIONS = {
  [SPECIAL_SECTION_IDS.METADATA]: {
    id: SPECIAL_SECTION_IDS.METADATA,
    title: 'Title Page',
    icon: '📕',
    required: true,
    category: 'general'
  },
  [SPECIAL_SECTION_IDS.ANCILLARY]: {
    id: SPECIAL_SECTION_IDS.ANCILLARY,
    title: 'Table of Contents',
    icon: '📑',
    required: true,
    category: 'general'
  },
  [SPECIAL_SECTION_IDS.REFERENCES]: {
    id: SPECIAL_SECTION_IDS.REFERENCES,
    title: 'References',
    icon: '📚',
    required: false,
    category: 'general'
  },
  [SPECIAL_SECTION_IDS.TABLES_DATA]: {
    id: SPECIAL_SECTION_IDS.TABLES_DATA,
    title: 'Tables/Data',
    icon: '📊',
    required: false,
    category: 'general'
  },
  [SPECIAL_SECTION_IDS.FIGURES_IMAGES]: {
    id: SPECIAL_SECTION_IDS.FIGURES_IMAGES,
    title: 'Figures/Images',
    icon: '🖼️',
    required: false,
    category: 'general'
  },
  [SPECIAL_SECTION_IDS.APPENDICES]: {
    id: SPECIAL_SECTION_IDS.APPENDICES,
    title: 'Appendices',
    icon: '📎',
    required: false,
    category: 'general'
  }
} as const;

// Canonical order for single document
export const SINGLE_DOC_CANONICAL_ORDER = [
  SPECIAL_SECTION_IDS.METADATA,
  SPECIAL_SECTION_IDS.ANCILLARY,
  // Regular sections would go here
  SPECIAL_SECTION_IDS.REFERENCES,
  SPECIAL_SECTION_IDS.TABLES_DATA,
  SPECIAL_SECTION_IDS.FIGURES_IMAGES,
  SPECIAL_SECTION_IDS.APPENDICES
];

// Canonical order for multi-document
export const MULTI_DOC_CANONICAL_ORDER = [
  SPECIAL_SECTION_IDS.METADATA,
  SPECIAL_SECTION_IDS.ANCILLARY,
  // Regular sections would go here in their documents
  SPECIAL_SECTION_IDS.APPENDICES, // Appendices section comes before shared sections in multi-doc
  SPECIAL_SECTION_IDS.REFERENCES,
  SPECIAL_SECTION_IDS.TABLES_DATA,
  SPECIAL_SECTION_IDS.FIGURES_IMAGES
];

// Backwards compatibility exports (preserve existing constants)
export const METADATA_SECTION_ID = SPECIAL_SECTION_IDS.METADATA;
export const ANCILLARY_SECTION_ID = SPECIAL_SECTION_IDS.ANCILLARY;
export const REFERENCES_SECTION_ID = SPECIAL_SECTION_IDS.REFERENCES;
export const APPENDICES_SECTION_ID = SPECIAL_SECTION_IDS.APPENDICES;
export const TABLES_DATA_SECTION_ID = SPECIAL_SECTION_IDS.TABLES_DATA;
export const FIGURES_IMAGES_SECTION_ID = SPECIAL_SECTION_IDS.FIGURES_IMAGES;

/**
 * Check if a section ID is a special section (metadata, ancillary, etc.)
 */
export function isSpecialSectionId(sectionId: string): boolean {
  return Object.values(SPECIAL_SECTION_IDS).includes(sectionId as any);
}

/**
 * Get special section by ID
 */
export function getSpecialSection(id: string) {
  return SPECIAL_SECTIONS[id as keyof typeof SPECIAL_SECTIONS] || null;
}

/**
 * Get translated section title for special sections, or return original title.
 * 
 * Returns translated title for special sections (metadata, ancillary, references, appendices),
 * otherwise returns the original title unchanged. Used when displaying section names.
 * 
 * @param sectionId - Section ID to check
 * @param originalTitle - Original section title (used for non-special sections)
 * @param t - Optional translation function (i18n)
 * @returns Translated title for special sections, or original title
 * 
 * @example
 * ```tsx
 * getSectionTitle('metadata', 'Title Page', t) // → "Title Page" (translated)
 * getSectionTitle('executive-summary', 'Executive Summary', t) // → "Executive Summary"
 * ```
 */
export function getSectionTitle(
  sectionId: string,
  originalTitle: string,
  t?: (key: any) => string
): string {
  // For special sections, use translation keys
  if (sectionId === METADATA_SECTION_ID) {
    return t?.('editor.section.metadata' as any) || 'Title Page';
  }
  if (sectionId === ANCILLARY_SECTION_ID) {
    return t?.('editor.section.ancillary' as any) || 'Table of Contents';
  }
  if (sectionId === REFERENCES_SECTION_ID) {
    return t?.('editor.section.references' as any) || 'References';
  }
  if (sectionId === APPENDICES_SECTION_ID) {
    return t?.('editor.section.appendices' as any) || 'Appendices';
  }
  
  // For custom sections (those with 'custom_' prefix), return the original title directly
  // Custom sections should display the user-entered title as-is
  if (sectionId.startsWith('custom_')) {
    return originalTitle && typeof originalTitle === 'string' ? originalTitle : 'Untitled Section';
  }
  
  // For regular sections, try to translate using section ID
  const translationKey = `editor.section.${sectionId}` as any;
  const translated = t?.(translationKey);
  
  // Return translated title if found and different from key, otherwise return original
  // Safety check to ensure we always return a valid title
  if (translated && typeof translated === 'string' && translated !== translationKey) {
    return translated;
  }
  
  // Always return the original title as fallback
  return originalTitle && typeof originalTitle === 'string' ? originalTitle : 'Untitled Section';
}

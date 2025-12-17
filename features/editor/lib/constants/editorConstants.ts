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

import type { ProductOption, ProductType } from '../types/types';

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
    label: 'Submission',
    description: 'Optimized for grant applications with all required sections for formal submissions',
    icon: '📋',
  },
  {
    value: 'review',
    label: 'Review',
    description: 'Focused on revisions of existing documents',
    icon: '🔍',
  },
  {
    value: 'strategy',
    label: 'Strategy',
    description: 'Designed for strategic planning and business development',
    icon: '📊',
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

export const METADATA_SECTION_ID = 'metadata';
export const ANCILLARY_SECTION_ID = 'ancillary';
export const REFERENCES_SECTION_ID = 'references';
export const APPENDICES_SECTION_ID = 'appendices';

/**
 * Check if a section ID is a special section (metadata, ancillary, etc.)
 */
export function isSpecialSectionId(sectionId: string): boolean {
  return [
    METADATA_SECTION_ID,
    ANCILLARY_SECTION_ID,
    REFERENCES_SECTION_ID,
    APPENDICES_SECTION_ID
  ].includes(sectionId);
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
  if (sectionId === METADATA_SECTION_ID) {
    return t?.('editor.sections.metadata.title' as any) || 'Title Page';
  }
  if (sectionId === ANCILLARY_SECTION_ID) {
    return t?.('editor.sections.ancillary.title' as any) || 'Table of Contents';
  }
  if (sectionId === REFERENCES_SECTION_ID) {
    return t?.('editor.sections.references.title' as any) || 'References';
  }
  if (sectionId === APPENDICES_SECTION_ID) {
    return t?.('editor.sections.appendices.title' as any) || 'Appendices';
  }
  return originalTitle;
}

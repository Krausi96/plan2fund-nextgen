// ========= EDITOR CONTEXT HELPERS =========
// Shared helpers for editor context values used across multiple components
// These eliminate duplicate calls to getSelectedProductMeta, getDocumentSections, etc.

import type { ProductType } from '@/features/editor/lib/types/plan';
import { getSelectedProductMeta, getDocumentSections, getSelectedDocumentName } from './editorHelpers';

/**
 * Editor context values that are shared across all editor components
 * These come from the parent Editor component and are passed down
 */
export interface EditorContextValues {
  productOptions: Array<{ value: ProductType; label: string; description: string; icon?: string }>;
  selectedProduct: ProductType | null;
  selectedProductMeta: { value: ProductType; label: string; description: string; icon?: string } | null;
}

/**
 * Create editor context values from product options and selected product
 * This eliminates duplicate getSelectedProductMeta calls across components
 */
export function createEditorContext(
  productOptions: Array<{ value: ProductType; label: string; description: string; icon?: string }>,
  selectedProduct: ProductType | null
): EditorContextValues {
  return {
    productOptions,
    selectedProduct,
    selectedProductMeta: getSelectedProductMeta(productOptions, selectedProduct)
  };
}

/**
 * Document context values for document-specific operations
 * These are computed from plan and document selection
 */
export interface DocumentContextValues {
  selectedDocumentName: string | null;
  documentSections: ReturnType<typeof getDocumentSections>;
}

/**
 * Create document context values from plan and document ID
 * This eliminates duplicate getDocumentSections/getSelectedDocumentName calls
 */
export function createDocumentContext(
  plan: any,
  clickedDocumentId: string | null
): DocumentContextValues {
  return {
    selectedDocumentName: getSelectedDocumentName(plan, clickedDocumentId),
    documentSections: getDocumentSections(plan, clickedDocumentId)
  };
}


/**
 * ============================================================================
 * DOCUMENT BUILDERS
 * ============================================================================
 * 
 * Functions for building documents with metadata for different views.
 * 
 * USED BY:
 *   - Selectors (useEditorSelectors.ts)
 *   - Components that need document lists (DocumentsBar, Configurator, etc.)
 * ============================================================================
 */

import type { DocumentTemplate } from '../types/types';
import type { DocumentWithMetadata } from './editorStore';

export type { DocumentWithMetadata } from './editorStore';

type BuildDocumentsForConfigParams = {
  allDocuments: DocumentTemplate[];
  disabledDocumentIds: string[];
  selectedProductMeta?: any | null;
};

/**
 * Build documents list for configuration/management view.
 * 
 * Transforms document templates into documents with metadata (disabled state, origin).
 * Used in SectionsDocumentsManagement and DocumentsBar components.
 * 
 * @param params - Configuration object
 * @param params.allDocuments - All available document templates
 * @param params.disabledDocumentIds - IDs of disabled documents
 * @returns Array of documents with metadata (id, name, isDisabled, origin)
 * 
 * @example
 * ```tsx
 * const documents = buildDocumentsForConfig({
 *   allDocuments: templates,
 *   disabledDocumentIds: ['doc-1']
 * });
 * // Returns: [{ id: 'doc-1', name: 'Doc 1', isDisabled: true, origin: 'template' }, ...]
 * ```
 */
export function buildDocumentsForConfig(params: BuildDocumentsForConfigParams): DocumentWithMetadata[] {
  const { allDocuments, disabledDocumentIds } = params;

  return allDocuments.map(doc => ({
    id: doc.id,
    name: doc.name,
    isDisabled: disabledDocumentIds.includes(doc.id),
    origin: doc.origin || 'template'
  }));
}

/**
 * Calculate document counts (enabled and total).
 * 
 * Counts how many documents are enabled (not disabled) and total count.
 * Used to display counts in UI (e.g., "Documents (5/10)").
 * 
 * @param allDocuments - All available document templates
 * @param disabledDocumentIds - IDs of disabled documents
 * @returns Object with `enabledCount` and `totalCount`
 * 
 * @example
 * ```tsx
 * const counts = getDocumentCounts(allDocuments, ['doc-1', 'doc-2']);
 * // Returns: { enabledCount: 8, totalCount: 10 }
 * 
 * <span>Documents ({counts.enabledCount}/{counts.totalCount})</span>
 * ```
 */
export function getDocumentCounts(
  allDocuments: DocumentTemplate[],
  disabledDocumentIds: string[]
): { enabledCount: number; totalCount: number } {
  return {
    enabledCount: allDocuments.filter(doc => !disabledDocumentIds.includes(doc.id)).length,
    totalCount: allDocuments.length
  };
}

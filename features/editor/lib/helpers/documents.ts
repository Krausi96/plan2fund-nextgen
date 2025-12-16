/**
 * CENTRALIZED DOCUMENT LOGIC
 * 
 * This module provides a single source of truth for:
 * - What documents exist
 * - Which are enabled/disabled
 * - Core product vs additional documents
 */

import type { DocumentTemplate } from '@templates';

// ============================================================================
// DOCUMENT TYPES
// ============================================================================

export interface DocumentWithMetadata extends DocumentTemplate {
  isEnabled: boolean;
  isDisabled: boolean;
  isCoreProduct: boolean;
}

// ============================================================================
// DOCUMENT BUILDING
// ============================================================================

export interface BuildDocumentsOptions {
  allDocuments: DocumentTemplate[];
  disabledDocumentIds: string[];
  selectedProductMeta?: { value: string; label: string; description: string; icon?: string } | null;
}

/**
 * Builds documents for configuration view
 * Includes all documents with enabled/disabled state
 */
export function buildDocumentsForConfig(
  options: BuildDocumentsOptions
): DocumentWithMetadata[] {
  const { allDocuments, disabledDocumentIds } = options;
  const disabledSet = new Set(disabledDocumentIds);

  return allDocuments.map((doc) => ({
    ...doc,
    isEnabled: !disabledSet.has(doc.id),
    isDisabled: disabledSet.has(doc.id),
    isCoreProduct: false, // Core product is handled separately in UI
  }));
}

/**
 * Builds documents for documents bar view
 * Returns documents ready for rendering (core product handled separately in UI)
 */
export function buildDocumentsForBar(
  options: BuildDocumentsOptions
): DocumentWithMetadata[] {
  // Same as config for now, but can be extended with selection state, etc.
  return buildDocumentsForConfig(options);
}

/**
 * Gets document counts (enabled and total)
 */
export function getDocumentCounts(
  allDocuments: DocumentTemplate[],
  disabledDocumentIds: string[]
): { enabledCount: number; totalCount: number } {
  const disabledSet = new Set(disabledDocumentIds);
  const enabledCount = allDocuments.filter((doc) => !disabledSet.has(doc.id)).length;
  const totalCount = allDocuments.length;

  // Note: Core product is always enabled and counted separately in UI
  return { enabledCount, totalCount };
}

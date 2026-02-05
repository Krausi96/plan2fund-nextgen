/**
 * ENHANCE DOCUMENT STRUCTURE WITH SPECIAL SECTIONS
 * 
 * Creates hierarchical document structure using centralized logic
 * 
 * This file delegates to centralized functions in sectionUtilities.
 */

import { DocumentStructure } from '@/features/editor/lib/types/program/program-types';
import type { TranslationFunction } from '../types';
import { enhanceWithSpecialSectionsCentralized } from '../utilities/sectionUtilities';

/**
 * Enhance document structure with special sections
 * Creates hierarchical structure when multiple documents exist
 * 
 * @param documentStructure - Original document structure
 * @param t - Translation function
 * @returns Enhanced document structure with special sections
 */
export function enhanceWithSpecialSections(
  documentStructure: DocumentStructure | null,
  t: TranslationFunction
): DocumentStructure | null {
  if (!documentStructure) return null;
  
  // Use the centralized function from sectionUtilities
  const hasMultipleDocuments = documentStructure.documents.length > 1;
  return enhanceWithSpecialSectionsCentralized(documentStructure, t, hasMultipleDocuments);
}
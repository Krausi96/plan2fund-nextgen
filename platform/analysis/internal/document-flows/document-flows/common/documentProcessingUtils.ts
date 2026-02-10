/**
 * DOCUMENT PROCESSING UTILITIES
 * 
 * Contains unified functions for document processing operations to eliminate duplication
 * between documentProcessor.ts and normalizeDocumentStructure.ts
 */

import type { DocumentStructure } from '@/platform/core/types';
import { detectDocumentStructure } from '../processing/detection/documentStructureDetector';
import { applyDetectionResults } from '../processing/detection/documentStructureDetector';
import { enhanceWithSpecialSections } from '../sections/enhancement/sectionEnhancement';
import { sortSectionsForSingleDocument } from '@/features/editor/lib/utils/organizeForUiRendering';

/**
 * Unified deduplication function
 */
export function unifiedDeduplicateSections<T extends { id: string }>(sections: T[]): T[] {
  const seenIds = new Set();
  return sections.filter(section => {
    if (seenIds.has(section.id)) {
      return false;
    }
    seenIds.add(section.id);
    return true;
  });
}

/**
 * Unified detection and application function
 */
export function unifiedDetectAndApply(structure: DocumentStructure, content: any): DocumentStructure {
  const detectionResults = detectDocumentStructure(content);
  return applyDetectionResults(structure, detectionResults);
}

/**
 * Complete document processing pipeline - combines detection, application, enhancement, and ordering
 */
export function processDocumentStructure(structure: DocumentStructure, content: any, t: (key: string) => string = (key: string) => key): DocumentStructure {
  // Apply detection and application
  const structureWithDetection = unifiedDetectAndApply(structure, content);
  
  // Enhance with special sections
  const enhancedStructure = enhanceWithSpecialSections(structureWithDetection, t) || structureWithDetection;
  
  // Apply canonical ordering
  const orderedSections = sortSectionsForSingleDocument(enhancedStructure.sections);
  
  // Apply deduplication
  const uniqueSections = unifiedDeduplicateSections(orderedSections);
  
  return {
    ...enhancedStructure,
    sections: uniqueSections
  };
}

/**
 * Unified structure creation function
 */
export function createUnifiedDocumentStructure(sections: any[], documents: any[], source: 'program' | 'template' | 'document' | 'upload'): DocumentStructure {
  return {
    documents,
    sections,
    requirements: [],
    validationRules: [],
    aiGuidance: [],
    renderingRules: {},
    conflicts: [],
    warnings: [],
    confidenceScore: 75,
    metadata: {
      source: source === 'upload' ? 'document' : source,
      generatedAt: new Date().toISOString(),
      version: '1.0',
    }
  };
}
/**
 * APPLY DETECTION RESULTS TO DOCUMENT STRUCTURE
 * 
 * Enrich existing sections with detected content respecting hierarchical structure
 * 
 * This file only attaches detected content to existing sections - no new sections are created.
 */

import type { DocumentStructure } from '@/features/editor/lib/types/program/program-types';
import type { DetectionMap } from '../types';
import {
  METADATA_SECTION_ID,
  ANCILLARY_SECTION_ID,
  REFERENCES_SECTION_ID,
  APPENDICES_SECTION_ID,
  TABLES_DATA_SECTION_ID,
  FIGURES_IMAGES_SECTION_ID
} from '@/features/editor/lib/constants';

/**
 * Apply detection results to a document structure
 * Respects hierarchical document structure and maintains internal headings within appendices
 * 
 * @param structure - Original document structure
 * @param detectionResults - Results from detectSpecialSections
 * @returns Updated document structure with detected content attached to existing sections
 */
export function applyDetectionResults(
  structure: DocumentStructure,
  detectionResults: DetectionMap
): DocumentStructure {
  // Start with the original structure
  const updatedStructure = { ...structure, sections: [...structure.sections] };

  // For each special section type, if detected and already exists, attach detected content
  const specialSectionIds = [
    METADATA_SECTION_ID,
    ANCILLARY_SECTION_ID,
    REFERENCES_SECTION_ID,
    APPENDICES_SECTION_ID,
    TABLES_DATA_SECTION_ID,
    FIGURES_IMAGES_SECTION_ID
  ];

  // Check if we have multiple documents to handle hierarchy appropriately
  const hasMultipleDocuments = structure.documents.length > 1;
  
  if (hasMultipleDocuments) {
    // For multiple documents, handle each document separately
    const mainDocumentId = structure.documents[0]?.id || 'main_document';
    
    // Separate sections by document
    const sectionsByDocument: Record<string, any[]> = {};
    structure.documents.forEach(doc => sectionsByDocument[doc.id] = []);
    
    updatedStructure.sections.forEach(section => {
      if (sectionsByDocument[section.documentId]) {
        sectionsByDocument[section.documentId].push(section);
      } else {
        // If section doesn't belong to any defined document, assign to main document
        sectionsByDocument[mainDocumentId].push(section);
      }
    });
    
    // Process sections by document
    Object.keys(sectionsByDocument).forEach(docId => {
      const docSections = sectionsByDocument[docId];
      
      // Process sections within this document
      const processedDocSections = docSections.map(section => {
        const sectionId = section.id;
        
        // If this is a special section and we have detection results for it
        if (specialSectionIds.includes(sectionId) && detectionResults[sectionId]) {
          const detection = detectionResults[sectionId];
          
          if (detection && detection.found && detection.confidence >= 0.5) {
            // Attach the detected content to the existing section
            return {
              ...section,
              detection: {
                source: 'upload',
                confidence: detection.confidence,
                payload: detection.content
              }
            };
          }
        }
        
        // For appendix sections, maintain internal headings and structure
        if (sectionId.startsWith('appendix_') && detectionResults[sectionId]) {
          const detection = detectionResults[sectionId];
          
          if (detection && detection.found && detection.confidence >= 0.5) {
            return {
              ...section,
              detection: {
                source: 'upload',
                confidence: detection.confidence,
                payload: detection.content
              },
              // Maintain internal structure for appendices
              rawSubsections: section.rawSubsections || []
            };
          }
        }
        
        return section;
      });
      
      // Update the sections in the main array
      sectionsByDocument[docId] = processedDocSections;
    });
    
    // Flatten the sections back into the main array
    updatedStructure.sections = [];
    
    // Process in hierarchical order: main document, then appendices, then shared sections
    structure.documents.forEach(doc => {
      if (sectionsByDocument[doc.id]) {
        updatedStructure.sections.push(...sectionsByDocument[doc.id]);
      }
    });
    
    // Add any remaining sections that don't belong to defined documents
    const allProcessedIds = new Set();
    updatedStructure.sections.forEach(s => allProcessedIds.add(s.id));
    
    structure.sections.forEach(originalSection => {
      if (!allProcessedIds.has(originalSection.id)) {
        // This section wasn't processed yet, add it to the result
        const sectionId = originalSection.id;
        
        if (specialSectionIds.includes(sectionId) && detectionResults[sectionId]) {
          const detection = detectionResults[sectionId];
          
          if (detection && detection.found && detection.confidence >= 0.5) {
            updatedStructure.sections.push({
              ...originalSection,
              detection: {
                source: 'upload',
                confidence: detection.confidence,
                payload: detection.content
              }
            });
          } else {
            updatedStructure.sections.push(originalSection);
          }
        } else {
          updatedStructure.sections.push(originalSection);
        }
      }
    });
  } else {
    // For single document, use original logic
    updatedStructure.sections = updatedStructure.sections.map(section => {
      const sectionId = section.id;
      
      // If this is a special section and we have detection results for it
      if (specialSectionIds.includes(sectionId) && detectionResults[sectionId]) {
        const detection = detectionResults[sectionId];
        
        if (detection && detection.found && detection.confidence >= 0.5) {
          // Attach the detected content to the existing section
          return {
            ...section,
            detection: {
              source: 'upload',
              confidence: detection.confidence,
              payload: detection.content
            }
          };
        }
      }
      
      return section;
    });
  }

  return updatedStructure;
}
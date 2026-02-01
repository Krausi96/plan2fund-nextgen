/**
 * APPLY DETECTION RESULTS TO DOCUMENT STRUCTURE
 * 
 * Enrich existing sections with detected content
 * 
 * This file only attaches detected content to existing sections - no new sections are created.
 */

import type { DocumentStructure } from '../../types/Program-Types';
import type { DetectionMap } from './types';
import {
  METADATA_SECTION_ID,
  ANCILLARY_SECTION_ID,
  REFERENCES_SECTION_ID,
  APPENDICES_SECTION_ID,
  TABLES_DATA_SECTION_ID,
  FIGURES_IMAGES_SECTION_ID
} from '../../constants';

/**
 * Apply detection results to a document structure
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

  return updatedStructure;
}
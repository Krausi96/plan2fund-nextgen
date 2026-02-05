/**
 * APPLY DETECTION RESULTS TO DOCUMENT STRUCTURE (SIMPLIFIED)
 *
 * Purpose:
 * - Attach detection metadata to existing sections only
 * - Never create sections
 * - Never reorder
 * - Never rebuild hierarchy
 * - Safe + predictable
 */

import type { DetectionMap } from '../../sections/types';
import {
  METADATA_SECTION_ID,
  ANCILLARY_SECTION_ID,
  REFERENCES_SECTION_ID,
  APPENDICES_SECTION_ID,
  TABLES_DATA_SECTION_ID,
  FIGURES_IMAGES_SECTION_ID
} from '@/features/editor/lib/constants';

const SPECIAL_SECTION_IDS = [
  METADATA_SECTION_ID,
  ANCILLARY_SECTION_ID,
  REFERENCES_SECTION_ID,
  APPENDICES_SECTION_ID,
  TABLES_DATA_SECTION_ID,
  FIGURES_IMAGES_SECTION_ID,
  'special-section-executive-summary'
];

export function applyDetectionResults(
  structure: any, // Using any type since DocumentStructure might be imported elsewhere
  detectionResults: DetectionMap
): any { // Return type as any for same reason

  if (!structure?.sections?.length) return structure;

  const updated = {
    ...structure,
    sections: structure.sections.map((section: any) => {

      const id = section.id;
      const detection = detectionResults?.[id];

      // Only attach if:
      // - section is known structural section
      // - detection exists
      // - detection confident
      if (
        SPECIAL_SECTION_IDS.includes(id) &&
        detection?.found &&
        (detection.confidence ?? 0) >= 0.5
      ) {
        return {
          ...section,
          detection: {
            source: 'upload',
            confidence: detection.confidence,
            payload: detection.content ?? null
          }
        };
      }

      return section;
    })
  };

  return updated;
}
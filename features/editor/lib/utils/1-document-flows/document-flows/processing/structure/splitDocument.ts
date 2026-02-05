import type { DocumentStructure } from '../../../../../types/types';

/**
 * Splits a document into multiple documents based on user selection
 */
export function splitDocumentIntoParts(
  originalStructure: DocumentStructure,
  splitPoints: number[]
): DocumentStructure[] {
  const parts: DocumentStructure[] = [];
  const totalSections = originalStructure.sections.length;
  
  // Ensure splitPoints are sorted and valid
  const sortedSplitPoints = [...splitPoints].sort((a, b) => a - b).filter(point => point > 0 && point < totalSections);
  
  // Add implicit start and end points
  const segmentStarts = [0, ...sortedSplitPoints];
  const segmentEnds = [...sortedSplitPoints, totalSections];
  
  for (let i = 0; i < segmentStarts.length; i++) {
    const start = segmentStarts[i];
    const end = segmentEnds[i];
    
    if (start < end) {
      const segmentSections = originalStructure.sections.slice(start, end);
      
      // Create a new structure with updated metadata for this segment
      const segmentStructure: DocumentStructure = {
        ...originalStructure,
        structureId: `doc-split-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`,
        documents: [{
          id: `doc-${Date.now()}-${i}`,
          name: `${originalStructure.documents[0]?.name || 'Untitled'} - Part ${i + 1}`,
          purpose: `Part ${i + 1} of split document`,
          required: true
        }],
        sections: segmentSections,
        // Copy over the lists without filtering to avoid type issues
        requirements: originalStructure.requirements || [],
        validationRules: originalStructure.validationRules || [],
        conflicts: originalStructure.conflicts || [],
        updatedAt: new Date().toISOString()
      };
      
      parts.push(segmentStructure);
    }
  }
  
  return parts;
}
/**
 * SECTION SORTING
 * 
 * Contains functions for sorting and ordering sections in document structures
 */

import {
  METADATA_SECTION_ID,
  ANCILLARY_SECTION_ID,
  REFERENCES_SECTION_ID,
  APPENDICES_SECTION_ID,
  TABLES_DATA_SECTION_ID,
  FIGURES_IMAGES_SECTION_ID
} from '@/features/editor/lib/constants';

// Define the canonical section order
const CANONICAL_SECTION_ORDER = [
  METADATA_SECTION_ID,      // Title Page - must be first
  ANCILLARY_SECTION_ID,     // Table of Contents - must be second
  'executive_summary',
  'company_description',
  'project_description',
  'market_analysis',
  'financial_plan',
  'team_qualifications',
  'risk_assessment',
  'business_model_canvas',
  'go_to_market_strategy',
  'unit_economics',
  'milestones_next_steps',
  'company_overview',
  'about_company',
  'company_information',
  REFERENCES_SECTION_ID,    // References
  TABLES_DATA_SECTION_ID,   // Tables/Data
  FIGURES_IMAGES_SECTION_ID, // Figures/Images
  APPENDICES_SECTION_ID     // Appendices
];

// Create a map for fast lookup
const SECTION_ORDER_MAP = new Map(CANONICAL_SECTION_ORDER.map((id, index) => [id, index]));

/**
 * Sort sections according to hierarchical document order
 * For single document: Maintains canonical order
 * For multiple documents: Orders as Main doc → Appendices → Shared sections
 */
export function sortSectionsByCanonicalOrder<T extends { id: string; documentId: string }>(
  sections: T[],
  documents: Array<{ id: string; name: string; purpose: string; required: boolean }> = []
): T[] {
  const hasMultipleDocuments = documents.length > 1;
  
  if (!hasMultipleDocuments) {
    // For single document, use original logic
    // Identify special sections that should be at the end
    const endingSpecialSections = new Set([
      REFERENCES_SECTION_ID,
      TABLES_DATA_SECTION_ID,
      FIGURES_IMAGES_SECTION_ID,
      APPENDICES_SECTION_ID
    ]);
    
    return [...sections].sort((a, b) => {
      const orderA = SECTION_ORDER_MAP.get(a.id);
      const orderB = SECTION_ORDER_MAP.get(b.id);
      
      const isEndingA = endingSpecialSections.has(a.id);
      const isEndingB = endingSpecialSections.has(b.id);
      
      // If both sections are in the canonical order, sort by their defined positions
      if (orderA !== undefined && orderB !== undefined) {
        return orderA - orderB;
      }
      
      // If only one section is in canonical order
      if (orderA !== undefined) {
        if (isEndingA) {
          // A is a canonical ending special section
          return 1; // Ending special sections come after non-canonical sections
        } else {
          return -1; // Introductory canonical sections come before non-canonical sections
        }
      }
      
      if (orderB !== undefined) {
        if (isEndingB) {
          // B is a canonical ending special section
          return -1; // Non-canonical sections come before ending special sections
        } else {
          return 1; // Introductory canonical sections come before non-canonical sections
        }
      }
      
      // If neither is in canonical order, determine based on whether they're ending special sections
      if (isEndingA && isEndingB) {
        // Both are ending special sections, sort by canonical order
        return (orderA || 0) - (orderB || 0);
      }
      
      // Ending special sections come after non-ending sections
      if (isEndingA) return 1;
      if (isEndingB) return -1;
      
      // Both are regular non-canonical sections, maintain their relative order
      // This ensures they appear between the intro special sections and ending special sections
      return 0;
    });
  } else {
    // For multiple documents, implement hierarchical sorting
    const mainDocumentId = documents[0]?.id || 'main_document';
    
    // Identify appendix document IDs
    const appendixDocumentIds = new Set(documents.slice(1).map(doc => doc.id));
    
    // Identify shared sections
    const sharedSectionIds = new Set([
      REFERENCES_SECTION_ID,
      TABLES_DATA_SECTION_ID,
      FIGURES_IMAGES_SECTION_ID
    ]);
    
    return [...sections].sort((a, b) => {
      // Determine document hierarchy position
      const isMainA = a.documentId === mainDocumentId;
      const isMainB = b.documentId === mainDocumentId;
      
      const isAppendixA = appendixDocumentIds.has(a.documentId);
      const isAppendixB = appendixDocumentIds.has(b.documentId);
      
      const isSharedA = sharedSectionIds.has(a.id);
      const isSharedB = sharedSectionIds.has(b.id);
      
      // Main document sections come first
      if (isMainA && !isMainB) return -1;
      if (!isMainA && isMainB) return 1;
      
      // Appendix sections come after main document but before shared sections
      if (isAppendixA && !isAppendixB) {
        // If B is a shared section, A (appendix) comes before
        if (isSharedB) return -1;
        return -1; // Both appendices, sort by document order later
      }
      if (!isAppendixA && isAppendixB) {
        // If A is a shared section, B (appendix) comes before
        if (isSharedA) return 1;
        return 1;
      }
      
      // Shared sections come last
      if (isSharedA && !isSharedB) return 1; // Shared sections come last
      if (!isSharedA && isSharedB) return -1;
      
      // Within same document type, use canonical order
      const orderA = SECTION_ORDER_MAP.get(a.id);
      const orderB = SECTION_ORDER_MAP.get(b.id);
      
      // If both sections have canonical order, sort by that
      if (orderA !== undefined && orderB !== undefined) {
        return orderA - orderB;
      }
      
      // If only one has canonical order, prioritize it
      if (orderA !== undefined) return -1;
      if (orderB !== undefined) return 1;
      
      // If both in same document and no canonical order, maintain relative order
      // For appendices, sort by document order
      if (isAppendixA && isAppendixB && a.documentId !== b.documentId) {
        // Determine document index
        const docIndexA = documents.findIndex(doc => doc.id === a.documentId);
        const docIndexB = documents.findIndex(doc => doc.id === b.documentId);
        return docIndexA - docIndexB;
      }
      
      // Default: maintain original order
      return 0;
    });
  }
}
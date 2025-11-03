// ========= PLAN2FUND — UNIFIED TEMPLATE REGISTRY =========
// Master templates with program-specific override system
// Hierarchy: Program-specific → Master template → Default

import { SectionTemplate, DocumentTemplate } from './types';
import { MASTER_SECTIONS } from './sections';
import { MASTER_DOCUMENTS } from './documents';
import { mergeSections, mergeDocuments, loadProgramSections, loadProgramDocuments } from './program-overrides';

// ============================================================================
// TEMPLATE REGISTRY
// ============================================================================

/**
 * Get sections for a funding type and optional program
 * Priority: Program-specific → Master → Default
 */
export async function getSections(
  fundingType: string,
  programId?: string,
  baseUrl?: string
): Promise<SectionTemplate[]> {
  const masterSections = MASTER_SECTIONS[fundingType] || MASTER_SECTIONS.grants;
  
  // If programId provided, load program-specific and merge
  if (programId) {
    const programSections = await loadProgramSections(programId, baseUrl);
    if (programSections.length > 0) {
      return mergeSections(masterSections, programSections);
    }
  }
  
  return masterSections;
}

/**
 * Get documents for funding type, product, and optional program
 * Priority: Program-specific → Master → Default
 */
export async function getDocuments(
  fundingType: string,
  productType: string,
  programId?: string,
  baseUrl?: string
): Promise<DocumentTemplate[]> {
  const masterDocs = MASTER_DOCUMENTS[fundingType]?.[productType] || [];
  
  // If programId provided, load program-specific and merge
  if (programId) {
    const programDocs = await loadProgramDocuments(programId, baseUrl);
    if (programDocs.length > 0) {
      return mergeDocuments(masterDocs, programDocs);
    }
  }
  
  return masterDocs;
}

/**
 * Get specific document by ID
 */
export function getDocument(
  fundingType: string,
  productType: string,
  docId: string,
  programId?: string
): DocumentTemplate | undefined {
  const docs = getDocuments(fundingType, productType, programId);
  return docs.find(d => d.id === docId);
}

/**
 * Get specific section by ID
 */
export function getSection(
  fundingType: string,
  sectionId: string,
  programId?: string
): SectionTemplate | undefined {
  const sections = getSections(fundingType, programId);
  return sections.find(s => s.id === sectionId);
}

// Export master templates for direct access
export { MASTER_SECTIONS, MASTER_DOCUMENTS };
export * from './types';


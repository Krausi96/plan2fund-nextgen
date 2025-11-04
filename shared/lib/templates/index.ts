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
 * Get sections for a funding type, product type, and optional program
 * Priority: Program-specific → Master → Default
 * 
 * @param fundingType - The funding type (grants, bankLoans, equity, visa)
 * @param productType - The product type (strategy, review, submission)
 * @param programId - Optional program ID for program-specific sections
 * @param baseUrl - Optional base URL for API calls (server-side)
 * 
 * Note: Program-specific sections only merge for submission product
 */
export async function getSections(
  fundingType: string,
  productType: string = 'submission',
  programId?: string,
  baseUrl?: string
): Promise<SectionTemplate[]> {
  // Get product-specific master sections
  const masterSections = MASTER_SECTIONS[fundingType]?.[productType] || 
                         MASTER_SECTIONS.grants.submission;
  
  // Only merge program-specific sections for submission product
  if (programId && productType === 'submission') {
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
export async function getDocument(
  fundingType: string,
  productType: string,
  docId: string,
  programId?: string,
  baseUrl?: string
): Promise<DocumentTemplate | undefined> {
  const docs = await getDocuments(fundingType, productType, programId, baseUrl);
  return docs.find((d: DocumentTemplate) => d.id === docId);
}

/**
 * Get specific section by ID
 */
export async function getSection(
  fundingType: string,
  sectionId: string,
  productType: string = 'submission',
  programId?: string,
  baseUrl?: string
): Promise<SectionTemplate | undefined> {
  const sections = await getSections(fundingType, productType, programId, baseUrl);
  return sections.find((s: SectionTemplate) => s.id === sectionId);
}

// Export master templates for direct access
export { MASTER_SECTIONS, MASTER_DOCUMENTS };
export * from './types';


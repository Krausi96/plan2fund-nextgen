// ============================================================================
// PUBLIC API - TEMPLATE REGISTRY
// ============================================================================

import { MASTER_SECTIONS } from './sections';
import { MASTER_DOCUMENTS } from './documents';
import { loadProgramDocuments, loadProgramSections, mergeDocuments, mergeSections } from './api';
import type { SectionTemplate, DocumentTemplate } from '../types/templates';

export async function getSections(
  _fundingType: string,
  productType: string = 'submission',
  programId?: string,
  _baseUrl?: string
): Promise<SectionTemplate[]> {
  const masterSections = MASTER_SECTIONS[productType] || MASTER_SECTIONS.submission;
  
  // Mark master sections with origin
  const masterWithOrigin = masterSections.map(section => ({
    ...section,
    origin: 'master' as const
  }));
  
  console.log('[getSections] Loading sections', {
    productType,
    programId,
    masterSectionsCount: masterWithOrigin.length
  });
  
  if (programId) {
    const programSections = await loadProgramSections(programId);
    if (programSections.length > 0) {
      const merged = mergeSections(masterWithOrigin, programSections);
      console.log('[getSections] Merged sections', {
        productType,
        programId,
        masterCount: masterWithOrigin.length,
        programCount: programSections.length,
        mergedCount: merged.length,
        programSectionIds: merged.filter(s => s.origin === 'program').map(s => s.id)
      });
      return merged;
    } else {
      console.log('[getSections] No program sections found', { programId });
    }
  }
  
  return masterWithOrigin;
}

export async function getDocuments(
  fundingType: string,
  productType: string,
  programId?: string,
  _baseUrl?: string
): Promise<DocumentTemplate[]> {
  const masterDocs = MASTER_DOCUMENTS[fundingType]?.[productType] || [];
  
  if (programId) {
    const programDocs = await loadProgramDocuments(programId);
    if (programDocs.length > 0) {
      return mergeDocuments(masterDocs, programDocs);
    }
  }
  
  return masterDocs;
}

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

// Re-export types for convenience
export type { SectionTemplate, DocumentTemplate, SectionQuestion } from '../types/templates';
export type { StandardSection, AdditionalDocument } from '../types/templates';


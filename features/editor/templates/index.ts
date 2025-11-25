// ============================================================================
// PUBLIC API - TEMPLATE REGISTRY
// ============================================================================

import { MASTER_SECTIONS } from './sections';
import { MASTER_DOCUMENTS } from './documents';
import { loadProgramDocuments, mergeDocuments } from './api';
import type { SectionTemplate, DocumentTemplate } from './types';

export async function getSections(
  _fundingType: string,
  productType: string = 'submission',
  _programId?: string,
  _baseUrl?: string
): Promise<SectionTemplate[]> {
  return MASTER_SECTIONS[productType] || MASTER_SECTIONS.submission;
}

export async function getDocuments(
  fundingType: string,
  productType: string,
  programId?: string,
  baseUrl?: string
): Promise<DocumentTemplate[]> {
  const masterDocs = MASTER_DOCUMENTS[fundingType]?.[productType] || [];
  
  if (programId) {
    const programDocs = await loadProgramDocuments(programId, baseUrl);
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
export type { SectionTemplate, DocumentTemplate, SectionQuestion } from './types';
export type { StandardSection, AdditionalDocument } from './types';


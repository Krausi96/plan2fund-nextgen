// ============================================================================
// PUBLIC API - TEMPLATE REGISTRY
// ============================================================================

import { MASTER_SECTIONS } from './sections';
import { MASTER_DOCUMENTS } from './documents';
import { loadProgramDocuments, loadProgramSections, mergeDocuments, mergeSections } from './api';
import type { SectionTemplate, DocumentTemplate } from './types';

export async function getSections(
  _fundingType: string,
  productType: string = 'submission',
  programId?: string,
  baseUrl?: string
): Promise<SectionTemplate[]> {
  const masterSections = MASTER_SECTIONS[productType] || MASTER_SECTIONS.submission;
  
  // Mark master sections with origin metadata
  const masterWithOrigin = masterSections.map(section => ({
    ...section,
    origin: (section.origin || 'master') as 'master' | 'program' | 'custom'
  }));
  
  // If no program ID, return master sections only
  if (!programId) {
    return masterWithOrigin;
  }
  
  // Load and merge program sections
  try {
    const programSections = await loadProgramSections(programId, baseUrl);
    if (programSections.length > 0) {
      return mergeSections(masterWithOrigin, programSections);
    }
  } catch (error) {
    console.error('Error loading program sections, falling back to master:', error);
  }
  
  // Fallback to master if program loading fails
  return masterWithOrigin;
}

export async function getDocuments(
  fundingType: string,
  productType: string,
  programId?: string,
  baseUrl?: string
): Promise<DocumentTemplate[]> {
  const masterDocs = MASTER_DOCUMENTS[fundingType]?.[productType] || [];
  
  // Mark master documents with origin metadata
  const masterWithOrigin = masterDocs.map(doc => ({
    ...doc,
    origin: (doc.origin || 'master') as 'master' | 'program' | 'custom'
  }));
  
  if (programId) {
    try {
      const programDocs = await loadProgramDocuments(programId, baseUrl);
      if (programDocs.length > 0) {
        return mergeDocuments(masterWithOrigin, programDocs);
      }
    } catch (error) {
      console.error('Error loading program documents, falling back to master:', error);
    }
  }
  
  return masterWithOrigin;
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


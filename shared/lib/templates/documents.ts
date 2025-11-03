// ========= PLAN2FUND — MASTER DOCUMENT TEMPLATES =========
// Master templates - base structure for all programs
// Program-specific documents override these

import { DocumentTemplate } from './types';

// Import from existing file (will migrate)
import { ADDITIONAL_DOCUMENTS } from '../../../features/editor/templates/additionalDocuments';

// Convert ADDITIONAL_DOCUMENTS to new format
// Map funding type and product to get documents
export function getMasterDocuments(fundingType: string, productType: string): DocumentTemplate[] {
  const funding = fundingType.toLowerCase();
  const product = productType.toLowerCase();
  
  // Map product types
  const productMap: Record<string, 'submission' | 'strategy' | 'review'> = {
    'submission': 'submission',
    'business-plan': 'submission',
    'strategy': 'strategy',
    'review': 'review'
  };
  
  const mappedProduct = productMap[product] || 'submission';
  
  // Get documents from ADDITIONAL_DOCUMENTS
  if (ADDITIONAL_DOCUMENTS[funding as keyof typeof ADDITIONAL_DOCUMENTS]) {
    const docs = ADDITIONAL_DOCUMENTS[funding as keyof typeof ADDITIONAL_DOCUMENTS];
    if (docs[mappedProduct]) {
      return docs[mappedProduct] as DocumentTemplate[];
    }
  }
  
  return [];
}

// Master documents registry (converted from existing)
export const MASTER_DOCUMENTS = {
  grants: {
    submission: getMasterDocuments('grants', 'submission'),
    strategy: getMasterDocuments('grants', 'strategy'),
    review: getMasterDocuments('grants', 'review')
  },
  bankLoans: {
    submission: getMasterDocuments('bankLoans', 'submission'),
    strategy: getMasterDocuments('bankLoans', 'strategy'),
    review: getMasterDocuments('bankLoans', 'review')
  },
  equity: {
    submission: getMasterDocuments('equity', 'submission'),
    strategy: getMasterDocuments('equity', 'strategy'),
    review: getMasterDocuments('equity', 'review')
  },
  visa: {
    submission: getMasterDocuments('visa', 'submission'),
    strategy: getMasterDocuments('visa', 'strategy'),
    review: getMasterDocuments('visa', 'review')
  }
};


import type { DocumentTemplate } from '../types/types';

// Simplified document lookup by product type (all funding types share same docs per product)
export const MASTER_DOCUMENTS_BY_PRODUCT: Record<string, DocumentTemplate[]> = {
  strategy: [], // Strategy now uses sections, no documents
  submission: [],
  upgrade: [] // Upgrade uses sections, no documents
};
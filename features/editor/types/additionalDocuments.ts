// ========= PLAN2FUND — ADDITIONAL DOCUMENTS TYPES =========

import { DocumentTemplate } from '@/shared/lib/templates/types';

/**
 * Additional document instance (user's version of a document template)
 */
export interface AdditionalDocumentInstance {
  id: string; // Same as template ID
  templateId: string; // Reference to DocumentTemplate
  content: string; // User's content (markdown/HTML)
  status: 'not_started' | 'in_progress' | 'completed';
  lastModified?: string;
  wordCount?: number;
  completionPercentage?: number;
}

/**
 * Document editor state
 */
export interface DocumentEditorState {
  activeDocumentId: string | null;
  documents: AdditionalDocumentInstance[];
  templates: DocumentTemplate[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Auto-population source from business plan
 */
export interface AutoPopulateSource {
  sectionKey: string;
  sectionTitle: string;
  content: string;
  relevance: 'high' | 'medium' | 'low';
}

/**
 * Document completion status
 */
export interface DocumentCompletionStatus {
  documentId: string;
  required: boolean;
  status: 'not_started' | 'in_progress' | 'completed';
  completionPercentage: number;
  missingFields: string[];
}


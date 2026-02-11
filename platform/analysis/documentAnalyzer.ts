import { processDocumentSecurely } from './internal/document-flows/document-flows/processing/documentProcessor';
import type { DocumentStructure } from '../core/types';

export interface DocumentProcessingResult {
  success: boolean;
  documentStructure: DocumentStructure | null;
  inferredProductType: 'submission' | null;
  warnings: string[];
  diagnostics: string[];
  confidence: number;
  message?: string;
}

/**
 * Analyzes and processes uploaded documents
 * Single entry point for document upload + template parsing
 * Internally orchestrates processDocumentSecurely and document processing utils
 */
export async function analyzeDocument(
  files: File[],
  mode: 'template'
): Promise<{
  documentStructure: DocumentStructure;
  inferredProductType: 'submission';
  warnings: string[];
  diagnostics: string[];
  confidence: number;
}> {
  if (files.length === 0) {
    throw new Error('No files provided for processing');
  }

  const file = files[0];

  // Security guard: check file type
  if (!file.type.includes('pdf') && !file.type.includes('word') && !file.type.includes('document')) {
    throw new Error(`Unsupported file type: ${file.type}`);
  }

  try {
    // Call the real orchestrator
    const result = await processDocumentSecurely(file);
    
    if (!result.success || !result.documentStructure) {
      throw new Error(result.message || 'Document processing failed');
    }

    return {
      documentStructure: {
        ...result.documentStructure,
        metadata: {
          ...result.documentStructure.metadata,
          source: 'template',
        },
      },
      inferredProductType: 'submission',
      warnings: result.securityIssues.softWarnings,
      diagnostics: result.securityIssues.softWarnings,
      confidence: result.documentStructure.confidenceScore || 0,
    };
  } catch (error) {
    throw new Error(`Document analysis failed: ${(error as Error).message}`);
  }
}


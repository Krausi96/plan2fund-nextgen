import { processUploadedDocument } from './internal/documentProcessor';
import type { DocumentStructure } from '../core/types';

/**
 * Analyzes document content and returns parsed document data
 */
export async function analyzeDocument(
  files: File[],
  mode: 'template' | 'upgrade'
): Promise<{
  documentStructure: DocumentStructure;
  inferredProductType: 'submission' | 'upgrade';
  warnings: string[];
  diagnostics: string[];
  confidence: number;
}> {
  const result = await processUploadedDocument(files, mode);
  
  if (!result.success || !result.documentStructure) {
    throw new Error(result.message || 'Document processing failed');
  }
  
  return {
    documentStructure: result.documentStructure,
    inferredProductType: result.inferredProductType || 'submission',
    warnings: result.warnings,
    diagnostics: result.diagnostics,
    confidence: result.confidence
  };
}
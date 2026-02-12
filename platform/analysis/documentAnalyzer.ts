import { processDocumentSecurely } from './internal/document-flows/processing/documentProcessor';
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
    console.log('[analyzeDocument] Starting analysis for:', file.name);

    // Call the real orchestrator
    const result = await processDocumentSecurely(file);
    console.log('[analyzeDocument] processDocumentSecurely result:', result.success, result.message);

    if (!result.success || !result.documentStructure) {
      console.error('[analyzeDocument] Processing failed:', result.message);
      throw new Error(result.message || 'Document processing failed');
    }

    console.log('[analyzeDocument] Processing successful, sections:', result.documentStructure.sections?.length);
    
    // DEBUG-C: Before editor handoff
    console.log('[DEBUG-C] Before editor handoff:', {
      finalSectionTitles: result.documentStructure.sections?.map((s: any) => s.title),
      fileName: file.name
    });

    const response = {
      documentStructure: {
        ...result.documentStructure,
        metadata: {
          ...(result.documentStructure.metadata || { source: 'document' as const, generatedAt: new Date().toISOString(), version: '1.0' }),
          // Keep original source as "document" for uploaded files (do NOT overwrite with "template")
          source: result.documentStructure.metadata?.source || 'document' as const,
        },
      },
      inferredProductType: 'submission' as const,
      warnings: result.securityIssues.softWarnings,
      diagnostics: result.securityIssues.softWarnings,
      confidence: result.documentStructure.confidenceScore || 0,
    };

    console.log('[analyzeDocument] Final structure has metadata:', !!response.documentStructure.metadata);
    return response;
  } catch (error) {
    console.error('[analyzeDocument] Error:', error);
    throw new Error(`Document analysis failed: ${(error as Error).message}`);
  }
}


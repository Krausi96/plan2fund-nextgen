import { processDocumentSecurely } from './internal/document-flows/processing/documentProcessor';
import { buildDocumentStructure } from '../generation/structure/structureBuilder';
import type { DocumentStructure } from '../core/types';
import type { ParsedDocumentData } from '../core/types/project';

/**
 * Converts ParsedDocument to DocumentStructure for editor consumption
 * Single place where ParsedDocument → DocumentStructure conversion happens
 */
function convertParsedDocumentToDocumentStructure(
  parsedDoc: NonNullable<Awaited<ReturnType<typeof processDocumentSecurely>>['parsedDocument']>,
  fileName: string
): DocumentStructure {
  const parsedData: ParsedDocumentData = {
    structure: {
      documents: [{
        id: 'main_document',
        name: fileName.replace(/\.[^/.]+$/, ''),
        purpose: 'Uploaded document',
        required: true,
      }],
      sections: parsedDoc.sections.map((s, idx) => ({
        id: s.id || `section_${idx}`,
        documentId: 'main_document',
        title: s.title,
        type: 'normal' as const,
        required: false,
        programCritical: false,
        content: s.content || '',
        requirements: [],
      })),
      validationRules: [],
      aiGuidance: [],
      renderingRules: {},
      conflicts: [],
      warnings: [],
      confidenceScore: parsedDoc.confidence || 85,
      metadata: {
        source: 'document',
        generatedAt: new Date().toISOString(),
        version: '1.0',
      },
    },
    detection: {
      titlePageConfidence: 0,
      tocConfidence: 0,
      referencesConfidence: 0,
      appendicesConfidence: 0,
      detectedSections: [],
    },
    specialSections: [],
    confidence: parsedDoc.confidence || 85,
    metadata: parsedDoc.metadata || { source: 'upload', fileName },
  };

  return buildDocumentStructure(parsedData);
}

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

    if (!result.success || !result.parsedDocument) {
      console.error('[analyzeDocument] Processing failed:', result.message);
      throw new Error(result.message || 'Document processing failed');
    }

    // Convert ParsedDocument → DocumentStructure via single builder
    const documentStructure = convertParsedDocumentToDocumentStructure(result.parsedDocument, file.name);
    console.log('[analyzeDocument] DocumentStructure built, sections:', documentStructure.sections?.length);

    const response = {
      documentStructure,
      inferredProductType: 'submission' as const,
      warnings: result.securityIssues.softWarnings,
      diagnostics: result.securityIssues.softWarnings,
      confidence: documentStructure.confidenceScore || 0,
    };

    console.log('[analyzeDocument] Final structure has metadata:', !!response.documentStructure.metadata);
    return response;
  } catch (error) {
    console.error('[analyzeDocument] Error:', error);
    throw new Error(`Document analysis failed: ${(error as Error).message}`);
  }
}


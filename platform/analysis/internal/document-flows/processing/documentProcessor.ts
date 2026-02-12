import { detectMultipleSectionsWithoutTitles } from './security/contentSecurityValidator';
import type { DocumentStructure } from '@/platform/core/types';
import { rawTextToSections } from './structure/rawTextToSections';
import { splitDocumentIntoParts } from './structure/splitDocument';
import { extractFileContent } from './extractors/extractFileContent';
import { validateStructure } from './security/validateStructure';
import { v4 as uuidv4 } from 'uuid';
import { sortSectionsForSingleDocument } from '@/features/editor/lib/utils/organizeForUiRendering';
import { unifiedDeduplicateSections } from '../common/documentProcessingUtils';
import { callAI } from '@/platform/ai/orchestrator';

// Define constants for file size
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

/**
 * Converts AI-generated structure to DocumentStructure format
 */
function convertAIStructureToDocumentStructure(sections: Array<{ title: string, content: string }>, fileName: string, baseId: string): DocumentStructure {
  return {
    documents: [{
      id: `doc-${baseId}`, 
      name: fileName.replace(/\.[^/.]+$/, ""),
      purpose: 'Main document from AI structure reconstruction',
      required: true
    }],
    sections: sections.map((section, index) => ({
      id: `ai-sec-${baseId}-${index}`,
      documentId: `doc-${baseId}`, 
      title: section.title,
      type: 'normal' as const,
      required: false,
      programCritical: false,
      content: section.content || '',
      requirements: [],
    })), 
    validationRules: [],
    aiGuidance: [],
    renderingRules: {},
    conflicts: [],
    warnings: [],
    confidenceScore: 85, // High confidence for AI-reconstructed structure
    metadata: {
      source: 'document',
      generatedAt: new Date().toISOString(),
      version: '1.0',
    }
  };
}

/**
 * Processes a document securely with validation and detection capabilities
 */
export async function processDocumentSecurely(file: File, template?: any) {
  console.log('[processDocumentSecurely] Starting...');
  console.log('[processDocumentSecurely] File:', file.name, file.type, file.size);

  try {
    // 1. Security check
    if (file.size > MAX_FILE_SIZE) {
      const result = {
        success: false,
        documentStructure: null,
        securityIssues: {
          hardRejections: [`File size exceeds maximum limit of ${MAX_FILE_SIZE / (1024 * 1024)} MB`],
          softWarnings: []
        },
        needsManualSplit: false,
        message: `File size exceeds maximum limit of ${MAX_FILE_SIZE / (1024 * 1024)} MB`
      };
      console.log('[processDocumentSecurely] File too large');
      return result;
    }

    // Create stable base ID
    const baseId = uuidv4();

    // 2. Extraction
    console.log('[processDocumentSecurely] Extracting content...');
    let fileContent = await extractFileContent(file);
    console.log('[processDocumentSecurely] Extracted content length:', fileContent?.length);
    
    // DEBUG-A: After extraction
    console.log('[DEBUG-A] After extraction:', {
      contentLength: fileContent?.length,
      first500Chars: fileContent ? fileContent.substring(0, 500) : 'NO CONTENT',
      fileName: file.name
    });

    if (!fileContent) {
      const result = {
        success: false,
        documentStructure: null,
        securityIssues: {
          hardRejections: [`Unsupported file type: ${file.type}`],
          softWarnings: []
        },
        needsManualSplit: false,
        message: `Unsupported file type: ${file.type}`
      };
      console.log('[processDocumentSecurely] No content extracted');
      return result;
    }

    // 3. Structure build - ONLY place sections created
    console.log('[processDocumentSecurely] Attempting AI-based structure reconstruction...');
    
    // First try AI-based structure reconstruction via existing server API
    let unvalidatedStructure;
    try {
      console.log("AI STRUCTURE: calling...");
      console.log("RAW TEXT LENGTH:", fileContent.length);
      
      const res = await fetch("/api/ai/rebuild-document-structure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawText: fileContent,
          fileName: file.name
        })
      });
      
      const aiResult = await res.json();
      
      console.log("AI RESULT:", aiResult);
      
      if (aiResult.success && aiResult.data?.sections?.length > 0) {
        console.log('[processDocumentSecurely] AI structure reconstruction succeeded, sections:', aiResult.data.sections.length);
        console.log("[AI STRUCTURE USED]", aiResult.data.sections.length);
        // Convert AI-generated sections to DocumentStructure format
        unvalidatedStructure = convertAIStructureToDocumentStructure(aiResult.data.sections, file.name, baseId);
      } else {
        console.log('[processDocumentSecurely] AI structure reconstruction failed or returned no sections, falling back to rule-based approach');
        console.log("[FALLBACK PARSER USED]");
        // Fallback to rule-based approach
        unvalidatedStructure = rawTextToSections(fileContent, file.name, baseId);
      }
    } catch (error) {
      console.log('[processDocumentSecurely] AI structure reconstruction failed, falling back to rule-based approach:', error);
      console.log("[FALLBACK PARSER USED]");
      // Fallback to rule-based approach
      unvalidatedStructure = rawTextToSections(fileContent, file.name, baseId);
    }
    
    console.log('[processDocumentSecurely] Structure built, sections:', unvalidatedStructure?.sections?.length);
    
    // DEBUG-B: After structure detection
    const tocDetected = unvalidatedStructure?.sections?.some((s: any) => 
      s.title.toLowerCase().includes('table of contents') || 
      s.title.toLowerCase().includes('toc') || 
      s.title.toLowerCase().includes('inhaltsverzeichnis')
    ) || false;
    
    console.log('[DEBUG-B] After structure detection:', {
      sectionCount: unvalidatedStructure?.sections?.length,
      detectedSectionTitles: unvalidatedStructure?.sections?.map((s: any) => s.title),
      tocDetected: tocDetected,
      fileName: file.name
    });

    // 4. Security validation
    console.log('[processDocumentSecurely] Validating...');
    const { validatedStructure, sectionSecurityIssues } = await validateStructure(unvalidatedStructure);
    console.log('[processDocumentSecurely] Validation complete, validated sections:', validatedStructure?.sections?.length);

    // 5. ProcessDocumentStructure - cleanup + order (no section rebuilding)
    console.log('[processDocumentSecurely] Processing structure (cleanup + order)...');
    // Apply canonical ordering
    const orderedSections = sortSectionsForSingleDocument(validatedStructure.sections);
    
    // Apply deduplication
    const uniqueSections = unifiedDeduplicateSections(orderedSections);
    
    const processedStructure = {
      ...validatedStructure,
      sections: uniqueSections
    };
    console.log('[processDocumentSecurely] Processing complete, sections:', processedStructure?.sections?.length);

    // 8. Check for manual split requirement
    const needsManualSplit = detectMultipleSectionsWithoutTitles(fileContent);

    const documentStructure: DocumentStructure = {
      ...processedStructure
    };
    console.log('[processDocumentSecurely] Final structure, has metadata:', !!documentStructure?.metadata);

    return {
      success: true,
      documentStructure,
      securityIssues: {
        hardRejections: [],
        softWarnings: sectionSecurityIssues
      },
      needsManualSplit,
      message: 'Document processed successfully'
    };
  } catch (error) {
    console.error('[processDocumentSecurely] Error:', error);
    return {
      success: false,
      documentStructure: null,
      securityIssues: {
        hardRejections: [],
        softWarnings: [`Processing error: ${(error as Error).message}`]
      },
      needsManualSplit: false,
      message: `Failed to process document: ${(error as Error).message}`
    };
  }
}

// Export the split function from the structure module
export { splitDocumentIntoParts };

interface ExtractedContent {
  title: string;
  sections: Array<{
    title: string;
    content: string;
    type: string;
    rawSubsections: any[];
  }>;
  hasTitlePage: boolean;
  hasTOC: boolean;
  totalPages: number;
  wordCount: number;
}

/**
 * Extracts content from uploaded files (DOCX or PDF) with security validation
 * 
 * @param files - Array of File objects to process
 * @returns Promise containing extracted content from all files
 */
export async function extractContentFromFiles(files: File[]): Promise<ExtractedContent> {
  // Process only the first file for now - can be extended to handle multiple files
  if (files.length === 0) {
    throw new Error('No files provided for processing');
  }

  // Process the first file with security validation
  const firstFile = files[0];
  const result = await processDocumentSecurely(firstFile);
  
  if (!result.success || !result.documentStructure) {
    throw new Error(`Failed to process file: ${result.message}`);
  }

  // Convert the DocumentStructure to the expected format for backward compatibility
  const extractedContent: ExtractedContent = {
    title: result.documentStructure.documents[0]?.name || 'Processed Document',
    sections: result.documentStructure.sections.map((section: any) => ({
      title: section.title,
      content: section.content || '',
      type: section.type || 'general',
      rawSubsections: section.rawSubsections
    })),
    hasTitlePage: result.documentStructure.sections.some((s: any) => s.type === 'metadata' || s.title.toLowerCase().includes('title')),
    hasTOC: result.documentStructure.sections.some((s: any) => s.type === 'ancillary' || s.title.toLowerCase().includes('table of contents') || s.title.toLowerCase().includes('toc')),
    totalPages: 0,
    wordCount: result.documentStructure.sections.reduce((total: number, section: any) => total + (section.content || '').split(/\s+/).filter((word: any) => word.length > 0).length, 0) // Accurate word count from sections
  };

  return extractedContent;
}

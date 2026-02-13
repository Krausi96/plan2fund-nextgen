import { extractFileContent } from './extractors/extractFileContent';
import { v4 as uuidv4 } from 'uuid';
import { callAI } from '@/platform/ai/orchestrator';

// Define constants for file size
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

/**
 * Converts AI-generated sections to ParsedDocument format (raw normalized content only)
 * Returns ONLY: sections[], metadata, confidence
 */
function convertAIResultToParsedDocument(sections: Array<{ title: string, content: string }>, _fileName: string, _baseId: string): any {
  return {
    sections: sections.map((section) => ({
      title: section.title,
      content: section.content || '',
    })),
    metadata: {},
    confidence: 85,
  };
}

/**
 * Processes a document securely and returns ONLY a ParsedDocument
 * NO DocumentStructure creation - that is ONLY done in structureBuilder
 */
export async function processDocumentSecurely(file: File, template?: any) {
  console.log('[processDocumentSecurely] Starting...');
  console.log('[processDocumentSecurely] File:', file.name, file.type, file.size);

  try {
    // 1. Security check
    if (file.size > MAX_FILE_SIZE) {
      return {
        success: false,
        parsedDocument: null,
        securityIssues: {
          hardRejections: [`File size exceeds maximum limit of ${MAX_FILE_SIZE / (1024 * 1024)} MB`],
          softWarnings: []
        },
        message: `File size exceeds maximum limit of ${MAX_FILE_SIZE / (1024 * 1024)} MB`
      };
    }

    const baseId = uuidv4();

    // 2. Extraction
    console.log('[processDocumentSecurely] Extracting content...');
    let fileContent = await extractFileContent(file);
    console.log('[processDocumentSecurely] Extracted content length:', fileContent?.length);
    
    if (!fileContent) {
      return {
        success: false,
        parsedDocument: null,
        securityIssues: {
          hardRejections: [`Unsupported file type: ${file.type}`],
          softWarnings: []
        },
        message: `Unsupported file type: ${file.type}`
      };
    }

    // 3. AI structure reconstruction
    console.log('[processDocumentSecurely] Calling AI for section titles...');
    
    const res = await fetch("/api/ai/rebuild-document-structure", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rawText: fileContent,
        fileName: file.name
      })
    });
    
    const aiResult = await res.json();
    
    if (!aiResult.success || !aiResult.data?.sections?.length) {
      throw new Error('AI structure reconstruction failed: ' + (aiResult.error || 'No sections returned'));
    }
    
    console.log('[processDocumentSecurely] AI extraction succeeded, sections:', aiResult.data.sections.length);
    
    // Convert AI-generated sections to ParsedDocument format (ONLY content + metadata)
    const parsedDocument = convertAIResultToParsedDocument(aiResult.data.sections, file.name, baseId);
    parsedDocument.metadata = {
      source: 'upload',
      fileName: file.name,
    };
    
    // Return ONLY ParsedDocument - NO DocumentStructure creation
    return {
      success: true,
      parsedDocument: parsedDocument,
      securityIssues: {
        hardRejections: [],
        softWarnings: []
      },
      message: 'Document structure extracted successfully'
    };
    
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error during AI structure reconstruction';
    console.error('[processDocumentSecurely] Fatal error:', errorMsg);
    return {
      success: false,
      parsedDocument: null,
      securityIssues: {
        hardRejections: [`AI structure reconstruction failed: ${errorMsg}`],
        softWarnings: []
      },
      message: `Failed to reconstruct document structure: ${errorMsg}`
    };
  }
}

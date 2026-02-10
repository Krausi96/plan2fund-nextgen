import { detectMultipleSectionsWithoutTitles } from './security/contentSecurityValidator';
import type { DocumentStructure } from '@/platform/core/types';
import { detectDocumentStructure, applyDetectionResults } from './detection/documentStructureDetector';
import { rawTextToSections } from './structure/rawTextToSections';
import { splitDocumentIntoParts } from './structure/splitDocument';
import { extractFileContent } from './extractors/extractFileContent';
import { validateStructure } from './security/validateStructure';
import { v4 as uuidv4 } from 'uuid';
import { enrichSectionsWithMeaning } from './semantic/ruleBasedSemanticMapper';

// Define constants for file size
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

/**
 * Processes a document securely with validation and detection capabilities
 */
export async function processDocumentSecurely(file: File, template?: any) {
  try {
    // 1. Security check
    if (file.size > MAX_FILE_SIZE) {
      return {
        success: false,
        documentStructure: null,
        securityIssues: {
          hardRejections: [`File size exceeds maximum limit of ${MAX_FILE_SIZE / (1024 * 1024)} MB`],
          softWarnings: []
        },
        needsManualSplit: false,
        message: `File size exceeds maximum limit of ${MAX_FILE_SIZE / (1024 * 1024)} MB`
      };
    }
    
    // Create stable base ID
    const baseId = uuidv4();
    
    // 2. Extraction
    let fileContent = await extractFileContent(file);
    
    if (!fileContent) {
      return {
        success: false,
        documentStructure: null,
        securityIssues: {
          hardRejections: [`Unsupported file type: ${file.type}`],
          softWarnings: []
        },
        needsManualSplit: false,
        message: `Unsupported file type: ${file.type}`
      };
    }
    
    // 3. Detection
    const detectionResults = detectDocumentStructure(fileContent);
    
    // 4. Structure build
    const unvalidatedStructure = rawTextToSections(fileContent, file.name, baseId);
    
    // 5. Security validation
    const { validatedStructure, sectionSecurityIssues } = await validateStructure(unvalidatedStructure);
    
    // 6. Apply detection results
    const structureWithDetections = applyDetectionResults(validatedStructure, detectionResults);
    
    // 7. Semantic enrichment
    const enrichedStructure = await enrichSectionsWithMeaning(structureWithDetections, {
      templateSections: template?.sections?.map((s: any) => s.title) || [],
      language: undefined,
      t: undefined
    });
    
    // 8. Check for manual split requirement
    const needsManualSplit = detectMultipleSectionsWithoutTitles(fileContent);
    
    const documentStructure: DocumentStructure = {
      ...enrichedStructure
    };

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

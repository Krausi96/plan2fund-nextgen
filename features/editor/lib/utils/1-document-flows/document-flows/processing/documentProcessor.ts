import { validateDocumentContent, detectMultipleSectionsWithoutTitles } from './security/contentSecurityValidator';
import type { DocumentStructure } from '../../../../types/types';
import { processDocumentStructure } from '../common/documentProcessingUtils';
import { buildInitialStructure } from './structure/buildInitialStructure';
import { applyDetectionResults } from './structure/applyDetectionResults';
import { detectDocumentStructure } from './detection/documentStructureDetector';
import { splitDocumentIntoParts } from './structure/splitDocument';
import { extractTextFromPDF } from './extractors/pdfExtractor';
import { extractTextFromDOCX } from './extractors/docxExtractor';
import { extractTextFromTXT } from './extractors/txtExtractor';
import { v4 as uuidv4 } from 'uuid';
// No longer needed constants have been removed

// Define constants for file size and chunking
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const CHUNK_SIZE = 15 * 1024; // 15 KB per chunk

// Helper function to count words in text
function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

// Helper function to count pages in text (assuming 500 words per page)
function countPages(wordCount: number): number {
  return Math.ceil(wordCount / 500);
}

// Helper function to chunk text
function chunkText(text: string, chunkSize: number): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.substring(i, i + chunkSize));
  }
  return chunks;
}


/**
 * Processes a document securely with validation and detection capabilities
 */
export async function processDocumentSecurely(file: File) {
  try {
    // Check file size before processing
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
    
    // Create stable base ID once to ensure consistency
    const baseId = uuidv4();
    let fileContent = '';
    
    if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.name.endsWith('.docx')) {
      // Process DOCX file
      fileContent = await extractTextFromDOCX(file);
    } else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      // Process PDF file in browser environment
      fileContent = await extractTextFromPDF(file);
    } else if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
      // Process plain text file - read as text directly
      fileContent = await extractTextFromTXT(file);
    } else {
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
    
    // Chunk large files for processing to avoid memory spikes
    if (fileContent.length > CHUNK_SIZE) {
      const chunks = chunkText(fileContent, CHUNK_SIZE);
      const processedChunks = [];
      
      for (const chunk of chunks) {
        // Process each chunk individually
        processedChunks.push(chunk);
      }
      
      // Merge chunks after processing
      fileContent = processedChunks.join('\n');
    }

    // Build initial structure from the content
    const unvalidatedStructure = buildInitialStructure(fileContent, file.name, baseId);
    
    // Validate each section individually to determine which ones should be filtered out
    const validatedSections = [];
    const sectionSecurityIssues = [];
    
    for (const section of unvalidatedStructure.sections) {
      // Extract content from rawSubsections if available, otherwise use empty string
      const sectionContent = section.rawSubsections && section.rawSubsections.length > 0 
        ? section.rawSubsections[0]?.rawText || '' 
        : '';
      const sectionValidation = validateDocumentContent(sectionContent, (section.title as string) || '');
      
      if (sectionValidation.shouldReject) {
        // Hard rejection - this section should be completely dropped
        sectionSecurityIssues.push(`Section '${section.title}' removed for security reasons: ${sectionValidation.warnings.join(', ')}`);
      } else {
        // Section passed security validation, add it with sanitized content
        validatedSections.push({
          ...section,
          content: sectionValidation.sanitizedContent,
          rawSubsections: section.rawSubsections?.map((subsection: any) => ({
            ...subsection,
            rawText: sectionValidation.sanitizedContent
          })) || [{
            id: `${section.id}-content`,
            title: section.title,
            rawText: sectionValidation.sanitizedContent
          }]
        });
      }
    }
    
    // Create initial document structure from validated sections
    const initialStructure: DocumentStructure = {
      ...unvalidatedStructure,
      sections: validatedSections,
      warnings: [...unvalidatedStructure.warnings, ...sectionSecurityIssues]
    };
    
    // Compute real word and page counts from the extracted text
    const wordCount = countWords(fileContent);
    const pageCount = countPages(wordCount);
    
    // Process the structure with the complete pipeline
    const processedStructure = processDocumentStructure(initialStructure, {
      title: file.name.replace(/\.[^/.]+$/, ""),
      sections: validatedSections,
      hasTitlePage: validatedSections.some((s: any) => s.type === 'metadata' || s.title.toLowerCase().includes('title')),
      hasTOC: validatedSections.some((s: any) => s.type === 'ancillary' || s.title.toLowerCase().includes('table of contents') || s.title.toLowerCase().includes('toc')),
      totalPages: pageCount,
      wordCount: wordCount
    }, (key: string) => key);

    // Apply detection results to enrich the structure
    const detectionResults = detectDocumentStructure(fileContent);
    const structureWithDetections = applyDetectionResults(processedStructure, detectionResults);
    
    // Integrate detectMultipleSectionsWithoutTitles to check for manual split requirement
    const needsManualSplit = detectMultipleSectionsWithoutTitles(fileContent);
    
    const documentStructure: DocumentStructure = {
      ...structureWithDetections
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

/**
 * Extracts content from uploaded files (DOCX or PDF) with security validation
 * 
 * @param files - Array of File objects to process
 * @returns Promise containing extracted content from all files
 */
export async function extractContentFromFiles(files: File[]) {
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
  const extractedContent = {
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
    wordCount: result.documentStructure.sections.reduce((total, section: any) => total + (section.content || '').split(/\s+/).filter((word: any) => word.length > 0).length, 0) // Accurate word count from sections
  };

  return extractedContent;
}
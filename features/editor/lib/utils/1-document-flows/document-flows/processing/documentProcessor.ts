import { validateDocumentContent } from './security/contentSecurityValidator';
import type { DocumentStructure } from '../../../../types/types';
import { processDocumentStructure } from '../common/documentProcessingUtils';
import { buildInitialStructure } from './structure/buildInitialStructure';
import { applyDetectionResults } from './structure/applyDetectionResults';
import { detectSpecialSections } from './detection/detectSpecialSections';
import { splitDocumentIntoParts } from './structure/splitDocument';
import { extractTextFromPDF } from './extractors/pdfExtractor';
import { extractTextFromDOCX } from './extractors/docxExtractor';
import { extractTextFromTXT } from './extractors/txtExtractor';
// No longer needed constants have been removed


/**
 * Processes a document securely with validation and detection capabilities
 */
export async function processDocumentSecurely(file: File) {
  try {
    // Create base ID once to ensure consistency
    const baseId = Date.now().toString();
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
        sectionSecurityIssues.push(`Section '${section.title}' removed for security reasons: ${sectionValidation.hardRejections.join(', ')}`);
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
    
    // Process the structure with the complete pipeline
    const processedStructure = processDocumentStructure(initialStructure, {
      title: file.name.replace(/\.[^/.]+$/, ""),
      sections: validatedSections,
      hasTitlePage: validatedSections.some((s: any) => s.type === 'metadata' || s.title.toLowerCase().includes('title')),
      hasTOC: validatedSections.some((s: any) => s.type === 'ancillary' || s.title.toLowerCase().includes('table of contents') || s.title.toLowerCase().includes('toc')),
      totalPages: 0,
      wordCount: fileContent.split(/\s+/).filter((word: any) => word.length > 0).length // Accurate word count from original content
    }, (key: string) => key);

    // Apply detection results to enrich the structure
    const detectionResults = detectSpecialSections(fileContent);
    const structureWithDetections = applyDetectionResults(processedStructure, detectionResults);
    
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
      needsManualSplit: false,
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

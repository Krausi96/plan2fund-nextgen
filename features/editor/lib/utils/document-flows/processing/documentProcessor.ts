import * as mammoth from 'mammoth';
import { validateDocumentContent } from '../security/contentSecurityValidator';
import type { DocumentStructure, PlanSection } from '../../../types/types';
import { enhanceWithSpecialSections } from '../../section-flows/enhancement/enhanceWithSpecialSections';
import { detectSpecialSections } from '../../section-flows/detection/detectSpecialSections';
import { applyDetectionResults } from '../../section-flows/application/applyDetectionResults';
import { sortSectionsByCanonicalOrder } from '../../section-flows/utilities/sectionUtilities';
import {
  METADATA_SECTION_ID,
  ANCILLARY_SECTION_ID,
  REFERENCES_SECTION_ID,
  APPENDICES_SECTION_ID,
  TABLES_DATA_SECTION_ID,
  FIGURES_IMAGES_SECTION_ID
} from '../../../constants';

/**
 * Extracts text from a PDF file in browser environment
 * 
 * @param file - PDF File object to process
 * @returns Promise containing extracted text content
 */
async function extractTextFromPDF(file: File): Promise<string> {
  // Dynamically import pdfjs-dist for client-side PDF processing
  const pdfjsLib = await import('pdfjs-dist');

  // Set up worker - using CDN version
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@4.4.168/build/pdf.worker.min.mjs`;

  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);

  const pdf = await pdfjsLib.getDocument(uint8Array).promise;
  let fullText = '';

  // Extract text from each page
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    // Join the text items to form the page text
    const pageText = textContent.items.map((item: any) => (item as any).str).join(' ');
    fullText += pageText + '\n';
  }

  return fullText;
}

/**
 * Processes a document securely with validation and detection capabilities
 */
export async function processDocumentSecurely(file: File) {
  try {
    let fileContent = '';
    
    if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.name.endsWith('.docx')) {
      // Process DOCX file
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      fileContent = result.value;
    } else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      // Process PDF file in browser environment
      fileContent = await extractTextFromPDF(file);
    } else if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
      // Process plain text file - read as text directly
      fileContent = await file.text();
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

    // Extract sections from the original content to preserve original structure for validation
    const originalSections = extractSectionsFromFileContent(fileContent, file.name);
    
    // Validate each section individually to determine which ones should be filtered out
    const validatedSections = [];
    const sectionSecurityIssues = [];
    
    for (const section of originalSections) {
      const sectionValidation = validateDocumentContent(section.content || '', section.title || '');
      
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
          }))
        });
      }
    }
    
    // Create initial document structure from validated sections
    const initialStructure: DocumentStructure = {
      structureId: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      version: '1.0',
      source: 'template',
      documents: [{
        id: `doc-${Date.now()}`,
        name: file.name.replace(/\.[^/.]+$/, ""),
        purpose: 'Main document from template upload',
        required: true
      }],
      sections: validatedSections.map((section) => ({
        id: section.id,
        documentId: `doc-${Date.now()}`,
        title: section.title,
        type: 'optional',
        required: false,
        programCritical: false,
        rawSubsections: section.rawSubsections
      })),
      requirements: [],
      validationRules: [],
      aiGuidance: [],
      renderingRules: {},
      conflicts: [],
      warnings: sectionSecurityIssues,
      confidenceScore: 90, // Default confidence
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'user'
    };
    
    // Detect special sections in the validated content
    const detectionResults = detectSpecialSections({
      title: file.name.replace(/\.[^/.]+$/, ""),
      sections: validatedSections,
      hasTitlePage: validatedSections.some((s: any) => s.type === 'metadata' || s.title.toLowerCase().includes('title')),
      hasTOC: validatedSections.some((s: any) => s.type === 'ancillary' || s.title.toLowerCase().includes('table of contents') || s.title.toLowerCase().includes('toc')),
      totalPages: 0,
      wordCount: validatedSections.reduce((total, section) => total + (section.content || '').split(/\s+/).filter(word => word.length > 0).length, 0)
    });
    
    // Apply detection results to enrich existing sections with detected content
    let structureWithDetectedContent = applyDetectionResults(initialStructure, detectionResults);
    
    // Enhance with special sections (title page, TOC, references, etc.)
    const enhancedStructure = enhanceWithSpecialSections(structureWithDetectedContent, (key: string) => key) || structureWithDetectedContent;
    
    // Remove duplicate sections to prevent duplication
    const seenIds = new Set();
    const uniqueSections = enhancedStructure.sections.filter(section => {
      if (seenIds.has(section.id)) {
        return false; // Skip duplicate
      }
      seenIds.add(section.id);
      return true;
    });
    
    // Apply canonical ordering to ensure sections are in the proper order
    const orderedSections = sortSectionsByCanonicalOrder(uniqueSections, enhancedStructure.documents);
    
    // Create final document structure with all enhancements
    const documentStructure: DocumentStructure = {
      ...enhancedStructure,
      sections: orderedSections
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

/**
 * Splits a document into multiple documents based on user selection
 */
export function splitDocumentIntoParts(
  originalStructure: DocumentStructure,
  splitPoints: number[]
): DocumentStructure[] {
  const parts: DocumentStructure[] = [];
  const totalSections = originalStructure.sections.length;
  
  // Ensure splitPoints are sorted and valid
  const sortedSplitPoints = [...splitPoints].sort((a, b) => a - b).filter(point => point > 0 && point < totalSections);
  
  // Add implicit start and end points
  const segmentStarts = [0, ...sortedSplitPoints];
  const segmentEnds = [...sortedSplitPoints, totalSections];
  
  for (let i = 0; i < segmentStarts.length; i++) {
    const start = segmentStarts[i];
    const end = segmentEnds[i];
    
    if (start < end) {
      const segmentSections = originalStructure.sections.slice(start, end);
      
      parts.push({
        ...originalStructure,
        structureId: `doc-split-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`,
        documents: [{
          id: `doc-${Date.now()}-${i}`,
          name: `${originalStructure.documents[0]?.name || 'Untitled'} - Part ${i + 1}`,
          purpose: `Part ${i + 1} of split document`,
          required: true
        }],
        sections: segmentSections,
        updatedAt: new Date().toISOString()
      });
    }
  }
  
  return parts;
}

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
    wordCount: result.documentStructure.warnings.length > 0 ? 100 : 200 // Placeholder
  };

  return extractedContent;
}

// ... rest of the file stays the same
// ... existing extractSectionsFromFileContent and determineSectionType functions ...

/**
 * Extracts sections from raw document content using simple heuristics
 * 
 * @param content - Raw text content of the document
 * @param fileName - Name of the file being processed
 * @returns Array of sections with title and content
 */
function extractSectionsFromFileContent(content: string, fileName: string) {
  const sections: PlanSection[] = [];
  
  // Split content by common section delimiters
  const lines = content.split('\n');
  let currentSection: {
    title: string;
    content: string;
    type: string;
  } | null = null;
  
  // Common section headers that might appear in business documents
  const sectionHeaders = [
    'executive summary',
    'company description',
    'market analysis',
    'products services',
    'marketing strategy',
    'operations plan',
    'management team',
    'financial plan',
    'risk analysis',
    'conclusion',
    'appendices',
    'references',
    'introduction',
    'background',
    'objectives',
    'methodology',
    'results',
    'discussion',
    'recommendations',
    'title page',
    'table of contents',
    'abstract',
    'acknowledgements',
    'glossary',
    'bibliography'
  ];
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Check if this line looks like a section header
    const isSectionHeader = sectionHeaders.some(header => 
      trimmedLine.toLowerCase().includes(header) || 
      trimmedLine.toLowerCase().startsWith(header) ||
      trimmedLine.toLowerCase().endsWith(header)
    );
    
    if (isSectionHeader && trimmedLine.length <= 100) { // Reasonable title length
      // Save previous section if exists
      if (currentSection) {
        sections.push(createPlanSection(currentSection));
      }
      
      // Create new section
      currentSection = {
        title: trimmedLine,
        content: '',
        type: determineSectionType(trimmedLine)
      };
    } else if (currentSection) {
      // Add content to current section
      if (currentSection.content) {
        currentSection.content += '\n' + trimmedLine;
      } else {
        currentSection.content = trimmedLine;
      }
    }
  }
  
  // Add the last section if exists
  if (currentSection) {
    sections.push(createPlanSection(currentSection));
  }
  
  // If no sections were identified, create a single section with the whole content
  if (sections.length === 0) {
    sections.push(createPlanSection({
      title: fileName.replace(/\.[^/.]+$/, "") || 'Untitled Document',
      content: content.substring(0, 1000) + (content.length > 1000 ? '...' : ''), // Limit content
      type: 'general'
    }));
  }
  
  return sections;
}

/**
 * Creates a PlanSection object with proper structure
 */
function createPlanSection(sectionData: { title: string; content: string; type: string }): PlanSection {
  // Map special section types to their canonical IDs
  let sectionId: string;
  
  switch (sectionData.type) {
    case 'metadata':
      sectionId = METADATA_SECTION_ID;
      break;
    case 'ancillary':
      sectionId = ANCILLARY_SECTION_ID;
      break;
    case 'references':
      sectionId = REFERENCES_SECTION_ID;
      break;
    case 'appendices':
      sectionId = APPENDICES_SECTION_ID;
      break;
    case 'tables_data':
      sectionId = TABLES_DATA_SECTION_ID;
      break;
    case 'figures_images':
      sectionId = FIGURES_IMAGES_SECTION_ID;
      break;
    default:
      sectionId = `${sectionData.type}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      break;
  }
  
  return {
    key: sectionId,
    id: sectionId,
    title: sectionData.title,
    content: sectionData.content,
    rawSubsections: [
      {
        id: `${sectionData.type}-overview-${Date.now()}`,
        title: `Overview of ${sectionData.title}`,
        rawText: sectionData.content.substring(0, 500) + (sectionData.content.length > 500 ? '...' : '')
      }
    ]
  };
}

/**
 * Determines the likely type of a section based on its title
 * 
 * @param title - Title of the section
 * @returns Type of the section
 */
function determineSectionType(title: string): string {
  const lowerTitle = title.toLowerCase();
  
  if (lowerTitle.includes('executive') || lowerTitle.includes('summary')) {
    return 'executive_summary';
  } else if (lowerTitle.includes('company') || lowerTitle.includes('description')) {
    return 'company_description';
  } else if (lowerTitle.includes('market') || lowerTitle.includes('analysis')) {
    return 'market_analysis';
  } else if (lowerTitle.includes('financial') || lowerTitle.includes('finance')) {
    return 'financial_plan';
  } else if (lowerTitle.includes('team') || lowerTitle.includes('management')) {
    return 'team_qualifications';
  } else if (lowerTitle.includes('risk')) {
    return 'risk_assessment';
  } else if (lowerTitle.includes('reference')) {
    return 'references';
  } else if (lowerTitle.includes('appendix') || lowerTitle.includes('appendices')) {
    return 'appendices';
  } else if (lowerTitle.includes('title') || lowerTitle.includes('cover')) {
    return 'metadata';
  } else if (lowerTitle.includes('table of contents') || lowerTitle.includes('toc')) {
    return 'ancillary';
  } else if (lowerTitle.includes('introduction')) {
    return 'introduction';
  } else if (lowerTitle.includes('conclusion') || lowerTitle.includes('closing')) {
    return 'conclusion';
  } else {
    return 'general';
  }
}
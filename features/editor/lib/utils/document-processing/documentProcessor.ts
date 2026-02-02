import * as mammoth from 'mammoth';

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
 * Extracts content from uploaded files (DOCX or PDF)
 * 
 * @param files - Array of File objects to process
 * @returns Promise containing extracted content from all files
 */
export async function extractContentFromFiles(files: File[]) {
  const extractedContent = {
    title: '',
    sections: [] as Array<{
      title: string;
      content: string;
      type: string;
      rawSubsections?: Array<{
        id: string;
        title: string;
        content: string;
      }>;
    }>,
    hasTitlePage: true,
    hasTOC: true,
    totalPages: 0,
    wordCount: 0
  };

  for (const file of files) {
    let fileContent = '';
    let pageCount = 0;
    let wordCount = 0;

    if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.name.endsWith('.docx')) {
      // Process DOCX file
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      fileContent = result.value;
      wordCount = fileContent.split(/\s+/).filter((word: string) => word.length > 0).length;
    } else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      // Process PDF file in browser environment
      fileContent = await extractTextFromPDF(file);
      pageCount = 0; // Will be estimated after extraction
      wordCount = fileContent.split(/\s+/).filter((word: string) => word.length > 0).length;
    } else {
      throw new Error(`Unsupported file type: ${file.type}`);
    }

    // Simple heuristic to extract sections from the document content
    const sections = extractSectionsFromFileContent(fileContent, file.name);

    // Add the extracted sections to the overall content
    extractedContent.sections = [...extractedContent.sections, ...sections];
    extractedContent.totalPages += pageCount;
    extractedContent.wordCount += wordCount;

    // Set title based on the first file
    if (!extractedContent.title) {
      extractedContent.title = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
    }
  }

  return extractedContent;
}

/**
 * Extracts sections from raw document content using simple heuristics
 * 
 * @param content - Raw text content of the document
 * @param fileName - Name of the file being processed
 * @returns Array of sections with title and content
 */
function extractSectionsFromFileContent(content: string, fileName: string) {
  const sections = [];
  
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
    'recommendations'
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
        sections.push(currentSection);
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
    sections.push(currentSection);
  }
  
  // If no sections were identified, create a single section with the whole content
  if (sections.length === 0) {
    sections.push({
      title: fileName.replace(/\.[^/.]+$/, "") || 'Untitled Document',
      content: content.substring(0, 1000) + (content.length > 1000 ? '...' : ''), // Limit content
      type: 'general'
    });
  }
  
  return sections.map(section => ({
    ...section,
    rawSubsections: [
      {
        id: `${section.type}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        title: `Overview of ${section.title}`,
        content: section.content.substring(0, 500) + (section.content.length > 500 ? '...' : '')
      }
    ]
  }));
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
  } else {
    return 'general';
  }
}
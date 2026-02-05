import * as mammoth from 'mammoth';

/**
 * Extracts text content from a DOCX file
 * 
 * @param file - DOCX File object to process
 * @returns Promise containing extracted text content
 */
export async function extractTextFromDOCX(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  
  // Use convertToHtml instead of extractRawText to preserve document structure
  const result = await mammoth.convertToHtml({ 
    arrayBuffer
  });
  
  return result.value;
}
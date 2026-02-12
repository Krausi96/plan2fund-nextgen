import * as mammoth from 'mammoth';

/**
 * Extracts text content from a DOCX file
 * 
 * @param file - DOCX File object to process
 * @returns Promise containing extracted text content
 */
export async function extractTextFromDOCX(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();

    // Use convertToHtml instead of extractRawText to preserve document structure
    const result = await mammoth.convertToHtml({
      arrayBuffer
    });

    // Ensure we return a string, even if result.value is undefined
    return result.value || '';
  } catch (error) {
    console.error('DOCX extraction error:', error);
    throw new Error(`Failed to extract DOCX content: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
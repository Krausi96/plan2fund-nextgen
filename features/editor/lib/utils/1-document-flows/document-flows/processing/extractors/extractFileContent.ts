import { extractTextFromPDF } from './pdfExtractor';
import { extractTextFromDOCX } from './docxExtractor';
import { extractTextFromTXT } from './txtExtractor';

/**
 * Helper function for extracting file content
 */
export async function extractFileContent(file: File): Promise<string | null> {
  if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.name.endsWith('.docx')) {
    return await extractTextFromDOCX(file);
  } else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
    return await extractTextFromPDF(file);
  } else if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
    return await extractTextFromTXT(file);
  }
  
  return null;
}
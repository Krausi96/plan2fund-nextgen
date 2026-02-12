/**
 * Extracts content from a plain text file
 * 
 * @param file - Text File object to process
 * @returns Promise containing extracted text content
 */
export async function extractTextFromTXT(file: File): Promise<string> {
  return await file.text();
}
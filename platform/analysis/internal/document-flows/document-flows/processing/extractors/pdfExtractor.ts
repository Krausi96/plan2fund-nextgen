/**
 * Extracts text from a PDF file in browser environment
 * Uses pdfjs-dist v4 legacy build for Next.js compatibility
 *
 * @param file - PDF File object to process
 * @returns Promise containing extracted text content
 */
export async function extractTextFromPDF(file: File): Promise<string> {
  try {
    // Use legacy build for Next.js + browser compatibility
    // @ts-ignore - legacy build doesn't have TypeScript declarations
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf');

    // Set worker path for legacy build
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs';

    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    const loadingTask = pdfjsLib.getDocument(uint8Array);
    const pdf = await loadingTask.promise;

    let fullText = '';

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += pageText + '\n';
    }

    return fullText || '';
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error(`Failed to extract PDF content: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
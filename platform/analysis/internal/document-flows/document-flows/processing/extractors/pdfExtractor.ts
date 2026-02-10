/**
 * Extracts text from a PDF file in browser environment
 * 
 * @param file - PDF File object to process
 * @returns Promise containing extracted text content
 */
export async function extractTextFromPDF(file: File): Promise<string> {
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
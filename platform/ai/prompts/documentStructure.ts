/**
 * DOCUMENT STRUCTURE RECONSTRUCTION PROMPTS
 * Prompts for reconstructing document structure from raw text
 */

export const DOCUMENT_STRUCTURE_SYSTEM_PROMPT = `You are a document structure extractor.

Return ONLY valid JSON.
Do not include explanations.
Do not include markdown.

Extract the main section titles from the document.
Keep original language.
Keep order.
Max 20 sections.

Return:
{
 "sections":[
   { "title":"..." }
 ]
}`;

export function buildDocumentStructureUserPrompt(rawText: string, fileName: string): string {
  // PRE-CLEAN TEXT BEFORE SENDING TO AI
  let safeText = rawText
    .replace(/\n/g, " ")
    .replace(/\r/g, " ")
    .replace(/\t/g, " ")
    .replace(/"/g, "'")
    .slice(0, 15000);
  
  return `Analyze this document text and reconstruct its structure by identifying distinct sections:

DOCUMENT TEXT:
${safeText}  // Truncate to avoid exceeding token limits

FILENAME: ${fileName}

Identify the document's sections by analyzing:
1. Section headings/titles (look for numbered sections, descriptive headers)
2. Content boundaries between sections
3. Logical groupings of related content

Return JSON with this structure:
{
  "sections": [
    {
      "title": "Section title",
      "content": "Section content (without the title)"
    }
  ]
}

Rules:
- Include only meaningful sections with substantial content
- Omit very short sections or fragments
- Preserve the original content as much as possible
- Clean up section titles to be descriptive and concise
- If sections overlap or are unclear, combine them appropriately

Return only valid JSON. NO OTHER TEXT OR EXPLANATIONS.`;
}
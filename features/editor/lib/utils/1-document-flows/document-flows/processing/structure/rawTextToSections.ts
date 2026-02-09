import type { DocumentStructure, PlanSection } from '../../../../../types/types';
import { processDocumentStructure } from '../../common/documentProcessingUtils';

/**
 * SIMPLE STRUCTURAL SECTION EXTRACTION
 * - detects numbered + short headings only
 * - no domain guessing
 * - no business-plan assumptions
 */
function extractSectionsFromFileContent(
  content: string,
  fileName: string
): PlanSection[] {

  const lines = content.split('\n');
  const sections: PlanSection[] = [];

  let current: { title: string; content: string } | null = null;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    const isNumbered = /^\d+(\.\d+)*\s+/.test(line);
    const isShortTitle =
      line.length < 80 &&
      line.split(/\s+/).length <= 8 &&
      /^[A-ZÄÖÜ]/.test(line);

    if (isNumbered || isShortTitle) {
      if (current) sections.push(createSection(current));
      current = { title: cleanTitle(line), content: '' };
      continue;
    }

    if (!current) {
      current = {
        title: fileName.replace(/\.[^/.]+$/, '') || 'Document',
        content: ''
      };
    }

    current.content += (current.content ? '\n' : '') + line;
  }

  if (current) sections.push(createSection(current));

  if (sections.length === 0) {
    sections.push(
      createSection({
        title: fileName.replace(/\.[^/.]+$/, '') || 'Document',
        content
      })
    );
  }

  return sections;
}

/* ---------------------------------------------------- */

function cleanTitle(line: string) {
  return line
    .replace(/^\d+(\.\d+)*\s*/, '')
    .replace(/:$/, '')
    .trim();
}

function createSection(data: { title: string; content: string }): PlanSection {
  const id = `sec-${Date.now()}-${Math.random().toString(36).slice(2,6)}`;

  return {
    key: id,
    id,
    title: data.title,
    content: data.content,
    rawSubsections: [
      {
        id: `${id}-raw`,
        title: data.title,
        rawText: data.content
      }
    ]
  };
}

/**
 * Builds an initial document structure from raw content
 * 
 * @param content - Raw document content
 * @param fileName - Name of the source file
 * @returns Initial document structure ready for processing
 */
export function rawTextToSections(content: string, fileName: string, baseId: string = Date.now().toString()): DocumentStructure {
  // Extract sections from the raw content
  const sections = extractSectionsFromFileContent(content, fileName);
  
  // Create initial document structure from extracted sections
  const initialStructure: DocumentStructure = {
    structureId: `doc-${baseId}-${Math.random().toString(36).substr(2, 9)}`, 
    version: '1.0',
    source: 'template',
    documents: [{
      id: `doc-${baseId}`, 
      name: fileName.replace(/\.[^/.]+$/, ""),
      purpose: 'Main document from template upload',
      required: true
    }],
    sections: sections.map((section) => ({
      id: section.id,
      documentId: `doc-${baseId}`, 
      title: section.title,
      type: 'optional',
      required: false,
      programCritical: false,
      content: section.content || '', // Add content property
      rawSubsections: section.rawSubsections || [{
        id: `${section.id}-default`,
        title: section.title,
        rawText: section.content || ''
      }]
    })), 
    requirements: [],
    validationRules: [],
    aiGuidance: [],
    renderingRules: {},
    conflicts: [],
    warnings: [],
    confidenceScore: 90, // Default confidence
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'user'
  };
  
  // Process the structure with the complete pipeline
  const processedStructure = processDocumentStructure(initialStructure, {
    title: fileName.replace(/\.[^/.]+$/, ""),
    sections: sections,
    hasTitlePage: sections.some((s: any) => s.type === 'metadata' || s.title.toLowerCase().includes('title')),
    hasTOC: sections.some((s: any) => s.type === 'ancillary' || s.title.toLowerCase().includes('table of contents') || s.title.toLowerCase().includes('toc')),
    totalPages: 0,
    wordCount: sections.reduce((total, section) => total + (section.content || '').split(/\s+/).filter(word => word.length > 0).length, 0)
  }, (key: string) => key);
  
  const orderedSections = processedStructure.sections;
  
  // Create final document structure with all enhancements
  const documentStructure: DocumentStructure = {
    ...processedStructure,
    sections: orderedSections
  };

  return documentStructure;
}
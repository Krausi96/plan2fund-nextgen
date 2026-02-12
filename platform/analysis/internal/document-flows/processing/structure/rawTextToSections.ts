import type { DocumentStructure, PlanSection } from '@/platform/core/types';
import { processDocumentStructure } from '../../common/documentProcessingUtils';
import { detectTOC } from '../detection/documentStructureDetector';

/**
 * SIMPLE STRUCTURAL SECTION EXTRACTION
 * - detects numbered + short headings only
 * - no domain guessing
 * - no business-plan assumptions
 */

// Helper functions for multi-attempt detection pipeline
function attemptTocBasedSplit(content: string, fileName: string): PlanSection[] {
  // Import detection function to use enhanced TOC detection
  const tocDetection = detectTOC(content);
  
  if (tocDetection.found && tocDetection.confidence >= 0.9 && tocDetection.content?.entries) {
    const tocEntries = tocDetection.content.entries;
    if (tocEntries.length >= 4) { // Require at least 4 entries for valid TOC
      console.log('[TOC MODE ACTIVE]');
      
      // Use TOC entries to split document content
      const normalizedTocTitles = tocEntries.map(title => {
        return {
          original: title.trim(),
          normalized: title.toLowerCase().replace(/^\d+[\.\\s\u00a0]+|\s*\.{2,}\s*\d+$/g, '').trim()
        };
      });
      
      // Find the TOC block in content to remove it from the main content
      const tocPattern = /(?:table[\s\u00a0]*of[\s\u00a0]*contents?|inhaltsverzeichnis|toc)[\s\S]*?(?=\n\d+\.|\n[A-Z]|\n\w+\s*\.{2,})/i;
      const tocMatch = content.match(tocPattern);
      
      let contentWithoutToc = content;
      if (tocMatch) {
        // Remove the TOC block from content before splitting into sections
        const tocBlockStart = tocMatch.index || 0;
        // Find where TOC block ends - either at first major section or after TOC entries
        let tocBlockEnd = tocBlockStart + tocMatch[0].length;
        
        // Look for the first actual section title after TOC to determine end of TOC block
        for (const tocEntry of tocEntries) {
          const entryIndex = content.indexOf(tocEntry.trim(), tocBlockEnd);
          if (entryIndex !== -1) {
            // Continue searching for the actual content of the first section
            const nextEntryIndex = tocEntries.indexOf(tocEntry) < tocEntries.length - 1 
              ? content.indexOf(tocEntries[tocEntries.indexOf(tocEntry) + 1].trim(), entryIndex)
              : -1;
              
            if (nextEntryIndex !== -1) {
              tocBlockEnd = nextEntryIndex;
            } else {
              // If this is the last TOC entry, find the actual content start
              const contentAfterEntry = content.substring(entryIndex + tocEntry.length).trim();
              const firstContentLine = contentAfterEntry.split('\n').find(line => line.trim() && !tocEntries.some(tocEntry => 
                line.toLowerCase().includes(tocEntry.toLowerCase().replace(/^\d+[\.\\s\u00a0]+|\s*\.{2,}\s*\d+$/g, '').trim())
              ));
              
              if (firstContentLine) {
                const actualStart = content.indexOf(firstContentLine, entryIndex);
                tocBlockEnd = actualStart;
                break;
              }
            }
          }
        }
        
        // Remove the TOC block from content
        contentWithoutToc = content.substring(0, tocBlockStart) + content.substring(tocBlockEnd);
        console.log('[TOC BLOCK REMOVED]');
      }
      
      // Find each title position in content and slice content between titles
      let sections: PlanSection[] = [];
      
      for (let i = 0; i < normalizedTocTitles.length; i++) {
        const currentTitle = normalizedTocTitles[i];
        const nextTitle = i < normalizedTocTitles.length - 1 ? normalizedTocTitles[i + 1] : null;
        
        // Find the position of the current title in the content
        const currentPos = contentWithoutToc.indexOf(currentTitle.original);
        if (currentPos === -1) continue; // Skip if title not found in content
        
        // Find the position of the next title if it exists
        let endPos = contentWithoutToc.length;
        if (nextTitle) {
          const nextPos = contentWithoutToc.indexOf(nextTitle.original);
          if (nextPos !== -1) {
            endPos = nextPos;
          }
        }
        
        // Extract content between current and next title
        const sectionContent = contentWithoutToc.substring(currentPos, endPos).trim();
        
        sections.push(createSection({ 
          title: currentTitle.original, 
          content: sectionContent 
        }));
      }
      
      return sections;
    }
  }
  return [];
}

function attemptNumberedHeadingSplit(content: string, fileName: string): PlanSection[] {
  const lines = content.split('\n');
  const sections: PlanSection[] = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (/^\d+(?:\.\d+)*[\s\u00a0]+[A-Z]/.test(trimmed)) { // Numbered heading pattern
      const title = trimmed.replace(/^\d+(?:\.\d+)*[\s\u00a0]+/, '').trim();
      sections.push(createSection({ title, content: '' }));
    }
  }
  
  return sections;
}

function attemptKeywordAnchorSplit(content: string, fileName: string): PlanSection[] {
  const keywords = [
    'executive summary', 'problem', 'solution', 'market analysis', 'financial',
    'competition', 'strategy', 'marketing', 'sales', 'team', 'management',
    'operations', 'risks', 'conclusion', 'references', 'appendix'
  ];
  
  const sections: PlanSection[] = [];
  const lowerContent = content.toLowerCase();
  
  for (const keyword of keywords) {
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
    let match;
    while ((match = regex.exec(lowerContent)) !== null) {
      const pos = match.index;
      const lineStart = Math.max(0, content.lastIndexOf('\n', pos));
      const lineEnd = content.indexOf('\n', pos);
      const line = content.substring(lineStart, lineEnd === -1 ? content.length : lineEnd).trim();
      
      // Extract title from the line
      const title = line.replace(/^\d+[\s\u00a0]*\.?[\s\u00a0]*/, '').trim();
      if (!sections.some(s => s.title.toLowerCase() === title.toLowerCase())) {
        sections.push(createSection({ title, content: '' }));
      }
    }
  }
  
  return sections;
}
// Multi-attempt detection pipeline - prioritize TOC detection first
function extractSectionsFromFileContent(
  content: string,
  fileName: string
): PlanSection[] {

  // First, check if TOC exists and has sufficient entries to use as primary splitter
  const tocDetection = detectTOC(content);
  
  if (tocDetection.found && tocDetection.confidence >= 0.9 && tocDetection.content?.entries && tocDetection.content.entries.length >= 4) {
    console.log('[TOC PRIMARY SPLIT ACTIVE]');
    
    // Use TOC-based split as primary method when detected with confidence
    const tocSections = attemptTocBasedSplit(content, fileName);
    
    if (tocSections.length >= 4) {
      console.log(`[TOC SPLIT SUCCESS] Generated ${tocSections.length} sections`);
      return tocSections;
    }
  }

  // If no TOC detected or not suitable, fall back to traditional extraction
  
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

  // Multi-attempt detection pipeline if no sections detected properly
  let finalSections = [...sections]; // Work with a copy to avoid const reassignment
  if (finalSections.length === 0) {
    // Attempt 1: TOC-based split (as secondary check)
    const tocSections = attemptTocBasedSplit(content, fileName);
    if (tocSections.length > 0) {
      finalSections = tocSections;
    } else {
      // Attempt 2: Numbered heading split
      const numberedSections = attemptNumberedHeadingSplit(content, fileName);
      if (numberedSections.length > 0) {
        finalSections = numberedSections;
      } else {
        // Attempt 3: Keyword anchor split
        const keywordSections = attemptKeywordAnchorSplit(content, fileName);
        if (keywordSections.length > 0) {
          finalSections = keywordSections;
        } else {
          // Attempt 4: Fallback single section
          finalSections.push(
            createSection({
              title: fileName.replace(/\.[^/.]+$/, '') || 'Document',
              content
            })
          );
          
          // Warning will be added at higher level where initialStructure is available
        }
      }
    }
  }

  return finalSections;
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
      type: 'normal' as const,
      required: false,
      programCritical: false,
      content: section.content || '', // Add content property
      requirements: [], // Add requirements array to each section
      // rawSubsections is not part of the Section interface
    })), 
    validationRules: [],
    aiGuidance: [],
    renderingRules: {},
    conflicts: [],
    warnings: [],
    confidenceScore: 90, // Default confidence
    metadata: {
      source: 'document',
      generatedAt: new Date().toISOString(),
      version: '1.0',
    }
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

  console.log('[FINAL STRUCTURE ORDER]');
  console.log(orderedSections.map(s => s.title));

  return documentStructure;
}
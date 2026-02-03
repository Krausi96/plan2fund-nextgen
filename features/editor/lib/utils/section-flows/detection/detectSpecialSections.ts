/**
 * DOCUMENT SECTION DETECTION
 * 
 * Contains functions for detecting special sections (title page, TOC, references, etc.)
 * using keyword and positional heuristics rather than strict parsing.
 * 
 * This file contains detection logic only - no mutations or additions to document structures.
 */

import type { DetectionMap, DetectionResult } from '../types';
import {
  METADATA_SECTION_ID,
  ANCILLARY_SECTION_ID,
  REFERENCES_SECTION_ID,
  APPENDICES_SECTION_ID,
  TABLES_DATA_SECTION_ID,
  FIGURES_IMAGES_SECTION_ID
} from '../../../constants';

/**
 * Detect special sections in document content using keyword and positional heuristics
 * 
 * @param content - Document content to analyze
 * @returns Map of section types with detection results
 */
export function detectSpecialSections(content: any): DetectionMap {
  const result: DetectionMap = {};

  // Detect Title Page
  result[METADATA_SECTION_ID] = detectTitlePage(content);

  // Detect TOC
  result[ANCILLARY_SECTION_ID] = detectTableOfContents(content);

  // Detect References
  result[REFERENCES_SECTION_ID] = detectReferences(content);

  // Detect Appendices
  result[APPENDICES_SECTION_ID] = detectAppendices(content);

  // Detect Tables/Data
  result[TABLES_DATA_SECTION_ID] = detectTablesData(content);

  // Detect Figures/Images
  result[FIGURES_IMAGES_SECTION_ID] = detectFiguresImages(content);

  return result;
}

/**
 * Detect Title Page using positional and keyword heuristics
 * 
 * Title Page criteria:
 * - pageIndex === 0
 * - Contains keywords like "Business Plan", "Company", "Projektname"
 * - No page numbers
 * - No "Inhaltsverzeichnis"
 */
function detectTitlePage(content: any): DetectionResult {
  // This is a simplified implementation - in a real scenario, 
  // you'd need access to actual page content and structure
  
  // Look for title page indicators in content
  const textContent = JSON.stringify(content).toLowerCase();
  
  const hasTitleKeywords = [
    'business plan', 'company', 'projektname', 'title page', 
    'executive summary', 'unternehmen', 'geschäftsplan'
  ].some(keyword => textContent.includes(keyword));
  
  const hasNoPageNumbers = !textContent.includes('page') || 
    !textContent.match(/page \d+|seite \d+|\d+\/\d+/);
  
  const hasNoToc = !textContent.includes('inhaltsverzeichnis') && 
    !textContent.includes('table of contents');
  
  // If we have title keywords, no obvious page numbering, and no TOC indicators
  if (hasTitleKeywords && hasNoPageNumbers && hasNoToc) {
    return {
      found: true,
      confidence: 0.85,
      content: { type: 'title_page' }
    };
  }
  
  return {
    found: false,
    confidence: 0.1
  };
}

/**
 * Detect Table of Contents using keyword and structural heuristics
 * 
 * TOC criteria:
 * - Contains keywords like "Inhaltsverzeichnis", "Table of Contents"
 * - OR has repeated dotted lines / numbered headings
 * - Usually appears on pages 1-3
 */
function detectTableOfContents(content: any): DetectionResult {
  const textContent = JSON.stringify(content).toLowerCase();
  
  const hasTocKeywords = [
    'inhaltsverzeichnis', 'table of contents', 'contents', 
    'inhalt', 'verzeichnis', 'toc'
  ].some(keyword => textContent.includes(keyword));
  
  // Look for structural patterns like dotted lines with page numbers
  const hasStructuralPattern = textContent.match(/\w+\s+\.+\s+\d+/gi) || 
    textContent.match(/\w+\s*\.{2,}\s*\d+/gi);
  
  if (hasTocKeywords) {
    return {
      found: true,
      confidence: 0.9,
      content: { type: 'toc' }
    };
  }
  
  if (hasStructuralPattern) {
    return {
      found: true,
      confidence: 0.7,
      content: { type: 'toc' }
    };
  }
  
  return {
    found: false,
    confidence: 0.1
  };
}

/**
 * Detect References section using keyword heuristics
 * 
 * References criteria:
 * - Headings match "References", "Quellen", "Literatur"
 * - Often near the end of document
 */
function detectReferences(content: any): DetectionResult {
  const textContent = JSON.stringify(content).toLowerCase();
  
  const hasReferenceKeywords = [
    'references', 'quellen', 'literatur', 'bibliography', 
    'works cited', 'sources', 'quelle'
  ].some(keyword => textContent.includes(keyword));
  
  if (hasReferenceKeywords) {
    return {
      found: true,
      confidence: 0.85,
      content: { type: 'references' }
    };
  }
  
  return {
    found: false,
    confidence: 0.1
  };
}

/**
 * Detect Appendices section using keyword heuristics
 * 
 * Appendices criteria:
 * - Headings match "Appendix", "Anhang"
 * - OR contains "Appendix A", "Anlage 1"
 */
function detectAppendices(content: any): DetectionResult {
  const textContent = JSON.stringify(content).toLowerCase();
  
  const hasAppendixKeywords = [
    'appendix', 'anhang', 'annex', 'attachment', 
    'appendices', 'beilage', 'anlagen'
  ].some(keyword => textContent.includes(keyword));
  
  // Look for appendix numbering patterns
  const hasAppendixPatterns = textContent.match(/appendix\s+[a-z\d]/gi) || 
    textContent.match(/anhang\s+\d/gi) || 
    textContent.match(/anlage\s+\d/gi);
  
  if (hasAppendixKeywords) {
    return {
      found: true,
      confidence: 0.9,
      content: { type: 'appendices' }
    };
  }
  
  if (hasAppendixPatterns) {
    return {
      found: true,
      confidence: 0.75,
      content: { type: 'appendices' }
    };
  }
  
  return {
    found: false,
    confidence: 0.1
  };
}

/**
 * Detect Tables and Data section using keyword heuristics
 * 
 * Tables/Data criteria:
 * - Headings match "Tables", "Tabellen", "Data Tables"
 * - Contains structured data in tabular format
 * - Often has "Table X" captions
 */
function detectTablesData(content: any): DetectionResult {
  const textContent = JSON.stringify(content).toLowerCase();
  
  const hasTableKeywords = [
    'tables', 'tabellen', 'data tables', 'table of', 
    'data', 'statistik', 'statistics'
  ].some(keyword => textContent.includes(keyword));
  
  // Look for table numbering patterns
  const hasTablePatterns = textContent.match(/table\s+\d/gi) || 
    textContent.match(/tabelle\s+\d/gi);
  
  if (hasTableKeywords || hasTablePatterns) {
    return {
      found: true,
      confidence: 0.8,
      content: { type: 'tables_data' }
    };
  }
  
  return {
    found: false,
    confidence: 0.1
  };
}

/**
 * Detect Figures and Images section using keyword heuristics
 * 
 * Figures/Images criteria:
 * - Headings match "Figures", "Abbildungen", "Charts", "Graphs"
 * - Contains images, charts, diagrams with "Figure X" captions
 */
function detectFiguresImages(content: any): DetectionResult {
  const textContent = JSON.stringify(content).toLowerCase();
  
  const hasFigureKeywords = [
    'figures', 'abbildungen', 'charts', 'graphs', 
    'images', 'bilder', 'diagrams', 'grafiken'
  ].some(keyword => textContent.includes(keyword));
  
  // Look for figure numbering patterns
  const hasFigurePatterns = textContent.match(/figure\s+\d/gi) || 
    textContent.match(/abbildung\s+\d/gi) || 
    textContent.match(/grafik\s+\d/gi);
  
  if (hasFigureKeywords || hasFigurePatterns) {
    return {
      found: true,
      confidence: 0.8,
      content: { type: 'figures_images' }
    };
  }
  
  return {
    found: false,
    confidence: 0.1
  };
}
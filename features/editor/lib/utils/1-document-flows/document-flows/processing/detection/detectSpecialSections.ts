/**
 * DOCUMENT SECTION DETECTION
 * 
 * Contains functions for detecting special sections (title page, TOC, references, etc.)
 * using keyword and positional heuristics rather than strict parsing.
 * 
 * This file contains detection logic only - no mutations or additions to document structures.
 */

import type { DetectionMap, DetectionResult } from '../../sections/types';
import {
  METADATA_SECTION_ID,
  ANCILLARY_SECTION_ID,
  REFERENCES_SECTION_ID,
  APPENDICES_SECTION_ID,
  TABLES_DATA_SECTION_ID,
  FIGURES_IMAGES_SECTION_ID
} from '@/features/editor/lib/constants';

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

  // Detect Executive Summary (enhanced)
  result['special-section-executive-summary'] = detectExecutiveSummary(content);

  // Detect Glossary
  result['special-section-glossary'] = detectGlossary(content);

  // Detect Legal Notices
  result['special-section-legal-notices'] = detectLegalNotices(content);

  // Detect Financials
  result['special-section-financials'] = detectFinancials(content);

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
    'executive summary', 'unternehmen', 'geschäftsplan',
    'cover page', 'document title', 'proposal title', 'title sheet'
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
    'inhalt', 'verzeichnis', 'toc',
    'table-of-contents', 'content listing', 'chapter listing', 'section listing'
  ].some(keyword => textContent.includes(keyword));
  
  // Look for structural patterns like dotted lines with page numbers
  const hasStructuralPattern = textContent.match(/\w+\s+\.+\s+\d+/gi) || 
    textContent.match(/\w+\s*\.{2,}\s*\d+/gi) ||
    textContent.match(/\d+\.\d*\s+[^\n]+\s+\d+/gi); // Numbered entries with page numbers
  
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
    'works cited', 'sources', 'quelle',
    'bibliography', 'citations', 'references list', 'source list', 'works consulted'
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
    'appendices', 'beilage', 'anlagen',
    'supplementary materials', 'supporting documents', 'additional information'
  ].some(keyword => textContent.includes(keyword));
  
  // Look for appendix numbering patterns
  const hasAppendixPatterns = textContent.match(/appendix\s+[a-z\d]/gi) || 
    textContent.match(/anhang\s+\d/gi) || 
    textContent.match(/anlage\s+\d/gi) ||
    textContent.match(/appendices\s+[a-z\d]/gi);
  
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
    'data', 'statistik', 'statistics',
    'table listing', 'data listing', 'chart listing', 'graph listing'
  ].some(keyword => textContent.includes(keyword));
  
  // Look for table numbering patterns
  const hasTablePatterns = textContent.match(/table\s+\d/gi) || 
    textContent.match(/tabelle\s+\d/gi) ||
    textContent.match(/chart\s+\d/gi) ||
    textContent.match(/fig\s+\d/gi);
  
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
    'images', 'bilder', 'diagrams', 'grafiken',
    'figure listing', 'chart listing', 'graph listing', 'visual listing'
  ].some(keyword => textContent.includes(keyword));
  
  // Look for figure numbering patterns
  const hasFigurePatterns = textContent.match(/figure\s+\d/gi) || 
    textContent.match(/abbildung\s+\d/gi) || 
    textContent.match(/grafik\s+\d/gi) ||
    textContent.match(/fig\s+\d/gi) ||
    textContent.match(/image\s+\d/gi);
  
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

/**
 * Enhanced Executive Summary detection
 */
function detectExecutiveSummary(content: any): DetectionResult {
  const textContent = JSON.stringify(content).toLowerCase();

  // Keywords for executive summary (including synonyms)
  const execSummaryKeywords = [
    'executive summary', 'executive-summary', 'exposé', 'zusammenfassung',
    'executive', 'summary', 'zusammenfassung', 'executivesummary',
    'brief overview', 'highlights', 'key points', 'main findings',
    'executive overview', 'management summary'
  ];

  // Check for executive summary keywords
  const hasExecSummaryKeywords = execSummaryKeywords.some(keyword => 
    new RegExp(`\\b${keyword}\\b`, 'i').test(textContent)
  );

  // Check if it appears early in the document
  const execSummaryIndex = Math.min(
    ...execSummaryKeywords.map(keyword => textContent.indexOf(keyword)).filter(index => index !== -1)
  );

  if (hasExecSummaryKeywords && execSummaryIndex !== -1 && execSummaryIndex < textContent.length * 0.2) {
    return {
      found: true,
      confidence: 0.9,
      content: { type: 'executive_summary' }
    };
  }

  return {
    found: false,
    confidence: 0.1
  };
}

/**
 * Detect Glossary section
 */
function detectGlossary(content: any): DetectionResult {
  const textContent = JSON.stringify(content).toLowerCase();

  // Keywords for glossary (including synonyms)
  const glossaryKeywords = [
    'glossary', 'definition', 'definitions', 'terminology', 
    'terms', 'meaning', 'explanation', 'word list',
    'vocabulary', 'lexicon', 'dictionary', 'term definition',
    'glossar', 'definitionen', 'begriffe'
  ];

  const hasGlossaryKeywords = glossaryKeywords.some(keyword => 
    new RegExp(`\\b${keyword}\\b`, 'i').test(textContent)
  );

  // Look for typical glossary patterns (term followed by colon or dash and explanation)
  const glossaryPattern = /[\n\r]([A-Z][a-zA-Z\s]{2,100})[:\-]([^\n\r]{10,200})/g;
  const glossaryMatches = textContent.match(glossaryPattern);

  if (hasGlossaryKeywords || (glossaryMatches && glossaryMatches.length > 2)) {
    return {
      found: true,
      confidence: 0.85,
      content: { type: 'glossary' }
    };
  }

  return {
    found: false,
    confidence: 0.1
  };
}

/**
 * Detect Legal Notices section
 */
function detectLegalNotices(content: any): DetectionResult {
  const textContent = JSON.stringify(content).toLowerCase();

  // Keywords for legal notices (including synonyms)
  const legalKeywords = [
    'legal notice', 'legal disclaimer', 'disclaimer', 'copyright',
    'trademark', 'patent', 'intellectual property', 'ip rights',
    'terms of use', 'privacy policy', 'liability', 'warranty',
    'jurisdiction', 'governing law', 'limitation of liability',
    'rechtlicher hinweis', 'haftungsausschluss', 'urheberrecht',
    'rechtliches', 'impressum', 'terms and conditions'
  ];

  const hasLegalKeywords = legalKeywords.some(keyword => 
    new RegExp(`\\b${keyword}\\b`, 'i').test(textContent)
  );

  // Look for patterns indicating legal text
  const legalPattern = /\b(warranties?|liabilities?|damages?|indemnity|confidentiality)\b/gi;
  const legalMatches = textContent.match(legalPattern);

  if (hasLegalKeywords || (legalMatches && legalMatches.length > 3)) {
    return {
      found: true,
      confidence: 0.8,
      content: { type: 'legal_notices' }
    };
  }

  return {
    found: false,
    confidence: 0.1
  };
}

/**
 * Detect Financials section
 */
function detectFinancials(content: any): DetectionResult {
  const textContent = JSON.stringify(content).toLowerCase();

  // Keywords for financials (including synonyms)
  const financeKeywords = [
    'financial plan', 'financial planning', 'finanzplan', 'finanzierungsplan',
    'financial projections', 'financial forecast', 'finanzielle planung',
    'budget', 'kosten', 'revenue', 'einnahmen', 'expenses', 'ausgaben',
    'income statement', 'balance sheet', 'cash flow', 'profit & loss',
    'p&l', 'financial statements', 'revenue model', 'cost structure',
    'investment', 'funding', 'capital', 'valuation', 'equity', 'debt',
    'break-even', 'roi', 'return on investment'
  ];

  const hasFinanceKeywords = financeKeywords.some(keyword => 
    new RegExp(`\\b${keyword}\\b`, 'i').test(textContent)
  );

  // Look for financial patterns (numbers with currency signs, percentages)
  const financialPattern = /(\$|€|£|¥|%|usd|eur|gbp|jpy)[\s\d,.]+|[\d,.]+\s*(\$|€|£|¥|%|usd|eur|gbp|jpy)/g;
  const financeMatches = textContent.match(financialPattern);

  if (hasFinanceKeywords || (financeMatches && financeMatches.length > 5)) {
    return {
      found: true,
      confidence: 0.85,
      content: { type: 'financials' }
    };
  }

  return {
    found: false,
    confidence: 0.1
  };
}

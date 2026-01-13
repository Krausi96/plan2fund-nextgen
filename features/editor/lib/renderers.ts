/**
 * ============================================================================
 * RENDERER UTILITIES
 * ============================================================================
 * 
 * Utilities for rendering document preview and sections.
 * 
 * USED BY:
 *   - PreviewWorkspace.tsx
 *   - Any component that renders document preview
 * ============================================================================
 */

import React from 'react';

/**
 * Page style constants for export preview (A4 format).
 * 
 * Defines dimensions and styling for PDF-like preview pages.
 * Used in PreviewWorkspace to render document pages.
 * 
 * Dimensions: 210mm × 297mm (standard A4 size)
 */
export const PAGE_STYLE: React.CSSProperties = {
  width: '210mm',
  minHeight: '297mm',
  margin: '0',
  padding: '20mm',
  backgroundColor: '#ffffff',
  boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
};

/**
 * Get translation function based on language
 */
export function getTranslation(isGerman: boolean) {
  return {
    tableOfContents: isGerman ? 'Inhaltsverzeichnis' : 'Table of Contents',
    listOfFigures: isGerman ? 'Abbildungsverzeichnis' : 'List of Figures',
    listOfTables: isGerman ? 'Tabellenverzeichnis' : 'List of Tables',
    references: isGerman ? 'Literaturverzeichnis' : 'References',
    appendices: isGerman ? 'Anhänge' : 'Appendices',
    page: isGerman ? 'Seite' : 'Page',
    figure: isGerman ? 'Abbildung' : 'Figure',
    noReferencesYet: isGerman ? 'Noch keine Referenzen' : 'No references yet',
    noAppendicesYet: isGerman ? 'Noch keine Anhänge' : 'No appendices yet',
    businessPlan: isGerman ? 'Businessplan' : 'Business Plan',
    author: isGerman ? 'Autor' : 'Author',
    email: isGerman ? 'E-Mail' : 'Email',
    phone: isGerman ? 'Telefon' : 'Phone',
    website: isGerman ? 'Website' : 'Website',
    address: isGerman ? 'Adresse' : 'Address',
    date: isGerman ? 'Datum' : 'Date',
  };
}

/**
 * Calculate page number for a section in the document preview.
 * Page numbering starts after executive summary (or first section if no exec summary) until last page of actual content.
 */
export function calculatePageNumber(
  sectionIndex: number,
  includeTitlePage: boolean,
  offset: number = 0,
  _sectionKey?: string,
  sections?: any[]
): number {
  // If sections are provided and we're past the executive summary, 
  // calculate page number starting from 1 after the executive summary
  if (sections && sections.length > 0) {
    // Find the executive summary section position
    const execSummaryIndex = sections.findIndex(section => 
      section.key === 'executive_summary' || 
      section.key === 'executive-summary' ||  // Handle both underscore and hyphen variations
      (section.key && section.key.toLowerCase().includes('executive') && section.key.toLowerCase().includes('summary'))
    );
    
    // If we're at or before the executive summary, use normal numbering
    if (execSummaryIndex === -1 || sectionIndex <= execSummaryIndex) {
      let pageNumber = sectionIndex + 1 + offset;
      if (includeTitlePage) pageNumber += 1;
      return pageNumber;
    } else {
      // If we're after the executive summary, start numbering from 1 again
      const positionAfterExecSummary = sectionIndex - execSummaryIndex - 1;
      return positionAfterExecSummary + 1;
    }
  }
  
  // Standard page numbering: sectionIndex + 1, plus 1 more if title page is included
  let pageNumber = sectionIndex + 1 + offset;
  if (includeTitlePage) pageNumber += 1;
  
  return pageNumber;
}

/**
 * Determine if a section should display page numbers based on the requirement
 * that "page numbering starts after executive summary".
 */
export function shouldDisplayPageNumber(
  sectionIndex: number,
  sectionKey?: string,
  sections?: any[]
): boolean {
  // If no sections provided, default to showing page numbers
  if (!sections || sections.length === 0) {
    return true;
  }
  
  // Special sections that are typically front matter or ancillary and should not have page numbers
  // according to the user's requirement
  if (sectionKey === 'metadata' || sectionKey === 'ancillary' || 
      sectionKey === 'references' || sectionKey === 'appendices' ||
      sectionKey === 'table_of_contents' ||  // Explicitly handle table of contents
      sectionKey === 'list_of_tables' ||    // Handle list of tables
      sectionKey === 'list_of_figures' ||   // Handle list of figures
      (sectionKey && (sectionKey.includes('list') || sectionKey.includes('figure') || sectionKey.includes('table')))) {
    // According to user's feedback, these sections (TOC, lists, appendices, references) 
    // should not show page numbers
    return false;
  }
  
  // Check if this is the executive summary section
  const execSummaryIndex = sections.findIndex(section => 
    section.key === 'executive_summary' || 
    section.key === 'executive-summary' ||  // Handle both underscore and hyphen variations
    (section.key && section.key.toLowerCase().includes('executive') && section.key.toLowerCase().includes('summary'))
  );
  
  // For the executive summary itself, based on the user's issue description
  // where they mention seeing page numbers in the executive summary,
  // we want to exclude it
  if (sectionIndex >= 0 && execSummaryIndex >= 0 && sectionIndex === execSummaryIndex) {
    return false;  // Don't show page number for executive summary
  }
  
  // If no executive summary found, show page numbers for all sections
  if (execSummaryIndex === -1) {
    return true;
  }
  
  // Show page numbers for sections that come after the executive summary
  // (the "actual content" as mentioned in the requirement)
  return sectionIndex > execSummaryIndex;
}

/**
 * Format table label from key by converting camelCase or snake_case to Title Case.
 */
export function formatTableLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

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
  margin: '0 auto',
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
 */
export function calculatePageNumber(
  sectionIndex: number,
  includeTitlePage: boolean,
  offset: number = 0
): number {
  let pageNumber = sectionIndex + 1 + offset;
  if (includeTitlePage) pageNumber += 1;
  return pageNumber;
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

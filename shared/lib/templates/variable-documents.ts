// ========= PLAN2FUND — VARIABLE DOCUMENT HANDLING =========
// Support for documents with user-customizable structure

import { DocumentTemplate } from './types';

/**
 * Check if document allows variable structure
 */
export function isVariableDocument(doc: DocumentTemplate): boolean {
  return doc.isVariable === true;
}

/**
 * Get default structure for variable document
 */
export function getDefaultStructure(doc: DocumentTemplate): string {
  return doc.defaultStructure || doc.template;
}

/**
 * Create custom document structure from user selection
 * User picks from available sections/structures
 */
export interface DocumentStructureOption {
  id: string;
  name: string;
  description: string;
  template: string;
}

/**
 * Get available structure options for a variable document
 */
export function getStructureOptions(doc: DocumentTemplate): DocumentStructureOption[] {
  // For now, return single option (default structure)
  // Can be extended to load from database or config
  return [{
    id: 'default',
    name: 'Default Structure',
    description: doc.description,
    template: getDefaultStructure(doc)
  }];
}

/**
 * Create document from user-selected structure
 */
export function createDocumentFromStructure(
  doc: DocumentTemplate,
  selectedStructureId: string
): DocumentTemplate {
  const options = getStructureOptions(doc);
  const selected = options.find(o => o.id === selectedStructureId) || options[0];
  
  return {
    ...doc,
    template: selected.template,
    isVariable: true
  };
}


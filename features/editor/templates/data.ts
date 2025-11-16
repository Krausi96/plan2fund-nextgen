// ========= PLAN2FUND — TEMPLATE DATA =========
// Consolidated data exports from sections, documents, and templateKnowledge
// This file re-exports all template data for easier management

// Re-export all section data and helpers
export {
  MASTER_SECTIONS,
  getStandardSections,
  getSectionById,
  getSectionsByCategory,
  type StandardSection
} from './sections';

// Re-export all document data and helpers
export {
  MASTER_DOCUMENTS,
  getAdditionalDocuments,
  getAdditionalDocument,
  getRequiredDocuments,
  getDocumentsByFormat,
  type AdditionalDocument
} from './documents';

// Re-export all template knowledge data and helpers
export {
  TEMPLATE_KNOWLEDGE,
  getTemplateKnowledge,
  getAllFrameworks,
  getExpertQuestions,
  type TemplateKnowledge
} from './templateKnowledge';


import type { PlanDocument } from '../../types/types';

export function addCustomDocument(plan: PlanDocument, title: string) {
  const newDocument = {
    id: `custom_doc_${Date.now()}`,
    name: title,
    description: `Custom document: ${title}`,
    required: false,
    format: 'docx' as const,
    maxSize: '10MB',
    category: 'general' as const,
    sections: []
  };

  if (!plan.metadata) {
    plan.metadata = {};
  }

  if (!plan.metadata.customDocuments) {
    plan.metadata.customDocuments = [];
  }

  plan.metadata.customDocuments.push(newDocument);

  return newDocument;
}
import type { PlanDocument, SectionTemplate } from '../../types/types';

export function addCustomSection(plan: PlanDocument, documentId: string, title: string) {
  if (!plan.metadata?.customDocuments) {
    throw new Error('No custom documents available');
  }

  const doc = plan.metadata.customDocuments.find(d => d.id === documentId);
  if (!doc) {
    throw new Error(`Document with ID ${documentId} not found`);
  }

  const newSection: SectionTemplate = {
    id: `custom_section_${Date.now()}`,
    title: title,
    description: `Custom section: ${title}`,
    required: false,
    category: 'general',
    origin: 'custom',
    content: '',
    subsections: []
  };

  doc.sections.push(newSection);
  return newSection;
}
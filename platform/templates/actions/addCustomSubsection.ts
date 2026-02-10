import type { PlanDocument } from '@/platform/core/types';

export interface SubsectionTemplate {
  id: string;
  title: string;
  content?: string;
  covered: boolean;
  [key: string]: any;
}

export function addCustomSubsection(plan: PlanDocument, documentId: string, sectionId: string, title: string) {
  if (!plan.metadata?.customDocuments) {
    throw new Error('No custom documents available');
  }

  const doc = plan.metadata.customDocuments.find(d => d.id === documentId);
  if (!doc) {
    throw new Error(`Document with ID ${documentId} not found`);
  }

  const section: any = doc.sections.find((s: any) => s.id === sectionId);
  if (!section) {
    throw new Error(`Section with ID ${sectionId} not found in document ${documentId}`);
  }

  if (!section.subsections) {
    section.subsections = [];
  }

  const newSubsection: SubsectionTemplate = {
    id: `custom_sub_${Date.now()}`,
    title: title,
    covered: false
  };

  section.subsections.push(newSubsection);
  return newSubsection;
}
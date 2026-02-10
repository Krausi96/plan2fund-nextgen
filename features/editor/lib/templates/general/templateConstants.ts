// Template constants and collections
// Contains shared sections, master sections, and document templates

import type { SectionTemplate, DocumentTemplate } from '@/platform/core/types';
import { SPECIAL_SECTIONS } from '../../constants';

// Import section catalogs from subdirectories
import { BUSINESS_PLAN_SECTIONS } from '../catalog/products/business_plan';
import { STRATEGY_SECTIONS } from '../catalog/products/strategy';
import { UPGRADE_SECTIONS } from '../catalog/products/upgrade';



// Convert SPECIAL_SECTIONS to SectionTemplate format
const specialSectionEntries = Object.entries(SPECIAL_SECTIONS);

export const SHARED_SPECIAL_SECTIONS: SectionTemplate[] = specialSectionEntries.map(([, section]) => ({ // [, section] ignores the key
  id: section.id,
  title: section.title,
  description: `Special section: ${section.title}`,
  required: section.required,
  category: section.category,
  origin: 'template',
  icon: section.icon
})) as SectionTemplate[];

// Define master sections collection
export const MASTER_SECTIONS: Record<string, SectionTemplate[]> = {
  strategy: [...STRATEGY_SECTIONS, ...SHARED_SPECIAL_SECTIONS], // Strategy now uses strategy-specific sections + shared special sections
  submission: [...BUSINESS_PLAN_SECTIONS, ...SHARED_SPECIAL_SECTIONS],
  upgrade: [...BUSINESS_PLAN_SECTIONS, ...UPGRADE_SECTIONS, ...SHARED_SPECIAL_SECTIONS]
};

// Define document templates
export const MASTER_DOCUMENTS_BY_PRODUCT: Record<string, DocumentTemplate[]> = {
  strategy: [], // Strategy now uses sections, no documents
  submission: [],
  upgrade: [] // Upgrade uses sections, no documents
};
// Template constants and collections
// Contains shared sections, master sections, and document templates

import type { SectionTemplate, DocumentTemplate } from '../../types/types';
import {
  METADATA_SECTION_ID,
  ANCILLARY_SECTION_ID,
  REFERENCES_SECTION_ID,
  APPENDICES_SECTION_ID,
  TABLES_DATA_SECTION_ID,
  FIGURES_IMAGES_SECTION_ID
} from '../../constants';

// Import section catalogs from subdirectories
import { BUSINESS_PLAN_SECTIONS } from '../catalog/products/business_plan';
import { STRATEGY_SECTIONS } from '../catalog/products/strategy';
import { UPGRADE_SECTIONS } from '../catalog/products/upgrade';

// Define shared special sections
export const SHARED_SPECIAL_SECTIONS: SectionTemplate[] = [
  {
    id: METADATA_SECTION_ID,
    title: 'Title Page',
    description: 'Document title page with company information',
    required: true,
    category: 'general',
    origin: 'template',
    icon: '📕'
  },
  {
    id: ANCILLARY_SECTION_ID,
    title: 'Table of Contents',
    description: 'Automatically generated table of contents',
    required: true,
    category: 'general',
    origin: 'template',
    icon: '📑'
  },
  {
    id: REFERENCES_SECTION_ID,
    title: 'References',
    description: 'List of references and citations',
    required: false,
    category: 'general',
    origin: 'template',
    icon: '📚'
  },
  {
    id: TABLES_DATA_SECTION_ID,
    title: 'Tables/Data',
    description: 'Collection of tables, charts, and data visualizations',
    required: false,
    category: 'general',
    origin: 'template',
    icon: '📊'
  },
  {
    id: FIGURES_IMAGES_SECTION_ID,
    title: 'Figures/Images',
    description: 'Collection of figures, images, and illustrations',
    required: false,
    category: 'general',
    origin: 'template',
    icon: '🖼️'
  },
  {
    id: APPENDICES_SECTION_ID,
    title: 'Appendices',
    description: 'Additional supporting materials and documentation',
    required: false,
    category: 'general',
    origin: 'template',
    icon: '📎'
  }
];

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
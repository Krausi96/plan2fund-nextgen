// Shared special sections
import type { SectionTemplate } from '../types/types';
import {
  METADATA_SECTION_ID,
  ANCILLARY_SECTION_ID,
  REFERENCES_SECTION_ID,
  APPENDICES_SECTION_ID,
  TABLES_DATA_SECTION_ID,
  FIGURES_IMAGES_SECTION_ID
} from '../constants';

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
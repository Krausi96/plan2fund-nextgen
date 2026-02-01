// Split upgrade sections here
import type { SectionTemplate } from '../../../types/types';

export const UPGRADE_SECTIONS: SectionTemplate[] = [
  {
    id: 'upgrade_analysis',
    title: 'Upgrade Analysis',
    description: 'Analysis of existing plan structure and identification of gaps.',
    required: true,
    category: 'general',
    origin: 'template',
    prompts: [
      'Analyze the existing plan structure',
      'Identify missing sections',
      'Highlight weak areas',
      'Suggest improvements'
    ]
  },
  {
    id: 'upgrade_strategy',
    title: 'Upgrade Strategy',
    description: 'Strategy for upgrading the existing plan.',
    required: true,
    category: 'general',
    origin: 'template',
    prompts: [
      'Choose upgrade approach',
      'Define migration plan',
      'Set priorities for improvements'
    ]
  }
];
// Upgrade sections
import type { SectionTemplate } from '../../../types/types';

export const UPGRADE_SECTIONS: SectionTemplate[] = [
  {
    id: 'upgrade_analysis',
    title: 'Upgrade Analysis',
    description: 'Analysis of existing plan structure and identification of gaps.',
    required: true,
    category: 'general',
    origin: 'template',
    sectionIntro: `
This section analyzes the existing plan structure and identifies gaps and improvement opportunities.
`,
    rawSubsections: [
      {
        id: "existing_plan_structure_analysis",
        title: "Existing Plan Structure Analysis",
        rawText: `
Analyze the current plan structure in detail.
What sections are present?
How comprehensive are they?
What is the quality of the content?
`
      },
      {
        id: "gap_identification_improvements",
        title: "Gap Identification & Improvements",
        rawText: `
Identify missing sections or weak areas in the current plan.
What information is lacking?
What could be improved?
Prioritize the most critical gaps.
`
      }
    ],
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
    sectionIntro: `
This section defines the strategy for upgrading the existing plan.
`,
    rawSubsections: [
      {
        id: "upgrade_approach_selection",
        title: "Upgrade Approach Selection",
        rawText: `
Choose the most appropriate upgrade approach for your situation.
Should you add new sections?
Revise existing content?
Restructure the entire plan?
`
      },
      {
        id: "migration_plan_priorities",
        title: "Migration Plan & Priorities",
        rawText: `
Define a clear migration plan for implementing upgrades.
What should be prioritized first?
What is the timeline?
How will you measure success?
`
      }
    ],
    prompts: [
      'Choose upgrade approach',
      'Define migration plan',
      'Set priorities for improvements'
    ]
  }
];
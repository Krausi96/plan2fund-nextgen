// Upgrade sections
import type { SectionTemplate } from '../../../types/types';

export const UPGRADE_SECTIONS: SectionTemplate[] = [
  {
    id: 'executive_summary',
    title: 'Executive Summary',
    description: 'Provide a concise overview of the upgrade analysis and recommendations.',
    required: true,
    wordCountMin: 200,
    wordCountMax: 500,
    order: 1,
    category: 'general',
    origin: 'template',
    sectionIntro: `
Generate a professional executive summary that synthesizes key information from all completed sections of the upgrade plan only after all content is filled.
`,
  },
  {
    id: 'upgrade_analysis',
    title: 'Upgrade Analysis',
    description: 'Analysis of existing plan structure and identification of gaps.',
    required: true,
    wordCountMin: 300,
    wordCountMax: 600,
    order: 2,
    category: 'general',
    origin: 'template',
    sectionIntro: `
Summarize this section and its subsections professionally.
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
    ]
  },
  {
    id: 'upgrade_strategy',
    title: 'Upgrade Strategy',
    description: 'Strategy for upgrading the existing plan.',
    required: true,
    wordCountMin: 300,
    wordCountMax: 600,
    order: 3,
    category: 'general',
    origin: 'template',
    sectionIntro: `
Summarize this section and its subsections professionally.
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
    ]
  }
];
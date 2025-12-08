// ============================================================================
// SECTION TEMPLATES
// ============================================================================

import type { SectionTemplate } from '../types/templates';

// Strategy sections have been converted to documents - see documents.ts STRATEGY_DOCUMENTS

const FULL_SECTIONS: SectionTemplate[] = [
  {
    id: 'executive_summary',
    title: 'Executive Summary',
    description: 'Provide a concise overview of the project and funding request. Summarise the core problem, your innovative solution and the expected impact.',
    required: true,
    wordCountMin: 200,
    wordCountMax: 500,
    order: 1,
    category: 'general',
    prompts: [
      'Summarise your project in two to three sentences.',
      'Which problem or need does your project address?',
      'What makes your approach innovative compared to the state of the art?',
      'Briefly state the expected impact on your target group or market.'
    ],
    validationRules: {
      requiredFields: ['project_overview', 'innovation_aspect', 'expected_impact'],
      formatRequirements: ['clear_problem_statement', 'solution_description']
    },
    source: {
      verified: true,
      verifiedDate: '2025-01-20',
      officialProgram: 'WKO Businessplan Guide',
      sourceUrl: 'https://www.wko.at/gruendung/inhalte-businessplan',
      version: '2.0'
    }
  },
  {
    id: 'project_description',
    title: 'Project Description',
    description: 'Detail the objectives, scope and methodology of the project. Explain what you plan to do and why it is necessary.',
    required: true,
    wordCountMin: 400,
    wordCountMax: 900,
    order: 2,
    category: 'project',
    prompts: [
      'Describe the main objectives and deliverables of your project.',
      'Explain the current state of the art and how your project goes beyond it.',
      'Outline the methodology and approach you will use to achieve the objectives.',
      'What are the expected outcomes and how will they be measured?'
    ],
    validationRules: {
      requiredFields: ['objectives', 'state_of_the_art', 'methodology', 'expected_outcomes'],
      formatRequirements: ['structured_subsections', 'evidence_of_need']
    },
    source: {
      verified: true,
      verifiedDate: '2025-01-20',
      officialProgram: 'FFG Basisprogramm – Projektbeschreibung',
      sourceUrl: 'https://www.ffg.at/',
      version: '2.0'
    }
  },
  {
    id: 'innovation_technology',
    title: 'Innovation & Technology',
    description: 'Explain the innovative aspects and technological foundations of the project. Position your project within the spectrum from idea to application.',
    required: true,
    wordCountMin: 300,
    wordCountMax: 800,
    order: 3,
    category: 'technical',
    prompts: [
      'Describe what is novel about your solution compared with existing approaches.',
      'Provide evidence of prior art and explain how you will protect your innovation (e.g., patents, know‑how).',
      'Discuss the Technology Readiness Level (TRL) at the start and end of the project.',
      'Outline any technical risks and how you plan to mitigate them.'
    ],
    validationRules: {
      requiredFields: ['novelty', 'state_of_the_art_comparison', 'protection_strategy', 'technical_risks'],
      formatRequirements: ['evidence_based_claims', 'risk_mitigation_plan']
    },
    source: {
      verified: true,
      verifiedDate: '2025-01-20',
      officialProgram: 'Horizon Europe RIA/IA Application Form',
      version: '2.0'
    }
  },
  {
    id: 'impact_assessment',
    title: 'Impact Assessment',
    description: 'Describe the expected economic, social and environmental impacts of the project. Explain who will benefit and how you will measure success.',
    required: true,
    wordCountMin: 300,
    wordCountMax: 800,
    order: 4,
    category: 'impact',
    prompts: [
      'Who are the target beneficiaries of your project and what outcomes do you expect for them?',
      'What economic or market impact will your project have?',
      'Identify any social or environmental benefits and describe how they align with policy priorities.',
      'Which indicators or metrics will you use to assess impact during and after the project?'
    ],
    validationRules: {
      requiredFields: ['target_beneficiaries', 'economic_impact', 'social_environmental_impact', 'impact_metrics'],
      formatRequirements: ['quantifiable_metrics', 'alignment_with_policy']
    },
    source: {
      verified: true,
      verifiedDate: '2025-01-20',
      officialProgram: 'Horizon Europe Impact Section',
      version: '2.0'
    }
  },
  {
    id: 'financial_plan',
    title: 'Financial Plan',
    description: 'Provide a detailed budget and financing plan. Outline costs, funding requested, co‑financing and expected revenue or savings.',
    required: true,
    wordCountMin: 300,
    wordCountMax: 800,
    order: 5,
    category: 'financial',
    prompts: [
      'Break down your project costs by category (personnel, equipment, travel, subcontracting, etc.).',
      'Specify the amount of funding requested and any co‑financing or matching funds.',
      'Describe your cost assumptions and provide justification for major expenditures.',
      'If applicable, outline expected revenues or cost savings resulting from the project.'
    ],
    validationRules: {
      requiredFields: ['budget_breakdown', 'funding_request', 'co_financing', 'cost_justification'],
      formatRequirements: ['tabular_budget', 'realistic_assumptions']
    },
    source: {
      verified: true,
      verifiedDate: '2025-01-20',
      officialProgram: 'FFG Basisprogramm – Projektbeschreibung',
      version: '2.0'
    }
  },
  {
    id: 'market_analysis',
    title: 'Market Analysis',
    description: 'Analyse the market context for your project. Provide data on market size, trends, competition and customer segments.',
    required: true,
    wordCountMin: 300,
    wordCountMax: 700,
    order: 6,
    category: 'market',
    prompts: [
      'Define the market you intend to target and estimate its size and growth.',
      'Identify key trends and drivers that influence this market.',
      'Describe the competitive landscape and how you differentiate yourself.',
      'Define your target customer segments and explain their needs.'
    ],
    validationRules: {
      requiredFields: ['market_size', 'market_trends', 'competition', 'target_customers'],
      formatRequirements: ['data_citation', 'competitive_positioning']
    },
    source: {
      verified: true,
      verifiedDate: '2025-01-20',
      officialProgram: 'WKO Businessplan Guide',
      version: '2.0'
    }
  },
  {
    id: 'team_qualifications',
    title: 'Team & Qualifications',
    description: 'Present the project team, their roles and qualifications. Highlight relevant experience and capacity to deliver the project.',
    required: true,
    wordCountMin: 200,
    wordCountMax: 600,
    order: 7,
    category: 'team',
    prompts: [
      'List key team members and describe their roles within the project.',
      'Summarise each member\'s qualifications, experience and expertise relevant to the project.',
      'Mention any external advisors or partners providing critical know-how.',
      'Explain how the team structure supports successful implementation.'
    ],
    validationRules: {
      requiredFields: ['team_members', 'roles', 'qualifications'],
      formatRequirements: ['professional_bios', 'role_alignment']
    },
    source: {
      verified: true,
      verifiedDate: '2025-01-20',
      officialProgram: 'WKO Businessplan Guide',
      version: '2.0'
    }
  },
  {
    id: 'risk_assessment',
    title: 'Risk Assessment',
    description: 'Identify potential risks (technical, financial, market or operational) and describe mitigation strategies.',
    required: true,
    wordCountMin: 200,
    wordCountMax: 600,
    order: 8,
    category: 'risk',
    prompts: [
      'List the main technical and operational risks that could affect the project.',
      'Assess financial risks, such as cost overruns or funding gaps.',
      'Analyse market risks, including changes in demand or competitive actions.',
      'Describe mitigation measures and contingency plans for each risk category.'
    ],
    validationRules: {
      requiredFields: ['technical_risks', 'financial_risks', 'market_risks', 'mitigation_plans'],
      formatRequirements: ['risk_matrix', 'contingency_plans']
    },
    source: {
      verified: true,
      verifiedDate: '2025-01-20',
      officialProgram: 'FFG Basisprogramm – Projektbeschreibung',
      version: '2.0'
    }
  },
  {
    id: 'timeline_milestones',
    title: 'Timeline & Milestones',
    description: 'Provide a schedule of your project with key milestones and deliverables. Include start and end dates for major tasks.',
    required: true,
    wordCountMin: 200,
    wordCountMax: 500,
    order: 9,
    category: 'project',
    prompts: [
      'Outline the overall project timeline with major phases.',
      'List critical milestones and their expected completion dates.',
      'Describe deliverables associated with each milestone.',
      'Explain how progress will be monitored and reported.'
    ],
    validationRules: {
      requiredFields: ['project_schedule', 'milestones', 'deliverables'],
      formatRequirements: ['gantt_chart_or_table', 'realistic_timelines']
    },
    source: {
      verified: true,
      verifiedDate: '2025-01-20',
      officialProgram: 'Horizon Europe Implementation Section',
      version: '2.0'
    }
  }
];

export const MASTER_SECTIONS: Record<string, SectionTemplate[]> = {
  strategy: [], // Strategy sections are now documents
  review: FULL_SECTIONS,
  submission: FULL_SECTIONS
};




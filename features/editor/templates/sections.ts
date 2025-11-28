// ============================================================================
// SECTION TEMPLATES
// ============================================================================

import type { SectionTemplate } from './types';

const STRATEGY_SECTIONS: SectionTemplate[] = [
  {
    id: 'executive_summary',
    title: 'Executive Summary',
    description: 'Provide a concise overview of your project idea and funding goals. Summarise the core problem, your solution concept and potential impact.',
    required: true,
    wordCountMin: 200,
    wordCountMax: 300,
    order: 1,
    category: 'general',
    prompts: [
      'What is your business mission?',
      'What problem are you solving?',
      'Who are your target customers?',
      'How much funding do you seek?'
    ],
    questions: [
      {
        text: 'Wie heißt Ihr Unternehmen?',
        required: true,
        placeholder: 'Geben Sie den vollständigen Firmennamen ein',
        hint: 'Verwenden Sie den offiziellen, registrierten Firmennamen'
      },
      {
        text: 'Wie hoch ist der benötigte Förderbetrag?',
        required: true,
        placeholder: 'z.B. €50.000 oder €100.000 - €200.000',
        hint: 'Geben Sie einen konkreten Betrag oder einen Bereich an'
      },
      {
        text: 'Wofür werden die Mittel verwendet?',
        required: true,
        placeholder: 'Beschreiben Sie die geplanten Ausgaben',
        hint: 'Beispiele: Personal, Entwicklung, Marketing, Ausrüstung'
      },
      {
        text: 'Was macht Ihr Projekt einzigartig?',
        required: false,
        placeholder: 'Beschreiben Sie Ihre Alleinstellungsmerkmale',
        hint: 'Was unterscheidet Sie von Wettbewerbern?'
      }
    ],
    validationRules: {
      requiredFields: ['business_overview', 'funding_goal'],
      formatRequirements: ['clear_problem_statement', 'solution_description']
    },
    source: {
      verified: true,
      verifiedDate: '2025-01-20',
      officialProgram: 'Strategic Planning Best Practices',
      version: '2.0'
    }
  },
  {
    id: 'market_opportunity',
    title: 'Market Opportunity',
    description: 'Describe the market size, trends, and unmet needs. Identify your target customer segments.',
    required: true,
    wordCountMin: 150,
    wordCountMax: 300,
    order: 2,
    category: 'market',
    prompts: [
      'Who is the target market?',
      'How large is the market?',
      'What trends support your opportunity?',
      'What unmet needs exist?'
    ],
    validationRules: {
      requiredFields: ['market_size', 'target_customers', 'market_trends'],
      formatRequirements: ['data_citation', 'market_analysis']
    },
    source: {
      verified: true,
      verifiedDate: '2025-01-20',
      officialProgram: 'Strategic Planning Best Practices',
      version: '2.0'
    }
  },
  {
    id: 'project_description',
    title: 'Project Description / Business Concept',
    description: 'Describe your core business tasks, business model, and conduct a SWOT analysis. Explain what your business does and how it operates.',
    required: true,
    wordCountMin: 200,
    wordCountMax: 400,
    order: 3,
    category: 'project',
    prompts: [
      'What are your core business tasks?',
      'What is your business model?',
      'What are your strengths and weaknesses?',
      'What opportunities and threats do you face?'
    ],
    validationRules: {
      requiredFields: ['core_tasks', 'business_model', 'swot_analysis'],
      formatRequirements: ['structured_narrative']
    },
    source: {
      verified: true,
      verifiedDate: '2025-01-20',
      officialProgram: 'Strategic Planning Best Practices',
      version: '2.0'
    }
  },
  {
    id: 'business_model_value_proposition',
    title: 'Business Model & Value Proposition',
    description: 'Outline how your business will generate revenue, pricing strategy, and value delivered to customers.',
    required: true,
    wordCountMin: 150,
    wordCountMax: 350,
    order: 4,
    category: 'business',
    prompts: [
      'How will you make money?',
      'What are your main revenue streams?',
      'What value do you offer that competitors do not?',
      'What is your cost structure?'
    ],
    validationRules: {
      requiredFields: ['revenue_streams', 'value_proposition', 'cost_structure'],
      formatRequirements: ['clear_business_model', 'pricing_strategy']
    },
    source: {
      verified: true,
      verifiedDate: '2025-01-20',
      officialProgram: 'Strategic Planning Best Practices',
      version: '2.0'
    }
  },
  {
    id: 'competitive_landscape',
    title: 'Competitive Landscape',
    description: 'Identify key competitors and differentiate your offering.',
    required: true,
    wordCountMin: 150,
    wordCountMax: 300,
    order: 5,
    category: 'market',
    prompts: [
      'Who are your main competitors?',
      'What are their strengths?',
      'How is your solution different or better?'
    ],
    validationRules: {
      requiredFields: ['competitor_analysis', 'competitive_advantage'],
      formatRequirements: ['differentiation_clear', 'competitive_positioning']
    },
    source: {
      verified: true,
      verifiedDate: '2025-01-20',
      officialProgram: 'Strategic Planning Best Practices',
      version: '2.0'
    }
  },
  {
    id: 'preliminary_financial_overview',
    title: 'Preliminary Financial Overview',
    description: 'Provide high-level financial assumptions including costs, revenue potential, and funding needed.',
    required: true,
    wordCountMin: 150,
    wordCountMax: 300,
    order: 6,
    category: 'financial',
    prompts: [
      'What are your expected revenue streams?',
      'What are your major cost drivers?',
      'How much funding is needed to reach the next milestone?'
    ],
    validationRules: {
      requiredFields: ['revenue_assumptions', 'cost_assumptions', 'funding_need'],
      formatRequirements: ['realistic_numbers', 'financial_justification']
    },
    source: {
      verified: true,
      verifiedDate: '2025-01-20',
      officialProgram: 'Strategic Planning Best Practices',
      version: '2.0'
    }
  }
];

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
  strategy: STRATEGY_SECTIONS,
  review: FULL_SECTIONS,
  submission: FULL_SECTIONS
};




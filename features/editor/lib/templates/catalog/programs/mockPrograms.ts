/**
 * Mock funding program repository
 * Repository of realistic funding programs that can be used in place of API calls
 */

export const MOCK_FUNDING_PROGRAMS: any[] = [
  {
    id: 'aws_seedfinancing',
    name: 'AWS Seedfinancing',
    description: 'Seed financing program for early-stage startups in Austria. Supports innovative companies with high growth potential.',
    url: 'https://www.aws.at/funding/seedfinancing',
    type: 'grant',
    funding_types: ['grant', 'loan'],
    funding_amount_min: 25000,
    funding_amount_max: 250000,
    currency: 'EUR',
    region: 'Austria',
    company_type: 'startup',
    company_stage: 'MVP',
    program_focus: ['innovation', 'digitalization'],
    organization: 'AWS Austria',
    focus_areas: ['innovation', 'digitalization'],
    use_of_funds: ['product_development', 'market_entry', 'personnel'],
    co_financing_required: true,
    deliverables: ['business_plan', 'financial_statements'],
    requirements: ['executive_summary', 'market_analysis', 'financial_plan', 'team_qualifications'],
    evidence_required: ['financial_documents', 'proof_of_innovation'],
    application_requirements: {
      documents: [
        { document_name: 'Application Form', required: true, format: 'pdf', authority: 'provider', reuseable: false },
        { document_name: 'Business Plan', required: true, format: 'pdf', authority: 'applicant', reuseable: false },
        { document_name: 'Financial Statements', required: true, format: 'pdf', authority: 'authority', reuseable: true },
        { document_name: 'Proof of Innovation', required: false, format: 'pdf', authority: 'applicant', reuseable: true }
      ],
      sections: [
        { title: 'Project Description', required: true, subsections: [
          { title: 'Objectives', required: true },
          { title: 'Innovation Aspects', required: true },
          { title: 'Market Potential', required: true }
        ]},
        { title: 'Market Analysis', required: true, subsections: [
          { title: 'Target Market', required: true },
          { title: 'Competition', required: true },
          { title: 'Go-to-Market Strategy', required: true }
        ]},
        { title: 'Financial Plan', required: true, subsections: [
          { title: 'Revenue Model', required: true },
          { title: 'Cost Structure', required: true },
          { title: 'Financial Projections', required: true }
        ]},
        { title: 'Team Qualifications', required: true, subsections: [
          { title: 'Management Team', required: true },
          { title: 'Advisors', required: true },
          { title: 'Key Personnel', required: true }
        ]}
      ],
      financial_requirements: {
        financial_statements_required: ['balance_sheet', 'income_statement', 'cash_flow_statement']
      }
    }
  },
  {
    id: 'ffg_basisprogramm',
    name: 'FFG Basisprogramm',
    description: 'Basic funding program for research and development projects in Austria. Supports technology-oriented SMEs.',
    url: 'https://www.ffg.at/basisprogramm',
    type: 'grant',
    funding_types: ['grant'],
    funding_amount_min: 50000,
    funding_amount_max: 500000,
    currency: 'EUR',
    region: 'Austria',
    company_type: 'SME',
    company_stage: 'revenue',
    program_focus: ['research', 'development', 'technology'],
    organization: 'FFG Austria',
    focus_areas: ['research', 'development', 'technology'],
    use_of_funds: ['rd_projects'],
    co_financing_required: false,
    deliverables: ['project_proposal', 'cost_calculation'],
    requirements: ['project_objectives', 'work_plan', 'results_exploitation'],
    evidence_required: ['technical_documentation', 'partnership_agreements'],
    application_requirements: {
      documents: [
        { document_name: 'Project Proposal', required: true, format: 'pdf', authority: 'applicant', reuseable: false },
        { document_name: 'Cost Calculation', required: true, format: 'xlsx', authority: 'applicant', reuseable: false },
        { document_name: 'Partnership Agreements', required: false, format: 'pdf', authority: 'applicant', reuseable: true }
      ],
      sections: [
        { title: 'Project Objectives', required: true, subsections: [
          { title: 'Research Questions', required: true },
          { title: 'Technical Approach', required: true },
          { title: 'Innovation Potential', required: true }
        ]},
        { title: 'Work Plan', required: true, subsections: [
          { title: 'Project Phases', required: true },
          { title: 'Timeline', required: true },
          { title: 'Milestones', required: true }
        ]},
        { title: 'Results Exploitation', required: true, subsections: [
          { title: 'Commercialization Plan', required: true },
          { title: 'IP Strategy', required: true }
        ]}
      ],
      financial_requirements: {
        financial_statements_required: ['balance_sheet', 'income_statement']
      }
    }
  },
  {
    id: 'eic_accelerator',
    name: 'EIC Accelerator',
    description: 'EU funding program for innovative small and medium enterprises with high growth potential. Provides grants and equity-free funding.',
    url: 'https://ec.europa.eu/info/funding-tenders/find-funding-eu-funding/eic/eic-accelerator_en',
    type: 'grant',
    funding_types: ['grant', 'equity'],
    funding_amount_min: 0.5,
    funding_amount_max: 17.5,
    currency: 'Mio EUR',
    region: 'Europe',
    company_type: 'startup',
    company_stage: 'growth',
    program_focus: ['innovation', 'scale-up', 'technology'],
    organization: 'European Commission',
    focus_areas: ['innovation', 'scale-up', 'technology'],
    use_of_funds: ['product_development', 'scaling_operations'],
    co_financing_required: false,
    deliverables: ['pitch_deck', 'business_plan', 'technical_documentation'],
    requirements: ['innovation', 'business_model', 'team_execution'],
    evidence_required: ['patent_applications', 'technical_validation'],
    application_requirements: {
      documents: [
        { document_name: 'Pitch Deck', required: true, format: 'pdf', authority: 'applicant', reuseable: false },
        { document_name: 'Business Plan', required: true, format: 'pdf', authority: 'applicant', reuseable: false },
        { document_name: 'Technical Documentation', required: true, format: 'pdf', authority: 'applicant', reuseable: false },
        { document_name: 'Patent Applications', required: false, format: 'pdf', authority: 'applicant', reuseable: true }
      ],
      sections: [
        { title: 'Innovation', required: true, subsections: [
          { title: 'Technology Readiness Level', required: true },
          { title: 'Competitive Advantage', required: true },
          { title: 'Market Opportunity', required: true }
        ]},
        { title: 'Business Model', required: true, subsections: [
          { title: 'Revenue Model', required: true },
          { title: 'Market Entry Strategy', required: true },
          { title: 'Scalability', required: true }
        ]},
        { title: 'Team & Execution', required: true, subsections: [
          { title: 'Team Composition', required: true },
          { title: 'Track Record', required: true },
          { title: 'Partnerships', required: true }
        ]}
      ],
      financial_requirements: {
        financial_statements_required: ['balance_sheet', 'income_statement', 'cash_flow_statement', 'bank_statements']
      }
    }
  }
];
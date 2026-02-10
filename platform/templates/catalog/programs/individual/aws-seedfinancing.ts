/**
 * AWS Seedfinancing program
 * Austrian seed financing program for early-stage startups
 */

export const awsSeedfinancing = {
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
  evidence_required: ['financial_documents', 'proof_of_innovation'],
  
  // New fields
  repayable: true,
  repayable_percentage: null,
  co_financing_percentage: null,
  timeline: {
    application_deadline: null,
    decision_time: null,
    funding_start: null,
  },
  effort_level: 'medium',
  
  // Remove requirements field to keep single source of truth
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
};
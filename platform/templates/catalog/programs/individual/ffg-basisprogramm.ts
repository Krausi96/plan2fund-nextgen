/**
 * FFG Basisprogramm
 * Austrian research and development funding program
 */

export const ffgBasisprogramm = {
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
  evidence_required: ['technical_documentation', 'partnership_agreements'],
  
  // New fields
  repayable: false,
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
};
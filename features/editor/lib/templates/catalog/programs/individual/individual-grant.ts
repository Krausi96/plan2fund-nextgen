
export const individualTemplate = {
  id: 'individual-grant',
  name: 'Individual Research Grant',
  description: 'Research grant for individual applicants',
  url: 'https://example.com/individual-grant',
  type: 'grant',
  funding_types: ['grant'],
  funding_amount_min: 10000,
  funding_amount_max: 50000,
  currency: 'EUR',
  region: 'Global',
  company_type: 'individual',
  company_stage: 'idea',
  program_focus: ['research', 'innovation'],
  organization: 'Research Foundation',
  focus_areas: ['research', 'innovation'],
  use_of_funds: ['research_activities', 'equipment', 'travel'],
  co_financing_required: false,
  deliverables: ['research_report', 'presentation'],
  requirements: ['cv', 'research_proposal', 'budget_plan'],
  evidence_required: ['academic_credentials', 'previous_work'],
  application_requirements: {
    documents: [
      { document_name: 'Research Proposal', required: true, format: 'pdf', authority: 'applicant', reuseable: false },
    ],
    sections: [
      { title: 'Research Proposal', required: true, subsections: [
        { title: 'Objectives', required: true },
        { title: 'Methodology', required: true },
        { title: 'Expected Results', required: true }
      ]},
      { title: 'Budget Plan', required: true, subsections: [
        { title: 'Cost Breakdown', required: true },
        { title: 'Justification', required: true },
        { title: 'Timeline', required: true }
      ]}
    ],
    financial_requirements: {
      financial_statements_required: ['bank_statement', 'income_verification']
    }
  }
};
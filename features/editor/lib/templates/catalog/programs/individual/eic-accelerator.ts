/**
 * EIC Accelerator
 * EU funding program for innovative SMEs with high growth potential
 */

export const eicAccelerator = {
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
};
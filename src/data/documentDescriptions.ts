// ========= PLAN2FUND — DOCUMENT DESCRIPTIONS =========
// Comprehensive document definitions for pricing page

export interface DocumentDescription {
  id: string;
  title: string;
  short: string;
  details: string;
  formatHints?: string[];
  i18nKey: string;
  category: 'strategy' | 'review' | 'submission' | 'additional';
  fundingTypes: ('grants' | 'bankLoans' | 'equity' | 'visa')[];
}

export const documentDescriptions: Record<string, DocumentDescription> = {
  // Strategy Documents
  strategyBrief: {
    id: 'strategyBrief',
    title: 'Strategy Brief',
    short: 'Lean strategy brief (5–7 pages)',
    details: 'Comprehensive strategy document covering business model, market analysis, and funding direction. Includes executive summary, problem/solution fit, target market, and initial financial projections.',
    formatHints: ['PDF/DOCX', '5-7 pages', 'German/English'],
    i18nKey: 'documents.strategyBrief',
    category: 'strategy',
    fundingTypes: ['grants', 'bankLoans', 'equity', 'visa']
  },
  businessModelCanvas: {
    id: 'businessModelCanvas',
    title: 'Business Model Canvas',
    short: 'Visual business model framework',
    details: 'One-page visual representation of your business model including value propositions, customer segments, channels, revenue streams, and key partnerships.',
    formatHints: ['PDF', '1 page', 'Visual format'],
    i18nKey: 'documents.businessModelCanvas',
    category: 'strategy',
    fundingTypes: ['grants', 'equity']
  },
  fundingMatchSummary: {
    id: 'fundingMatchSummary',
    title: 'Funding Match Summary',
    short: 'Personalized funding recommendations',
    details: 'Curated list of funding programs, banks, or investors that match your business profile, with fit rationale and next steps for each option.',
    formatHints: ['PDF', '2-3 pages', 'Personalized'],
    i18nKey: 'documents.fundingMatchSummary',
    category: 'strategy',
    fundingTypes: ['grants', 'bankLoans', 'equity', 'visa']
  },
  loanBrief: {
    id: 'loanBrief',
    title: 'Loan-Oriented Brief',
    short: 'Bank-focused strategy document',
    details: 'Specialized strategy document tailored for bank loan applications, emphasizing financial stability, repayment capacity, and collateral considerations.',
    formatHints: ['PDF/DOCX', '5-7 pages', 'Bank-focused'],
    i18nKey: 'documents.loanBrief',
    category: 'strategy',
    fundingTypes: ['bankLoans']
  },
  investorBrief: {
    id: 'investorBrief',
    title: 'Investor Positioning Brief',
    short: 'VC-focused strategy document',
    details: 'Strategy document designed for equity investors, highlighting growth potential, market opportunity, competitive advantages, and scalability.',
    formatHints: ['PDF/DOCX', '5-7 pages', 'Investor-focused'],
    i18nKey: 'documents.investorBrief',
    category: 'strategy',
    fundingTypes: ['equity']
  },
  investorTeaserOnePager: {
    id: 'investorTeaserOnePager',
    title: 'Investor Teaser One-Pager',
    short: 'One-page investor summary',
    details: 'Compelling one-page summary covering problem, solution, market opportunity, business model, traction, team, and funding ask. Perfect for initial investor outreach.',
    formatHints: ['PDF', '1 page', 'High-impact design'],
    i18nKey: 'documents.investorTeaserOnePager',
    category: 'strategy',
    fundingTypes: ['equity']
  },
  visaBrief: {
    id: 'visaBrief',
    title: 'Visa Viability Brief',
    short: 'Immigration-focused strategy document',
    details: 'Strategy document tailored for Austrian Red-White-Red visa applications, emphasizing innovation, economic benefit, job creation, and founder qualifications.',
    formatHints: ['PDF/DOCX', '5-7 pages', 'Visa-focused'],
    i18nKey: 'documents.visaBrief',
    category: 'strategy',
    fundingTypes: ['visa']
  },

  // Review Documents
  annotatedDraft: {
    id: 'annotatedDraft',
    title: 'Annotated Draft',
    short: 'Line-by-line feedback on your draft',
    details: 'Your existing business plan with detailed annotations, suggestions, and improvements marked throughout. Includes specific recommendations for each section.',
    formatHints: ['PDF/DOCX', 'Tracked changes', 'Detailed comments'],
    i18nKey: 'documents.annotatedDraft',
    category: 'review',
    fundingTypes: ['grants', 'bankLoans', 'equity', 'visa']
  },
  revisedPlan: {
    id: 'revisedPlan',
    title: 'Revised Business Plan',
    short: 'Improved and restructured plan',
    details: 'Completely revised business plan incorporating all feedback and improvements. Restructured for better flow and compliance with funding requirements.',
    formatHints: ['PDF/DOCX', 'Clean version', 'Professional formatting'],
    i18nKey: 'documents.revisedPlan',
    category: 'review',
    fundingTypes: ['grants', 'bankLoans', 'equity', 'visa']
  },
  complianceChecklist: {
    id: 'complianceChecklist',
    title: 'Compliance Checklist',
    short: 'Requirements verification checklist',
    details: 'Detailed checklist ensuring your plan meets all specific requirements for your chosen funding type, with specific section and format checks.',
    formatHints: ['PDF', 'Interactive checklist', 'Actionable items'],
    i18nKey: 'documents.complianceChecklist',
    category: 'review',
    fundingTypes: ['grants', 'bankLoans', 'equity', 'visa']
  },
  ratiosCheck: {
    id: 'ratiosCheck',
    title: 'Financial Ratios Check',
    short: 'Bank-specific financial analysis',
    details: 'Analysis of key financial ratios including DSCR, debt-to-equity, current ratio, and other metrics required by Austrian banks for loan assessment.',
    formatHints: ['PDF/Excel', 'Financial analysis', 'Bank standards'],
    i18nKey: 'documents.ratiosCheck',
    category: 'review',
    fundingTypes: ['bankLoans']
  },
  capTableCheck: {
    id: 'capTableCheck',
    title: 'Cap Table Review',
    short: 'Ownership structure analysis',
    details: 'Review and analysis of your current and proposed ownership structure, including option pools, vesting schedules, and investor rights.',
    formatHints: ['PDF/Excel', 'Ownership table', 'Investor-ready'],
    i18nKey: 'documents.capTableCheck',
    category: 'review',
    fundingTypes: ['equity']
  },

  // Submission Documents
  businessPlan: {
    id: 'businessPlan',
    title: 'Full Business Plan',
    short: 'Comprehensive 20–30 page business plan',
    details: 'Complete Austrian-style business plan including executive summary, product/service description, company & management, market & competition, marketing/sales strategy, success metrics, and detailed financial plan with appendices.',
    formatHints: ['PDF/DOCX', '20-30 pages', 'Professional layout'],
    i18nKey: 'documents.businessPlan',
    category: 'submission',
    fundingTypes: ['grants', 'bankLoans', 'equity', 'visa']
  },
  workPlanGantt: {
    id: 'workPlanGantt',
    title: 'Work Plan & Gantt Chart',
    short: 'Project timeline and deliverables',
    details: 'Detailed work packages, milestones, and deliverables with Gantt timeline visualization. Required for most Austrian and EU grant applications.',
    formatHints: ['PDF/Excel', 'Visual timeline', 'Grant-ready'],
    i18nKey: 'documents.workPlanGantt',
    category: 'submission',
    fundingTypes: ['grants']
  },
  budgetSheet: {
    id: 'budgetSheet',
    title: 'Budget Sheet',
    short: 'Itemized project costs and justifications',
    details: 'Detailed budget breakdown per EU/AT cost guidelines including personnel, equipment, travel, and overhead costs with proper justifications and cost categories.',
    formatHints: ['Excel/PDF', 'EU cost categories', 'Detailed breakdown'],
    i18nKey: 'documents.budgetSheet',
    category: 'submission',
    fundingTypes: ['grants']
  },
  financialModel3to5y: {
    id: 'financialModel3to5y',
    title: '3-5 Year Financial Model',
    short: 'Comprehensive financial projections',
    details: 'Detailed 3-5 year financial model including P&L, Balance Sheet, Cash Flow statements, and key performance indicators (DSCR, equity ratio) in Austrian accounting standards.',
    formatHints: ['Excel', 'Interactive model', 'Bank-ready'],
    i18nKey: 'documents.financialModel3to5y',
    category: 'submission',
    fundingTypes: ['bankLoans', 'equity']
  },
  bankSummaryOnePager: {
    id: 'bankSummaryOnePager',
    title: 'Bank Summary One-Pager',
    short: 'Loan application summary',
    details: 'One-page summary for bank loan applications including loan purpose, key financial ratios, repayment schedule, collateral overview, and management summary.',
    formatHints: ['PDF', '1 page', 'Bank-focused'],
    i18nKey: 'documents.bankSummaryOnePager',
    category: 'submission',
    fundingTypes: ['bankLoans']
  },
  amortizationSchedule: {
    id: 'amortizationSchedule',
    title: 'Amortization Schedule',
    short: 'Loan repayment timeline',
    details: 'Detailed loan repayment schedule showing principal, interest, and total payments over the loan term with various scenarios and early payment options.',
    formatHints: ['Excel/PDF', 'Payment schedule', 'Multiple scenarios'],
    i18nKey: 'documents.amortizationSchedule',
    category: 'submission',
    fundingTypes: ['bankLoans']
  },
  collateralSheet: {
    id: 'collateralSheet',
    title: 'Collateral Sheet',
    short: 'Asset collateral documentation',
    details: 'Comprehensive list of assets offered as collateral with valuations, ownership documentation, and legal status. Required for secured loans.',
    formatHints: ['PDF', 'Asset inventory', 'Legal documentation'],
    i18nKey: 'documents.collateralSheet',
    category: 'submission',
    fundingTypes: ['bankLoans']
  },
  pitchDeck: {
    id: 'pitchDeck',
    title: 'Pitch Deck',
    short: '10-15 slide investor presentation',
    details: 'Professional pitch deck aligned to investor expectations covering problem, solution, market opportunity, business model, traction, team, financials, and funding ask.',
    formatHints: ['PowerPoint/PDF', '10-15 slides', 'Investor-ready design'],
    i18nKey: 'documents.pitchDeck',
    category: 'submission',
    fundingTypes: ['equity']
  },
  capTable: {
    id: 'capTable',
    title: 'Cap Table',
    short: 'Current and post-money ownership structure',
    details: 'Detailed capitalization table showing current ownership, proposed investment, post-money ownership, option pools, and investor rights.',
    formatHints: ['Excel/PDF', 'Ownership structure', 'Investor-ready'],
    i18nKey: 'documents.capTable',
    category: 'submission',
    fundingTypes: ['equity']
  },
  visaBusinessPlan: {
    id: 'visaBusinessPlan',
    title: 'Visa Business Plan',
    short: 'RWR visa-specific business plan',
    details: 'Specialized business plan for Austrian Red-White-Red visa applications emphasizing innovation, Austrian headquarters, investment capital, job creation, and founder qualifications.',
    formatHints: ['PDF/DOCX', 'Visa-specific format', 'German/English'],
    i18nKey: 'documents.visaBusinessPlan',
    category: 'submission',
    fundingTypes: ['visa']
  },
  founderCV: {
    id: 'founderCV',
    title: 'Founder CV',
    short: 'Professional founder curriculum vitae',
    details: 'Comprehensive CV highlighting relevant qualifications, entrepreneurship experience, previous roles, education, and achievements. Formatted for funding applications.',
    formatHints: ['PDF/DOCX', 'Professional format', 'Funding-focused'],
    i18nKey: 'documents.founderCV',
    category: 'submission',
    fundingTypes: ['grants', 'visa']
  },
  visaEvidenceChecklist: {
    id: 'visaEvidenceChecklist',
    title: 'Visa Evidence Checklist',
    short: 'Required documentation checklist',
    details: 'Comprehensive checklist of all required documents for RWR visa application including passport, birth certificate, accommodation proof, insurance, funds proof, investment evidence, and qualifications.',
    formatHints: ['PDF', 'Interactive checklist', 'Official requirements'],
    i18nKey: 'documents.visaEvidenceChecklist',
    category: 'submission',
    fundingTypes: ['visa']
  },

  // Additional Documents
  annexGuidance: {
    id: 'annexGuidance',
    title: 'Annex Guidance',
    short: 'Supporting documents guidance',
    details: 'Detailed guidance on preparing supporting documents, appendices, and additional materials required for grant applications.',
    formatHints: ['PDF', 'Guidance document', 'Step-by-step'],
    i18nKey: 'documents.annexGuidance',
    category: 'additional',
    fundingTypes: ['grants']
  },
  pitchOutline: {
    id: 'pitchOutline',
    title: 'Pitch Deck Outline',
    short: 'Structured presentation outline',
    details: 'Detailed outline and content suggestions for creating your own pitch deck, including slide-by-slide guidance and best practices.',
    formatHints: ['PDF', 'Content outline', 'Design suggestions'],
    i18nKey: 'documents.pitchOutline',
    category: 'additional',
    fundingTypes: ['grants', 'equity']
  },
  talkingPoints: {
    id: 'talkingPoints',
    title: 'Talking Points',
    short: 'Key messages and elevator pitch',
    details: 'Concise talking points and elevator pitch for presenting your business to potential investors, partners, or immigration authorities.',
    formatHints: ['PDF', 'Key messages', 'Presentation ready'],
    i18nKey: 'documents.talkingPoints',
    category: 'additional',
    fundingTypes: ['visa']
  }
};

// Helper function to get documents by category and funding type
export function getDocumentsByCategory(
  category: DocumentDescription['category'],
  fundingType?: 'grants' | 'bankLoans' | 'equity' | 'visa'
): DocumentDescription[] {
  return Object.values(documentDescriptions).filter(doc => {
    if (doc.category !== category) return false;
    if (fundingType && !doc.fundingTypes.includes(fundingType)) return false;
    return true;
  });
}

// Helper function to get document by ID
export function getDocumentById(id: string): DocumentDescription | undefined {
  return documentDescriptions[id];
}

// ========= PLAN2FUND — BASIS PACK =========
// Single source of truth for pricing page + editor
// Canonical document specifications and funding packs

export type Product = 'strategy' | 'review' | 'submission';
export type FundingType = 'grants' | 'bankLoans' | 'equity' | 'visa';
export type TargetGroup = 'startups' | 'sme' | 'advisors' | 'universities';

// ========= DOC-SPEC TEMPLATE =========
export interface DocSpec {
  id: string;
  name: string;
  purpose: string;
  coreSections: string[];
  formatLength: string;
  inputs: string[];
  customization: string;
  limits: string;
  outputs: string[];
  complianceChecklist: string[];
  filePath: string;
  fundingTypes: FundingType[];
}

// ========= FUNDING PACKS =========
export interface FundingPack {
  targetGroup: TargetGroup;
  fundingType: FundingType;
  product: Product;
  included: string[]; // Document IDs
  youProvide: string[];
  description: string;
}

// ========= ADD-ON SPECIFICATIONS =========
export interface AddonSpec {
  id: string;
  name: string;
  price: string;
  scope: string;
  exclusions: string;
  deliverables: string;
  turnaround: string;
  fundingTypes: FundingType[];
}

// ========= DOCUMENT SPECIFICATIONS =========
export const docSpecs: Record<string, DocSpec> = {
  // Strategy Documents
  strategyBrief: {
    id: 'strategyBrief',
    name: 'Strategy Brief',
    purpose: 'Core strategy document covering business model, market analysis, and funding direction',
    coreSections: ['Executive Summary', 'Problem & Solution', 'Target Market', 'Business Model', 'Financial Projections', 'Funding Ask'],
    formatLength: 'DOCX + PDF; 5-7 pages; DE/EN; styled per funding type',
    inputs: ['sector', 'ICP', 'pricing', 'traction', 'milestones', 'founder bios', 'costs'],
    customization: 'grant/bank/VC/visa variant + sector lexicon',
    limits: 'no external audit or notarisation; no legal advice',
    outputs: ['/docs/strategy-brief-{lang}.pdf', '/docs/strategy-brief-{lang}.docx'],
    complianceChecklist: ['page limits checked', 'mandatory headings present', 'funding type style applied'],
    filePath: '/docs/strategy-brief-{lang}',
    fundingTypes: ['grants', 'bankLoans', 'equity', 'visa']
  },
  businessModelCanvas: {
    id: 'businessModelCanvas',
    name: 'Business Model Canvas',
    purpose: 'Visual business model framework showing value propositions, customer segments, and revenue streams',
    coreSections: ['Value Propositions', 'Customer Segments', 'Channels', 'Customer Relationships', 'Revenue Streams', 'Key Resources', 'Key Activities', 'Key Partnerships', 'Cost Structure'],
    formatLength: 'PDF; 1 page; Visual format',
    inputs: ['business model data', 'value propositions', 'customer segments'],
    customization: 'sector-specific terminology',
    limits: 'visual representation only; no detailed analysis',
    outputs: ['/docs/business-model-canvas.pdf'],
    complianceChecklist: ['all sections filled', 'visual clarity maintained'],
    filePath: '/docs/business-model-canvas',
    fundingTypes: ['grants', 'equity']
  },
  fundingMatchSummary: {
    id: 'fundingMatchSummary',
    name: 'Funding Match Summary',
    purpose: 'Personalized funding recommendations with fit rationale and next steps',
    coreSections: ['Funding Options', 'Fit Analysis', 'Next Steps', 'Requirements Summary'],
    formatLength: 'PDF; 2-3 pages; Personalized',
    inputs: ['business profile', 'funding goals', 'target market'],
    customization: 'Austrian/EU funding landscape focus',
    limits: 'recommendations only; no application assistance',
    outputs: ['/docs/funding-match-summary.pdf'],
    complianceChecklist: ['all options analyzed', 'fit rationale provided'],
    filePath: '/docs/funding-match-summary',
    fundingTypes: ['grants', 'bankLoans', 'equity', 'visa']
  },
  loanBrief: {
    id: 'loanBrief',
    name: 'Loan-Oriented Brief',
    purpose: 'Bank-focused strategy document emphasizing financial stability and repayment capacity',
    coreSections: ['Executive Summary', 'Financial Stability', 'Repayment Capacity', 'Collateral Considerations', 'Risk Assessment'],
    formatLength: 'DOCX + PDF; 5-7 pages; Bank-focused',
    inputs: ['financial data', 'collateral information', 'repayment plan'],
    customization: 'Austrian banking standards; DSCR focus',
    limits: 'no credit assessment; no loan guarantee',
    outputs: ['/docs/loan-brief-{lang}.pdf', '/docs/loan-brief-{lang}.docx'],
    complianceChecklist: ['DSCR calculations included', 'collateral documented', 'repayment schedule provided'],
    filePath: '/docs/loan-brief-{lang}',
    fundingTypes: ['bankLoans']
  },
  investorBrief: {
    id: 'investorBrief',
    name: 'Investor Positioning Brief',
    purpose: 'VC-focused strategy document highlighting growth potential and market opportunity',
    coreSections: ['Executive Summary', 'Market Opportunity', 'Competitive Advantage', 'Growth Strategy', 'Financial Projections', 'Team & Execution'],
    formatLength: 'DOCX + PDF; 5-7 pages; Investor-focused',
    inputs: ['market data', 'growth metrics', 'competitive analysis', 'team information'],
    customization: 'Austrian/EU VC landscape; growth focus',
    limits: 'no investment advice; no valuation',
    outputs: ['/docs/investor-brief-{lang}.pdf', '/docs/investor-brief-{lang}.docx'],
    complianceChecklist: ['market size validated', 'growth assumptions documented', 'team credentials highlighted'],
    filePath: '/docs/investor-brief-{lang}',
    fundingTypes: ['equity']
  },
  investorTeaserOnePager: {
    id: 'investorTeaserOnePager',
    name: 'Investor Teaser One-Pager',
    purpose: 'Compelling one-page summary for initial investor outreach',
    coreSections: ['Problem', 'Solution', 'Market Opportunity', 'Business Model', 'Traction', 'Team', 'Funding Ask'],
    formatLength: 'PDF; 1 page; High-impact design',
    inputs: ['key metrics', 'traction data', 'team highlights', 'funding requirements'],
    customization: 'investor-ready design; key metrics focus',
    limits: 'summary only; no detailed analysis',
    outputs: ['/docs/investor-teaser.pdf'],
    complianceChecklist: ['all key sections included', 'metrics validated', 'design professional'],
    filePath: '/docs/investor-teaser',
    fundingTypes: ['equity']
  },
  visaBrief: {
    id: 'visaBrief',
    name: 'Visa Viability Brief',
    purpose: 'Immigration-focused strategy document for Austrian Red-White-Red visa applications',
    coreSections: ['Executive Summary', 'Innovation Focus', 'Economic Benefit', 'Job Creation Plan', 'Founder Qualifications', 'Austrian Market Analysis'],
    formatLength: 'DOCX + PDF; 5-7 pages; Visa-focused',
    inputs: ['innovation details', 'job creation plan', 'qualifications', 'Austrian market research'],
    customization: 'Austrian immigration requirements; RWR focus',
    limits: 'no legal advice; no visa guarantee',
    outputs: ['/docs/visa-brief-{lang}.pdf', '/docs/visa-brief-{lang}.docx'],
    complianceChecklist: ['innovation clearly defined', 'job creation quantified', 'qualifications documented'],
    filePath: '/docs/visa-brief-{lang}',
    fundingTypes: ['visa']
  },

  // Review Documents
  annotatedDraft: {
    id: 'annotatedDraft',
    name: 'Annotated Draft',
    purpose: 'Line-by-line feedback on your existing business plan with specific recommendations',
    coreSections: ['Tracked Changes', 'Comments', 'Suggestions', 'Improvement Areas'],
    formatLength: 'DOCX; Tracked changes; Detailed comments',
    inputs: ['existing business plan', 'funding type', 'target audience'],
    customization: 'funding type specific feedback; Austrian/EU standards',
    limits: 'review only; no rewriting',
    outputs: ['/docs/annotated-draft-{lang}.docx'],
    complianceChecklist: ['all sections reviewed', 'tracked changes applied', 'comments detailed'],
    filePath: '/docs/annotated-draft-{lang}',
    fundingTypes: ['grants', 'bankLoans', 'equity', 'visa']
  },
  revisedPlan: {
    id: 'revisedPlan',
    name: 'Revised Business Plan',
    purpose: 'Completely revised business plan incorporating all feedback and improvements',
    coreSections: ['Executive Summary', 'Company Description', 'Market Analysis', 'Organization & Management', 'Service/Product Line', 'Marketing & Sales', 'Financial Projections', 'Funding Request'],
    formatLength: 'DOCX + PDF; Clean version; Professional formatting',
    inputs: ['annotated draft', 'feedback incorporation', 'additional information'],
    customization: 'funding type structure; Austrian/EU compliance',
    limits: 'revision only; no new content creation',
    outputs: ['/docs/revised-plan-{lang}.pdf', '/docs/revised-plan-{lang}.docx'],
    complianceChecklist: ['all feedback incorporated', 'structure improved', 'compliance verified'],
    filePath: '/docs/revised-plan-{lang}',
    fundingTypes: ['grants', 'bankLoans', 'equity', 'visa']
  },
  complianceChecklist: {
    id: 'complianceChecklist',
    name: 'Compliance Checklist',
    purpose: 'Requirements verification checklist ensuring plan meets funding type requirements',
    coreSections: ['Format Requirements', 'Content Requirements', 'Documentation Requirements', 'Submission Checklist'],
    formatLength: 'PDF; Interactive checklist; Actionable items',
    inputs: ['funding type', 'specific requirements', 'current plan status'],
    customization: 'funding type specific; Austrian/EU standards',
    limits: 'checklist only; no compliance guarantee',
    outputs: ['/docs/compliance-checklist.pdf'],
    complianceChecklist: ['all requirements listed', 'checklist interactive', 'actionable items clear'],
    filePath: '/docs/compliance-checklist',
    fundingTypes: ['grants', 'bankLoans', 'equity', 'visa']
  },
  ratiosCheck: {
    id: 'ratiosCheck',
    name: 'Financial Ratios Check',
    purpose: 'Bank-specific financial analysis including DSCR and other key metrics',
    coreSections: ['DSCR Analysis', 'Debt-to-Equity Ratio', 'Current Ratio', 'Liquidity Analysis', 'Bank Standards Comparison'],
    formatLength: 'PDF/Excel; Financial analysis; Bank standards',
    inputs: ['financial statements', 'loan terms', 'collateral information'],
    customization: 'Austrian banking standards; WKO guidelines',
    limits: 'analysis only; no loan approval',
    outputs: ['/financials/ratios-check.pdf', '/financials/ratios-check.xlsx'],
    complianceChecklist: ['DSCR calculated', 'all ratios analyzed', 'bank standards met'],
    filePath: '/financials/ratios-check',
    fundingTypes: ['bankLoans']
  },
  capTableCheck: {
    id: 'capTableCheck',
    name: 'Cap Table Review',
    purpose: 'Ownership structure analysis including option pools and investor rights',
    coreSections: ['Current Ownership', 'Option Pools', 'Vesting Schedules', 'Investor Rights', 'Post-Money Scenarios'],
    formatLength: 'PDF/Excel; Ownership table; Investor-ready',
    inputs: ['current cap table', 'option grants', 'investment terms'],
    customization: 'Austrian/EU investment standards',
    limits: 'review only; no legal advice',
    outputs: ['/investor/cap-table-review.pdf', '/investor/cap-table-review.xlsx'],
    complianceChecklist: ['ownership verified', 'options documented', 'rights clarified'],
    filePath: '/investor/cap-table-review',
    fundingTypes: ['equity']
  },

  // Submission Documents
  businessPlan: {
    id: 'businessPlan',
    name: 'Full Business Plan',
    purpose: 'Complete Austrian-style business plan for all funding types',
    coreSections: ['Cover', 'Executive Summary', 'Problem & Market', 'Product/Service', 'Competition', 'Business Model & Pricing', 'Go-to-Market & Sales', 'Team & Governance', 'Operations & Milestones', 'Risks & Mitigations', 'Financial Plan Summary', 'Funding Ask/Use of Funds', 'Appendices'],
    formatLength: 'DOCX + PDF; 20-30 pages; Professional layout',
    inputs: ['sector', 'ICP', 'pricing', 'traction', 'milestones', 'founder bios', 'costs', 'financial projections'],
    customization: 'grant/bank/VC/visa variant + sector lexicon + Austrian accounting terms',
    limits: 'no external audit or notarisation; no legal advice',
    outputs: ['/docs/business-plan-{lang}.pdf', '/docs/business-plan-{lang}.docx'],
    complianceChecklist: ['page limits checked', 'mandatory headings present', 'funding type style applied', 'Austrian terms used'],
    filePath: '/docs/business-plan-{lang}',
    fundingTypes: ['grants', 'bankLoans', 'equity', 'visa']
  },
  workPlanGantt: {
    id: 'workPlanGantt',
    name: 'Work Plan & Gantt Chart',
    purpose: 'Project timeline and deliverables for grant applications',
    coreSections: ['Objectives', 'Work Packages', 'Milestones', 'Timeline', 'Dependencies', 'KPIs', 'Risks'],
    formatLength: 'DOCX/PDF + Gantt image; Visual timeline; Grant-ready',
    inputs: ['tasks', 'durations', 'staff availability', 'dependencies'],
    customization: 'call-specific WP naming; EU cost categories',
    limits: 'resource booking/HR contracting not included',
    outputs: ['/docs/work-plan-{lang}.pdf', '/docs/work-plan-{lang}.docx', '/img/gantt.png'],
    complianceChecklist: ['each WP has deliverables & owner', 'milestones dated', 'timeline realistic'],
    filePath: '/docs/work-plan-{lang}',
    fundingTypes: ['grants']
  },
  budgetSheet: {
    id: 'budgetSheet',
    name: 'Budget Sheet',
    purpose: 'Itemized project costs and justifications per EU/AT guidelines',
    coreSections: ['Personnel', 'Equipment', 'Services/Subcontracting', 'Travel', 'Overheads', 'Summary'],
    formatLength: 'XLSX + PDF summary; EU cost categories; Detailed breakdown',
    inputs: ['roles & rates', 'item lists', 'quotes if required'],
    customization: 'map to call categories; cap rules',
    limits: 'no procurement; no audit',
    outputs: ['/financials/budget.xlsx', '/financials/budget-summary.pdf'],
    complianceChecklist: ['totals match Work Plan', 'justifications present', 'EU categories used'],
    filePath: '/financials/budget',
    fundingTypes: ['grants']
  },
  financialModel3to5y: {
    id: 'financialModel3to5y',
    name: '3-5 Year Financial Model',
    purpose: 'Comprehensive financial projections for banks and investors',
    coreSections: ['Assumptions', 'Revenue Build-up', 'COGS', 'Opex', 'Hiring', 'CAPEX', 'P&L', 'Balance Sheet', 'Cash Flow', 'Ratios', 'Scenarios'],
    formatLength: 'XLSX (+ charts); Interactive model; Bank-ready',
    inputs: ['pricing', 'volumes', 'churn', 'salaries', 'taxes', 'loan/equity terms'],
    customization: 'bank vs VC scenario sets; Austrian accounting standards',
    limits: 'no audit; relies on user inputs',
    outputs: ['/financials/model.xlsx', '/financials/charts/'],
    complianceChecklist: ['balance checks passed', 'scenario tables complete', 'DSCR visible'],
    filePath: '/financials/model',
    fundingTypes: ['bankLoans', 'equity']
  },
  bankSummaryOnePager: {
    id: 'bankSummaryOnePager',
    name: 'Bank Summary One-Pager',
    purpose: 'Fast credit-decision snapshot for bank loan applications',
    coreSections: ['Loan Purpose', 'Amount/Term', 'DSCR & Ratios', 'Repayment Schedule', 'Collateral', 'Company Snapshot', 'Management'],
    formatLength: 'PDF; 1-2 pages; Bank-focused',
    inputs: ['loan terms', 'collateral values', 'key ratios'],
    customization: 'Austrian banking standards; DSCR focus',
    limits: 'summary only; no loan approval',
    outputs: ['/bank/summary.pdf'],
    complianceChecklist: ['all fields filled', 'ratios explainable', 'bank format used'],
    filePath: '/bank/summary',
    fundingTypes: ['bankLoans']
  },
  amortizationSchedule: {
    id: 'amortizationSchedule',
    name: 'Amortization Schedule',
    purpose: 'Detailed loan repayment schedule with scenarios',
    coreSections: ['Payment Schedule', 'Principal Breakdown', 'Interest Calculation', 'Early Payment Options', 'Scenarios'],
    formatLength: 'Excel/PDF; Payment schedule; Multiple scenarios',
    inputs: ['loan amount', 'interest rate', 'term', 'payment frequency'],
    customization: 'Austrian banking terms; flexible scenarios',
    limits: 'calculation only; no loan approval',
    outputs: ['/bank/amortization.xlsx', '/bank/amortization.pdf'],
    complianceChecklist: ['calculations verified', 'scenarios included', 'format bank-ready'],
    filePath: '/bank/amortization',
    fundingTypes: ['bankLoans']
  },
  collateralSheet: {
    id: 'collateralSheet',
    name: 'Collateral Sheet',
    purpose: 'Asset collateral documentation for secured loans',
    coreSections: ['Asset List', 'Valuation', 'Ownership Proof', 'Liens', 'Location'],
    formatLength: 'XLSX/PDF; Asset inventory; Legal documentation',
    inputs: ['asset list', 'values', 'documents'],
    customization: 'Austrian legal requirements',
    limits: 'documentation only; no valuations',
    outputs: ['/bank/collateral.xlsx', '/bank/collateral.pdf'],
    complianceChecklist: ['all assets listed', 'ownership verified', 'legal status clear'],
    filePath: '/bank/collateral',
    fundingTypes: ['bankLoans']
  },
  pitchDeck: {
    id: 'pitchDeck',
    name: 'Pitch Deck',
    purpose: 'Professional pitch deck for investor meetings',
    coreSections: ['Problem', 'Solution', 'Market', 'Product', 'Model', 'Go-to-Market', 'Traction', 'Competition', 'Team', 'Financials', 'Ask/Use'],
    formatLength: 'PowerPoint/PDF; 10-15 slides; Investor-ready design',
    inputs: ['screenshots', 'charts', 'numbers', 'team photos'],
    customization: 'Austrian/EU VC landscape; growth focus',
    limits: 'content only; no design services',
    outputs: ['/investor/deck-content.docx', '/img/charts/'],
    complianceChecklist: ['all slides included', 'content compelling', 'format professional'],
    filePath: '/investor/deck-content',
    fundingTypes: ['equity']
  },
  capTable: {
    id: 'capTable',
    name: 'Cap Table',
    purpose: 'Ownership clarity pre/post raise',
    coreSections: ['Current Ownership', 'Options', 'Post-Money', 'Investor Rights'],
    formatLength: 'XLSX + PNG chart; Ownership structure; Investor-ready',
    inputs: ['shareholder list', 'new round terms'],
    customization: 'Austrian/EU investment standards',
    limits: 'calculation only; no legal advice',
    outputs: ['/investor/cap-table.xlsx', '/investor/cap-table.png'],
    complianceChecklist: ['ownership calculated', 'chart generated', 'rights documented'],
    filePath: '/investor/cap-table',
    fundingTypes: ['equity']
  },
  visaBusinessPlan: {
    id: 'visaBusinessPlan',
    name: 'Visa Business Plan',
    purpose: 'RWR visa-specific business plan emphasizing Austrian economic benefit',
    coreSections: ['Executive Summary', 'Activity & Market', 'Location', 'Investment & Job Plan', 'Team & Qualifications', 'Financials', 'Impact for Austria', 'Risk & Mitigation'],
    formatLength: 'DOCX/PDF; Visa-specific format; German/English',
    inputs: ['investment amount & proof path', 'hiring plan', 'qualifications'],
    customization: 'Austrian immigration requirements; RWR focus',
    limits: 'no visa guarantee; no legal advice',
    outputs: ['/visa/plan-{lang}.pdf', '/visa/plan-{lang}.docx'],
    complianceChecklist: ['investment addressed', 'job creation quantified', 'competition analyzed', 'legal notes included'],
    filePath: '/visa/plan-{lang}',
    fundingTypes: ['visa']
  },
  founderCV: {
    id: 'founderCV',
    name: 'Founder CV',
    purpose: 'Professional founder curriculum vitae for funding applications',
    coreSections: ['Profile', 'Experience', 'Education', 'Key Achievements', 'Publications/Patents'],
    formatLength: 'PDF; 1-2 pages; Professional format',
    inputs: ['CV data', 'achievements', 'qualifications'],
    customization: 'funding-focused; Austrian/EU standards',
    limits: 'formatting only; no content creation',
    outputs: ['/cv/founder.pdf'],
    complianceChecklist: ['all sections included', 'format professional', 'achievements highlighted'],
    filePath: '/cv/founder',
    fundingTypes: ['grants', 'visa']
  },
  visaEvidenceChecklist: {
    id: 'visaEvidenceChecklist',
    name: 'Visa Evidence Checklist',
    purpose: 'Comprehensive checklist of required documents for RWR visa application',
    coreSections: ['Personal Documents', 'Business Documents', 'Financial Documents', 'Qualification Documents', 'Translation Requirements'],
    formatLength: 'PDF; Interactive checklist; Official requirements',
    inputs: ['document status', 'translation needs'],
    customization: 'Austrian immigration requirements; RWR specific',
    limits: 'checklist only; no document procurement',
    outputs: ['/visa/checklist.pdf'],
    complianceChecklist: ['all requirements listed', 'checklist interactive', 'translation needs noted'],
    filePath: '/visa/checklist',
    fundingTypes: ['visa']
  },
  annexGuidance: {
    id: 'annexGuidance',
    name: 'Annex Guidance',
    purpose: 'Supporting documents guidance for grant applications',
    coreSections: ['Required Annexes', 'Format Requirements', 'Submission Guidelines', 'Common Mistakes'],
    formatLength: 'PDF; Guidance document; Step-by-step',
    inputs: ['grant call requirements'],
    customization: 'call-specific requirements',
    limits: 'guidance only; no document creation',
    outputs: ['/docs/annex-guidance.pdf'],
    complianceChecklist: ['all annexes listed', 'requirements clear', 'guidance actionable'],
    filePath: '/docs/annex-guidance',
    fundingTypes: ['grants']
  },
  pitchOutline: {
    id: 'pitchOutline',
    name: 'Pitch Deck Outline',
    purpose: 'Structured presentation outline and content suggestions',
    coreSections: ['Slide Structure', 'Content Guidelines', 'Design Suggestions', 'Best Practices'],
    formatLength: 'PDF; Content outline; Design suggestions',
    inputs: ['presentation goals', 'audience type'],
    customization: 'funding type specific; Austrian/EU focus',
    limits: 'outline only; no slide creation',
    outputs: ['/docs/pitch-outline.pdf'],
    complianceChecklist: ['all slides outlined', 'content guidelines provided', 'design suggestions included'],
    filePath: '/docs/pitch-outline',
    fundingTypes: ['grants', 'equity']
  },
  talkingPoints: {
    id: 'talkingPoints',
    name: 'Talking Points',
    purpose: 'Key messages and elevator pitch for presentations',
    coreSections: ['Elevator Pitch', 'Key Messages', 'Q&A Preparation', 'Presentation Tips'],
    formatLength: 'PDF; Key messages; Presentation ready',
    inputs: ['business summary', 'target audience'],
    customization: 'visa/immigration focus; Austrian context',
    limits: 'content only; no presentation delivery',
    outputs: ['/docs/talking-points.pdf'],
    complianceChecklist: ['elevator pitch clear', 'key messages defined', 'Q&A prepared'],
    filePath: '/docs/talking-points',
    fundingTypes: ['visa']
  }
};

// ========= FUNDING PACKS =========
export const fundingPacks: FundingPack[] = [
  // Grants
  {
    targetGroup: 'startups',
    fundingType: 'grants',
    product: 'strategy',
    included: ['strategyBrief', 'businessModelCanvas', 'fundingMatchSummary'],
    youProvide: ['Company register extract', 'Financial-health form (if requested)', 'Call-specific forms'],
    description: 'Strategy brief, BMC and funding-fit summary — tailored to grants'
  },
  {
    targetGroup: 'sme',
    fundingType: 'grants',
    product: 'strategy',
    included: ['strategyBrief', 'businessModelCanvas', 'fundingMatchSummary'],
    youProvide: ['Company register extract', 'Financial-health form', 'Previous projects list'],
    description: 'Strategy brief, BMC and funding-fit summary — tailored to grants'
  },
  {
    targetGroup: 'startups',
    fundingType: 'grants',
    product: 'review',
    included: ['annotatedDraft', 'revisedPlan', 'complianceChecklist'],
    youProvide: ['Existing business plan', 'Company register extract', 'Financial statements'],
    description: 'Line-by-line edits, reworked plan and funder-specific compliance checks'
  },
  {
    targetGroup: 'startups',
    fundingType: 'grants',
    product: 'submission',
    included: ['businessPlan', 'workPlanGantt', 'budgetSheet', 'founderCV', 'annexGuidance'],
    youProvide: ['Company register extract', 'Financial-health form', 'Call-specific forms', 'Consortium declaration (if partners)', 'Previous projects list'],
    description: 'Plan + work plan & budget + CVs/annexes (as per call)'
  },
  
  // Bank Loans
  {
    targetGroup: 'sme',
    fundingType: 'bankLoans',
    product: 'strategy',
    included: ['loanBrief', 'fundingMatchSummary'],
    youProvide: ['Photo ID', 'Meldezettel', 'Company register extract'],
    description: 'Loan-oriented strategy brief and funding recommendations'
  },
  {
    targetGroup: 'sme',
    fundingType: 'bankLoans',
    product: 'review',
    included: ['annotatedDraft', 'revisedPlan', 'ratiosCheck'],
    youProvide: ['Existing business plan', 'Financial statements', 'Tax office statements'],
    description: 'Line-by-line edits, reworked plan and financial ratios check'
  },
  {
    targetGroup: 'sme',
    fundingType: 'bankLoans',
    product: 'submission',
    included: ['businessPlan', 'financialModel3to5y', 'bankSummaryOnePager', 'amortizationSchedule', 'collateralSheet'],
    youProvide: ['Photo ID', 'Meldezettel', 'Company register extract', 'Tax office statements', 'Health insurance statements', 'Last 3 annual financials', 'Current balances list', '≥1 year forecast'],
    description: 'Plan + 3–5y model + ratios/repayment + collateral'
  },
  
  // Equity Investment
  {
    targetGroup: 'startups',
    fundingType: 'equity',
    product: 'strategy',
    included: ['investorBrief', 'investorTeaserOnePager', 'fundingMatchSummary'],
    youProvide: ['Incorporation docs', 'Shareholder agreements', 'IP assignments'],
    description: 'Investor positioning brief, one-pager teaser, and funding recommendations'
  },
  {
    targetGroup: 'startups',
    fundingType: 'equity',
    product: 'review',
    included: ['annotatedDraft', 'revisedPlan', 'capTableCheck'],
    youProvide: ['Existing business plan', 'Cap table', 'Key contracts'],
    description: 'Line-by-line edits, reworked plan and cap table review'
  },
  {
    targetGroup: 'startups',
    fundingType: 'equity',
    product: 'submission',
    included: ['businessPlan', 'investorTeaserOnePager', 'pitchDeck', 'financialModel3to5y', 'capTable'],
    youProvide: ['Incorporation docs', 'Shareholder agreements', 'IP assignments', 'Key contracts', 'Evidence of traction'],
    description: 'Plan + teaser/deck + 5y model + cap table'
  },
  
  // Visa
  {
    targetGroup: 'startups',
    fundingType: 'visa',
    product: 'strategy',
    included: ['visaBrief', 'fundingMatchSummary'],
    youProvide: ['Passport', 'Birth certificate', 'Accommodation proof'],
    description: 'Visa-focused strategy brief and funding recommendations'
  },
  {
    targetGroup: 'startups',
    fundingType: 'visa',
    product: 'review',
    included: ['annotatedDraft', 'revisedPlan'],
    youProvide: ['Existing visa plan', 'CV', 'Qualification documents'],
    description: 'Line-by-line edits and revised visa plan'
  },
  {
    targetGroup: 'startups',
    fundingType: 'visa',
    product: 'submission',
    included: ['visaBusinessPlan', 'founderCV', 'visaEvidenceChecklist'],
    youProvide: ['Passport', 'Birth certificate', 'Accommodation proof', 'Health insurance', 'Proof of funds/investment', 'Qualifications', 'Craft permits', 'Translations/legalisation'],
    description: 'Visa plan + CV + evidence checklist (capital, jobs, qualifications)'
  }
];

// ========= ADD-ON SPECIFICATIONS =========
export const addonSpecs: AddonSpec[] = [
  {
    id: 'financialHealthAssistance',
    name: 'Financial-Health & Credit-Report Assistance',
    price: '+€79',
    scope: 'Coordinate with your tax advisor; prepare financial-health form; help request a credit rating; cross-check with Budget Sheet',
    exclusions: 'No audit; fees from third parties not included',
    deliverables: 'Checklist + filled forms draft; 45-min call',
    turnaround: '3–5 working days',
    fundingTypes: ['grants']
  },
  {
    id: 'collateralDocumentationReview',
    name: 'Collateral Documentation Review',
    price: '+€59',
    scope: 'Review asset list; mark gaps (ownership/valuation); propose collateral structure',
    exclusions: 'External valuations',
    deliverables: 'Annotated collateral sheet; recommendations',
    turnaround: '2–3 working days',
    fundingTypes: ['bankLoans']
  },
  {
    id: 'legalIpDataRoomChecklist',
    name: 'Legal/IP Data-Room Checklist',
    price: '+€49',
    scope: 'Generate tailored checklist (formation docs, shareholder agreements, IP assignments, key contracts)',
    exclusions: 'Legal advice',
    deliverables: 'Checklist + folder structure; 60-min walkthrough',
    turnaround: '1–2 working days',
    fundingTypes: ['equity']
  },
  {
    id: 'translationLegalisationCoordination',
    name: 'Translation & Legalisation Coordination',
    price: '+€89',
    scope: 'Identify what needs translation/legalisation; coordinate vendor quotes',
    exclusions: 'Government/legal fees',
    deliverables: 'Vendor shortlist + schedule; upload status tracker',
    turnaround: '5–7 working days',
    fundingTypes: ['visa', 'grants']
  },
  {
    id: 'extraRevisionCycle',
    name: 'Extra Revision Cycle',
    price: '+€29',
    scope: 'One full round on all docs in the bundle',
    exclusions: 'New content creation',
    deliverables: 'Revised documents with additional feedback',
    turnaround: '2–3 working days',
    fundingTypes: ['grants', 'bankLoans', 'equity', 'visa']
  },
  {
    id: 'customFinancialModeling',
    name: 'Custom Financial Modeling',
    price: '+€79',
    scope: 'Scenarios + sensitivities + optional valuation sheet (XLSX)',
    exclusions: 'Audit or validation',
    deliverables: 'Enhanced financial model with scenarios',
    turnaround: '3–5 working days',
    fundingTypes: ['bankLoans', 'equity']
  },
  {
    id: 'oneOnOneConsultation',
    name: '1:1 Consultation (45 min)',
    price: '+€99',
    scope: 'Prep questions + summary notes',
    exclusions: 'Document creation',
    deliverables: '45-min call + summary notes',
    turnaround: '1–2 working days',
    fundingTypes: ['grants', 'bankLoans', 'equity', 'visa']
  },
  {
    id: 'pitchDeckExport',
    name: 'Pitch Deck Export (designed slides)',
    price: '+€59',
    scope: 'Apply brand template; export to PDF/PPTX',
    exclusions: 'Custom design work',
    deliverables: 'Designed slides in PDF/PPTX format',
    turnaround: '2–3 working days',
    fundingTypes: ['equity']
  },
  {
    id: 'rushDelivery',
    name: 'Rush Delivery (48h)',
    price: '+€49',
    scope: 'Prioritised slot; feasibility check required',
    exclusions: 'Complex custom work',
    deliverables: 'Fast-tracked delivery',
    turnaround: '48 hours',
    fundingTypes: ['grants', 'bankLoans', 'equity', 'visa']
  }
];

// ========= HELPER FUNCTIONS =========
export function getDocSpec(id: string): DocSpec | undefined {
  return docSpecs[id];
}

export function getFundingPack(
  targetGroup: TargetGroup,
  fundingType: FundingType,
  product: Product
): FundingPack | undefined {
  return fundingPacks.find(
    pack => pack.targetGroup === targetGroup && 
           pack.fundingType === fundingType && 
           pack.product === product
  );
}

export function getAddonSpec(id: string): AddonSpec | undefined {
  return addonSpecs.find(addon => addon.id === id);
}

export function getAddonsForFundingType(fundingType: FundingType): AddonSpec[] {
  return addonSpecs.filter(addon => addon.fundingTypes.includes(fundingType));
}

export function getDocSpecsForBundle(docIds: string[]): DocSpec[] {
  return docIds.map(id => docSpecs[id]).filter(Boolean);
}

export function getRequirementsForFundingType(fundingType: FundingType): string[] {
  const packs = fundingPacks.filter(pack => pack.fundingType === fundingType);
  const allRequirements = new Set<string>();
  
  packs.forEach(pack => {
    pack.youProvide.forEach(req => allRequirements.add(req));
  });
  
  return Array.from(allRequirements);
}

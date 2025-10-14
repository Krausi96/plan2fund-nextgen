// ========= PLAN2FUND — PRODUCT SECTION TEMPLATES =========
// Product-specific section definitions for Strategy, Review, and Submission
// Based on GPT agent comprehensive instructions

import { StandardSection, ConditionalRule } from '../standardSectionTemplates';
import { AdditionalDocument } from './additionalDocuments';

export interface WorkflowStep {
  id: string;
  description: string;           // Action or instruction for the user
  condition?: ConditionalRule[]; // Optional conditions for this step
}

export interface ProductSection {
  productType: 'strategy' | 'review' | 'submission';
  fundingType: 'grants' | 'bankLoans' | 'equity' | 'visa';
  sections: StandardSection[];   // List of sections to display
  additionalDocuments: AdditionalDocument[];
  workflow: WorkflowStep[];      // Sequence of steps (e.g., fill forms, review, export)
}

export interface ProductSectionTemplates {
  strategy: Record<'grants' | 'bankLoans' | 'equity' | 'visa', ProductSection>;
  review:   Record<'grants' | 'bankLoans' | 'equity' | 'visa', ProductSection>;
  submission: Record<'grants' | 'bankLoans' | 'equity' | 'visa', ProductSection>;
}

// ============================================================================
// PRODUCT SECTION TEMPLATES
// ============================================================================

export const PRODUCT_SECTION_TEMPLATES: ProductSectionTemplates = {
  strategy: {
    grants: {
      productType: 'strategy',
      fundingType: 'grants',
      sections: [
        // Will be populated with standard sections from standardSectionTemplates.ts
        // Focus on: executive_summary, project_description, innovation_plan, impact_assessment, financial_plan
      ],
      additionalDocuments: [
        {
          id: 'business_model_canvas',
          name: 'Business Model Canvas',
          description: 'Visual representation of your business model',
          required: true,
          format: 'pdf',
          maxSize: '5MB',
          template: 'Business Model Canvas template with key partnerships, activities, value propositions, customer relationships, customer segments, key resources, channels, cost structure, and revenue streams.',
          instructions: [
            'Fill in each section of the canvas',
            'Focus on your value proposition and customer segments',
            'Identify key partnerships and resources needed'
          ],
          examples: ['Example business model canvas for tech startup', 'Example for green tech project'],
          commonMistakes: ['Leaving sections empty', 'Not connecting value proposition to customer needs', 'Overcomplicating the model']
        },
        {
          id: 'go_to_market_strategy',
          name: 'Go-to-Market Strategy',
          description: 'Strategy for entering and capturing your target market',
          required: false,
          format: 'docx',
          maxSize: '10MB',
          template: 'Go-to-market strategy template covering market entry approach, customer acquisition, pricing strategy, and distribution channels.',
          instructions: [
            'Define your target customer segments',
            'Outline your customer acquisition strategy',
            'Detail your pricing and distribution approach'
          ],
          examples: ['B2B SaaS go-to-market strategy', 'Consumer product launch strategy'],
          commonMistakes: ['Not defining target customers clearly', 'Unrealistic customer acquisition costs', 'Ignoring competitive landscape']
        },
        {
          id: 'funding_fit_summary',
          name: 'Funding Fit Summary',
          description: 'Automatically generated matching top programmes/banks/investors',
          required: true,
          format: 'pdf',
          maxSize: '5MB',
          template: 'Funding fit analysis showing which funding sources match your project based on criteria, requirements, and focus areas.',
          instructions: [
            'Review the automatically generated matches',
            'Verify the funding criteria alignment',
            'Note any additional requirements needed'
          ],
          examples: ['EIC Accelerator match analysis', 'FFG Basisprogramm compatibility'],
          commonMistakes: ['Not reviewing the match criteria', 'Ignoring additional requirements', 'Not considering alternative funding sources']
        }
      ],
      workflow: [
        {
          id: 'capture_basic_info',
          description: 'Capture basic company information and project details'
        },
        {
          id: 'select_funding_industry',
          description: 'Select funding type and industry focus'
        },
        {
          id: 'fill_standard_sections',
          description: 'Fill in standard sections with AI assistance'
        },
        {
          id: 'generate_ai_draft',
          description: 'Generate AI-powered draft content'
        },
        {
          id: 'review_finalize',
          description: 'Review and finalize all sections'
        },
        {
          id: 'download_documents',
          description: 'Download completed documents'
        }
      ]
    },
    bankLoans: {
      productType: 'strategy',
      fundingType: 'bankLoans',
      sections: [
        // Focus on: executive_summary, business_description, financial_stability, repayment_plan
      ],
      additionalDocuments: [
        {
          id: 'business_model_canvas',
          name: 'Business Model Canvas',
          description: 'Visual representation of your business model',
          required: true,
          format: 'pdf',
          maxSize: '5MB',
          template: 'Business Model Canvas template with key partnerships, activities, value propositions, customer relationships, customer segments, key resources, channels, cost structure, and revenue streams.',
          instructions: [
            'Focus on revenue generation and cost structure',
            'Highlight customer relationships and retention',
            'Detail operational activities and resources'
          ],
          examples: ['Service business model canvas', 'Manufacturing business model'],
          commonMistakes: ['Not focusing on revenue streams', 'Ignoring cost structure', 'Unclear value proposition']
        },
        {
          id: 'funding_fit_summary',
          name: 'Funding Fit Summary',
          description: 'Automatically generated matching banks and loan programs',
          required: true,
          format: 'pdf',
          maxSize: '5MB',
          template: 'Bank loan compatibility analysis showing which banks and loan products match your business profile.',
          instructions: [
            'Review bank requirements and criteria',
            'Check loan terms and conditions',
            'Verify collateral requirements'
          ],
          examples: ['SME loan program match', 'Startup loan compatibility'],
          commonMistakes: ['Not checking bank requirements', 'Ignoring collateral needs', 'Not comparing loan terms']
        }
      ],
      workflow: [
        {
          id: 'capture_business_info',
          description: 'Capture business information and financial history'
        },
        {
          id: 'select_loan_type',
          description: 'Select loan type and amount needed'
        },
        {
          id: 'fill_financial_sections',
          description: 'Complete financial stability and repayment sections'
        },
        {
          id: 'generate_business_plan',
          description: 'Generate business plan with financial projections'
        },
        {
          id: 'review_compliance',
          description: 'Review for bank compliance requirements'
        },
        {
          id: 'download_application',
          description: 'Download loan application package'
        }
      ]
    },
    equity: {
      productType: 'strategy',
      fundingType: 'equity',
      sections: [
        // Focus on: executive_summary, market_opportunity, business_model, team, financial_overview
      ],
      additionalDocuments: [
        {
          id: 'business_model_canvas',
          name: 'Business Model Canvas',
          description: 'Visual representation of your scalable business model',
          required: true,
          format: 'pdf',
          maxSize: '5MB',
          template: 'Business Model Canvas template optimized for investor presentation with focus on scalability and growth potential.',
          instructions: [
            'Emphasize scalability and growth potential',
            'Highlight competitive advantages',
            'Detail revenue streams and unit economics'
          ],
          examples: ['SaaS business model canvas', 'Marketplace business model'],
          commonMistakes: ['Not showing scalability', 'Unclear unit economics', 'Missing competitive advantages']
        },
        {
          id: 'go_to_market_strategy',
          name: 'Go-to-Market Strategy',
          description: 'Strategy for scaling and capturing market share',
          required: true,
          format: 'docx',
          maxSize: '10MB',
          template: 'Go-to-market strategy template for high-growth companies with customer acquisition, retention, and scaling strategies.',
          instructions: [
            'Define scalable customer acquisition channels',
            'Detail retention and expansion strategies',
            'Show path to market leadership'
          ],
          examples: ['B2B SaaS scaling strategy', 'Consumer app growth strategy'],
          commonMistakes: ['Not showing growth potential', 'Unrealistic customer acquisition', 'Missing retention strategy']
        },
        {
          id: 'funding_fit_summary',
          name: 'Funding Fit Summary',
          description: 'Automatically generated matching investors and VCs',
          required: true,
          format: 'pdf',
          maxSize: '5MB',
          template: 'Investor match analysis showing which VCs and angel investors align with your stage, sector, and funding needs.',
          instructions: [
            'Review investor focus areas and stage preferences',
            'Check typical investment amounts and terms',
            'Verify sector and geography alignment'
          ],
          examples: ['Early-stage VC match', 'Angel investor compatibility'],
          commonMistakes: ['Not checking investor criteria', 'Ignoring stage requirements', 'Not researching investor portfolio']
        }
      ],
      workflow: [
        {
          id: 'capture_startup_info',
          description: 'Capture startup information and traction metrics'
        },
        {
          id: 'select_investor_type',
          description: 'Select investor type and funding stage'
        },
        {
          id: 'fill_investor_sections',
          description: 'Complete market opportunity and business model sections'
        },
        {
          id: 'generate_pitch_materials',
          description: 'Generate pitch deck and financial model'
        },
        {
          id: 'review_investor_ready',
          description: 'Review for investor readiness and completeness'
        },
        {
          id: 'download_pitch_package',
          description: 'Download pitch materials and financial projections'
        }
      ]
    },
    visa: {
      productType: 'strategy',
      fundingType: 'visa',
      sections: [
        // Focus on: executive_summary, innovation_focus, economic_benefit, job_creation_plan, market_analysis, qualifications
      ],
      additionalDocuments: [
        {
          id: 'business_model_canvas',
          name: 'Business Model Canvas',
          description: 'Visual representation of your Austrian business model',
          required: true,
          format: 'pdf',
          maxSize: '5MB',
          template: 'Business Model Canvas template focused on Austrian market entry and job creation potential.',
          instructions: [
            'Focus on Austrian market opportunities',
            'Highlight job creation potential',
            'Detail local partnerships and resources'
          ],
          examples: ['Austrian tech startup model', 'Service business in Austria'],
          commonMistakes: ['Not showing Austrian market focus', 'Unclear job creation plan', 'Missing local partnerships']
        },
        {
          id: 'funding_fit_summary',
          name: 'Funding Fit Summary',
          description: 'Automatically generated matching Austrian funding programs',
          required: true,
          format: 'pdf',
          maxSize: '5MB',
          template: 'Austrian funding program compatibility analysis showing which programs support your business type and stage.',
          instructions: [
            'Review Austrian funding program requirements',
            'Check eligibility criteria and conditions',
            'Verify application deadlines and procedures'
          ],
          examples: ['AWS Preseed compatibility', 'FFG program match'],
          commonMistakes: ['Not checking eligibility', 'Missing application deadlines', 'Not understanding program focus']
        }
      ],
      workflow: [
        {
          id: 'capture_visa_info',
          description: 'Capture personal and business information for visa application'
        },
        {
          id: 'select_austrian_focus',
          description: 'Select Austrian market focus and business type'
        },
        {
          id: 'fill_visa_sections',
          description: 'Complete innovation, economic benefit, and job creation sections'
        },
        {
          id: 'generate_visa_plan',
          description: 'Generate comprehensive Austrian business plan'
        },
        {
          id: 'review_visa_requirements',
          description: 'Review for visa application requirements and compliance'
        },
        {
          id: 'download_visa_package',
          description: 'Download visa application materials'
        }
      ]
    }
  },

  review: {
    grants: {
      productType: 'review',
      fundingType: 'grants',
      sections: [
        // Full set of grant sections - will be populated from standardSectionTemplates.ts
      ],
      additionalDocuments: [
        {
          id: 'reviewed_business_plan',
          name: 'Reviewed Business Plan',
          description: 'The cleaned, restructured business plan with AI improvements',
          required: true,
          format: 'docx',
          maxSize: '50MB',
          template: 'Restructured business plan template with improved structure, clarity, and compliance with grant requirements.',
          instructions: [
            'Review AI-suggested improvements',
            'Accept or modify structural changes',
            'Ensure all grant requirements are addressed'
          ],
          examples: ['Before and after comparison', 'Improved executive summary'],
          commonMistakes: ['Not reviewing AI suggestions', 'Ignoring structural improvements', 'Not addressing compliance gaps']
        },
        {
          id: 'compliance_notes',
          name: 'Compliance Notes',
          description: '1–2 page checklist of compliance alignment and missing elements',
          required: true,
          format: 'pdf',
          maxSize: '5MB',
          template: 'Compliance checklist template highlighting missing elements, non-compliance issues, and improvement recommendations.',
          instructions: [
            'Review each compliance item',
            'Address missing or insufficient content',
            'Implement recommended improvements'
          ],
          examples: ['Missing TRL evidence', 'Insufficient impact metrics'],
          commonMistakes: ['Ignoring compliance gaps', 'Not implementing recommendations', 'Not documenting changes']
        }
      ],
      workflow: [
        {
          id: 'upload_paste_draft',
          description: 'Upload or paste your existing business plan draft'
        },
        {
          id: 'ai_analysis',
          description: 'AI analyzes structure and identifies gaps and improvements'
        },
        {
          id: 'edit_with_suggestions',
          description: 'Edit sections with AI suggestions and improvements'
        },
        {
          id: 'readiness_check',
          description: 'Run readiness checker to validate compliance'
        },
        {
          id: 'generate_reviewed_plan',
          description: 'Generate reviewed plan and compliance notes'
        }
      ]
    },
    bankLoans: {
      productType: 'review',
      fundingType: 'bankLoans',
      sections: [
        // Full set of bank loan sections
      ],
      additionalDocuments: [
        {
          id: 'reviewed_business_plan',
          name: 'Reviewed Business Plan',
          description: 'The cleaned, restructured business plan optimized for bank requirements',
          required: true,
          format: 'docx',
          maxSize: '50MB',
          template: 'Bank-ready business plan template with improved financial analysis and risk assessment.',
          instructions: [
            'Focus on financial stability and repayment capacity',
            'Strengthen risk mitigation sections',
            'Ensure compliance with bank requirements'
          ],
          examples: ['Improved financial projections', 'Enhanced risk analysis'],
          commonMistakes: ['Not addressing financial concerns', 'Weak risk mitigation', 'Missing bank-specific requirements']
        },
        {
          id: 'compliance_notes',
          name: 'Compliance Notes',
          description: 'Bank compliance checklist and improvement recommendations',
          required: true,
          format: 'pdf',
          maxSize: '5MB',
          template: 'Bank compliance checklist highlighting financial requirements, risk factors, and improvement areas.',
          instructions: [
            'Address financial stability concerns',
            'Strengthen repayment capacity analysis',
            'Improve collateral and security sections'
          ],
          examples: ['DSCR improvement needed', 'Cash flow analysis gaps'],
          commonMistakes: ['Not addressing financial gaps', 'Ignoring risk factors', 'Not improving repayment plan']
        }
      ],
      workflow: [
        {
          id: 'upload_financial_documents',
          description: 'Upload existing business plan and financial statements'
        },
        {
          id: 'financial_analysis',
          description: 'AI analyzes financial health and identifies improvement areas'
        },
        {
          id: 'strengthen_financials',
          description: 'Improve financial sections and risk analysis'
        },
        {
          id: 'bank_readiness_check',
          description: 'Run bank-specific readiness checker'
        },
        {
          id: 'generate_bank_plan',
          description: 'Generate bank-ready business plan and compliance notes'
        }
      ]
    },
    equity: {
      productType: 'review',
      fundingType: 'equity',
      sections: [
        // Full set of equity sections
      ],
      additionalDocuments: [
        {
          id: 'reviewed_business_plan',
          name: 'Reviewed Business Plan',
          description: 'The cleaned, restructured business plan optimized for investors',
          required: true,
          format: 'docx',
          maxSize: '50MB',
          template: 'Investor-ready business plan template with improved market analysis and growth projections.',
          instructions: [
            'Strengthen market opportunity analysis',
            'Improve growth projections and scalability',
            'Enhance competitive positioning'
          ],
          examples: ['Improved market sizing', 'Enhanced growth model'],
          commonMistakes: ['Weak market analysis', 'Unrealistic projections', 'Poor competitive positioning']
        },
        {
          id: 'compliance_notes',
          name: 'Compliance Notes',
          description: 'Investor readiness checklist and improvement recommendations',
          required: true,
          format: 'pdf',
          maxSize: '5MB',
          template: 'Investor readiness checklist highlighting market analysis, growth potential, and competitive advantages.',
          instructions: [
            'Address market analysis gaps',
            'Strengthen growth projections',
            'Improve competitive differentiation'
          ],
          examples: ['Market size validation needed', 'Growth assumptions unclear'],
          commonMistakes: ['Not addressing market gaps', 'Ignoring growth concerns', 'Not improving competitive analysis']
        }
      ],
      workflow: [
        {
          id: 'upload_pitch_materials',
          description: 'Upload existing pitch deck and business plan'
        },
        {
          id: 'investor_analysis',
          description: 'AI analyzes investor readiness and identifies improvements'
        },
        {
          id: 'enhance_investor_appeal',
          description: 'Improve market analysis and growth projections'
        },
        {
          id: 'investor_readiness_check',
          description: 'Run investor-specific readiness checker'
        },
        {
          id: 'generate_investor_plan',
          description: 'Generate investor-ready materials and recommendations'
        }
      ]
    },
    visa: {
      productType: 'review',
      fundingType: 'visa',
      sections: [
        // Full set of visa sections
      ],
      additionalDocuments: [
        {
          id: 'reviewed_business_plan',
          name: 'Reviewed Business Plan',
          description: 'The cleaned, restructured business plan optimized for visa requirements',
          required: true,
          format: 'docx',
          maxSize: '50MB',
          template: 'Visa-ready business plan template with enhanced Austrian market focus and job creation details.',
          instructions: [
            'Strengthen Austrian market analysis',
            'Improve job creation plan details',
            'Enhance economic benefit arguments'
          ],
          examples: ['Improved Austrian market research', 'Detailed job creation timeline'],
          commonMistakes: ['Weak Austrian market focus', 'Unclear job creation plan', 'Missing economic benefits']
        },
        {
          id: 'compliance_notes',
          name: 'Compliance Notes',
          description: 'Visa application compliance checklist and improvement recommendations',
          required: true,
          format: 'pdf',
          maxSize: '5MB',
          template: 'Visa compliance checklist highlighting Austrian market focus, job creation, and economic benefits.',
          instructions: [
            'Address Austrian market gaps',
            'Strengthen job creation details',
            'Improve economic benefit arguments'
          ],
          examples: ['Austrian market research needed', 'Job creation timeline unclear'],
          commonMistakes: ['Not addressing Austrian focus', 'Ignoring job creation requirements', 'Not improving economic benefits']
        }
      ],
      workflow: [
        {
          id: 'upload_visa_documents',
          description: 'Upload existing business plan and visa application materials'
        },
        {
          id: 'visa_analysis',
          description: 'AI analyzes visa requirements and identifies improvements'
        },
        {
          id: 'enhance_visa_appeal',
          description: 'Improve Austrian market focus and job creation details'
        },
        {
          id: 'visa_readiness_check',
          description: 'Run visa-specific readiness checker'
        },
        {
          id: 'generate_visa_plan',
          description: 'Generate visa-ready business plan and compliance notes'
        }
      ]
    }
  },

  submission: {
    grants: {
      productType: 'submission',
      fundingType: 'grants',
      sections: [
        // Full standard sections plus program-specific sections
      ],
      additionalDocuments: [
        {
          id: 'business_plan',
          name: 'Business Plan',
          description: 'Complete 20–30 page business plan for grant submission',
          required: true,
          format: 'docx',
          maxSize: '50MB',
          template: 'Comprehensive business plan template following EU grant application standards with all required sections.',
          instructions: [
            'Include all required grant sections',
            'Follow EU formatting guidelines',
            'Ensure compliance with specific program requirements'
          ],
          examples: ['Horizon Europe business plan', 'EIC Accelerator application'],
          commonMistakes: ['Missing required sections', 'Not following formatting guidelines', 'Incomplete compliance']
        },
        {
          id: 'work_plan_gantt',
          name: 'Work Plan & Gantt',
          description: 'Timeline and milestones for R&D grants',
          required: true,
          format: 'xlsx',
          maxSize: '10MB',
          template: 'Gantt chart template with work packages, milestones, deliverables, and responsible parties.',
          instructions: [
            'Define work packages and tasks',
            'Set realistic timelines and dependencies',
            'Assign responsible parties and resources'
          ],
          examples: ['3-year R&D project timeline', 'EIC Accelerator work plan'],
          commonMistakes: ['Unrealistic timelines', 'Missing dependencies', 'Unclear responsibilities']
        },
        {
          id: 'budget_financial_model',
          name: 'Budget & Financial Model',
          description: '3–5 year financial projections with assumptions',
          required: true,
          format: 'xlsx',
          maxSize: '10MB',
          template: 'Financial model template with budget breakdown, cost categories, and funding sources.',
          instructions: [
            'Break down costs by category and year',
            'Include all funding sources and co-financing',
            'Provide detailed assumptions and justifications'
          ],
          examples: ['Horizon Europe budget', 'FFG cost breakdown'],
          commonMistakes: ['Missing cost categories', 'Incorrect funding percentages', 'Unclear assumptions']
        },
        {
          id: 'ethics_risk_assessment',
          name: 'Ethics & Risk Assessment',
          description: 'Required for EU programmes',
          required: true,
          format: 'pdf',
          maxSize: '5MB',
          template: 'Ethics and risk assessment template covering ethical considerations, risk identification, and mitigation strategies.',
          instructions: [
            'Identify potential ethical issues',
            'Assess project risks and mitigation strategies',
            'Ensure compliance with EU ethics guidelines'
          ],
          examples: ['AI ethics assessment', 'Biotech risk analysis'],
          commonMistakes: ['Ignoring ethical considerations', 'Incomplete risk analysis', 'Not addressing mitigation']
        }
      ],
      workflow: [
        {
          id: 'select_program',
          description: 'Select specific grant program and requirements'
        },
        {
          id: 'answer_decision_tree',
          description: 'Answer program-specific decision tree questions'
        },
        {
          id: 'fill_sections_ai',
          description: 'Fill in all sections with AI assistance'
        },
        {
          id: 'upload_annexes',
          description: 'Upload required annexes and supporting documents'
        },
        {
          id: 'run_readiness_check',
          description: 'Run comprehensive readiness checker'
        },
        {
          id: 'finalize_export',
          description: 'Finalize and export complete application package'
        }
      ]
    },
    bankLoans: {
      productType: 'submission',
      fundingType: 'bankLoans',
      sections: [
        // Full standard sections plus bank-specific requirements
      ],
      additionalDocuments: [
        {
          id: 'business_plan',
          name: 'Business Plan',
          description: 'Formal 15–20 page bank-style business plan',
          required: true,
          format: 'docx',
          maxSize: '50MB',
          template: 'Bank-style business plan template with executive summary, company description, market analysis, financial statements, and repayment plan.',
          instructions: [
            'Follow bank formatting standards',
            'Include comprehensive financial analysis',
            'Emphasize repayment capacity and risk mitigation'
          ],
          examples: ['SME loan application', 'Startup business plan'],
          commonMistakes: ['Incomplete financial analysis', 'Weak repayment plan', 'Missing risk assessment']
        },
        {
          id: 'collateral_documentation',
          name: 'Collateral Documentation',
          description: 'List of assets, valuations, and legal proof of ownership',
          required: true,
          format: 'pdf',
          maxSize: '20MB',
          template: 'Collateral documentation template with asset inventory, valuations, and legal documentation.',
          instructions: [
            'List all available collateral',
            'Provide professional valuations',
            'Include legal proof of ownership'
          ],
          examples: ['Property collateral documentation', 'Equipment asset list'],
          commonMistakes: ['Missing valuations', 'Incomplete legal documentation', 'Overvaluing assets']
        }
      ],
      workflow: [
        {
          id: 'select_bank_loan',
          description: 'Select bank and loan product'
        },
        {
          id: 'complete_financial_analysis',
          description: 'Complete comprehensive financial analysis'
        },
        {
          id: 'prepare_collateral_docs',
          description: 'Prepare collateral documentation'
        },
        {
          id: 'bank_readiness_check',
          description: 'Run bank-specific readiness checker'
        },
        {
          id: 'submit_loan_application',
          description: 'Submit complete loan application package'
        }
      ]
    },
    equity: {
      productType: 'submission',
      fundingType: 'equity',
      sections: [
        // Full standard sections plus investor-specific requirements
      ],
      additionalDocuments: [
        {
          id: 'business_plan',
          name: 'Business Plan',
          description: 'Complete 20–30 page business plan for investors',
          required: true,
          format: 'docx',
          maxSize: '50MB',
          template: 'Investor-ready business plan template with market analysis, growth projections, and competitive positioning.',
          instructions: [
            'Focus on growth potential and scalability',
            'Include comprehensive market analysis',
            'Detail competitive advantages and differentiation'
          ],
          examples: ['Series A business plan', 'Seed stage pitch'],
          commonMistakes: ['Weak market analysis', 'Unrealistic projections', 'Poor competitive positioning']
        },
        {
          id: 'pitch_deck',
          name: 'Pitch Deck',
          description: 'Investor pitch presentation',
          required: true,
          format: 'pptx',
          maxSize: '20MB',
          template: 'Pitch deck template following best-practice slide order: problem, solution, market, product, business model, traction, team, financials, ask.',
          instructions: [
            'Follow standard pitch deck structure',
            'Keep slides concise and visual',
            'Include key metrics and traction data'
          ],
          examples: ['Series A pitch deck', 'Seed stage presentation'],
          commonMistakes: ['Too many slides', 'Weak traction data', 'Unclear ask']
        },
        {
          id: 'cap_table',
          name: 'Cap Table',
          description: 'Table showing current ownership, option pool, and dilution scenarios',
          required: true,
          format: 'xlsx',
          maxSize: '5MB',
          template: 'Cap table template with current ownership, option pool, and dilution scenarios for different funding rounds.',
          instructions: [
            'Show current ownership structure',
            'Include option pool and employee equity',
            'Model dilution scenarios for future rounds'
          ],
          examples: ['Pre-seed cap table', 'Series A cap table'],
          commonMistakes: ['Incorrect ownership percentages', 'Missing option pool', 'Not modeling dilution']
        }
      ],
      workflow: [
        {
          id: 'select_investor_type',
          description: 'Select investor type and funding stage'
        },
        {
          id: 'complete_investor_materials',
          description: 'Complete pitch deck and financial model'
        },
        {
          id: 'prepare_cap_table',
          description: 'Prepare cap table and ownership structure'
        },
        {
          id: 'investor_readiness_check',
          description: 'Run investor-specific readiness checker'
        },
        {
          id: 'submit_investor_package',
          description: 'Submit complete investor package'
        }
      ]
    },
    visa: {
      productType: 'submission',
      fundingType: 'visa',
      sections: [
        // Full standard sections plus visa-specific requirements
      ],
      additionalDocuments: [
        {
          id: 'business_plan',
          name: 'Business Plan',
          description: 'Complete business plan for visa application',
          required: true,
          format: 'docx',
          maxSize: '50MB',
          template: 'Visa business plan template with Austrian market focus, job creation plan, and economic benefits.',
          instructions: [
            'Emphasize Austrian market opportunities',
            'Detail job creation and economic benefits',
            'Include personal qualifications and experience'
          ],
          examples: ['Red-White-Red Card application', 'Startup visa business plan'],
          commonMistakes: ['Weak Austrian market focus', 'Unclear job creation plan', 'Missing personal qualifications']
        },
        {
          id: 'job_creation_plan',
          name: 'Job Creation Plan',
          description: 'Detailed plan for creating jobs in Austria',
          required: true,
          format: 'pdf',
          maxSize: '10MB',
          template: 'Job creation plan template with number of jobs, types, salaries, timeline, and recruitment strategy.',
          instructions: [
            'Specify number and types of jobs',
            'Detail salaries and benefits',
            'Provide realistic timeline and recruitment plan'
          ],
          examples: ['Tech startup job creation', 'Service business employment plan'],
          commonMistakes: ['Unrealistic job numbers', 'Unclear job descriptions', 'Missing recruitment strategy']
        },
        {
          id: 'proof_of_funds',
          name: 'Proof of Funds',
          description: 'Bank statements and investment commitments',
          required: true,
          format: 'pdf',
          maxSize: '20MB',
          template: 'Proof of funds template with bank statements, investment commitments, and financial capacity documentation.',
          instructions: [
            'Provide recent bank statements',
            'Include investment commitments',
            'Document financial capacity for business'
          ],
          examples: ['Bank statement template', 'Investment commitment letter'],
          commonMistakes: ['Insufficient funds documentation', 'Missing investment commitments', 'Unclear financial capacity']
        }
      ],
      workflow: [
        {
          id: 'select_visa_type',
          description: 'Select visa type and requirements'
        },
        {
          id: 'complete_visa_materials',
          description: 'Complete business plan and job creation plan'
        },
        {
          id: 'prepare_personal_docs',
          description: 'Prepare personal documents and qualifications'
        },
        {
          id: 'visa_readiness_check',
          description: 'Run visa-specific readiness checker'
        },
        {
          id: 'submit_visa_application',
          description: 'Submit complete visa application package'
        }
      ]
    }
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get product section configuration for a specific product and funding type
 */
export function getProductSection(productType: string, fundingType: string): ProductSection | undefined {
  const type = productType.toLowerCase();
  const funding = fundingType.toLowerCase();
  
  if (type === 'strategy' && PRODUCT_SECTION_TEMPLATES.strategy[funding as keyof typeof PRODUCT_SECTION_TEMPLATES.strategy]) {
    return PRODUCT_SECTION_TEMPLATES.strategy[funding as keyof typeof PRODUCT_SECTION_TEMPLATES.strategy];
  }
  
  if (type === 'review' && PRODUCT_SECTION_TEMPLATES.review[funding as keyof typeof PRODUCT_SECTION_TEMPLATES.review]) {
    return PRODUCT_SECTION_TEMPLATES.review[funding as keyof typeof PRODUCT_SECTION_TEMPLATES.review];
  }
  
  if (type === 'submission' && PRODUCT_SECTION_TEMPLATES.submission[funding as keyof typeof PRODUCT_SECTION_TEMPLATES.submission]) {
    return PRODUCT_SECTION_TEMPLATES.submission[funding as keyof typeof PRODUCT_SECTION_TEMPLATES.submission];
  }
  
  return undefined;
}

/**
 * Get workflow steps for a specific product and funding type
 */
export function getWorkflowSteps(productType: string, fundingType: string): WorkflowStep[] {
  const productSection = getProductSection(productType, fundingType);
  return productSection?.workflow || [];
}

/**
 * Get additional documents for a specific product and funding type
 */
export function getAdditionalDocuments(productType: string, fundingType: string): AdditionalDocument[] {
  const productSection = getProductSection(productType, fundingType);
  return productSection?.additionalDocuments || [];
}

/**
 * Question definitions for ProgramFinder
 */

import { QuestionDefinition } from '../types';

export const CORE_QUESTIONS: QuestionDefinition[] = [
  {
    id: 'funding_intent',
    label: 'Are you looking for a funding option for a project or venture?',
    type: 'single-select' as const,
    options: [
      { value: 'funding_yes', label: 'Yes, I want to find funding programs' },
      { value: 'planning_only', label: 'Not yet – I just need planning/editor help' },
    ],
    required: true,
    priority: 1,
    isAdvanced: false,
  },
  {
    id: 'organisation_type',
    label: 'What type of organisation are you?',
    type: 'single-select' as const,
    options: [
      { value: 'individual', label: 'Individual' },
      { value: 'startup', label: 'Startup / Company' },
      { value: 'established_sme', label: 'Established SME' },
      { value: 'other', label: 'Other' },
    ],
    required: true,
    priority: 2,
    hasOtherTextInput: true,
    isAdvanced: false,
    hasSubOptions: (value: string) => value === 'individual' || value === 'other',
    subOptions: {
      individual: [
        { value: 'no_company', label: 'No registered company yet' },
        { value: 'has_company', label: 'Already have a registered company' }
      ],
      other: [
        { value: 'association', label: 'Association' },
        { value: 'foundation', label: 'Foundation' },
        { value: 'cooperative', label: 'Cooperative' },
        { value: 'public_body', label: 'Public Body' },
        { value: 'research_institution', label: 'Research Institution' }
      ]
    }
  },
  {
    id: 'company_stage',
    label: 'What is your current project or company stage?',
    type: 'single-select' as const,
    options: [
      { value: 'idea', label: 'Idea (concept phase, no product yet)' },
      { value: 'MVP', label: 'Prototype / MVP (product in development)' },
      { value: 'revenue', label: 'First revenue (first paying customers)' },
      { value: 'growth', label: 'Growth / Scaling (established product(s), scaling revenues)' },
    ],
    required: true,
    priority: 2.5,
    isAdvanced: false,
  },
  {
    id: 'organisation_type_sub',
    label: 'Do you already have a registered company?',
    type: 'single-select' as const,
    options: [
      { value: 'no_company', label: 'No registered company yet' },
      { value: 'has_company', label: 'Already have a registered company' },
    ],
    required: true,
    priority: 2.1,
    isAdvanced: false,
    parentQuestion: 'organisation_type',
    parentValue: 'individual',
  },
  {
    id: 'legal_form',
    label: 'What is your legal form?',
    type: 'single-select' as const,
    options: [
      // Kapitalgesellschaften / Corporations
      { value: 'gmbh', label: 'GmbH — Gesellschaft mit beschränkter Haftung', group: 'corporations' },
      { value: 'ag', label: 'AG — Aktiengesellschaft', group: 'corporations' },
      { value: 'se', label: 'SE — Societas Europaea (Europäische Gesellschaft)', group: 'corporations' },
      { value: 'foreign_corp', label: 'Ausländische Kapitalgesellschaft / Foreign corporation', group: 'corporations' },
      { value: 'savings_bank', label: 'Sparkasse / Savings bank', group: 'corporations' },
      { value: 'mutual_insurance', label: 'Versicherungsverein auf Gegenseitigkeit (VVaG) / Mutual insurance association', group: 'corporations' },
      
      // Personengesellschaften & Hybridformen / Partnerships & Hybrid Forms
      { value: 'og', label: 'OG — Offene Gesellschaft / General Partnership (OG)', group: 'partnerships' },
      { value: 'kg', label: 'KG — Kommanditgesellschaft / Limited Partnership (KG)', group: 'partnerships' },
      { value: 'gmbh_co_kg', label: 'GmbH & Co. KG', group: 'partnerships' },
      { value: 'gesbr', label: 'GesbR — Gesellschaft nach bürgerlichem Recht / Civil-law partnership (GesbR)', group: 'partnerships' },
      { value: 'eeig', label: 'EWIV — Europäische wirtschaftliche Interessensvereinigung / European Economic Interest Grouping (EEIG)', group: 'partnerships' },
      { value: 'og_old', label: 'Offene Erwerbsgemeinschaft (vor 1.1.2007) / General partnership (founded before 1.1.2007)', group: 'partnerships' },
      { value: 'ohg_old', label: 'Offene Handelsgesellschaft (vor 1.1.2007) / Open trading partnership (founded before 1.1.2007)', group: 'partnerships' },
      { value: 'kg_old', label: 'Kommandit-Gesellschaft (vor 1.1.2007) / Limited partnership (founded before 1.1.2007)', group: 'partnerships' },
      
      // Einzelunternehmen / Sole Traders
      { value: 'sole_trader', label: 'Einzelunternehmen / Sole trader', group: 'sole_traders' },
      { value: 'unregistered_sole', label: 'Nicht protokollierter Einzelunternehmer / Unregistered sole trader', group: 'sole_traders' },
      { value: 'registered_sole', label: 'Protokollierter Einzelkaufmann (EKM) / Registered sole trader (EKM)', group: 'sole_traders' },
      { value: 'registered_company', label: 'Eingetragenes Unternehmen / Registered company', group: 'sole_traders' },
      
      // Special case
      { value: 'not_registered_yet', label: 'Not registered yet', group: 'special' },
      { value: 'foreign_entity', label: 'reco.options.legal_form.foreign_entity', group: 'special' },
    ],
    required: true,
    priority: 2.2,
    isAdvanced: false,
    hasGroups: true,
    hasOptionalTextField: (value: string) => value === 'foreign_entity',
  },
  {
    id: 'revenue_status',
    label: 'Revenue Status (Annual Turnover)',
    type: 'range' as const,
    min: 0,
    max: 10000000,
    step: 1000,
    unit: 'EUR',
    required: true,
    priority: 3,
    editableValue: true,
    isAdvanced: false,
    revenueRanges: [
      { min: 0, max: 0, label: 'Pre-Revenue', value: 'pre_revenue' },
      { min: 1, max: 250000, label: 'Low Revenue', value: 'low_revenue' },
      { min: 250001, max: 1000000, label: 'Early Revenue', value: 'early_revenue' },
      { min: 1000001, max: 10000000, label: 'Growth Revenue', value: 'growth_revenue' },
      { min: 10000001, max: 100000000, label: 'Established Revenue', value: 'established_revenue' }
    ],
  },
  {
    id: 'location',
    label: 'Where will the project or venture take place?',
    type: 'single-select' as const,
    options: [
      { value: 'austria', label: 'Austria' },
      { value: 'germany', label: 'Germany' },
      { value: 'eu', label: 'EU' },
      { value: 'international', label: 'International' },
    ],
    required: true,
    priority: 4,
    isAdvanced: false,
    hasOptionalRegion: (value: string) => {
      return value === 'austria' || value === 'germany' || value === 'eu' || value === 'international';
    },
  },
  {
    id: 'funding_amount',
    label: 'How much funding do you plan to request (if any)?',
    type: 'range' as const,
    min: 0,
    max: 1000000,
    step: 1000,
    unit: 'EUR',
    required: true,
    priority: 5,
    editableValue: true,
    isAdvanced: false,
  },
  {
    id: 'industry_focus',
    label: 'Which focus best describes your project?',
    type: 'multi-select' as const,
    options: [
      { value: 'digital', label: 'Digital & Software' },
      { value: 'sustainability', label: 'Climate & Sustainability' },
      { value: 'health', label: 'Health & Life Sciences' },
      { value: 'manufacturing', label: 'Manufacturing & Hardware' },
      { value: 'export', label: 'Internationalisation' },
      { value: 'other', label: 'Something else' },
    ],
    required: true,
    priority: 6,
    hasOtherTextInput: true,
    isAdvanced: false,
    subCategories: {
      digital: [
        { value: 'ai', label: 'AI & Machine Learning' },
        { value: 'fintech', label: 'FinTech' },
        { value: 'healthtech', label: 'HealthTech' },
        { value: 'edtech', label: 'EdTech' },
        { value: 'iot', label: 'IoT' },
        { value: 'blockchain', label: 'Blockchain' },
        { value: 'cybersecurity', label: 'Cybersecurity' },
        { value: 'cloud_computing', label: 'Cloud Computing' },
        { value: 'software_development', label: 'Software Development' },
      ],
      sustainability: [
        { value: 'greentech', label: 'GreenTech' },
        { value: 'cleantech', label: 'CleanTech' },
        { value: 'circular_economy', label: 'Circular Economy' },
        { value: 'renewable_energy', label: 'Renewable Energy' },
        { value: 'climate_tech', label: 'Climate Tech' },
        { value: 'waste_management', label: 'Waste Management' },
        { value: 'sustainable_agriculture', label: 'Sustainable Agriculture' },
      ],
      health: [
        { value: 'biotech', label: 'Biotech' },
        { value: 'medtech', label: 'MedTech' },
        { value: 'pharma', label: 'Pharmaceuticals' },
        { value: 'digital_health', label: 'Digital Health' },
        { value: 'medical_devices', label: 'Medical Devices' },
        { value: 'diagnostics', label: 'Diagnostics' },
        { value: 'therapeutics', label: 'Therapeutics' },
      ],
      manufacturing: [
        { value: 'industry_4_0', label: 'Industry 4.0' },
        { value: 'smart_manufacturing', label: 'Smart Manufacturing' },
        { value: 'robotics', label: 'Robotics' },
        { value: 'automation', label: 'Automation' },
        { value: 'additive_manufacturing', label: 'Additive Manufacturing (3D Printing)' },
        { value: 'advanced_materials', label: 'Advanced Materials' },
        { value: 'quality_control', label: 'Quality Control & Testing' },
      ],
      export: [
        { value: 'export_eu', label: 'EU Export' },
        { value: 'export_global', label: 'Global Export' },
        { value: 'export_services', label: 'Export Services' },
        { value: 'export_products', label: 'Export Products' },
        { value: 'export_technology', label: 'Export Technology' },
      ],
    },
  },
  {
    id: 'co_financing',
    label: 'Can your organisation contribute part of the project budget?',
    type: 'single-select' as const,
    options: [
      { value: 'co_yes', label: 'Yes, we can cover a share (e.g., 20%+)' },
      { value: 'co_no', label: 'No, we need full external funding' },
      { value: 'co_flexible', label: 'Flexible, depends on program' },
    ],
    required: true,
    priority: 7,
    hasCoFinancingPercentage: true,
    isAdvanced: false,
  },
  {
    id: 'use_of_funds',
    label: 'How will you invest support or funding?',
    type: 'multi-select' as const,
    options: [
      { value: 'product_development', label: 'Product development & R&D' },
      { value: 'hiring', label: 'Hiring & team growth' },
      { value: 'equipment', label: 'Equipment & infrastructure' },
      { value: 'marketing', label: 'Marketing & go-to-market' },
      { value: 'internationalization', label: 'International expansion' },
      { value: 'working_capital', label: 'Working capital' },
      { value: 'other', label: 'Other' },
    ],
    required: true,
    priority: 8,
    hasOtherTextInput: true,
    isAdvanced: false,
  },
];

export const ADVANCED_QUESTIONS: QuestionDefinition[] = [
  {
    id: 'deadline_urgency',
    label: 'When do you need a funding decision?',
    type: 'single-select' as const,
    options: [
      { value: '1_month', label: 'Within 1 month' },
      { value: '1_3_months', label: 'Within 1-3 months' },
      { value: '3_6_months', label: 'Within 3-6 months' },
      { value: '6_plus_months', label: '6+ months' },
    ],
    required: false,
    priority: 9,
    isAdvanced: true,
  },
  {
    id: 'impact_focus',
    label: 'Which impact areas apply?',
    type: 'multi-select' as const,
    options: [
      { value: 'environmental', label: 'Environmental / Climate' },
      { value: 'social', label: 'Social / Inclusion' },
      { value: 'regional', label: 'Regional development' },
      { value: 'research', label: 'Research & innovation' },
      { value: 'education', label: 'Education / Workforce' },
      { value: 'other', label: 'Other' },
    ],
    hasOtherTextInput: true,
    required: false,
    priority: 10,
    isAdvanced: true,
  },
];

export const ALL_QUESTIONS: QuestionDefinition[] = [...CORE_QUESTIONS, ...ADVANCED_QUESTIONS];

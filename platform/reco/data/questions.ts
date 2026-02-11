/**
 * Question definitions for ProgramFinder
 */

import { QuestionDefinition } from '../types';

export const CORE_QUESTIONS: QuestionDefinition[] = [
  {
    id: 'oneliner',
    label: 'reco.questions.oneliner',
    type: 'text' as const,
    placeholder: 'reco.questions.oneliner.placeholder',
    maxLength: 200,
    required: true,
    priority: 0,
    isAdvanced: false,
    helpText: 'reco.questions.oneliner.helpText',
  },
  {
    id: 'organisation_type',
    label: 'reco.questions.organisation_type',
    type: 'single-select' as const,
    options: [
      { value: 'individual', label: 'reco.options.organisation_type.individual' },
      { value: 'startup', label: 'reco.options.organisation_type.startup' },
      { value: 'established_sme', label: 'reco.options.organisation_type.established_sme' },
      { value: 'other', label: 'reco.options.organisation_type.other' },
    ],
    required: true,
    priority: 2,
    hasOtherTextInput: true,
    isAdvanced: false,
    hasSubOptions: (value: string) => value === 'individual' || value === 'other',
    subOptions: {
      individual: [
        { value: 'no_company', label: 'reco.options.organisation_type_sub.no_company' },
        { value: 'has_company', label: 'reco.options.organisation_type_sub.has_company' }
      ],
      other: [
        { value: 'association', label: 'reco.options.organisation_type_other.association' },
        { value: 'foundation', label: 'reco.options.organisation_type_other.foundation' },
        { value: 'cooperative', label: 'reco.options.organisation_type_other.cooperative' },
        { value: 'public_body', label: 'reco.options.organisation_type_other.public_body' },
        { value: 'research_institution', label: 'reco.options.organisation_type_other.research_institution' }
      ]
    }
  },
  {
    id: 'company_stage',
    label: 'reco.questions.company_stage',
    type: 'single-select' as const,
    options: [
      { value: 'idea', label: 'reco.options.company_stage.idea' },
      { value: 'MVP', label: 'reco.options.company_stage.MVP' },
      { value: 'revenue', label: 'reco.options.company_stage.revenue' },
      { value: 'growth', label: 'reco.options.company_stage.growth' },
    ],
    required: true,
    priority: 2.5,
    isAdvanced: false,
  },
  {
    id: 'organisation_type_sub',
    label: 'reco.questions.organisation_type_sub',
    type: 'single-select' as const,
    options: [
      { value: 'no_company', label: 'reco.options.organisation_type_sub.no_company' },
      { value: 'has_company', label: 'reco.options.organisation_type_sub.has_company' },
    ],
    required: true,
    priority: 2.1,
    isAdvanced: false,
    parentQuestion: 'organisation_type',
    parentValue: 'individual',
  },
  {
    id: 'legal_form',
    label: 'reco.questions.legal_form',
    type: 'single-select' as const,
    options: [
      // Kapitalgesellschaften / Corporations
      { value: 'gmbh', label: 'reco.options.legal_form.gmbh', group: 'corporations' },
      { value: 'ag', label: 'reco.options.legal_form.ag', group: 'corporations' },
      { value: 'se', label: 'reco.options.legal_form.se', group: 'corporations' },
      { value: 'foreign_corp', label: 'reco.options.legal_form.foreign_corp', group: 'corporations' },
      { value: 'savings_bank', label: 'reco.options.legal_form.savings_bank', group: 'corporations' },
      { value: 'mutual_insurance', label: 'reco.options.legal_form.mutual_insurance', group: 'corporations' },
      
      // Personengesellschaften & Hybridformen / Partnerships & Hybrid Forms
      { value: 'og', label: 'reco.options.legal_form.og', group: 'partnerships' },
      { value: 'kg', label: 'reco.options.legal_form.kg', group: 'partnerships' },
      { value: 'gmbh_co_kg', label: 'reco.options.legal_form.gmbh_co_kg', group: 'partnerships' },
      { value: 'gesbr', label: 'reco.options.legal_form.gesbr', group: 'partnerships' },
      { value: 'eeig', label: 'reco.options.legal_form.eeig', group: 'partnerships' },
      { value: 'og_old', label: 'reco.options.legal_form.og_old', group: 'partnerships' },
      { value: 'ohg_old', label: 'reco.options.legal_form.ohg_old', group: 'partnerships' },
      { value: 'kg_old', label: 'reco.options.legal_form.kg_old', group: 'partnerships' },
      
      // Einzelunternehmen / Sole Traders
      { value: 'sole_trader', label: 'reco.options.legal_form.sole_trader', group: 'sole_traders' },
      { value: 'unregistered_sole', label: 'reco.options.legal_form.unregistered_sole', group: 'sole_traders' },
      { value: 'registered_sole', label: 'reco.options.legal_form.registered_sole', group: 'sole_traders' },
      { value: 'registered_company', label: 'reco.options.legal_form.registered_company', group: 'sole_traders' },
      
      // Special case
      { value: 'not_registered_yet', label: 'reco.options.legal_form.not_registered_yet', group: 'special' },
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
    label: 'reco.questions.revenue_status',
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
      { min: 0, max: 0, label: 'reco.options.revenue_status.pre_revenue', value: 'pre_revenue' },
      { min: 1, max: 250000, label: 'reco.options.revenue_status.low_revenue', value: 'low_revenue' },
      { min: 250001, max: 1000000, label: 'reco.options.revenue_status.early_revenue', value: 'early_revenue' },
      { min: 1000001, max: 10000000, label: 'reco.options.revenue_status.growth_revenue', value: 'growth_revenue' },
      { min: 10000001, max: 100000000, label: 'reco.options.revenue_status.established_revenue', value: 'established_revenue' }
    ],
  },
  {
    id: 'location',
    label: 'reco.questions.location',
    type: 'single-select' as const,
    options: [
      { value: 'austria', label: 'reco.options.location.austria' },
      { value: 'germany', label: 'reco.options.location.germany' },
      { value: 'eu', label: 'reco.options.location.eu' },
      { value: 'international', label: 'reco.options.location.international' },
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
    label: 'reco.questions.funding_amount',
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
    label: 'reco.questions.industry_focus',
    type: 'multi-select' as const,
    options: [
      { value: 'digital', label: 'reco.options.industry_focus.digital' },
      { value: 'sustainability', label: 'reco.options.industry_focus.sustainability' },
      { value: 'health', label: 'reco.options.industry_focus.health' },
      { value: 'manufacturing', label: 'reco.options.industry_focus.manufacturing' },
      { value: 'export', label: 'reco.options.industry_focus.export' },
      { value: 'other', label: 'reco.options.industry_focus.other' },
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
    label: 'reco.questions.co_financing',
    type: 'single-select' as const,
    options: [
      { value: 'co_yes', label: 'reco.options.co_financing.co_yes' },
      { value: 'co_no', label: 'reco.options.co_financing.co_no' },
      { value: 'co_flexible', label: 'reco.options.co_financing.co_flexible' },
    ],
    required: false,
    priority: 7,
    hasCoFinancingPercentage: true,
    isAdvanced: false,
  },
  {
    id: 'use_of_funds',
    label: 'reco.questions.use_of_funds',
    type: 'multi-select' as const,
    options: [
      { value: 'product_development', label: 'reco.options.use_of_funds.product_development' },
      { value: 'hiring', label: 'reco.options.use_of_funds.hiring' },
      { value: 'equipment', label: 'reco.options.use_of_funds.equipment' },
      { value: 'marketing', label: 'reco.options.use_of_funds.marketing' },
      { value: 'internationalization', label: 'reco.options.use_of_funds.internationalization' },
      { value: 'working_capital', label: 'reco.options.use_of_funds.working_capital' },
      { value: 'other', label: 'reco.options.use_of_funds.other' },
    ],
    required: false,
    priority: 8,
    hasOtherTextInput: true,
    isAdvanced: false,
  },
];

export const ADVANCED_QUESTIONS: QuestionDefinition[] = [];

export const ALL_QUESTIONS: QuestionDefinition[] = [...CORE_QUESTIONS, ...ADVANCED_QUESTIONS];

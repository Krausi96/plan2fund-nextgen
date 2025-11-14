// ========= BASIS PACK - FUNDING TYPES & TARGET GROUPS =========
// Central definitions for funding types, target groups, and related data structures

export type FundingType = 'grants' | 'bankLoans' | 'equity' | 'visa';
export type TargetGroup = 'startups' | 'sme' | 'advisors' | 'universities' | 'default';
export type Product = 'strategy' | 'review' | 'submission';

// Funding pack structure
export interface FundingPack {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  included: string[];
  youProvide: string[];
  addons: string[];
  fundingType: FundingType;
  targetGroup: TargetGroup;
  product: Product;
}

// Document specification structure
export interface DocSpec {
  id: string;
  name: string;
  description: string;
  purpose?: string;
  formatLength?: string;
  customization?: string;
  limits?: string;
  coreSections: Array<{
    title: string;
    description: string;
    required: boolean;
  }>;
  inputs: Array<{
    name: string;
    type: string;
    description: string;
    required: boolean;
  }>;
  outputs: Array<{
    name: string;
    format: string;
    description: string;
  }>;
  complianceChecklist: Array<{
    item: string;
    description: string;
    required: boolean;
  }>;
  fundingTypes: FundingType[];
  estimatedTime: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

// Addon structure
export interface Addon {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  fundingTypes: FundingType[];
  features: string[];
  scope?: string;
  deliverables?: string;
  turnaround?: string;
}

// Mock data for development
export const mockFundingPacks: Record<string, FundingPack> = {
  'grants-startups-strategy': {
    id: 'grants-startups-strategy',
    name: 'Grant Strategy Pack',
    description: 'Complete grant application strategy for startups',
    price: 299,
    currency: 'EUR',
    included: ['business-plan', 'financial-projections', 'market-analysis'],
    youProvide: ['company-details', 'financial-data', 'team-info'],
    addons: ['ai-review', 'expert-consultation'],
    fundingType: 'grants',
    targetGroup: 'startups',
    product: 'strategy'
  },
  'equity-sme-review': {
    id: 'equity-sme-review',
    name: 'Equity Review Pack',
    description: 'Investor-ready business plan review for SMEs',
    price: 499,
    currency: 'EUR',
    included: ['pitch-deck', 'financial-model', 'due-diligence'],
    youProvide: ['existing-plan', 'financial-statements', 'market-data'],
    addons: ['investor-matching', 'pitch-coaching'],
    fundingType: 'equity',
    targetGroup: 'sme',
    product: 'review'
  }
};

export const mockDocSpecs: Record<string, DocSpec> = {
  'business-plan': {
    id: 'business-plan',
    name: 'Business Plan',
    description: 'Comprehensive business plan document',
    purpose: 'To present your business idea to investors and funding agencies',
    formatLength: '15-30 pages',
    customization: 'Fully customizable based on your industry and funding type',
    limits: 'No specific limits, but recommended to stay within 30 pages',
    coreSections: [
      { title: 'Executive Summary', description: 'Overview of the business', required: true },
      { title: 'Market Analysis', description: 'Target market and competition', required: true },
      { title: 'Financial Projections', description: 'Revenue and cost forecasts', required: true }
    ],
    inputs: [
      { name: 'Company Information', type: 'text', description: 'Basic company details', required: true },
      { name: 'Financial Data', type: 'file', description: 'Historical financial statements', required: true }
    ],
    outputs: [
      { name: 'PDF Document', format: 'PDF', description: 'Formatted business plan' },
      { name: 'Word Document', format: 'DOCX', description: 'Editable business plan' }
    ],
    complianceChecklist: [
      { item: 'All sections completed', description: 'Every required section is filled', required: true },
      { item: 'Financial data verified', description: 'Numbers are accurate and realistic', required: true }
    ],
    fundingTypes: ['grants', 'bankLoans', 'equity'],
    estimatedTime: '2-4 weeks',
    difficulty: 'medium'
  }
};

export const mockAddons: Addon[] = [
  {
    id: 'ai-review',
    name: 'AI Review',
    description: 'AI-powered document review and suggestions',
    price: 99,
    currency: 'EUR',
    fundingTypes: ['grants', 'bankLoans', 'equity', 'visa'],
    features: ['grammar-check', 'content-suggestions', 'compliance-check'],
    scope: 'Complete document review and optimization',
    deliverables: 'Detailed feedback report with actionable suggestions',
    turnaround: '24-48 hours'
  },
  {
    id: 'expert-consultation',
    name: 'Expert Consultation',
    description: '1-hour consultation with funding expert',
    price: 199,
    currency: 'EUR',
    fundingTypes: ['grants', 'equity'],
    features: ['strategy-review', 'q-and-a', 'personalized-advice'],
    scope: 'One-on-one consultation session',
    deliverables: 'Personalized strategy recommendations',
    turnaround: 'Scheduled within 1 week'
  }
];

// Helper functions
export function getFundingPack(targetGroup: TargetGroup, fundingType: FundingType, product: Product): FundingPack {
  const key = `${fundingType}-${targetGroup}-${product}`;
  return mockFundingPacks[key] || mockFundingPacks['grants-startups-strategy'];
}

export function getDocSpec(docId: string): DocSpec {
  return mockDocSpecs[docId] || mockDocSpecs['business-plan'];
}

export function getAddonsForFundingType(fundingType: FundingType): Addon[] {
  return mockAddons.filter(addon => addon.fundingTypes.includes(fundingType));
}

export function getAddonSpec(addonId: string): Addon | undefined {
  return mockAddons.find(addon => addon.id === addonId);
}

// Re-export types for convenience (avoid conflicts by using different names)
export type { Product as PlanProduct } from '@/shared/types/plan';
export type { TargetGroup as DetectionTargetGroup } from '@/shared/user/segmentation';

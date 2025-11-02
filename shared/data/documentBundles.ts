// ========= PLAN2FUND — DOCUMENT BUNDLES =========
// Structured mapping of documents by product and funding type
// Now uses BASIS PACK as single source of truth

import { DocumentDescription, getDocumentById } from './documentDescriptions';
import { getFundingPack, type Product, type FundingType, type TargetGroup } from './basisPack';

// Re-export types from basisPack for backward compatibility
export type { Product, FundingType };

export interface DocumentBundle {
  product: Product;
  fundingType: FundingType;
  documents: string[]; // Document IDs
  description: string;
  i18nKey: string;
}

// Document bundles by product and funding type
export const documentBundles: Record<Product, Record<FundingType, DocumentBundle>> = {
  strategy: {
    grants: {
      product: 'strategy',
      fundingType: 'grants',
      documents: ['businessModelCanvas', 'goToMarketStrategy', 'fundingMatchSummary'],
      description: '3 documents: Business Model Canvas, Go-to-Market Strategy, and Funding Fit Summary',
      i18nKey: 'bundles.strategy.grants'
    },
    bankLoans: {
      product: 'strategy',
      fundingType: 'bankLoans',
      documents: ['businessModelCanvas', 'goToMarketStrategy', 'fundingMatchSummary'],
      description: '3 documents: Business Model Canvas, Go-to-Market Strategy, and Funding Fit Summary',
      i18nKey: 'bundles.strategy.bankLoans'
    },
    equity: {
      product: 'strategy',
      fundingType: 'equity',
      documents: ['businessModelCanvas', 'goToMarketStrategy', 'fundingMatchSummary'],
      description: '3 documents: Business Model Canvas, Go-to-Market Strategy, and Funding Fit Summary',
      i18nKey: 'bundles.strategy.equity'
    },
    visa: {
      product: 'strategy',
      fundingType: 'visa',
      documents: ['businessModelCanvas', 'goToMarketStrategy', 'fundingMatchSummary'],
      description: '3 documents: Business Model Canvas, Go-to-Market Strategy, and Funding Fit Summary',
      i18nKey: 'bundles.strategy.visa'
    }
  },
  review: {
    grants: {
      product: 'review',
      fundingType: 'grants',
      documents: ['reviewedBusinessPlan', 'complianceNotes'],
      description: '2 documents: Reviewed & Revised Business Plan and Compliance Notes',
      i18nKey: 'bundles.review.grants'
    },
    bankLoans: {
      product: 'review',
      fundingType: 'bankLoans',
      documents: ['reviewedBusinessPlan', 'complianceNotes'],
      description: '2 documents: Reviewed & Revised Business Plan and Compliance Notes',
      i18nKey: 'bundles.review.bankLoans'
    },
    equity: {
      product: 'review',
      fundingType: 'equity',
      documents: ['reviewedBusinessPlan', 'complianceNotes'],
      description: '2 documents: Reviewed & Revised Business Plan and Compliance Notes',
      i18nKey: 'bundles.review.equity'
    },
    visa: {
      product: 'review',
      fundingType: 'visa',
      documents: ['reviewedBusinessPlan', 'complianceNotes'],
      description: '2 documents: Reviewed & Revised Business Plan and Compliance Notes',
      i18nKey: 'bundles.review.visa'
    }
  },
  submission: {
    grants: {
      product: 'submission',
      fundingType: 'grants',
      documents: ['businessPlan', 'workPlanGantt', 'budgetSheet', 'founderCV', 'annexGuidance'],
      description: '5-6 documents: Full business plan, work plan & Gantt, budget sheet, CV, and guidance',
      i18nKey: 'bundles.submission.grants'
    },
    bankLoans: {
      product: 'submission',
      fundingType: 'bankLoans',
      documents: ['businessPlan', 'financialModel3to5y', 'bankSummaryOnePager', 'amortizationSchedule', 'collateralSheet'],
      description: '5 documents: Business plan, financial model, bank summary, amortization schedule, and collateral sheet',
      i18nKey: 'bundles.submission.bankLoans'
    },
    equity: {
      product: 'submission',
      fundingType: 'equity',
      documents: ['businessPlan', 'investorTeaserOnePager', 'pitchDeck', 'financialModel3to5y', 'capTable'],
      description: '5 documents: Business plan, investor teaser, pitch deck, financial model, and cap table',
      i18nKey: 'bundles.submission.equity'
    },
    visa: {
      product: 'submission',
      fundingType: 'visa',
      documents: ['visaBusinessPlan', 'founderCV', 'visaEvidenceChecklist'],
      description: '3-4 documents: Visa business plan, founder CV, and evidence checklist',
      i18nKey: 'bundles.submission.visa'
    }
  }
};

// Optional documents that can be added to any bundle
export const optionalDocuments: Record<FundingType, string[]> = {
  grants: ['pitchOutline'],
  bankLoans: [],
  equity: [],
  visa: ['talkingPoints']
};

// Helper function to get document bundle
export function getDocumentBundle(product: Product, fundingType: FundingType): DocumentBundle {
  return documentBundles[product][fundingType];
}

// Helper function to get all documents for a bundle with descriptions
export function getBundleDocuments(product: Product, fundingType: FundingType): DocumentDescription[] {
  const bundle = getDocumentBundle(product, fundingType);
  const documents = bundle.documents.map(id => getDocumentById(id)).filter(Boolean) as DocumentDescription[];
  
  // Add optional documents
  const optional = optionalDocuments[fundingType].map(id => getDocumentById(id)).filter(Boolean) as DocumentDescription[];
  
  return [...documents, ...optional];
}

// Helper function to get document count by product and funding type
export function getDocumentCount(product: Product, fundingType: FundingType): { required: number; optional: number } {
  const bundle = getDocumentBundle(product, fundingType);
  const optional = optionalDocuments[fundingType];
  
  return {
    required: bundle.documents.length,
    optional: optional.length
  };
}

// Helper function to get all funding types for a product
export function getFundingTypesForProduct(product: Product): FundingType[] {
  return Object.keys(documentBundles[product]) as FundingType[];
}

// Helper function to get all products for a funding type
export function getProductsForFundingType(fundingType: FundingType): Product[] {
  return Object.keys(documentBundles).filter(product => 
    documentBundles[product as Product][fundingType]
  ) as Product[];
}

// ========= BASIS PACK INTEGRATION =========
// New functions that use BASIS PACK as single source of truth

// Get document bundle from BASIS PACK
export function getBasisPackBundle(
  targetGroup: TargetGroup,
  fundingType: FundingType,
  product: Product
): DocumentBundle | null {
  const fundingPack = getFundingPack(targetGroup, fundingType, product);
  if (!fundingPack) return null;
  
  return {
    product: fundingPack.product,
    fundingType: fundingPack.fundingType,
    documents: fundingPack.included,
    description: fundingPack.description,
    i18nKey: `bundles.${product}.${fundingType}`
  };
}

// Get all funding packs for a target group
export function getFundingPacksForTargetGroup(_targetGroup: TargetGroup) {
  return Object.values(documentBundles).flat().filter(_bundle => {
    // This would need to be enhanced to filter by target group
    // For now, return all bundles
    return true;
  });
}

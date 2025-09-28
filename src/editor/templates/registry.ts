// ========= PLAN2FUND — TEMPLATES REGISTRY =========
// Template definitions and mapping for Strategy, Submission, and Review

import { Route } from '../../types/plan';

export type Template = {
  id: 'strategy'|'submission'|'review',
  name: string,
  sections: Array<{ 
    key: string, 
    title: string, 
    guidance?: string, 
    minTokens?: number, 
    requiredTables?: string[] 
  }>,
  outlineOrder?: string[],
  routeVariants?: Partial<Record<Route, Partial<Template>>>,
  mappingFromStrategy?: Record<string, string>  // srcKey → destSectionKey
};

export const TEMPLATES: Record<'strategy'|'submission'|'review', Template> = {
  strategy: {
    id: 'strategy',
    name: 'Strategy Document (BMC + GTM)',
    sections: [
      { key: 'bmcCustomerSegments',     title: 'Customer Segments' },
      { key: 'bmcValueProposition',     title: 'Value Proposition' },
      { key: 'bmcChannels',             title: 'Channels' },
      { key: 'bmcCustomerRelationships',title: 'Customer Relationships' },
      { key: 'bmcRevenueStreams',       title: 'Revenue Streams' },
      { key: 'bmcKeyResources',         title: 'Key Resources' },
      { key: 'bmcKeyActivities',        title: 'Key Activities' },
      { key: 'bmcKeyPartnerships',      title: 'Key Partnerships' },
      { key: 'bmcCostStructure',        title: 'Cost Structure' },
      { key: 'gtmTargetMarket',         title: 'Target Market' },
      { key: 'gtmPricing',              title: 'Pricing' },
      { key: 'gtmPromotion',            title: 'Promotion' },
      { key: 'gtmDistributionChannels', title: 'Distribution Channels' },
      { key: 'gtmSalesTactics',         title: 'Sales Tactics' },
      { key: 'unitEconomicsSimple',     title: 'Unit Economics' },
      { key: 'milestones',              title: 'Milestones' }
    ],
    mappingFromStrategy: {
      bmcCustomerSegments: 'marketTargetCustomers',
      bmcValueProposition: 'problemSolution',
      bmcChannels: 'gtmChannels',
      bmcCustomerRelationships: 'gtmRetentionService',
      bmcRevenueStreams: 'financialsRevenueModel',
      bmcKeyResources: 'operationsResources',
      bmcKeyActivities: 'operationsExecution',
      bmcKeyPartnerships: 'partnerships',
      bmcCostStructure: 'financialsCostStructure',
      gtmTargetMarket: 'marketTargetCustomers',
      gtmPricing: 'gtmPricing',
      gtmPromotion: 'gtmPromotion',
      gtmDistributionChannels: 'gtmChannels',
      gtmSalesTactics: 'gtmSalesTactics',
      unitEconomicsSimple: 'financialsUnitEconomics',
      milestones: 'roadmapMilestones'
    }
  },

  submission: {
    id: 'submission',
    name: 'Submission-Ready Business Plan',
    sections: [
      { key: 'execSummary',        title: 'Executive Summary' },
      { key: 'problemSolution',    title: 'Problem & Solution' },
      { key: 'productOverview',    title: 'Product/Operations' },
      { key: 'companyTeam',        title: 'Company & Team' },
      { key: 'marketCompetition',  title: 'Market & Competition' },
      { key: 'gtmStrategy',        title: 'Go-to-Market' },
      { key: 'financials',         title: 'Financials', requiredTables: ['revenue','costs','cashflow','useOfFunds'] },
      { key: 'risksMitigation',    title: 'Risks & Mitigation' },
      { key: 'annexNotes',         title: 'Annex Guidance' }
    ],
    routeVariants: {
      grant:  { sections: [{ key: 'workPackagesTimeline', title: 'Work Packages & Timeline' }] },
      bank:   { sections: [{ key: 'bankSummaryPage',      title: 'Bank Summary (Ratios & Repayment)' }] },
      equity: { sections: [{ key: 'investorTeaser',       title: 'Investor Teaser One-Pager' },
                           { key: 'capTableBasic',        title: 'Basic Cap Table' }] },
      visa:   { sections: [{ key: 'visaAnnex',            title: 'Visa Annex Guidance' }] },
      ams:    { sections: [{ key: 'amsAnnex',             title: 'AMS Annex Guidance' }] }
    }
  },

  review: {
    id: 'review',
    name: 'Update & Review',
    sections: [],  // inherit from submission at runtime
  }
};

// Runtime template building functions
export function buildRouteTemplate(template: Template, route: Route): Template {
  const routeVariants = template.routeVariants?.[route];
  if (!routeVariants) return template;
  
  return {
    ...template,
    sections: [
      ...template.sections,
      ...(routeVariants.sections || [])
    ]
  };
}

export function buildReviewTemplate(submissionTemplate: Template): Template {
  return {
    ...submissionTemplate,
    id: 'review',
    name: 'Update & Review',
    sections: submissionTemplate.sections.map(section => ({
      ...section,
      guidance: 'Paste your existing text here for review and improvement'
    }))
  };
}


export function upgradeStrategyToSubmission(strategySections: any[], mapping: Record<string, string>): any[] {
  const submissionSections: any[] = [];
  
  for (const strategySection of strategySections) {
    const destKey = mapping[strategySection.key];
    if (destKey) {
      submissionSections.push({
        ...strategySection,
        key: destKey,
        status: 'needs_fix' // Mark as needs review after upgrade
      });
    }
  }
  
  return submissionSections;
}

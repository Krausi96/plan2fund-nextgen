export interface RouteExtra {
  id: string;
  name: string;
  description: string;
  appliesTo: string[]; // plan types: 'strategy', 'review', 'custom'
  appliesToRoutes: string[]; // specific routes: 'aws', 'ffg', 'wirtschaftsagentur', 'eu', 'bank', 'visa', 'equity'
  template?: string; // template/section reference
  userAttachment?: string; // what user must still attach
}

export const ROUTE_EXTRAS: RouteExtra[] = [
  {
    id: 'budget_sheet',
    name: 'Budget / planning sheet',
    description: 'Detailed financial planning and budget breakdown',
    appliesTo: ['review', 'custom'],
    appliesToRoutes: ['aws', 'ffg', 'wirtschaftsagentur', 'eu', 'bank', 'visa', 'equity'],
    template: 'Financial planning template',
    userAttachment: 'Supporting financial documents'
  },
  {
    id: 'work_packages',
    name: 'Work packages & timeline',
    description: 'Project work packages with detailed timeline',
    appliesTo: ['review', 'custom'],
    appliesToRoutes: ['aws', 'ffg', 'wirtschaftsagentur', 'eu'],
    template: 'Project timeline template',
    userAttachment: 'Project management documents'
  },
  {
    id: 'annex_guidance',
    name: 'Annex guidance (CVs, market evidence)',
    description: 'Guidance for required annexes and supporting documents',
    appliesTo: ['review', 'custom'],
    appliesToRoutes: ['aws', 'ffg', 'wirtschaftsagentur', 'eu', 'bank', 'visa', 'equity'],
    template: 'Annex checklist template',
    userAttachment: 'CVs, market research, legal documents'
  },
  {
    id: 'bank_summary',
    name: 'Bank summary page (ratios & repayment)',
    description: 'Financial ratios and repayment analysis for banking applications',
    appliesTo: ['review', 'custom'],
    appliesToRoutes: ['bank', 'visa'],
    template: 'Bank summary template',
    userAttachment: 'Bank statements, financial records'
  },
  {
    id: 'investor_teaser',
    name: 'Investor teaser one-pager & basic cap table',
    description: 'Investor presentation and capitalization table',
    appliesTo: ['review', 'custom'],
    appliesToRoutes: ['equity'],
    template: 'Investor teaser template',
    userAttachment: 'Legal incorporation documents'
  }
];

export function getRouteExtrasForPlan(planType: string, selectedRoute?: string): RouteExtra[] {
  return ROUTE_EXTRAS.filter(extra => 
    extra.appliesTo.includes(planType) && 
    (!selectedRoute || extra.appliesToRoutes.includes(selectedRoute))
  );
}

export function getRouteExtrasForExport(planType: string, selectedRoute?: string): RouteExtra[] {
  // Only return extras that would actually be generated/rendered
  return getRouteExtrasForPlan(planType, selectedRoute);
}

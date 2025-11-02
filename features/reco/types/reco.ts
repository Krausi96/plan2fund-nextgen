// ========= PLAN2FUND — RECO TYPES =========
// Recommendation engine and program profile types

import { Route } from '@/shared/types/plan';

export type ProgramProfile = {
  programId: string,
  route: Route,
  required?: {
    sections?: Array<{ key: string, minTokens?: number }>,
    tables?: Array<'revenue'|'costs'|'cashflow'|'useOfFunds'>,
    annexes?: Array<'cvs'|'marketEvidence'|'forms'>
  },
  reviewerOrder?: string[],        // optional override of section order
  toneHints?: Array<'formal'|'concise'>
};

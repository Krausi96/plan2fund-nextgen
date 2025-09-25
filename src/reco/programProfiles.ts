// ========= PLAN2FUND — PROGRAM PROFILES =========
// Structured program profiles for readiness evaluation and editor integration

import { ProgramProfile } from '../types/reco';
import { Route } from '../types/plan';

export const PROGRAM_PROFILES: Record<string, ProgramProfile> = {
  // Grant programs
  'aws-grant': {
    programId: 'aws-grant',
    route: 'grant',
    required: {
      sections: [
        { key: 'execSummary', minTokens: 200 },
        { key: 'problemSolution', minTokens: 300 },
        { key: 'productOverview', minTokens: 400 },
        { key: 'marketCompetition', minTokens: 300 },
        { key: 'financials', minTokens: 500 }
      ],
      tables: ['revenue', 'costs', 'useOfFunds'],
      annexes: ['cvs', 'marketEvidence']
    },
    reviewerOrder: ['execSummary', 'problemSolution', 'productOverview', 'marketCompetition', 'financials', 'risksMitigation'],
    toneHints: ['formal']
  },
  
  'ffg-grant': {
    programId: 'ffg-grant',
    route: 'grant',
    required: {
      sections: [
        { key: 'execSummary', minTokens: 250 },
        { key: 'problemSolution', minTokens: 400 },
        { key: 'productOverview', minTokens: 500 },
        { key: 'marketCompetition', minTokens: 400 },
        { key: 'financials', minTokens: 600 }
      ],
      tables: ['revenue', 'costs', 'cashflow', 'useOfFunds'],
      annexes: ['cvs', 'marketEvidence', 'forms']
    },
    reviewerOrder: ['execSummary', 'problemSolution', 'productOverview', 'marketCompetition', 'financials', 'risksMitigation'],
    toneHints: ['formal', 'concise']
  },

  // Bank/Loan programs
  'bank-loan': {
    programId: 'bank-loan',
    route: 'bank',
    required: {
      sections: [
        { key: 'execSummary', minTokens: 200 },
        { key: 'companyTeam', minTokens: 300 },
        { key: 'marketCompetition', minTokens: 300 },
        { key: 'financials', minTokens: 800 }
      ],
      tables: ['revenue', 'costs', 'cashflow'],
      annexes: ['cvs']
    },
    reviewerOrder: ['execSummary', 'companyTeam', 'marketCompetition', 'financials', 'risksMitigation'],
    toneHints: ['formal']
  },

  // Equity programs
  'equity-investor': {
    programId: 'equity-investor',
    route: 'equity',
    required: {
      sections: [
        { key: 'execSummary', minTokens: 300 },
        { key: 'problemSolution', minTokens: 400 },
        { key: 'marketCompetition', minTokens: 500 },
        { key: 'gtmStrategy', minTokens: 400 },
        { key: 'financials', minTokens: 600 }
      ],
      tables: ['revenue', 'costs', 'cashflow', 'useOfFunds'],
      annexes: ['cvs', 'marketEvidence']
    },
    reviewerOrder: ['execSummary', 'problemSolution', 'marketCompetition', 'gtmStrategy', 'financials', 'risksMitigation'],
    toneHints: ['concise']
  },

  // Visa programs
  'visa-rwr': {
    programId: 'visa-rwr',
    route: 'visa',
    required: {
      sections: [
        { key: 'execSummary', minTokens: 200 },
        { key: 'companyTeam', minTokens: 400 },
        { key: 'productOverview', minTokens: 300 },
        { key: 'financials', minTokens: 400 }
      ],
      tables: ['revenue', 'costs'],
      annexes: ['cvs', 'forms']
    },
    reviewerOrder: ['execSummary', 'companyTeam', 'productOverview', 'financials', 'risksMitigation'],
    toneHints: ['formal']
  },

  // AMS programs
  'ams-startup': {
    programId: 'ams-startup',
    route: 'ams',
    required: {
      sections: [
        { key: 'execSummary', minTokens: 200 },
        { key: 'problemSolution', minTokens: 300 },
        { key: 'marketCompetition', minTokens: 300 },
        { key: 'financials', minTokens: 500 }
      ],
      tables: ['revenue', 'costs', 'useOfFunds'],
      annexes: ['cvs', 'marketEvidence']
    },
    reviewerOrder: ['execSummary', 'problemSolution', 'marketCompetition', 'financials', 'risksMitigation'],
    toneHints: ['formal']
  }
};

export function getProgramProfile(programId: string): ProgramProfile | null {
  return PROGRAM_PROFILES[programId] || null;
}

export function getProfilesByRoute(route: Route): ProgramProfile[] {
  return Object.values(PROGRAM_PROFILES).filter(profile => profile.route === route);
}

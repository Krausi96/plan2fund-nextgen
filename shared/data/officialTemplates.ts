// ========= PLAN2FUND — OFFICIAL TEMPLATES DATA =========
// Official funding application templates from various agencies

export interface TemplateConfig {
  id: string;
  name: string;
  agency: string;
  description: string;
  sections: string[];
  formatting: {
    fontFamily: string;
    fontSize: number;
    lineSpacing: number;
    margins: {
      top: number;
      bottom: number;
      left: number;
      right: number;
    };
    headerStyle: 'formal' | 'modern' | 'minimal';
    tone: 'formal' | 'enthusiastic' | 'technical' | 'conversational';
    language: 'en' | 'de';
    pageNumbers: boolean;
    tableOfContents: boolean;
  };
  isOfficial: boolean;
  industry?: string;
}

export const OFFICIAL_TEMPLATES: TemplateConfig[] = [
  {
    id: 'bmbf-standard',
    name: 'BMBF Standard Template',
    agency: 'BMBF (Germany)',
    description: 'Official BMBF funding application template',
    sections: ['execSummary', 'projectDescription', 'methodology', 'timeline', 'budget', 'team'],
    formatting: {
      fontFamily: 'Arial',
      fontSize: 12,
      lineSpacing: 1.5,
      margins: { top: 2.5, bottom: 2.5, left: 2.5, right: 2.5 },
      headerStyle: 'formal',
      tone: 'formal',
      language: 'de',
      pageNumbers: true,
      tableOfContents: true
    },
    isOfficial: true
  },
  {
    id: 'horizon-europe',
    name: 'Horizon Europe Template',
    agency: 'European Commission',
    description: 'EU Horizon Europe project proposal template',
    sections: ['execSummary', 'excellence', 'impact', 'implementation', 'budget'],
    formatting: {
      fontFamily: 'Calibri',
      fontSize: 11,
      lineSpacing: 1.15,
      margins: { top: 2.0, bottom: 2.0, left: 2.0, right: 2.0 },
      headerStyle: 'modern',
      tone: 'technical',
      language: 'en',
      pageNumbers: true,
      tableOfContents: true
    },
    isOfficial: true
  },
  {
    id: 'sba-loan',
    name: 'SBA Loan Application',
    agency: 'Small Business Administration (US)',
    description: 'SBA loan application business plan template',
    sections: ['execSummary', 'businessDescription', 'marketAnalysis', 'financialProjections', 'management'],
    formatting: {
      fontFamily: 'Times New Roman',
      fontSize: 12,
      lineSpacing: 1.5,
      margins: { top: 1.0, bottom: 1.0, left: 1.0, right: 1.0 },
      headerStyle: 'formal',
      tone: 'formal',
      language: 'en',
      pageNumbers: true,
      tableOfContents: false
    },
    isOfficial: true
  },
  {
    id: 'nsf-grant',
    name: 'NSF Grant Proposal',
    agency: 'National Science Foundation (US)',
    description: 'NSF research grant proposal template',
    sections: ['execSummary', 'researchPlan', 'broaderImpacts', 'budget', 'biographicalSketches'],
    formatting: {
      fontFamily: 'Arial',
      fontSize: 11,
      lineSpacing: 1.0,
      margins: { top: 1.0, bottom: 1.0, left: 1.0, right: 1.0 },
      headerStyle: 'formal',
      tone: 'technical',
      language: 'en',
      pageNumbers: true,
      tableOfContents: true
    },
    isOfficial: true
  },
  {
    id: 'innovate-uk',
    name: 'Innovate UK Grant',
    agency: 'Innovate UK (UK)',
    description: 'UK innovation grant application template',
    sections: ['execSummary', 'projectDescription', 'marketOpportunity', 'projectPlan', 'team', 'budget'],
    formatting: {
      fontFamily: 'Arial',
      fontSize: 12,
      lineSpacing: 1.5,
      margins: { top: 2.5, bottom: 2.5, left: 2.5, right: 2.5 },
      headerStyle: 'modern',
      tone: 'enthusiastic',
      language: 'en',
      pageNumbers: true,
      tableOfContents: true
    },
    isOfficial: true
  },
  {
    id: 'erc-advanced',
    name: 'ERC Advanced Grant',
    agency: 'European Research Council',
    description: 'ERC Advanced Grant proposal template',
    sections: ['execSummary', 'scientificExcellence', 'pioneeringResearch', 'implementation', 'budget'],
    formatting: {
      fontFamily: 'Calibri',
      fontSize: 11,
      lineSpacing: 1.15,
      margins: { top: 2.0, bottom: 2.0, left: 2.0, right: 2.0 },
      headerStyle: 'formal',
      tone: 'technical',
      language: 'en',
      pageNumbers: true,
      tableOfContents: true
    },
    isOfficial: true
  },
  {
    id: 'sbir-phase2',
    name: 'SBIR Phase II',
    agency: 'Small Business Innovation Research (US)',
    description: 'SBIR Phase II application template',
    sections: ['execSummary', 'technicalApproach', 'commercialization', 'keyPersonnel', 'budget'],
    formatting: {
      fontFamily: 'Arial',
      fontSize: 12,
      lineSpacing: 1.5,
      margins: { top: 1.0, bottom: 1.0, left: 1.0, right: 1.0 },
      headerStyle: 'formal',
      tone: 'formal',
      language: 'en',
      pageNumbers: true,
      tableOfContents: false
    },
    isOfficial: true
  }
];

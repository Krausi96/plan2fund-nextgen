// ========= PLAN2FUND — INDUSTRY VARIATIONS DATA =========
// Industry-specific template variations and customizations

import { TemplateConfig } from './officialTemplates';

export const INDUSTRY_VARIATIONS: TemplateConfig[] = [
  {
    id: 'tech-startup',
    name: 'Tech Startup Template',
    agency: 'Generic',
    description: 'Technology startup business plan template',
    industry: 'Technology',
    sections: ['execSummary', 'productDescription', 'marketAnalysis', 'businessModel', 'financialProjections', 'team'],
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
    isOfficial: false
  },
  {
    id: 'biotech-research',
    name: 'Biotech Research Template',
    agency: 'Generic',
    description: 'Biotechnology research proposal template',
    industry: 'Biotechnology',
    sections: ['execSummary', 'researchObjectives', 'methodology', 'timeline', 'budget', 'team'],
    formatting: {
      fontFamily: 'Times New Roman',
      fontSize: 12,
      lineSpacing: 1.5,
      margins: { top: 2.5, bottom: 2.5, left: 2.5, right: 2.5 },
      headerStyle: 'formal',
      tone: 'technical',
      language: 'en',
      pageNumbers: true,
      tableOfContents: true
    },
    isOfficial: false
  },
  {
    id: 'clean-energy',
    name: 'Clean Energy Template',
    agency: 'Generic',
    description: 'Clean energy project proposal template',
    industry: 'Clean Energy',
    sections: ['execSummary', 'projectDescription', 'environmentalImpact', 'implementation', 'budget', 'team'],
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
    isOfficial: false
  },
  {
    id: 'manufacturing',
    name: 'Manufacturing Template',
    agency: 'Generic',
    description: 'Manufacturing business plan template',
    industry: 'Manufacturing',
    sections: ['execSummary', 'businessDescription', 'marketAnalysis', 'operations', 'financialProjections', 'management'],
    formatting: {
      fontFamily: 'Arial',
      fontSize: 12,
      lineSpacing: 1.5,
      margins: { top: 2.5, bottom: 2.5, left: 2.5, right: 2.5 },
      headerStyle: 'formal',
      tone: 'formal',
      language: 'en',
      pageNumbers: true,
      tableOfContents: true
    },
    isOfficial: false
  },
  {
    id: 'fintech',
    name: 'FinTech Template',
    agency: 'Generic',
    description: 'Financial technology business plan template',
    industry: 'FinTech',
    sections: ['execSummary', 'productDescription', 'marketAnalysis', 'regulatoryCompliance', 'financialProjections', 'team'],
    formatting: {
      fontFamily: 'Arial',
      fontSize: 12,
      lineSpacing: 1.5,
      margins: { top: 2.5, bottom: 2.5, left: 2.5, right: 2.5 },
      headerStyle: 'modern',
      tone: 'technical',
      language: 'en',
      pageNumbers: true,
      tableOfContents: true
    },
    isOfficial: false
  },
  {
    id: 'healthcare',
    name: 'Healthcare Template',
    agency: 'Generic',
    description: 'Healthcare innovation proposal template',
    industry: 'Healthcare',
    sections: ['execSummary', 'projectDescription', 'clinicalImpact', 'implementation', 'budget', 'team'],
    formatting: {
      fontFamily: 'Arial',
      fontSize: 12,
      lineSpacing: 1.5,
      margins: { top: 2.5, bottom: 2.5, left: 2.5, right: 2.5 },
      headerStyle: 'formal',
      tone: 'technical',
      language: 'en',
      pageNumbers: true,
      tableOfContents: true
    },
    isOfficial: false
  }
];

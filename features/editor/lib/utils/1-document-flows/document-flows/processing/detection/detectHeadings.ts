/**
 * DETECT HEADINGS IN DOCUMENT CONTENT
 * 
 * Contains functions for detecting document headings and structure
 */

import type { DetectionMap, DetectionResult } from '../../sections/types';

/**
 * Detect headings in document content using pattern matching
 * 
 * @param content - Document content to analyze
 * @returns Map of heading types with detection results
 */
export function detectHeadings(content: any): DetectionMap {
  const result: DetectionMap = {};
  
  // Convert content to string for processing
  const textContent = typeof content === 'string' ? content : JSON.stringify(content);
  
  // Detect various heading patterns
  result['heading-introduction'] = detectIntroductionHeading(textContent);
  result['heading-executive-summary'] = detectExecutiveSummaryHeading(textContent);
  result['heading-company-description'] = detectCompanyDescriptionHeading(textContent);
  result['heading-market-analysis'] = detectMarketAnalysisHeading(textContent);
  result['heading-financial-plan'] = detectFinancialPlanHeading(textContent);
  result['heading-risk-assessment'] = detectRiskAssessmentHeading(textContent);
  result['heading-conclusion'] = detectConclusionHeading(textContent);

  return result;
}

/**
 * Detect Introduction heading using keyword heuristics
 */
function detectIntroductionHeading(content: string): DetectionResult {
  const hasIntroKeywords = [
    'introduction', 'einleitung', 'vorwort', 'introduction to',
    'overview', 'übersicht', 'grundlagen', 'background'
  ].some(keyword => 
    new RegExp(`\\b${keyword}\\b`, 'i').test(content.substring(0, 1000)) // Check first 1000 chars for intro
  );

  if (hasIntroKeywords) {
    return {
      found: true,
      confidence: 0.8,
      content: { type: 'introduction_heading' }
    };
  }

  return {
    found: false,
    confidence: 0.1
  };
}

/**
 * Detect Executive Summary heading using keyword heuristics
 */
function detectExecutiveSummaryHeading(content: string): DetectionResult {
  const hasExecSummaryKeywords = [
    'executive summary', 'executive-summary', 'exposé', 'zusammenfassung',
    'executive', 'summary', 'zusammenfassung', 'executivesummary'
  ].some(keyword => 
    new RegExp(`\\b${keyword}\\b`, 'i').test(content)
  );

  if (hasExecSummaryKeywords) {
    return {
      found: true,
      confidence: 0.85,
      content: { type: 'executive_summary_heading' }
    };
  }

  return {
    found: false,
    confidence: 0.1
  };
}

/**
 * Detect Company Description heading using keyword heuristics
 */
function detectCompanyDescriptionHeading(content: string): DetectionResult {
  const hasCompanyKeywords = [
    'company description', 'company', 'unternehmensbeschreibung', 'about us',
    'about the company', 'company profile', 'unternehmen', 'firmenprofil'
  ].some(keyword => 
    new RegExp(`\\b${keyword}\\b`, 'i').test(content)
  );

  if (hasCompanyKeywords) {
    return {
      found: true,
      confidence: 0.8,
      content: { type: 'company_description_heading' }
    };
  }

  return {
    found: false,
    confidence: 0.1
  };
}

/**
 * Detect Market Analysis heading using keyword heuristics
 */
function detectMarketAnalysisHeading(content: string): DetectionResult {
  const hasMarketKeywords = [
    'market analysis', 'market research', 'marktanalyse', 'marktforschung',
    'competition', 'wettbewerb', 'target market', 'zielmarkt'
  ].some(keyword => 
    new RegExp(`\\b${keyword}\\b`, 'i').test(content)
  );

  if (hasMarketKeywords) {
    return {
      found: true,
      confidence: 0.8,
      content: { type: 'market_analysis_heading' }
    };
  }

  return {
    found: false,
    confidence: 0.1
  };
}

/**
 * Detect Financial Plan heading using keyword heuristics
 */
function detectFinancialPlanHeading(content: string): DetectionResult {
  const hasFinanceKeywords = [
    'financial plan', 'financial planning', 'finanzplan', 'finanzierungsplan',
    'financial projections', 'financial forecast', 'finanzielle planung',
    'budget', 'kosten', 'revenue', 'einnahmen', 'expenses', 'ausgaben'
  ].some(keyword => 
    new RegExp(`\\b${keyword}\\b`, 'i').test(content)
  );

  if (hasFinanceKeywords) {
    return {
      found: true,
      confidence: 0.8,
      content: { type: 'financial_plan_heading' }
    };
  }

  return {
    found: false,
    confidence: 0.1
  };
}

/**
 * Detect Risk Assessment heading using keyword heuristics
 */
function detectRiskAssessmentHeading(content: string): DetectionResult {
  const hasRiskKeywords = [
    'risk assessment', 'risikoanalyse', 'risk analysis', 'risk management',
    'risks', 'risiken', 'risk factors', 'risikofaktoren'
  ].some(keyword => 
    new RegExp(`\\b${keyword}\\b`, 'i').test(content)
  );

  if (hasRiskKeywords) {
    return {
      found: true,
      confidence: 0.8,
      content: { type: 'risk_assessment_heading' }
    };
  }

  return {
    found: false,
    confidence: 0.1
  };
}

/**
 * Detect Conclusion heading using keyword heuristics
 */
function detectConclusionHeading(content: string): DetectionResult {
  const hasConclusionKeywords = [
    'conclusion', 'conclusions', 'fazit', 'schlussfolgerung', 'summary',
    'resumen', 'conclusión', 'bilanz', 'final thoughts', 'end'
  ].some(keyword => 
    new RegExp(`\\b${keyword}\\b`, 'i').test(content.substring(content.length - 1000)) // Check last 1000 chars for conclusion
  );

  if (hasConclusionKeywords) {
    return {
      found: true,
      confidence: 0.75,
      content: { type: 'conclusion_heading' }
    };
  }

  return {
    found: false,
    confidence: 0.1
  };
}
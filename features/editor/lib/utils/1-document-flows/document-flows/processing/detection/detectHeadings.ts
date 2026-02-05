/**
 * DETECT HEADINGS IN DOCUMENT CONTENT
 * 
 * Contains functions for detecting document headings and structure
 */

import type { DetectionMap, DetectionResult } from '../../sections/types';

// Define constants for fallback chunking
const MIN_CHUNK_WORDS = 800;
const MAX_CHUNK_WORDS = 1200;

/**
 * Detect headings in document content using pattern matching
 * 
 * @param content - Document content to analyze
 * @param additionalKeywords - Optional list of additional keywords to detect domain-specific headings
 * @returns Map of heading types with detection results
 */
export function detectHeadings(content: any, additionalKeywords?: string[]): DetectionMap {
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
  
  // Detect numbered patterns
  result['heading-numbered-patterns'] = detectNumberedHeadings(textContent);
  
  // Detect styling cues
  result['heading-styling-cues'] = detectStylingCues(textContent);
  
  // Detect domain-specific headings
  if (additionalKeywords && additionalKeywords.length > 0) {
    result['heading-domain-specific'] = detectDomainSpecificHeadings(textContent, additionalKeywords);
  }
  
  // Fallback chunking if no headings are found
  const hasAnyHeadings = Object.values(result).some(detection => detection.found);
  if (!hasAnyHeadings) {
    result['heading-fallback-chunks'] = generateFallbackChunks(textContent);
  }

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

/**
 * Detect numbered heading patterns like 1., 1.1, 2.3.4, etc.
 */
function detectNumberedHeadings(content: string): DetectionResult {
  // Regex to match numbered patterns with various spacing/punctuation
  const numberedPattern = /^(\\d+\\.?|\\d+\\.\\d+|\\d+\\.\\d+\\.\\d+|\\d+\\.\\d+\\.\\d+\\.\\d+)\\s*[\\-\\.:]?\\s*[A-Z]/gm;
  
  const matches = content.match(numberedPattern) || [];
  
  if (matches.length > 0) {
    return {
      found: true,
      confidence: 0.8,
      content: { 
        type: 'numbered_headings',
        matches: matches.slice(0, 5) // Return first 5 matches
      }
    };
  }
  
  return {
    found: false,
    confidence: 0.1
  };
}

/**
 * Detect styling cues like ALL-CAPS, bold text, and short standalone lines
 */
function detectStylingCues(content: string): DetectionResult {
  const lines = content.split(/\\r?\\n/);
  const stylingCues = [];
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Check for ALL-CAPS lines (at least 3 words, all uppercase)
    if (trimmedLine.length > 0 && trimmedLine === trimmedLine.toUpperCase() && 
        trimmedLine.split(/\\s+/).length <= 5 && trimmedLine.split(/\\s+/).length >= 1) {
      stylingCues.push({ type: 'all_caps', content: trimmedLine });
    }
    
    // Check for short standalone lines (≤ 5 words)
    if (trimmedLine.split(/\\s+/).length <= 5 && trimmedLine.split(/\\s+/).length >= 1) {
      stylingCues.push({ type: 'short_line', content: trimmedLine });
    }
    
    // Check for bold text indicators from HTML extraction (tags like <strong>, <b>)
    if (trimmedLine.includes('<strong>') || trimmedLine.includes('</strong>') || 
        trimmedLine.includes('<b>') || trimmedLine.includes('</b>')) {
      stylingCues.push({ type: 'bold_text', content: trimmedLine });
    }
  }
  
  if (stylingCues.length > 0) {
    return {
      found: true,
      confidence: 0.7,
      content: { 
        type: 'styling_cues',
        cues: stylingCues.slice(0, 10) // Return first 10 cues
      }
    };
  }
  
  return {
    found: false,
    confidence: 0.1
  };
}

/**
 * Detect domain-specific headings using provided keywords
 */
function detectDomainSpecificHeadings(content: string, keywords: string[]): DetectionResult {
  const foundKeywords = [];
  
  for (const keyword of keywords) {
    if (new RegExp(`\\b${keyword}\\b`, 'i').test(content)) {
      foundKeywords.push(keyword);
    }
  }
  
  if (foundKeywords.length > 0) {
    return {
      found: true,
      confidence: 0.85,
      content: { 
        type: 'domain_specific_headings',
        keywords: foundKeywords
      }
    };
  }
  
  return {
    found: false,
    confidence: 0.1
  };
}

/**
 * Generate fallback chunks when no headings are found
 */
function generateFallbackChunks(content: string): DetectionResult {
  // Split content into words
  const words = content.split(/\\s+/);
  
  if (words.length < MIN_CHUNK_WORDS) {
    // If content is too short, return as single section
    return {
      found: true,
      confidence: 0.6,
      content: { 
        type: 'fallback_chunks',
        chunks: [{
          title: 'Section 1',
          content: content
        }]
      }
    };
  }
  
  const chunks = [];
  let chunkStart = 0;
  
  while (chunkStart < words.length) {
    // Determine chunk size (between min and max, but don't exceed document length)
    const chunkEnd = Math.min(
      chunkStart + MAX_CHUNK_WORDS, 
      words.length
    );
    
    const chunkWords = words.slice(chunkStart, chunkEnd);
    const chunkContent = chunkWords.join(' ');
    
    chunks.push({
      title: `Section ${chunks.length + 1}`,
      content: chunkContent
    });
    
    chunkStart = chunkEnd;
  }
  
  return {
    found: true,
    confidence: 0.6,
    content: { 
      type: 'fallback_chunks',
      chunks: chunks
    }
  };
}
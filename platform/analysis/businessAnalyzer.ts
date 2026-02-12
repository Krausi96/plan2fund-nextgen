import type { DocumentStructure } from '../core/types';

/**
 * Analyzes business quality and returns scoring
 */
export function analyzeBusinessQuality(
  documentStructure: DocumentStructure,
  programData?: any
): {
  completeness: number;
  readiness: number;
  weaknesses: string[];
  suggestions: string[];
} {
  // Calculate completeness score based on document structure
  const completeness = calculateCompleteness(documentStructure);
  
  // Calculate readiness based on document and program alignment
  const readiness = calculateReadiness(documentStructure, programData);
  
  // Identify weaknesses
  const weaknesses = identifyWeaknesses(documentStructure);
  
  // Provide suggestions
  const suggestions = generateSuggestions(documentStructure, weaknesses);
  
  return {
    completeness,
    readiness,
    weaknesses,
    suggestions
  };
}

function calculateCompleteness(documentStructure: DocumentStructure): number {
  // Base score calculation
  let score = 50; // Start with 50%
  
  // Add points for having sections
  if (documentStructure.sections && documentStructure.sections.length > 0) {
    score += Math.min(documentStructure.sections.length * 5, 30); // Up to 30% for sections
  }
  
  // Add points for having requirements (OPTION A: requirements now attached to sections)
  const totalRequirements = (documentStructure.sections || []).reduce((sum, section) => {
    return sum + (section.requirements?.length || 0);
  }, 0);
  if (totalRequirements > 0) {
    score += 10;
  }
  
  // Add points for having validation rules
  if (documentStructure.validationRules && documentStructure.validationRules.length > 0) {
    score += 10;
  }
  
  return Math.min(score, 100);
}

function calculateReadiness(documentStructure: DocumentStructure, programData?: any): number {
  // Base readiness calculation
  let score = 40; // Start with 40%
  
  // If program data is provided, calculate alignment
  if (programData) {
    // Add points for alignment with program requirements (OPTION A: requirements now attached to sections)
    const totalRequirements = (documentStructure.sections || []).reduce((sum, section) => {
      return sum + (section.requirements?.length || 0);
    }, 0);
    if (totalRequirements > 0) {
      score += 20;
    }
    
    // Add points for having deliverables mentioned
    if (documentStructure.documents && documentStructure.documents.length > 0) {
      score += 15;
    }
    
    // Add points for having AI guidance
    if (documentStructure.aiGuidance && documentStructure.aiGuidance.length > 0) {
      score += 15;
    }
  } else {
    // Just evaluate document quality
    if (documentStructure.confidenceScore && documentStructure.confidenceScore > 0) {
      score += Math.min(documentStructure.confidenceScore * 0.3, 40);
    }
  }
  
  return Math.min(score, 100);
}

function identifyWeaknesses(documentStructure: DocumentStructure): string[] {
  const weaknesses: string[] = [];
  
  // Check for missing critical sections
  const sectionTitles = (documentStructure.sections || []).map(s => s.title?.toLowerCase() || '');
  
  if (!sectionTitles.some(title => title.includes('executive summary'))) {
    weaknesses.push('Missing Executive Summary section');
  }
  
  if (!sectionTitles.some(title => title.includes('financial'))) {
    weaknesses.push('Missing Financial Projections section');
  }
  
  if (!sectionTitles.some(title => title.includes('market') || title.includes('marketing'))) {
    weaknesses.push('Missing Market Analysis section');
  }
  
  if (!sectionTitles.some(title => title.includes('risk'))) {
    weaknesses.push('Missing Risk Analysis section');
  }
  
  // Check content quality
  if (documentStructure.sections) {
    documentStructure.sections.forEach(section => {
      if (section.content && section.content.length < 200) {
        weaknesses.push(`Section "${section.title}" has insufficient content`);
      }
    });
  }
  
  return weaknesses;
}

function generateSuggestions(documentStructure: DocumentStructure, weaknesses: string[]): string[] {
  const suggestions: string[] = [];
  
  // Provide specific suggestions based on weaknesses
  if (weaknesses.some(w => w.includes('Executive Summary'))) {
    suggestions.push('Add an Executive Summary with key highlights of your business plan');
  }
  
  if (weaknesses.some(w => w.includes('Financial Projections'))) {
    suggestions.push('Include detailed Financial Projections with revenue forecasts, expenses, and cash flow');
  }
  
  if (weaknesses.some(w => w.includes('Market Analysis'))) {
    suggestions.push('Develop a comprehensive Market Analysis with target audience and competitive landscape');
  }
  
  if (weaknesses.some(w => w.includes('Risk Analysis'))) {
    suggestions.push('Identify and address potential business risks with mitigation strategies');
  }
  
  // Content improvement suggestions
  if (documentStructure.sections) {
    documentStructure.sections.forEach(section => {
      if (section.content && section.content.length < 200) {
        suggestions.push(`Expand "${section.title}" with more detailed information and supporting data`);
      }
    });
  }
  
  return suggestions;
}

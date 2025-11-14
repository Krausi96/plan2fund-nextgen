/**
 * Quality Scoring System
 * Evaluates document quality beyond compliance (readability, completeness, persuasiveness)
 * Based on strategic analysis report recommendations (Area 4)
 */

export interface QualityMetrics {
  readability: ReadabilityScore;
  completeness: CompletenessScore;
  persuasiveness: PersuasivenessScore;
  overall: number; // 0-100
}

export interface ReadabilityScore {
  score: number; // 0-100
  gradeLevel: string; // e.g., "12th grade", "College"
  issues: string[];
  suggestions: string[];
}

export interface CompletenessScore {
  score: number; // 0-100
  missingElements: string[];
  suggestions: string[];
}

export interface PersuasivenessScore {
  score: number; // 0-100
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
}

/**
 * Calculate comprehensive quality metrics for a section
 */
export function calculateQualityMetrics(
  content: string,
  sectionTitle: string,
  sectionType: string,
  wordCount: number,
  minWordCount?: number,
  maxWordCount?: number
): QualityMetrics {
  const readability = calculateReadability(content);
  const completeness = calculateCompleteness(content, sectionTitle, sectionType, wordCount, minWordCount, maxWordCount);
  const persuasiveness = calculatePersuasiveness(content, sectionType);

  // Weighted overall score
  const overall = (
    readability.score * 0.3 +
    completeness.score * 0.4 +
    persuasiveness.score * 0.3
  );

  return {
    readability,
    completeness,
    persuasiveness,
    overall: Math.round(overall)
  };
}

/**
 * Calculate readability score (Flesch Reading Ease approximation)
 */
function calculateReadability(content: string): ReadabilityScore {
  const text = content.replace(/<[^>]*>/g, '').trim();
  
  if (text.length === 0) {
    return {
      score: 0,
      gradeLevel: 'N/A',
      issues: ['No content to analyze'],
      suggestions: ['Add content to this section']
    };
  }

  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const syllables = words.reduce((sum, word) => sum + countSyllables(word), 0);

  if (sentences.length === 0 || words.length === 0) {
    return {
      score: 0,
      gradeLevel: 'N/A',
      issues: ['No complete sentences found'],
      suggestions: ['Write complete sentences']
    };
  }

  const avgSentenceLength = words.length / sentences.length;
  const avgSyllablesPerWord = syllables / words.length;

  // Simplified Flesch Reading Ease
  const fleschScore = 206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord);
  
  // Convert to 0-100 scale and normalize
  let score = Math.max(0, Math.min(100, fleschScore));
  
  // Determine grade level
  let gradeLevel = 'College';
  if (fleschScore >= 90) gradeLevel = '5th grade';
  else if (fleschScore >= 80) gradeLevel = '6th grade';
  else if (fleschScore >= 70) gradeLevel = '7th grade';
  else if (fleschScore >= 60) gradeLevel = '8th-9th grade';
  else if (fleschScore >= 50) gradeLevel = '10th-12th grade';
  else if (fleschScore >= 30) gradeLevel = 'College';

  const issues: string[] = [];
  const suggestions: string[] = [];

  // Check for common readability issues
  if (avgSentenceLength > 20) {
    issues.push('Sentences are too long');
    suggestions.push('Break long sentences into shorter ones');
  }

  if (avgSyllablesPerWord > 2.0) {
    issues.push('Words are too complex');
    suggestions.push('Use simpler words where possible');
  }

  if (sentences.length < 3) {
    issues.push('Too few sentences');
    suggestions.push('Expand with more detail');
  }

  // Check for passive voice (simplified)
  const passiveVoiceMatches = text.match(/\b(is|are|was|were|been|being)\s+\w+ed\b/gi);
  if (passiveVoiceMatches && passiveVoiceMatches.length > sentences.length * 0.3) {
    issues.push('Too much passive voice');
    suggestions.push('Use active voice for clarity');
  }

  return {
    score: Math.round(score),
    gradeLevel,
    issues,
    suggestions
  };
}

/**
 * Calculate completeness score
 */
function calculateCompleteness(
  content: string,
  sectionTitle: string,
  sectionType: string,
  wordCount: number,
  minWordCount?: number,
  maxWordCount?: number
): CompletenessScore {
  const text = content.replace(/<[^>]*>/g, '').trim();
  
  if (text.length === 0) {
    return {
      score: 0,
      missingElements: ['No content'],
      suggestions: ['Start writing this section']
    };
  }

  const missingElements: string[] = [];
  const suggestions: string[] = [];
  let score = 100;

  // Check word count
  if (minWordCount && wordCount < minWordCount) {
    const deficit = minWordCount - wordCount;
    missingElements.push(`Word count below minimum (${wordCount}/${minWordCount})`);
    suggestions.push(`Add approximately ${deficit} more words`);
    score -= 30;
  }

  if (maxWordCount && wordCount > maxWordCount) {
    const excess = wordCount - maxWordCount;
    missingElements.push(`Word count exceeds maximum (${wordCount}/${maxWordCount})`);
    suggestions.push(`Reduce content by approximately ${excess} words`);
    score -= 20;
  }

  // Check for section-specific elements
  const sectionChecks = getSectionSpecificChecks(sectionTitle, sectionType, text);
  missingElements.push(...sectionChecks.missing);
  suggestions.push(...sectionChecks.suggestions);
  score -= sectionChecks.missing.length * 10;

  // Check for structure
  if (!hasStructure(text)) {
    missingElements.push('Lacks clear structure');
    suggestions.push('Add headings, bullet points, or paragraphs');
    score -= 15;
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    missingElements,
    suggestions
  };
}

/**
 * Calculate persuasiveness score
 */
function calculatePersuasiveness(content: string, _sectionType: string): PersuasivenessScore {
  const text = content.replace(/<[^>]*>/g, '').trim();
  
  if (text.length === 0) {
    return {
      score: 0,
      strengths: [],
      weaknesses: ['No content'],
      suggestions: ['Add persuasive content']
    };
  }

  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const suggestions: string[] = [];
  let score = 50; // Start at neutral

  // Check for persuasive elements
  const hasNumbers = /\d+/.test(text);
  const hasBenefits = /\b(benefit|advantage|value|impact|improve|increase|reduce|solve)\b/gi.test(text);
  const hasEvidence = /\b(proven|demonstrated|evidence|data|research|study|result)\b/gi.test(text);
  const hasActionWords = /\b(achieve|deliver|create|develop|build|launch|implement)\b/gi.test(text);

  if (hasNumbers) {
    strengths.push('Includes specific numbers/data');
    score += 10;
  } else {
    weaknesses.push('Lacks specific numbers or data');
    suggestions.push('Add quantitative evidence');
  }

  if (hasBenefits) {
    strengths.push('Highlights benefits and value');
    score += 10;
  } else {
    weaknesses.push('Does not clearly articulate benefits');
    suggestions.push('Emphasize value proposition and benefits');
  }

  if (hasEvidence) {
    strengths.push('Includes evidence and proof points');
    score += 10;
  } else {
    weaknesses.push('Lacks supporting evidence');
    suggestions.push('Add data, research, or proof points');
  }

  if (hasActionWords) {
    strengths.push('Uses action-oriented language');
    score += 10;
  } else {
    weaknesses.push('Language is too passive');
    suggestions.push('Use stronger action verbs');
  }

  // Check for weak language
  const weakLanguage = /\b(might|maybe|perhaps|possibly|could|try|hope)\b/gi;
  const weakMatches = text.match(weakLanguage);
  if (weakMatches && weakMatches.length > 3) {
    weaknesses.push('Uses weak or uncertain language');
    suggestions.push('Use confident, definitive language');
    score -= 10;
  }

  // Check for compelling opening
  const firstSentence = text.split(/[.!?]/)[0];
  if (firstSentence && firstSentence.length > 20 && firstSentence.length < 100) {
    strengths.push('Has a clear opening statement');
    score += 5;
  } else {
    weaknesses.push('Opening could be more compelling');
    suggestions.push('Start with a strong, clear statement');
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    strengths,
    weaknesses,
    suggestions
  };
}

/**
 * Get section-specific completeness checks
 */
function getSectionSpecificChecks(
  sectionTitle: string,
  _sectionType: string,
  text: string
): { missing: string[]; suggestions: string[] } {
  const missing: string[] = [];
  const suggestions: string[] = [];
  const lowerTitle = sectionTitle.toLowerCase();

  // Financial section checks
  if (lowerTitle.includes('financial') || lowerTitle.includes('budget')) {
    if (!/\d+/.test(text)) {
      missing.push('No numbers or financial figures');
      suggestions.push('Include specific financial projections or amounts');
    }
    if (!/\b(euro|eur|€|usd|\$|revenue|cost|expense|profit|budget)\b/gi.test(text)) {
      missing.push('No financial terminology');
      suggestions.push('Use financial terms and currency');
    }
  }

  // Market section checks
  if (lowerTitle.includes('market') || lowerTitle.includes('competition')) {
    if (!/\b(market|customer|target|competitor|tam|sam|som)\b/gi.test(text)) {
      missing.push('No market analysis terminology');
      suggestions.push('Include market size, target customers, or competition');
    }
  }

  // Team section checks
  if (lowerTitle.includes('team') || lowerTitle.includes('management')) {
    if (!/\b(team|member|experience|qualification|skill|expertise)\b/gi.test(text)) {
      missing.push('No team information');
      suggestions.push('Describe team members and their qualifications');
    }
  }

  // Impact section checks
  if (lowerTitle.includes('impact') || lowerTitle.includes('benefit')) {
    if (!/\b(impact|benefit|effect|outcome|result|change|improve)\b/gi.test(text)) {
      missing.push('No impact description');
      suggestions.push('Describe the impact and benefits of your project');
    }
  }

  return { missing, suggestions };
}

/**
 * Check if content has structure
 */
function hasStructure(text: string): boolean {
  // Check for headings, bullets, or multiple paragraphs
  const hasHeadings = /^#+\s|^\*\*|^##/.test(text);
  const hasBullets = /^[\*\-\+]\s|^\d+\.\s/m.test(text);
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);
  const hasMultipleParagraphs = paragraphs.length >= 2;

  return hasHeadings || hasBullets || hasMultipleParagraphs;
}

/**
 * Count syllables in a word (simplified)
 */
function countSyllables(word: string): number {
  word = word.toLowerCase();
  if (word.length <= 3) return 1;
  
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  word = word.replace(/^y/, '');
  
  const matches = word.match(/[aeiouy]{1,2}/g);
  return matches ? matches.length : 1;
}

/**
 * Get quality gate status
 */
export function getQualityGateStatus(metrics: QualityMetrics): {
  passed: boolean;
  level: 'excellent' | 'good' | 'acceptable' | 'needs_improvement';
  message: string;
} {
  const overall = metrics.overall;

  if (overall >= 80) {
    return {
      passed: true,
      level: 'excellent',
      message: 'Document quality is excellent and ready for submission'
    };
  } else if (overall >= 65) {
    return {
      passed: true,
      level: 'good',
      message: 'Document quality is good, minor improvements recommended'
    };
  } else if (overall >= 50) {
    return {
      passed: false,
      level: 'acceptable',
      message: 'Document quality is acceptable but needs improvement before submission'
    };
  } else {
    return {
      passed: false,
      level: 'needs_improvement',
      message: 'Document quality needs significant improvement before submission'
    };
  }
}


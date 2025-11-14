// ========= PLAN2FUND — SECTION PROGRESS UTILITY =========
// Minimal utility to calculate section progress metrics
// Pure calculation - no React hooks required

export interface SectionProgress {
  wordCount: number;
  wordCountMin: number;
  wordCountMax: number;
  wordCountProgress: number; // 0-100 percentage
  completionPercentage: number; // 0-100 overall completion
  requirementsMet: number;
  requirementsTotal: number;
  hasContent: boolean;
}

/**
 * Calculate progress metrics for a section (pure function)
 */
export function calculateSectionProgress(section: any): SectionProgress {
  const content = section?.content || '';
  const textContent = content.replace(/<[^>]*>/g, '').trim();
  const words = textContent.split(/\s+/).filter((word: string) => word.length > 0);
  const wordCount = words.length;

  const wordCountMin = section?.wordCountMin || 50;
  const wordCountMax = section?.wordCountMax || 5000;

  const targetWords = (wordCountMin + wordCountMax) / 2;
  const wordCountProgress = targetWords > 0
    ? Math.min(100, Math.round((wordCount / targetWords) * 100))
    : 0;

  let requirementsMet = 0;
  let requirementsTotal = 0;

  requirementsTotal++;
  if (wordCount >= wordCountMin && wordCount <= wordCountMax) {
    requirementsMet++;
  }

  if (section?.tables) {
    requirementsTotal++;
    const hasTables = Object.keys(section.tables).length > 0;
    if (hasTables) {
      requirementsMet++;
    }
  }

  if (section?.figures) {
    requirementsTotal++;
    const hasFigures = Array.isArray(section.figures) && section.figures.length > 0;
    if (hasFigures) {
      requirementsMet++;
    }
  }

  if (section?.fields) {
    const requiredFields = Object.keys(section.fields).filter(
      key => section.fields[key]?.required !== false
    );
    requirementsTotal += requiredFields.length;
    requirementsMet += requiredFields.filter(
      key => section.fields[key]?.value !== undefined &&
             section.fields[key]?.value !== null &&
             section.fields[key]?.value !== ''
    ).length;
  }

  if (requirementsTotal === 0) {
    requirementsTotal = 1;
    if (wordCount > 0) {
      requirementsMet = 1;
    }
  }

  const requirementsProgress = requirementsTotal > 0
    ? (requirementsMet / requirementsTotal) * 100
    : 0;

  // Focus on actual requirements, not word count
  // Word count is just a metric, not a requirement
  const completionPercentage = Math.round(requirementsProgress);

  return {
    wordCount,
    wordCountMin,
    wordCountMax,
    wordCountProgress,
    completionPercentage,
    requirementsMet,
    requirementsTotal,
    hasContent: wordCount > 0,
  };
}


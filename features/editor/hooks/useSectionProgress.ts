// ========= PLAN2FUND — SECTION PROGRESS HOOK =========
// Minimal utility hook to calculate section progress metrics
// NO UI - pure calculation only

import { useMemo } from 'react';

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
 * Calculate progress metrics for a section
 * Pure function - no side effects, no UI
 */
export function useSectionProgress(section: any): SectionProgress {
  return useMemo(() => {
    // Calculate word count
    const content = section?.content || '';
    const textContent = content.replace(/<[^>]*>/g, '').trim();
    const words = textContent.split(/\s+/).filter((word: string) => word.length > 0);
    const wordCount = words.length;
    
    // Get word count targets
    const wordCountMin = section?.wordCountMin || 50;
    const wordCountMax = section?.wordCountMax || 5000;
    
    // Calculate word count progress (0-100)
    const targetWords = (wordCountMin + wordCountMax) / 2;
    const wordCountProgress = targetWords > 0 
      ? Math.min(100, Math.round((wordCount / targetWords) * 100))
      : 0;
    
    // Calculate requirements met
    let requirementsMet = 0;
    let requirementsTotal = 0;
    
    // Word count requirement
    requirementsTotal++;
    if (wordCount >= wordCountMin && wordCount <= wordCountMax) {
      requirementsMet++;
    }
    
    // Table requirement (if section has tables property)
    if (section?.tables) {
      requirementsTotal++;
      const hasTables = Object.keys(section.tables).length > 0;
      if (hasTables) {
        requirementsMet++;
      }
    }
    
    // Figure requirement (if section has figures property)
    if (section?.figures) {
      requirementsTotal++;
      const hasFigures = Array.isArray(section.figures) && section.figures.length > 0;
      if (hasFigures) {
        requirementsMet++;
      }
    }
    
    // Required fields (if section has fields property)
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
    
    // Ensure at least 1 requirement exists
    if (requirementsTotal === 0) {
      requirementsTotal = 1;
      if (wordCount > 0) {
        requirementsMet = 1;
      }
    }
    
    // Calculate overall completion percentage
    // 60% word count progress + 40% requirements
    const requirementsProgress = requirementsTotal > 0
      ? (requirementsMet / requirementsTotal) * 100
      : 0;
    
    const completionPercentage = Math.round(
      (wordCountProgress * 0.6) + (requirementsProgress * 0.4)
    );
    
    return {
      wordCount,
      wordCountMin,
      wordCountMax,
      wordCountProgress,
      completionPercentage,
      requirementsMet,
      requirementsTotal,
      hasContent: wordCount > 0
    };
  }, [section?.content, section?.wordCountMin, section?.wordCountMax, section?.tables, section?.figures, section?.fields]);
}


import { useMemo } from 'react';
import { METADATA_SECTION_ID, isMetadataSection } from '@/features/editor/lib/hooks/useEditorStore';
import type { BusinessPlan, Section, Question } from '@/features/editor/lib/types/plan';
import type { SectionTemplate, DocumentTemplate } from '@templates';

/**
 * Hook for editor computed values (memoized)
 */
export function useEditorComputedValues(
  plan: BusinessPlan | null,
  editingSectionId: string | null,
  activeSectionId: string | null,
  activeQuestionId: string | null,
  allSections: SectionTemplate[],
  allDocuments: DocumentTemplate[],
  disabledSections: Set<string>,
  disabledDocuments: Set<string>,
  filteredSections: SectionTemplate[],
  documentPlan: BusinessPlan | null
) {
  // Always show editor - simple logic: use editingSectionId, then activeSectionId, then default to first section or METADATA
  const effectiveEditingSectionId = useMemo(() => {
    if (!plan) return null;
    
    // Priority 1: Explicitly set editing section
    if (editingSectionId) return editingSectionId;
    
    // Priority 2: Active section
    if (activeSectionId) return activeSectionId;
    
    // Priority 3: First regular section
    if (plan.sections && plan.sections.length > 0) {
      return plan.sections[0].id;
    }
    
    // Priority 4: METADATA (always available)
    return METADATA_SECTION_ID;
  }, [editingSectionId, activeSectionId, plan]);
  
  // Visible sections/documents (excluding disabled ones)
  const visibleSections = useMemo(() => 
    allSections.filter(s => !disabledSections.has(s.id)),
    [allSections, disabledSections]
  );
  
  const visibleDocuments = useMemo(() => 
    allDocuments.filter(d => !disabledDocuments.has(d.id)),
    [allDocuments, disabledDocuments]
  );
  
  // Visible filtered sections (for document-specific filtering)
  const visibleFilteredSections = useMemo(() => 
    filteredSections.filter(s => !disabledSections.has(s.id)),
    [filteredSections, disabledSections]
  );
  
  // Get active section - use effectiveEditingSectionId to find section being edited
  // Use documentPlan to get correct sections (document-specific or core product)
  const activeSection: Section | null = useMemo(() => {
    if (!plan || !documentPlan) return null;
    const currentPlan = documentPlan; // Use document-specific plan if additional document is selected
    // Use effectiveEditingSectionId (which defaults to activeSectionId if not explicitly set)
    if (effectiveEditingSectionId) {
      // For special sections, they're not in plan.sections, so return null
      if (isMetadataSection(effectiveEditingSectionId)) {
        return null;
      }
      return currentPlan.sections.find((section) => section.id === effectiveEditingSectionId) ?? null;
    }
    // Otherwise use activeSectionId
    if (isMetadataSection(activeSectionId)) return null;
    return currentPlan.sections.find((section) => section.id === activeSectionId) ?? currentPlan.sections[0] ?? null;
  }, [plan, documentPlan, activeSectionId, effectiveEditingSectionId]);
  
  const activeQuestion: Question | null = useMemo(() => {
    if (!activeSection) return null;
    return (
      activeSection.questions.find((question) => question.id === activeQuestionId) ??
      activeSection.questions[0] ??
      null
    );
  }, [activeSection, activeQuestionId]);
  
  return {
    effectiveEditingSectionId,
    visibleSections,
    visibleDocuments,
    visibleFilteredSections,
    activeSection,
    activeQuestion
  };
}


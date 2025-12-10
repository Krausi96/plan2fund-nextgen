import { useState, useEffect, useMemo, useCallback } from 'react';
import { useEditorStore, METADATA_SECTION_ID, ANCILLARY_SECTION_ID, REFERENCES_SECTION_ID, APPENDICES_SECTION_ID } from '@/features/editor/lib/hooks/useEditorStore';
import type { Question } from '@/features/editor/lib/types/plan';

/**
 * Hook for managing SectionEditor state and computed values
 */
export function useSectionEditorState(sectionId: string | null) {
  const { 
    plan, 
    activeQuestionId, 
    templates 
  } = useEditorStore((state) => ({
    plan: state.plan,
    activeQuestionId: state.activeQuestionId,
    templates: state.templates
  }));

  // Get section and active question from plan
  const section = useMemo(() => {
    if (!sectionId || !plan) return null;
    return plan.sections.find(s => s.id === sectionId) || null;
  }, [sectionId, plan]);

  const activeQuestion = useMemo(() => {
    if (!section) return null;
    return section.questions.find((q) => q.id === activeQuestionId) ?? section.questions[0] ?? null;
  }, [section, activeQuestionId]);

  const template = useMemo(() => {
    if (!section) return null;
    return templates.find((tpl) => tpl.id === section.id) || null;
  }, [section, templates]);

  // Check if this is a metadata or ancillary section
  const isMetadataSection = sectionId === METADATA_SECTION_ID;
  const isAncillarySection = sectionId === ANCILLARY_SECTION_ID;
  const isReferencesSection = sectionId === REFERENCES_SECTION_ID;
  const isAppendicesSection = sectionId === APPENDICES_SECTION_ID;
  const isSpecialSection = isMetadataSection || isAncillarySection || isReferencesSection || isAppendicesSection;

  // Question expandable state (for showing full question)
  const [isQuestionExpanded, setIsQuestionExpanded] = useState(false);

  // Suggestions collapsible state - default to expanded
  const [isSuggestionsExpanded, setIsSuggestionsExpanded] = useState(true);

  // Auto-collapse suggestions side panel on narrow screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 500) {
        setIsSuggestionsExpanded(false);
      }
    };
    window.addEventListener('resize', handleResize);
    // Check on mount
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Reset question expanded state when question changes
  useEffect(() => {
    setIsQuestionExpanded(false);
    setIsSuggestionsExpanded(false);
  }, [activeQuestionId]);

  // Type guards for normal sections
  const isUnknown = !isSpecialSection && activeQuestion ? activeQuestion.status === 'unknown' : false;
  const isComplete = !isSpecialSection && activeQuestion ? activeQuestion.status === 'complete' : false;

  // Get next question helper (only for normal sections)
  const getNextQuestion = useCallback((): Question | null => {
    if (isSpecialSection || !section || !activeQuestion) return null;
    const currentIndex = section.questions.findIndex(q => q.id === activeQuestion.id);
    if (currentIndex >= 0 && currentIndex < section.questions.length - 1) {
      return section.questions[currentIndex + 1];
    }
    return null;
  }, [isSpecialSection, section, activeQuestion]);

  // Calculate completion (only for normal sections with questions)
  const answeredCount = !isSpecialSection && section 
    ? section.questions.filter(q => q.answer && q.answer.trim().length > 0).length 
    : 0;
  const totalQuestions = !isSpecialSection && section ? section.questions.length : 0;
  const completionPercentage = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  // Calculate special section stats
  const titlePageFields = useMemo(() => {
    if (!isMetadataSection || !plan?.titlePage) return { completed: 0, total: 4 };
    const fields = [
      plan.titlePage.logoUrl,
      plan.titlePage.companyName,
      plan.titlePage.planTitle,
      plan.titlePage.date
    ];
    return {
      completed: fields.filter(f => f && f.trim().length > 0).length,
      total: 4
    };
  }, [isMetadataSection, plan?.titlePage]);

  const tocStats = useMemo(() => {
    if (!isAncillarySection || !plan?.ancillary) return { sections: 0, withPages: 0 };
    return {
      sections: plan.ancillary.tableOfContents?.length || 0,
      withPages: plan.ancillary.tableOfContents?.filter(e => e.page).length || 0
    };
  }, [isAncillarySection, plan?.ancillary]);

  const referencesCount = useMemo(() => {
    return isReferencesSection && plan?.references ? plan.references.length : 0;
  }, [isReferencesSection, plan?.references]);

  const appendicesCount = useMemo(() => {
    return isAppendicesSection && plan?.appendices ? plan.appendices.length : 0;
  }, [isAppendicesSection, plan?.appendices]);

  return {
    plan,
    section,
    activeQuestion,
    template,
    isMetadataSection,
    isAncillarySection,
    isReferencesSection,
    isAppendicesSection,
    isSpecialSection,
    isUnknown,
    isComplete,
    isQuestionExpanded,
    setIsQuestionExpanded,
    isSuggestionsExpanded,
    setIsSuggestionsExpanded,
    getNextQuestion,
    answeredCount,
    totalQuestions,
    completionPercentage,
    titlePageFields,
    tocStats,
    referencesCount,
    appendicesCount
  };
}


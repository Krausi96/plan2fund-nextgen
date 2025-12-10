import { useEffect } from 'react';

/**
 * Hook for highlighting active question in preview
 */
export function useQuestionHighlight(
  activeQuestionId: string | null,
  sectionId: string | null,
  isSpecialSection: boolean
) {
  useEffect(() => {
    if (!activeQuestionId || !sectionId || isSpecialSection) return;

    // Add highlight class to active question
    const questionHeading = document.querySelector(`h4.section-subchapter[data-question-id="${activeQuestionId}"]`) as HTMLElement;
    const questionContent = document.querySelector(`div[data-question-id="${activeQuestionId}"][data-question-content="true"]`) as HTMLElement;
    const sectionElement = document.querySelector(`[data-section-id="${sectionId}"]`) as HTMLElement;

    if (questionHeading) {
      questionHeading.classList.add('inline-editor-active-question');
    }
    if (questionContent) {
      questionContent.classList.add('inline-editor-active-content');
    }
    if (sectionElement) {
      sectionElement.classList.add('inline-editor-active-section');
    }

    return () => {
      // Cleanup: remove highlight classes
      if (questionHeading) {
        questionHeading.classList.remove('inline-editor-active-question');
      }
      if (questionContent) {
        questionContent.classList.remove('inline-editor-active-content');
      }
      if (sectionElement) {
        sectionElement.classList.remove('inline-editor-active-section');
      }
    };
  }, [activeQuestionId, sectionId, isSpecialSection]);
}


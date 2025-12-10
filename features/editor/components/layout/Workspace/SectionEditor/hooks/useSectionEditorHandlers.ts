import { useCallback } from 'react';
import type { Question } from '@/features/editor/lib/types/plan';

interface UseSectionEditorHandlersParams {
  isSpecialSection: boolean;
  activeQuestion: Question | null;
  isUnknown: boolean;
  getNextQuestion: () => Question | null;
  toggleQuestionUnknown: (questionId: string, reason?: string) => void;
  markQuestionComplete: (questionId: string) => void;
  setActiveQuestion: (questionId: string) => void;
  onClose: () => void;
  showSkipDialog: boolean;
  skipReason: 'not_applicable' | 'later' | 'unclear' | 'other' | null;
  skipNote: string;
  setShowSkipDialog: (show: boolean) => void;
  setSkipReason: (reason: 'not_applicable' | 'later' | 'unclear' | 'other' | null) => void;
  setSkipNote: (note: string) => void;
}

/**
 * Hook for managing SectionEditor action handlers (skip, complete, etc.)
 */
export function useSectionEditorHandlers({
  isSpecialSection,
  activeQuestion,
  isUnknown,
  getNextQuestion,
  toggleQuestionUnknown,
  markQuestionComplete,
  setActiveQuestion,
  onClose,
  showSkipDialog: _showSkipDialog,
  skipReason,
  skipNote,
  setShowSkipDialog,
  setSkipReason,
  setSkipNote
}: UseSectionEditorHandlersParams) {
  const handleSkipClick = useCallback(() => {
    if (isSpecialSection || !activeQuestion) return;
    if (isUnknown) {
      // Clear skip - no dialog needed
      toggleQuestionUnknown(activeQuestion.id);
      // Auto-advance to next question
      const nextQuestion = getNextQuestion();
      if (nextQuestion) {
        setActiveQuestion(nextQuestion.id);
      } else {
        onClose(); // Last question
      }
    } else {
      // Show skip reason dialog
      setShowSkipDialog(true);
      setSkipReason(null);
      setSkipNote('');
    }
  }, [isSpecialSection, activeQuestion, isUnknown, toggleQuestionUnknown, getNextQuestion, setActiveQuestion, onClose, setShowSkipDialog, setSkipReason, setSkipNote]);

  const handleSkipConfirm = useCallback(() => {
    if (!skipReason || isSpecialSection || !activeQuestion) return;
    
    // Build reason string
    let reasonString: string = skipReason;
    if (skipReason === 'other' && skipNote.trim()) {
      reasonString = `other: ${skipNote.trim()}`;
    } else if (skipNote.trim()) {
      reasonString = `${skipReason}: ${skipNote.trim()}`;
    }
    
    // Mark as unknown with reason
    toggleQuestionUnknown(activeQuestion.id, reasonString);
    
    // Close dialog
    setShowSkipDialog(false);
    setSkipReason(null);
    setSkipNote('');
    
    // Auto-advance to next question
    const nextQuestion = getNextQuestion();
    if (nextQuestion) {
      setActiveQuestion(nextQuestion.id);
    } else {
      onClose(); // Last question
    }
  }, [skipReason, skipNote, isSpecialSection, activeQuestion, toggleQuestionUnknown, getNextQuestion, setActiveQuestion, onClose, setShowSkipDialog, setSkipReason, setSkipNote]);

  const handleComplete = useCallback(() => {
    if (isSpecialSection || !activeQuestion) return;
    markQuestionComplete(activeQuestion.id);
    
    // Auto-advance to next question
    const nextQuestion = getNextQuestion();
    if (nextQuestion) {
      setActiveQuestion(nextQuestion.id);
    } else {
      onClose(); // Last question
    }
  }, [isSpecialSection, activeQuestion, markQuestionComplete, getNextQuestion, setActiveQuestion, onClose]);

  return {
    handleSkipClick,
    handleSkipConfirm,
    handleComplete
  };
}


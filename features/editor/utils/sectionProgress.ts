// ========= PLAN2FUND — SECTION PROGRESS HELPERS =========
// Shared functions for question status + completion calculations

import { Question, QuestionStatus } from '@/features/editor/types/plan';

/**
 * Determines whether an answer meets the minimum threshold to count as drafted content.
 * Removes HTML tags before checking length to avoid inflated counts.
 */
export function meetsMinimalAnswerThreshold(content: string): boolean {
  const stripped = (content || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  if (!stripped) return false;

  const wordCount = stripped.split(/\s+/).filter(Boolean).length;
  const bulletCount = (content || '')
    .split('\n')
    .filter((line) => line.trim().match(/^([-*•]|[0-9]+\.)\s+/))
    .length;
  const sentenceCount = stripped.split(/[.!?]/).filter((sentence) => sentence.trim().length > 0).length;

  if (bulletCount >= 1) return true;
  if (sentenceCount >= 2 && wordCount >= 15) return true;
  return wordCount >= 30;
}

/**
 * Converts raw content to a question status for progress tracking.
 */
export function determineQuestionStatus(content: string): QuestionStatus {
  const stripped = (content || '').replace(/<[^>]*>/g, ' ').trim();
  if (!stripped) {
    return 'blank';
  }
  return meetsMinimalAnswerThreshold(content) ? 'complete' : 'draft';
}

/**
 * Calculates section completion based on the number of completed questions.
 */
export function calculateSectionCompletion(questions: Question[]): number {
  if (questions.length === 0) return 0;
  const completed = questions.filter((question) => question.status === 'complete').length;
  return Math.round((completed / questions.length) * 100);
}


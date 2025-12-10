import React from 'react';
import type { Question } from '@/features/editor/lib/types/plan';

/**
 * Simplifies template prompts to short, conversational questions.
 * Works for any language by extracting the main question.
 */
export function simplifyPrompt(templatePrompt: string): string {
  if (!templatePrompt || templatePrompt.trim().length === 0) {
    return 'Answer this question';
  }
  
  // Extract first sentence (before period, question mark, or exclamation)
  const firstSentence = templatePrompt
    .split(/[.!?]/)[0]
    .trim();
  
  if (!firstSentence) {
    return templatePrompt.substring(0, 80).trim();
  }
  
  // Remove common filler words and formal markers (language-agnostic patterns)
  let simplified = firstSentence
    // Remove ellipses
    .replace(/\.\.\./g, '')
    // Remove common filler words (works across languages)
    .replace(/\b(detailliert|bitte|please|kindly|detailed|thoroughly)\b/gi, '')
    // Remove extra whitespace
    .replace(/\s+/g, ' ')
    .trim();
  
  // Capitalize first letter
  if (simplified.length > 0) {
    simplified = simplified.charAt(0).toUpperCase() + simplified.slice(1);
  }
  
  // Limit length
  if (simplified.length > 80) {
    // Try to cut at a word boundary
    const truncated = simplified.substring(0, 77).trim();
    const lastSpace = truncated.lastIndexOf(' ');
    if (lastSpace > 50) {
      simplified = truncated.substring(0, lastSpace) + '...';
    } else {
      simplified = truncated + '...';
    }
  }
  
  return simplified || templatePrompt.substring(0, 80).trim();
}

type QuestionEditorProps = {
  question: Question;
  isExpanded: boolean;
  onToggleExpanded: () => void;
};

export function QuestionEditor({ 
  question, 
  isExpanded, 
  onToggleExpanded 
}: QuestionEditorProps) {
  if (!question) return null;

  return (
    <div className="border-b border-white/20 p-3 bg-slate-800/50 flex-shrink-0">
      <div className="text-sm font-semibold text-white/90">
        ❓ {isExpanded ? question.prompt : simplifyPrompt(question.prompt || '')}
      </div>
      {question.prompt && question.prompt.length > 80 && (
        <button
          onClick={onToggleExpanded}
          className="text-xs text-white/60 hover:text-white/80 mt-1 flex items-center gap-1"
        >
          {isExpanded ? 'Show less ▲' : 'Show full question ▼'}
        </button>
      )}
    </div>
  );
}


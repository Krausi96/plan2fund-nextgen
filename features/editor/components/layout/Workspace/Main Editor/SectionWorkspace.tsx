import React, { Fragment, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import {
  Question,
  Section
} from '@/features/editor/types/plan';
import { useEditorStore } from '@/features/editor/hooks/useEditorStore';
import { useI18n } from '@/shared/contexts/I18nContext';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Card } from '@/shared/components/ui/card';

const SECTION_TONE_HINTS: Record<string, string> = {
  general:
    'Lead with the problem, your innovative solution, and expected impact. Keep it to two or three sentences as suggested in the spec.',
  financial:
    'Highlight revenue, expenses, and cash needs. Consider adding a table or KPI via the Data panel when you reference numbers.',
  innovation:
    'Explain the technology or approach plainly, linking back to datasets or charts if you cite benchmarks.',
  impact:
    'Focus on measurable outcomes and KPIs. Tie qualitative benefits to metrics and reference supporting datasets.',
  consortium:
    'Clarify each partner’s role, governance, and commitment. Use concise paragraphs per the calmer layout guidance.'
};

function getSectionHint(section?: Section, t?: (key: any) => string) {
  if (!section) return '';
  const key = (section.category ?? '').toLowerCase();
  const hintKey = `editor.ui.hint.${key}` as any;
  const translated = t ? (t(hintKey) as string) : null;
  if (translated && translated !== hintKey) return translated;
  return (
    SECTION_TONE_HINTS[key] ??
    (t
      ? (t('editor.ui.hint.default' as any) as string)
      : 'Keep paragraphs tight, highlight the why, and point to data or KPIs when possible.')
  );
}

type SectionWorkspaceProps = {
  section?: Section;
  onAnswerChange: (questionId: string, content: string) => void;
  onSelectQuestion: (questionId: string) => void;
  activeQuestionId: string | null;
  onToggleUnknown: (questionId: string, note?: string) => void;
  onMarkComplete: (questionId: string) => void;
};

export function SectionWorkspace({
  section,
  onAnswerChange,
  onSelectQuestion,
  activeQuestionId,
  onToggleUnknown,
  onMarkComplete
}: SectionWorkspaceProps) {
  const { t } = useI18n();

  if (!section) {
    return <SectionWorkspaceSkeleton message={(t('editor.ui.selectSection' as any) as string) || 'Select a section to begin.'} />;
  }

  const sectionHint = getSectionHint(section, t);
  const activeQuestion =
    section.questions.find((q) => q.id === activeQuestionId) ?? section.questions[0] ?? null;

  return (
    <main className="space-y-1">
      <Card className="relative overflow-hidden rounded-2xl border border-blue-600/40 bg-gradient-to-b from-slate-950 via-blue-900 to-slate-950 p-6 shadow-xl">
        <div className="absolute inset-0 bg-black/30 backdrop-blur-2xl" />
        <div className="relative z-10 space-y-3">
          {section.category && (
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/70">
              {(t(`editor.ui.category.${section.category.toLowerCase()}` as any) as string) ||
                section.category.toUpperCase()}
            </p>
          )}
          <h1 className="text-3xl font-semibold text-white leading-tight drop-shadow-lg">{section.title}</h1>
          {(sectionHint || section.description) && (
            <p className="text-sm text-white/80 leading-relaxed">{sectionHint || section.description}</p>
          )}
        </div>
      </Card>

      {activeQuestion && (
        <QuestionCard
          question={activeQuestion}
          section={section}
          activeQuestionId={activeQuestionId}
          isActive
          panelId={`question-panel-${activeQuestion.id}`}
          onFocus={() => onSelectQuestion(activeQuestion.id)}
          onSelectQuestion={onSelectQuestion}
          onChange={(content) => onAnswerChange(activeQuestion.id, content)}
          onToggleUnknown={(note) => onToggleUnknown(activeQuestion.id, note)}
          onMarkComplete={onMarkComplete}
        />
      )}
    </main>
  );
}

type QuestionCardProps = {
  question: Question;
  section?: Section;
  activeQuestionId: string | null;
  isActive: boolean;
  panelId?: string;
  onFocus: () => void;
  onSelectQuestion: (questionId: string) => void;
  onChange: (content: string) => void;
  onToggleUnknown: (note?: string) => void;
  onMarkComplete: (questionId: string) => void;
};

function QuestionCard({
  question,
  section,
  activeQuestionId,
  isActive,
  panelId,
  onFocus,
  onSelectQuestion,
  onChange,
  onToggleUnknown,
  onMarkComplete
}: QuestionCardProps) {
  const { t } = useI18n();
  const { plan, setActiveSection } = useEditorStore();
  const isUnknown = question.status === 'unknown';
  const isComplete = question.status === 'complete';
  const isDraft = question.status === 'draft';
  const hasContent = isComplete || isDraft;
  const [isUnknownModalOpen, setUnknownModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(!isComplete);
  const isLastQuestion =
    section && section.questions.length > 0 && section.questions[section.questions.length - 1].id === question.id;

  const handleToggleUnknown = (event?: React.MouseEvent<HTMLButtonElement>) => {
    event?.stopPropagation();
    if (isUnknown) {
      onToggleUnknown();
      return;
    }
    setUnknownModalOpen(true);
  };

  useEffect(() => {
    setIsEditing(!isComplete);
  }, [isComplete, question.id]);

  const cardBorderClass = 'border-blue-600/50 text-white/90';
  const gradientClass = 'bg-gradient-to-b from-slate-950 via-blue-900 to-slate-950';
  const overlayClass = isComplete ? 'bg-black/10' : 'bg-black/20';
  const editorLocked = isComplete && !isEditing;

  return (
    <Fragment>
      <Card
        id={panelId}
        role="tabpanel"
        aria-live="polite"
        className={`relative overflow-hidden rounded-2xl p-6 space-y-2 border transition-all backdrop-blur-xl ${cardBorderClass} ${
          isActive && !hasContent ? 'border-blue-400 ring-1 ring-blue/20 shadow-2xl' : 'shadow-xl'
        }`}
        onClick={onFocus}
      >
        <div className={`absolute inset-0 ${gradientClass}`} />
        <div className={`absolute inset-0 ${overlayClass} backdrop-blur-2xl`} />
        {section && section.questions.length > 1 && (
          <div className="pb-3 border-b border-white/30 mb-3 relative z-10">
            <div className="mb-2">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-white/90">
                {(t('editor.header.prompts' as any) as string) || 'Prompts'}
              </h2>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto" role="tablist" aria-label="Section prompts">
              {section.questions.map((q, index) => {
                const isActiveTab = q.id === activeQuestionId;
                const status = q.status;
                const intentClasses =
                  status === 'complete'
                    ? 'text-white'
                    : status === 'unknown'
                    ? 'text-red-300'
                    : status === 'draft'
                    ? 'text-blue-300'
                    : 'text-white/80';
                const icon =
                  status === 'complete' ? (
                    <CompletionTickIcon className="h-3.5 w-3.5 text-emerald-300" />
                  ) : status === 'unknown' ? (
                    <QuestionMarkCircleIcon className="h-3.5 w-3.5" />
                  ) : (
                    <EllipsisHorizontalIcon className="h-3.5 w-3.5" />
                  );

                return (
                  <button
                    key={q.id}
                    role="tab"
                    aria-selected={isActiveTab}
                    aria-controls={`question-panel-${q.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectQuestion(q.id);
                    }}
                    className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 relative ${
                      isActiveTab
                        ? 'border-blue-400 bg-blue-500/30 text-white shadow-lg shadow-blue-900/30 backdrop-blur-md'
                        : 'border-white/50 bg-white/10 text-white/80 hover:border-blue-300/70 hover:bg-white/20 backdrop-blur-sm'
                    }`}
                  >
                    <span>{index + 1}</span>
                    <span className={`flex items-center gap-1 ${intentClasses}`}>{icon}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex items-start justify-between gap-2 relative z-10">
          <p
            className={`text-2xl font-semibold leading-snug flex-1 drop-shadow-lg ${
              isComplete ? 'text-white/85' : 'text-white'
            }`}
          >
            {question.prompt}
          </p>
          <div className="flex flex-wrap gap-1.5 flex-shrink-0">
            {question.required && (
              <Badge variant="danger" className={`text-xs ${isComplete ? 'bg-white/30 text-white border-white/50' : ''}`}>
                {(t('editor.ui.required' as any) as string) || 'Required'}
              </Badge>
            )}
            {isUnknown && (
              <Badge variant="warning" className={`text-xs ${isComplete ? 'bg-white/30 text-white border-white/50' : ''}`}>
                {(t('editor.ui.unknown' as any) as string) || 'Unknown'}
                {question.statusNote ? ` — ${question.statusNote}` : ''}
              </Badge>
            )}
          </div>
        </div>

        <div onClick={(e) => e.stopPropagation()} className="relative z-10 mb-4">
          <SimpleTextEditor
            content={question.answer ?? ''}
            onChange={onChange}
            placeholder={question.placeholder}
            variant={isComplete ? 'complete' : 'default'}
            disabled={editorLocked}
          />
        </div>

        <div
          className="flex flex-wrap gap-1.5 relative z-10 border-t border-white/15 pt-3 mt-2"
          onClick={(e) => e.stopPropagation()}
        >
          {!isComplete &&
            (isLastQuestion ? (
              <Button
                type="button"
                onClick={() => {
                  onMarkComplete(question.id);
                  const currentSectionIndex = plan?.sections.findIndex((s) => s.id === section?.id) ?? -1;
                  const nextSection = plan?.sections[currentSectionIndex + 1];
                  if (nextSection) {
                    setActiveSection(nextSection.id);
                  }
                }}
                variant="success"
                className="min-w-[180px] justify-center text-base bg-green-700 hover:bg-green-800 text-white font-semibold uppercase tracking-wide border border-green-700 rounded-lg shadow-lg hover:shadow-xl drop-shadow-lg"
              >
                {(t('editor.ui.completeSection' as any) as string) || 'Complete Section'}
              </Button>
            ) : (
              <Button
                type="button"
                variant="success"
                onClick={() => onMarkComplete(question.id)}
                className="min-w-[180px] justify-center text-base bg-green-700 hover:bg-green-800 text-white font-semibold uppercase tracking-wide rounded-lg shadow-lg hover:shadow-xl drop-shadow-lg transition-colors flex items-center gap-2"
              >
                {(t('editor.ui.complete' as any) as string) || 'Complete'}
              </Button>
            ))}
          {!isComplete ? (
            <Button
              type="button"
              variant="outline"
              className={`min-w-[180px] justify-center text-sm text-white ${
                isDraft ? 'border-white/50 hover:bg-white/15' : 'border-white/40 hover:bg-white/10'
              }`}
              onClick={handleToggleUnknown}
            >
              {isUnknown
                ? (t('editor.ui.clearUnknownStatus' as any) as string) || 'Clear unknown status'
                : (t('editor.ui.skipQuestion' as any) as string) || 'Skip'}
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              className="min-w-[180px] justify-center text-sm text-white/80 border-white/30 hover:bg-white/10"
              onClick={(e) => {
                e.stopPropagation();
                if (editorLocked) {
                  setIsEditing(true);
                } else {
                  onFocus();
                }
              }}
            >
              {(t('editor.ui.edit' as any) as string) || 'Edit'}
            </Button>
          )}
        </div>
      </Card>
      <UnknownNoteModal
        open={isUnknownModalOpen}
        onClose={() => setUnknownModalOpen(false)}
        onSave={(note) => {
          onToggleUnknown(note);
          setUnknownModalOpen(false);
        }}
      />
    </Fragment>
  );
}

function UnknownNoteModal({
  open,
  onClose,
  onSave
}: {
  open: boolean;
  onClose: () => void;
  onSave: (note?: string) => void;
}) {
  const { t } = useI18n();
  const [note, setNote] = useState('');

  useEffect(() => {
    if (open) {
      setNote('');
    }
  }, [open]);

  if (!open || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 px-4">
      <div
        className="card max-w-md w-full space-y-4"
        role="dialog"
        aria-modal="true"
        aria-label={(t('editor.ui.unknownNoteLabel' as any) as string) || 'Add note explaining unknown status'}
      >
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-neutral-900">
            {(t('editor.ui.unknownNoteLabel' as any) as string) || 'Add a note'}
          </h2>
          <p className="text-sm text-neutral-600">
            {(t('editor.ui.unknownNoteDescription' as any) as string) ||
              'Explain why this answer is marked as unknown so collaborators understand the gap.'}
          </p>
        </div>
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-primary-400 focus:ring-2 focus:ring-primary/30"
          rows={4}
          placeholder={(t('editor.ui.unknownNotePlaceholder' as any) as string) || 'Optional note'}
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            {(t('editor.ui.cancel' as any) as string) || 'Cancel'}
          </Button>
          <Button type="button" onClick={() => onSave(note.trim() ? note.trim() : undefined)}>
            {(t('editor.ui.saveNote' as any) as string) || 'Save note'}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function SimpleTextEditor({
  content,
  onChange,
  placeholder,
  variant = 'default',
  disabled = false
}: {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  variant?: 'default' | 'complete';
  disabled?: boolean;
}) {
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { t } = useI18n();

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(event.target.value);
  };

  const containerClasses =
    variant === 'complete'
      ? 'border-slate-200/40 bg-slate-950/70 text-white/90 shadow-[inset_0_1px_8px_rgba(15,23,42,0.35)]'
      : 'border-white/15 bg-slate-950/60 text-white/95 shadow-[inset_0_1px_8px_rgba(15,23,42,0.5)]';

  const placeholderText =
    placeholder || ((t('editor.ui.answerPlaceholder' as any) as string) || 'Start writing...');

  const focusRing =
    variant === 'complete'
      ? 'ring-1 ring-emerald-200 border-emerald-200'
      : 'border-blue-400/70 ring-1 ring-blue/30 shadow-[inset_0_1px_12px_rgba(30,64,175,0.45)]';

  return (
    <div
      className={`relative rounded-2xl border backdrop-blur-xl transition-all duration-200 ${
        isFocused && !disabled ? focusRing : ''
      } ${containerClasses}`}
      onClick={() => {
        if (!disabled) {
          textareaRef.current?.focus();
        }
      }}
    >
      {disabled && <div className="absolute inset-0 rounded-2xl bg-white/10 pointer-events-none" />}
      <textarea
        ref={textareaRef}
        value={content}
        onChange={handleChange}
        onFocus={() => {
          if (!disabled) {
            setIsFocused(true);
          }
        }}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholderText}
        aria-label={placeholderText}
        readOnly={disabled}
        tabIndex={disabled ? -1 : 0}
        className={`w-full resize-none bg-transparent p-4 text-sm leading-relaxed focus:outline-none md:min-h-[120px] min-h-[90px] placeholder:text-white/40 ${
          variant === 'complete' ? 'text-white/90' : 'text-white/95'
        } ${disabled ? 'cursor-not-allowed opacity-90' : ''}`}
        style={{
          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          lineHeight: '1.7',
          fontSize: '14px'
        }}
      />
    </div>
  );
}

function SectionWorkspaceSkeleton({ message }: { message: string }) {
  return (
    <div className="space-y-4 rounded-3xl border border-blue-600/30 bg-gradient-to-b from-slate-950/70 via-blue-900/40 to-slate-950/70 p-6 shadow-xl">
      <div className="animate-pulse space-y-3">
        <div className="h-4 w-24 rounded bg-white/15" />
        <div className="h-8 w-2/3 rounded bg-white/15" />
        <div className="h-4 w-full rounded bg-white/10" />
        <div className="h-4 w-5/6 rounded bg-white/10" />
        <div className="rounded-2xl border border-dashed border-white/20 p-6 text-center text-sm text-white/70">
          {message}
        </div>
      </div>
    </div>
  );
}

type IconProps = React.SVGProps<SVGSVGElement>;

const CompletionTickIcon = (props: IconProps) => (
  <svg viewBox="0 0 20 20" fill="currentColor" {...props}>
    <path
      fillRule="evenodd"
      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
      clipRule="evenodd"
    />
  </svg>
);

const QuestionMarkCircleIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
    <circle cx="12" cy="12" r="8.25" strokeWidth={1.5} />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M12 15.75h.007M9.75 9a2.25 2.25 0 114.5 0c0 1.125-.75 1.5-1.5 2.25-.375.375-.75.75-.75 1.5"
    />
  </svg>
);

const EllipsisHorizontalIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <circle cx="6" cy="12" r="1.5" />
    <circle cx="12" cy="12" r="1.5" />
    <circle cx="18" cy="12" r="1.5" />
  </svg>
);


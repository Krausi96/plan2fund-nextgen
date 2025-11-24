import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import {
  AncillaryContent,
  AppendixItem,
  BusinessPlan,
  Reference,
  ProgramSummary,
  ProductType,
  Question,
  Section,
  TitlePage
} from '@/features/editor/types/plan';
import {
  normalizeProgramInput,
  ProgressSummary
} from '@/features/editor/hooks/useEditorStore';
import AncillaryPanel from '../../views/AncillaryPanel';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Card } from '@/shared/components/ui/card';
import { useI18n } from '@/shared/contexts/I18nContext';
import { useEditorStore } from '@/features/editor/hooks/useEditorStore';

export type ConnectCopy = {
  badge: string;
  heading: string;
  description: string;
  openFinder: string;
  pasteLink: string;
  inputLabel: string;
  placeholder: string;
  example: string;
  submit: string;
  error: string;
};

export interface PlanConfiguratorProps {
  plan: BusinessPlan;
  programSummary: ProgramSummary | null;
  onChangeProduct: (product: ProductType) => void;
  onConnectProgram: (value: string | null) => void;
  onOpenProgramFinder: () => void;
  programLoading: boolean;
  programError: string | null;
  onUpdateTitlePage: (titlePage: TitlePage) => void;
  onOpenFrontMatter: () => void;
  productOptions: Array<{ value: ProductType; label: string; description: string }>;
  connectCopy: ConnectCopy;
}

export function PlanConfigurator({
  plan,
  programSummary,
  onChangeProduct,
  onConnectProgram,
  onOpenProgramFinder,
  programLoading,
  programError,
  onUpdateTitlePage,
  onOpenFrontMatter,
  productOptions,
  connectCopy
}: PlanConfiguratorProps) {
  const { t } = useI18n();
  const [titleDraft, setTitleDraft] = useState(plan.titlePage.planTitle);
  const [manualValue, setManualValue] = useState('');
  const [manualError, setManualError] = useState<string | null>(null);
  const [showManualInput, setShowManualInput] = useState(false);
  const [showProductTooltip, setShowProductTooltip] = useState(false);
  const [showProgramTooltip, setShowProgramTooltip] = useState(false);

  useEffect(() => {
    setTitleDraft(plan.titlePage.planTitle);
  }, [plan.titlePage.planTitle]);

  const commitTitlePageChange = (updates: Partial<TitlePage>) => {
    onUpdateTitlePage({ ...plan.titlePage, ...updates });
  };

  const headerCardClasses =
    'relative h-24 space-y-1 rounded-lg border border-blue-600/50 overflow-hidden px-2.5 py-1.5 shadow-xl backdrop-blur-xl';

  const selectedProductMeta =
    productOptions.find((option) => option.value === plan.productType) ?? productOptions[0];

  const handleManualConnect = () => {
    setManualError(null);
    const normalized = normalizeProgramInput(manualValue);
    if (!normalized) {
      setManualError(connectCopy.error);
      return;
    }
    onConnectProgram(normalized);
  };

  return (
    <div className="flex flex-col md:flex-row gap-3 w-full">
      {/* Plan Title */}
      <Card className={`${headerCardClasses} flex-1 flex flex-col`}>
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-blue-900 to-slate-800" />
        <div className="relative z-10 flex flex-col h-full">
          <div className="flex items-center justify-between gap-2 h-6 mb-3">
            <p className="text-xl font-bold uppercase tracking-wider text-white">
              {(t('editor.header.planTitle' as any) as string) || 'Plan Title'}
            </p>
            <Button variant="ghost" size="sm" className="text-blue-100 hover:text-white text-xs h-6 px-2" onClick={onOpenFrontMatter}>
              {(t('editor.ui.edit' as any) as string) || 'Edit'}
            </Button>
          </div>
          <div className="flex-1 flex items-center">
            <input
              value={titleDraft}
              onChange={(event) => setTitleDraft(event.target.value)}
              onBlur={() => {
                const next = titleDraft.trim() || 'Business Plan';
                if (next !== plan.titlePage.planTitle) {
                  commitTitlePageChange({ planTitle: next });
                } else {
                  setTitleDraft(plan.titlePage.planTitle);
                }
              }}
              className="w-full rounded border border-slate-200 bg-white px-2.5 py-2 h-8 text-sm font-semibold text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-400"
              placeholder={(t('editor.ui.planNamePlaceholder' as any) as string) || 'Plan name'}
            />
          </div>
        </div>
      </Card>

      {/* Product Type Selector */}
      <Card className={`${headerCardClasses} flex-1 flex flex-col`}>
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-blue-900 to-slate-800" />
        <div className="relative z-10 flex flex-col h-full">
          <div className="flex items-center gap-1.5 h-6 mb-3">
            <span className="text-xl font-bold uppercase tracking-wider text-white">
              {(t('editor.header.productType' as any) as string) || 'Product Type'}
            </span>
            <div className="relative">
              <button
                type="button"
                onMouseEnter={() => setShowProductTooltip(true)}
                onMouseLeave={() => setShowProductTooltip(false)}
                className="text-white hover:text-blue-100 text-xs font-bold w-4 h-4 rounded-full border border-white/50 bg-white/20 flex items-center justify-center"
              >
                ?
              </button>
              {showProductTooltip && (
                <div className="absolute z-50 left-0 top-5 w-64 p-2 bg-slate-900 text-white text-xs rounded shadow-lg border border-slate-700">
                  {selectedProductMeta?.description}
                </div>
              )}
            </div>
          </div>
          <div className="relative flex-1 flex items-center">
            <select
              value={plan.productType ?? 'submission'}
              onChange={(event) => onChangeProduct(event.target.value as ProductType)}
              className="w-full appearance-none rounded border border-slate-300 bg-white px-2.5 h-8 text-sm font-bold text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-400"
              style={{ paddingTop: 0, paddingBottom: 0, lineHeight: '2rem' }}
            >
              {productOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-slate-600 text-xs font-bold">
              ▾
            </span>
          </div>
        </div>
      </Card>

      {/* Program Connection */}
      <Card className={`${headerCardClasses} flex-1 flex flex-col`}>
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-blue-900 to-slate-800" />
        <div className="relative z-10 flex flex-col h-full">
          <div className="flex items-center gap-1.5 h-6 mb-3">
            <p className="text-xl font-bold uppercase tracking-wider text-white">
              {connectCopy.badge}
            </p>
            <div className="relative">
              <button
                type="button"
                onMouseEnter={() => setShowProgramTooltip(true)}
                onMouseLeave={() => setShowProgramTooltip(false)}
                className="text-white hover:text-blue-100 text-xs font-bold w-4 h-4 rounded-full border border-white/50 bg-white/20 flex items-center justify-center"
              >
                ?
              </button>
              {showProgramTooltip && (
                <div className="absolute z-50 left-0 top-5 w-64 p-2 bg-slate-900 text-white text-xs rounded shadow-lg border border-slate-700">
                  {connectCopy.description}
                </div>
              )}
            </div>
          </div>
          <div className="flex-1 flex items-center">
            {programSummary ? (
              <div className="w-full rounded border border-blue-300 bg-blue-100/60 px-2 py-1.5 h-8 flex items-center">
                <div className="flex items-center justify-between gap-2 w-full">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-blue-900 truncate">{programSummary.name}</p>
                    {programSummary.amountRange && (
                      <p className="text-[10px] text-blue-800 mt-0.5">{programSummary.amountRange}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-blue-800 hover:text-blue-900 text-xs h-6 px-1 flex-shrink-0"
                    onClick={() => onConnectProgram(null)}
                  >
                    ×
                  </Button>
                </div>
              </div>
            ) : (
              <div className="w-full flex flex-wrap gap-1.5">
                <button
                  onClick={onOpenProgramFinder}
                  className="inline-flex items-center justify-center px-4 py-0 h-8 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg text-xs"
                >
                  {connectCopy.openFinder}
                </button>
                <button
                  onClick={() => setShowManualInput((prev) => !prev)}
                  className="inline-flex items-center justify-center px-4 py-0 h-8 border-2 border-white/30 hover:border-white/50 text-white font-semibold rounded-lg transition-colors duration-200 backdrop-blur-sm hover:bg-white/10 text-xs"
                >
                  {connectCopy.pasteLink}
                </button>
              </div>
            )}
          </div>
        </div>
        {showManualInput && !programSummary && (
          <div className="space-y-1 mt-1.5">
            <label className="text-[10px] font-semibold text-slate-800 block">
              {connectCopy.inputLabel}
            </label>
            <div className="flex flex-col gap-1.5 sm:flex-row">
              <input
                value={manualValue}
                onChange={(event) => setManualValue(event.target.value)}
                placeholder={connectCopy.placeholder}
                className="flex-1 rounded border border-slate-300 bg-white px-2 py-1.5 h-8 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-400"
              />
              <Button
                type="button"
                size="sm"
                className="sm:w-auto text-xs h-8 px-3"
                onClick={handleManualConnect}
                disabled={programLoading}
              >
                {programLoading ? '...' : connectCopy.submit}
              </Button>
            </div>
            <p className="text-[10px] text-slate-600">{connectCopy.example}</p>
            {(manualError || programError) && (
              <p className="text-[10px] text-red-600">{manualError || programError}</p>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}

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

type WorkspaceProps = {
  plan: BusinessPlan;
  isAncillaryView: boolean;
  activeSection: Section | null;
  activeQuestionId: string | null;
  onSelectQuestion: (questionId: string) => void;
  onAnswerChange: (questionId: string, content: string) => void;
  onAskAI: (questionId?: string) => void;
  onToggleUnknown: (questionId: string, note?: string) => void;
  onMarkComplete: (questionId: string) => void;
  onTitlePageChange: (titlePage: TitlePage) => void;
  onAncillaryChange: (updates: Partial<AncillaryContent>) => void;
  onReferenceAdd: (reference: Reference) => void;
  onReferenceUpdate: (reference: Reference) => void;
  onReferenceDelete: (id: string) => void;
  onAppendixAdd: (item: AppendixItem) => void;
  onAppendixUpdate: (item: AppendixItem) => void;
  onAppendixDelete: (id: string) => void;
  onRunRequirements: () => void;
  progressSummary: ProgressSummary[];
};

export function Workspace({
  plan,
  isAncillaryView,
  activeSection,
  activeQuestionId,
  onSelectQuestion,
  onAnswerChange,
  onAskAI,
  onToggleUnknown,
  onMarkComplete,
  onTitlePageChange,
  onAncillaryChange,
  onReferenceAdd,
  onReferenceUpdate,
  onReferenceDelete,
  onAppendixAdd,
  onAppendixUpdate,
  onAppendixDelete,
  onRunRequirements,
  progressSummary
}: WorkspaceProps) {
  if (isAncillaryView) {
    return (
      <AncillaryWorkspace
        plan={plan}
        onTitlePageChange={onTitlePageChange}
        onAncillaryChange={onAncillaryChange}
        onReferenceAdd={onReferenceAdd}
        onReferenceUpdate={onReferenceUpdate}
        onReferenceDelete={onReferenceDelete}
        onAppendixAdd={onAppendixAdd}
        onAppendixUpdate={onAppendixUpdate}
        onAppendixDelete={onAppendixDelete}
        onRunRequirements={onRunRequirements}
        progressSummary={progressSummary}
      />
    );
  }

  return (
    <SectionWorkspace
      section={activeSection ?? plan.sections[0]}
      activeQuestionId={activeQuestionId}
      onSelectQuestion={onSelectQuestion}
      onAnswerChange={onAnswerChange}
      onAskAI={onAskAI}
      onToggleUnknown={onToggleUnknown}
      onMarkComplete={onMarkComplete}
    />
  );
}

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

function AncillaryWorkspace({
  plan,
  onTitlePageChange,
  onAncillaryChange,
  onReferenceAdd,
  onReferenceUpdate,
  onReferenceDelete,
  onAppendixAdd,
  onAppendixUpdate,
  onAppendixDelete,
  onRunRequirements,
  progressSummary
}: {
  plan: BusinessPlan;
  onTitlePageChange: (titlePage: TitlePage) => void;
  onAncillaryChange: (updates: Partial<AncillaryContent>) => void;
  onReferenceAdd: (reference: Reference) => void;
  onReferenceUpdate: (reference: Reference) => void;
  onReferenceDelete: (referenceId: string) => void;
  onAppendixAdd: (item: AppendixItem) => void;
  onAppendixUpdate: (item: AppendixItem) => void;
  onAppendixDelete: (appendixId: string) => void;
  onRunRequirements: () => void;
  progressSummary: ProgressSummary[];
}) {
  const { t } = useI18n();
  return (
    <div className="space-y-6">
      <div className="card bg-white lg:sticky lg:top-4 lg:z-10">
        <p className="text-[11px] tracking-[0.35em] uppercase text-neutral-500">Ancillary</p>
        <h1 className="text-2xl font-semibold text-neutral-900 mt-1">
          {(t('editor.section.front_back_matter' as any) as string) || 'Front & Back Matter'}
        </h1>
        <p className="text-sm text-neutral-600 mt-2">
          Maintain the title page, table of contents, references, and appendices in one cohesive workspace. These
          elements frame the narrative, so keeping them aligned here speeds up reviews.
        </p>
      </div>
      <div className="card bg-surface">
        <AncillaryPanel
          titlePage={plan.titlePage}
          ancillary={plan.ancillary}
          references={plan.references}
          appendices={plan.appendices ?? []}
          onTitlePageChange={onTitlePageChange}
          onAncillaryChange={onAncillaryChange}
          onReferenceAdd={onReferenceAdd}
          onReferenceUpdate={onReferenceUpdate}
          onReferenceDelete={onReferenceDelete}
          onAppendixAdd={onAppendixAdd}
          onAppendixUpdate={onAppendixUpdate}
          onAppendixDelete={onAppendixDelete}
          onRunRequirementsCheck={onRunRequirements}
          progressSummary={progressSummary}
        />
      </div>
    </div>
  );
}

function SectionWorkspace({
  section,
  onAnswerChange,
  onSelectQuestion,
  activeQuestionId,
  onAskAI,
  onToggleUnknown,
  onMarkComplete
}: {
  section?: Section;
  onAnswerChange: (questionId: string, content: string) => void;
  onSelectQuestion: (questionId: string) => void;
  activeQuestionId: string | null;
  onAskAI: (questionId?: string) => void;
  onToggleUnknown: (questionId: string, note?: string) => void;
  onMarkComplete: (questionId: string) => void;
}) {
  const { t } = useI18n();

  if (!section) {
    return (
      <div className="rounded-3xl border border-dashed border-neutral-200 bg-white p-12 text-center text-sm text-neutral-500">
        {(t('editor.ui.selectSection' as any) as string) || 'Select a section to begin.'}
      </div>
    );
  }

  const sectionHint = getSectionHint(section, t);
  const activeQuestion =
    section.questions.find((q) => q.id === activeQuestionId) ?? section.questions[0] ?? null;

  return (
    <main className="space-y-1">
      <Card className="space-y-1 border border-blue-600/50 relative overflow-hidden backdrop-blur-lg shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-blue-900 to-slate-950" />
        <div className="absolute inset-0 bg-black/20 backdrop-blur-xl" />
        <div className="relative z-10">
          {section.category && (
            <p className="text-xs font-medium uppercase tracking-[0.25em] text-white">
              {(t(`editor.ui.category.${section.category.toLowerCase()}` as any) as string) ||
                section.category.toUpperCase()}
            </p>
          )}
          <h1 className="text-3xl font-semibold text-white leading-tight drop-shadow-lg">{section.title}</h1>
          {(sectionHint || section.description) && (
            <p className="text-sm text-white leading-relaxed">{sectionHint || section.description}</p>
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
          onAskAI={() => onAskAI(activeQuestion.id)}
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
  onAskAI: () => void;
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
  onAskAI,
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
  const isLastQuestion =
    section && section.questions.length > 0 && section.questions[section.questions.length - 1].id === question.id;
  const isSectionComplete = section && section.questions.every((q) => q.status === 'complete');

  const handleToggleUnknown = (event?: React.MouseEvent<HTMLButtonElement>) => {
    event?.stopPropagation();
    if (isUnknown) {
      onToggleUnknown();
      return;
    }
    setUnknownModalOpen(true);
  };

  return (
    <>
      <Card
        id={panelId}
        role="tabpanel"
        aria-live="polite"
        className={`space-y-2 border transition-all relative overflow-hidden backdrop-blur-lg shadow-xl ${
          'border-blue-600/50'
        } ${isActive && !hasContent ? 'border-blue-400 ring-1 ring-blue/20 shadow-2xl' : ''}`}
        onClick={onFocus}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-blue-900 to-slate-950" />
        <div className="absolute inset-0 bg-black/15 backdrop-blur-xl" />
        {section && section.questions.length > 1 && (
          <div className="pb-1.5 border-b border-white/30 mb-1.5 relative z-10">
            <div className="mb-3">
              <h2 className="text-xl font-bold uppercase tracking-wider text-white">
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
                    <CheckCircleIcon className="h-3.5 w-3.5" />
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
                    {status === 'complete' && (
                      <CheckCircleIcon className="h-4 w-4 text-green-500 absolute -top-1 -right-1 bg-slate-900 rounded-full p-0.5" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex items-start justify-between gap-2 relative z-10">
          <p className="text-2xl font-semibold leading-snug flex-1 drop-shadow-lg text-white">{question.prompt}</p>
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
          <SimpleTextEditor content={question.answer ?? ''} onChange={onChange} placeholder={question.placeholder} />
        </div>

        <div
          className="flex flex-wrap gap-1.5 relative z-10 border-t border-white/15 pt-3 mt-2"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            type="button"
            variant="outline"
            className="min-w-[180px] justify-center text-sm text-white border-white/40 hover:bg-white/10"
            onClick={(e) => {
              e.stopPropagation();
              onAskAI();
            }}
          >
            {(t('editor.ui.askAI' as any) as string) || 'Ask AI'}
          </Button>
          {!isComplete && (
            <Button
              type="button"
              variant="success"
              onClick={() => onMarkComplete(question.id)}
              className="min-w-[180px] justify-center text-base bg-green-700 hover:bg-green-800 text-white font-semibold uppercase tracking-wide rounded-lg shadow-lg hover:shadow-xl drop-shadow-lg transition-colors flex items-center gap-2"
            >
              {(t('editor.ui.complete' as any) as string) || 'Complete'}
            </Button>
          )}
          {isLastQuestion && (
            <Button
              type="button"
              onClick={() => {
                if (!isComplete) {
                  onMarkComplete(question.id);
                }
                const currentSectionIndex = plan?.sections.findIndex((s) => s.id === section?.id) ?? -1;
                const nextSection = plan?.sections[currentSectionIndex + 1];
                if (nextSection) {
                  setActiveSection(nextSection.id);
                }
              }}
              variant="success"
              className="min-w-[180px] justify-center text-base bg-green-700 hover:bg-green-800 text-white font-semibold uppercase tracking-wide border border-green-700 rounded-lg shadow-lg hover:shadow-xl drop-shadow-lg"
            >
              {isSectionComplete
                ? (t('editor.ui.nextSection' as any) as string) || 'Next Section'
                : (t('editor.ui.completeSection' as any) as string) || 'Complete Section'}
            </Button>
          )}
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
                : (t('editor.ui.markAsUnknown' as any) as string) || 'Mark as unknown'}
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              className="min-w-[180px] justify-center text-sm text-white border-white/60 hover:bg-white/20"
              onClick={(e) => {
                e.stopPropagation();
                onFocus();
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
    </>
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
  placeholder
}: {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}) {
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(event.target.value);
  };

  return (
    <div
      className={`rounded-2xl border backdrop-blur-xl transition-all duration-200 shadow-[inset_0_1px_8px_rgba(15,23,42,0.5)] bg-slate-950/60 ${
        isFocused ? 'border-blue-400/70 ring-1 ring-blue/30 shadow-[inset_0_1px_12px_rgba(30,64,175,0.45)]' : 'border-white/15'
      }`}
      onClick={() => textareaRef.current?.focus()}
    >
      <textarea
        ref={textareaRef}
        value={content}
        onChange={handleChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder || 'Start writing...'}
        aria-label={placeholder || 'Prompt response'}
        className="w-full resize-none bg-transparent p-4 text-sm leading-relaxed text-white/95 placeholder:text-white/40 focus:outline-none md:min-h-[120px] min-h-[90px]"
        style={{
          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, sans-serif',
          lineHeight: '1.7',
          fontSize: '14px'
        }}
      />
    </div>
  );
}

type IconProps = React.SVGProps<SVGSVGElement>;

const CheckCircleIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="m9 12.75 1.5 1.5 4-4" />
    <circle cx="12" cy="12" r="8.25" strokeWidth={1.5} />
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


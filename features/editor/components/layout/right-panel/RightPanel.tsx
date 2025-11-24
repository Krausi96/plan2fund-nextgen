import React from 'react';

import DataPanel from '../../views/DataPanel';
import PreviewPanel from '../../views/PreviewPanel';
import {
  AISuggestionIntent,
  AISuggestionOptions,
  ProgressSummary,
  useEditorStore,
  validateQuestionRequirements
} from '@/features/editor/hooks/useEditorStore';
import {
  BusinessPlan,
  Dataset,
  KPI,
  MediaAsset,
  Question,
  RightPanelView,
  Section
} from '@/features/editor/types/plan';
import { Button } from '@/shared/components/ui/button';
import { useI18n } from '@/shared/contexts/I18nContext';

type RequirementIssue = ReturnType<typeof validateQuestionRequirements>['issues'][number];

type RightPanelProps = {
  view: RightPanelView;
  setView: (view: RightPanelView) => void;
  section?: Section;
  question?: Question;
  plan: BusinessPlan;
  onDatasetCreate: (dataset: Dataset) => void;
  onKpiCreate: (kpi: KPI) => void;
  onMediaCreate: (asset: MediaAsset) => void;
  onAttachDataset: (dataset: Dataset) => void;
  onAttachKpi: (kpi: KPI) => void;
  onAttachMedia: (asset: MediaAsset) => void;
  onRunRequirements: () => void;
  progressSummary: ProgressSummary[];
  onAskAI: (questionId?: string, options?: AISuggestionOptions) => void;
  onAnswerChange: (questionId: string, content: string) => void;
};

export default function RightPanel({
  view,
  setView,
  section,
  question,
  plan,
  onDatasetCreate,
  onKpiCreate,
  onMediaCreate,
  onAttachDataset,
  onAttachKpi,
  onAttachMedia,
  onRunRequirements,
  progressSummary,
  onAskAI,
  onAnswerChange
}: RightPanelProps) {
  const [requirementsChecked, setRequirementsChecked] = React.useState(false);
  const activeView = view === 'requirements' ? 'preview' : view;
  const effectiveView = (['ai', 'data', 'preview'].includes(activeView) ? activeView : 'ai') as
    | 'ai'
    | 'data'
    | 'preview';

  const handleQuickAsk = (intent: AISuggestionIntent) => {
    if (!question) return;
    onAskAI(question.id, { intent });
  };

  const handleAskForStructure = () => {
    if (!question) return;
    setView('ai');
    onAskAI(question.id, { intent: 'data' });
  };

  const { t } = useI18n();
  const tabs: Array<{ key: 'ai' | 'data' | 'preview'; label: string }> = [
    { key: 'ai', label: (t('editor.ui.tabs.assistant' as any) as string) || 'Assistant' },
    { key: 'data', label: (t('editor.ui.tabs.data' as any) as string) || 'Data' },
    { key: 'preview', label: (t('editor.ui.tabs.preview' as any) as string) || 'Preview' }
  ];

  return (
    <aside className="card sticky top-24 space-y-1.5 w-full lg:w-[400px] border-blue-600/50 relative overflow-hidden backdrop-blur-lg shadow-xl">
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-blue-900 to-slate-950" />
      <div className="absolute inset-0 bg-black/15 backdrop-blur-xl" />
      <div className="relative z-10">
        <div className="flex gap-1.5" role="tablist" aria-label="Editor tools">
          {tabs.map(({ key, label }) => {
            const isActive = effectiveView === key;
            return (
              <Button
                key={key}
                role="tab"
                aria-selected={isActive}
                aria-controls={`right-panel-${key}`}
                variant="ghost"
                size="sm"
                className={`flex-1 justify-center rounded-lg border text-xs ${
                  isActive ? 'border-blue-600 bg-blue-600 hover:bg-blue-700 text-white shadow-lg' : 'border-white/30 text-white/80 hover:text-white hover:bg-white/10'
                }`}
                onClick={() => setView(key)}
              >
                {label}
              </Button>
            );
          })}
        </div>
        <div id={`right-panel-${effectiveView}`} role="tabpanel" className="max-h-[70vh] overflow-y-auto pr-1 space-y-1.5">
          {effectiveView === 'ai' && (
            <div className="space-y-3">
              {question ? (
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-xs font-medium text-white/70 mb-1.5 uppercase tracking-wide">
                      {(t('editor.ui.currentQuestion' as any) as string) || 'Current question'}
                    </p>
                    <p className="font-semibold text-white leading-snug mb-1.5 text-base">{question.prompt}</p>
                    <p className="text-xs text-white/70">
                      {(t('editor.ui.status' as any) as string) || 'Status'}:{' '}
                      <span className="font-medium text-white">{question.status}</span>
                      {question.status === 'blank' || question.status === 'unknown'
                        ? ` (${(t('editor.ui.aiFocusGuidance' as any) as string) || 'AI will focus on guidance'})`
                        : ` (${(t('editor.ui.aiFocusCritique' as any) as string) || 'AI will focus on critique'})`}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <Button type="button" variant="outline" size="sm" onClick={() => handleQuickAsk('outline')} disabled={!question}>
                        Draft outline
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => handleQuickAsk('improve')} disabled={!question}>
                        Improve answer
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => handleQuickAsk('data')} disabled={!question}>
                        {(t('editor.ui.suggestDataKPIs' as any) as string) || 'Suggest data/KPIs'}
                      </Button>
                    </div>
                  </div>
                  {question.answer ? (
                    <div className="bg-white/10 rounded-lg p-3 border border-white/20">
                      <p className="text-xs font-medium text-white/90 mb-2">Answer preview</p>
                      <p className="text-white text-sm leading-relaxed mb-2">{question.answer.substring(0, 200)}...</p>
                      <p className="text-xs text-white/70">{question.answer.split(/\s+/).length} words</p>
                    </div>
                  ) : (
                    <p className="text-white/80 text-sm leading-relaxed bg-white/5 rounded-lg p-3 border border-white/10">
                      {(t('editor.ui.startTypingHint' as any) as string) ||
                        'Start typing to provide context—the assistant draws on previous answers, datasets, and program requirements.'}
                    </p>
                  )}
                  {question.suggestions && question.suggestions.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-white">Latest response</p>
                      {question.suggestions.slice(-1).map((suggestion, index) => (
                        <div key={index} className="border border-white/30 bg-white/10 rounded-lg p-2.5 backdrop-blur-sm">
                          <p className="text-sm text-white mb-2 leading-relaxed">{suggestion}</p>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => navigator.clipboard.writeText(suggestion)}
                              className="text-white hover:text-white hover:bg-white/10"
                            >
                              Copy
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const latestSuggestion = question.suggestions?.[question.suggestions.length - 1];
                                if (latestSuggestion) {
                                  const currentAnswer = question.answer ?? '';
                                  const newContent = currentAnswer ? `${currentAnswer}\n\n${latestSuggestion}` : latestSuggestion;
                                  onAnswerChange(question.id, newContent);
                                }
                              }}
                              className="text-white hover:text-white hover:bg-white/10"
                            >
                              {(t('editor.ui.insert' as any) as string) || 'Insert'}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400 text-sm">
                  {(t('editor.ui.selectQuestion' as any) as string) || 'Select a question to receive AI suggestions.'}
                </div>
              )}
            </div>
          )}

          {effectiveView === 'data' && (
            <div className="space-y-4">
              {section ? (
                <DataPanel
                  datasets={section.datasets ?? []}
                  kpis={section.kpis ?? []}
                  media={section.media ?? []}
                  onDatasetCreate={onDatasetCreate}
                  onKpiCreate={onKpiCreate}
                  onMediaCreate={onMediaCreate}
                  activeQuestionId={question?.id}
                  sectionId={section.id}
                  sectionTitle={section.title}
                  onAttachDataset={onAttachDataset}
                  onAttachKpi={onAttachKpi}
                  onAttachMedia={onAttachMedia}
                  onAskForStructure={handleAskForStructure}
                />
              ) : (
                <div className="text-center py-8 text-slate-400 text-sm">
                  Choose a section to manage datasets, KPIs, and media.
                </div>
              )}
            </div>
          )}

          {effectiveView === 'preview' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <PreviewPanel plan={plan} focusSectionId={section?.id} />
              </div>
              <div className="border-t border-slate-200 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-slate-700">Requirements validation</p>
                  <Button
                    size="sm"
                    onClick={() => {
                      setRequirementsChecked(true);
                      onRunRequirements();
                    }}
                  >
                    Run check
                  </Button>
                </div>
                {!requirementsChecked ? (
                  <p className="text-gray-500 text-xs">Run the checker to view validation status.</p>
                ) : (
                  <RequirementSummary section={section} question={question} progressSummary={progressSummary} />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

function RequirementSummary({
  section,
  question,
  progressSummary
}: {
  section?: Section;
  question?: Question;
  progressSummary: ProgressSummary[];
}) {
  const { t } = useI18n();
  if (!section || !question) {
    return (
      <p className="text-xs text-slate-500">
        {(t('editor.ui.runRequirementsHint' as any) as string) || 'Select a question to view requirement details.'}
      </p>
    );
  }

  const { templates } = useEditorStore.getState();
  const template = templates.find((tpl) => tpl.id === section.id);
  const validation = validateQuestionRequirements(question, section, template);

  return (
    <div className="space-y-3">
      <div>
        {validation.issues.length === 0 ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-green-600 text-sm">✓</span>
              <p className="text-xs font-semibold text-green-700">
                {(t('editor.ui.currentQuestionPasses' as any) as string) || 'Current question passes validation'}
              </p>
            </div>
            <p className="text-xs text-green-600 mt-1">
              {(t('editor.ui.validation.allRequirementsMet' as any) as string) || 'All requirements are met for this prompt.'}
            </p>
          </div>
        ) : (
          <div className="border border-slate-200 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-700">Current question</p>
              <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-amber-100 text-amber-700">
                {validation.issues.length} issue{validation.issues.length > 1 ? 's' : ''}
              </span>
            </div>
            <p className="text-xs text-slate-600 line-clamp-2">{question.prompt}</p>
            <div className="space-y-1.5">
              {validation.issues.map((issue: RequirementIssue, idx: number) => (
                <div key={idx} className="flex items-start gap-2 text-xs">
                  <span className={issue.severity === 'error' ? 'text-red-600 mt-0.5' : 'text-amber-600 mt-0.5'}>●</span>
                  <p className={issue.severity === 'error' ? 'text-red-700 flex-1' : 'text-amber-700 flex-1'}>
                    {issue.message}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      {progressSummary.length > 0 && (
        <div className="bg-slate-50 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700">Overall completion</span>
            <span className="text-sm font-bold">{Math.round(progressSummary.reduce((sum, item) => sum + item.progress, 0) / progressSummary.length)}%</span>
          </div>
          <div className="space-y-2">
            {progressSummary.map((item) => (
              <div key={item.id} className="border border-slate-200 rounded-lg p-2">
                <p className="text-xs font-semibold text-slate-700">{item.title}</p>
                <div className="h-1.5 bg-slate-100 rounded-full mt-1">
                  <div
                    className={`h-full rounded-full ${item.progress === 100 ? 'bg-green-500' : 'bg-amber-500'}`}
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


import React from 'react';
import Sidebar from '../Workspace/Main Editor/Sidebar';
import { Workspace } from '../Workspace/Main Editor/Workspace';
import RightPanel from '../Workspace/Right-Panel/RightPanel';
import type { BusinessPlan, Section, Question, RightPanelView, Dataset, KPI, MediaAsset, TitlePage, AncillaryContent, Reference, AppendixItem } from '@/features/editor/types/plan';
import type { ProgressSummary, AISuggestionOptions } from '@/features/editor/hooks/useEditorStore';

type WorkspaceShellProps = {
  plan: BusinessPlan;
  activeSectionId: string | null;
  onSelectSection: (sectionId: string) => void;
  isAncillaryView?: boolean;
  isMetadataView?: boolean;
  activeSection?: Section | null;
  activeQuestionId?: string | null;
  onSelectQuestion?: (questionId: string) => void;
  onAnswerChange?: (questionId: string, content: string) => void;
  onToggleUnknown?: (questionId: string, note?: string) => void;
  onMarkComplete?: (questionId: string) => void;
  onTitlePageChange?: (titlePage: TitlePage) => void;
  onAncillaryChange?: (updates: Partial<AncillaryContent>) => void;
  onReferenceAdd?: (reference: Reference) => void;
  onReferenceUpdate?: (reference: Reference) => void;
  onReferenceDelete?: (id: string) => void;
  onAppendixAdd?: (item: AppendixItem) => void;
  onAppendixUpdate?: (item: AppendixItem) => void;
  onAppendixDelete?: (id: string) => void;
  onRunRequirements?: () => void;
  progressSummary?: ProgressSummary[];
  rightPanelView?: RightPanelView;
  setRightPanelView?: (view: RightPanelView) => void;
  activeQuestion?: Question | null;
  onDatasetCreate?: (dataset: Dataset) => void;
  onKpiCreate?: (kpi: KPI) => void;
  onMediaCreate?: (asset: MediaAsset) => void;
  onAttachDataset?: (dataset: Dataset) => void;
  onAttachKpi?: (kpi: KPI) => void;
  onAttachMedia?: (asset: MediaAsset) => void;
  onAskAI?: (questionId?: string, options?: AISuggestionOptions) => void;
};

export function WorkspaceShell({
  plan,
  activeSectionId,
  onSelectSection,
  isAncillaryView,
  isMetadataView,
  activeSection,
  activeQuestionId,
  onSelectQuestion,
  onAnswerChange,
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
  progressSummary,
  rightPanelView,
  setRightPanelView,
  activeQuestion,
  onDatasetCreate,
  onKpiCreate,
  onMediaCreate,
  onAttachDataset,
  onAttachKpi,
  onAttachMedia,
  onAskAI
}: WorkspaceShellProps) {
  const hasWorkspaceHandlers = !!(
    onSelectQuestion &&
    onAnswerChange &&
    onToggleUnknown &&
    onMarkComplete &&
    onTitlePageChange &&
    onAncillaryChange &&
    onReferenceAdd &&
    onReferenceUpdate &&
    onReferenceDelete &&
    onAppendixAdd &&
    onAppendixUpdate &&
    onAppendixDelete &&
    onRunRequirements
  );

  const hasRightPanel = !!(
    rightPanelView &&
    setRightPanelView &&
    onDatasetCreate &&
    onKpiCreate &&
    onMediaCreate &&
    onAttachDataset &&
    onAttachKpi &&
    onAttachMedia &&
    onAskAI &&
    onAnswerChange
  );

  return (
    <>
      <div className="border-t border-white/30 w-full mt-2 mb-0"></div>
      
      {/* Sidebar with glass treatment */}
      <div className="relative z-10 pb-0">
        <div className="relative rounded-lg border border-white/15 backdrop-blur-xl shadow-xl overflow-visible mb-3">
          <div className="absolute inset-0 rounded-lg bg-gradient-to-b from-slate-950/80 via-blue-900/60 to-slate-950/80" />
          <div className="absolute inset-0 rounded-lg bg-black/30 backdrop-blur-3xl" />
          <div className="relative z-10 p-2">
            <Sidebar
              plan={plan}
              activeSectionId={activeSectionId}
              onSelectSection={onSelectSection}
            />
          </div>
        </div>
      </div>

      {/* Workspace + RightPanel with glass treatment */}
      {hasWorkspaceHandlers && (
        <div className="mt-3">
          <div className="relative rounded-lg border border-white/15 backdrop-blur-xl shadow-xl overflow-visible">
            <div className="absolute inset-0 rounded-lg bg-gradient-to-b from-slate-950/80 via-blue-900/60 to-slate-950/80" />
            <div className="absolute inset-0 rounded-lg bg-black/30 backdrop-blur-3xl" />
            <div className="relative z-10 flex flex-col gap-2 lg:flex-row lg:items-start p-2">
              <div className="flex-1 min-w-0 max-w-4xl">
                <Workspace
                  plan={plan}
                  isAncillaryView={!!isAncillaryView}
                  isMetadataView={!!isMetadataView}
                  activeSection={activeSection ?? null}
                  activeQuestionId={activeQuestionId ?? null}
                  onSelectQuestion={onSelectQuestion!}
                  onAnswerChange={onAnswerChange!}
                  onToggleUnknown={onToggleUnknown!}
                  onMarkComplete={onMarkComplete!}
                  onTitlePageChange={onTitlePageChange!}
                  onAncillaryChange={onAncillaryChange!}
                  onReferenceAdd={onReferenceAdd!}
                  onReferenceUpdate={onReferenceUpdate!}
                  onReferenceDelete={onReferenceDelete!}
                  onAppendixAdd={onAppendixAdd!}
                  onAppendixUpdate={onAppendixUpdate!}
                  onAppendixDelete={onAppendixDelete!}
                  onRunRequirements={onRunRequirements!}
                  progressSummary={progressSummary ?? []}
                />
              </div>

              {hasRightPanel && (
                <div className="w-full lg:w-[480px] flex-shrink-0">
                  <RightPanel
                    view={rightPanelView!}
                    setView={setRightPanelView!}
                    section={activeSection ?? plan.sections[0]}
                    question={activeQuestion ?? undefined}
                    plan={plan}
                    onDatasetCreate={onDatasetCreate!}
                    onKpiCreate={onKpiCreate!}
                    onMediaCreate={onMediaCreate!}
                    onAttachDataset={onAttachDataset!}
                    onAttachKpi={onAttachKpi!}
                    onAttachMedia={onAttachMedia!}
                    onRunRequirements={onRunRequirements!}
                    progressSummary={progressSummary ?? []}
                    onAskAI={onAskAI!}
                    onAnswerChange={onAnswerChange!}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}


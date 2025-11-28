import React from 'react';

import {
  AncillaryContent,
  AppendixItem,
  BusinessPlan,
  Reference,
  Section,
  TitlePage
} from '@/features/editor/types/plan';
import { ProgressSummary } from '@/features/editor/hooks/useEditorStore';
import MetadataAndAncillaryPanel from '../Title Page & Attachement Data/MetadataAndAncillaryPanel';
import { SectionWorkspace } from './SectionWorkspace';
import Sidebar from './Sidebar';

type WorkspaceProps = {
  plan: BusinessPlan;
  isAncillaryView: boolean;
  isMetadataView: boolean;
  activeSection: Section | null;
  activeSectionId: string | null;
  activeQuestionId: string | null;
  onSelectQuestion: (questionId: string) => void;
  onAnswerChange: (questionId: string, content: string) => void;
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
  activeSectionId,
  onSelectSection
}: WorkspaceProps) {
  // Show merged panel for both metadata and ancillary views
  if (isMetadataView || isAncillaryView) {
    return (
      <MetadataAndAncillaryPanel
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

  const currentSection = activeSection ?? plan.sections[0] ?? null;

  return (
    <div className="flex flex-col gap-1.5 lg:flex-row lg:gap-2">
      <div className="w-full lg:max-w-[280px]">
        <Sidebar
          plan={plan}
          activeSectionId={activeSectionId ?? currentSection?.id ?? null}
          onSelectSection={onSelectSection}
        />
      </div>
      <div className="flex-1 min-w-0">
        <SectionWorkspace
          section={currentSection ?? undefined}
          activeQuestionId={activeQuestionId}
          onSelectQuestion={onSelectQuestion}
          onAnswerChange={onAnswerChange}
          onToggleUnknown={onToggleUnknown}
          onMarkComplete={onMarkComplete}
        />
      </div>
    </div>
  );
}

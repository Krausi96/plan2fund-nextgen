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

type WorkspaceProps = {
  plan: BusinessPlan;
  isAncillaryView: boolean;
  isMetadataView: boolean;
  activeSection: Section | null;
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
  progressSummary
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

  return (
    <SectionWorkspace
      section={activeSection ?? plan.sections[0]}
      activeQuestionId={activeQuestionId}
      onSelectQuestion={onSelectQuestion}
      onAnswerChange={onAnswerChange}
      onToggleUnknown={onToggleUnknown}
      onMarkComplete={onMarkComplete}
    />
  );
}

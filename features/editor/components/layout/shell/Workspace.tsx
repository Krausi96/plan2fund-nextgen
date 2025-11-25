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
import {
  PlanConfigurator,
  PlanConfiguratorProps,
  ConnectCopy
} from './PlanConfigurator';
import AncillaryPanel from '../workspace/ancillary/AncillaryPanel';
import MetadataPanel from '../workspace/metadata/MetadataPanel';
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

export { PlanConfigurator };
export type { PlanConfiguratorProps, ConnectCopy };

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
  if (isMetadataView) {
    return (
      <MetadataPanel
        plan={plan}
        onTitlePageChange={onTitlePageChange}
      />
    );
  }

  if (isAncillaryView) {
    return (
      <AncillaryPanel
        plan={plan}
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

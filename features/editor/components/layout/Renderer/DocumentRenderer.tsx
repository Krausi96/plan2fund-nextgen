// ========= PLAN2FUND — DOCUMENT RENDERER =========
// Orchestrator component that coordinates rendering of all document sections
// Split from monolithic 2065-line file into focused components

import React, { useState } from 'react';
import type { PlanDocument, TitlePage } from '@/features/editor/lib/types/plan';
import TitlePageRenderer from './TitlePageRenderer';
import TableOfContentsRenderer from './TableOfContentsRenderer';
import SectionRenderer from './SectionRenderer';
import AncillaryRenderer from './AncillaryRenderer';

export interface PreviewOptions {
  showWatermark?: boolean;
  watermarkText?: string;
  previewMode?: 'preview' | 'formatted' | 'print';
  selectedSections?: Set<string>;
  previewSettings?: {
    showWordCount?: boolean;
    showCharacterCount?: boolean;
    showCompletionStatus?: boolean;
    enableRealTimePreview?: boolean;
  };
}

interface ExportRendererProps extends PreviewOptions {
  plan: PlanDocument;
  style?: React.CSSProperties;
  onSectionClick?: (sectionId: string) => void;
  editingSectionId?: string | null;
  disabledSections?: Set<string>;
  onTitlePageChange?: (titlePage: TitlePage) => void;
  onAncillaryChange?: (updates: Partial<any>) => void;
  onReferenceAdd?: (reference: any) => void;
  onReferenceUpdate?: (reference: any) => void;
  onReferenceDelete?: (referenceId: string) => void;
  onAppendixAdd?: (item: any) => void;
  onAppendixUpdate?: (item: any) => void;
  onAppendixDelete?: (appendixId: string) => void;
}

function ExportRenderer({
  plan,
  showWatermark = false,
  watermarkText = 'DRAFT',
  previewMode = 'preview',
  selectedSections,
  previewSettings = {},
  style,
  onSectionClick,
  editingSectionId = null,
  disabledSections = new Set(),
  onTitlePageChange,
  onAncillaryChange,
  onReferenceAdd,
  onReferenceUpdate,
  onReferenceDelete,
  onAppendixAdd,
  onAppendixUpdate,
  onAppendixDelete
}: ExportRendererProps) {
  // Track which field is currently being edited
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  const sectionsToRender = selectedSections && selectedSections.size > 0
    ? plan.sections.filter(section => selectedSections.has(section.key))
    : plan.sections;

  return (
    <div className={`export-preview ${previewMode}`} style={style}>
      {showWatermark && (
        <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-0">
          <div className="text-6xl font-bold text-gray-200 opacity-30 transform -rotate-45 select-none">
            {watermarkText}
          </div>
        </div>
      )}
      
      <div className="relative z-10" style={{ margin: 0, padding: 0 }}>
        {/* Title Page */}
        <TitlePageRenderer
          plan={plan}
          editingSectionId={editingSectionId}
          editingField={editingField}
          editValue={editValue}
          setEditingField={setEditingField}
          setEditValue={setEditValue}
          onSectionClick={onSectionClick}
          onTitlePageChange={onTitlePageChange}
          disabledSections={disabledSections}
        />

        {/* Table of Contents */}
        <TableOfContentsRenderer
          plan={plan}
          sectionsToRender={sectionsToRender}
          editingSectionId={editingSectionId}
          editingField={editingField}
          editValue={editValue}
          setEditingField={setEditingField}
          setEditValue={setEditValue}
          onSectionClick={onSectionClick}
          onAncillaryChange={onAncillaryChange}
          disabledSections={disabledSections}
          previewSettings={previewSettings}
        />

        {/* Main Sections */}
        {sectionsToRender.map((section, sectionIndex) => (
          <SectionRenderer
            key={section.key}
            section={section}
            sectionIndex={sectionIndex}
            plan={plan}
            previewMode={previewMode}
            previewSettings={previewSettings}
            onSectionClick={onSectionClick}
          />
        ))}

        {/* Ancillary Sections (List of Tables, List of Figures, References, Appendices) */}
        <AncillaryRenderer
          plan={plan}
          sectionsToRender={sectionsToRender}
          editingSectionId={editingSectionId}
          editingField={editingField}
          editValue={editValue}
          setEditingField={setEditingField}
          setEditValue={setEditValue}
          onSectionClick={onSectionClick}
          onAncillaryChange={onAncillaryChange}
          onReferenceAdd={onReferenceAdd}
          onReferenceUpdate={onReferenceUpdate}
          onReferenceDelete={onReferenceDelete}
          onAppendixAdd={onAppendixAdd}
          onAppendixUpdate={onAppendixUpdate}
          onAppendixDelete={onAppendixDelete}
          disabledSections={disabledSections}
        />
      </div>
    </div>
  );
}

export default ExportRenderer;

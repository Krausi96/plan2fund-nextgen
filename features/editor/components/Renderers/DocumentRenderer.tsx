// ========= PLAN2FUND — DOCUMENT RENDERER =========
// Orchestrator component that coordinates rendering of all document sections
// Split from monolithic 2065-line file into focused components

import React from 'react';
import TitlePageRenderer from './TitlePageRenderer';
import TableOfContentsRenderer from './TableOfContentsRenderer';
import SectionRenderer from './SectionRenderer';
import { ListOfTablesRenderer } from './Ancillary/ListOfTablesRenderer';
import { ListOfFiguresRenderer } from './Ancillary/ListOfFiguresRenderer';
import { ReferencesRenderer } from './Ancillary/ReferencesRenderer';
import { AppendicesRenderer } from './Ancillary/AppendicesRenderer';
import type { PlanDocument, PlanSection } from '@/features/editor/lib';

// ========= SHARED TYPES =========
export interface PreviewOptions {
  showWatermark?: boolean;
  watermarkText?: string;
  previewMode?: 'preview' | 'formatted' | 'print';
  selectedSections?: Set<string>;
  previewSettings?: PreviewSettings;
}

export interface PreviewSettings {
  showWordCount?: boolean;
  showCharacterCount?: boolean;
  showCompletionStatus?: boolean;
  enableRealTimePreview?: boolean;
}

export interface RendererCommonProps {
  plan: PlanDocument;
  onSectionClick?: (sectionId: string) => void;
  disabledSections?: Set<string>;
}

// ========= SHARED HELPERS =========
// PAGE_STYLE, getTranslation, and calculatePageNumber are imported from @/features/editor/lib above



interface ExportRendererProps extends PreviewOptions {
  plan: PlanDocument;
  style?: React.CSSProperties;
  onSectionClick?: (sectionId: string) => void;
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
}: ExportRendererProps) {
  const sectionsToRender = selectedSections && selectedSections.size > 0
    ? plan.sections.filter((section: PlanSection) => selectedSections.has(section.key))
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
        />

        {/* Table of Contents */}
        <TableOfContentsRenderer
          plan={plan}
          sectionsToRender={sectionsToRender}
          previewSettings={previewSettings}
        />

        {/* Main Sections */}
        {sectionsToRender.map((section: PlanSection, sectionIndex: number) => (
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
        <ListOfTablesRenderer
          plan={plan}
          sectionsToRender={sectionsToRender}
          onSectionClick={onSectionClick}
        />
        <ListOfFiguresRenderer
          plan={plan}
          sectionsToRender={sectionsToRender}
          onSectionClick={onSectionClick}
        />
        <ReferencesRenderer
          plan={plan}
          sectionsToRender={sectionsToRender}
          onSectionClick={onSectionClick}
        />
        <AppendicesRenderer
          plan={plan}
          sectionsToRender={sectionsToRender}
          onSectionClick={onSectionClick}
        />
      </div>
    </div>
  );
}

export default ExportRenderer;

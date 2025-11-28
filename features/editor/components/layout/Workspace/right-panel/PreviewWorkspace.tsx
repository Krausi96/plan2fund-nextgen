// ========= PLAN2FUND — PREVIEW PANE =========
// Live document preview that mirrors the /preview experience inline.

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AttachmentReference,
  BusinessPlan,
  Section,
  PlanDocument,
  PlanSection,
  Route,
  MediaAsset,
  Table
} from '@/features/editor/types/plan';
import ExportRenderer from '@/features/export/renderer/renderer';

interface PreviewPanelProps {
  plan: BusinessPlan | null;
  focusSectionId?: string | null;
  onSectionClick?: (sectionId: string) => void;
}

type ResolvedAttachment = {
  id: string;
  type: string;
  name: string;
  value?: number;
  unit?: string;
  target?: number;
  description?: string | null;
  source?: string | null;
  tags?: string[] | null;
};

function isEntityLinked(entity: { relatedQuestions?: string[]; questionId?: string }) {
  return Boolean(entity.questionId) || Boolean(entity.relatedQuestions && entity.relatedQuestions.length > 0);
}

function resolveAttachment(
  attachment: AttachmentReference | MediaAsset,
  section: Section
): ResolvedAttachment | null {
  if ('attachmentId' in attachment) {
    const { attachmentId, attachmentType } = attachment;
    if (attachmentType === 'dataset') {
      const dataset = section.datasets?.find((item) => item.id === attachmentId);
      if (!dataset) return null;
      return {
        id: dataset.id,
        type: 'dataset',
        name: dataset.name,
        description: dataset.description,
        source: dataset.source ?? null,
        tags: dataset.tags ?? null
      };
    }
    if (attachmentType === 'kpi') {
      const kpi = section.kpis?.find((item) => item.id === attachmentId);
      if (!kpi) return null;
      return {
        id: kpi.id,
        type: 'kpi',
        name: kpi.name,
        value: kpi.value,
        unit: kpi.unit,
        target: kpi.target,
        description: kpi.description ?? null,
        source: kpi.source ?? null,
        tags: kpi.tags ?? null
      };
    }
    const media = section.media?.find((item) => item.id === attachmentId);
    if (!media) return null;
    return {
      id: media.id,
      type: media.type,
      name: media.title,
      description: media.description ?? media.caption ?? null,
      source: media.source ?? null,
      tags: media.tags ?? null
    };
  }

  const legacy = attachment as MediaAsset & { value?: number; unit?: string; target?: number };
  return {
    id: legacy.id,
    type: legacy.type,
    name: legacy.title || legacy.description || 'Untitled',
    value: (legacy as any).value,
    unit: (legacy as any).unit,
    target: (legacy as any).target,
    description: legacy.description ?? legacy.caption ?? null,
    source: legacy.source ?? null,
    tags: legacy.tags ?? null
  };
}

function resolveAttachmentsForQuestion(question: Section['questions'][number], section: Section): ResolvedAttachment[] {
  if (!question.attachments || question.attachments.length === 0) return [];
  return question.attachments
    .map((attachment) => resolveAttachment(attachment as AttachmentReference | MediaAsset, section))
    .filter((item): item is ResolvedAttachment => Boolean(item));
}

function normalizeCellValue(value: unknown): string | number {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString().split('T')[0];
  if (typeof value === 'number' || typeof value === 'string') return value;
  return String(value);
}

function convertSectionToPlanSection(section: Section, sectionNumber: number | null): PlanSection {
  const htmlParts: string[] = [];
  if (section.description) {
    htmlParts.push('<div class="section-header">');
    htmlParts.push(`<p class="section-summary">${section.description}</p>`);
    htmlParts.push('</div>');
  }

  let hasContent = false;
  let subchapterIndex = 0;
  const subchapters: Array<{ id: string; title: string; numberLabel: string }> = [];
  
  section.questions.forEach((question) => {
    if (question.answer && question.answer.trim()) {
      hasContent = true;
      // Only number subchapters if section has a number (exclude Executive Summary)
      if (sectionNumber !== null) {
        subchapterIndex += 1;
        const subchapterLabel = `${sectionNumber}.${subchapterIndex}`;
        
        htmlParts.push(
          `<h4 class="section-subchapter" data-question-id="${question.id}">${subchapterLabel} ${question.prompt}</h4>`
        );
        
        // Collect subchapter metadata for TOC
        subchapters.push({
          id: question.id,
          title: question.prompt,
          numberLabel: subchapterLabel
        });
      } else {
        // Executive Summary or unnumbered sections - no numbering
        htmlParts.push(
          `<h4 class="section-subchapter" data-question-id="${question.id}">${question.prompt}</h4>`
        );
        
        // Collect subchapter metadata for TOC without number
        subchapters.push({
          id: question.id,
          title: question.prompt,
          numberLabel: ''
        });
      }
      
      const normalizedAnswer = question.answer
        .replace(/\*\*/g, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

      const paragraphs = normalizedAnswer.split(/\n{2,}/).map((paragraph) => paragraph.trim());
      const paragraphHtml = paragraphs
        .map((paragraph) => {
          const sanitized = paragraph.replace(/\n/g, '<br />');
          return `<p>${sanitized}</p>`;
        })
        .join('');

      htmlParts.push(`<div class="section-answer" data-question-id="${question.id}" data-question-content="true">${paragraphHtml}</div>`);
    }
  });

  const hasRealContent = hasContent;

  const questionAttachments = section.questions.flatMap((question) =>
    resolveAttachmentsForQuestion(question, section)
  );
  if (questionAttachments.length > 0) {
    const items = questionAttachments
      .map((attachment) => {
        const detailSegments: string[] = [];
        if (attachment.description) {
          detailSegments.push(`<span class="attachment-meta attachment-description">${attachment.description}</span>`);
        }
        if (attachment.source) {
          detailSegments.push(`<span class="attachment-meta attachment-source">Source: ${attachment.source}</span>`);
        }
        if (attachment.tags && attachment.tags.length > 0) {
          detailSegments.push(
            `<span class="attachment-meta attachment-tags">Tags: ${attachment.tags.join(', ')}</span>`
          );
        }
        if (attachment.type === 'kpi' && attachment.value !== undefined) {
          const kpiUnit = attachment.unit || '';
          const target = attachment.target ? ` (target: ${attachment.target} ${kpiUnit})` : '';
          detailSegments.unshift(
            `<span class="attachment-meta attachment-value">${attachment.value} ${kpiUnit}${target}</span>`
          );
        }
        const typeLabel = attachment.type || 'attachment';
        const metadataBlock =
          detailSegments.length > 0
            ? `<div class="attachment-meta-block">${detailSegments.join('<br />')}</div>`
            : '';
        return `<li class="attachment-item"><strong>${attachment.name}</strong> <span class="attachment-type">(${typeLabel})</span>${metadataBlock}</li>`;
      })
      .join('');
    htmlParts.push(`<ul class="section-attachments">${items}</ul>`);
  }

  const standaloneKPIs = section.kpis?.filter((kpi) => !isEntityLinked(kpi));
  if (standaloneKPIs && standaloneKPIs.length > 0) {
    const kpiItems = standaloneKPIs
      .map((kpi) => {
        const target = kpi.target ? ` (target: ${kpi.target} ${kpi.unit || ''})` : '';
        const description = kpi.description ? ` — ${kpi.description}` : '';
        return `<li><strong>${kpi.name}</strong>: ${kpi.value} ${kpi.unit || ''}${target}${description}</li>`;
      })
      .join('');
    htmlParts.push(`<div class="section-kpis"><h4>Key Performance Indicators</h4><ul>${kpiItems}</ul></div>`);
  }

  const tableMetadata: Record<
    string,
    { id: string; name: string; description?: string; source?: string; tags?: string[] }
  > = {};

  const tables = section.datasets?.reduce((acc, dataset) => {
    if (!dataset.name) return acc;

    const firstColumnName = dataset.columns[0]?.name?.trim();
    const hasLabelColumn = Boolean(firstColumnName);
    const valueColumns = hasLabelColumn ? dataset.columns.slice(1) : dataset.columns;

    const datasetKey = dataset.name.toLowerCase().replace(/\s+/g, '_');

    acc[datasetKey] = {
      labelColumn: hasLabelColumn ? firstColumnName : undefined,
      columns: valueColumns.map((col) => col.name),
      rows: dataset.rows.map((row) => {
        const labelValue = hasLabelColumn && firstColumnName ? row[firstColumnName] : undefined;
        return {
          label: hasLabelColumn && firstColumnName ? String(normalizeCellValue(labelValue)) : undefined,
          values: valueColumns.map((col) => normalizeCellValue(row[col.name]))
        };
      })
    };

    tableMetadata[datasetKey] = {
      id: dataset.id,
      name: dataset.name,
      description: dataset.description,
      source: dataset.source,
      tags: dataset.tags
    };

    return acc;
  }, {} as Record<string, Table>);

  // Determine display title with section number
  const displayTitle = sectionNumber !== null ? `${sectionNumber}. ${section.title}` : section.title;

  return {
    key: section.id,
    title: section.title,
    content: htmlParts.join(''),
    fields: {
      sectionNumber: sectionNumber,
      displayTitle: displayTitle,
      subchapters: subchapters,
      hasRealContent,
      attachments: questionAttachments,
      tableMetadata
    },
    tables,
    figures: section.media?.map((media) => ({
      id: media.id,
      type: media.type,
      title: media.title,
      uri: media.uri,
      caption: media.caption,
      altText: media.altText,
      description: media.description,
      source: media.source,
      tags: media.tags
    })),
    status: section.progress === 100 ? 'aligned' : section.progress && section.progress > 0 ? 'needs_fix' : 'missing'
  };
}

export default function PreviewPanel({ plan, onSectionClick }: PreviewPanelProps) {
  const [viewMode, setViewMode] = useState<'page' | 'fluid'>('page');
  const [showWatermark, setShowWatermark] = useState(true);
  const [zoomPreset, setZoomPreset] = useState<'compact' | 'standard' | 'comfortable'>('standard');
  const [fitScale, setFitScale] = useState(1);
  const viewportRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (viewMode !== 'page') {
      setFitScale(1);
      return;
    }

    if (typeof window === 'undefined' || typeof ResizeObserver === 'undefined') {
      return;
    }

    const node = viewportRef.current;
    if (!node) return;

    const A4_WIDTH_PX = 793.7; // 210mm translated to CSS px at 96dpi
    const MAX_BASE_SCALE = 1.15;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const width = entry.contentRect.width;
      const widthRatio = Math.min(1, width / A4_WIDTH_PX);
      const nextScale = Math.min(MAX_BASE_SCALE, widthRatio);
      setFitScale(Number(nextScale.toFixed(3)));
    });

    observer.observe(node);
    return () => observer.disconnect();
  }, [viewMode]);

  const planDocument = useMemo<PlanDocument | null>(() => {
    if (!plan || !plan.sections || plan.sections.length === 0) return null;

    // Assign section numbers: Executive Summary is unnumbered, others start at 1
    let sectionNumber = 0;
    const sections = plan.sections.map((section) => {
      const isExecutiveSummary = section.title.toLowerCase().includes('executive summary');
      const currentSectionNumber = isExecutiveSummary ? null : ++sectionNumber;
      return convertSectionToPlanSection(section, currentSectionNumber);
    });

    const inferredRoute: Route =
      plan.fundingProgram === 'loan' ? 'loan' :
      plan.fundingProgram === 'equity' ? 'equity' :
      plan.fundingProgram === 'visa' ? 'visa' :
      'grant';

    const planLanguage = (plan as any).language ?? 'en';
    const editorSettings = (plan as any).settings ?? {};
    const planTone = editorSettings.tone ?? 'neutral';
    const targetLength = editorSettings.targetLength ?? 'standard';
    const formatting = editorSettings.formatting;

    const titlePageTitle =
      plan.titlePage?.planTitle ||
      plan.titlePage?.companyName ||
      plan.programSummary?.name ||
      'Business Plan Draft';

    const subtitle = (plan.titlePage as any)?.subtitle || plan.titlePage?.valueProp || '';
    const teamHighlight = plan.titlePage?.teamHighlight || '';

    return {
      id: plan.id || 'preview_plan',
      ownerId: plan.metadata?.programId || 'user',
      product: plan.productType || 'submission',
      route: inferredRoute,
      language: planLanguage,
      tone: planTone,
      targetLength,
      settings: {
        includeTitlePage: true,
        includePageNumbers: true,
        citations: 'simple',
        captions: true,
        graphs: {},
        titlePage: {
          title: titlePageTitle,
          subtitle,
          author: plan.titlePage?.contactInfo?.name || plan.titlePage?.companyName || '',
          date: plan.titlePage?.date || new Date().toISOString().split('T')[0],
          teamHighlight,
          companyName: plan.titlePage?.companyName,
          logoUrl: plan.titlePage?.logoUrl,
          contactInfo: {
            email: plan.titlePage?.contactInfo?.email || '',
            phone: plan.titlePage?.contactInfo?.phone || '',
            website: plan.titlePage?.contactInfo?.website || '',
            address: plan.titlePage?.contactInfo?.address || ''
          },
          legalForm: plan.titlePage?.legalForm,
          headquartersLocation: plan.titlePage?.headquartersLocation,
          confidentialityStatement: plan.titlePage?.confidentialityStatement
        },
        formatting
      },
      sections,
      references: plan.references || [],
      appendices: plan.appendices || [],
      ancillary: plan.ancillary,
      addonPack: false,
      versions: []
    };
  }, [plan]);

  const zoomMultiplier =
    zoomPreset === 'compact'
      ? 0.9
      : zoomPreset === 'comfortable'
        ? 1.1
        : 1;

  const viewportZoom =
    viewMode === 'page'
      ? Math.max(0.25, Math.min(1.5, zoomMultiplier * (fitScale || 1)))
      : 1;

  const zoomStyle = {
    '--page-zoom': '1',
    '--preview-viewport-zoom': viewportZoom.toString()
  } as React.CSSProperties;

  if (!plan) {
    return (
      <div className="text-center py-8 text-sm text-slate-400">
        Nothing to preview yet.
      </div>
    );
  }

  return (
    <>
      {planDocument ? (
        <div className="relative w-full h-full flex flex-col">
            <div className="flex-shrink-0 mb-2 flex flex-wrap items-center justify-between gap-2 px-2 py-1 text-[11px] text-white/80">
              <div className="flex items-center gap-2">
                <span className="uppercase tracking-wide text-white/60">View</span>
                <button
                  className={`rounded-md px-3 py-1 font-semibold ${viewMode === 'page' ? 'bg-white text-slate-900' : 'border border-white/20 text-white/80'}`}
                  onClick={() => setViewMode('page')}
                >
                  Page
                </button>
                <button
                  className={`rounded-md px-3 py-1 font-semibold ${viewMode === 'fluid' ? 'bg-white text-slate-900' : 'border border-white/20 text-white/80'}`}
                  onClick={() => setViewMode('fluid')}
                >
                  Fluid
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <label className="flex items-center gap-2 font-semibold">
                  <input
                    type="checkbox"
                    checked={showWatermark}
                    onChange={(e) => setShowWatermark(e.target.checked)}
                    className="rounded border-white/20 bg-transparent text-blue-400 focus:ring-blue-400"
                  />
                  Watermark
                </label>
                <div className="flex items-center gap-1 rounded-md border border-white/15 bg-white/5 px-2 py-0.5">
                  <span className="uppercase tracking-wide text-white/60">Scale</span>
                  {[
                    { id: 'compact', label: '90%' },
                    { id: 'standard', label: '100%' },
                    { id: 'comfortable', label: '110%' }
                  ].map((preset) => (
                    <button
                      key={preset.id}
                      className={`rounded px-2 py-0.5 text-[10px] font-semibold transition ${
                        zoomPreset === preset.id
                          ? 'bg-white text-slate-900'
                          : 'text-white/70 hover:text-white'
                      }`}
                      onClick={() => setZoomPreset(preset.id as typeof zoomPreset)}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto overflow-x-hidden px-0 flex flex-col">
              <div ref={viewportRef} className="flex-1 w-full overflow-x-hidden">
                <ExportRenderer
                  plan={planDocument}
                  showWatermark={showWatermark}
                  watermarkText="DRAFT"
                  previewMode={viewMode === 'page' ? 'formatted' : 'preview'}
                  previewSettings={{
                    showCompletionStatus: true,
                    showWordCount: false,
                    showCharacterCount: false,
                    enableRealTimePreview: true
                  }}
                  style={zoomStyle}
                  onSectionClick={onSectionClick}
                />
              </div>
              <div className="flex-shrink-0 mt-4 mb-2 px-4 flex items-center justify-between text-[11px] uppercase tracking-wide text-white/60">
                <span>{planDocument.sections.length} sections</span>
                <span>Drag to scroll</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-white/20 bg-white/5 p-6 text-center text-sm text-white/70">
            Start drafting your sections to see the live business plan preview here.
          </div>
        )}
    </>
  );
}

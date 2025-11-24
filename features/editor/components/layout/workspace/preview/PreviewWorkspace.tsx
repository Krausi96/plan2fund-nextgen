// ========= PLAN2FUND — PREVIEW PANE =========
// Live document preview that mirrors the /preview experience inline.

import React, { useMemo, useState } from 'react';
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

const PREVIEW_PLACEHOLDER = '[Section not completed yet]';

interface PreviewPanelProps {
  plan: BusinessPlan | null;
  focusSectionId?: string | null;
}

type ResolvedAttachment = {
  id: string;
  type: string;
  name: string;
  value?: number;
  unit?: string;
  target?: number;
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
        name: dataset.name
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
        target: kpi.target
      };
    }
    const media = section.media?.find((item) => item.id === attachmentId);
    if (!media) return null;
    return {
      id: media.id,
      type: media.type,
      name: media.title
    };
  }

  const legacy = attachment as MediaAsset & { value?: number; unit?: string; target?: number };
  return {
    id: legacy.id,
    type: legacy.type,
    name: legacy.title || legacy.description || 'Untitled',
    value: (legacy as any).value,
    unit: (legacy as any).unit,
    target: (legacy as any).target
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
      subchapterIndex += 1;
      const subchapterLabel = sectionNumber !== null ? `${sectionNumber}.${subchapterIndex}` : `${subchapterIndex}`;
      
      htmlParts.push(
        `<h4 class="section-subchapter">${subchapterLabel} ${question.prompt}</h4>`
      );
      
      // Collect subchapter metadata for TOC
      subchapters.push({
        id: question.id,
        title: question.prompt,
        numberLabel: subchapterLabel
      });
      
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

      htmlParts.push(`<div class="section-answer">${paragraphHtml}</div>`);
    }
  });

  const hasRealContent = hasContent;

  if (!hasContent) {
    htmlParts.push(`<p class="section-placeholder">${PREVIEW_PLACEHOLDER}</p>`);
  }

  const questionAttachments = section.questions.flatMap((question) =>
    resolveAttachmentsForQuestion(question, section)
  );
  if (questionAttachments.length > 0) {
    const items = questionAttachments
      .map((attachment) => {
        if (attachment.type === 'kpi' && attachment.value !== undefined) {
          const kpiUnit = attachment.unit || '';
          const target = attachment.target ? ` (target: ${attachment.target} ${kpiUnit})` : '';
          return `<li><strong>${attachment.name}</strong>: ${attachment.value} ${kpiUnit}${target}</li>`;
        }
        const typeLabel = attachment.type || 'attachment';
        return `<li>${attachment.name} <span class="attachment-type">(${typeLabel})</span></li>`;
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

  const tables = section.datasets?.reduce((acc, dataset) => {
    if (!dataset.name) return acc;

    const firstColumnName = dataset.columns[0]?.name?.trim();
    const hasLabelColumn = Boolean(firstColumnName);
    const valueColumns = hasLabelColumn ? dataset.columns.slice(1) : dataset.columns;

    acc[dataset.name.toLowerCase().replace(/\s+/g, '_')] = {
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
      hasRealContent
    },
    tables,
    figures: section.media?.map((media) => ({
      type: media.type,
      title: media.title,
      uri: media.uri,
      caption: media.caption,
      altText: media.altText
    })),
    status: section.progress === 100 ? 'aligned' : section.progress && section.progress > 0 ? 'needs_fix' : 'missing'
  };
}

export default function PreviewPanel({ plan }: PreviewPanelProps) {
  const [viewMode, setViewMode] = useState<'page' | 'fluid'>('page');
  const [showWatermark, setShowWatermark] = useState(true);
  const [zoomPreset, setZoomPreset] = useState<'compact' | 'standard' | 'comfortable'>('standard');

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

  if (!plan) {
    return (
      <div className="text-center py-8 text-sm text-slate-400">
        Nothing to preview yet.
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3 rounded-xl border border-white/15 bg-white/5 p-3 shadow-inner">
        {planDocument ? (
          <div className="relative h-[660px] overflow-hidden rounded-3xl border border-white/10 bg-slate-950/40 p-3 shadow-inner">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-[11px] text-white/80">
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
            <div className="absolute inset-0 overflow-y-auto px-2 pb-4">
              <div
                className={`mx-auto ${viewMode === 'page' ? 'w-full' : 'max-w-none'} transition-all`}
              >
                <div className="rounded-[26px] border border-black/10 bg-white/95 shadow-2xl ring-1 ring-black/5">
                  <div
                    className="rounded-[22px] bg-white p-6"
                    style={{
                      transform: `scale(${zoomPreset === 'compact' ? 0.9 : zoomPreset === 'comfortable' ? 1.08 : 1})`,
                      transformOrigin: 'top center',
                      transition: 'transform 150ms ease'
                    }}
                  >
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
                    />
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between text-[11px] uppercase tracking-wide text-white/60">
                  <span>{planDocument.sections.length} sections</span>
                  <span>Drag to scroll</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-white/20 bg-white/5 p-6 text-center text-sm text-white/70">
            Start drafting your sections to see the live business plan preview here.
          </div>
        )}
      </div>
    </>
  );
}

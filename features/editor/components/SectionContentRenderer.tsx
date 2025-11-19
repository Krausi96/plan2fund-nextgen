// ========= PLAN2FUND — PREVIEW PANE =========
// Condensed preview showing only current section with first 100 chars of answers and data item references.

import React, { useState } from 'react';
import { useRouter } from 'next/router';
import {
  AttachmentReference,
  BusinessPlan,
  Section,
  PlanDocument,
  PlanSection,
  Route,
  MediaAsset
} from '@/features/editor/types/plan';
import { exportManager, ExportOptions } from '@/features/export/engine/export';

interface PreviewPaneProps {
  plan: BusinessPlan | null;
  focusSectionId?: string | null;
}

function getAttachmentIcon(type: string): string {
  if (type === 'dataset' || type === 'table') return '📊';
  if (type === 'chart' || type === 'graph') return '📈';
  if (type === 'image' || type === 'media') return '📷';
  return '📎';
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

function getAttachmentName(attachment: ResolvedAttachment): string {
  return attachment.name || 'Untitled';
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

/**
 * Converts a Section (with questions) to PlanSection format for export
 */
function convertSectionToPlanSection(section: Section): PlanSection {
  // Combine all questions and answers into content
  const contentParts: string[] = [];
  
  section.questions.forEach((question, index) => {
    const questionNumber = `Q${String(index + 1).padStart(2, '0')}`;
    
    // Add question prompt
    contentParts.push(`**${questionNumber}: ${question.prompt}**`);
    
    // Add answer if exists
    if (question.answer && question.answer.trim()) {
      contentParts.push(question.answer);
    } else {
      contentParts.push('*[No answer yet]*');
    }
    
    // Add attachments reference (including KPIs with values)
    const questionAttachments = resolveAttachmentsForQuestion(question, section);
    if (questionAttachments.length > 0) {
      questionAttachments.forEach((attachment) => {
        if (attachment.type === 'kpi' && attachment.value !== undefined) {
          const kpiValue = attachment.value;
          const kpiUnit = attachment.unit || '';
          const kpiTarget = attachment.target;
          const name = attachment.name || 'Untitled';
          let kpiText = `\n📈 **${name}**: ${kpiValue} ${kpiUnit}`;
          if (kpiTarget) {
            kpiText += ` (target: ${kpiTarget} ${kpiUnit})`;
          }
          contentParts.push(kpiText);
        } else {
          const icon = attachment.type === 'dataset' || attachment.type === 'table' ? '📊' :
                       attachment.type === 'chart' ? '📈' :
                       attachment.type === 'image' ? '📷' : '📎';
          const name = attachment.name || 'Untitled';
          contentParts.push(`\n${icon} ${name} (attached)`);
        }
      });
    }
    
    // Add spacing between questions
    if (index < section.questions.length - 1) {
      contentParts.push('\n\n');
    }
  });
  
  // Add standalone KPIs (not attached to questions) to content
  const standaloneKPIs = section.kpis?.filter((kpi) => !isEntityLinked(kpi));
  if (standaloneKPIs && standaloneKPIs.length > 0) {
    contentParts.push('\n\n### Key Performance Indicators\n');
    standaloneKPIs.forEach((kpi) => {
      let kpiText = `**${kpi.name}**: ${kpi.value} ${kpi.unit || ''}`;
      if (kpi.target) {
        kpiText += ` (target: ${kpi.target} ${kpi.unit || ''})`;
      }
      if (kpi.description) {
        kpiText += `\n${kpi.description}`;
      }
      contentParts.push(kpiText);
    });
  }
  
  // Convert datasets to tables format
  const tables = section.datasets?.reduce((acc, dataset) => {
    if (dataset.name) {
      acc[dataset.name.toLowerCase().replace(/\s+/g, '_')] = {
        headers: dataset.columns.map(col => col.name),
        rows: dataset.rows.map(row => {
          // Convert row object to array matching column order
          return dataset.columns.map(col => {
            const value = row[col.name];
            if (value === null || value === undefined) return '';
            if (value instanceof Date) return value.toLocaleDateString();
            return String(value);
          });
        })
      };
    }
    return acc;
  }, {} as Record<string, any>);
  
  return {
    key: section.id,
    title: section.title,
    content: contentParts.join('\n'),
    tables,
    figures: section.media?.map(m => ({
      type: m.type,
      title: m.title,
      uri: m.uri,
      caption: m.caption,
      altText: m.altText
    })),
    status: section.progress === 100 ? 'aligned' : section.progress && section.progress > 0 ? 'needs_fix' : 'missing'
  };
}

/**
 * Creates a minimal PlanDocument from a single Section for export
 */
function createExportDocument(section: Section, fullPlan: BusinessPlan): PlanDocument {
  const planSection = convertSectionToPlanSection(section);
  
  // Use section title for export filename
  const exportTitle = `${section.title} - Draft`;
  
  return {
    id: `export_${section.id}_${Date.now()}`,
    ownerId: fullPlan.metadata?.programId || 'user',
    product: fullPlan.productType || 'submission',
    route: (fullPlan.fundingProgram === 'grant' ? 'grant' : 
            fullPlan.fundingProgram === 'loan' ? 'loan' :
            fullPlan.fundingProgram === 'equity' ? 'equity' :
            fullPlan.fundingProgram === 'visa' ? 'visa' : 'grant') as Route,
    language: 'en',
    tone: 'neutral',
    targetLength: 'standard',
    settings: {
      includeTitlePage: true,
      includePageNumbers: true,
      citations: 'simple',
      captions: true,
      graphs: {},
      titlePage: {
        title: exportTitle, // Use section title for filename
        subtitle: fullPlan.titlePage.planTitle || 'Business Plan Section',
        author: fullPlan.titlePage.contactInfo?.name || '',
        date: new Date().toISOString().split('T')[0]
      }
    },
    sections: [planSection],
    addonPack: false,
    versions: []
  };
}

export default function SectionContentRenderer({ plan, focusSectionId }: PreviewPaneProps) {
  const router = useRouter();
  const [exporting, setExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'PDF' | 'DOCX'>('PDF');

  if (!plan) {
    return (
      <div className="text-center py-8 text-sm text-slate-400">
        Nothing to preview yet.
      </div>
    );
  }

  const focusedSection = focusSectionId
    ? plan.sections.find((s) => s.id === focusSectionId)
    : plan.sections[0];

  if (!focusedSection) {
    return (
      <div className="text-center py-8 text-sm text-slate-400">
        Select a section to preview.
      </div>
    );
  }

  const handleOpenFullPreview = () => {
    router.push('/preview');
  };

  const handleExportDraft = async () => {
    if (!focusedSection || exporting) return;
    
    setExporting(true);
    try {
      // Create export document from current section
      const exportDoc = createExportDocument(focusedSection, plan);
      
      // Prepare export options
      const options: ExportOptions = {
        format: exportFormat,
        includeWatermark: true, // Always include watermark for drafts
        isPaid: false, // Draft exports are free
        quality: 'draft',
        pageSize: 'A4',
        pageBreaks: true
      };
      
      // Export the document
      // Note: Both PDF and DOCX exports handle downloads automatically
      // - PDF: html2pdf.js triggers download automatically
      // - DOCX: file-saver's saveAs triggers download automatically
      const result = await exportManager.exportPlan(exportDoc, options, 'free');
      
      if (!result.success) {
        alert(`Export failed: ${result.error || 'Unknown error'}`);
      }
      // If successful, download happens automatically - no action needed
    } catch (error) {
      console.error('Export error:', error);
      alert(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Action Buttons */}
      <div className="space-y-2">
        <button
          onClick={handleOpenFullPreview}
          className="w-full px-3 py-2 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-500"
        >
          Open full preview
        </button>
        <div className="flex gap-2">
          <select
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value as 'PDF' | 'DOCX')}
            className="flex-1 px-2 py-2 text-xs font-semibold border border-slate-200 rounded-lg bg-white text-slate-700"
            disabled={exporting}
          >
            <option value="PDF">PDF</option>
            <option value="DOCX">Word</option>
          </select>
          <button
            onClick={handleExportDraft}
            disabled={exporting}
            className="flex-1 px-3 py-2 text-xs font-semibold border border-slate-200 text-slate-700 rounded-lg hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exporting ? 'Exporting...' : 'Export draft'}
          </button>
        </div>
      </div>

      {/* Section Title */}
      <div>
        <h3 className="text-base font-semibold text-slate-900 mb-3">{focusedSection.title}</h3>
      </div>

      {/* Condensed Preview */}
      <div className="space-y-3 text-sm">
        {focusedSection.questions.map((question, index) => {
          const questionNumber = `Q${String(index + 1).padStart(2, '0')}`;
          const answerPreview = question.answer
            ? question.answer.length > 100
              ? `${question.answer.substring(0, 100)}...`
              : question.answer
            : null;
          const resolvedQuestionAttachments = resolveAttachmentsForQuestion(question, focusedSection);

          return (
            <div key={question.id} className="space-y-1">
              {/* Question Answer */}
              <div>
                <span className="font-medium text-slate-700">{questionNumber}: </span>
                {answerPreview ? (
                  <span className="text-slate-600">{answerPreview}</span>
                ) : (
                  <span className="italic text-slate-400">[No answer yet]</span>
                )}
              </div>

              {/* Attachments (if any) */}
              {resolvedQuestionAttachments.length > 0 && (
                <div className="ml-4 space-y-1">
                  {resolvedQuestionAttachments.map((attachment) => {
                    // Show KPI value if it's a KPI attachment
                    if (attachment.type === 'kpi' && attachment.value !== undefined) {
                      const kpiValue = attachment.value;
                      const kpiUnit = attachment.unit || '';
                      return (
                        <div key={attachment.id} className="text-xs text-slate-500">
                          📈 {getAttachmentName(attachment)}: <span className="font-semibold">{kpiValue} {kpiUnit}</span> (attached)
                        </div>
                      );
                    }
                    return (
                      <div key={attachment.id} className="text-xs text-slate-500">
                        {getAttachmentIcon(attachment.type || '')} {getAttachmentName(attachment)} (attached)
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
        
        {/* Show standalone KPIs, Datasets, and Media not attached to questions */}
        {((focusedSection.kpis && focusedSection.kpis.length > 0) || 
          (focusedSection.datasets && focusedSection.datasets.length > 0) || 
          (focusedSection.media && focusedSection.media.length > 0)) && (
          <div className="mt-4 pt-4 border-t border-slate-200">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Section Data</p>
            
            {/* Standalone KPIs */}
            {focusedSection.kpis?.filter((kpi) => !isEntityLinked(kpi)).map((kpi) => (
              <div key={kpi.id} className="text-xs text-slate-600 mb-1">
                📈 <span className="font-semibold">{kpi.name}</span>: {kpi.value} {kpi.unit || ''}
                {kpi.target && <span className="text-slate-400"> (target: {kpi.target} {kpi.unit || ''})</span>}
              </div>
            ))}
            
            {/* Standalone Datasets */}
            {focusedSection.datasets?.filter((ds) => !isEntityLinked(ds)).map((dataset) => (
              <div key={dataset.id} className="text-xs text-slate-600 mb-1">
                📊 <span className="font-semibold">{dataset.name}</span> ({dataset.columns.length} columns, {dataset.rows.length} rows)
              </div>
            ))}
            
            {/* Standalone Media */}
            {focusedSection.media?.filter((m) => !isEntityLinked(m)).map((asset) => (
              <div key={asset.id} className="text-xs text-slate-600 mb-1">
                {getAttachmentIcon(asset.type)} <span className="font-semibold">{asset.title}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


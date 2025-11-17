// ========= PLAN2FUND — PREVIEW PANE =========
// Condensed preview showing only current section with first 100 chars of answers and data item references.

import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { BusinessPlan, Section, PlanDocument, PlanSection, Route } from '@/features/editor/types/plan';
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

function getAttachmentName(attachment: any): string {
  return attachment.title || attachment.name || 'Untitled';
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
    
    // Add attachments reference
    if (question.attachments && question.attachments.length > 0) {
      question.attachments.forEach((attachment) => {
        const icon = attachment.type === 'table' ? '📊' :
                     attachment.type === 'chart' ? '📈' :
                     attachment.type === 'image' ? '📷' : '📎';
        const name = attachment.title || 'Untitled';
        contentParts.push(`\n${icon} ${name} (attached)`);
      });
    }
    
    // Add spacing between questions
    if (index < section.questions.length - 1) {
      contentParts.push('\n\n');
    }
  });
  
  // Convert datasets to tables format
  const tables = section.datasets?.reduce((acc, dataset) => {
    if (dataset.name) {
      acc[dataset.name.toLowerCase().replace(/\s+/g, '_')] = {
        headers: dataset.columns.map(col => col.name),
        rows: dataset.rows.map(row => 
          dataset.columns.map(col => row[col.name] ?? '')
        )
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
              {question.attachments && question.attachments.length > 0 && (
                <div className="ml-4 space-y-1">
                  {question.attachments.map((attachment) => (
                    <div key={attachment.id} className="text-xs text-slate-500">
                      {getAttachmentIcon(attachment.type || '')} {getAttachmentName(attachment)} (attached)
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}


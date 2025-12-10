// ========= PLAN2FUND — RENDERING HELPERS =========
// Shared rendering utilities for DocumentRenderer and preview components
// Consolidated from: preview.ts, progress.ts, and DocumentRenderer.tsx

import React from 'react';
import { PlanDocument, Table, TitlePage, PlanSection, Section, Question, QuestionStatus } from '@/features/editor/lib/types/plan';

/**
 * Formats a table key into a readable label
 */
export function formatTableLabel(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .replace(/^\w/, (char) => char.toUpperCase());
}

/**
 * Renders a table component
 */
export function renderTable(table: Table) {
  if (!table.rows || table.rows.length === 0) {
    return null;
  }
  return (
    <div className="overflow-x-auto border border-gray-200 rounded-lg bg-white">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="text-left px-3 py-2 border-b border-gray-200">Item</th>
            {table.columns.map((column, index) => (
              <th key={index} className="text-right px-3 py-2 border-b border-gray-200">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="border-b border-gray-100">
              <td className="px-3 py-2 font-medium text-gray-700">{row.label}</td>
              {row.values.map((value, valueIndex) => (
                <td key={valueIndex} className="px-3 py-2 text-right text-gray-600">
                  {typeof value === 'number' ? value.toLocaleString() : value}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Unified helper to get field value from plan based on field key
 */
export function getFieldValue(plan: PlanDocument, fieldKey: string): string {
  // Metadata fields (title page)
  if (fieldKey === 'title') return plan.settings.titlePage?.title || '';
  if (fieldKey === 'subtitle') return plan.settings.titlePage?.subtitle || '';
  if (fieldKey === 'companyName') return plan.settings.titlePage?.companyName || '';
  if (fieldKey === 'legalForm') return plan.settings.titlePage?.legalForm || '';
  if (fieldKey === 'teamHighlight') return plan.settings.titlePage?.teamHighlight || '';
  if (fieldKey === 'author') return plan.settings.titlePage?.author || plan.settings.titlePage?.companyName || '';
  if (fieldKey === 'email') return plan.settings.titlePage?.contactInfo?.email || '';
  if (fieldKey === 'phone') return plan.settings.titlePage?.contactInfo?.phone || '';
  if (fieldKey === 'website') return plan.settings.titlePage?.contactInfo?.website || '';
  if (fieldKey === 'address') return plan.settings.titlePage?.contactInfo?.address || plan.settings.titlePage?.headquartersLocation || '';
  if (fieldKey === 'date') return plan.settings.titlePage?.date || new Date().toISOString().split('T')[0];
  if (fieldKey === 'confidentialityStatement') return plan.settings.titlePage?.confidentialityStatement || '';

  // Reference fields (ref-type-id)
  if (fieldKey.startsWith('ref-')) {
    const [, type, id] = fieldKey.split('-');
    const ref = plan.references?.find(r => r.id === id);
    if (ref) {
      return type === 'citation' ? ref.citation || '' : ref.url || '';
    }
  }

  // TOC fields (toc-type-id or toc-section-title-key)
  if (fieldKey.startsWith('toc-')) {
    if (fieldKey.startsWith('toc-section-title-')) {
      const sectionKey = fieldKey.replace('toc-section-title-', '');
      const section = plan.sections.find(s => s.key === sectionKey);
      return section?.title || '';
    }
    const [, type, id] = fieldKey.split('-');
    const entry = plan.ancillary?.tableOfContents?.find((e: any) => e.id === id);
    if (entry) {
      return type === 'title' ? entry.title || '' : String(entry.page || '');
    }
  }

  // Table fields (table-type-id)
  if (fieldKey.startsWith('table-')) {
    const [, type, id] = fieldKey.split('-');
    const entry = plan.ancillary?.listOfTables?.find((e: any) => e.id === id);
    if (entry) {
      return type === 'label' ? entry.label || '' : String(entry.page || '');
    }
  }

  // Figure fields (figure-type-id)
  if (fieldKey.startsWith('figure-')) {
    const [, type, id] = fieldKey.split('-');
    const entry = plan.ancillary?.listOfIllustrations?.find((e: any) => e.id === id);
    if (entry) {
      return type === 'label' ? entry.label || '' : String(entry.page || '');
    }
  }

  // Appendix fields (appendix-type-id)
  if (fieldKey.startsWith('appendix-')) {
    const [, type, id] = fieldKey.split('-');
    const appendix = plan.appendices?.find(a => a.id === id);
    if (appendix) {
      if (type === 'title') return appendix.title || '';
      if (type === 'description') return appendix.description || '';
      if (type === 'fileUrl') return appendix.fileUrl || '';
    }
  }

  return '';
}

/**
 * Helper function to handle title page field updates
 */
export function handleTitlePageFieldUpdate(
  path: (string | number)[],
  value: string,
  currentTitlePage: TitlePage,
  onTitlePageChange?: (titlePage: TitlePage) => void
) {
  if (!onTitlePageChange || !currentTitlePage) return;
  
  const currentContactInfo = currentTitlePage.contactInfo || {};
  
  // Build updated contactInfo ensuring required fields
  const updatedContactInfo: any = {
    name: currentContactInfo.name || currentTitlePage.companyName || '',
    email: currentContactInfo.email || '',
    phone: currentContactInfo.phone,
    website: currentContactInfo.website,
    address: currentContactInfo.address
  };

  // Build updated title page
  let updated: any = {
    ...currentTitlePage,
    planTitle: currentTitlePage.planTitle || '',
    companyName: currentTitlePage.companyName || '',
    date: currentTitlePage.date || new Date().toISOString().split('T')[0],
    contactInfo: updatedContactInfo
  };

  if (path[0] === 'contactInfo' && typeof path[1] === 'string') {
    updated.contactInfo[path[1]] = value;
    // Ensure required fields are still present
    if (!updated.contactInfo.name) {
      updated.contactInfo.name = updated.companyName || '';
    }
    if (!updated.contactInfo.email) {
      updated.contactInfo.email = '';
    }
  } else if (typeof path[0] === 'string') {
    updated[path[0]] = value;
  }

  onTitlePageChange(updated as TitlePage);
}

/**
 * Helper function to render editable text field (works with all section types)
 */
export interface RenderEditableFieldProps {
  fieldKey: string;
  value: string;
  onSave: (value: string) => void;
  targetSectionId: string;
  editingSectionId: string | null;
  editingField: string | null;
  editValue: string;
  setEditingField: (field: string | null) => void;
  setEditValue: (value: string) => void;
  onSectionClick?: (sectionId: string) => void;
  className?: string;
  placeholder?: string;
  multiline?: boolean;
}

export function renderEditableField({
  fieldKey,
  value,
  onSave,
  targetSectionId,
  editingSectionId,
  editingField,
  editValue,
  setEditingField,
  setEditValue,
  onSectionClick,
  className = '',
  placeholder,
  multiline = false
}: RenderEditableFieldProps): React.ReactNode {
  const isInEditMode = editingSectionId === targetSectionId;
  const isEditing = isInEditMode && editingField === fieldKey;
  
  // Unified helper to start editing a field
  const startEditing = (fieldKey: string, targetSectionId: string) => {
    const isInEditMode = editingSectionId === targetSectionId;
    
    // If not in edit mode, trigger it first
    if (!isInEditMode) {
      onSectionClick?.(targetSectionId);
    }
    
    // Start editing the field immediately
    setEditingField(fieldKey);
    setEditValue(value);
  };
  
  if (isEditing) {
    const Component = multiline ? 'textarea' : 'input';
    const inputProps = {
      value: editValue,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setEditValue(e.target.value);
      },
      onBlur: () => {
        onSave(editValue);
        setEditingField(null);
        setEditValue('');
      },
      onKeyDown: (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
          setEditingField(null);
          setEditValue('');
        } else if (e.key === 'Enter' && !multiline && !e.shiftKey) {
          e.preventDefault();
          onSave(editValue);
          setEditingField(null);
          setEditValue('');
        }
      },
      autoFocus: true,
      className: `${className} border-2 border-blue-500 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-300`,
      placeholder
    };
    
    return <Component {...inputProps} />;
  }
  
  return (
    <span
      className={`${className} cursor-pointer group relative inline-block rounded px-1 py-0.5 transition-all ${
        isInEditMode 
          ? 'bg-blue-50/30 border border-blue-300' 
          : 'bg-blue-50/20 border border-blue-200/50'
      }`}
      onClick={(e) => {
        e.stopPropagation(); // Prevent page click handler
        startEditing(fieldKey, targetSectionId);
      }}
      title="Click to edit"
    >
      {value || <span className="text-gray-400 italic">{placeholder || 'Click to edit'}</span>}
      <span className="absolute -top-1 -right-1 opacity-70">
        <svg className="w-3 h-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </span>
    </span>
  );
}

// ========================================
// Preview Conversion Functions
// ========================================

/**
 * Converts an editor Section to a PlanSection for preview rendering
 */
export function convertSectionToPlanSection(section: Section, sectionNumber: number | null): PlanSection {
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
      attachments: [],
      tableMetadata: {}
    },
    tables: {},
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

// ========================================
// Progress Calculation Functions
// ========================================

/**
 * Determines whether an answer meets the minimum threshold to count as drafted content.
 * Removes HTML tags before checking length to avoid inflated counts.
 */
export function meetsMinimalAnswerThreshold(content: string): boolean {
  const stripped = (content || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  if (!stripped) return false;

  const wordCount = stripped.split(/\s+/).filter(Boolean).length;
  const bulletCount = (content || '')
    .split('\n')
    .filter((line) => line.trim().match(/^([-*•]|[0-9]+\.)\s+/))
    .length;
  const sentenceCount = stripped.split(/[.!?]/).filter((sentence) => sentence.trim().length > 0).length;

  if (bulletCount >= 1) return true;
  if (sentenceCount >= 2 && wordCount >= 15) return true;
  return wordCount >= 30;
}

/**
 * Converts raw content to a question status for progress tracking.
 */
export function determineQuestionStatus(content: string): QuestionStatus {
  const stripped = (content || '').replace(/<[^>]*>/g, ' ').trim();
  if (!stripped) {
    return 'blank';
  }
  return meetsMinimalAnswerThreshold(content) ? 'complete' : 'draft';
}

/**
 * Calculates section completion based on the number of completed questions.
 */
export function calculateSectionCompletion(questions: Question[]): number {
  if (questions.length === 0) return 0;
  const completed = questions.filter((question) => question.status === 'complete').length;
  return Math.round((completed / questions.length) * 100);
}

/**
 * Basic legacy section progress used for requirements snapshot.
 */
export function calculateSectionProgress(section: PlanSection): { completionPercentage: number } {
  const content = section.content || '';
  if (!content.trim()) {
    return { completionPercentage: 0 };
  }
  return {
    completionPercentage: meetsMinimalAnswerThreshold(content) ? 100 : 40
  };
}


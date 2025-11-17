// ========= PLAN2FUND — PREVIEW PANE =========
// Former SectionContentRenderer is now a read-only preview that mirrors the document export.

import React from 'react';
import { BusinessPlan, Section } from '@/features/editor/types/plan';

interface PreviewPaneProps {
  plan: BusinessPlan | null;
  focusSectionId?: string | null;
}

function SectionPreview({ section, isFocused }: { section: Section; isFocused: boolean }) {
  return (
    <div
      className={`border rounded-lg p-4 bg-white shadow-sm ${
        isFocused ? 'border-blue-400 shadow-md' : 'border-gray-100'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold text-gray-900">{section.title}</h3>
        {section.progress !== undefined && (
          <span className="text-xs text-gray-500">{section.progress}% complete</span>
        )}
      </div>
      {section.description && (
        <p className="text-sm text-gray-500 mb-3">{section.description}</p>
      )}
      <div className="space-y-4">
        {section.questions.map((question) => (
          <div key={question.id}>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              {question.prompt}
            </p>
            <div className="mt-1 text-sm text-gray-800 whitespace-pre-line bg-gray-50 rounded-md p-3">
              {question.answer ? question.answer : <span className="text-gray-400">No answer yet</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SectionContentRenderer({ plan, focusSectionId }: PreviewPaneProps) {
  if (!plan) {
    return (
      <div className="h-full flex items-center justify-center text-sm text-gray-500">
        Nothing to preview yet.
      </div>
    );
  }

  const { titlePage, sections, ancillary } = plan;

  return (
    <div className="h-full overflow-y-auto bg-gray-50 p-6 space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">{titlePage.planTitle}</h2>
        <p className="text-sm text-gray-600 mb-1">{titlePage.companyName}</p>
        {titlePage.valueProp && (
          <p className="text-sm text-gray-500 mb-1">{titlePage.valueProp}</p>
        )}
        <p className="text-xs text-gray-400">
          {titlePage.date} • {titlePage.contactInfo.email}
          {titlePage.contactInfo.phone ? ` • ${titlePage.contactInfo.phone}` : ''}
        </p>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-base font-semibold text-gray-900 mb-3">Table of contents</h3>
        <ol className="space-y-1 text-sm text-gray-700 list-decimal list-inside">
          {(ancillary?.tableOfContents ?? sections.map((section) => ({
            id: section.id,
            title: section.title,
            hidden: false
          }))).filter((entry) => !entry.hidden).map((entry) => (
            <li key={entry.id} className={focusSectionId === entry.id ? 'text-blue-600 font-medium' : ''}>
              {entry.title}
            </li>
          ))}
        </ol>
      </div>

      <div className="space-y-4">
        {sections.map((section) => (
          <SectionPreview
            key={section.id}
            section={section}
            isFocused={focusSectionId === section.id}
          />
        ))}
      </div>
    </div>
  );
}


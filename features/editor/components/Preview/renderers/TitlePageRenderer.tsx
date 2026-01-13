import React from 'react';
import type { PlanDocument } from '@/features/editor/lib';
import { PAGE_STYLE, METADATA_SECTION_ID } from '@/features/editor/lib';

// Helper function to get field value from plan
const getFieldValue = (plan: PlanDocument, fieldKey: string): string | undefined => {
  const titlePage = plan.settings?.titlePage;
  if (!titlePage) return undefined;
  switch (fieldKey) {
    case 'title': return titlePage.title;
    case 'subtitle': return titlePage.subtitle;
    case 'companyName': return titlePage.companyName;
    case 'legalForm': return titlePage.legalForm;
    case 'teamHighlight': return titlePage.teamHighlight;
    case 'author': return (titlePage.contactInfo as any)?.name || titlePage.companyName;
    case 'email': return titlePage.contactInfo?.email;
    case 'phone': return titlePage.contactInfo?.phone;
    case 'website': return titlePage.contactInfo?.website;
    case 'address': return titlePage.contactInfo?.address || titlePage.headquartersLocation;
    case 'date': return titlePage.date;
    case 'confidentialityStatement': return titlePage.confidentialityStatement;
    default: return undefined;
  }
};

interface TitlePageRendererProps {
  planDocument: PlanDocument;
  disabledSections: Set<string>;
  t: {
    businessPlan: string;
    author: string;
    email: string;
    phone: string;
    website: string;
    address: string;
    date: string;
  };
}

export function TitlePageRenderer({ planDocument, disabledSections, t }: TitlePageRendererProps) {
  if (!planDocument.settings.includeTitlePage || disabledSections.has(METADATA_SECTION_ID)) return null;
  
  const tp = planDocument.settings.titlePage;
  const fv = (key: string) => getFieldValue(planDocument, key);
  
  return (
    <div className="preview-title-page export-preview-page" data-section-id={METADATA_SECTION_ID} style={PAGE_STYLE}>
      <div className="flex flex-col justify-between h-full pb-16 px-10">
          <div className="flex-shrink-0 flex flex-col items-center">
            {tp?.logoUrl && <img src={tp.logoUrl} alt="Company Logo" className="mx-auto h-24 object-contain mb-8" />}
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-500">{t.businessPlan}</p>
          </div>
          <div className="flex-1 flex flex-col justify-center items-center text-center max-w-3xl mx-auto px-6">
            <h1 className="preview-title mb-4 text-3xl sm:text-4xl font-bold leading-tight text-slate-900">{fv('title') || 'Plan Title'}</h1>
            {fv('subtitle') && <p className="text-base text-gray-600 font-normal leading-relaxed mb-6 max-w-2xl block">{fv('subtitle')}</p>}
            <div className="mb-4">
              <div className="text-lg font-semibold text-gray-800 block">{fv('companyName') || 'Company Name'}</div>
              {fv('legalForm') && <span className="font-normal text-gray-600 ml-2">{fv('legalForm')}</span>}
              {fv('teamHighlight') && <p className="text-sm text-gray-600 italic mt-2 block">{fv('teamHighlight')}</p>}
            </div>
          </div>
          <div className="flex-shrink-0 w-full mt-auto pt-10">
            <div className="mb-6">
              <p className="text-sm text-gray-700 mb-3">
                <span className="font-semibold">{t.author}:</span> <span className="font-normal">{fv('author') || 'Author / Company Name'}</span>
              </p>
              <div className="space-y-1.5 text-xs text-gray-600">
                {fv('email') && <p><span className="font-medium text-gray-700">{t.email}:</span> {fv('email')}</p>}
                {fv('phone') && <p><span className="font-medium text-gray-700">{t.phone}:</span> {fv('phone')}</p>}
                {fv('website') && <p><span className="font-medium text-gray-700">{t.website}:</span> <a href={fv('website')} className="text-blue-600 hover:text-blue-800 underline">{fv('website')}</a></p>}
                {fv('address') && <p className="mt-2"><span className="font-medium text-gray-700">{t.address}:</span> {fv('address')}</p>}
              </div>
            </div>
            <div className="w-full flex justify-between items-end pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-600"><span className="font-medium text-gray-700">{t.date}:</span> {fv('date') || 'YYYY-MM-DD'}</p>
              {fv('confidentialityStatement') && <div className="text-right max-w-md"><p className="text-xs text-gray-500 italic leading-relaxed block">{fv('confidentialityStatement')}</p></div>}
            </div>
          </div>
        </div>
      </div>
  );
}

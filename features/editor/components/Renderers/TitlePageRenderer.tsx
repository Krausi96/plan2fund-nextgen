// ========= PLAN2FUND — TITLE PAGE RENDERER =========
// Renders the title page (metadata section) of the business plan

import React from 'react';
import { 
  METADATA_SECTION_ID,
  getTranslation,
  PAGE_STYLE,
  useDisabledSectionsSet,
} from '@/features/editor/lib';

function getFieldValue(plan: any, fieldKey: string): string | undefined {
  const titlePage = plan.settings?.titlePage;
  if (!titlePage) return undefined;

  switch (fieldKey) {
    case 'title':
      return titlePage.title;
    case 'subtitle':
      return titlePage.subtitle;
    case 'companyName':
      return titlePage.companyName;
    case 'legalForm':
      return titlePage.legalForm;
    case 'teamHighlight':
      return titlePage.teamHighlight;
    case 'author':
      return titlePage.contactInfo?.name || titlePage.companyName;
    case 'email':
      return titlePage.contactInfo?.email;
    case 'phone':
      return titlePage.contactInfo?.phone;
    case 'website':
      return titlePage.contactInfo?.website;
    case 'address':
      return titlePage.contactInfo?.address || titlePage.headquartersLocation;
    case 'date':
      return titlePage.date;
    case 'confidentialityStatement':
      return titlePage.confidentialityStatement;
    default:
      return undefined;
  }
}

interface TitlePageRendererProps {
  plan: any;
}

export default function TitlePageRenderer({
  plan
}: TitlePageRendererProps) {
  // Access store directly - no prop drilling needed
  const disabledSections = useDisabledSectionsSet();
  const isGerman = plan.language === 'de';
  const t = getTranslation(isGerman);

  if (!plan.settings.includeTitlePage || disabledSections.has(METADATA_SECTION_ID)) {
    return null;
  }

  return (
    <div 
      className="preview-title-page export-preview-page"
      data-section-id={METADATA_SECTION_ID}
      style={PAGE_STYLE}
    >
      <div className="export-preview-page-scaler">
        <div className="flex flex-col justify-between h-full py-16 px-10">
          {/* Top Section: Logo and Document Type */}
          <div className="flex-shrink-0 flex flex-col items-center mb-12">
            <div className="mb-8 relative">
              {plan.settings.titlePage?.logoUrl && (
                <img 
                  src={plan.settings.titlePage.logoUrl} 
                  alt="Company Logo" 
                  className="mx-auto h-24 object-contain" 
                />
              )}
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-500 letter-spacing-wide">
              {t.businessPlan}
            </p>
          </div>

          {/* Center Section: Title and Company Info */}
          <div className="flex-1 flex flex-col justify-center items-center text-center max-w-3xl mx-auto px-6">
            <h1 className="preview-title mb-4 text-3xl sm:text-4xl font-bold leading-tight text-slate-900 tracking-tight">
              {getFieldValue(plan, 'title') || 'Plan Title'}
            </h1>
            
            {getFieldValue(plan, 'subtitle') && (
              <p className="text-base text-gray-600 font-normal leading-relaxed mb-6 max-w-2xl block">
                {getFieldValue(plan, 'subtitle')}
              </p>
            )}

            <div className="mb-4">
              <div className="text-lg font-semibold text-gray-800 block">
                {getFieldValue(plan, 'companyName') || 'Company Name'}
              </div>
              {getFieldValue(plan, 'legalForm') && (
                <span className="font-normal text-gray-600 ml-2">
                  {getFieldValue(plan, 'legalForm')}
                </span>
              )}
              {getFieldValue(plan, 'teamHighlight') && (
                <p className="text-sm text-gray-600 italic mt-2 block">
                  {getFieldValue(plan, 'teamHighlight')}
                </p>
              )}
            </div>
          </div>

          {/* Bottom Section: Author, Contact, Date */}
          <div className="flex-shrink-0 w-full mt-auto pt-10">
            <div className="mb-6">
              <p className="text-sm text-gray-700 mb-3">
                <span className="font-semibold">{t.author}:</span>{' '}
                <span className="font-normal">
                  {getFieldValue(plan, 'author') || 'Author / Company Name'}
                </span>
              </p>
              <div className="space-y-1.5 text-xs text-gray-600">
                {getFieldValue(plan, 'email') && (
                  <p>
                    <span className="font-medium text-gray-700">{t.email}:</span>{' '}
                    {getFieldValue(plan, 'email')}
                  </p>
                )}
                {getFieldValue(plan, 'phone') && (
                  <p>
                    <span className="font-medium text-gray-700">{t.phone}:</span>{' '}
                    {getFieldValue(plan, 'phone')}
                  </p>
                )}
                {getFieldValue(plan, 'website') && (
                  <p>
                    <span className="font-medium text-gray-700">{t.website}:</span>{' '}
                    <a href={getFieldValue(plan, 'website')} className="text-blue-600 hover:text-blue-800 underline">
                      {getFieldValue(plan, 'website')}
                    </a>
                  </p>
                )}
                {getFieldValue(plan, 'address') && (
                  <p className="mt-2">
                    <span className="font-medium text-gray-700">{t.address}:</span>{' '}
                    {getFieldValue(plan, 'address')}
                  </p>
                )}
              </div>
            </div>

            <div className="w-full flex justify-between items-end pt-4 border-t border-gray-200">
              <div>
                <p className="text-xs text-gray-600">
                  <span className="font-medium text-gray-700">{t.date}:</span>{' '}
                  {getFieldValue(plan, 'date') || 'YYYY-MM-DD'}
                </p>
              </div>
              {getFieldValue(plan, 'confidentialityStatement') && (
                <div className="text-right max-w-md">
                  <p className="text-xs text-gray-500 italic leading-relaxed block">
                    {getFieldValue(plan, 'confidentialityStatement')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import type { PlanDocument } from '@/features/editor/lib';
import { PAGE_STYLE, METADATA_SECTION_ID } from '@/features/editor/lib';
import { useI18n } from '@/shared/contexts/I18nContext'; // Import i18n context

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
    case 'confidentiality': return (titlePage as any).confidentiality; // Raw confidentiality value
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
    confidentiality: string;
    projectNamePlaceholder: string;
    authorPlaceholder: string;
    emailPlaceholder: string;
    phonePlaceholder: string;
    websitePlaceholder: string;
    addressPlaceholder: string;
    subtitlePlaceholder: string;
  };
}

export function TitlePageRenderer({ planDocument, disabledSections, t }: TitlePageRendererProps) {
  const { locale } = useI18n(); // Get locale from i18n context
  
  if (!planDocument.settings.includeTitlePage || disabledSections.has(METADATA_SECTION_ID)) return null;
  
  const tp = planDocument.settings.titlePage;
  const fv = (key: string) => getFieldValue(planDocument, key);
  
  // Detect language from i18n context
  const isGerman = locale === 'de';
  
  // Get product-specific title based on product type
  // Only show product title when product is actually selected
  const getProductTitle = () => {
    if (!planDocument.productType) {
      return null; // No product selected yet
    }
    
    switch (planDocument.productType) {
      case 'strategy':
        return 'planTypes.strategy.title';
      case 'review':
        return 'planTypes.review.title';
      case 'submission':
        return 'planTypes.custom.title';
      default:
        return 'businessPlan';
    }
  };
  
  // Use dynamic translation lookup for product title
  const productTitleKey = getProductTitle();
  const productTitle = productTitleKey ? t[productTitleKey as keyof typeof t] : null;
  
  return (
    <div className="preview-title-page export-preview-page" data-section-id={METADATA_SECTION_ID} style={PAGE_STYLE}>
      <div className="flex flex-col justify-between h-full">
        <div className="flex-shrink-0 flex flex-col items-center">
          {tp?.logoUrl && <img src={tp.logoUrl} alt="Company Logo" className="mx-auto h-24 object-contain mb-8" />}
          {/* Only show product title when product is actually selected */}
          {productTitle && planDocument.productType && (
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-500 mb-2">{productTitle}</p>
          )}
        </div>
        <div className="flex-1 flex flex-col justify-center items-center text-center max-w-3xl mx-auto px-6">
          <h1 className="preview-title mb-4 text-3xl sm:text-4xl font-bold leading-tight text-slate-900">
            {fv('title') || (isGerman ? 'Dein Projektname' : 'Your Project Title')}
          </h1>
          <p className="text-base text-gray-600 font-normal leading-relaxed mb-6 max-w-2xl block">
            {fv('subtitle') || t.subtitlePlaceholder}
          </p>
          <div className="mb-4">
            <div className="text-lg font-semibold text-gray-800 block">
              {fv('companyName') || t.authorPlaceholder}
            </div>
          </div>
        </div>
        <div className="flex-shrink-0 w-full">
          <div className="h-10 md:h-12 lg:h-16 bg-gradient-to-b from-transparent to-transparent via-gray-100/30 rounded-lg my-2"></div>
        </div>
        <div className="flex-shrink-0 w-full pt-8">
          <div className="mb-6">
            <div className="space-y-1.5 text-xs text-gray-600">
              <p><span className="font-medium text-gray-700">{t.email}:</span> {fv('email') || t.emailPlaceholder}</p>
              <p><span className="font-medium text-gray-700">{t.phone}:</span> {fv('phone') || t.phonePlaceholder}</p>
              <p><span className="font-medium text-gray-700">{t.website}:</span> <a href={fv('website') || '#'} className="text-blue-600 hover:text-blue-800 underline">{fv('website') || t.websitePlaceholder}</a></p>
              <p className="mt-2"><span className="font-medium text-gray-700">{t.address}:</span> {fv('address') || t.addressPlaceholder}</p>
            </div>
          </div>
          <div className="w-full flex justify-between items-end pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-600">
              <span className="font-medium text-gray-700">{t.date}:</span>{' '}
              {(() => {
                const fieldValue = fv('date');
                if (fieldValue) {
                  try {
                    const dateObj = new Date(fieldValue);
                    const formatted = `${String(dateObj.getDate()).padStart(2, '0')}/${String(dateObj.getMonth() + 1).padStart(2, '0')}/${dateObj.getFullYear()}`;
                    return formatted;
                  } catch (e) {
                    return 'Invalid Date';
                  }
                } else {
                  const today = new Date();
                  const formatted = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
                  return formatted;
                }
              })()}
            </p>
            {(fv('confidentialityStatement') || fv('confidentiality')) && (
              <div className="text-right max-w-md">
                <p className="text-xs text-gray-500 italic leading-relaxed block">
                  <span className="font-bold">{t.confidentiality}:</span>{' '}
                  {fv('confidentialityStatement')}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

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
      <div className="flex flex-col justify-between h-full pb-16 px-12">
        {/* Header Section */}
        <div className="flex-shrink-0 pt-12">
          <div className="flex flex-col items-center text-center">
            {/* Logo */}
            {tp?.logoUrl && (
              <div className="mb-8">
                <img 
                  src={tp.logoUrl} 
                  alt="Company Logo" 
                  className="mx-auto max-h-20 object-contain drop-shadow-sm"
                />
              </div>
            )}
            
            {/* Product Type (only when selected) */}
            {productTitle && (
              <div className="mb-2">
                <p className="text-sm font-semibold uppercase tracking-wider text-gray-500 letter-spacing-1">
                  {productTitle}
                </p>
              </div>
            )}
          </div>
        </div>
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col justify-center items-center text-center px-8">
          <div className="max-w-2xl w-full">
            {/* Project Title */}
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 leading-tight tracking-tight">
              {fv('title') || 'Your Project Title'}
            </h1>
            
            {/* Subtitle */}
            {fv('subtitle') && (
              <p className="text-xl text-gray-600 font-light mb-8 leading-relaxed">
                {fv('subtitle')}
              </p>
            )}
            
            {/* Company Information */}
            <div className="mb-2">
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                {fv('companyName') || 'Your Company Name'}
              </h2>
              {fv('legalForm') && (
                <p className="text-gray-600">
                  {fv('legalForm')}
                </p>
              )}
              {fv('teamHighlight') && (
                <p className="text-gray-600 italic mt-3">
                  {fv('teamHighlight')}
                </p>
              )}
            </div>
          </div>
        </div>
        
        {/* Footer Section */}
        <div className="flex-shrink-0 w-full">
          <div className="border-t border-gray-300 pt-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
              {/* Contact Information */}
              <div>
                <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide mb-3">
                  {t.author}
                </h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>{fv('author') || 'Your Name'}</p>
                  {fv('email') && <p>{fv('email')}</p>}
                  {fv('phone') && <p>{fv('phone')}</p>}
                  {fv('website') && (
                    <p>
                      <a 
                        href={fv('website')} 
                        className="text-blue-600 hover:text-blue-800 underline"
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        {fv('website')}
                      </a>
                    </p>
                  )}
                </div>
              </div>
              
              {/* Additional Information */}
              <div>
                <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide mb-3">
                  Information
                </h3>
                <div className="space-y-2 text-sm text-gray-600">
                  {fv('address') && <p>{fv('address')}</p>}
                  <p>
                    <span className="font-medium">{t.date}:</span> {fv('date') || new Date().toLocaleDateString()}                    
                  </p>
                  {fv('confidentialityStatement') && (
                    <p className="italic text-gray-500 pt-2 border-t border-gray-200 mt-2">
                      {fv('confidentialityStatement')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

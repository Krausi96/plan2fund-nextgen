import React from 'react';
import type { PlanDocument } from '@/features/editor/lib';
import { PAGE_STYLE, METADATA_SECTION_ID } from '@/features/editor/lib';
import { SimpleTitlePageRenderer, DEFAULT_TITLE_PAGE_CONFIG } from './TitlePageStyles';

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
    case 'logoUrl': return titlePage.logoUrl;
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

  // Only show product type when actually selected (live preview fix)
  const showProductType = !!planDocument.productType;

  // Simplified configuration - can be expanded later with user settings
  const config = {
    ...DEFAULT_TITLE_PAGE_CONFIG,
    showProductType: showProductType
  };

  return (
    <SimpleTitlePageRenderer
      planDocument={planDocument}
      config={config}
      getField={(key) => getFieldValue(planDocument, key)}
    />
  );
}

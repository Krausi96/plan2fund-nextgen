import type { SectionTemplate, DocumentTemplate } from '../core/template-types';
import type { ProductType } from '../core/product-types';

export interface TitlePage {
  planTitle: string;
  valueProp?: string;
  companyName: string;
  legalForm?: string;
  teamHighlight?: string;
  date: string;
  logoUrl?: string;
  confidentialityStatement?: string;
  headquartersLocation?: string;
  contactInfo?: {
    name?: string;
    email?: string;
    phone?: string;
    website?: string;
    address?: string;
  };
}

export interface PlanSection {
  key: string;
  id: string;
  title: string;
  content?: string;
  fields?: {
    displayTitle?: string;
    sectionNumber?: number | null;
    subchapters?: Array<{ id: string; title: string; numberLabel: string }>;
    [key: string]: any;
  };
  status?: string;
  tables?: Record<string, any>;
  figures?: Array<{
    id?: string;
    title?: string;
    caption?: string;
    description?: string;
    source?: string;
    tags?: string[];
    uri?: string;
    altText?: string;
    [key: string]: any;
  }>;
  [key: string]: any;
}

export interface PlanDocument {
  id?: string;
  language: 'de' | 'en';
  productType?: ProductType;
  settings: {
    includeTitlePage?: boolean;
    includePageNumbers?: boolean;
    titlePage?: {
      title?: string;
      subtitle?: string;
      companyName?: string;
      legalForm?: string;
      teamHighlight?: string;
      date?: string;
      logoUrl?: string;
      confidentialityStatement?: string;
      headquartersLocation?: string;
      contactInfo?: {
        email?: string;
        phone?: string;
        website?: string;
        address?: string;
      };
    };
    [key: string]: any;
  };
  sections: PlanSection[];
  metadata?: {
    disabledSectionIds?: string[];
    disabledDocumentIds?: string[];
    customSections?: SectionTemplate[];
    customDocuments?: DocumentTemplate[];
    [key: string]: any;
  };
  ancillary?: {
    listOfTables?: Array<{ id: string; label: string; page?: number; [key: string]: any }>;
    listOfIllustrations?: Array<{ id: string; label: string; page?: number; [key: string]: any }>;
    tableOfContents?: Array<{ id: string; title: string; page?: number; hidden?: boolean; [key: string]: any }>;
    [key: string]: any;
  };
  references?: Array<{
    id: string;
    citation?: string;
    url?: string;
    accessedDate?: string;
    [key: string]: any;
  }>;
  appendices?: Array<{
    id: string;
    title?: string;
    description?: string;
    fileUrl?: string;
    [key: string]: any;
  }>;
  [key: string]: any;
}

// Re-export BusinessPlan if it exists elsewhere, otherwise define it
export type BusinessPlan = PlanDocument;

// Helper types for editor store
export type SectionWithMetadata = {
  id: string;
  title: string;
  isDisabled: boolean;
  origin?: 'template' | 'custom';
  isSpecial: boolean;
  required?: boolean;
  [key: string]: any;
};

export type DocumentWithMetadata = {
  id: string;
  name: string;
  isDisabled: boolean;
  origin?: 'template' | 'custom';
  [key: string]: any;
};
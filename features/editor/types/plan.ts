// ========= PLAN2FUND — CANONICAL PLAN TYPES =========
// Business plan editor data contracts (new model + legacy compatibility)

// ----------------------------------------------------------------------------------
// Modern Business Plan model (used by the unified editor shell)
// ----------------------------------------------------------------------------------

export type ProductType =
  | 'submission'
  | 'review'
  | 'strategy'
  | 'prototype'
  | 'research_project'
  | 'other';

export type FundingProgramType = 'grant' | 'loan' | 'equity' | 'visa' | 'other';

export type RightPanelView = 'ai' | 'data' | 'preview' | 'requirements' | 'info';

export interface MediaAsset {
  id: string;
  type: 'image' | 'table' | 'chart' | 'kpi';
  title: string;
  description?: string;
  datasetId?: string;
  uri?: string;
  caption?: string;
  altText?: string;
  tags?: string[];
  figureNumber?: string;
  referenceIds?: string[];
  attachedQuestionId?: string;
}

export interface DatasetColumn {
  name: string;
  type: 'string' | 'number' | 'date';
  unit?: string;
}

export interface Dataset {
  id: string;
  name: string;
  description?: string;
  columns: DatasetColumn[];
  rows: Array<Record<string, string | number | Date>>;
  tags?: string[];
  usageCount?: number;
  lastUpdated?: string;
}

export interface KPI {
  id: string;
  name: string;
  value: number;
  unit?: string;
  target?: number;
  description?: string;
  datasetId?: string;
  trend?: 'up' | 'down' | 'flat';
}

export interface Question {
  id: string;
  prompt: string;
  answer?: string;
  attachments?: MediaAsset[];
  suggestions?: string[];
  warnings?: string[];
  helperText?: string;
  placeholder?: string;
  required?: boolean;
  requiredAssets?: Array<MediaAsset['type']>;
  helpLink?: string;
  aiContext?: {
    lastSuggestion?: string;
    updatedAt?: string;
  };
}

export interface Section {
  id: string;
  title: string;
  description?: string;
  questions: Question[];
  datasets?: Dataset[];
  kpis?: KPI[];
  media?: MediaAsset[];
  collapsed?: boolean;
  category?: string;
  progress?: number;
}

export interface TitlePageContactInfo {
  name: string;
  email: string;
  phone?: string;
  website?: string;
  address?: string;
}

export interface TitlePage {
  companyName: string;
  logoUrl?: string;
  valueProp?: string;
  planTitle: string;
  date: string;
  contactInfo: TitlePageContactInfo;
  confidentialityStatement?: string;
}

export interface Reference {
  id: string;
  citation: string;
  url?: string;
  accessedDate?: string;
}

export interface AppendixItem {
  id: string;
  title: string;
  description?: string;
  media?: MediaAsset;
  referenceIds?: string[];
  fileUrl?: string;
  uploadedAt?: string;
}

export interface TableOfContentsEntry {
  id: string;
  title: string;
  page?: number;
  hidden?: boolean;
}

export interface FigureListItem {
  id: string;
  label: string;
  page?: number;
  type: 'table' | 'chart' | 'image';
  assetId?: string;
}

export interface Footnote {
  id: string;
  content: string;
  sectionId?: string;
  questionId?: string;
  referenceId?: string;
}

export interface AncillaryContent {
  tableOfContents: TableOfContentsEntry[];
  listOfIllustrations: FigureListItem[];
  listOfTables: FigureListItem[];
  citationStyle: 'apa' | 'mla' | 'chicago' | 'custom';
  footnotes: Footnote[];
  lastGenerated?: string;
}

export interface BusinessPlan {
  id: string;
  productType: ProductType;
  fundingProgram?: FundingProgramType;
  titlePage: TitlePage;
  sections: Section[];
  references: Reference[];
  appendices?: AppendixItem[];
  ancillary: AncillaryContent;
  metadata?: {
    ownerId?: string;
    lastSavedAt?: string;
    version?: string;
  };
}

export type ConversationMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
};

// ----------------------------------------------------------------------------------
// Legacy plan model (kept for backward compatibility). Existing flows (PDF export,
// dashboard, etc.) still import these. Do not remove until migrated.
// ----------------------------------------------------------------------------------

export type Table = { 
  columns: string[]; 
  rows: Array<{ label: string; values: (number | string)[] }>;
};

export type FigureRef = { 
  type: 'line'|'bar'|'pie'|'donut', 
  dataRef: 'revenue'|'costs'|'cashflow'|'useOfFunds', 
  caption?: string, 
  altText?: string 
};

export type PlanSection = {
  key: string,
  title: string,
  content: string,
  fields?: Record<string, any>,
  tables?: { 
    revenue?: Table, 
    costs?: Table, 
    cashflow?: Table, 
    useOfFunds?: Table,
    risks?: Table,
    competitors?: Table,
    timeline?: Table,
    ratios?: Table,
    team?: Table,
    [key: string]: Table | undefined
  },
  figures?: Array<FigureRef | { [key: string]: any }>,
  chartTypes?: Record<string, 'bar' | 'line' | 'pie' | 'donut'>,
  sources?: Array<{ title: string, url: string }>,
  status?: 'aligned'|'needs_fix'|'missing'
};

export type Route = 'grant'|'loan'|'equity'|'visa';
export type Product = 'strategy'|'review'|'submission';

export type PlanDocument = {
  id: string,
  ownerId: string,
  product: Product,
  route: Route,
  programId?: string,
  language: 'de'|'en',
  tone: 'neutral'|'formal'|'concise',
  targetLength: 'short'|'standard'|'extended',
  settings: {
    includeTitlePage: boolean,
    includePageNumbers: boolean,
    citations: 'none'|'simple',
    captions: boolean,
    graphs: { 
      revenueCosts?: boolean, 
      cashflow?: boolean, 
      useOfFunds?: boolean 
    },
    titlePage?: {
      title?: string,
      subtitle?: string,
      author?: string,
      date?: string
    },
    formatting?: {
      fontFamily?: string,
      fontSize?: number,
      lineSpacing?: number,
      margins?: {
        top: number,
        bottom: number,
        left: number,
        right: number
      }
    }
  },
  sections: PlanSection[],
  unitEconomics?: { 
    price?: number, 
    unitCost?: number, 
    contributionMargin?: number, 
    breakEvenUnits?: number 
  },
  milestones?: Array<{ 
    label: string, 
    date?: string, 
    metric?: string 
  }>,
  readiness?: { 
    score: number, 
    dimensions: Array<{ 
      key: string, 
      status: 'aligned'|'needs_fix'|'missing', 
      notes?: string 
    }> 
  },
  attachments?: Array<{ 
    type: 'integratedBudget'|'workPackagesTimeline'|'bankSummaryPage'|'investorTeaserOnePager'|'capTableBasic', 
    url?: string 
  }>,
  onePager?: { 
    html?: string, 
    pdfUrl?: string 
  },
  addonPack?: boolean,
  versions?: Array<{ 
    id: string, 
    createdAt: string, 
    note?: string 
  }>
};


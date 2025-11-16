// ========= PLAN2FUND — CANONICAL PLAN TYPES =========
// Single source of truth for all plan-related data structures
// Moved from shared/types/plan.ts to editor/types/plan.ts

export type Table = { 
  columns: string[]; 
  rows: Array<{ label: string; values: (number | string)[] }>; // Support both numbers (financial) and strings (text data)
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
  content: string,                        // rich text (HTML/MD)
  fields?: Record<string, any>,           // for structured inputs (e.g., TAM/SAM/SOM)
  tables?: { 
    revenue?: Table, 
    costs?: Table, 
    cashflow?: Table, 
    useOfFunds?: Table,
    // Additional table types for various sections
    risks?: Table,
    competitors?: Table,
    timeline?: Table,
    ratios?: Table,
    team?: Table,
    [key: string]: Table | undefined      // Allow any other table keys
  },
  figures?: Array<FigureRef | { [key: string]: any }>,  // Allow FigureRef or any figure structure
  chartTypes?: Record<string, 'bar' | 'line' | 'pie' | 'donut'>, // User-selected chart types per table key
  sources?: Array<{ title: string, url: string }>,
  status?: 'aligned'|'needs_fix'|'missing'
};

export type Route = 'grant'|'loan'|'equity'|'visa';
export type Product = 'strategy'|'review'|'submission';

export type ConversationMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
};

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


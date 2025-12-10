// ========= PLAN2FUND — EDITOR HELPERS =========
// Consolidated editor helper functions
// Merged from: sectionFiltering.ts, planHelpers.ts, programHelpers.ts, metadataHelpers.ts

import type {
  BusinessPlan,
  Dataset,
  MediaAsset,
  PlanSection as LegacyPlanSection,
  Question,
  QuestionStatus,
  Section,
  Table,
  AncillaryContent,
  TitlePage,
  FundingProgramType,
  TemplateFundingType,
  ProductType
} from '@/features/editor/lib/types/plan';
import type { SectionTemplate, DocumentTemplate } from '@templates';
import type { PlanSection as StoredPlanSection } from '@/shared/user/storage/planStore';
import {
  savePlanSections,
  saveQuestionStates
} from '@/shared/user/storage/planStore';
import { calculateSectionCompletion, determineQuestionStatus } from './renderHelpers';

// ========================================
// Document-Section Keywords Mapping
// ========================================

/**
 * Keywords mapping for document-to-section matching by product type
 * Used to find related sections when creating or selecting documents
 */
export const KEYWORDS_BY_PRODUCT: Record<string, Record<string, string[]>> = {
  submission: {
    'work plan': ['work', 'plan', 'timeline', 'milestone', 'project', 'implementation'],
    'gantt': ['work', 'plan', 'timeline', 'schedule', 'project', 'milestone', 'implementation'],
    'budget': ['budget', 'financial', 'cost', 'finance', 'funding', 'resources'],
    'financial': ['budget', 'financial', 'cost', 'finance', 'funding', 'resources'],
    'team': ['team', 'personnel', 'staff', 'organization', 'management'],
    'cv': ['team', 'personnel', 'staff', 'biography', 'management'],
    'pitch': ['executive', 'summary', 'overview', 'introduction'],
    'deck': ['executive', 'summary', 'overview', 'introduction']
  },
  strategy: {
    'work plan': ['strategy', 'planning', 'timeline', 'roadmap', 'vision'],
    'gantt': ['strategy', 'planning', 'timeline', 'roadmap'],
    'budget': ['budget', 'financial', 'investment', 'resources'],
    'team': ['team', 'organization', 'structure', 'leadership']
  },
  review: {
    'work plan': ['review', 'analysis', 'assessment', 'evaluation'],
    'budget': ['budget', 'financial', 'review', 'analysis'],
    'team': ['team', 'review', 'assessment']
  }
};

// ========================================
// Metadata Constants & Types
// ========================================

export const METADATA_SECTION_ID = '__metadata__';
export const ANCILLARY_SECTION_ID = '__ancillary__';
export const REFERENCES_SECTION_ID = '__references__';
export const APPENDICES_SECTION_ID = '__appendices__';

type MetadataFieldPath = (string | number)[];

export interface RequiredMetadataField {
  id: string;
  path: MetadataFieldPath;
  labelKey: string;
  fallback: string;
  validator?: (value: string) => boolean;
}

export const REQUIRED_METADATA_FIELDS: RequiredMetadataField[] = [
  {
    id: 'planTitle',
    path: ['planTitle'],
    labelKey: 'editor.metadata.field.planTitle',
    fallback: 'Plan title',
    validator: (value) => {
      const normalized = value.trim().toLowerCase();
      return normalized.length > 0 && normalized !== 'business plan';
    }
  },
  {
    id: 'companyName',
    path: ['companyName'],
    labelKey: 'editor.metadata.field.companyName',
    fallback: 'Company name'
  },
  {
    id: 'contactEmail',
    path: ['contactInfo', 'email'],
    labelKey: 'editor.metadata.field.email',
    fallback: 'Contact email'
  },
  {
    id: 'date',
    path: ['date'],
    labelKey: 'editor.metadata.field.date',
    fallback: 'Date'
  }
];

// ========================================
// Section Filtering Functions
// ========================================

/**
 * Filter sections based on clicked document - match by category or name keywords
 */
export function getRelatedSections(
  documentId: string | null,
  allSections: SectionTemplate[],
  allDocuments: DocumentTemplate[],
  selectedProduct: ProductType | null
): SectionTemplate[] {
  if (!documentId) return allSections;
  
  const doc = allDocuments.find(d => d.id === documentId);
  if (!doc) return allSections;
  
  const docNameLower = doc.name.toLowerCase();
  const docCategoryLower = doc.category?.toLowerCase() || '';
  
  const productKeywords = selectedProduct 
    ? (KEYWORDS_BY_PRODUCT[selectedProduct] || KEYWORDS_BY_PRODUCT.submission) 
    : KEYWORDS_BY_PRODUCT.submission;
  
  const matchingKeywords: string[] = [];
  for (const [key, values] of Object.entries(productKeywords)) {
    if (docNameLower.includes(key) || docCategoryLower.includes(key)) {
      const valuesArray = Array.isArray(values) ? values : [];
      matchingKeywords.push(...valuesArray);
    }
  }
  
  const related = allSections.filter(section => {
    const sectionTitleLower = section.title.toLowerCase();
    const sectionCategoryLower = section.category?.toLowerCase() || '';
    
    if (docCategoryLower && sectionCategoryLower && docCategoryLower === sectionCategoryLower) {
      return true;
    }
    
    if (matchingKeywords.length > 0) {
      return matchingKeywords.some(keyword => 
        sectionTitleLower.includes(keyword) || sectionCategoryLower.includes(keyword)
      );
    }
    
    return false;
  });
  
  return related;
}

// ========================================
// Plan Building & Conversion Functions
// ========================================

type QuestionStateSnapshot = {
  status: QuestionStatus;
  note?: string;
  lastUpdatedAt?: string;
};

export type QuestionStateMap = Record<string, QuestionStateSnapshot>;

export function convertLegacyTablesToDatasets(tables?: Record<string, Table | undefined>, sectionId: string = ''): Dataset[] {
  if (!tables) return [];
  const timestamp = new Date().toISOString();
  return Object.entries(tables)
    .filter((entry): entry is [string, Table] => Boolean(entry[1]))
    .map(([key, table]) => {
      const columns = [
        { name: 'Item', type: 'string' as const },
        ...table.columns.map((column) => ({ name: column, type: 'number' as const }))
      ];
      const rows = table.rows.map((row) => {
        const record: Record<string, string | number> = { Item: row.label ?? '' };
        row.values.forEach((value, index) => {
          record[table.columns[index]] = value;
        });
        return record;
      });
      return {
        id: `${key}_${Date.now() + Math.random()}`,
        name: key,
        description: '',
        columns,
        rows,
        tags: [],
        sectionId: sectionId || 'legacy',
        relatedQuestions: [],
        createdAt: timestamp,
        updatedAt: timestamp,
        lastUpdated: timestamp
      };
    });
}

export function convertDatasetsToTables(datasets?: Dataset[]): Record<string, Table> | undefined {
  if (!datasets || datasets.length === 0) return undefined;
  const tables: Record<string, Table> = {};
  datasets.forEach((dataset) => {
    const nonLabelColumns = dataset.columns.filter((column) => column.name !== 'Item');
    const rows = dataset.rows.map((row, idx) => ({
      label: (row.Item as string) || `Row ${idx + 1}`,
      values: nonLabelColumns.map((column) => {
        const value = row[column.name];
        return typeof value === 'number' ? value : (typeof value === 'string' ? value : '');
      })
    }));
    tables[dataset.name] = {
      columns: nonLabelColumns.map((column) => column.name),
      rows
    };
  });
  return Object.keys(tables).length ? tables : undefined;
}

export function convertPlanToLegacySections(plan: BusinessPlan): LegacyPlanSection[] {
  return plan.sections.map((section) => ({
    key: section.id,
    title: section.title,
    content: section.questions[0]?.answer ?? '',
    tables: convertDatasetsToTables(section.datasets),
    figures: section.media
  }));
}

export function extractQuestionStates(plan: BusinessPlan): QuestionStateMap {
  return plan.sections.reduce<QuestionStateMap>((acc, section) => {
    section.questions.forEach((question) => {
      acc[question.id] = {
        status: question.status ?? 'blank',
        note: question.statusNote,
        lastUpdatedAt: question.lastUpdatedAt
      };
    });
    return acc;
  }, {});
}

function deriveRequiredAssets(requiredFields: string[]): Array<MediaAsset['type']> {
  const hints: Array<MediaAsset['type']> = [];
  const tableFields = [
    'budget_breakdown',
    'funding_request',
    'co_financing',
    'cost_justification',
    'timeline',
    'milestones',
    'partner_list',
    'roles',
    'team_members'
  ];
  const chartFields = ['market_trends', 'revenue_assumptions', 'cost_assumptions', 'financial_projection'];
  const kpiFields = ['kpi_summary', 'expected_impact', 'impact_kpis'];

  if (requiredFields.some((field) => tableFields.includes(field))) {
    hints.push('table');
  }
  if (requiredFields.some((field) => chartFields.includes(field))) {
    hints.push('chart');
  }
  if (requiredFields.some((field) => kpiFields.includes(field))) {
    hints.push('kpi');
  }
  return Array.from(new Set(hints));
}

export function buildQuestionsFromTemplate(
  template: SectionTemplate,
  savedAnswer: string,
  questionStates: QuestionStateMap
): Question[] {
  const requiredAssets = deriveRequiredAssets(template.validationRules?.requiredFields ?? []);
  const seeds =
    template.questions && template.questions.length > 0
      ? template.questions.map((question) => ({
          prompt: question.text,
          helperText: question.hint,
          placeholder: question.placeholder,
          required: question.required
        }))
      : (template.prompts?.length
          ? template.prompts.map((prompt) => ({
              prompt,
              helperText: template.description,
              placeholder: 'Provide details',
              required: true
            }))
          : [
              {
                prompt: template.title,
                helperText: template.description,
                placeholder: 'Provide details',
                required: true
              }
            ]);

  return seeds.map((seed, index) => {
    const questionId = `${template.id}_q${index + 1}`;
    const storedState = questionStates?.[questionId];
    const initialAnswer = index === 0 ? savedAnswer : '';
    const derivedStatus = determineQuestionStatus(initialAnswer ?? '');
    return {
      id: questionId,
      prompt: seed.prompt,
      helperText: seed.helperText,
      placeholder: seed.placeholder,
      required: seed.required,
      answer: initialAnswer,
      suggestions: [],
      warnings: [],
      requiredAssets,
      status: storedState?.status ?? derivedStatus,
      statusNote: storedState?.note,
      lastUpdatedAt: storedState?.lastUpdatedAt
    };
  });
}

export function buildSectionFromTemplate(
  template: SectionTemplate,
  savedSections: StoredPlanSection[],
  questionStates: QuestionStateMap
): Section {
  const saved = savedSections.find((section) => section.id === template.id);
  const datasets = convertLegacyTablesToDatasets(saved?.tables, template.id);
  const questions = buildQuestionsFromTemplate(template, saved?.content ?? '', questionStates);
  return {
    id: template.id,
    title: template.title,
    description: template.description || template.prompts?.[0] || '',
    questions,
    datasets,
    kpis: [],
    media: (saved?.figures as MediaAsset[]) || [],
    collapsed: false,
    category: template.category,
    progress: calculateSectionCompletion(questions)
  };
}

export function persistPlan(plan: BusinessPlan) {
  const legacySections = convertPlanToLegacySections(plan);
  savePlanSections(
    legacySections.map((section) => ({
      id: section.key,
      title: section.title,
      content: section.content,
      tables: section.tables,
      figures: section.figures
    }))
  );
  saveQuestionStates(extractQuestionStates(plan));
}

export function updateSection(plan: BusinessPlan, sectionId: string, updater: (section: Section) => Section): BusinessPlan {
  return {
    ...plan,
    sections: plan.sections.map((section) =>
      section.id === sectionId ? updater(section) : section
    )
  };
}

// ========================================
// Program Helper Functions
// ========================================

export function mapProgramTypeToFunding(programType?: string): {
  templateFundingType: TemplateFundingType;
  fundingProgramTag: FundingProgramType;
} {
  const normalized = (programType ?? 'grant').toLowerCase();
  if (normalized.includes('loan') || normalized.includes('bank')) {
    return { templateFundingType: 'bankLoans', fundingProgramTag: 'loan' };
  }
  if (normalized.includes('equity') || normalized.includes('investment')) {
    return { templateFundingType: 'equity', fundingProgramTag: 'equity' };
  }
  if (normalized.includes('visa') || normalized.includes('relocation') || normalized.includes('residence')) {
    return { templateFundingType: 'visa', fundingProgramTag: 'visa' };
  }
  return { templateFundingType: 'grants', fundingProgramTag: 'grant' };
}

export function normalizeProgramInput(rawInput: string): string | null {
  if (!rawInput) return null;
  const trimmed = rawInput.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('page_')) return trimmed;
  const match = trimmed.match(/(\d{2,})/);
  if (match) {
    return `page_${match[1]}`;
  }
  return null;
}

// ========================================
// Metadata Helper Functions
// ========================================

export function getMetadataFieldValue(titlePage: TitlePage, path: MetadataFieldPath): string {
  let current: any = titlePage;
  for (const segment of path) {
    if (current == null) {
      return '';
    }
    current = current[segment as keyof typeof current];
  }
  if (current == null) {
    return '';
  }
  return typeof current === 'string' ? current : String(current);
}

/**
 * Check if a section ID is a metadata/special section (not a regular content section)
 */
export function isMetadataSection(sectionId: string | null): boolean {
  if (!sectionId) return false;
  return sectionId === METADATA_SECTION_ID || 
         sectionId === ANCILLARY_SECTION_ID || 
         sectionId === REFERENCES_SECTION_ID || 
         sectionId === APPENDICES_SECTION_ID;
}

export function isMetadataComplete(titlePage: TitlePage): boolean {
  return REQUIRED_METADATA_FIELDS.every((field) =>
    (field.validator
      ? field.validator(getMetadataFieldValue(titlePage, field.path))
      : getMetadataFieldValue(titlePage, field.path).trim().length > 0)
  );
}

export const defaultTitlePage = (): TitlePage => ({
  companyName: 'Untitled Company',
  logoUrl: '',
  valueProp: '',
  teamHighlight: '',
  planTitle: 'Business Plan',
  date: new Date().toISOString().split('T')[0],
  contactInfo: {
    name: '',
    email: '',
    phone: '',
    website: '',
    address: ''
  },
  confidentialityStatement: '',
  legalForm: '',
  headquartersLocation: ''
});

export const defaultAncillary = (): AncillaryContent => ({
  tableOfContents: [],
  listOfIllustrations: [],
  listOfTables: [],
  citationStyle: 'apa',
  footnotes: [],
  lastGenerated: undefined
});

// ========================================
// Component Helper Functions
// ========================================

/**
 * Get selected product meta from product options
 * Used to avoid duplicating this lookup in multiple places
 */
export function getSelectedProductMeta(
  productOptions: Array<{ value: ProductType; label: string; description: string; icon?: string }>,
  selectedProduct: ProductType | null
): { value: ProductType; label: string; description: string; icon?: string } | null {
  return selectedProduct 
    ? productOptions.find((option) => option.value === selectedProduct) ?? null
    : null;
}

/**
 * Check if a document is an additional (custom) document
 */
export function isAdditionalDocument(
  plan: BusinessPlan | null,
  clickedDocumentId: string | null
): boolean {
  if (!plan || !clickedDocumentId) return false;
  return plan.metadata?.customDocuments?.some(doc => doc.id === clickedDocumentId) ?? false;
}

/**
 * Get selected document name for additional documents
 */
export function getSelectedDocumentName(
  plan: BusinessPlan | null,
  clickedDocumentId: string | null
): string | null {
  if (!clickedDocumentId || !plan) return null;
  
  if (isAdditionalDocument(plan, clickedDocumentId)) {
    const doc = plan.metadata?.customDocuments?.find(doc => doc.id === clickedDocumentId);
    return doc?.name || null;
  }
  return null;
}

/**
 * Get document sections for a specific document ID
 * Consolidates documentSections access pattern
 */
export function getDocumentSections(
  plan: BusinessPlan | null,
  documentId: string | null
): Section[] {
  if (!plan || !documentId) return [];
  return plan.metadata?.documentSections?.[documentId] || [];
}

/**
 * Get document title page for a specific document ID
 * Falls back to plan title page if document-specific one doesn't exist
 */
export function getDocumentTitlePage(
  plan: BusinessPlan | null,
  documentId: string | null,
  fallbackTitlePage: TitlePage
): TitlePage {
  if (!plan || !documentId) return fallbackTitlePage;
  return plan.metadata?.documentTitlePages?.[documentId] || fallbackTitlePage;
}

/**
 * Calculate requirements stats from progress summary
 * Pure function - no React hooks needed
 */
export function calculateRequirementsStats(progressSummary: Array<{ id: string; title: string; progress: number }> = []) {
  if (!progressSummary || progressSummary.length === 0) {
    return {
      overallPercentage: 0,
      complete: 0,
      needsWork: 0,
      missing: 0,
      total: 0
    };
  }

  const complete = progressSummary.filter(s => s.progress >= 100).length;
  const needsWork = progressSummary.filter(s => s.progress >= 50 && s.progress < 100).length;
  const missing = progressSummary.filter(s => s.progress < 50).length;
  const total = progressSummary.length;
  const overallPercentage = total > 0 
    ? Math.round(progressSummary.reduce((sum, s) => sum + s.progress, 0) / total)
    : 0;

  return {
    overallPercentage,
    complete,
    needsWork,
    missing,
    total
  };
}


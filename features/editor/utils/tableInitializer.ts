// ========= PLAN2FUND — TABLE INITIALIZER =========
// Initialize default table structures based on section category
// Also includes financial automation: KPI suggestions, variable detection, and formula suggestions

import { Table, PlanSection, Dataset, KPI } from '@/features/editor/types/plan';
import { SectionTemplate } from '@templates';

/**
 * Create default revenue table structure
 */
function createDefaultRevenueTable(): Table {
  return {
    columns: ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5'],
    rows: [
      { label: 'Product Sales', values: [0, 0, 0, 0, 0] },
      { label: 'Service Revenue', values: [0, 0, 0, 0, 0] },
      { label: 'Other Revenue', values: [0, 0, 0, 0, 0] },
      { label: 'Total Revenue', values: [0, 0, 0, 0, 0] }
    ]
  };
}

/**
 * Create default costs table structure
 */
function createDefaultCostsTable(): Table {
  return {
    columns: ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5'],
    rows: [
      { label: 'Personnel', values: [0, 0, 0, 0, 0] },
      { label: 'Marketing', values: [0, 0, 0, 0, 0] },
      { label: 'Operations', values: [0, 0, 0, 0, 0] },
      { label: 'R&D', values: [0, 0, 0, 0, 0] },
      { label: 'Other Costs', values: [0, 0, 0, 0, 0] },
      { label: 'Total Costs', values: [0, 0, 0, 0, 0] }
    ]
  };
}

/**
 * Create default cash flow table structure
 */
function createDefaultCashflowTable(): Table {
  return {
    columns: ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5'],
    rows: [
      { label: 'Operating Cash Flow', values: [0, 0, 0, 0, 0] },
      { label: 'Investing Cash Flow', values: [0, 0, 0, 0, 0] },
      { label: 'Financing Cash Flow', values: [0, 0, 0, 0, 0] },
      { label: 'Net Cash Flow', values: [0, 0, 0, 0, 0] }
    ]
  };
}

/**
 * Create default use of funds table structure
 */
function createDefaultUseOfFundsTable(): Table {
  return {
    columns: ['Category', 'Amount', 'Percentage'],
    rows: [
      { label: 'Product Development', values: [0, 0, 0] },
      { label: 'Marketing', values: [0, 0, 0] },
      { label: 'Operations', values: [0, 0, 0] },
      { label: 'Personnel', values: [0, 0, 0] },
      { label: 'Other', values: [0, 0, 0] },
      { label: 'Total', values: [0, 0, 0] }
    ]
  };
}

/**
 * Create default competitor analysis table
 */
function createDefaultCompetitorTable(): Table {
  return {
    columns: ['Feature 1', 'Feature 2', 'Feature 3', 'Price', 'Market Share %'],
    rows: [
      { label: 'Competitor A', values: ['Yes', 'No', 'Yes', 99, 25] },
      { label: 'Competitor B', values: ['Yes', 'Yes', 'No', 149, 15] },
      { label: 'Our Product', values: ['Yes', 'Yes', 'Yes', 129, 5] }
    ]
  };
}

/**
 * Create default risk matrix table
 */
function createDefaultRiskTable(): Table {
  return {
    columns: ['Risk', 'Probability', 'Impact', 'Mitigation', 'Owner'],
    rows: [
      { label: 'Market Risk', values: ['Market Risk', 'High', 'High', 'Diversify', 'CEO'] },
      { label: 'Technical Risk', values: ['Technical Risk', 'Medium', 'High', 'Backup plan', 'CTO'] },
      { label: 'Financial Risk', values: ['Financial Risk', 'Low', 'Medium', 'Reserve fund', 'CFO'] },
      { label: 'Operational Risk', values: ['Operational Risk', 'Medium', 'Medium', 'Process improvement', 'COO'] }
    ]
  };
}

/**
 * Create default team skills matrix table
 */
function createDefaultTeamTable(): Table {
  return {
    columns: ['Name', 'Role', 'Experience (years)', 'Key Skills', 'Education'],
    rows: [
      { label: 'Team Member 1', values: ['John Doe', 'CEO', 10, 'Business, Strategy', 'MBA'] },
      { label: 'Team Member 2', values: ['Jane Smith', 'CTO', 8, 'Tech, Development', 'MSc'] },
      { label: 'Team Member 3', values: ['Bob Johnson', 'CFO', 12, 'Finance, Accounting', 'CPA'] }
    ]
  };
}

/**
 * Create default timeline table
 */
function createDefaultTimelineTable(): Table {
  return {
    columns: ['Q1 2024', 'Q2 2024', 'Q3 2024', 'Q4 2024', 'Q1 2025'],
    rows: [
      { label: 'Product Development', values: [0, 0, 0, 0, 0] },
      { label: 'Market Launch', values: [0, 0, 0, 0, 0] },
      { label: 'Fundraising', values: [0, 0, 0, 0, 0] },
      { label: 'Team Building', values: [0, 0, 0, 0, 0] }
    ]
  };
}

/**
 * Initialize tables for a section based on formatRequirements first, then category
 * Priority: formatRequirements > category
 */
export function initializeTablesForSection(template: SectionTemplate): PlanSection['tables'] {
  const formatReqs = template.validationRules?.formatRequirements || [];
  const category = template.category?.toLowerCase() || '';
  const tables: PlanSection['tables'] = {};
  
  // Check formatRequirements first (highest priority)
  if (formatReqs.some(req => req.includes('financial_tables') || req.includes('tabular_budget') || req.includes('clean_financial_tables'))) {
    tables.revenue = createDefaultRevenueTable();
    tables.costs = createDefaultCostsTable();
    tables.cashflow = createDefaultCashflowTable();
    if (formatReqs.some(req => req.includes('use_of_funds') || req.includes('fund_allocation'))) {
      tables.useOfFunds = createDefaultUseOfFundsTable();
    }
  }
  
  if (formatReqs.some(req => req.includes('risk_matrix') || req.includes('structured_risk_section'))) {
    tables.risks = createDefaultRiskTable();
  }
  
  if (formatReqs.some(req => req.includes('competitive_matrix') || req.includes('competitive_positioning'))) {
    tables.competitors = createDefaultCompetitorTable();
  }
  
  if (formatReqs.some(req => req.includes('gantt_chart_or_table') || req.includes('project_schedule'))) {
    tables.timeline = createDefaultTimelineTable();
  }
  
  if (formatReqs.some(req => req.includes('team') || req.includes('team_members'))) {
    tables.team = createDefaultTeamTable();
  }
  
  if (formatReqs.some(req => req.includes('ratio_tables') || req.includes('financial_ratios'))) {
    // Could add ratios table here if needed
  }
  
  // Fallback to category-based initialization if no formatRequirements matched
  if (Object.keys(tables).length === 0) {
    switch (category) {
      case 'financial':
        return {
          revenue: createDefaultRevenueTable(),
          costs: createDefaultCostsTable(),
          cashflow: createDefaultCashflowTable(),
          useOfFunds: createDefaultUseOfFundsTable()
        };
      
      case 'market':
        return {
          competitors: createDefaultCompetitorTable()
        };
      
      case 'risk':
        return {
          risks: createDefaultRiskTable()
        };
      
      case 'team':
        return {
          team: createDefaultTeamTable()
        };
      
      case 'project':
        return {
          timeline: createDefaultTimelineTable()
        };
      
      default:
        return undefined;
    }
  }
  
  return tables;
}

/**
 * Check if section needs tables based on template
 */
export function sectionNeedsTables(template: SectionTemplate): boolean {
  const category = template.category?.toLowerCase() || '';
  const needsTables = ['financial', 'market', 'risk', 'team', 'project'].includes(category);
  
  // Also check formatRequirements
  const formatNeeds = template.validationRules?.formatRequirements?.some(req => 
    req.includes('table') || req.includes('matrix') || req.includes('chart')
  );
  
  return needsTables || !!formatNeeds;
}

/**
 * Check if section needs charts based on template
 */
export function sectionNeedsCharts(template: SectionTemplate): boolean {
  const category = template.category?.toLowerCase() || '';
  
  if (category === 'financial') return true;
  if (category === 'market') return true;
  
  // Check formatRequirements
  const formatNeeds = template.validationRules?.formatRequirements?.some(req => 
    req.includes('chart') || req.includes('graph') || req.includes('visualisation')
  );
  
  return !!formatNeeds;
}

/**
 * Simple table creation: Creates the default table for section category
 * Returns the table key and table object to add
 */
export function createTableForSection(
  section: PlanSection,
  template: SectionTemplate
): { tableKey: string; table: Table; chartType?: 'bar' | 'line' | 'pie' | 'donut' } | null {
  const category = template.category?.toLowerCase() || '';
  const existingTables = Object.keys(section.tables || {});
  
  // Financial section - default to revenue
  if (category === 'financial') {
    if (!existingTables.includes('revenue')) {
      return { tableKey: 'revenue', table: createDefaultRevenueTable(), chartType: 'bar' };
    }
    // If revenue exists, create costs
    if (!existingTables.includes('costs')) {
      return { tableKey: 'costs', table: createDefaultCostsTable(), chartType: 'bar' };
    }
    // If both exist, create cashflow
    if (!existingTables.includes('cashflow')) {
      return { tableKey: 'cashflow', table: createDefaultCashflowTable(), chartType: 'line' };
    }
    // Default to revenue
    return { tableKey: 'revenue', table: createDefaultRevenueTable(), chartType: 'bar' };
  }
  
  // Risk section
  if (category === 'risk') {
    return { tableKey: 'risks', table: createDefaultRiskTable(), chartType: 'bar' };
  }
  
  // Project section
  if (category === 'project') {
    return { tableKey: 'timeline', table: createDefaultTimelineTable(), chartType: 'line' };
  }
  
  // Market section
  if (category === 'market') {
    return { tableKey: 'competitors', table: createDefaultCompetitorTable(), chartType: 'bar' };
  }
  
  // Team section
  if (category === 'team') {
    return { tableKey: 'team', table: createDefaultTeamTable(), chartType: 'bar' };
  }
  
  return null;
}

// ============================================================================
// FINANCIAL AUTOMATION: KPI Suggestions, Variable Detection, Formulas
// ============================================================================

export type FinancialVariableType = 'revenue' | 'cost' | 'budget' | 'funding' | 'profit' | 'margin' | 'other';

export interface FinancialVariable {
  columnName: string;
  type: FinancialVariableType;
  confidence: number; // 0-1, how confident we are this is a financial variable
}

export interface KPISuggestion {
  name: string;
  description: string;
  suggestedValue?: number;
  unit?: string;
  datasetId?: string;
  sourceColumn?: string;
  formula?: string;
  tags?: string[];
}

export interface FormulaSuggestion {
  targetCell: string; // e.g., "Total:Jan"
  formula: string; // e.g., "=SUM(Product A:Jan, Product B:Jan)"
  description: string;
  confidence: number;
}

/**
 * Detects financial variables in dataset columns
 */
export function detectFinancialVariables(dataset: Dataset): FinancialVariable[] {
  const variables: FinancialVariable[] = [];
  const nameLower = dataset.name.toLowerCase();
  const descLower = (dataset.description || '').toLowerCase();

  dataset.columns.forEach((column) => {
    const colName = column.name.toLowerCase();
    let type: FinancialVariableType | null = null;
    let confidence = 0.5;

    // Revenue detection
    if (
      colName.includes('revenue') ||
      colName.includes('income') ||
      colName.includes('sales') ||
      colName.includes('earnings') ||
      (nameLower.includes('revenue') && column.type === 'number')
    ) {
      type = 'revenue';
      confidence = 0.9;
    }
    // Cost detection
    else if (
      colName.includes('cost') ||
      colName.includes('expense') ||
      colName.includes('expenditure') ||
      colName.includes('spending') ||
      (nameLower.includes('cost') && column.type === 'number')
    ) {
      type = 'cost';
      confidence = 0.9;
    }
    // Budget detection
    else if (
      colName.includes('budget') ||
      colName.includes('allocated') ||
      colName.includes('planned') ||
      (nameLower.includes('budget') && column.type === 'number')
    ) {
      type = 'budget';
      confidence = 0.85;
    }
    // Funding detection
    else if (
      colName.includes('funding') ||
      colName.includes('grant') ||
      colName.includes('loan') ||
      colName.includes('investment') ||
      (nameLower.includes('funding') && column.type === 'number')
    ) {
      type = 'funding';
      confidence = 0.85;
    }
    // Profit/margin detection
    else if (
      colName.includes('profit') ||
      colName.includes('margin') ||
      colName.includes('gross') ||
      colName.includes('net')
    ) {
      type = colName.includes('margin') ? 'margin' : 'profit';
      confidence = 0.8;
    }
    // Generic financial indicators
    else if (
      column.type === 'number' &&
      (colName.includes('amount') ||
        colName.includes('value') ||
        colName.includes('total') ||
        colName.includes('sum') ||
        descLower.includes('financial') ||
        descLower.includes('monetary'))
    ) {
      type = 'other';
      confidence = 0.6;
    }

    if (type && column.type === 'number') {
      variables.push({
        columnName: column.name,
        type,
        confidence
      });
    }
  });

  return variables;
}

/**
 * Suggests KPIs based on dataset structure and financial variables
 */
export function suggestKPIsFromDataset(
  dataset: Dataset,
  _allDatasets: Dataset[] = []
): KPISuggestion[] {
  const suggestions: KPISuggestion[] = [];
  const variables = detectFinancialVariables(dataset);
  const nameLower = dataset.name.toLowerCase();

  // Calculate totals from existing rows if available
  const calculateTotal = (columnName: string): number | undefined => {
    if (!dataset.rows || dataset.rows.length === 0) return undefined;
    const column = dataset.columns.find((c) => c.name === columnName);
    if (!column || column.type !== 'number') return undefined;

    let total = 0;
    dataset.rows.forEach((row) => {
      const value = row[columnName];
      if (typeof value === 'number') {
        total += value;
      }
    });
    return total;
  };

  // Revenue-based KPIs
  const revenueVar = variables.find((v) => v.type === 'revenue');
  if (revenueVar) {
    const totalRevenue = calculateTotal(revenueVar.columnName);
    suggestions.push({
      name: 'Total Revenue',
      description: `Sum of all ${revenueVar.columnName} entries`,
      suggestedValue: totalRevenue,
      unit: dataset.columns.find((c) => c.name === revenueVar.columnName)?.unit || 'EUR',
      datasetId: dataset.id,
      sourceColumn: revenueVar.columnName,
      formula: totalRevenue !== undefined ? undefined : `=SUM(${revenueVar.columnName})`,
      tags: ['revenue', 'financial', 'kpi']
    });

    if (nameLower.includes('monthly') || nameLower.includes('annual')) {
      suggestions.push({
        name: 'Average Revenue',
        description: `Average ${revenueVar.columnName} per period`,
        datasetId: dataset.id,
        sourceColumn: revenueVar.columnName,
        formula: `=AVG(${revenueVar.columnName})`,
        tags: ['revenue', 'average', 'financial']
      });
    }
  }

  // Cost-based KPIs
  const costVar = variables.find((v) => v.type === 'cost');
  if (costVar) {
    const totalCost = calculateTotal(costVar.columnName);
    suggestions.push({
      name: 'Total Cost',
      description: `Sum of all ${costVar.columnName} entries`,
      suggestedValue: totalCost,
      unit: dataset.columns.find((c) => c.name === costVar.columnName)?.unit || 'EUR',
      datasetId: dataset.id,
      sourceColumn: costVar.columnName,
      formula: totalCost !== undefined ? undefined : `=SUM(${costVar.columnName})`,
      tags: ['cost', 'financial', 'kpi']
    });
  }

  // Profit calculation (if both revenue and cost exist)
  if (revenueVar && costVar) {
    const totalRevenue = calculateTotal(revenueVar.columnName);
    const totalCost = calculateTotal(costVar.columnName);
    if (totalRevenue !== undefined && totalCost !== undefined) {
      suggestions.push({
        name: 'Net Profit',
        description: 'Revenue minus costs',
        suggestedValue: totalRevenue - totalCost,
        unit: revenueVar.columnName.includes('EUR') ? 'EUR' : 'USD',
        datasetId: dataset.id,
        formula: `=SUM(${revenueVar.columnName}) - SUM(${costVar.columnName})`,
        tags: ['profit', 'financial', 'kpi']
      });
    } else {
      suggestions.push({
        name: 'Net Profit',
        description: 'Revenue minus costs',
        datasetId: dataset.id,
        formula: `=SUM(${revenueVar.columnName}) - SUM(${costVar.columnName})`,
        tags: ['profit', 'financial', 'kpi']
      });
    }
  }

  // Budget-based KPIs
  const budgetVar = variables.find((v) => v.type === 'budget');
  if (budgetVar) {
    const totalBudget = calculateTotal(budgetVar.columnName);
    suggestions.push({
      name: 'Total Budget',
      description: `Sum of all ${budgetVar.columnName} entries`,
      suggestedValue: totalBudget,
      unit: dataset.columns.find((c) => c.name === budgetVar.columnName)?.unit || 'EUR',
      datasetId: dataset.id,
      sourceColumn: budgetVar.columnName,
      formula: totalBudget !== undefined ? undefined : `=SUM(${budgetVar.columnName})`,
      tags: ['budget', 'financial', 'kpi']
    });
  }

  // Funding-based KPIs
  const fundingVar = variables.find((v) => v.type === 'funding');
  if (fundingVar) {
    const totalFunding = calculateTotal(fundingVar.columnName);
    suggestions.push({
      name: 'Total Funding',
      description: `Sum of all ${fundingVar.columnName} entries`,
      suggestedValue: totalFunding,
      unit: dataset.columns.find((c) => c.name === fundingVar.columnName)?.unit || 'EUR',
      datasetId: dataset.id,
      sourceColumn: fundingVar.columnName,
      formula: totalFunding !== undefined ? undefined : `=SUM(${fundingVar.columnName})`,
      tags: ['funding', 'financial', 'kpi']
    });
  }

  // Time-series KPIs (if date column exists)
  const dateColumn = dataset.columns.find((c) => c.type === 'date');
  const numberColumns = dataset.columns.filter((c) => c.type === 'number');
  if (dateColumn && numberColumns.length > 0) {
    numberColumns.forEach((col) => {
      const varInfo = variables.find((v) => v.columnName === col.name);
      if (varInfo && varInfo.type !== 'other') {
        suggestions.push({
          name: `${col.name} Growth Rate`,
          description: `Period-over-period growth for ${col.name}`,
          datasetId: dataset.id,
          sourceColumn: col.name,
          formula: `=GROWTH(${col.name})`,
          tags: ['growth', 'trend', 'financial']
        });
      }
    });
  }

  return suggestions;
}

/**
 * Suggests formulas for dataset cells based on structure
 */
export function suggestFormulas(dataset: Dataset): FormulaSuggestion[] {
  const suggestions: FormulaSuggestion[] = [];
  const variables = detectFinancialVariables(dataset);

  if (dataset.rows.length === 0 || dataset.columns.length < 2) {
    return suggestions;
  }

  // Find number columns
  const numberColumns = dataset.columns.filter((c) => c.type === 'number');
  if (numberColumns.length < 2) return suggestions;

  // Suggest totals row
  const totalRowKey = 'Total';
  numberColumns.forEach((col) => {
    const varInfo = variables.find((v) => v.columnName === col.name);
    if (varInfo) {
      const formula = `=SUM(${col.name})`;
      suggestions.push({
        targetCell: `${totalRowKey}:${col.name}`,
        formula,
        description: `Sum of all ${col.name} values`,
        confidence: 0.9
      });
    }
  });

  // Suggest row totals if multiple number columns
  if (numberColumns.length >= 2) {
    dataset.rows.forEach((row, idx) => {
      const rowLabel = Object.keys(row).find((key) => {
        const col = dataset.columns.find((c) => c.name === key);
        return col && col.type === 'string';
      }) || `Row ${idx + 1}`;

      const sumColumns = numberColumns.map((c) => c.name).join(', ');
      suggestions.push({
        targetCell: `${rowLabel}:Total`,
        formula: `=SUM(${sumColumns})`,
        description: `Total for ${rowLabel}`,
        confidence: 0.8
      });
    });
  }

  return suggestions;
}

/**
 * Tags a dataset with financial variable information
 */
export function tagDatasetWithFinancialVariables(dataset: Dataset): Dataset {
  const variables = detectFinancialVariables(dataset);
  const existingTags = new Set(dataset.tags || []);
  
  // Add financial tag if any financial variables detected
  if (variables.length > 0) {
    existingTags.add('financial');
    variables.forEach((v) => {
      if (v.confidence > 0.7) {
        existingTags.add(v.type);
      }
    });
  }

  return {
    ...dataset,
    tags: Array.from(existingTags)
  };
}

/**
 * Creates a KPI from a suggestion
 */
export function createKPIFromSuggestion(
  suggestion: KPISuggestion,
  sectionId: string
): KPI {
  const timestamp = new Date().toISOString();
  return {
    id: `kpi_${Date.now()}`,
    name: suggestion.name,
    value: suggestion.suggestedValue ?? 0,
    unit: suggestion.unit,
    description: suggestion.description,
    datasetId: suggestion.datasetId,
    sectionId,
    tags: suggestion.tags,
    relatedQuestions: [],
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

// ============================================================================
// SECTION PROGRESS UTILITY (merged inline)
// ============================================================================

export interface SectionProgress {
  wordCount: number;
  wordCountMin: number;
  wordCountMax: number;
  wordCountProgress: number; // 0-100 percentage
  completionPercentage: number; // 0-100 overall completion
  requirementsMet: number;
  requirementsTotal: number;
  hasContent: boolean;
}

/**
 * Calculate progress metrics for a section (pure function)
 */
export function calculateSectionProgress(section: any): SectionProgress {
  const content = section?.content || '';
  const textContent = content.replace(/<[^>]*>/g, '').trim();
  const words = textContent.split(/\s+/).filter((word: string) => word.length > 0);
  const wordCount = words.length;

  const wordCountMin = section?.wordCountMin || 50;
  const wordCountMax = section?.wordCountMax || 5000;

  const targetWords = (wordCountMin + wordCountMax) / 2;
  const wordCountProgress = targetWords > 0
    ? Math.min(100, Math.round((wordCount / targetWords) * 100))
    : 0;

  let requirementsMet = 0;
  let requirementsTotal = 0;

  requirementsTotal++;
  if (wordCount >= wordCountMin && wordCount <= wordCountMax) {
    requirementsMet++;
  }

  if (section?.tables) {
    requirementsTotal++;
    const hasTables = Object.keys(section.tables).length > 0;
    if (hasTables) {
      requirementsMet++;
    }
  }

  if (section?.figures) {
    requirementsTotal++;
    const hasFigures = Array.isArray(section.figures) && section.figures.length > 0;
    if (hasFigures) {
      requirementsMet++;
    }
  }

  if (section?.fields) {
    const requiredFields = Object.keys(section.fields).filter(
      key => section.fields[key]?.required !== false
    );
    requirementsTotal += requiredFields.length;
    requirementsMet += requiredFields.filter(
      key => section.fields[key]?.value !== undefined &&
             section.fields[key]?.value !== null &&
             section.fields[key]?.value !== ''
    ).length;
  }

  if (requirementsTotal === 0) {
    requirementsTotal = 1;
    if (wordCount > 0) {
      requirementsMet = 1;
    }
  }

  const requirementsProgress = requirementsTotal > 0
    ? (requirementsMet / requirementsTotal) * 100
    : 0;

  // Focus on actual requirements, not word count
  // Word count is just a metric, not a requirement
  const completionPercentage = Math.round(requirementsProgress);

  return {
    wordCount,
    wordCountMin,
    wordCountMax,
    wordCountProgress,
    completionPercentage,
    requirementsMet,
    requirementsTotal,
    hasContent: wordCount > 0,
  };
}


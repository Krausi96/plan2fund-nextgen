// ========= PLAN2FUND — DATA HELPERS =========
// Financial dataset heuristics shared by DataPanel (KPI suggestions, tagging).

import { Dataset, KPI } from '@/features/editor/types/plan';

export type FinancialVariableType =
  | 'revenue'
  | 'cost'
  | 'budget'
  | 'funding'
  | 'profit'
  | 'margin'
  | 'other';

export interface FinancialVariable {
  columnName: string;
  type: FinancialVariableType;
  confidence: number; // 0-1 confidence score
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

/**
 * Detects financial variables in dataset columns.
 */
function detectFinancialVariables(dataset: Dataset): FinancialVariable[] {
  const variables: FinancialVariable[] = [];
  const nameLower = dataset.name.toLowerCase();
  const descLower = (dataset.description || '').toLowerCase();

  dataset.columns.forEach((column) => {
    const colName = column.name.toLowerCase();
    let type: FinancialVariableType | null = null;
    let confidence = 0.5;

    if (
      colName.includes('revenue') ||
      colName.includes('income') ||
      colName.includes('sales') ||
      colName.includes('earnings') ||
      (nameLower.includes('revenue') && column.type === 'number')
    ) {
      type = 'revenue';
      confidence = 0.9;
    } else if (
      colName.includes('cost') ||
      colName.includes('expense') ||
      colName.includes('expenditure') ||
      colName.includes('spending') ||
      (nameLower.includes('cost') && column.type === 'number')
    ) {
      type = 'cost';
      confidence = 0.9;
    } else if (
      colName.includes('budget') ||
      colName.includes('allocated') ||
      colName.includes('planned') ||
      (nameLower.includes('budget') && column.type === 'number')
    ) {
      type = 'budget';
      confidence = 0.85;
    } else if (
      colName.includes('funding') ||
      colName.includes('grant') ||
      colName.includes('loan') ||
      colName.includes('investment') ||
      (nameLower.includes('funding') && column.type === 'number')
    ) {
      type = 'funding';
      confidence = 0.85;
    } else if (
      colName.includes('profit') ||
      colName.includes('margin') ||
      colName.includes('gross') ||
      colName.includes('net')
    ) {
      type = colName.includes('margin') ? 'margin' : 'profit';
      confidence = 0.8;
    } else if (
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
 * Suggests KPIs based on dataset structure and financial variables.
 */
export function suggestKPIsFromDataset(dataset: Dataset): KPISuggestion[] {
  const suggestions: KPISuggestion[] = [];
  const variables = detectFinancialVariables(dataset);
  const nameLower = dataset.name.toLowerCase();

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
 * Tags a dataset with detected financial variables.
 */
export function tagDatasetWithFinancialVariables(dataset: Dataset): Dataset {
  const variables = detectFinancialVariables(dataset);
  const existingTags = new Set(dataset.tags || []);

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
 * Creates a KPI from a suggestion.
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


// ========= PLAN2FUND — SMART SECTION CONTENT RENDERER =========
// Renders appropriate UI (tables, charts, etc.) based on section category

import React from 'react';
import { PlanSection } from '@/shared/types/plan';
import { SectionTemplate } from '@/shared/templates/types';
import DataChart from './DataChart';
import { sectionNeedsCharts } from '@/features/editor/utils/tableInitializer';

type ChartType = 'bar' | 'line' | 'pie' | 'donut';

interface SectionContentRendererProps {
  section: PlanSection;
  template: SectionTemplate;
  onTableChange?: (tableKey: string, table: import('@/shared/types/plan').Table) => void;
  onChartTypeChange?: (tableKey: string, chartType: ChartType) => void;
}

/**
 * Get chart type for a table: user preference > formatRequirements > defaults
 */
function getChartTypeForTable(
  section: PlanSection,
  template: SectionTemplate,
  tableKey: string
): ChartType {
  // 1. Check user preference first (highest priority)
  if (section.chartTypes?.[tableKey]) {
    return section.chartTypes[tableKey];
  }
  
  // 2. Check formatRequirements
  const formatReqs = template.validationRules?.formatRequirements || [];
  if (formatReqs.some(req => req.includes('pie_chart') || req.includes('pie'))) {
    return 'pie';
  }
  if (formatReqs.some(req => req.includes('donut_chart') || req.includes('donut'))) {
    return 'donut';
  }
  if (formatReqs.some(req => req.includes('line_chart') || req.includes('line_graph'))) {
    return 'line';
  }
  if (formatReqs.some(req => req.includes('bar_chart') || req.includes('bar_graph'))) {
    return 'bar';
  }
  
  // 3. Fallback to sensible defaults
  if (tableKey === 'cashflow') return 'line';
  if (tableKey === 'useOfFunds') return 'pie';
  return 'bar';
}

/**
 * Simple inline chart type selector buttons
 */
function ChartTypeButtons({
  currentType,
  onChange
}: {
  currentType: ChartType;
  onChange: (type: ChartType) => void;
}) {
  const types: ChartType[] = ['bar', 'line', 'pie', 'donut'];
  const labels: Record<ChartType, string> = {
    bar: '📊 Bar',
    line: '📈 Line',
    pie: '🥧 Pie',
    donut: '🍩 Donut'
  };

  return (
    <div className="flex items-center gap-2 mb-2 text-xs">
      <span className="text-gray-500">Chart:</span>
      <div className="flex gap-1 bg-gray-100 rounded-md p-0.5">
        {types.map((type) => (
          <button
            key={type}
            onClick={() => onChange(type)}
            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
              currentType === type
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-200'
            }`}
            title={`Switch to ${labels[type]} chart`}
          >
            {labels[type]}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function SectionContentRenderer({
  section,
  template,
  onTableChange,
  onChartTypeChange
}: SectionContentRendererProps) {
  const category = template.category?.toLowerCase() || '';

  // Render financial section content
  if (category === 'financial') {
    return (
      <div className="space-y-6">
        {/* Revenue Table & Chart */}
        {section.tables?.revenue && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Revenue Projections</h3>
            <FinancialTable
              table={section.tables.revenue}
              onUpdate={(table) => onTableChange?.('revenue', table)}
            />
            {sectionNeedsCharts(template) && (
              <div>
                <ChartTypeButtons
                  currentType={getChartTypeForTable(section, template, 'revenue')}
                  onChange={(type) => onChartTypeChange?.('revenue', type)}
                />
                <DataChart
                  table={section.tables.revenue}
                  chartType={getChartTypeForTable(section, template, 'revenue')}
                  title="Revenue Projections Chart"
                />
              </div>
            )}
          </div>
        )}

        {/* Costs Table & Chart */}
        {section.tables?.costs && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Cost Breakdown</h3>
            <FinancialTable
              table={section.tables.costs}
              onUpdate={(table) => onTableChange?.('costs', table)}
            />
            {sectionNeedsCharts(template) && (
              <div>
                <ChartTypeButtons
                  currentType={getChartTypeForTable(section, template, 'costs')}
                  onChange={(type) => onChartTypeChange?.('costs', type)}
                />
                <DataChart
                  table={section.tables.costs}
                  chartType={getChartTypeForTable(section, template, 'costs')}
                  title="Cost Breakdown Chart"
                />
              </div>
            )}
          </div>
        )}

        {/* Cash Flow Table & Chart */}
        {section.tables?.cashflow && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Cash Flow Projections</h3>
            <FinancialTable
              table={section.tables.cashflow}
              onUpdate={(table) => onTableChange?.('cashflow', table)}
            />
            {sectionNeedsCharts(template) && (
              <div>
                <ChartTypeButtons
                  currentType={getChartTypeForTable(section, template, 'cashflow')}
                  onChange={(type) => onChartTypeChange?.('cashflow', type)}
                />
                <DataChart
                  table={section.tables.cashflow}
                  chartType={getChartTypeForTable(section, template, 'cashflow')}
                  title="Cash Flow Projections Chart"
                />
              </div>
            )}
          </div>
        )}

        {/* Use of Funds Table & Chart */}
        {section.tables?.useOfFunds && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Use of Funds</h3>
            <FinancialTable
              table={section.tables.useOfFunds}
              onUpdate={(table) => onTableChange?.('useOfFunds', table)}
            />
            {sectionNeedsCharts(template) && (
              <div>
                <ChartTypeButtons
                  currentType={getChartTypeForTable(section, template, 'useOfFunds')}
                  onChange={(type) => onChartTypeChange?.('useOfFunds', type)}
                />
                <DataChart
                  table={section.tables.useOfFunds}
                  chartType={getChartTypeForTable(section, template, 'useOfFunds')}
                  title="Use of Funds Chart"
                />
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Render market section content
  if (category === 'market') {
    return (
      <div className="space-y-6">
        {section.tables?.competitors && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Competitor Analysis</h3>
            <DataTable
              table={section.tables.competitors}
              onUpdate={(table) => onTableChange?.('competitors', table)}
            />
            {sectionNeedsCharts(template) && (
              <div>
                <ChartTypeButtons
                  currentType={getChartTypeForTable(section, template, 'competitors')}
                  onChange={(type) => onChartTypeChange?.('competitors', type)}
                />
                <DataChart
                  table={section.tables.competitors}
                  chartType={getChartTypeForTable(section, template, 'competitors')}
                  title="Competitor Comparison Chart"
                />
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Render risk section content
  if (category === 'risk') {
    return (
      <div className="space-y-6">
        {section.tables?.risks && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Risk Analysis Matrix</h3>
            <DataTable
              table={section.tables.risks}
              onUpdate={(table) => onTableChange?.('risks', table)}
            />
          </div>
        )}
      </div>
    );
  }

  // Render team section content
  if (category === 'team') {
    return (
      <div className="space-y-6">
        {section.tables?.team && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Team Skills Matrix</h3>
            <DataTable
              table={section.tables.team}
              onUpdate={(table) => onTableChange?.('team', table)}
            />
          </div>
        )}
      </div>
    );
  }

  // Render project/timeline section content
  if (category === 'project') {
    return (
      <div className="space-y-6">
        {section.tables?.timeline && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Project Timeline</h3>
            <DataTable
              table={section.tables.timeline}
              onUpdate={(table) => onTableChange?.('timeline', table)}
            />
            {/* Could add Gantt chart here later */}
          </div>
        )}
      </div>
    );
  }

  return null;
}

// Reusable table component for financial data
function FinancialTable({ table, onUpdate }: { table: import('@/shared/types/plan').Table; onUpdate?: (table: import('@/shared/types/plan').Table) => void }) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden mb-4">
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="text-left p-3 border-b border-gray-200">Item</th>
            {table.columns.map((col: string, idx: number) => (
              <th key={idx} className="text-right p-3 border-b border-gray-200">{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row: any, rIdx: number) => (
            <tr key={rIdx} className="border-b border-gray-100">
              <td className="p-3 font-medium">{row.label}</td>
              {row.values.map((val: number | string, vIdx: number) => (
                <td key={vIdx} className="text-right p-3">
                  <input
                    type="number"
                    value={typeof val === 'number' ? val : (typeof val === 'string' ? parseFloat(val) || 0 : 0)}
                    onChange={(e) => {
                      const updated = { ...table };
                      const newValue = Number(e.target.value) || 0;
                      updated.rows[rIdx].values[vIdx] = newValue;
                      onUpdate?.(updated);
                    }}
                    className="w-24 text-right border-0 bg-transparent focus:bg-blue-50 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-2 py-1"
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Reusable table component for non-financial data (text/number mix)
function DataTable({ table, onUpdate }: { table: import('@/shared/types/plan').Table; onUpdate?: (table: import('@/shared/types/plan').Table) => void }) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden mb-4">
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="text-left p-3 border-b border-gray-200">Item</th>
            {table.columns.map((col: string, idx: number) => (
              <th key={idx} className="text-left p-3 border-b border-gray-200">{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row: any, rIdx: number) => (
            <tr key={rIdx} className="border-b border-gray-100">
              <td className="p-3 font-medium">{row.label}</td>
              {row.values.map((val: any, vIdx: number) => (
                <td key={vIdx} className="p-3">
                  <input
                    type="text"
                    value={val}
                    onChange={(e) => {
                      const updated = { ...table };
                      const newValue: string | number = e.target.value;
                      updated.rows[rIdx].values[vIdx] = newValue;
                      onUpdate?.(updated);
                    }}
                    className="w-full border-0 bg-transparent focus:bg-blue-50 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-2 py-1"
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


// ========= PLAN2FUND — SMART SECTION CONTENT RENDERER =========
// Renders appropriate UI (tables, charts, etc.) based on section category

import React from 'react';
import { PlanSection } from '@/shared/types/plan';
import { SectionTemplate } from '@/shared/templates/types';
import FinancialChart from './FinancialChart';
import { sectionNeedsCharts } from '@/features/editor/utils/tableInitializer';

interface SectionContentRendererProps {
  section: PlanSection;
  template: SectionTemplate;
  onTableChange?: (tableKey: string, table: import('@/shared/types/plan').Table) => void;
}

export default function SectionContentRenderer({
  section,
  template,
  onTableChange
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
              <FinancialChart
                table={section.tables.revenue}
                chartType="bar"
                title="Revenue Projections Chart"
              />
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
              <FinancialChart
                table={section.tables.costs}
                chartType="bar"
                title="Cost Breakdown Chart"
              />
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
              <FinancialChart
                table={section.tables.cashflow}
                chartType="line"
                title="Cash Flow Projections Chart"
              />
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
              <FinancialChart
                table={section.tables.useOfFunds}
                chartType="bar"
                title="Use of Funds Chart"
              />
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
              <FinancialChart
                table={section.tables.competitors}
                chartType="bar"
                title="Competitor Comparison Chart"
              />
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


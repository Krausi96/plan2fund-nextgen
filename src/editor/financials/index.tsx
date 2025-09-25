// ========= PLAN2FUND — FINANCIAL TABLES =========
// Financial tables widget for revenue, costs, cashflow, and use of funds

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Table, FigureRef } from '@/types/plan';

interface FinancialTablesProps {
  tables: {
    revenue?: Table;
    costs?: Table;
    cashflow?: Table;
    useOfFunds?: Table;
  };
  onTablesChange: (tables: any) => void;
  onFiguresChange?: (figures: FigureRef[]) => void;
  graphSettings?: {
    revenueCosts?: boolean;
    cashflow?: boolean;
    useOfFunds?: boolean;
  };
}

export default function FinancialTables({ 
  tables, 
  onTablesChange, 
  onFiguresChange, 
  graphSettings 
}: FinancialTablesProps) {
  const [activeTable, setActiveTable] = useState<keyof typeof tables>('revenue');

  // Generate figures when tables or graph settings change
  useEffect(() => {
    if (!onFiguresChange || !graphSettings) return;

    const figures: FigureRef[] = [];

    // Generate revenue & costs chart
    if (graphSettings.revenueCosts && tables.revenue && tables.costs) {
      figures.push({
        type: 'line',
        dataRef: 'revenue',
        caption: 'Revenue and Costs Projection',
        altText: 'Line chart showing revenue and costs over time'
      });
    }

    // Generate cashflow chart
    if (graphSettings.cashflow && tables.cashflow) {
      figures.push({
        type: 'bar',
        dataRef: 'cashflow',
        caption: 'Cash Flow Projection',
        altText: 'Bar chart showing cash flow by period'
      });
    }

    // Generate use of funds chart
    if (graphSettings.useOfFunds && tables.useOfFunds) {
      figures.push({
        type: 'donut',
        dataRef: 'useOfFunds',
        caption: 'Use of Funds Breakdown',
        altText: 'Donut chart showing fund allocation'
      });
    }

    onFiguresChange(figures);
  }, [tables, graphSettings, onFiguresChange]);

  const addRow = (tableType: keyof typeof tables) => {
    const table = tables[tableType];
    if (!table) return;

    const newRow = {
      label: 'New Item',
      values: new Array(table.columns.length).fill(0)
    };

    onTablesChange({
      ...tables,
      [tableType]: {
        ...table,
        rows: [...table.rows, newRow]
      }
    });
  };

  const addPeriod = (tableType: keyof typeof tables) => {
    const table = tables[tableType];
    if (!table) return;

    onTablesChange({
      ...tables,
      [tableType]: {
        ...table,
        columns: [...table.columns, `Period ${table.columns.length + 1}`],
        rows: table.rows.map(row => ({
          ...row,
          values: [...row.values, 0]
        }))
      }
    });
  };

  const updateCell = (tableType: keyof typeof tables, rowIndex: number, colIndex: number, value: number) => {
    const table = tables[tableType];
    if (!table) return;

    const newRows = [...table.rows];
    newRows[rowIndex].values[colIndex] = value;

    onTablesChange({
      ...tables,
      [tableType]: {
        ...table,
        rows: newRows
      }
    });
  };

  const updateRowLabel = (tableType: keyof typeof tables, rowIndex: number, label: string) => {
    const table = tables[tableType];
    if (!table) return;

    const newRows = [...table.rows];
    newRows[rowIndex].label = label;

    onTablesChange({
      ...tables,
      [tableType]: {
        ...table,
        rows: newRows
      }
    });
  };

  const renderTable = (tableType: keyof typeof tables, title: string) => {
    const table = tables[tableType];
    if (!table) return null;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <div className="space-x-2">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => addRow(tableType)}
            >
              Add Row
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => addPeriod(tableType)}
            >
              Add Period
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="border border-gray-200 px-4 py-2 text-left">Item</th>
                {table.columns.map((col, index) => (
                  <th key={index} className="border border-gray-200 px-4 py-2 text-center">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  <td className="border border-gray-200 px-4 py-2">
                    <input
                      type="text"
                      value={row.label}
                      onChange={(e) => updateRowLabel(tableType, rowIndex, e.target.value)}
                      className="w-full border-none outline-none bg-transparent"
                    />
                  </td>
                  {row.values.map((value, colIndex) => (
                    <td key={colIndex} className="border border-gray-200 px-4 py-2">
                      <input
                        type="number"
                        value={value}
                        onChange={(e) => updateCell(tableType, rowIndex, colIndex, parseFloat(e.target.value) || 0)}
                        className="w-full border-none outline-none bg-transparent text-center"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Table Selector */}
      <div className="flex space-x-2 border-b">
        {Object.entries({
          revenue: 'Revenue',
          costs: 'Costs',
          cashflow: 'Cash Flow',
          useOfFunds: 'Use of Funds'
        }).map(([key, title]) => (
          <button
            key={key}
            onClick={() => setActiveTable(key as keyof typeof tables)}
            className={`px-4 py-2 text-sm font-medium border-b-2 ${
              activeTable === key
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {title}
          </button>
        ))}
      </div>

      {/* Active Table */}
      {renderTable(activeTable, {
        revenue: 'Revenue Model',
        costs: 'Cost Structure',
        cashflow: 'Cash Flow Projection',
        useOfFunds: 'Use of Funds'
      }[activeTable] || 'Financial Table')}
    </div>
  );
}

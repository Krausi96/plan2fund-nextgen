/**
 * FinancialTable - Financial data table component
 * Based on strategic analysis report recommendations
 * Uses ReactDataGrid or similar for spreadsheet-like editing
 */

import React, { useState, useCallback } from 'react';
import { Plus, Trash2, Download } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';

interface FinancialTableProps {
  data: any[][];
  headers: string[];
  onChange: (data: any[][]) => void;
  onInsert?: () => void;
  onDelete?: (rowIndex: number) => void;
  editable?: boolean;
}

// Simple table implementation (can be replaced with ReactDataGrid later)
export default function FinancialTable({
  data,
  headers,
  onChange,
  onInsert,
  onDelete,
  editable = true
}: FinancialTableProps) {
  const [tableData, setTableData] = useState<any[][]>(data || []);

  const handleCellChange = useCallback((rowIndex: number, colIndex: number, value: any) => {
    const newData = [...tableData];
    if (!newData[rowIndex]) {
      newData[rowIndex] = new Array(headers.length).fill('');
    }
    newData[rowIndex][colIndex] = value;
    setTableData(newData);
    onChange(newData);
  }, [tableData, headers, onChange]);

  const handleAddRow = useCallback(() => {
    const newRow = new Array(headers.length).fill('');
    const newData = [...tableData, newRow];
    setTableData(newData);
    onChange(newData);
    if (onInsert) onInsert();
  }, [tableData, headers, onChange, onInsert]);

  const handleDeleteRow = useCallback((rowIndex: number) => {
    const newData = tableData.filter((_, index) => index !== rowIndex);
    setTableData(newData);
    onChange(newData);
    if (onDelete) onDelete(rowIndex);
  }, [tableData, onChange, onDelete]);

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Financial Data</h3>
        <div className="flex items-center gap-2">
          {editable && (
            <>
              <Button
                onClick={handleAddRow}
                size="sm"
                variant="outline"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Row
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  // TODO: Export to CSV
                  console.log('Export table');
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-50">
              {headers.map((header, index) => (
                <th
                  key={index}
                  className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-700"
                >
                  {header}
                </th>
              ))}
              {editable && (
                <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-700 w-16">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {tableData.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-gray-50">
                {headers.map((_, colIndex) => (
                  <td
                    key={colIndex}
                    className="border border-gray-300 px-4 py-2"
                  >
                    {editable ? (
                      <input
                        type="text"
                        value={row[colIndex] || ''}
                        onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                        className="w-full border-0 focus:outline-none focus:ring-0 bg-transparent"
                        placeholder="Enter value..."
                      />
                    ) : (
                      <span className="text-sm text-gray-700">{row[colIndex] || ''}</span>
                    )}
                  </td>
                ))}
                {editable && (
                  <td className="border border-gray-300 px-4 py-2">
                    <Button
                      onClick={() => handleDeleteRow(rowIndex)}
                      size="sm"
                      variant="ghost"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                )}
              </tr>
            ))}
            {tableData.length === 0 && (
              <tr>
                <td
                  colSpan={headers.length + (editable ? 1 : 0)}
                  className="border border-gray-300 px-4 py-8 text-center text-gray-500"
                >
                  No data. Click "Add Row" to start.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

/**
 * Financial Table Templates
 */
export const FINANCIAL_TABLE_TEMPLATES = {
  revenue_projections: {
    headers: ['Year', 'Q1', 'Q2', 'Q3', 'Q4', 'Total'],
    initialData: [
      ['Year 1', '', '', '', '', ''],
      ['Year 2', '', '', '', '', ''],
      ['Year 3', '', '', '', '', '']
    ]
  },
  expense_breakdown: {
    headers: ['Category', 'Year 1', 'Year 2', 'Year 3', 'Total'],
    initialData: [
      ['Personnel', '', '', '', ''],
      ['Marketing', '', '', '', ''],
      ['Operations', '', '', '', ''],
      ['R&D', '', '', '', '']
    ]
  },
  cash_flow: {
    headers: ['Month', 'Revenue', 'Expenses', 'Net Cash Flow', 'Cumulative'],
    initialData: Array.from({ length: 12 }, (_, i) => [
      `Month ${i + 1}`, '', '', '', ''
    ])
  },
  unit_economics: {
    headers: ['Metric', 'Value', 'Unit', 'Notes'],
    initialData: [
      ['Customer Acquisition Cost (CAC)', '', 'EUR', ''],
      ['Lifetime Value (LTV)', '', 'EUR', ''],
      ['LTV/CAC Ratio', '', '', ''],
      ['Monthly Recurring Revenue (MRR)', '', 'EUR', '']
    ]
  }
};


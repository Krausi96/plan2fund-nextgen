// ========= PLAN2FUND — INLINE TABLE CREATOR =========
// Simple inline table creation - no modal, directly in editor

import React, { useState } from 'react';
import { Table } from '@/features/editor/types/plan';
import { SectionTemplate } from '@templates';

interface InlineTableCreatorProps {
  onCreate: (tableKey: string, table: Table) => void;
  onCancel: () => void;
  sectionTemplate: SectionTemplate;
  existingTableKeys: string[];
}

type TableType = {
  key: string;
  label: string;
  defaultColumns: string[];
  defaultRows: string[];
};

export default function InlineTableCreator({
  onCreate,
  onCancel,
  sectionTemplate,
  existingTableKeys
}: InlineTableCreatorProps) {
  const [selectedType, setSelectedType] = useState<string>('');
  const [tableName, setTableName] = useState('');
  const [columns, setColumns] = useState<string[]>([]);
  const [rows, setRows] = useState<string[]>([]);

  const category = sectionTemplate.category?.toLowerCase() || '';

  // Get available table types
  const getAvailableTableTypes = (): TableType[] => {
    if (category === 'financial') {
      return [
        { key: 'revenue', label: 'Revenue Projections', defaultColumns: ['Year 1', 'Year 2', 'Year 3'], defaultRows: ['Product Sales', 'Service Revenue', 'Total'] },
        { key: 'costs', label: 'Cost Breakdown', defaultColumns: ['Year 1', 'Year 2', 'Year 3'], defaultRows: ['Personnel', 'Marketing', 'Operations', 'Total'] },
        { key: 'cashflow', label: 'Cash Flow', defaultColumns: ['Year 1', 'Year 2', 'Year 3'], defaultRows: ['Operating', 'Investing', 'Net Cash Flow'] }
      ];
    }
    if (category === 'risk') {
      return [{ key: 'risks', label: 'Risk Matrix', defaultColumns: ['Risk', 'Probability', 'Impact', 'Mitigation'], defaultRows: ['Market Risk', 'Technical Risk', 'Financial Risk'] }];
    }
    if (category === 'project') {
      return [{ key: 'timeline', label: 'Timeline', defaultColumns: ['Q1', 'Q2', 'Q3', 'Q4'], defaultRows: ['Development', 'Launch', 'Fundraising'] }];
    }
    if (category === 'market') {
      return [{ key: 'competitors', label: 'Competitors', defaultColumns: ['Feature', 'Price', 'Market Share'], defaultRows: ['Competitor A', 'Competitor B', 'Our Product'] }];
    }
    return [{ key: 'data', label: 'Data Table', defaultColumns: ['Column 1', 'Column 2'], defaultRows: ['Row 1', 'Row 2'] }];
  };

  const availableTypes = getAvailableTableTypes().filter(t => !existingTableKeys.includes(t.key));

  const handleTypeSelect = (type: TableType) => {
    setSelectedType(type.key);
    setTableName(type.label);
    setColumns([...type.defaultColumns]);
    setRows([...type.defaultRows]);
  };

  const handleCreate = () => {
    if (!selectedType || columns.length === 0 || rows.length === 0) return;

    const table: Table = {
      columns: columns,
      rows: rows.map(row => ({
        label: row,
        values: new Array(columns.length).fill(0)
      }))
    };

    onCreate(selectedType, table);
  };

  const addColumn = () => setColumns([...columns, `Column ${columns.length + 1}`]);
  const removeColumn = (i: number) => setColumns(columns.filter((_, idx) => idx !== i));
  const updateColumn = (i: number, v: string) => {
    const updated = [...columns];
    updated[i] = v;
    setColumns(updated);
  };

  const addRow = () => setRows([...rows, `Row ${rows.length + 1}`]);
  const removeRow = (i: number) => setRows(rows.filter((_, idx) => idx !== i));
  const updateRow = (i: number, v: string) => {
    const updated = [...rows];
    updated[i] = v;
    setRows(updated);
  };

  return (
    <div className="border-2 border-blue-300 border-dashed rounded-lg p-4 bg-blue-50 mb-4">
      {!selectedType ? (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900">Choose Table Type</h3>
            <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {availableTypes.map((type) => (
              <button
                key={type.key}
                onClick={() => handleTypeSelect(type)}
                className="p-2 text-left border border-gray-200 rounded hover:border-blue-400 hover:bg-white transition-colors text-sm"
              >
                {type.label}
              </button>
            ))}
            <button
              onClick={() => {
                setSelectedType('custom');
                setTableName('Custom Table');
                setColumns(['Column 1', 'Column 2']);
                setRows(['Row 1', 'Row 2']);
              }}
              className="p-2 text-left border border-gray-200 rounded hover:border-blue-400 hover:bg-white transition-colors text-sm"
            >
              Custom Table
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Create Table: {tableName}</h3>
            <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 text-sm">Cancel</button>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-gray-700">Columns</label>
              <button onClick={addColumn} className="text-xs text-blue-600 hover:text-blue-700">+ Add</button>
            </div>
            <div className="space-y-1">
              {columns.map((col, i) => (
                <div key={i} className="flex gap-1">
                  <input
                    type="text"
                    value={col}
                    onChange={(e) => updateColumn(i, e.target.value)}
                    className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                  />
                  {columns.length > 1 && (
                    <button onClick={() => removeColumn(i)} className="px-2 text-red-600">✕</button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-gray-700">Rows</label>
              <button onClick={addRow} className="text-xs text-blue-600 hover:text-blue-700">+ Add</button>
            </div>
            <div className="space-y-1">
              {rows.map((row, i) => (
                <div key={i} className="flex gap-1">
                  <input
                    type="text"
                    value={row}
                    onChange={(e) => updateRow(i, e.target.value)}
                    className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                  />
                  {rows.length > 1 && (
                    <button onClick={() => removeRow(i)} className="px-2 text-red-600">✕</button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2 border-t">
            <button
              onClick={() => {
                setSelectedType('');
                setTableName('');
                setColumns([]);
                setRows([]);
              }}
              className="flex-1 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            >
              Back
            </button>
            <button
              onClick={handleCreate}
              className="flex-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Create Table
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


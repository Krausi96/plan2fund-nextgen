/**
 * TableBlock component for editor
 * Displays data in table format with sum/avg calculations
 */

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface TableBlockProps {
  data: any[];
  columns: string[];
  title?: string;
  showCalculations?: boolean;
  onEdit?: (data: any[]) => void;
}

interface Calculation {
  type: 'sum' | 'avg' | 'count';
  column: string;
  value: number;
}

export default function TableBlock({ 
  data, 
  columns, 
  title = "Data Table",
  showCalculations = true,
  onEdit 
}: TableBlockProps) {
  const [calculations, setCalculations] = useState<Calculation[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any[]>(data);

  useEffect(() => {
    if (showCalculations && data.length > 0) {
      calculateValues();
    }
  }, [data, showCalculations]);

  const calculateValues = () => {
    const newCalculations: Calculation[] = [];
    
    columns.forEach(column => {
      const numericValues = data
        .map(row => parseFloat(row[column]))
        .filter(val => !isNaN(val));
      
      if (numericValues.length > 0) {
        const sum = numericValues.reduce((a, b) => a + b, 0);
        const avg = sum / numericValues.length;
        
        newCalculations.push(
          { type: 'sum', column, value: sum },
          { type: 'avg', column, value: avg },
          { type: 'count', column, value: numericValues.length }
        );
      }
    });
    
    setCalculations(newCalculations);
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditData([...data]);
  };

  const handleSave = () => {
    setIsEditing(false);
    if (onEdit) {
      onEdit(editData);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData([...data]);
  };

  const handleCellChange = (rowIndex: number, column: string, value: any) => {
    const newData = [...editData];
    newData[rowIndex][column] = value;
    setEditData(newData);
  };

  const formatValue = (value: any) => {
    const numericValue = parseFloat(value);
    if (!isNaN(numericValue)) {
      return numericValue.toLocaleString();
    }
    return value;
  };

  const getCalculationDisplay = (column: string) => {
    const columnCalcs = calculations.filter(calc => calc.column === column);
    if (columnCalcs.length === 0) return null;

    return (
      <div className="text-xs text-gray-600 mt-1">
        {columnCalcs.map((calc, index) => (
          <span key={index} className="mr-3">
            {calc.type.toUpperCase()}: {calc.value.toLocaleString()}
          </span>
        ))}
      </div>
    );
  };

  if (data.length === 0) {
    return (
      <Card className="p-4">
        <div className="text-center text-gray-500">
          <p>No data available</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        {onEdit && (
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button size="sm" onClick={handleSave} className="bg-green-600 hover:bg-green-700">
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
              </>
            ) : (
              <Button size="sm" variant="outline" onClick={handleEdit}>
                Edit
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-50">
              {columns.map((column, index) => (
                <th key={index} className="border border-gray-300 px-4 py-2 text-left font-medium">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(isEditing ? editData : data).map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-gray-50">
                {columns.map((column, colIndex) => (
                  <td key={colIndex} className="border border-gray-300 px-4 py-2">
                    {isEditing ? (
                      <input
                        type="text"
                        value={row[column] || ''}
                        onChange={(e) => handleCellChange(rowIndex, column, e.target.value)}
                        className="w-full border-none outline-none bg-transparent"
                      />
                    ) : (
                      formatValue(row[column])
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showCalculations && calculations.length > 0 && (
        <div className="mt-4 p-3 bg-gray-50 rounded">
          <h4 className="text-sm font-medium mb-2">Calculations</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {columns.map(column => (
              <div key={column} className="text-sm">
                <div className="font-medium text-gray-700">{column}</div>
                {getCalculationDisplay(column)}
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

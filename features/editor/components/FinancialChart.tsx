// ========= PLAN2FUND — FINANCIAL CHART COMPONENT =========
// Generates charts from financial table data

import React from 'react';
import { Table } from '@/shared/types/plan';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface FinancialChartProps {
  table: Table;
  chartType: 'bar' | 'line';
  title?: string;
}

export default function FinancialChart({ 
  table, 
  chartType, 
  title
}: FinancialChartProps) {
  // Convert table data to chart format
  const chartData = React.useMemo(() => {
    if (!table || !table.columns || !table.rows || table.rows.length === 0) {
      return [];
    }

    // Use columns as data points (years, quarters, etc.)
    return table.columns.map((column, colIndex) => {
      const dataPoint: Record<string, string | number> = { name: column };
      
      // Add each row as a series (only numeric values for charts)
      table.rows.forEach((row) => {
        const value = row.values[colIndex];
        dataPoint[row.label] = typeof value === 'number' ? value : (typeof value === 'string' ? parseFloat(value) || 0 : 0);
      });
      
      return dataPoint;
    });
  }, [table]);

  if (chartData.length === 0) {
    return (
      <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 text-center text-sm text-gray-500">
        No data available for chart
      </div>
    );
  }

  // Get all row labels for legend
  const seriesKeys = table.rows.map(row => row.label);

  return (
    <div className="mb-6">
      {title && (
        <h3 className="text-sm font-semibold text-gray-700 mb-3">{title}</h3>
      )}
      <div className="border border-gray-200 rounded-lg p-4 bg-white">
        <ResponsiveContainer width="100%" height={300}>
          {chartType === 'bar' ? (
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              {seriesKeys.map((key, index) => (
                <Bar 
                  key={key} 
                  dataKey={key} 
                  fill={getColorForIndex(index)}
                />
              ))}
            </BarChart>
          ) : (
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              {seriesKeys.map((key, index) => (
                <Line 
                  key={key} 
                  type="monotone" 
                  dataKey={key} 
                  stroke={getColorForIndex(index)}
                  strokeWidth={2}
                />
              ))}
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// Color palette for chart series
function getColorForIndex(index: number): string {
  const colors = [
    '#3b82f6', // blue
    '#10b981', // green
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // purple
    '#06b6d4', // cyan
    '#f97316', // orange
    '#ec4899', // pink
  ];
  return colors[index % colors.length];
}


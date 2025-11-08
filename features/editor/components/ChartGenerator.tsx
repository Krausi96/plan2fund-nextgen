/**
 * ChartGenerator - Generate charts from financial table data
 * Based on strategic analysis report recommendations
 * Uses Recharts for chart rendering
 */

import React, { useState, useMemo } from 'react';
import { BarChart3, LineChart, PieChart, TrendingUp } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';

// Dynamic import for Recharts (optional dependency)
let RechartsComponents: any = null;
try {
  const recharts = require('recharts');
  RechartsComponents = {
    BarChart: recharts.BarChart,
    LineChart: recharts.LineChart,
    PieChart: recharts.PieChart,
    Bar: recharts.Bar,
    Line: recharts.Line,
    Pie: recharts.Pie,
    Cell: recharts.Cell,
    XAxis: recharts.XAxis,
    YAxis: recharts.YAxis,
    CartesianGrid: recharts.CartesianGrid,
    Tooltip: recharts.Tooltip,
    Legend: recharts.Legend,
    ResponsiveContainer: recharts.ResponsiveContainer
  };
} catch (e) {
  console.warn('Recharts not installed. Install with: npm install recharts');
}

interface ChartGeneratorProps {
  tableData: any[][];
  headers: string[];
  chartType?: 'bar' | 'line' | 'pie';
  onChartTypeChange?: (type: 'bar' | 'line' | 'pie') => void;
}

export default function ChartGenerator({
  tableData,
  headers,
  chartType: initialChartType = 'bar',
  onChartTypeChange
}: ChartGeneratorProps) {
  const [chartType, setChartType] = useState<'bar' | 'line' | 'pie'>(initialChartType);

  const handleChartTypeChange = (type: 'bar' | 'line' | 'pie') => {
    setChartType(type);
    if (onChartTypeChange) onChartTypeChange(type);
  };

  // Transform table data for chart
  const chartData = useMemo(() => {
    if (!tableData || tableData.length === 0) return [];
    
    // For bar/line charts: use first column as X-axis, rest as data series
    if (chartType === 'bar' || chartType === 'line') {
      return tableData.map(row => {
        const dataPoint: any = { name: row[0] || 'Unknown' };
        headers.slice(1).forEach((header, index) => {
          dataPoint[header] = parseFloat(row[index + 1]) || 0;
        });
        return dataPoint;
      });
    }
    
    // For pie charts: use first two columns (label, value)
    if (chartType === 'pie') {
      return tableData
        .filter(row => row[0] && row[1])
        .map(row => ({
          name: row[0],
          value: parseFloat(row[1]) || 0
        }));
    }
    
    return [];
  }, [tableData, headers, chartType]);

  const renderChart = () => {
    if (!RechartsComponents) {
      return (
        <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <div className="text-center">
            <BarChart3 className="h-12 w-12 mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-gray-500 mb-2">Recharts not installed</p>
            <p className="text-xs text-gray-400">Install with: npm install recharts</p>
          </div>
        </div>
      );
    }

    const {
      BarChart,
      LineChart: RechartsLineChart,
      PieChart: RechartsPieChart,
      Bar,
      Line,
      Pie,
      Cell,
      XAxis,
      YAxis,
      CartesianGrid,
      Tooltip,
      Legend,
      ResponsiveContainer
    } = RechartsComponents;

    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

    if (chartType === 'bar') {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            {headers.slice(1).map((header, index) => (
              <Bar
                key={header}
                dataKey={header}
                fill={colors[index % colors.length]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      );
    }

    if (chartType === 'line') {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <RechartsLineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            {headers.slice(1).map((header, index) => (
              <Line
                key={header}
                type="monotone"
                dataKey={header}
                stroke={colors[index % colors.length]}
                strokeWidth={2}
              />
            ))}
          </RechartsLineChart>
        </ResponsiveContainer>
      );
    }

    if (chartType === 'pie') {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <RechartsPieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }: { name: string; percent: number }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </RechartsPieChart>
        </ResponsiveContainer>
      );
    }

    return null;
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Chart</h3>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => handleChartTypeChange('bar')}
            size="sm"
            variant={chartType === 'bar' ? 'primary' : 'outline'}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Bar
          </Button>
          <Button
            onClick={() => handleChartTypeChange('line')}
            size="sm"
            variant={chartType === 'line' ? 'primary' : 'outline'}
          >
            <LineChart className="h-4 w-4 mr-2" />
            Line
          </Button>
          <Button
            onClick={() => handleChartTypeChange('pie')}
            size="sm"
            variant={chartType === 'pie' ? 'primary' : 'outline'}
          >
            <PieChart className="h-4 w-4 mr-2" />
            Pie
          </Button>
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <div className="text-center">
            <TrendingUp className="h-12 w-12 mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-gray-500">No data available</p>
            <p className="text-xs text-gray-400 mt-1">Add data to the table above</p>
          </div>
        </div>
      ) : (
        renderChart()
      )}
    </Card>
  );
}


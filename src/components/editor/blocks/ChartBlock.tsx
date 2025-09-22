/**
 * Chart Block Component
 * Creates visualizations from table data
 */

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
    borderWidth?: number;
  }[];
}

interface ChartBlockProps {
  data?: any[];
  columns?: string[];
  title?: string;
  chartType?: 'line' | 'bar' | 'pie' | 'doughnut' | 'area';
  onEdit?: (chartData: ChartData) => void;
}

const CHART_TYPES = [
  { value: 'line', label: 'Line Chart', icon: '📈' },
  { value: 'bar', label: 'Bar Chart', icon: '📊' },
  { value: 'pie', label: 'Pie Chart', icon: '🥧' },
  { value: 'doughnut', label: 'Doughnut Chart', icon: '🍩' },
  { value: 'area', label: 'Area Chart', icon: '📈' }
];

const CHART_COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
];

export default function ChartBlock({ 
  data = [], 
  columns = [], 
  title = "Chart", 
  chartType = 'bar',
  onEdit 
}: ChartBlockProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedChartType, setSelectedChartType] = useState(chartType);
  const [xAxis, setXAxis] = useState(columns[0] || '');
  const [yAxis, setYAxis] = useState(columns[1] || '');
  const [chartData, setChartData] = useState<ChartData | null>(null);

  useEffect(() => {
    if (data.length > 0 && xAxis && yAxis) {
      generateChartData();
    }
  }, [data, xAxis, yAxis, selectedChartType]);

  const generateChartData = () => {
    const labels = data.map(row => String(row[xAxis] || ''));
    const values = data.map(row => parseFloat(row[yAxis]) || 0);
    
    const newChartData: ChartData = {
      labels,
      datasets: [{
        label: yAxis,
        data: values,
        backgroundColor: CHART_COLORS[0] + '20',
        borderColor: CHART_COLORS[0],
        borderWidth: 2
      }]
    };
    
    setChartData(newChartData);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    setIsEditing(false);
    if (onEdit && chartData) {
      onEdit(chartData);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setSelectedChartType(chartType);
    setXAxis(columns[0] || '');
    setYAxis(columns[1] || '');
  };

  const renderChart = () => {
    if (!chartData || chartData.labels.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">📊</div>
          <p>No data available for chart</p>
        </div>
      );
    }

    // Simple SVG-based chart rendering
    const maxValue = Math.max(...chartData.datasets[0].data);
    const minValue = Math.min(...chartData.datasets[0].data);
    const range = maxValue - minValue || 1;
    const width = 400;
    const height = 300;
    const padding = 40;

    const points = chartData.labels.map((label, index) => {
      const value = chartData.datasets[0].data[index];
      const x = padding + (index * (width - 2 * padding)) / (chartData.labels.length - 1);
      const y = height - padding - ((value - minValue) / range) * (height - 2 * padding);
      return { x, y, value, label };
    });

    return (
      <div className="w-full">
        <svg width={width} height={height} className="border rounded">
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const y = height - padding - (ratio * (height - 2 * padding));
            return (
              <line
                key={i}
                x1={padding}
                y1={y}
                x2={width - padding}
                y2={y}
                stroke="#E5E7EB"
                strokeWidth={1}
              />
            );
          })}

          {/* Chart based on type */}
          {selectedChartType === 'line' && (
            <polyline
              points={points.map(p => `${p.x},${p.y}`).join(' ')}
              fill="none"
              stroke={chartData.datasets[0].borderColor}
              strokeWidth={3}
            />
          )}

          {selectedChartType === 'bar' && (
            <g>
              {points.map((point, index) => (
                <rect
                  key={index}
                  x={point.x - 15}
                  y={point.y}
                  width={30}
                  height={height - padding - point.y}
                  fill={chartData.datasets[0].backgroundColor}
                  stroke={chartData.datasets[0].borderColor}
                  strokeWidth={1}
                />
              ))}
            </g>
          )}

          {/* Data points */}
          {points.map((point, index) => (
            <g key={index}>
              <circle
                cx={point.x}
                cy={point.y}
                r={4}
                fill={chartData.datasets[0].borderColor}
              />
              <text
                x={point.x}
                y={point.y - 10}
                textAnchor="middle"
                className="text-xs fill-gray-600"
              >
                {point.value.toLocaleString()}
              </text>
            </g>
          ))}

          {/* X-axis labels */}
          {points.map((point, index) => (
            <text
              key={index}
              x={point.x}
              y={height - 10}
              textAnchor="middle"
              className="text-xs fill-gray-600"
            >
              {point.label.length > 10 ? point.label.substring(0, 10) + '...' : point.label}
            </text>
          ))}

          {/* Y-axis labels */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const value = minValue + (ratio * range);
            const y = height - padding - (ratio * (height - 2 * padding));
            return (
              <text
                key={i}
                x={padding - 10}
                y={y + 4}
                textAnchor="end"
                className="text-xs fill-gray-600"
              >
                {value.toLocaleString()}
              </text>
            );
          })}
        </svg>

        <div className="mt-4 text-center">
          <div className="text-sm text-gray-600">
            <span className="font-medium">{chartData.datasets[0].label}:</span>
            <span className="ml-2">
              Min: {minValue.toLocaleString()}, Max: {maxValue.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    );
  };

  if (isEditing) {
    return (
      <Card className="p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">{title}</h3>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave}>Save</Button>
              <Button size="sm" variant="outline" onClick={handleCancel}>Cancel</Button>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Chart Type</label>
              <select 
                value={selectedChartType} 
                onChange={(e) => setSelectedChartType(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {CHART_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.icon} {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">X-Axis (Labels)</label>
                <select 
                  value={xAxis} 
                  onChange={(e) => setXAxis(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {columns.map(col => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Y-Axis (Values)</label>
                <select 
                  value={yAxis} 
                  onChange={(e) => setYAxis(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {columns.map(col => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
              </div>
            </div>

            {chartData && (
              <div className="border rounded p-4">
                <h4 className="text-sm font-medium mb-2">Preview</h4>
                {renderChart()}
              </div>
            )}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">{title}</h3>
        <Button size="sm" variant="outline" onClick={handleEdit}>
          Edit
        </Button>
      </div>

      {renderChart()}
    </Card>
  );
}

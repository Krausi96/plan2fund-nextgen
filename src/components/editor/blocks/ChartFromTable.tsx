/**
 * ChartFromTable component for editor
 * Creates charts from table data
 */

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ChartFromTableProps {
  data: any[];
  columns: string[];
  title?: string;
  chartType?: 'bar' | 'line' | 'pie' | 'area';
  xAxis?: string;
  yAxis?: string;
  onEdit?: (config: ChartConfig) => void;
}

interface ChartConfig {
  type: 'bar' | 'line' | 'pie' | 'area';
  xAxis: string;
  yAxis: string;
  title: string;
}

export default function ChartFromTable({
  data,
  columns,
  title = "Chart",
  chartType = 'bar',
  xAxis,
  yAxis,
  onEdit
}: ChartFromTableProps) {
  const [config, setConfig] = useState<ChartConfig>({
    type: chartType,
    xAxis: xAxis || columns[0] || '',
    yAxis: yAxis || columns[1] || '',
    title
  });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (xAxis && yAxis) {
      setConfig(prev => ({ ...prev, xAxis, yAxis }));
    }
  }, [xAxis, yAxis]);

  const handleConfigChange = (field: keyof ChartConfig, value: any) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    setIsEditing(false);
    if (onEdit) {
      onEdit(config);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const renderChart = () => {
    if (!config.xAxis || !config.yAxis || data.length === 0) {
      return (
        <div className="flex items-center justify-center h-64 text-gray-500">
          <p>Select X and Y axes to display chart</p>
        </div>
      );
    }

    // Simple chart rendering (in a real app, you'd use a charting library like Chart.js or D3)
    const chartData = data.map(row => ({
      x: row[config.xAxis],
      y: parseFloat(row[config.yAxis]) || 0
    }));

    return (
      <div className="h-64 flex items-end justify-center space-x-2 p-4">
        {chartData.map((point, index) => (
          <div
            key={index}
            className="bg-blue-500 rounded-t"
            style={{
              height: `${(point.y / Math.max(...chartData.map(p => p.y))) * 200}px`,
              width: `${Math.max(20, 100 / chartData.length)}px`
            }}
            title={`${point.x}: ${point.y}`}
          />
        ))}
      </div>
    );
  };

  const renderPieChart = () => {
    if (!config.xAxis || !config.yAxis || data.length === 0) {
      return (
        <div className="flex items-center justify-center h-64 text-gray-500">
          <p>Select X and Y axes to display chart</p>
        </div>
      );
    }

    const chartData = data.map(row => ({
      label: row[config.xAxis],
      value: parseFloat(row[config.yAxis]) || 0
    }));

    const total = chartData.reduce((sum, item) => sum + item.value, 0);
    const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#06B6D4'];

    return (
      <div className="h-64 flex items-center justify-center">
        <div className="relative w-48 h-48">
          {chartData.map((item, index) => {
            const percentage = (item.value / total) * 100;
            const angle = (chartData.slice(0, index).reduce((sum, i) => sum + i.value, 0) / total) * 360;
            
            return (
              <div
                key={index}
                className="absolute inset-0 rounded-full"
                style={{
                  background: `conic-gradient(from ${angle}deg, ${colors[index % colors.length]} ${percentage}%, transparent ${percentage}%)`
                }}
              />
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <Card className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">{config.title}</h3>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setIsEditing(!isEditing)}
        >
          {isEditing ? 'Cancel' : 'Configure'}
        </Button>
      </div>

      {isEditing && (
        <div className="mb-4 p-4 bg-gray-50 rounded">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Chart Type</label>
              <select
                value={config.type}
                onChange={(e) => handleConfigChange('type', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="bar">Bar Chart</option>
                <option value="line">Line Chart</option>
                <option value="pie">Pie Chart</option>
                <option value="area">Area Chart</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">X Axis</label>
              <select
                value={config.xAxis}
                onChange={(e) => handleConfigChange('xAxis', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">Select X Axis</option>
                {columns.map(column => (
                  <option key={column} value={column}>{column}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Y Axis</label>
              <select
                value={config.yAxis}
                onChange={(e) => handleConfigChange('yAxis', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">Select Y Axis</option>
                {columns.map(column => (
                  <option key={column} value={column}>{column}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Title</label>
              <input
                type="text"
                value={config.title}
                onChange={(e) => handleConfigChange('title', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button size="sm" onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
              Apply
            </Button>
            <Button size="sm" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="border border-gray-200 rounded">
        {config.type === 'pie' ? renderPieChart() : renderChart()}
      </div>

      {data.length > 0 && (
        <div className="mt-4 text-sm text-gray-600">
          <p>Data points: {data.length}</p>
          <p>X Axis: {config.xAxis}</p>
          <p>Y Axis: {config.yAxis}</p>
        </div>
      )}
    </Card>
  );
}

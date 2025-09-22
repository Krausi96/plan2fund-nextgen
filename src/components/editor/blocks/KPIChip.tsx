/**
 * KPI Chip Component
 * Displays key performance indicators as interactive chips
 */

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface KPIData {
  id: string;
  label: string;
  value: string | number;
  unit: string;
  trend?: 'up' | 'down' | 'stable';
  change?: number;
  target?: string | number;
  status?: 'good' | 'warning' | 'critical';
  description?: string;
}

interface KPIChipProps {
  data?: KPIData[];
  title?: string;
  onEdit?: (data: KPIData[]) => void;
}

const KPI_TEMPLATES = [
  { label: 'Revenue', unit: '€', icon: '💰' },
  { label: 'Users', unit: '', icon: '👥' },
  { label: 'Growth Rate', unit: '%', icon: '📈' },
  { label: 'Conversion', unit: '%', icon: '🎯' },
  { label: 'Retention', unit: '%', icon: '🔄' },
  { label: 'CAC', unit: '€', icon: '💸' },
  { label: 'LTV', unit: '€', icon: '💎' },
  { label: 'MRR', unit: '€', icon: '📊' },
  { label: 'ARR', unit: '€', icon: '📈' },
  { label: 'Churn', unit: '%', icon: '📉' }
];

export default function KPIChip({ 
  data = [], 
  title = "Key Metrics", 
  onEdit 
}: KPIChipProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<KPIData[]>(data);
  const [newKPI, setNewKPI] = useState<Partial<KPIData>>({
    label: '',
    value: '',
    unit: '',
    description: ''
  });

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    setIsEditing(false);
    if (onEdit) {
      onEdit(editData);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData(data);
    setNewKPI({ label: '', value: '', unit: '', description: '' });
  };

  const handleAddKPI = () => {
    if (newKPI.label && newKPI.value) {
      const kpi: KPIData = {
        id: `kpi_${Date.now()}`,
        label: newKPI.label,
        value: newKPI.value,
        unit: newKPI.unit || '',
        description: newKPI.description,
        status: 'good'
      };
      setEditData([...editData, kpi]);
      setNewKPI({ label: '', value: '', unit: '', description: '' });
    }
  };

  const handleRemoveKPI = (id: string) => {
    setEditData(editData.filter(kpi => kpi.id !== id));
  };

  const handleKPIChange = (id: string, field: keyof KPIData, value: any) => {
    setEditData(editData.map(kpi => 
      kpi.id === id ? { ...kpi, [field]: value } : kpi
    ));
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'good': return 'bg-green-100 text-green-800 border-green-200';
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'up': return '↗️';
      case 'down': return '↘️';
      case 'stable': return '→';
      default: return '';
    }
  };

  const formatValue = (value: string | number, unit: string) => {
    if (typeof value === 'number') {
      return `${value.toLocaleString()}${unit}`;
    }
    return `${value}${unit}`;
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

          {/* Existing KPIs */}
          <div className="space-y-3">
            {editData.map((kpi) => (
              <div key={kpi.id} className="flex items-center gap-2 p-3 border rounded-lg">
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <Input
                    value={kpi.label}
                    onChange={(e) => handleKPIChange(kpi.id, 'label', e.target.value)}
                    placeholder="KPI Label"
                    className="text-sm"
                  />
                  <div className="flex gap-1">
                    <Input
                      value={kpi.value}
                      onChange={(e) => handleKPIChange(kpi.id, 'value', e.target.value)}
                      placeholder="Value"
                      className="text-sm"
                    />
                    <Input
                      value={kpi.unit}
                      onChange={(e) => handleKPIChange(kpi.id, 'unit', e.target.value)}
                      placeholder="Unit"
                      className="text-sm w-16"
                    />
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleRemoveKPI(kpi.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>

          {/* Add new KPI */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-2">Add New KPI</h4>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  value={newKPI.label || ''}
                  onChange={(e) => setNewKPI({...newKPI, label: e.target.value})}
                  placeholder="KPI Label"
                  className="text-sm"
                />
                <Input
                  value={newKPI.value || ''}
                  onChange={(e) => setNewKPI({...newKPI, value: e.target.value})}
                  placeholder="Value"
                  className="text-sm"
                />
                <Input
                  value={newKPI.unit || ''}
                  onChange={(e) => setNewKPI({...newKPI, unit: e.target.value})}
                  placeholder="Unit"
                  className="text-sm w-20"
                />
                <Button size="sm" onClick={handleAddKPI}>
                  Add
                </Button>
              </div>
              
              {/* Quick templates */}
              <div className="flex flex-wrap gap-1">
                {KPI_TEMPLATES.map((template, index) => (
                  <Button
                    key={index}
                    size="sm"
                    variant="outline"
                    onClick={() => setNewKPI({
                      label: template.label,
                      unit: template.unit,
                      value: '',
                      description: ''
                    })}
                    className="text-xs"
                  >
                    {template.icon} {template.label}
                  </Button>
                ))}
              </div>
            </div>
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

      {editData.length > 0 ? (
        <div className="flex flex-wrap gap-3">
          {editData.map((kpi) => (
            <div
              key={kpi.id}
              className={`px-4 py-3 rounded-lg border-2 ${getStatusColor(kpi.status)} min-w-[120px]`}
            >
              <div className="text-xs font-medium text-gray-600 mb-1">
                {kpi.label}
              </div>
              <div className="text-lg font-bold">
                {formatValue(kpi.value, kpi.unit)}
                {getTrendIcon(kpi.trend)}
              </div>
              {kpi.target && (
                <div className="text-xs text-gray-500 mt-1">
                  Target: {formatValue(kpi.target, kpi.unit)}
                </div>
              )}
              {kpi.change && (
                <div className="text-xs mt-1">
                  <Badge variant={kpi.change > 0 ? "default" : "destructive"}>
                    {kpi.change > 0 ? '+' : ''}{kpi.change}%
                  </Badge>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">📊</div>
          <p>No KPIs added yet. Click Edit to add key metrics.</p>
        </div>
      )}
    </Card>
  );
}

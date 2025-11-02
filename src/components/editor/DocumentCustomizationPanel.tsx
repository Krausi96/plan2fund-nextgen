// ========= PLAN2FUND — DOCUMENT CUSTOMIZATION PANEL =========
// Unified customization panel combining all document formatting and template features
// Replaces RequirementsChecker in UnifiedEditor right sidebar

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';

// Import template data
import { OFFICIAL_TEMPLATES } from '@/data/officialTemplates';
import { INDUSTRY_VARIATIONS } from '@/data/industryVariations';

// Types
interface CustomizationConfig {
  // Tone & Language
  tone: 'formal' | 'enthusiastic' | 'technical' | 'conversational';
  language: 'en' | 'de';
  
  // Document Structure
  tableOfContents: boolean;
  pageNumbers: boolean;
  
  // Formatting
  fontFamily: string;
  fontSize: number;
  lineSpacing: number;
  margins: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  
  // Title Page
  titlePage: {
    enabled: boolean;
    title: string;
    subtitle: string;
    author: string;
    date: string;
  };
  
  // Citations & References
  citations: {
    enabled: boolean;
    style: 'apa' | 'mla' | 'chicago' | 'ieee';
  };
  
  // Charts & Figures
  figures: {
    enabled: boolean;
    tableOfFigures: boolean;
    chartDescriptions: boolean;
  };
}

interface DocumentCustomizationPanelProps {
  currentConfig: CustomizationConfig;
  onConfigChange: (config: CustomizationConfig) => void;
  onTemplateSelect: (template: any) => void;
  onExport: (format: string) => void;
}

const DEFAULT_CONFIG: CustomizationConfig = {
  tone: 'formal',
  language: 'en',
  tableOfContents: true,
  pageNumbers: true,
  fontFamily: 'Arial',
  fontSize: 12,
  lineSpacing: 1.5,
  margins: { top: 2.5, bottom: 2.5, left: 2.5, right: 2.5 },
  titlePage: {
    enabled: true,
    title: 'Business Plan',
    subtitle: '',
    author: '',
    date: new Date().toLocaleDateString(),
  },
  citations: {
    enabled: true,
    style: 'apa',
  },
  figures: {
    enabled: true,
    tableOfFigures: true,
    chartDescriptions: true,
  },
};

export default function DocumentCustomizationPanel({
  currentConfig,
  onConfigChange,
  onTemplateSelect,
  onExport
}: DocumentCustomizationPanelProps) {
  const [config, setConfig] = useState<CustomizationConfig>(currentConfig || DEFAULT_CONFIG);
  const [activeTab, setActiveTab] = useState('tone');

  const handleConfigChange = (field: keyof CustomizationConfig, value: any) => {
    const newConfig = { ...config, [field]: value };
    setConfig(newConfig);
    onConfigChange(newConfig);
  };

  const handleNestedConfigChange = (parentField: keyof CustomizationConfig, childField: string, value: any) => {
    const newConfig = {
      ...config,
      [parentField]: {
        ...(config[parentField] as any),
        [childField]: value
      }
    };
    setConfig(newConfig);
    onConfigChange(newConfig);
  };

  const getToneDescription = (tone: string) => {
    const descriptions = {
      formal: 'Professional and business-appropriate language',
      enthusiastic: 'Energetic and optimistic tone to show passion',
      technical: 'Precise and detailed language for technical audiences',
      conversational: 'Friendly and approachable tone for general audiences'
    };
    return descriptions[tone as keyof typeof descriptions] || '';
  };

  return (
    <div className="document-customization-panel h-full bg-white border-l border-gray-200 p-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">📄 Document Customization</h3>
        <p className="text-sm text-gray-600">Customize your business plan appearance and content style</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-4 bg-gray-100 p-1 rounded">
        <button
          className={`px-3 py-1 text-sm rounded ${activeTab === 'tone' ? 'bg-white shadow' : 'text-gray-600'}`}
          onClick={() => setActiveTab('tone')}
        >
          Tone & Style
        </button>
        <button
          className={`px-3 py-1 text-sm rounded ${activeTab === 'template' ? 'bg-white shadow' : 'text-gray-600'}`}
          onClick={() => setActiveTab('template')}
        >
          Templates
        </button>
        <button
          className={`px-3 py-1 text-sm rounded ${activeTab === 'formatting' ? 'bg-white shadow' : 'text-gray-600'}`}
          onClick={() => setActiveTab('formatting')}
        >
          Formatting
        </button>
        <button
          className={`px-3 py-1 text-sm rounded ${activeTab === 'advanced' ? 'bg-white shadow' : 'text-gray-600'}`}
          onClick={() => setActiveTab('advanced')}
        >
          Advanced
        </button>
      </div>

      {/* Tone & Style Tab */}
      {activeTab === 'tone' && (
        <div className="space-y-4">
          <Card className="p-4">
            <h4 className="font-medium mb-3">Writing Tone</h4>
            <div className="space-y-3">
              <div>
                <Label htmlFor="tone-select">Tone</Label>
                <select
                  id="tone-select"
                  value={config.tone}
                  onChange={(e) => handleConfigChange('tone', e.target.value)}
                  className="w-full mt-1 p-2 border rounded"
                >
                  <option value="formal">Formal</option>
                  <option value="enthusiastic">Enthusiastic</option>
                  <option value="technical">Technical</option>
                  <option value="conversational">Conversational</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">{getToneDescription(config.tone)}</p>
              </div>

              <div>
                <Label htmlFor="language-select">Language</Label>
                <select
                  id="language-select"
                  value={config.language}
                  onChange={(e) => handleConfigChange('language', e.target.value)}
                  className="w-full mt-1 p-2 border rounded"
                >
                  <option value="en">English</option>
                  <option value="de">Deutsch</option>
                </select>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <h4 className="font-medium mb-3">Document Structure</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="toc">Table of Contents</Label>
                <Switch
                  checked={config.tableOfContents}
                  onCheckedChange={(checked) => handleConfigChange('tableOfContents', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="page-numbers">Page Numbers</Label>
                <Switch
                  checked={config.pageNumbers}
                  onCheckedChange={(checked) => handleConfigChange('pageNumbers', checked)}
                />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Templates Tab */}
      {activeTab === 'template' && (
        <div className="space-y-4">
          <Card className="p-4">
            <h4 className="font-medium mb-3">Official Templates</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {OFFICIAL_TEMPLATES.map((template) => (
                <div
                  key={template.id}
                  className="p-2 border rounded cursor-pointer hover:bg-gray-50"
                  onClick={() => onTemplateSelect(template)}
                >
                  <div className="font-medium text-sm">{template.name}</div>
                  <div className="text-xs text-gray-500">{template.agency}</div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-4">
            <h4 className="font-medium mb-3">Industry Templates</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {INDUSTRY_VARIATIONS.map((template) => (
                <div
                  key={template.id}
                  className="p-2 border rounded cursor-pointer hover:bg-gray-50"
                  onClick={() => onTemplateSelect(template)}
                >
                  <div className="font-medium text-sm">{template.name}</div>
                  <div className="text-xs text-gray-500">{template.industry}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Formatting Tab */}
      {activeTab === 'formatting' && (
        <div className="space-y-4">
          <Card className="p-4">
            <h4 className="font-medium mb-3">Font & Layout</h4>
            <div className="space-y-3">
              <div>
                <Label htmlFor="font-family">Font Family</Label>
                <select
                  id="font-family"
                  value={config.fontFamily}
                  onChange={(e) => handleConfigChange('fontFamily', e.target.value)}
                  className="w-full mt-1 p-2 border rounded"
                >
                  <option value="Arial">Arial</option>
                  <option value="Times New Roman">Times New Roman</option>
                  <option value="Calibri">Calibri</option>
                  <option value="Helvetica">Helvetica</option>
                </select>
              </div>

              <div>
                <Label htmlFor="font-size">Font Size</Label>
                <Input
                  id="font-size"
                  type="number"
                  value={config.fontSize}
                  onChange={(e) => handleConfigChange('fontSize', parseInt(e.target.value))}
                  min="8"
                  max="16"
                />
              </div>

              <div>
                <Label htmlFor="line-spacing">Line Spacing</Label>
                <Input
                  id="line-spacing"
                  type="number"
                  step="0.1"
                  value={config.lineSpacing}
                  onChange={(e) => handleConfigChange('lineSpacing', parseFloat(e.target.value))}
                  min="1"
                  max="2"
                />
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <h4 className="font-medium mb-3">Margins (inches)</h4>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="margin-top">Top</Label>
                <Input
                  id="margin-top"
                  type="number"
                  step="0.1"
                  value={config.margins.top}
                  onChange={(e) => handleNestedConfigChange('margins', 'top', parseFloat(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="margin-bottom">Bottom</Label>
                <Input
                  id="margin-bottom"
                  type="number"
                  step="0.1"
                  value={config.margins.bottom}
                  onChange={(e) => handleNestedConfigChange('margins', 'bottom', parseFloat(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="margin-left">Left</Label>
                <Input
                  id="margin-left"
                  type="number"
                  step="0.1"
                  value={config.margins.left}
                  onChange={(e) => handleNestedConfigChange('margins', 'left', parseFloat(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="margin-right">Right</Label>
                <Input
                  id="margin-right"
                  type="number"
                  step="0.1"
                  value={config.margins.right}
                  onChange={(e) => handleNestedConfigChange('margins', 'right', parseFloat(e.target.value))}
                />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Advanced Tab */}
      {activeTab === 'advanced' && (
        <div className="space-y-4">
          <Card className="p-4">
            <h4 className="font-medium mb-3">Title Page</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="title-page">Enable Title Page</Label>
                <Switch
                  checked={config.titlePage.enabled}
                  onCheckedChange={(checked) => handleNestedConfigChange('titlePage', 'enabled', checked)}
                />
              </div>
              {config.titlePage.enabled && (
                <>
                  <div>
                    <Label htmlFor="tp-title">Title</Label>
                    <Input
                      id="tp-title"
                      value={config.titlePage.title}
                      onChange={(e) => handleNestedConfigChange('titlePage', 'title', e.target.value)}
                      placeholder="Business Plan"
                    />
                  </div>
                  <div>
                    <Label htmlFor="tp-subtitle">Subtitle</Label>
                    <Input
                      id="tp-subtitle"
                      value={config.titlePage.subtitle}
                      onChange={(e) => handleNestedConfigChange('titlePage', 'subtitle', e.target.value)}
                      placeholder="Project / Product"
                    />
                  </div>
                  <div>
                    <Label htmlFor="tp-author">Author</Label>
                    <Input
                      id="tp-author"
                      value={config.titlePage.author}
                      onChange={(e) => handleNestedConfigChange('titlePage', 'author', e.target.value)}
                      placeholder="Company or Person"
                    />
                  </div>
                  <div>
                    <Label htmlFor="tp-date">Date</Label>
                    <Input
                      id="tp-date"
                      value={config.titlePage.date}
                      onChange={(e) => handleNestedConfigChange('titlePage', 'date', e.target.value)}
                      placeholder="YYYY-MM-DD"
                    />
                  </div>
                </>
              )}
            </div>
          </Card>

          <Card className="p-4">
            <h4 className="font-medium mb-3">Citations & References</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="citations">Enable Citations</Label>
                <Switch
                  checked={config.citations.enabled}
                  onCheckedChange={(checked) => handleNestedConfigChange('citations', 'enabled', checked)}
                />
              </div>
              {config.citations.enabled && (
                <div>
                  <Label htmlFor="citation-style">Citation Style</Label>
                  <select
                    id="citation-style"
                    value={config.citations.style}
                    onChange={(e) => handleNestedConfigChange('citations', 'style', e.target.value)}
                    className="w-full mt-1 p-2 border rounded"
                  >
                    <option value="apa">APA</option>
                    <option value="mla">MLA</option>
                    <option value="chicago">Chicago</option>
                    <option value="ieee">IEEE</option>
                  </select>
                </div>
              )}
            </div>
          </Card>

          <Card className="p-4">
            <h4 className="font-medium mb-3">Charts & Figures</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="figures">Enable Figures</Label>
                <Switch
                  checked={config.figures.enabled}
                  onCheckedChange={(checked) => handleNestedConfigChange('figures', 'enabled', checked)}
                />
              </div>
              {config.figures.enabled && (
                <>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="table-of-figures">Table of Figures</Label>
                    <Switch
                      checked={config.figures.tableOfFigures}
                      onCheckedChange={(checked) => handleNestedConfigChange('figures', 'tableOfFigures', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="chart-descriptions">Chart Descriptions</Label>
                    <Switch
                      checked={config.figures.chartDescriptions}
                      onCheckedChange={(checked) => handleNestedConfigChange('figures', 'chartDescriptions', checked)}
                    />
                  </div>
                </>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Export Section */}
      <div className="mt-6 pt-4 border-t">
        <h4 className="font-medium mb-3">Export</h4>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onExport('pdf')}
          >
            Export PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onExport('docx')}
          >
            Export DOCX
          </Button>
        </div>
      </div>
    </div>
  );
}
// ========= PLAN2FUND — TEMPLATES & FORMATTING MANAGER =========
// Phase 4: Official templates, export options, industry variations, and tone customization

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlanDocument } from '@/types/plan';

interface TemplatesFormattingManagerProps {
  currentPlan: PlanDocument;
  onTemplateChange?: (template: TemplateConfig) => void;
  onFormattingChange?: (formatting: FormattingConfig) => void;
  onExport?: (format: ExportFormat) => void;
  showOfficialTemplates?: boolean;
  showIndustryVariations?: boolean;
  showToneCustomization?: boolean;
  showExportOptions?: boolean;
}

interface TemplateConfig {
  id: string;
  name: string;
  agency: string;
  description: string;
  sections: string[];
  formatting: FormattingConfig;
  isOfficial: boolean;
  industry?: string;
}

interface FormattingConfig {
  fontFamily: string;
  fontSize: number;
  lineSpacing: number;
  margins: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  headerStyle: 'formal' | 'modern' | 'minimal';
  tone: 'formal' | 'enthusiastic' | 'technical' | 'conversational';
  language: 'en' | 'de';
  pageNumbers: boolean;
  tableOfContents: boolean;
}

type ExportFormat = 'pdf' | 'docx' | 'html' | 'markdown';

const OFFICIAL_TEMPLATES: TemplateConfig[] = [
  {
    id: 'bmbf-standard',
    name: 'BMBF Standard Template',
    agency: 'BMBF (Germany)',
    description: 'Official BMBF funding application template',
    sections: ['execSummary', 'projectDescription', 'methodology', 'timeline', 'budget', 'team'],
    formatting: {
      fontFamily: 'Arial',
      fontSize: 12,
      lineSpacing: 1.5,
      margins: { top: 2.5, bottom: 2.5, left: 2.5, right: 2.5 },
      headerStyle: 'formal',
      tone: 'formal',
      language: 'de',
      pageNumbers: true,
      tableOfContents: true
    },
    isOfficial: true
  },
  {
    id: 'horizon-europe',
    name: 'Horizon Europe Template',
    agency: 'European Commission',
    description: 'EU Horizon Europe project proposal template',
    sections: ['execSummary', 'excellence', 'impact', 'implementation', 'budget'],
    formatting: {
      fontFamily: 'Calibri',
      fontSize: 11,
      lineSpacing: 1.15,
      margins: { top: 2.0, bottom: 2.0, left: 2.0, right: 2.0 },
      headerStyle: 'modern',
      tone: 'technical',
      language: 'en',
      pageNumbers: true,
      tableOfContents: true
    },
    isOfficial: true
  },
  {
    id: 'sba-loan',
    name: 'SBA Loan Application',
    agency: 'Small Business Administration (US)',
    description: 'SBA loan application business plan template',
    sections: ['execSummary', 'businessDescription', 'marketAnalysis', 'financialProjections', 'management'],
    formatting: {
      fontFamily: 'Times New Roman',
      fontSize: 12,
      lineSpacing: 1.5,
      margins: { top: 1.0, bottom: 1.0, left: 1.0, right: 1.0 },
      headerStyle: 'formal',
      tone: 'formal',
      language: 'en',
      pageNumbers: true,
      tableOfContents: false
    },
    isOfficial: true
  }
];

const INDUSTRY_VARIATIONS: TemplateConfig[] = [
  {
    id: 'tech-startup',
    name: 'Tech Startup Template',
    agency: 'Custom',
    description: 'Optimized for technology startups and software companies',
    sections: ['problem', 'solution', 'market', 'product', 'businessModel', 'team', 'financials'],
    formatting: {
      fontFamily: 'Helvetica',
      fontSize: 11,
      lineSpacing: 1.3,
      margins: { top: 1.5, bottom: 1.5, left: 1.5, right: 1.5 },
      headerStyle: 'modern',
      tone: 'enthusiastic',
      language: 'en',
      pageNumbers: true,
      tableOfContents: true
    },
    isOfficial: false,
    industry: 'Technology'
  },
  {
    id: 'manufacturing',
    name: 'Manufacturing Template',
    agency: 'Custom',
    description: 'Designed for manufacturing and industrial companies',
    sections: ['execSummary', 'companyOverview', 'products', 'market', 'operations', 'financials', 'risks'],
    formatting: {
      fontFamily: 'Arial',
      fontSize: 12,
      lineSpacing: 1.5,
      margins: { top: 2.0, bottom: 2.0, left: 2.0, right: 2.0 },
      headerStyle: 'formal',
      tone: 'technical',
      language: 'en',
      pageNumbers: true,
      tableOfContents: true
    },
    isOfficial: false,
    industry: 'Manufacturing'
  },
  {
    id: 'healthcare',
    name: 'Healthcare Template',
    agency: 'Custom',
    description: 'Specialized for healthcare and medical device companies',
    sections: ['execSummary', 'clinicalNeed', 'solution', 'regulatory', 'market', 'clinicalPlan', 'financials'],
    formatting: {
      fontFamily: 'Calibri',
      fontSize: 11,
      lineSpacing: 1.4,
      margins: { top: 1.5, bottom: 1.5, left: 1.5, right: 1.5 },
      headerStyle: 'formal',
      tone: 'technical',
      language: 'en',
      pageNumbers: true,
      tableOfContents: true
    },
    isOfficial: false,
    industry: 'Healthcare'
  }
];

export default function TemplatesFormattingManager({
  onTemplateChange,
  onFormattingChange,
  onExport,
  showOfficialTemplates = true,
  showIndustryVariations = true,
  showToneCustomization = true,
  showExportOptions = true
}: TemplatesFormattingManagerProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateConfig | null>(null);
  const [formatting, setFormatting] = useState<FormattingConfig>({
    fontFamily: 'Arial',
    fontSize: 12,
    lineSpacing: 1.5,
    margins: { top: 2.5, bottom: 2.5, left: 2.5, right: 2.5 },
    headerStyle: 'formal',
    tone: 'formal',
    language: 'en',
    pageNumbers: true,
    tableOfContents: true
  });
  const [showFormattingPanel, setShowFormattingPanel] = useState(false);

  const handleTemplateSelect = (template: TemplateConfig) => {
    setSelectedTemplate(template);
    setFormatting(template.formatting);
    if (onTemplateChange) {
      onTemplateChange(template);
    }
  };

  const handleFormattingChange = (field: keyof FormattingConfig, value: any) => {
    const newFormatting = { ...formatting, [field]: value };
    setFormatting(newFormatting);
    if (onFormattingChange) {
      onFormattingChange(newFormatting);
    }
  };

  const handleExport = (format: ExportFormat) => {
    if (onExport) {
      onExport(format);
    }
  };

  const getToneDescription = (tone: string) => {
    const descriptions = {
      formal: 'Professional and business-appropriate language',
      enthusiastic: 'Energetic and optimistic tone to show passion',
      technical: 'Precise and detailed technical language',
      conversational: 'Friendly and approachable communication style'
    };
    return descriptions[tone as keyof typeof descriptions] || '';
  };

  const getHeaderStyleDescription = (style: string) => {
    const descriptions = {
      formal: 'Traditional business document headers',
      modern: 'Clean, contemporary header design',
      minimal: 'Simple, uncluttered header style'
    };
    return descriptions[style as keyof typeof descriptions] || '';
  };

  return (
    <div className="templates-formatting-manager p-6 bg-white rounded-lg border border-gray-200">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Templates & Formatting</h2>
      
      <div className="space-y-6">
        {/* Official Templates */}
        {showOfficialTemplates && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">🏛️ Official Templates</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {OFFICIAL_TEMPLATES.map((template) => (
                <div
                  key={template.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedTemplate?.id === template.id
                      ? 'border-blue-300 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleTemplateSelect(template)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-sm">{template.name}</h4>
                    <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                      Official
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">{template.agency}</p>
                  <p className="text-xs text-gray-500">{template.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Industry Variations */}
        {showIndustryVariations && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">🏭 Industry Variations</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {INDUSTRY_VARIATIONS.map((template) => (
                <div
                  key={template.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedTemplate?.id === template.id
                      ? 'border-blue-300 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleTemplateSelect(template)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-sm">{template.name}</h4>
                    <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                      {template.industry}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">{template.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Formatting Controls */}
        {showToneCustomization && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">🎨 Formatting & Tone</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFormattingPanel(!showFormattingPanel)}
              >
                {showFormattingPanel ? 'Hide' : 'Customize'}
              </Button>
            </div>

            {showFormattingPanel && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gray-50 rounded-lg">
                {/* Tone Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Writing Tone
                  </label>
                  <select
                    value={formatting.tone}
                    onChange={(e) => handleFormattingChange('tone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="formal">Formal</option>
                    <option value="enthusiastic">Enthusiastic</option>
                    <option value="technical">Technical</option>
                    <option value="conversational">Conversational</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {getToneDescription(formatting.tone)}
                  </p>
                </div>

                {/* Language Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Language
                  </label>
                  <select
                    value={formatting.language}
                    onChange={(e) => handleFormattingChange('language', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="en">English</option>
                    <option value="de">Deutsch</option>
                  </select>
                </div>

                {/* Font Family */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Font Family
                  </label>
                  <select
                    value={formatting.fontFamily}
                    onChange={(e) => handleFormattingChange('fontFamily', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="Arial">Arial</option>
                    <option value="Calibri">Calibri</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Helvetica">Helvetica</option>
                  </select>
                </div>

                {/* Font Size */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Font Size
                  </label>
                  <input
                    type="number"
                    value={formatting.fontSize}
                    onChange={(e) => handleFormattingChange('fontSize', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    min="8"
                    max="18"
                  />
                </div>

                {/* Header Style */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Header Style
                  </label>
                  <select
                    value={formatting.headerStyle}
                    onChange={(e) => handleFormattingChange('headerStyle', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="formal">Formal</option>
                    <option value="modern">Modern</option>
                    <option value="minimal">Minimal</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {getHeaderStyleDescription(formatting.headerStyle)}
                  </p>
                </div>

                {/* Options */}
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formatting.pageNumbers}
                      onChange={(e) => handleFormattingChange('pageNumbers', e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Page Numbers</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formatting.tableOfContents}
                      onChange={(e) => handleFormattingChange('tableOfContents', e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Table of Contents</span>
                  </label>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Export Options */}
        {showExportOptions && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">📤 Export Options</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Button
                variant="outline"
                onClick={() => handleExport('pdf')}
                className="flex items-center space-x-2"
              >
                <span>📄</span>
                <span>PDF</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => handleExport('docx')}
                className="flex items-center space-x-2"
              >
                <span>📝</span>
                <span>Word</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => handleExport('html')}
                className="flex items-center space-x-2"
              >
                <span>🌐</span>
                <span>HTML</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => handleExport('markdown')}
                className="flex items-center space-x-2"
              >
                <span>📝</span>
                <span>Markdown</span>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

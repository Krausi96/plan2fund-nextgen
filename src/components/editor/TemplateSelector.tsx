// ========= PLAN2FUND — TEMPLATE SELECTOR =========
// Phase 4: Official templates and industry variations selection

import React, { useState } from 'react';
// Button not used in this component
// PlanDocument not used in this component
import { OFFICIAL_TEMPLATES, TemplateConfig } from '@/data/officialTemplates';
import { INDUSTRY_VARIATIONS } from '@/data/industryVariations';

interface TemplateSelectorProps {
  onTemplateChange?: (template: TemplateConfig) => void;
  showOfficialTemplates?: boolean;
  showIndustryVariations?: boolean;
}

export default function TemplateSelector({
  onTemplateChange,
  showOfficialTemplates = true,
  showIndustryVariations = true
}: TemplateSelectorProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateConfig | null>(null);

  const handleTemplateSelect = (template: TemplateConfig) => {
    setSelectedTemplate(template);
    if (onTemplateChange) {
      onTemplateChange(template);
    }
  };

  const getAgencyColor = (agency: string) => {
    const colors: { [key: string]: string } = {
      'BMBF (Germany)': 'bg-blue-50 text-blue-700 border-blue-200',
      'European Commission': 'bg-purple-50 text-purple-700 border-purple-200',
      'Small Business Administration (US)': 'bg-green-50 text-green-700 border-green-200',
      'National Science Foundation (US)': 'bg-orange-50 text-orange-700 border-orange-200',
      'Innovate UK (UK)': 'bg-red-50 text-red-700 border-red-200',
      'European Research Council': 'bg-indigo-50 text-indigo-700 border-indigo-200',
      'Small Business Innovation Research (US)': 'bg-teal-50 text-teal-700 border-teal-200',
      'Custom': 'bg-gray-50 text-gray-700 border-gray-200'
    };
    return colors[agency] || 'bg-gray-50 text-gray-700 border-gray-200';
  };

  return (
    <div className="template-selector space-y-6">
      {/* Official Templates */}
      {showOfficialTemplates && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">🏛️ Official Templates</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {OFFICIAL_TEMPLATES.map((template) => (
              <div
                key={template.id}
                className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                  selectedTemplate?.id === template.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleTemplateSelect(template)}
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{template.name}</h4>
                  <span className={`px-2 py-1 text-xs rounded-full border ${getAgencyColor(template.agency)}`}>
                    {template.agency}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                <div className="flex flex-wrap gap-1">
                  {template.sections.slice(0, 3).map((section) => (
                    <span
                      key={section}
                      className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
                    >
                      {section.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                  ))}
                  {template.sections.length > 3 && (
                    <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                      +{template.sections.length - 3} more
                    </span>
                  )}
                </div>
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
                className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                  selectedTemplate?.id === template.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleTemplateSelect(template)}
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{template.name}</h4>
                  <span className="px-2 py-1 text-xs rounded-full border bg-gray-50 text-gray-700 border-gray-200">
                    {template.industry}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                <div className="flex flex-wrap gap-1">
                  {template.sections.slice(0, 3).map((section) => (
                    <span
                      key={section}
                      className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
                    >
                      {section.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                  ))}
                  {template.sections.length > 3 && (
                    <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                      +{template.sections.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

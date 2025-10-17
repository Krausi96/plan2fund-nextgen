// ========= PLAN2FUND — TEMPLATES & FORMATTING MANAGER =========
// Phase 4: Official templates, export options, industry variations, and tone customization
// Now uses split components for better maintainability

import { PlanDocument } from '@/types/plan';
import { TemplateConfig } from '@/data/officialTemplates';
import FormattingExportManager from './FormattingExportManager';

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

export default function TemplatesFormattingManager({
  currentPlan,
  onFormattingChange,
  onExport,
  showToneCustomization = true,
  showExportOptions = true
}: TemplatesFormattingManagerProps) {
  return (
    <div className="templates-formatting-manager p-6 bg-white rounded-lg border border-gray-200">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Templates & Formatting</h2>
      
      <div className="space-y-6">
        {/* Template Selection */}
        <div className="template-selector">
          <h3 className="text-lg font-semibold mb-3">Template Selection</h3>
          <p className="text-gray-600 text-sm">
            Template selection will be integrated with the unified editor
          </p>
        </div>

        {/* Formatting & Export */}
        <FormattingExportManager
          currentPlan={currentPlan}
          onFormattingChange={onFormattingChange}
          onExport={onExport}
          showToneCustomization={showToneCustomization}
          showExportOptions={showExportOptions}
        />
      </div>
    </div>
  );
}
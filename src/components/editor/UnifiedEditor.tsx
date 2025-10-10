// ========= PLAN2FUND — UNIFIED EDITOR =========
// Main orchestrator component for the unified editor architecture
// Replaces the fragmented editor system with a single, modular component

import React, { useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useEditorState } from './EditorState';
import { useI18n } from '../../contexts/I18nContext';
import EnhancedAIChat from './EnhancedAIChat';
import RequirementsChecker from './RequirementsChecker';

// Import existing components that we'll integrate

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface UnifiedEditorProps {
  programId?: string;
  onSave?: (content: Record<string, string>) => void;
  onExport?: () => void;
}

export default function UnifiedEditor({
  programId: propProgramId,
  onSave: propOnSave,
  onExport: propOnExport
}: UnifiedEditorProps) {
  const router = useRouter();
  const { t } = useI18n();
  const { state, actions } = useEditorState();

  // Get programId from props or URL
  const programId = propProgramId || (router.query.programId as string);

  // Load program data on mount
  useEffect(() => {
    if (programId) {
      actions.loadProgramData(programId);
    }
  }, [programId, actions]);

  // Handle save
  const handleSave = async () => {
    await actions.saveContent();
    if (propOnSave) {
      propOnSave(state.content);
    }
  };

  // Handle export
  const handleExport = async (format: string = 'pdf') => {
    await actions.exportDocument(format);
    if (propOnExport) {
      propOnExport();
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (state.isLoading) {
    return (
      <>
        <Head>
          <title>{t('editor.title')}</title>
          <meta name="description" content={t('editor.description')} />
          <meta name="keywords" content={t('editor.keywords')} />
          <link rel="canonical" href="https://plan2fund.com/editor" />
        </Head>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <div>{t('editor.loading.text')}</div>
          </div>
        </div>
      </>
    );
  }

  if (state.error) {
    return (
      <>
        <Head>
          <title>{t('editor.title')}</title>
          <meta name="description" content={t('editor.description')} />
          <meta name="keywords" content={t('editor.keywords')} />
          <link rel="canonical" href="https://plan2fund.com/editor" />
        </Head>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="text-red-600 text-xl mb-4">Error</div>
            <div className="text-gray-600 mb-4">{state.error}</div>
            <button
              onClick={() => programId && actions.loadProgramData(programId)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </>
    );
  }

  if (!state.product) {
    return (
      <>
        <Head>
          <title>{t('editor.title')}</title>
          <meta name="description" content={t('editor.description')} />
          <meta name="keywords" content={t('editor.keywords')} />
          <link rel="canonical" href="https://plan2fund.com/editor" />
        </Head>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="text-gray-600 mb-4">No program selected</div>
            <button
              onClick={() => router.push('/reco')}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Go to Recommendations
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>{t('editor.title')}</title>
        <meta name="description" content={t('editor.description')} />
        <meta name="keywords" content={t('editor.keywords')} />
        <link rel="canonical" href="https://plan2fund.com/editor" />
      </Head>
      
      <div className="unified-editor h-screen flex flex-col bg-gray-50">
        {/* Top Bar */}
        <EditorHeader 
          product={state.product}
          template={state.template}
          progress={state.progress}
          onSave={handleSave}
          onExport={handleExport}
        />
        
        <div className="flex flex-1 overflow-hidden">
          {/* Left Sidebar - Product & Template Selection */}
          <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
            <ProductSelector 
              selected={state.product}
              onSelect={actions.setProduct}
            />
            <TemplateSelector 
              selected={state.template}
              onSelect={actions.setTemplate}
              product={state.product}
            />
            <SectionManager 
              sections={state.sections}
              activeSection={state.activeSection}
              onSelect={actions.setActiveSection}
            />
            <ProgressTracker 
              progress={state.progress}
            />
          </div>
          
          {/* Main Content - Section Editor */}
          <div className="flex-1 flex flex-col">
            <UnifiedSectionEditor 
              sections={state.sections}
              content={state.content}
              activeSection={state.activeSection}
              onUpdate={actions.updateSection}
            />
          </div>
          
          {/* Right Sidebar - AI Assistant & Tools */}
          <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
            <AIAssistant 
              state={state.aiAssistant}
              onSendMessage={actions.sendAIMessage}
              onToggle={() => actions.setAIAssistant({ isOpen: !state.aiAssistant.isOpen })}
            />
            <ReadinessChecker 
              readiness={state.readiness}
              onCheck={actions.checkReadiness}
            />
            <ExportManager 
              content={state.content}
              onExport={handleExport}
            />
          </div>
        </div>
      </div>
    </>
  );
}

// ============================================================================
// HEADER COMPONENT
// ============================================================================

interface EditorHeaderProps {
  product: any;
  template: any;
  progress: any;
  onSave: () => void;
  onExport: (format: string) => void;
}

function EditorHeader({ product, template, progress, onSave, onExport }: EditorHeaderProps) {
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              {product?.name || 'Business Plan Editor'}
            </h1>
            {template && (
              <p className="text-sm text-gray-600">
                Template: {template.name}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Progress Indicator */}
          <div className="flex items-center space-x-2">
            <div className="text-sm text-gray-600">Progress</div>
            <div className="w-32 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress.overall}%` }}
              />
            </div>
            <div className="text-sm text-gray-600">{Math.round(progress.overall)}%</div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={onSave}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Save
            </button>
            <button
              onClick={() => onExport('pdf')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Export PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// PLACEHOLDER COMPONENTS (Phase 1 - Basic Implementation)
// ============================================================================

interface ProductSelectorProps {
  selected: any;
  onSelect: (product: any) => void;
}

function ProductSelector({ selected, onSelect }: ProductSelectorProps) {
  // Our actual products from pricing page
  const products = [
    {
      id: 'strategy',
      name: 'Strategy',
      description: 'Core strategy documents for early-stage planning',
      price: '€99',
      icon: '🎯',
      color: 'blue',
      documents: ['Business Model Canvas', 'Go-to-Market Strategy', 'Funding Fit Summary']
    },
    {
      id: 'review',
      name: 'Review',
      description: 'Professional review and revision of existing plans',
      price: '€149',
      icon: '📝',
      color: 'green',
      documents: ['Reviewed Business Plan', 'Compliance Notes']
    },
    {
      id: 'submission',
      name: 'Submission',
      description: 'Complete submission-ready business plans',
      price: '€199',
      icon: '📄',
      color: 'purple',
      documents: ['Full Business Plan', 'Grant Proposals', 'Loan Applications', 'Pitch Decks']
    }
  ];

  return (
    <div className="p-4 border-b border-gray-200">
      <h3 className="text-lg font-semibold mb-3">Select Product</h3>
      <div className="space-y-2">
        {products.map((product) => (
          <div
            key={product.id}
            onClick={() => onSelect(product)}
            className={`p-3 border rounded-lg cursor-pointer transition-all ${
              selected?.id === product.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{product.icon}</span>
                <div>
                  <div className="font-medium text-gray-900">{product.name}</div>
                  <div className="text-sm text-gray-600">{product.description}</div>
                  <div className="text-xs text-gray-500">{product.documents.join(', ')}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-gray-900">{product.price}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface TemplateSelectorProps {
  selected: any;
  onSelect: (template: any) => void;
  product?: any;
}

function TemplateSelector({ selected, onSelect, product }: TemplateSelectorProps) {
  // Templates based on funding type from basisPack.ts
  const templates = [
    // Grant Templates
    {
      id: 'grant-proposal',
      name: 'Grant Proposal',
      description: 'EU/Austrian grant application template',
      fundingType: 'grants',
      icon: '🎯',
      sections: ['Executive Summary', 'Project Description', 'Methodology', 'Timeline', 'Budget', 'Team']
    },
    {
      id: 'bmbf-standard',
      name: 'BMBF Standard',
      description: 'German BMBF funding application',
      fundingType: 'grants',
      icon: '🇩🇪',
      sections: ['Executive Summary', 'Project Description', 'Methodology', 'Timeline', 'Budget', 'Team']
    },
    {
      id: 'horizon-europe',
      name: 'Horizon Europe',
      description: 'EU Horizon Europe project proposal',
      fundingType: 'grants',
      icon: '🇪🇺',
      sections: ['Excellence', 'Impact', 'Implementation', 'Budget']
    },
    // Loan Templates
    {
      id: 'loan-application',
      name: 'Loan Application',
      description: 'Bank loan application business plan',
      fundingType: 'bankLoans',
      icon: '🏦',
      sections: ['Executive Summary', 'Financial Stability', 'Repayment Capacity', 'Collateral', 'Risk Assessment']
    },
    {
      id: 'sba-loan',
      name: 'SBA Loan',
      description: 'Small Business Administration loan',
      fundingType: 'bankLoans',
      icon: '🇺🇸',
      sections: ['Business Description', 'Market Analysis', 'Financial Projections', 'Management']
    },
    // Equity Templates
    {
      id: 'pitch-deck',
      name: 'Pitch Deck',
      description: 'Investor pitch presentation',
      fundingType: 'equity',
      icon: '📊',
      sections: ['Problem', 'Solution', 'Market', 'Business Model', 'Traction', 'Team', 'Financials', 'Ask']
    },
    {
      id: 'vc-pitch',
      name: 'VC Pitch',
      description: 'Venture capital pitch deck',
      fundingType: 'equity',
      icon: '💼',
      sections: ['Problem', 'Solution', 'Market Size', 'Product', 'Traction', 'Business Model', 'Team', 'Financials']
    },
    // Visa Templates
    {
      id: 'visa-application',
      name: 'Visa Application',
      description: 'Entrepreneur visa business plan',
      fundingType: 'visa',
      icon: '🛂',
      sections: ['Business Concept', 'Market Analysis', 'Financial Plan', 'Job Creation', 'Innovation']
    }
  ];

  // Filter templates based on product type
  const filteredTemplates = product?.type 
    ? templates.filter(t => {
        if (product.type === 'strategy') return ['grants', 'equity'].includes(t.fundingType);
        if (product.type === 'review') return true; // All templates for review
        if (product.type === 'submission') return true; // All templates for submission
        return true;
      })
    : templates;

  return (
    <div className="p-4 border-b border-gray-200">
      <h3 className="text-lg font-semibold mb-3">Select Template</h3>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {filteredTemplates.map((template) => (
          <div
            key={template.id}
            onClick={() => onSelect(template)}
            className={`p-3 border rounded-lg cursor-pointer transition-all ${
              selected?.id === template.id
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center space-x-3">
              <span className="text-xl">{template.icon}</span>
              <div className="flex-1">
                <div className="font-medium text-gray-900">{template.name}</div>
                <div className="text-sm text-gray-600">{template.description}</div>
                <div className="text-xs text-gray-500 capitalize">{template.fundingType}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface SectionManagerProps {
  sections: any[];
  activeSection: string | null;
  onSelect: (sectionId: string | null) => void;
}

function SectionManager({ sections, activeSection, onSelect }: SectionManagerProps) {
  return (
    <div className="p-4 border-b border-gray-200 flex-1">
      <h3 className="text-lg font-semibold mb-3">Sections</h3>
      <div className="space-y-2">
        {sections.map(section => (
          <div
            key={section.id}
            className={`p-3 rounded-lg border cursor-pointer transition-colors ${
              activeSection === section.id 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => onSelect(section.id)}
          >
            <div className="font-medium">{section.title || section.section_name}</div>
            <div className="text-sm text-gray-600">{section.description || section.prompt}</div>
            {section.required && (
              <div className="text-xs text-red-600 mt-1">Required</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

interface ProgressTrackerProps {
  progress: any;
}

function ProgressTracker({ progress }: ProgressTrackerProps) {
  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-3">Progress</h3>
      <div className="space-y-2">
        {progress.sections.map((section: any) => (
          <div key={section.id} className="flex items-center justify-between text-sm">
            <span className="truncate">{section.title}</span>
            <div className="flex items-center space-x-2">
              <div className="w-16 bg-gray-200 rounded-full h-1">
                <div 
                  className="bg-green-500 h-1 rounded-full"
                  style={{ width: `${section.progress}%` }}
                />
              </div>
              <span className="text-xs text-gray-500">
                {section.completed ? '✓' : '○'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface AIAssistantProps {
  state: any;
  onSendMessage: (message: string) => void;
  onToggle: () => void;
}

function AIAssistant({ state, onToggle }: AIAssistantProps) {
  // Mock plan document for EnhancedAIChat
  const mockPlan = {
    id: 'mock-plan',
    ownerId: 'current-user',
    product: 'strategy' as const,
    route: 'business-plan' as const,
    title: 'Business Plan',
    sections: state.sections?.map((section: any) => ({
      key: section.id,
      content: state.content?.[section.id] || '',
      status: 'draft'
    })) || [],
    tone: 'professional',
    language: 'en',
    targetLength: 20,
    settings: {
      showPageNumbers: true,
      showTableOfContents: true,
      includeCharts: true
    },
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const handleInsertContent = (content: string, section: string) => {
    // This would update the section content
    console.log('Insert content:', content, 'into section:', section);
  };

  return (
    <div className="p-4 border-b border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">AI Assistant</h3>
        <button
          onClick={onToggle}
          className="text-blue-600 hover:text-blue-800"
        >
          {state.isOpen ? 'Hide' : 'Show'}
        </button>
      </div>
      {state.isOpen && (
        <div className="h-96">
          <EnhancedAIChat
            plan={mockPlan}
            programProfile={null}
            currentSection={state.activeSection || 'executive-summary'}
            onInsertContent={handleInsertContent}
          />
        </div>
      )}
    </div>
  );
}

interface ReadinessCheckerProps {
  readiness: any;
  onCheck: () => void;
}

function ReadinessChecker({ onCheck }: ReadinessCheckerProps) {
  // Mock plan content for RequirementsChecker
  const mockPlanContent = {
    sections: [] // This will be populated when we have access to state
  };

  const handleRequirementClick = (section: string, requirement: string) => {
    console.log('Requirement clicked:', section, requirement);
  };

  return (
    <div className="p-4 border-b border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Readiness Check</h3>
        <button
          onClick={onCheck}
          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
        >
          Check
        </button>
      </div>
      <div className="h-64 overflow-y-auto">
        <RequirementsChecker
          programType="grant" // This should come from selected product/template
          planContent={mockPlanContent}
          onRequirementClick={handleRequirementClick}
        />
      </div>
    </div>
  );
}

interface ExportManagerProps {
  content: Record<string, string>;
  onExport: (format: string) => void;
}

function ExportManager({ onExport }: ExportManagerProps) {
  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-3">Export</h3>
      <div className="space-y-2">
        <button
          onClick={() => onExport('pdf')}
          className="w-full px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
        >
          Export PDF
        </button>
        <button
          onClick={() => onExport('docx')}
          className="w-full px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm"
        >
          Export Word
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// UNIFIED SECTION EDITOR
// ============================================================================

interface UnifiedSectionEditorProps {
  sections: any[];
  content: Record<string, string>;
  activeSection: string | null;
  onUpdate: (sectionId: string, content: string) => void;
}

function UnifiedSectionEditor({ sections, content, activeSection, onUpdate }: UnifiedSectionEditorProps) {
  const activeSectionData = sections.find(s => s.id === activeSection);

  // Memoize word count calculation to avoid recalculating on every render
  const wordCount = useMemo(() => {
    if (!activeSectionData || !content[activeSectionData.id]) return 0;
    return content[activeSectionData.id].trim().split(/\s+/).filter(word => word.length > 0).length;
  }, [activeSectionData, content]);

  if (!activeSectionData) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <div className="text-xl mb-2">No section selected</div>
          <div className="text-sm">Select a section from the sidebar to start editing</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {activeSectionData.title || activeSectionData.section_name}
          </h2>
          <p className="text-gray-600">
            {activeSectionData.description || activeSectionData.prompt}
          </p>
          {activeSectionData.required && (
            <div className="text-sm text-red-600 mt-2">This section is required</div>
          )}
        </div>
        
        <div className="space-y-4">
          {/* AI Guidance */}
          {activeSectionData.guidance && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">AI Guidance</h4>
              <p className="text-blue-800 text-sm">{activeSectionData.guidance}</p>
            </div>
          )}

          {/* Hints */}
          {activeSectionData.hints && activeSectionData.hints.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-medium text-yellow-900 mb-2">Hints</h4>
              <ul className="text-yellow-800 text-sm space-y-1">
                {activeSectionData.hints.map((hint: string, index: number) => (
                  <li key={index}>• {hint}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Text Editor */}
          <div className="border rounded-lg">
            <textarea
              value={content[activeSectionData.id] || ''}
              onChange={(e) => onUpdate(activeSectionData.id, e.target.value)}
              placeholder={activeSectionData.template || activeSectionData.placeholder || 'Start writing...'}
              className="w-full h-96 p-4 border-0 rounded-lg resize-none focus:outline-none"
            />
          </div>

          {/* Word Count */}
          {(activeSectionData.word_count_min || activeSectionData.word_count_max) && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">
                {wordCount} words
              </span>
              {activeSectionData.word_count_min && (
                <span className="text-gray-500">
                  Min: {activeSectionData.word_count_min}
                </span>
              )}
              {activeSectionData.word_count_max && (
                <span className="text-gray-500">
                  Max: {activeSectionData.word_count_max}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

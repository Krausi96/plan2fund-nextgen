// ========= PLAN2FUND — UNIFIED EDITOR =========
// Simplified, beautiful editor with proper entry points and working logic

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useEditorState } from './EditorState';
import { useI18n } from '../../contexts/I18nContext';
import { normalizeEditorInput } from '../../lib/editor/EditorNormalization';
import { Product, Route } from '../../types/plan';
import { EditorProduct, EditorTemplate } from '../../types/editor';
import ProductRouteFilter from './ProductRouteFilter';
import SectionEditor from './SectionEditor';
import DocumentCustomizationPanel from './DocumentCustomizationPanel';

// Debounce utility for auto-save
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout;
  return ((...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  }) as T;
}

// Import existing components that we'll integrate

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface UnifiedEditorProps {
  programId?: string | null;
  route?: string;
  product?: string;
  answers?: Record<string, any>;
  payload?: Record<string, any>;
  restore?: boolean;
  onSave?: (content: Record<string, string>) => void;
  onExport?: () => void;
}

export default function UnifiedEditor({
  programId: propProgramId,
  route: propRoute,
  product: propProduct,
  answers: propAnswers,
  payload: propPayload,
  restore: propRestore,
  onSave: propOnSave
}: UnifiedEditorProps) {
  const router = useRouter();
  const { t } = useI18n();
  const { state, actions } = useEditorState();

  // Get programId from props or URL
  const programId = propProgramId || (router.query.programId as string);

  // Normalize all input data
  const normalizedData = useMemo(() => {
    return normalizeEditorInput({
      programId: propProgramId || undefined,
      route: propRoute,
      product: propProduct,
      answers: propAnswers,
      payload: propPayload,
      restore: propRestore,
      entryPoint: propProgramId ? 'wizard-results' : 'direct'
    });
  }, [propProgramId, propRoute, propProduct, propAnswers, propPayload, propRestore]);

  // State for filter selections
  const [filterProduct, setFilterProduct] = useState<Product>(normalizedData.product as Product);
  const [filterRoute, setFilterRoute] = useState<Route>(normalizedData.route as Route);
  const [filterProgramId, setFilterProgramId] = useState<string | null>(normalizedData.programId);
  
  // Step-by-step flow state (from SimpleEditor)
  const [step, setStep] = useState<'select' | 'edit' | 'error'>('select');
  const [selectedProduct, setSelectedProduct] = useState<string>(typeof normalizedData.product === 'string' ? normalizedData.product : '');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Performance optimization: Save status and auto-save
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  
  // Document customization config
  const [customizationConfig, setCustomizationConfig] = useState({
    tone: 'formal' as const,
    language: 'en' as const,
    tableOfContents: true,
    pageNumbers: true,
    fontFamily: 'Arial',
    fontSize: 12,
    lineSpacing: 1.5,
    margins: { top: 2.5, bottom: 2.5, left: 2.5, right: 2.5 },
    titlePage: {
      enabled: true,
      companyName: '',
      projectTitle: '',
      date: new Date().toLocaleDateString(),
    },
    citations: {
      enabled: true,
      style: 'apa' as const,
    },
    figures: {
      enabled: true,
      tableOfFigures: true,
      chartDescriptions: true,
    },
  });
  
  // Debounced auto-save function
  const debouncedSave = useCallback(
    debounce(async () => {
      setSaveStatus('saving');
      try {
        // Auto-save current editor state
        await actions.saveContent();
        setSaveStatus('saved');
      } catch (error) {
        console.error('Auto-save failed:', error);
        setSaveStatus('unsaved');
      }
    }, 1000),
    [actions]
  );

  // Filter change handlers
  const handleProductChange = useCallback((newProduct: Product) => {
    setFilterProduct(newProduct);
    // Update editor state if needed
    // Note: state.product?.type is different from Product type
    // This will be handled by the editor state management
  }, []);

  const handleRouteChange = useCallback((newRoute: Route) => {
    setFilterRoute(newRoute);
    // Update editor state if needed
  }, []);

  const handleProgramChange = useCallback((newProgramId: string | null) => {
    setFilterProgramId(newProgramId);
    // Load program data if program selected
    if (newProgramId) {
      actions.loadProgramData(newProgramId);
    }
  }, [actions]);

  // Step-by-step flow handlers (from SimpleEditor)
  const handleProductSelect = useCallback((productId: string) => {
    setSelectedProduct(productId);
    setSelectedTemplate('');
    setError(null);
  }, []);


  const handleStartEditing = useCallback(async () => {
    if (!selectedProduct || !selectedTemplate) {
      setError('Please select both a product and template');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Simulate loading
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check for compatibility issues
      if (selectedProduct === 'strategy' && selectedTemplate === 'loan-application') {
        throw new Error('Strategy product is not compatible with loan applications. Please select a different template.');
      }

      // Set the product and template in editor state
      const product: EditorProduct = {
        id: selectedProduct,
        name: selectedProduct.charAt(0).toUpperCase() + selectedProduct.slice(1),
        type: "grant" // Default to grant type for now
      };
      
      const template: EditorTemplate = {
        id: selectedTemplate,
        name: selectedTemplate.charAt(0).toUpperCase() + selectedTemplate.slice(1).replace('-', ' '),
        description: `Template for ${selectedTemplate}`,
        route: 'strategy' as Route,
        sections: []
      };

      await actions.setProduct(product);
      await actions.setTemplate(template);
      
      setStep('edit');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setStep('error');
    } finally {
      setIsLoading(false);
    }
  }, [selectedProduct, selectedTemplate, actions]);

  const handleGoBack = useCallback(() => {
    setStep('select');
    setError(null);
  }, []);

  const handleGoToReco = useCallback(() => {
    router.push('/reco');
  }, [router]);

  // Document customization handlers
  const handleCustomizationChange = useCallback((config: any) => {
    setCustomizationConfig(config);
  }, []);

  const handleCustomizationTemplateSelect = useCallback((template: any) => {
    console.log('Template selected:', template);
    // Apply template-specific settings
    if (template.agency) {
      setCustomizationConfig(prev => ({
        ...prev,
        tone: template.tone || 'formal',
        fontFamily: template.fontFamily || 'Arial',
      }));
    }
  }, []);

  const handleCustomizationExport = useCallback((format: string) => {
    console.log(`Exporting as ${format} with config:`, customizationConfig);
    // Navigate to export page with current config
    router.push(`/export?format=${format}`);
  }, [customizationConfig, router]);

  // Simple template selection for step-by-step flow
  const handleTemplateSelect = useCallback((templateId: string) => {
    setSelectedTemplate(templateId);
    setError(null);
  }, []);

  // Simple export handler for EditorHeader
  const handleExport = useCallback(async () => {
    await actions.saveContent();
    router.push('/preview');
  }, [actions, router]);

  // Get templates for product (from SimpleEditor)
  const getTemplatesForProduct = useCallback((productId: string) => {
    const templates: Record<string, any[]> = {
      strategy: [
        { id: 'business-model', name: 'Business Model Canvas', description: 'Visual business model' },
        { id: 'go-to-market', name: 'Go-to-Market Strategy', description: 'Market entry plan' },
        { id: 'funding-fit', name: 'Funding Fit Summary', description: 'Funding readiness' }
      ],
      review: [
        { id: 'business-plan-review', name: 'Business Plan Review', description: 'Comprehensive review' },
        { id: 'compliance-check', name: 'Compliance Check', description: 'Regulatory compliance' }
      ],
      submission: [
        { id: 'grant-proposal', name: 'Grant Proposal', description: 'EU/Austrian grants' },
        { id: 'loan-application', name: 'Loan Application', description: 'Bank loan application' },
        { id: 'pitch-deck', name: 'Pitch Deck', description: 'Investor presentation' }
      ]
    };
    return templates[productId] || [];
  }, []);

  // Log wizard data for debugging
  useEffect(() => {
    if (propAnswers && Object.keys(propAnswers).length > 0) {
      console.log('🎯 Wizard answers received:', propAnswers);
    }
    if (propProduct) {
      console.log('📦 Product from wizard:', propProduct);
    }
    if (propRoute) {
      console.log('🛣️ Route from wizard:', propRoute);
    }
    if (propPayload && Object.keys(propPayload).length > 0) {
      console.log('📋 Enhanced payload received:', propPayload);
    }
  }, [propAnswers, propProduct, propRoute, propPayload]);

  // Load program data on mount
  useEffect(() => {
    if (programId) {
      loadProgramRequirements(programId);
    }
  }, [programId]);

  // Auto-save when content changes (performance optimization)
  useEffect(() => {
    if (state.content && Object.keys(state.content).length > 0) {
      debouncedSave();
    }
  }, [state.content, debouncedSave]);

  // Load program requirements from API (from StructuredEditor)
  const loadProgramRequirements = async (programId: string) => {
    try {
      // Use existing loadProgramData action which handles loading state
      await actions.loadProgramData(programId);
    } catch (error) {
      console.error('Error loading program requirements:', error);
    }
  };

  // Handle restore from Preview
  useEffect(() => {
    if (propRestore) {
      console.log('🔄 Restoring editor from Preview');
      // Load saved content from localStorage
      const savedPlan = localStorage.getItem('currentPlan');
      if (savedPlan) {
        try {
          const planData = JSON.parse(savedPlan);
          console.log('📄 Restored plan data:', planData);
          // The content will be loaded by the editor components
        } catch (error) {
          console.error('Error parsing saved plan:', error);
        }
      }
    }
  }, [propRestore]);

  // Handle save
  const handleSave = async () => {
    await actions.saveContent();
    if (propOnSave) {
      propOnSave(state.content);
    }
  };


  // ============================================================================
  // RENDER
  // ============================================================================

  // Step-by-step flow: Show selection step if no product selected
  if (step === 'select' && !state.product) {
    return (
      <>
        <Head>
          <title>Editor - Plan2Fund</title>
          <meta name="description" content="Create your business plan" />
        </Head>
        
        <div className="min-h-screen bg-gray-50 py-12">
          <div className="max-w-4xl mx-auto px-4">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Create Your Plan</h1>
              <p className="text-lg text-gray-600">Choose a product and template to get started</p>
            </div>

            {/* Error Display */}
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="text-red-600 mr-3">⚠️</div>
                  <div>
                    <h3 className="text-red-800 font-medium">Error</h3>
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Product Selection */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Select Product</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { id: 'strategy', name: 'Strategy', description: 'Core strategy documents', price: '€99', icon: '🎯' },
                  { id: 'review', name: 'Review', description: 'Professional review', price: '€149', icon: '📝' },
                  { id: 'submission', name: 'Submission', description: 'Complete business plans', price: '€199', icon: '📄' }
                ].map((product) => (
                  <div
                    key={product.id}
                    onClick={() => handleProductSelect(product.id)}
                    className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedProduct === product.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-2">{product.icon}</div>
                      <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
                      <p className="text-gray-600 text-sm mb-2">{product.description}</p>
                      <div className="text-lg font-bold text-blue-600">{product.price}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Template Selection */}
            {selectedProduct && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Select Template</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {getTemplatesForProduct(selectedProduct).map((template) => (
                    <div
                      key={template.id}
                      onClick={() => handleTemplateSelect(template.id)}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedTemplate === template.id
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <h3 className="font-semibold text-gray-900">{template.name}</h3>
                      <p className="text-gray-600 text-sm">{template.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-center space-x-4">
              <button
                onClick={handleGoToReco}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Find Funding First
              </button>
              <button
                onClick={handleStartEditing}
                disabled={!selectedProduct || !selectedTemplate || isLoading}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Starting...' : 'Start Editing'}
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Step-by-step flow: Show error step
  if (step === 'error') {
    return (
      <>
        <Head>
          <title>Error - Plan2Fund Editor</title>
        </Head>
        
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="max-w-md mx-auto px-4 text-center">
            <div className="text-red-600 text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Configuration Error</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="space-y-3">
              <button
                onClick={handleGoBack}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Different Selection
              </button>
              <button
                onClick={handleGoToReco}
                className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Find Funding First
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

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
        {/* Entry points: allow selecting product/program directly in the editor */}
        <div className="unified-editor h-screen flex flex-col bg-gray-50">
          <ProductRouteFilter
            product={filterProduct}
            route={filterRoute}
            programId={filterProgramId}
            onProductChange={handleProductChange}
            onRouteChange={handleRouteChange}
            onProgramChange={handleProgramChange}
            showPrograms={true}
          />
          <div className="flex flex-1 overflow-hidden">
            {/* Left: selectors to start a plan */}
            <div className="w-96 bg-white border-r border-gray-200 p-4 space-y-4">
              <ProductSelector 
                selected={state.product}
                onSelect={actions.setProduct}
              />
              <TemplateSelector 
                selected={state.template}
                onSelect={actions.setTemplate}
                product={state.product}
              />
            </div>
            {/* Right: empty state guidance */}
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-md px-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Start your plan</h2>
                <p className="text-gray-600 mb-4">Select a product on the left or pick a program above to load tailored sections.</p>
                <button
                  onClick={() => router.push('/reco')}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Find funding first
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Safe fallbacks for potentially undefined or empty state slices
  const safeSections = Array.isArray(state.sections) ? state.sections : [];
  const safeProgress = state.progress && typeof state.progress === 'object'
    ? {
        overall: typeof state.progress.overall === 'number' ? state.progress.overall : 0,
        sections: Array.isArray(state.progress.sections) ? state.progress.sections : [],
        lastUpdated: state.progress.lastUpdated || new Date()
      }
    : { overall: 0, sections: [], lastUpdated: new Date() };
  const safeActiveSection = state.activeSection || 'executive-summary';
  const activeSectionData = safeSections.find(s => s.id === safeActiveSection);

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
          progress={safeProgress}
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
              sections={safeSections}
              activeSection={safeActiveSection}
              onSelect={actions.setActiveSection}
            />
            <ProgressTracker 
              progress={safeProgress}
            />
          </div>
          
          {/* Main Content - Section Editor */}
          <div className="flex-1 flex flex-col">
            {/* Save Status Indicator */}
            <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  saveStatus === 'saved' ? 'bg-green-500' : 
                  saveStatus === 'saving' ? 'bg-yellow-500' : 
                  'bg-red-500'
                }`}></div>
                <span className="text-sm text-gray-600">
                  {saveStatus === 'saved' ? 'All changes saved' : 
                   saveStatus === 'saving' ? 'Saving...' : 
                   'Unsaved changes'}
                </span>
              </div>
            </div>
            
            {activeSectionData ? (
              <SectionEditor
                section={{
                  key: activeSectionData.id,
                  title: activeSectionData.title || activeSectionData.section_name || 'Untitled Section',
                  content: state.content?.[activeSectionData.id] || '',
                  status: 'missing' as const
                }}
                onContentChange={actions.updateSection}
                onStatusChange={(sectionKey, status) => {
                  console.log(`Section ${sectionKey} status: ${status}`);
                }}
                isActive={true}
                showProgress={true}
                showCustomization={true}
                showUniqueness={true}
                programSections={safeSections}
                aiGuidance={undefined}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <div className="text-gray-400 text-6xl mb-4">📝</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Section Selected</h3>
                  <p className="text-gray-500">Choose a section from the sidebar to start editing</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Right Sidebar - Document Customization */}
          <DocumentCustomizationPanel
            currentConfig={customizationConfig}
            onConfigChange={handleCustomizationChange}
            onTemplateSelect={handleCustomizationTemplateSelect}
            onExport={handleCustomizationExport}
          />
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
  onExport: () => void;
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
              onClick={onExport}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Continue to Preview
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

// Removed unused AIAssistant and ExportManager functions - using EnhancedAIChat directly


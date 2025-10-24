// ========= PLAN2FUND — PHASE 4 INTEGRATION =========
// Comprehensive integration of all Phase 4 features: Business Plan Editor Structure, UI Navigation, Entry Points, Templates & Formatting, and Collaboration
// NOW WITH INTEGRATED STATE MANAGEMENT (replaces EditorState)

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { PlanDocument } from '@/types/plan';
import { ProgramProfile } from '@/types/reco';
import { useUser } from '@/contexts/UserContext';
import { EditorProduct } from '@/types/editor';
import { EditorEngine } from '@/lib/editor/EditorEngine';
import { EditorDataProvider } from '@/lib/editor/EditorDataProvider';

// Phase 4 Components
import EntryPointsManager from './EntryPointsManager';
import DocumentCustomizationPanel from './DocumentCustomizationPanel';
import RichTextEditor from './RichTextEditor';
import EnhancedAIChat from './EnhancedAIChat';
import RequirementsChecker from './RequirementsChecker';


// FormattingConfig interface removed - functionality moved to DocumentCustomizationPanel

interface Phase4IntegrationProps {
  initialPlan?: PlanDocument;
  programProfile?: ProgramProfile;
  onPlanChange?: (plan: PlanDocument) => void;
  onProgramProfileChange?: (profile: ProgramProfile) => void;
  onProductChange?: (product: EditorProduct) => void;
}

export default function Phase4Integration({
  initialPlan,
  programProfile,
  onPlanChange,
  onProgramProfileChange,
  onProductChange
}: Phase4IntegrationProps) {
  const { userProfile, isLoading: isUserLoading } = useUser();
  
  // Core state
  const [plan, setPlan] = useState<PlanDocument | null>(initialPlan || null);
  const [sections, setSections] = useState<any[]>([]);
  const [activeSection, setActiveSection] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  // Phase 4 UI state
  const [showEntryPoints, setShowEntryPoints] = useState(false);
  const [showDocumentCustomization, setShowDocumentCustomization] = useState(false);
  const [aiAssistantMuted, setAiAssistantMuted] = useState(false);
  const [showAiAssistant, setShowAiAssistant] = useState(true);
  const [requirementsProgress, setRequirementsProgress] = useState(0);
  const [requirementsStatus, setRequirementsStatus] = useState<'loading' | 'complete' | 'incomplete' | 'error'>('loading');
  
  // ============================================================================
  // INTEGRATED STATE MANAGEMENT (from EditorState)
  // ============================================================================

  // Update requirements progress when content changes
  const updateRequirementsProgress = async () => {
    if (!plan || !programProfile) return;
    
    try {
      setRequirementsStatus('loading');
      
      // Get current plan content for all sections
      const planContent = sections.reduce((acc, section) => {
        acc[section.key] = section.content || '';
        return acc;
      }, {} as Record<string, string>);
      
      // Use RequirementsChecker to validate
      const { createReadinessValidator } = await import('@/lib/readiness');
      const validator = await createReadinessValidator(programProfile.programId, planContent);
      
      if (validator) {
        const checks = await validator.performReadinessCheck();
        const completedChecks = checks.filter(check => check.status === 'complete').length;
        const totalChecks = checks.length;
        const progress = totalChecks > 0 ? Math.round((completedChecks / totalChecks) * 100) : 0;
        
        setRequirementsProgress(progress);
        setRequirementsStatus(progress === 100 ? 'complete' : progress > 0 ? 'incomplete' : 'error');
      } else {
        setRequirementsStatus('error');
      }
    } catch (error) {
      console.error('Error updating requirements progress:', error);
      setRequirementsStatus('error');
    }
  };

  // Update progress when sections change
  useEffect(() => {
    if (sections.length > 0) {
      updateRequirementsProgress();
    }
  }, [sections, programProfile]);
  
  // Editor state (integrated from EditorState)
  const [product, setProductState] = useState<EditorProduct | null>(null);
  const [content, setContent] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  
  // Editor engine integration
  const dataProvider = useMemo(() => new EditorDataProvider(), []);
  const editorEngine = useMemo(() => new EditorEngine(dataProvider), [dataProvider]);
  const editorEngineRef = useRef(editorEngine);

  // Initialize plan and sections
  useEffect(() => {
    if (initialPlan) {
      setPlan(initialPlan);
      setSections(initialPlan.sections || []);
      setIsLoading(false);
    } else if (userProfile && !isUserLoading) {
      // Load user's plan or create new one
      loadUserPlan();
    }
  }, [initialPlan, userProfile, isUserLoading]);

  // Load program sections when programProfile changes
  useEffect(() => {
    if (programProfile && programProfile.programId) {
      loadProgramSections(programProfile.programId);
    }
  }, [programProfile]);

  const loadUserPlan = async () => {
    setIsLoading(true);
    try {
      // In a real implementation, this would load from the database
      const defaultPlan: PlanDocument = {
        id: `plan_${Date.now()}`,
        ownerId: userProfile?.id || 'anonymous',
        product: 'submission',
        route: 'grant',
        language: 'en',
        tone: 'neutral',
        targetLength: 'standard',
        settings: {
          includeTitlePage: true,
          includePageNumbers: true,
          citations: 'simple' as const,
          captions: true,
          graphs: {}
        },
        sections: [],
        addonPack: false,
        versions: []
      };
      setPlan(defaultPlan);
      setSections(defaultPlan.sections || []);
    } catch (error) {
      console.error('Error loading user plan:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadProgramSections = async (programId: string) => {
    setIsLoading(true);
    try {
      console.log('Loading program sections for:', programId);
      
      // Load program data and sections
      const programData = await editorEngineRef.current.loadProduct(programId);
      const sections = await editorEngineRef.current.loadSections(programId);
      
      // Create a new plan with the program's sections
      const newPlan: PlanDocument = {
        id: `plan_${Date.now()}`,
        ownerId: userProfile?.id || 'anonymous',
        product: 'submission',
        route: 'grant',
        language: 'en',
        tone: 'neutral',
        targetLength: 'standard',
        settings: {
          includeTitlePage: true,
          includePageNumbers: true,
          citations: 'simple' as const,
          captions: true,
          graphs: {}
        },
        sections: sections.map(section => ({
          key: section.id,
          title: section.title || section.section_name || 'Untitled Section',
          content: section.template || section.guidance || '',
          status: 'missing' as const,
          wordCount: 0,
          required: section.required !== false,
          order: 0
        })),
        addonPack: false,
        versions: []
      };
      
      setPlan(newPlan);
      setSections(newPlan.sections);
      setProductState(programData);
      
      console.log('Loaded program sections:', sections.length);
    } catch (error) {
      console.error('Error loading program sections:', error);
      setError(error instanceof Error ? error.message : 'Failed to load program sections');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlanChange = (newPlan: PlanDocument) => {
    setPlan(newPlan);
    setSections(newPlan.sections || []);
    if (onPlanChange) {
      onPlanChange(newPlan);
    }
  };

  // Available for parent components to use
  const handleProgramProfileChange = (profile: ProgramProfile) => {
    console.log('Program profile changed:', profile);
    if (onProgramProfileChange) {
      onProgramProfileChange(profile);
    }
  };


  const handleSectionChange = (sectionKey: string, content: string) => {
    // Update sections for UI
    const updatedSections = sections.map(section =>
      section.key === sectionKey ? { ...section, content } : section
    );
    setSections(updatedSections);
    
    // Update content state and calculate progress (from EditorState integration)
    updateSection(sectionKey, content);
    
    if (plan) {
      const updatedPlan = { ...plan, sections: updatedSections };
      handlePlanChange(updatedPlan);
    }
  };

  const handleSectionStatusChange = (sectionKey: string, status: 'missing' | 'needs_fix' | 'aligned') => {
    const updatedSections = sections.map(section =>
      section.key === sectionKey ? { ...section, status } : section
    );
    setSections(updatedSections);
    
    if (plan) {
      const updatedPlan = { ...plan, sections: updatedSections };
      handlePlanChange(updatedPlan);
    }
  };


  // ============================================================================
  // INTEGRATED EDITOR STATE FUNCTIONS (from EditorState)
  // ============================================================================


  // Set product and load sections (exposed for parent components to use)
  // This function is available for parent components to call via ref or props
  const setProduct = useCallback(async (product: EditorProduct) => {
    console.log('setProduct called with:', product);
    setIsLoading(true);
    try {
      setProductState(product);
      setError(null);
      
      // Notify parent component
      if (onProductChange) {
        onProductChange(product);
      }
      
      // Load sections for this product
      const sections = await editorEngineRef.current.loadSections(product.id);
      setSections(sections);
      
      // Initialize content if empty
      const initialContent = sections.reduce((acc, section) => {
        if (!content[section.id]) {
          acc[section.id] = (section as any).content_template || '';
        }
        return acc;
      }, { ...content });
      setContent(initialContent);
      
      
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load product');
    } finally {
      setIsLoading(false);
    }
  }, [content, onProductChange]);

  // Make functions available for debugging/development
  if (typeof window !== 'undefined') {
    (window as any).phase4Integration = {
      setProduct,
      handleProgramProfileChange
    };
  }

  // Update section content
  const updateSection = useCallback((sectionId: string, newContent: string) => {
    setContent(prev => ({ ...prev, [sectionId]: newContent }));
  }, []);


  // Loading state
  if (isLoading || isUserLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div>Loading Phase 4 Editor...</div>
        </div>
      </div>
    );
  }

  // No plan state
  if (!plan) {
    return (
      <div className="p-6">
        <EntryPointsManager
          currentPlan={null}
          programProfile={programProfile}
          onPlanSwitch={handlePlanChange}
          onDocumentTypeChange={(type) => console.log('Document type changed:', type)}
          showWizardEntry={true}
          showDirectEditor={true}
          showPlanSwitching={true}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-emerald-50">
      {/* Modern Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">P</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    {product ? product.name : 'Business Plan Editor'}
              </h1>
                  <p className="text-sm text-gray-500">
                    {plan.route} • {sections.length} sections
                  </p>
                </div>
              </div>
              
              {/* Progress Indicator */}
              <div className="flex items-center space-x-3">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(sections.filter(s => s.status === 'aligned').length / sections.length) * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {sections.filter(s => s.status === 'aligned').length}/{sections.length}
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </button>
              <button className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl">
                Save
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Sections & Document Customization */}
          <div className="lg:col-span-1">
            <div className="space-y-4">
              {/* Sections Panel */}
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-6 sticky top-24">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Sections</h3>
                  <button
                    onClick={() => setShowDocumentCustomization(!showDocumentCustomization)}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Document Settings"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                </div>
                <div className="space-y-2">
                  {sections.map((section, index) => (
                    <button
                      key={section.key}
                      onClick={() => setActiveSection(index)}
                      className={`w-full text-left p-3 rounded-xl transition-all duration-200 ${
                        index === activeSection
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                          : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{section.title}</span>
                        <div className={`w-2 h-2 rounded-full ${
                          section.status === 'aligned' ? 'bg-green-500' : 
                          section.status === 'needs_fix' ? 'bg-yellow-500' : 'bg-gray-300'
                        }`}></div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Document Customization Panel */}
              {showDocumentCustomization && (
                <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-6">
                  <DocumentCustomizationPanel
                    currentConfig={{
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
                        companyName: '',
                        projectTitle: '',
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
                    }}
                    onConfigChange={(config) => {
                      console.log('Document customization changed:', config);
                      // Apply changes immediately
                    }}
                    onTemplateSelect={(template) => {
                      console.log('Template selected:', template);
                    }}
                    onExport={(format) => {
                      console.log('Export requested:', format);
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Main Editor Area */}
          <div className="lg:col-span-3">

          {/* Error Display */}
          {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                <div className="flex items-center">
                  <svg className="h-5 w-5 text-red-400 mr-3" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h3 className="text-sm font-medium text-red-800">Error</h3>
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Section Wizard */}
            {sections.length > 0 && activeSection < sections.length && (
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-8">
                {/* Section Header */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        {sections[activeSection]?.title}
                      </h2>
                      <p className="text-gray-600">
                        {sections[activeSection]?.required ? 'Required section' : 'Optional section'}
                      </p>
                    </div>
                    <div className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                      Section {activeSection + 1} of {sections.length}
                    </div>
                  </div>
                </div>

                {/* Rich Text Editor */}
                <div className="space-y-6">
                  <RichTextEditor
                    content={sections[activeSection]?.content || ''}
                    onChange={(content) => handleSectionChange(sections[activeSection].key, content)}
                    section={sections[activeSection]}
                    guidance={sections[activeSection]?.guidance || ''}
                    placeholder="Start writing your content here..."
                    minLength={50}
                    maxLength={5000}
                    showWordCount={true}
                    showGuidance={true}
                    showFormatting={true}
                  />

                  {/* Requirements Progress Bar */}
                  <div className="mt-6 p-4 bg-white/50 backdrop-blur-sm rounded-xl border border-gray-200/50">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-gray-700">Requirements Progress</h3>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">
                          {requirementsStatus === 'loading' && 'Checking...'}
                          {requirementsStatus === 'complete' && '✅ Complete'}
                          {requirementsStatus === 'incomplete' && '⚠️ Incomplete'}
                          {requirementsStatus === 'error' && '❌ Error'}
                        </span>
                        <span className="text-sm font-medium text-gray-700">
                          {requirementsProgress}%
                        </span>
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                      <div 
                        className={`h-2 rounded-full transition-all duration-500 ${
                          requirementsStatus === 'complete' ? 'bg-green-500' :
                          requirementsStatus === 'incomplete' ? 'bg-yellow-500' :
                          requirementsStatus === 'error' ? 'bg-red-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${requirementsProgress}%` }}
                      />
                    </div>
                    
                    {/* Requirements Checker Component */}
                    {programProfile && (
                      <RequirementsChecker
                        programType={programProfile.programId}
                        planContent={sections.reduce((acc, section) => {
                          acc[section.key] = section.content || '';
                          return acc;
                        }, {} as Record<string, string>)}
                      />
                    )}
                  </div>

                  {/* Section Navigation & Actions */}
                  <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                    {/* Navigation Buttons */}
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => setActiveSection(Math.max(0, activeSection - 1))}
                        disabled={activeSection === 0}
                        className="px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        ← Previous
                      </button>
                      <button
                        onClick={() => setActiveSection(Math.min(sections.length - 1, activeSection + 1))}
                        disabled={activeSection === sections.length - 1}
                        className="px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Next →
                      </button>
                    </div>

                    {/* Section Status Actions */}
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => handleSectionStatusChange(sections[activeSection].key, 'aligned')}
                        className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                      >
                        Mark Complete
                      </button>
                      <button
                        onClick={() => handleSectionStatusChange(sections[activeSection].key, 'needs_fix')}
                        className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors"
                      >
                        Needs Review
                      </button>
                  </div>
                </div>
              </div>
            </div>
          )}

            {/* No Sections State */}
            {sections.length === 0 && (
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-12 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Sections Available</h3>
                <p className="text-gray-600 mb-6">Select a program to load its sections and start creating your business plan.</p>
                <button
                  onClick={() => setShowEntryPoints(true)}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Select Program
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating AI Assistant */}
      {showAiAssistant && plan && (
        <div className="fixed bottom-6 right-6 z-40">
          <div className={`bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-xl transition-all duration-300 ${
            aiAssistantMuted ? 'w-16 h-16' : 'w-80 h-96'
          }`}>
            {aiAssistantMuted ? (
              /* Muted State - Just the character */
              <button
                onClick={() => setAiAssistantMuted(false)}
                className="w-full h-full flex items-center justify-center rounded-2xl hover:bg-gray-50 transition-colors"
                title="Unmute AI Assistant"
              >
                <div className="text-2xl">👔</div>
              </button>
            ) : (
              /* Active State - Full chat interface */
              <div className="h-full flex flex-col">
                {/* AI Assistant Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm">👔</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">AI Assistant</h3>
                      <p className="text-xs text-gray-500">Virtual Funding Expert</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setAiAssistantMuted(true)}
                      className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Mute Assistant"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setShowAiAssistant(false)}
                      className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Close Assistant"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* AI Chat Interface */}
                <div className="flex-1 p-4">
                  <EnhancedAIChat
                    plan={plan}
                    programProfile={programProfile || null}
                    currentSection={sections[activeSection]?.key || ''}
                    onInsertContent={(content, section) => {
                      console.log('AI content inserted:', content, 'into section:', section);
                      // Insert content into current section
                      if (sections[activeSection]) {
                        handleSectionChange(sections[activeSection].key, content);
                      }
                    }}
                  />
                </div>
              </div>
            )}
              </div>
            </div>
          )}

      {/* Entry Points Modal */}
          {showEntryPoints && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Entry Points</h3>
                <button
                  onClick={() => setShowEntryPoints(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <EntryPointsManager
                currentPlan={plan}
                programProfile={programProfile}
                onPlanSwitch={handlePlanChange}
                onDocumentTypeChange={(type) => console.log('Document type changed:', type)}
                showWizardEntry={true}
                showDirectEditor={true}
                showPlanSwitching={true}
              />
                </div>
              </div>
            </div>
          )}
    </div>
  );
}

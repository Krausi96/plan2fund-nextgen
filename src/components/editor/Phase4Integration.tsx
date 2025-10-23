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
  
  // ============================================================================
  // INTEGRATED STATE MANAGEMENT (from EditorState)
  // ============================================================================
  
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
          {/* Sidebar - Sections */}
          <div className="lg:col-span-1">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-6 sticky top-24">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Sections</h3>
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

            {/* Section Editor */}
            {sections.length > 0 && activeSection < sections.length && (
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-8">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {sections[activeSection]?.title}
                  </h2>
                  <p className="text-gray-600">
                    {sections[activeSection]?.required ? 'Required section' : 'Optional section'}
                  </p>
                </div>

                <div className="space-y-6">
                  {/* Section Content Editor */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Content
                    </label>
                    <textarea
                      value={sections[activeSection]?.content || ''}
                      onChange={(e) => handleSectionChange(sections[activeSection].key, e.target.value)}
                      className="w-full h-64 p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      placeholder="Start writing your content here..."
                    />
                  </div>

                  {/* Section Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
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
                    
                    <div className="text-sm text-gray-500">
                      {sections[activeSection]?.content?.length || 0} characters
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

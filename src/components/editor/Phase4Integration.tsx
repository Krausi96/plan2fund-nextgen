// ========= PLAN2FUND — PHASE 4 INTEGRATION =========
// Comprehensive integration of all Phase 4 features: Business Plan Editor Structure, UI Navigation, Entry Points, Templates & Formatting, and Collaboration
// NOW WITH INTEGRATED STATE MANAGEMENT (replaces EditorState)

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { PlanDocument } from '@/types/plan';
import { ProgramProfile } from '@/types/reco';
import { useUser } from '@/contexts/UserContext';
import { EditorProduct, UnifiedEditorSection } from '@/types/editor';
import { EditorEngine } from '@/lib/editor/EditorEngine';
import { EditorDataProvider } from '@/lib/editor/EditorDataProvider';

// Phase 4 Components
import EnhancedNavigation from './EnhancedNavigation';
import EntryPointsManager from './EntryPointsManager';
import CollaborationManager from './CollaborationManager';
import SectionEditor from './SectionEditor';

// Types for Phase 4 features
interface SectionCustomizations {
  title?: string;
  guidance?: string;
  minLength?: number;
  maxLength?: number;
  required?: boolean;
  order?: number;
  isVisible?: boolean;
  template?: string;
}

// FormattingConfig interface removed - functionality moved to DocumentCustomizationPanel

interface Phase4IntegrationProps {
  initialPlan?: PlanDocument;
  programProfile?: ProgramProfile;
  onPlanChange?: (plan: PlanDocument) => void;
  onProgramProfileChange?: (profile: ProgramProfile) => void;
  onProductChange?: (product: EditorProduct) => void;
  showAllFeatures?: boolean;
  defaultViewMode?: 'dashboard' | 'editor' | 'single-page' | 'multi-step';
}

export default function Phase4Integration({
  initialPlan,
  programProfile,
  onPlanChange,
  onProgramProfileChange,
  onProductChange,
  showAllFeatures = true,
  defaultViewMode = 'editor'
}: Phase4IntegrationProps) {
  const { userProfile, isLoading: isUserLoading } = useUser();
  
  // Core state
  const [plan, setPlan] = useState<PlanDocument | null>(initialPlan || null);
  const [sections, setSections] = useState<any[]>([]);
  const [activeSection, setActiveSection] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  // Phase 4 UI state
  const [viewMode, setViewMode] = useState<'dashboard' | 'editor' | 'single-page' | 'multi-step'>(defaultViewMode);
  const [showEntryPoints, setShowEntryPoints] = useState(false);
  const [showTemplates, setShowTemplates] = useState(showAllFeatures);
  const [showCollaboration, setShowCollaboration] = useState(showAllFeatures);
  const [showCustomization, setShowCustomization] = useState(showAllFeatures);
  const [showUniqueness] = useState(true);
  
  // Phase 4 feature state
  const [sectionCustomizations, setSectionCustomizations] = useState<Record<string, SectionCustomizations>>({});
  
  // ============================================================================
  // INTEGRATED STATE MANAGEMENT (from EditorState)
  // ============================================================================
  
  // Editor state (integrated from EditorState)
  const [product, setProductState] = useState<EditorProduct | null>(null);
  const [content, setContent] = useState<Record<string, string>>({});
  const [progress, setProgress] = useState({
    overall: 0,
    sections: [] as any[],
    lastUpdated: new Date()
  });
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

  const handleSectionCustomize = (sectionKey: string, customizations: SectionCustomizations) => {
    setSectionCustomizations(prev => ({
      ...prev,
      [sectionKey]: customizations
    }));
  };

  const handleSectionReorder = (fromIndex: number, toIndex: number) => {
    const newSections = [...sections];
    const [movedSection] = newSections.splice(fromIndex, 1);
    newSections.splice(toIndex, 0, movedSection);
    setSections(newSections);
    
    if (plan) {
      const updatedPlan = { ...plan, sections: newSections };
      handlePlanChange(updatedPlan);
    }
  };

  // ============================================================================
  // INTEGRATED EDITOR STATE FUNCTIONS (from EditorState)
  // ============================================================================

  // Debounced progress calculation to avoid calculating on every keystroke
  const debouncedProgressCalculation = useMemo(() => {
    let timeoutId: NodeJS.Timeout;
    return (sections: UnifiedEditorSection[], content: Record<string, string>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const progress = editorEngineRef.current.calculateProgress(sections, content);
        setProgress(progress);
      }, 300); // 300ms debounce
    };
  }, []);

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
      
      // Calculate initial progress
      const progress = editorEngineRef.current.calculateProgress(sections, initialContent);
      setProgress(progress);
      
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

  // Update section content with debounced progress calculation
  const updateSection = useCallback((sectionId: string, newContent: string) => {
    setContent(prev => ({ ...prev, [sectionId]: newContent }));
    
    // Debounced progress calculation
    const updatedContent = { ...content, [sectionId]: newContent };
    debouncedProgressCalculation(sections as UnifiedEditorSection[], updatedContent);
  }, [sections, content, debouncedProgressCalculation]);

  const handleViewModeChange = (mode: 'dashboard' | 'editor' | 'single-page' | 'multi-step') => {
    setViewMode(mode);
  };

  // Template, formatting, and export handlers removed - functionality moved to DocumentCustomizationPanel

  const handlePlanShare = (shareData: any) => {
    console.log('Sharing plan:', shareData);
    // In a real implementation, this would handle sharing
  };

  const handleVersionCreate = (version: any) => {
    console.log('Creating version:', version);
    // In a real implementation, this would save version
  };

  const handleVersionRestore = (versionId: string) => {
    console.log('Restoring version:', versionId);
    // In a real implementation, this would restore version
  };

  const handleTeamInvite = (email: string, role: any) => {
    console.log('Inviting team member:', email, role);
    // In a real implementation, this would send invitation
  };

  const handleAdvisorRequest = (advisorData: any) => {
    console.log('Requesting advisor:', advisorData);
    // In a real implementation, this would handle advisor request
  };

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
    <div className="phase4-integration h-screen flex bg-gray-50">
      {/* Enhanced Navigation Sidebar */}
      <EnhancedNavigation
        sections={sections}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        onViewModeChange={handleViewModeChange}
        currentViewMode={viewMode}
        showProgress={true}
        showUniqueness={showUniqueness}
        onSectionReorder={handleSectionReorder}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Toolbar */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900">
                {product ? `${product.name} - ${plan.route}` : `${plan.product} - ${plan.route}`}
              </h1>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowEntryPoints(!showEntryPoints)}
                  className={`px-3 py-1 text-sm rounded ${
                    showEntryPoints ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  Entry Points
                </button>
                <button
                  onClick={() => setShowTemplates(!showTemplates)}
                  className={`px-3 py-1 text-sm rounded ${
                    showTemplates ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  Templates
                </button>
                <button
                  onClick={() => setShowCollaboration(!showCollaboration)}
                  className={`px-3 py-1 text-sm rounded ${
                    showCollaboration ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  Collaboration
                </button>
                <button
                  onClick={() => setShowCustomization(!showCustomization)}
                  className={`px-3 py-1 text-sm rounded ${
                    showCustomization ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  Customize
                </button>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">
                {sections.filter(s => s.status === 'aligned').length} / {sections.length} complete
              </span>
              <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                Save
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Error Display */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Progress Display */}
          {progress.overall > 0 && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-800">Progress</span>
                <span className="text-sm text-blue-600">{Math.round(progress.overall)}%</span>
              </div>
              <div className="mt-2 w-full bg-blue-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${progress.overall}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Entry Points Panel */}
          {showEntryPoints && (
            <div className="mb-6">
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
          )}

          {/* Templates & Formatting Panel */}
          {showTemplates && (
            <div className="mb-6 p-4 bg-gray-100 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Templates & Formatting</h3>
              <p className="text-gray-600 text-sm">
                Customization features are now available in the Document Customization Panel.
              </p>
            </div>
          )}

          {/* Collaboration Panel */}
          {showCollaboration && userProfile && (
            <div className="mb-6">
              <CollaborationManager
                currentPlan={plan}
                currentUser={userProfile}
                onPlanShare={handlePlanShare}
                onVersionCreate={handleVersionCreate}
                onVersionRestore={handleVersionRestore}
                onTeamInvite={handleTeamInvite}
                onAdvisorRequest={handleAdvisorRequest}
                showTeamEditing={true}
                showVersionControl={true}
                showSharing={true}
                showAdvisorIntegration={true}
              />
            </div>
          )}

          {/* Main Editor Content */}
          {viewMode === 'editor' && (
            <div className="space-y-6">
              {sections.map((section, index) => (
                <SectionEditor
                  key={section.key}
                  section={section}
                  onContentChange={handleSectionChange}
                  onStatusChange={handleSectionStatusChange}
                  onSectionReorder={handleSectionReorder}
                  onSectionCustomize={handleSectionCustomize}
                  isActive={index === activeSection}
                  showProgress={true}
                  showCustomization={showCustomization}
                  showUniqueness={showUniqueness}
                  customizations={sectionCustomizations[section.key]}
                />
              ))}
            </div>
          )}

          {/* Dashboard View */}
          {viewMode === 'dashboard' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Progress Overview</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Completed</span>
                    <span className="text-sm font-medium">
                      {sections.filter(s => s.status === 'aligned').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">In Progress</span>
                    <span className="text-sm font-medium">
                      {sections.filter(s => s.status === 'needs_fix').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Not Started</span>
                    <span className="text-sm font-medium">
                      {sections.filter(s => s.status === 'missing').length}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  <button className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded">
                    Generate AI Content
                  </button>
                  <button className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded">
                    Check Requirements
                  </button>
                  <button className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded">
                    Export Document
                  </button>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>• Plan created</p>
                  <p>• Section 1 updated</p>
                  <p>• AI content generated</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ========= PLAN2FUND — PHASE 4 INTEGRATION =========
// Comprehensive integration of all Phase 4 features: Business Plan Editor Structure, UI Navigation, Entry Points, Templates & Formatting, and Collaboration

import React, { useState, useEffect } from 'react';
import { PlanDocument } from '@/types/plan';
import { ProgramProfile } from '@/types/reco';
import { useUser } from '@/contexts/UserContext';

// Phase 4 Components
import EnhancedNavigation from './EnhancedNavigation';
import EntryPointsManager from './EntryPointsManager';
import TemplatesFormattingManager from './TemplatesFormattingManager';
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

interface Phase4IntegrationProps {
  initialPlan?: PlanDocument;
  programProfile?: ProgramProfile;
  onPlanChange?: (plan: PlanDocument) => void;
  onProgramProfileChange?: (profile: ProgramProfile) => void;
  showAllFeatures?: boolean;
  defaultViewMode?: 'dashboard' | 'editor' | 'single-page' | 'multi-step';
}

export default function Phase4Integration({
  initialPlan,
  programProfile,
  onPlanChange,
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
  const [showTemplates, setShowTemplates] = useState(false);
  const [showCollaboration, setShowCollaboration] = useState(false);
  const [showCustomization, setShowCustomization] = useState(false);
  const [showUniqueness] = useState(true);
  
  // Phase 4 feature state
  const [sectionCustomizations, setSectionCustomizations] = useState<Record<string, SectionCustomizations>>({});

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

  const handleSectionChange = (sectionKey: string, content: string) => {
    const updatedSections = sections.map(section =>
      section.key === sectionKey ? { ...section, content } : section
    );
    setSections(updatedSections);
    
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

  const handleViewModeChange = (mode: 'dashboard' | 'editor' | 'single-page' | 'multi-step') => {
    setViewMode(mode);
  };

  const handleTemplateChange = (template: any) => {
    // Apply template sections if needed
    if (template.sections) {
      const newSections = template.sections.map((sectionKey: string, index: number) => ({
        key: sectionKey,
        title: sectionKey.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
        content: '',
        status: 'missing' as const,
        order: index
      }));
      setSections(newSections);
    }
  };

  const handleFormattingChange = (newFormatting: FormattingConfig) => {
    console.log('Formatting changed:', newFormatting);
  };

  const handleExport = (format: 'pdf' | 'docx' | 'html' | 'markdown') => {
    console.log(`Exporting plan as ${format}...`);
    // In a real implementation, this would trigger the export process
  };

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
                {plan.product} - {plan.route}
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
            <div className="mb-6">
              <TemplatesFormattingManager
                currentPlan={plan}
                onTemplateChange={handleTemplateChange}
                onFormattingChange={handleFormattingChange}
                onExport={handleExport}
                showOfficialTemplates={true}
                showIndustryVariations={true}
                showToneCustomization={true}
                showExportOptions={true}
              />
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

// ========= PLAN2FUND — OPTIMIZED EDITOR PAGE =========
// Performance-optimized editor with multi-user support

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import { useUser } from '@/contexts/UserContext';
import { PlanDocument, Route, FigureRef } from '@/types/plan';
import { evaluate } from '../src/editor/readiness/engine';
import { calculatePricing, getPricingSummary } from '../src/lib/pricing';
import { useI18n } from '@/contexts/I18nContext';
import { useOptimizedEditorData } from '../src/hooks/useOptimizedEditorData';

// Lazy load components with proper loading states
const OptimizedEditorShell = dynamic(() => import('../src/editor/optimized/OptimizedEditorShell'), {
  ssr: false,
  loading: () => <EditorLoadingSkeleton />
});

// Phase 4 Enhanced Components
const EnhancedNavigation = dynamic(() => import('../src/components/editor/EnhancedNavigation'), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-gray-200 h-full w-80 rounded"></div>
});

const EntryPointsManager = dynamic(() => import('../src/components/editor/EntryPointsManager'), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-gray-200 h-64 w-full rounded"></div>
});

const TemplatesFormattingManager = dynamic(() => import('../src/components/editor/TemplatesFormattingManager'), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-gray-200 h-64 w-full rounded"></div>
});

const CollaborationManager = dynamic(() => import('../src/components/editor/CollaborationManager'), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-gray-200 h-64 w-full rounded"></div>
});

const RecoIntegration = dynamic(() => import('../src/editor/integration/RecoIntegration'), { 
  ssr: false,
  loading: () => <div className="animate-pulse bg-gray-200 h-4 w-full rounded"></div>
});

const SectionEditor = dynamic(() => import('../src/components/editor/SectionEditor'), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-gray-200 h-32 w-full rounded"></div>
});

const EnhancedAIChat = dynamic(() => import('../src/components/editor/EnhancedAIChat'), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-gray-200 h-80 w-full rounded"></div>
});

const FinancialTables = dynamic(() => import('../src/editor/financials/index'), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-gray-200 h-64 w-full rounded"></div>
});

const Figures = dynamic(() => import('../src/editor/figures/index'), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-gray-200 h-32 w-full rounded"></div>
});

const AddonPack = dynamic(() => import('../src/editor/addons/AddonPack'), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-gray-200 h-24 w-full rounded"></div>
});

const FormattingPanel = dynamic(() => import('../src/editor/settings/FormattingPanel'), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-gray-200 h-32 w-full rounded"></div>
});

const RouteExtrasPanel = dynamic(() => import('../src/components/editor/RouteExtrasPanel'), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-gray-200 h-24 w-full rounded"></div>
});

// Enhanced loading skeleton component with better UX
function EditorLoadingSkeleton() {
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Top Bar Skeleton */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="animate-pulse flex items-center justify-between">
          <div className="flex space-x-4">
            <div className="h-6 bg-gray-200 rounded w-48"></div>
            <div className="h-8 bg-gray-200 rounded w-24"></div>
            <div className="h-6 bg-gray-200 rounded w-20"></div>
          </div>
          <div className="flex space-x-4">
            <div className="h-8 bg-gray-200 rounded w-16"></div>
            <div className="h-8 bg-gray-200 rounded w-20"></div>
            <div className="h-8 bg-gray-200 rounded w-24"></div>
            <div className="h-8 bg-gray-200 rounded w-20"></div>
          </div>
        </div>
      </div>
      
      {/* Main Content Skeleton */}
      <div className="flex flex-1">
        {/* Left Navigation Skeleton */}
        <div className="w-80 bg-white border-r border-gray-200 p-4">
          <div className="space-y-4">
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
              <div className="space-y-2">
                {[1,2,3,4,5,6].map(i => (
                  <div key={i} className="flex items-center space-x-3 p-3 bg-gray-50 rounded">
                    <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Center Editor Skeleton */}
        <div className="flex-1 p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Toolbar Skeleton */}
            <div className="animate-pulse bg-white border rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="h-8 bg-gray-200 rounded w-64"></div>
                <div className="h-4 bg-gray-200 rounded w-32"></div>
              </div>
              <div className="flex space-x-4">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className="h-8 bg-gray-200 rounded w-24"></div>
                ))}
              </div>
            </div>
            
            {/* Section Editor Skeleton */}
            <div className="animate-pulse bg-white border rounded-lg">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
                    <div className="h-6 bg-gray-200 rounded w-48"></div>
                  </div>
                  <div className="h-6 bg-gray-200 rounded w-20"></div>
                </div>
              </div>
              <div className="p-4">
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                  <div className="h-4 bg-gray-200 rounded w-4/6"></div>
                  <div className="h-32 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right Panel Skeleton */}
        <div className="w-80 bg-white border-l border-gray-200 p-4">
          <div className="space-y-4">
            <div className="animate-pulse bg-gray-50 rounded-lg p-4">
              <div className="h-6 bg-gray-200 rounded w-32 mb-3"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
            <div className="animate-pulse bg-gray-50 rounded-lg p-4">
              <div className="h-6 bg-gray-200 rounded w-24 mb-3"></div>
              <div className="space-y-2">
                {[1,2,3,4].map(i => (
                  <div key={i} className="flex justify-between">
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OptimizedEditorPage() {
  const router = useRouter();
  const { t } = useI18n();
  const { userProfile, isLoading: userLoading } = useUser();
  
  // Get query parameters
  const { route, programId, product } = router.query;
  
  // Use optimized data hook
  const {
    plan,
    programProfile,
    aiFields,
    isLoading: dataLoading,
    error: dataError,
    savePlan,
    updatePlan
  } = useOptimizedEditorData({
    programId: programId as string,
    route: route as string,
    product: product as string
  });
  
  // Local UI state
  const [figures, setFigures] = useState<FigureRef[]>([]);
  const [showAIChat, setShowAIChat] = useState(false);
  
  // Phase 4 Enhanced Editor State
  const [viewMode, setViewMode] = useState<'dashboard' | 'editor' | 'single-page' | 'multi-step'>('editor');
  const [showEntryPoints, setShowEntryPoints] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showCollaboration, setShowCollaboration] = useState(false);
  const [showCustomization, setShowCustomization] = useState(false);
  const [showUniqueness] = useState(true);
  const [activeSection, setActiveSection] = useState(0);
  const [sectionCustomizations, setSectionCustomizations] = useState<Record<string, any>>({});
  const [currentSection] = useState('executive_summary');

  // Memoized values for performance
  const currentSectionData = useMemo(() => 
    plan?.sections.find(s => s.key === currentSection),
    [plan?.sections, currentSection]
  );

  const completedSections = useMemo(() => 
    plan?.sections.filter(s => s.status === 'aligned').length || 0,
    [plan?.sections]
  );

  const totalSections = useMemo(() => 
    plan?.sections.length || 0,
    [plan?.sections]
  );

  // Handle redirects and loading states
  useEffect(() => {
    // Redirect if no user context
    if (!userLoading && !userProfile) {
      router.push('/reco?product=submission');
      return;
    }
    
    // If no parameters, redirect to reco with default product
    if (!route && !programId && !product) {
      router.push('/reco?product=submission');
      return;
    }
  }, [router.query, router, userProfile, userLoading]);

  // Use optimized save function from hook
  const handleSave = useCallback(async (planToSave: PlanDocument) => {
    try {
      await savePlan(planToSave);
    } catch (error) {
      console.error('Save failed:', error);
    }
  }, [savePlan]);

  // Optimized handlers using updatePlan
  const handleRouteChange = useCallback((newRoute: Route) => {
    updatePlan({ route: newRoute });
  }, [updatePlan]);

  const handleLanguageChange = useCallback((newLanguage: 'de'|'en') => {
    updatePlan({ language: newLanguage });
  }, [updatePlan]);

  const handleToneChange = useCallback((newTone: 'neutral'|'formal'|'concise') => {
    updatePlan({ tone: newTone });
  }, [updatePlan]);

  const handleTargetLengthChange = useCallback((newLength: 'short'|'standard'|'extended') => {
    updatePlan({ targetLength: newLength });
  }, [updatePlan]);

  const handleSettingsChange = useCallback((newSettings: PlanDocument['settings']) => {
    updatePlan({ settings: newSettings });
  }, [updatePlan]);

  const handleAddonPackToggle = useCallback((enabled: boolean) => {
    updatePlan({ addonPack: enabled });
  }, [updatePlan]);

  const handleTablesChange = useCallback((sectionKey: string, tables: any) => {
    if (plan) {
      const updatedSections = plan.sections.map(section => 
        section.key === sectionKey 
          ? { ...section, tables }
          : section
      );
      updatePlan({ sections: updatedSections });
    }
  }, [plan, updatePlan]);

  const handleFiguresChange = useCallback((newFigures: FigureRef[]) => {
    setFigures(newFigures);
  }, []);

  const handleSectionContentChange = useCallback((sectionKey: string, content: string) => {
    if (plan) {
      const updatedSections = plan.sections.map(section => 
        section.key === sectionKey 
          ? { ...section, content }
          : section
      );
      updatePlan({ sections: updatedSections });
    }
  }, [plan, updatePlan]);

  const handleSectionStatusChange = useCallback((sectionKey: string, status: 'missing' | 'needs_fix' | 'aligned') => {
    if (plan) {
      const updatedSections = plan.sections.map(section => 
        section.key === sectionKey 
          ? { ...section, status }
          : section
      );
      updatePlan({ sections: updatedSections });
    }
  }, [plan, updatePlan]);

  const handleAIContentInsert = useCallback((content: string, section: string) => {
    if (plan) {
      const updatedSections = plan.sections.map(s => 
        s.key === section 
          ? { ...s, content: (s.content || '') + '\n\n' + content }
          : s
      );
      updatePlan({ sections: updatedSections });
    }
  }, [plan, updatePlan]);

  // Optimized readiness evaluation
  useEffect(() => {
    if (plan && programProfile) {
      const readiness = evaluate(plan, programProfile);
      updatePlan({ readiness });
    }
  }, [plan, programProfile, updatePlan]);

  // Loading state
  if (dataLoading || !plan || userLoading) {
    return (
      <>
        <Head>
          <title>{t('editor.title')}</title>
          <meta name="description" content={t('editor.description')} />
          <meta name="keywords" content={t('editor.keywords')} />
          <link rel="canonical" href="https://plan2fund.com/optimized-editor" />
        </Head>
        <EditorLoadingSkeleton />
      </>
    );
  }

  // Error state
  if (dataError) {
    return (
      <>
        <Head>
          <title>{t('editor.title')}</title>
          <meta name="description" content={t('editor.description')} />
          <meta name="keywords" content={t('editor.keywords')} />
          <link rel="canonical" href="https://plan2fund.com/optimized-editor" />
        </Head>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="text-red-600 mb-4">Error loading editor</div>
            <div className="text-gray-600 mb-4">{dataError}</div>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Retry
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
        <link rel="canonical" href="https://plan2fund.com/optimized-editor" />
      </Head>
      
      <RecoIntegration
        onPlanChange={updatePlan}
        onProgramProfileChange={() => {}} // Program profile is managed by the hook
      >
        <OptimizedEditorShell
          plan={plan}
          programProfile={programProfile}
          onSave={handleSave}
          onRouteChange={handleRouteChange}
          onLanguageChange={handleLanguageChange}
          onToneChange={handleToneChange}
          onTargetLengthChange={handleTargetLengthChange}
          onSettingsChange={handleSettingsChange}
          onAddonPackToggle={handleAddonPackToggle}
        >
          <div className="flex flex-1">
            {/* Phase 4 Enhanced Navigation */}
            <EnhancedNavigation
              sections={plan.sections}
              activeSection={activeSection}
              onSectionChange={setActiveSection}
              onViewModeChange={setViewMode}
              currentViewMode={viewMode}
              showProgress={true}
              showUniqueness={showUniqueness}
              onSectionReorder={(from, to) => {
                const newSections = [...plan.sections];
                const [moved] = newSections.splice(from, 1);
                newSections.splice(to, 0, moved);
                updatePlan({ sections: newSections });
              }}
            />

            {/* Center - Editor */}
            <div className="flex-1 p-6">
              <div className="max-w-4xl mx-auto space-y-6">
                {/* Phase 4 Enhanced Toolbar */}
                <div className="bg-white border rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold">Enhanced Business Plan Editor</h2>
                    <div className="text-sm text-gray-500">
                      {completedSections} of {totalSections} sections complete
                    </div>
                  </div>
                  
                  {/* Phase 4 Feature Toggles */}
                  <div className="flex items-center space-x-4">
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
                    <button
                      onClick={() => setShowAIChat(!showAIChat)}
                      className={`px-3 py-1 text-sm rounded ${
                        showAIChat ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      AI Assistant
                    </button>
                  </div>
                </div>

                {/* Phase 4 Feature Panels */}
                {showEntryPoints && (
                  <div className="mb-6">
                    <EntryPointsManager
                      currentPlan={plan}
                      programProfile={programProfile}
                      onPlanSwitch={updatePlan}
                      onDocumentTypeChange={(type) => console.log('Document type changed:', type)}
                      showWizardEntry={true}
                      showDirectEditor={true}
                      showPlanSwitching={true}
                    />
                  </div>
                )}

                {showTemplates && (
                  <div className="mb-6">
                    <TemplatesFormattingManager
                      currentPlan={plan}
                      onTemplateChange={(template) => console.log('Template changed:', template)}
                      onFormattingChange={(formatting) => console.log('Formatting changed:', formatting)}
                      onExport={(format) => console.log('Export:', format)}
                      showOfficialTemplates={true}
                      showIndustryVariations={true}
                      showToneCustomization={true}
                      showExportOptions={true}
                    />
                  </div>
                )}

                {showCollaboration && userProfile && (
                  <div className="mb-6">
                    <CollaborationManager
                      currentPlan={plan}
                      currentUser={userProfile}
                      onPlanShare={(shareData) => console.log('Sharing plan:', shareData)}
                      onVersionCreate={(version) => console.log('Creating version:', version)}
                      onVersionRestore={(versionId) => console.log('Restoring version:', versionId)}
                      onTeamInvite={(email, role) => console.log('Inviting team member:', email, role)}
                      onAdvisorRequest={(advisorData) => console.log('Requesting advisor:', advisorData)}
                      showTeamEditing={true}
                      showVersionControl={true}
                      showSharing={true}
                      showAdvisorIntegration={true}
                    />
                  </div>
                )}
                
                        {/* Current Section Editor with Phase 4 Features */}
                        {currentSectionData && (
                          <SectionEditor
                            section={currentSectionData}
                            onContentChange={handleSectionContentChange}
                            onStatusChange={handleSectionStatusChange}
                            onSectionReorder={(from, to) => {
                              const newSections = [...plan.sections];
                              const [moved] = newSections.splice(from, 1);
                              newSections.splice(to, 0, moved);
                              updatePlan({ sections: newSections });
                            }}
                            onSectionCustomize={(sectionKey, customizations) => {
                              setSectionCustomizations(prev => ({
                                ...prev,
                                [sectionKey]: customizations
                              }));
                            }}
                            isActive={true}
                            showProgress={true}
                            showCustomization={showCustomization}
                            showUniqueness={showUniqueness}
                            customizations={sectionCustomizations[currentSectionData.key]}
                            // Pass AI-enhanced fields
                            programSections={aiFields?.editorSections}
                            aiGuidance={aiFields?.aiGuidance}
                          />
                        )}

                {/* Financial Tables */}
                {plan.sections.find(s => s.key === 'financials')?.tables && (
                  <div className="bg-white border rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4">Financial Tables</h3>
                    <FinancialTables
                      tables={plan.sections.find(s => s.key === 'financials')?.tables || {}}
                      onTablesChange={(tables) => handleTablesChange('financials', tables)}
                      onFiguresChange={handleFiguresChange}
                      graphSettings={plan.settings.graphs}
                    />
                  </div>
                )}

                {/* Figures */}
                {figures.length > 0 && (
                  <div className="bg-white border rounded-lg p-6">
                    <Figures
                      figures={figures}
                      onFiguresChange={handleFiguresChange}
                      tables={plan.sections.find(s => s.key === 'financials')?.tables}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Right Rail - Readiness & Settings */}
            <div className="w-80 bg-white border-l border-gray-200 p-4 space-y-4">
                      {/* AI Chat */}
                      {showAIChat && (
                        <div className="bg-gray-50 rounded-lg p-4 mb-4">
                          <div className="h-80">
                            <EnhancedAIChat
                              plan={plan}
                              programProfile={programProfile}
                              currentSection={currentSection}
                              onInsertContent={handleAIContentInsert}
                              // Pass AI-enhanced fields
                              decisionTreeAnswers={aiFields?.decisionTreeQuestions}
                              programTemplate={aiFields?.editorSections ? {
                                program_id: programId as string,
                                program_name: programProfile?.programId || 'Unknown Program',
                                template_name: 'Program Template',
                                description: 'Program-specific template',
                                sections: aiFields.editorSections.map((section: any, index: number) => ({
                                  id: section.id || `section_${index}`,
                                  title: section.title || 'Untitled Section',
                                  description: section.description || 'Program-specific section',
                                  required: section.required || false,
                                  order: index + 1,
                                  content_template: section.content_template || '',
                                  ai_prompts: section.ai_prompts || [],
                                  validation_rules: section.validation_rules || {},
                                  program_specific: true,
                                  industry_hints: aiFields.tags || [],
                                  difficulty_level: 'intermediate' as const
                                })),
                                total_sections: aiFields.editorSections.length,
                                estimated_completion_time: 4,
                                difficulty: 'medium' as const,
                                industry_focus: aiFields.tags || [],
                                target_audience: aiFields.targetPersonas || []
                              } : undefined}
                              aiGuidance={aiFields?.aiGuidance}
                            />
                          </div>
                        </div>
                      )}
              
              {/* Readiness Check */}
              {plan.readiness && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Readiness Check</h3>
                  <div className="text-2xl font-bold text-blue-600 mb-2">
                    {plan.readiness.score}/100
                  </div>
                  <div className="space-y-1">
                    {plan.readiness.dimensions.map((dimension) => (
                      <div key={dimension.key} className="flex items-center justify-between text-sm">
                        <span className="capitalize">{dimension.key.replace('_', ' ')}</span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          dimension.status === 'aligned' ? 'bg-green-100 text-green-800' :
                          dimension.status === 'needs_fix' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {dimension.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Formatting Settings */}
              <FormattingPanel
                settings={plan.settings}
                onSettingsChange={handleSettingsChange}
              />

              {/* Route Extras */}
              <RouteExtrasPanel
                planType={plan.product === 'submission' ? 'custom' : plan.product}
                selectedRoute={plan.route}
                selectedProgram={programProfile}
              />

              {/* Pricing Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold mb-2">Pricing</h3>
                <div className="space-y-2 text-sm">
                  {(() => {
                    const pricing = calculatePricing(plan.product, plan.route, plan.addonPack);
                    return (
                      <>
                        <div className="flex justify-between">
                          <span>Base Price:</span>
                          <span>{pricing.basePrice === 0 ? 'Free' : `€${pricing.basePrice}`}</span>
                        </div>
                        {plan.addonPack && (
                          <div className="flex justify-between">
                            <span>Add-on Pack:</span>
                            <span>+€{pricing.addonPrice}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-semibold border-t pt-2">
                          <span>Total:</span>
                          <span>{getPricingSummary(pricing)}</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          Delivery: {pricing.deliveryTime}
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Add-on Pack */}
              <AddonPack
                enabled={plan.addonPack || false}
                onToggle={handleAddonPackToggle}
              />
            </div>
          </div>
        </OptimizedEditorShell>
      </RecoIntegration>
    </>
  );
}

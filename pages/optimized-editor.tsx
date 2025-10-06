// ========= PLAN2FUND — OPTIMIZED EDITOR PAGE =========
// Performance-optimized editor with multi-user support

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import { useUser } from '@/contexts/UserContext';
import { PlanDocument, Route, FigureRef } from '@/types/plan';
import { ProgramProfile } from '@/types/reco';
import { evaluate } from '../src/editor/readiness/engine';
import { calculatePricing, getPricingSummary } from '../src/lib/pricing';
import { useI18n } from '@/contexts/I18nContext';

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

// Loading skeleton component
function EditorLoadingSkeleton() {
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="animate-pulse flex items-center justify-between">
          <div className="flex space-x-4">
            <div className="h-6 bg-gray-200 rounded w-48"></div>
            <div className="h-8 bg-gray-200 rounded w-24"></div>
          </div>
          <div className="flex space-x-4">
            <div className="h-8 bg-gray-200 rounded w-16"></div>
            <div className="h-8 bg-gray-200 rounded w-20"></div>
            <div className="h-8 bg-gray-200 rounded w-24"></div>
          </div>
        </div>
      </div>
      <div className="flex flex-1">
        <div className="w-64 bg-white border-r border-gray-200 p-4">
          <div className="space-y-2">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="animate-pulse bg-gray-200 h-16 rounded"></div>
            ))}
          </div>
        </div>
        <div className="flex-1 p-6">
          <div className="animate-pulse bg-gray-200 h-32 w-full rounded"></div>
        </div>
        <div className="w-80 bg-white border-l border-gray-200 p-4">
          <div className="space-y-4">
            <div className="animate-pulse bg-gray-200 h-80 rounded"></div>
            <div className="animate-pulse bg-gray-200 h-32 rounded"></div>
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
  
  // Optimized state management
  const [plan, setPlan] = useState<PlanDocument | null>(null);
  const [programProfile, setProgramProfile] = useState<ProgramProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [figures, setFigures] = useState<FigureRef[]>([]);
  const [showAIChat, setShowAIChat] = useState(false);
  
  // Phase 4 Enhanced Editor State
  const [viewMode, setViewMode] = useState<'dashboard' | 'editor' | 'single-page' | 'multi-step'>('editor');
  const [showEntryPoints, setShowEntryPoints] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showCollaboration, setShowCollaboration] = useState(false);
  const [showCustomization, setShowCustomization] = useState(false);
  const [showUniqueness, setShowUniqueness] = useState(true);
  const [activeSection, setActiveSection] = useState(0);
  const [sectionCustomizations, setSectionCustomizations] = useState<Record<string, any>>({});
  const [currentSection, setCurrentSection] = useState('executive_summary');
  const [showFormHelp, setShowFormHelp] = useState(false);
  const [formHelpData, setFormHelpData] = useState<any>(null);

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

  // Optimized initialization
  useEffect(() => {
    const { route, programId, product } = router.query;
    
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
    
    // If we have parameters but no plan yet, show loading
    if ((route || programId || product) && !plan) {
      setIsLoading(true);
    }
  }, [router.query, plan, router, userProfile, userLoading]);

  // Optimized save function with user context
  const handleSave = useCallback(async (planToSave: PlanDocument) => {
    if (!userProfile) return;
    
    try {
      // Save to user-specific storage
      const userPlanKey = `plan_${userProfile.id}_${planToSave.id}`;
      localStorage.setItem(userPlanKey, JSON.stringify(planToSave));
      
      // Also save to API if available
      const response = await fetch('/api/plan/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: planToSave,
          userId: userProfile.id
        })
      });
      
      if (!response.ok) {
        console.warn('Failed to save to server, saved locally');
      }
      
      console.log('Plan saved successfully');
    } catch (error) {
      console.error('Save failed:', error);
    }
  }, [userProfile]);

  // Optimized handlers with useCallback
  const handleRouteChange = useCallback((newRoute: Route) => {
    if (plan) {
      setPlan({ ...plan, route: newRoute });
    }
  }, [plan]);

  const handleLanguageChange = useCallback((newLanguage: 'de'|'en') => {
    if (plan) {
      setPlan({ ...plan, language: newLanguage });
    }
  }, [plan]);

  const handleToneChange = useCallback((newTone: 'neutral'|'formal'|'concise') => {
    if (plan) {
      setPlan({ ...plan, tone: newTone });
    }
  }, [plan]);

  const handleTargetLengthChange = useCallback((newLength: 'short'|'standard'|'extended') => {
    if (plan) {
      setPlan({ ...plan, targetLength: newLength });
    }
  }, [plan]);

  const handleSettingsChange = useCallback((newSettings: PlanDocument['settings']) => {
    if (plan) {
      setPlan({ ...plan, settings: newSettings });
    }
  }, [plan]);

  const handleAddonPackToggle = useCallback((enabled: boolean) => {
    if (plan) {
      setPlan({ ...plan, addonPack: enabled });
    }
  }, [plan]);

  const handleTablesChange = useCallback((sectionKey: string, tables: any) => {
    if (plan) {
      const updatedSections = plan.sections.map(section => 
        section.key === sectionKey 
          ? { ...section, tables }
          : section
      );
      setPlan({ ...plan, sections: updatedSections });
    }
  }, [plan]);

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
      setPlan({ ...plan, sections: updatedSections });
    }
  }, [plan]);

  const handleSectionStatusChange = useCallback((sectionKey: string, status: 'missing' | 'needs_fix' | 'aligned') => {
    if (plan) {
      const updatedSections = plan.sections.map(section => 
        section.key === sectionKey 
          ? { ...section, status }
          : section
      );
      setPlan({ ...plan, sections: updatedSections });
    }
  }, [plan]);

  const handleAIContentInsert = useCallback((content: string, section: string) => {
    if (plan) {
      const updatedSections = plan.sections.map(s => 
        s.key === section 
          ? { ...s, content: (s.content || '') + '\n\n' + content }
          : s
      );
      setPlan({ ...plan, sections: updatedSections });
    }
  }, [plan]);

  // Optimized readiness evaluation
  useEffect(() => {
    if (plan && programProfile) {
      const readiness = evaluate(plan, programProfile);
      setPlan(prev => prev ? { ...prev, readiness } : null);
    }
  }, [plan, programProfile]);

  // Loading state
  if (isLoading || !plan || userLoading) {
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

  return (
    <>
      <Head>
        <title>{t('editor.title')}</title>
        <meta name="description" content={t('editor.description')} />
        <meta name="keywords" content={t('editor.keywords')} />
        <link rel="canonical" href="https://plan2fund.com/optimized-editor" />
      </Head>
      
      <RecoIntegration
        onPlanChange={setPlan}
        onProgramProfileChange={setProgramProfile}
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
                setPlan({ ...plan, sections: newSections });
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
                      onPlanSwitch={setPlan}
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
                      setPlan({ ...plan, sections: newSections });
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

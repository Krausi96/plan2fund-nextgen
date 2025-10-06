// ========= PLAN2FUND — UNIFIED EDITOR PAGE =========
// Main editor page integrating all phases

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import EditorShell from '../src/editor/EditorShell';

// Lazy load heavy components for better performance
const RecoIntegration = dynamic(() => import('../src/editor/integration/RecoIntegration'), { ssr: false });
const FormattingPanel = dynamic(() => import('../src/editor/settings/FormattingPanel'), { ssr: false });
const RouteExtrasPanel = dynamic(() => import('../src/components/editor/RouteExtrasPanel'), { ssr: false });
const FinancialTables = dynamic(() => import('../src/editor/financials/index'), { ssr: false });
const Figures = dynamic(() => import('../src/editor/figures/index'), { ssr: false });
const AddonPack = dynamic(() => import('../src/editor/addons/AddonPack'), { ssr: false });
const EnhancedAIChat = dynamic(() => import('../src/components/editor/EnhancedAIChat'), { ssr: false });
const FormHelpModal = dynamic(() => import('../src/components/editor/FormHelpModal'), { ssr: false });
const SectionEditor = dynamic(() => import('../src/components/editor/SectionEditor'), { ssr: false });
import { PlanDocument, Route, FigureRef } from '@/types/plan';
import { ProgramProfile } from '@/types/reco';
import { evaluate } from '../src/editor/readiness/engine';
import { calculatePricing, getPricingSummary } from '../src/lib/pricing';
import { useI18n } from '@/contexts/I18nContext';

export default function EditorPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [plan, setPlan] = useState<PlanDocument | null>(null);
  const [programProfile, setProgramProfile] = useState<ProgramProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [figures, setFigures] = useState<FigureRef[]>([]);
  const [showAIChat, setShowAIChat] = useState(false);
  const [currentSection, setCurrentSection] = useState('executive_summary');
  const [showFormHelp, setShowFormHelp] = useState(false);
  const [formHelpData, setFormHelpData] = useState<any>(null);

  // Fallback for direct editor access without parameters
  useEffect(() => {
    const { route, programId, product } = router.query;
    
    // If no parameters, redirect to reco with default product
    if (!route && !programId && !product) {
      router.push('/reco?product=submission');
      return;
    }
    
    // If we have parameters but no plan yet, show loading
    if ((route || programId || product) && !plan) {
      setIsLoading(true);
    }
  }, [router.query, plan, router]);

  const handleSave = () => {
    if (plan) {
      // Save to localStorage or API
      localStorage.setItem('currentPlan', JSON.stringify(plan));
      console.log('Plan saved');
    }
  };

  // Export functionality is now handled by EditorShell

  const handleRouteChange = (newRoute: Route) => {
    if (plan) {
      setPlan({ ...plan, route: newRoute });
    }
  };

  const handleLanguageChange = (newLanguage: 'de'|'en') => {
    if (plan) {
      setPlan({ ...plan, language: newLanguage });
    }
    // The I18n context will be updated by the EditorShell
  };

  const handleToneChange = (newTone: 'neutral'|'formal'|'concise') => {
    if (plan) {
      setPlan({ ...plan, tone: newTone });
    }
  };

  const handleTargetLengthChange = (newLength: 'short'|'standard'|'extended') => {
    if (plan) {
      setPlan({ ...plan, targetLength: newLength });
    }
  };

  const handleSettingsChange = (newSettings: PlanDocument['settings']) => {
    if (plan) {
      setPlan({ ...plan, settings: newSettings });
    }
  };

  const handleAddonPackToggle = (enabled: boolean) => {
    if (plan) {
      setPlan({ ...plan, addonPack: enabled });
    }
  };

  const handleTablesChange = (sectionKey: string, tables: any) => {
    if (plan) {
      const updatedSections = plan.sections.map(section => 
        section.key === sectionKey 
          ? { ...section, tables }
          : section
      );
      setPlan({ ...plan, sections: updatedSections });
    }
  };

  const handleFiguresChange = (newFigures: FigureRef[]) => {
    setFigures(newFigures);
  };

  const handleSectionContentChange = (sectionKey: string, content: string) => {
    if (plan) {
      const updatedSections = plan.sections.map(section => 
        section.key === sectionKey 
          ? { ...section, content }
          : section
      );
      setPlan({ ...plan, sections: updatedSections });
    }
  };

  const handleSectionStatusChange = (sectionKey: string, status: 'missing' | 'needs_fix' | 'aligned') => {
    if (plan) {
      const updatedSections = plan.sections.map(section => 
        section.key === sectionKey 
          ? { ...section, status }
          : section
      );
      setPlan({ ...plan, sections: updatedSections });
    }
  };

  const handleAIContentInsert = (content: string, section: string) => {
    if (plan) {
      const updatedSections = plan.sections.map(s => 
        s.key === section 
          ? { ...s, content: (s.content || '') + '\n\n' + content }
          : s
      );
      setPlan({ ...plan, sections: updatedSections });
    }
  };

  const handleFormHelp = async () => {
    if (!plan || !programProfile) return;

    try {
      // Generate form help based on plan content and program requirements
      const formHelp = await generateFormHelp(plan, programProfile);
      setFormHelpData(formHelp);
      setShowFormHelp(true);
    } catch (error) {
      console.error('Error generating form help:', error);
    }
  };

  // Generate form help based on plan content and program requirements
  const generateFormHelp = async (plan: PlanDocument, program: ProgramProfile) => {
    const formData = {
      programId: program.programId,
      route: program.route,
      companyInfo: {
        name: 'Your Company Name', // This would come from plan data
        description: plan.sections.find(s => s.key === 'executive_summary')?.content || '',
        targetMarket: plan.sections.find(s => s.key === 'market_analysis')?.content || '',
        team: plan.sections.find(s => s.key === 'team')?.content || '',
        financials: plan.sections.find(s => s.key === 'financial_projections')?.tables || {}
      },
      programRequirements: program.required || {},
      readinessIssues: plan.readiness?.dimensions.filter(d => d.status !== 'aligned') || []
    };

    return {
      formType: 'standard_application',
      programId: program.programId,
      route: program.route,
      sections: [
        {
          title: 'Company Information',
          fields: [
            { name: 'Company Name', value: formData.companyInfo.name, required: true },
            { name: 'Business Description', value: formData.companyInfo.description, required: true },
            { name: 'Target Market', value: formData.companyInfo.targetMarket, required: true },
            { name: 'Team Information', value: formData.companyInfo.team, required: true }
          ]
        },
        {
          title: 'Program-Specific Requirements',
          fields: [
            { name: 'Required Sections', value: program.required?.sections?.map(s => s.key).join(', ') || 'None specified', required: false },
            { name: 'Required Tables', value: program.required?.tables?.join(', ') || 'None specified', required: false },
            { name: 'Required Annexes', value: program.required?.annexes?.join(', ') || 'None specified', required: false }
          ]
        }
      ],
      suggestions: plan.readiness?.dimensions
        .filter(d => d.status !== 'aligned')
        .map(d => `Address ${d.key.replace('_', ' ')}: ${d.notes}`) || []
    };
  };

  // Update readiness when plan changes
  useEffect(() => {
    if (plan) {
      const readiness = evaluate(plan, programProfile || undefined);
      setPlan(prev => prev ? { ...prev, readiness } : null);
    }
  }, [plan, programProfile]);

  if (isLoading || !plan) {
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

  return (
    <>
      <Head>
        <title>{t('editor.title')}</title>
        <meta name="description" content={t('editor.description')} />
        <meta name="keywords" content={t('editor.keywords')} />
        <link rel="canonical" href="https://plan2fund.com/editor" />
      </Head>
      <RecoIntegration
        onPlanChange={setPlan}
        onProgramProfileChange={setProgramProfile}
      >
        <EditorShell
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
          {/* Left Rail - Sections */}
          <div className="w-64 bg-white border-r border-gray-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Sections</h3>
              <button
                onClick={() => setShowAIChat(!showAIChat)}
                className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
              >
                {showAIChat ? 'Hide AI' : 'Show AI'}
              </button>
            </div>
            <div className="space-y-2">
              {plan.sections.map((section) => (
                <div
                  key={section.key}
                  className={`p-2 rounded cursor-pointer ${
                    section.status === 'aligned' ? 'bg-green-50 border-green-200' :
                    section.status === 'needs_fix' ? 'bg-yellow-50 border-yellow-200' :
                    'bg-red-50 border-red-200'
                  } border`}
                  onClick={() => setCurrentSection(section.key)}
                >
                  <div className="text-sm font-medium">{section.title}</div>
                  <div className="text-xs text-gray-500 capitalize">
                    {section.status?.replace('_', ' ')}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Center - Editor */}
          <div className="flex-1 p-6">
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Business Plan Editor</h2>
                <div className="text-sm text-gray-500">
                  {plan.sections.filter(s => s.status === 'aligned').length} of {plan.sections.length} sections complete
                </div>
              </div>
              
              {/* Current Section Editor */}
              {plan.sections.find(s => s.key === currentSection) && (
                <SectionEditor
                  section={plan.sections.find(s => s.key === currentSection)!}
                  onContentChange={handleSectionContentChange}
                  onStatusChange={handleSectionStatusChange}
                  isActive={true}
                  showProgress={true}
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

            {/* Form Help */}
            {plan.addonPack && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-900 mb-2">Form Help</h3>
                <p className="text-sm text-green-800 mb-3">
                  Generate a standard application form using your plan content.
                </p>
                <button
                  onClick={handleFormHelp}
                  className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm"
                >
                  Generate Form Help
                </button>
              </div>
            )}
          </div>
        </div>
      </EditorShell>
      
      {/* Form Help Modal */}
      <FormHelpModal
        isOpen={showFormHelp}
        onClose={() => setShowFormHelp(false)}
        plan={plan}
        programProfile={programProfile}
        formHelp={formHelpData}
        />
      </RecoIntegration>
    </>
  );
}

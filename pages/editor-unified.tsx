// ========= PLAN2FUND — UNIFIED EDITOR PAGE =========
// Main editor page integrating all phases

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import EditorShell from '../src/editor/EditorShell';
import RecoIntegration from '../src/editor/integration/RecoIntegration';
import FormattingPanel from '../src/editor/settings/FormattingPanel';
import RouteExtrasPanel from '../src/components/editor/RouteExtrasPanel';
import FinancialTables from '../src/editor/financials/index';
import Figures from '../src/editor/figures/index';
import AddonPack from '../src/editor/addons/AddonPack';
import EnhancedAIChat from '../src/components/editor/EnhancedAIChat';
import FormHelpModal from '../src/components/editor/FormHelpModal';
import { PlanDocument, Route, Product, FigureRef } from '@/types/plan';
import { ProgramProfile } from '@/types/reco';
import { evaluate } from '../src/editor/readiness/engine';
import { exportRenderer } from '../src/export/renderer';
import { calculatePricing, getPricingSummary } from '../src/lib/pricing';
import { useI18n } from '@/contexts/I18nContext';

export default function UnifiedEditorPage() {
  const router = useRouter();
  const { locale } = useI18n();
  const [plan, setPlan] = useState<PlanDocument | null>(null);
  const [programProfile, setProgramProfile] = useState<ProgramProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [figures, setFigures] = useState<FigureRef[]>([]);
  const [showAIChat, setShowAIChat] = useState(false);
  const [currentSection, setCurrentSection] = useState('executive_summary');
  const [showFormHelp, setShowFormHelp] = useState(false);
  const [formHelpData, setFormHelpData] = useState<any>(null);

  useEffect(() => {
    // Initialize from URL parameters
    const { route, programId, product } = router.query;
    
    if (route && product) {
      const initialPlan: PlanDocument = {
        id: `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ownerId: 'user_' + Date.now(),
        product: product as Product,
        route: route as Route,
        programId: programId as string,
        language: locale as 'de'|'en',
        tone: 'neutral',
        targetLength: 'standard',
        settings: {
          includeTitlePage: true,
          includePageNumbers: true,
          citations: 'simple',
          captions: true,
          graphs: {
            revenueCosts: true,
            cashflow: true,
            useOfFunds: true
          }
        },
        sections: [
          {
            key: 'executive_summary',
            title: 'Executive Summary',
            content: 'This is a sample executive summary section. In a real implementation, this would contain the actual business plan content.',
            status: 'needs_fix'
          },
          {
            key: 'financial_projections',
            title: 'Financial Projections',
            content: 'Financial projections and analysis section.',
            tables: {
              revenue: {
                columns: ['Year 1', 'Year 2', 'Year 3'],
                rows: [
                  { label: 'Product Sales', values: [100000, 150000, 200000] },
                  { label: 'Service Revenue', values: [50000, 75000, 100000] }
                ]
              },
              costs: {
                columns: ['Year 1', 'Year 2', 'Year 3'],
                rows: [
                  { label: 'Personnel', values: [80000, 120000, 160000] },
                  { label: 'Marketing', values: [20000, 30000, 40000] },
                  { label: 'Operations', values: [15000, 20000, 25000] }
                ]
              },
              cashflow: {
                columns: ['Q1', 'Q2', 'Q3', 'Q4'],
                rows: [
                  { label: 'Operating Cash Flow', values: [10000, 15000, 20000, 25000] },
                  { label: 'Investment', values: [-5000, -5000, -5000, -5000] }
                ]
              },
              useOfFunds: {
                columns: ['Amount', 'Percentage'],
                rows: [
                  { label: 'Product Development', values: [400000, 40] },
                  { label: 'Marketing', values: [200000, 20] },
                  { label: 'Operations', values: [300000, 30] },
                  { label: 'Reserves', values: [100000, 10] }
                ]
              }
            },
            status: 'aligned'
          }
        ],
        addonPack: false,
        versions: []
      };
      
      setPlan(initialPlan);
      setIsLoading(false);
    }
  }, [router.query, locale]);

  const handleSave = () => {
    if (plan) {
      // Save to localStorage or API
      localStorage.setItem('currentPlan', JSON.stringify(plan));
      console.log('Plan saved');
    }
  };

  const handleExport = async () => {
    if (!plan) return;

    try {
      const result = await exportRenderer.renderPlan(plan, {
        format: 'PDF',
        includeWatermark: !plan.addonPack,
        quality: 'standard'
      });

      if (result.success) {
        console.log('Export successful:', result.downloadUrl);
      } else {
        console.error('Export failed:', result.error);
      }
    } catch (error) {
      console.error('Export error:', error);
    }
  };

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
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div>Loading editor...</div>
        </div>
      </div>
    );
  }

  return (
    <RecoIntegration
      onPlanChange={setPlan}
      onProgramProfileChange={setProgramProfile}
    >
      <EditorShell
        plan={plan}
        programProfile={programProfile}
        onSave={handleSave}
        onExport={handleExport}
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
              <h2 className="text-2xl font-bold">Editor Content</h2>
              
              {/* Financial Tables */}
              {plan.sections.find(s => s.key === 'financial_projections')?.tables && (
                <div className="bg-white border rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Financial Tables</h3>
                  <FinancialTables
                    tables={plan.sections.find(s => s.key === 'financial_projections')?.tables || {}}
                    onTablesChange={(tables) => handleTablesChange('financial_projections', tables)}
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
                    tables={plan.sections.find(s => s.key === 'financial_projections')?.tables}
                  />
                </div>
              )}

              {/* Sample Content */}
              <div className="bg-white border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Sample Business Plan Content</h3>
                <p className="text-gray-600">
                  This is where the main editor content would go. The actual editor implementation 
                  would be integrated here with rich text editing, section management, and content 
                  generation capabilities.
                </p>
              </div>
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
  );
}

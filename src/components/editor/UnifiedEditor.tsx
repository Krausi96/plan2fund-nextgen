// ========= PLAN2FUND — UNIFIED EDITOR =========
// OPTIMIZED EDITOR - All components integrated with performance optimizations

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
// Removed EditorState - now using integrated state management in Phase4Integration
import { useI18n } from '../../contexts/I18nContext';
import { normalizeEditorInput } from '../../lib/editor/EditorNormalization';
import { Product, Route } from '../../types/plan';

// Import core components
import ProductRouteFilter from './ProductRouteFilter';
import Phase4Integration from './Phase4Integration';
import EntryPointsManager from './EntryPointsManager';
import ExportSettings from './ExportSettings';

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
  restore: propRestore
}: UnifiedEditorProps) {
  const router = useRouter();
  const { t } = useI18n();
  // State management now integrated in Phase4Integration

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
  
  // UI State
  const [showExportSettings, setShowExportSettings] = useState(false);
  
  // Performance optimizations
  const [isInitialized, setIsInitialized] = useState(false);

  // Handle product/route changes
  const handleProductChange = useCallback((product: Product) => {
    setFilterProduct(product);
    // Note: setProduct expects EditorProduct type, just update local state
    console.log('Product changed:', product);
  }, []);

  const handleRouteChange = useCallback((route: Route) => {
    setFilterRoute(route);
    // Note: setRoute doesn't exist in EditorActions, just update local state
    console.log('Route changed:', route);
  }, []);

  const handleProgramChange = useCallback((programId: string | null) => {
    setFilterProgramId(programId);
    // Note: setProgramId doesn't exist in EditorActions, storing in state
    console.log('Program changed:', programId);
  }, []);

  // Initialize with Phase4Integration for optimized performance
  useEffect(() => {
    if (!isInitialized) {
      setIsInitialized(true);
      // Phase4Integration will handle template loading
    }
  }, [isInitialized]);

  // Load program sections when program is selected
  useEffect(() => {
    if (filterProgramId && isInitialized) {
      loadProgramSections();
    }
  }, [filterProgramId, isInitialized]);

  const loadProgramSections = async () => {
    if (!filterProgramId) return;
    
    try {
      console.log('Loading program sections for:', filterProgramId);
      // This will be handled by Phase4Integration when we pass the programId
    } catch (error) {
      console.error('Error loading program sections:', error);
    }
  };

  // If no program selected, show selection screen with EntryPointsManager
  if (!filterProgramId) {
    return (
      <>
        <Head>
          <title>{t('editor.title')}</title>
          <meta name="description" content={t('editor.description')} />
        </Head>
        <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-emerald-50">
          {/* Modern Header */}
          <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50">
            <div className="max-w-7xl mx-auto px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold text-lg">P</span>
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">Business Plan Editor</h1>
                    <p className="text-sm text-gray-500">Create professional business plans</p>
                  </div>
                </div>
                <button
                  onClick={() => router.push('/reco')}
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Find Programs
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="max-w-7xl mx-auto px-6 py-12">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Create Your Business Plan</h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Select a funding program to get tailored sections and guidance for your business plan.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Program Selection */}
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Select Program</h3>
                <ProductRouteFilter
                  product={filterProduct}
                  route={filterRoute}
                  programId={filterProgramId}
                  onProductChange={handleProductChange}
                  onRouteChange={handleRouteChange}
                  onProgramChange={handleProgramChange}
                  showPrograms={true}
                />
              </div>

              {/* Entry Points */}
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Quick Start</h3>
                <EntryPointsManager
                  currentPlan={null}
                  programProfile={null}
                  onPlanSwitch={(newPlan) => {
                    console.log('Plan switched:', newPlan);
                  }}
                  onDocumentTypeChange={(type) => {
                    console.log('Document type changed:', type);
                  }}
                  showWizardEntry={true}
                  showDirectEditor={true}
                  showPlanSwitching={true}
                />
              </div>
            </div>

            {/* Call to Action */}
            <div className="text-center mt-12">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 border border-blue-200/50">
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">Ready to Get Started?</h3>
                <p className="text-gray-600 mb-6">Use our SmartWizard to find the perfect funding program for your business.</p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={() => router.push('/reco')}
                    className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    Start SmartWizard
                  </button>
                  <button
                    onClick={() => router.push('/library')}
                    className="px-8 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Browse All Programs
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Main editor interface - Use Phase4Integration for optimized performance
  return (
    <>
      <Head>
        <title>{t('editor.title')}</title>
        <meta name="description" content={t('editor.description')} />
      </Head>
      
      <Phase4Integration
        initialPlan={undefined}
        programProfile={filterProgramId ? { programId: filterProgramId, route: 'grant' } : undefined}
        onPlanChange={(newPlan) => {
          console.log('Plan changed:', newPlan);
        }}
        onProgramProfileChange={(profile) => {
          console.log('Program profile changed:', profile);
        }}
      />
      
      {/* Modals */}
      {showExportSettings && (
        <ExportSettings
          onExport={(options) => {
            console.log('Export with options:', options);
            setShowExportSettings(false);
          }}
          onClose={() => setShowExportSettings(false)}
          isOpen={showExportSettings}
          hasAddonPack={false}
        />
      )}
    </>
  );
}
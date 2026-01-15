import React from 'react';
import { createPortal } from 'react-dom';
import ProductSelection from './ProductSelection/ProductSelection';
import ProgramSelection from './ProgramSelection/ProgramSelection';
import ReadinessCheck from './ReadinessCheck/ReadinessCheck';
import MyProject from './MyProject/MyProject';
import { ChevronRight, ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { useConfiguratorState, useEditorActions, useEditorStore } from '@/features/editor/lib';
import { useI18n } from '@/shared/contexts/I18nContext';

type CurrentSelectionProps = {
  overlayContainerRef?: React.RefObject<HTMLDivElement | null>;
};

/**
 * CurrentSelection component
 * Inline expandable configuration panel
 * Shows compact badges when collapsed, expands to full-width panel inline
 */
function CurrentSelection({}: CurrentSelectionProps) {
  const { t } = useI18n();
  const { selectedProductMeta, programSummary } = useConfiguratorState();
  // Removed unused section/document counts since we're now showing ReadinessCheck and MyProject instead of stats
  const isConfiguratorOpen = useEditorStore((state) => state.isConfiguratorOpen);
  const setupWizard = useEditorStore((state) => state.setupWizard);
  const actions = useEditorActions((a) => ({
    setIsConfiguratorOpen: a.setIsConfiguratorOpen,
    setSetupWizardStep: a.setSetupWizardStep,
    setProjectProfile: a.setProjectProfile,
    completeSetupWizard: a.completeSetupWizard,
  }));
  
  // Handlers for clickable items
  const handleMyProjectClick = () => {
    // Open wizard and go to step 1
    actions.setIsConfiguratorOpen(true);
    actions.setSetupWizardStep(1);
  };
  
  const handlePlanClick = () => {
    // Open wizard and go to step 3
    actions.setIsConfiguratorOpen(true);
    actions.setSetupWizardStep(3);
  };
  
  const handleProgramClick = () => {
    // Open wizard and go to step 2
    actions.setIsConfiguratorOpen(true);
    actions.setSetupWizardStep(2);
  };
  
  const handleReadinessClick = () => {
    // Navigate to Readiness check
    console.log('Navigate to Readiness Check');
  };

  // Setup Wizard navigation
  const handleNextStep = () => {
    if (setupWizard.currentStep < 3) {
      actions.setSetupWizardStep((setupWizard.currentStep + 1) as 1 | 2 | 3);
    }
  };
  
  const handlePrevStep = () => {
    if (setupWizard.currentStep > 1) {
      actions.setSetupWizardStep((setupWizard.currentStep - 1) as 1 | 2 | 3);
    }
  };
  
  const handleCompleteWizard = () => {
    actions.completeSetupWizard();
    actions.setIsConfiguratorOpen(false);
    // Initialize editor with selected configuration
    // Set readiness to 0%
  };
  


  const handleToggle = () => {
    actions.setIsConfiguratorOpen(!isConfiguratorOpen);
  };

  // Compact info row - single line header with all elements inline
  const CompactInfoRow = () => {
    return (
      <div className="flex items-center bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 px-4 py-2 text-white w-full">
        {/* Current Selection Label - Left side */}
        <div className="text-white font-bold text-lg whitespace-nowrap">
          {t('editor.desktop.selection.current' as any) || 'Aktuelle Auswahl:'}
        </div>
        
        {/* All 4 Parameters - Perfectly even distribution */}
        <div className="flex items-center gap-12 text-sm ml-18 flex-grow">
          {/* Mein Projekt - Clickable */}
          <div 
            className="flex flex-col items-center text-center cursor-pointer hover:bg-white/10 p-1 rounded transition-colors"
            onClick={handleMyProjectClick}
          >
            <span className="text-white/70 font-medium text-xs whitespace-nowrap mb-1 flex items-center gap-2">
              💼
              {t('editor.desktop.myProject.title' as any) || 'Mein Projekt'}
            </span>
            <div className="text-white font-medium flex items-center justify-center gap-1">
              <MyProject />
              <ChevronRight className="w-3 h-3 text-white/70" />
            </div>
          </div>
          
          <div className="w-0.5 h-4 bg-white/30"></div>  {/* Separator */}
          
          {/* PLAN - Fixed Icon - Clickable */}
          <div 
            className="flex flex-col items-center text-center cursor-pointer hover:bg-white/10 p-1 rounded transition-colors"
            onClick={handlePlanClick}
          >
            <span className="text-white/70 font-medium text-xs whitespace-nowrap mb-1 flex items-center gap-2">
              📋
              {t('editor.desktop.selection.productLabel' as any) || 'Plan'}
            </span>
            <div className="flex items-center justify-center gap-1">
              <span className="text-white font-medium truncate">
                {selectedProductMeta ? (t(selectedProductMeta.label as any) || selectedProductMeta.label) : t('editor.desktop.product.unselected' as any) || 'No plan'}
              </span>
              <ChevronRight className="w-3 h-3 text-white/70 flex-shrink-0" />
            </div>
          </div>
          
          <div className="w-0.5 h-4 bg-white/30"></div>  {/* Separator */}
          
          {/* Programm/Vorlage - Actual Programs - Clickable */}
          <div 
            className="flex flex-col items-center text-center cursor-pointer hover:bg-white/10 p-1 rounded transition-colors"
            onClick={handleProgramClick}
          >
            <span className="text-white/70 font-medium text-xs whitespace-nowrap mb-1 flex items-center gap-2">
              📚
              {t('editor.desktop.selection.programLabel' as any) || 'Programm'}
            </span>
            <div className="text-white font-medium truncate flex items-center justify-center gap-1">
              <span className="truncate">
                {programSummary?.name || t('editor.desktop.selection.noProgram' as any) || 'Kein Programm ausgewählt'}
              </span>
              <ChevronRight className="w-3 h-3 text-white/70 flex-shrink-0" />
            </div>
          </div>
          
          <div className="w-0.5 h-4 bg-white/30"></div>  {/* Separator */}
          
          {/* Readiness Check - Clickable */}
          <div 
            className="flex flex-col items-center text-center cursor-pointer hover:bg-white/10 p-1 rounded transition-colors"
            onClick={handleReadinessClick}
          >
            <span className="text-white/70 font-medium text-xs whitespace-nowrap mb-1 flex items-center gap-2">
              📊
              {t('editor.desktop.readinessCheck.title' as any) || 'Readiness'}
            </span>
            <div className="text-white font-medium flex items-center justify-center gap-1">
              <ReadinessCheck />
              <ChevronRight className="w-3 h-3 text-white/70" />
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Overlay modal expansion with 3-step wizard - positioned absolutely to overlay content
  const InlineExpansion = () => {
    if (!isConfiguratorOpen) return null;
    
    return createPortal(
      <div 
        className="fixed inset-0 z-[10001] flex items-start justify-center pt-20"
        onClick={(e) => {
          // Close modal when clicking on backdrop (outside the content)
          if (e.target === e.currentTarget) {
            actions.setIsConfiguratorOpen(false);
          }
        }}
      >
        <div 
          className="w-full max-w-6xl mx-4 rounded-lg border-2 border-blue-400 bg-slate-900 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with Step Progress */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/20 bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900">
            <div>
              <h2 className="text-lg font-bold uppercase tracking-wide text-white mb-1">
                Setup Wizard
              </h2>
              <div className="flex items-center gap-2">
                {[1, 2, 3].map((step) => (
                  <div key={step} className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      step <= setupWizard.currentStep 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-white/20 text-white/50'
                    }`}>
                      {step < setupWizard.currentStep ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        step
                      )}
                    </div>
                    {step < 3 && (
                      <div className={`w-8 h-1 mx-1 ${
                        step < setupWizard.currentStep 
                          ? 'bg-blue-500' 
                          : 'bg-white/20'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
            </div>
            <button
              onClick={handleToggle}
              className="text-white/60 hover:text-white text-xl leading-none transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10"
            >
              ×
            </button>
          </div>
          
          {/* Step Content - USING EXISTING MYPROJECT COMPONENT AS REQUESTED */}
          <div className="p-6 bg-slate-800/50 max-h-[60vh]">
            <div className="overflow-y-auto">
              {/* Step 1: My Project Form (enhanced existing component with form fields) */}
              {setupWizard.currentStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">
                      Step 1: Project Basics
                    </h3>
                    <p className="text-white/80 text-sm mb-4">
                      Collect information that affects your document and title page
                    </p>
                  </div>
                  <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                    <MyProject 
                      mode="form" 
                      onSubmit={(data) => {
                        // Handle form submission and proceed to next step
                        actions.setProjectProfile(data);
                        handleNextStep();
                      }}
                    />
                  </div>
                </div>
              )}
              
              {/* Step 2: Program Selection */}
              {setupWizard.currentStep === 2 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">Step 2: Target Selection</h3>
                    <p className="text-white/80 text-sm mb-4">
                      Select your funding type to determine document structure
                    </p>
                  </div>
                  <ProgramSelection />
                </div>
              )}
              
              {/* Step 3: Product Selection */}
              {setupWizard.currentStep === 3 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">Step 3: Document Type</h3>
                    <p className="text-white/80 text-sm mb-4">
                      Choose your document template
                    </p>
                  </div>
                  <ProductSelection />
                </div>
              )}
            </div>
          </div>
          
          {/* Navigation Buttons */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-white/20 bg-slate-800">
            <button
              onClick={handlePrevStep}
              disabled={setupWizard.currentStep === 1}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                setupWizard.currentStep === 1
                  ? 'bg-white/10 text-white/50 cursor-not-allowed'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              Previous
            </button>
            
            {setupWizard.currentStep < 3 ? (
              <button
                onClick={handleNextStep}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleCompleteWizard}
                className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                Complete Setup
              </button>
            )}
          </div>
        </div>
      </div>,
      document.body
    );
  };

  return (
    <div className="w-full">
      <CompactInfoRow />
      <InlineExpansion />
    </div>
  );
}

// Memoize component to prevent unnecessary re-renders when parent re-renders
export default React.memo(CurrentSelection);
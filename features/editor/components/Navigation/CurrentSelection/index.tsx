import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import ProductSelection from './ProductSelection/ProductSelection';
import ProgramSelection from './ProgramSelection/ProgramSelection';
import ReadinessCheck from './ReadinessCheck/ReadinessCheck';
import MyProject from './MyProject/MyProject';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useConfiguratorState, useEditorActions, useEditorStore } from '@/features/editor/lib';
import { useI18n } from '@/shared/contexts/I18nContext';

type CurrentSelectionProps = {
  overlayContainerRef?: React.RefObject<HTMLDivElement | null>;
};

/**
 * CurrentSelection component
 * Simplified wizard with sub-step navigation
 */
function CurrentSelection({}: CurrentSelectionProps) {
  const { t } = useI18n();
  const { selectedProductMeta, programSummary } = useConfiguratorState();
  const isConfiguratorOpen = useEditorStore((state) => state.isConfiguratorOpen);
  const setupWizard = useEditorStore((state) => state.setupWizard);
  const actions = useEditorActions((a) => ({
    setIsConfiguratorOpen: a.setIsConfiguratorOpen,
    setSetupWizardStep: a.setSetupWizardStep,
    setProjectProfile: a.setProjectProfile,
    completeSetupWizard: a.completeSetupWizard,
  }));

  // Section navigation state for MyProject
  const [currentSection, setCurrentSection] = useState<1 | 2 | 3>(1);

  // Reset section when opening MyProject
  const handleMyProjectClick = () => {
    setCurrentSection(1);
    actions.setIsConfiguratorOpen(true);
    actions.setSetupWizardStep(1);
  };

  const handlePlanClick = () => {
    actions.setIsConfiguratorOpen(true);
    actions.setSetupWizardStep(3);
  };

  const handleProgramClick = () => {
    actions.setIsConfiguratorOpen(true);
    actions.setSetupWizardStep(2);
  };

  // Simple step navigation
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

  const handleComplete = () => {
    actions.completeSetupWizard();
    actions.setIsConfiguratorOpen(false);
  };

  // Toggle configurator and update wizard step
  const handleToggle = () => {
    actions.setIsConfiguratorOpen(!isConfiguratorOpen);
  };

  // Compact header - always shows "Current Selection:" 
  const CompactInfoRow = () => (
    <div className={`flex items-center gap-12 px-4 py-2 text-white w-full transition-all duration-300 rounded-lg ${
      isConfiguratorOpen 
        ? 'bg-gradient-to-br from-blue-950 via-blue-900 to-blue-950 border-2 border-blue-400 shadow-lg'  // Modal header style
        : 'bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900'  // Normal compact style
    }`}>
      <div className="text-white font-bold gap-4 text-lg whitespace-nowrap">
        {t('editor.desktop.selection.current' as any) || 'Current Selection:'}
      </div>
      
      <div className="flex items-center gap-14 text-sm ml-8 flex-grow">
        {/* My Project */}
        <div 
          className={`flex flex-col items-start text-left cursor-pointer hover:bg-white/10 p-2 rounded transition-colors ${
            setupWizard.currentStep === 1 ? 'bg-white/20' : ''
          }`}
          onClick={handleMyProjectClick}
        >
          <div className="flex items-center gap-2">
            <span className="text-white/70 font-medium text-xs mb-1">💼 {t('editor.desktop.myProject.title') || 'My Project'}</span>
            {setupWizard.currentStep === 1 && isConfiguratorOpen && (
              <span className="relative">
                <span className="absolute h-2 w-2 rounded-full bg-green-400 opacity-75 animate-subtle-pulse"></span>
                <span className="relative h-2 w-2 rounded-full bg-green-400 block"></span>
              </span>
            )}
          </div>
          {!isConfiguratorOpen && (
            <div className="text-white font-medium flex items-center gap-1">
              <MyProject />
            </div>
          )}
        </div>
        
        <div className="w-0.5 h-6 bg-white/30"></div>
        
        {/* Plan */}
        <div 
          className={`flex flex-col items-start text-left cursor-pointer hover:bg-white/10 p-2 rounded transition-colors ${
            setupWizard.currentStep === 3 ? 'bg-white/20' : ''
          }`}
          onClick={handlePlanClick}
        >
          <div className="flex items-center gap-2">
            <span className="text-white/70 font-medium text-xs mb-1">📋 Plan</span>
            {setupWizard.currentStep === 3 && isConfiguratorOpen && (
              <span className="relative">
                <span className="absolute h-2 w-2 rounded-full bg-green-400 opacity-75 animate-subtle-pulse"></span>
                <span className="relative h-2 w-2 rounded-full bg-green-400 block"></span>
              </span>
            )}
          </div>
          {!isConfiguratorOpen && (
            <div className="flex items-center gap-1">
              <span className="text-white font-medium truncate text-sm">
                {selectedProductMeta ? (t(selectedProductMeta.label as any) || selectedProductMeta.label) : 'No plan'}
              </span>
            </div>
          )}
        </div>
        
        <div className="w-0.5 h-6 bg-white/30"></div>
        
        {/* Program */}
        <div 
          className={`flex flex-col items-start text-left cursor-pointer hover:bg-white/10 p-2 rounded transition-colors ${
            setupWizard.currentStep === 2 ? 'bg-white/20' : ''
          }`}
          onClick={handleProgramClick}
        >
          <div className="flex items-center gap-2">
            <span className="text-white/70 font-medium text-xs mb-1">📚 {t('editor.desktop.selection.programLabel') || 'Program / Template'}</span>
            {setupWizard.currentStep === 2 && isConfiguratorOpen && (
              <span className="relative">
                <span className="absolute h-2 w-2 rounded-full bg-green-400 opacity-75 animate-subtle-pulse"></span>
                <span className="relative h-2 w-2 rounded-full bg-green-400 block"></span>
              </span>
            )}
          </div>
          {!isConfiguratorOpen && (
            <div className="text-white font-medium truncate flex items-center gap-1">
              <span className="truncate text-sm">
                {programSummary?.name || 'No program selected'}
              </span>
            </div>
          )}
        </div>
        
        <div className="w-0.5 h-6 bg-white/30"></div>
        
        {/* Readiness */}
        <div className="flex flex-col items-start text-left">
          <div className="flex items-center gap-2">
            <span className="text-white/70 font-medium text-xs mb-1">📊 Readiness</span>
          </div>
          {!isConfiguratorOpen && (
            <div className="text-white font-medium flex items-center gap-1">
              <ReadinessCheck />
            </div>
          )}
        </div>
        
        {/* Close button when modal is open */}
        {isConfiguratorOpen && (
          <button
            onClick={handleToggle}
            className="ml-auto text-white/60 hover:text-white text-xl leading-none transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );

  // Keep modal mounted during exit animation
  const [showModal, setShowModal] = useState(isConfiguratorOpen);
  
  useEffect(() => {
    if (isConfiguratorOpen) {
      setShowModal(true);
    }
  }, [isConfiguratorOpen]);

  const handleAnimationEnd = () => {
    if (!isConfiguratorOpen) {
      setShowModal(false);
    }
  };
  
  return (
    <div className="w-full relative">
      <CompactInfoRow />
      
      {/* Portal-based expansion that doesn't affect parent layout */}
      {showModal && (() => {
        // Get exact header position for precise alignment
        const headerEl = document.querySelector('header .flex-grow.flex.justify-center.px-6 .w-full.max-w-6xl');
        const rect = headerEl?.getBoundingClientRect();
        
        // Position modal slightly below header to avoid cutting
        const modalTop = (rect?.bottom || 60) + 2;
        
        return createPortal(
          <div 
            className={`fixed border-2 border-t-0 border-blue-400 rounded-b-lg bg-slate-900 shadow-2xl z-[1000] ${isConfiguratorOpen ? 'animate-modal-enter' : 'animate-modal-exit'}`}
            style={{
              top: `${modalTop}px`,
              left: `${rect?.left || 0}px`,
              width: `${rect?.width || 1200}px`,
              maxHeight: '80vh',
              overflow: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
            onAnimationEnd={handleAnimationEnd}
          >
            {/* Wizard content goes here */}
            <div className="px-4 py-4 bg-slate-800/50">
              <div className="w-full">
                {/* Step 1: My Project with sub-steps */}
                {setupWizard.currentStep === 1 && (
                  <>
                    <h2 className="text-2xl font-bold text-white mb-1 text-left">
                      {t('editor.desktop.preview.emptyState.cta') || 'Create Project'}
                    </h2>
                    <div className="border-b border-white/20 mb-2"></div>
                    <p className="text-white/60 text-sm mb-6">
                      {t('editor.desktop.myProject.subtitle') || 'Enter basic project data'}
                    </p>
                    <div className="w-full">
                      <MyProject 
                        mode="form" 
                        onSubmit={handleNextStep}
                        currentSection={currentSection}
                        onSectionChange={setCurrentSection}
                      />
                    </div>
                  </>
                )}
                
                {/* Step 2: Program Selection */}
                {setupWizard.currentStep === 2 && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2 text-left">Step 2: Target Selection</h3>
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
                      <h3 className="text-xl font-bold text-white mb-2 text-left">Step 3: Document Type</h3>
                      <p className="text-white/80 text-sm mb-4">
                        Choose your document template
                      </p>
                    </div>
                    <ProductSelection />
                  </div>
                )}
              </div>
            </div>
            
            {/* Navigation Buttons - Single CTA bar handling all navigation */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-white/20 bg-slate-800 sticky bottom-0">
              {setupWizard.currentStep === 1 ? (
                <>
                  <div>
                    {currentSection > 1 && (
                      <button
                        onClick={() => setCurrentSection((currentSection - 1) as 1 | 2 | 3)}
                        className="flex items-center gap-2 px-4 py-2 bg-white/20 text-white rounded-lg font-medium hover:bg-white/30 transition-colors"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        Previous
                      </button>
                    )}
                  </div>
                  
                  <div>
                    {currentSection < 3 ? (
                      <button
                        onClick={() => setCurrentSection((currentSection + 1) as 1 | 2 | 3)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                      >
                        Next
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={handleNextStep}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                      >
                        Continue to Program
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </>
              ) : setupWizard.currentStep === 2 ? (
                <>
                  <button
                    onClick={handlePrevStep}
                    className="flex items-center gap-2 px-4 py-2 bg-white/20 text-white rounded-lg font-medium hover:bg-white/30 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Project
                  </button>
                  
                  <button
                    onClick={handleNextStep}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    Continue to Templates
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handlePrevStep}
                    className="flex items-center gap-2 px-4 py-2 bg-white/20 text-white rounded-lg font-medium hover:bg-white/30 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Program
                  </button>
                  
                  <button
                    onClick={handleComplete}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                  >
                    Complete Setup
                  </button>
                </>
              )}
            </div>
          </div>,
          document.body
        );
      })()}
    </div>
  );
}

export default React.memo(CurrentSelection);

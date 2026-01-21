import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import ProductSelection from './ProductSelection/ProductSelection';
import ProgramSelection from './ProgramSelection/ProgramSelection';
import ReadinessCheck from './ReadinessCheck/ReadinessCheck';
import MyProject from './MyProject/MyProject';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useConfiguratorState, useEditorActions, useEditorState, useEditorStore } from '@/features/editor/lib';
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
  const { plan } = useEditorState();
  const actions = useEditorActions((a) => ({
    setIsConfiguratorOpen: a.setIsConfiguratorOpen,
    setSetupWizardStep: a.setSetupWizardStep,
    setProjectProfile: a.setProjectProfile,
    completeSetupWizard: a.completeSetupWizard,
  }));

  // Section navigation state for MyProject
  const [currentSection, setCurrentSection] = useState<1 | 2 | 3>(1);
  
  // Reset interaction tracking when navigating away or closing
  useEffect(() => {
    if (setupWizard.currentStep !== 1 || currentSection !== 1) {
      // Reset tracking when leaving MyProject or changing sections
    }
  }, [setupWizard.currentStep, currentSection]);

  // Simplified preview logic - show preview when My Project modal is open and on GeneralInfo section
  const showPreview = setupWizard.currentStep === 1 && 
                     currentSection === 1 && 
                     isConfiguratorOpen;

  // Reset section when opening MyProject
  const navigateToStep = (step: 1 | 2 | 3) => {
    actions.setIsConfiguratorOpen(true);
    actions.setSetupWizardStep(step);
  };

  const handleMyProjectClick = () => {
    setCurrentSection(1);
    navigateToStep(1);
  };

  const handleProgramClick = () => navigateToStep(2);
  const handlePlanClick = () => navigateToStep(3);

  // Simple step navigation with comprehensive validation
  const handleNextStep = () => {
    // Validate required fields when moving from My Project (step 1) to Program (step 2)
    if (setupWizard.currentStep === 1) {
      // Directly access the store to check form data
      const plan = useEditorStore.getState().plan;
      const titlePage = plan?.settings?.titlePage;
      
      // Required fields from General Info (Section 1)
      const title = titlePage?.title;
      const companyName = titlePage?.companyName;
      
      // Required fields from Project Profile (Section 2)
      const oneLiner = titlePage?.oneLiner;
      const confidentiality = titlePage?.confidentiality;
      
      // Check if we're moving from Section 1 to Section 2 (within same step)
      if (currentSection === 1) {
        // Validate General Info fields before allowing section navigation
        if (!title?.trim() || !companyName?.trim()) {
          alert('Please complete the required fields (Document Title and Author/Organization) before proceeding');
          return;
        }
      }
      
      // Check if we're moving to next STEP (MyProject → Program)
      if (currentSection === 3) { // Last section of MyProject
        // Validate ALL required fields from both sections
        const missingFields = [];
        
        if (!title?.trim()) missingFields.push('Document Title');
        if (!companyName?.trim()) missingFields.push('Author/Organization');
        if (!oneLiner?.trim()) missingFields.push('One-liner Description');
        if (!confidentiality) missingFields.push('Confidentiality Level');
        
        if (missingFields.length > 0) {
          alert(`Please complete the following required fields before proceeding: ${missingFields.join(', ')}`);
          return;
        }
      }
    }
    
    // Proceed to next step
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

  const handleToggle = () => actions.setIsConfiguratorOpen(!isConfiguratorOpen);

  // Section configuration for dynamic rendering
  const sections = [
    {
      key: 'project',
      step: 1,
      label: '💼 ' + (t('editor.desktop.myProject.title') || 'Mein Projekt'),
      isActive: setupWizard.currentStep === 1,
      onClick: handleMyProjectClick,
      renderContent: () => !isConfiguratorOpen && <MyProject mode="display" />
    },
    {
      key: 'program',
      step: 2,
      label: '📚 ' + (t('editor.desktop.selection.programLabel') || 'Programm / Vorlage'),
      isActive: setupWizard.currentStep === 2,
      onClick: handleProgramClick,
      renderContent: () => !isConfiguratorOpen && (
        <div className="text-white font-medium truncate flex items-center gap-1 max-w-[140px]">
          <span className="truncate text-sm overflow-hidden whitespace-nowrap block w-full" title={programSummary?.name || t('editor.desktop.selection.noProgram' as any) || 'Kein Programm ausgewählt'}>
            {programSummary?.name || t('editor.desktop.selection.noProgram' as any) || 'Kein Programm ausgewählt'}
          </span>
        </div>
      )
    },
    {
      key: 'plan',
      step: 3,
      label: '📋 ' + (t('editor.desktop.selection.productLabel') || 'Plan'),
      isActive: setupWizard.currentStep === 3,
      onClick: handlePlanClick,
      renderContent: () => !isConfiguratorOpen && (
        <div className="flex items-center gap-1 max-w-[140px]">
          <span className="text-white font-medium truncate text-sm overflow-hidden whitespace-nowrap block w-full" title={selectedProductMeta ? (t(selectedProductMeta.label as any) || selectedProductMeta.label) : t('editor.desktop.selection.noPlan' as any) || 'Kein Plan'}>
            {selectedProductMeta ? (t(selectedProductMeta.label as any) || selectedProductMeta.label) : t('editor.desktop.selection.noPlan' as any) || 'Kein Plan'}
          </span>
        </div>
      )
    }
  ];

  // Dynamic section renderer
  const renderSectionCard = (section: typeof sections[0]) => (
    <div 
      key={section.key}
      className={`flex flex-col items-start text-left cursor-pointer hover:bg-white/10 p-2 rounded transition-colors min-w-0 max-w-[160px] flex-shrink-0 ${
        section.isActive ? 'bg-white/20' : ''
      }`}
      onClick={section.onClick}
    >
      <div className="flex items-center gap-2">
        <span className="text-white/70 font-medium text-xs mb-1" title={section.label}>{section.label}</span>
        {section.isActive && isConfiguratorOpen && (
          <span className="relative">
            <span className="absolute h-2 w-2 rounded-full bg-green-400 opacity-75 animate-subtle-pulse"></span>
            <span className="relative h-2 w-2 rounded-full bg-green-400 block"></span>
          </span>
        )}
      </div>
      {section.renderContent()}
    </div>
  );

  // Compact header - always shows "Current Selection:" 
  const CompactInfoRow = () => (
    <div className={`flex items-center gap-16 px-4 py-2 text-white w-full transition-all duration-300 rounded-lg overflow-hidden ${
      isConfiguratorOpen 
        ? 'bg-gradient-to-br from-blue-950 via-blue-900 to-blue-950 border-2 border-blue-400 shadow-lg'  // Modal header style
        : 'bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900'  // Normal compact style
    }`}>
      <div className="text-white font-bold gap-4 text-lg whitespace-nowrap">
        {t('editor.desktop.selection.current' as any) || 'Current Selection:'}
      </div>
      
      <div className="flex items-center gap-8 text-sm ml-8 flex-grow min-w-0 overflow-hidden">
        {/* Dynamic section cards with separators */}
        {sections.map((section, index) => (
          <React.Fragment key={section.key}>
            {renderSectionCard(section)}
            {(index < sections.length - 1 || sections.length > 0) && (
              <div className="w-0.5 h-6 bg-white/30 mx-6"></div>
            )}
          </React.Fragment>
        ))}
        
        {/* Readiness */}
        <div className="flex flex-col items-start text-left min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-white/70 font-medium text-xs mb-1">📊 {t('editor.desktop.selection.readiness' as any) || 'Bereitschaft'}</span>
          </div>
          {!isConfiguratorOpen && (
            <div className="text-white font-medium flex items-center gap-1 min-w-0">
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

  // Simplified modal state management
  const [showModal, setShowModal] = useState(isConfiguratorOpen);
  
  useEffect(() => {
    if (isConfiguratorOpen) setShowModal(true);
  }, [isConfiguratorOpen]);

  const handleAnimationEnd = () => {
    if (!isConfiguratorOpen) setShowModal(false);
  };
  
  return (
    <div className="w-full relative" data-current-selection>
      <CompactInfoRow />
      
      {/* Portal-based expansion that doesn't affect parent layout */}
      {showModal && (() => {
        // Get CurrentSelection component position for modal alignment
        const currentSelectionEl = document.querySelector('[data-current-selection]') || 
                                 document.querySelector('.w-full.relative > div');
        const rect = currentSelectionEl?.getBoundingClientRect();
        
        // Position modal directly below CurrentSelection bar (no gap)
        const modalTop = rect?.bottom || 60;
        
        // Calculate responsive width based on CurrentSelection width
        const modalWidth = Math.min(rect?.width || 800, (typeof window !== 'undefined' ? window.innerWidth : 1200) - 32);
        const modalLeft = Math.max(16, (rect?.left || 0));
        
        // Backdrop with blur effect - exclude header area
        const backdropElement = isConfiguratorOpen ? (
          <div 
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[999]"
            style={{ 
              pointerEvents: 'none',
              top: `${modalTop}px`
            }}
          />
        ) : null;
        
        return (
          <>
            {/* Render backdrop via portal */}
            {typeof window !== 'undefined' && backdropElement && createPortal(backdropElement, document.body)}
            
            {createPortal(
              <div 
                className={`fixed border-2 border-t-0 border-blue-400 rounded-b-lg bg-slate-900 shadow-2xl z-[1000] ${isConfiguratorOpen ? 'animate-modal-enter' : 'animate-modal-exit'}`}
                style={{
                  top: `${modalTop}px`,
                  left: `${modalLeft}px`,
                  width: `${modalWidth}px`,
                  maxHeight: '70vh',
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
                            showPreview={showPreview}
                            onInteraction={() => {}}
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
                            onClick={() => {
                              // For the final "Continue to Program" button, validate ALL required fields
                              const plan = useEditorStore.getState().plan;
                              const titlePage = plan?.settings?.titlePage;
                              
                              const title = titlePage?.title;
                              const companyName = titlePage?.companyName;
                              const oneLiner = titlePage?.oneLiner;
                              const confidentiality = titlePage?.confidentiality;
                              
                              const missingFields = [];
                              
                              if (!title?.trim()) missingFields.push('Document Title');
                              if (!companyName?.trim()) missingFields.push('Author/Organization');
                              if (!oneLiner?.trim()) missingFields.push('One-liner Description');
                              if (!confidentiality) missingFields.push('Confidentiality Level');
                              
                              if (missingFields.length > 0) {
                                alert(`Please complete the following required fields before proceeding: ${missingFields.join(', ')}`);
                                return;
                              }
                              
                              // Proceed to next step
                              handleNextStep();
                            }}
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
            )}
          </>
        );
      })()}
    </div>
  );
}

export default React.memo(CurrentSelection);
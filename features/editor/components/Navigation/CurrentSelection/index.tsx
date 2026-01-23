import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import ProductSelection from './ProductSelection/ProductSelection';
import ProgramSelection from './ProgramSelection/ProgramSelection';
import ReadinessCheck from './ReadinessCheck/ReadinessCheck';
import MyProject from './MyProject/MyProject';
import { ArrowLeft, ArrowRight } from 'lucide-react';
// import { useEditorState } from '@/features/editor/lib/hooks/useEditorState'; // Not used in current implementation
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
  // const { plan } = useEditorState(); // Not used in current implementation
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

  const handleProgramClick = () => {
    // Only allow navigation to Program if My Project is completed
    const projectValidation = validateCurrentStep();
    if (setupWizard.currentStep >= 1 && projectValidation.isValid) {
      navigateToStep(2);
    } else {
      // Show validation error
      const notification = document.createElement('div');
      notification.className = 'fixed bg-red-500 text-white px-3 py-2 rounded-lg shadow-lg text-sm z-[10001]';
      
      const continueButton = document.querySelector('button.bg-green-600');
      if (continueButton) {
        const rect = continueButton.getBoundingClientRect();
        notification.style.left = `${rect.right + 10}px`;
        notification.style.top = `${rect.top}px`;
      }
      
      const title = t('editor.desktop.setupWizard.validation.projectName') || 'Please complete all requiered fields:';
      const fieldList = projectValidation.missingFields.map((field: string) => `- ${field}`).join('\n');
      
      notification.innerHTML = `
        <div>
          <div class="font-medium mb-1">${title}</div>
          <div class="whitespace-pre-line text-sm">${fieldList}</div>
        </div>
      `;
      
      document.body.appendChild(notification);
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 4000);
    }
  };
  
  const handlePlanClick = () => {
    // Only allow navigation to Plan if both My Project and Program are completed
    const projectValidation = validateCurrentStep();
    if (setupWizard.currentStep >= 2 && projectValidation.isValid && programSummary) {
      navigateToStep(3);
    } else {
      // Show appropriate error message
      const notification = document.createElement('div');
      notification.className = 'fixed bg-red-500 text-white px-3 py-2 rounded-lg shadow-lg text-sm z-[10001]';
      
      const continueButton = document.querySelector('button.bg-blue-600');
      if (continueButton) {
        const rect = continueButton.getBoundingClientRect();
        notification.style.left = `${rect.right + 10}px`;
        notification.style.top = `${rect.top}px`;
      }
      
      const message = setupWizard.currentStep < 2 
        ? 'Please complete Project setup first'
        : 'Please select a program first';
      
      notification.innerHTML = `
        <div class="font-medium">${message}</div>
      `;
      
      document.body.appendChild(notification);
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 4000);
    }
  };

  // Simple step validation - each step validates itself
  const validateCurrentStep = (): { isValid: boolean; missingFields: string[] } => {
    const missingFields: string[] = [];
      
    if (setupWizard.currentStep === 1) {
      // Validate My Project step
      const plan = useEditorStore.getState().plan;
      const titlePage = plan?.settings?.titlePage;
      const projectProfile = setupWizard.projectProfile;
        
      // General Info validation
      if (!titlePage?.title?.trim()) missingFields.push(t('editor.desktop.setupWizard.fields.projectName') || 'Document Title');
      if (!titlePage?.companyName?.trim()) missingFields.push(t('editor.desktop.setupWizard.fields.author') || 'Author/Organization');
        
      // Project Profile validation
      if (!projectProfile || !projectProfile.country || projectProfile.country === '') {
        missingFields.push(t('editor.desktop.setupWizard.fields.country') || 'Country');
      }
      if (!projectProfile || projectProfile.stage === undefined || projectProfile.stage === null) {  // Require explicit selection
        missingFields.push(t('editor.desktop.setupWizard.fields.stage') || 'Project Stage');
      }
    }
    // Other steps can be validated similarly
        
    return { 
      isValid: missingFields.length === 0, 
      missingFields 
    };
  };

  // Simple step navigation with validation
  const handleNextStep = () => {
    const validation = validateCurrentStep();
    
    if (!validation.isValid) {
      // Show validation notification
      const notification = document.createElement('div');
      notification.className = 'fixed bg-red-500 text-white px-3 py-2 rounded-lg shadow-lg text-sm z-[10001]';
      
      // Position to the right of the Continue button
      const continueButton = document.querySelector('button.bg-green-600');
      if (continueButton) {
        const rect = continueButton.getBoundingClientRect();
        notification.style.left = `${rect.right + 10}px`;
        notification.style.top = `${rect.top}px`;
      }
            
      const title = t('editor.desktop.setupWizard.validation.projectName') || 'Please complete all requiered fields:';
      const fieldList = validation.missingFields.map((field: string) => `- ${field}`).join('\n');
            
      notification.innerHTML = `
        <div>
          <div class="font-medium mb-1">${title}</div>
          <div class="whitespace-pre-line text-sm">${fieldList}</div>
        </div>
      `;
      
      // Add to document body (outside modal)
      document.body.appendChild(notification);
            
      // Auto-remove after 4 seconds
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 4000);
            
      return;
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
      isAccessible: true, // Always accessible
      onClick: handleMyProjectClick,
      renderContent: () => !isConfiguratorOpen && <MyProject mode="display" />
    },
    {
      key: 'program',
      step: 2,
      label: '📚 ' + (t('editor.desktop.selection.programLabel') || 'Programm / Vorlage'),
      isActive: setupWizard.currentStep === 2,
      isAccessible: setupWizard.currentStep >= 1 && validateCurrentStep().isValid, // Accessible after step 1 completion
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
      isAccessible: setupWizard.currentStep >= 2 && validateCurrentStep().isValid && !!programSummary, // Accessible after step 2 completion and program selection
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
  const renderSectionCard = (section: typeof sections[0]) => {
    const isAccessibleAndInactive = section.isAccessible && !section.isActive;
    
    return (
      <div 
        key={section.key}
        className={`flex flex-col items-start text-left p-2 rounded transition-colors min-w-0 max-w-[160px] flex-shrink-0 ${
          section.isActive 
            ? 'bg-white/20' 
            : section.isAccessible 
              ? 'hover:bg-white/10' 
              : 'opacity-50'
        }`}
        style={{
          cursor: isAccessibleAndInactive ? 'pointer' : section.isActive ? 'default' : 'not-allowed',
        }}
        onClick={section.isAccessible ? section.onClick : undefined}
      >
        <div className="flex items-center gap-2">
          <span className={`font-medium text-xs mb-1 ${section.isActive ? 'text-white' : section.isAccessible ? 'text-white/70' : 'text-white/40'}`} title={section.label}>
            {section.label}
          </span>
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
  };

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
                        {/* Row 1: Static Create Project header */}
                        <h2 className="text-2xl font-bold text-white mb-1 text-left">
                          {t('editor.desktop.preview.emptyState.cta') || 'Create Project'}
                        </h2>
                        <div className="border-b border-white/20 mb-2"></div>
                        
                        {/* Row 2: Description + Dynamic header closer together */}
                        <div className="flex items-center gap-8 mb-3">
                          <p className="text-white/60 text-sm flex-shrink-0">
                            {t('editor.desktop.myProject.subtitle') || 'Enter basic project data'}
                          </p>
                          <h2 className="text-xl font-bold text-white flex items-center gap-2 ml-4">
                            <span className="text-xl">
                              {currentSection === 1 && '📋'}
                              {currentSection === 2 && '🏢'}
                              {currentSection === 3 && '✨'}
                            </span>
                            <span>
                              {currentSection === 1 && (t('editor.desktop.myProject.sections.generalInfo') || 'General Information')}
                              {currentSection === 2 && (t('editor.desktop.myProject.sections.projectProfile') || 'Project Profile')}
                              {currentSection === 3 && (t('editor.desktop.myProject.sections.planningContext') || 'Planning Context')}
                            </span>
                          </h2>
                        </div>
                        <div className="w-full">
                          <MyProject 
                            mode="form" 
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
                            {t('editor.desktop.setupWizard.buttons.previous') || 'Previous'}
                          </button>
                        )}
                      </div>
                      
                      <div>
                        {currentSection < 3 ? (
                          <button
                            onClick={() => setCurrentSection((currentSection + 1) as 1 | 2 | 3)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                          >
                            {t('editor.desktop.setupWizard.buttons.next') || 'Next'}
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={handleNextStep}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                          >
                            {t('editor.desktop.setupWizard.buttons.next') || 'Continue to Program'}
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
                        {t('editor.desktop.setupWizard.buttons.previous') || 'Back to Project'}
                      </button>
                      
                      <button
                        onClick={handleNextStep}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                      >
                        {t('editor.desktop.setupWizard.buttons.next') || 'Continue to Templates'}
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
                        {t('editor.desktop.setupWizard.buttons.previous') || 'Back to Program'}
                      </button>
                      
                      <button
                        onClick={handleComplete}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                      >
                        {t('editor.desktop.setupWizard.buttons.complete') || 'Complete Setup'}
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
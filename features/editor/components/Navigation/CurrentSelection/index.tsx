import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import ProgramSelection from './ProgramSelection/ProgramSelection';
import BlueprintInstantiationStep from './ProductCreation/BlueprintInstantiation/BlueprintInstantiation';
import ReadinessCheck from './ReadinessCheck/ReadinessCheck';
import MyProject from './MyProject/MyProject';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useProject } from '@/platform/core/context/hooks/useProject';
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
  
  // All state from unified useProject store
  const documentStructure = useProject((state) => state.documentStructure);
  const setupWizardStep = useProject((state) => state.setupWizardStep);
  const projectProfile = useProject((state) => state.projectProfile);
  const editorMeta = useProject((state) => state.editorMeta);
  const selectedProgram = useProject((state) => state.selectedProgram);
  const setupWizardIsComplete = useProject((state) => state.setupWizardIsComplete);
  const isConfiguratorOpen = useProject((state) => state.isConfiguratorOpen);
  const plan = useProject((state) => state.planDocument);
  
  // Actions
  const setIsConfiguratorOpen = useProject((state) => state.setIsConfiguratorOpen);
  const setSetupWizardStep = useProject((state) => state.setSetupWizardStep);
  const completeSetupWizard = useProject((state) => state.completeSetupWizard);
  
  // For backward compatibility with code expecting programSummary
  const programSummary = selectedProgram;
  
  // For backward compatibility with code expecting selectedProductMeta
  const selectedProductMeta = plan ? { label: plan.title } : null;

  // Section navigation state for MyProject
  const [currentSection, setCurrentSection] = useState<1 | 2 | 3>(1);
  
  // Reset interaction tracking when navigating away or closing
  useEffect(() => {
    if (setupWizardStep !== 1 || currentSection !== 1) {
      // Reset tracking when leaving MyProject or changing sections
    }
  }, [setupWizardStep, currentSection]);

  // Simplified preview logic - show preview when My Project modal is open and on GeneralInfo section
  const showPreview = setupWizardStep === 1 && 
                     currentSection === 1 && 
                     isConfiguratorOpen;

  // Reset section when opening MyProject
  const navigateToStep = (step: 1 | 2 | 3) => {
    setIsConfiguratorOpen(true);
    setSetupWizardStep(step);
  };

  const handleMyProjectClick = () => {
    setCurrentSection(1);
    navigateToStep(1);
  };

  const handleProgramClick = () => {
    // Only allow navigation to Program if My Project is completed
    const projectValidation = validateCurrentStep();
    if (setupWizardStep >= 1 && projectValidation.isValid) {
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
    if (setupWizardStep >= 2 && projectValidation.isValid && programSummary) {
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
      
      const message = setupWizardStep < 2 
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

  // Unified validation for required project fields
  const validateCurrentStep = (): { isValid: boolean; missingFields: string[] } => {
    const missingFields: string[] = [];
      
    if (setupWizardStep === 1) {
      // Validate unified My Project step
      
      // Author (from editorMeta)
      if (!editorMeta?.author?.trim()) missingFields.push(t('editor.desktop.setupWizard.fields.author') || 'Author');
        
      // Project title (from projectProfile)
      if (!projectProfile?.projectName?.trim()) missingFields.push(t('editor.desktop.setupWizard.fields.projectName') || 'Project Title');
        
      // Project Location (🌍)
      if (!projectProfile || !projectProfile.country || projectProfile.country === '') {
        missingFields.push(t('editor.desktop.setupWizard.fields.country') || 'Project Location');
      }
      
      // Project Stage (🏗️)
      if (!projectProfile || projectProfile.stage === undefined || projectProfile.stage === null) {
        missingFields.push(t('editor.desktop.setupWizard.fields.stage') || 'Project Stage');
      }
      
      // Planning Timeline (📅)
      if (projectProfile?.planningHorizon === undefined || projectProfile?.planningHorizon === null) {
        missingFields.push(t('editor.desktop.setupWizard.fields.planningHorizon') || 'Planning Timeline');
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
    if (setupWizardStep < 3) {
      setSetupWizardStep((setupWizardStep + 1) as 1 | 2 | 3);
    }
  };

  const handlePrevStep = () => {
    if (setupWizardStep > 1) {
      setSetupWizardStep((setupWizardStep - 1) as 1 | 2 | 3);
    }
  };

  const handleComplete = () => {
    completeSetupWizard();
    setIsConfiguratorOpen(false);
  };

  const handleToggle = () => setIsConfiguratorOpen(!isConfiguratorOpen);

  // Determine completion status for each step
  const projectValidation = validateCurrentStep();
  const isProjectCompleted = setupWizardStep > 1 || (setupWizardStep === 1 && projectValidation.isValid);
  const isProgramCompleted = !!programSummary;
  const isPlanCompleted = setupWizardIsComplete;
  
  // Get source from documentStructure for UI display
  const docSource = documentStructure?.metadata?.source;
  
  // Section configuration for dynamic rendering
  const sections = [
    {
      key: 'project',
      step: 1,
      label: '💼 ' + (t('editor.desktop.myProject.title') || 'Mein Projekt'),
      isActive: setupWizardStep === 1,
      isCompleted: isProjectCompleted,
      isAccessible: true, // Always accessible
      onClick: handleMyProjectClick,
      renderContent: () => !isConfiguratorOpen && <MyProject mode="display" />
    },
    {
      key: 'program',
      step: 2,
      label: '📚 ' + (t('editor.desktop.selection.programLabel') || 'Programm / Vorlage'),
      isActive: setupWizardStep === 2,
      isCompleted: isProgramCompleted,
      isAccessible: setupWizardStep >= 2, // Accessible after step 1 completion
      onClick: handleProgramClick,
      renderContent: () => !isConfiguratorOpen && (
        <div className="text-white font-bold truncate flex items-center justify-center gap-1 max-w-[140px]">
          <span className="truncate text-sm overflow-hidden whitespace-nowrap block w-full" title={
            docSource === 'template' 
              ? (t('editor.desktop.selection.customUpload' as any) || 'Custom Upload')
              : docSource === 'upload'
              ? (t('editor.desktop.program.panels.standardStructure' as any) || 'Standard Structure')
              : programSummary?.name || t('editor.desktop.selection.noProgram' as any) || 'Kein Programm ausgewählt'
          }>
            {docSource === 'template' 
              ? (t('editor.desktop.selection.customUpload' as any) || 'Custom Upload')
              : docSource === 'upload'
              ? (t('editor.desktop.program.panels.standardStructure' as any) || 'Standard Structure')
              : programSummary?.name || t('editor.desktop.selection.noProgram' as any) || 'Kein Programm ausgewählt'}
          </span>
        </div>
      )
    },
    {
      key: 'plan',
      step: 3,
      label: '📋 ' + (t('editor.desktop.selection.productLabel') || 'Plan'),
      isActive: setupWizardStep === 3,
      isCompleted: isPlanCompleted,
      isAccessible: setupWizardStep >= 3 && !!programSummary, // Accessible after step 2 completion and program selection
      onClick: handlePlanClick,
      renderContent: () => !isConfiguratorOpen && (
        <div className="text-white font-bold truncate flex items-center justify-center gap-1 max-w-[140px]">
          <span className="truncate text-sm overflow-hidden whitespace-nowrap block w-full" title={
            documentStructure?.documents && documentStructure.documents.length > 0
              ? (() => {
                  const docCount = documentStructure.documents.length;
                  if (docCount === 1) {
                    return documentStructure.documents[0]?.name || t('editor.desktop.selection.corporateStrategyDocument' as any) || 'Corporate Strategy Document';
                  } else {
                    return `${docCount} ${t('editor.desktop.selection.documentsLabel' as any) || 'Documents'}`;
                  }
                })()
              : selectedProductMeta 
                ? (t(selectedProductMeta.label as any) || selectedProductMeta.label)
                : t('editor.desktop.selection.noPlan' as any) || 'Kein Plan'
          }>
            {documentStructure?.documents && documentStructure.documents.length > 0
              ? (() => {
                  const docCount = documentStructure.documents.length;
                  if (docCount === 1) {
                    return documentStructure.documents[0]?.name || t('editor.desktop.selection.corporateStrategyDocument' as any) || 'Corporate Strategy Document';
                  } else {
                    return `${docCount} ${t('editor.desktop.selection.documentsLabel' as any) || 'Documents'}`;
                  }
                })()
              : selectedProductMeta 
                ? (t(selectedProductMeta.label as any) || selectedProductMeta.label)
                : t('editor.desktop.selection.noPlan' as any) || 'Kein Plan'}
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
        className={`flex flex-col items-center text-center p-2 rounded transition-colors min-w-0 max-w-[160px] flex-shrink-0 ${
          section.isActive && !section.isCompleted
            ? 'bg-white/20' 
            : section.isAccessible 
              ? 'hover:bg-white/10' 
              : 'opacity-50'
        }`}
        style={{
          cursor: isAccessibleAndInactive ? 'pointer' : section.isActive && !section.isCompleted ? 'default' : 'pointer',
        }}
        onClick={section.isAccessible ? section.onClick : undefined}
      >
        <div className="flex items-center gap-1">
          <span className={`font-medium text-xs mb-1 ${section.isActive && !section.isCompleted ? 'text-white font-bold' : section.isAccessible ? 'text-white/70' : 'text-white/40'}`} title={section.label}>
            {section.label}
          </span>
          {section.isCompleted && (
            <span className="text-green-500 text-xs" style={{ lineHeight: 'normal', verticalAlign: 'middle' }}>✓</span>
          )}
          {section.isActive && isConfiguratorOpen && !section.isCompleted && (
            <span className="relative">
              <span className="relative h-2 w-2 rounded-full bg-green-400 block animate-pulse" ></span>
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
              <div className="w-0.5 h-6 bg-white/20 mx-6"></div>
            )}
          </React.Fragment>
        ))}
        
        {/* Readiness */}
        <div className="flex flex-col items-center text-center min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-white/70 font-medium text-xs mb-1">📊 {t('editor.desktop.selection.readiness' as any) || 'Bereitschaft'}</span>
          </div>
          {!isConfiguratorOpen && (
            <div className="text-white font-bold flex items-center justify-center gap-1 min-w-0 w-full">
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
                    {setupWizardStep === 1 && (
                      <>
                        {/* Row 1: Static Create Project header */}
                        <h2 className="text-2xl font-bold text-white mb-1 text-left">
                          {t('editor.desktop.preview.emptyState.cta') || 'Create Project'}
                        </h2>
                        <div className="border-b border-white/20 mb-2"></div>
                        
                        <p className="text-white/60 text-sm mb-4">
                          {t('editor.desktop.myProject.subtitle') || 'Enter basic project data'}
                        </p>
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
                    {setupWizardStep === 2 && (
                      <div className="space-y-6">
                        <ProgramSelection onNavigateToBlueprint={() => setSetupWizardStep(3)} />
                      </div>
                    )}
                    
                    {/* Step 3: Blueprint Instantiation */}
                    {setupWizardStep === 3 && (
                      <BlueprintInstantiationStep 
                        onComplete={handleComplete}
                        onBack={handlePrevStep}
                      />
                    )}
                  </div>
                </div>
                
                {/* Navigation Buttons - Single CTA bar handling all navigation */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-white/20 bg-slate-800 sticky bottom-0">
                  {setupWizardStep === 1 ? (
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
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-900 transition-colors"
                          >
                            {t('editor.desktop.setupWizard.buttons.next') || 'Continue to Program'}
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </>
                  ) : setupWizardStep === 2 ? (
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
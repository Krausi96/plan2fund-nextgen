import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useI18n } from '@/shared/contexts/I18nContext';
import { useProject } from '@/platform/core/context/hooks/useProject';
import { StandardStructurePanel } from './components/panels/StandardStructurePanel';
import { ProgramSummaryPanel } from './components/panels/ProgramSummaryPanel';
import { ProgramFinder, EditorProgramFinder } from './components/finder';
import { DocumentUploadPanel } from './components/options/DocumentUploadOption';
import { FreeOption } from './components/options/FreeOption';
import { normalizeFundingProgram, generateProgramSummary } from '@/features/editor/lib';
import { buildDocumentStructure } from '@/platform/generation';
import { enhanceWithSpecialSections } from '@/platform/analysis/internal/document-flows/sections/enhancement/sectionEnhancement';
import { TemplateStructurePanel } from './components/panels/TemplateStructurePanel';
import { hasFundingOverlay, getFundingOverlayInfo } from '@/platform/analysis';


interface OptionSelectorProps {
  selectedOption: 'program' | 'template' | 'free' | null;
  onSelect: (option: 'program' | 'template' | 'free') => void;
}

function OptionSelector({ selectedOption, onSelect }: OptionSelectorProps) {
  const { t } = useI18n();

  return (
    <div className="bg-slate-800/30 rounded-lg p-4 mb-4 border border-white/10">        
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Option A: Select Program */}
        <div 
          className={`group relative flex flex-col items-start p-4 bg-slate-800/50 rounded-lg transition-all duration-300 ease-out cursor-pointer ${
            selectedOption === 'program' 
              ? 'border-blue-500 bg-blue-500/30 ring-2 ring-blue-500/50 ring-offset-2 ring-offset-slate-800/50' 
              : 'border border-white/20 opacity-60 hover:opacity-100 backdrop-blur-md'
          }`}
          onClick={() => onSelect('program')}
        >
          <div className="flex flex-row items-center">
            <div className="flex-shrink-0 inline-flex items-center justify-center w-9 h-9 mr-4 rounded-md bg-blue-500/20 border border-blue-400/30 text-blue-200 text-lg">
              📄
            </div>
            <h3 className="text-white font-black text-xl text-left">
              {t('editor.desktop.program.optionA.title' as any) || 'Select Program'}
            </h3>
          </div>
          <p className="text-slate-300/70 text-xs text-left leading-relaxed mt-2 max-w-full line-clamp-3">
            {t('editor.desktop.program.optionA.description' as any) || 'Choose a funding, bank or investor program. The program determines which documents and structure are needed. 📋 Sets up document requirements.'}
          </p>
        </div>
        
        {/* Option B: Use Own Template */}
        <div 
          className={`group relative flex flex-col items-start p-4 bg-slate-800/50 rounded-lg transition-all duration-300 ease-out cursor-pointer ${
            selectedOption === 'template' 
              ? 'border-purple-500 bg-purple-500/30 ring-2 ring-purple-500/50 ring-offset-2 ring-offset-slate-800/50' 
              : 'border border-white/20 opacity-60 hover:opacity-100 backdrop-blur-md'
          }`}
          onClick={() => onSelect('template')}
        >
          <div className="flex flex-row items-center">
            <div className="flex-shrink-0 inline-flex items-center justify-center w-9 h-9 mr-4 rounded-md bg-purple-500/20 border border-purple-400/30 text-purple-200 text-lg">
              🧩
            </div>
            <h3 className="text-white font-black text-xl text-left">
              {t('editor.desktop.program.optionB.title' as any) || 'Use Own Template'}
            </h3>
          </div>
          <p className="text-slate-300/70 text-xs text-left leading-relaxed mt-2 max-w-full line-clamp-3">
            {t('editor.desktop.program.optionB.description' as any) || 'Upload your own template (e.g. DOCX/PDF). The structure of the template will be adopted.'}
          </p>
        </div>
        
        {/* Option C: Start Free (Custom) */}
        <div 
          className={`group relative flex flex-col items-start p-4 bg-slate-800/50 rounded-lg transition-all duration-300 ease-out cursor-pointer ${
            selectedOption === 'free' 
              ? 'border-green-500 bg-green-500/30 ring-2 ring-green-500/50 ring-offset-2 ring-offset-slate-800/50' 
              : 'border border-white/20 opacity-60 hover:opacity-100 backdrop-blur-md'
          }`}
          onClick={() => onSelect('free')}
        >
          <div className="flex flex-row items-center">
            <div className="flex-shrink-0 inline-flex items-center justify-center w-9 h-9 mr-4 rounded-md bg-green-500/20 border border-green-400/30 text-green-200 text-lg">
              📋
            </div>
            <h3 className="text-white font-black text-xl text-left">
              {t('editor.desktop.program.optionC.title' as any) || 'Start Free (Custom)'}
            </h3>
          </div>
          <p className="text-slate-300/70 text-xs text-left leading-relaxed mt-2 max-w-full line-clamp-3">
            {t('editor.desktop.program.optionC.description' as any) || 'Start with a neutral standard structure. Build freely without predefined requirements.'}
          </p>
        </div>
      </div>
    </div>
  );
}

interface ProgramSelectionProps {
  onConnectProgram?: (value: any) => void;
  onNavigateToBlueprint?: () => void;
}

export default function ProgramSelection({
  onConnectProgram,
  onNavigateToBlueprint
}: ProgramSelectionProps) {
  // Access state from unified useProject store
  const selectProgram = useProject((state) => state.selectProgram);
  const setDocumentStructure = useProject((state) => state.setDocumentStructure);
  const setSetupStatus = useProject((state) => state.setSetupStatus);
  const setSetupDiagnostics = useProject((state) => state.setSetupDiagnostics);
  const setInferredProductType = useProject((state) => state.setInferredProductType);

  const { t } = useI18n();
  const [selectedOption, setSelectedOption] = useState<'program' | 'template' | 'free' | null>(null);
  const [activeTab, setActiveTab] = useState<'search' | 'wizard'>('search');
  const [programSummary, setProgramSummary] = useState<any>(null);
  const [overlayMode, setOverlayMode] = useState(false);
  
  // Access existing document structure from store (for overlay mode)
  const existingDocumentStructure = useProject((state) => state.documentStructure);
  
  // DEBUG: Log documentStructure changes
  useEffect(() => {
    console.log('[DocumentStructure] Updated:', {
      exists: !!existingDocumentStructure,
      source: existingDocumentStructure?.metadata?.source,
      sectionsCount: existingDocumentStructure?.sections?.length
    });
  }, [existingDocumentStructure]);
  
  // Refs to always have current values in callbacks
  const overlayModeRef = useRef(overlayMode);
  const existingDocumentStructureRef = useRef(existingDocumentStructure);
  
  // Update refs whenever values change
  useEffect(() => {
    console.log('[Refs] Updating overlayModeRef:', overlayMode);
    overlayModeRef.current = overlayMode;
  }, [overlayMode]);
  
  useEffect(() => {
    console.log('[Refs] Updating existingDocumentStructureRef:', {
      exists: !!existingDocumentStructure,
      source: existingDocumentStructure?.metadata?.source
    });
    existingDocumentStructureRef.current = existingDocumentStructure;
  }, [existingDocumentStructure]);

  // Unified function to handle program data regardless of source
  const processProgramData = async (program: any) => {
    // Automatically select the program option when a program is chosen
    setSelectedOption('program');
    
    console.log('[processProgramData] Input program:', {
      id: program.id,
      name: program.name,
      hasAppReqs: !!program.applicationRequirements,
      sectionsCount: program.applicationRequirements?.sections?.length || 0,
      documentsCount: program.applicationRequirements?.documents?.length || 0,
    });
    
    try {
      // Generate document structure using new pipeline
      console.log('[processProgramData] Step 1: normalizing...');
      const fundingProgram = normalizeFundingProgram(program);
      console.log('[processProgramData] Step 1 done');
      
      // PHASE 2: Blueprint API call disabled
      // System now uses deterministic structure + requirement enrichment only
      // Blueprint generation is redundant — structure comes from templates + program.applicationRequirements
      // Requirements enriched by enrichAllSectionRequirementsAtOnce() in generator.ts
      /*
      console.log('[processProgramData] Step 2a: Calling blueprint API for LLM-generated sections...');
      // CRITICAL: Call blueprint API to get LLM-generated sections with requirements
      try {
        // Send ONLY clean program info, not full fundingProgram
        const cleanProgramInfo = {
          programName: fundingProgram.name,
          description: fundingProgram.rawData?.description || fundingProgram.description || '',
          deliverables: fundingProgram.deliverables || [],
          fundingType: fundingProgram.type || 'grant',
          organization: fundingProgram.organization || 'Unknown',
          region: fundingProgram.region || 'Global'
        };
        
        const blueprintRes = await fetch('/api/programs/blueprint', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            programInfo: cleanProgramInfo,
            programId: program.id,
          })
        });
        
        console.log('[processProgramData] Blueprint API response status:', blueprintRes.status);
        
        if (!blueprintRes.ok) {
          console.error('[processProgramData] Blueprint API HTTP error:', blueprintRes.status, blueprintRes.statusText);
        } else {
          const blueprintData = await blueprintRes.json();
          console.log('[processProgramData] Step 2a: Blueprint parsed, success:', blueprintData.success);
          console.log('[processProgramData] Blueprint sections count:', blueprintData.blueprint?.applicationRequirements?.sections?.length || 0);
          
          // Merge LLM-generated sections into program
          if (blueprintData.blueprint?.applicationRequirements?.sections) {
            fundingProgram.applicationRequirements.sections = blueprintData.blueprint.applicationRequirements.sections;
            console.log('[processProgramData] Updated fundingProgram with', blueprintData.blueprint.applicationRequirements.sections.length, 'LLM sections');
          }
        }
      } catch (apiError) {
        console.error('[processProgramData] Blueprint API fetch error:', apiError instanceof Error ? apiError.message : String(apiError));
      }
      */
      
      console.log('[processProgramData] Step 2b: generating DocumentStructure...');
      const documentStructure = await buildDocumentStructure({
        fundingProgram
      });
      console.log('[processProgramData] Step 2b done, sections:', documentStructure.sections?.length);
      
      console.log('[processProgramData] Step 3: enhancing with special sections...');
      const enhancedDocumentStructure = enhanceWithSpecialSections(documentStructure, t);
      console.log('[processProgramData] Step 3 done');
      
      // Update wizard state with document setup data
      selectProgram(fundingProgram);
      setDocumentStructure(enhancedDocumentStructure);

      // Update setup diagnostics
      setSetupStatus('draft');
      setSetupDiagnostics({
        warnings: program.confidenceScore < 80 ? ['Limited program information available'] : [],
        missingFields: [],
        confidence: program.confidenceScore || 90
      });
      
      // Step 4: Create legacy-compatible ProgramSummary for backward compatibility
      const programSummary = generateProgramSummary(program);
      
      // Only call the external callback if provided, otherwise update local state
      if (onConnectProgram) {
        onConnectProgram(programSummary);
      } else {
        setProgramSummary(programSummary);
      }
      
    } catch (error) {
      console.error('[processProgramData] ERROR:', error instanceof Error ? error.message : String(error));
      console.error('[processProgramData] Full:', error);
      alert('Failed to process the selected program. Please try again or contact support.');
      // Still provide basic connection as fallback
      const fallbackSummary = {
        id: program.id,
        name: program.name,
        type: program.type || 'grant',
        organization: program.organization,
        setupStatus: 'none' as const
      };
      
      if (onConnectProgram) {
        onConnectProgram(fallbackSummary);
      } else {
        setProgramSummary(fallbackSummary);
      }
    }
  };

  const handleConnectProgram = (program: any) => {
    // Process the program data using the unified function
    processProgramData(program);
  };


  // Listen for "Connect funding program" event from TemplateStructurePanel
  useEffect(() => {
    const handleOpenProgramFinder = (event: CustomEvent) => {
      const mode = event.detail?.mode;
      console.log('[openProgramFinder] Event received:', { mode });
      console.log('[openProgramFinder] Current existingDocumentStructure:', {
        exists: !!existingDocumentStructure,
        source: existingDocumentStructure?.metadata?.source
      });

      if (mode === 'overlay') {
        // Open program finder in overlay mode
        // Keep selectedOption as 'template' - we're overlaying funding on existing template
        console.log('[openProgramFinder] Setting overlayMode to TRUE');
        setOverlayMode(true);
        setActiveTab('search');
        console.log('[openProgramFinder] Overlay mode activated, keeping template context');
      }
    };
    
    window.addEventListener('openProgramFinder', handleOpenProgramFinder as EventListener);
    return () => window.removeEventListener('openProgramFinder', handleOpenProgramFinder as EventListener);
  }, [existingDocumentStructure, setOverlayMode, setActiveTab]);

  // Handle program initialization from Reco/myProject flow
  useEffect(() => {
    // Check for program selected in Reco/myProject flow
    const savedProgram = localStorage.getItem('selectedProgram');
    if (savedProgram && !programSummary) {
      try {
        const programData = JSON.parse(savedProgram);
        console.log('🔄 Initializing from saved program:', programData);
        
        // Process the loaded program data using the same function
        processProgramData(programData);
        
        localStorage.removeItem('selectedProgram'); // Clean up
      } catch (error) {
        console.error('❌ Failed to initialize from saved program:', error);
      }
    }
  }, [programSummary, processProgramData]);

  const handleCloseProgramFinder = () => {
    setActiveTab('search');
    // Clear overlay mode when closing finder
    setOverlayMode(false);
  };

  // Updated handleProgramSelect to use the unified processing function
  const handleProgramSelect = useCallback((program: any) => {
    // Use refs to get current values
    const currentOverlayMode = overlayModeRef.current;
    const currentExistingDocumentStructure = existingDocumentStructureRef.current;
    
    console.log('═══════════════════════════════════════════════════');
    console.log('[handleProgramSelect] Program selected:', program.name);
    console.log('[handleProgramSelect] overlayModeRef:', currentOverlayMode);
    console.log('[handleProgramSelect] existingDocumentStructure exists:', !!currentExistingDocumentStructure);
    console.log('[handleProgramSelect] existingDocumentStructure source:', currentExistingDocumentStructure?.metadata?.source);
    console.log('[handleProgramSelect] existingDocumentStructure sections:', currentExistingDocumentStructure?.sections?.length);
    
    // Check if we should skip API call and use overlay mode
    // This happens when:
    // 1. overlayMode is true AND documentStructure exists (user explicitly opened overlay)
    // 2. OR documentStructure exists with source='document' AND overlayMode is false (auto-overlay case)
    const shouldOverlay = (currentOverlayMode && currentExistingDocumentStructure) || 
                          (!currentOverlayMode && currentExistingDocumentStructure?.metadata?.source === 'template');
    
    console.log('[handleProgramSelect] shouldOverlay calculation:');
    console.log('  - (overlayMode && docStructure):', currentOverlayMode && !!currentExistingDocumentStructure);
    console.log('  - (!overlayMode && source===template):', !currentOverlayMode, currentExistingDocumentStructure?.metadata?.source === 'template');
    console.log('  - FINAL shouldOverlay:', shouldOverlay);
    console.log('═══════════════════════════════════════════════════');
    
    if (shouldOverlay && currentExistingDocumentStructure) {
      console.log('[handleProgramSelect] >>> ENTERING OVERLAY MODE - skipping API call <<<');
      
      // Handle async overlay in a separate function
      const handleOverlay = async () => {
        try {
          // Normalize the program
          const fundingProgram = normalizeFundingProgram(program);
          console.log('[handleProgramSelect] fundingProgram requirements:', fundingProgram.applicationRequirements?.sections?.length);
          
          // Build overlay through unified builder
          const updatedStructure = await buildDocumentStructure({
            existingStructure: currentExistingDocumentStructure,
            fundingProgram
          });
          
          // Calculate added sections for diagnostics
          const originalSectionCount = currentExistingDocumentStructure.sections.length;
          const updatedSectionCount = updatedStructure.sections.length;
          const addedSections = updatedSectionCount - originalSectionCount;
          const addedSectionsList = Array(addedSections).fill('').map((_, i) => `Added section ${i + 1}`);
          
          console.log('[handleProgramSelect] Overlay complete:', {
            addedSections: addedSectionsList.length,
            totalSections: updatedStructure.sections.length
          });
          
          // Update store with overlaid structure
          setDocumentStructure(updatedStructure);
          setSetupStatus('draft');
          
          // Update program selection
          selectProgram(fundingProgram);
          
          // Update diagnostics
          setSetupDiagnostics({
            warnings: [],
            missingFields: addedSectionsList,
            confidence: 95
          });
          
          // Clear overlay mode and close finder
          console.log('[handleProgramSelect] Clearing overlay mode and closing finder');
          setOverlayMode(false);
          handleCloseProgramFinder();
        } catch (error) {
          console.error('[handleProgramSelect] Overlay failed:', error);
          
          // Fall through to normal processing
          console.log('[handleProgramSelect] Falling back to normal mode');
          processProgramData(program);
          
          handleCloseProgramFinder();
        }
      };
      
      handleOverlay();
      return;
    }
    
    // NORMAL MODE: Build new structure from program (API call is made here)
    console.log('[handleProgramSelect] >>> NORMAL MODE - API call WILL be made <<<');
    processProgramData(program);
    
    console.log('[handleProgramSelect] Closing finder');
    handleCloseProgramFinder();
  }, [selectProgram, setDocumentStructure, setSetupStatus, setSetupDiagnostics, handleCloseProgramFinder, processProgramData, overlayModeRef, existingDocumentStructureRef]);

  return (
    <div className="relative mb-6 pb-6">

      
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-2xl font-bold text-white">
            {t('editor.desktop.program.header' as any) || 'Document Setup'}
          </h2>
        </div>
        <div className="border-b border-white/20 mb-2"></div>
        <p className="text-white/70 text-sm">
          {t('editor.desktop.program.subtitle' as any) || 'Choose how your document structure and requirements are defined.'}
        </p>
      </div>
      
      {/* Option Selector */}
      <OptionSelector 
        selectedOption={selectedOption} 
        onSelect={(option) => {
          // Clear overlay mode when switching options
          setOverlayMode(false);
          
          // If switching to different option, clear all state first
          if (selectedOption && selectedOption !== option) {
            // Clear all related state
            selectProgram(null);
            setDocumentStructure(null);
            setSetupStatus('none');
            setSetupDiagnostics(null);
            setInferredProductType(null);
          }
          
          // Set new selection
          setSelectedOption(option);
        }} 
      />
      
      {/* Two-Column Layout */}
      <div className="flex flex-col lg:flex-row gap-6 mt-4">
        {/* Main Content Column (70%) */}
        <div className="lg:w-7/12">
          {/* Selected Option Content */}
          {selectedOption === 'free' && !overlayMode ? (
            // Free option without the outer container
            <FreeOption 
              onStructureSelected={(structure) => {
                console.log('Free structure selected:', structure);
              }}
              onProductSelected={(product) => {
                console.log('Product selected in free option:', product);
              }}
              onNavigateToBlueprint={onNavigateToBlueprint}
            />
          ) : selectedOption && (
            // Apply the container for 'program' and 'template' options
            <div className="bg-slate-800/30 rounded-xl border border-white/10 p-6">
              
              {/* Program Tabs - only show when Program option is selected */}
              {selectedOption === 'program' && (
                <div className="mb-6">
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => {
                        setActiveTab('search');
                        // Clear program and document structure when switching tabs
                        selectProgram(null);
                        setDocumentStructure(null);
                      }}
                      className={`inline-flex items-center gap-2 px-4 py-1.5 font-medium rounded-lg transition-colors text-sm ${activeTab === 'search' ? 'bg-blue-600 text-white' : 'border border-white/30 text-white hover:border-white/50 hover:bg-white/10'}`}
                    >
                      <span>🔍</span>
                      {t('editor.desktop.program.searchPrograms' as any) || 'Search Programs'}
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab('wizard');
                        // Only clear program, PRESERVE documentStructure (needed for overlay)
                        selectProgram(null);
                        // Don't clear documentStructure - it may be from uploaded document for overlay
                      }}
                      className={`inline-flex items-center gap-2 px-4 py-1.5 font-medium rounded-lg transition-colors text-sm ${activeTab === 'wizard' ? 'bg-purple-600 text-white' : 'border border-white/30 text-white hover:border-white/50 hover:bg-white/10'}`}
                    >
                      <span>🧠</span>
                      {t('editor.desktop.program.recoWizard' as any) || 'Reco Wizard'}
                    </button>
                  </div>
                  
                  {/* Dynamic Content Below Tabs - SAME CONTAINER */}
                  <div className="mt-4 border-t border-white/10 pt-2">
                    {activeTab === 'search' && (
                      <div>                        
                        <ProgramFinder 
                          onProgramSelect={handleProgramSelect}
                          onClose={handleCloseProgramFinder}
                          overlayMode={overlayMode}
                        />
                      </div>
                    )}
                    

                    
                    {activeTab === 'wizard' && (
                      <div>
                        <div className="w-full">
                          <EditorProgramFinder
                            onProgramSelect={(program: any) => {
                              // Use refs to get current values
                              const currentOverlayMode = overlayModeRef.current;
                              const currentExistingDocumentStructure = existingDocumentStructureRef.current;
                              
                              console.log('═══════════════════════════════════════════════════');
                              console.log('[EditorProgramFinder] Program selected:', program.name);
                              console.log('[EditorProgramFinder] overlayMode:', currentOverlayMode);
                              console.log('[EditorProgramFinder] existingDocumentStructure exists:', !!currentExistingDocumentStructure);
                              console.log('[EditorProgramFinder] source:', currentExistingDocumentStructure?.metadata?.source);
                              
                              // Check if we should skip API call and use overlay mode
                              const shouldOverlay = (currentOverlayMode && currentExistingDocumentStructure) || 
                                                    (!currentOverlayMode && currentExistingDocumentStructure?.metadata?.source === 'template');
                              
                              console.log('[EditorProgramFinder] shouldOverlay:', shouldOverlay);
                              console.log('═══════════════════════════════════════════════════');
                              
                              if (shouldOverlay && currentExistingDocumentStructure) {
                                console.log('[EditorProgramFinder] >>> ENTERING OVERLAY MODE <<<');
                                
                                // Overlay mode - handle async operation
                                const handleOverlay = async () => {
                                  try {
                                    const fundingProgram = normalizeFundingProgram(program);
                                    const updatedStructure = await buildDocumentStructure({
                                      existingStructure: currentExistingDocumentStructure,
                                      fundingProgram
                                    });
                                    setDocumentStructure(updatedStructure);
                                    selectProgram(fundingProgram);
                                    setSetupStatus('draft');
                                    
                                    setOverlayMode(false);
                                    setActiveTab('search');
                                  } catch (error) {
                                    console.error('Overlay failed:', error);
                                    // Fall back to normal processing
                                    console.log('[EditorProgramFinder] Falling back to normal mode');
                                    processProgramData(program);
                                  }
                                };
                                
                                handleOverlay();
                                return;
                              }
                              
                              // Normal mode - API call WILL be made
                              console.log('[EditorProgramFinder] >>> NORMAL MODE - API call WILL be made <<<');
                              processProgramData(program);
                            }}
                            onClose={() => {
                              setOverlayMode(false);
                              setActiveTab('search');
                            }}
                            overlayMode={overlayMode}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Template Content - DocumentUploadOption with overlay mode */}
              {selectedOption === 'template' && (
                <div className="relative w-full">
                  {!overlayMode ? (
                    <DocumentUploadPanel 
                      onNavigateToBlueprint={onNavigateToBlueprint}
                    />
                  ) : (
                    <div className="bg-slate-800/50 rounded-xl border border-white/10 p-6">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-white font-bold">Select Funding Program</h3>
                        <button 
                          onClick={handleCloseProgramFinder}
                          className="text-white/60 hover:text-white px-2 text-lg"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="max-h-[600px] overflow-auto">
                        <ProgramFinder 
                          onProgramSelect={handleProgramSelect}
                          onClose={handleCloseProgramFinder}
                          overlayMode={overlayMode}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}      
        </div>
        
        {/* Dynamic Panel Column (30%) */}
        <div className="lg:w-5/12">
          {selectedOption === 'template' ? (
            <TemplateStructurePanel 
              selectedOption={selectedOption}
              onClearTemplate={() => {
                setDocumentStructure(null);
                setSetupStatus('none');
                setSetupDiagnostics(null);
              }}
              showHeader={true}
            />
          ) : selectedOption === 'program' ? (
            <ProgramSummaryPanel 
              onClear={() => {
                selectProgram(null);
                setDocumentStructure(null);
                setSetupStatus('none');
                setSetupDiagnostics(null);
                if (typeof window !== 'undefined') {
                  localStorage.removeItem('selectedProgram');
                }
                setOverlayMode(false);
              }}
              showHeader={true}
            />
          ) : selectedOption === 'free' ? (
            <StandardStructurePanel 
              selectedOption={selectedOption}
              onClearStructure={() => {
                setDocumentStructure(null);
                setSetupStatus('none');
                setSetupDiagnostics(null);
                setInferredProductType(null);
              }}
              showHeader={true}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
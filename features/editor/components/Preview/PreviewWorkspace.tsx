import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useI18n } from '@/shared/contexts/I18nContext';
import { 
  type PlanDocument,
  usePreviewState,
  useDisabledSectionsSet,
  useEditorActions,
  useEditorStore,
} from '@/features/editor/lib';
import { TitlePageRenderer } from './renderers/TitlePageRenderer';
import { TableOfContentsRenderer } from './renderers/TableOfContentsRenderer';
import { SectionRenderer } from './renderers/SectionRenderer';
import { 
  ListOfTablesRenderer, 
  ListOfFiguresRenderer, 
  ReferencesRenderer, 
  AppendicesRenderer 
} from './renderers/AncillaryRenderers';
import { DocumentSettings } from '@/shared/components/editor/DocumentSettings';
import { DEFAULT_DOCUMENT_STYLE, type DocumentStyleConfig } from '@/shared/components/editor/DocumentStyles';

// Define which sections are safe for inline editing
// Define which sections are restricted from inline editing
const RESTRICTED_SECTIONS = [
  'title-page',
  'ancillary', // Table of Contents
  'financial-plan',
  'references',
  'appendices'
];

function PreviewPanel() {
  const { t: i18nT } = useI18n();
  const previewState = usePreviewState();
  const { plan, isNewUser, hasPlan } = previewState;
  const disabledSections = useDisabledSectionsSet();
  const actions = useEditorActions((a) => ({
    setIsConfiguratorOpen: a.setIsConfiguratorOpen,
    updateSection: a.updateSection, // Add updateSection action
  }));
  const setActiveSectionIdAction = useEditorStore(state => state.setActiveSectionId);
  // Readiness Check data
  const programSummary = useEditorStore(state => state.programSummary);
  const selectedProduct = useEditorStore(state => state.selectedProduct);
  
  const [showWatermark] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1); // Scale factor
  const [documentStyle, setDocumentStyle] = useState<DocumentStyleConfig>(DEFAULT_DOCUMENT_STYLE);
  const [activeBottomTab, setActiveBottomTab] = useState<'readiness' | 'styling' | 'export'>('readiness');
  const [editingSection, setEditingSection] = useState<string | null>(null); // Track which section is being edited
  const [editContent, setEditContent] = useState<string>(''); // Temporary edit content
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const editInputRef = useRef<HTMLTextAreaElement>(null);
  // Refs for scroll handling
  const isScrollingToSection = useRef(false);
  const isZooming = useRef(false);
  
  function setZoomCentered(nextZoom: number) {
    const scroller = scrollRef.current ?? document.getElementById("preview-scroll-container");
    const stage = stageRef.current; // optional, only if you store --zoom here

    if (!scroller) {
      setZoomLevel(nextZoom);
      stage?.style.setProperty("--zoom", String(nextZoom));
      return;
    }

    const prevZoom = zoomLevel;

    // Current viewport center in "content pixels"
    const cx = scroller.scrollLeft + scroller.clientWidth / 2;
    const cy = scroller.scrollTop + scroller.clientHeight / 2;

    // Update zoom (state + CSS var)
    setZoomLevel(nextZoom);
    stage?.style.setProperty("--zoom", String(nextZoom));

    // After DOM updates, adjust scroll so the same logical center stays under the viewport center
    requestAnimationFrame(() => {
      const ratio = nextZoom / prevZoom;

      scroller.scrollLeft = cx * ratio - scroller.clientWidth / 2;
      scroller.scrollTop  = cy * ratio - scroller.clientHeight / 2;
    });
  }
  

  const planDocument = useMemo<PlanDocument | null>(() => plan ? plan as PlanDocument : null, [plan]);

const previewMode: 'formatted' | 'print' = 'formatted';
  const isGerman = planDocument?.language === 'de';
  
  // Use direct i18n keys with type casting - include ALL needed translations
  const typedT = i18nT as any;
  const t = {
    // Title page translations
    businessPlan: typedT('businessPlan'),
    author: typedT('editor.desktop.setupWizard.fields.author'),
    email: typedT('editor.desktop.setupWizard.fields.email'),
    phone: typedT('editor.desktop.setupWizard.fields.phone'),
    website: typedT('editor.desktop.setupWizard.fields.website'),
    address: typedT('editor.desktop.setupWizard.fields.address'),
    date: typedT('editor.desktop.setupWizard.fields.date'),
    
    // Additional translations needed by other renderers
    tableOfContents: typedT('editor.section.ancillary'),
    listOfTables: typedT('editor.section.listOfTables'),
    listOfFigures: typedT('editor.section.listOfFigures'),
    references: typedT('editor.section.references'),
    appendices: typedT('editor.section.appendices'),
    page: typedT('editor.ui.page'),
    figure: typedT('editor.ui.figure'),
    noReferencesYet: typedT('editor.ui.noReferencesYet'),
    noAppendicesYet: typedT('editor.ui.noAppendicesYet'),
    
    // Additional keys needed by TitlePageRenderer
    confidentiality: typedT('editor.desktop.setupWizard.fields.confidentiality'),
    projectNamePlaceholder: typedT('editor.desktop.setupWizard.placeholders.projectName'),
    authorPlaceholder: typedT('editor.desktop.setupWizard.placeholders.author'),
    // Contact placeholders from GeneralInfoStep
    emailPlaceholder: typedT('editor.desktop.setupWizard.placeholders.email'),
    phonePlaceholder: typedT('editor.desktop.setupWizard.placeholders.phone'),
    websitePlaceholder: typedT('editor.desktop.setupWizard.placeholders.website'),
    addressPlaceholder: typedT('editor.desktop.setupWizard.placeholders.address'),
    subtitlePlaceholder: typedT('editor.desktop.setupWizard.placeholders.subtitle'),
    logoPlaceholder: typedT('editor.desktop.setupWizard.placeholders.logo'),
  };
  
  // Filter out special sections that are handled by dedicated renderers
  const sectionsToRender = useMemo(() => {
    const allSections = planDocument?.sections || [];
    
    // In live preview mode (no product selected yet), only show regular sections
    // Hide special sections: Title Page (metadata), TOC (ancillary), References, Appendices
    if (!selectedProduct) {
      return allSections.filter(section => 
        section.id !== 'metadata' &&
        section.id !== 'ancillary' && 
        section.id !== 'references' && 
        section.id !== 'appendices'
      );
    }
    
    // When product is selected, exclude special sections that have dedicated renderers
    // These are rendered separately by TitlePageRenderer, TableOfContentsRenderer, ReferencesRenderer, etc.
    return allSections.filter(section => 
      section.id !== 'metadata' &&
      section.id !== 'ancillary' && 
      section.id !== 'references' && 
      section.id !== 'appendices'
    );
  }, [planDocument?.sections, selectedProduct]);

  // Focus edit input when editing starts
  useEffect(() => {
    if (editingSection && editInputRef.current) {
      // Wait for render cycle to complete
      setTimeout(() => {
        editInputRef.current?.focus();
        // Select all text for easy replacement
        editInputRef.current?.select();
      }, 50);
    }
  }, [editingSection]);
  
  // Handle save on Enter (Ctrl+Enter) or blur
  const handleSaveEdit = (save: boolean = true) => {
    if (editingSection && save) {
      // Save changes to store
      actions.updateSection(editingSection, { content: editContent });
      
      // Show success feedback
      console.log(`Saved changes to section: ${editingSection}`);
    }
    
    // Exit edit mode
    setEditingSection(null);
    setEditContent('');
  };
  
  // Start editing a section
  const startEditing = (sectionKey: string, currentContent: string) => {
    // Check if section is editable
    if (RESTRICTED_SECTIONS.includes(sectionKey)) {
      console.warn(`Section ${sectionKey} is not editable`);
      return;
    }
    
    setEditingSection(sectionKey);
    setEditContent(currentContent || '');
  };
  
  // Ref for tracking zoom state
  useEffect(() => {
    isZooming.current = false;
  }, [zoomLevel]);

  // Empty state content
  const emptyStateContent = (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-slate-900/40 rounded-lg">
      <div className="max-w-4xl space-y-8">
        <div className="flex flex-col items-center space-y-6">
          <div className="text-6xl">
            <span>📝</span>
          </div>
          
          <button
            onClick={() => actions.setIsConfiguratorOpen(true)}
            className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
          >
            {(() => {
              const key = 'editor.desktop.preview.emptyState.cta';
              const translated = i18nT(key as any) as string;
              const isMissing = !translated || translated === key || translated === String(key) || translated.startsWith('editor.desktop.preview.emptyState');
              return isMissing ? (isGerman ? 'Projekt anlegen' : 'Create Your Project') : translated;
            })()}
          </button>
        </div>
        
        <div className="space-y-4">
          <p className="text-white/80 text-base leading-relaxed max-w-6xl mx-auto">
            {(() => {
              const key = 'editor.desktop.preview.emptyState.description';
              const translated = i18nT(key as any) as string;
              const isMissing = !translated || translated === key || translated === String(key) || translated.startsWith('editor.desktop.preview.emptyState');
              return isMissing ? (isGerman ? 'Lege zuerst dein Projekt an. Die Basisdaten werden für Titelblatt, Exporte und System-Einstellungen verwendet.' : 'First, create your project. The basic data will be used for the title page, exports, and system settings.') : translated;
            })()}
          </p>
        </div>

      </div>
    </div>
  );

  // No plan document content
  const noPlanContent = (
    <div className="flex items-center justify-center h-full w-full text-white/60 text-sm">
      Start drafting your sections to see the live business plan preview here.
    </div>
  );

  // Scroll observer: Update active section when scrolling preview
  useEffect(() => {
    if (!planDocument || typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') return;
    
    const scrollContainer = document.getElementById('preview-scroll-container');
    if (!scrollContainer) return;
    
    // Track if user is actively scrolling to prevent observer from interfering
    let isUserScrolling = false;
    let scrollTimeout: NodeJS.Timeout | null = null;
    
    // Set up scroll event listener to track user scrolling
    const handleScroll = () => {
      isUserScrolling = true;
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
      scrollTimeout = setTimeout(() => {
        isUserScrolling = false;
      }, 150); // Reset after user stops scrolling
    };
    
    scrollContainer.addEventListener('scroll', handleScroll);
    
    // Use a timeout to delay observer setup to avoid initial scroll conflicts
    const setupObserver = setTimeout(() => {
      const observer = new IntersectionObserver(
        (entries) => {
          // Find the most visible section
          let mostVisibleRatio = 0;
          let mostVisibleElement: Element | null = null;
          
          entries.forEach((entry) => {
            if (entry.isIntersecting && entry.intersectionRatio > mostVisibleRatio) {
              mostVisibleRatio = entry.intersectionRatio;
              mostVisibleElement = entry.target;
            }
          });
          
          // Only update active section if not programmatically scrolling, not user scrolling, and not zooming
          if (mostVisibleElement && !isScrollingToSection.current && !isUserScrolling && !isZooming.current) {
            // First try to get section ID from the element's id attribute (for regular sections)
            let sectionId = '';
            if ('id' in mostVisibleElement && (mostVisibleElement as HTMLElement).id.startsWith('section-')) {
              sectionId = (mostVisibleElement as HTMLElement).id.replace('section-', '');
            } else {
              // If no id attribute or doesn't start with 'section-', try to get from data-section-id attribute (for special sections)
              sectionId = (mostVisibleElement as HTMLElement).getAttribute('data-section-id') || '';
            }
            
            if (sectionId) {
              setActiveSectionIdAction(sectionId, 'scroll');
            }
          }
        },
        {
          root: scrollContainer,
          threshold: [0.5], // Only trigger when 50% of element is visible
          rootMargin: '-25% 0px -25% 0px' // Margin to be more selective
        }
      );
      
      // Observe all section elements
      sectionsToRender.forEach((section) => {
        const element = document.getElementById(`section-${section.id || section.key}`);
        if (element) {
          observer.observe(element);
        }
      });
      
      // Cleanup function for the observer
      return () => {
        observer.disconnect();
        if (scrollTimeout) {
          clearTimeout(scrollTimeout);
        }
      };
    }, 300); // Delay to avoid initial scroll conflicts
    
    // Cleanup for the timeout and scroll listener
    return () => {
      clearTimeout(setupObserver);
      scrollContainer.removeEventListener('scroll', handleScroll);
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
    };
  }, [planDocument, sectionsToRender, setActiveSectionIdAction]);

  return (
    <>
      {(isNewUser || !hasPlan) ? (
        emptyStateContent
      ) : !planDocument ? (
        noPlanContent
      ) : (
        <div className="relative w-full h-full flex flex-col">
                  
          {/* Zoom Control Slider - Clean version without settings button */}
          <div className="absolute top-4 right-4 z-[101]">
            <div className="flex items-center gap-2 bg-slate-900 backdrop-blur-sm rounded-lg p-2 border-2 border-blue-500/50 shadow-xl">
              <span className="text-white text-xs font-medium">Zoom:</span>
              <input
                type="range"
                min="0.5"
                max="1.25"
                step="0.01"
                value={zoomLevel}
                onChange={(e) => setZoomCentered(parseFloat(e.target.value))}
                className="w-32 h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider-thumb"
              />
              <span className="text-white text-xs font-bold w-12">
                {Math.round(zoomLevel * 100)}%
              </span>
            </div>
          </div>
          <div
            id="preview-scroll-container"
            ref={scrollRef}
            className="flex-1 overflow-auto relative pt-8 pb-8"
          >
            <div ref={stageRef} className="preview-stage" style={{ ["--zoom" as any]: zoomLevel }}>
              <div 
                ref={viewportRef} 
                className={`export-preview ${previewMode}`}
              >
                {showWatermark && (
                  <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-0">
                    <div className="text-6xl font-bold text-gray-200 opacity-30 transform -rotate-45 select-none">DRAFT</div>
                  </div>
                )}
                <TitlePageRenderer planDocument={planDocument} disabledSections={disabledSections} t={t} />
                
                {/* Only show special sections when product is selected (not in live preview mode) */}
                {selectedProduct && (
                  <>
                    <TableOfContentsRenderer planDocument={planDocument} sectionsToRender={sectionsToRender} disabledSections={disabledSections} t={t} />
                    {sectionsToRender.map((section, index) => (
                      <SectionRenderer
                        key={section.key}
                        section={section}
                        sectionIndex={index}
                        planDocument={planDocument}
                        previewMode={previewMode}
                        t={t}
                        // Inline editing props
                        isEditing={editingSection === section.key}
                        editContent={editContent}
                        onStartEdit={startEditing}
                        onSaveEdit={handleSaveEdit}
                        onEditChange={setEditContent}
                        editInputRef={editInputRef}
                      />
                    ))}
                    <ListOfTablesRenderer planDocument={planDocument} sectionsToRender={sectionsToRender} disabledSections={disabledSections} t={t} />
                    <ListOfFiguresRenderer planDocument={planDocument} sectionsToRender={sectionsToRender} disabledSections={disabledSections} t={t} />
                    <ReferencesRenderer planDocument={planDocument} sectionsToRender={sectionsToRender} disabledSections={disabledSections} t={t} />
                    <AppendicesRenderer planDocument={planDocument} sectionsToRender={sectionsToRender} disabledSections={disabledSections} t={t} />
                  </>
                )}
              </div>
            </div>
          </div>
          
          {/* Bottom Tabbed Bar - VS Code style */}
          <div className="flex-shrink-0 border-t border-white/20 bg-slate-900/90 backdrop-blur-sm">
            {/* Tab Headers */}
            <div className="flex border-b border-white/10">
              <button
                onClick={() => setActiveBottomTab('readiness')}
                className={`px-4 py-2 text-xs font-medium transition-colors flex items-center gap-2 ${
                  activeBottomTab === 'readiness'
                    ? 'bg-blue-500/20 text-blue-300 border-b-2 border-blue-400'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>📊</span>
                Readiness
              </button>
              
              <button
                onClick={() => setActiveBottomTab('styling')}
                className={`px-4 py-2 text-xs font-medium transition-colors flex items-center gap-2 ${
                  activeBottomTab === 'styling'
                    ? 'bg-blue-500/20 text-blue-300 border-b-2 border-blue-400'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>🎨</span>
                Styling
              </button>
              
              <button
                onClick={() => setActiveBottomTab('export')}
                className={`px-4 py-2 text-xs font-medium transition-colors flex items-center gap-2 ${
                  activeBottomTab === 'export'
                    ? 'bg-blue-500/20 text-blue-300 border-b-2 border-blue-400'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>📤</span>
                Export
              </button>
            </div>
            
            {/* Tab Content */}
            <div className="px-4 py-3">
              {activeBottomTab === 'readiness' && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-white/60 text-xs font-medium">Status:</span>
                    <div className="flex items-center gap-2">
                      {selectedProduct && (
                        <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded font-medium">
                          {selectedProduct.charAt(0).toUpperCase() + selectedProduct.slice(1)}
                        </span>
                      )}
                      {programSummary ? (
                        <span className="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded font-medium">
                          {programSummary.name}
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-500/20 text-gray-400 text-xs rounded font-medium">
                          No Program Selected
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-white/50">
                    <span>Document Ready</span>
                    <span>•</span>
                    <span>Formatting OK</span>
                    <span>•</span>
                    <span>All Sections Present</span>
                  </div>
                </div>
              )}
              
              {activeBottomTab === 'styling' && (
                <div className="max-h-40 overflow-y-auto">
                  <DocumentSettings
                    config={documentStyle}
                    onChange={setDocumentStyle}
                    className="bg-slate-800/50"
                  />
                </div>
              )}
              
              {activeBottomTab === 'export' && (
                <div className="flex items-center gap-3">
                  <span className="text-white/60 text-xs">Export options coming soon...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default PreviewPanel;

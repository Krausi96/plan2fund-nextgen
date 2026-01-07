import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useI18n } from '@/shared/contexts/I18nContext';
import { 
  type PlanDocument,
  usePreviewState,
  getTranslation,
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

type ZoomPreset = '50' | '75' | '100' | '125' | '150' | '200';
type PreviewMode = 'preview' | 'formatted' | 'print';

const ZOOM_PRESETS: Record<ZoomPreset, number> = {
  '50': 0.5, '75': 0.75, '100': 1, '125': 1.25, '150': 1.5, '200': 2
};

const getPreviewPadding = () => 0;
const getInitialPreviewPadding = () => 0;
const calculateViewportZoom = (viewMode: 'page' | 'fluid', zoomPreset: ZoomPreset, fitScale: number) => {
  if (viewMode === 'fluid') return 1;
  return ZOOM_PRESETS[zoomPreset] * fitScale;
};
const calculateFitScale = (width: number, height: number) => {
  const pageWidth = 210 * 3.779527559;
  const pageHeight = 297 * 3.779527559;
  const scaleX = (width - 80) / pageWidth;
  const scaleY = (height - 80) / pageHeight;
  return Math.min(scaleX, scaleY, 1);
};
const createViewportStyle = (padding: number) => ({ padding: `${padding}px` });
const createZoomStyle = (zoom: number) => ({ transform: `scale(${zoom})`, transformOrigin: 'top left' });

function PreviewPanel() {
  const { t: i18nT } = useI18n();
  const previewState = usePreviewState();
  const { plan, isNewUser, hasPlan } = previewState;
  const disabledSections = useDisabledSectionsSet();
  const actions = useEditorActions((a) => ({
    setIsConfiguratorOpen: a.setIsConfiguratorOpen,
  }));
  const setActiveSectionIdAction = useEditorStore(state => state.setActiveSectionId);
  // Readiness Check data
  const programSummary = useEditorStore(state => state.programSummary);
  const selectedProduct = useEditorStore(state => state.selectedProduct);
  
  // Create setActiveSectionId function with source parameter
  const setActiveSectionId = (id: string | null, source: 'sidebar' | 'scroll' | 'editor' | 'direct' = 'direct') => {
    setActiveSectionIdAction(id, source);
  };
  const [viewMode] = useState<'page' | 'fluid'>('page');
  const [showWatermark] = useState(true);
  const [zoomPreset, setZoomPreset] = useState<ZoomPreset>('100');
  const [fitScale, setFitScale] = useState(1);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [previewPadding, setPreviewPadding] = useState(() => getInitialPreviewPadding());
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const updatePadding = () => setPreviewPadding(getPreviewPadding());
    updatePadding();
    window.addEventListener('resize', updatePadding);
    return () => window.removeEventListener('resize', updatePadding);
  }, []);

  useEffect(() => {
    if (viewMode !== 'page' || typeof window === 'undefined' || typeof ResizeObserver === 'undefined') {
      setFitScale(1);
      return;
    }
    const node = viewportRef.current;
    if (!node) return;
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0]?.contentRect || {};
      if (!width || !height) return;
      setFitScale(calculateFitScale(width, height));
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [viewMode]);

  const planDocument = useMemo<PlanDocument | null>(() => plan ? plan as PlanDocument : null, [plan]);
  const viewportZoom = calculateViewportZoom(viewMode, zoomPreset, fitScale);
  const zoomStyle = createZoomStyle(viewportZoom);
  const previewMode: PreviewMode = viewMode === 'page' ? 'formatted' : 'preview';
  const isGerman = planDocument?.language === 'de';
  const t = getTranslation(isGerman);
  const sectionsToRender = planDocument?.sections || [];

  // Refs for scroll handling
  const isScrollingToSection = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Empty state: No plan exists
  if (isNewUser || !hasPlan) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-slate-900/40 rounded-lg">
        <div className="max-w-md space-y-6">
          <div className="flex justify-center relative">
            <div className="text-6xl mb-2 relative">
              <span className="relative z-10">📝</span>
            </div>
          </div>
          
          <button
            onClick={() => actions.setIsConfiguratorOpen(true)}
            className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
          >
            {(() => {
              const key = 'editor.desktop.preview.emptyState.cta';
              const translated = i18nT(key as any) as string;
              const isMissing = !translated || translated === key || translated === String(key) || translated.startsWith('editor.desktop.preview.emptyState');
              return isMissing ? (isGerman ? 'Plan starten' : 'Start Your Plan') : translated;
            })()}
          </button>
          
          <p className="text-white/80 text-sm leading-relaxed">
            {(() => {
              const key = 'editor.desktop.preview.emptyState.description';
              const translated = i18nT(key as any) as string;
              const isMissing = !translated || translated === key || translated === String(key) || translated.startsWith('editor.desktop.preview.emptyState');
              return isMissing ? (isGerman ? 'Es gibt viele Wege, such dir deinen aus.' : 'There are many ways, choose yours.') : translated;
            })()}
          </p>
          
          <div className="mt-4 flex flex-col gap-6 text-left text-xs text-white/60">
            <div className="group relative flex items-center gap-3">
              <span className="flex-shrink-0 inline-flex items-center justify-center w-14 h-14 group-hover:w-10 group-hover:h-10 rounded-md bg-blue-500/20 border border-blue-400/40 text-blue-300 font-bold text-xl group-hover:text-lg transition-all duration-200">
                📋
              </span>
              <span className="flex-1 cursor-help">{(() => {
                const key = 'editor.desktop.preview.emptyState.optionA';
                const translated = i18nT(key as any) as string;
                const isMissing = !translated || translated === key || translated === String(key) || translated.startsWith('editor.desktop.preview.emptyState');
                return isMissing ? (isGerman 
                  ? 'Wähle einen Plan (Strategiedokument, Individueller Business-Plan oder Upgrade) aus. Du kannst später ein Förderprogramm hinzufügen, um programmspezifische Anforderungen und Empfehlungen zu erhalten.'
                  : 'Start by selecting a plan (Strategy, Review, or Submission). You can add a funding program later to get program-specific requirements and recommendations.') : translated;
              })()}</span>
            </div>
            <div className="group relative flex items-center gap-3">
              <span className="flex-shrink-0 inline-flex items-center justify-center w-14 h-14 group-hover:w-10 group-hover:h-10 rounded-md bg-blue-500/20 border border-blue-400/40 text-blue-300 font-bold text-xl group-hover:text-lg transition-all duration-200">
                🔍
              </span>
              <span className="flex-1 cursor-help">{(() => {
                const key = 'editor.desktop.preview.emptyState.optionB';
                const translated = i18nT(key as any) as string;
                const isMissing = !translated || translated === key || translated === String(key) || translated.startsWith('editor.desktop.preview.emptyState');
                return isMissing ? (isGerman
                  ? 'Suche oder verbinde ein Förderprogramm. Wir empfehlen die notwendigen Dokumente und stellen programmspezifische Anforderungen und Dokumentenvorlagen bereit.'
                  : "Start by finding or connecting a funding program. We'll recommend a plan and provide program-specific requirements and document templates.") : translated;
              })()}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // No plan document
  if (!planDocument) {
    return (
      <div className="flex items-center justify-center h-full w-full text-white/60 text-sm">
        Start drafting your sections to see the live business plan preview here.
      </div>
    );
  }

  const viewportStyle = createViewportStyle(previewPadding);

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
          
          // Only update active section if not programmatically scrolling and not user scrolling
          if (mostVisibleElement && !isScrollingToSection.current && !isUserScrolling) {
            // First try to get section ID from the element's id attribute (for regular sections)
            let sectionId = '';
            if ('id' in mostVisibleElement && (mostVisibleElement as HTMLElement).id.startsWith('section-')) {
              sectionId = (mostVisibleElement as HTMLElement).id.replace('section-', '');
            } else {
              // If no id attribute or doesn't start with 'section-', try to get from data-section-id attribute (for special sections)
              sectionId = (mostVisibleElement as HTMLElement).getAttribute('data-section-id') || '';
            }
            
            if (sectionId) {
              setActiveSectionId(sectionId, 'scroll');
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
  }, [planDocument, sectionsToRender, setActiveSectionId]);

  return (
    <div className="relative w-full h-full flex flex-col">
      {/* Main preview content */}
      <div className="flex-1 overflow-auto" id="preview-scroll-container">
        <div className="relative w-full h-full flex justify-center">
          <div ref={viewportRef} className="relative" style={viewportStyle}>
            <div className={`export-preview ${previewMode}`} style={zoomStyle}>
              {showWatermark && (
                <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-0">
                  <div className="text-6xl font-bold text-gray-200 opacity-30 transform -rotate-45 select-none">DRAFT</div>
                </div>
              )}
              <div className="relative z-10" style={{ margin: 0, padding: 0 }}>
                <TitlePageRenderer planDocument={planDocument} disabledSections={disabledSections} t={t} />
                <TableOfContentsRenderer planDocument={planDocument} sectionsToRender={sectionsToRender} disabledSections={disabledSections} t={t} />
                {sectionsToRender.map((section, index) => (
                  <SectionRenderer
                    key={section.key}
                    section={section}
                    sectionIndex={index}
                    planDocument={planDocument}
                    previewMode={previewMode}
                    t={t}
                  />
                ))}
                <ListOfTablesRenderer planDocument={planDocument} sectionsToRender={sectionsToRender} disabledSections={disabledSections} t={t} />
                <ListOfFiguresRenderer planDocument={planDocument} sectionsToRender={sectionsToRender} disabledSections={disabledSections} t={t} />
                <ReferencesRenderer planDocument={planDocument} sectionsToRender={sectionsToRender} disabledSections={disabledSections} t={t} />
                <AppendicesRenderer planDocument={planDocument} sectionsToRender={sectionsToRender} disabledSections={disabledSections} t={t} />
                {/* Zoom Controls - Positioned as overlay to not interfere with scrolling */}
                <div className="absolute top-4 right-4 z-[100]">
                  <div className="flex flex-col gap-1 bg-slate-900 backdrop-blur-sm rounded-lg p-1.5 border-2 border-blue-500/50 shadow-xl">
                    {(Object.keys(ZOOM_PRESETS) as ZoomPreset[]).map((id) => (
                      <button 
                        key={id} 
                        className={`px-2 py-1 rounded text-xs font-bold transition-all ${
                          zoomPreset === id ? 'bg-blue-600 text-white shadow-md' : 'bg-white/10 text-white/90 hover:bg-white/20'
                        }`}
                        onClick={() => {
                          setZoomPreset(id);
                          // When zoom changes, make sure to reset the scrolling flag to prevent conflicts
                          isScrollingToSection.current = false;
                          if (scrollTimeoutRef.current) {
                            clearTimeout(scrollTimeoutRef.current);
                          }
                        }}
                      >
                        {id}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom sticky Readiness Check bar */}
      <div className="flex-shrink-0 border-t border-white/20 bg-slate-900/90 backdrop-blur-sm">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-white/60 text-sm font-medium">Readiness:</span>
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
                    No Program
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-white/40 text-xs">Status indicators would go here</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PreviewPanel;

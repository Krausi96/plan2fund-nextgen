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

const getPreviewPadding = (width: number) => Math.min(40, width * 0.05);
const getInitialPreviewPadding = () => typeof window !== 'undefined' ? getPreviewPadding(window.innerWidth) : 40;
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
const getViewModeButtonClass = (current: 'page' | 'fluid', mode: 'page' | 'fluid') => 
  `px-3 py-1 rounded text-sm font-medium transition-colors ${
    current === mode ? 'bg-blue-600 text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'
  }`;
const getZoomButtonClass = (current: ZoomPreset, id: ZoomPreset) =>
  `px-2 py-1 rounded text-xs font-medium transition-colors ${
    current === id ? 'bg-blue-600 text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'
  }`;

function PreviewPanel() {
  const { t: i18nT } = useI18n();
  const previewState = usePreviewState();
  const { plan, isNewUser, hasPlan } = previewState;
  const disabledSections = useDisabledSectionsSet();
  const actions = useEditorActions((a) => ({
    setIsConfiguratorOpen: a.setIsConfiguratorOpen,
  }));
  const setActiveSectionId = useEditorStore(state => state.setActiveSectionId);
  const [viewMode, setViewMode] = useState<'page' | 'fluid'>('page');
  const [showWatermark, setShowWatermark] = useState(true);
  const [zoomPreset, setZoomPreset] = useState<ZoomPreset>('100');
  const [fitScale, setFitScale] = useState(1);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [previewPadding, setPreviewPadding] = useState(() => getInitialPreviewPadding());
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const updatePadding = () => setPreviewPadding(getPreviewPadding(window.innerWidth));
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

  // Scroll observer: Update active section when scrolling preview
  useEffect(() => {
    if (!planDocument || typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') return;
    
    const scrollContainer = document.getElementById('preview-scroll-container');
    if (!scrollContainer) return;
    
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
        
        if (mostVisibleElement && 'id' in mostVisibleElement) {
          const sectionId = (mostVisibleElement as HTMLElement).id.replace('section-', '');
          if (sectionId) {
            setActiveSectionId(sectionId);
          }
        }
      },
      {
        root: scrollContainer,
        threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
        rootMargin: '-20% 0px -20% 0px'
      }
    );
    
    // Observe all section elements
    sectionsToRender.forEach((section) => {
      const element = document.getElementById(`section-${section.id || section.key}`);
      if (element) {
        observer.observe(element);
      }
    });
    
    return () => observer.disconnect();
  }, [planDocument, sectionsToRender, setActiveSectionId]);
  
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

  return (
    <div className="relative w-full h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/10 bg-slate-900/60">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] uppercase tracking-wide text-white/50">View</span>
          <button className={getViewModeButtonClass(viewMode, 'page')} onClick={() => setViewMode('page')}>Page</button>
          <button className={getViewModeButtonClass(viewMode, 'fluid')} onClick={() => setViewMode('fluid')}>Fluid</button>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs text-white/70">
            <input 
              type="checkbox" 
              checked={showWatermark} 
              onChange={(e) => setShowWatermark(e.target.checked)} 
              className="w-3 h-3 rounded border-white/20 bg-transparent text-blue-400 focus:ring-1 focus:ring-blue-400" 
            />
            Watermark
          </label>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] uppercase tracking-wide text-white/50">Zoom</span>
            {(Object.keys(ZOOM_PRESETS) as ZoomPreset[]).map((id) => (
              <button key={id} className={getZoomButtonClass(zoomPreset, id)} onClick={() => setZoomPreset(id)}>
                {id}%
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Preview content */}
      <div className="flex-1 overflow-auto bg-slate-800/30" id="preview-scroll-container">
        <div ref={viewportRef} className="w-full min-h-full" style={viewportStyle}>
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PreviewPanel;

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { type PlanDocument, usePreviewState } from '@/features/editor/lib';
import ExportRenderer from '../Renderers/DocumentRenderer';

type ZoomPreset = '50' | '75' | '100' | '125' | '150' | '200';

const ZOOM_PRESETS: Record<ZoomPreset, number> = {
  '50': 0.5,
  '75': 0.75,
  '100': 1,
  '125': 1.25,
  '150': 1.5,
  '200': 2
};

const getPreviewPadding = (width: number) => Math.min(40, width * 0.05);
const getInitialPreviewPadding = () => typeof window !== 'undefined' ? getPreviewPadding(window.innerWidth) : 40;
const calculateViewportZoom = (viewMode: 'page' | 'fluid', zoomPreset: ZoomPreset, fitScale: number) => {
  if (viewMode === 'fluid') return 1;
  return ZOOM_PRESETS[zoomPreset] * fitScale;
};
const calculateFitScale = (width: number, height: number) => {
  const pageWidth = 210 * 3.779527559; // A4 width in pixels at 96 DPI
  const pageHeight = 297 * 3.779527559; // A4 height in pixels at 96 DPI
  const scaleX = (width - 80) / pageWidth;
  const scaleY = (height - 80) / pageHeight;
  return Math.min(scaleX, scaleY, 1);
};
const createViewportStyle = (padding: number) => ({ padding: `${padding}px` });
const createZoomStyle = (zoom: number) => ({ transform: `scale(${zoom})`, transformOrigin: 'top left' });
const getViewModeButtonClass = (current: 'page' | 'fluid', mode: 'page' | 'fluid') => 
  `px-3 py-1 rounded text-sm font-medium transition-colors ${
    current === mode 
      ? 'bg-blue-600 text-white' 
      : 'bg-white/10 text-white/70 hover:bg-white/20'
  }`;
const getZoomButtonClass = (current: ZoomPreset, id: ZoomPreset) =>
  `px-2 py-1 rounded text-xs font-medium transition-colors ${
    current === id
      ? 'bg-blue-600 text-white'
      : 'bg-white/10 text-white/70 hover:bg-white/20'
  }`;

interface PreviewPanelProps {
  // No props needed - component uses store hooks directly
}

function PreviewPanel({}: PreviewPanelProps) {
  // Access store directly via unified hook - no prop drilling needed
  const previewState = usePreviewState();
  const { plan, isNewUser, hasPlan } = previewState;
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

  const planDocument = useMemo<PlanDocument | null>(() => {
    if (!plan) return null;
    // Simple conversion - plan is already a PlanDocument/BusinessPlan
    return plan as PlanDocument;
  }, [plan]);

  const viewportZoom = calculateViewportZoom(viewMode, zoomPreset, fitScale);
  const zoomStyle = createZoomStyle(viewportZoom);

  if (isNewUser || !hasPlan) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <div className="text-white/60 text-sm">
          Select a product to start creating your business plan
        </div>
      </div>
    );
  }

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
      <div className="flex items-center justify-between p-3 border-b border-white/10 bg-slate-900/50">
        <div className="flex items-center gap-2">
          <span className="uppercase tracking-wide text-white/60">View</span>
          <button
            className={getViewModeButtonClass(viewMode, 'page')}
            onClick={() => setViewMode('page')}
          >
            Page
          </button>
          <button
            className={getViewModeButtonClass(viewMode, 'fluid')}
            onClick={() => setViewMode('fluid')}
          >
            Fluid
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 font-semibold">
            <input
              type="checkbox"
              checked={showWatermark}
              onChange={(e) => setShowWatermark(e.target.checked)}
              className="rounded border-white/20 bg-transparent text-blue-400 focus:ring-blue-400"
            />
            Watermark
          </label>
          <div className="flex items-center gap-2">
            <span className="uppercase tracking-wide text-white/60">Zoom</span>
            {(Object.keys(ZOOM_PRESETS) as ZoomPreset[]).map((id) => (
              <button
                key={id}
                className={getZoomButtonClass(zoomPreset, id)}
                onClick={() => setZoomPreset(id)}
              >
                {id}%
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-auto bg-slate-800/30">
        <div ref={viewportRef} className="w-full min-h-full" style={viewportStyle}>
          <ExportRenderer
            plan={planDocument}
            previewMode={viewMode === 'page' ? 'formatted' : 'preview'}
            previewSettings={{
              showCompletionStatus: true,
              showWordCount: false,
              showCharacterCount: false,
              enableRealTimePreview: true
            }}
            style={zoomStyle}
          />
        </div>
      </div>
    </div>
  );
}

export default PreviewPanel;

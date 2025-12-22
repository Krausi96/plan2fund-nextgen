import React, { useRef } from 'react';

import Sidebar from './Navigation/Sidebar';
import PreviewWorkspace from './Preview/PreviewWorkspace';
import SectionEditor from './Editor/SectionEditor';
import DocumentsBar from './Navigation/DocumentsBar';
import CurrentSelection from './Navigation/CurrentSelection';
import { 
  useIsWaitingForPlan,
  useEditorState,
  useEditorStore,
  type ProductType
} from '@/features/editor/lib';
import { useI18n } from '@/shared/contexts/I18nContext';
import DevClearCacheButton from './DevTools/DevClearCacheButton';

type EditorProps = {
  product?: ProductType | null;
};

export default function Editor({}: EditorProps = {}) {
  const { t } = useI18n();
  const workspaceGridRef = useRef<HTMLDivElement | null>(null);

  // Consolidated state access - single hook call instead of 20+ individual calls
  const { error } = useEditorState();
  
  // Computed selectors from lib - single source of truth
  const isWaitingForPlan = useIsWaitingForPlan();
  const activeSectionId = useEditorStore(state => state.activeSectionId);
  
  if (isWaitingForPlan) {
    return (
      <>
        <DevClearCacheButton />
        <div className="h-screen flex flex-col items-center justify-center text-gray-500 space-y-2">
          <div>{(t('editor.ui.loadingEditor' as any) as string) || 'Loading editor...'}</div>
          <div className="text-xs text-gray-400">{(t('editor.ui.initializingPlan' as any) as string) || 'Initializing plan...'}</div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <DevClearCacheButton />
        <div className="h-screen flex flex-col items-center justify-center space-y-4">
          <p className="text-red-500 font-semibold">{error}</p>
        </div>
      </>
    );
  }

  return (
    <div className="bg-neutral-200 text-textPrimary">
      <DevClearCacheButton />
      
      <div className="pb-6 px-4" style={{ maxWidth: '100vw' }}>
        <div className="relative rounded-[32px] border border-dashed border-white shadow-[0_30px_80px_rgba(6,12,32,0.65)]" style={{ maxWidth: '1800px', margin: '0 auto' }}>
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-blue-900/90 to-slate-900 rounded-[32px]" />
          <div className="relative z-10 flex flex-col gap-2 p-4 lg:p-6 min-h-0" style={{ overflowX: 'auto', overflowY: 'visible', height: 'calc(100vh + 200px)', maxHeight: 'calc(100vh + 200px)' }}>
            {/* Dein Schreibtisch Header */}
            <div className="flex-shrink-0 mb-1">
              <h1 className="text-lg font-bold uppercase tracking-wide text-white">
                🖥️ {t('editor.desktop.title' as any) || 'Dein Schreibtisch'}
              </h1>
            </div>

            {/* Workspace Container - Document-Centric Layout */}
            <div className="relative rounded-2xl border border-dashed border-white/60 bg-slate-900/40 p-3 lg:p-4 shadow-lg backdrop-blur-sm w-full flex-1 min-h-0" style={{ overflow: 'visible', display: 'flex', flexDirection: 'column' }}>
              {/* Grid Layout: 2 rows, dynamic columns (2 or 3 based on chat visibility) */}
              <div 
                ref={workspaceGridRef} 
                style={{ 
                  display: 'grid',
                  // Always 3 columns for consistent layout
                  gridTemplateColumns: '360px minmax(500px, 1fr) 380px',  // Sidebar | Preview | AI Assistant
                  gridTemplateRows: 'auto 1fr',
                  gap: '1rem',
                  width: '100%',
                  flex: '1 1 0',
                  minHeight: 0,
                  overflow: 'visible',
                  position: 'relative'
                }}
              >
                {/* Row 1, Col 1: CurrentSelection (Top Left) */}
                <div 
                  style={{ 
                    gridColumn: '1 / 2',
                    gridRow: '1 / 2',
                    zIndex: 0,
                    overflow: 'visible',
                    height: 'fit-content',
                    maxHeight: '200px'  // Increased to allow CurrentSelection to expand
                  }}
                >
                  <CurrentSelection overlayContainerRef={workspaceGridRef} />
                </div>

                {/* Row 1, Col 2(+3): DocumentsBar (Top Right, spans to AI Assistant) */}
                <div 
                  style={{ 
                    gridColumn: '2 / 4',  // Always span across preview and AI assistant
                    gridRow: '1 / 2',
                    zIndex: 10,
                    overflowY: 'visible',
                    overflowX: 'visible',
                    position: 'relative'
                  }}
                >
                  <DocumentsBar />
                </div>

                {/* Row 2, Col 1: Sidebar (Bottom Left) */}
                <div 
                  className="border-r border-white/10 pr-4 min-h-0 flex flex-col relative" 
                  style={{ 
                    gridColumn: '1 / 2',
                    gridRow: '2 / 3',
                    maxWidth: '360px',
                    width: '360px',
                    minWidth: '360px',
                    boxSizing: 'border-box',
                    zIndex: 1,
                    overflow: 'hidden'
                  }}
                >
                  <Sidebar />
                </div>
                
                {/* Row 2, Col 2: Preview (Bottom Center) */}
                <div 
                  className="min-w-0 min-h-0 relative flex flex-col" 
                  id="preview-container" 
                  style={{ 
                    gridColumn: '2 / 3',
                    gridRow: '2 / 3',
                    zIndex: 1,
                    overflow: 'hidden',
                    minWidth: '500px'  // Enforce minimum preview width (reduced from 700px)
                  }}
                >
                  {/* Preview Header - Matches Sidebar header height exactly */}
                  <h2 className="text-lg font-bold uppercase tracking-wide text-white mb-2 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.5)' }}>
                    {t('editor.desktop.preview.title' as any) || 'Preview'}
                  </h2>
                  {/* Preview - Always visible */}
                  <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden relative" id="preview-scroll-container">
                    {/* PreviewWorkspace handles its own state via store - no props needed */}
                    <PreviewWorkspace />
                  </div>
                </div>
                
                {/* Row 2, Col 3: AI Assistant (Bottom Right) - Always visible */}
                <div
                  className="min-h-0 relative flex flex-col"
                  style={{
                    gridColumn: '3 / 4',
                    gridRow: '2 / 3',
                    zIndex: 1,
                    overflow: 'hidden',
                    width: '380px',
                    minWidth: '380px',
                    maxWidth: '380px'
                  }}
                >
                  <SectionEditor
                    sectionId={activeSectionId}
                    onClose={() => {/* No close button - always visible */}}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


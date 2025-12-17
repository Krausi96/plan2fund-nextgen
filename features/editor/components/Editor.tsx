import React, { useRef } from 'react';

import Sidebar from './Navigation/Sidebar';
import PreviewWorkspace from './Preview/PreviewWorkspace';
import SectionEditor from './Editor/SectionEditor';
import DocumentsBar from './Navigation/DocumentsBar';
import CurrentSelection from './Navigation/CurrentSelection';
import { 
  useEditorActions, 
  useEffectiveEditingSectionId,
  useIsWaitingForPlan,
  useHasPlan,
  useEditorState,
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
  
  // Optimized: Select only needed action instead of all actions
  const actions = useEditorActions((a) => ({
    setEditingSectionId: a.setEditingSectionId,
  }));
  
  // Computed selectors from lib - single source of truth
  const effectiveEditingSectionId = useEffectiveEditingSectionId();
  const isWaitingForPlan = useIsWaitingForPlan();
  const hasPlan = useHasPlan();
  
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
      
      <div className="container pb-6">
        <div className="relative rounded-[32px] border border-dashed border-white shadow-[0_30px_80px_rgba(6,12,32,0.65)]">
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-blue-900/90 to-slate-900 rounded-[32px]" />
          <div className="relative z-10 flex flex-col gap-2 p-4 lg:p-6 min-h-0" style={{ overflowX: 'hidden', overflowY: 'visible', height: 'calc(100vh + 90px)', maxHeight: 'calc(100vh + 90px)' }}>
            {/* Dein Schreibtisch Header */}
            <div className="flex-shrink-0 mb-2">
              <h1 className="text-xl font-bold uppercase tracking-wide text-white">
                🖥️ {t('editor.desktop.title' as any) || 'Dein Schreibtisch'}
              </h1>
            </div>

            {/* Workspace Container - Document-Centric Layout */}
            <div className="relative rounded-2xl border border-dashed border-white/60 bg-slate-900/40 p-4 lg:p-6 shadow-lg backdrop-blur-sm w-full flex-1 min-h-0" style={{ overflow: 'visible', display: 'flex', flexDirection: 'column' }}>
              {/* Grid Layout: 2 rows, 2 columns */}
              <div 
                ref={workspaceGridRef} 
                style={{ 
                  display: 'grid',
                  gridTemplateColumns: '320px 1fr',
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
                    maxHeight: 'fit-content'
                  }}
                >
                  <CurrentSelection overlayContainerRef={workspaceGridRef} />
                </div>

                {/* Row 1, Col 2: DocumentsBar (Top Right) */}
                <div 
                  style={{ 
                    gridColumn: '2 / 3',
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
                    maxWidth: '320px',
                    width: '320px',
                    minWidth: '320px',
                    boxSizing: 'border-box',
                    zIndex: 1,
                    overflow: 'hidden'
                  }}
                >
                  <Sidebar />
                </div>
                
                {/* Row 2, Col 2: Preview (Bottom Right) */}
                <div 
                  className="min-w-0 min-h-0 relative flex flex-col" 
                  id="preview-container" 
                  style={{ 
                    gridColumn: '2 / 3',
                    gridRow: '2 / 3',
                    zIndex: 1,
                    overflow: 'hidden'
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
                  
                  {/* Inline Editor - RENDERED OUTSIDE SCROLL CONTAINER TO AVOID OVERFLOW CLIPPING */}
                  {hasPlan && (
                    <SectionEditor
                      sectionId={effectiveEditingSectionId}
                      onClose={() => actions.setEditingSectionId(null)}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


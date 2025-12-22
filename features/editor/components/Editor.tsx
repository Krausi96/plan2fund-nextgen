import React, { useRef } from 'react';

import CurrentSelection from './Navigation/CurrentSelection';
import Sidebar from './Navigation/Sidebar';
import PreviewWorkspace from './Preview/PreviewWorkspace';
import SectionEditor from './Editor/SectionEditor';
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

            {/* Workspace Container - Unified Preview */}
            <div className="relative rounded-2xl border border-dashed border-white/60 bg-slate-900/40 p-3 lg:p-4 shadow-lg backdrop-blur-sm w-full flex-1 min-h-0" style={{ overflow: 'visible', display: 'flex', flexDirection: 'column' }}>
              {/* Top: Current Selection */}
              <div className="flex-shrink-0 mb-3">
                <CurrentSelection />
              </div>
              
              {/* 3-Column Layout */}
              <div 
                ref={workspaceGridRef} 
                style={{ 
                  display: 'grid',
                  gridTemplateColumns: '280px minmax(500px, 1fr) 360px',
                  gridTemplateRows: '1fr',
                  gap: '1rem',
                  width: '100%',
                  flex: '1 1 0',
                  minHeight: 0,
                  overflow: 'visible'
                }}
              >
                {/* Left: Sidebar only */}
                <div className="border-r border-white/10 pr-3 min-h-0 flex flex-col" style={{ overflow: 'hidden' }}>
                  {/* Sidebar Sections */}
                  <div className="flex-1 min-h-0">
                    <Sidebar />
                  </div>
                </div>
                
                {/* Preview */}
                <div className="min-w-0 min-h-0 relative flex flex-col h-full" id="preview-container" style={{ overflow: 'hidden' }}>
                  <PreviewWorkspace />
                </div>
                
                {/* AI Assistant */}
                <div className="min-h-0 relative flex flex-col" style={{ overflow: 'hidden' }}>
                  <SectionEditor
                    sectionId={activeSectionId}
                    onClose={() => {}}
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


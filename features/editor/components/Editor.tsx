import React, { useState } from 'react';

import CurrentSelection from './Navigation/CurrentSelection';
import TreeNavigator from './Navigation/TreeNavigator';
import PreviewWorkspace from './Preview/PreviewWorkspace';
import SectionEditor from './Editor/SectionEditor';
import { 
  useIsWaitingForPlan,
  useEditorState,
  useEditorStore,
} from '@/features/editor/lib';
import { useI18n } from '@/shared/contexts/I18nContext';
import DevClearCacheButton from './DevTools/DevClearCacheButton';

type EditorProps = {};

export default function Editor({}: EditorProps = {}) {
  const { t } = useI18n();
  
  // Consolidated state access
  const { error } = useEditorState();
  
  // Computed selectors
  const isWaitingForPlan = useIsWaitingForPlan();
  const activeSectionId = useEditorStore(state => state.activeSectionId);
  
  // AI Assistant collapse state
  const [isAICollapsed, setIsAICollapsed] = useState(false);
  
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
      
      <div className="pb-6 px-4" style={{ maxWidth: '100vw', height: '100vh', overflow: 'hidden' }}>
        <div className="relative rounded-[32px] border border-dashed border-white shadow-[0_30px_80px_rgba(6,12,32,0.65)] h-full" style={{ maxWidth: '1800px', margin: '0 auto' }}>
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-blue-900/90 to-slate-900 rounded-[32px]" />
          <div className="relative z-10 flex flex-col gap-2 p-4 lg:p-6 h-full" style={{ overflow: 'hidden' }}>
            {/* CurrentSelection as Unified Header - No spacing above/below */}
            <div className="flex-shrink-0">
              <CurrentSelection />
            </div>

            {/* Workspace Container */}
            <div className="relative rounded-2xl border border-dashed border-white/60 shadow-lg backdrop-blur-sm w-full flex-1" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                          
              {/* Flex layout: CurrentSelection | TreeNavigator | Preview | AI */}
              <div 
                className="flex-1 px-3 lg:px-4 pb-3 lg:pb-4 flex gap-4"
                style={{ minHeight: 0, overflow: 'hidden' }}
              >
                {/* Left Column: Unified Tree Navigator - Fixed width */}
                <div className="flex-shrink-0" style={{ width: '320px', minHeight: 0, maxHeight: '100%', overflow: 'hidden' }}>
                  <TreeNavigator />
                </div>
                            
                {/* Preview Area - Grows to fill space */}
                <div className="flex-1 flex flex-col" style={{ minWidth: 0, minHeight: 0, maxHeight: '100%', overflow: 'hidden' }}>
                  {/* Preview */}
                  <div className="flex-1" style={{ minHeight: 0, maxHeight: '100%', overflow: 'hidden' }}>
                    <PreviewWorkspace />
                  </div>
                </div>
                
                {/* AI Assistant - Collapsible */}
                <div 
                  className="flex-shrink-0 transition-all duration-300" 
                  style={{ width: isAICollapsed ? '40px' : '360px', minHeight: 0, maxHeight: '100%', overflow: 'hidden' }}
                >
                  <SectionEditor
                    sectionId={activeSectionId}
                    onClose={() => {}}
                    isCollapsed={isAICollapsed}
                    onToggleCollapse={() => setIsAICollapsed(!isAICollapsed)}
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


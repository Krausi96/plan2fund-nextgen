import React, { useState } from 'react';

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
  
  // Resizable column states
  const [leftColumnWidth, setLeftColumnWidth] = useState(320);
  const [rightColumnWidth, setRightColumnWidth] = useState(360);
  const [isDragging, setIsDragging] = useState(false);
  
  // Drag handlers for resizable columns
  const handleMouseDown = (e: React.MouseEvent, column: 'left' | 'right') => {
    e.preventDefault();
    setIsDragging(true);
    
    const startX = e.clientX;
    const startWidth = column === 'left' ? leftColumnWidth : rightColumnWidth;
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const newWidth = Math.max(200, Math.min(600, startWidth + (column === 'left' ? deltaX : -deltaX)));
      
      if (column === 'left') {
        setLeftColumnWidth(newWidth);
      } else {
        setRightColumnWidth(newWidth);
      }
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

// Default product selection removed - user should select product manually
  
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
    <div className="bg-gradient-to-br from-blue-950 via-blue-900 to-blue-950 text-textPrimary">
      <DevClearCacheButton />
      
      <div className="relative border border-dashed border-white shadow-[0_30px_80px_rgba(6,12,32,0.65)] h-full" style={{ maxWidth: '1800px', margin: '0 auto', height: 'calc(100vh - 90px)' }}>
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-blue-900/90 to-slate-900" />
          <div className="relative z-10 flex flex-col h-full">
            {/* Workspace Container - Now fills entire space */}
            <div className="relative border border-dashed border-white/60 shadow-lg backdrop-blur-sm w-full flex-1" style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                          
              {/* Flex layout: CurrentSelection | TreeNavigator | Preview | AI */}
              <div 
                className={`flex-1 flex ${isDragging ? 'cursor-col-resize' : ''}`}
                style={{ minHeight: 0 }}
              >
                {/* Left Column: Unified Tree Navigator - Draggable width */}
                <div className="flex-shrink-0 relative" style={{ width: `${leftColumnWidth}px`, minHeight: 0, maxHeight: '100%', overflow: 'hidden' }}>
                  <TreeNavigator />
                  {/* Draggable separator */}
                  <div 
                    className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize bg-transparent hover:bg-blue-400/30 transition-colors z-20"
                    onMouseDown={(e) => handleMouseDown(e, 'left')}
                  ></div>
                  <div className="absolute right-0 top-0 bottom-0 w-px bg-white/20"></div>
                </div>
                            
                {/* Preview Area - Scrollable content with fixed readiness bar */}
                <div className="flex-1 flex flex-col" style={{ minWidth: 0, minHeight: 0 }}>
                  <div className="flex-1 overflow-auto">
                    <PreviewWorkspace />
                  </div>
                </div>
                
                {/* AI Assistant - Draggable and Collapsible */}
                <div 
                  className="flex-shrink-0 transition-all duration-300 relative"
                  style={{ width: isAICollapsed ? '40px' : `${rightColumnWidth}px`, minHeight: 0, maxHeight: '100%', overflow: 'hidden' }}
                >
                  {!isAICollapsed && (
                    /* Draggable separator */
                    <div 
                      className="absolute left-0 top-0 bottom-0 w-2 cursor-col-resize bg-transparent hover:bg-blue-400/30 transition-colors z-20"
                      onMouseDown={(e) => handleMouseDown(e, 'right')}
                    ></div>
                  )}
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
  );
}


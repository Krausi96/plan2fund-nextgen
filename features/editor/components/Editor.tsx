import React, { useState, useEffect } from 'react';
import TreeNavigator from './Navigation/CurrentSelection/TreeNavigator/TreeNavigator';
import PreviewWorkspace from './Preview/PreviewWorkspace';
import SectionEditor from './Editor/SectionEditor';
import { useProject } from '@/platform/core/context/hooks/useProject';
import { useI18n } from '@/shared/contexts/I18nContext';
import DevClearCacheButton from './DevTools/DevClearCacheButton';
import { v4 as uuidv4 } from 'uuid';

type EditorProps = {};

export default function Editor({}: EditorProps = {}) {
  const { t } = useI18n();
  
  // Access state from unified useProject store
  const error = useProject((state) => state.error);
  const activeSectionId = useProject((state) => state.activeSectionId);
  const plan = useProject((state) => state.planDocument);
  // DEPRECATED: blueprint removed - use documentStructure instead
  
  // Initialize project if not exists
  const projectProfile = useProject((state) => state.projectProfile);
  const editorMeta = useProject((state) => state.editorMeta);
  const setProjectProfile = useProject((state) => state.setProjectProfile);
  const setEditorMeta = useProject((state) => state.setEditorMeta);
  const setPlan = useProject((state) => state.setPlanDocument);
  const selectProgram = useProject((state) => state.selectProgram);
  
  // Initialize project on mount if not exists
  useEffect(() => {
    if (!projectProfile) {
      setProjectProfile({
        id: uuidv4(),
        name: 'Untitled Project',
        projectName: 'Project Title',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    if (!editorMeta) {
      setEditorMeta({
        author: 'Author Name',
        confidentiality: 'confidential',
        contactInfo: {
          email: '',
          phone: '',
          website: '',
          address: '',
        },
      });
    }
    if (!plan) {
      setPlan({
        id: uuidv4(),
        language: 'en',
        sections: [],
        metadata: {},
        settings: {
          includeTitlePage: true,
          includePageNumbers: true,
          titlePage: {
            title: 'Project Title',
            subtitle: 'Subtitle',
            companyName: 'Company Name',
            date: new Date().toISOString().split('T')[0],
          },
        },
      });
    }
    
    // Load selected program from localStorage and set it in the store
    if (typeof window !== 'undefined') {
      const savedProgram = localStorage.getItem('selectedProgram');
      if (savedProgram) {
        try {
          const program = JSON.parse(savedProgram);
          selectProgram(program);
          localStorage.removeItem('selectedProgram'); // Clean up after loading
        } catch (error) {
          console.error('Failed to parse selected program from localStorage:', error);
        }
      }
    }
  }, [projectProfile, editorMeta, plan, setProjectProfile, setEditorMeta, setPlan, selectProgram]);
  

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
  const isWaitingForPlan = !plan;
  
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
                  style={{ width: `${rightColumnWidth}px`, minHeight: 0, maxHeight: '100%', overflow: 'hidden' }}
                >
                  {/* Draggable separator */}
                  <div 
                    className="absolute left-0 top-0 bottom-0 w-2 cursor-col-resize bg-transparent hover:bg-blue-400/30 transition-colors z-20"
                    onMouseDown={(e) => handleMouseDown(e, 'right')}
                  ></div>
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
  );
}


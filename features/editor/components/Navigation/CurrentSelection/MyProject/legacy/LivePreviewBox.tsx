import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useProject } from '@/platform/core/context/hooks/useProject';
import { useI18n } from '@/shared/contexts/I18nContext';
import { TitlePageRenderer } from '@/features/editor/components/Preview/renderers/TitlePageRenderer';
import type { PlanDocument } from '@/platform/core/types';


interface LivePreviewBoxProps {
  show: boolean;
}

interface Position {
  x: number;
  y: number;
}

const LivePreviewBox: React.FC<LivePreviewBoxProps> = ({ show }) => {
  // ALL HOOKS MUST BE CALLED AT THE TOP LEVEL - BEFORE ANY CONDITIONAL LOGIC
  
  // State hooks
  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  
  // Ref hooks
  const dragRef = useRef<HTMLDivElement>(null);
  const startPos = useRef<Position>({ x: 0, y: 0 });
  
  // Store hooks
  const { t: i18nT } = useI18n();
  const editorMeta = useProject(state => state.editorMeta);
  const documentStructure = useProject(state => state.documentStructure);
  
  // Build PlanDocument from store state for legacy compatibility
  const planDocument: PlanDocument = {
    language: (editorMeta?.language as 'en' | 'de' | undefined) || 'en',
    settings: {
      titlePage: {
        title: editorMeta?.mainObjective || '',
        subtitle: editorMeta?.subtitle || '',
        companyName: editorMeta?.author || '',
        confidentialityStatement: editorMeta?.confidentialityStatement || '',
        logoUrl: editorMeta?.logoUrl || '',
        date: editorMeta?.date || '',
        contactInfo: editorMeta?.contactInfo || {},
      },
    },
    sections: (documentStructure?.sections as any) || [],
  };
  
  // Build titlePageSettings from editorMeta for hasTitlePageData check
  const titlePageSettings = planDocument.settings.titlePage;
  
  // Drag event handlers with useCallback to prevent re-creation
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (dragRef.current && e.target === dragRef.current) {
      setIsDragging(true);
      startPos.current = {
        x: e.clientX - position.x,
        y: e.clientY - position.y
      };
      e.preventDefault();
      e.stopPropagation();
    }
  }, [position.x, position.y]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      const newX = e.clientX - startPos.current.x;
      const newY = e.clientY - startPos.current.y;
      setPosition({
        x: newX,
        y: newY
      });
    }
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
    }
  }, [isDragging]);

  // Add/remove mouse event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);
  
  // Early return if not showing - AFTER all hooks
  if (!show) return null;
  
  // Constants and derived values (after hooks)
  const disabledSections = new Set<string>();
  
  // Translation setup
  const typedT = i18nT as any;
  const t = {
    businessPlan: typedT('businessPlan'),
    author: typedT('editor.desktop.setupWizard.fields.author'),
    email: typedT('editor.desktop.setupWizard.fields.email'),
    phone: typedT('editor.desktop.setupWizard.fields.phone'),
    website: typedT('editor.desktop.setupWizard.fields.website'),
    address: typedT('editor.desktop.setupWizard.fields.address'),
    date: typedT('editor.desktop.setupWizard.fields.date'),
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
    // Preview box translations
    livePreview: typedT('editor.desktop.preview.livePreview') || '📄 Live Preview',
    startYourProject: typedT('editor.desktop.preview.startYourProject') || 'Start Your Project',
    enterProjectDetails: typedT('editor.desktop.preview.enterProjectDetails') || 'Enter project details to see preview',
    toggleMinimize: typedT('editor.desktop.preview.toggleMinimize') || 'Minimize preview',
    toggleMaximize: typedT('editor.desktop.preview.toggleMaximize') || 'Maximize preview'
  };

  // Check if we have data to show
  const hasTitlePageData = titlePageSettings && (
    titlePageSettings.title?.trim() ||
    titlePageSettings.companyName?.trim() ||
    titlePageSettings.subtitle?.trim()
  );

  // Empty state
  if (!hasTitlePageData) {
    const emptyStateElement = (
      <>
        {/* Global toggle button - always visible */}
        {isMinimized && (
          <div 
            className="fixed w-12 h-12 bg-slate-800/95 backdrop-blur-sm rounded-lg border border-slate-600 shadow-2xl z-[999999] flex items-center justify-center cursor-pointer"
            style={{ right: '20px', top: '80px' }}
            onClick={() => setIsMinimized(false)}
            title={t.toggleMaximize}
          >
            <div className="text-white text-lg font-bold">📄</div>
          </div>
        )}
        
        {/* Main preview box */}
        <div 
          className={`fixed ${isMinimized ? 'w-12 h-12' : 'top-20 right-0 w-[min(85vw,400px)] h-[min(70vh,350px)]'} bg-slate-800/95 backdrop-blur-sm rounded-lg border border-slate-600 shadow-2xl z-[999998] flex flex-col`} 
          style={!isMinimized ? { transform: `translate(${position.x}px, ${position.y}px)` } : { right: '20px', top: '80px' }}
        >
          <div 
            ref={dragRef}
            className="w-full bg-slate-700/80 rounded-t-lg cursor-move select-none border-b border-slate-600/30"
            onMouseDown={handleMouseDown}
          >
            <div className="flex items-center justify-between w-full px-2 py-1.5">
              <div className="w-full flex justify-center">
                <h3 className="text-white/90 font-normal text-xs flex-1 text-center">{t.livePreview}</h3>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMinimized(!isMinimized);
                  }}
                  className="text-white hover:text-gray-300 transition-colors"
                  title={isMinimized ? t.toggleMaximize : t.toggleMinimize}
                >
                  {isMinimized ? '□' : '−'}
                </button>
                <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
              </div>
            </div>
          </div>
          
          {!isMinimized && (
            <div className="flex-1 p-6 flex items-center justify-center bg-slate-100">
              <div className="text-center max-w-[80%]">
                <div className="text-4xl mb-4">📝</div>
                <h3 className="text-lg font-bold text-gray-700 mb-2">{t.startYourProject}</h3>
                <p className="text-gray-500 text-sm">{t.enterProjectDetails}</p>
              </div>
            </div>
          )}
        </div>
      </>
    );
    
    return typeof window !== 'undefined' ? createPortal(emptyStateElement, document.body) : null;
  }

  // Main preview with responsive A4 page display
  const floatingPreview = (
    <>
      {/* Global toggle button - always visible */}
      {isMinimized && (
        <div 
          className="fixed w-12 h-12 bg-white rounded-lg shadow-2xl z-[999999] flex items-center justify-center cursor-pointer border-2 border-slate-300"
          style={{ right: '20px', top: '80px' }}
          onClick={() => setIsMinimized(false)}
          title={t.toggleMaximize}
        >
          <div className="text-slate-700 text-lg font-bold">📄</div>
        </div>
      )}
      
      {/* Main preview box */}
      <div 
        className={`fixed ${isMinimized ? 'w-12 h-12' : 'top-16 right-0 w-[75vw] max-w-[450px] h-[70vh] md:h-[60vh] lg:h-[60vh]'} bg-slate-100 rounded-lg shadow-2xl z-[999998] flex flex-col`} 
        style={!isMinimized ? { transform: `translate(${position.x}px, ${position.y}px)` } : { right: '20px', top: '80px' }}
      >
        <div 
          ref={dragRef}
          className="w-full bg-slate-700/80 rounded-t-lg cursor-move select-none border-b border-slate-600/30"
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center justify-between px-2 py-1.5 w-full">
            <div className="w-full flex justify-center">
              <h3 className="text-white/90 font-normal text-xs flex-1 text-center">{t.livePreview}</h3>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMinimized(!isMinimized);
                }}
                className="text-white hover:text-gray-300 transition-colors"
                title={isMinimized ? t.toggleMaximize : t.toggleMinimize}
              >
                {isMinimized ? '□' : '−'}
              </button>
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
            </div>
          </div>
        </div>
        
        {!isMinimized && (
          <div className="flex-1 p-4 flex items-center justify-center overflow-auto">
            <div className="preview-content-wrapper" style={{ transform: 'scale(0.85)', transformOrigin: 'center' }}>
              <div style={{'--preview-padding-top': '0.8cm', '--preview-padding-right': '1cm', '--preview-padding-bottom': '0.9cm', '--preview-padding-left': '0.8cm'} as React.CSSProperties} className="shadow-sm border border-slate-200/50 rounded-sm bg-white">
                <TitlePageRenderer 
                  planDocument={planDocument} 
                  disabledSections={disabledSections} 
                  t={t} 
                  compact={true}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );

  return typeof window !== 'undefined' ? createPortal(floatingPreview, document.body) : null;
};

export default LivePreviewBox;
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useEditorStore } from '@/features/editor/lib';
import { useI18n } from '@/shared/contexts/I18nContext';
import { TitlePageRenderer } from '@/features/editor/components/Preview/renderers/TitlePageRenderer';


interface LivePreviewBoxProps {
  show: boolean;
}

interface Position {
  x: number;
  y: number;
}

const LivePreviewBox: React.FC<LivePreviewBoxProps> = ({ show }) => {
  // ALL HOOKS MUST BE CALLED AT THE TOP LEVEL
  
  // State hooks
  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  
  // Ref hooks
  const dragRef = useRef<HTMLDivElement>(null);
  const startPos = useRef<Position>({ x: 0, y: 0 });
  
  // Store hooks
  const planDocument = useEditorStore(state => state.plan);
  const { t: i18nT } = useI18n();
  
  // Early return if not showing
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
  const hasTitlePageData = planDocument?.settings?.titlePage && (
    planDocument.settings.titlePage.title?.trim() ||
    planDocument.settings.titlePage.companyName?.trim() ||
    planDocument.settings.titlePage.subtitle?.trim()
  );

  // Drag event handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (dragRef.current && e.target === dragRef.current) {
      setIsDragging(true);
      startPos.current = {
        x: e.clientX - position.x,
        y: e.clientY - position.y
      };
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      const newX = e.clientX - startPos.current.x;
      const newY = e.clientY - startPos.current.y;
      setPosition({
        x: newX,
        y: newY
      });
    }
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
    }
  };

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
            className="flex items-center justify-between p-2 bg-slate-700 rounded-t-lg cursor-move select-none"
            onMouseDown={handleMouseDown}
          >
            <h3 className="text-white font-medium text-sm">{t.livePreview}</h3>
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
          
          {!isMinimized && (
            <div className="flex-1 p-6 flex items-center justify-center bg-white">
              <div className="text-center">
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
        className={`fixed ${isMinimized ? 'w-12 h-12' : 'top-16 right-0 w-[75vw] max-w-[425px] h-[75vh] md:h-[65vh] lg:h-[65vh]'} bg-white rounded-lg shadow-2xl z-[999998] flex flex-col`} 
        style={!isMinimized ? { transform: `translate(${position.x}px, ${position.y}px)` } : { right: '20px', top: '80px' }}
      >
        <div 
          ref={dragRef}
          className="flex items-center justify-between p-2 bg-slate-700 rounded-t-lg cursor-move select-none"
          onMouseDown={handleMouseDown}
        >
          <h3 className="text-white font-medium text-sm">{t.livePreview}</h3>
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
        
        {!isMinimized && (
          <div className="flex-1 p-4 flex items-center justify-center overflow-auto">
            <div className="preview-content-wrapper" style={{ transform: 'scale(0.80)', transformOrigin: 'center' }}>
              <div style={{'--preview-padding-top': '1cm', '--preview-padding-right': '1.25cm', '--preview-padding-bottom': '1.125cm', '--preview-padding-left': '1cm'} as React.CSSProperties}>
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
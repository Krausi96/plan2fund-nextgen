import React from 'react';
import { createPortal } from 'react-dom';
import { useEditorStore } from '@/features/editor/lib';
import { useI18n } from '@/shared/contexts/I18nContext';
import { TitlePageRenderer } from '@/features/editor/components/Preview/renderers/TitlePageRenderer';

interface LivePreviewBoxProps {
  show: boolean;
}

const LivePreviewBox: React.FC<LivePreviewBoxProps> = ({ show }) => {
  if (!show) return null;

  const planDocument = useEditorStore(state => state.plan);
  const disabledSections = new Set<string>();
  const { t: i18nT } = useI18n();
  
  // Completely bypass TypeScript type checking - cast everything to any
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
  };

  // Check if we have data to show
  const hasTitlePageData = planDocument?.settings?.titlePage && (
    planDocument.settings.titlePage.title?.trim() ||
    planDocument.settings.titlePage.companyName?.trim() ||
    planDocument.settings.titlePage.subtitle?.trim()
  );

  // Empty state
  if (!hasTitlePageData) {
    return typeof window !== 'undefined' ? createPortal(
      <div className="fixed top-4 right-4 w-[min(90vw,450px)] h-[min(80vh,550px)] bg-slate-800/95 backdrop-blur-sm rounded-lg border border-slate-600 shadow-2xl z-[999999] flex flex-col">
        <div className="flex items-center justify-between p-2 bg-slate-700 rounded-t-lg">
          <h3 className="text-white font-medium text-sm">📄 Live Preview</h3>
          <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
        </div>
        <div className="flex-1 p-6 flex items-center justify-center bg-white">
          <div className="text-center">
            <div className="text-4xl mb-4">📝</div>
            <h3 className="text-lg font-bold text-gray-700 mb-2">Start Your Project</h3>
            <p className="text-gray-500 text-sm">Enter project details to see preview</p>
          </div>
        </div>
      </div>,
      document.body
    ) : null;
  }

  // Main preview with responsive A4 page display
  const floatingPreview = (
    <div className="fixed top-4 right-4 w-[min(90vw,450px)] h-[min(80vh,550px)] bg-slate-800/95 backdrop-blur-sm rounded-lg border border-slate-600 shadow-2xl z-[999999] flex flex-col">
      <div className="flex items-center justify-between p-2 bg-slate-700 rounded-t-lg">
        <h3 className="text-white font-medium text-sm">📄 Live Preview</h3>
        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
      </div>
      
      <div className="flex-1 p-4 bg-slate-700 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg w-full h-full flex items-center justify-center overflow-auto">
          <div className="preview-content-wrapper" style={{ transform: 'scale(0.9)', transformOrigin: 'center' }}>
            <div style={{'--preview-padding-top': '1cm', '--preview-padding-right': '1.25cm', '--preview-padding-bottom': '1.125cm', '--preview-padding-left': '1cm'} as React.CSSProperties}>
              <TitlePageRenderer 
                planDocument={planDocument} 
                disabledSections={disabledSections} 
                t={t} 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return typeof window !== 'undefined' ? createPortal(floatingPreview, document.body) : null;
};

export default LivePreviewBox;
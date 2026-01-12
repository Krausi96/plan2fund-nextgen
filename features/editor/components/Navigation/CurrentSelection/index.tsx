import React, { useState } from 'react';
import ProductSelection from './ProductSelection/ProductSelection';
import ProgramSelection from './ProgramSelection/ProgramSelection';
import ReadinessCheck from './ReadinessCheck/ReadinessCheck';
import MyProject from './MyProject/MyProject';
import { ChevronRight } from 'lucide-react';
import { useConfiguratorState, useEditorActions, useEditorStore } from '@/features/editor/lib';
import { useI18n } from '@/shared/contexts/I18nContext';

type CurrentSelectionProps = {
  overlayContainerRef?: React.RefObject<HTMLDivElement | null>;
};

/**
 * CurrentSelection component
 * Inline expandable configuration panel
 * Shows compact badges when collapsed, expands to full-width panel inline
 */
function CurrentSelection({}: CurrentSelectionProps) {
  const { t } = useI18n();
  const { selectedProductMeta, programSummary } = useConfiguratorState();
  // Removed unused section/document counts since we're now showing ReadinessCheck and MyProject instead of stats
  const isConfiguratorOpen = useEditorStore((state) => state.isConfiguratorOpen);
  const actions = useEditorActions((a) => ({
    setIsConfiguratorOpen: a.setIsConfiguratorOpen,
  }));
  
  // Handlers for clickable items
  const handleMyProjectClick = () => {
    // Navigate to My Project configuration
    console.log('Navigate to My Project');
  };
  
  const handlePlanClick = () => {
    // Open configurator and switch to product tab
    actions.setIsConfiguratorOpen(true);
    setActiveTab('product');
  };
  
  const handleProgramClick = () => {
    // Open configurator and switch to program tab
    actions.setIsConfiguratorOpen(true);
    setActiveTab('program');
  };
  
  const handleReadinessClick = () => {
    // Navigate to Readiness check
    console.log('Navigate to Readiness Check');
  };

  // Track active navigation tab
  const [activeTab, setActiveTab] = useState<'product' | 'program'>('product');
  


  const handleToggle = () => {
    actions.setIsConfiguratorOpen(!isConfiguratorOpen);
  };

  // Compact info row - single line header with all elements inline
  const CompactInfoRow = () => {
    return (
      <div className="flex items-center bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 px-4 py-2 text-white w-full">
        {/* Current Selection Label - Left side */}
        <div className="text-white font-bold text-lg whitespace-nowrap">
          {t('editor.desktop.selection.current' as any) || 'Aktuelle Auswahl:'}
        </div>
        
        {/* All 4 Parameters - Perfectly even distribution */}
        <div className="flex items-center gap-12 text-sm ml-18 flex-grow">
          {/* Mein Projekt - Clickable */}
          <div 
            className="flex flex-col items-center text-center cursor-pointer hover:bg-white/10 p-1 rounded transition-colors"
            onClick={handleMyProjectClick}
          >
            <span className="text-white/70 font-medium text-xs whitespace-nowrap mb-1 flex items-center gap-2">
              💼
              {t('editor.desktop.myProject.title' as any) || 'Mein Projekt'}
            </span>
            <div className="text-white font-medium flex items-center justify-center gap-1">
              <MyProject />
              <ChevronRight className="w-3 h-3 text-white/70" />
            </div>
          </div>
          
          <div className="w-0.5 h-4 bg-white/30"></div>  {/* Separator */}
          
          {/* PLAN - Fixed Icon - Clickable */}
          <div 
            className="flex flex-col items-center text-center cursor-pointer hover:bg-white/10 p-1 rounded transition-colors"
            onClick={handlePlanClick}
          >
            <span className="text-white/70 font-medium text-xs whitespace-nowrap mb-1 flex items-center gap-2">
              📋
              {t('editor.desktop.selection.productLabel' as any) || 'Plan'}
            </span>
            <div className="flex items-center justify-center gap-1">
              <span className="text-white font-medium truncate">
                {selectedProductMeta ? (t(selectedProductMeta.label as any) || selectedProductMeta.label) : t('editor.desktop.product.unselected' as any) || 'No plan'}
              </span>
              <ChevronRight className="w-3 h-3 text-white/70 flex-shrink-0" />
            </div>
          </div>
          
          <div className="w-0.5 h-4 bg-white/30"></div>  {/* Separator */}
          
          {/* Programm/Vorlage - Actual Programs - Clickable */}
          <div 
            className="flex flex-col items-center text-center cursor-pointer hover:bg-white/10 p-1 rounded transition-colors"
            onClick={handleProgramClick}
          >
            <span className="text-white/70 font-medium text-xs whitespace-nowrap mb-1 flex items-center gap-2">
              📚
              {t('editor.desktop.selection.programLabel' as any) || 'Programm'}
            </span>
            <div className="text-white font-medium truncate flex items-center justify-center gap-1">
              <span className="truncate">
                {programSummary?.name || t('editor.desktop.selection.noProgram' as any) || 'Kein Programm ausgewählt'}
              </span>
              <ChevronRight className="w-3 h-3 text-white/70 flex-shrink-0" />
            </div>
          </div>
          
          <div className="w-0.5 h-4 bg-white/30"></div>  {/* Separator */}
          
          {/* Readiness Check - Clickable */}
          <div 
            className="flex flex-col items-center text-center cursor-pointer hover:bg-white/10 p-1 rounded transition-colors"
            onClick={handleReadinessClick}
          >
            <span className="text-white/70 font-medium text-xs whitespace-nowrap mb-1 flex items-center gap-2">
              📊
              {t('editor.desktop.readinessCheck.title' as any) || 'Readiness'}
            </span>
            <div className="text-white font-medium flex items-center justify-center gap-1">
              <ReadinessCheck />
              <ChevronRight className="w-3 h-3 text-white/70" />
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Simple inline expansion with horizontal tabs - full-width expansion below header
  const InlineExpansion = () => {
    if (!isConfiguratorOpen) return null;

    return (
      <div className="mt-4 w-full">
        {/* Expanded panel */}
        <div className="rounded-lg border-2 border-blue-400 bg-slate-900 shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/20 bg-gradient-to-br from-blue-975 via-blue-800 to-blue-975">
            <h2 className="text-lg font-bold uppercase tracking-wide text-white">
              {t('editor.desktop.selection.current' as any) || 'Configure Selection'}
            </h2>
            <button
              onClick={handleToggle}
              className="text-white/60 hover:text-white text-xl leading-none transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10"
            >
              ×
            </button>
          </div>
          
          {/* Horizontal Tabs */}
          <div className="flex border-b border-white/20 bg-slate-800">
            <button
              onClick={() => setActiveTab('product')}
              className={`flex-1 px-6 py-4 text-center text-base font-medium transition-colors flex items-center justify-center gap-2 ${
                activeTab === 'product'
                  ? 'bg-blue-600 text-white'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span>📦</span>
              {t('editor.desktop.config.step1.title' as any) || 'Product'}
              {selectedProductMeta && <span className="ml-1 text-xs text-green-400">✓</span>}
            </button>
            <button
              onClick={() => setActiveTab('program')}
              className={`flex-1 px-6 py-4 text-center text-base font-medium transition-colors flex items-center justify-center gap-2 ${
                activeTab === 'program'
                  ? 'bg-blue-600 text-white'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span>🎯</span>
              {t('editor.desktop.config.step2.title' as any) || 'Program'}
              {programSummary && <span className="ml-1 text-xs text-green-400">✓</span>}
            </button>
          </div>

          {/* Dynamic height content area - no fixed height limit */}
          <div className="p-6 bg-slate-800/50 max-h-[60vh]">
            <div className="overflow-y-auto">
              {activeTab === 'product' && <ProductSelection />}
              {activeTab === 'program' && <ProgramSelection />}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full">
      <CompactInfoRow />
      <InlineExpansion />
    </div>
  );
}

// Memoize component to prevent unnecessary re-renders when parent re-renders
export default React.memo(CurrentSelection);
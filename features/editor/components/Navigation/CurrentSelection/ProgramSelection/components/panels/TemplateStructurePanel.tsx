import React, { useCallback } from 'react';
import { useEditorStore } from '@/features/editor/lib';

interface TemplateStructurePanelProps {
  selectedOption?: 'program' | 'template' | 'free' | null;
  // Add callback props for actual functionality
  onClearTemplate?: () => void;
}

export function TemplateStructurePanel({ selectedOption, onClearTemplate }: TemplateStructurePanelProps) {
  const setupWizard = useEditorStore((state) => state.setupWizard);
  const documentStructure = setupWizard.documentStructure;
  
  // Group sections by document
  const getSectionsByDocument = useCallback(() => {
    if (!documentStructure?.sections) return {};
    
    const grouped: Record<string, any[]> = {};
    documentStructure.sections.forEach(section => {
      const docId = section.documentId || 'main_document';
      if (!grouped[docId]) {
        grouped[docId] = [];
      }
      grouped[docId].push(section);
    });
    return grouped;
  }, [documentStructure]);



  const sectionsByDoc = getSectionsByDocument();
  // Only show template data when template option is selected AND we have template data
  const hasTemplateData = selectedOption === 'template' && !!documentStructure?.source && documentStructure.source === 'template';
  
  // Toggle document expansion
  const toggleDocument = (docId: string) => {
    setExpandedDocuments(prev => ({
      ...prev,
      [docId]: !prev[docId]
    }));
  };

  // Actual clear functionality - UPDATE TO EMPTY STATE WITHOUT CLOSING
  const handleClear = () => {
    if (onClearTemplate) {
      onClearTemplate();
    } else {
      // Default clear behavior - reset to empty state
      console.log('🗑️ Clearing template structure - updating to empty state');
      // Clear the document structure using direct store access
      const store = useEditorStore.getState();
      store.setDocumentStructure(null);
      store.setSetupStatus('none');
      store.setSetupDiagnostics(null);
      // DO NOT clear selectedOption - keep panel open and selection intact
    }
  };
  
  // Collapsible state management
  const [expandedDocuments, setExpandedDocuments] = React.useState<Record<string, boolean>>({});

  return (
    <div className="bg-slate-800/50 rounded-xl border border-white/10 p-4 h-full flex flex-col">
      {/* Improved Header with Action Buttons */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-lg">🔍</span>
            </div>
            <h3 className="text-white font-bold text-lg">Template Analysis</h3>
          </div>
          
          {/* Action Buttons - Top Right (REFRESH REMOVED) */}
          <div className="flex gap-1.5">
            <button
              onClick={handleClear}
              disabled={!hasTemplateData}
              className="w-8 h-8 bg-red-600/80 hover:bg-red-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-xs rounded-lg transition-colors flex items-center justify-center"
              title="Clear"
            >
              <span>🗑️</span>
            </button>
          </div>
        </div>
        
        {hasTemplateData ? (
          <h4 className="text-white font-semibold text-base mb-2 truncate" title={documentStructure?.documents?.[0]?.name}>
            {documentStructure?.documents?.[0]?.name || 'Document structure detected'}
          </h4>
        ) : (
          <div className="bg-slate-700/50 rounded-lg p-6 text-center">
            <div className="text-white/60 text-2xl mb-2">🧩</div>
            <p className="text-white/80 text-sm">
              Upload a template to analyze structure
            </p>
          </div>
        )}
      </div>

      {/* Template Content */}
      {hasTemplateData && (
        <div className="space-y-4 mb-4 flex-1">
          {/* Document Tree Structure */}
          <div className="bg-purple-900/20 border border-purple-700/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-purple-300 text-lg">📁</span>
              <h4 className="text-purple-200 font-semibold text-base flex-1">Document Structure</h4>
            </div>
                      
            <div className="space-y-2 ml-2">
              {Object.entries(sectionsByDoc).map(([docId, sections]) => {
                const isExpanded = expandedDocuments[docId] ?? true; // Default to expanded
                const docName = documentStructure?.documents?.find(d => d.id === docId)?.name || docId;
                
                return (
                  <div key={docId}>
                    {/* Document Header with Collapse Toggle */}
                    <div 
                      className="flex items-center gap-2 text-white font-medium mb-2 cursor-pointer hover:bg-white/5 rounded p-1 -ml-1"
                      onClick={() => toggleDocument(docId)}
                    >
                      <span className="truncate flex-1" title={docName}>
                        {docName}
                      </span>
                      <span className="text-purple-300 transform transition-transform duration-200 ml-2">
                        {isExpanded ? '▼' : '▶'}
                      </span>
                    </div>
                            
                    {/* Collapsible Nested Sections */}
                    <div 
                      className={`overflow-hidden transition-all duration-300 ease-in-out ml-6 border-l-2 border-purple-500/30 pl-3 ${isExpanded ? 'max-h-[1000px]' : 'max-h-0'}`}
                    >
                      <div className="space-y-2 py-1">
                        {/* Standard Document Structure */}
                        <div className="text-purple-200 text-sm flex items-center gap-2">
                          <span>📕</span>
                          <span>Title Page</span>
                        </div>
                        <div className="text-purple-200 text-sm flex items-center gap-2">
                          <span>📑</span>
                          <span>Table of Contents</span>
                        </div>
                              
                        {/* Document Sections */}
                        {sections.slice(0, 5).map((section: any, idx: number) => (
                          <div key={idx} className="text-purple-200 text-sm flex items-center gap-2 truncate" title={section.title}>
                            <span>🧾</span>
                            <span className="truncate flex-1">{section.title}</span>
                            {section.required && (
                              <span className="text-red-400 font-bold flex-shrink-0">*</span>
                            )}
                          </div>
                        ))}
                              
                        {/* Additional Document Elements */}
                        <div className="text-purple-200 text-sm flex items-center gap-2">
                          <span>📚</span>
                          <span>References</span>
                        </div>
                        <div className="text-purple-200 text-sm flex items-center gap-2">
                          <span>📊</span>
                          <span>Tables/Data</span>
                        </div>
                        <div className="text-purple-200 text-sm flex items-center gap-2">
                          <span>🖼️</span>
                          <span>Figures/Images</span>
                        </div>
                        <div className="text-purple-200 text-sm flex items-center gap-2">
                          <span>📎</span>
                          <span>Appendices</span>
                        </div>
                              
                        {sections.length > 5 && (
                          <div className="text-purple-300 text-sm italic">+{sections.length - 5} more sections</div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
                        

            </div>
          </div>
            

            
          {/* Overlay Toggle */}
          <div className="bg-slate-700/50 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <input 
                type="checkbox" 
                className="mt-1 w-4 h-4 rounded border-white/30 bg-white/10 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="text-white font-medium text-sm">Add program requirements later</div>
                <div className="text-white/70 text-sm mt-1 truncate">
                  Overlay program requirements onto template
                </div>
              </div>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}
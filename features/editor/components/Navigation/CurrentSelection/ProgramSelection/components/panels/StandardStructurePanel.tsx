import React from 'react';
import { useEditorStore } from '@/features/editor/lib';

interface StandardStructurePanelProps {
  onGenerate?: () => void;
  onEdit?: () => void;
  onClear?: () => void;
  selectedOption?: 'program' | 'template' | 'free' | null;
}

export function StandardStructurePanel({ onGenerate, onEdit, onClear, selectedOption }: StandardStructurePanelProps) {
  const setupWizard = useEditorStore((state) => state.setupWizard);
  const documentStructure = setupWizard.documentStructure;

  const getRequiredDocuments = () => {
    return documentStructure?.documents || [];
  };

  const getRequiredSections = () => {
    return documentStructure?.sections || [];
  };

  // Helper function to convert structure ID to human-readable name
  const getStructureDisplayName = () => {
    if (!documentStructure?.structureId) return 'Custom structure';
    
    const structureId = documentStructure.structureId;
    
    // Extract structure type from ID (format: standard-{type}-{timestamp})
    const match = structureId.match(/^standard-([^-]+)-\d+$/);
    if (match) {
      const type = match[1];
      const structureNames: Record<string, string> = {
        'business-plan': 'Business Plan',
        'strategy': 'Strategy Document',
        'pitch-deck': 'Pitch Deck Outline'
      };
      return structureNames[type] || `${type.replace(/-/g, ' ')} Structure`;
    }
    
    // Fallback for other formats
    return structureId.replace(/^standard-/, '').replace(/-\d+$/, '').replace(/-/g, ' ');
  };



  // Only show structure data when free option is selected AND we have standard structure data
  const hasStructureData = selectedOption === 'free' && !!documentStructure?.source && documentStructure.source === 'standard';
  
  // Collapsible state management
  const [expandedDocuments, setExpandedDocuments] = React.useState<Record<string, boolean>>({});
  
  // Toggle document expansion
  const toggleDocument = (docId: string) => {
    setExpandedDocuments(prev => ({
      ...prev,
      [docId]: !prev[docId]
    }));
  };

  return (
    <div className="bg-slate-800/50 rounded-xl border border-white/10 p-4 h-full flex flex-col">
      
      {/* Improved Header */}
      <div className="mb-2">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-lg">📋</span>
          </div>
          <h3 className="text-white font-bold text-lg">Standard Structure</h3>
        </div>
        
        {hasStructureData ? (
          <div className="h-0"></div>
        ) : (
          <div className="bg-slate-700/50 rounded-lg p-6 text-center">
            <div className="text-white/60 text-2xl mb-2">📋</div>
            <p className="text-white/80 text-sm">
              Select a base structure to start
            </p>
          </div>
        )}
      </div>

      {/* Standard Content */}
      {hasStructureData && (
        <div className="space-y-4 mb-4 flex-1">
          
          {/* Selected Structure Display */}
          <div className="bg-slate-800/50 rounded-xl border border-green-400/30 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-500/30 flex items-center justify-center flex-shrink-0 border-2 border-green-400">
                <span className="text-green-300 text-lg">✓</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-semibold text-base mb-1 truncate" title={getStructureDisplayName()}>
                  Selected: {getStructureDisplayName()}
                </h3>
                <p className="text-green-300 text-xs truncate">
                  Standard document structure
                </p>
              </div>
            </div>
          </div>
          
          {/* Document Tree Structure */}
          <div className="bg-green-900/20 border border-green-700/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-green-300 text-lg">📁</span>
              <h4 className="text-green-200 font-semibold text-base flex-1">Document Structure</h4>
            </div>
                      
            <div className="space-y-2 ml-2">
              {getRequiredDocuments().map((doc: any, index: number) => {
                const docId = doc.id || `doc-${index}`;
                const isExpanded = expandedDocuments[docId] ?? true; // Default to expanded
                
                return (
                  <div key={docId}>
                    {/* Document Header with Collapse Toggle */}
                    <div 
                      className="flex items-center gap-2 text-white font-medium mb-2 cursor-pointer hover:bg-white/5 rounded p-1 -ml-1"
                      onClick={() => toggleDocument(docId)}
                    >
                      <span className="truncate flex-1" title={doc.name}>
                        {doc.name}
                      </span>
                      <span className="text-green-300 transform transition-transform duration-200 ml-2">
                        {isExpanded ? '▼' : '▶'}
                      </span>
                    </div>
                            
                    {/* Collapsible Nested Sections */}
                    <div 
                      className={`overflow-hidden transition-all duration-300 ease-in-out ml-6 border-l-2 border-green-500/30 pl-3 ${isExpanded ? 'max-h-[1000px]' : 'max-h-0'}`}
                    >
                      <div className="space-y-2 py-1">
                        {/* Standard Document Structure */}
                        <div className="text-green-200 text-sm flex items-center gap-2">
                          <span>📕</span>
                          <span>Title Page</span>
                        </div>
                        <div className="text-green-200 text-sm flex items-center gap-2">
                          <span>📑</span>
                          <span>Table of Contents</span>
                        </div>
                              
                        {/* Document Sections */}
                        {getRequiredSections()
                          .filter(section => section.documentId === doc.id)
                          .slice(0, 5)
                          .map((section: any, idx: number) => (
                            <div key={idx} className="text-green-200 text-sm flex items-center gap-2 truncate" title={section.title}>
                              <span>🧾</span>
                              <span className="truncate flex-1">{section.title}</span>
                              {section.required && (
                                <span className="text-red-400 font-bold flex-shrink-0">*</span>
                              )}
                            </div>
                          ))}
                              
                        {/* Additional Document Elements */}
                        <div className="text-green-200 text-sm flex items-center gap-2">
                          <span>📚</span>
                          <span>References</span>
                        </div>
                        <div className="text-green-200 text-sm flex items-center gap-2">
                          <span>📊</span>
                          <span>Tables/Data</span>
                        </div>
                        <div className="text-green-200 text-sm flex items-center gap-2">
                          <span>🖼️</span>
                          <span>Figures/Images</span>
                        </div>
                        <div className="text-green-200 text-sm flex items-center gap-2">
                          <span>📎</span>
                          <span>Appendices</span>
                        </div>
                              
                        {getRequiredSections().filter(s => s.documentId === doc.id).length > 5 && (
                          <div className="text-green-300 text-sm italic">
                            +{getRequiredSections().filter(s => s.documentId === doc.id).length - 5} more
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
                        

            </div>
          </div>
            

        </div>
      )}

      {/* Actions */}
      <div className="pt-4 border-t border-white/10">
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={onGenerate}
            disabled={!hasStructureData}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <span>🔄</span>
            <span className="hidden sm:inline">Regenerate</span>
          </button>
          <button
            onClick={onEdit}
            disabled={!hasStructureData}
            className="px-3 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <span>✏️</span>
            <span className="hidden sm:inline">Edit</span>
          </button>
          <button
            onClick={onClear}
            disabled={!hasStructureData}
            className="px-3 py-2 bg-red-600/80 hover:bg-red-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <span>🗑️</span>
            <span className="hidden sm:inline">Clear</span>
          </button>
        </div>
      </div>
    </div>
  );
}
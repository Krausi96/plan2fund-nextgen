import React from 'react';
import { useEditorStore } from '@/features/editor/lib';

interface StandardStructurePanelProps {
  onGenerate?: () => void;
  onEdit?: () => void;
  onClear?: () => void;
}

export function StandardStructurePanel({ onGenerate, onEdit, onClear }: StandardStructurePanelProps) {
  const setupWizard = useEditorStore((state) => state.setupWizard);
  const documentStructure = setupWizard.documentStructure;

  const getRequiredDocuments = () => {
    return documentStructure?.documents || [];
  };

  const getRequiredSections = () => {
    return documentStructure?.sections || [];
  };



  const hasStructureData = !!documentStructure;

  return (
    <div className="bg-slate-800/50 rounded-xl border border-white/10 p-4 h-full flex flex-col">
      {/* Improved Header */}
      <div className="mb-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-lg">📋</span>
          </div>
          <h3 className="text-white font-bold text-lg">Standard Structure</h3>
        </div>
        
        {hasStructureData ? (
          <h4 className="text-white font-semibold text-base mb-2 truncate" title={documentStructure?.structureId}>
            {documentStructure?.structureId || 'Custom structure'}
          </h4>
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
          {/* Document Tree Structure */}
          <div className="bg-green-900/20 border border-green-700/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-green-300 text-lg">📁</span>
              <h4 className="text-green-200 font-semibold text-base flex-1">Document Structure</h4>
            </div>
                      
            <div className="space-y-3 ml-2">
              {getRequiredDocuments().map((doc: any, index: number) => (
                <div key={index}>
                  <div className="text-white font-medium mb-2 truncate" title={doc.name}>
                    {doc.name}
                  </div>
                            
                  {/* Nested Sections under Document */}
                  <div className="ml-6 space-y-2 border-l-2 border-green-500/30 pl-3">
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
              ))}
                        
              {getRequiredDocuments().length === 0 && (
                <div className="ml-2">
                  <div className="text-white font-medium mb-2">Document</div>
                  <div className="ml-6 space-y-2 border-l-2 border-green-500/30 pl-3">
                    <div className="text-green-200 text-sm flex items-center gap-2">
                      <span>📕</span>
                      <span>Title Page</span>
                    </div>
                    <div className="text-green-200 text-sm flex items-center gap-2">
                      <span>📑</span>
                      <span>Table of Contents</span>
                    </div>
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
                  </div>
                </div>
              )}
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
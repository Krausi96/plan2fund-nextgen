import React, { useState, useCallback } from 'react';
import { useProject } from '@/platform/core/context/hooks/useProject';
import { analyzeDocument } from '@/platform/analysis';
import type { DocumentStructure } from '@/platform/core/types';

interface DocumentUploadPanelProps {
  onNavigateToBlueprint?: () => void;
  onUploadComplete?: () => void;
}

export function DocumentUploadPanel({ onNavigateToBlueprint, onUploadComplete }: DocumentUploadPanelProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadMode, setUploadMode] = useState<'template'>('template');
  const [isProcessing, setIsProcessing] = useState(false);

  // Access platform store for document setup management
  const setDocumentStructure = useProject((state) => state.setDocumentStructure);
  const setSetupStatus = useProject((state) => state.setSetupStatus);
  const setSetupDiagnostics = useProject((state) => state.setSetupDiagnostics);
  const setInferredProductType = useProject((state) => state.setInferredProductType);
  // Note: selectedOption is managed locally in ProgramSelection, accessed via onUploadComplete callback



  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    handleFiles(files);
  }, []);

  const handleFiles = useCallback(async (files: File[]) => {
    const validFiles = files.filter(file =>
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.type === 'application/pdf'
    );

    if (validFiles.length === 0) {
      alert('Please upload valid DOCX or PDF files');
      return;
    }

    await processAndHandleUpload(validFiles);
  }, [uploadMode]);

  const processAndHandleUpload = async (files: File[]) => {
    setIsProcessing(true);

    try {
      // Process the document using the centralized analyzer
      const result = await analyzeDocument(files, uploadMode);

      // Requirements will be added separately after document upload
      // This maintains the proper separation of concerns:
      // 1. Document upload: pure content extraction
      // 2. Requirements: added via generic enrichment or funding overlay

      console.log('[processAndHandleUpload] Sections with requirements:', result.documentStructure.sections.length);
      console.log('[processAndHandleUpload] Source:', result.documentStructure.metadata?.source);

      // Update store with the processed structure
      setDocumentStructure(result.documentStructure);
      setSetupStatus('draft');
      setSetupDiagnostics({
        warnings: result.warnings || [],
        missingFields: [],
        confidence: result.confidence || 0
      });
      setInferredProductType(result.inferredProductType);

      // Notify parent that upload is complete
      if (onUploadComplete) {
        onUploadComplete();
      }

      console.log('[processAndHandleUpload] Store updated, sections ready');

      // DO NOT auto-navigate - let user see the template structure first
      // User can click Continue to go to Blueprint Instantiation
      // if (onNavigateToBlueprint) {
      //   onNavigateToBlueprint();
      // }
    } catch (error) {
      console.error('Document processing failed:', error);
      alert('Failed to process document. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };





  return (
    <div className="space-y-6">
      {/* Upload Mode Selector */}
      <div className="bg-slate-800/50 rounded-lg p-4 border border-white/10">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-white">Use document as:</span>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setUploadMode('template')}
            disabled={isProcessing}
            className={`px-4 py-2 rounded-lg transition-colors ${
              isProcessing
                ? 'bg-slate-700 text-white/50 cursor-not-allowed'
                : uploadMode === 'template'
                  ? 'bg-purple-600 text-white border border-purple-400'
                  : 'bg-slate-700 text-white/80 hover:bg-slate-600 border border-transparent'
            }`}
          >
            Template
          </button>

        </div>
      </div>

      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 cursor-pointer relative ${
          isDragging
            ? 'border-purple-400 bg-purple-900/20'
            : 'border-white/30 hover:border-white/50 hover:bg-white/5'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="text-white/70 mb-3">
          <span className="text-3xl">📁</span>
        </div>
        <p className="text-white/80 text-sm mb-2 font-medium">
          Drop your DOCX or PDF file here
        </p>
        <p className="text-white/50 text-xs mb-3">
          Supports .docx and .pdf files
        </p>
        <button className={`px-4 py-2 text-white text-sm rounded-lg transition-colors mb-3 ${
          uploadMode === 'template' 
            ? 'bg-purple-600 hover:bg-purple-700' 
            : 'bg-purple-600 hover:bg-purple-700'
        }`}>
          <span className="mr-2">📤</span>
          Browse Files
        </button>
        <input
          type="file"
          accept=".docx,.pdf"
          multiple={false}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onChange={handleFileInput}
        />

        {isProcessing && (
          <div className={`mt-3 text-sm animate-pulse ${
    'text-purple-300'
          }`}>
            Processing document...
          </div>
        )}
      </div>



      {/* Info Box */}
      <div className={`rounded-lg p-3 ${
        'bg-purple-900/20 border border-purple-400/30'
      }`}>
        <p className="text-xs text-white/80 leading-relaxed">
          {'Your template will be analyzed and converted into editable sections.'}
        </p>
      </div>
    </div>
  );
}
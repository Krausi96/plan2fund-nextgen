import React, { useState, useCallback } from 'react';
import { useProject } from '@/platform/core/context/hooks/useProject';
import { analyzeDocument } from '@/platform/analysis';
import type { DocumentStructure } from '@/platform/core/types';

interface DocumentUploadPanelProps {
  onNavigateToBlueprint?: () => void;
}

export function DocumentUploadPanel({ onNavigateToBlueprint }: DocumentUploadPanelProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadMode, setUploadMode] = useState<'template' | 'upgrade'>('template');
  const [isProcessing, setIsProcessing] = useState(false);

  // Access platform store for document setup management
  const setDocumentStructure = useProject((state) => state.setDocumentStructure);
  const setSetupStatus = useProject((state) => state.setSetupStatus);
  const setSetupDiagnostics = useProject((state) => state.setSetupDiagnostics);
  const setInferredProductType = useProject((state) => state.setInferredProductType);



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

      // Update store with the processed structure
      setDocumentStructure(result.documentStructure);
      setSetupStatus('draft');
      setSetupDiagnostics({
        warnings: result.warnings || [],
        missingFields: [],
        confidence: result.confidence || 0
      });
      setInferredProductType(result.inferredProductType);

      // Navigate to blueprint if callback is provided
      if (onNavigateToBlueprint) {
        onNavigateToBlueprint();
      }
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
          <button
            onClick={() => setUploadMode('upgrade')}
            disabled={isProcessing}
            className={`px-4 py-2 rounded-lg transition-colors ${
              isProcessing
                ? 'bg-slate-700 text-white/50 cursor-not-allowed'
                : uploadMode === 'upgrade'
                  ? 'bg-green-600 text-white border border-green-400'
                  : 'bg-slate-700 text-white/80 hover:bg-slate-600 border border-transparent'
            }`}
          >
            Upgrade existing plan
          </button>
        </div>
      </div>

      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 cursor-pointer relative ${
          isDragging
            ? (uploadMode === 'template' ? 'border-purple-400 bg-purple-900/20' : 'border-green-400 bg-green-900/20')
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
            : 'bg-green-600 hover:bg-green-700'
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
            uploadMode === 'template' ? 'text-purple-300' : 'text-green-300'
          }`}>
            Processing document...
          </div>
        )}
      </div>



      {/* Info Box */}
      <div className={`rounded-lg p-3 ${
        uploadMode === 'template' 
          ? 'bg-purple-900/20 border border-purple-400/30' 
          : 'bg-green-900/20 border border-green-400/30'
      }`}>
        <p className="text-xs text-white/80 leading-relaxed">
          {uploadMode === 'template'
            ? 'Your template will be analyzed and converted into editable sections.'
            : 'Your existing plan will be analyzed for weaknesses, missing sections, and modernization opportunities.'}
        </p>
      </div>
    </div>
  );
}
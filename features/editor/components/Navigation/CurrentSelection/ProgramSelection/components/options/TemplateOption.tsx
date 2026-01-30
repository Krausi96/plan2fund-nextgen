import React, { useState, useCallback } from 'react';
import { useI18n } from '@/shared/contexts/I18nContext';
import { useEditorStore } from '@/features/editor/lib/store/editorStore';

interface DetectedDocument {
  fileName: string;
  fileType: 'docx' | 'pdf';
  fileSize: string;
  pageCount?: number;
  wordCount?: number;
}

interface DetectedHeading {
  level: number;
  text: string;
  pageNumber?: number;
}

interface DetectedStyle {
  name: string;
  count: number;
  sample: string;
}

interface DocumentAnalysis {
  documents: DetectedDocument[];
  headings: DetectedHeading[];
  styles: DetectedStyle[];
  hasTableOfContents: boolean;
  tocEntries: number;
  structureConfidence: number;
  warnings: string[];
}

interface TemplateOptionProps {
  onDocumentAnalyzed?: (analysis: DocumentAnalysis) => void;
}

export function TemplateOption({ onDocumentAnalyzed }: TemplateOptionProps) {
  const { t } = useI18n();
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [analysis, setAnalysis] = useState<DocumentAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Access editor store for document setup management
  const setDocumentStructure = useEditorStore((state) => state.setDocumentStructure);
  const setSetupStatus = useEditorStore((state) => state.setSetupStatus);
  const setSetupDiagnostics = useEditorStore((state) => state.setSetupDiagnostics);
  const setInferredProductType = useEditorStore((state) => state.setInferredProductType);

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

  const handleFiles = useCallback((files: File[]) => {
    const validFiles = files.filter(file => 
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
      file.type === 'application/pdf'
    );

    if (validFiles.length === 0) {
      alert('Please upload valid DOCX or PDF files');
      return;
    }

    setUploadedFiles(prev => [...prev, ...validFiles]);
    analyzeDocuments(validFiles);
  }, []);

  const analyzeDocuments = async (files: File[]) => {
    setIsAnalyzing(true);
    
    try {
      // Simulate document analysis
      const mockAnalysis: DocumentAnalysis = {
        documents: files.map(file => ({
          fileName: file.name,
          fileType: file.type.includes('pdf') ? 'pdf' : 'docx',
          fileSize: formatFileSize(file.size),
          pageCount: file.type.includes('pdf') ? Math.floor(Math.random() * 50) + 1 : undefined,
          wordCount: file.type.includes('docx') ? Math.floor(Math.random() * 5000) + 1000 : undefined
        })),
        headings: [
          { level: 1, text: 'Executive Summary', pageNumber: 1 },
          { level: 1, text: 'Company Description', pageNumber: 2 },
          { level: 2, text: 'Mission Statement', pageNumber: 2 },
          { level: 2, text: 'Business Model', pageNumber: 3 },
          { level: 1, text: 'Market Analysis', pageNumber: 4 },
          { level: 1, text: 'Financial Projections', pageNumber: 6 }
        ],
        styles: [
          { name: 'Heading 1', count: 4, sample: 'Executive Summary' },
          { name: 'Heading 2', count: 8, sample: 'Mission Statement' },
          { name: 'Normal Text', count: 156, sample: 'The company...' }
        ],
        hasTableOfContents: true,
        tocEntries: 12,
        structureConfidence: 85,
        warnings: [
          'Some headings may need reorganization',
          'Consider adding financial data sections'
        ]
      };

      setAnalysis(mockAnalysis);
      onDocumentAnalyzed?.(mockAnalysis);

      // Generate document structure from analysis
      const documentStructure = {
        structureId: `template-${Date.now()}`,
        version: '1.0',
        source: 'template' as const,
        documents: [
          { 
            id: 'main_document', 
            name: 'Main Document', 
            purpose: 'Primary business plan document', 
            required: true 
          }
        ],
        sections: mockAnalysis.headings.map((heading, index) => ({
          id: `section_${index}`,
          documentId: 'main_document',
          title: heading.text,
          type: index < 3 ? 'required' : 'optional' as 'required' | 'optional' | 'conditional',
          required: index < 3,
          programCritical: false
        })),
        requirements: [],
        validationRules: [],
        aiGuidance: [],
        renderingRules: {},
        conflicts: [],
        warnings: mockAnalysis.warnings,
        confidenceScore: mockAnalysis.structureConfidence,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'template-upload'
      };

      // Update store with template-based structure
      setDocumentStructure(documentStructure);
      setSetupStatus('draft');
      setSetupDiagnostics({
        warnings: mockAnalysis.warnings,
        missingFields: [],
        confidence: mockAnalysis.structureConfidence
      });
      
      // Default to submission for template uploads
      setInferredProductType('submission');

      setIsAnalyzing(false);

    } catch (error) {
      console.error('Document analysis failed:', error);
      setIsAnalyzing(false);
      alert('Failed to analyze document structure. Please try again.');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    setAnalysis(null);
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div 
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 cursor-pointer relative ${
          isDragging 
            ? 'border-purple-400 bg-purple-900/20' 
            : 'border-white/30 hover:border-purple-400/50 hover:bg-white/5'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="text-white/70 mb-3">
          <span className="text-3xl">📁</span>
        </div>
        <p className="text-white/80 text-sm mb-2 font-medium">
          {t('editor.desktop.program.template.dropHint' as any) || 'Drop your DOCX or PDF file here'}
        </p>
        <p className="text-white/50 text-xs mb-3">
          {t('editor.desktop.program.template.supportedFormats' as any) || 'Supports .docx and .pdf files'}
        </p>
        <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors mb-3">
          <span className="mr-2">📤</span>
          {t('editor.desktop.program.uploadTemplate' as any) || 'Browse Files'}
        </button>
        <input
          type="file"
          accept=".docx,.pdf"
          multiple
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onChange={handleFileInput}
        />
        
        {isAnalyzing && (
          <div className="mt-3 text-purple-300 text-sm animate-pulse">
            Analyzing document structure...
          </div>
        )}
      </div>

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="bg-slate-800/50 rounded-lg p-4 border border-white/10">
          <h4 className="text-white font-medium mb-3 flex items-center gap-2">
            <span>📎</span>
            Uploaded Documents ({uploadedFiles.length})
          </h4>
          <div className="space-y-2">
            {uploadedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between bg-slate-700/50 rounded p-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">
                    {file.type.includes('pdf') ? '📄' : '📝'}
                  </span>
                  <div>
                    <div className="text-white text-sm font-medium">{file.name}</div>
                    <div className="text-white/60 text-xs">{formatFileSize(file.size)}</div>
                  </div>
                </div>
                <button 
                  onClick={() => removeFile(index)}
                  className="text-red-400 hover:text-red-300 text-sm"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analysis Results */}
      {analysis && (
        <div className="space-y-4">
          {/* Document Detection */}
          <div className="bg-blue-900/20 border border-blue-400/30 rounded-lg p-4">
            <h4 className="text-blue-200 font-medium mb-3 flex items-center gap-2">
              <span>📋</span>
              Detected Documents
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {analysis.documents.map((doc, index) => (
                <div key={index} className="bg-blue-800/30 rounded p-2">
                  <div className="text-white text-sm font-medium">{doc.fileName}</div>
                  <div className="text-blue-200 text-xs">
                    {doc.fileType.toUpperCase()} • {doc.fileSize}
                    {doc.pageCount && ` • ${doc.pageCount} pages`}
                    {doc.wordCount && ` • ${doc.wordCount} words`}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Headings Detection */}
          <div className="bg-green-900/20 border border-green-400/30 rounded-lg p-4">
            <h4 className="text-green-200 font-medium mb-3 flex items-center gap-2">
              <span>🔍</span>
              Detected Headings ({analysis.headings.length})
            </h4>
            <div className="max-h-40 overflow-y-auto space-y-1">
              {analysis.headings.map((heading, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <span className="text-green-300 font-mono w-6">H{heading.level}</span>
                  <span className="text-white flex-1">{heading.text}</span>
                  {heading.pageNumber && (
                    <span className="text-green-400 text-xs">p.{heading.pageNumber}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Styles Detection */}
          <div className="bg-yellow-900/20 border border-yellow-400/30 rounded-lg p-4">
            <h4 className="text-yellow-200 font-medium mb-3 flex items-center gap-2">
              <span>🎨</span>
              Detected Styles
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {analysis.styles.map((style, index) => (
                <div key={index} className="bg-yellow-800/30 rounded p-2">
                  <div className="text-yellow-200 text-sm font-medium">{style.name}</div>
                  <div className="text-white text-xs">{style.count} occurrences</div>
                  <div className="text-yellow-300 text-xs truncate" title={style.sample}>
                    "{style.sample}"
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* TOC Detection */}
          <div className="bg-purple-900/20 border border-purple-400/30 rounded-lg p-4">
            <h4 className="text-purple-200 font-medium mb-3 flex items-center gap-2">
              <span>📑</span>
              Table of Contents
            </h4>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${analysis.hasTableOfContents ? 'bg-green-500' : 'bg-red-500'}`}></span>
                <span className="text-white">
                  {analysis.hasTableOfContents ? 'Detected' : 'Not Found'}
                </span>
              </div>
              {analysis.hasTableOfContents && (
                <div className="text-purple-200 text-sm">
                  {analysis.tocEntries} entries found
                </div>
              )}
            </div>
          </div>

          {/* Confidence and Warnings */}
          <div className="bg-slate-800/50 rounded-lg p-4 border border-white/10">
            <div className="flex justify-between items-start mb-3">
              <h4 className="text-white font-medium flex items-center gap-2">
                <span>📊</span>
                Analysis Results
              </h4>
              <div className="flex items-center gap-2">
                <span className="text-white/70 text-sm">Confidence:</span>
                <span className={`px-2 py-1 rounded text-sm font-medium ${
                  analysis.structureConfidence >= 80 ? 'bg-green-500/20 text-green-300' :
                  analysis.structureConfidence >= 60 ? 'bg-yellow-500/20 text-yellow-300' :
                  'bg-red-500/20 text-red-300'
                }`}>
                  {analysis.structureConfidence}%
                </span>
              </div>
            </div>
            
            {analysis.warnings.length > 0 && (
              <div className="space-y-2">
                <div className="text-orange-300 text-sm font-medium flex items-center gap-2">
                  <span>⚠️</span>
                  Recommendations
                </div>
                <ul className="text-white/80 text-sm space-y-1">
                  {analysis.warnings.map((warning, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-orange-400 mt-1">•</span>
                      <span>{warning}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-purple-900/20 border border-purple-400/30 rounded-lg p-3">
        <p className="text-xs text-purple-200 leading-relaxed">
          {t('editor.desktop.program.template.analysisInfo' as any) || 'Your template structure will be analyzed and converted into editable sections. Supported formats: DOCX, PDF'}
        </p>
      </div>
    </div>
  );
}
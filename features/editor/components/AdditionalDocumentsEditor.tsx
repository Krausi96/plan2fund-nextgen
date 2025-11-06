// ========= PLAN2FUND — ADDITIONAL DOCUMENTS EDITOR =========
// Editor for pitch decks, application forms, and other additional documents

'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { DocumentTemplate } from '@/shared/lib/templates/types';
import { AdditionalDocumentInstance, AutoPopulateSource } from '../types/additionalDocuments';
import { getDocuments } from '@/shared/lib/templates';
import RichTextEditor from './RichTextEditor';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { 
  FileText, 
  CheckCircle, 
  Circle, 
  AlertCircle, 
  Download,
  RefreshCw,
  Sparkles,
  Info
} from 'lucide-react';
import { PlanSection } from '@/shared/types/plan';

interface AdditionalDocumentsEditorProps {
  programId?: string;
  fundingType?: string;
  productType?: string;
  planContent?: Record<string, string>; // Business plan sections for auto-population
  sections?: PlanSection[]; // Business plan sections
  onDocumentChange?: (documentId: string, content: string) => void;
  onDocumentSave?: (document: AdditionalDocumentInstance) => void;
}

export default function AdditionalDocumentsEditor({
  programId,
  fundingType = 'grants',
  productType = 'submission',
  planContent: _planContent = {},
  sections = [],
  onDocumentChange,
  onDocumentSave
}: AdditionalDocumentsEditorProps) {
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [documents, setDocuments] = useState<AdditionalDocumentInstance[]>([]);
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoPopulateSources, setAutoPopulateSources] = useState<AutoPopulateSource[]>([]);

  // Load document templates
  useEffect(() => {
    async function loadTemplates() {
      try {
        setIsLoading(true);
        setError(null);
        
        const docs = await getDocuments(fundingType, productType, programId);
        setTemplates(docs);
        
        // Initialize document instances from templates
        const instances: AdditionalDocumentInstance[] = docs.map(template => ({
          id: template.id,
          templateId: template.id,
          content: template.template || '',
          status: 'not_started',
          wordCount: 0,
          completionPercentage: 0
        }));
        
        setDocuments(instances);
        
        // Set first document as active if available
        if (instances.length > 0) {
          setActiveDocumentId(instances[0].id);
        }
      } catch (err: any) {
        console.error('Failed to load document templates:', err);
        setError(err.message || 'Failed to load documents');
      } finally {
        setIsLoading(false);
      }
    }
    
    loadTemplates();
  }, [programId, fundingType, productType]);

  // Prepare auto-population sources from business plan
  useEffect(() => {
    const sources: AutoPopulateSource[] = sections
      .filter(section => section.content && section.content.trim().length > 50)
      .map(section => {
        // Determine relevance based on section title/key
        const title = section.title?.toLowerCase() || section.key?.toLowerCase() || '';
        let relevance: 'high' | 'medium' | 'low' = 'low';
        
        if (title.includes('executive') || title.includes('summary') || 
            title.includes('financial') || title.includes('market') ||
            title.includes('team') || title.includes('product')) {
          relevance = 'high';
        } else if (title.includes('risk') || title.includes('timeline') ||
                   title.includes('impact') || title.includes('competition')) {
          relevance = 'medium';
        }
        
        return {
          sectionKey: section.key || '',
          sectionTitle: section.title || '',
          content: section.content || '',
          relevance
        };
      });
    
    setAutoPopulateSources(sources);
  }, [sections]);

  // Get active document
  const activeDocument = useMemo(() => {
    return documents.find(doc => doc.id === activeDocumentId);
  }, [documents, activeDocumentId]);

  // Get active template
  const activeTemplate = useMemo(() => {
    return templates.find(t => t.id === activeDocumentId);
  }, [templates, activeDocumentId]);

  // Handle document content change
  const handleContentChange = useCallback((content: string) => {
    if (!activeDocumentId) return;
    
    const updatedDocuments = documents.map(doc => {
      if (doc.id === activeDocumentId) {
        const wordCount = content.replace(/<[^>]*>/g, '').split(/\s+/).filter(w => w.length > 0).length;
        const status = content.trim().length === 0 
          ? 'not_started' 
          : wordCount < 100 
            ? 'in_progress' 
            : 'completed';
        
        const updated: AdditionalDocumentInstance = {
          ...doc,
          content,
          wordCount,
          status,
          completionPercentage: Math.min(100, Math.round((wordCount / 500) * 100)), // Rough estimate
          lastModified: new Date().toISOString()
        };
        
        // Call change handler
        if (onDocumentChange) {
          onDocumentChange(activeDocumentId, content);
        }
        
        return updated;
      }
      return doc;
    });
    
    setDocuments(updatedDocuments);
  }, [documents, activeDocumentId, onDocumentChange]);

  // Auto-populate from business plan with content variation
  const handleAutoPopulate = useCallback(async () => {
    if (!activeDocument || !activeTemplate) return;
    
    // Get high-relevance sources
    const highRelevanceSources = autoPopulateSources
      .filter(s => s.relevance === 'high')
      .slice(0, 3); // Top 3 sections
    
    if (highRelevanceSources.length === 0) {
      alert('No relevant business plan sections found for auto-population.');
      return;
    }
    
    try {
      // Combine source content
      const combinedSourceContent = highRelevanceSources
        .map(s => {
          const textContent = s.content.replace(/<[^>]*>/g, '').trim();
          return `[${s.sectionTitle}]\n${textContent}`;
        })
        .join('\n\n');

      // Get content from other documents to avoid repetition
      const otherDocuments = documents
        .filter(d => d.id !== activeDocumentId && d.content && d.content.trim().length > 50)
        .map(d => d.content.replace(/<[^>]*>/g, '').trim());

      // Use content variation service
      const { varyContentForDocument } = await import('@/shared/lib/contentVariation');
      
      const variationResult = await varyContentForDocument({
        documentType: activeTemplate.id || 'application_form',
        documentName: activeTemplate.name,
        sourceContent: combinedSourceContent,
        sourceSection: highRelevanceSources.map(s => s.sectionTitle).join(', '),
        tone: activeTemplate.id?.includes('pitch') ? 'persuasive' : 
              activeTemplate.id?.includes('work_plan') ? 'technical' : 'professional',
        targetLength: activeTemplate.maxSize ? parseInt(activeTemplate.maxSize) : undefined,
        avoidRepetition: true,
        otherDocuments
      });

      // Merge with template structure
      let populatedContent = activeTemplate.template;
      
      // Replace placeholders with varied content
      populatedContent = populatedContent.replace(/\[.*?\]/g, variationResult.variedContent);
      
      // If no placeholders found, append varied content
      if (populatedContent === activeTemplate.template) {
        populatedContent = `${activeTemplate.template}\n\n${variationResult.variedContent}`;
      }
      
      handleContentChange(populatedContent);
    } catch (error: any) {
      console.error('Content variation failed:', error);
      // Fallback to simple placeholder replacement
      let populatedContent = activeTemplate.template;
      
      highRelevanceSources.forEach(source => {
        const textContent = source.content.replace(/<[^>]*>/g, '').trim();
        const summary = textContent.substring(0, 500) + (textContent.length > 500 ? '...' : '');
        
        if (source.sectionTitle.toLowerCase().includes('executive') || 
            source.sectionTitle.toLowerCase().includes('summary')) {
          populatedContent = populatedContent.replace(/\[Executive Summary\]/g, summary);
          populatedContent = populatedContent.replace(/\[Project Overview\]/g, summary);
        }
        
        if (source.sectionTitle.toLowerCase().includes('financial')) {
          populatedContent = populatedContent.replace(/\[Financial.*?\]/g, summary);
          populatedContent = populatedContent.replace(/\[Budget.*?\]/g, summary);
        }
        
        if (source.sectionTitle.toLowerCase().includes('market')) {
          populatedContent = populatedContent.replace(/\[Market.*?\]/g, summary);
          populatedContent = populatedContent.replace(/\[TAM.*?\]/g, summary);
        }
        
        if (source.sectionTitle.toLowerCase().includes('team')) {
          populatedContent = populatedContent.replace(/\[Team.*?\]/g, summary);
          populatedContent = populatedContent.replace(/\[Management.*?\]/g, summary);
        }
      });
      
      handleContentChange(populatedContent);
    }
  }, [activeDocument, activeTemplate, autoPopulateSources, documents, activeDocumentId, handleContentChange]);

  // Save document
  const handleSave = useCallback(() => {
    if (!activeDocument) return;
    
    if (onDocumentSave) {
      onDocumentSave(activeDocument);
    }
  }, [activeDocument, onDocumentSave]);

  // Group documents by category
  const documentsByCategory = useMemo(() => {
    const grouped: Record<string, AdditionalDocumentInstance[]> = {};
    
    documents.forEach(doc => {
      const template = templates.find(t => t.id === doc.id);
      const category = template?.category || 'other';
      
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(doc);
    });
    
    return grouped;
  }, [documents, templates]);

  // Calculate overall completion
  const overallCompletion = useMemo(() => {
    if (documents.length === 0) return 0;
    const total = documents.reduce((sum, doc) => sum + (doc.completionPercentage || 0), 0);
    return Math.round(total / documents.length);
  }, [documents]);

  // Required documents count
  const requiredCount = useMemo(() => {
    return templates.filter(t => t.required).length;
  }, [templates]);

  // Completed required documents
  const completedRequired = useMemo(() => {
    return documents.filter(doc => {
      const template = templates.find(t => t.id === doc.id);
      return template?.required && doc.status === 'completed';
    }).length;
  }, [documents, templates]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-gray-600">Loading documents...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center gap-2 text-red-800">
          <AlertCircle className="h-5 w-5" />
          <p className="font-medium">Error loading documents</p>
        </div>
        <p className="text-red-600 text-sm mt-1">{error}</p>
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="flex items-center gap-2 text-gray-600">
          <Info className="h-5 w-5" />
          <p>No additional documents required for this program.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-gray-200 p-4 bg-white">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-gray-900">Additional Documents</h2>
          <Badge variant={overallCompletion === 100 ? "secondary" : "default"}>
            {overallCompletion}% Complete
          </Badge>
        </div>
        <p className="text-sm text-gray-600">
          {completedRequired} of {requiredCount} required documents completed
        </p>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Document List */}
        <div className="w-64 border-r border-gray-200 bg-gray-50 overflow-y-auto">
          <div className="p-3">
            {Object.entries(documentsByCategory).map(([category, categoryDocs]) => (
              <div key={category} className="mb-4">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-2">
                  {category}
                </h3>
                {categoryDocs.map(doc => {
                  const template = templates.find(t => t.id === doc.id);
                  const isActive = doc.id === activeDocumentId;
                  
                  return (
                    <button
                      key={doc.id}
                      onClick={() => setActiveDocumentId(doc.id)}
                      className={`
                        w-full text-left p-3 mb-1 rounded-lg transition-colors
                        ${isActive 
                          ? 'bg-blue-50 border border-blue-200' 
                          : 'bg-white border border-gray-200 hover:bg-gray-50'
                        }
                      `}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {template?.name || doc.id}
                            </p>
                          </div>
                          {template?.required && (
                            <Badge variant="outline" className="text-xs mb-1">
                              Required
                            </Badge>
                          )}
                          <p className="text-xs text-gray-500 line-clamp-2">
                            {template?.description}
                          </p>
                        </div>
                        <div className="flex-shrink-0">
                          {doc.status === 'completed' ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : doc.status === 'in_progress' ? (
                            <Circle className="h-4 w-4 text-yellow-600 fill-current" />
                          ) : (
                            <Circle className="h-4 w-4 text-gray-300" />
                          )}
                        </div>
                      </div>
                      {doc.wordCount !== undefined && doc.wordCount > 0 && (
                        <p className="text-xs text-gray-400 mt-1">
                          {doc.wordCount} words
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Main Editor Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {activeDocument && activeTemplate ? (
            <>
              {/* Document Header */}
              <div className="border-b border-gray-200 p-4 bg-white">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {activeTemplate.name}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {activeTemplate.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAutoPopulate}
                      disabled={autoPopulateSources.length === 0}
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      Auto-Populate (AI)
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSave}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                  </div>
                </div>
                
                {/* Document Info */}
                <div className="flex items-center gap-4 text-xs text-gray-500 mt-3">
                  <span>Format: {activeTemplate.format.toUpperCase()}</span>
                  <span>Max Size: {activeTemplate.maxSize}</span>
                  {activeTemplate.required && (
                    <Badge variant="outline" className="text-xs">
                      Required
                    </Badge>
                  )}
                </div>
              </div>

              {/* Instructions & Tips */}
              {activeTemplate.instructions && activeTemplate.instructions.length > 0 && (
                <div className="border-b border-gray-200 p-4 bg-blue-50">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Instructions</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    {activeTemplate.instructions.slice(0, 3).map((instruction, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-blue-600 mt-1">•</span>
                        <span>{instruction}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Editor */}
              <div className="flex-1 overflow-y-auto p-4">
                <RichTextEditor
                  content={activeDocument.content}
                  onChange={handleContentChange}
                  section={{
                    key: activeDocument.id,
                    title: activeTemplate.name,
                    content: activeDocument.content || ''
                  } as PlanSection}
                  guidance={activeTemplate.description}
                  placeholder={activeTemplate.template}
                  showWordCount={true}
                  showGuidance={true}
                  showImageUpload={true}
                />
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <p>Select a document to start editing</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


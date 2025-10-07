// Structured Editor Component - Uses program-specific editor requirements
import React, { useState, useEffect } from 'react';
// import { Card } from '@/components/ui/card'; // Unused
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface EditorRequirement {
  id: string;
  section_name: string;
  prompt: string;
  hints: string[];
  word_count_min?: number;
  word_count_max?: number;
  required: boolean;
  ai_guidance?: string;
  template?: string;
}

interface StructuredEditorProps {
  programId: string;
  programName: string;
  onSave?: (content: Record<string, string>) => void;
  onExport?: () => void;
}

export default function StructuredEditor({
  programId,
  programName,
  onSave,
  onExport
}: StructuredEditorProps) {
  const [requirements, setRequirements] = useState<EditorRequirement[]>([]);
  const [content, setContent] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  useEffect(() => {
    loadEditorRequirements();
  }, [programId]);

  const loadEditorRequirements = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/programmes/${programId}/requirements`);
      
      if (!response.ok) {
        throw new Error(`Failed to load requirements: ${response.statusText}`);
      }
      
      const data = await response.json();
      setRequirements(data.editor || []);
      
      // Initialize content for each section
      const initialContent: Record<string, string> = {};
      data.editor?.forEach((req: EditorRequirement) => {
        initialContent[req.id] = req.template || '';
      });
      setContent(initialContent);
      
      // Set first section as active
      if (data.editor && data.editor.length > 0) {
        setActiveSection(data.editor[0].id);
      }
    } catch (error) {
      console.error('Error loading editor requirements:', error);
      setError(error instanceof Error ? error.message : 'Failed to load requirements');
    } finally {
      setLoading(false);
    }
  };

  const handleContentChange = (sectionId: string, newContent: string) => {
    setContent(prev => ({
      ...prev,
      [sectionId]: newContent
    }));
  };

  const handleSave = () => {
    if (onSave) {
      onSave(content);
    }
  };

  const getWordCount = (text: string) => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  const getWordCountColor = (current: number, min?: number, max?: number) => {
    if (min && current < min) return 'text-red-600';
    if (max && current > max) return 'text-red-600';
    return 'text-green-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading editor requirements...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="text-red-600 mb-4">⚠️ Error loading editor requirements</div>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button onClick={loadEditorRequirements} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  if (requirements.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="text-gray-600 mb-4">No editor requirements available</div>
        <p className="text-sm text-gray-500">This program may not have structured editor requirements yet.</p>
      </div>
    );
  }

  const activeRequirement = requirements.find(req => req.id === activeSection);

  return (
    <div className="flex h-screen">
      {/* Sidebar - Section Navigation */}
      <div className="w-80 bg-gray-50 border-r border-gray-200 p-4 overflow-y-auto">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900">{programName}</h2>
          <p className="text-sm text-gray-600">Program-Specific Editor</p>
        </div>

        <div className="space-y-2">
          {requirements.map((req) => {
            const currentContent = content[req.id] || '';
            const wordCount = getWordCount(currentContent);
            const isActive = activeSection === req.id;
            
            return (
              <button
                key={req.id}
                onClick={() => setActiveSection(req.id)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  isActive 
                    ? 'bg-blue-100 border-blue-300 text-blue-900' 
                    : 'bg-white border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium">{req.section_name}</span>
                  {req.required && (
                    <Badge variant="destructive" className="text-xs">Required</Badge>
                  )}
                </div>
                
                {req.word_count_min || req.word_count_max ? (
                  <div className="text-xs text-gray-500">
                    <span className={getWordCountColor(wordCount, req.word_count_min, req.word_count_max)}>
                      {wordCount} words
                    </span>
                    {req.word_count_min && req.word_count_max && (
                      <span className="text-gray-400"> / {req.word_count_min}-{req.word_count_max}</span>
                    )}
                  </div>
                ) : null}
              </button>
            );
          })}
        </div>

        <div className="mt-6 space-y-2">
          <Button onClick={handleSave} className="w-full">
            Save Progress
          </Button>
          {onExport && (
            <Button onClick={onExport} variant="outline" className="w-full">
              Export Document
            </Button>
          )}
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col">
        {activeRequirement ? (
          <>
            {/* Section Header */}
            <div className="border-b border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {activeRequirement.section_name}
                  </h3>
                  {activeRequirement.ai_guidance && (
                    <p className="text-sm text-gray-600 mt-1">
                      AI Guidance: {activeRequirement.ai_guidance}
                    </p>
                  )}
                </div>
                {activeRequirement.required && (
                  <Badge variant="destructive">Required Section</Badge>
                )}
              </div>

              {/* Prompt */}
              {activeRequirement.prompt && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <p className="text-gray-700">{activeRequirement.prompt}</p>
                </div>
              )}

              {/* Hints */}
              {activeRequirement.hints && activeRequirement.hints.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Writing Hints:</h4>
                  <ul className="space-y-1">
                    {activeRequirement.hints.map((hint, idx) => (
                      <li key={idx} className="text-sm text-gray-600 flex items-start">
                        <span className="text-blue-500 mr-2 mt-0.5">💡</span>
                        {hint}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Word Count Requirements */}
              {(activeRequirement.word_count_min || activeRequirement.word_count_max) && (
                <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <strong>Word Count:</strong> {activeRequirement.word_count_min || 0} - {activeRequirement.word_count_max || 'unlimited'} words
                  </p>
                </div>
              )}
            </div>

            {/* Text Editor */}
            <div className="flex-1 p-6">
              <textarea
                value={content[activeRequirement.id] || ''}
                onChange={(e) => handleContentChange(activeRequirement.id, e.target.value)}
                placeholder={activeRequirement.template || `Start writing your ${activeRequirement.section_name.toLowerCase()}...`}
                className="w-full h-full resize-none border border-gray-300 rounded-lg p-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                style={{ minHeight: '400px' }}
              />
            </div>

            {/* Footer with Word Count */}
            <div className="border-t border-gray-200 p-4 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Word Count: <span className={getWordCountColor(
                    getWordCount(content[activeRequirement.id] || ''), 
                    activeRequirement.word_count_min, 
                    activeRequirement.word_count_max
                  )}>
                    {getWordCount(content[activeRequirement.id] || '')}
                  </span>
                  {activeRequirement.word_count_min && activeRequirement.word_count_max && (
                    <span className="text-gray-400"> / {activeRequirement.word_count_min}-{activeRequirement.word_count_max}</span>
                  )}
                </div>
                <div className="text-sm text-gray-500">
                  {activeRequirement.required ? 'Required' : 'Optional'}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-gray-400 mb-4">📝</div>
              <p className="text-gray-600">Select a section to start editing</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

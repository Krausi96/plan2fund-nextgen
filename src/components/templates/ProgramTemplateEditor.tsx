// Program-Specific Template Editor - Phase 3 Step 2
import React, { useState, useEffect } from 'react';
import { ProgramTemplate } from '../../lib/programTemplates';

interface ProgramTemplateEditorProps {
  programId: string;
  onSave: (templateData: Record<string, any>) => void;
  onCancel: () => void;
}

interface EditorState {
  template: ProgramTemplate | null;
  templateData: Record<string, any>;
  currentSectionIndex: number;
  isGenerating: boolean;
  isSaving: boolean;
  error: string | null;
  validation: {
    valid: boolean;
    errors: string[];
    warnings: string[];
    recommendations: string[];
    completion_percentage: number;
  } | null;
}

export const ProgramTemplateEditor: React.FC<ProgramTemplateEditorProps> = ({
  programId,
  onSave,
  onCancel
}) => {
  const [editorState, setEditorState] = useState<EditorState>({
    template: null,
    templateData: {},
    currentSectionIndex: 0,
    isGenerating: false,
    isSaving: false,
    error: null,
    validation: null
  });

  // Generate template on component mount
  useEffect(() => {
    generateTemplate();
  }, [programId]);

  const generateTemplate = async () => {
    setEditorState(prev => ({ ...prev, isGenerating: true, error: null }));

    try {
      const response = await fetch(`/api/program-templates?action=generate&programId=${programId}`);
      const result = await response.json();

      if (result.success) {
        setEditorState(prev => ({
          ...prev,
          template: result.data,
          isGenerating: false
        }));
      } else {
        throw new Error(result.message || 'Failed to generate template');
      }
    } catch (error) {
      console.error('Error generating template:', error);
      setEditorState(prev => ({
        ...prev,
        isGenerating: false,
        error: error instanceof Error ? error.message : 'Failed to generate template'
      }));
    }
  };

  const handleSectionContentChange = (sectionId: string, content: string) => {
    setEditorState(prev => ({
      ...prev,
      templateData: {
        ...prev.templateData,
        [sectionId]: {
          ...prev.templateData[sectionId],
          content
        }
      }
    }));
  };

  const handleSectionNavigation = (index: number) => {
    setEditorState(prev => ({
      ...prev,
      currentSectionIndex: index
    }));
  };

  const handleValidate = async () => {
    if (!editorState.template) return;

    try {
      const response = await fetch('/api/program-templates?action=validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          programId,
          templateData: editorState.templateData
        })
      });

      const result = await response.json();

      if (result.success) {
        setEditorState(prev => ({
          ...prev,
          validation: result.data
        }));
      } else {
        throw new Error(result.message || 'Validation failed');
      }
    } catch (error) {
      console.error('Error validating template:', error);
    }
  };

  const handleSave = () => {
    setEditorState(prev => ({ ...prev, isSaving: true }));
    
    // Simulate save operation
    setTimeout(() => {
      onSave(editorState.templateData);
      setEditorState(prev => ({ ...prev, isSaving: false }));
    }, 1000);
  };

  if (editorState.isGenerating) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Generating program-specific template...</p>
        </div>
      </div>
    );
  }

  if (editorState.error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{editorState.error}</p>
            </div>
            <div className="mt-4">
              <button
                onClick={generateTemplate}
                className="bg-red-100 hover:bg-red-200 text-red-800 px-3 py-2 rounded-md text-sm font-medium"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!editorState.template) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-600">No template available for this program.</p>
      </div>
    );
  }

  const currentSection = editorState.template.sections[editorState.currentSectionIndex];
  const progress = ((editorState.currentSectionIndex + 1) / editorState.template.sections.length) * 100;

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {editorState.template.template_name}
        </h2>
        <p className="text-gray-600 mb-4">
          {editorState.template.description}
        </p>
        
        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Section {editorState.currentSectionIndex + 1} of {editorState.template.sections.length}</span>
            <span>~{editorState.template.estimated_completion_time} hours</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Validation Status */}
        {editorState.validation && (
          <div className={`p-3 rounded-md mb-4 ${
            editorState.validation.valid ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'
          }`}>
            <div className="flex items-center justify-between">
              <span className={`text-sm font-medium ${
                editorState.validation.valid ? 'text-green-800' : 'text-yellow-800'
              }`}>
                Completion: {editorState.validation.completion_percentage}%
              </span>
              <button
                onClick={handleValidate}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Validate Template
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar - Section Navigation */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Sections</h3>
            <nav className="space-y-2">
              {editorState.template.sections.map((section, index) => (
                <button
                  key={section.id}
                  onClick={() => handleSectionNavigation(index)}
                  className={`w-full text-left p-2 rounded-md text-sm transition-colors ${
                    index === editorState.currentSectionIndex
                      ? 'bg-blue-100 text-blue-800'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{section.title}</span>
                    {section.required && (
                      <span className="text-red-500 text-xs">*</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {section.difficulty_level} • {section.program_specific ? 'Program-specific' : 'Standard'}
                  </div>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Main Content - Section Editor */}
        <div className="lg:col-span-3">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {currentSection.title}
                {currentSection.required && <span className="text-red-500 ml-1">*</span>}
              </h3>
              <p className="text-gray-600 mb-4">
                {currentSection.description}
              </p>
              
              {currentSection.ai_prompts && currentSection.ai_prompts.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
                  <h4 className="text-sm font-medium text-blue-800 mb-2">AI Guidance:</h4>
                  <ul className="list-disc list-inside text-sm text-blue-700 space-y-1">
                    {currentSection.ai_prompts.map((prompt, index) => (
                      <li key={index}>{prompt}</li>
                    ))}
                  </ul>
                </div>
              )}

              {currentSection.validation_rules && (
                <div className="text-sm text-gray-500 mb-4">
                  {currentSection.validation_rules.min_words && (
                    <span>Min: {currentSection.validation_rules.min_words} words</span>
                  )}
                  {currentSection.validation_rules.max_words && (
                    <span className="ml-4">Max: {currentSection.validation_rules.max_words} words</span>
                  )}
                </div>
              )}
            </div>

            <div className="mb-6">
              <textarea
                value={editorState.templateData[currentSection.id]?.content || ''}
                onChange={(e) => handleSectionContentChange(currentSection.id, e.target.value)}
                placeholder={currentSection.content_template}
                className="w-full p-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={12}
              />
            </div>

            {/* Navigation */}
            <div className="flex justify-between">
              <button
                onClick={onCancel}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
              >
                Cancel
              </button>

              <div className="flex space-x-3">
                {editorState.currentSectionIndex > 0 && (
                  <button
                    onClick={() => handleSectionNavigation(editorState.currentSectionIndex - 1)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md font-medium"
                  >
                    Previous
                  </button>
                )}

                {editorState.currentSectionIndex < editorState.template.sections.length - 1 ? (
                  <button
                    onClick={() => handleSectionNavigation(editorState.currentSectionIndex + 1)}
                    className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md font-medium"
                  >
                    Next Section
                  </button>
                ) : (
                  <button
                    onClick={handleSave}
                    disabled={editorState.isSaving}
                    className="px-6 py-2 bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 rounded-md font-medium"
                  >
                    {editorState.isSaving ? 'Saving...' : 'Save Template'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Validation Messages */}
      {editorState.validation && (
        <div className="mt-6 space-y-4">
          {editorState.validation.errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <h4 className="text-sm font-medium text-red-800 mb-2">Errors:</h4>
              <ul className="list-disc list-inside text-sm text-red-700">
                {editorState.validation.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {editorState.validation.warnings.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <h4 className="text-sm font-medium text-yellow-800 mb-2">Warnings:</h4>
              <ul className="list-disc list-inside text-sm text-yellow-700">
                {editorState.validation.warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </div>
          )}

          {editorState.validation.recommendations.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <h4 className="text-sm font-medium text-blue-800 mb-2">Recommendations:</h4>
              <ul className="list-disc list-inside text-sm text-blue-700">
                {editorState.validation.recommendations.map((recommendation, index) => (
                  <li key={index}>{recommendation}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProgramTemplateEditor;

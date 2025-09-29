// ========= PLAN2FUND — REQUIREMENTS EXTRACTION TOOL UI =========
// Web interface for manually extracting program requirements

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { requirementsExtractor } from '@/lib/requirementsExtractor';
import { ProgramExtractionTemplate, ProgramRequirements } from '@/types/requirements';

interface RequirementsExtractionToolProps {
  onRequirementsExtracted?: (requirements: ProgramRequirements) => void;
}

export default function RequirementsExtractionTool({ 
  onRequirementsExtracted 
}: RequirementsExtractionToolProps) {
  const [currentProgram, setCurrentProgram] = useState<ProgramExtractionTemplate | null>(null);
  const [extractionStep, setExtractionStep] = useState(0);
  const [extractedPrograms, setExtractedPrograms] = useState<ProgramExtractionTemplate[]>([]);

  const steps = [
    'Basic Information',
    'Eligibility Requirements',
    'Documentation Requirements',
    'Financial Requirements',
    'Technical Requirements',
    'Legal Requirements',
    'Timeline Requirements',
    'Geographic Requirements',
    'Team Requirements',
    'Project Requirements',
    'Compliance Requirements',
    'Decision Tree Questions',
    'Editor Sections',
    'Review & Export'
  ];

  useEffect(() => {
    setExtractedPrograms(requirementsExtractor.getAllExtractedPrograms());
  }, []);

  const startNewExtraction = () => {
    const programId = `program_${Date.now()}`;
    const template = requirementsExtractor.startExtraction(
      programId,
      '',
      'grant',
      ''
    );
    setCurrentProgram(template);
    setExtractionStep(0);
  };

  const updateCurrentProgram = (updates: Partial<ProgramExtractionTemplate>) => {
    if (currentProgram) {
      const updated = { ...currentProgram, ...updates };
      setCurrentProgram(updated);
    }
  };

  const addRequirement = (category: string, requirement: any) => {
    if (currentProgram) {
      requirementsExtractor.addRequirement(currentProgram.programId, category as any, requirement);
      const updated = requirementsExtractor.getAllExtractedPrograms().find(p => p.programId === currentProgram.programId);
      if (updated) setCurrentProgram(updated);
    }
  };

  const addQuestion = (question: any) => {
    if (currentProgram) {
      requirementsExtractor.addQuestion(currentProgram.programId, question);
      const updated = requirementsExtractor.getAllExtractedPrograms().find(p => p.programId === currentProgram.programId);
      if (updated) setCurrentProgram(updated);
    }
  };

  const addEditorSection = (section: any) => {
    if (currentProgram) {
      requirementsExtractor.addEditorSection(currentProgram.programId, section);
      const updated = requirementsExtractor.getAllExtractedPrograms().find(p => p.programId === currentProgram.programId);
      if (updated) setCurrentProgram(updated);
    }
  };

  const completeExtraction = () => {
    if (currentProgram) {
      const requirements = requirementsExtractor.convertToRequirements(currentProgram.programId);
      onRequirementsExtracted?.(requirements);
      setCurrentProgram(null);
      setExtractionStep(0);
      setExtractedPrograms(requirementsExtractor.getAllExtractedPrograms());
    }
  };

  const renderStepContent = () => {
    if (!currentProgram) return null;

    switch (extractionStep) {
      case 0: // Basic Information
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Program Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Program Name</label>
                <input
                  type="text"
                  value={currentProgram.programName}
                  onChange={(e) => updateCurrentProgram({ programName: e.target.value })}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Program Type</label>
                <select
                  value={currentProgram.programType}
                  onChange={(e) => updateCurrentProgram({ programType: e.target.value })}
                  className="w-full p-2 border rounded"
                >
                  <option value="grant">Grant</option>
                  <option value="loan">Loan</option>
                  <option value="equity">Equity</option>
                  <option value="visa">Visa</option>
                  <option value="ams">AMS</option>
                  <option value="mixed">Mixed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Source URL</label>
                <input
                  type="url"
                  value={currentProgram.sourceUrl}
                  onChange={(e) => updateCurrentProgram({ sourceUrl: e.target.value })}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Funding Amount</label>
                <input
                  type="text"
                  value={currentProgram.basicInfo.amount}
                  onChange={(e) => updateCurrentProgram({
                    basicInfo: { ...currentProgram.basicInfo, amount: e.target.value }
                  })}
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={currentProgram.basicInfo.description}
                onChange={(e) => updateCurrentProgram({
                  basicInfo: { ...currentProgram.basicInfo, description: e.target.value }
                })}
                className="w-full p-2 border rounded h-24"
              />
            </div>
          </div>
        );

      case 1: // Eligibility Requirements
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Eligibility Requirements</h3>
            <RequirementCategoryForm
              category="eligibility"
              requirements={currentProgram.requirements.eligibility}
              onAddRequirement={addRequirement}
            />
          </div>
        );

      case 2: // Documentation Requirements
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Documentation Requirements</h3>
            <RequirementCategoryForm
              category="documents"
              requirements={currentProgram.requirements.documents}
              onAddRequirement={addRequirement}
            />
          </div>
        );

      case 3: // Financial Requirements
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Financial Requirements</h3>
            <RequirementCategoryForm
              category="financial"
              requirements={currentProgram.requirements.financial}
              onAddRequirement={addRequirement}
            />
          </div>
        );

      case 11: // Decision Tree Questions
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Decision Tree Questions</h3>
            <QuestionForm
              questions={currentProgram.questions}
              onAddQuestion={addQuestion}
            />
          </div>
        );

      case 12: // Editor Sections
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Editor Sections</h3>
            <EditorSectionForm
              sections={currentProgram.editorSections}
              onAddSection={addEditorSection}
            />
          </div>
        );

      case 13: // Review & Export
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Review & Export</h3>
            <div className="bg-gray-50 p-4 rounded">
              <h4 className="font-medium mb-2">Extraction Summary</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>Program: {currentProgram.programName}</div>
                <div>Type: {currentProgram.programType}</div>
                <div>Eligibility Requirements: {currentProgram.requirements.eligibility.length}</div>
                <div>Document Requirements: {currentProgram.requirements.documents.length}</div>
                <div>Financial Requirements: {currentProgram.requirements.financial.length}</div>
                <div>Questions: {currentProgram.questions.length}</div>
                <div>Editor Sections: {currentProgram.editorSections.length}</div>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button onClick={() => {
                const json = requirementsExtractor.exportToJSON(currentProgram.programId);
                const blob = new Blob([json], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${currentProgram.programId}_requirements.json`;
                a.click();
              }}>
                Export JSON
              </Button>
              <Button onClick={completeExtraction}>
                Complete Extraction
              </Button>
            </div>
          </div>
        );

      default:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{steps[extractionStep]}</h3>
            <RequirementCategoryForm
              category={steps[extractionStep].toLowerCase().replace(' requirements', '')}
              requirements={currentProgram.requirements[steps[extractionStep].toLowerCase().replace(' requirements', '') as keyof typeof currentProgram.requirements] || []}
              onAddRequirement={addRequirement}
            />
          </div>
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Program Requirements Extraction Tool</h1>
        <p className="text-gray-600">
          Manually extract and structure program requirements for the recommendation engine.
        </p>
      </div>

      {!currentProgram ? (
        <div className="text-center py-8">
          <h2 className="text-xl font-semibold mb-4">Start New Extraction</h2>
          <Button onClick={startNewExtraction} size="lg">
            Extract Program Requirements
          </Button>
          
          {extractedPrograms.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4">Previously Extracted Programs</h3>
              <div className="grid grid-cols-2 gap-4">
                {extractedPrograms.map(program => (
                  <div key={program.programId} className="border rounded p-4">
                    <h4 className="font-medium">{program.programName}</h4>
                    <p className="text-sm text-gray-600">{program.programType}</p>
                    <p className="text-sm text-gray-500">
                      {Object.values(program.requirements).flat().length} requirements
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="flex items-center space-x-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`flex-1 h-2 rounded ${
                  index <= extractionStep ? 'bg-blue-500' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
          
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">
              Step {extractionStep + 1}: {steps[extractionStep]}
            </h2>
            <div className="text-sm text-gray-600">
              {extractionStep + 1} of {steps.length}
            </div>
          </div>

          {/* Step Content */}
          {renderStepContent()}

          {/* Navigation */}
          <div className="flex justify-between">
            <Button
              onClick={() => setExtractionStep(Math.max(0, extractionStep - 1))}
              disabled={extractionStep === 0}
            >
              Previous
            </Button>
            <Button
              onClick={() => setExtractionStep(Math.min(steps.length - 1, extractionStep + 1))}
              disabled={extractionStep === steps.length - 1}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper components
function RequirementCategoryForm({ 
  category, 
  requirements, 
  onAddRequirement 
}: { 
  category: string; 
  requirements: any[]; 
  onAddRequirement: (category: string, requirement: any) => void; 
}) {
  const [newRequirement, setNewRequirement] = useState({
    title: '',
    description: '',
    examples: '',
    isRequired: true,
    priority: 'medium'
  });

  const handleAdd = () => {
    if (newRequirement.title && newRequirement.description) {
      onAddRequirement(category, {
        ...newRequirement,
        examples: newRequirement.examples ? newRequirement.examples.split(',').map(s => s.trim()) : []
      });
      setNewRequirement({
        title: '',
        description: '',
        examples: '',
        isRequired: true,
        priority: 'medium'
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Title</label>
          <input
            type="text"
            value={newRequirement.title}
            onChange={(e) => setNewRequirement({ ...newRequirement, title: e.target.value })}
            className="w-full p-2 border rounded"
            placeholder="e.g., Company must be registered"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Priority</label>
          <select
            value={newRequirement.priority}
            onChange={(e) => setNewRequirement({ ...newRequirement, priority: e.target.value })}
            className="w-full p-2 border rounded"
          >
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <textarea
          value={newRequirement.description}
          onChange={(e) => setNewRequirement({ ...newRequirement, description: e.target.value })}
          className="w-full p-2 border rounded h-20"
          placeholder="Detailed description of the requirement"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Examples (comma-separated)</label>
        <input
          type="text"
          value={newRequirement.examples}
          onChange={(e) => setNewRequirement({ ...newRequirement, examples: e.target.value })}
          className="w-full p-2 border rounded"
          placeholder="e.g., GmbH, AG, Einzelunternehmen"
        />
      </div>
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          checked={newRequirement.isRequired}
          onChange={(e) => setNewRequirement({ ...newRequirement, isRequired: e.target.checked })}
          className="rounded"
        />
        <label className="text-sm">Required</label>
      </div>
      <Button onClick={handleAdd} disabled={!newRequirement.title || !newRequirement.description}>
        Add Requirement
      </Button>

      {/* List existing requirements */}
      <div className="mt-4">
        <h4 className="font-medium mb-2">Existing {category} requirements ({requirements.length})</h4>
        <div className="space-y-2">
          {requirements.map((req, index) => (
            <div key={index} className="border rounded p-3 bg-gray-50">
              <div className="flex justify-between items-start">
                <div>
                  <h5 className="font-medium">{req.title}</h5>
                  <p className="text-sm text-gray-600">{req.description}</p>
                  {req.examples && req.examples.length > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      Examples: {req.examples.join(', ')}
                    </p>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  {req.priority} • {req.isRequired ? 'Required' : 'Optional'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function QuestionForm({ 
  questions, 
  onAddQuestion 
}: { 
  questions: any[]; 
  onAddQuestion: (question: any) => void; 
}) {
  const [newQuestion, setNewQuestion] = useState({
    question: '',
    type: 'single',
    options: '',
    required: true
  });

  const handleAdd = () => {
    if (newQuestion.question) {
      onAddQuestion({
        ...newQuestion,
        options: newQuestion.options ? newQuestion.options.split(',').map(s => s.trim()) : undefined
      });
      setNewQuestion({
        question: '',
        type: 'single',
        options: '',
        required: true
      });
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Question</label>
        <input
          type="text"
          value={newQuestion.question}
          onChange={(e) => setNewQuestion({ ...newQuestion, question: e.target.value })}
          className="w-full p-2 border rounded"
          placeholder="e.g., What is your company stage?"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Type</label>
          <select
            value={newQuestion.type}
            onChange={(e) => setNewQuestion({ ...newQuestion, type: e.target.value })}
            className="w-full p-2 border rounded"
          >
            <option value="single">Single Choice</option>
            <option value="multiple">Multiple Choice</option>
            <option value="text">Text Input</option>
            <option value="number">Number Input</option>
            <option value="date">Date Input</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Options (comma-separated)</label>
          <input
            type="text"
            value={newQuestion.options}
            onChange={(e) => setNewQuestion({ ...newQuestion, options: e.target.value })}
            className="w-full p-2 border rounded"
            placeholder="e.g., Startup, SME, Large Company"
            disabled={!['single', 'multiple'].includes(newQuestion.type)}
          />
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          checked={newQuestion.required}
          onChange={(e) => setNewQuestion({ ...newQuestion, required: e.target.checked })}
          className="rounded"
        />
        <label className="text-sm">Required</label>
      </div>
      <Button onClick={handleAdd} disabled={!newQuestion.question}>
        Add Question
      </Button>

      {/* List existing questions */}
      <div className="mt-4">
        <h4 className="font-medium mb-2">Existing questions ({questions.length})</h4>
        <div className="space-y-2">
          {questions.map((q, index) => (
            <div key={index} className="border rounded p-3 bg-gray-50">
              <div className="flex justify-between items-start">
                <div>
                  <h5 className="font-medium">{q.question}</h5>
                  <p className="text-sm text-gray-600">Type: {q.type}</p>
                  {q.options && q.options.length > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      Options: {q.options.join(', ')}
                    </p>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  {q.required ? 'Required' : 'Optional'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function EditorSectionForm({ 
  sections, 
  onAddSection 
}: { 
  sections: any[]; 
  onAddSection: (section: any) => void; 
}) {
  const [newSection, setNewSection] = useState({
    title: '',
    content: '',
    required: true
  });

  const handleAdd = () => {
    if (newSection.title && newSection.content) {
      onAddSection(newSection);
      setNewSection({
        title: '',
        content: '',
        required: true
      });
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Section Title</label>
        <input
          type="text"
          value={newSection.title}
          onChange={(e) => setNewSection({ ...newSection, title: e.target.value })}
          className="w-full p-2 border rounded"
          placeholder="e.g., Executive Summary"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Section Content Template</label>
        <textarea
          value={newSection.content}
          onChange={(e) => setNewSection({ ...newSection, content: e.target.value })}
          className="w-full p-2 border rounded h-32"
          placeholder="Template content for this section..."
        />
      </div>
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          checked={newSection.required}
          onChange={(e) => setNewSection({ ...newSection, required: e.target.checked })}
          className="rounded"
        />
        <label className="text-sm">Required Section</label>
      </div>
      <Button onClick={handleAdd} disabled={!newSection.title || !newSection.content}>
        Add Section
      </Button>

      {/* List existing sections */}
      <div className="mt-4">
        <h4 className="font-medium mb-2">Existing sections ({sections.length})</h4>
        <div className="space-y-2">
          {sections.map((s, index) => (
            <div key={index} className="border rounded p-3 bg-gray-50">
              <div className="flex justify-between items-start">
                <div>
                  <h5 className="font-medium">{s.title}</h5>
                  <p className="text-sm text-gray-600 mt-1">{s.content}</p>
                </div>
                <div className="text-xs text-gray-500">
                  {s.required ? 'Required' : 'Optional'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

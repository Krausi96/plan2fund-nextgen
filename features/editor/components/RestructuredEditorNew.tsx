/**
 * RestructuredEditorNew - Refactored editor using UnifiedEditorLayout
 * Canva-style layout with merged compliance and AI assistant
 * Based on strategic analysis report recommendations
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { PlanDocument } from '@/shared/types/plan';
import { ProgramProfile } from '@/features/reco/types/reco';
import { EditorProduct } from '@/features/editor/types/editor';
import RichTextEditor from './RichTextEditor';
import UnifiedEditorLayout from './UnifiedEditorLayout';
import { useSectionProgress } from '../hooks/useSectionProgress';

interface RestructuredEditorNewProps {
  plan: PlanDocument | null;
  sections: any[];
  activeSection: number;
  onSectionChange: (sectionKey: string, content: string) => void;
  onActiveSectionChange: (index: number) => void;
  onSectionStatusChange: (sectionKey: string, status: 'missing' | 'needs_fix' | 'aligned') => void;
  onPlanChange: (plan: PlanDocument) => void;
  programProfile?: ProgramProfile;
  product?: EditorProduct | null;
  requirementsProgress?: number;
  requirementsStatus?: 'loading' | 'complete' | 'incomplete' | 'error';
  onAIGenerate?: () => void;
  onSave?: () => void;
}

export default function RestructuredEditorNew({
  plan,
  sections,
  activeSection,
  onSectionChange,
  onActiveSectionChange,
  onSectionStatusChange,
  onPlanChange,
  programProfile,
  product,
  requirementsProgress = 0,
  requirementsStatus = 'loading',
  onAIGenerate,
  onSave
}: RestructuredEditorNewProps) {
  const router = useRouter();
  
  // Calculate progress for all sections
  const sectionsProgress = sections.map(section => useSectionProgress(section));
  
  // Convert sections to planContent format for compliance checker
  const planContent = React.useMemo(() => {
    const content: Record<string, any> = {};
    sections.forEach(section => {
      content[section.key] = section.content || '';
    });
    return content;
  }, [sections]);

  // Handle section content insertion from AI
  const handleInsertContent = useCallback((content: string, section: string) => {
    const sectionIndex = sections.findIndex(s => s.key === section);
    if (sectionIndex >= 0) {
      onSectionChange(section, content);
    }
  }, [sections, onSectionChange]);

  // Handle section navigation
  const handleSectionChange = useCallback((index: number) => {
    onActiveSectionChange(index);
  }, [onActiveSectionChange]);

  // Generate content for a specific prompt
  const handleGenerateForPrompt = useCallback(async (promptText: string, promptIndex: number) => {
    if (!sections[activeSection] || !plan) return;
    
    try {
      const { createAIHelper } = await import('@/features/editor/engine/aiHelper');
      const { loadUserAnswers } = await import('@/shared/lib/planStore');
      const userAnswers = typeof window !== 'undefined' ? loadUserAnswers() : {};
      
      const programForAI = programProfile ? {
        id: programProfile.programId,
        name: programProfile.programId,
        type: programProfile.route || 'grant',
        amount: '',
        eligibility: [],
        requirements: [],
        score: 100,
        reasons: [],
        risks: []
      } : {
        id: 'unknown',
        name: 'Program',
        type: 'grant',
        amount: '',
        eligibility: [],
        requirements: [],
        score: 100,
        reasons: [],
        risks: []
      };
      
      const aiHelper = createAIHelper({
        maxWords: sections[activeSection]?.wordCountMax || 500,
        sectionScope: sections[activeSection]?.title || '',
        programHints: {},
        userAnswers: userAnswers,
        tone: plan?.tone || 'neutral',
        language: plan?.language || 'en'
      });
      
      const context = `Focus on this specific requirement: ${promptText}\n\nSection: ${sections[activeSection]?.title}\n\nCurrent content: ${sections[activeSection]?.content || 'No content yet'}`;
      const response = await aiHelper.generateSectionContent(
        sections[activeSection].title,
        context,
        programForAI
      );
      
      if (response.content) {
        const currentContent = sections[activeSection]?.content || '';
        const newContent = currentContent 
          ? `${currentContent}\n\n${response.content}`
          : response.content;
        
        onSectionChange(sections[activeSection].key, newContent);
      }
    } catch (error) {
      console.error('Error generating content for prompt:', error);
    }
  }, [sections, activeSection, plan, programProfile, onSectionChange]);

  // Auto-generate Executive Summary
  const handleGenerateExecutiveSummary = useCallback(async () => {
    const execSummaryIndex = sections.findIndex(s => 
      s.key.toLowerCase().includes('executive') || 
      s.title.toLowerCase().includes('executive summary')
    );
    
    if (execSummaryIndex < 0) return;
    
    try {
      const { createAIHelper } = await import('@/features/editor/engine/aiHelper');
      const { loadUserAnswers } = await import('@/shared/lib/planStore');
      const userAnswers = typeof window !== 'undefined' ? loadUserAnswers() : {};
      
      // Collect content from all other sections
      const allSectionsContent = sections
        .filter((_, idx) => idx !== execSummaryIndex)
        .map(s => `## ${s.title}\n\n${s.content || 'No content yet'}`)
        .join('\n\n');
      
      const programForAI = programProfile ? {
        id: programProfile.programId,
        name: programProfile.programId,
        type: programProfile.route || 'grant',
        amount: '',
        eligibility: [],
        requirements: [],
        score: 100,
        reasons: [],
        risks: []
      } : {
        id: 'unknown',
        name: 'Program',
        type: 'grant',
        amount: '',
        eligibility: [],
        requirements: [],
        score: 100,
        reasons: [],
        risks: []
      };
      
      const aiHelper = createAIHelper({
        maxWords: 500,
        sectionScope: 'Executive Summary',
        programHints: {},
        userAnswers: userAnswers,
        tone: plan?.tone || 'neutral',
        language: plan?.language || 'en'
      });
      
      const prompt = `Generate a concise executive summary (300-500 words) based on the following business plan sections:\n\n${allSectionsContent}\n\nInclude: business opportunity, key metrics, funding requirements, and competitive advantage.`;
      const response = await aiHelper.generateSectionContent(
        'Executive Summary',
        prompt,
        programForAI
      );
      
      if (response.content) {
        onSectionChange(sections[execSummaryIndex].key, response.content);
      }
    } catch (error) {
      console.error('Error generating executive summary:', error);
    }
  }, [sections, plan, programProfile, onSectionChange]);

  // Document customization config
  const [documentConfig, setDocumentConfig] = useState({
    tone: plan?.tone || 'formal',
    language: plan?.language || 'en',
    tableOfContents: true,
    pageNumbers: true,
    fontFamily: 'Arial',
    fontSize: 12,
    lineSpacing: 1.5,
    margins: { top: 2.5, bottom: 2.5, left: 2.5, right: 2.5 },
    titlePage: {
      enabled: true,
      title: plan?.title || 'Business Plan',
      subtitle: '',
      author: '',
      date: new Date().toLocaleDateString()
    }
  });

  const handleConfigChange = useCallback((config: any) => {
    setDocumentConfig(config);
    if (plan) {
      onPlanChange({
        ...plan,
        tone: config.tone,
        language: config.language
      });
    }
  }, [plan, onPlanChange]);

  const handleExport = useCallback((format: string) => {
    // TODO: Implement export functionality
    console.log('Export as', format);
    router.push(`/export?format=${format}`);
  }, [router]);

  const currentSection = sections[activeSection]?.key || '';

  return (
    <UnifiedEditorLayout
      sections={sections}
      activeSection={activeSection}
      onSectionChange={handleSectionChange}
      sectionsProgress={sectionsProgress}
      plan={plan}
      programProfile={programProfile}
      programId={programProfile?.programId}
      planContent={planContent}
      currentSection={currentSection}
      onInsertContent={handleInsertContent}
      onConfigChange={handleConfigChange}
      currentConfig={documentConfig}
      onExport={handleExport}
    >
      {/* Main Editor Content */}
      <div className="max-w-4xl mx-auto p-8">
        {sections[activeSection] && (
          <div className="space-y-6">
            {/* Section Header */}
            <div className="border-b border-gray-200 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {sections[activeSection].title}
                  </h1>
                  {sections[activeSection].description && (
                    <p className="text-gray-600">{sections[activeSection].description}</p>
                  )}
                </div>
                {/* Auto-generate Executive Summary button */}
                {(sections[activeSection].key.toLowerCase().includes('executive') ||
                  sections[activeSection].title.toLowerCase().includes('executive summary')) && (
                  <button
                    onClick={handleGenerateExecutiveSummary}
                    className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    Auto-generate from other sections
                  </button>
                )}
              </div>
              
              {/* Word count and requirements */}
              <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                {sections[activeSection].wordCount && (
                  <span>
                    Word count: {sections[activeSection].wordCount}
                    {sections[activeSection].wordCountMin && sections[activeSection].wordCountMax && (
                      <span className="text-gray-400">
                        {' '}(Target: {sections[activeSection].wordCountMin}-{sections[activeSection].wordCountMax})
                      </span>
                    )}
                  </span>
                )}
                {sections[activeSection].required && (
                  <span className="text-red-500 font-medium">Required</span>
                )}
              </div>
            </div>

            {/* Prompts/Hints */}
            {sections[activeSection].prompts && sections[activeSection].prompts.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-blue-900 mb-2">Guiding Questions:</h3>
                <ul className="space-y-2">
                  {sections[activeSection].prompts.map((prompt: string, index: number) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-blue-800">
                      <span className="text-blue-500 mt-1">•</span>
                      <span>{prompt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Rich Text Editor */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <RichTextEditor
                content={sections[activeSection].content || ''}
                onChange={(content) => onSectionChange(sections[activeSection].key, content)}
                section={{
                  key: sections[activeSection].key,
                  title: sections[activeSection].title,
                  content: sections[activeSection].content || '',
                  status: sections[activeSection].status || 'missing',
                  wordCount: sections[activeSection].wordCount || 0,
                  wordCountMin: sections[activeSection].wordCountMin,
                  wordCountMax: sections[activeSection].wordCountMax
                }}
                placeholder={`Start writing your ${sections[activeSection].title.toLowerCase()}...`}
                minLength={sections[activeSection].wordCountMin || 50}
                maxLength={sections[activeSection].wordCountMax || 5000}
                showWordCount={true}
                showGuidance={true}
              />
            </div>

            {/* Section Footer - Navigation */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <button
                onClick={() => onActiveSectionChange(Math.max(0, activeSection - 1))}
                disabled={activeSection === 0}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                ← Previous
              </button>
              
              <span className="text-sm text-gray-500">
                Section {activeSection + 1} of {sections.length}
              </span>
              
              <button
                onClick={() => onActiveSectionChange(Math.min(sections.length - 1, activeSection + 1))}
                disabled={activeSection === sections.length - 1}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next →
              </button>
            </div>
          </div>
        )}
        
        {!sections[activeSection] && (
          <div className="text-center py-12 text-gray-500">
            <p>No section selected</p>
          </div>
        )}
      </div>
    </UnifiedEditorLayout>
  );
}


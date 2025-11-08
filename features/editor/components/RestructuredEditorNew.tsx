/**
 * RestructuredEditorNew - Refactored editor using UnifiedEditorLayout
 * Canva-style layout with merged compliance and AI assistant
 * Based on strategic analysis report recommendations
 */

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { PlanDocument } from '@/shared/types/plan';
import { ProgramProfile } from '@/features/reco/types/reco';
import { EditorProduct } from '@/features/editor/types/editor';
import RichTextEditor from './RichTextEditor';
import UnifiedEditorLayout from './UnifiedEditorLayout';
import FinancialTable, { FINANCIAL_TABLE_TEMPLATES } from './FinancialTable';
import ChartGenerator from './ChartGenerator';
import { calculateSectionProgress } from '../hooks/useSectionProgress';

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
  onSectionStatusChange: _onSectionStatusChange,
  onPlanChange,
  programProfile,
  product: _product,
  requirementsProgress: _requirementsProgress = 0,
  requirementsStatus: _requirementsStatus = 'loading',
  onAIGenerate: _onAIGenerate,
  onSave: _onSave
}: RestructuredEditorNewProps) {
  const router = useRouter();
  
  // Calculate progress for all sections
  const sectionsProgressData = sections.map(section => calculateSectionProgress(section));
  const sectionsProgress = sectionsProgressData.map(sp => sp.completionPercentage);
  
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

  // Generate content for a specific prompt (kept for future use)
  // @ts-ignore - Unused but kept for future functionality
  const handleGenerateForPrompt = useCallback(async (_promptText: string, _promptIndex: number) => {
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
      
      const context = `Focus on this specific requirement: ${_promptText}\n\nSection: ${sections[activeSection]?.title}\n\nCurrent content: ${sections[activeSection]?.content || 'No content yet'}`;
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
      title: plan?.settings?.titlePage?.title || 'Business Plan',
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
  
  // Financial table state
  const [showTableModal, setShowTableModal] = useState(false);
  const [tableData, setTableData] = useState<any[][]>([]);
  const [tableHeaders, setTableHeaders] = useState<string[]>([]);
  const [selectedTableTemplate, setSelectedTableTemplate] = useState<string | null>(null);
  
  // Chart state
  const [_showChart, _setShowChart] = useState(false);
  const [chartType, setChartType] = useState<'bar' | 'line' | 'pie'>('bar');

  // Handle insert table
  const handleInsertTable = useCallback((templateKey: string) => {
    const template = FINANCIAL_TABLE_TEMPLATES[templateKey as keyof typeof FINANCIAL_TABLE_TEMPLATES];
    if (template) {
      setTableHeaders(template.headers);
      setTableData(template.initialData);
      setSelectedTableTemplate(templateKey);
      setShowTableModal(true);
    }
  }, []);

  // Handle save table
  const handleSaveTable = useCallback((data: any[][]) => {
    if (!sections[activeSection]) return;
    
    // Store table data in section
    const updatedSection = {
      ...sections[activeSection],
      // Add new table
      tables: [
        ...(sections[activeSection].tables || []),
        {
          id: `table-${Date.now()}`,
          headers: tableHeaders,
          data: data,
          template: selectedTableTemplate
        }
      ]
    };
    
    // Update section in plan
    const updatedSections = [...sections];
    updatedSections[activeSection] = updatedSection;
    
    if (plan) {
      onPlanChange({
        ...plan,
        sections: updatedSections
      });
    }
    
    setShowTableModal(false);
  }, [sections, activeSection, tableHeaders, selectedTableTemplate, plan, onPlanChange]);

  // Check if current section is financial-related
  const isFinancialSection = sections[activeSection]?.key?.toLowerCase().includes('financial') ||
                             sections[activeSection]?.title?.toLowerCase().includes('financial');

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
                section={sections[activeSection]}
                placeholder={`Start writing your ${sections[activeSection].title.toLowerCase()}...`}
                minLength={sections[activeSection].wordCountMin || 50}
                maxLength={sections[activeSection].wordCountMax || 5000}
                showWordCount={true}
                showGuidance={true}
              />
            </div>

            {/* Financial Tables & Charts (for financial sections) */}
            {isFinancialSection && (
              <div className="space-y-4">
                {/* Insert Table Button */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">Financial Tools:</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleInsertTable('revenue_projections')}
                      className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      Revenue Projections
                    </button>
                    <button
                      onClick={() => handleInsertTable('expense_breakdown')}
                      className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      Expense Breakdown
                    </button>
                    <button
                      onClick={() => handleInsertTable('cash_flow')}
                      className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      Cash Flow
                    </button>
                    <button
                      onClick={() => handleInsertTable('unit_economics')}
                      className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      Unit Economics
                    </button>
                  </div>
                </div>

                {/* Existing Tables */}
                {sections[activeSection].tables && sections[activeSection].tables.length > 0 && (
                  <div className="space-y-4">
                    {sections[activeSection].tables.map((table: any, index: number) => (
                      <div key={table.id || index} className="space-y-2">
                        <FinancialTable
                          data={table.data || []}
                          headers={table.headers || []}
                          onChange={(data) => {
                            // Update table data
                            const updatedTables = [...(sections[activeSection].tables || [])];
                            updatedTables[index] = { ...table, data };
                            const updatedSection = {
                              ...sections[activeSection],
                              tables: updatedTables
                            };
                            const updatedSections = [...sections];
                            updatedSections[activeSection] = updatedSection;
                            if (plan) {
                              onPlanChange({
                                ...plan,
                                sections: updatedSections
                              });
                            }
                          }}
                          editable={true}
                        />
                        <ChartGenerator
                          tableData={table.data || []}
                          headers={table.headers || []}
                          chartType={chartType}
                          onChartTypeChange={setChartType}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Table Insert Modal */}
            {showTableModal && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Insert Financial Table</h3>
                      <button
                        onClick={() => setShowTableModal(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        ✕
                      </button>
                    </div>
                    <FinancialTable
                      data={tableData}
                      headers={tableHeaders}
                      onChange={(data) => {
                        setTableData(data);
                      }}
                      onInsert={() => {
                        // Add new row
                        const newRow = new Array(tableHeaders.length).fill('');
                        setTableData([...tableData, newRow]);
                      }}
                      editable={true}
                    />
                    <div className="flex items-center justify-end gap-2 mt-4">
                      <button
                        onClick={() => setShowTableModal(false)}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSaveTable(tableData)}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                      >
                        Insert Table
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

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


// ========= PLAN2FUND — SIMPLE EDITOR =========
// Clean, simple editor - section by section editing

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { PlanDocument, PlanSection, ConversationMessage } from '@/shared/types/plan';
import { SectionTemplate } from '@/shared/templates/types';
import { getSections } from '@/shared/templates';
import { createAIHelper } from '@/features/editor/engine/aiHelper';
import { savePlanSections, loadUserAnswers, savePlanConversations, loadPlanConversations } from '@/shared/user/storage/planStore';
import { calculateSectionProgress } from '@/features/editor/hooks/useSectionProgress';
import ProgramSelector from './ProgramSelector';
import SimpleTextEditor from './SimpleTextEditor';
import RequirementsModal from './RequirementsModal';
import SectionContentRenderer from './SectionContentRenderer';
import { initializeTablesForSection, sectionNeedsTables } from '@/features/editor/utils/tableInitializer';

interface EditorProps {
  programId?: string | null;
  product?: string;
  route?: string;
}

export default function Editor({ programId, product = 'submission', route = 'grant' }: EditorProps) {
  const router = useRouter();
  const [plan, setPlan] = useState<PlanDocument | null>(null);
  const [sections, setSections] = useState<PlanSection[]>([]);
  const [sectionTemplates, setSectionTemplates] = useState<SectionTemplate[]>([]);
  const [activeSection, setActiveSection] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load sections when programId changes
  useEffect(() => {
    if (programId) {
      loadSections();
    } else {
      setIsLoading(false);
    }
  }, [programId, product, route]);

  const loadSections = async () => {
    if (!programId) return;
    
    setIsLoading(true);
    try {
      // Determine funding type from route
      const fundingType = route === 'loan' ? 'bankLoans' : 
                         route === 'equity' ? 'equity' :
                         route === 'visa' ? 'visa' : 'grants';
      
      // Load sections from templates
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      const templateSections = await getSections(fundingType, product, programId, baseUrl);
      
      // Store templates for prompts
      setSectionTemplates(templateSections);
      
          // Convert to PlanSection format and initialize tables
          const planSections: PlanSection[] = templateSections.map((template: SectionTemplate) => {
            const section: PlanSection = {
              key: template.id,
              title: template.title,
              content: '',
              status: 'missing' as const
            };
            
            // Initialize tables if section needs them
            if (sectionNeedsTables(template)) {
              section.tables = initializeTablesForSection(template);
            }
            
            return section;
          });

          // Sort by order from template
          planSections.sort((a, b) => {
            const aTemplate = templateSections.find(t => t.id === a.key);
            const bTemplate = templateSections.find(t => t.id === b.key);
            return (aTemplate?.order || 999) - (bTemplate?.order || 999);
          });

      // Create plan
      const newPlan: PlanDocument = {
        id: `plan_${Date.now()}`,
        ownerId: 'current',
        product: product as any,
        route: route as any,
        programId,
        language: 'en',
        tone: 'neutral',
        targetLength: 'standard',
        settings: {
          includeTitlePage: true,
          includePageNumbers: true,
          citations: 'simple',
          captions: true,
          graphs: {}
        },
        sections: planSections,
        addonPack: false,
        versions: []
      };

      setPlan(newPlan);
      setSections(planSections);
    } catch (error) {
      console.error('Error loading sections:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle section content change
  const handleSectionChange = useCallback((sectionKey: string, content: string) => {
    const updatedSections = sections.map(section =>
      section.key === sectionKey ? { ...section, content } : section
    );
    setSections(updatedSections);
    
    if (plan) {
      const updatedPlan = { ...plan, sections: updatedSections };
      setPlan(updatedPlan);
      
      // Auto-save (debounced)
      setIsSaving(true);
      setTimeout(async () => {
        try {
          await savePlanSections(updatedSections.map(s => ({
            id: s.key,
            title: s.title,
            content: s.content || '',
            tables: s.tables,
            figures: s.figures,
            sources: s.sources
          })));
        } catch (error) {
          console.error('Error saving:', error);
        } finally {
          setIsSaving(false);
        }
      }, 400);
    }
  }, [sections, plan]);

  // If no program, show selector
  if (!programId) {
    return (
      <ProgramSelector
        onProgramSelect={(id, prod, rte) => {
          router.push(`/editor?programId=${id}&product=${prod}&route=${rte}`);
        }}
      />
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div>Loading editor...</div>
        </div>
      </div>
    );
  }

  // No sections
  if (sections.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No sections found</p>
          <button
            onClick={() => router.push('/editor')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Select Program
          </button>
        </div>
      </div>
    );
  }

  const [showAIModal, setShowAIModal] = useState(false);
  const [showRequirementsModal, setShowRequirementsModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const currentSection = sections[activeSection];
  const sectionTemplate = sectionTemplates.find(t => t.id === currentSection?.key);
  const questions = sectionTemplate?.prompts || [];
  
  // Reset question index when section changes
  useEffect(() => {
    setCurrentQuestionIndex(0);
  }, [activeSection]);

  // Get current question answer
  const getCurrentAnswer = () => {
    if (!currentSection?.fields?.answers) return '';
    return currentSection.fields.answers[currentQuestionIndex] || '';
  };

  // Handle AI generation
  const handleAIGenerate = useCallback(async () => {
    const currentSection = sections[activeSection];
    if (!currentSection || !plan || !programId) return;

    try {
      const userAnswers = typeof window !== 'undefined' ? loadUserAnswers() : {};
      const currentTemplate = sectionTemplates.find(t => t.id === currentSection.key);
      const currentQuestions = currentTemplate?.prompts || [];
      
      // Load conversation history for this section
      const conversations = loadPlanConversations();
      const conversationHistory = conversations[currentSection.key] || [];
      
      const aiHelper = createAIHelper({
        maxWords: 500, // Reasonable default
        sectionScope: currentSection.title,
        programHints: {},
        userAnswers,
        tone: plan.tone || 'neutral',
        language: plan.language || 'en'
      });

      const programForAI = {
        id: programId,
        name: programId,
        type: route || 'grant',
        amount: '',
        eligibility: [],
        requirements: [],
        score: 100,
        reasons: [],
        risks: []
      };

      // Get section template for prompts
      const fundingType = route === 'loan' ? 'bankLoans' : 
                         route === 'equity' ? 'equity' :
                         route === 'visa' ? 'visa' : 'grants';
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      const templateSections = await getSections(fundingType, product, programId, baseUrl);
      const sectionTemplate = templateSections.find((s: SectionTemplate) => s.id === currentSection.key);
      
      // If we're in question mode, generate answer for current question
      if (currentQuestions.length > 0 && currentQuestionIndex < currentQuestions.length) {
        const currentQuestion = currentQuestions[currentQuestionIndex];
        
        // Build context: current question + previous answers + other sections
        const previousAnswers = Object.entries(currentSection.fields?.answers || {})
          .filter(([idx]) => Number(idx) < currentQuestionIndex)
          .map(([_, answer]) => answer)
          .filter(Boolean);
        
        // Add cross-section awareness: include snippets from other sections
        const otherSections = sections
          .filter(s => s.key !== currentSection.key && s.content)
          .map(s => `${s.title}: ${s.content.substring(0, 200)}...`)
          .join('\n\n');
        
        const context = `Question: ${currentQuestion}\n\n${
          previousAnswers.length > 0 
            ? `Previous answers:\n${previousAnswers.join('\n\n')}\n\n`
            : ''
        }${
          otherSections 
            ? `Other sections:\n${otherSections}\n\n`
            : ''
        }${sectionTemplate?.description || ''}`;
        
        // Create user message for conversation history
        const userMessage: ConversationMessage = {
          id: `msg_${Date.now()}`,
          role: 'user',
          content: `Generate answer for: ${currentQuestion}`,
          timestamp: new Date().toISOString()
        };
        
        const updatedHistory = [...conversationHistory, userMessage];
        
        const response = await aiHelper.generateSectionContent(
          currentQuestion,
          context,
          programForAI,
          updatedHistory // Pass conversation history
        );

        if (response.content) {
          // Save assistant response to conversation history
          const assistantMessage: ConversationMessage = {
            id: `msg_${Date.now() + 1}`,
            role: 'assistant',
            content: response.content,
            timestamp: new Date().toISOString()
          };
          const finalHistory = [...updatedHistory, assistantMessage];
          savePlanConversations(currentSection.key, finalHistory);
          
          // Update only current question answer - call handleAnswerChange directly
          const updatedFields = {
            ...currentSection.fields,
            answers: {
              ...(currentSection.fields?.answers || {}),
              [currentQuestionIndex]: response.content
            }
          };
          const allAnswers = Object.values(updatedFields.answers || {}).filter(Boolean);
          const combinedContent = allAnswers.join('\n\n');
          const updatedSections = sections.map(section =>
            section.key === currentSection.key 
              ? { ...section, fields: updatedFields, content: combinedContent }
              : section
          );
          setSections(updatedSections);
          if (plan) {
            const updatedPlan = { ...plan, sections: updatedSections };
            setPlan(updatedPlan);
            setIsSaving(true);
            setTimeout(async () => {
              try {
                await savePlanSections(updatedSections.map(s => ({
                  id: s.key,
                  title: s.title,
                  content: s.content || '',
                  tables: s.tables,
                  figures: s.figures,
                  sources: s.sources,
                  fields: s.fields
                })));
              } catch (error) {
                console.error('Error saving:', error);
              } finally {
                setIsSaving(false);
              }
            }, 400);
          }
        }
      } else {
        // No questions or not in question mode - generate for whole section
        // Add cross-section awareness
        const otherSections = sections
          .filter(s => s.key !== currentSection.key && s.content)
          .map(s => `${s.title}: ${s.content.substring(0, 200)}...`)
          .join('\n\n');
        
        const context = `${sectionTemplate?.prompts?.join('\n') || sectionTemplate?.description || ''}${
          otherSections ? `\n\nOther sections:\n${otherSections}` : ''
        }`;
        
        // Create user message for conversation history
        const userMessage: ConversationMessage = {
          id: `msg_${Date.now()}`,
          role: 'user',
          content: `Generate content for section: ${currentSection.title}`,
          timestamp: new Date().toISOString()
        };
        
        const updatedHistory = [...conversationHistory, userMessage];
        
        const response = await aiHelper.generateSectionContent(
          currentSection.title,
          context,
          programForAI,
          updatedHistory // Pass conversation history
        );
        
        if (response.content) {
          // Save assistant response to conversation history
          const assistantMessage: ConversationMessage = {
            id: `msg_${Date.now() + 1}`,
            role: 'assistant',
            content: response.content,
            timestamp: new Date().toISOString()
          };
          const finalHistory = [...updatedHistory, assistantMessage];
          savePlanConversations(currentSection.key, finalHistory);
          
          handleSectionChange(currentSection.key, response.content);
        }
      }
    } catch (error) {
      console.error('Error generating content:', error);
    }
  }, [sections, activeSection, plan, programId, route, product, sectionTemplates, currentQuestionIndex, handleSectionChange]);

  // Update answer for current question
  const handleAnswerChange = (answer: string) => {
    if (!currentSection) return;
    
    const updatedFields = {
      ...currentSection.fields,
      answers: {
        ...(currentSection.fields?.answers || {}),
        [currentQuestionIndex]: answer
      }
    };

    // Also update content (combined answers)
    const allAnswers = Object.values(updatedFields.answers || {}).filter(Boolean);
    const combinedContent = allAnswers.join('\n\n');

    const updatedSections = sections.map(section =>
      section.key === currentSection.key 
        ? { 
            ...section, 
            fields: updatedFields,
            content: combinedContent
          } 
        : section
    );
    
    setSections(updatedSections);
    
    if (plan) {
      const updatedPlan = { ...plan, sections: updatedSections };
      setPlan(updatedPlan);
      
      // Auto-save
      setIsSaving(true);
      setTimeout(async () => {
        try {
          await savePlanSections(updatedSections.map(s => ({
            id: s.key,
            title: s.title,
            content: s.content || '',
            tables: s.tables,
            figures: s.figures,
            sources: s.sources,
            fields: s.fields
          })));
        } catch (error) {
          console.error('Error saving:', error);
        } finally {
          setIsSaving(false);
        }
      }, 400);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Main Editor - Single Column */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Business Plan</h1>
          </div>
          <div className="flex items-center gap-2">
            {isSaving && (
              <span className="text-xs text-gray-500">Saving...</span>
            )}
            <button
              onClick={() => setShowSettingsModal(true)}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Settings"
            >
              ⚙️
            </button>
            <button
              onClick={() => router.push('/preview')}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              👁️ Preview
            </button>
          </div>
        </div>

        {/* Section Navigation - Horizontal Tabs */}
        <div className="bg-white border-b border-gray-200 px-6 py-2 overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            {sections.map((section, index) => {
              const progress = calculateSectionProgress(section);
              const status = progress.completionPercentage === 100 ? '✓' : 
                            progress.completionPercentage > 50 ? '⚠' : '○';
              const isActive = index === activeSection;
              
              return (
                <button
                  key={section.key}
                  onClick={() => setActiveSection(index)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span className="mr-2">{status}</span>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <span className="ml-1">{section.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Editor Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-white">
          {currentSection && (
            <div className="max-w-4xl mx-auto">
              {/* Question Navigation - One Question at a Time */}
              {questions.length > 0 ? (
                <>
                  {/* Current Question */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-500">
                          Question {currentQuestionIndex + 1} of {questions.length}
                        </span>
                        <div className="flex gap-1">
                          {questions.map((_, idx) => (
                            <div
                              key={idx}
                              className={`w-2 h-2 rounded-full ${
                                idx === currentQuestionIndex
                                  ? 'bg-blue-600'
                                  : (currentSection.fields?.answers?.[idx] ? 'bg-green-400' : 'bg-gray-300')
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <button
                        onClick={handleAIGenerate}
                        className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                      >
                        ✨ Generate Answer
                      </button>
                    </div>

                    {/* Question Text */}
                    <div className="mb-4">
                      <h3 className="text-lg font-medium text-gray-900 flex items-start gap-2">
                        <span className="text-blue-500 mt-1">💡</span>
                        <span>{questions[currentQuestionIndex]}</span>
                      </h3>
                    </div>

                    {/* Google Docs-Style Editor */}
                    <div className="mb-6">
                      <SimpleTextEditor
                        content={getCurrentAnswer()}
                        onChange={handleAnswerChange}
                        placeholder={`Answer this question...`}
                      />
                    </div>

                    {/* Question Navigation */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <button
                        onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                        disabled={currentQuestionIndex === 0}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        ← Previous Question
                      </button>
                      <button
                        onClick={() => setCurrentQuestionIndex(Math.min(questions.length - 1, currentQuestionIndex + 1))}
                        disabled={currentQuestionIndex === questions.length - 1}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next Question →
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                /* No Questions - Show Regular Editor */
                <div className="mb-6">
                  <SimpleTextEditor
                    content={currentSection.content || ''}
                    onChange={(content) => handleSectionChange(currentSection.key, content)}
                    placeholder={`Start writing your ${currentSection.title.toLowerCase()}...`}
                  />
                </div>
              )}

              {/* Smart Section Content Renderer - Tables & Charts */}
              {currentSection.tables && (() => {
                const currentTemplate = sectionTemplates.find(t => t.id === currentSection.key);
                if (!currentTemplate) return null;
                
                return (
                  <div className="mb-6">
                    <SectionContentRenderer
                      section={currentSection}
                      template={currentTemplate}
                      onTableChange={(tableKey, updatedTable) => {
                        const updated = [...sections];
                        const section = updated[activeSection];
                        if (section.tables) {
                          section.tables[tableKey] = updatedTable;
                          setSections(updated);
                          
                          // Update plan
                          if (plan) {
                            const updatedPlan = { ...plan, sections: updated };
                            setPlan(updatedPlan);
                            
                            // Auto-save
                            setIsSaving(true);
                            setTimeout(async () => {
                              try {
                                await savePlanSections(updated.map(s => ({
                                  id: s.key,
                                  title: s.title,
                                  content: s.content || '',
                                  tables: s.tables,
                                  figures: s.figures,
                                  sources: s.sources,
                                  fields: s.fields
                                })));
                              } catch (error) {
                                console.error('Error saving:', error);
                              } finally {
                                setIsSaving(false);
                              }
                            }, 400);
                          }
                        }
                      }}
                    />
                  </div>
                );
              })()}

              {/* Progress & Navigation */}
              <div className="flex items-center justify-between pt-6 mt-6 border-t border-gray-200">
                <div className="flex items-center gap-4">
                  {(() => {
                    const progress = calculateSectionProgress(currentSection);
                    return (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">{progress.wordCount}</span> / {progress.wordCountMax} words
                        <span className="ml-3 text-gray-500">• Progress: {progress.completionPercentage}%</span>
                      </div>
                    );
                  })()}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveSection(Math.max(0, activeSection - 1))}
                    disabled={activeSection === 0}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ← Previous
                  </button>
                  <button
                    onClick={() => setActiveSection(Math.min(sections.length - 1, activeSection + 1))}
                    disabled={activeSection === sections.length - 1}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next →
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Button (FAB) */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-2">
        <button
          onClick={() => setShowAIModal(true)}
          className="w-12 h-12 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors flex items-center justify-center text-xl"
          title="AI Assistant"
        >
          💬
        </button>
        <button
          onClick={() => setShowRequirementsModal(true)}
          className="w-12 h-12 bg-green-600 text-white rounded-full shadow-lg hover:bg-green-700 transition-colors flex items-center justify-center text-xl"
          title="Requirements"
        >
          ✓
        </button>
        <button
          onClick={() => setShowSettingsModal(true)}
          className="w-12 h-12 bg-gray-600 text-white rounded-full shadow-lg hover:bg-gray-700 transition-colors flex items-center justify-center text-xl"
          title="Settings"
        >
          ⚙️
        </button>
      </div>

      {/* AI Assistant Modal - Placeholder (can be enhanced later) */}
      {showAIModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowAIModal(false)}>
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">AI Assistant</h2>
              <button onClick={() => setShowAIModal(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="text-gray-600">
              <p className="mb-4">Conversation memory is now integrated into the "✨ Generate Answer" button.</p>
              <p className="text-sm">Each generation remembers previous conversations and uses context from other sections.</p>
            </div>
          </div>
        </div>
      )}

      <RequirementsModal
        isOpen={showRequirementsModal}
        onClose={() => setShowRequirementsModal(false)}
        sections={sections}
        sectionTemplates={sectionTemplates}
        onNavigateToSection={(index) => setActiveSection(index)}
        onGenerateMissingContent={async (sectionKey) => {
          // Find the section index
          const sectionIndex = sections.findIndex(s => s.key === sectionKey);
          if (sectionIndex >= 0) {
            // Navigate to section
            setActiveSection(sectionIndex);
            // Trigger AI generation for the section
            const section = sections[sectionIndex];
            if (section && plan && programId) {
              try {
                const userAnswers = typeof window !== 'undefined' ? loadUserAnswers() : {};
                
                const aiHelper = createAIHelper({
                  maxWords: 500,
                  sectionScope: section.title,
                  programHints: {},
                  userAnswers,
                  tone: plan.tone || 'neutral',
                  language: plan.language || 'en'
                });

                const programForAI = {
                  id: programId,
                  name: programId,
                  type: route || 'grant',
                  amount: '',
                  eligibility: [],
                  requirements: [],
                  score: 100,
                  reasons: [],
                  risks: []
                };

                const fundingType = route === 'loan' ? 'bankLoans' : 
                                   route === 'equity' ? 'equity' :
                                   route === 'visa' ? 'visa' : 'grants';
                const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
                const templateSections = await getSections(fundingType, product, programId, baseUrl);
                const sectionTemplate = templateSections.find((s: SectionTemplate) => s.id === section.key);
                
                const context = sectionTemplate?.prompts?.join('\n') || sectionTemplate?.description || '';
                const response = await aiHelper.generateSectionContent(
                  section.title,
                  context,
                  programForAI,
                  []
                );

                if (response.content) {
                  handleSectionChange(section.key, response.content);
                }
              } catch (error) {
                console.error('Error generating content:', error);
              }
            }
          }
        }}
      />

      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowSettingsModal(false)}>
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Settings</h2>
              <button onClick={() => setShowSettingsModal(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="text-gray-600">Settings panel coming soon...</div>
          </div>
        </div>
      )}
    </div>
  );
}


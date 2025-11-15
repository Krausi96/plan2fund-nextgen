// ========= PLAN2FUND — SIMPLE EDITOR =========
// Clean, simple editor - section by section editing

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { PlanDocument, PlanSection, ConversationMessage } from '@/shared/types/plan';
import { SectionTemplate } from '@/features/editor/templates/types';
import { getSections } from '@/features/editor/templates';
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
  const [programData, setProgramData] = useState<{
    categorized_requirements?: any;
    program_name?: string;
  } | null>(null);

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

      // Load program data for requirements modal
      if (programId && typeof window !== 'undefined') {
        try {
          const response = await fetch(`/api/programmes/${programId}/requirements`);
          if (response.ok) {
            const data = await response.json();
            setProgramData({
              categorized_requirements: data.categorized_requirements,
              program_name: data.program_name || programId
            });
          }
        } catch (error) {
          console.warn('Failed to load program data:', error);
          // Continue without program data
        }
      }
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
        product={product}
        route={route}
        onSelectionChange={(prod: string, rte: string, prog?: string) => {
          router.push(`/editor?programId=${prog || ''}&product=${prod}&route=${rte}`);
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

  const currentSection = sections[activeSection];
  const sectionTemplate = sectionTemplates.find(t => t.id === currentSection?.key);

  // Handle AI generation
  const handleAIGenerate = useCallback(async () => {
    const currentSection = sections[activeSection];
    if (!currentSection || !plan || !programId) return;

    try {
      const userAnswers = typeof window !== 'undefined' ? loadUserAnswers() : {};
      
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
      
      // Generate for whole section (always, no question mode)
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
    } catch (error) {
      console.error('Error generating content:', error);
    }
  }, [sections, activeSection, plan, programId, route, product, sectionTemplates, handleSectionChange]);

  // Calculate overall progress
  const overallProgress = React.useMemo(() => {
    if (sections.length === 0) return { percentage: 0, completed: 0, total: 0 };
    let totalProgress = 0;
    let completedSections = 0;
    sections.forEach(section => {
      const progress = calculateSectionProgress(section);
      totalProgress += progress.completionPercentage;
      if (progress.completionPercentage === 100) {
        completedSections++;
      }
    });
    return {
      percentage: Math.round(totalProgress / sections.length),
      completed: completedSections,
      total: sections.length
    };
  }, [sections]);

  const [showSmartHints, setShowSmartHints] = useState(false);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* ========= HEADER ========= */}
      <header className="sticky top-0 z-50 bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-white text-xl font-bold">Business Plan Editor</h1>
            <div className="flex items-center gap-2">
              {isSaving && (
                <span className="text-xs text-white/80">Saving...</span>
              )}
              <button
                onClick={() => setShowRequirementsModal(true)}
                className="px-3 py-1.5 text-sm font-medium text-white bg-white/20 hover:bg-white/30 rounded-lg transition-colors backdrop-blur-sm"
                title="Requirements"
              >
                📋 Requirements
              </button>
              <button
                onClick={() => setShowAIModal(true)}
                className="px-3 py-1.5 text-sm font-medium text-white bg-white/20 hover:bg-white/30 rounded-lg transition-colors backdrop-blur-sm"
                title="AI Assistant"
              >
                💬 AI Assistant
              </button>
              <button
                onClick={() => router.push('/preview')}
                className="px-3 py-1.5 text-sm font-medium text-white bg-white/20 hover:bg-white/30 rounded-lg transition-colors backdrop-blur-sm"
                title="Preview"
              >
                👁️ Preview
              </button>
            </div>
          </div>
          {/* Program Selector */}
          <div className="bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-sm">
            <ProgramSelector
              product={product}
              route={route}
              programId={programId || undefined}
              onSelectionChange={(prod, rte, prog) => {
                router.push(`/editor?programId=${prog || ''}&product=${prod}&route=${rte}`);
              }}
            />
          </div>
        </div>
      </header>

      {/* ========= SECTION NAVIGATION ========= */}
      <nav className="sticky top-[140px] z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setActiveSection(Math.max(0, activeSection - 1))}
              disabled={activeSection === 0}
              className="px-2 py-1 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Previous Section"
            >
              ←
            </button>
            {sections.map((section, index) => {
              const progress = calculateSectionProgress(section);
              const status = progress.completionPercentage === 100 ? '✓' : 
                            progress.completionPercentage > 50 ? '⚠' : '○';
              const isActive = index === activeSection;
              
              return (
                <button
                  key={section.key}
                  onClick={() => setActiveSection(index)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span className="mr-2">{status}</span>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <span className="ml-1">{section.title}</span>
                </button>
              );
            })}
            <button
              onClick={() => setActiveSection(Math.min(sections.length - 1, activeSection + 1))}
              disabled={activeSection === sections.length - 1}
              className="px-2 py-1 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Next Section"
            >
              →
            </button>
          </div>
          {/* Progress Bar */}
          <div className="mt-2">
            <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
              <span>Overall Progress</span>
              <span>{overallProgress.percentage}% Complete ({overallProgress.completed} of {overallProgress.total} sections)</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${overallProgress.percentage}%` }}
              />
            </div>
          </div>
        </div>
      </nav>

      {/* ========= MAIN EDITOR AREA ========= */}
      <main className="flex-1 overflow-y-auto bg-gray-50">
        {currentSection && (
          <div className="max-w-[1200px] mx-auto px-4 py-8">
            {/* Section Header Card */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{currentSection.title}</h2>
              {sectionTemplate?.description && (
                <p className="text-gray-600">{sectionTemplate.description}</p>
              )}
            </div>

            {/* Text Editor - Always show regular editor (no question-by-question mode) */}
            <div className="mb-4">
              <SimpleTextEditor
                content={currentSection.content || ''}
                onChange={(content) => handleSectionChange(currentSection.key, content)}
                placeholder={`Start writing your ${currentSection.title.toLowerCase()}...`}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={handleAIGenerate}
                className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                ✨ Generate with AI
              </button>
              {sectionTemplate?.prompts && sectionTemplate.prompts.length > 0 && (
                <button
                  onClick={() => setShowSmartHints(!showSmartHints)}
                  className="px-4 py-2 text-sm font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  💡 Smart Hints
                </button>
              )}
              <button
                onClick={() => setActiveSection(Math.min(sections.length - 1, activeSection + 1))}
                disabled={activeSection === sections.length - 1}
                className="px-4 py-2 text-sm font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ⏭️ Skip
              </button>
            </div>

            {/* Smart Hints Panel */}
            {sectionTemplate?.prompts && sectionTemplate.prompts.length > 0 && (
              <SmartHintsPanel
                template={sectionTemplate}
                isOpen={showSmartHints}
                onUseAsGuide={() => {
                  // Could populate editor with prompts as guide
                  setShowSmartHints(false);
                }}
              />
            )}

            {/* Tables & Charts Section */}
            {(() => {
              const currentTemplate = sectionTemplates.find(t => t.id === currentSection.key);
              if (!currentTemplate) return null;
              
              const category = currentTemplate.category?.toLowerCase() || '';
              const needsTables = category === 'financial' || category === 'risk' || category === 'project';
              const optionalTables = category === 'market' || category === 'team';
              const hasTables = currentSection.tables && Object.keys(currentSection.tables).length > 0;
              
              // Show section if: always needs tables OR has tables OR is optional and has content
              const shouldShow = needsTables || hasTables || (optionalTables && currentSection.content);
              
              if (!shouldShow) return null;
              
              // Get helpful message based on category
              const getHelpfulMessage = () => {
                if (category === 'financial') {
                  return "This section typically includes financial tables. Create tables to visualize your revenue, costs, and cash flow projections.";
                } else if (category === 'risk') {
                  return "This section typically includes a risk matrix. Create a matrix to visualize risk impact and probability.";
                } else if (category === 'project') {
                  return "This section typically includes milestone timelines. Create a timeline to visualize your project schedule.";
                } else if (category === 'market') {
                  return "You can optionally add competitor analysis tables. Tables help visualize market data.";
                } else if (category === 'team') {
                  return "You can optionally add hiring timeline tables. Tables help visualize team growth.";
                }
                return "Create tables to visualize your data.";
              };
              
              return (
                <div className="mb-6 bg-white border border-gray-200 rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">📊 Tables & Charts</h3>
                    {optionalTables && !needsTables && (
                      <span className="text-xs text-gray-500">(Optional)</span>
                    )}
                  </div>
                  
                  {/* Helpful Message */}
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-gray-700">
                      💡 {getHelpfulMessage()}
                    </p>
                  </div>
                  
                  {/* Add Buttons */}
                  <div className="flex gap-2 mb-4">
                    <button
                      onClick={() => {
                        // TODO: Implement table creation dialog
                        alert('Table creation dialog coming soon');
                      }}
                      className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      📊 Add Table
                    </button>
                    <button
                      onClick={() => {
                        // TODO: Implement chart creation
                        alert('Chart creation coming soon');
                      }}
                      className="px-4 py-2 text-sm font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      📈 Add Chart
                    </button>
                    <button
                      onClick={() => {
                        // TODO: Implement image upload
                        alert('Image upload coming soon');
                      }}
                      className="px-4 py-2 text-sm font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      📷 Add Image
                    </button>
                  </div>
                  
                  {/* Existing Tables */}
                  {hasTables && (
                    <div className="mt-4">
                      <SectionContentRenderer
                        section={currentSection}
                        template={currentTemplate}
                        onTableChange={(tableKey, updatedTable) => {
                      const updated = [...sections];
                      const section = updated[activeSection];
                      if (section.tables) {
                        section.tables[tableKey] = updatedTable;
                        setSections(updated);
                        
                        if (plan) {
                          const updatedPlan = { ...plan, sections: updated };
                          setPlan(updatedPlan);
                          
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
                    onChartTypeChange={(tableKey, chartType) => {
                      const updated = [...sections];
                      const section = updated[activeSection];
                      if (!section.chartTypes) {
                        section.chartTypes = {};
                      }
                      section.chartTypes[tableKey] = chartType;
                      setSections(updated);
                      
                      if (plan) {
                        const updatedPlan = { ...plan, sections: updated };
                        setPlan(updatedPlan);
                        
                        setIsSaving(true);
                        setTimeout(async () => {
                          try {
                            await savePlanSections(updated.map(s => ({
                              id: s.key,
                              title: s.title,
                              content: s.content || '',
                              tables: s.tables,
                              figures: s.figures,
                              chartTypes: s.chartTypes,
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
                    }}
                      onImageInsert={(imageUrl, caption, description) => {
                        // TODO: Handle image insert
                        console.log('Image insert:', imageUrl, caption, description);
                      }}
                    />
                    </div>
                  )}
                  
                  {/* No Tables Message */}
                  {!hasTables && (
                    <div className="text-center py-8 text-gray-500 text-sm">
                      (No tables created yet{optionalTables && !needsTables ? ' - optional' : ''})
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}
      </main>

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
        programId={programId}
        programData={programData || undefined}
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

// ========= SMART HINTS PANEL COMPONENT =========
function SmartHintsPanel({
  template,
  isOpen,
  onUseAsGuide
}: {
  template: SectionTemplate;
  isOpen: boolean;
  onUseAsGuide: () => void;
}) {
  if (!template.prompts || template.prompts.length === 0) return null;

  return (
    <div className={`mt-4 transition-all duration-300 ${isOpen ? 'block' : 'hidden'}`}>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <span>💡</span>
            <span>Smart Hints</span>
          </h3>
          <button
            onClick={onUseAsGuide}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Use as Guide
          </button>
        </div>
        <div className="space-y-2">
          {template.prompts.map((prompt, idx) => (
            <div key={idx} className="text-sm text-gray-700">
              <span className="text-blue-500 mr-2">💡</span>
              <span>{prompt}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


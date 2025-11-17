// ========= PLAN2FUND — SIMPLE EDITOR =========
// Clean, simple editor - section by section editing

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { PlanDocument, PlanSection, ConversationMessage } from '@/features/editor/types/plan';
import { SectionTemplate, getSections } from '@templates';
import { createAIHelper } from '@/features/editor/engine/aiHelper';
import { savePlanSections, loadUserAnswers, savePlanConversations, loadPlanConversations } from '@/shared/user/storage/planStore';
import { calculateSectionProgress } from '@/features/editor/hooks/useSectionProgress';
import SimpleTextEditor from './SimpleTextEditor';
import RequirementsModal from './RequirementsModal';
import SectionContentRenderer from './SectionContentRenderer';
import InlineTableCreator from './InlineTableCreator';
import { initializeTablesForSection, sectionNeedsTables } from '@/features/editor/utils/tableInitializer';

interface EditorProps {
  product?: string;
}

export default function Editor({ product = 'submission' }: EditorProps) {
  const router = useRouter();
  const [plan, setPlan] = useState<PlanDocument | null>(null);
  const [sections, setSections] = useState<PlanSection[]>([]);
  const [sectionTemplates, setSectionTemplates] = useState<SectionTemplate[]>([]);
  const [activeSection, setActiveSection] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [programData, setProgramData] = useState<{
    categorized_requirements?: any;
    program_name?: string;
  } | null>(null);
  // Modal states - MUST be at top level before any conditional returns
  const [showAIModal, setShowAIModal] = useState(false);
  const [showRequirementsModal, setShowRequirementsModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showProgramFinderModal, setShowProgramFinderModal] = useState(false);
  const [showQuestions, setShowQuestions] = useState(true);
  const [showInlineTableCreator, setShowInlineTableCreator] = useState(false);
  const [activeQuestion, setActiveQuestion] = useState(0);

  // Load sections when product changes
  const loadSections = useCallback(async () => {
    if (typeof window === 'undefined') return; // Don't run on server
    
    setIsLoading(true);
    setError(null);
    try {
      // Use grants as default funding type (routes removed for simplicity)
      const fundingType = 'grants';
      
      // Load sections from templates (always uses master templates)
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      
      let templateSections: SectionTemplate[];
      try {
        templateSections = await getSections(fundingType, product, undefined, baseUrl);
      } catch (templateError: any) {
        console.error('Error loading template sections:', templateError);
        throw new Error(`Failed to load templates: ${templateError?.message || 'Unknown error'}`);
      }
      
      // Validate that we got sections
      if (!templateSections || templateSections.length === 0) {
        console.error(`No sections found for fundingType: ${fundingType}, product: ${product}`);
        throw new Error(`No sections available for ${product} product with ${fundingType} funding type.`);
      }
      
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
        route: 'grants' as any, // Default to grants
        programId: undefined, // Programs don't have stable IDs - use localStorage instead
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

      // Load program data from localStorage (programs don't have stable IDs)
      // This is set when user selects a program from reco
      // Only use if selected recently (within 1 hour) to avoid stale data
      if (typeof window !== 'undefined') {
        try {
          const storedProgram = localStorage.getItem('selectedProgram');
          if (storedProgram) {
            const programData = JSON.parse(storedProgram);
            const selectedAt = programData.selectedAt ? new Date(programData.selectedAt) : null;
            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
            
            // Only use program if it was selected recently (within 1 hour)
            // This prevents old program selections from persisting across sessions
            if (selectedAt && selectedAt > oneHourAgo) {
              setProgramData({
                categorized_requirements: programData.categorized_requirements || {},
                program_name: programData.name || programData.id || 'Selected Program'
              });
            } else {
              // Program selection is too old - clear it
              localStorage.removeItem('selectedProgram');
              setProgramData(null);
            }
          } else {
            // No program selected - clear program data
            setProgramData(null);
          }
        } catch (error) {
          console.warn('Failed to load program data from localStorage:', error);
          setProgramData(null);
        }
      } else {
        setProgramData(null);
      }
    } catch (error: any) {
      console.error('Error loading sections:', error);
      // Set empty sections on error to prevent infinite loading
      setSections([]);
      setSectionTemplates([]);
      setError(error?.message || 'Failed to load sections. Please try refreshing the page.');
    } finally {
      setIsLoading(false);
    }
  }, [product]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      loadSections();
    }
  }, [loadSections]);

  // Watch for product changes in URL and reload sections
  useEffect(() => {
    const { product: urlProduct } = router.query;
    if (urlProduct && urlProduct !== product && typeof window !== 'undefined') {
      // Product changed in URL, reload sections
      loadSections();
    }
  }, [router.query.product, product, loadSections]);

  // Reset active question when switching sections
  useEffect(() => {
    setActiveQuestion(0);
  }, [activeSection]);

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

  // Handle AI generation - MUST be before conditional returns
  const handleAIGenerate = useCallback(async () => {
    const currentSection = sections[activeSection];
    if (!currentSection || !plan) return;

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

      // Use program data from localStorage (set by reco) or default
      const storedProgram = typeof window !== 'undefined' 
        ? JSON.parse(localStorage.getItem('selectedProgram') || 'null')
        : null;
      
      const programForAI = storedProgram ? {
        id: storedProgram.id || 'default',
        name: storedProgram.name || 'Selected Program',
        type: storedProgram.type || 'grant',
        amount: '',
        eligibility: [],
        requirements: [],
        score: 100,
        reasons: [],
        risks: []
      } : {
        id: 'default',
        name: 'Default Template',
        type: 'grant',
        amount: '',
        eligibility: [],
        requirements: [],
        score: 100,
        reasons: [],
        risks: []
      };

      // Get section template for prompts (works without programId)
      const fundingType = storedProgram?.type || 'grants'; // Use program type if available
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      const templateSections = await getSections(fundingType, product, undefined, baseUrl);
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
  }, [sections, activeSection, plan, product, sectionTemplates, handleSectionChange]);


  // Cross-section references - find sections that reference this one
  const getCrossSectionReferences = useCallback(() => {
    const currentSection = sections[activeSection];
    if (!currentSection) return [];
    const references: Array<{ section: PlanSection; index: number; mentions: number }> = [];
    
    sections.forEach((section, index) => {
      if (index === activeSection) return; // Skip current section
      if (!section.content) return;
      
      // Check if section content mentions current section title
      const content = section.content.toLowerCase();
      const currentTitle = currentSection.title.toLowerCase();
      const mentions = (content.match(new RegExp(currentTitle.split(' ').join('|'), 'g')) || []).length;
      
      if (mentions > 0) {
        references.push({ section, index, mentions });
      }
    });
    
    return references;
  }, [sections, activeSection]);

  const crossSectionRefs = getCrossSectionReferences();

  // Program data is loaded from localStorage (set by reco when user selects a program)

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center max-w-md">
          <div className="text-red-600 text-xl mb-4">⚠️ Error</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => {
              setError(null);
              loadSections();
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
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

  // No sections - show error or empty state
  if (sections.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center max-w-md">
          <p className="text-gray-600 mb-4">
            No sections found for product "{product}".
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Try selecting a different product in the header.
          </p>
          <button
            onClick={() => router.push('/editor')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Editor
          </button>
        </div>
      </div>
    );
  }

  const currentSection = sections[activeSection];
  const sectionTemplate = sectionTemplates.find(t => t.id === currentSection?.key);

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
          {/* Program Selector - Simplified */}
          <div className="bg-white rounded-lg p-4 shadow-md border-2 border-white/50">
            <div className="max-w-[1200px] mx-auto flex gap-4 items-center">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Product Type</label>
                <select
                  value={product}
                  onChange={(e) => {
                    const newProduct = e.target.value;
                    // Update URL and reload sections
                    router.push({ pathname: '/editor', query: { product: newProduct } }, undefined, { shallow: false });
                  }}
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg text-sm font-medium bg-white hover:border-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors cursor-pointer"
                >
                  <option value="strategy">Strategy</option>
                  <option value="review">Review</option>
                  <option value="submission">Submission</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Funding Program</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={programData?.program_name || ''}
                    readOnly
                    placeholder="No program selected"
                    className="flex-1 px-4 py-2.5 border-2 border-gray-300 rounded-lg text-sm bg-gray-50 font-medium"
                    title={programData ? "Program selected from recommendation flow (click 'Clear program' to remove)" : "No program selected - click 'Find Program' to search"}
                  />
                  <button
                    onClick={() => setShowProgramFinderModal(true)}
                    className="px-4 py-2.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap shadow-md hover:shadow-lg"
                    title="Find or generate a funding program"
                  >
                    {programData ? 'Change' : 'Find Program'}
                  </button>
                </div>
                {programData && (
                  <button
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        localStorage.removeItem('selectedProgram');
                      }
                      setProgramData(null);
                      router.push({ pathname: '/editor', query: { product } });
                    }}
                    className="mt-1 text-xs text-blue-600 hover:text-blue-700"
                  >
                    Clear program
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ========= SECTION NAVIGATION ========= */}
      <nav className="sticky top-[160px] z-40 bg-gradient-to-r from-white to-gray-50 border-b-4 border-blue-500 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          {/* Section Tabs - More Prominent */}
          <div className="flex items-center gap-3 overflow-x-auto pb-3 mb-3 border-b-2 border-gray-200">
            <button
              onClick={() => setActiveSection(Math.max(0, activeSection - 1))}
              disabled={activeSection === 0}
              className="px-4 py-2 text-gray-700 hover:bg-blue-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all font-semibold border-2 border-gray-300 hover:border-blue-400"
              title="Previous Section"
            >
              ← Prev
            </button>
            {sections.map((section, index) => {
              const progress = calculateSectionProgress(section);
              const isComplete = progress.completionPercentage === 100;
              const isActive = index === activeSection;
              
              // Color coding: Green (complete), Blue (active/pulsing), Grey (not done)
              let statusColor = 'bg-gray-200 text-gray-600 border-gray-300'; // Not started/not complete
              if (isComplete && !isActive) {
                statusColor = 'bg-green-500 text-white border-green-600';
              }
              
              return (
                <button
                  key={section.key}
                  onClick={() => setActiveSection(index)}
                  className={`px-4 py-2.5 text-sm font-semibold rounded-lg transition-all whitespace-nowrap border-2 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg border-blue-700 transform scale-105 animate-pulse'
                      : `${statusColor} hover:shadow-md hover:border-blue-300`
                  }`}
                  title={isComplete ? `${section.title} - Complete` : `${section.title} - ${progress.completionPercentage}% complete`}
                >
                  {isComplete && !isActive && <span className="mr-2 text-base">✓</span>}
                  <span className="font-bold">{String(index + 1).padStart(2, '0')}</span>
                  <span className="ml-2">{section.title}</span>
                </button>
              );
            })}
            <button
              onClick={() => setActiveSection(Math.min(sections.length - 1, activeSection + 1))}
              disabled={activeSection === sections.length - 1}
              className="px-4 py-2 text-gray-700 hover:bg-blue-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all font-semibold border-2 border-gray-300 hover:border-blue-400"
              title="Next Section"
            >
              Next →
            </button>
          </div>
        </div>
      </nav>

      {/* ========= MAIN EDITOR AREA ========= */}
      <main className="flex-1 overflow-y-auto bg-gray-50">
        {currentSection && (
          <div className="max-w-[1200px] mx-auto px-4 py-8">
            {/* ========= UNIFIED EDITOR BOX ========= */}
            <div className="bg-white rounded-xl shadow-xl border-2 border-gray-300 p-8 mb-6">
              {/* Section Navigation (Top of Box) */}
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={() => setActiveSection(Math.max(0, activeSection - 1))}
                  disabled={activeSection === 0}
                  className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  ← Prev
                </button>
                <h2 className="text-xl font-semibold text-gray-900">{currentSection.title}</h2>
                <button
                  onClick={() => setActiveSection(Math.min(sections.length - 1, activeSection + 1))}
                  disabled={activeSection === sections.length - 1}
                  className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next →
                </button>
              </div>

              {/* Cross-Section References */}
              {crossSectionRefs.length > 0 && (
                <div className="mb-4 p-3 bg-purple-50 border-2 border-purple-200 rounded-lg">
                  <h4 className="text-sm font-semibold text-purple-900 mb-2 flex items-center gap-2">
                    <span>🔗</span>
                    <span>Referenced in Other Sections</span>
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {crossSectionRefs.map((ref) => (
                      <button
                        key={ref.index}
                        onClick={() => setActiveSection(ref.index)}
                        className="px-3 py-1 text-xs font-medium bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                      >
                        {ref.section.title} ({ref.mentions} mention{ref.mentions > 1 ? 's' : ''})
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Questions Navigation */}
              {sectionTemplate?.prompts && sectionTemplate.prompts.length > 0 && (
                <div className="mb-6">
                  <div className="bg-white border-2 border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold text-gray-900">Questions</h3>
                      <button
                        onClick={() => setShowQuestions(!showQuestions)}
                        className="text-xs text-gray-600 hover:text-gray-900 transition-colors"
                      >
                        {showQuestions ? 'Hide' : 'Show'}
                      </button>
                    </div>
                    
                    {showQuestions && (
                      <>
                        {/* Question Navigation Tabs */}
                        {sectionTemplate.prompts.length > 1 && (
                          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                            {sectionTemplate.prompts.map((_, idx) => (
                              <button
                                key={idx}
                                onClick={() => setActiveQuestion(idx)}
                                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap border ${
                                  activeQuestion === idx
                                    ? 'bg-blue-600 text-white border-blue-700 shadow-md'
                                    : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                                }`}
                              >
                                Q{idx + 1}
                              </button>
                            ))}
                </div>
              )}

                        {/* Current Question Display */}
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                              {activeQuestion + 1}
                            </span>
                            <p className="text-sm text-gray-800 leading-relaxed">
                              {sectionTemplate.prompts[activeQuestion]}
                            </p>
                          </div>
                        </div>
                        
                        {/* Navigation Arrows for Questions */}
                        {sectionTemplate.prompts.length > 1 && (
                          <div className="flex items-center justify-between mt-4">
                  <button
                              onClick={() => setActiveQuestion(Math.max(0, activeQuestion - 1))}
                              disabled={activeQuestion === 0}
                              className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                            >
                              ← Previous
                            </button>
                            <span className="text-xs text-gray-500">
                              {activeQuestion + 1} of {sectionTemplate.prompts.length}
                            </span>
                            <button
                              onClick={() => setActiveQuestion(Math.min(sectionTemplate.prompts.length - 1, activeQuestion + 1))}
                              disabled={activeQuestion === sectionTemplate.prompts.length - 1}
                              className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                            >
                              Next →
                  </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Main Editor (Answer Area) */}
              <div className="mb-6">
                <SimpleTextEditor
                  content={currentSection.content || ''}
                  onChange={(content) => handleSectionChange(currentSection.key, content)}
                  placeholder={`Write your answer here...`}
                />
              </div>

              {/* Action Bar (Bottom) */}
              <div className="flex gap-2 mb-6">
                <button
                  onClick={handleAIGenerate}
                  className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  ✨ Generate with AI
                </button>
                <button
                  onClick={() => setActiveSection(Math.min(sections.length - 1, activeSection + 1))}
                  disabled={activeSection === sections.length - 1}
                  className="px-4 py-2 text-sm font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ⏭️ Next Section
                </button>
              </div>

              {/* Quick Actions - Simplified */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleAIGenerate}
                    className="px-3 py-1.5 text-sm font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    ✨ Generate with AI
                  </button>
                  <button
                    onClick={() => {
                      alert('Image upload coming soon');
                    }}
                    className="px-3 py-1.5 text-sm font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    📷 Add Image
                  </button>
                </div>
              </div>
            </div>

            {/* Tables & Charts Section - INTEGRATED INTO CONTENT FLOW */}
            {(() => {
              const currentTemplate = sectionTemplates.find(t => t.id === currentSection.key);
              if (!currentTemplate) {
                return null; // Don't show if no template
              }
              
              const category = currentTemplate.category?.toLowerCase() || '';
              const needsTables = category === 'financial' || category === 'risk' || category === 'project';
              const optionalTables = category === 'market' || category === 'team';
              const hasTables = currentSection.tables && Object.keys(currentSection.tables).length > 0;
              
              // Show existing tables/charts inline if they exist
              if (hasTables) {
              return (
                  <div className="mt-6 bg-white border-2 border-blue-300 rounded-xl shadow-lg p-6">
                    <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-gray-200">
                      <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <span className="text-2xl">📊</span>
                        <span>Tables & Charts</span>
                      </h3>
                    <button
                      onClick={() => setShowInlineTableCreator(!showInlineTableCreator)}
                        className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-md hover:shadow-lg"
                      >
                        ➕ Add Another Table
                    </button>
                  </div>

                    {/* Render existing tables and charts */}
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
                        console.log('Image insert:', imageUrl, caption, description);
                      }}
                    />
                    
                    {/* Inline Table Creator */}
                    {showInlineTableCreator && currentTemplate && (
                      <div className="mt-4 pt-4 border-t-2 border-gray-200">
                        <InlineTableCreator
                          onCreate={(tableKey, table) => {
                      const updated = [...sections];
                      const section = updated[activeSection];
                            if (!section.tables) section.tables = {};
                            section.tables[tableKey] = table;
                            
                            if (!section.chartTypes) section.chartTypes = {};
                            section.chartTypes[tableKey] = 'bar';
                            
                        setSections(updated);
                            setShowInlineTableCreator(false);
                        
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
                          onCancel={() => setShowInlineTableCreator(false)}
                          sectionTemplate={currentTemplate}
                          existingTableKeys={Object.keys(currentSection.tables || {})}
                        />
                      </div>
                    )}
                  </div>
                );
              }
              
              // Show add table section if no tables yet
              
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
                <div className="bg-white border-2 border-blue-300 rounded-xl shadow-lg p-6">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-gray-200">
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      <span className="text-2xl">📊</span>
                      <span>Tables & Charts</span>
                    </h3>
                    {optionalTables && !needsTables && (
                      <span className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded">Optional</span>
                    )}
                    {needsTables && (
                      <span className="px-2 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded">Recommended</span>
                    )}
                  </div>
                  
                  {/* Helpful Message */}
                  <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-lg">
                    <p className="text-sm font-medium text-gray-800">
                      💡 <strong>How it works:</strong> {getHelpfulMessage()}
                    </p>
                    <p className="text-xs text-gray-600 mt-2">
                      Charts are automatically generated from your table data. Create a table first, then customize the chart type.
                    </p>
                  </div>
                  
                  {/* Add Content Buttons - Prominent */}
                  <div className="mb-4 flex flex-wrap gap-3">
                    <button
                      onClick={() => setShowInlineTableCreator(!showInlineTableCreator)}
                      className="px-6 py-3 text-base font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
                    >
                      <span className="text-xl">➕</span>
                      <span>Add Table</span>
                    </button>
                    <button
                      onClick={() => {
                        if (!hasTables) {
                          alert('Create a table first - charts visualize table data. Click "Add Table" to get started.');
                        } else {
                          alert('Charts are automatically created from tables. Edit your table to update the chart. You can change chart types (bar, line, pie) in the chart area below.');
                        }
                      }}
                      className="px-6 py-3 text-base font-semibold bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
                      title="Charts are auto-generated from tables"
                    >
                      <span className="text-xl">📈</span>
                      <span>View Charts {hasTables ? '(Auto)' : '(Create Table First)'}</span>
                    </button>
                    <button
                      onClick={() => {
                        alert('Image upload coming soon');
                      }}
                      className="px-6 py-3 text-base font-semibold bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
                    >
                      <span className="text-xl">📷</span>
                      <span>Add Image</span>
                    </button>
                  </div>

                  {/* Inline Table Creator */}
                  {showInlineTableCreator && currentTemplate && (
                    <InlineTableCreator
                      onCreate={(tableKey, table) => {
                      const updated = [...sections];
                      const section = updated[activeSection];
                        if (!section.tables) section.tables = {};
                        section.tables[tableKey] = table;
                        
                        // Auto-generate chart
                        if (!section.chartTypes) section.chartTypes = {};
                        section.chartTypes[tableKey] = 'bar';
                        
                      setSections(updated);
                        setShowInlineTableCreator(false);
                      
                        // Save
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
                      onCancel={() => setShowInlineTableCreator(false)}
                      sectionTemplate={currentTemplate}
                      existingTableKeys={Object.keys(currentSection.tables || {})}
                    />
                  )}
                  
                  {/* No Tables Message */}
                  {!hasTables && !showInlineTableCreator && (
                    <div className="text-center py-8 text-gray-500 text-sm border-2 border-dashed border-gray-300 rounded-lg">
                      <p className="mb-2">No tables created yet{optionalTables && !needsTables ? ' (optional)' : ''}</p>
                      <p className="text-xs text-gray-400">Click "Add Table" above to get started</p>
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
        programId={programData ? 'selected' : undefined}
        programData={programData || undefined}
        onGenerateMissingContent={async (sectionKey) => {
          // Find the section index
          const sectionIndex = sections.findIndex(s => s.key === sectionKey);
          if (sectionIndex >= 0) {
            // Navigate to section
            setActiveSection(sectionIndex);
            // Trigger AI generation for the section
            const section = sections[sectionIndex];
            if (section && plan) {
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

                // Use program data from localStorage (set by reco) or default
                const storedProgram = typeof window !== 'undefined' 
                  ? JSON.parse(localStorage.getItem('selectedProgram') || 'null')
                  : null;

                const programForAI = storedProgram ? {
                  id: storedProgram.id || 'default',
                  name: storedProgram.name || 'Selected Program',
                  type: storedProgram.type || 'grant',
                  amount: '',
                  eligibility: [],
                  requirements: [],
                  score: 100,
                  reasons: [],
                  risks: []
                } : {
                  id: 'default',
                  name: 'Default Template',
                  type: 'grant',
                  amount: '',
                  eligibility: [],
                  requirements: [],
                  score: 100,
                  reasons: [],
                  risks: []
                };

                const fundingType = storedProgram?.type || 'grants';
                const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
                const templateSections = await getSections(fundingType, product, undefined, baseUrl);
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

      {/* Program Finder Modal - Generate programs on-demand */}
      {showProgramFinderModal && (
        <ProgramFinderModal
          isOpen={showProgramFinderModal}
          onClose={() => setShowProgramFinderModal(false)}
          onProgramSelect={(program) => {
            // Store program in localStorage (same as reco flow)
            if (typeof window !== 'undefined') {
              const programData = {
                id: program.id,
                name: program.name || program.id,
                categorized_requirements: program.categorized_requirements || {},
                type: program.type || 'grant',
                url: program.url || program.source_url,
                selectedAt: new Date().toISOString(),
                metadata: {
                  funding_amount_min: program.metadata?.funding_amount_min,
                  funding_amount_max: program.metadata?.funding_amount_max,
                  currency: program.metadata?.currency || 'EUR',
                }
              };
              localStorage.setItem('selectedProgram', JSON.stringify(programData));
            }
            
            // Reload sections to pick up new program
            loadSections();
            setShowProgramFinderModal(false);
          }}
        />
      )}
    </div>
  );
}

// ========= PROGRAM FINDER MODAL COMPONENT =========
function ProgramFinderModal({
  isOpen,
  onClose,
  onProgramSelect
}: {
  isOpen: boolean;
  onClose: () => void;
  onProgramSelect: (program: any) => void;
}) {
  const router = useRouter();
  const [description, setDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [programs, setPrograms] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!description.trim()) {
      setError('Please describe your project');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setPrograms([]);

    try {
      // Use the same LLM API as reco to generate programs
      const response = await fetch('/api/programs/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers: {
            // Pass description - API will include it in the LLM prompt
            project_description: description,
          },
          max_results: 5,
          extract_all: true, // Generate programs even without full answers
          use_seeds: false,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate programs');
      }

      const data = await response.json();
      const generatedPrograms = data.programs || [];
      
      if (generatedPrograms.length === 0) {
        setError('No programs found. Try being more specific about your project.');
        return;
      }

      setPrograms(generatedPrograms);
    } catch (err: any) {
      setError(err.message || 'Failed to generate programs. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div 
        className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Find Funding Program</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Describe your project
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Example: We're an AI startup in Vienna developing healthcare software. We need €150k to expand our team and complete our MVP. Looking for grants that allow partnerships with universities."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm min-h-[120px]"
              disabled={isGenerating}
            />
            <p className="text-xs text-gray-500 mt-1">
              Include: company stage, location, industry, funding amount, special requirements
            </p>
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating || !description.trim()}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {isGenerating ? 'Generating programs...' : '🚀 Generate Programs'}
          </button>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
              {error}
            </div>
          )}

          {programs.length > 0 && (
            <div className="space-y-3 mt-4">
              <h3 className="font-semibold text-gray-900">Found {programs.length} program{programs.length !== 1 ? 's' : ''}</h3>
              {programs.map((program, index) => (
                <div
                  key={program.id || index}
                  className="p-4 border border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-md transition-all cursor-pointer"
                  onClick={() => onProgramSelect(program)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">
                        {program.name || program.metadata?.description || `Program ${index + 1}`}
                      </h4>
                      {program.metadata?.description && (
                        <p className="text-sm text-gray-600 mb-2">{program.metadata.description}</p>
                      )}
                      {program.metadata?.funding_amount_max && (
                        <p className="text-xs text-gray-500">
                          {program.metadata.currency || 'EUR'} {program.metadata.funding_amount_min?.toLocaleString() || '0'}
                          {program.metadata.funding_amount_max && ` - ${program.metadata.funding_amount_max.toLocaleString()}`}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onProgramSelect(program);
                      }}
                      className="ml-4 px-3 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Select
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="pt-4 border-t border-gray-200">
            <button
              onClick={() => router.push('/reco')}
              className="w-full px-4 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
            >
              Or go to full recommendation flow →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}



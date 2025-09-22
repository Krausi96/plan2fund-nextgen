// Enhanced Program-Aware Editor with Templates and Guidance
import React, { useState, useEffect, useCallback } from 'react';
import AIChat from "@/components/plan/AIChat";
import analytics from "@/lib/analytics";

export interface PlanDocument {
  id: string;
  userId: string;
  title: string;
  type: 'STRATEGY' | 'APPLICATION' | 'BUSINESS_PLAN';
  programId?: string;
  sections: Array<{
    id: string;
    title: string;
    content: string;
    completed: boolean;
    required: boolean;
    programSpecific: boolean;
  }>;
  metadata: {
    wordCount: number;
    completionPercentage: number;
    lastEditedAt: string;
    version: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface ProgramAwareEditorProps {
  userAnswers?: Record<string, any>;
  selectedProgram?: any;
  onSave?: (plan: PlanDocument) => void;
  onExport?: (plan: PlanDocument) => void;
}

interface ProgramTemplate {
  id: string;
  name: string;
  description: string;
  sections: Array<{
    id: string;
    title: string;
    content: string;
    required: boolean;
    programSpecific: boolean;
    guidance?: string;
    examples?: string[];
  }>;
  programId?: string;
  segment?: string;
}

const PROGRAM_TEMPLATES: Record<string, ProgramTemplate> = {
  GRANT_STRATEGY: {
    id: 'GRANT_STRATEGY',
    name: 'Grant Application Strategy',
    description: 'Template for Austrian/EU grant applications',
    programId: 'grant',
    sections: [
      {
        id: 'executive_summary',
        title: 'Executive Summary',
        content: 'Brief overview of your project and funding request...',
        required: true,
        programSpecific: false,
        guidance: 'Keep this concise but compelling. Highlight innovation and impact.',
        examples: ['Project overview', 'Funding amount requested', 'Expected outcomes']
      },
      {
        id: 'project_description',
        title: 'Project Description',
        content: 'Detailed description of your project...',
        required: true,
        programSpecific: true,
        guidance: 'Focus on innovation, feasibility, and alignment with program goals.',
        examples: ['Technical approach', 'Innovation aspects', 'Project timeline']
      },
      {
        id: 'market_analysis',
        title: 'Market Analysis',
        content: 'Analysis of target market and competition...',
        required: true,
        programSpecific: false,
        guidance: 'Demonstrate market need and competitive advantage.',
        examples: ['Target market size', 'Competitor analysis', 'Market entry strategy']
      },
      {
        id: 'financial_plan',
        title: 'Financial Planning',
        content: 'Detailed financial projections and budget...',
        required: true,
        programSpecific: true,
        guidance: 'Include detailed budget breakdown and funding requirements.',
        examples: ['Project budget', 'Funding breakdown', 'Financial projections']
      },
      {
        id: 'team_qualifications',
        title: 'Team & Qualifications',
        content: 'Team composition and relevant experience...',
        required: true,
        programSpecific: false,
        guidance: 'Highlight team expertise relevant to the project.',
        examples: ['Team members', 'Relevant experience', 'Key qualifications']
      }
    ]
  },
  LOAN_APPLICATION: {
    id: 'LOAN_APPLICATION',
    name: 'Business Loan Application',
    description: 'Template for business loan applications',
    programId: 'loan',
    sections: [
      {
        id: 'business_overview',
        title: 'Business Overview',
        content: 'Description of your business and loan purpose...',
        required: true,
        programSpecific: false,
        guidance: 'Clearly explain your business and why you need the loan.',
        examples: ['Business description', 'Loan purpose', 'Amount requested']
      },
      {
        id: 'financial_statements',
        title: 'Financial Statements',
        content: 'Historical financial performance...',
        required: true,
        programSpecific: true,
        guidance: 'Include audited financial statements and projections.',
        examples: ['Income statements', 'Balance sheets', 'Cash flow projections']
      },
      {
        id: 'collateral_guarantees',
        title: 'Collateral & Guarantees',
        content: 'Description of collateral and guarantees...',
        required: true,
        programSpecific: true,
        guidance: 'Detail all available collateral and guarantee arrangements.',
        examples: ['Real estate', 'Equipment', 'Personal guarantees']
      },
      {
        id: 'repayment_plan',
        title: 'Repayment Plan',
        content: 'Detailed repayment schedule and capacity...',
        required: true,
        programSpecific: true,
        guidance: 'Demonstrate ability to repay the loan with realistic projections.',
        examples: ['Repayment schedule', 'Cash flow analysis', 'Risk mitigation']
      }
    ]
  },
  VISA_BUSINESS_PLAN: {
    id: 'VISA_BUSINESS_PLAN',
    name: 'Visa Business Plan',
    description: 'Template for Austrian visa business plans',
    programId: 'visa',
    sections: [
      {
        id: 'personal_background',
        title: 'Personal Background',
        content: 'Your background and qualifications...',
        required: true,
        programSpecific: false,
        guidance: 'Highlight relevant experience and qualifications.',
        examples: ['Education', 'Work experience', 'Language skills']
      },
      {
        id: 'business_concept',
        title: 'Business Concept',
        content: 'Detailed business concept and market opportunity...',
        required: true,
        programSpecific: true,
        guidance: 'Demonstrate viable business concept with market potential.',
        examples: ['Business idea', 'Market opportunity', 'Competitive advantage']
      },
      {
        id: 'austria_integration',
        title: 'Austria Integration Plan',
        content: 'How you plan to integrate into Austrian economy...',
        required: true,
        programSpecific: true,
        guidance: 'Show how your business will benefit Austria.',
        examples: ['Job creation', 'Economic contribution', 'Cultural integration']
      },
      {
        id: 'financial_viability',
        title: 'Financial Viability',
        content: 'Financial projections and funding plan...',
        required: true,
        programSpecific: true,
        guidance: 'Demonstrate financial viability and funding sources.',
        examples: ['Startup capital', 'Revenue projections', 'Funding sources']
      }
    ]
  }
};

// Helper function to generate pre-filled content based on user answers
function generatePreFilledContent(userAnswers: Record<string, any>, program?: any): string {
  let content = "";
  
  // Add program information
  if (program) {
    content += `# ${program.name}\n\n`;
    content += `**Program Type:** ${program.type}\n`;
    content += `**Region:** ${program.region || 'Austria'}\n`;
    if (program.maxAmount) {
      content += `**Maximum Amount:** €${program.maxAmount.toLocaleString()}\n`;
    }
    content += `\n---\n\n`;
  }
  
  // Add user answers as pre-filled information
  content += `## Your Business Information\n\n`;
  
  if (userAnswers.q1_country) {
    const countryMap: Record<string, string> = {
      'AT': 'Austria only',
      'EU': 'EU (including Austria)',
      'NON_EU': 'Outside EU'
    };
    content += `**Location:** ${countryMap[userAnswers.q1_country] || userAnswers.q1_country}\n`;
  }
  
  if (userAnswers.q2_entity_stage) {
    const stageMap: Record<string, string> = {
      'PRE_COMPANY': 'Just an idea or team forming',
      'INC_LT_6M': 'Recently started (less than 6 months)',
      'INC_6_36M': 'Early stage (6 months to 3 years)',
      'INC_GT_36M': 'Established business (over 3 years)',
      'RESEARCH_ORG': 'University or research institute',
      'NONPROFIT': 'Non-profit organization'
    };
    content += `**Business Stage:** ${stageMap[userAnswers.q2_entity_stage] || userAnswers.q2_entity_stage}\n`;
  }
  
  if (userAnswers.q3_company_size) {
    const sizeMap: Record<string, string> = {
      'MICRO_0_9': 'Just me or small team (1-9 people)',
      'SMALL_10_49': 'Small company (10-49 people)',
      'MEDIUM_50_249': 'Medium company (50-249 people)',
      'LARGE_250_PLUS': 'Large company (250+ people)'
    };
    content += `**Team Size:** ${sizeMap[userAnswers.q3_company_size] || userAnswers.q3_company_size}\n`;
  }
  
  if (userAnswers.q4_theme) {
    const themeMap: Record<string, string> = {
      'INNOVATION_DIGITAL': 'Innovation, Technology, or Digital Solutions',
      'SUSTAINABILITY': 'Sustainability, Climate, or Environmental Solutions',
      'HEALTH_LIFE_SCIENCE': 'Health, Life Sciences, or Medical Technology',
      'SPACE_DOWNSTREAM': 'Space Technology or Earth Observation',
      'INDUSTRY_MANUFACTURING': 'Industry or Manufacturing',
      'OTHER': 'Other'
    };
    const themes = Array.isArray(userAnswers.q4_theme) ? userAnswers.q4_theme : [userAnswers.q4_theme];
    content += `**Business Focus:** ${themes.map(t => themeMap[t] || t).join(', ')}\n`;
  }
  
  content += `\n---\n\n`;
  content += `## Your Business Plan\n\n`;
  content += `*Start writing your business plan here. The information above has been pre-filled based on your answers to help you get started.*\n\n`;
  
  return content;
}

export default function ProgramAwareEditor({ 
  userAnswers, 
  selectedProgram, 
  onSave, 
  onExport 
}: ProgramAwareEditorProps) {
  const [plan, setPlan] = useState<PlanDocument | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<ProgramTemplate | null>(null);
  const [activeSection, setActiveSection] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [showGuidance, setShowGuidance] = useState(true);
  const [showAIChat, setShowAIChat] = useState(false);
  const [persona, setPersona] = useState<"newbie" | "expert">("newbie");

  useEffect(() => {
    initializeEditor();
  }, [userAnswers, selectedProgram]);

  const initializeEditor = () => {
    // Select appropriate template based on user profile and selected program
    let templateId = 'GRANT_STRATEGY'; // Default
    
    if (selectedProgram?.type === 'loan') {
      templateId = 'LOAN_APPLICATION';
    } else if (selectedProgram?.type === 'visa') {
      templateId = 'VISA_BUSINESS_PLAN';
    }

    const template = PROGRAM_TEMPLATES[templateId];
    setSelectedTemplate(template);

    // Create initial plan document
    const initialPlan: PlanDocument = {
      id: `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: 'user_' + Date.now(),
      title: `${template.name} - ${new Date().toLocaleDateString()}`,
      type: 'STRATEGY',
      programId: selectedProgram?.id,
      sections: template.sections.map(section => ({
        id: section.id,
        title: section.title,
        content: section.content,
        completed: false,
        required: section.required,
        programSpecific: section.programSpecific
      })),
      metadata: {
        wordCount: 0,
        completionPercentage: 0,
        lastEditedAt: new Date().toISOString(),
        version: 1
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Pre-fill with user answers if available
    if (userAnswers) {
      const preFilledContent = generatePreFilledContent(userAnswers, selectedProgram);
      if (preFilledContent) {
        initialPlan.sections[0].content = preFilledContent;
        initialPlan.sections[0].completed = true;
      }
    }

    setPlan(initialPlan);
    setActiveSection(template.sections[0].id);

    // Track editor start
    analytics.trackEditorStart('STRATEGY', selectedProgram?.id);
  };

  const updateSection = useCallback((sectionId: string, content: string) => {
    if (!plan) return;

    const updatedSections = plan.sections.map(section =>
      section.id === sectionId
        ? { ...section, content, completed: content.trim().length > 0 }
        : section
    );

    const wordCount = updatedSections.reduce((total, section) => 
      total + section.content.split(/\s+/).filter(word => word.length > 0).length, 0
    );

    const completionPercentage = Math.round(
      (updatedSections.filter(s => s.completed).length / updatedSections.length) * 100
    );

    const updatedPlan: PlanDocument = {
      ...plan,
      sections: updatedSections,
      metadata: {
        ...plan.metadata,
        wordCount,
        completionPercentage,
        lastEditedAt: new Date().toISOString()
      },
      updatedAt: new Date().toISOString()
    };

    setPlan(updatedPlan);

    // Track section edit
    const section = updatedSections.find(s => s.id === sectionId);
    if (section) {
      analytics.trackEditorSectionEdit(sectionId, section.title, wordCount);
    }
  }, [plan]);

  const handleSave = async () => {
    if (!plan) return;

    setIsLoading(true);
    try {
      // Save to backend
      const response = await fetch('/api/plan/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(plan)
      });

      if (response.ok) {
        onSave?.(plan);
        analytics.trackEditorComplete(plan.id, plan.metadata.completionPercentage, plan.metadata.wordCount);
      }
    } catch (error) {
      console.error('Error saving plan:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    if (!plan) return;
    onExport?.(plan);
  };

  const getCurrentSection = () => {
    if (!selectedTemplate || !activeSection) return null;
    return selectedTemplate.sections.find(s => s.id === activeSection);
  };

  const getSectionGuidance = () => {
    const section = getCurrentSection();
    return section?.guidance || '';
  };

  const getSectionExamples = () => {
    const section = getCurrentSection();
    return section?.examples || [];
  };

  if (!plan || !selectedTemplate) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading editor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">{plan.title}</h2>
          <p className="text-sm text-gray-600 mt-1">{selectedTemplate.description}</p>
          
          {/* Progress */}
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progress</span>
              <span>{plan.metadata.completionPercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${plan.metadata.completionPercentage}%` }}
              />
            </div>
          </div>

          {/* Stats */}
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Words:</span>
              <span className="ml-2 font-medium">{plan.metadata.wordCount}</span>
            </div>
            <div>
              <span className="text-gray-600">Sections:</span>
              <span className="ml-2 font-medium">
                {plan.sections.filter(s => s.completed).length}/{plan.sections.length}
              </span>
            </div>
          </div>

          {/* Persona Toggle */}
          <div className="mt-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Mode:</span>
              <button
                onClick={() => setPersona(persona === "newbie" ? "expert" : "newbie")}
                className={`px-3 py-1 text-sm rounded ${
                  persona === "newbie" 
                    ? "bg-blue-100 text-blue-800" 
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {persona === "newbie" ? "Newbie" : "Expert"}
              </button>
            </div>
          </div>
        </div>

        {/* Sections List */}
        <div className="flex-1 overflow-y-auto p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Sections</h3>
          <div className="space-y-2">
            {selectedTemplate.sections.map((section) => {
              const planSection = plan.sections.find(s => s.id === section.id);
              const isActive = activeSection === section.id;
              const isCompleted = planSection?.completed || false;
              const isRequired = section.required;

              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    isActive
                      ? 'border-blue-500 bg-blue-50 text-blue-900'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${
                        isCompleted ? 'bg-green-500' : isRequired ? 'bg-red-500' : 'bg-gray-300'
                      }`} />
                      <span className="font-medium text-sm">{section.title}</span>
                    </div>
                    {isCompleted && (
                      <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  {section.programSpecific && (
                    <div className="mt-1">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                        Program-specific
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-gray-200 space-y-3">
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Saving...' : 'Save Plan'}
          </button>
          <button
            onClick={handleExport}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700"
          >
            Export PDF
          </button>
        </div>
      </div>

      {/* Main Editor */}
      <div className="flex-1 flex flex-col">
        {/* Editor Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              {getCurrentSection()?.title}
            </h3>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowGuidance(!showGuidance)}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                {showGuidance ? 'Hide' : 'Show'} Guidance
              </button>
              <button
                onClick={() => setShowAIChat(!showAIChat)}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                {showAIChat ? 'Hide' : 'Show'} AI Assistant
              </button>
            </div>
          </div>
        </div>

        {/* Editor Content */}
        <div className="flex-1 flex">
          {/* Text Editor */}
          <div className="flex-1 p-6">
            <textarea
              value={plan.sections.find(s => s.id === activeSection)?.content || ''}
              onChange={(e) => updateSection(activeSection, e.target.value)}
              placeholder="Start writing your business plan section..."
              className="w-full h-full resize-none border-none outline-none text-gray-900 leading-relaxed"
              style={{ minHeight: '400px' }}
            />
          </div>

          {/* Guidance Panel */}
          {showGuidance && (
            <div className="w-80 bg-gray-50 border-l border-gray-200 p-4 overflow-y-auto">
              <h4 className="font-medium text-gray-900 mb-3">Guidance</h4>
              
              {getSectionGuidance() && (
                <div className="mb-4">
                  <p className="text-sm text-gray-700">{getSectionGuidance()}</p>
                </div>
              )}

              {getSectionExamples().length > 0 && (
                <div>
                  <h5 className="font-medium text-gray-900 mb-2">Examples to include:</h5>
                  <ul className="space-y-1">
                    {getSectionExamples().map((example, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-start">
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 mr-2 flex-shrink-0" />
                        {example}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Program-specific tips */}
              {selectedProgram && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <h5 className="font-medium text-blue-900 mb-2">Program Tips</h5>
                  <p className="text-sm text-blue-800">
                    This section is important for {selectedProgram.name}. 
                    Make sure to highlight how your project aligns with their criteria.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* AI Assistant */}
          {showAIChat && (
            <div className="w-80 bg-gray-50 border-l border-gray-200 p-4">
              <AIChat
                onInsertContent={(content) => {
                  const currentContent = plan.sections.find(s => s.id === activeSection)?.content || '';
                  updateSection(activeSection, currentContent + "\n\n" + content);
                }}
                currentSection={getCurrentSection()?.title || "Current Section"}
                persona={persona}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

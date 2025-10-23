// ========= PLAN2FUND — ENHANCED AI CHAT =========
// AI Chat component with plan context and readiness integration
// Enhanced with Phase 3: Dynamic Decision Trees & Program-Specific Templates

import React, { useState, useRef } from 'react';
import { PlanDocument } from '@/types/plan';
import { ProgramProfile } from '@/types/reco';
import { createAIHelper, createEnhancedAIHelper } from '@/lib/aiHelper';
// ProgramTemplate and TemplateSection types removed - using Enhanced Data Pipeline instead

interface EnhancedAIChatProps {
  plan: PlanDocument;
  programProfile: ProgramProfile | null;
  currentSection: string;
  onInsertContent: (content: string, section: string) => void;
  // Phase 3 Enhancements
  decisionTreeAnswers?: Record<string, any>;
  programTemplate?: any; // Using Enhanced Data Pipeline instead
  currentTemplateSection?: any; // Using Enhanced Data Pipeline instead
  aiGuidance?: {
    context: string;
    tone: 'professional' | 'academic' | 'enthusiastic' | 'technical';
    key_points: string[];
    prompts?: Record<string, string>;
  };
}

type ChatMessage = {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  action?: string;
};

export default function EnhancedAIChat({ 
  plan, 
  programProfile, 
  currentSection, 
  onInsertContent,
  // Phase 3 Enhancements
  decisionTreeAnswers,
  programTemplate,
  currentTemplateSection,
  aiGuidance
}: EnhancedAIChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Initialize AI helper with plan context
  // Use enhanced AI helper if Phase 3 features are available
  const aiHelper = (decisionTreeAnswers || programTemplate || currentTemplateSection || aiGuidance) 
    ? createEnhancedAIHelper(
        {
          maxWords: 200,
          sectionScope: currentSection,
          programHints: programProfile?.required || {},
          userAnswers: plan.sections.reduce((acc, section) => {
            acc[section.key] = section.content || '';
            return acc;
          }, {} as Record<string, string>),
          tone: plan.tone || 'neutral',
          language: plan.language || 'en',
          decisionTreeAnswers,
          programTemplate,
          currentSection: currentTemplateSection,
          aiGuidance
        },
        programProfile?.required || {},
        plan.sections.reduce((acc, section) => {
          acc[section.key] = section.content || '';
          return acc;
        }, {} as Record<string, string>),
        plan.tone || 'neutral',
        plan.language || 'en',
        decisionTreeAnswers,
        programTemplate,
        currentTemplateSection,
        aiGuidance
      )
    : createAIHelper({
        maxWords: 200,
        sectionScope: currentSection,
        programHints: programProfile?.required || {},
        userAnswers: plan.sections.reduce((acc, section) => {
          acc[section.key] = section.content || '';
          return acc;
        }, {} as Record<string, string>),
        tone: plan.tone || 'neutral',
        language: plan.language || 'en'
      });

  // Get readiness issues for current section
  const getReadinessIssues = () => {
    if (!plan.readiness) return [];
    return plan.readiness.dimensions
      .filter(d => d.status !== 'aligned')
      .map(d => `${d.key.replace('_', ' ')}: ${d.notes}`);
  };

  // Get program-specific suggestions
  const getProgramSuggestions = () => {
    if (!programProfile) return [];
    const suggestions = [];
    
    if (programProfile.required?.sections) {
      suggestions.push(`Required sections: ${programProfile.required.sections.map(s => s.key).join(', ')}`);
    }
    
    if (programProfile.required?.tables) {
      suggestions.push(`Required tables: ${programProfile.required.tables.join(', ')}`);
    }
    
    // Add AI guidance suggestions if available
    if (aiGuidance?.key_points) {
      suggestions.push(`Key points: ${aiGuidance.key_points.join(', ')}`);
    }
    
    if (aiGuidance?.context) {
      suggestions.push(`Context: ${aiGuidance.context}`);
    }
    
    return suggestions;
  };

  // Get section-specific guidance
  const getSectionGuidance = (sectionKey: string): string => {
    const guidanceMap: Record<string, string> = {
      'execSummary': 'Write a compelling executive summary that highlights your business opportunity, key metrics, and funding requirements. Keep it concise but comprehensive.',
      'problemSolution': 'Clearly define the problem you\'re solving and how your solution addresses it. Include market validation and customer feedback.',
      'productOverview': 'Describe your product or service in detail. Include features, benefits, and how it works.',
      'companyTeam': 'Introduce your team, their backgrounds, and why they\'re qualified to execute this business plan.',
      'marketCompetition': 'Analyze your target market size, growth potential, and competitive landscape.',
      'gtmStrategy': 'Explain how you\'ll reach customers, pricing strategy, and sales approach.',
      'financials': 'Provide detailed financial projections including revenue, costs, and cash flow.',
      'risksMitigation': 'Identify key risks and how you\'ll mitigate them.',
      'bmcCustomerSegments': 'Define your target customer segments and their characteristics.',
      'bmcValueProposition': 'Explain the unique value you provide to customers.',
      'bmcChannels': 'Describe how you\'ll reach and serve customers.',
      'bmcCustomerRelationships': 'Explain how you\'ll build and maintain customer relationships.',
      'bmcRevenueStreams': 'Detail how you\'ll generate revenue.',
      'bmcKeyResources': 'List the key resources needed to deliver your value proposition.',
      'bmcKeyActivities': 'Describe the most important activities for your business model.',
      'bmcKeyPartnerships': 'Identify key partners and suppliers.',
      'bmcCostStructure': 'Outline your cost structure and key cost drivers.',
      'gtmTargetMarket': 'Define your target market and customer segments.',
      'gtmPricing': 'Explain your pricing strategy and rationale.',
      'gtmPromotion': 'Describe your marketing and promotional activities.',
      'gtmDistributionChannels': 'Explain how you\'ll distribute your product or service.',
      'gtmSalesTactics': 'Detail your sales process and tactics.',
      'unitEconomicsSimple': 'Provide simple unit economics showing price, cost, and margin.',
      'milestones': 'List key milestones and timelines for your business.'
    };
    
    return guidanceMap[sectionKey] || `Provide detailed content for the ${sectionKey} section.`;
  };

  // Generate "Make Compliant" action
  const handleMakeCompliant = async () => {
    setIsProcessing(true);
    
    try {
      const readinessIssues = getReadinessIssues();
      const programSuggestions = getProgramSuggestions();
      
      const prompt = `
Make this ${currentSection} section compliant with ${programProfile?.programId || 'the program'} requirements.

Current content: ${plan.sections.find(s => s.key === currentSection)?.content || 'No content yet'}

Readiness issues to address:
${readinessIssues.map(issue => `- ${issue}`).join('\n')}

Program requirements:
${programSuggestions.map(suggestion => `- ${suggestion}`).join('\n')}

Generate compliant content that addresses these issues:
      `;
      
      const mockProgram = {
        id: programProfile?.programId || 'unknown',
        name: programProfile?.programId || 'Unknown Program',
        type: 'grant',
        amount: '€0',
        eligibility: [],
        requirements: [],
        score: 0,
        reasons: [],
        risks: []
      };
      
      const response = await aiHelper.generateSectionContent(
        currentSection,
        prompt,
        mockProgram
      );
      
      const aiMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'ai',
        content: response.content,
        timestamp: new Date(),
        action: 'make_compliant'
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error making compliant:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle user input
  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;
    
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsProcessing(true);
    
    try {
      // Get current section content and context
      const currentSectionContent = plan.sections.find(s => s.key === currentSection)?.content || '';
      const readinessIssues = getReadinessIssues();
      const programSuggestions = getProgramSuggestions();
      
      // Create enhanced context for AI
      const context = {
        currentSection,
        currentContent: currentSectionContent,
        planLanguage: plan.language,
        planTone: plan.tone,
        readinessIssues,
        programSuggestions,
        programRequirements: programProfile?.required || {},
        programId: programProfile?.programId || 'unknown'
      };
      
      // Generate AI response with enhanced context
      const response = await aiHelper.generateSectionContent(
        currentSection,
        `${input}\n\nContext: ${JSON.stringify(context)}`,
        {
          id: programProfile?.programId || 'unknown',
          name: programProfile?.programId || 'Unknown Program',
          type: programProfile?.route || 'grant',
          amount: '€0',
          eligibility: [],
          requirements: programProfile?.required?.sections?.map(s => s.key) || [],
          score: 0,
          reasons: [],
          risks: []
        }
      );
      
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: response.content,
        timestamp: new Date(),
        action: 'insert'
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error generating response:', error);
      
      // Fallback response
      const fallbackMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: `I understand you're asking about "${input}" for the ${currentSection} section. Here's some guidance:

${getSectionGuidance(currentSection)}

Please provide more specific details about what you'd like help with, and I'll provide more targeted assistance.`,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, fallbackMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle content insertion
  const handleInsertContent = (content: string) => {
    onInsertContent(content, currentSection);
  };

  // ========== PHASE 3 ENHANCED METHODS ==========

  // Generate content using program-specific template
  const handleGenerateFromTemplate = async () => {
    if (!programTemplate || !currentTemplateSection) return;
    
    setIsProcessing(true);
    
    try {
      const currentSectionContent = plan.sections.find(s => s.key === currentSection)?.content || '';
      
      const response = await aiHelper.generateSectionContent(
        currentSection,
        currentSectionContent,
        {
          id: programProfile?.programId || 'unknown',
          name: programTemplate.program_name,
          type: programProfile?.route || 'grant',
          amount: '€0',
          eligibility: [],
          requirements: programTemplate?.sections?.map((s: any) => s.id) || [],
          score: 0,
          reasons: [],
          risks: []
        }
      );
      
      const aiMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'ai',
        content: `Generated content using program-specific template:\n\n${response.content}\n\n${response.sectionGuidance?.map(g => `💡 ${g}`).join('\n')}\n\n${response.complianceTips?.map(t => `⚠️ ${t}`).join('\n')}`,
        timestamp: new Date(),
        action: 'insert'
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error generating template content:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Generate content using decision tree answers
  const handleGenerateFromDecisionTree = async () => {
    if (!decisionTreeAnswers) return;
    
    setIsProcessing(true);
    
    try {
      const currentSectionContent = plan.sections.find(s => s.key === currentSection)?.content || '';
      
      const response = await aiHelper.generateSectionContent(
        currentSection,
        currentSectionContent,
        {
          id: programProfile?.programId || 'unknown',
          name: programProfile?.programId || 'Unknown Program',
          type: programProfile?.route || 'grant',
          amount: '€0',
          eligibility: [],
          requirements: programProfile?.required?.sections?.map(s => s.key) || [],
          score: 0,
          reasons: [],
          risks: []
        }
      );
      
      const aiMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'ai',
        content: `Generated personalized content based on your answers:\n\n${response.content}\n\n${response.sectionGuidance?.map(g => `💡 ${g}`).join('\n')}\n\n${response.complianceTips?.map(t => `⚠️ ${t}`).join('\n')}`,
        timestamp: new Date(),
        action: 'insert'
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error generating decision tree content:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Get AI guidance for current section
  const getAIGuidance = (): string[] => {
    if (!aiGuidance) return [];
    
    const guidance: string[] = [];
    
    if (aiGuidance.context) {
      guidance.push(`Context: ${aiGuidance.context}`);
    }
    
    if (aiGuidance.key_points) {
      guidance.push(`Key Points: ${aiGuidance.key_points.join(', ')}`);
    }
    
    if (aiGuidance.prompts && aiGuidance.prompts[currentSection]) {
      guidance.push(`Section Prompt: ${aiGuidance.prompts[currentSection]}`);
    }
    
    return guidance;
  };

  // Get template-specific guidance
  const getTemplateGuidance = (): string[] => {
    if (!currentTemplateSection) return [];
    
    const guidance: string[] = [];
    
    if (currentTemplateSection.description) {
      guidance.push(`Description: ${currentTemplateSection.description}`);
    }
    
    if (currentTemplateSection.ai_prompts) {
      guidance.push(`AI Prompts: ${currentTemplateSection.ai_prompts.join(', ')}`);
    }
    
    if (currentTemplateSection.validation_rules) {
      const rules = Object.entries(currentTemplateSection.validation_rules)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');
      guidance.push(`Validation Rules: ${rules}`);
    }
    
    return guidance;
  };

  // Quick action buttons
  const quickActions = [
    {
      label: 'Make Compliant',
      action: handleMakeCompliant,
      description: 'Fix readiness issues',
      icon: '✅'
    },
    {
      label: 'Improve Content',
      action: () => {
        const prompt = `Improve the content for ${currentSection} section. Make it more compelling and professional.`;
        setInput(prompt);
      },
      description: 'Enhance content quality',
      icon: '⚡'
    },
    {
      label: 'Add Structure',
      action: () => {
        const prompt = `Add proper structure and formatting to the ${currentSection} section with clear headings and bullet points.`;
        setInput(prompt);
      },
      description: 'Add structure and formatting',
      icon: '📋'
    },
    {
      label: 'Expand Content',
      action: () => {
        const prompt = `Expand the ${currentSection} section with more detailed information and examples.`;
        setInput(prompt);
      },
      description: 'Add more details',
      icon: '📈'
    },
    {
      label: 'Fix Readiness',
      action: () => {
        const issues = getReadinessIssues();
        const prompt = `Fix these readiness issues: ${issues.join(', ')}`;
        setInput(prompt);
      },
      description: 'Address readiness issues',
      icon: '🔧'
    },
    {
      label: 'Generate Examples',
      action: () => {
        const prompt = `Generate specific examples and case studies for the ${currentSection} section.`;
        setInput(prompt);
      },
      description: 'Generate examples',
      icon: '💡'
    },
    // Phase 3 Enhanced Actions
    ...(programTemplate && currentTemplateSection ? [{
      label: 'Generate from Template',
      action: handleGenerateFromTemplate,
      description: 'Use program-specific template',
      icon: '📋'
    }] : []),
    ...(decisionTreeAnswers ? [{
      label: 'Generate from Answers',
      action: handleGenerateFromDecisionTree,
      description: 'Use decision tree answers',
      icon: '🌳'
    }] : [])
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900">AI Assistant</h3>
        <button
          onClick={() => setShowSuggestions(!showSuggestions)}
          className="text-xs text-blue-600 hover:text-blue-700"
        >
          {showSuggestions ? 'Hide' : 'Show'} Suggestions
        </button>
      </div>

      {/* Suggestions */}
      {showSuggestions && (
        <div className="mb-3 p-2 bg-blue-50 rounded text-xs">
          <div className="font-medium text-blue-900 mb-1">Suggestions:</div>
          <div className="space-y-1">
            {getReadinessIssues().slice(0, 3).map((issue, index) => (
              <div key={index} className="text-blue-800">• {issue}</div>
            ))}
            {getProgramSuggestions().slice(0, 2).map((suggestion, index) => (
              <div key={index} className="text-blue-800">• {suggestion}</div>
            ))}
            {/* Phase 3 Enhanced Suggestions */}
            {getAIGuidance().map((guidance, index) => (
              <div key={`ai-${index}`} className="text-purple-800">• {guidance}</div>
            ))}
            {getTemplateGuidance().map((guidance, index) => (
              <div key={`template-${index}`} className="text-green-800">• {guidance}</div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mb-3 space-y-1">
        {quickActions.map((action, index) => (
          <button
            key={index}
            onClick={action.action}
            disabled={isProcessing}
            className="w-full text-left px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-50"
          >
            <span className="mr-1">{action.icon}</span>
            {action.label}
            <span className="text-gray-500 ml-1">- {action.description}</span>
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto mb-3 space-y-2">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`p-2 rounded text-xs ${
              message.type === 'user'
                ? 'bg-blue-100 text-blue-900 ml-4'
                : 'bg-gray-100 text-gray-900 mr-4'
            }`}
          >
            <div className="font-medium mb-1">
              {message.type === 'user' ? 'You' : 'AI Assistant'}
              {message.action && ` (${message.action})`}
            </div>
            <div className="whitespace-pre-wrap">{message.content}</div>
            {message.type === 'ai' && (
              <button
                onClick={() => handleInsertContent(message.content)}
                className="mt-1 text-blue-600 hover:text-blue-700 text-xs"
              >
                Insert into {currentSection}
              </button>
            )}
          </div>
        ))}
        
        {isProcessing && (
          <div className="p-2 bg-gray-100 rounded text-xs">
            <div className="animate-pulse">AI is thinking...</div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="space-y-2">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Ask about ${currentSection}...`}
          className="w-full p-2 text-xs border rounded resize-none"
          rows={2}
          disabled={isProcessing}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isProcessing}
          className="w-full bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 disabled:opacity-50"
        >
          {isProcessing ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  );
}

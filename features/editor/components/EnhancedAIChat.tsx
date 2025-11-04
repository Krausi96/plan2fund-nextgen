// ========= PLAN2FUND — ENHANCED AI CHAT =========
// AI Chat component with plan context and readiness integration
// Enhanced with Phase 3: Dynamic Decision Trees & Program-Specific Templates

import React, { useState, useRef } from 'react';
import { PlanDocument } from '@/shared/types/plan';
import { ProgramProfile } from '@/features/reco/types/reco';
import { createAIHelper, createEnhancedAIHelper } from '@/features/editor/engine/aiHelper';
import { useI18n } from '@/shared/contexts/I18nContext';
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
  const { t } = useI18n();
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
  // (Removed unused functions - kept for potential future use)

  // Analyze current content to provide proactive suggestions
  const analyzeContent = () => {
    const currentContent = plan.sections.find(s => s.key === currentSection)?.content || '';
    const contentLength = currentContent.replace(/<[^>]*>/g, '').trim().length;
    const readinessIssues = getReadinessIssues();
    const hasContent = contentLength > 50;
    
    // Determine what user needs most
    if (!hasContent) {
      return {
        primary: {
          label: 'Complete This Section',
          action: async () => {
            const prompt = `Generate complete content for ${currentSection} section based on the prompts and requirements.`;
            setInput(prompt);
            // Auto-send after a brief delay
            setTimeout(() => {
              if (input || prompt) {
                const userMessage: ChatMessage = {
                  id: Date.now().toString(),
                  type: 'user',
                  content: prompt,
                  timestamp: new Date()
                };
                setMessages(prev => [...prev, userMessage]);
                setInput('');
                setIsProcessing(true);
                // The actual send will be handled by the existing handleSend logic
              }
            }, 100);
          },
          description: 'Generate full section content',
          icon: '✨'
        },
        secondary: [
          {
            label: 'Start Writing',
            action: () => {
              const prompt = `Help me write the ${currentSection} section. Where should I start?`;
              setInput(prompt);
            },
            icon: '✍️'
          }
        ]
      };
    }
    
    if (readinessIssues.length > 0) {
      return {
        primary: {
          label: 'Fix Compliance Issues',
          action: handleMakeCompliant,
          description: `${readinessIssues.length} issue${readinessIssues.length > 1 ? 's' : ''} to fix`,
          icon: '✅'
        },
        secondary: [
          {
            label: 'Improve Writing',
            action: () => {
              const prompt = `Improve the writing quality and clarity of the ${currentSection} section.`;
              setInput(prompt);
            },
            icon: '⚡'
          },
          {
            label: 'Add Details',
            action: () => {
              const prompt = `Expand the ${currentSection} section with more specific details and examples.`;
              setInput(prompt);
            },
            icon: '📈'
          }
        ]
      };
    }
    
    // Content exists and is compliant, suggest improvements
    return {
      primary: {
        label: 'Enhance Content',
        action: () => {
          const prompt = `Enhance the ${currentSection} section to make it more compelling and professional.`;
          setInput(prompt);
        },
        description: 'Improve quality and impact',
        icon: '⚡'
      },
      secondary: [
        {
          label: 'Add Examples',
          action: () => {
            const prompt = `Add specific examples and case studies to the ${currentSection} section.`;
            setInput(prompt);
          },
          icon: '💡'
        },
        {
          label: 'Check Compliance',
          action: handleMakeCompliant,
          icon: '✅'
        }
      ]
    };
  };

  const contextualActions = analyzeContent();
  
  // Get proactive suggestions based on content analysis
  const getProactiveSuggestions = (): string[] => {
    const currentContent = plan.sections.find(s => s.key === currentSection)?.content || '';
    const contentLength = currentContent.replace(/<[^>]*>/g, '').trim().length;
    const readinessIssues = getReadinessIssues();
    const suggestions: string[] = [];
    
    if (contentLength === 0) {
      suggestions.push('💡 This section is empty. Start by answering the prompts step by step.');
    } else if (contentLength < 100) {
      suggestions.push('📝 Your content is brief. Consider adding more details and examples.');
    }
    
    if (readinessIssues.length > 0) {
      suggestions.push(`⚠️ ${readinessIssues.length} compliance issue${readinessIssues.length > 1 ? 's' : ''} detected. Click "Fix Compliance Issues" to address them.`);
    }
    
    const section = plan.sections.find(s => s.key === currentSection);
    const sectionPrompts = (section as any)?.prompts as string[] | undefined;
    if (sectionPrompts && sectionPrompts.length > 0) {
      const answeredPrompts = sectionPrompts.filter((prompt: string) => {
        const lowerContent = currentContent.toLowerCase();
        const lowerPrompt = prompt.toLowerCase();
        const keywords = lowerPrompt.split(/\s+/).filter((w: string) => w.length > 4);
        return keywords.some((kw: string) => lowerContent.includes(kw));
      }).length;
      if (answeredPrompts < sectionPrompts.length) {
        suggestions.push(`📋 You've addressed ${answeredPrompts} of ${sectionPrompts.length} prompts. Complete the remaining steps in the wizard above.`);
      }
    }
    
    return suggestions;
  };

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

      {/* Proactive Suggestions - Context-aware */}
      {showSuggestions && (
        <div className="mb-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
          <div className="font-medium text-blue-900 mb-2 text-xs">💡 Suggestions for this section:</div>
          <div className="space-y-1.5">
            {getProactiveSuggestions().map((suggestion, index) => (
              <div key={index} className="text-xs text-blue-800 leading-relaxed">
                {suggestion}
              </div>
            ))}
            {getProactiveSuggestions().length === 0 && (
              <div className="text-xs text-blue-700 italic">
                ✓ Your section looks good! Continue writing or use the actions below to enhance it.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Proactive Contextual Actions - Only 3-4 relevant actions */}
      <div className="mb-3">
        {/* Primary Action - Most relevant */}
        <button
          onClick={contextualActions.primary.action}
          disabled={isProcessing}
          className="w-full text-left px-3 py-2 text-sm font-medium bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 transition-all shadow-md hover:shadow-lg mb-2"
        >
          <span className="mr-2">{contextualActions.primary.icon}</span>
          {contextualActions.primary.label}
          {contextualActions.primary.description && (
            <span className="block text-xs opacity-90 mt-0.5">{contextualActions.primary.description}</span>
          )}
        </button>
        
        {/* Secondary Actions - Compact */}
        <div className="grid grid-cols-2 gap-1">
          {contextualActions.secondary.map((action, index) => (
            <button
              key={index}
              onClick={action.action}
              disabled={isProcessing}
              className="text-left px-2 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-50 transition-colors"
            >
              <span className="mr-1">{action.icon}</span>
              {action.label}
            </button>
          ))}
        </div>
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
            <div className="animate-pulse">{t('ai.thinking')}</div>
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

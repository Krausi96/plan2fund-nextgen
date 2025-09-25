// ========= PLAN2FUND — ENHANCED AI CHAT =========
// AI Chat component with plan context and readiness integration

import React, { useState, useRef } from 'react';
import { PlanDocument } from '@/types/plan';
import { ProgramProfile } from '@/types/reco';
import { createAIHelper } from '@/lib/aiHelper';

interface EnhancedAIChatProps {
  plan: PlanDocument;
  programProfile: ProgramProfile | null;
  currentSection: string;
  onInsertContent: (content: string, section: string) => void;
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
  onInsertContent 
}: EnhancedAIChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Initialize AI helper with plan context
  const aiHelper = createAIHelper(
    {}, // userAnswers - would be populated from plan data
    {}, // programHints - would be loaded from data
    200, // maxWords
    plan.tone || 'neutral',
    plan.language || 'en'
  );

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
    
    return suggestions;
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
      // Generate AI response based on plan context
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
        input,
        mockProgram
      );
      
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: response.content,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error generating response:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle content insertion
  const handleInsertContent = (content: string) => {
    onInsertContent(content, currentSection);
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
      label: 'Improve',
      action: async () => {
        // Implementation for improve action
        console.log('Improve action');
      },
      description: 'Enhance content',
      icon: '⚡'
    },
    {
      label: 'Summarize',
      action: async () => {
        // Implementation for summarize action
        console.log('Summarize action');
      },
      description: 'Create summary',
      icon: '📝'
    }
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

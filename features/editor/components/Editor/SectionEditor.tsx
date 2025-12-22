import React, { useState, useEffect, useRef } from 'react';
import { 
  useSectionEditorState, 
  useEscapeKeyHandler, 
  useEditorStore,
  generateSectionContent,
  detectAIContext,
  type ConversationMessage,
} from '@/features/editor/lib';

type SectionEditorProps = {
  sectionId: string | null;
  onClose: () => void;
};

/**
 * ChatAssistant - Qoder-style AI assistant for section editing
 * Simple, minimal design inspired by Qoder's interface
 */
export default function SectionEditor({ sectionId, onClose }: SectionEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const editorState = useSectionEditorState(sectionId);
  
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Get plan and program info from store
  const plan = useEditorStore(state => state.plan);
  const program = useEditorStore(state => state.programSummary);
  const updateSection = useEditorStore(state => state.updateSection);
  
  useEscapeKeyHandler(!!sectionId, onClose);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Welcome message when section opens
  useEffect(() => {
    if (sectionId && editorState.section && messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: `Hi! I'm here to help you with the **${editorState.section.title}** section. You can ask me to:\n\n• Write or improve content\n• Suggest what to include\n• Answer questions about this section\n• Add references or citations\n\nWhat would you like to do?`,
        timestamp: Date.now()
      }]);
    }
  }, [sectionId, editorState.section, messages.length]);

  // Always show the assistant, even without a plan
  // If no plan, show a helpful welcome message

  const { section } = editorState;

  const handleSend = async () => {
    if (!input.trim() || !section || isLoading) return;
    
    const userMessage: ConversationMessage = {
      role: 'user',
      content: input.trim(),
      timestamp: Date.now()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    try {
      // Detect context from user message
      const context = detectAIContext(input);
      
      // Generate AI response
      const response = await generateSectionContent({
        sectionTitle: section.title,
        context: input,
        program: {
          id: program?.id,
          name: program?.name,
          type: program?.type,
        },
        conversationHistory: messages,
        assistantContext: context,
        language: plan?.language || 'en',
        documentType: 'business-plan',
      });
      
      const aiMessage: ConversationMessage = {
        role: 'assistant',
        content: response.content,
        timestamp: Date.now()
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
      // If AI generated content and user asked to write/update, update the section
      const lowerInput = input.toLowerCase();
      if (
        response.content && 
        (lowerInput.includes('write') || 
         lowerInput.includes('draft') || 
         lowerInput.includes('create') ||
         lowerInput.includes('update') ||
         lowerInput.includes('improve') ||
         lowerInput.includes('make it'))
      ) {
        updateSection(section.id, { content: response.content });
      }
      
    } catch (error) {
      console.error('AI chat error:', error);
      const errorMessage: ConversationMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!sectionId || !section) {
    // Show welcome message when no section is selected
    return (
      <div className="h-full flex flex-col bg-slate-800/50 border-l border-white/10">
        <div className="flex-shrink-0 px-3 py-2 border-b border-white/10 bg-slate-900/60">
          <h2 className="text-xs font-semibold text-white">AI Assistant</h2>
          <p className="text-[10px] text-white/50 mt-0.5">Ready to help</p>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center space-y-4">
            <div className="text-4xl">🤖</div>
            <h3 className="text-base font-semibold text-white">Select a section to get started</h3>
            <p className="text-sm text-white/60 max-w-xs">
              Click on any section card to start working. I'll help you write and improve your content.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // No portal needed - render directly in grid column
  return (
    <div ref={editorRef} className="h-full flex flex-col bg-slate-800/50 border-l border-white/10">
      {/* Header */}
      <div className="flex-shrink-0 px-3 py-2 border-b border-white/10 bg-slate-900/60">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-xs font-semibold text-white truncate">
              {section.title}
            </h2>
            <p className="text-[10px] text-white/50 mt-0.5">
              AI Assistant
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 bg-slate-800/50">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-lg px-4 py-2 ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-white border border-white/10'
              }`}
            >
              <div className="text-sm whitespace-pre-wrap">
                {msg.content}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-700 text-white border border-white/10 rounded-lg px-4 py-2">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 px-3 py-2 border-t border-white/10 bg-slate-900/60">
        <div className="flex items-end space-x-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything..."
            rows={2}
            disabled={isLoading}
            className="flex-1 resize-none rounded-lg border border-white/20 bg-slate-800 px-2.5 py-1.5 text-xs text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-900 disabled:cursor-not-allowed"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="flex-shrink-0 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed transition-colors text-xs font-medium"
          >
            Send
          </button>
        </div>
        <p className="text-[10px] text-white/30 mt-1.5">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}


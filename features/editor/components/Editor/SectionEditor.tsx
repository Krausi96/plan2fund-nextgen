import React, { useState, useEffect, useRef } from 'react';
import { 
  generateSectionContent,
  detectAIContext,
  METADATA_SECTION_ID,
  ANCILLARY_SECTION_ID,
  REFERENCES_SECTION_ID,
  APPENDICES_SECTION_ID,
  getSectionTitle,
} from '@/features/editor/lib';
import { useI18n } from '@/shared/contexts/I18nContext';
import { useProject } from '@/platform/core/context/hooks/useProject';

type ConversationMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: number;
  [key: string]: any;
};

type SectionEditorProps = {
  sectionId: string | null;
  onClose: () => void;
};

/**
 * ChatAssistant - Virtual Funding Expert for section editing
 * Simple, minimal design inspired by Qoder's interface
 */
export default function SectionEditor({ sectionId, onClose }: SectionEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { t } = useI18n();
  
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Get program info from store
  const editorMeta = useProject(state => state.editorMeta);
  const documentStructure = useProject(state => state.documentStructure);
  const selectedProgram = useProject(state => state.selectedProgram);
  const updateSection = useProject(state => state.updateSection);
  
  // Get current section from documentStructure
  const section = React.useMemo(() => {
    if (!sectionId || !documentStructure?.sections) return null;
    return documentStructure.sections.find((s: any) => s.id === sectionId) || null;
  }, [sectionId, documentStructure]);
  
  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !!sectionId) {
        onClose();
      }
    };
    
    if (sectionId) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [sectionId, onClose]);

  // Auto-scroll to bottom when new messages arrive (scoped to messages container)
  useEffect(() => {
    const messagesContainer = document.getElementById('ai-messages-container');
    if (messagesContainer && messagesEndRef.current) {
      // Scroll within the messages container only, not the entire page
      messagesContainer.scrollTo({
        top: messagesContainer.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages]);

  // Welcome message when section opens
  useEffect(() => {
    if (sectionId && section && messages.length === 0) {
      // For special sections, provide appropriate context
      let sectionSpecificHelp = `

• Write or improve content
• Suggest what to include
• Answer questions about this section
• Add references or citations

What would you like to do?`;
      
      if (section && (section as any).isSpecial) {
        switch (section.id) {
          case METADATA_SECTION_ID:
            sectionSpecificHelp = `

• Update title page information (title, company name, date, etc.)
• Modify contact information
• Add company details

What would you like to update?`;
            break;
          case ANCILLARY_SECTION_ID:
            sectionSpecificHelp = `

• The Table of Contents is generated automatically based on your sections.
• Add or modify content in your sections to update the TOC.

What would you like to know?`;
            break;
          case REFERENCES_SECTION_ID:
            sectionSpecificHelp = `

• Add new references and citations
• Update existing references
• Organize your reference list

What would you like to do?`;
            break;
          case APPENDICES_SECTION_ID:
            sectionSpecificHelp = `

• Add new appendices
• Update existing appendices
• Organize your appendix materials

What would you like to do?`;
            break;
        }
      }
      
      setMessages([{
        role: 'assistant',
        content: `Hi! I'm here to help you with the **${section.title}** section.${sectionSpecificHelp}`,
        timestamp: Date.now()
      }]);
    }
  }, [sectionId, section, messages.length]);

  // Always show the assistant, even without a plan
  // If no plan, show a helpful welcome message
  


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
        sectionTitle: section ? getSectionTitle(section.id, section.title, t) : '',
        context: input,
        program: {
          id: selectedProgram?.id,
          name: selectedProgram?.name,
          type: selectedProgram?.type,
        },
        conversationHistory: messages,
        assistantContext: context,
        language: (editorMeta?.language as "en" | "de" | undefined) || 'en',
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
        // Handle special sections differently
        if ((section as any).isSpecial) {
          // For special sections, we might need to update different parts of the plan
          switch (section.id) {
            case METADATA_SECTION_ID: // Title page
              const metadata = documentStructure?.metadata;
              if (metadata) {
                // Update title page settings based on AI response
                updateSection(section.id, { content: response.content });
              }
              break;
            case ANCILLARY_SECTION_ID: // Table of Contents
              // TOC is generated dynamically, no direct content editing
              const tocMessage: ConversationMessage = {
                role: 'assistant',
                content: `The Table of Contents is generated automatically based on your sections and their content. It updates dynamically as you add content to your plan.`,
                timestamp: Date.now()
              };
              setMessages(prev => [...prev, tocMessage]);
              break;
            case REFERENCES_SECTION_ID: // References
              // References have their own data structure in plan.references
              // This would parse the response content for references
              updateSection(section.id, { content: response.content });
              break;
            case APPENDICES_SECTION_ID: // Appendices
              // Appendices have their own data structure in plan.appendices
              // This would parse the response content for appendices
              updateSection(section.id, { content: response.content });
              break;
            default:
              updateSection(section.id, { content: response.content });
          }
        } else {
          updateSection(section.id, { content: response.content });
        }
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
        {/* Header with separator and collapse button */}
        <div className="flex-shrink-0 mb-3 px-3 pt-2">
          <div className="flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.5)', paddingBottom: '0.5rem' }}>
            <h2 className="text-xl font-bold text-white">
              {t('editor.ai.assistant.title')}
            </h2>

          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center space-y-4">
            <div className="text-4xl">👨‍💼</div>
            <h3 className="text-base font-semibold text-white">{t('editor.ai.assistant.welcomeTitle')}</h3>
          </div>
        </div>
      </div>
    );
  }

  // No portal needed - render directly in grid column
  return (
    <div ref={editorRef} className="h-full flex flex-col bg-slate-800/50 border-l border-white/10">
      {/* Header with separator and collapse button */}
      <div className="flex-shrink-0 mb-3 px-3 pt-2">
        <div className="flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.5)', paddingBottom: '0.5rem' }}>
          <h2 className="text-lg font-bold uppercase tracking-wide text-white">
            {t('editor.ai.assistant.title')}
          </h2>

        </div>
      </div>
      
      {/* Expanded Header with Section Info */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-white/10 bg-slate-900/60">
        <div className="flex items-center justify-between mb-2">
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-bold text-white truncate">
              {section ? getSectionTitle(section.id, section.title, t) : ''}
            </h2>
          </div>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-white/50">
          <span className="flex items-center gap-1">
            <span>👨‍💼</span>
            <span>{t('editor.ai.assistant.title')}</span>
          </span>
          {section && (section as any).description && (
            <span className="flex-1 truncate" title={(section as any).description}>
              {(section as any).description}
            </span>
          )}
        </div>
      </div>

      {/* Messages */}
      <div id="ai-messages-container" className="flex-1 overflow-y-auto px-3 py-3 space-y-3 bg-slate-800/50">
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


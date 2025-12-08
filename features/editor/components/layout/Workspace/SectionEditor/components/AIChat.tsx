// AI Chat Panel component for InlineSectionEditor
// Handles chat messages display, input, and suggestions panel

import React from 'react';
import { Button } from '@/shared/components/ui/button';
import type { ConversationMessage } from '@/features/editor/lib/types/plan';

type InlineSectionEditorAIChatProps = {
  // Chat state
  messages: ConversationMessage[];
  input: string;
  isLoading: boolean;
  onInputChange: (value: string) => void;
  onSend: () => void;
  
  // Suggestions panel
  proactiveSuggestions: string[];
  isLoadingSuggestions: boolean;
  isSuggestionsExpanded: boolean;
  onToggleSuggestionsExpanded: () => void;
  onAddSuggestion: (suggestion: string, index: number) => void;
  onAddAllSuggestions: () => void;
  
  // Actions expansion
  expandedActions: Set<string>;
  onToggleActionExpanded: (messageId: string) => void;
  
  // Section type flags
  isSpecialSection: boolean;
  isMetadataSection: boolean;
  isReferencesSection: boolean;
  activeQuestionHasAnswer: boolean;
};

export default function InlineSectionEditorAIChat({
  messages,
  input,
  isLoading,
  onInputChange,
  onSend,
  proactiveSuggestions,
  isLoadingSuggestions,
  isSuggestionsExpanded,
  onToggleSuggestionsExpanded,
  onAddSuggestion,
  onAddAllSuggestions,
  expandedActions,
  onToggleActionExpanded,
  isSpecialSection,
  isMetadataSection,
  isReferencesSection,
  activeQuestionHasAnswer
}: InlineSectionEditorAIChatProps) {
  // Filter out question and answer messages (only show AI messages)
  const chatMessages = messages.filter(msg => msg.type !== 'question' && msg.type !== 'answer');
  
  return (
    <>
      {/* Chat Area with Side Panel - Restructured */}
      <div className="flex-1 flex overflow-hidden bg-slate-900/95 min-h-0" style={{ minHeight: '180px', maxHeight: '300px' }}>
        {/* Chat Messages (left) */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0" style={{ minHeight: '120px' }}>
          {/* Chat Messages - Filter out question and answer messages (only show AI messages) */}
          {chatMessages.length === 0 && !isLoading && (
            <div className="flex items-center justify-center h-full min-h-[80px]">
              <div className="text-center text-white/40 text-sm">
                <div className="mb-2">💬</div>
                <div>AI suggestions will appear here</div>
              </div>
            </div>
          )}
          {chatMessages.map((msg) => {
            const isUser = msg.role === 'user';
            const hasActions = msg.metadata?.actions && msg.metadata.actions.length > 0;
            const actionCount = msg.metadata?.actions?.length || 0;
            const isActionsExpanded = expandedActions.has(msg.id);
            
            return (
              <div
                key={msg.id}
                className={`flex gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar */}
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all ${
                  isUser 
                    ? 'bg-blue-600/40 border border-blue-500/30' 
                    : 'bg-slate-700/50 border border-slate-600/30'
                }`}>
                  {isUser ? '👤' : '🤖'}
                </div>
                
                {/* Message Content */}
                <div className={`flex-1 rounded-lg p-3 text-sm transition-all ${
                  isUser
                    ? 'bg-blue-600/30 text-blue-100 border border-blue-500/20'
                    : 'bg-slate-700/50 text-white/90 border border-slate-600/20'
                }`}>
                  <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                  
                  {/* Collapsible Action buttons for AI messages */}
                  {hasActions && (
                    <div className="mt-3 pt-3 border-t border-blue-500/30">
                      <button
                        onClick={() => onToggleActionExpanded(msg.id)}
                        className="flex items-center gap-1 text-xs text-blue-300 font-semibold hover:text-blue-200 transition-colors w-full"
                      >
                        <span>⚡</span>
                        <span>Quick Actions ({actionCount})</span>
                        <span className="ml-auto">{isActionsExpanded ? '▲' : '▼'}</span>
                      </button>
                      {isActionsExpanded && hasActions && msg.metadata?.actions && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {msg.metadata.actions.map((action, idx) => (
                            <Button
                              key={idx}
                              size="sm"
                              onClick={action.onClick}
                              className="bg-blue-600 hover:bg-blue-500 text-white text-sm px-4 py-2 rounded-md transition-all shadow-md hover:shadow-lg hover:scale-105 flex items-center gap-1.5"
                            >
                              {action.icon && <span>{action.icon}</span>}
                              <span className="font-medium">{action.label}</span>
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          
          {/* Loading indicator */}
          {isLoading && (
            <div className="flex gap-2">
              <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm bg-slate-700/50">
                🤖
              </div>
              <div className="flex-1 rounded-lg p-3 text-sm bg-slate-700/50 text-white/50">
                Thinking...
              </div>
            </div>
          )}
        </div>
        
        {/* Suggestions Side Panel (right) - Now available for all section types */}
        {(proactiveSuggestions.length > 0 || isLoadingSuggestions) && (
          <div className={`
            flex-shrink-0 border-l border-white/20 bg-slate-800/60
            transition-all duration-200
            ${isSuggestionsExpanded ? 'w-[180px]' : 'w-[40px]'}
          `}>
            {/* Header */}
            <div className="p-2 bg-slate-700/50 border-b border-white/10">
              <button
                onClick={onToggleSuggestionsExpanded}
                className="flex items-center justify-between w-full text-xs font-semibold text-white/70 hover:text-white/90"
              >
                <span className="flex items-center gap-1.5">
                  <span>💡</span>
                  {isSuggestionsExpanded && (
                    <span>Suggestions ({proactiveSuggestions.length})</span>
                  )}
                </span>
                <span className="text-white/50">{isSuggestionsExpanded ? '▼' : '▶'}</span>
              </button>
            </div>
            
            {/* Suggestions List */}
            {isSuggestionsExpanded && (
              <div className="p-2 space-y-2 overflow-y-auto max-h-full">
                {isLoadingSuggestions && proactiveSuggestions.length === 0 ? (
                  <div className="text-xs text-white/50 text-center py-4">
                    Loading suggestions...
                  </div>
                ) : proactiveSuggestions.length === 0 ? (
                  <div className="text-xs text-white/50 text-center py-4">
                    No suggestions yet.
                    <br />
                    AI will suggest ideas after you start typing.
                  </div>
                ) : (
                  <>
                    {proactiveSuggestions.slice(0, 4).map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => onAddSuggestion(suggestion, idx)}
                        className="w-full text-left text-xs text-white/80 bg-slate-700/50 hover:bg-slate-600/70 border border-white/10 rounded px-2 py-1.5 transition-colors"
                      >
                        • {suggestion}
                      </button>
                    ))}
                    {proactiveSuggestions.length > 0 && (
                      <button
                        onClick={onAddAllSuggestions}
                        className="w-full text-xs text-blue-300 hover:text-blue-200 mt-2 pt-2 border-t border-white/10 text-center"
                      >
                        [Click to add all →]
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Input Section - Separate from chat, always visible at bottom */}
      <div className="border-t-2 border-white/30 p-3 bg-slate-800/70 flex-shrink-0">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                onSend();
              }
            }}
            placeholder={
              isSpecialSection
                ? isMetadataSection
                  ? 'Type your answer or ask about title page, formatting, or design...'
                  : isReferencesSection
                  ? 'Type your answer or ask about citations, references, or attachments...'
                  : 'Type your answer or ask for help...'
                : !isSpecialSection && !activeQuestionHasAnswer
                ? 'Type your answer here or ask AI to improve it...'
                : 'Type your answer or ask AI for help...'
            }
            disabled={isLoading}
            rows={3}
            className="flex-1 px-3 py-2 rounded-lg border-2 border-white/30 bg-slate-900/80 text-white text-sm placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
          />
          <Button
            onClick={onSend}
            disabled={isLoading || !input.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg self-end font-semibold shadow-lg hover:shadow-xl transition-all flex-shrink-0"
          >
            Send
          </Button>
        </div>
      </div>
    </>
  );
}


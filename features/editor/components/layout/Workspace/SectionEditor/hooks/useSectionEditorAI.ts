import { useState, useEffect, useCallback, useMemo } from 'react';
import { ConversationMessage } from '@/features/editor/lib/types/plan';
import { generateSectionContent, detectAIContext, parseAIActions, type AIContext, type AIActionCallbacks } from '../lib/sectionAiClient';
import type { BusinessPlan, Section, Question } from '@/features/editor/lib/types/plan';
import type { SectionTemplate } from '@templates';
import { simplifyPrompt } from '../components/QuestionEditor';
import type { Dataset, KPI, MediaAsset } from '@/features/editor/lib/types/plan';

interface UseSectionEditorAIParams {
  sectionId: string | null;
  activeQuestionId: string | null;
  activeQuestion: Question | null;
  section: Section | null;
  plan: BusinessPlan | null;
  template: SectionTemplate | null;
  isSpecialSection: boolean;
  isMetadataSection: boolean;
  isAncillarySection: boolean;
  isReferencesSection: boolean;
  isAppendicesSection: boolean;
  actions: {
    updateAnswer: (questionId: string, answer: string) => void;
    addDataset: (sectionId: string, dataset: Dataset) => void;
    addKpi: (sectionId: string, kpi: KPI) => void;
    addMedia: (sectionId: string, asset: MediaAsset) => void;
    addReference: (reference: any) => void;
  };
  t: (key: any) => string;
}

/**
 * Hook for managing SectionEditor AI chat functionality
 */
export function useSectionEditorAI({
  sectionId,
  activeQuestionId,
  activeQuestion,
  section,
  plan,
  template,
  isSpecialSection,
  isMetadataSection,
  isAncillarySection,
  isReferencesSection,
  isAppendicesSection,
  actions,
  t
}: UseSectionEditorAIParams) {
  // AI state
  const [aiMessages, setAiMessages] = useState<ConversationMessage[]>([]);
  const [aiInput, setAiInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  
  // Proactive suggestions state
  const [proactiveSuggestions, setProactiveSuggestions] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [hasUsedAI, setHasUsedAI] = useState(false);
  
  // Assistant panel state (context detection)
  const [assistantContext, setAssistantContext] = useState<AIContext>('content');
  
  // Collapsible actions state
  const [expandedActions, setExpandedActions] = useState<Set<string>>(new Set());

  // Create callbacks object for parseAIActions
  const aiActionCallbacks: AIActionCallbacks = useMemo(() => ({
    onDatasetCreate: (dataset: Dataset) => section && actions.addDataset(section.id, dataset),
    onKpiCreate: (kpi: KPI) => section && actions.addKpi(section.id, kpi),
    onMediaCreate: (asset: MediaAsset) => section && actions.addMedia(section.id, asset),
    onReferenceAdd: actions.addReference
  }), [actions, section]);

  // Request proactive AI suggestions when question loads
  const requestProactiveSuggestions = useCallback(async () => {
    if (!section || !plan) return;
    
    setIsLoadingSuggestions(true);
    try {
      let context = '';
      let sectionType: 'normal' | 'metadata' | 'references' | 'appendices' | 'ancillary' = 'normal';
      
      // Section-type-specific prompts
      if (isMetadataSection) {
        sectionType = 'metadata';
        context = `Based on the title page structure, provide 3-4 specific, actionable suggestions for improving the title page. Focus on:
- Logo quality and format requirements
- Company name and legal form accuracy
- Contact information completeness
- Date and confidentiality statement formatting
Provide suggestions that are directly applicable and can be implemented immediately.`;
      } else if (isAncillarySection) {
        sectionType = 'ancillary';
        context = `Based on the table of contents structure, provide 3-4 specific suggestions for improving the TOC:
- Structure and hierarchy improvements
- Missing sections that should be included
- Page numbering format
- Subsection organization
Provide actionable suggestions that improve document navigation.`;
      } else if (isReferencesSection) {
        sectionType = 'references';
        context = `Based on the references section, provide 3-4 specific suggestions for improving citations:
- Citation format consistency (APA, MLA, etc.)
- Missing required references
- Reference completeness and accuracy
- Citation style improvements
Provide suggestions that are directly applicable to reference management.`;
      } else if (isAppendicesSection) {
        sectionType = 'appendices';
        context = `Based on the appendices section, provide 3-4 specific suggestions for organizing appendices:
- Structure and organization improvements
- Missing appendices that should be included
- Formatting and labeling consistency
- Supplementary material organization
Provide actionable suggestions for better appendix management.`;
      } else if (activeQuestion) {
        // Normal section with question
        const currentAnswer = activeQuestion.answer || '';
        const answerLength = currentAnswer.trim().length;
        
        context = `Based on this question: "${activeQuestion.prompt}"
${answerLength > 0 ? `Current answer length: ${answerLength} characters` : 'No answer yet'}

Provide 3-4 specific, actionable suggestions that:
- Are directly relevant to this question
- Can be implemented immediately
- Add concrete value to the answer
- Are specific (not vague like "add more detail")
- Don't duplicate existing answer content

Format as a simple list, one suggestion per line.`;
        
        const response = await generateSectionContent({
          sectionTitle: section.title,
          context,
          program: {
            id: plan.metadata?.programId,
            name: plan.metadata?.programName,
            type: plan.metadata?.templateFundingType || 'grant'
          },
          questionMeta: {
            questionPrompt: activeQuestion.prompt,
            questionStatus: activeQuestion.status,
            requirementHints: []
          },
          conversationHistory: [],
          documentType: (plan.metadata as any)?.documentType || 'business-plan',
          assistantContext,
          sectionType: 'normal',
          sectionOrigin: template ? 'template' : 'custom',
          sectionEnabled: true
        });
        
        // Extract and validate suggestions
        const content = response.content || '';
        const suggestionLines = content
          .split('\n')
          .map(line => line.trim())
          .filter(line => {
            return /^[•\-\*]\s+/.test(line) || 
                   /^\d+[\.\)]\s+/.test(line) ||
                   /^Consider|^Mention|^Include|^Describe|^Explain|^Add|^Provide/i.test(line);
          })
          .map(line => line.replace(/^[•\-\*]\s+/, '').replace(/^\d+[\.\)]\s+/, '').trim())
          .filter(line => {
            const length = line.length;
            if (length < 10 || length > 150) return false;
            const vaguePatterns = /^(add|include|mention|consider|think about|remember)/i;
            if (vaguePatterns.test(line) && length < 30) return false;
            if (currentAnswer && line.toLowerCase().includes(currentAnswer.toLowerCase().substring(0, 20))) {
              return false;
            }
            return true;
          });
        
        if (suggestionLines.length > 0) {
          setProactiveSuggestions(suggestionLines.slice(0, 4));
        } else {
          // Fallback: generate contextual suggestions
          if (answerLength === 0) {
            setProactiveSuggestions([
              'Start with a clear overview statement',
              'Include specific examples or data points',
              'Explain the relevance to your business'
            ]);
          } else if (answerLength < 100) {
            setProactiveSuggestions([
              'Expand with more specific details',
              'Add concrete examples or evidence',
              'Explain the impact or significance'
            ]);
          } else {
            setProactiveSuggestions([
              'Refine key points for clarity',
              'Add supporting data or metrics',
              'Strengthen the conclusion'
            ]);
          }
        }
        return;
      } else {
        setProactiveSuggestions([]);
        return;
      }
      
      // For special sections (metadata, ancillary, references, appendices)
      const response = await generateSectionContent({
        sectionTitle: section.title || (isMetadataSection ? 'Title Page' : isAncillarySection ? 'Table of Contents' : isReferencesSection ? 'References' : 'Appendices'),
        context,
        program: {
          id: plan.metadata?.programId,
          name: plan.metadata?.programName,
          type: plan.metadata?.templateFundingType || 'grant'
        },
        questionMeta: {
          questionPrompt: isMetadataSection 
            ? 'Help with title page design and formatting'
            : isAncillarySection
            ? 'Help with table of contents structure'
            : isReferencesSection
            ? 'Help with citations and references'
            : 'Help with appendices',
          questionStatus: activeQuestion?.status || 'blank',
          requirementHints: []
        },
        conversationHistory: [],
        documentType: (plan.metadata as any)?.documentType || 'business-plan',
        assistantContext,
        sectionType,
        sectionOrigin: template ? 'template' : 'custom',
        sectionEnabled: true
      });
      
      // Extract and validate suggestions
      const content = response.content || '';
      const suggestionLines = content
        .split('\n')
        .map(line => line.trim())
        .filter(line => {
          return /^[•\-\*]\s+/.test(line) || 
                 /^\d+[\.\)]\s+/.test(line) ||
                 /^Consider|^Mention|^Include|^Describe|^Explain|^Add|^Provide|^Use|^Ensure/i.test(line);
        })
        .map(line => line.replace(/^[•\-\*]\s+/, '').replace(/^\d+[\.\)]\s+/, '').trim())
        .filter(line => {
          const length = line.length;
          if (length < 10 || length > 150) return false;
          const vaguePatterns = /^(add|include|mention|consider)/i;
          if (vaguePatterns.test(line) && length < 25) return false;
          return true;
        });
      
      if (suggestionLines.length > 0) {
        setProactiveSuggestions(suggestionLines.slice(0, 4));
      } else {
        setProactiveSuggestions([]);
      }
    } catch (error) {
      console.error('Failed to load proactive suggestions:', error);
      setProactiveSuggestions([]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, [activeQuestion, section, plan, template, isMetadataSection, isAncillarySection, isReferencesSection, isAppendicesSection, assistantContext]);

  // Initialize chat with question message when question changes, or welcome message for special sections
  useEffect(() => {
    if (isSpecialSection) {
      // For special sections, show welcome message
      const welcomeMessage: ConversationMessage = {
        id: `welcome_${sectionId}_${Date.now()}`,
        role: 'assistant',
        content: isMetadataSection 
          ? 'Ich helfe dir beim Erstellen des Titelblatts. Du kannst Logo, Firmenname, Kontaktdaten und Datum hinzufügen. Frag mich einfach, wenn du Hilfe brauchst!'
          : isAncillarySection
          ? 'Ich helfe dir beim Erstellen des Inhaltsverzeichnisses. Ich kann die Struktur organisieren, Seitenzahlen hinzufügen und die Formatierung anpassen. Was möchtest du tun?'
          : isReferencesSection
          ? 'Ich helfe dir beim Verwalten deiner Referenzen und Quellen. Du kannst Zitate hinzufügen, das Format anpassen oder Referenzen importieren. Wie kann ich helfen?'
          : isAppendicesSection
          ? 'Ich helfe dir beim Organisieren deiner Anhänge. Du kannst neue Anhänge hinzufügen, bestehende bearbeiten oder die Struktur anpassen. Was benötigst du?'
          : t('editor.ui.askAssistant' as any) || 'Wie kann ich dir bei diesem Abschnitt helfen?',
        timestamp: new Date().toISOString(),
        type: 'suggestion'
      };
      setAiMessages([welcomeMessage]);
      setAiInput('');
      setAssistantContext(isMetadataSection ? 'design' : isAncillarySection ? 'content' : isReferencesSection ? 'references' : 'content');
      // Request suggestions for special sections too
      if (section) {
        requestProactiveSuggestions();
      } else {
        setProactiveSuggestions([]);
      }
      return;
    }
    
    if (!activeQuestionId || !activeQuestion) return;
    
    // Reset context when switching questions
    setAssistantContext('content');
    
    // Reset messages and add initial question message
    const questionMessage: ConversationMessage = {
      id: `question_${activeQuestionId}_${Date.now()}`,
      role: 'assistant',
      content: simplifyPrompt(activeQuestion.prompt || ''),
      timestamp: new Date().toISOString(),
      type: 'question',
      metadata: {
        questionId: activeQuestionId
      }
    };
    
    // If there's an existing answer, add it as an answer message
    const messages: ConversationMessage[] = [questionMessage];
    if (activeQuestion.answer && activeQuestion.answer.trim().length > 0) {
      const answerMessage: ConversationMessage = {
        id: `answer_${activeQuestionId}_${Date.now()}`,
        role: 'user',
        content: activeQuestion.answer,
        timestamp: new Date().toISOString(),
        type: 'answer',
        metadata: {
          questionId: activeQuestionId
        }
      };
      messages.push(answerMessage);
    }
    
    setAiMessages(messages);
    setAiInput(activeQuestion.answer || '');
    
    // Reset AI usage tracking when question changes
    setHasUsedAI(false);
    setProactiveSuggestions([]);
    setExpandedActions(new Set());
    
    // Load proactive suggestions when question loads
    if (!isSpecialSection && activeQuestion) {
      requestProactiveSuggestions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeQuestionId, sectionId, isSpecialSection, isMetadataSection, isReferencesSection, isAppendicesSection]);

  // Chat send handler - handles both answers and AI chat, works for all section types
  const handleChatSend = useCallback(async () => {
    if (!aiInput.trim() || !section || !plan) return;
    
    const inputValue = aiInput.trim();
    setAiInput('');
    
    // Detect context from user message
    const detectedContext = detectAIContext(inputValue);
    setAssistantContext(detectedContext);
    
    // For special sections, always treat as AI chat
    if (isSpecialSection) {
      setIsAiLoading(true);
      const userMessage: ConversationMessage = {
        id: `user_${Date.now()}`,
        role: 'user',
        content: inputValue,
        timestamp: new Date().toISOString()
      };
      setAiMessages(prev => [...prev, userMessage]);
      
      try {
        const response = await generateSectionContent({
          sectionTitle: section.title || (isMetadataSection ? 'Title Page' : isReferencesSection ? 'References' : 'Appendices'),
          context: inputValue,
          program: {
            id: plan.metadata?.programId,
            name: plan.metadata?.programName,
            type: plan.metadata?.templateFundingType || 'grant'
          },
          questionMeta: {
            questionPrompt: isMetadataSection 
              ? 'Help with title page design and formatting'
              : isReferencesSection
              ? 'Help with citations and references'
              : 'Help with appendices'
          },
          conversationHistory: [...aiMessages, userMessage],
          documentType: (plan.metadata as any)?.documentType || 'business-plan',
          assistantContext: detectedContext,
          sectionType: isMetadataSection ? 'metadata' : isReferencesSection ? 'references' : isAppendicesSection ? 'appendices' : 'normal',
          sectionOrigin: template ? 'template' : 'custom',
          sectionEnabled: true
        });
        
        const actions = parseAIActions(response, section, aiActionCallbacks, {
          isMetadataSection,
          isReferencesSection
        });
        const helpfulActions = actions.length > 0 ? actions : [];
        
        const assistantMessage: ConversationMessage = {
          id: `ai_${Date.now()}`,
          role: 'assistant',
          content: response.content || 'How can I help you further?',
          timestamp: new Date().toISOString(),
          type: 'suggestion',
          metadata: {
            actions: helpfulActions.length > 0 ? helpfulActions : undefined
          }
        };
        setAiMessages(prev => [...prev, assistantMessage]);
        if (helpfulActions.length > 0) {
          setExpandedActions(prev => new Set([...prev, assistantMessage.id]));
        }
      } catch (error) {
        console.error('AI send failed:', error);
        const errorMessage: ConversationMessage = {
          id: `error_${Date.now()}`,
          role: 'assistant',
          content: 'I encountered an error. Please try again.',
          timestamp: new Date().toISOString(),
          type: 'suggestion'
        };
        setAiMessages(prev => [...prev, errorMessage]);
      } finally {
        setIsAiLoading(false);
      }
      return;
    }
    
    // For normal sections with questions
    if (!activeQuestion || !section) return;
    
    // Check if this should be treated as an answer (no existing answer means we're in answer input mode)
    const hasExistingAnswer = activeQuestion.answer && activeQuestion.answer.trim().length > 0;
    
    // If there's no existing answer, treat input as answer
    if (!hasExistingAnswer) {
      // Create answer message for conversation history
      const answerMessage: ConversationMessage = {
        id: `answer_${Date.now()}`,
        role: 'user',
        content: inputValue,
        timestamp: new Date().toISOString(),
        type: 'answer',
        metadata: {
          questionId: activeQuestion.id
        }
      };
      
      // Check if there's already an answer message in chat
      const existingAnswerMessage = aiMessages.find(m => m.type === 'answer' && m.metadata?.questionId === activeQuestion.id);
      
      if (existingAnswerMessage) {
        // Update existing answer message
        setAiMessages(prev => prev.map(msg => 
          msg.id === existingAnswerMessage.id
            ? {
                ...msg,
                content: inputValue,
                timestamp: new Date().toISOString()
              }
            : msg
        ));
      } else {
        // Add as new answer message
        setAiMessages(prev => [...prev, answerMessage]);
      }
      
      // Update answer in plan
      actions.updateAnswer(activeQuestion.id, inputValue);
      
      // Mark that user has used AI
      setHasUsedAI(true);
      
      // Trigger AI analysis
      setIsAiLoading(true);
      try {
        const response = await generateSectionContent({
          sectionTitle: section.title,
          context: inputValue,
          program: {
            id: plan.metadata?.programId,
            name: plan.metadata?.programName,
            type: plan.metadata?.templateFundingType || 'grant'
          },
          questionMeta: {
            questionPrompt: activeQuestion.prompt,
            questionStatus: activeQuestion.status,
            requirementHints: []
          },
          conversationHistory: [...aiMessages, answerMessage],
          documentType: ((plan.metadata as any)?.documentType as 'business-plan' | 'proposal' | 'report' | 'application') || 'business-plan',
          assistantContext: detectedContext,
          sectionType: 'normal',
          sectionOrigin: template ? 'template' : 'custom',
          sectionEnabled: true
        });
        
        // Parse AI response for actionable suggestions
        const parsedActions = parseAIActions(response, section, aiActionCallbacks, {
          isMetadataSection,
          isReferencesSection
        });
        
        const suggestionMessage: ConversationMessage = {
          id: `ai_${Date.now()}`,
          role: 'assistant',
          content: response.content || 'Great answer!',
          timestamp: new Date().toISOString(),
          type: 'suggestion',
          metadata: {
            questionId: activeQuestion.id,
            actions: parsedActions.length > 0 ? parsedActions : undefined
          }
        };
        setAiMessages(prev => [...prev, suggestionMessage]);
        if (parsedActions.length > 0) {
          setExpandedActions(prev => new Set([...prev, suggestionMessage.id]));
        }
        
        // Load proactive suggestions after first AI interaction
        if (!hasUsedAI) {
          requestProactiveSuggestions();
        }
      } catch (error) {
        console.error('AI analysis failed:', error);
        const errorMessage: ConversationMessage = {
          id: `error_${Date.now()}`,
          role: 'assistant',
          content: 'I had trouble analyzing your answer. Please try again.',
          timestamp: new Date().toISOString(),
          type: 'suggestion',
          metadata: {
            questionId: activeQuestion.id
          }
        };
        setAiMessages(prev => [...prev, errorMessage]);
      } finally {
        setIsAiLoading(false);
      }
    } else {
      // Regular AI chat message
      if (!hasUsedAI) {
        setHasUsedAI(true);
      }
      
      setIsAiLoading(true);
      
      const userMessage: ConversationMessage = {
        id: `user_${Date.now()}`,
        role: 'user',
        content: inputValue,
        timestamp: new Date().toISOString()
      };
      setAiMessages(prev => [...prev, userMessage]);
      
      try {
        const response = await generateSectionContent({
          sectionTitle: section.title,
          context: inputValue,
          program: {
            id: plan.metadata?.programId,
            name: plan.metadata?.programName,
            type: plan.metadata?.templateFundingType || 'grant'
          },
          questionMeta: {
            questionPrompt: activeQuestion.prompt,
            questionStatus: activeQuestion.status,
            requirementHints: []
          },
          conversationHistory: [...aiMessages, userMessage],
          documentType: (plan.metadata as any)?.documentType || 'business-plan',
          assistantContext: detectedContext,
          sectionType: 'normal',
          sectionOrigin: template ? 'template' : 'custom',
          sectionEnabled: true
        });
        
        // Parse AI response for actionable suggestions
        const parsedActions = parseAIActions(response, section, aiActionCallbacks, {
          isMetadataSection,
          isReferencesSection
        });
        
        const assistantMessage: ConversationMessage = {
          id: `ai_${Date.now()}`,
          role: 'assistant',
          content: response.content || 'How can I help you further?',
          timestamp: new Date().toISOString(),
          type: 'suggestion',
          metadata: {
            actions: parsedActions.length > 0 ? parsedActions : undefined
          }
        };
        setAiMessages(prev => [...prev, assistantMessage]);
        if (parsedActions.length > 0) {
          setExpandedActions(prev => new Set([...prev, assistantMessage.id]));
        }
        
        // Load proactive suggestions after first AI interaction
        if (!isSpecialSection && !hasUsedAI) {
          requestProactiveSuggestions();
        }
      } catch (error) {
        console.error('AI send failed:', error);
        const errorMessage: ConversationMessage = {
          id: `error_${Date.now()}`,
          role: 'assistant',
          content: 'I encountered an error. Please try again.',
          timestamp: new Date().toISOString(),
          type: 'suggestion'
        };
        setAiMessages(prev => [...prev, errorMessage]);
      } finally {
        setIsAiLoading(false);
      }
    }
  }, [
    aiInput,
    section,
    plan,
    activeQuestion,
    isSpecialSection,
    isMetadataSection,
    isReferencesSection,
    isAppendicesSection,
    template,
    aiMessages,
    aiActionCallbacks,
    hasUsedAI,
    requestProactiveSuggestions,
    actions
  ]);

  return {
    // State
    aiMessages,
    aiInput,
    isAiLoading,
    proactiveSuggestions,
    isLoadingSuggestions,
    expandedActions,
    
    // Setters
    setAiInput,
    setProactiveSuggestions,
    setExpandedActions,
    
    // Handlers
    handleChatSend,
    requestProactiveSuggestions
  };
}


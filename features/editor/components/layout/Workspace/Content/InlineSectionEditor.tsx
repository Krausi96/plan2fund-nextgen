import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Section, BusinessPlan, ConversationMessage } from '@/features/editor/types/plan';
import { Button } from '@/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/shared/components/ui/dialog';
// import { useI18n } from '@/shared/contexts/I18nContext';
import { useEditorStore, validateQuestionRequirements, METADATA_SECTION_ID, ANCILLARY_SECTION_ID, REFERENCES_SECTION_ID, APPENDICES_SECTION_ID } from '@/features/editor/hooks/useEditorStore';
import {
  Dataset,
  KPI,
  MediaAsset
} from '@/features/editor/types/plan';
import { generateSectionContent, detectAIContext, parseAIActions, type AIContext, type AIActionCallbacks } from '@/features/editor/engine/sectionAiClient';
// CSS will be injected dynamically since classes are applied to preview DOM elements

type InlineSectionEditorProps = {
  sectionId: string | null;
  section: Section | null;
  activeQuestionId: string | null;
  plan: BusinessPlan;
  onClose: () => void;
  onSelectQuestion: (questionId: string) => void;
  onAnswerChange: (questionId: string, content: string) => void;
  onToggleUnknown: (questionId: string, note?: string) => void;
  onMarkComplete: (questionId: string) => void;
  onAIHelp?: () => void;
  onDataHelp?: () => void;
  onTitlePageChange: (titlePage: any) => void;
  onAncillaryChange: (updates: Partial<any>) => void;
  onReferenceAdd: (reference: any) => void;
  onReferenceUpdate: (reference: any) => void;
  onReferenceDelete: (referenceId: string) => void;
  onAppendixAdd: (item: any) => void;
  onAppendixUpdate: (item: any) => void;
  onAppendixDelete: (appendixId: string) => void;
  onRunRequirements: () => void;
  onDatasetCreate?: (dataset: Dataset) => void;
  onKpiCreate?: (kpi: KPI) => void;
  onMediaCreate?: (asset: MediaAsset) => void;
  onAttachDataset?: (dataset: Dataset) => void;
  onAttachKpi?: (kpi: KPI) => void;
  onAttachMedia?: (asset: MediaAsset) => void;
  progressSummary?: any[];
};

type EditorPosition = {
  top: number;
  left: number;
  placement: 'right' | 'below';
  visible: boolean;
};

const EDITOR_WIDTH = 450; // Increased from 320 to better match preview page proportions
const EDITOR_MAX_HEIGHT = 600; // Increased from 360 for better usability
const GAP = 24; // Increased gap for better spacing

/**
 * Simplifies template prompts to short, conversational questions.
 * Works for any language by extracting the main question.
 * 
 * Rules:
 * 1. Extract main question (first sentence)
 * 2. Remove multiple sub-questions
 * 3. Remove common filler words and formal language markers
 * 4. Keep it short (max 80 characters)
 */
function simplifyPrompt(templatePrompt: string): string {
  if (!templatePrompt || templatePrompt.trim().length === 0) {
    return 'Answer this question';
  }
  
  // Extract first sentence (before period, question mark, or exclamation)
  const firstSentence = templatePrompt
    .split(/[.!?]/)[0]
    .trim();
  
  if (!firstSentence) {
    return templatePrompt.substring(0, 80).trim();
  }
  
  // Remove common filler words and formal markers (language-agnostic patterns)
  let simplified = firstSentence
    // Remove ellipses
    .replace(/\.\.\./g, '')
    // Remove common filler words (works across languages)
    .replace(/\b(detailliert|bitte|please|kindly|detailed|thoroughly)\b/gi, '')
    // Remove extra whitespace
    .replace(/\s+/g, ' ')
    .trim();
  
  // Capitalize first letter
  if (simplified.length > 0) {
    simplified = simplified.charAt(0).toUpperCase() + simplified.slice(1);
  }
  
  // Limit length
  if (simplified.length > 80) {
    // Try to cut at a word boundary
    const truncated = simplified.substring(0, 77).trim();
    const lastSpace = truncated.lastIndexOf(' ');
    if (lastSpace > 50) {
      simplified = truncated.substring(0, lastSpace) + '...';
    } else {
      simplified = truncated + '...';
    }
  }
  
  return simplified || templatePrompt.substring(0, 80).trim();
}

export default function InlineSectionEditor({
  sectionId,
  section,
  activeQuestionId,
  plan,
  onClose,
  onSelectQuestion,
  onAnswerChange,
  onToggleUnknown,
  onMarkComplete,
  onAIHelp: _onAIHelp,
  onDataHelp: _onDataHelp,
  onTitlePageChange,
  onAncillaryChange: _onAncillaryChange,
  onReferenceAdd: _onReferenceAdd,
  onReferenceUpdate: _onReferenceUpdate,
  onReferenceDelete: _onReferenceDelete,
  onAppendixAdd,
  onAppendixUpdate: _onAppendixUpdate,
  onAppendixDelete: _onAppendixDelete,
  onRunRequirements: _onRunRequirements,
  onDatasetCreate: _onDatasetCreate,
  onKpiCreate: _onKpiCreate,
  onMediaCreate,
  progressSummary: _progressSummary = []
}: InlineSectionEditorProps) {
  // const { t } = useI18n();
  const { templates } = useEditorStore();
  // Initialize position as visible if sectionId exists
  const [position, setPosition] = useState<EditorPosition>(() => ({
    top: 24,
    left: typeof window !== 'undefined' ? window.innerWidth - EDITOR_WIDTH - GAP : 0,
    placement: 'right',
    visible: !!sectionId // Start visible if sectionId exists
  }));
  const editorRef = useRef<HTMLDivElement>(null);
  const positionUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOverTarget, setDragOverTarget] = useState<'logo' | 'attachment' | null>(null);
  
  // AI state
  const [aiMessages, setAiMessages] = useState<ConversationMessage[]>([]);
  const [aiInput, setAiInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  
  // Proactive suggestions state
  const [proactiveSuggestions, setProactiveSuggestions] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [hasUsedAI, setHasUsedAI] = useState(false); // Track if user has interacted with AI
  
  // Assistant panel state (context detection) - used for context-aware AI responses
  // Phase 2: Will be passed to AI context for specialized prompts
  const [_assistantContext, setAssistantContext] = useState<AIContext>('content');
  
  // Section guidance expandable state
  const [isSectionGuidanceOpen, setIsSectionGuidanceOpen] = useState(false);
  
  // Skip dialog state
  const [showSkipDialog, setShowSkipDialog] = useState(false);
  const [skipReason, setSkipReason] = useState<'not_applicable' | 'later' | 'unclear' | 'other' | null>(null);
  const [skipNote, setSkipNote] = useState('');

  // Check if this is a metadata or ancillary section
  const isMetadataSection = sectionId === METADATA_SECTION_ID;
  const isAncillarySection = sectionId === ANCILLARY_SECTION_ID;
  const isReferencesSection = sectionId === REFERENCES_SECTION_ID;
  const isAppendicesSection = sectionId === APPENDICES_SECTION_ID;
  const isSpecialSection = isMetadataSection || isAncillarySection || isReferencesSection || isAppendicesSection;

  const activeQuestion = section?.questions.find((q) => q.id === activeQuestionId) ?? section?.questions[0] ?? null;
  const template = section ? templates.find((tpl) => tpl.id === section.id) : null;

  // Sidebar positioning: Always on right side of preview container (absolute positioning)
  const calculatePosition = useCallback(() => {
    if (!sectionId) {
      setPosition(prev => ({ ...prev, visible: false }));
      return;
    }
    
    const previewContainer = document.getElementById('preview-container');
    const isDesktop = window.innerWidth > 768;
    
    // Always set visible to true when sectionId exists
    // For absolute positioning, we position relative to preview-container
    let top = 24;
    let left = 0; // Will use 'right' instead
    
    if (previewContainer) {
      // Use preview container for absolute positioning
      if (isDesktop) {
        // Desktop: Absolute positioning on right side of preview container
        // Position relative to preview-container (which has position: relative)
        top = GAP;
        left = 0; // Use 'right' CSS property instead
      } else {
        // Mobile: Full width at bottom of container
        top = 0; // Will use 'bottom' instead
        left = GAP;
      }
    } else {
      // Fallback: Default positioning
      top = GAP;
      left = 0;
    }
    
    // Always set visible when sectionId exists
    setPosition({
      top,
      left,
      placement: isDesktop ? 'right' : 'below',
      visible: true
    });
  }, [sectionId]);

  // Styles are in globals.css - no need to inject dynamically

  // Add/remove highlight classes to active question in preview
  useEffect(() => {
    if (!activeQuestionId || !sectionId || isSpecialSection) return;

    // Add highlight class to active question
    const questionHeading = document.querySelector(`h4.section-subchapter[data-question-id="${activeQuestionId}"]`) as HTMLElement;
    const questionContent = document.querySelector(`div[data-question-id="${activeQuestionId}"][data-question-content="true"]`) as HTMLElement;
    const sectionElement = document.querySelector(`[data-section-id="${sectionId}"]`) as HTMLElement;

    if (questionHeading) {
      questionHeading.classList.add('inline-editor-active-question');
    }
    if (questionContent) {
      questionContent.classList.add('inline-editor-active-content');
    }
    if (sectionElement) {
      sectionElement.classList.add('inline-editor-active-section');
    }

    return () => {
      // Cleanup: remove highlight classes
      if (questionHeading) {
        questionHeading.classList.remove('inline-editor-active-question');
      }
      if (questionContent) {
        questionContent.classList.remove('inline-editor-active-content');
      }
      if (sectionElement) {
        sectionElement.classList.remove('inline-editor-active-section');
      }
    };
  }, [activeQuestionId, sectionId, isSpecialSection]);

  // Update position on mount, section change, and resize (no scroll tracking needed for sidebar)
  useEffect(() => {
    if (!sectionId) {
      setPosition(prev => ({ ...prev, visible: false }));
      return;
    }

    // Calculate position with retry logic to ensure DOM is ready
    let retryCount = 0;
    const maxRetries = 5;
    
    const tryCalculatePosition = () => {
      const scrollContainer = document.getElementById('preview-scroll-container');
      if (!scrollContainer && retryCount < maxRetries) {
        // Retry if container not found yet
        retryCount++;
        setTimeout(tryCalculatePosition, 100);
        return;
      }
      calculatePosition();
    };

    // Initial attempt after short delay
    const timeoutId = setTimeout(tryCalculatePosition, 150);

    // Only listen to resize events (sidebar position doesn't change on scroll)
    const handleResize = () => {
      if (positionUpdateTimeoutRef.current) {
        clearTimeout(positionUpdateTimeoutRef.current);
      }
      positionUpdateTimeoutRef.current = setTimeout(() => {
        calculatePosition();
      }, 100);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(timeoutId);
      if (positionUpdateTimeoutRef.current) {
        clearTimeout(positionUpdateTimeoutRef.current);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, [sectionId, calculatePosition]);

  // Close on ESC key
  useEffect(() => {
    if (!sectionId) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [sectionId, onClose]);

  // Handle drag and drop for files
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Determine drop target based on position
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const y = e.clientY - rect.top;
    
    // Top 30% is logo area, rest is general attachment area
    if (y < rect.height * 0.3 && isMetadataSection) {
      setDragOverTarget('logo');
    } else {
      setDragOverTarget('attachment');
    }
  }, [isMetadataSection]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only clear if leaving the editor entirely
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (!editorRef.current?.contains(relatedTarget)) {
      setIsDragging(false);
      setDragOverTarget(null);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setDragOverTarget(null);

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    // Handle logo upload (first image file)
    if (dragOverTarget === 'logo' && isMetadataSection) {
      const imageFile = files.find(file => file.type.startsWith('image/'));
      if (imageFile) {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            onTitlePageChange({ ...plan.titlePage, logoUrl: reader.result });
          }
        };
        reader.readAsDataURL(imageFile);
      }
      return;
    }

    // Handle general file attachments
    files.forEach((file) => {
      if (file.type.startsWith('image/')) {
        // Handle image as media asset - only if we have onMediaCreate and a section
        if (onMediaCreate && section) {
          const reader = new FileReader();
          reader.onload = () => {
            if (typeof reader.result === 'string') {
              const mediaAsset: MediaAsset = {
                id: `media_${Date.now()}`,
                type: 'image',
                title: file.name,
                uri: reader.result,
                description: `Uploaded: ${file.name}`,
                sectionId: section.id
              };
              onMediaCreate(mediaAsset);
            }
          };
          reader.readAsDataURL(file);
        } else {
          // If no section, add as appendix instead
          const reader = new FileReader();
          reader.onload = () => {
            if (typeof reader.result === 'string') {
              const appendix = {
                id: `appendix_${Date.now()}`,
                title: file.name,
                description: `Uploaded image: ${file.name}`,
                fileUrl: reader.result
              };
              onAppendixAdd(appendix);
            }
          };
          reader.readAsDataURL(file);
        }
      } else {
        // Handle other files as appendices
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            const appendix = {
              id: `appendix_${Date.now()}`,
              title: file.name,
              description: `Uploaded file: ${file.name}`,
              fileUrl: reader.result
            };
            onAppendixAdd(appendix);
          }
        };
        reader.readAsDataURL(file);
      }
    });
  }, [dragOverTarget, isMetadataSection, plan.titlePage, onTitlePageChange, onMediaCreate, onAppendixAdd, section]);

  // Editor is visible for ALL sections including ANCILLARY (universal design/management panel)
  // No need to hide for any section - all sections are editable/manageable
  useEffect(() => {
    if (!sectionId) {
      setPosition(prev => ({ ...prev, visible: false }));
    }
  }, [sectionId]);

  // Memoize validation to prevent unnecessary recalculations
  const validation = useMemo(() => {
    if (!activeQuestion || !template || !section) return null;
    return validateQuestionRequirements(activeQuestion, section, template);
  }, [activeQuestion?.id, activeQuestion?.answer, template?.id, section?.id]);

  // Request proactive AI suggestions when question loads
  // Only call when question ID changes, not on every validation update
  const requestProactiveSuggestions = useCallback(async () => {
    if (isSpecialSection || !activeQuestion || !section) return;
    
    setIsLoadingSuggestions(true);
    try {
      const currentValidation = activeQuestion && template && section
        ? validateQuestionRequirements(activeQuestion, section, template)
        : null;
      
      const response = await generateSectionContent({
        sectionTitle: section.title,
        context: `Analyze this question and provide 3-5 brief suggestions for what to mention in the answer: ${activeQuestion.prompt}`,
        program: {
          id: plan.metadata?.programId,
          name: plan.metadata?.programName,
          type: plan.metadata?.templateFundingType || 'grant'
        },
        questionMeta: {
          questionPrompt: activeQuestion.prompt,
          questionStatus: activeQuestion.status,
          requirementHints: currentValidation?.issues.map(i => i.message) || []
        },
        conversationHistory: [],
        documentType: (plan.metadata as any)?.documentType || 'business-plan',
        assistantContext: _assistantContext,
        sectionType: 'normal',
        sectionOrigin: template ? 'template' : 'custom',
        sectionEnabled: true // Sections are enabled by default
      });
      
      // Extract suggestions from AI response (look for bullet points or list items)
      const content = response.content || '';
      const suggestionLines = content
        .split('\n')
        .map(line => line.trim())
        .filter(line => {
          // Match bullet points, numbered lists, or lines starting with common suggestion markers
          return /^[•\-\*]\s+/.test(line) || 
                 /^\d+[\.\)]\s+/.test(line) ||
                 /^Consider|^Mention|^Include|^Describe|^Explain/i.test(line);
        })
        .map(line => line.replace(/^[•\-\*]\s+/, '').replace(/^\d+[\.\)]\s+/, '').trim())
        .filter(line => line.length > 0 && line.length < 150);
      
      if (suggestionLines.length > 0) {
        setProactiveSuggestions(suggestionLines.slice(0, 5));
      } else {
        // Fallback: generate generic suggestions based on question type
        setProactiveSuggestions([
          'Provide specific examples',
          'Include relevant details',
          'Explain the context clearly'
        ]);
      }
    } catch (error) {
      console.error('Failed to load proactive suggestions:', error);
      setProactiveSuggestions([]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, [activeQuestion?.id, activeQuestion?.prompt, section?.id, section?.title, plan.metadata, isSpecialSection, template?.id]);

  // Initialize chat with question message when question changes, or welcome message for special sections
  useEffect(() => {
    if (isSpecialSection) {
      // For special sections, show welcome message
      const welcomeMessage: ConversationMessage = {
        id: `welcome_${sectionId}_${Date.now()}`,
        role: 'assistant',
        content: isMetadataSection 
          ? 'I can help you with title page design, formatting, and document structure.'
          : isReferencesSection
          ? 'I can help you manage citations, references, and attachments.'
          : isAppendicesSection
          ? 'I can help you organize appendices and supplementary materials.'
          : isAncillarySection
          ? 'I can help you customize the table of contents, list of tables, list of figures, and other document lists.'
          : 'How can I assist you with this section?',
        timestamp: new Date().toISOString(),
        type: 'suggestion'
      };
      setAiMessages([welcomeMessage]);
      setAiInput('');
      setAssistantContext(isMetadataSection ? 'design' : isReferencesSection ? 'references' : isAncillarySection ? 'content' : 'content');
      setProactiveSuggestions([]);
      return;
    }
    
    if (!activeQuestionId || !activeQuestion) return;
    
    // Phase 3: Reset context when switching questions
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
    setAiInput('');
    
    // Reset AI usage tracking when question changes
    setHasUsedAI(false);
    setProactiveSuggestions([]);
    
    // Don't load proactive suggestions automatically - only load after first AI interaction
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeQuestionId, sectionId, isSpecialSection, isMetadataSection, isReferencesSection, isAppendicesSection]);

  // Create callbacks object for parseAIActions
  const aiActionCallbacks: AIActionCallbacks = useMemo(() => ({
    onDatasetCreate: _onDatasetCreate,
    onKpiCreate: _onKpiCreate,
    onMediaCreate: onMediaCreate,
    onReferenceAdd: _onReferenceAdd
  }), [_onDatasetCreate, _onKpiCreate, onMediaCreate, _onReferenceAdd]);

  // Early return if sectionId is null
  // Don't check position.visible here - it might be false during initial calculation
  // The editor should show whenever sectionId exists
  if (!sectionId) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[InlineSectionEditor] Not rendering - no sectionId');
    }
    return null;
  }
  
  // Debug logging
  if (process.env.NODE_ENV === 'development') {
    console.log('[InlineSectionEditor] Rendering:', {
      sectionId,
      positionVisible: position.visible,
      positionTop: position.top,
      positionLeft: position.left,
      isSpecialSection,
      hasSection: !!section,
      hasActiveQuestion: !!activeQuestion,
      willRender: true
    });
  }
  
  // Force position to be visible if sectionId exists (even if calculation hasn't completed)
  useEffect(() => {
    if (sectionId && !position.visible) {
      // Trigger position calculation immediately
      calculatePosition();
    }
  }, [sectionId, position.visible, calculatePosition]);

  // For normal sections without questions, show a message instead of hiding
  // Editor should ALWAYS be visible when sectionId exists
  if (!isSpecialSection && !section) {
    // Section not found - this shouldn't happen, but show editor anyway
    console.warn('[InlineSectionEditor] Section not found for sectionId:', sectionId);
  }
  
  // For normal sections, if no activeQuestion, we'll still show the editor (it will show section info)

  // Type guards for normal sections
  const isUnknown = !isSpecialSection && activeQuestion ? activeQuestion.status === 'unknown' : false;
  const isComplete = !isSpecialSection && activeQuestion ? activeQuestion.status === 'complete' : false;
  const isLastQuestion = !isSpecialSection && section && activeQuestion 
    ? section.questions[section.questions.length - 1]?.id === activeQuestion.id 
    : false;

  // Get next question helper (only for normal sections)
  const getNextQuestion = () => {
    if (isSpecialSection || !section || !activeQuestion) return null;
    const currentIndex = section.questions.findIndex(q => q.id === activeQuestion.id);
    if (currentIndex >= 0 && currentIndex < section.questions.length - 1) {
      return section.questions[currentIndex + 1];
    }
    return null;
  };

  const handleSkipClick = () => {
    if (isSpecialSection || !activeQuestion) return;
    if (isUnknown) {
      // Clear skip - no dialog needed
      onToggleUnknown(activeQuestion.id);
      // Auto-advance to next question
      const nextQuestion = getNextQuestion();
      if (nextQuestion) {
        onSelectQuestion(nextQuestion.id);
      } else {
        onClose(); // Last question
      }
    } else {
      // Show skip reason dialog
      setShowSkipDialog(true);
      setSkipReason(null);
      setSkipNote('');
    }
  };

  const handleSkipConfirm = () => {
    if (!skipReason || isSpecialSection || !activeQuestion) return;
    
    // Build reason string
    let reasonString: string = skipReason;
    if (skipReason === 'other' && skipNote.trim()) {
      reasonString = `other: ${skipNote.trim()}`;
    } else if (skipNote.trim()) {
      reasonString = `${skipReason}: ${skipNote.trim()}`;
    }
    
    // Mark as unknown with reason
    onToggleUnknown(activeQuestion.id, reasonString);
    
    // Close dialog
    setShowSkipDialog(false);
    setSkipReason(null);
    setSkipNote('');
    
    // Auto-advance to next question
    const nextQuestion = getNextQuestion();
    if (nextQuestion) {
      onSelectQuestion(nextQuestion.id);
    } else {
      onClose(); // Last question
    }
  };

  const handleComplete = () => {
    if (isSpecialSection || !activeQuestion) return;
    onMarkComplete(activeQuestion.id);
    
    // Auto-advance to next question
    const nextQuestion = getNextQuestion();
    if (nextQuestion) {
      onSelectQuestion(nextQuestion.id);
    } else {
      onClose(); // Last question
    }
  };

  // New chat send handler - handles both answers and AI chat, works for all section types
  const handleChatSend = async () => {
    if (!aiInput.trim() || !section) return;
    
    const inputValue = aiInput.trim();
    setAiInput('');
    
    // Phase 3: Detect context from user message
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
          sectionTitle: section?.title || (isMetadataSection ? 'Title Page' : isReferencesSection ? 'References' : isAppendicesSection ? 'Appendices' : isAncillarySection ? 'Table of Contents & Lists' : 'Section'),
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
              : isAppendicesSection
              ? 'Help with appendices'
              : isAncillarySection
              ? 'Help with table of contents, list of tables, and document lists'
              : 'Help with this section'
          },
          conversationHistory: [...aiMessages, userMessage],
          documentType: (plan.metadata as any)?.documentType || 'business-plan',
          assistantContext: detectedContext,
          sectionType: isMetadataSection ? 'metadata' : isReferencesSection ? 'references' : isAppendicesSection ? 'appendices' : isAncillarySection ? 'ancillary' : 'normal',
          sectionOrigin: template ? 'template' : 'custom',
          sectionEnabled: true // Sections are enabled by default
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
    
    // If there's no existing answer, treat input as answer (answer input section is shown)
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
      
      // Check if there's already an answer message in chat (from initialization)
      const existingAnswerMessage = aiMessages.find(m => m.type === 'answer' && m.metadata?.questionId === activeQuestion.id);
      
      if (existingAnswerMessage) {
        // Update existing answer message instead of creating new one
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
      onAnswerChange(activeQuestion.id, inputValue);
      
      // Mark that user has used AI (submitting answer triggers AI analysis)
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
            requirementHints: validation?.issues.map(i => i.message) || []
          },
          conversationHistory: [...aiMessages, answerMessage],
          documentType: ((plan.metadata as any)?.documentType as 'business-plan' | 'proposal' | 'report' | 'application') || 'business-plan',
          assistantContext: detectedContext,
          sectionType: 'normal',
          sectionOrigin: template ? 'template' : 'custom',
          sectionEnabled: true // Sections are enabled by default
        });
        
        // Phase 2: Parse AI response for actionable suggestions (structured output)
        const actions = parseAIActions(response, section, aiActionCallbacks, {
          isMetadataSection,
          isReferencesSection
        });
        
        // Only show actions when AI suggests them
        const suggestionMessage: ConversationMessage = {
          id: `ai_${Date.now()}`,
          role: 'assistant',
          content: response.content || 'Great answer!',
          timestamp: new Date().toISOString(),
          type: 'suggestion',
          metadata: {
            questionId: activeQuestion.id,
            actions: actions.length > 0 ? actions : undefined
          }
        };
        setAiMessages(prev => [...prev, suggestionMessage]);
        
        // Load proactive suggestions after first AI interaction (answer submission)
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
      // Mark that user has used AI (asking question in chat)
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
            requirementHints: validation?.issues.map(i => i.message) || []
          },
          conversationHistory: [...aiMessages, userMessage],
          documentType: (plan.metadata as any)?.documentType || 'business-plan',
          assistantContext: detectedContext,
          sectionType: 'normal',
          sectionOrigin: template ? 'template' : 'custom',
          sectionEnabled: true // Sections are enabled by default
        });
        
        // Phase 2: Parse AI response for actionable suggestions (structured output)
        const actions = parseAIActions(response, section, aiActionCallbacks, {
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
            actions: actions.length > 0 ? actions : undefined
          }
        };
        setAiMessages(prev => [...prev, assistantMessage]);
        
        // Load proactive suggestions after first AI interaction (chat message)
        // Only for normal sections, and only on first AI interaction
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
  };

  // Data creation handlers removed - now only available via AI action buttons


  // Calculate completion (only for normal sections with questions)
  const answeredCount = !isSpecialSection && section 
    ? section.questions.filter(q => q.answer && q.answer.trim().length > 0).length 
    : 0;
  const totalQuestions = !isSpecialSection && section ? section.questions.length : 0;
  const completionPercentage = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  const editorContent = (
    <div
      ref={editorRef}
      className={`absolute z-20 rounded-2xl border-2 ${
        isDragging 
          ? 'border-blue-500 border-dashed bg-blue-900/50' 
          : 'border-blue-400/60 bg-slate-900/95'
      } backdrop-blur-xl shadow-2xl overflow-hidden transition-all`}
      style={{
        top: position.visible && position.top > 0 ? `${position.top}px` : '24px', // Default position if not calculated yet
        left: position.visible && position.left > 0 ? `${position.left}px` : 'auto', // Default position if not calculated yet
        right: position.visible ? '24px' : 'auto', // Right side of preview-container
        bottom: typeof window !== 'undefined' && window.innerWidth <= 768 ? '24px' : 'auto', // Mobile: bottom
        width: `${EDITOR_WIDTH}px`,
        maxHeight: `${EDITOR_MAX_HEIGHT}px`,
        position: 'absolute', // Absolute positioning relative to preview-container
        overflowY: 'auto',
        overflowX: 'hidden',
        zIndex: 9999, // Very high z-index to ensure it appears above everything
        display: 'block', // Always show when component renders
        opacity: 1, // Always visible when component renders
        visibility: 'visible' // Force visibility
      }}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-blue-900/80 backdrop-blur-sm rounded-2xl pointer-events-none">
          <div className="text-center p-6">
            <div className="text-4xl mb-2">📎</div>
            <p className="text-sm font-semibold text-white">
              Drop files to attach
            </p>
          </div>
        </div>
      )}
      <div className="relative h-full flex flex-col bg-slate-900/95 backdrop-blur-xl">
        {/* Header */}
        <div className="p-2.5 border-b border-white/20 bg-gradient-to-r from-slate-800/90 to-slate-900/90">
          <div className="flex items-center justify-between mb-1.5">
            <h2 className="text-xs font-semibold text-white truncate flex-1 min-w-0">{section?.title || 'Section'}</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white/70 hover:bg-white/10 hover:text-white flex-shrink-0 ml-2 h-6 w-6 p-0"
              aria-label="Close editor"
            >
              ✕
            </Button>
          </div>
          {/* Section Guidance - Expandable */}
          {section?.description && (
            <details 
              open={isSectionGuidanceOpen}
              onToggle={(e) => setIsSectionGuidanceOpen(e.currentTarget.open)}
              className="mt-1"
            >
              <summary className="cursor-pointer text-[10px] text-white/70 hover:text-white/90 flex items-center gap-1">
                <span>📋 Section Guidance</span>
                <span className="text-white/50 text-[9px]">{isSectionGuidanceOpen ? '▲' : '▼'}</span>
              </summary>
              <p className="text-[10px] text-white/70 mt-1.5 leading-relaxed">{section?.description}</p>
            </details>
          )}
        </div>

        {/* Question Navigation - Only for normal sections */}
        {!isSpecialSection && section && section.questions.length > 1 && (
          <div className="px-3 py-2 border-b border-white/20 bg-slate-800/50">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {section.questions.map((q, index) => {
                const isActive = q.id === activeQuestionId;
                const status = q.status;
                return (
                  <button
                    key={q.id}
                    onClick={() => onSelectQuestion(q.id)}
                    className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium transition-all flex-shrink-0 ${
                      isActive
                        ? 'border-blue-500 bg-blue-500 text-white shadow-md'
                        : 'border-white/20 bg-slate-700/50 text-white/80 hover:border-blue-400 hover:bg-slate-700'
                    }`}
                  >
                    <span>{index + 1}</span>
                    {status === 'complete' && <span className="text-[9px]">✅</span>}
                    {status === 'unknown' && <span className="text-[9px]">❓</span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Unified Content Area - Merged Chat + Assistant */}
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-900/95 relative">
          {/* Answer Input Section - Only for normal sections without existing answer */}
          {!isSpecialSection && activeQuestion && !activeQuestion.answer?.trim() && (
            <div className="border-b border-white/20 p-3 bg-slate-800/50">
              <div className="text-[10px] font-semibold text-white/90 mb-2">
                {simplifyPrompt(activeQuestion.prompt || '')}
              </div>
              <textarea
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    handleChatSend();
                  }
                }}
                placeholder={activeQuestion.placeholder || 'Type your answer here...'}
                disabled={isAiLoading}
                className="w-full min-h-[80px] px-2 py-1.5 rounded border border-white/20 bg-slate-800/50 text-white text-[10px] placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-[9px] text-white/50">Press Ctrl+Enter to submit</span>
                <Button
                  onClick={handleChatSend}
                  disabled={isAiLoading || !aiInput.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] px-3 py-1.5 rounded"
                >
                  Submit Answer
                </Button>
              </div>
            </div>
          )}

          {/* Unified Scrollable Area */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {/* Chat Messages */}
            {aiMessages.map((msg) => {
              const isUser = msg.role === 'user';
              const isQuestion = msg.type === 'question';
              const isAnswer = msg.type === 'answer';
              
              return (
                <div
                  key={msg.id}
                  className={`flex gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {/* Avatar - Phase 5: Improved Styling */}
                  <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs transition-all ${
                    isUser 
                      ? 'bg-blue-600/40 border border-blue-500/30' 
                      : isQuestion
                      ? 'bg-slate-700/60 border border-slate-600/40'
                      : 'bg-slate-700/50 border border-slate-600/30'
                  }`}>
                    {isUser ? '👤' : isQuestion ? '❓' : '🤖'}
                  </div>
                  
                  {/* Message Content - Phase 5: Improved Styling */}
                  <div className={`flex-1 rounded-lg p-2.5 text-[10px] transition-all ${
                    isUser
                      ? 'bg-blue-600/30 text-blue-100 border border-blue-500/20'
                      : isQuestion
                      ? 'bg-slate-700/50 text-white/90 font-semibold border border-slate-600/30'
                      : 'bg-slate-700/50 text-white/90 border border-slate-600/20'
                  }`}>
                    <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                    
                    {/* Word count for answer messages */}
                    {isAnswer && msg.content && (
                      <div className="mt-1.5 text-[9px] text-white/50">
                        {msg.content.trim().split(/\s+/).filter(Boolean).length} words
                      </div>
                    )}
                    
                    {/* Edit/Delete buttons for answer messages */}
                    {isAnswer && activeQuestion && (
                      <div className="flex gap-1.5 mt-1.5">
                        <button
                          onClick={() => {
                            // Allow editing by focusing chat input with current answer
                            setAiInput(msg.content);
                            // Remove this answer message temporarily
                            setAiMessages(prev => prev.filter(m => m.id !== msg.id));
                          }}
                          className="text-[9px] text-blue-400 hover:text-blue-300"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            // Delete answer
                            onAnswerChange(activeQuestion.id, '');
                            setAiMessages(prev => prev.filter(m => m.id !== msg.id));
                          }}
                          className="text-[9px] text-red-400 hover:text-red-300"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                    
                    {/* Action buttons for AI messages - Phase 4: Proactive Suggestions */}
                    {msg.metadata?.actions && msg.metadata.actions.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-blue-500/30 bg-blue-900/20 rounded p-2">
                        <div className="text-[9px] text-blue-300 font-semibold mb-1.5 w-full flex items-center gap-1">
                          <span>⚡</span>
                          <span>Quick Actions:</span>
                        </div>
                        {msg.metadata.actions.map((action, idx) => (
                          <Button
                            key={idx}
                            size="sm"
                            onClick={action.onClick}
                            className="bg-blue-600 hover:bg-blue-500 text-white text-[10px] px-3 py-1.5 rounded-md transition-all shadow-md hover:shadow-lg hover:scale-105 flex items-center gap-1.5"
                          >
                            {action.icon && <span>{action.icon}</span>}
                            <span className="font-medium">{action.label}</span>
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            
            {/* Loading indicator */}
            {isAiLoading && (
              <div className="flex gap-2">
                <div className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs bg-slate-700/50">
                  🤖
                </div>
                <div className="flex-1 rounded-lg p-2 text-[10px] bg-slate-700/50 text-white/50">
                  Thinking...
                </div>
              </div>
            )}
            
            {/* Proactive Suggestions - Moved below chat messages, integrated into conversation flow */}
            {!isSpecialSection && proactiveSuggestions.length > 0 && (
              <div className="mt-3 pt-3 border-t border-white/10">
                <div className="flex gap-2">
                  <div className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs bg-slate-700/50 border border-slate-600/30">
                    💡
                  </div>
                  <div className="flex-1 rounded-lg p-2.5 bg-slate-700/50 text-white/90 border border-slate-600/20">
                    <div className="text-[10px] font-semibold text-white/90 mb-2">Consider mentioning:</div>
                    <ul className="space-y-1.5">
                      {proactiveSuggestions.map((suggestion, idx) => (
                        <li key={idx} className="text-[10px] text-white/80 flex items-start gap-1.5">
                          <span className="text-white/50 mt-0.5">•</span>
                          <span>{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
            
            {/* Loading suggestions indicator */}
            {isLoadingSuggestions && proactiveSuggestions.length === 0 && (
              <div className="flex gap-2">
                <div className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs bg-slate-700/50">
                  💡
                </div>
                <div className="flex-1 rounded-lg p-2 text-[10px] bg-slate-700/50 text-white/50">
                  Loading suggestions...
                </div>
              </div>
            )}
          </div>
          
          {/* AI Chat Input - Only show if answer exists or for special sections */}
          {((!isSpecialSection && activeQuestion && activeQuestion.answer?.trim()) || isSpecialSection) && (
            <div className="border-t border-white/20 p-2.5 bg-slate-800/50">
              <div className="flex gap-1.5">
                <input
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleChatSend();
                    }
                  }}
                  placeholder={
                    isSpecialSection
                      ? isMetadataSection
                        ? 'Ask about title page, formatting, or design...'
                        : isReferencesSection
                        ? 'Ask about citations, references, or attachments...'
                        : isAppendicesSection
                        ? 'Ask about appendices organization...'
                        : isAncillarySection
                        ? 'Ask about table of contents, lists, or document navigation...'
                        : 'How can I help you?'
                      : 'Ask AI for help...'
                  }
                  disabled={isAiLoading}
                  className="flex-1 px-2 py-1.5 rounded border border-white/20 bg-slate-800/50 text-white text-[10px] placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <Button
                  onClick={handleChatSend}
                  disabled={isAiLoading || !aiInput.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] px-3 py-1.5 rounded"
                >
                  Send
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Actions Footer */}
        <div className="flex flex-wrap gap-2 p-2.5 border-t border-white/20 bg-slate-800/50">
          {/* Progress indicator */}
          {!isSpecialSection && section && (
            <div className="w-full text-[10px] text-white/70 mb-2">
              Progress: {answeredCount}/{totalQuestions} questions answered ({completionPercentage}%)
            </div>
          )}
          {!isComplete && (
            <Button
              variant="success"
              onClick={handleComplete}
              className="bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-4 py-2 rounded-lg flex-1"
            >
              {isLastQuestion ? '✓ Complete Section' : '✓ Complete'}
            </Button>
          )}
          {!isComplete && (
            <Button
              variant="outline"
              onClick={handleSkipClick}
              className="text-white/80 border-white/20 bg-slate-700/50 hover:bg-slate-700 text-xs font-semibold px-3 py-2 rounded-lg"
            >
              {isUnknown ? 'Clear Skip' : 'Skip'}
            </Button>
          )}
        </div>
        
        {/* Skip Reason Dialog */}
        <Dialog open={showSkipDialog} onOpenChange={setShowSkipDialog}>
          <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
            <DialogHeader>
              <DialogTitle className="text-white">Skip this question?</DialogTitle>
              <DialogDescription className="text-white/70">
                Why are you skipping this question? This helps us improve the experience.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Skip Reason Options */}
              <div className="space-y-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="skipReason"
                    value="not_applicable"
                    checked={skipReason === 'not_applicable'}
                    onChange={(e) => setSkipReason(e.target.value as typeof skipReason)}
                    className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-white/90">Not applicable to my business</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="skipReason"
                    value="later"
                    checked={skipReason === 'later'}
                    onChange={(e) => setSkipReason(e.target.value as typeof skipReason)}
                    className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-white/90">I'll come back to this later</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="skipReason"
                    value="unclear"
                    checked={skipReason === 'unclear'}
                    onChange={(e) => setSkipReason(e.target.value as typeof skipReason)}
                    className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-white/90">I don't understand the question</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="skipReason"
                    value="other"
                    checked={skipReason === 'other'}
                    onChange={(e) => setSkipReason(e.target.value as typeof skipReason)}
                    className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-white/90">Other reason...</span>
                </label>
              </div>
              
              {/* Optional Note */}
              <div>
                <label className="block text-sm text-white/70 mb-1">Optional note:</label>
                <textarea
                  value={skipNote}
                  onChange={(e) => setSkipNote(e.target.value)}
                  placeholder="Add any additional context..."
                  className="w-full min-h-[60px] rounded-lg border border-white/20 bg-slate-700/50 p-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowSkipDialog(false);
                  setSkipReason(null);
                  setSkipNote('');
                }}
                className="text-white/80 border-white/20 bg-slate-700/50 hover:bg-slate-700"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSkipConfirm}
                disabled={!skipReason}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Skip Question
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );

  // Render directly in page (absolute positioning relative to preview-container)
  // No portal needed - preview-container has overflow-visible and position: relative
  return editorContent;
}


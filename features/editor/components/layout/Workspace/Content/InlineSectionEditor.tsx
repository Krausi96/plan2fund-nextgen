import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
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

const EDITOR_WIDTH = 600; // Wider panel for better readability
const EDITOR_MAX_HEIGHT = 420; // Keep current height
const GAP = 24; // Spacing from edges

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
  // Initialize position - ALWAYS visible when plan exists (show welcome state if no sectionId)
  const [position, setPosition] = useState<EditorPosition>(() => ({
    top: 24,
    left: typeof window !== 'undefined' ? window.innerWidth - EDITOR_WIDTH - GAP : 0,
    placement: 'right',
    visible: true // ALWAYS start visible - show welcome state if sectionId is null
  }));
  const editorRef = useRef<HTMLDivElement>(null);
  const positionUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOverTarget, setDragOverTarget] = useState<'logo' | 'attachment' | null>(null);
  const [isPanelDragging, setIsPanelDragging] = useState(false);
  const dragStartPos = useRef<{ x: number; y: number; startLeft: number; startTop: number } | null>(null);
  
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
  
  // Question expandable state (for showing full question)
  const [isQuestionExpanded, setIsQuestionExpanded] = useState(false);
  
  // Suggestions collapsible state - default to expanded
  const [isSuggestionsExpanded, setIsSuggestionsExpanded] = useState(true);
  
  // Skip dialog state
  const [showSkipDialog, setShowSkipDialog] = useState(false);
  const [skipReason, setSkipReason] = useState<'not_applicable' | 'later' | 'unclear' | 'other' | null>(null);
  const [skipNote, setSkipNote] = useState('');
  
  // Collapsible actions state - track which messages have expanded actions
  const [expandedActions, setExpandedActions] = useState<Set<string>>(new Set());

  // Check if this is a metadata or ancillary section
  const isMetadataSection = sectionId === METADATA_SECTION_ID;
  const isAncillarySection = sectionId === ANCILLARY_SECTION_ID;
  const isReferencesSection = sectionId === REFERENCES_SECTION_ID;
  const isAppendicesSection = sectionId === APPENDICES_SECTION_ID;
  const isSpecialSection = isMetadataSection || isAncillarySection || isReferencesSection || isAppendicesSection;

  const activeQuestion = section?.questions.find((q) => q.id === activeQuestionId) ?? section?.questions[0] ?? null;
  const template = section ? templates.find((tpl) => tpl.id === section.id) : null;

  // Phase 2: Center-bottom positioning with draggable support
  // Panel should ALWAYS be visible when plan exists (show welcome state if no sectionId)
  const calculatePosition = useCallback(() => {
    const isDesktop = window.innerWidth > 768;
    
    // Phase 2: Default to center-bottom of viewport
    let top = typeof window !== 'undefined' 
      ? window.innerHeight - EDITOR_MAX_HEIGHT - GAP 
      : GAP;
    let left = typeof window !== 'undefined' 
      ? (window.innerWidth - EDITOR_WIDTH) / 2 
      : GAP;
    
    // Try to load saved position from localStorage (only if user has moved it)
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('inline-editor-position');
        if (saved) {
          const parsed = JSON.parse(saved);
          // Only use saved position if it's significantly different from default (user moved it)
          const defaultLeft = (window.innerWidth - EDITOR_WIDTH) / 2;
          const defaultTop = window.innerHeight - EDITOR_MAX_HEIGHT - GAP;
          const diffX = Math.abs(parsed.left - defaultLeft);
          const diffY = Math.abs(parsed.top - defaultTop);
          
          // If user moved it more than 50px, use saved position
          if ((diffX > 50 || diffY > 50) && 
              parsed.top >= 0 && parsed.top < window.innerHeight && 
              parsed.left >= 0 && parsed.left < window.innerWidth) {
            top = parsed.top;
            left = parsed.left;
          }
        }
      } catch (e) {
        // Ignore localStorage errors
      }
    }
    
    // Ensure editor stays within viewport
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1920;
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 1080;
    
    left = Math.max(GAP, Math.min(left, viewportWidth - EDITOR_WIDTH - GAP));
    top = Math.max(GAP, Math.min(top, viewportHeight - EDITOR_MAX_HEIGHT - GAP));
    
    // ALWAYS set visible to true - component should always be visible when plan exists
    setPosition({
      top: Math.max(0, top),
      left: Math.max(0, left),
      placement: isDesktop ? 'right' : 'below',
      visible: true // ALWAYS visible when plan exists
    });
  }, []);

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

  // Update position on mount, section change, and resize
  // ALWAYS visible when plan exists (show welcome state if no sectionId)
  useEffect(() => {
    // IMMEDIATELY set visible - component should always be visible when plan exists
    setPosition(prev => ({
      ...prev,
      visible: true, // ALWAYS visible
      top: prev.top || 24,
      left: prev.left || (typeof window !== 'undefined' ? window.innerWidth - EDITOR_WIDTH - GAP : 0)
    }));

    // Calculate position once after a short delay to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      calculatePosition();
    }, 150);

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

  // Auto-collapse suggestions side panel on narrow screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 500) {
        setIsSuggestionsExpanded(false);
      }
    };
    window.addEventListener('resize', handleResize);
    // Check on mount
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  // Phase 2: Panel dragging functionality
  const handlePanelMouseDown = useCallback((e: React.MouseEvent) => {
    // Only drag from header area, not buttons or details
    if (e.target instanceof HTMLElement && (
      e.target.closest('button') || 
      e.target.closest('details') ||
      e.target.closest('summary')
    )) {
      return;
    }
    
    setIsPanelDragging(true);
    dragStartPos.current = {
      x: e.clientX,
      y: e.clientY,
      startLeft: position.left,
      startTop: position.top
    };
    e.preventDefault();
  }, [position]);

  useEffect(() => {
    if (!isPanelDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStartPos.current) return;
      
      const deltaX = e.clientX - dragStartPos.current.x;
      const deltaY = e.clientY - dragStartPos.current.y;
      
      const newLeft = dragStartPos.current.startLeft + deltaX;
      const newTop = dragStartPos.current.startTop + deltaY;
      
      // Keep within viewport
      const maxLeft = window.innerWidth - EDITOR_WIDTH - GAP;
      const maxTop = window.innerHeight - EDITOR_MAX_HEIGHT - GAP;
      
      const clampedLeft = Math.max(GAP, Math.min(newLeft, maxLeft));
      const clampedTop = Math.max(GAP, Math.min(newTop, maxTop));
      
      setPosition(prev => ({
        ...prev,
        left: clampedLeft,
        top: clampedTop
      }));
    };

    const handleMouseUp = () => {
      setIsPanelDragging(false);
      if (dragStartPos.current && editorRef.current) {
        // Save position to localStorage
        try {
          localStorage.setItem('inline-editor-position', JSON.stringify({
            left: position.left,
            top: position.top
          }));
        } catch (e) {
          // Ignore localStorage errors
        }
      }
      dragStartPos.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isPanelDragging, position]);

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

  // Ensure editor is visible when plan exists
  // Hide only for ANCILLARY section (TOC/list of tables - auto-generated, no editing needed)
  // Show welcome state if sectionId is null
  useEffect(() => {
    if (isAncillarySection) {
      // Hide only for ANCILLARY section
      setPosition(prev => ({ ...prev, visible: false }));
    } else {
      // ALWAYS visible - show welcome state if sectionId is null, editor if sectionId exists
      setPosition(prev => ({ ...prev, visible: true }));
    }
  }, [sectionId, isAncillarySection]);

  // Debug logging - after all variables are declared
  useEffect(() => {
    console.log('[InlineSectionEditor] Render state:', {
      sectionId,
      hasSection: !!section,
      positionVisible: position.visible,
      positionTop: position.top,
      positionLeft: position.left,
      isAncillarySection,
      willShowWelcome: !sectionId,
      willShowEditor: !!sectionId && !isAncillarySection
    });
  }, [sectionId, section, position, isAncillarySection]);

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
        // Phase 4: Limit to 3-4 suggestions (better quality over quantity)
        setProactiveSuggestions(suggestionLines.slice(0, 4));
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
          : 'How can I assist you with this section?',
        timestamp: new Date().toISOString(),
        type: 'suggestion'
      };
      setAiMessages([welcomeMessage]);
      setAiInput('');
      setAssistantContext(isMetadataSection ? 'design' : isReferencesSection ? 'references' : 'content');
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
    // Phase 3: Load existing answer into input field
    setAiInput(activeQuestion.answer || '');
    
    // Reset AI usage tracking when question changes
    setHasUsedAI(false);
    setProactiveSuggestions([]);
    // Reset expanded actions when question changes
    setExpandedActions(new Set());
    // Reset question expanded state
    setIsQuestionExpanded(false);
    // Reset suggestions expanded state
    setIsSuggestionsExpanded(false);
    
    // Phase 4: Load proactive suggestions when question loads (so they appear below question)
    if (!isSpecialSection && activeQuestion) {
      requestProactiveSuggestions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeQuestionId, sectionId, isSpecialSection, isMetadataSection, isReferencesSection, isAppendicesSection]);

  // Create callbacks object for parseAIActions
  const aiActionCallbacks: AIActionCallbacks = useMemo(() => ({
    onDatasetCreate: _onDatasetCreate,
    onKpiCreate: _onKpiCreate,
    onMediaCreate: onMediaCreate,
    onReferenceAdd: _onReferenceAdd
  }), [_onDatasetCreate, _onKpiCreate, onMediaCreate, _onReferenceAdd]);

  // Panel should ALWAYS be visible when plan exists
  // If no sectionId, show welcome/empty state
  // Never return null - always render something when plan exists
  
  // Show welcome state if no section selected
  if (!sectionId) {
    return (
      <div
        ref={editorRef}
        className="absolute z-20 rounded-2xl border-2 border-blue-400/60 bg-slate-900/95 backdrop-blur-xl shadow-2xl overflow-hidden transition-all"
        style={{
          top: position.top > 0 ? `${position.top}px` : '24px',
          left: position.left > 0 ? `${position.left}px` : 'auto',
          right: position.left === 0 || position.left < 100 ? '24px' : 'auto',
          width: `${EDITOR_WIDTH}px`,
          height: `${EDITOR_MAX_HEIGHT}px`,
          position: 'fixed',
          overflowY: 'auto',
          overflowX: 'hidden',
          zIndex: 9999,
          display: 'block',
          opacity: 1,
          visibility: 'visible'
        }}
      >
        <div className="relative h-full flex flex-col bg-slate-900/95 backdrop-blur-xl">
          <div className="p-2.5 border-b border-white/20 bg-gradient-to-r from-slate-800/90 to-slate-900/90">
            <div className="flex items-center justify-between mb-1.5">
              <h2 className="text-sm font-semibold text-white truncate flex-1 min-w-0">Editor</h2>
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
          </div>
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center">
              <div className="text-4xl mb-4">📝</div>
              <h3 className="text-lg font-semibold text-white mb-2">Select a Section</h3>
              <p className="text-sm text-white/70">
                Choose a section from the sidebar to start editing
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Type guards for normal sections
  const isUnknown = !isSpecialSection && activeQuestion ? activeQuestion.status === 'unknown' : false;
  const isComplete = !isSpecialSection && activeQuestion ? activeQuestion.status === 'complete' : false;
  // Removed isLastQuestion - not used after UI simplification

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
        // Phase 5: Auto-expand actions when AI suggests them
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
        // Phase 5: Auto-expand actions when AI suggests them
        if (actions.length > 0) {
          setExpandedActions(prev => new Set([...prev, suggestionMessage.id]));
        }
        
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
        // Phase 5: Auto-expand actions when AI suggests them
        if (actions.length > 0) {
          setExpandedActions(prev => new Set([...prev, assistantMessage.id]));
        }
        
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

  // Force visibility - component should ALWAYS be visible when plan exists
  // Only hide for ANCILLARY section
  const shouldBeVisible = !isAncillarySection;
  const effectiveVisible = shouldBeVisible && position.visible;

  // Debug: Log render state
  useEffect(() => {
    if (editorRef.current) {
      const rect = editorRef.current.getBoundingClientRect();
      const computed = window.getComputedStyle(editorRef.current);
      console.log('[InlineSectionEditor] DOM state:', {
        exists: !!editorRef.current,
        visible: effectiveVisible,
        display: computed.display,
        opacity: computed.opacity,
        visibility: computed.visibility,
        zIndex: computed.zIndex,
        position: computed.position,
        top: computed.top,
        left: computed.left,
        rect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
        inViewport: rect.top >= 0 && rect.left >= 0 && rect.top < window.innerHeight && rect.left < window.innerWidth
      });
    }
  }, [effectiveVisible, position]);

  const editorContent = (
    <div
      ref={editorRef}
      className={`absolute z-20 rounded-2xl border-2 ${
        isDragging 
          ? 'border-blue-500 border-dashed bg-blue-900/50' 
          : 'border-blue-400/60 bg-slate-900/95'
      } backdrop-blur-xl shadow-2xl overflow-hidden transition-all`}
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        width: `${EDITOR_WIDTH}px`,
        height: `${EDITOR_MAX_HEIGHT}px`,
        position: 'fixed',
        overflow: 'hidden',
        zIndex: 9999,
        display: effectiveVisible ? 'flex' : 'none',
        flexDirection: 'column',
        opacity: effectiveVisible ? 1 : 0,
        visibility: effectiveVisible ? 'visible' : 'hidden',
        pointerEvents: effectiveVisible ? 'auto' : 'none',
        cursor: isPanelDragging ? 'grabbing' : 'default',
        userSelect: isPanelDragging ? 'none' : 'auto'
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
      <div className="relative h-full flex flex-col bg-slate-900/95 backdrop-blur-xl overflow-hidden">
        {/* Header - Simplified: Title, Navigation, Close */}
        <div 
          className="p-2.5 border-b border-white/20 bg-gradient-to-r from-slate-800/90 to-slate-900/90 cursor-move select-none flex-shrink-0"
          onMouseDown={handlePanelMouseDown}
        >
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-white truncate flex-1 min-w-0">
              {section?.title || 'Section'}
            </h2>
            
            {/* Question Navigation - Inline with title */}
            {!isSpecialSection && section && section.questions.length > 1 && (
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {section.questions.map((q, index) => {
                  const isActive = q.id === activeQuestionId;
                  const status = q.status;
                  return (
                    <button
                      key={q.id}
                      onClick={() => onSelectQuestion(q.id)}
                      className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-all ${
                        isActive
                          ? 'border-blue-500 bg-blue-500 text-white shadow-md'
                          : 'border-white/20 bg-slate-700/50 text-white/80 hover:border-blue-400 hover:bg-slate-700'
                      }`}
                    >
                      <span>{index + 1}</span>
                      {status === 'complete' && <span className="text-xs">✅</span>}
                      {status === 'unknown' && <span className="text-xs">❓</span>}
                    </button>
                  );
                })}
              </div>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white/70 hover:bg-white/10 hover:text-white flex-shrink-0 h-6 w-6 p-0"
              aria-label="Close editor"
            >
              ✕
            </Button>
          </div>
        </div>

        {/* Suggestions removed from here - moved to side panel */}

        {/* Question Section - Compact, separate section */}
        {!isSpecialSection && activeQuestion && (
          <div className="border-b border-white/20 p-3 bg-slate-800/50 flex-shrink-0">
            <div className="text-sm font-semibold text-white/90">
              ❓ {isQuestionExpanded ? activeQuestion.prompt : simplifyPrompt(activeQuestion.prompt || '')}
            </div>
            {activeQuestion.prompt && activeQuestion.prompt.length > 80 && (
              <button
                onClick={() => setIsQuestionExpanded(!isQuestionExpanded)}
                className="text-xs text-white/60 hover:text-white/80 mt-1 flex items-center gap-1"
              >
                {isQuestionExpanded ? 'Show less ▲' : 'Show full question ▼'}
              </button>
            )}
          </div>
        )}

        {/* Chat Area with Side Panel - Restructured */}
        <div className="flex-1 flex overflow-hidden bg-slate-900/95 min-h-0">
          {/* Chat Messages (left) */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
            {/* Chat Messages - Filter out question and answer messages (only show AI messages) */}
            {aiMessages.filter(msg => msg.type !== 'question' && msg.type !== 'answer').length === 0 && !isAiLoading && (
              <div className="flex items-center justify-center h-full min-h-[80px]">
                <div className="text-center text-white/40 text-sm">
                  <div className="mb-2">💬</div>
                  <div>AI suggestions will appear here</div>
                </div>
              </div>
            )}
            {aiMessages.filter(msg => msg.type !== 'question' && msg.type !== 'answer').map((msg) => {
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
                          onClick={() => {
                            setExpandedActions(prev => {
                              const next = new Set(prev);
                              if (isActionsExpanded) {
                                next.delete(msg.id);
                              } else {
                                next.add(msg.id);
                              }
                              return next;
                            });
                          }}
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
            {isAiLoading && (
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
          
          {/* Suggestions Side Panel (right) */}
          {!isSpecialSection && activeQuestion && (proactiveSuggestions.length > 0 || isLoadingSuggestions) && (
            <div className={`
              flex-shrink-0 border-l border-white/20 bg-slate-800/60
              transition-all duration-200
              ${isSuggestionsExpanded ? 'w-[180px]' : 'w-[40px]'}
            `}>
              {/* Header */}
              <div className="p-2 bg-slate-700/50 border-b border-white/10">
                <button
                  onClick={() => setIsSuggestionsExpanded(!isSuggestionsExpanded)}
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
                          onClick={() => {
                            // Add suggestion to input field
                            setAiInput(prev => {
                              const current = prev.trim();
                              if (current) {
                                return `${current}\n\n${suggestion}`;
                              }
                              return suggestion;
                            });
                            // Remove suggestion after adding
                            setProactiveSuggestions(prev => prev.filter((_, i) => i !== idx));
                          }}
                          className="w-full text-left text-xs text-white/80 bg-slate-700/50 hover:bg-slate-600/70 border border-white/10 rounded px-2 py-1.5 transition-colors"
                        >
                          • {suggestion}
                        </button>
                      ))}
                      {proactiveSuggestions.length > 0 && (
                        <button
                          onClick={() => {
                            // Add all suggestions
                            const allSuggestions = proactiveSuggestions.join('\n\n');
                            setAiInput(prev => {
                              const current = prev.trim();
                              if (current) {
                                return `${current}\n\n${allSuggestions}`;
                              }
                              return allSuggestions;
                            });
                            setProactiveSuggestions([]);
                          }}
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
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    handleChatSend();
                  }
                }}
                placeholder={
                  isSpecialSection
                    ? isMetadataSection
                      ? 'Type your answer or ask about title page, formatting, or design...'
                      : isReferencesSection
                      ? 'Type your answer or ask about citations, references, or attachments...'
                      : 'Type your answer or ask for help...'
                    : !isSpecialSection && activeQuestion && !activeQuestion.answer?.trim()
                    ? 'Type your answer here or ask AI to improve it...'
                    : 'Type your answer or ask AI for help...'
                }
                disabled={isAiLoading}
                rows={3}
                className="flex-1 px-3 py-2 rounded-lg border-2 border-white/30 bg-slate-900/80 text-white text-sm placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              />
              <Button
                onClick={handleChatSend}
                disabled={isAiLoading || !aiInput.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg self-end font-semibold shadow-lg hover:shadow-xl transition-all flex-shrink-0"
              >
                Send
              </Button>
            </div>
          </div>

        {/* Actions Footer - Phase 2: Simplified */}
        {!isSpecialSection && section && !isComplete && (
          <div className="flex items-center justify-between gap-2 p-2.5 border-t border-white/20 bg-slate-800/50 flex-shrink-0">
            <div className="text-xs text-white/70">
              {answeredCount}/{totalQuestions} ({completionPercentage}%)
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleSkipClick}
                className="text-white/80 border-white/20 bg-slate-700/50 hover:bg-slate-700 text-xs px-3 py-1.5 rounded"
              >
                {isUnknown ? 'Clear' : 'Skip'}
              </Button>
              <Button
                variant="success"
                onClick={handleComplete}
                className="bg-green-600 hover:bg-green-700 text-white text-xs px-4 py-1.5 rounded"
              >
                ✓ Complete
              </Button>
            </div>
          </div>
        )}
        
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

  // Render via portal to escape CSS containment
  if (typeof window === 'undefined') {
    return editorContent;
  }

  return createPortal(editorContent, document.body);
}


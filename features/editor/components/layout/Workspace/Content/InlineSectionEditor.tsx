import React, { useEffect, useRef, useState, useCallback } from 'react';
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
import { generateSectionContent } from '@/features/editor/engine/sectionAiClient';
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

const EDITOR_WIDTH = 320;
const EDITOR_MAX_HEIGHT = 360; // Reduced from 420 to make tabs visible without scrolling
const GAP = 16;

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
  onAttachDataset,
  onAttachKpi,
  onAttachMedia,
  progressSummary: _progressSummary = []
}: InlineSectionEditorProps) {
  // const { t } = useI18n();
  const { templates } = useEditorStore();
  const [position, setPosition] = useState<EditorPosition>({
    top: 0,
    left: 0,
    placement: 'right',
    visible: false
  });
  const editorRef = useRef<HTMLDivElement>(null);
  const positionUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOverTarget, setDragOverTarget] = useState<'logo' | 'attachment' | null>(null);
  
  // AI state
  const [aiMessages, setAiMessages] = useState<ConversationMessage[]>([]);
  const [aiInput, setAiInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  
  // Assistant panel state (context detection - Phase 3)
  const [assistantContext, setAssistantContext] = useState<'content' | 'design' | 'references' | 'questions'>('content');
  
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
  
  // Validation
  const validation = activeQuestion && template && section
    ? validateQuestionRequirements(activeQuestion, section, template)
    : null;

  // Calculate position relative to question element in preview (sticky positioning)
  const calculatePosition = useCallback(() => {
    const scrollContainer = document.getElementById('preview-scroll-container');
    if (!scrollContainer || !sectionId) {
      setPosition(prev => ({ ...prev, visible: false }));
      return;
    }
    
    // For special sections, position relative to section element
    if (isSpecialSection) {
      const sectionElement = scrollContainer.querySelector(
        `[data-section-id="${sectionId}"]`
      ) as HTMLElement;
      
      if (!sectionElement) {
        setPosition(prev => ({ ...prev, visible: false }));
        return;
      }
      
      const sectionRect = sectionElement.getBoundingClientRect();
      const scrollRect = scrollContainer.getBoundingClientRect();
      const scrollTop = scrollContainer.scrollTop || 0;
      const scrollLeft = scrollContainer.scrollLeft || 0;
      const isDesktop = window.innerWidth > 768;
      const gap = 20;
      
      if (isDesktop) {
        const left = scrollLeft + sectionRect.right - scrollRect.left + gap;
        const top = scrollTop + sectionRect.top - scrollRect.top;
        
        const maxLeft = scrollLeft + scrollContainer.scrollWidth - EDITOR_WIDTH - GAP;
        const finalLeft = Math.max(scrollLeft + GAP, Math.min(maxLeft, left));
        const finalTop = Math.max(scrollTop + GAP, Math.min(
          scrollTop + scrollContainer.scrollHeight - EDITOR_MAX_HEIGHT - GAP,
          top
        ));
        
        setPosition({
          top: finalTop,
          left: finalLeft,
          placement: 'right',
          visible: true
        });
      } else {
        const left = scrollLeft + sectionRect.left - scrollRect.left;
        const top = scrollTop + sectionRect.bottom - scrollRect.top + gap;
        
        const maxLeft = scrollLeft + scrollContainer.scrollWidth - EDITOR_WIDTH - GAP;
        const finalLeft = Math.max(scrollLeft + GAP, Math.min(maxLeft, left));
        const finalTop = Math.max(scrollTop + GAP, Math.min(
          scrollTop + scrollContainer.scrollHeight - EDITOR_MAX_HEIGHT - GAP,
          top
        ));
        
        setPosition({
          top: finalTop,
          left: finalLeft,
          placement: 'below',
          visible: true
        });
      }
      return;
    }
    
    // For normal sections, require activeQuestionId
    if (!activeQuestionId) {
      setPosition(prev => ({ ...prev, visible: false }));
      return;
    }

    // Find the question element in the preview
    const questionElement = scrollContainer.querySelector(
      `h4.section-subchapter[data-question-id="${activeQuestionId}"]`
    ) as HTMLElement;
    
    if (!questionElement) {
      // Fallback: try to find section element
      const sectionElement = scrollContainer.querySelector(
        `[data-section-id="${sectionId}"]`
      ) as HTMLElement;
      
      if (!sectionElement) {
        setPosition(prev => ({ ...prev, visible: false }));
        return;
      }
      
      // Use section element as fallback
      const sectionRect = sectionElement.getBoundingClientRect();
      const scrollRect = scrollContainer.getBoundingClientRect();
      const scrollTop = scrollContainer.scrollTop || 0;
      const scrollLeft = scrollContainer.scrollLeft || 0;
      
      // Position to right of section on desktop, below on mobile
      const isDesktop = window.innerWidth > 768;
      const gap = 20;
      
      if (isDesktop) {
        const left = scrollLeft + sectionRect.right - scrollRect.left + gap;
        const top = scrollTop + sectionRect.top - scrollRect.top;
        
        // Ensure editor doesn't go outside scroll container bounds
        const maxLeft = scrollLeft + scrollContainer.scrollWidth - EDITOR_WIDTH - GAP;
        const finalLeft = Math.max(scrollLeft + GAP, Math.min(maxLeft, left));
        const finalTop = Math.max(scrollTop + GAP, Math.min(
          scrollTop + scrollContainer.scrollHeight - EDITOR_MAX_HEIGHT - GAP,
          top
        ));
        
        setPosition({
          top: finalTop,
          left: finalLeft,
          placement: 'right',
          visible: true
        });
      } else {
        // Mobile: position below
        const left = scrollLeft + sectionRect.left - scrollRect.left;
        const top = scrollTop + sectionRect.bottom - scrollRect.top + gap;
        
        const maxLeft = scrollLeft + scrollContainer.scrollWidth - EDITOR_WIDTH - GAP;
        const finalLeft = Math.max(scrollLeft + GAP, Math.min(maxLeft, left));
        const finalTop = Math.max(scrollTop + GAP, Math.min(
          scrollTop + scrollContainer.scrollHeight - EDITOR_MAX_HEIGHT - GAP,
          top
        ));
        
        setPosition({
          top: finalTop,
          left: finalLeft,
          placement: 'below',
          visible: true
        });
      }
      return;
    }
    
    // Position relative to question element
    const questionRect = questionElement.getBoundingClientRect();
    const scrollRect = scrollContainer.getBoundingClientRect();
    const scrollTop = scrollContainer.scrollTop || 0;
    const scrollLeft = scrollContainer.scrollLeft || 0;
    
    // Determine placement based on screen size
    const isDesktop = window.innerWidth > 768;
    const gap = 20;
    
    if (isDesktop) {
      // Desktop: position to right of question
      // Calculate position relative to scroll container
      const left = scrollLeft + questionRect.right - scrollRect.left + gap;
      const top = scrollTop + questionRect.top - scrollRect.top;
      
      // Ensure editor doesn't go outside scroll container bounds
      const maxLeft = scrollLeft + scrollContainer.scrollWidth - EDITOR_WIDTH - GAP;
      const finalLeft = Math.max(scrollLeft + GAP, Math.min(maxLeft, left));
      
      // Keep editor aligned with question top, but ensure it's visible
      const finalTop = Math.max(scrollTop + GAP, Math.min(
        scrollTop + scrollContainer.scrollHeight - EDITOR_MAX_HEIGHT - GAP,
        top
      ));
      
      setPosition({
        top: finalTop,
        left: finalLeft,
        placement: 'right',
        visible: true
      });
    } else {
      // Tablet/Mobile: position below question
      const left = scrollLeft + questionRect.left - scrollRect.left;
      const top = scrollTop + questionRect.bottom - scrollRect.top + gap;
      
      // On mobile, use full width (minus padding)
      const mobileWidth = Math.min(EDITOR_WIDTH, scrollRect.width - GAP * 2);
      
      const finalLeft = Math.max(scrollLeft + GAP, Math.min(
        scrollLeft + scrollContainer.scrollWidth - mobileWidth - GAP,
        left
      ));
      const finalTop = Math.max(scrollTop + GAP, Math.min(
        scrollTop + scrollContainer.scrollHeight - EDITOR_MAX_HEIGHT - GAP,
        top
      ));
      
      setPosition({
        top: finalTop,
        left: finalLeft,
        placement: 'below',
        visible: true
      });
    }
  }, [activeQuestionId, sectionId]);

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

  // Update position on mount, section/question change, scroll, and resize
  useEffect(() => {
    if (!sectionId) {
      setPosition(prev => ({ ...prev, visible: false }));
      return;
    }

    let retryCount = 0;
    const MAX_RETRIES = 5;
    const RETRY_DELAY = 100;

    const tryCalculatePosition = () => {
      const scrollContainer = document.getElementById('preview-scroll-container');
      if (!scrollContainer) {
        if (retryCount < MAX_RETRIES) {
          retryCount++;
          setTimeout(tryCalculatePosition, RETRY_DELAY);
        }
        return;
      }

      // Check if target element exists
      let elementFound = false;
      if (activeQuestionId) {
        elementFound = !!(
          scrollContainer.querySelector(`[data-question-id="${activeQuestionId}"]`) ||
          document.querySelector(`[data-question-id="${activeQuestionId}"]`)
        );
      }
      if (!elementFound) {
        elementFound = !!(
          scrollContainer.querySelector(`[data-section-id="${sectionId}"]`) ||
          document.querySelector(`[data-section-id="${sectionId}"]`)
        );
      }

      if (!elementFound && retryCount < MAX_RETRIES) {
        retryCount++;
        setTimeout(tryCalculatePosition, RETRY_DELAY);
        return;
      }

      // Calculate position
      calculatePosition();
    };

    // Initial position calculation - wait for DOM to be ready with retry logic
    const timeoutId = setTimeout(() => {
      tryCalculatePosition();
    }, 100);

    // Set up scroll and resize listeners
    const scrollContainer = document.getElementById('preview-scroll-container');

    const handleScroll = () => {
      if (positionUpdateTimeoutRef.current) {
        clearTimeout(positionUpdateTimeoutRef.current);
      }
      positionUpdateTimeoutRef.current = setTimeout(() => {
        calculatePosition();
      }, 16); // Throttle to ~60fps
    };

    const handleResize = () => {
      if (positionUpdateTimeoutRef.current) {
        clearTimeout(positionUpdateTimeoutRef.current);
      }
      positionUpdateTimeoutRef.current = setTimeout(() => {
        calculatePosition();
      }, 100);
    };

    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    }
    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(timeoutId);
      if (positionUpdateTimeoutRef.current) {
        clearTimeout(positionUpdateTimeoutRef.current);
      }
      if (scrollContainer) {
        scrollContainer.removeEventListener('scroll', handleScroll);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, [sectionId, activeQuestionId, calculatePosition]);

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

  // Immediately hide editor if sectionId is null or a metadata section
  useEffect(() => {
    if (!sectionId || isSpecialSection) {
      setPosition(prev => ({ ...prev, visible: false }));
    }
  }, [sectionId, isSpecialSection]);

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
  }, [activeQuestionId, activeQuestion?.prompt, activeQuestion?.answer, sectionId, isSpecialSection, isMetadataSection, isReferencesSection, isAppendicesSection]);

  // Phase 3: AI Context Detection - Must be before early returns (React hooks rule)
  const detectAIContext = useCallback((message: string): 'content' | 'design' | 'references' | 'questions' => {
    const lowerMessage = message.toLowerCase();
    
    // Design context keywords
    const designKeywords = ['design', 'format', 'formatting', 'page number', 'page numbers', 'title page', 'logo', 'header', 'footer', 'font', 'style', 'layout', 'appearance', 'visual'];
    if (designKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return 'design';
    }
    
    // References context keywords
    const referencesKeywords = ['reference', 'references', 'citation', 'citations', 'cite', 'source', 'sources', 'bibliography', 'attach', 'attachment', 'link', 'url'];
    if (referencesKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return 'references';
    }
    
    // Questions context keywords
    const questionsKeywords = ['question', 'questions', 'hide', 'show', 'reorder', 'customize', 'edit prompt', 'change question', 'remove question', 'add question'];
    if (questionsKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return 'questions';
    }
    
    // Default to content context
    return 'content';
  }, []);

  // Phase 4: Parse AI response for actionable suggestions - Must be before early returns (React hooks rule)
  const parseAIActions = useCallback((content: string, section: Section | null): Array<{
    label: string;
    action: string;
    icon?: string;
    onClick: () => void;
  }> => {
    const actions: Array<{
      label: string;
      action: string;
      icon?: string;
      onClick: () => void;
    }> = [];
    
    if (!section) return actions;
    
    const lowerContent = content.toLowerCase();
    
    // Check for table/dataset suggestions
    if (lowerContent.includes('table') || lowerContent.includes('dataset') || lowerContent.includes('data table') || lowerContent.includes('spreadsheet')) {
      actions.push({
        label: 'Create Table',
        action: 'create_table',
        icon: '📊',
        onClick: () => {
          if (_onDatasetCreate && section) {
            const newDataset: Dataset = {
              id: `dataset_${Date.now()}`,
              name: 'New Dataset',
              columns: [],
              rows: [],
              sectionId: section.id
            };
            _onDatasetCreate(newDataset);
          }
        }
      });
    }
    
    // Check for KPI suggestions
    if (lowerContent.includes('kpi') || lowerContent.includes('metric') || lowerContent.includes('indicator') || lowerContent.includes('measure')) {
      actions.push({
        label: 'Create KPI',
        action: 'create_kpi',
        icon: '📈',
        onClick: () => {
          if (_onKpiCreate && section) {
            const newKpi: KPI = {
              id: `kpi_${Date.now()}`,
              name: 'New KPI',
              value: 0,
              unit: '',
              sectionId: section.id
            };
            _onKpiCreate(newKpi);
          }
        }
      });
    }
    
    // Check for image/media suggestions
    if (lowerContent.includes('image') || lowerContent.includes('picture') || lowerContent.includes('chart') || lowerContent.includes('graph') || lowerContent.includes('visual') || lowerContent.includes('logo')) {
      actions.push({
        label: 'Add Image',
        action: 'add_image',
        icon: '🖼️',
        onClick: () => {
          if (onMediaCreate && section) {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = (e) => {
              const file = (e.target as HTMLInputElement).files?.[0];
              if (file) {
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
              }
            };
            input.click();
          }
        }
      });
    }
    
    // For metadata sections, add design-related actions
    if (isMetadataSection) {
      if (lowerContent.includes('page number') || lowerContent.includes('formatting') || lowerContent.includes('design')) {
        actions.push({
          label: 'Configure Formatting',
          action: 'configure_formatting',
          icon: '🎨',
          onClick: () => {
            // Formatting configuration would be handled by the parent component
            // For now, this is a placeholder that can be extended
            console.log('Configure formatting requested');
          }
        });
      }
    }
    
    // For references sections, add citation actions
    if (isReferencesSection) {
      if (lowerContent.includes('citation') || lowerContent.includes('reference') || lowerContent.includes('cite')) {
        actions.push({
          label: 'Add Citation',
          action: 'add_citation',
          icon: '📚',
          onClick: () => {
            if (_onReferenceAdd) {
              _onReferenceAdd({
                id: `ref_${Date.now()}`,
                title: 'New Reference',
                authors: '',
                year: new Date().getFullYear(),
                url: '',
                type: 'article'
              });
            }
          }
        });
      }
    }
    
    return actions;
  }, [_onDatasetCreate, _onKpiCreate, onMediaCreate, isMetadataSection, isReferencesSection, _onReferenceAdd]);

  // Early return if sectionId is null or not visible
  if (!sectionId || !position.visible) {
    return null;
  }

  // For special sections (metadata, references, etc.), show unified AI assistant
  // For normal sections, require activeQuestion
  if (!isSpecialSection && (!section || !activeQuestion)) {
    return null;
  }

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

  // Unused function - commented out to fix TypeScript error
  // const _handleAISuggestData = async () => {
  //   if (!activeQuestion || !section) return;
  //   setIsAiLoading(true);
  //   try {
  //     const response = await generateSectionContent({
  //       sectionTitle: section.title,
  //       context: `Suggest data structures for: ${activeQuestion.prompt}`,
  //       program: {
  //         id: plan.metadata?.programId,
  //         name: plan.metadata?.programName,
  //         type: plan.metadata?.templateFundingType || 'grant'
  //       },
  //       questionMeta: {
  //         questionPrompt: activeQuestion.prompt,
  //         questionStatus: activeQuestion.status
  //       },
  //       conversationHistory: aiMessages
  //     });
  //     
  //     const newMessage: ConversationMessage = {
  //       id: `ai_${Date.now()}`,
  //       role: 'assistant',
  //       content: response.content,
  //       timestamp: new Date().toISOString()
  //     };
  //     setAiMessages(prev => [...prev, newMessage]);
  //   } catch (error) {
  //     console.error('AI suggest data failed:', error);
  //     const errorMessage: ConversationMessage = {
  //       id: `error_${Date.now()}`,
  //       role: 'assistant',
  //       content: 'Sorry, I encountered an error. Please try again.',
  //       timestamp: new Date().toISOString()
  //     };
  //     setAiMessages(prev => [...prev, errorMessage]);
  //   } finally {
  //     setIsAiLoading(false);
  //   }
  // };

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
          conversationHistory: [...aiMessages, userMessage]
        });
        
        const actions = parseAIActions(response.content, section);
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
    
    // Check if this looks like an answer (first message after question, or explicit answer)
    const hasExistingAnswer = activeQuestion.answer && activeQuestion.answer.trim().length > 0;
    const isFirstUserMessage = aiMessages.filter(m => m.role === 'user').length === 0;
    
    // If it's the first user message and no existing answer, treat as answer
    if (isFirstUserMessage && !hasExistingAnswer) {
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
          conversationHistory: [...aiMessages, answerMessage]
        });
        
        // Phase 4: Parse AI response for actionable suggestions
        const actions = parseAIActions(response.content, section);
        
        // Always show suggestions, even if no specific actions detected
        // Add helpful suggestions based on answer content
        const helpfulActions = actions.length > 0 ? actions : [
          {
            label: 'Create Table',
            action: 'create_table',
            icon: '📊',
            onClick: () => {
              if (_onDatasetCreate && section) {
                const newDataset: Dataset = {
                  id: `dataset_${Date.now()}`,
                  name: 'New Dataset',
                  columns: [],
                  rows: [],
                  sectionId: section.id
                };
                _onDatasetCreate(newDataset);
              }
            }
          },
          {
            label: 'Add KPI',
            action: 'create_kpi',
            icon: '📈',
            onClick: () => {
              if (_onKpiCreate && section) {
                const newKpi: KPI = {
                  id: `kpi_${Date.now()}`,
                  name: 'New KPI',
                  value: 0,
                  unit: '',
                  sectionId: section.id
                };
                _onKpiCreate(newKpi);
              }
            }
          }
        ];
        
        const suggestionMessage: ConversationMessage = {
          id: `ai_${Date.now()}`,
          role: 'assistant',
          content: response.content || 'Great answer! Consider adding supporting data to strengthen your response.',
          timestamp: new Date().toISOString(),
          type: 'suggestion',
          metadata: {
            questionId: activeQuestion.id,
            actions: helpfulActions.length > 0 ? helpfulActions : undefined
          }
        };
        setAiMessages(prev => [...prev, suggestionMessage]);
      } catch (error) {
        console.error('AI analysis failed:', error);
        // Even on error, provide helpful suggestions
        const fallbackActions = [
          {
            label: 'Create Table',
            action: 'create_table',
            icon: '📊',
            onClick: () => {
              if (_onDatasetCreate && section) {
                const newDataset: Dataset = {
                  id: `dataset_${Date.now()}`,
                  name: 'New Dataset',
                  columns: [],
                  rows: [],
                  sectionId: section.id
                };
                _onDatasetCreate(newDataset);
              }
            }
          },
          {
            label: 'Add KPI',
            action: 'create_kpi',
            icon: '📈',
            onClick: () => {
              if (_onKpiCreate && section) {
                const newKpi: KPI = {
                  id: `kpi_${Date.now()}`,
                  name: 'New KPI',
                  value: 0,
                  unit: '',
                  sectionId: section.id
                };
                _onKpiCreate(newKpi);
              }
            }
          }
        ];
        
        const errorMessage: ConversationMessage = {
          id: `error_${Date.now()}`,
          role: 'assistant',
          content: 'I had trouble analyzing your answer, but you can still add supporting data to strengthen your response.',
          timestamp: new Date().toISOString(),
          type: 'suggestion',
          metadata: {
            questionId: activeQuestion.id,
            actions: fallbackActions
          }
        };
        setAiMessages(prev => [...prev, errorMessage]);
      } finally {
        setIsAiLoading(false);
      }
    } else {
      // Regular AI chat message
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
          conversationHistory: [...aiMessages, userMessage]
        });
        
        // Phase 4: Parse AI response for actionable suggestions
        const actions = parseAIActions(response.content, section);
        
        // Add helpful actions if none detected
        const helpfulActions = actions.length > 0 ? actions : [
          {
            label: 'Create Table',
            action: 'create_table',
            icon: '📊',
            onClick: () => {
              if (_onDatasetCreate && section) {
                const newDataset: Dataset = {
                  id: `dataset_${Date.now()}`,
                  name: 'New Dataset',
                  columns: [],
                  rows: [],
                  sectionId: section.id
                };
                _onDatasetCreate(newDataset);
              }
            }
          }
        ];
        
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
        // Provide helpful fallback even on error
        const fallbackActions = [
          {
            label: 'Create Table',
            action: 'create_table',
            icon: '📊',
            onClick: () => {
              if (_onDatasetCreate && section) {
                const newDataset: Dataset = {
                  id: `dataset_${Date.now()}`,
                  name: 'New Dataset',
                  columns: [],
                  rows: [],
                  sectionId: section.id
                };
                _onDatasetCreate(newDataset);
              }
            }
          }
        ];
        
        const errorMessage: ConversationMessage = {
          id: `error_${Date.now()}`,
          role: 'assistant',
          content: 'I encountered an error, but you can still add data to your section.',
          timestamp: new Date().toISOString(),
          type: 'suggestion',
          metadata: {
            actions: fallbackActions
          }
        };
        setAiMessages(prev => [...prev, errorMessage]);
      } finally {
        setIsAiLoading(false);
      }
    }
  };

  // Removed handleAISend - no longer needed after tab removal

  // Data handlers
  const handleCreateTable = () => {
    if (!_onDatasetCreate || !section) return;
    const newDataset: Dataset = {
      id: `dataset_${Date.now()}`,
      name: 'New Dataset',
      columns: [],
      rows: [],
      sectionId: section.id
    };
    _onDatasetCreate(newDataset);
  };

  const handleCreateKPI = () => {
    if (!_onKpiCreate || !section) return;
    const newKpi: KPI = {
      id: `kpi_${Date.now()}`,
      name: 'New KPI',
      value: 0,
      unit: '',
      sectionId: section.id
    };
    _onKpiCreate(newKpi);
  };

  const handleCreateMedia = () => {
    if (!onMediaCreate || !section) return;
    // Trigger file input
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
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
      }
    };
    input.click();
  };

  const handleAttachDataset = (dataset: Dataset) => {
    if (activeQuestionId && onAttachDataset) {
      onAttachDataset(dataset);
    }
  };

  const handleAttachKpi = (kpi: KPI) => {
    if (activeQuestionId && onAttachKpi) {
      onAttachKpi(kpi);
    }
  };

  const handleAttachMedia = (asset: MediaAsset) => {
    if (activeQuestionId && onAttachMedia) {
      onAttachMedia(asset);
    }
  };

  // Calculate completion (only for normal sections with questions)
  const answeredCount = !isSpecialSection && section 
    ? section.questions.filter(q => q.answer && q.answer.trim().length > 0).length 
    : 0;
  const totalQuestions = !isSpecialSection && section ? section.questions.length : 0;
  const completionPercentage = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  return (
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
        maxHeight: `${EDITOR_MAX_HEIGHT}px`,
        position: 'absolute', // Use absolute positioning relative to scroll container
        overflowY: 'auto',
        overflowX: 'hidden',
        zIndex: 50 // Higher z-index to ensure it appears above preview content
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

        {/* Main Content Area - Chat Window */}
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-900/95 relative">
          {/* Chat Messages Area */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {/* Gradient overflow indicator */}
            <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-slate-900/95 to-transparent pointer-events-none z-10" />
            
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
          </div>
          
          {/* Chat Input */}
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
                      : 'How can I help you?'
                    : activeQuestion?.placeholder || 'Type your answer...'
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
        </div>

        {/* Unified Assistant Panel - Phase 3: Context-Aware */}
        <div className="border-t border-white/20 bg-slate-800/50">
          <div className="p-2.5 space-y-3 max-h-[200px] overflow-y-auto">
            {/* Question Info with Context Indicator */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-white/90">💬 Assistant</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] text-white/50">
                  {assistantContext === 'content' && '📝 Content'}
                  {assistantContext === 'design' && '🎨 Design'}
                  {assistantContext === 'references' && '📚 References'}
                  {assistantContext === 'questions' && '❓ Questions'}
                </span>
                {!isSpecialSection && activeQuestionId && section && section.questions && (
                  <span className="text-[9px] text-white/50">• Q{section.questions.findIndex(q => q.id === activeQuestionId) + 1}</span>
                )}
              </div>
            </div>
            
            <div className="border-t border-white/10 pt-2.5">
              {/* Phase 3: Context-Aware Content */}
              {/* Show content for special sections or content context */}
              {(isSpecialSection || assistantContext === 'content') && section && (
                <>
                  {/* Attached Data Items - Only show if there are attachments */}
                  {(section.datasets && section.datasets.length > 0) ||
                   (section.kpis && section.kpis.length > 0) ||
                   (section.media && section.media.length > 0) ? (
                    <div className="mb-3">
                      <div className="text-[9px] text-white/70 mb-1.5 uppercase">Attached to Section</div>
                      <div className="space-y-1 max-h-[100px] overflow-y-auto">
                        {/* Datasets */}
                        {section.datasets && section.datasets.map((dataset) => (
                          <div
                            key={dataset.id}
                            className="flex items-center justify-between p-1.5 border border-blue-300/30 rounded bg-blue-50/10"
                          >
                            <span className="text-[10px] text-white/90 truncate flex-1">📊 {dataset.name || 'Unnamed'}</span>
                            {onAttachDataset && (
                              <button
                                onClick={() => handleAttachDataset(dataset)}
                                className="text-[9px] text-blue-400 hover:text-blue-300 ml-2"
                                title="Attach to question"
                              >
                                Attach
                              </button>
                            )}
                          </div>
                        ))}
                        
                        {/* KPIs */}
                        {section.kpis && section.kpis.map((kpi) => (
                          <div
                            key={kpi.id}
                            className="flex items-center justify-between p-1.5 border border-blue-300/30 rounded bg-blue-50/10"
                          >
                            <span className="text-[10px] text-white/90 truncate flex-1">📈 {kpi.name || 'Unnamed'}</span>
                            {onAttachKpi && (
                              <button
                                onClick={() => handleAttachKpi(kpi)}
                                className="text-[9px] text-blue-400 hover:text-blue-300 ml-2"
                                title="Attach to question"
                              >
                                Attach
                              </button>
                            )}
                          </div>
                        ))}
                        
                        {/* Media */}
                        {section.media && section.media.map((asset) => (
                          <div
                            key={asset.id}
                            className="flex items-center justify-between p-1.5 border border-blue-300/30 rounded bg-blue-50/10"
                          >
                            <span className="text-[10px] text-white/90 truncate flex-1">🖼️ {asset.title || 'Untitled'}</span>
                            {onAttachMedia && (
                              <button
                                onClick={() => handleAttachMedia(asset)}
                                className="text-[9px] text-blue-400 hover:text-blue-300 ml-2"
                                title="Attach to question"
                              >
                                Attach
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="mb-3 text-[10px] text-white/60">
                      <p>💡 Tip: Use the action buttons in AI suggestions to create tables, KPIs, or images.</p>
                    </div>
                  )}
                </>
              )}
              
              {assistantContext === 'design' && (
                <div className="mb-3">
                  <div className="text-[9px] text-white/70 mb-1.5 uppercase">Design Options</div>
                  <div className="text-[10px] text-white/80 space-y-1.5">
                    <p>• Title page formatting</p>
                    <p>• Page numbers and headers</p>
                    <p>• Logo and branding</p>
                    <p>• Document styling</p>
                  </div>
                  <p className="text-[9px] text-white/60 mt-2">Ask about specific design elements to get help.</p>
                </div>
              )}
              
              {assistantContext === 'references' && (
                <div className="mb-3">
                  <div className="text-[9px] text-white/70 mb-1.5 uppercase">References</div>
                  <div className="text-[10px] text-white/80 space-y-1.5">
                    <p>• Add citations and sources</p>
                    <p>• Attach reference documents</p>
                    <p>• Link to external resources</p>
                    <p>• Manage bibliography</p>
                  </div>
                  <p className="text-[9px] text-white/60 mt-2">Use the References section to manage citations.</p>
                </div>
              )}
              
              {assistantContext === 'questions' && (
                <div className="mb-3">
                  <div className="text-[9px] text-white/70 mb-1.5 uppercase">Question Management</div>
                  <div className="text-[10px] text-white/80 space-y-1.5">
                    <p>• Edit question prompts</p>
                    <p>• Show/hide questions</p>
                    <p>• Reorder questions</p>
                    <p>• Customize questions</p>
                  </div>
                  <p className="text-[9px] text-white/60 mt-2">Question editing features coming soon.</p>
                </div>
              )}
              
              {/* Template Guidance Link - Always visible */}
              {section?.description && (
                <div className="mb-3">
                  <button
                    onClick={() => setIsSectionGuidanceOpen(!isSectionGuidanceOpen)}
                    className="text-[10px] text-blue-400 hover:text-blue-300"
                  >
                    {isSectionGuidanceOpen ? '▼' : '▶'} Show full template guidance
                  </button>
                  {isSectionGuidanceOpen && (
                    <div className="mt-1.5 p-2 bg-slate-700/30 rounded text-[10px] text-white/70">
                      {section.description}
                    </div>
                  )}
                </div>
              )}
              
              {/* Progress Footer */}
              {!isSpecialSection && section && (
                <div className="border-t border-white/10 pt-2.5">
                  <div className="text-[10px] text-white/70">
                    Progress: {answeredCount}/{totalQuestions} questions answered ({completionPercentage}%)
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions Footer */}
        <div className="flex flex-wrap gap-2 p-2.5 border-t border-white/20 bg-slate-800/50">
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
}


import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Section, BusinessPlan, ConversationMessage } from '@/features/editor/types/plan';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
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
  
  // Tab state
  const [activeTab, setActiveTab] = useState<'ai' | 'data' | 'context'>('ai');
  
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
    if (!scrollContainer || !activeQuestionId) {
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
        
        const finalLeft = Math.max(scrollLeft + GAP, Math.min(
          scrollLeft + scrollContainer.scrollWidth - EDITOR_WIDTH - GAP,
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
    if (!sectionId || isSpecialSection) {
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

  // Reset AI messages when question changes (must be before any early returns)
  useEffect(() => {
    setAiMessages([]);
    setAiInput('');
  }, [activeQuestionId]);

  // Early return if sectionId is null, metadata section, or not visible
  if (!sectionId || isSpecialSection || !position.visible) {
    return null;
  }

  // Handle metadata and ancillary sections (double check)
  if (isMetadataSection || isAncillarySection || isReferencesSection || isAppendicesSection) {
    // No overlay for metadata sections - editing happens directly in preview
    return null;
  }

  // Handle normal sections with questions
  if (!section || !activeQuestion) {
    return null;
  }

  const isUnknown = activeQuestion.status === 'unknown';
  const isComplete = activeQuestion.status === 'complete';
  const isLastQuestion = section.questions[section.questions.length - 1]?.id === activeQuestion.id;

  // Get next question helper
  const getNextQuestion = () => {
    const currentIndex = section.questions.findIndex(q => q.id === activeQuestion.id);
    if (currentIndex >= 0 && currentIndex < section.questions.length - 1) {
      return section.questions[currentIndex + 1];
    }
    return null;
  };

  const handleSkipClick = () => {
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
    if (!skipReason) return;
    
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
    onMarkComplete(activeQuestion.id);
    
    // Auto-advance to next question
    const nextQuestion = getNextQuestion();
    if (nextQuestion) {
      onSelectQuestion(nextQuestion.id);
    } else {
      onClose(); // Last question
    }
  };

  // AI handlers
  const handleAIDraft = async () => {
    if (!activeQuestion || !section) return;
    setIsAiLoading(true);
    try {
      const response = await generateSectionContent({
        sectionTitle: section.title,
        context: activeQuestion.answer || '',
        program: {
          id: plan.metadata?.programId,
          name: plan.metadata?.programName,
          type: plan.metadata?.templateFundingType || 'grant'
        },
        questionMeta: {
          questionPrompt: activeQuestion.prompt, // Use full template prompt for AI context (includes helper text context)
          questionStatus: activeQuestion.status,
          requirementHints: validation?.issues.map(i => i.message) || []
        },
        conversationHistory: aiMessages
      });
      
      const newMessage: ConversationMessage = {
        id: `ai_${Date.now()}`,
        role: 'assistant',
        content: response.content,
        timestamp: new Date().toISOString()
      };
      setAiMessages(prev => [...prev, newMessage]);
      
      // Auto-insert draft into answer if empty
      if (!activeQuestion.answer) {
        onAnswerChange(activeQuestion.id, response.content);
      }
    } catch (error) {
      console.error('AI draft failed:', error);
      const errorMessage: ConversationMessage = {
        id: `error_${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString()
      };
      setAiMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleAIImprove = async () => {
    if (!activeQuestion || !section || !activeQuestion.answer) return;
    setIsAiLoading(true);
    try {
      const response = await generateSectionContent({
        sectionTitle: section.title,
        context: activeQuestion.answer,
        program: {
          id: plan.metadata?.programId,
          name: plan.metadata?.programName,
          type: plan.metadata?.templateFundingType || 'grant'
        },
        questionMeta: {
          questionPrompt: activeQuestion.prompt,
          questionStatus: activeQuestion.status,
          questionMode: 'critique',
          requirementHints: validation?.issues.map(i => i.message) || []
        },
        conversationHistory: aiMessages
      });
      
      const newMessage: ConversationMessage = {
        id: `ai_${Date.now()}`,
        role: 'assistant',
        content: response.content,
        timestamp: new Date().toISOString()
      };
      setAiMessages(prev => [...prev, newMessage]);
    } catch (error) {
      console.error('AI improve failed:', error);
      const errorMessage: ConversationMessage = {
        id: `error_${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString()
      };
      setAiMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsAiLoading(false);
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

  const handleAISend = async () => {
    if (!aiInput.trim() || !activeQuestion || !section) return;
    setIsAiLoading(true);
    
    const userMessage: ConversationMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: aiInput,
      timestamp: new Date().toISOString()
    };
    setAiMessages(prev => [...prev, userMessage]);
    const inputValue = aiInput;
    setAiInput('');
    
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
          questionPrompt: activeQuestion.prompt, // Use full template prompt for AI context (includes helper text context)
          questionStatus: activeQuestion.status,
          requirementHints: validation?.issues.map(i => i.message) || []
        },
        conversationHistory: [...aiMessages, userMessage]
      });
      
      const assistantMessage: ConversationMessage = {
        id: `ai_${Date.now()}`,
        role: 'assistant',
        content: response.content,
        timestamp: new Date().toISOString()
      };
      setAiMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('AI send failed:', error);
      const errorMessage: ConversationMessage = {
        id: `error_${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString()
      };
      setAiMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsAiLoading(false);
    }
  };

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

  // Calculate word count and completion
  const wordCount = activeQuestion.answer ? activeQuestion.answer.trim().split(/\s+/).filter(Boolean).length : 0;
  const answeredCount = section.questions.filter(q => q.answer && q.answer.trim().length > 0).length;
  const totalQuestions = section.questions.length;
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
        position: 'absolute',
        overflowY: 'auto',
        overflowX: 'hidden',
        zIndex: 10
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
            <h2 className="text-xs font-semibold text-white truncate flex-1 min-w-0">{section.title}</h2>
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
          {section.description && (
            <details 
              open={isSectionGuidanceOpen}
              onToggle={(e) => setIsSectionGuidanceOpen(e.currentTarget.open)}
              className="mt-1"
            >
              <summary className="cursor-pointer text-[10px] text-white/70 hover:text-white/90 flex items-center gap-1">
                <span>📋 Section Guidance</span>
                <span className="text-white/50 text-[9px]">{isSectionGuidanceOpen ? '▲' : '▼'}</span>
              </summary>
              <p className="text-[10px] text-white/70 mt-1.5 leading-relaxed">{section.description}</p>
            </details>
          )}
        </div>

        {/* Question Navigation */}
        {section.questions.length > 1 && (
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

        {/* Main Content Area - Text Editor First */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-900/95 relative">
          {/* Gradient overflow indicator */}
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-slate-900/95 to-transparent pointer-events-none z-10" />
          
          {/* Question Prompt */}
          <div>
            <h3 className="text-xs font-semibold text-white mb-1">
              {simplifyPrompt(activeQuestion.prompt)}
            </h3>
            {/* Helper text is NOT shown to users - only used by AI for context */}
            {/* Original full prompt is available in activeQuestion.prompt for AI context */}
            {/* Requirement Badges */}
            {validation && validation.issues.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {validation.issues.map((issue, idx) => (
                  <Badge
                    key={idx}
                    variant={issue.severity === 'error' ? 'danger' : 'warning'}
                    className="text-[9px] bg-red-900/50 border border-red-500/50 text-red-200 px-1.5 py-0.5"
                  >
                    {issue.severity === 'error' ? '❌' : '⚠️'} {issue.type}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Main Text Editor - Primary Focus */}
          <div>
            <textarea
              value={activeQuestion.answer ?? ''}
              onChange={(e) => onAnswerChange(activeQuestion.id, e.target.value)}
              placeholder={activeQuestion.placeholder || 'Start writing your answer here...'}
              className="w-full min-h-[120px] rounded-lg border border-white/20 bg-slate-800/50 p-2.5 text-xs text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              style={{
                fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                lineHeight: '1.6'
              }}
            />
            <div className="flex items-center justify-between mt-1.5 text-[10px] text-white/60">
              <span>{wordCount} words</span>
              <span>{completionPercentage}% complete</span>
            </div>
          </div>

          {/* Tabs */}
          <div className="border border-white/10 rounded-lg bg-slate-800/30 overflow-hidden">
            {/* Tab Headers */}
            <div className="flex border-b border-white/10">
              <button
                onClick={() => setActiveTab('ai')}
                className={`flex-1 px-2 py-1.5 text-[10px] font-semibold transition-colors ${
                  activeTab === 'ai'
                    ? 'bg-blue-600/30 text-white border-b-2 border-blue-500'
                    : 'text-white/70 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                💬 AI
              </button>
              <button
                onClick={() => setActiveTab('data')}
                className={`flex-1 px-2 py-1.5 text-[10px] font-semibold transition-colors ${
                  activeTab === 'data'
                    ? 'bg-blue-600/30 text-white border-b-2 border-blue-500'
                    : 'text-white/70 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                📊 Data
              </button>
              <button
                onClick={() => setActiveTab('context')}
                className={`flex-1 px-2 py-1.5 text-[10px] font-semibold transition-colors ${
                  activeTab === 'context'
                    ? 'bg-blue-600/30 text-white border-b-2 border-blue-500'
                    : 'text-white/70 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                📋 Context
              </button>
            </div>
            
            {/* Tab Content */}
            <div className="p-2.5">
              {/* AI Tab */}
              {activeTab === 'ai' && (
                <div className="space-y-2">
                  {/* Quick Actions */}
                  <div className="flex gap-1.5 flex-wrap">
                    <Button
                      size="sm"
                      onClick={handleAIDraft}
                      disabled={isAiLoading}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] px-2 py-1 rounded"
                    >
                      ✨ Draft
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleAIImprove}
                      disabled={isAiLoading || !activeQuestion.answer}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] px-2 py-1 rounded"
                    >
                      📈 Improve
                    </Button>
                  </div>
                  
                  {/* Chat Messages */}
                  {aiMessages.length > 0 && (
                    <div className="space-y-1.5 max-h-[80px] overflow-y-auto">
                      {aiMessages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`p-1.5 rounded text-[10px] ${
                            msg.role === 'user'
                              ? 'bg-blue-600/30 text-blue-100'
                              : 'bg-slate-700/50 text-white/90'
                          }`}
                        >
                          {msg.content}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Input */}
                  <div className="flex gap-1.5">
                    <input
                      value={aiInput}
                      onChange={(e) => setAiInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleAISend()}
                      placeholder="Ask AI..."
                      disabled={isAiLoading}
                      className="flex-1 px-2 py-1 rounded border border-white/20 bg-slate-800/50 text-white text-[10px] placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <Button
                      onClick={handleAISend}
                      disabled={isAiLoading || !aiInput.trim()}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] px-2 py-1 rounded"
                    >
                      Send
                    </Button>
                  </div>
                  {isAiLoading && (
                    <div className="text-[10px] text-white/50 text-center">Thinking...</div>
                  )}
                </div>
              )}
              
              {/* Data Tab */}
              {activeTab === 'data' && (
                <div className="space-y-3">
                  {/* Quick Add */}
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      size="sm"
                      onClick={handleCreateTable}
                      className="bg-green-600 hover:bg-green-700 text-white text-xs px-2.5 py-1.5 rounded"
                    >
                      📊 Table
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleCreateKPI}
                      className="bg-green-600 hover:bg-green-700 text-white text-xs px-2.5 py-1.5 rounded"
                    >
                      📈 KPI
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleCreateMedia}
                      className="bg-green-600 hover:bg-green-700 text-white text-xs px-2.5 py-1.5 rounded"
                    >
                      🖼️ Media
                    </Button>
                  </div>
                  
                  {/* Data Items */}
                  <div className="space-y-2 max-h-[150px] overflow-y-auto">
                    {/* Datasets */}
                    {section.datasets && section.datasets.length > 0 && (
                      <div>
                        <h4 className="text-[10px] font-semibold text-white/70 mb-1.5 uppercase">Datasets</h4>
                        <div className="space-y-1">
                          {section.datasets.map((dataset) => (
                            <div
                              key={dataset.id}
                              className="flex items-center justify-between p-1.5 border border-blue-300/30 rounded bg-blue-50/10 group"
                            >
                              <span className="text-xs text-white/90 truncate flex-1">{dataset.name || 'Unnamed'}</span>
                              {onAttachDataset && (
                                <Button
                                  size="sm"
                                  onClick={() => handleAttachDataset(dataset)}
                                  className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] px-2 py-0.5 rounded relative"
                                  title="Click to attach"
                                >
                                  Attach
                                  <span className="absolute -top-1 -right-1 opacity-70">
                                    <svg className="w-2.5 h-2.5 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                  </span>
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* KPIs */}
                    {section.kpis && section.kpis.length > 0 && (
                      <div>
                        <h4 className="text-[10px] font-semibold text-white/70 mb-1.5 uppercase">KPIs</h4>
                        <div className="space-y-1">
                          {section.kpis.map((kpi) => (
                            <div
                              key={kpi.id}
                              className="flex items-center justify-between p-1.5 border border-blue-300/30 rounded bg-blue-50/10 group"
                            >
                              <span className="text-xs text-white/90 truncate flex-1">{kpi.name || 'Unnamed'}</span>
                              {onAttachKpi && (
                                <Button
                                  size="sm"
                                  onClick={() => handleAttachKpi(kpi)}
                                  className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] px-2 py-0.5 rounded relative"
                                  title="Click to attach"
                                >
                                  Attach
                                  <span className="absolute -top-1 -right-1 opacity-70">
                                    <svg className="w-2.5 h-2.5 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                  </span>
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Media */}
                    {section.media && section.media.length > 0 && (
                      <div>
                        <h4 className="text-[10px] font-semibold text-white/70 mb-1.5 uppercase">Media</h4>
                        <div className="space-y-1">
                          {section.media.map((asset) => (
                            <div
                              key={asset.id}
                              className="flex items-center justify-between p-1.5 border border-blue-300/30 rounded bg-blue-50/10 group"
                            >
                              <span className="text-xs text-white/90 truncate flex-1">{asset.title || 'Untitled'}</span>
                              {onAttachMedia && (
                                <Button
                                  size="sm"
                                  onClick={() => handleAttachMedia(asset)}
                                  className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] px-2 py-0.5 rounded relative"
                                  title="Click to attach"
                                >
                                  Attach
                                  <span className="absolute -top-1 -right-1 opacity-70">
                                    <svg className="w-2.5 h-2.5 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                  </span>
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Empty State */}
                    {(!section.datasets || section.datasets.length === 0) &&
                     (!section.kpis || section.kpis.length === 0) &&
                     (!section.media || section.media.length === 0) && (
                      <div className="text-xs text-white/50 text-center py-3">
                        No data items. Create one above.
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Context Tab */}
              {activeTab === 'context' && (
                <div className="space-y-3 text-xs">
                  {/* Requirements */}
                  {validation && (
                    <div>
                      <h4 className="font-semibold text-white/90 mb-1.5">Requirements</h4>
                      <div className="space-y-1">
                        {validation.issues.length > 0 ? (
                          validation.issues.map((issue, idx) => (
                            <div
                              key={idx}
                              className={`${
                                issue.severity === 'error' ? 'text-red-300' : 'text-yellow-300'
                              }`}
                            >
                              {issue.severity === 'error' ? '❌' : '⚠️'} {issue.message}
                            </div>
                          ))
                        ) : (
                          <div className="text-green-300">✅ All requirements met</div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Progress */}
                  <div>
                    <h4 className="font-semibold text-white/90 mb-1.5">Progress</h4>
                    <div className="space-y-0.5 text-white/70">
                      <div>Questions: {answeredCount}/{totalQuestions}</div>
                      <div>Section: {completionPercentage}%</div>
                    </div>
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


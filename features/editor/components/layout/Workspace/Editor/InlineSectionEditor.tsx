import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Section, BusinessPlan } from '@/features/editor/types/plan';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { useI18n } from '@/shared/contexts/I18nContext';
import { useEditorStore, validateQuestionRequirements, METADATA_SECTION_ID, ANCILLARY_SECTION_ID } from '@/features/editor/hooks/useEditorStore';
import MetadataAndAncillaryPanel from '@/features/editor/components/layout/Workspace/Title Page & Attachement Data/MetadataAndAncillaryPanel';
import {
  Dataset,
  KPI,
  MediaAsset
} from '@/features/editor/types/plan';
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
  onAIHelp: () => void;
  onDataHelp: () => void;
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
  progressSummary?: any[];
};

type EditorPosition = {
  top: number;
  left: number;
  placement: 'right' | 'below';
  visible: boolean;
};

const EDITOR_WIDTH = 450;
const EDITOR_MAX_HEIGHT = 600;
const GAP = 16;

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
  onAIHelp,
  onDataHelp,
  onTitlePageChange,
  onAncillaryChange,
  onReferenceAdd,
  onReferenceUpdate,
  onReferenceDelete,
  onAppendixAdd,
  onAppendixUpdate,
  onAppendixDelete,
  onRunRequirements,
  onDatasetCreate: _onDatasetCreate,
  onKpiCreate: _onKpiCreate,
  onMediaCreate,
  progressSummary = []
}: InlineSectionEditorProps) {
  const { t } = useI18n();
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

  // Check if this is a metadata or ancillary section
  const isMetadataSection = sectionId === METADATA_SECTION_ID;
  const isAncillarySection = sectionId === ANCILLARY_SECTION_ID;
  const isSpecialSection = isMetadataSection || isAncillarySection;

  const activeQuestion = section?.questions.find((q) => q.id === activeQuestionId) ?? section?.questions[0] ?? null;
  const template = section ? templates.find((tpl) => tpl.id === section.id) : null;
  
  // Validation
  const validation = activeQuestion && template && section
    ? validateQuestionRequirements(activeQuestion, section, template)
    : null;

  // Calculate position relative to preview container
  const calculatePosition = useCallback(() => {
    if (!sectionId || isSpecialSection) {
      // For metadata/ancillary sections, we'll position at top of container
      const container = document.getElementById('preview-container');
      if (container) {
        setPosition({
          top: GAP,
          left: GAP,
          placement: 'right',
          visible: true
        });
      }
      return;
    }

    const container = document.getElementById('preview-container');
    if (!container) {
      setPosition(prev => ({ ...prev, visible: false }));
      return;
    }

    // Try to find the active question heading first (more precise positioning)
    let targetElement: HTMLElement | null = null;
    if (activeQuestionId) {
      // Try to find the question heading (h4 with section-subchapter class)
      targetElement = document.querySelector(`h4.section-subchapter[data-question-id="${activeQuestionId}"]`) as HTMLElement;
      
      // If heading not found, try the answer div
      if (!targetElement) {
        targetElement = document.querySelector(`div[data-question-id="${activeQuestionId}"][data-question-content="true"]`) as HTMLElement;
      }
    }

    // Fallback to section element if question not found
    if (!targetElement) {
      targetElement = document.querySelector(`[data-section-id="${sectionId}"]`) as HTMLElement;
    }

    if (!targetElement) {
      setPosition(prev => ({ ...prev, visible: false }));
      return;
    }

    // Get the scrollable container (the one with overflow-y-auto)
    const scrollContainer = container.querySelector('.overflow-y-auto') || container;
    if (!scrollContainer) {
      setPosition(prev => ({ ...prev, visible: false }));
      return;
    }

    // Get bounding rects - calculate relative to scroll container's content area
    const scrollRect = scrollContainer.getBoundingClientRect();
    const targetRect = targetElement.getBoundingClientRect();
    
    // Calculate position relative to scroll container's scroll position
    // This makes the editor part of the document flow
    const scrollTop = scrollContainer.scrollTop || 0;
    const scrollLeft = scrollContainer.scrollLeft || 0;
    
    // Get target position relative to scroll container's content (accounting for scroll)
    const targetTop = targetRect.top - scrollRect.top + scrollTop;
    const targetLeft = targetRect.left - scrollRect.left + scrollLeft;
    const targetWidth = targetRect.width;
    const targetHeight = targetRect.height;
    const scrollWidth = scrollContainer.scrollWidth || scrollRect.width;

    // Try positioning on the right side first (inline with content)
    const rightSideLeft = targetLeft + targetWidth + GAP;
    const rightSideFits = rightSideLeft + EDITOR_WIDTH <= scrollWidth;

    let finalTop = targetTop + GAP;
    let finalLeft: number;
    let placement: 'right' | 'below' = 'right';

    if (rightSideFits) {
      // Position on right side - inline with the question
      finalLeft = rightSideLeft;
      placement = 'right';
    } else {
      // Position below target element - still inline with content
      finalLeft = targetLeft;
      finalTop = targetTop + targetHeight + GAP;
      placement = 'below';
    }

    // Ensure editor doesn't overflow the scroll container's content width
    if (finalLeft + EDITOR_WIDTH > scrollWidth) {
      finalLeft = Math.max(GAP, scrollWidth - EDITOR_WIDTH - GAP);
    }

    setPosition({
      top: finalTop,
      left: finalLeft,
      placement,
      visible: true
    });
  }, [sectionId, activeQuestionId, isSpecialSection]);

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

    // Initial position calculation - wait for DOM to be ready
    // Use longer timeout to ensure HTML content is rendered
    const timeoutId = setTimeout(() => {
      calculatePosition();
    }, 200);

    // Set up scroll and resize listeners
    const container = document.getElementById('preview-container');
    const scrollContainer = container?.querySelector('.overflow-y-auto') || container;

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

  if (!sectionId || !position.visible) {
    return null;
  }

  // Handle metadata and ancillary sections
  if (isMetadataSection || isAncillarySection) {
    return (
      <div
          ref={editorRef}
          className={`absolute z-10 rounded-2xl border-2 ${
            isDragging 
              ? 'border-blue-500 border-dashed bg-blue-50/50' 
              : 'border-blue-400/60 bg-white/98'
          } backdrop-blur-xl shadow-2xl overflow-hidden transition-all`}
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
            width: `${EDITOR_WIDTH}px`,
            maxHeight: `${EDITOR_MAX_HEIGHT}px`,
            position: 'absolute'
          }}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {isDragging && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-blue-100/80 backdrop-blur-sm rounded-2xl pointer-events-none">
              <div className="text-center p-6">
                <div className="text-4xl mb-2">📎</div>
                <p className="text-sm font-semibold text-blue-900">
                  Drop files to attach
                </p>
              </div>
            </div>
          )}
          <div className="relative h-full flex flex-col bg-white">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50/50">
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-slate-900">
                  {isMetadataSection 
                    ? (t('editor.section.metadata' as any) as string) || 'Plan Metadata'
                    : (t('editor.section.front_back_matter' as any) as string) || 'Ancillary & Formalities'}
                </h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-slate-600 hover:bg-slate-100"
                aria-label="Close editor"
              >
                ✕
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              <MetadataAndAncillaryPanel
                plan={plan}
                onTitlePageChange={onTitlePageChange}
                onAncillaryChange={onAncillaryChange}
                onReferenceAdd={onReferenceAdd}
                onReferenceUpdate={onReferenceUpdate}
                onReferenceDelete={onReferenceDelete}
                onAppendixAdd={onAppendixAdd}
                onAppendixUpdate={onAppendixUpdate}
                onAppendixDelete={onAppendixDelete}
                onRunRequirements={onRunRequirements}
                progressSummary={progressSummary}
              />
            </div>
          </div>
        </div>
    );
  }

  // Handle normal sections with questions
  if (!section || !activeQuestion) {
    return null;
  }

  const isUnknown = activeQuestion.status === 'unknown';
  const isComplete = activeQuestion.status === 'complete';
  const isLastQuestion = section.questions[section.questions.length - 1]?.id === activeQuestion.id;

  const handleToggleUnknown = () => {
    if (isUnknown) {
      onToggleUnknown(activeQuestion.id);
    } else {
      // For inline editor, we'll just mark as unknown without modal
      onToggleUnknown(activeQuestion.id, '');
    }
  };

  return (
    <div
      ref={editorRef}
      className={`absolute z-10 rounded-2xl border-2 ${
        isDragging 
          ? 'border-blue-500 border-dashed bg-blue-50/50' 
          : 'border-blue-400/60 bg-white/98'
      } backdrop-blur-xl shadow-2xl overflow-hidden transition-all`}
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        width: `${EDITOR_WIDTH}px`,
        maxHeight: `${EDITOR_MAX_HEIGHT}px`,
        position: 'absolute'
      }}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-blue-100/80 backdrop-blur-sm rounded-2xl pointer-events-none">
          <div className="text-center p-6">
            <div className="text-4xl mb-2">📎</div>
            <p className="text-sm font-semibold text-blue-900">
              Drop files to attach
            </p>
          </div>
        </div>
      )}
      <div className="relative h-full flex flex-col bg-white">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50/50">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-slate-900 truncate">{section.title}</h2>
            {section.description && (
              <p className="text-xs text-slate-600 truncate mt-1">{section.description}</p>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-slate-600 hover:bg-slate-100 flex-shrink-0 ml-2"
            aria-label="Close editor"
          >
            ✕
          </Button>
        </div>

        {/* Question Navigation */}
        {section.questions.length > 1 && (
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/50">
            <div className="flex items-center gap-2 overflow-x-auto">
              {section.questions.map((q, index) => {
                const isActive = q.id === activeQuestionId;
                const status = q.status;
                return (
                  <button
                    key={q.id}
                    onClick={() => onSelectQuestion(q.id)}
                    className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-all flex-shrink-0 ${
                      isActive
                        ? 'border-blue-500 bg-blue-500 text-white shadow-md'
                        : 'border-slate-300 bg-white text-slate-700 hover:border-blue-400 hover:bg-blue-50'
                    }`}
                  >
                    <span>{index + 1}</span>
                    {status === 'complete' && <span>✅</span>}
                    {status === 'unknown' && <span>❓</span>}
                    {status === 'draft' && <span>📝</span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Question Card */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-white">
          <div>
            <h3 className="text-base font-semibold text-slate-900 mb-2">{activeQuestion.prompt}</h3>
            {activeQuestion.helperText && (
              <p className="text-sm text-slate-600 mb-3 leading-relaxed">{activeQuestion.helperText}</p>
            )}
          </div>

          {/* Requirement Badges */}
          {validation && validation.issues.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {validation.issues.map((issue, idx) => (
                <Badge
                  key={idx}
                  variant={issue.severity === 'error' ? 'danger' : 'warning'}
                  className="text-xs bg-red-50 border border-red-200 text-red-700"
                >
                  {issue.severity === 'error' ? '❌' : '⚠️'} {issue.type}
                </Badge>
              ))}
            </div>
          )}

          {/* Text Editor */}
          <div>
            <textarea
              value={activeQuestion.answer ?? ''}
              onChange={(e) => onAnswerChange(activeQuestion.id, e.target.value)}
              placeholder={activeQuestion.placeholder || 'Provide details...'}
              className="w-full min-h-[180px] rounded-lg border border-slate-300 bg-white p-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none shadow-sm"
              style={{
                fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                lineHeight: '1.7'
              }}
            />
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-200">
            {!isComplete && (
              <Button
                variant="success"
                onClick={() => {
                  onMarkComplete(activeQuestion.id);
                  if (isLastQuestion) {
                    onClose();
                  }
                }}
                className="bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm"
              >
                {isLastQuestion ? 'Complete Section' : 'Complete'}
              </Button>
            )}
            {!isComplete && (
              <Button
                variant="outline"
                onClick={handleToggleUnknown}
                className="text-slate-700 border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold px-4 py-2 rounded-lg shadow-sm"
              >
                {isUnknown ? 'Clear Unknown' : 'Skip'}
              </Button>
            )}
            <Button
              variant="outline"
              onClick={onAIHelp}
              className="text-slate-700 border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold px-4 py-2 rounded-lg shadow-sm flex items-center gap-1.5"
            >
              <span>💬</span> AI Help
            </Button>
            <Button
              variant="outline"
              onClick={onDataHelp}
              className="text-slate-700 border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold px-4 py-2 rounded-lg shadow-sm flex items-center gap-1.5"
            >
              <span>📊</span> Data
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}


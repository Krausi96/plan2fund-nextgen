import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useI18n } from '@/shared/contexts/I18nContext';
import { useEditorStore, useEditorActions } from '@/features/editor/lib/hooks/useEditorStore';
import InlineSectionEditorAIChat from './components/AIChat';
import InlineSectionEditorSpecialSections from './components/SpecialSections';
import { QuestionEditor } from './components/QuestionEditor';
import { WelcomeState } from './components/WelcomeState';
import { SectionEditorHeader } from './components/SectionEditorHeader';
import { SkipDialog } from './components/SkipDialog';
import { ActionsFooter } from './components/ActionsFooter';
import { useSectionEditorPosition } from './hooks/useSectionEditorPosition';
import { useSectionEditorDrag } from './hooks/useSectionEditorDrag';
import { useSectionEditorState } from './hooks/useSectionEditorState';
import { useSectionEditorAI } from './hooks/useSectionEditorAI';
import { useSectionEditorHandlers } from './hooks/useSectionEditorHandlers';
import { useQuestionHighlight } from './hooks/useQuestionHighlight';
import { handleFileDrop } from './lib/fileDropHandler';

type InlineSectionEditorProps = {
  sectionId: string | null;
  onClose: () => void;
};

export default function InlineSectionEditor({
  sectionId,
  onClose
}: InlineSectionEditorProps) {
  const { t } = useI18n();
  const editorRef = useRef<HTMLDivElement>(null);
  
  // All hooks must be called before any early returns
  // Skip dialog state
  const [showSkipDialog, setShowSkipDialog] = useState(false);
  const [skipReason, setSkipReason] = useState<'not_applicable' | 'later' | 'unclear' | 'other' | null>(null);
  const [skipNote, setSkipNote] = useState('');
  
  // Use extracted hooks
  const {
    position,
    setPosition,
    panelDimensions,
    savePosition
  } = useSectionEditorPosition(sectionId);
  
  const {
    isDragging,
    dragOverTarget,
    isPanelDragging,
    handlePanelMouseDown,
    handleDragEnter,
    handleDragOver,
    handleDragLeave,
    setIsDragging,
    setDragOverTarget
  } = useSectionEditorDrag(editorRef as React.RefObject<HTMLDivElement>, position, setPosition, savePosition);
  
  const {
    plan,
    section,
    activeQuestion,
    template,
    isMetadataSection,
    isAncillarySection,
    isReferencesSection,
    isAppendicesSection,
    isSpecialSection,
    isUnknown,
    isComplete,
    isQuestionExpanded,
    setIsQuestionExpanded,
    isSuggestionsExpanded,
    setIsSuggestionsExpanded,
    getNextQuestion,
    answeredCount,
    totalQuestions,
    completionPercentage,
    titlePageFields,
    tocStats,
    referencesCount,
    appendicesCount
  } = useSectionEditorState(sectionId);
  
  const actions = useEditorActions((actions) => actions);
  const {
    setActiveQuestion,
    updateAnswer,
    toggleQuestionUnknown,
    markQuestionComplete,
    updateTitlePage,
    addReference,
    addAppendix,
    addDataset,
    addKpi,
    addMedia
  } = actions;
  
  const { activeQuestionId } = useEditorStore((state) => ({
    activeQuestionId: state.activeQuestionId
  }));
  
  // Use AI hook (may use plan/section which could be null, but hooks must be called)
  const {
    aiMessages,
    aiInput,
    isAiLoading,
    proactiveSuggestions,
    isLoadingSuggestions,
    expandedActions,
    setAiInput,
    setProactiveSuggestions,
    setExpandedActions,
    handleChatSend
  } = useSectionEditorAI({
    sectionId,
    activeQuestionId,
    activeQuestion: activeQuestion ?? null,
    section: section ?? null,
    plan: plan ?? null,
    template: template ?? null,
    isSpecialSection,
    isMetadataSection,
    isAncillarySection,
    isReferencesSection,
    isAppendicesSection,
    actions: {
      updateAnswer,
      addDataset,
      addKpi,
      addMedia,
      addReference
    },
    t
  });

  // Use handlers hook
  const {
    handleSkipClick,
    handleSkipConfirm,
    handleComplete
  } = useSectionEditorHandlers({
    isSpecialSection,
    activeQuestion: activeQuestion ?? null,
    isUnknown,
    getNextQuestion,
    toggleQuestionUnknown,
    markQuestionComplete,
    setActiveQuestion,
    onClose,
    showSkipDialog,
    skipReason,
    skipNote,
    setShowSkipDialog,
    setSkipReason,
    setSkipNote
  });

  // Use question highlight hook
  useQuestionHighlight(activeQuestionId, sectionId, isSpecialSection);

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

  // File drop handler using extracted utility
  const handleDrop = useCallback((e: React.DragEvent) => {
    setIsDragging(false);
    setDragOverTarget(null);
    if (plan && section) {
      handleFileDrop(
        e,
        dragOverTarget,
        isMetadataSection,
        section,
        plan,
        {
          updateTitlePage,
          addMedia,
          addAppendix
        }
      );
    }
  }, [dragOverTarget, isMetadataSection, section, plan, updateTitlePage, addMedia, addAppendix, setIsDragging, setDragOverTarget]);
  
  // Wrapper for handleDragOver to pass isMetadataSection
  const handleDragOverWrapper = useCallback((e: React.DragEvent) => {
    handleDragOver(e, isMetadataSection);
  }, [handleDragOver, isMetadataSection]);

  // Force visibility - component should ALWAYS be visible when plan exists
  // ANCILLARY section now has panel enabled
  const shouldBeVisible = true;
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

  // Early returns after all hooks
  if (!plan) {
    return null;
  }

  // Show welcome state if no section selected
  if (!sectionId) {
    return <WelcomeState editorRef={editorRef} position={position} panelDimensions={panelDimensions} onClose={onClose} />;
  }

  const editorContent = (
    <div
      ref={editorRef}
      className={`rounded-2xl border-2 ${
        isDragging 
          ? 'border-blue-500 border-dashed bg-blue-900/50' 
          : 'border-blue-400/60 bg-slate-900/95'
      } backdrop-blur-xl shadow-2xl overflow-hidden transition-all flex flex-col`}
      style={{
        position: 'fixed',
        top: `${position.top}px`,
        left: `${position.left}px`,
        width: `${panelDimensions.width}px`,
        height: `${panelDimensions.height}px`,
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
      onDragOver={handleDragOverWrapper}
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
        {/* Header - Using extracted component */}
        <SectionEditorHeader
          section={section}
          activeQuestionId={activeQuestionId}
          isSpecialSection={isSpecialSection}
          isMetadataSection={isMetadataSection}
          isAncillarySection={isAncillarySection}
          isReferencesSection={isReferencesSection}
          isAppendicesSection={isAppendicesSection}
          onClose={onClose}
          onPanelMouseDown={handlePanelMouseDown}
          onQuestionSelect={setActiveQuestion}
        />

        {/* Suggestions removed from here - moved to side panel */}

        {/* Question Section - Using extracted component */}
        {!isSpecialSection && activeQuestion && (
          <QuestionEditor
            question={activeQuestion}
            isExpanded={isQuestionExpanded}
            onToggleExpanded={() => setIsQuestionExpanded(!isQuestionExpanded)}
          />
        )}

        {/* Special Sections Handler */}
        {isSpecialSection && section && (
          <InlineSectionEditorSpecialSections
            isMetadataSection={isMetadataSection}
            isAncillarySection={isAncillarySection}
            isReferencesSection={isReferencesSection}
            isAppendicesSection={isAppendicesSection}
            plan={plan}
            onTitlePageChange={updateTitlePage}
            onReferenceAdd={addReference}
            onAppendixAdd={addAppendix}
            titlePageFields={titlePageFields}
            tocStats={tocStats}
            referencesCount={referencesCount}
            appendicesCount={appendicesCount}
          />
        )}

        {/* AI Chat Panel */}
        <InlineSectionEditorAIChat
          messages={aiMessages}
          input={aiInput}
          isLoading={isAiLoading}
          onInputChange={setAiInput}
          onSend={handleChatSend}
          proactiveSuggestions={proactiveSuggestions}
          isLoadingSuggestions={isLoadingSuggestions}
          isSuggestionsExpanded={isSuggestionsExpanded}
          onToggleSuggestionsExpanded={() => setIsSuggestionsExpanded(!isSuggestionsExpanded)}
          onAddSuggestion={(suggestion, idx) => {
            setAiInput(prev => {
              const current = prev.trim();
              if (current) {
                return `${current}\n\n${suggestion}`;
              }
              return suggestion;
            });
            setProactiveSuggestions(prev => prev.filter((_, i) => i !== idx));
          }}
          onAddAllSuggestions={() => {
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
          expandedActions={expandedActions}
          onToggleActionExpanded={(messageId) => {
            setExpandedActions(prev => {
              const next = new Set(prev);
              if (next.has(messageId)) {
                next.delete(messageId);
              } else {
                next.add(messageId);
              }
              return next;
            });
          }}
          isSpecialSection={isSpecialSection}
          isMetadataSection={isMetadataSection}
          isReferencesSection={isReferencesSection}
          activeQuestionHasAnswer={!!(activeQuestion?.answer?.trim())}
        />

        {/* Actions Footer - Using extracted component */}
        {!isSpecialSection && section && !isComplete && (
          <ActionsFooter
            answeredCount={answeredCount}
            totalQuestions={totalQuestions}
            completionPercentage={completionPercentage}
            isUnknown={isUnknown}
            onSkip={handleSkipClick}
            onComplete={handleComplete}
          />
        )}

        {/* Skip Dialog - Using extracted component */}
        <SkipDialog
          open={showSkipDialog}
          skipReason={skipReason}
          skipNote={skipNote}
          onOpenChange={setShowSkipDialog}
          onReasonChange={setSkipReason}
          onNoteChange={setSkipNote}
          onConfirm={handleSkipConfirm}
          onCancel={() => {
            setShowSkipDialog(false);
            setSkipReason(null);
            setSkipNote('');
          }}
        />
      </div>
    </div>
  );

  // Render via portal to escape CSS containment
  if (typeof window === 'undefined') {
    return editorContent;
  }

  return createPortal(editorContent, document.body);
}


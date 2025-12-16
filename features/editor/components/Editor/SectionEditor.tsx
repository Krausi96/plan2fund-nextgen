import React, { useRef } from 'react';
import { createPortal } from 'react-dom';
import { useSectionEditorState, useEscapeKeyHandler, EDITOR_STYLES } from '@/features/editor/lib';

type SectionEditorProps = {
  sectionId: string | null;
  onClose: () => void;
};

/**
 * SectionEditor component
 * Optimized: Uses unified hook instead of multiple individual hooks
 */
export default function SectionEditor({ sectionId, onClose }: SectionEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const editorState = useSectionEditorState(sectionId);
  
  useEscapeKeyHandler(!!sectionId, onClose);

  if (!editorState.hasPlan) return null;

  const { section } = editorState;

  if (!sectionId || !section) {
    return (
      <div ref={editorRef} className={EDITOR_STYLES.welcome}>
        <div className={EDITOR_STYLES.welcomeContent}>
          <div className={EDITOR_STYLES.welcomeIcon}>📝</div>
          <h3 className={EDITOR_STYLES.welcomeTitle}>Select a section to edit</h3>
          <p className={EDITOR_STYLES.welcomeText}>Choose a section from the sidebar to start editing</p>
        </div>
      </div>
    );
  }

  const editorContent = (
    <div ref={editorRef} className={EDITOR_STYLES.container}>
      <div className={EDITOR_STYLES.editorInner}>
        <div className={EDITOR_STYLES.header}>
          <h2 className={EDITOR_STYLES.sectionTitle}>{section.title}</h2>
          <button onClick={onClose} className={EDITOR_STYLES.closeButton}>
            ✕
          </button>
        </div>
        <div className={EDITOR_STYLES.content}>
          <div className={EDITOR_STYLES.sectionContent}>
            <p>Section editor content</p>
            <p className={EDITOR_STYLES.sectionId}>Section ID: {section.id}</p>
          </div>
        </div>
      </div>
    </div>
  );

  if (typeof window === 'undefined') return editorContent;
  return createPortal(editorContent, document.body);
}


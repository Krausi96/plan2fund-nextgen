import React, { useRef } from 'react';
import { createPortal } from 'react-dom';
import { useSectionEditorState, useEscapeKeyHandler } from '@/features/editor/lib';

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
      <div ref={editorRef} className="flex items-center justify-center h-full w-full">
        <div className="text-center">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Select a section to edit</h3>
          <p className="text-gray-600">Choose a section from the sidebar to start editing</p>
        </div>
      </div>
    );
  }

  const editorContent = (
    <div ref={editorRef} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-900">{section.title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl leading-none">
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <div className="prose max-w-none">
            <p>Section editor content</p>
            <p className="text-sm text-gray-500 mt-4">Section ID: {section.id}</p>
          </div>
        </div>
      </div>
    </div>
  );

  if (typeof window === 'undefined') return editorContent;
  return createPortal(editorContent, document.body);
}


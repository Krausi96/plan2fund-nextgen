import React from 'react';
import { Button } from '@/shared/components/ui/button';
import type { EditorPosition, PanelDimensions } from '../hooks/useSectionEditorPosition';

type WelcomeStateProps = {
  editorRef: React.RefObject<HTMLDivElement | null>;
  position: EditorPosition;
  panelDimensions: PanelDimensions;
  onClose: () => void;
};

export function WelcomeState({
  editorRef,
  position,
  panelDimensions,
  onClose
}: WelcomeStateProps) {
  return (
    <div
      ref={editorRef}
      className="rounded-2xl border-2 border-blue-400/60 bg-slate-900/95 backdrop-blur-xl shadow-2xl overflow-hidden transition-all"
      style={{
        position: 'fixed',
        top: `${position.top}px`,
        left: `${position.left}px`,
        width: `${panelDimensions.width}px`,
        height: `${panelDimensions.height}px`,
        zIndex: 9999,
        display: 'block',
        opacity: 1,
        visibility: 'visible',
        overflowY: 'auto',
        overflowX: 'hidden'
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


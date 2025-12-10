import { useState, useRef, useEffect, useCallback } from 'react';
import type { EditorPosition } from './useSectionEditorPosition';

const EDITOR_WIDTH = 320;
const EDITOR_MAX_HEIGHT = 500;
const GAP = 24;

/**
 * Hook for managing SectionEditor drag & drop functionality
 */
export function useSectionEditorDrag(
  editorRef: React.RefObject<HTMLDivElement>,
  position: EditorPosition,
  setPosition: (pos: EditorPosition | ((prev: EditorPosition) => EditorPosition)) => void,
  savePosition: (pos: EditorPosition) => void
) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOverTarget, setDragOverTarget] = useState<'logo' | 'attachment' | null>(null);
  const [isPanelDragging, setIsPanelDragging] = useState(false);
  const dragStartPos = useRef<{ x: number; y: number; startLeft: number; startTop: number } | null>(null);

  // Panel dragging functionality
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
        savePosition(position);
      }
      dragStartPos.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isPanelDragging, position, editorRef, setPosition, savePosition]);

  // Handle drag and drop for files
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, isMetadataSection: boolean) => {
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
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only clear if leaving the editor entirely
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (!editorRef.current?.contains(relatedTarget)) {
      setIsDragging(false);
      setDragOverTarget(null);
    }
  }, [editorRef]);

  return {
    isDragging,
    dragOverTarget,
    isPanelDragging,
    handlePanelMouseDown,
    handleDragEnter,
    handleDragOver,
    handleDragLeave,
    setIsDragging,
    setDragOverTarget
  };
}


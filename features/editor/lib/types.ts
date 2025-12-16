/**
 * ============================================================================
 * EDITOR TYPE DEFINITIONS
 * ============================================================================
 * 
 * This file contains all TypeScript type definitions used throughout the editor.
 * It serves as the single source of truth for editor-related types.
 * 
 * USAGE:
 *   Import types from here: import type { ProductType, PlanSection } from '@/features/editor/lib';
 * 
 * USED BY:
 *   - All editor components (Editor, Sidebar, DocumentsBar, etc.)
 *   - Store (editorStore.ts) - for state typing
 *   - Hooks - for parameter and return types
 *   - Renderers - for data structure typing
 * 
 * ORGANIZATION:
 *   - Product & Plan Types: Core business plan data structures
 *   - Program Types: Grant program related types
 *   - AI & Conversation Types: AI chat functionality types
 *   - Template Types: Section and document template types
 *   - UI Types: Component prop and state types
 * ============================================================================
 */

export type ProductType = 'submission' | 'review' | 'strategy';

export type ProductOption = {
  value: ProductType;
  label: string;
  description: string;
  icon?: string;
};

export interface TitlePage {
  planTitle: string;
  valueProp?: string;
  companyName: string;
  legalForm?: string;
  teamHighlight?: string;
  date: string;
  logoUrl?: string;
  confidentialityStatement?: string;
  headquartersLocation?: string;
  contactInfo?: {
    name?: string;
    email?: string;
    phone?: string;
    website?: string;
    address?: string;
  };
}

export interface PlanSection {
  key: string;
  id: string;
  title: string;
  content?: string;
  fields?: {
    displayTitle?: string;
    sectionNumber?: number | null;
    subchapters?: Array<{ id: string; title: string; numberLabel: string }>;
    [key: string]: any;
  };
  status?: string;
  tables?: Record<string, any>;
  figures?: Array<{
    id?: string;
    title?: string;
    caption?: string;
    description?: string;
    source?: string;
    tags?: string[];
    uri?: string;
    altText?: string;
    [key: string]: any;
  }>;
  [key: string]: any;
}

export interface PlanDocument {
  id?: string;
  language: 'de' | 'en';
  settings: {
    includeTitlePage?: boolean;
    includePageNumbers?: boolean;
    titlePage?: {
      title?: string;
      subtitle?: string;
      companyName?: string;
      legalForm?: string;
      teamHighlight?: string;
      date?: string;
      logoUrl?: string;
      confidentialityStatement?: string;
      headquartersLocation?: string;
      contactInfo?: {
        email?: string;
        phone?: string;
        website?: string;
        address?: string;
      };
    };
    [key: string]: any;
  };
  sections: PlanSection[];
  ancillary?: {
    listOfTables?: Array<{ id: string; label: string; page?: number; [key: string]: any }>;
    listOfIllustrations?: Array<{ id: string; label: string; page?: number; [key: string]: any }>;
    tableOfContents?: Array<{ id: string; title: string; page?: number; hidden?: boolean; [key: string]: any }>;
    [key: string]: any;
  };
  references?: Array<{
    id: string;
    citation?: string;
    url?: string;
    accessedDate?: string;
    [key: string]: any;
  }>;
  appendices?: Array<{
    id: string;
    title?: string;
    description?: string;
    fileUrl?: string;
    [key: string]: any;
  }>;
  [key: string]: any;
}

// Re-export BusinessPlan if it exists elsewhere, otherwise define it
export type BusinessPlan = PlanDocument;

// ============================================================================
// PROGRAM TYPES
// ============================================================================

export interface ProgramSummary {
  id: string;
  name: string;
  type?: string;
  amountRange?: string;
  deadline?: string;
  [key: string]: any;
}

export interface ConnectCopy {
  openFinder?: string;
  pasteLink?: string;
  inputLabel?: string;
  placeholder?: string;
  example?: string;
  submit?: string;
  error?: string;
  [key: string]: any;
}

// ============================================================================
// AI & CONVERSATION TYPES
// ============================================================================

export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: number;
  [key: string]: any;
}

export type QuestionStatus = 'pending' | 'answered' | 'skipped' | 'hidden';

export interface Section {
  id: string;
  title: string;
  content?: string;
  [key: string]: any;
}

// ============================================================================
// TEMPLATE TYPES
// ============================================================================

export interface SectionTemplate {
  id: string;
  title: string;
  description?: string;
  required?: boolean;
  origin?: 'template' | 'custom';
  [key: string]: any;
}

export interface DocumentTemplate {
  id: string;
  name: string;
  description?: string;
  required?: boolean;
  origin?: 'template' | 'custom';
  [key: string]: any;
}

// ============================================================================
// UI TYPES - Used by multiple components (Single Source of Truth)
// ============================================================================

/**
 * Dropdown position for portal-based dropdowns
 * Used by: ProductSelection, ProgramSelection, useDropdownPosition hook
 */
export type DropdownPosition = {
  top: number;
  left: number;
  width: number;
};

/**
 * Options for dropdown positioning
 * Used by: useDropdownPosition hook
 */
export type DropdownPositionOptions = {
  offset?: number;
  maxWidth?: number;
  minWidth?: number;
  position?: 'below' | 'above';
};

/**
 * Preview zoom presets
 * Used by: PreviewWorkspace, usePreviewControls hook
 */
export type ZoomPreset = '50' | '75' | '100' | '125' | '150' | '200';

/**
 * Preview view mode
 * Used by: PreviewWorkspace, usePreviewControls hook
 */
export type ViewMode = 'page' | 'fluid';

/**
 * Preview controls state
 * Used by: PreviewWorkspace, usePreviewControls hook
 */
export interface PreviewControls {
  viewMode: ViewMode;
  showWatermark: boolean;
  zoomPreset: ZoomPreset;
  fitScale: number;
  previewPadding: number;
}

/**
 * Edit handlers interface
 * Used by: Editor, Sidebar, DocumentsBar, useEditHandlers hook
 */
export interface EditHandlers<T> {
  onEdit: (item: T) => void;
  onSave: (item: T) => void;
  onCancel: () => void;
}

/**
 * Toggle handlers interface
 * Used by: Editor, useToggleHandlers hook
 */
export interface ToggleHandlers {
  toggle: (id: string) => void;
  isDisabled: (id: string) => boolean;
  enabledCount: number;
  totalCount: number;
}

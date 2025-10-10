// ========= PLAN2FUND — UNIFIED EDITOR TYPES =========
// Type definitions for the unified editor architecture
// Reuses existing interfaces from requirements.ts and categoryConverters.ts

// Import existing types

// ============================================================================
// CORE EDITOR TYPES
// ============================================================================

// Re-export existing types to avoid duplication
export type { EditorSection as EditorSection } from './requirements';
export type { EditorRequirement } from './requirements';

// Unified editor section (combines both existing types)
export interface UnifiedEditorSection {
  id: string;
  title: string;
  required: boolean;
  template: string;
  guidance: string;
  requirements: string[]; // Requirement IDs that this section addresses
  prefillData: Record<string, any>;
  
  // Additional fields from categoryConverters
  section_name?: string;
  prompt?: string;
  placeholder?: string;
  description?: string;
  validation_rules?: any[];
  values?: string[];
  word_count_min?: number;
  word_count_max?: number;
  ai_guidance?: string;
  hints?: string[];
}

// Product/Program selection
export interface EditorProduct {
  id: string;
  name: string;
  type: 'grant' | 'loan' | 'equity' | 'visa' | 'consulting' | 'service' | 'other';
  description?: string;
  sections?: UnifiedEditorSection[];
  requirements?: any;
}

// Template selection
export interface EditorTemplate {
  id: string;
  name: string;
  description: string;
  route: string;
  sections: UnifiedEditorSection[];
  category?: string;
}

// Progress tracking
export interface EditorProgress {
  overall: number; // 0-100
  sections: SectionProgress[];
  lastUpdated: Date;
}

export interface SectionProgress {
  id: string;
  title: string;
  completed: boolean;
  progress: number; // 0-100
  wordCount?: number;
  wordCountTarget?: { min?: number; max?: number };
  lastModified?: Date;
}

// Editor state
export interface EditorState {
  // Core state
  product: EditorProduct | null;
  template: EditorTemplate | null;
  sections: UnifiedEditorSection[];
  content: Record<string, string>;
  progress: EditorProgress;
  
  // UI state
  activeSection: string | null;
  isLoading: boolean;
  error: string | null;
  
  // Feature state
  aiAssistant: AIAssistantState;
  readiness: ReadinessState;
  collaboration: CollaborationState;
}

// AI Assistant state
export interface AIAssistantState {
  isOpen: boolean;
  messages: ChatMessage[];
  currentSection: string | null;
  isLoading: boolean;
}

export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// Readiness check state
export interface ReadinessState {
  score: number; // 0-100
  dimensions: ReadinessDimension[];
  lastChecked: Date;
}

export interface ReadinessDimension {
  id: string;
  title: string;
  score: number; // 0-100
  status: 'passed' | 'warning' | 'failed';
  message: string;
}

// Collaboration state
export interface CollaborationState {
  isEnabled: boolean;
  teamMembers: TeamMember[];
  currentUser: User;
  isOnline: boolean;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'editor' | 'viewer';
  avatar?: string;
  isOnline: boolean;
  lastSeen: Date;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

// Editor actions
export interface EditorActions {
  setProduct: (product: EditorProduct) => void;
  setTemplate: (template: EditorTemplate) => void;
  updateSection: (sectionId: string, content: string) => void;
  setActiveSection: (sectionId: string | null) => void;
  saveContent: () => Promise<void>;
  exportDocument: (format: string) => Promise<void>;
  loadProgramData: (programId: string) => Promise<void>;
  resetEditor: () => void;
  // Additional actions
  sendAIMessage: (message: string) => void;
  checkReadiness: () => void;
  setAIAssistant: (updates: Partial<AIAssistantState>) => void;
}

// Editor context
export interface EditorContextType {
  state: EditorState;
  actions: EditorActions;
}

// Export settings
export interface ExportSettings {
  format: 'pdf' | 'docx' | 'html' | 'txt';
  includeSections: string[];
  includeMetadata: boolean;
  includeProgress: boolean;
  filename?: string;
}

// Editor configuration
export interface EditorConfig {
  features: {
    aiAssistant: boolean;
    readinessCheck: boolean;
    collaboration: boolean;
    templates: boolean;
    export: boolean;
  };
  ui: {
    sidebarWidth: number;
    showProgress: boolean;
    showWordCount: boolean;
    theme: 'light' | 'dark';
  };
  data: {
    autoSave: boolean;
    autoSaveInterval: number; // milliseconds
    maxHistorySize: number;
  };
}

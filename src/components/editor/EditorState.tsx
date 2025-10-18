// ========= PLAN2FUND — EDITOR STATE MANAGEMENT =========
// Centralized state management for the unified editor architecture

import React, { createContext, useContext, useReducer, useCallback, useMemo, useRef, ReactNode } from 'react';
import { EditorState, EditorActions, EditorContextType, EditorProduct, EditorTemplate, UnifiedEditorSection } from '../../types/editor';
import { EditorEngine } from '../../lib/editor/EditorEngine';
import { EditorDataProvider } from '../../lib/editor/EditorDataProvider';

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState: EditorState = {
  // Core state
  product: null,
  template: null,
  sections: [],
  content: {},
  progress: {
    overall: 0,
    sections: [],
    lastUpdated: new Date()
  },
  
  // UI state
  activeSection: null,
  isLoading: false,
  error: null,
  
  // Feature state
  aiAssistant: {
    isOpen: false,
    messages: [],
    currentSection: null,
    isLoading: false
  },
  readiness: {
    score: 0,
    dimensions: [],
    lastChecked: new Date()
  },
  collaboration: {
    isEnabled: false,
    teamMembers: [],
    currentUser: {
      id: 'current-user',
      name: 'Current User',
      email: 'user@example.com'
    },
    isOnline: true
  }
};

// ============================================================================
// ACTION TYPES
// ============================================================================

type EditorAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_PRODUCT'; payload: EditorProduct | null }
  | { type: 'SET_TEMPLATE'; payload: EditorTemplate | null }
  | { type: 'SET_SECTIONS'; payload: UnifiedEditorSection[] }
  | { type: 'SET_CONTENT'; payload: Record<string, string> }
  | { type: 'UPDATE_SECTION_CONTENT'; payload: { sectionId: string; content: string } }
  | { type: 'SET_ACTIVE_SECTION'; payload: string | null }
  | { type: 'SET_PROGRESS'; payload: EditorState['progress'] }
  | { type: 'SET_AI_ASSISTANT'; payload: Partial<EditorState['aiAssistant']> }
  | { type: 'ADD_AI_MESSAGE'; payload: { id: string; type: 'user' | 'assistant'; content: string; timestamp: Date } }
  | { type: 'SET_READINESS'; payload: EditorState['readiness'] }
  | { type: 'RESET_EDITOR' };

// ============================================================================
// REDUCER
// ============================================================================

function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
      
    case 'SET_ERROR':
      return { ...state, error: action.payload };
      
    case 'SET_PRODUCT':
      return { ...state, product: action.payload };
      
    case 'SET_TEMPLATE':
      return { ...state, template: action.payload };
      
    case 'SET_SECTIONS':
      return { ...state, sections: action.payload };
      
    case 'SET_CONTENT':
      return { ...state, content: action.payload };
      
    case 'UPDATE_SECTION_CONTENT':
      return {
        ...state,
        content: {
          ...state.content,
          [action.payload.sectionId]: action.payload.content
        }
      };
      
    case 'SET_ACTIVE_SECTION':
      return { ...state, activeSection: action.payload };
      
    case 'SET_PROGRESS':
      return { ...state, progress: action.payload };
      
    case 'SET_AI_ASSISTANT':
      return {
        ...state,
        aiAssistant: { ...state.aiAssistant, ...action.payload }
      };
      
    case 'ADD_AI_MESSAGE':
      return {
        ...state,
        aiAssistant: {
          ...state.aiAssistant,
          messages: [...state.aiAssistant.messages, {
            id: action.payload.id,
            type: action.payload.type,
            content: action.payload.content,
            timestamp: action.payload.timestamp
          }]
        }
      };
      
    case 'SET_READINESS':
      return { ...state, readiness: action.payload };
      
    case 'RESET_EDITOR':
      return initialState;
      
    default:
      return state;
  }
}

// ============================================================================
// CONTEXT
// ============================================================================

const EditorContext = createContext<EditorContextType | null>(null);

// ============================================================================
// PROVIDER
// ============================================================================

interface EditorProviderProps {
  children: ReactNode;
}

export function EditorProvider({ children }: EditorProviderProps) {
  const [state, dispatch] = useReducer(editorReducer, initialState);
  
  // Initialize editor engine (memoized to prevent recreation on every render)
  const dataProvider = useMemo(() => new EditorDataProvider(), []);
  const editorEngine = useMemo(() => new EditorEngine(dataProvider), [dataProvider]);
  
  // Use refs for stable references
  const editorEngineRef = useRef(editorEngine);
  editorEngineRef.current = editorEngine;

  // ============================================================================
  // ACTIONS
  // ============================================================================

  const setProduct = useCallback(async (product: EditorProduct) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      dispatch({ type: 'SET_PRODUCT', payload: product });
      
      // Load sections for the product
      const sections = await editorEngineRef.current.loadSections(product.id);
      dispatch({ type: 'SET_SECTIONS', payload: sections });
      
      // Initialize content for each section
      const initialContent: Record<string, string> = {};
      sections.forEach(section => {
        initialContent[section.id] = section.template || '';
      });
      dispatch({ type: 'SET_CONTENT', payload: initialContent });
      
      // Set first section as active
      if (sections.length > 0) {
        dispatch({ type: 'SET_ACTIVE_SECTION', payload: sections[0].id });
      }
      
      // Calculate initial progress
      const progress = editorEngineRef.current.calculateProgress(sections, initialContent);
      dispatch({ type: 'SET_PROGRESS', payload: progress });
      
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to load product' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const setTemplate = useCallback(async (template: EditorTemplate) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      dispatch({ type: 'SET_TEMPLATE', payload: template });
      
      // If we have a product, reload sections with template
      if (state.product) {
        const sections = await editorEngineRef.current.loadSections(state.product.id, template.id);
        dispatch({ type: 'SET_SECTIONS', payload: sections });
        
        // Update progress
        const progress = editorEngineRef.current.calculateProgress(sections, state.content);
        dispatch({ type: 'SET_PROGRESS', payload: progress });
      }
      
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to load template' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.product, state.content]);

  // Debounced progress calculation to avoid calculating on every keystroke
  const debouncedProgressCalculation = useMemo(() => {
    let timeoutId: NodeJS.Timeout;
    return (sections: UnifiedEditorSection[], content: Record<string, string>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const progress = editorEngineRef.current.calculateProgress(sections, content);
        dispatch({ type: 'SET_PROGRESS', payload: progress });
      }, 300); // 300ms debounce
    };
  }, []);

  const updateSection = useCallback((sectionId: string, content: string) => {
    dispatch({ type: 'UPDATE_SECTION_CONTENT', payload: { sectionId, content } });
    
    // Debounced progress calculation
    const newContent = { ...state.content, [sectionId]: content };
    debouncedProgressCalculation(state.sections, newContent);
  }, [state.sections, state.content, debouncedProgressCalculation]);

  const setActiveSection = useCallback((sectionId: string | null) => {
    dispatch({ type: 'SET_ACTIVE_SECTION', payload: sectionId });
  }, []);

  const saveContent = useCallback(async () => {
    try {
      await editorEngineRef.current.saveContent(state.content);
      console.log('Content saved successfully');
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to save content' });
    }
  }, [state.content]);

  // exportDocument removed - export happens in Preview page after payment

  const loadProgramData = useCallback(async (programId: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const product = await editorEngineRef.current.loadProduct(programId);
      await setProduct(product);
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to load program data' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [setProduct]);

  const resetEditor = useCallback(() => {
    dispatch({ type: 'RESET_EDITOR' });
  }, []);

  // ============================================================================
  // AI ASSISTANT ACTIONS
  // ============================================================================

  const sendAIMessage = useCallback(async (message: string) => {
    const messageId = Date.now().toString();
    const now = Date.now();
    
    // Add user message
    dispatch({ type: 'ADD_AI_MESSAGE', payload: {
      id: messageId,
      type: 'user',
      content: message,
      timestamp: new Date(now)
    }});
    
    // Set loading
    dispatch({ type: 'SET_AI_ASSISTANT', payload: { isLoading: true } });
    
    try {
      // Get AI response
      const response = await editorEngineRef.current.getAIResponse(message, {
        sections: state.sections,
        content: state.content,
        activeSection: state.activeSection
      });
      
      // Add AI response
      dispatch({ type: 'ADD_AI_MESSAGE', payload: {
        id: (now + 1).toString(),
        type: 'assistant',
        content: response,
        timestamp: new Date(now + 1)
      }});
      
    } catch (error) {
      dispatch({ type: 'ADD_AI_MESSAGE', payload: {
        id: (now + 1).toString(),
        type: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(now + 1)
      }});
    } finally {
      dispatch({ type: 'SET_AI_ASSISTANT', payload: { isLoading: false } });
    }
  }, [state.sections, state.content, state.activeSection]);

  // ============================================================================
  // READINESS CHECK ACTIONS
  // ============================================================================

  const checkReadiness = useCallback(async () => {
    try {
      const readiness = await editorEngineRef.current.calculateReadiness(state.sections, state.content);
      dispatch({ type: 'SET_READINESS', payload: readiness });
    } catch (error) {
      console.error('Error checking readiness:', error);
    }
  }, [state.sections, state.content]);

  // ============================================================================
  // CONTEXT VALUE
  // ============================================================================

  const actions: EditorActions = {
    setProduct,
    setTemplate,
    updateSection,
    setActiveSection,
    saveContent,
    loadProgramData,
    resetEditor,
    sendAIMessage,
    checkReadiness,
    setAIAssistant: (updates: Partial<EditorState['aiAssistant']>) => dispatch({ type: 'SET_AI_ASSISTANT', payload: updates })
  };


  const contextValue: EditorContextType = {
    state,
    actions
  };

  return (
    <EditorContext.Provider value={contextValue}>
      {children}
    </EditorContext.Provider>
  );
}

// ============================================================================
// HOOK
// ============================================================================

export function useEditorState() {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error('useEditorState must be used within an EditorProvider');
  }
  return context;
}

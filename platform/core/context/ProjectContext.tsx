/**
 * UNIFIED PROJECT CONTEXT (React Context + Zustand)
 * Wrapper around useProjectStore for React component consumption
 * Provides context-based access to global project state
 * 
 * Features:
 * - Single context provider to wrap entire app
 * - useProject() hook for consuming state
 * - useUser() hook for backward compatibility
 * - Automatic persistence via Zustand middleware
 */

import React, { createContext, ReactNode } from 'react';
import { useProjectStore, type ProjectStore } from '../store/useProjectStore';

/**
 * Create context with undefined as initial value
 * This forces explicit Provider usage
 */
export const ProjectContextValue = createContext<ProjectStore | undefined>(undefined);

/**
 * Provider component that wraps the app
 */
export interface ProjectContextProviderProps {
  children: ReactNode;
}

export const ProjectContextProvider: React.FC<ProjectContextProviderProps> = ({ children }) => {
  const store = useProjectStore();

  return (
    <ProjectContextValue.Provider value={store}>
      {children}
    </ProjectContextValue.Provider>
  );
};

/**
 * Hook to access the entire project store
 * Throws error if used outside ProjectContextProvider
 */
export const useProjectContext = (): ProjectStore => {
  const context = React.useContext(ProjectContextValue);
  if (context === undefined) {
    throw new Error(
      'useProjectContext must be used within a ProjectContextProvider. ' +
      'Wrap your app with <ProjectContextProvider> at a high level.'
    );
  }
  return context;
};

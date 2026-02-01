// Placeholder for plan instance state management
import type { PlanDocument } from '../../types/types';

export interface PlanInstanceState {
  id: string;
  document: PlanDocument;
  isDirty: boolean;
  isValid: boolean;
  lastSaved: string | null;
  currentView: 'editor' | 'preview' | 'structure';
}

export interface PlanInstanceStore {
  instances: PlanInstanceState[];
  activeInstanceId: string | null;
  createInstance: (document: PlanDocument) => void;
  updateInstance: (id: string, updates: Partial<PlanInstanceState>) => void;
  saveInstance: (id: string) => Promise<void>;
  setActiveInstance: (id: string) => void;
  validateInstance: (id: string) => boolean;
}

export const initialPlanInstanceState: PlanInstanceState = {
  id: 'default-instance',
  document: {
    language: 'en',
    settings: {
      includeTitlePage: true,
      includePageNumbers: true
    },
    sections: []
  },
  isDirty: false,
  isValid: true,
  lastSaved: null,
  currentView: 'editor'
};
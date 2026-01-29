import type { ProgramSummary } from '../../types/types';

export interface ProgramState {
  programSummary: ProgramSummary | null;
  programLoading: boolean;
  programError: string | null;
  isConfiguratorOpen: boolean;
}

export interface ProgramActions {
  setProgramSummary: (summary: ProgramSummary | null) => void;
  setProgramLoading: (loading: boolean) => void;
  setProgramError: (error: string | null) => void;
  setIsConfiguratorOpen: (open: boolean) => void;
}

export const createProgramDomain = (set: any): ProgramActions => ({
  setProgramSummary: (summary: ProgramSummary | null) => set({ programSummary: summary }),
  setProgramLoading: (loading: boolean) => set({ programLoading: loading }),
  setProgramError: (error: string | null) => set({ programError: error }),
  setIsConfiguratorOpen: (open: boolean) => set({ isConfiguratorOpen: open }),
});
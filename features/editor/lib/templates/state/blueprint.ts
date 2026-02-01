// Placeholder for blueprint state management
import type { DocumentTemplate, SectionTemplate } from '../../types/types';

export interface BlueprintState {
  id: string;
  name: string;
  sections: SectionTemplate[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BlueprintStore {
  blueprints: BlueprintState[];
  activeBlueprintId: string | null;
  createBlueprint: (name: string, sections: SectionTemplate[]) => void;
  updateBlueprint: (id: string, updates: Partial<BlueprintState>) => void;
  deleteBlueprint: (id: string) => void;
  setActiveBlueprint: (id: string) => void;
}

export const initialBlueprintState: BlueprintState = {
  id: 'default',
  name: 'Default Blueprint',
  sections: [],
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};
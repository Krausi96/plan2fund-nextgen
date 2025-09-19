// Simple Dynamic Wizard - Minimal replacement for quarantined files

export interface Question {
  id: string;
  label: string;
  type: 'single-select' | 'multi-select';
  options: Array<{ value: string; label: string }>;
  required: boolean;
  informationValue: number;
  programsAffected: number;
}

export class DynamicWizardEngine {
  getQuestionOrder(): Question[] {
    // Simple fallback - return empty array
    return [];
  }
}

export const dynamicWizard = new DynamicWizardEngine();

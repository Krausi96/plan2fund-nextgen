// Enhanced Data Source - GPT-Enhanced with AI features
import { Program } from "../types";

// GPT-Enhanced Program interface
export interface GPTEnhancedProgram extends Program {
  target_personas?: string[];
  tags?: string[];
  decision_tree_questions?: DecisionTreeQuestion[];
  editor_sections?: EditorSection[];
  readiness_criteria?: ReadinessCriterion[];
  ai_guidance?: AIGuidance;
}

export interface DecisionTreeQuestion {
  id: string;
  question: string;
  type: 'single' | 'multiple' | 'text' | 'number';
  options?: Array<{value: string; label: string}>;
  validation?: any;
  followUpQuestions?: string[];
  skipConditions?: any[];
}

export interface EditorSection {
  id: string;
  title: string;
  required: boolean;
  template: string;
  guidance: string;
  requirements?: string[];
  prefillData?: Record<string, string>;
}

export interface ReadinessCriterion {
  id: string;
  title: string;
  description: string;
  checkType: 'validation' | 'content_analysis' | 'document_check';
  weight: number;
  validationRules?: any[];
}

export interface AIGuidance {
  context: string;
  tone: 'professional' | 'academic' | 'enthusiastic' | 'technical';
  key_points: string[];
  prompts?: Record<string, string>;
}

export interface ProgramDataSource {
  getPrograms(): Promise<Program[]>;
  getGPTEnhancedPrograms(): Promise<GPTEnhancedProgram[]>;
  getDecisionTreeQuestions(programId: string): Promise<DecisionTreeQuestion[]>;
  getEditorSections(programId: string): Promise<EditorSection[]>;
  getReadinessCriteria(programId: string): Promise<ReadinessCriterion[]>;
  getAIGuidance(programId: string): Promise<AIGuidance | null>;
  getProgramsBySymptoms(symptomData: any): Promise<Program[]>;
  getProgramsByType(type: string): Promise<Program[]>;
}

class HybridDataSource implements ProgramDataSource {
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    this.isInitialized = true;
  }

  async getPrograms(): Promise<Program[]> {
    await this.initialize();
    
    try {
      const response = await fetch('/api/programs');
      if (!response.ok) throw new Error('Failed to fetch programs');
      const data = await response.json();
      return data.programs || [];
    } catch (error) {
      console.error('API error:', error);
      return [];
    }
  }

  async getGPTEnhancedPrograms(): Promise<GPTEnhancedProgram[]> {
    await this.initialize();
    
    try {
      const response = await fetch('/api/gpt-enhanced?action=programs');
      if (!response.ok) throw new Error('Failed to fetch GPT-enhanced programs');
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('API error:', error);
      return [];
    }
  }

  async getDecisionTreeQuestions(programId: string): Promise<DecisionTreeQuestion[]> {
    await this.initialize();
    
    try {
      const response = await fetch(`/api/gpt-enhanced?action=questions&programId=${programId}`);
      if (!response.ok) throw new Error('Failed to fetch decision tree questions');
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('API error:', error);
      return [];
    }
  }

  async getEditorSections(programId: string): Promise<EditorSection[]> {
    await this.initialize();
    
    try {
      const response = await fetch(`/api/gpt-enhanced?action=sections&programId=${programId}`);
      if (!response.ok) throw new Error('Failed to fetch editor sections');
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('API error:', error);
      return [];
    }
  }

  async getReadinessCriteria(programId: string): Promise<ReadinessCriterion[]> {
    await this.initialize();
    
    try {
      const response = await fetch(`/api/gpt-enhanced?action=criteria&programId=${programId}`);
      if (!response.ok) throw new Error('Failed to fetch readiness criteria');
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('API error:', error);
      return [];
    }
  }

  async getAIGuidance(programId: string): Promise<AIGuidance | null> {
    await this.initialize();
    
    try {
      const response = await fetch(`/api/gpt-enhanced?action=guidance&programId=${programId}`);
      if (!response.ok) throw new Error('Failed to fetch AI guidance');
      const data = await response.json();
      return data.data || null;
    } catch (error) {
      console.error('API error:', error);
      return null;
    }
  }

  async getProgramsBySymptoms(_symptomData: any): Promise<Program[]> {
    // For now, return all programs as a fallback
    // This can be enhanced later with symptom-based filtering
    return this.getPrograms();
  }

  async getProgramsByType(type: string): Promise<Program[]> {
    await this.initialize();
    
    try {
      const response = await fetch(`/api/programs?type=${type}`);
      if (!response.ok) throw new Error('Failed to fetch programs by type');
      const data = await response.json();
      return data.programs || [];
    } catch (error) {
      console.error('API error:', error);
      return [];
    }
  }
}

// Export singleton instance
export const dataSource = new HybridDataSource();
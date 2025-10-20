// Simple Data Source - Uses fallback data to avoid API issues
import { Program } from "../types";

// GPT-Enhanced Program interface
export interface GPTEnhancedProgram extends Program {
  target_personas?: string[];
  tags?: string[];
  decision_tree_questions?: any[];
  editor_sections?: any[];
  readiness_criteria?: any[];
  ai_guidance?: any;
  categorized_requirements?: any;
}

export interface ProgramDataSource {
  getPrograms(): Promise<Program[]>;
  getGPTEnhancedPrograms(): Promise<GPTEnhancedProgram[]>;
  getDecisionTreeQuestions(programId: string): Promise<any[]>;
  getEditorSections(programId: string): Promise<any[]>;
  getReadinessCriteria(programId: string): Promise<any[]>;
  getAIGuidance(programId: string): Promise<any | null>;
  getProgramsBySymptoms(symptomData: any): Promise<Program[]>;
  getProgramsByType(type: string): Promise<Program[]>;
}

class SimpleDataSource implements ProgramDataSource {
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    this.isInitialized = true;
    console.log('🔄 Simple data source initialized with fallback data');
  }

  async getPrograms(): Promise<Program[]> {
    await this.initialize();
    return this.getFallbackPrograms();
  }

  async getGPTEnhancedPrograms(): Promise<GPTEnhancedProgram[]> {
    await this.initialize();
    return this.getFallbackPrograms();
  }

  async getDecisionTreeQuestions(programId: string): Promise<any[]> {
    return [];
  }

  async getEditorSections(programId: string): Promise<any[]> {
    return [];
  }

  async getReadinessCriteria(programId: string): Promise<any[]> {
    return [];
  }

  async getAIGuidance(programId: string): Promise<any | null> {
    return null;
  }

  async getProgramsBySymptoms(symptomData: any): Promise<Program[]> {
    return this.getFallbackPrograms();
  }

  async getProgramsByType(type: string): Promise<Program[]> {
    const programs = await this.getFallbackPrograms();
    return programs.filter(p => p.type === type);
  }

  private getFallbackPrograms(): GPTEnhancedProgram[] {
    // Return a simple set of mock programs for testing
    return [
      {
        id: 'aws_preseed_live',
        name: 'AWS Preseed Program',
        type: 'grant',
        program_type: 'grant',
        program_category: 'austrian_grants',
        requirements: {},
        notes: 'Mock program for testing',
        maxAmount: 200000,
        link: 'https://aws.at',
        target_personas: ['startup', 'sme'],
        tags: ['innovation', 'startup', 'non-dilutive', 'aws'],
        decision_tree_questions: [],
        editor_sections: [],
        readiness_criteria: [],
        ai_guidance: {
          context: 'AWS Preseed Program guidance',
          tone: 'professional',
          key_points: ['Check eligibility requirements', 'Prepare business plan'],
          prompts: {}
        }
      },
      {
        id: 'ffg_basic_research',
        name: 'FFG Basic Research Program',
        type: 'grant',
        program_type: 'grant',
        program_category: 'research_grants',
        requirements: {},
        notes: 'Mock research program for testing',
        maxAmount: 500000,
        link: 'https://ffg.at',
        target_personas: ['researcher', 'startup'],
        tags: ['research', 'innovation', 'ffg'],
        decision_tree_questions: [],
        editor_sections: [],
        readiness_criteria: [],
        ai_guidance: {
          context: 'FFG Basic Research Program guidance',
          tone: 'academic',
          key_points: ['Research proposal required', 'Academic credentials needed'],
          prompts: {}
        }
      },
      {
        id: 'eu_horizon_europe',
        name: 'Horizon Europe',
        type: 'grant',
        program_type: 'grant',
        program_category: 'eu_programs',
        requirements: {},
        notes: 'Mock EU program for testing',
        maxAmount: 2000000,
        link: 'https://ec.europa.eu',
        target_personas: ['startup', 'sme', 'researcher'],
        tags: ['eu', 'innovation', 'research'],
        decision_tree_questions: [],
        editor_sections: [],
        readiness_criteria: [],
        ai_guidance: {
          context: 'Horizon Europe program guidance',
          tone: 'professional',
          key_points: ['EU consortium required', 'Innovation focus needed'],
          prompts: {}
        }
      }
    ];
  }
}

export const dataSource = new SimpleDataSource();
export default dataSource;

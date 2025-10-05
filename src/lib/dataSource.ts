// Enhanced Data Source - GPT-Enhanced with AI features
import { Program } from "../types";
import { Pool } from 'pg';

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

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
      const result = await pool.query(`
        SELECT id, name, description, program_type, funding_amount_min, funding_amount_max, 
               source_url, deadline, is_active, scraped_at
        FROM programs 
        WHERE is_active = true
        ORDER BY scraped_at DESC
      `);
      
      return result.rows.map(row => ({
        id: row.id,
        name: row.name,
        description: row.description,
        type: row.program_type,
        minAmount: row.funding_amount_min,
        maxAmount: row.funding_amount_max,
        sourceUrl: row.source_url,
        deadline: row.deadline,
        notes: row.description
      }));
    } catch (error) {
      console.error('Database error:', error);
      return [];
    }
  }

  async getGPTEnhancedPrograms(): Promise<GPTEnhancedProgram[]> {
    await this.initialize();
    
    try {
      const result = await pool.query(`
        SELECT id, name, description, program_type, funding_amount_min, funding_amount_max, 
               source_url, deadline, is_active, scraped_at,
               target_personas, tags, decision_tree_questions, 
               editor_sections, readiness_criteria, ai_guidance
        FROM programs 
        WHERE is_active = true
        ORDER BY scraped_at DESC
      `);
      
      return result.rows.map(row => ({
        id: row.id,
        name: row.name,
        description: row.description,
        type: row.program_type,
        minAmount: row.funding_amount_min,
        maxAmount: row.funding_amount_max,
        sourceUrl: row.source_url,
        deadline: row.deadline,
        notes: row.description,
        target_personas: row.target_personas ? JSON.parse(row.target_personas) : [],
        tags: row.tags ? JSON.parse(row.tags) : [],
        decision_tree_questions: row.decision_tree_questions ? JSON.parse(row.decision_tree_questions) : [],
        editor_sections: row.editor_sections ? JSON.parse(row.editor_sections) : [],
        readiness_criteria: row.readiness_criteria ? JSON.parse(row.readiness_criteria) : [],
        ai_guidance: row.ai_guidance ? JSON.parse(row.ai_guidance) : null
      }));
    } catch (error) {
      console.error('Database error:', error);
      return [];
    }
  }

  async getDecisionTreeQuestions(programId: string): Promise<DecisionTreeQuestion[]> {
    await this.initialize();
    
    try {
      const result = await pool.query(`
        SELECT decision_tree_questions 
        FROM programs 
        WHERE id = $1 AND is_active = true
      `, [programId]);
      
      if (result.rows.length === 0) return [];
      
      const questions = result.rows[0].decision_tree_questions;
      return questions ? JSON.parse(questions) : [];
    } catch (error) {
      console.error('Database error:', error);
      return [];
    }
  }

  async getEditorSections(programId: string): Promise<EditorSection[]> {
    await this.initialize();
    
    try {
      const result = await pool.query(`
        SELECT editor_sections 
        FROM programs 
        WHERE id = $1 AND is_active = true
      `, [programId]);
      
      if (result.rows.length === 0) return [];
      
      const sections = result.rows[0].editor_sections;
      return sections ? JSON.parse(sections) : [];
    } catch (error) {
      console.error('Database error:', error);
      return [];
    }
  }

  async getReadinessCriteria(programId: string): Promise<ReadinessCriterion[]> {
    await this.initialize();
    
    try {
      const result = await pool.query(`
        SELECT readiness_criteria 
        FROM programs 
        WHERE id = $1 AND is_active = true
      `, [programId]);
      
      if (result.rows.length === 0) return [];
      
      const criteria = result.rows[0].readiness_criteria;
      return criteria ? JSON.parse(criteria) : [];
    } catch (error) {
      console.error('Database error:', error);
      return [];
    }
  }

  async getAIGuidance(programId: string): Promise<AIGuidance | null> {
    await this.initialize();
    
    try {
      const result = await pool.query(`
        SELECT ai_guidance 
        FROM programs 
        WHERE id = $1 AND is_active = true
      `, [programId]);
      
      if (result.rows.length === 0) return null;
      
      const guidance = result.rows[0].ai_guidance;
      return guidance ? JSON.parse(guidance) : null;
    } catch (error) {
      console.error('Database error:', error);
      return null;
    }
  }
}

// Export singleton instance
export const dataSource = new HybridDataSource();
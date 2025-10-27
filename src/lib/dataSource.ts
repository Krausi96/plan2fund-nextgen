// Enhanced Data Source - GPT-Enhanced with AI features
import { Program } from "../types/requirements";

// GPT-Enhanced Program interface
export interface GPTEnhancedProgram extends Program {
  target_personas?: string[];
  tags?: string[];
  decision_tree_questions?: DecisionTreeQuestion[];
  editor_sections?: EditorSection[];
  readiness_criteria?: ReadinessCriterion[];
  ai_guidance?: AIGuidance;
  categorized_requirements?: any; // From Layer 1&2 - 18 categories
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
    
    // Just call API directly - it's what we always end up doing anyway
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000';
    
    const response = await fetch(`${baseUrl}/api/programs`, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
    
    if (!response.ok) throw new Error(`Failed to fetch programs: ${response.status}`);
    const data = await response.json();
    
    if (data.success && data.programs && data.programs.length > 0) {
      return data.programs;
    }
    
    throw new Error('No programs found in API response');
  }

  async getGPTEnhancedPrograms(): Promise<GPTEnhancedProgram[]> {
    await this.initialize();

    try {
      // Use same-origin on the client to avoid CORS; on server use VERCEL_URL/localhost
      const isBrowser = typeof window !== 'undefined';
      const apiUrl = isBrowser
        ? `/api/programs?enhanced=true`
        : (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}/api/programs?enhanced=true` : `http://localhost:3000/api/programs?enhanced=true`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);

      const response = await fetch(apiUrl, {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.programs) && data.programs.length > 0) {
          return data.programs as GPTEnhancedProgram[];
        }
      }
    } catch (_err) {
      console.warn('Enhanced programs API failed, using migrated fallback');
    }

    // Fallback: on server we can read from filesystem; in browser return empty to avoid fs errors
    if (typeof window === 'undefined') {
      const migrated = this.getMigratedPrograms();
      const enhanced = migrated.map((p: any) => this.enhanceProgramWithAI(p));
      return enhanced;
    }
    return [];
  }

  // Helper method to enhance programs with AI fields
  private enhanceProgramWithAI(program: any): GPTEnhancedProgram {
    const programType = program.program_type || program.type || 'grant';
    const institution = program.institution || 'Unknown Institution';
    
    // Generate AI-enhanced fields based on program data
    const target_personas = this.generateTargetPersonas(program, programType, institution);
    const tags = this.generateTags(program, programType, institution);
    const decision_tree_questions = this.generateDecisionTreeQuestions(program, programType);
    const editor_sections = this.generateEditorSections(program, programType);
    const readiness_criteria = this.generateReadinessCriteria(program, programType);
    const ai_guidance = this.generateAIGuidance(program, programType, institution);

    return {
      id: program.id,
      name: program.name,
      type: programType,
      program_type: programType,
      program_category: program.program_category || 'general',
      requirements: program.requirements || {},
      notes: program.description || '',
      maxAmount: program.funding_amount_max || program.funding_amount || 0,
      link: program.source_url || program.url || '',
      target_personas,
      tags,
      decision_tree_questions,
      editor_sections,
      readiness_criteria,
      ai_guidance
    };
  }

  // Removed unused normalization helper (kept logic inline where needed)

  // Generate target personas based on program characteristics
  private generateTargetPersonas(program: any, _programType: string, institution: string): string[] {
    const personas: string[] = [];
    
    // Based on program type
    if (_programType === 'grant') {
      personas.push('startup', 'sme');
    } else if (_programType === 'loan') {
      personas.push('sme', 'established');
    } else if (_programType === 'equity') {
      personas.push('startup', 'scaleup');
    } else if (_programType === 'visa') {
      personas.push('founder', 'researcher');
    }
    
    // Based on institution
    if (institution.toLowerCase().includes('aws')) {
      personas.push('startup', 'innovator');
    } else if (institution.toLowerCase().includes('ffg')) {
      personas.push('researcher', 'innovator');
    } else if (institution.toLowerCase().includes('vba')) {
      personas.push('startup', 'vienna');
    }
    
    // Based on funding amount
    const maxAmount = program.funding_amount_max || program.funding_amount || 0;
    if (maxAmount < 100000) {
      personas.push('early-stage');
    } else if (maxAmount > 500000) {
      personas.push('scaleup', 'established');
    }
    
    return [...new Set(personas)]; // Remove duplicates
  }

  // Generate tags based on program characteristics
  private generateTags(program: any, programType: string, institution: string): string[] {
    const tags: string[] = [];
    
    // Program type tags
    tags.push(programType);
    
    // Institution tags
    if (institution.toLowerCase().includes('aws')) {
      tags.push('aws', 'innovation', 'non-dilutive');
    } else if (institution.toLowerCase().includes('ffg')) {
      tags.push('ffg', 'research', 'rd');
    } else if (institution.toLowerCase().includes('vba')) {
      tags.push('vba', 'vienna', 'startup');
    }
    
    // Theme tags based on description
    const description = (program.description || '').toLowerCase();
    if (description.includes('digital') || description.includes('tech')) {
      tags.push('digital', 'technology');
    }
    if (description.includes('green') || description.includes('sustainability')) {
      tags.push('green', 'sustainability');
    }
    if (description.includes('social') || description.includes('impact')) {
      tags.push('social-impact');
    }
    
    return [...new Set(tags)]; // Remove duplicates
  }

  // Generate decision tree questions
  private generateDecisionTreeQuestions(program: any, _programType: string): DecisionTreeQuestion[] {
    const questions: DecisionTreeQuestion[] = [];
    
    // Basic eligibility questions
    questions.push({
      id: `q_${program.id}_stage`,
      question: 'What is your company stage?',
      type: 'single',
      options: [
        { value: 'idea', label: 'Idea Stage' },
        { value: 'mvp', label: 'MVP/Prototype' },
        { value: 'revenue', label: 'Generating Revenue' }
      ]
    });
    
    if (_programType === 'grant') {
      questions.push({
        id: `q_${program.id}_innovation`,
        question: 'Is your project innovative?',
        type: 'single',
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' }
        ]
      });
    }
    
    return questions;
  }

  // Generate editor sections
  private generateEditorSections(_program: any, _programType: string): EditorSection[] {
    const sections: EditorSection[] = [];
    
    // Standard sections for all programs
    sections.push({
      id: 'executive_summary',
      title: 'Executive Summary',
      required: true,
      template: 'Provide a clear overview of your business and funding request',
      guidance: 'Focus on the key value proposition and funding need',
      requirements: ['Clear value proposition', 'Funding amount', 'Timeline']
    });
    
    if (_programType === 'grant') {
      sections.push({
        id: 'project_description',
        title: 'Project Description',
        required: true,
        template: 'Describe your innovative project in detail',
        guidance: 'Emphasize innovation, feasibility, and impact',
        requirements: ['Innovation aspect', 'Technical feasibility', 'Expected outcomes']
      });
    }
    
    return sections;
  }

  // Generate readiness criteria
  private generateReadinessCriteria(_program: any, _programType: string): ReadinessCriterion[] {
    const criteria: ReadinessCriterion[] = [];
    
    criteria.push({
      id: 'business_plan',
      title: 'Business Plan',
      description: 'Complete business plan required',
      checkType: 'document_check',
      weight: 1.0
    });
    
    if (_programType === 'grant') {
      criteria.push({
        id: 'innovation_proof',
        title: 'Innovation Proof',
        description: 'Evidence of innovation required',
        checkType: 'content_analysis',
        weight: 0.8
      });
    }
    
    return criteria;
  }

  // Generate AI guidance
  private generateAIGuidance(program: any, programType: string, institution: string): AIGuidance {
    return {
      context: `Guidance for ${program.name} (${institution})`,
      tone: 'professional',
      key_points: [
        `Focus on ${programType}-specific requirements`,
        `Emphasize alignment with ${institution} priorities`,
        'Provide clear financial projections'
      ],
      prompts: {
        executive_summary: `Write an executive summary for ${program.name}`,
        project_description: `Describe your project for ${institution}`
      }
    };
  }

  async getDecisionTreeQuestions(programId: string): Promise<DecisionTreeQuestion[]> {
    await this.initialize();
    
    try {
      const response = await fetch(`/api/programs-ai?action=questions&programId=${programId}`);
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
      const response = await fetch(`/api/programs-ai?action=sections&programId=${programId}`);
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
      const response = await fetch(`/api/programs-ai?action=criteria&programId=${programId}`);
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
      const response = await fetch(`/api/programs-ai?action=guidance&programId=${programId}`);
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

  private getMigratedPrograms(): Program[] {
    try {
      const fs = require('fs');
      const path = require('path');
      const dataPath = path.join(process.cwd(), 'data', 'migrated-programs.json');
      const data = fs.readFileSync(dataPath, 'utf8');
      const jsonData = JSON.parse(data);
      
      const programs = jsonData.programs || [];
      
      return programs.map((program: any) => ({
        id: program.id,
        name: program.name,
        type: program.program_type || 'grant',
        requirements: program.requirements || {},
        notes: program.description,
        maxAmount: program.funding_amount_max || program.funding_amount,
        link: program.source_url || program.url,
        // Preserve AI metadata
        target_personas: program.target_personas || [],
        tags: program.tags || [],
        decision_tree_questions: program.decision_tree_questions || [],
        editor_sections: program.editor_sections || [],
        readiness_criteria: program.readiness_criteria || [],
        ai_guidance: program.ai_guidance || null
      }));
    } catch (error) {
      console.error('Error loading migrated programs:', error);
      return [];
    }
  }
}

// Export singleton instance
export const dataSource = new HybridDataSource();
// Enhanced Data Source - GPT-Enhanced with AI features
import rawPrograms from "../../data/programs.json";
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
  getProgramById(id: string): Promise<Program | null>;
  searchPrograms(query: string): Promise<Program[]>;
  getProgramsByType(type: string): Promise<Program[]>;
  getProgramsByTargetGroup(targetGroup: string): Promise<Program[]>;
  // GPT-Enhanced methods
  getGPTEnhancedPrograms(): Promise<GPTEnhancedProgram[]>;
  getDecisionTreeQuestions(programId: string): Promise<DecisionTreeQuestion[]>;
  getEditorSections(programId: string): Promise<EditorSection[]>;
  getReadinessCriteria(programId: string): Promise<ReadinessCriterion[]>;
  getAIGuidance(programId: string): Promise<AIGuidance | null>;
}

export class HybridDataSource implements ProgramDataSource {
  private staticPrograms: Program[] = [];
  private scrapedPrograms: Program[] = [];
  private isInitialized = false;

  constructor() {
    // Transform raw programs to match Program type
    this.staticPrograms = (rawPrograms.programs || []).map((rawProgram: any) => ({
      id: rawProgram.id,
      name: rawProgram.name,
      type: rawProgram.type,
      requirements: rawProgram.eligibility || {},
      notes: rawProgram.description,
      maxAmount: rawProgram.thresholds?.max_grant_eur,
      link: rawProgram.link
    }));
  }

  async initialize() {
    if (this.isInitialized) return;
    
    try {
      // Try to load scraped data if available
      const scrapedData = await this.loadScrapedData();
      if (scrapedData && scrapedData.length > 0) {
        this.scrapedPrograms = scrapedData;
        console.log(`✅ Loaded ${scrapedData.length} scraped programs`);
      } else {
        console.log("⚠️ No scraped data found, using static programs only");
      }
    } catch (error) {
      console.log("⚠️ Could not load scraped data, using static programs only");
    }
    
    this.isInitialized = true;
  }

  private async loadScrapedData(): Promise<Program[] | null> {
    // For now, return null to avoid build issues
    // In production, this will be handled by API endpoints
    return null;
  }


  async getPrograms(): Promise<Program[]> {
    await this.initialize();
    
    // Combine static and scraped programs, removing duplicates
    const allPrograms = [...this.staticPrograms];
    
    // Add scraped programs that don't exist in static
    for (const scraped of this.scrapedPrograms) {
      if (!allPrograms.find(p => p.id === scraped.id)) {
        allPrograms.push(scraped);
      }
    }
    
    return allPrograms;
  }

  async getProgramById(id: string): Promise<Program | null> {
    const programs = await this.getPrograms();
    return programs.find(p => p.id === id) || null;
  }

  async searchPrograms(query: string): Promise<Program[]> {
    const programs = await this.getPrograms();
    const lowerQuery = query.toLowerCase();
    
    return programs.filter(program => 
      program.name.toLowerCase().includes(lowerQuery) ||
      (program.notes && program.notes.toLowerCase().includes(lowerQuery)) ||
      program.type.toLowerCase().includes(lowerQuery)
    );
  }

  async getProgramsByType(type: string): Promise<Program[]> {
    const programs = await this.getPrograms();
    return programs.filter(p => p.type === type);
  }

  async getProgramsByTargetGroup(targetGroup: string): Promise<Program[]> {
    const programs = await this.getPrograms();
    return programs.filter(p => 
      p.type.toLowerCase().includes(targetGroup.toLowerCase())
    );
  }

  // GPT-Enhanced methods
  async getGPTEnhancedPrograms(): Promise<GPTEnhancedProgram[]> {
    const programs = await this.getPrograms();
    
    // Transform to GPT-enhanced format
    return programs.map(program => ({
      ...program,
      target_personas: this.extractTargetPersonas(program),
      tags: this.extractTags(program),
      decision_tree_questions: this.generateDecisionTreeQuestions(program),
      editor_sections: this.generateEditorSections(program),
      readiness_criteria: this.generateReadinessCriteria(program),
      ai_guidance: this.generateAIGuidance(program)
    }));
  }

  async getDecisionTreeQuestions(programId: string): Promise<DecisionTreeQuestion[]> {
    const program = await this.getProgramById(programId);
    if (!program) return [];
    
    return this.generateDecisionTreeQuestions(program);
  }

  async getEditorSections(programId: string): Promise<EditorSection[]> {
    const program = await this.getProgramById(programId);
    if (!program) return [];
    
    return this.generateEditorSections(program);
  }

  async getReadinessCriteria(programId: string): Promise<ReadinessCriterion[]> {
    const program = await this.getProgramById(programId);
    if (!program) return [];
    
    return this.generateReadinessCriteria(program);
  }

  async getAIGuidance(programId: string): Promise<AIGuidance | null> {
    const program = await this.getProgramById(programId);
    if (!program) return null;
    
    return this.generateAIGuidance(program);
  }

  // Helper methods for GPT features
  private extractTargetPersonas(program: Program): string[] {
    const personas = [];
    if (program.type === 'grant') personas.push('startup');
    if (program.type === 'loan') personas.push('sme');
    if (program.maxAmount && program.maxAmount > 100000) personas.push('established');
    return personas;
  }

  private extractTags(program: Program): string[] {
    const tags = [];
    if (program.type === 'grant') tags.push('non-dilutive');
    if (program.type === 'loan') tags.push('debt-financing');
    if (program.maxAmount && program.maxAmount > 100000) tags.push('high-amount');
    if (program.notes?.toLowerCase().includes('innovation')) tags.push('innovation');
    return tags;
  }

  private generateDecisionTreeQuestions(program: Program): DecisionTreeQuestion[] {
    const questions: DecisionTreeQuestion[] = [];
    
    // Company stage question
    questions.push({
      id: `q_company_stage_${program.id}`,
      question: "What is your company stage?",
      type: 'single',
      options: [
        { value: 'PRE_COMPANY', label: 'Just an idea or team forming' },
        { value: 'INC_LT_6M', label: 'Recently started (less than 6 months)' },
        { value: 'INC_6M_2Y', label: 'Established (6 months to 2 years)' },
        { value: 'INC_2Y_PLUS', label: 'Mature company (2+ years)' }
      ]
    });

    // Funding amount question
    questions.push({
      id: `q_funding_amount_${program.id}`,
      question: "What funding amount are you seeking?",
      type: 'number',
      validation: {
        min: program.maxAmount ? Math.floor(program.maxAmount * 0.1) : 10000,
        max: program.maxAmount || 500000
      }
    });

    return questions;
  }

  private generateEditorSections(program: Program): EditorSection[] {
    const sections: EditorSection[] = [];
    
    // Executive Summary
    sections.push({
      id: 'executive_summary',
      title: 'Executive Summary',
      required: true,
      template: `Our innovative project [PROJECT_NAME] seeks [FUNDING_AMOUNT] in funding to [PROJECT_GOAL]. This ${program.type} opportunity aligns with our vision to [VISION_STATEMENT].`,
      guidance: 'Keep concise but compelling. Highlight innovation and impact.',
      requirements: ['project_name', 'funding_amount', 'project_goal']
    });

    // Project Description
    sections.push({
      id: 'project_description',
      title: 'Project Description',
      required: true,
      template: `This project [PROJECT_NAME] addresses [PROBLEM_STATEMENT] through [SOLUTION_APPROACH]. Our innovative methodology [METHODOLOGY] will deliver [EXPECTED_OUTCOMES].`,
      guidance: 'Include technical details and implementation approach.',
      requirements: ['problem_statement', 'solution_approach', 'methodology']
    });

    return sections;
  }

  private generateReadinessCriteria(program: Program): ReadinessCriterion[] {
    const criteria: ReadinessCriterion[] = [];
    
    // Company stage eligibility
    criteria.push({
      id: 'company_stage_eligibility',
      title: 'Company Stage Eligibility',
      description: 'Verify company meets stage requirements',
      checkType: 'validation',
      weight: 1.0,
      validationRules: [
        { type: 'required', field: 'company_stage' },
        { type: 'enum', field: 'company_stage', values: ['PRE_COMPANY', 'INC_LT_6M'] }
      ]
    });

    // Funding amount validation
    if (program.maxAmount) {
      criteria.push({
        id: 'funding_amount_validation',
        title: 'Funding Amount Validation',
        description: `Verify funding request is within program limits (max €${program.maxAmount.toLocaleString()})`,
        checkType: 'validation',
        weight: 0.8,
        validationRules: [
          { type: 'required', field: 'funding_amount' },
          { type: 'max', field: 'funding_amount', value: program.maxAmount }
        ]
      });
    }

    return criteria;
  }

  private generateAIGuidance(program: Program): AIGuidance {
    return {
      context: `${program.name} is a ${program.type} program that supports eligible applicants.`,
      tone: program.type === 'grant' ? 'professional' : 'academic',
      key_points: [
        'innovation',
        'market potential',
        'team expertise',
        'financial viability'
      ],
      prompts: {
        executive_summary: `Write an executive summary for ${program.name} that emphasizes innovation and market impact.`,
        project_description: `Describe your project for ${program.name} focusing on technical feasibility and innovation.`,
        financial_plan: `Create a financial plan for ${program.name} that demonstrates sustainability and growth potential.`
      }
    };
  }

  // Doctor-like diagnostic methods
  async getProgramsBySymptoms(symptoms: Record<string, any>): Promise<Program[]> {
    const programs = await this.getPrograms();
    
    return programs.filter(program => {
      // Check if program matches the symptoms
      let matchScore = 0;
      
      // Check funding amount match
      if (symptoms.fundingAmount && program.maxAmount) {
        const userAmount = symptoms.fundingAmount;
        if (userAmount <= program.maxAmount) {
          matchScore += 0.3;
        }
      }
      
      // Check target group match
      if (symptoms.targetGroup && program.type) {
        if (program.type.toLowerCase().includes(symptoms.targetGroup.toLowerCase())) {
          matchScore += 0.3;
        }
      }
      
      // Check innovation level match
      if (symptoms.innovationLevel && program.notes) {
        const innovationKeywords = ['innovation', 'high-tech', 'deep-tech', 'breakthrough'];
        if (innovationKeywords.some(keyword => program.notes!.toLowerCase().includes(keyword))) {
          matchScore += 0.2;
        }
      }
      
      // Check location match
      if (symptoms.location && program.notes) {
        if (program.notes.toLowerCase().includes(symptoms.location.toLowerCase())) {
          matchScore += 0.2;
        }
      }
      
      return matchScore >= 0.5; // At least 50% match
    });
  }
}

// Export singleton instance
export const dataSource = new HybridDataSource();

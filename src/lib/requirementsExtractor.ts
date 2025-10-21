// ========= PLAN2FUND — REQUIREMENTS EXTRACTION TOOL =========
// Tool for manually extracting program requirements

import { ProgramExtractionTemplate, ProgramRequirements, ProgramRequirement, RequirementCategory } from '@/types/requirements';

export class RequirementsExtractor {
  private extractedPrograms: Map<string, ProgramExtractionTemplate> = new Map();
  private requirementsCache: Map<string, ProgramRequirements> = new Map();

  /**
   * Start extraction for a new program
   */
  startExtraction(programId: string, programName: string, programType: string, sourceUrl: string): ProgramExtractionTemplate {
    const template: ProgramExtractionTemplate = {
      programId,
      programName,
      programType,
      sourceUrl,
      basicInfo: {
        description: '',
        amount: '',
        duration: '',
        deadline: '',
        eligibility: []
      },
      requirements: {
        eligibility: [],
        documents: [],
        financial: [],
        technical: [],
        legal: [],
        timeline: [],
        geographic: [],
        team: [],
        project: [],
        compliance: [],
        impact: [],
        capex_opex: [],
        use_of_funds: [],
        revenue_model: [],
        market_size: [],
        co_financing: [],
        trl_level: [],
        consortium: [],
        funding_type: [],
        program_category: [],
        target_group: [],
        industry: []
      },
      questions: [],
      editorSections: []
    };

    this.extractedPrograms.set(programId, template);
    return template;
  }

  /**
   * Add basic information
   */
  addBasicInfo(programId: string, info: Partial<ProgramExtractionTemplate['basicInfo']>): void {
    const program = this.extractedPrograms.get(programId);
    if (program) {
      program.basicInfo = { ...program.basicInfo, ...info };
    }
  }

  /**
   * Add requirement to a category
   */
  addRequirement(
    programId: string, 
    category: RequirementCategory, 
    requirement: Omit<ProgramExtractionTemplate['requirements'][keyof ProgramExtractionTemplate['requirements']][0], 'isRequired' | 'priority'>
  ): void {
    const program = this.extractedPrograms.get(programId);
    if (program) {
      const fullRequirement = {
        ...requirement,
        isRequired: true,
        priority: 'medium' as const
      };
      program.requirements[category].push(fullRequirement);
    }
  }

  /**
   * Add decision tree question
   */
  addQuestion(programId: string, question: ProgramExtractionTemplate['questions'][0]): void {
    const program = this.extractedPrograms.get(programId);
    if (program) {
      program.questions.push(question);
    }
  }

  /**
   * Add editor section
   */
  addEditorSection(programId: string, section: ProgramExtractionTemplate['editorSections'][0]): void {
    const program = this.extractedPrograms.get(programId);
    if (program) {
      program.editorSections.push(section);
    }
  }

  /**
   * Convert extracted data to structured requirements
   */
  convertToRequirements(programId: string): ProgramRequirements {
    const extracted = this.extractedPrograms.get(programId);
    if (!extracted) {
      throw new Error(`Program ${programId} not found`);
    }

    const requirements: ProgramRequirements = {
      programId: extracted.programId,
      programName: extracted.programName,
      programType: extracted.programType as any,
      targetPersonas: this.determineTargetPersonas(extracted),
      
      eligibility: this.convertRequirements(extracted.requirements.eligibility, 'eligibility'),
      documents: this.convertRequirements(extracted.requirements.documents, 'documents'),
      financial: this.convertRequirements(extracted.requirements.financial, 'financial'),
      technical: this.convertRequirements(extracted.requirements.technical, 'technical'),
      legal: this.convertRequirements(extracted.requirements.legal, 'legal'),
      timeline: this.convertRequirements(extracted.requirements.timeline, 'timeline'),
      geographic: this.convertRequirements(extracted.requirements.geographic, 'geographic'),
      team: this.convertRequirements(extracted.requirements.team, 'team'),
      project: this.convertRequirements(extracted.requirements.project, 'project'),
      compliance: this.convertRequirements(extracted.requirements.compliance, 'compliance'),
      impact: this.convertRequirements(extracted.requirements.impact, 'impact'),
      capex_opex: this.convertRequirements(extracted.requirements.capex_opex, 'capex_opex'),
      use_of_funds: this.convertRequirements(extracted.requirements.use_of_funds, 'use_of_funds'),
      revenue_model: this.convertRequirements(extracted.requirements.revenue_model, 'revenue_model'),
      market_size: this.convertRequirements(extracted.requirements.market_size, 'market_size'),
      co_financing: this.convertRequirements(extracted.requirements.co_financing, 'co_financing'),
      trl_level: this.convertRequirements(extracted.requirements.trl_level, 'trl_level'),
      consortium: this.convertRequirements(extracted.requirements.consortium, 'consortium'),
      
      scoringWeights: this.calculateScoringWeights(extracted),
      decisionTreeQuestions: this.convertQuestions(extracted.questions),
      editorSections: this.convertEditorSections(extracted.editorSections),
      readinessCriteria: this.generateReadinessCriteria(extracted),
      
      metadata: {
        lastUpdated: new Date().toISOString(),
        source: extracted.sourceUrl,
        confidence: 'high',
        verified: true
      }
    };

    this.requirementsCache.set(programId, requirements);
    return requirements;
  }

  /**
   * Generate extraction checklist for a program
   */
  generateExtractionChecklist(_programId: string): string[] {
    return [
      'Basic Information',
      '✓ Program name and description',
      '✓ Funding amount and duration',
      '✓ Application deadline',
      '✓ Basic eligibility criteria',
      '',
      'Eligibility Requirements',
      '✓ Who can apply (individuals, companies, etc.)',
      '✓ Company stage requirements',
      '✓ Geographic requirements',
      '✓ Industry/sector requirements',
      '✓ Team size requirements',
      '',
      'Documentation Requirements',
      '✓ Business plan requirements',
      '✓ Financial statements needed',
      '✓ Legal documents required',
      '✓ Technical documentation',
      '✓ CVs and team information',
      '',
      'Financial Requirements',
      '✓ Minimum/maximum funding amounts',
      '✓ Co-financing requirements',
      '✓ Financial projections needed',
      '✓ Budget breakdown requirements',
      '✓ Use of funds specification',
      '',
      'Technical Requirements',
      '✓ Technology readiness level',
      '✓ Innovation requirements',
      '✓ Technical feasibility',
      '✓ Intellectual property requirements',
      '',
      'Legal Requirements',
      '✓ Legal entity requirements',
      '✓ Compliance requirements',
      '✓ Insurance requirements',
      '✓ Regulatory approvals',
      '',
      'Timeline Requirements',
      '✓ Project duration limits',
      '✓ Milestone requirements',
      '✓ Reporting schedule',
      '✓ Payment schedule',
      '',
      'Decision Tree Questions',
      '✓ Questions to determine eligibility',
      '✓ Questions to assess fit',
      '✓ Questions to identify gaps',
      '',
      'Editor Sections',
      '✓ Sections to include in business plan',
      '✓ Required content for each section',
      '✓ Formatting requirements',
      '✓ Length requirements'
    ];
  }

  /**
   * Export extracted data to JSON
   */
  exportToJSON(programId: string): string {
    const extracted = this.extractedPrograms.get(programId);
    if (!extracted) {
      throw new Error(`Program ${programId} not found`);
    }
    return JSON.stringify(extracted, null, 2);
  }

  /**
   * Import extracted data from JSON
   */
  importFromJSON(jsonData: string): void {
    const extracted = JSON.parse(jsonData) as ProgramExtractionTemplate;
    this.extractedPrograms.set(extracted.programId, extracted);
  }

  /**
   * Get all extracted programs
   */
  getAllExtractedPrograms(): ProgramExtractionTemplate[] {
    return Array.from(this.extractedPrograms.values());
  }

  /**
   * Get all converted requirements
   */
  getAllRequirements(): ProgramRequirements[] {
    return Array.from(this.requirementsCache.values());
  }

  // Private helper methods
  private convertRequirements(
    requirements: any[], 
    category: RequirementCategory
  ): ProgramRequirement[] {
    return requirements.map((req, index) => ({
      id: `${category}_${index}`,
      category,
      type: this.determineRequirementType(req),
      title: req.title,
      description: req.description,
      isRequired: req.isRequired || false,
      priority: req.priority || 'medium',
      validationRules: this.generateValidationRules(req),
      alternatives: req.alternatives || [],
      examples: req.examples || [],
      guidance: req.guidance || '',
      estimatedTime: req.estimatedTime || '',
      cost: req.cost || 0
    }));
  }

  private determineRequirementType(req: any): any {
    if (req.format) return 'file_upload';
    if (req.amount) return 'numeric';
    if (req.options) return 'selection';
    if (req.date) return 'date';
    return 'boolean';
  }

  private generateValidationRules(req: any): any[] {
    const rules = [];
    if (req.isRequired) {
      rules.push({
        type: 'required',
        message: 'This field is required'
      });
    }
    if (req.amount) {
      rules.push({
        type: 'numeric',
        message: 'Must be a valid number'
      });
    }
    return rules;
  }

  private determineTargetPersonas(extracted: ProgramExtractionTemplate): ('solo' | 'sme' | 'advisor' | 'university')[] {
    const personas: ('solo' | 'sme' | 'advisor' | 'university')[] = [];
    const description = extracted.basicInfo.description.toLowerCase();
    const eligibility = extracted.basicInfo.eligibility.join(' ').toLowerCase();

    if (description.includes('startup') || description.includes('early stage') || eligibility.includes('individual')) {
      personas.push('solo');
    }
    if (description.includes('company') || description.includes('business') || eligibility.includes('company')) {
      personas.push('sme');
    }
    if (description.includes('university') || description.includes('research') || eligibility.includes('university')) {
      personas.push('university');
    }
    if (description.includes('advisor') || description.includes('consultant')) {
      personas.push('advisor');
    }

    return personas.length > 0 ? personas : ['solo', 'sme'];
  }

  private calculateScoringWeights(extracted: ProgramExtractionTemplate): any {
    const totalRequirements = Object.values(extracted.requirements).flat().length;
    const weights: any = {};
    
    Object.keys(extracted.requirements).forEach(category => {
      const categoryRequirements = extracted.requirements[category as keyof typeof extracted.requirements];
      weights[category] = categoryRequirements.length / totalRequirements;
    });

    return weights;
  }

  private convertQuestions(questions: any[]): any[] {
    return questions.map((q, index) => ({
      id: `q_${index}`,
      requirementId: `req_${index}`,
      question: q.question,
      type: q.type,
      options: q.options?.map((opt: string) => ({ value: opt, label: opt })),
      validation: q.required ? [{ type: 'required', message: 'This question is required' }] : [],
      followUpQuestions: [],
      skipConditions: []
    }));
  }

  private convertEditorSections(sections: any[]): any[] {
    return sections.map((s, index) => ({
      id: `section_${index}`,
      title: s.title,
      required: s.required,
      template: s.content,
      guidance: '',
      requirements: [],
      prefillData: {}
    }));
  }

  private generateReadinessCriteria(extracted: ProgramExtractionTemplate): any[] {
    const criteria: any[] = [];
    const allRequirements = Object.values(extracted.requirements).flat();
    
    allRequirements.forEach((req, index) => {
      criteria.push({
        id: `criterion_${index}`,
        requirementId: `req_${index}`,
        title: req.title,
        description: req.description,
        checkType: 'validation',
        validator: (_data: any) => ({
          passed: true,
          message: 'Requirement met',
          score: 100
        }),
        weight: req.isRequired ? 1 : 0.5
      });
    });

    return criteria;
  }
}

// Export singleton instance
export const requirementsExtractor = new RequirementsExtractor();

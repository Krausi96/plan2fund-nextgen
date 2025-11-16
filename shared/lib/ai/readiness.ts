/**
 * Readiness Validation System - Enhanced with Phase 3 AI Features
 * Checks business plan compliance with program requirements
 * Integrates with Dynamic Decision Trees and Program-Specific Templates
 */

import { calculateQualityMetrics, QualityMetrics } from './qualityScoring';
import { predictQualityScores, QualityPredictionResult } from './mlModels';
// ProgramTemplate type removed - using Enhanced Data Pipeline instead

export interface ReadinessCheck {
  section: string;
  status: 'complete' | 'incomplete' | 'missing';
  score: number; // 0-100
  requirements: RequirementCheck[];
  suggestions: string[];
  qualityMetrics?: QualityMetrics; // Optional quality metrics
  qualityPrediction?: QualityPredictionResult;
}

export interface QualityGateStatus {
  passed: boolean;
  overallScore: number;
  sectionScores: Record<string, number>;
  issues: string[];
  blockedSections: string[];
}

export interface RequirementCheck {
  id: string;
  description: string;
  status: 'met' | 'not_met' | 'partial';
  evidence?: string;
  importance: 'critical' | 'important' | 'optional';
}

export interface ProgramRequirements {
  id: string;
  name: string;
  type: 'grant' | 'loan' | 'equity' | 'visa';
  requirements: {
    [section: string]: {
      mandatory: string[];
      recommended: string[];
      optional: string[];
    };
  };
  eligibility: {
    [key: string]: any;
  };
  scoring: {
    [section: string]: {
      [requirement: string]: number;
    };
  };
}

export class ReadinessValidator {
  private programRequirements: ProgramRequirements;
  private planContent: Record<string, any>;
  // Phase 3 Enhancements
  private decisionTreeAnswers?: Record<string, any>;
  private programTemplate?: any; // Using Enhanced Data Pipeline instead
  private aiGuidance?: any;

  constructor(
    programRequirements: ProgramRequirements, 
    planContent: Record<string, any>,
    // Phase 3 Enhancements
    decisionTreeAnswers?: Record<string, any>,
    programTemplate?: any, // Using Enhanced Data Pipeline instead
    aiGuidance?: any
  ) {
    this.programRequirements = programRequirements;
    this.planContent = planContent;
    this.decisionTreeAnswers = decisionTreeAnswers;
    this.programTemplate = programTemplate;
    this.aiGuidance = aiGuidance;
  }

  /**
   * Perform comprehensive readiness check
   */
  async performReadinessCheck(): Promise<ReadinessCheck[]> {
    const checks: ReadinessCheck[] = [];

    for (const [section, requirements] of Object.entries(this.programRequirements.requirements)) {
      const check = await this.checkSection(section, requirements);
      checks.push(check);
    }

    return checks;
  }

  /**
   * Check specific section against requirements
   */
  private async checkSection(section: string, requirements: any): Promise<ReadinessCheck> {
    const sectionContent = this.planContent[section] || '';
    const requirementChecks: RequirementCheck[] = [];
    let totalScore = 0;
    let maxScore = 0;

    // Check mandatory requirements
    for (const req of requirements.mandatory) {
      const check = this.checkRequirement(req, sectionContent, 'critical');
      requirementChecks.push(check);
      totalScore += check.status === 'met' ? 100 : 0;
      maxScore += 100;
    }

    // Check recommended requirements
    for (const req of requirements.recommended) {
      const check = this.checkRequirement(req, sectionContent, 'important');
      requirementChecks.push(check);
      totalScore += check.status === 'met' ? 80 : check.status === 'partial' ? 40 : 0;
      maxScore += 80;
    }

    // Check optional requirements
    for (const req of requirements.optional) {
      const check = this.checkRequirement(req, sectionContent, 'optional');
      requirementChecks.push(check);
      totalScore += check.status === 'met' ? 20 : check.status === 'partial' ? 10 : 0;
      maxScore += 20;
    }

    const overallScore = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
    const status = this.determineStatus(overallScore, requirementChecks);
    const suggestions = this.generateSuggestions(requirementChecks, section);

    return {
      section,
      status,
      score: overallScore,
      requirements: requirementChecks,
      suggestions
    };
  }

  /**
   * Check individual requirement
   */
  private checkRequirement(requirement: string, content: string, importance: 'critical' | 'important' | 'optional'): RequirementCheck {
    const patterns = this.getRequirementPatterns(requirement);
    let status: 'met' | 'not_met' | 'partial' = 'not_met';
    let evidence = '';

    for (const pattern of patterns) {
      const matches = content.match(new RegExp(pattern, 'gi'));
      if (matches && matches.length > 0) {
        status = matches.length >= 2 ? 'met' : 'partial';
        evidence = matches[0];
        break;
      }
    }

    return {
      id: requirement.toLowerCase().replace(/\s+/g, '_'),
      description: requirement,
      status,
      evidence,
      importance
    };
  }

  /**
   * Get regex patterns for requirement checking
   */
  private getRequirementPatterns(requirement: string): string[] {
    const patterns: { [key: string]: string[] } = {
      'business_name': ['business name', 'company name', 'organization name'],
      'funding_amount': ['€\\d+', '\\$\\d+', 'funding.*amount', 'request.*amount'],
      'target_market': ['target market', 'customer.*segment', 'market.*segment'],
      'revenue_model': ['revenue.*model', 'pricing.*strategy', 'monetization'],
      'team_size': ['team.*size', 'employees', 'staff.*count'],
      'timeline': ['timeline', 'schedule', 'milestone', 'deadline'],
      'financial_projections': ['financial.*projection', 'revenue.*forecast', 'profit.*loss'],
      'market_analysis': ['market.*analysis', 'competitive.*analysis', 'market.*size'],
      'risk_assessment': ['risk.*assessment', 'risk.*analysis', 'mitigation.*strategy'],
      'implementation_plan': ['implementation.*plan', 'execution.*plan', 'action.*plan'],
      'use_of_funds': ['use.*of.*funds', 'fund.*utilization', 'spending.*plan'],
      'competitive_advantage': ['competitive.*advantage', 'unique.*selling', 'differentiation'],
      'market_opportunity': ['market.*opportunity', 'market.*potential', 'growth.*potential'],
      'business_model': ['business.*model', 'value.*proposition', 'revenue.*stream'],
      'team_qualifications': ['team.*qualification', 'experience', 'expertise', 'credentials']
    };

    return patterns[requirement.toLowerCase()] || [requirement.toLowerCase()];
  }

  /**
   * Determine overall status
   */
  private determineStatus(score: number, requirements: RequirementCheck[]): 'complete' | 'incomplete' | 'missing' {
    const criticalRequirements = requirements.filter(r => r.importance === 'critical');
    const unmetCritical = criticalRequirements.filter(r => r.status === 'not_met');

    if (unmetCritical.length > 0) {
      return 'missing';
    } else if (score >= 80) {
      return 'complete';
    } else {
      return 'incomplete';
    }
  }

  /**
   * Generate improvement suggestions
   */
  private generateSuggestions(requirements: RequirementCheck[], section: string): string[] {
    const suggestions: string[] = [];
    const unmet = requirements.filter(r => r.status === 'not_met');
    const partial = requirements.filter(r => r.status === 'partial');

    if (unmet.length > 0) {
      suggestions.push(`Add missing ${section} requirements: ${unmet.map(r => r.description).join(', ')}`);
    }

    if (partial.length > 0) {
      suggestions.push(`Strengthen ${section} content: ${partial.map(r => r.description).join(', ')}`);
    }

    // Add section-specific suggestions
    const sectionSuggestions = this.getSectionSuggestions(section);
    suggestions.push(...sectionSuggestions);

    return suggestions;
  }

  /**
   * Get section-specific suggestions
   */
  private getSectionSuggestions(section: string): string[] {
    const suggestions: { [key: string]: string[] } = {
      'executive_summary': [
        'Include clear value proposition',
        'Add funding amount and timeline',
        'Highlight key achievements',
        'Mention target market size'
      ],
      'business_description': [
        'Detail unique selling points',
        'Explain business model clearly',
        'Include company background',
        'Describe products/services'
      ],
      'market_analysis': [
        'Add market size data (TAM/SAM/SOM)',
        'Include competitive analysis',
        'Provide customer personas',
        'Show market trends'
      ],
      'financial_projections': [
        'Provide detailed assumptions',
        'Include sensitivity analysis',
        'Add break-even analysis',
        'Show cash flow projections'
      ],
      'team': [
        'Highlight relevant experience',
        'Show team structure and roles',
        'Include advisory board',
        'Add hiring plan'
      ]
    };

    return suggestions[section] || [];
  }

  // ========== PHASE 3 ENHANCED METHODS ==========

  /**
   * Perform intelligent readiness check with Phase 3 features
   */
  async performIntelligentReadinessCheck(): Promise<ReadinessCheck[]> {
    const checks = await this.performReadinessCheck();
    
    // Enhance with Phase 3 features
    if (this.decisionTreeAnswers) {
      this.enhanceWithDecisionTreeAnswers(checks);
    }
    
    if (this.programTemplate) {
      this.enhanceWithProgramTemplate(checks);
    }
    
    if (this.aiGuidance) {
      this.enhanceWithAIGuidance(checks);
    }
    
    // Add quality metrics to each check
    for (const check of checks) {
      const sectionContent = this.planContent[check.section] || '';
      const wordCount = sectionContent.replace(/<[^>]*>/g, '').split(/\s+/).filter((w: string) => w.length > 0).length;
      const qualityMetrics = calculateQualityMetrics(
        sectionContent, check.section, check.section, wordCount
      );
      check.qualityMetrics = qualityMetrics;

      const unmetRequirements = check.requirements.filter(req => req.status !== 'met').length;
      const prediction = predictQualityScores({
        sectionId: check.section,
        observedOverall: qualityMetrics.overall,
        readability: qualityMetrics.readability.score,
        completeness: qualityMetrics.completeness.score,
        persuasiveness: qualityMetrics.persuasiveness.score,
        wordCount,
        requiredWordCount: undefined,
        gaps: unmetRequirements
      });
      check.qualityPrediction = prediction;
    }
    
    return checks;
  }

  /**
   * Calculate overall quality score for the entire plan
   */
  async calculateOverallQualityScore(): Promise<number> {
    const checks = await this.performIntelligentReadinessCheck();
    
    if (checks.length === 0) return 0;
    
    // Weighted average: 50% compliance score, 50% quality metrics
    let totalComplianceScore = 0;
    let totalQualityScore = 0;
    let count = 0;
    
    for (const check of checks) {
      totalComplianceScore += check.score;
      if (check.qualityMetrics) {
        totalQualityScore += check.qualityMetrics.overall;
      }
      count++;
    }
    
    const avgCompliance = count > 0 ? totalComplianceScore / count : 0;
    const avgQuality = count > 0 ? totalQualityScore / count : 0;
    
    return Math.round((avgCompliance * 0.5) + (avgQuality * 0.5));
  }

  /**
   * Check if quality gates are met for export
   */
  async checkQualityGates(
    sections: Array<{ id: string; wordCountMin?: number; wordCountMax?: number }>
  ): Promise<QualityGateStatus> {
    const checks = await this.performIntelligentReadinessCheck();
    const issues: string[] = [];
    const blockedSections: string[] = [];
    const sectionScores: Record<string, number> = {};
    
    // Quality thresholds
    const THRESHOLDS = {
      readability: 50,
      completeness: 70,
      persuasiveness: 60,
      overall: 65,
      compliance: 70
    };
    
    // Check each section
    for (const check of checks) {
      const sectionTemplate = sections.find(s => s.id === check.section);
      const sectionContent = this.planContent[check.section] || '';
      const wordCount = sectionContent.replace(/<[^>]*>/g, '').split(/\s+/).filter((w: string) => w.length > 0).length;
      
      // Calculate section score (compliance + quality)
      let sectionScore = check.score; // Compliance score
      
      if (check.qualityMetrics) {
        // Weighted: 50% compliance, 50% quality
        sectionScore = Math.round((check.score * 0.5) + (check.qualityMetrics.overall * 0.5));
        
        // Check quality thresholds
        if (check.qualityMetrics.readability.score < THRESHOLDS.readability) {
          issues.push(`${check.section}: Readability score too low (${check.qualityMetrics.readability.score}/100)`);
        }
        if (check.qualityMetrics.completeness.score < THRESHOLDS.completeness) {
          issues.push(`${check.section}: Completeness score too low (${check.qualityMetrics.completeness.score}/100)`);
        }
        if (check.qualityMetrics.persuasiveness.score < THRESHOLDS.persuasiveness) {
          issues.push(`${check.section}: Persuasiveness score too low (${check.qualityMetrics.persuasiveness.score}/100)`);
        }
      }
      
      sectionScores[check.section] = sectionScore;
      
      // Check compliance threshold
      if (check.score < THRESHOLDS.compliance) {
        issues.push(`${check.section}: Compliance score too low (${check.score}/100)`);
      }
      
      // Check section completion
      if (check.status !== 'complete') {
        blockedSections.push(check.section);
        issues.push(`${check.section}: Section not complete (status: ${check.status})`);
      }
      
      // Check word count
      if (sectionTemplate?.wordCountMin && wordCount < sectionTemplate.wordCountMin) {
        blockedSections.push(check.section);
        issues.push(`${check.section}: Word count below minimum (${wordCount}/${sectionTemplate.wordCountMin})`);
      }
    }
    
    // Calculate overall score
    const overallScore = await this.calculateOverallQualityScore();
    
    // Determine if gates passed
    const passed = 
      overallScore >= THRESHOLDS.overall &&
      blockedSections.length === 0 &&
      issues.length === 0;
    
    return {
      passed,
      overallScore,
      sectionScores,
      issues,
      blockedSections
    };
  }

  /**
   * Enhance readiness checks with decision tree answers
   */
  private enhanceWithDecisionTreeAnswers(checks: ReadinessCheck[]): void {
    if (!this.decisionTreeAnswers) return;

    // Check document readiness based on decision tree answers
    const documentReadiness = this.decisionTreeAnswers.document_readiness || [];
    const hasBusinessPlan = documentReadiness.includes('business_plan');
    const hasFinancialProjections = documentReadiness.includes('financial_projections');
    const hasPitchDeck = documentReadiness.includes('pitch_deck');

    // Update checks based on document readiness
    checks.forEach(check => {
      if (check.section === 'executive_summary' && !hasBusinessPlan) {
        check.suggestions.push('Consider creating a business plan first - decision tree indicates this is needed');
        check.score = Math.max(0, check.score - 20);
      }
      
      if (check.section === 'financials' && !hasFinancialProjections) {
        check.suggestions.push('Financial projections required - decision tree indicates this is needed');
        check.score = Math.max(0, check.score - 30);
      }
      
      if (check.section === 'pitch' && !hasPitchDeck) {
        check.suggestions.push('Pitch deck recommended - decision tree indicates this is needed');
        check.score = Math.max(0, check.score - 15);
      }
    });
  }

  /**
   * Enhance readiness checks with program template requirements
   */
  private enhanceWithProgramTemplate(checks: ReadinessCheck[]): void {
    if (!this.programTemplate) return;

    // Check against program-specific template sections
    const templateSections = this.programTemplate.sections || [];
    
    checks.forEach(check => {
      const templateSection = templateSections.find((s: any) => s.id === check.section);
      
      if (templateSection) {
        // Check required fields from template
        if (templateSection.required && check.score < 80) {
          check.suggestions.push(`This section is required by ${this.programTemplate?.program_name} - ensure it's complete`);
        }
        
        // Check validation rules
        if (templateSection.validation_rules) {
          this.checkTemplateValidationRules(check, templateSection);
        }
        
        // Add AI prompts as suggestions
        if (templateSection.ai_prompts && templateSection.ai_prompts.length > 0) {
          check.suggestions.push(`AI Guidance: ${templateSection.ai_prompts.join(', ')}`);
        }
      }
    });
  }

  /**
   * Check template validation rules
   */
  private checkTemplateValidationRules(check: ReadinessCheck, templateSection: any): void {
    const content = this.planContent[check.section] || '';
    const wordCount = content.split(/\s+/).length;
    
    // Check word count requirements
    if (templateSection.validation_rules.min_words && wordCount < templateSection.validation_rules.min_words) {
      check.suggestions.push(`Minimum ${templateSection.validation_rules.min_words} words required (current: ${wordCount})`);
      check.score = Math.max(0, check.score - 20);
    }
    
    if (templateSection.validation_rules.max_words && wordCount > templateSection.validation_rules.max_words) {
      check.suggestions.push(`Maximum ${templateSection.validation_rules.max_words} words allowed (current: ${wordCount})`);
      check.score = Math.max(0, check.score - 10);
    }
    
    // Check required fields
    if (templateSection.validation_rules.required_fields) {
      const missingFields = templateSection.validation_rules.required_fields.filter((field: string) => 
        !content.toLowerCase().includes(field.toLowerCase())
      );
      
      if (missingFields.length > 0) {
        check.suggestions.push(`Missing required fields: ${missingFields.join(', ')}`);
        check.score = Math.max(0, check.score - 25);
      }
    }
  }

  /**
   * Enhance readiness checks with AI guidance
   */
  private enhanceWithAIGuidance(checks: ReadinessCheck[]): void {
    if (!this.aiGuidance) return;

    // Add AI guidance context to all checks
    checks.forEach(check => {
      if (this.aiGuidance.context) {
        check.suggestions.push(`AI Context: ${this.aiGuidance.context}`);
      }
      
      if (this.aiGuidance.key_points && this.aiGuidance.key_points.length > 0) {
        check.suggestions.push(`Key Points to Address: ${this.aiGuidance.key_points.join(', ')}`);
      }
      
      if (this.aiGuidance.prompts && this.aiGuidance.prompts[check.section]) {
        check.suggestions.push(`AI Prompt: ${this.aiGuidance.prompts[check.section]}`);
      }
    });
  }

  /**
   * Calculate intelligent readiness score with Phase 3 features
   */
  calculateIntelligentReadinessScore(): number {
    // Simple base score calculation
    const sections = Object.keys(this.planContent);
    const completedSections = sections.filter(section => 
      this.planContent[section] && this.planContent[section].trim().length > 50
    ).length;
    const baseScore = sections.length > 0 ? Math.round((completedSections / sections.length) * 100) : 0;
    let intelligentScore = baseScore;
    
    // Adjust score based on decision tree answers
    if (this.decisionTreeAnswers) {
      const documentReadiness = this.decisionTreeAnswers.document_readiness || [];
      const hasRequiredDocs = documentReadiness.includes('business_plan') && 
                             documentReadiness.includes('financial_projections');
      
      if (hasRequiredDocs) {
        intelligentScore += 10; // Bonus for having required documents
      } else {
        intelligentScore -= 15; // Penalty for missing required documents
      }
    }
    
    // Adjust score based on program template compliance
    if (this.programTemplate) {
      const templateSections = this.programTemplate.sections || [];
      const requiredSections = templateSections.filter((s: any) => s.required);
      const completedRequiredSections = requiredSections.filter((section: any) => {
        const content = this.planContent[section.id] || '';
        return content.trim().length > 50;
      });
      
      const templateCompliance = requiredSections.length > 0 ? 
        completedRequiredSections.length / requiredSections.length : 1;
      
      intelligentScore = Math.round(intelligentScore * templateCompliance);
    }
    
    return Math.max(0, Math.min(100, intelligentScore));
  }

  /**
   * Get intelligent readiness summary with structured requirements
   */
  async getIntelligentReadinessSummary(): Promise<{
    score: number;
    status: 'ready' | 'needs_work' | 'not_ready';
    recommendations: string[];
    phase3Features: {
      decisionTreeInsights: string[];
      templateCompliance: string[];
      aiGuidance: string[];
    };
    structuredRequirements?: {
      decisionTree: any[];
      editor: any[];
      library: any[];
    };
  }> {
    const score = this.calculateIntelligentReadinessScore();
    const checks = await this.performReadinessCheck();
    
    // Get structured requirements for this program
    const structuredRequirements = await this.getStructuredRequirements();
    
    let status: 'ready' | 'needs_work' | 'not_ready';
    if (score >= 85) status = 'ready';
    else if (score >= 60) status = 'needs_work';
    else status = 'not_ready';
    
    const recommendations = checks
      .filter(c => c.score < 80)
      .flatMap(c => c.suggestions);
    
    const phase3Features = {
      decisionTreeInsights: this.getDecisionTreeInsightsFromStructured(structuredRequirements),
      templateCompliance: this.getTemplateComplianceInsightsFromStructured(structuredRequirements),
      aiGuidance: this.getAIGuidanceInsightsFromStructured(structuredRequirements)
    };
    
    return {
      score,
      status,
      recommendations,
      phase3Features,
      structuredRequirements
    };
  }

  /**
   * Get decision tree insights
   */
  // private getDecisionTreeInsights(): string[] {
  //   if (!this.decisionTreeAnswers) return [];
  //   
  //   const insights: string[] = [];
  //   const documentReadiness = this.decisionTreeAnswers.document_readiness || [];
  //   
  //   if (documentReadiness.includes('business_plan')) {
  //     insights.push('✅ Business plan available');
  //   } else {
  //     insights.push('❌ Business plan needed');
  //   }
  //   
  //   if (documentReadiness.includes('financial_projections')) {
  //     insights.push('✅ Financial projections available');
  //   } else {
  //     insights.push('❌ Financial projections needed');
  //   }
  //   
  //   return insights;
  // }

  /**
   * Get template compliance insights
   */
  // private getTemplateComplianceInsights(): string[] {
  //   if (!this.programTemplate) return [];
  //   
  //   const insights: string[] = [];
  //   const templateSections = this.programTemplate.sections || [];
  //   const requiredSections = templateSections.filter(s => s.required);
  //   
  //   insights.push(`📋 ${requiredSections.length} required sections for ${this.programTemplate.program_name}`);
  //   
  //   const completedSections = requiredSections.filter(section => {
  //     const content = this.planContent[section.id] || '';
  //     return content.trim().length > 50;
  //   });
  //   
  //   insights.push(`✅ ${completedSections.length}/${requiredSections.length} required sections completed`);
  //   
  //   return insights;
  // }

  /**
   * Get AI guidance insights
   */
  // private getAIGuidanceInsights(): string[] {
  //   if (!this.aiGuidance) return [];
  //   
  //   const insights: string[] = [];
  //   
  //   if (this.aiGuidance.context) {
  //     insights.push(`🎯 Focus: ${this.aiGuidance.context}`);
  //   }
  //   
  //   if (this.aiGuidance.key_points && this.aiGuidance.key_points.length > 0) {
  //     insights.push(`📝 Key Points: ${this.aiGuidance.key_points.join(', ')}`);
  //   }
  //   
  //   return insights;
  // }

  /**
   * Get structured requirements for this program
   */
  private async getStructuredRequirements(): Promise<any> {
    try {
      // This would need the program ID - for now return empty structure
      // In a real implementation, this would fetch from the API
      return {
        decisionTree: [],
        editor: [],
        library: []
      };
    } catch (error) {
      console.warn('Failed to load structured requirements:', error);
      return {
        decisionTree: [],
        editor: [],
        library: []
      };
    }
  }

  /**
   * Get decision tree insights from structured requirements
   */
  private getDecisionTreeInsightsFromStructured(structuredRequirements: any): string[] {
    const decisionTreeRequirements = structuredRequirements.decisionTree || [];
    const insights: string[] = [];
    
    decisionTreeRequirements.forEach((req: any) => {
      if (req.question_text) {
        insights.push(`📋 Question: ${req.question_text}`);
      }
      if (req.answer_options && req.answer_options.length > 0) {
        insights.push(`✅ Options: ${req.answer_options.join(', ')}`);
      }
      if (req.validation_rules) {
        insights.push(`🔍 Validation: ${req.validation_rules}`);
      }
    });
    
    return insights;
  }

  /**
   * Get template compliance insights from structured requirements
   */
  private getTemplateComplianceInsightsFromStructured(structuredRequirements: any): string[] {
    const editorRequirements = structuredRequirements.editor || [];
    const insights: string[] = [];
    
    editorRequirements.forEach((req: any) => {
      if (req.section_name) {
        insights.push(`📝 Section: ${req.section_name}`);
      }
      if (req.prompt) {
        insights.push(`💡 Prompt: ${req.prompt}`);
      }
      if (req.hints && req.hints.length > 0) {
        insights.push(`💡 Hints: ${req.hints.join(', ')}`);
      }
      if (req.word_count_min || req.word_count_max) {
        insights.push(`📏 Word Count: ${req.word_count_min || 0}-${req.word_count_max || 'unlimited'}`);
      }
    });
    
    return insights;
  }

  /**
   * Get AI guidance insights from structured requirements
   */
  private getAIGuidanceInsightsFromStructured(structuredRequirements: any): string[] {
    const editorRequirements = structuredRequirements.editor || [];
    const insights: string[] = [];
    
    editorRequirements.forEach((req: any) => {
      if (req.ai_guidance) {
        insights.push(`🤖 AI Guidance: ${req.ai_guidance}`);
      }
      if (req.template) {
        insights.push(`📋 Template: ${req.template}`);
      }
    });
    
    return insights;
  }
}

/**
 * Predefined program requirements
 */
export const PROGRAM_REQUIREMENTS: { [key: string]: ProgramRequirements } = {
  'grant': {
    id: 'grant',
    name: 'Grant Program',
    type: 'grant',
    requirements: {
      'executive_summary': {
        mandatory: ['business_name', 'funding_amount', 'use_of_funds'],
        recommended: ['target_market', 'revenue_model', 'timeline'],
        optional: ['competitive_advantage', 'market_opportunity']
      },
      'business_description': {
        mandatory: ['business_model', 'target_market'],
        recommended: ['competitive_advantage', 'revenue_model'],
        optional: ['company_background', 'products_services']
      },
      'market_analysis': {
        mandatory: ['market_analysis'],
        recommended: ['target_market', 'competitive_analysis'],
        optional: ['market_trends', 'customer_personas']
      },
      'financial_projections': {
        mandatory: ['financial_projections', 'use_of_funds'],
        recommended: ['revenue_model', 'break_even_analysis'],
        optional: ['sensitivity_analysis', 'cash_flow']
      },
      'team': {
        mandatory: ['team_qualifications'],
        recommended: ['team_size', 'experience'],
        optional: ['advisory_board', 'hiring_plan']
      }
    },
    eligibility: {
      'company_age': 'max_5_years',
      'revenue': 'max_500k',
      'location': 'european_union'
    },
    scoring: {
      'executive_summary': {
        'business_name': 20,
        'funding_amount': 30,
        'use_of_funds': 30,
        'target_market': 20
      }
    }
  },
  'loan': {
    id: 'loan',
    name: 'Business Loan',
    type: 'loan',
    requirements: {
      'executive_summary': {
        mandatory: ['business_name', 'funding_amount', 'revenue_model'],
        recommended: ['target_market', 'financial_projections', 'timeline'],
        optional: ['competitive_advantage', 'market_opportunity']
      },
      'business_description': {
        mandatory: ['business_model', 'revenue_model'],
        recommended: ['target_market', 'competitive_advantage'],
        optional: ['company_background', 'products_services']
      },
      'financial_projections': {
        mandatory: ['financial_projections', 'revenue_model'],
        recommended: ['break_even_analysis', 'cash_flow'],
        optional: ['sensitivity_analysis', 'debt_service_coverage']
      },
      'team': {
        mandatory: ['team_qualifications'],
        recommended: ['team_size', 'experience'],
        optional: ['advisory_board', 'hiring_plan']
      }
    },
    eligibility: {
      'company_age': 'min_1_year',
      'revenue': 'min_100k',
      'credit_score': 'min_600'
    },
    scoring: {
      'executive_summary': {
        'business_name': 15,
        'funding_amount': 25,
        'revenue_model': 35,
        'financial_projections': 25
      }
    }
  },
  'equity': {
    id: 'equity',
    name: 'Equity Investment',
    type: 'equity',
    requirements: {
      'executive_summary': {
        mandatory: ['business_name', 'funding_amount', 'market_opportunity'],
        recommended: ['target_market', 'revenue_model', 'competitive_advantage'],
        optional: ['timeline', 'exit_strategy']
      },
      'business_description': {
        mandatory: ['business_model', 'market_opportunity'],
        recommended: ['competitive_advantage', 'revenue_model'],
        optional: ['company_background', 'products_services']
      },
      'market_analysis': {
        mandatory: ['market_analysis', 'market_opportunity'],
        recommended: ['target_market', 'competitive_analysis'],
        optional: ['market_trends', 'customer_personas']
      },
      'financial_projections': {
        mandatory: ['financial_projections', 'revenue_model'],
        recommended: ['break_even_analysis', 'growth_projections'],
        optional: ['sensitivity_analysis', 'exit_strategy']
      },
      'team': {
        mandatory: ['team_qualifications', 'experience'],
        recommended: ['team_size', 'advisory_board'],
        optional: ['hiring_plan', 'equity_structure']
      }
    },
    eligibility: {
      'company_age': 'max_10_years',
      'revenue': 'min_50k',
      'growth_potential': 'high'
    },
    scoring: {
      'executive_summary': {
        'business_name': 10,
        'funding_amount': 20,
        'market_opportunity': 40,
        'competitive_advantage': 30
      }
    }
  }
};

/**
 * Get program requirements by type
 */
export async function getProgramRequirements(type: string): Promise<ProgramRequirements | null> {
  // Try to get from API first
  try {
    const isBrowser = typeof window !== 'undefined';
    const apiUrl = isBrowser
      ? `/api/programs?type=${type}`
      : (process.env.VERCEL_URL 
          ? `https://${process.env.VERCEL_URL}/api/programs?type=${type}` 
          : `http://localhost:3000/api/programs?type=${type}`);
    
    const response = await fetch(apiUrl);
    if (response.ok) {
      const data = await response.json();
      const programs = data.programs || [];
      if (programs.length > 0) {
        // Convert program to requirements format
        const program = programs[0];
        return {
          id: program.id,
          name: program.name,
          type: program.type as any,
          requirements: program.requirements || {},
          eligibility: {},
          scoring: {}
        };
      }
    }
  } catch {
    console.log('Could not get requirements from API, using fallback');
  }
  
  // Fallback to static requirements
  return PROGRAM_REQUIREMENTS[type] || null;
}

/**
 * Transform categorized_requirements (18 categories) from scraper-lite
 * to ProgramRequirements format for ReadinessValidator
 */
export function transformCategorizedToProgramRequirements(
  categorizedRequirements: any,
  programData?: any
): ProgramRequirements | null {
  try {
    const requirements: Record<string, {
      mandatory: string[];
      recommended: string[];
      optional: string[];
    }> = {};

    // Documents category → documents section
    if (categorizedRequirements.documents && Array.isArray(categorizedRequirements.documents)) {
      const mandatoryDocs: string[] = [];
      const recommendedDocs: string[] = [];
      categorizedRequirements.documents.forEach((doc: any) => {
        const docName = typeof doc.value === 'string' ? doc.value : doc.description || 'Document';
        if (doc.required) {
          mandatoryDocs.push(docName);
        } else {
          recommendedDocs.push(docName);
        }
      });
      if (mandatoryDocs.length > 0 || recommendedDocs.length > 0) {
        requirements['documents'] = {
          mandatory: mandatoryDocs,
          recommended: recommendedDocs,
          optional: []
        };
      }
    }

    // Eligibility category → eligibility section
    if (categorizedRequirements.eligibility && Array.isArray(categorizedRequirements.eligibility)) {
      const mandatory: string[] = [];
      const recommended: string[] = [];
      categorizedRequirements.eligibility.forEach((req: any) => {
        const reqName = typeof req.value === 'string' ? req.value : req.description || 'Requirement';
        if (req.required) {
          mandatory.push(reqName);
        } else {
          recommended.push(reqName);
        }
      });
      if (mandatory.length > 0 || recommended.length > 0) {
        requirements['eligibility'] = { mandatory, recommended, optional: [] };
      }
    }

    // Financial category → financial_projections section
    if (categorizedRequirements.financial && Array.isArray(categorizedRequirements.financial)) {
      const mandatory: string[] = [];
      const recommended: string[] = [];
      categorizedRequirements.financial.forEach((req: any) => {
        const reqName = typeof req.value === 'string' ? req.value : req.description || 'Financial requirement';
        if (req.required) {
          mandatory.push(reqName);
        } else {
          recommended.push(reqName);
        }
      });
      if (mandatory.length > 0 || recommended.length > 0) {
        requirements['financial_projections'] = { mandatory, recommended, optional: [] };
      }
    }

    // Timeline category → timeline section
    if (categorizedRequirements.timeline && Array.isArray(categorizedRequirements.timeline)) {
      const mandatory: string[] = [];
      const recommended: string[] = [];
      categorizedRequirements.timeline.forEach((req: any) => {
        const reqName = typeof req.value === 'string' ? req.value : req.description || 'Timeline requirement';
        if (req.required) {
          mandatory.push(reqName);
        } else {
          recommended.push(reqName);
        }
      });
      if (mandatory.length > 0 || recommended.length > 0) {
        requirements['timeline'] = { mandatory, recommended, optional: [] };
      }
    }

    // Team category → team section
    if (categorizedRequirements.team && Array.isArray(categorizedRequirements.team)) {
      const mandatory: string[] = [];
      const recommended: string[] = [];
      categorizedRequirements.team.forEach((req: any) => {
        const reqName = typeof req.value === 'string' ? req.value : req.description || 'Team requirement';
        if (req.required) {
          mandatory.push(reqName);
        } else {
          recommended.push(reqName);
        }
      });
      if (mandatory.length > 0 || recommended.length > 0) {
        requirements['team'] = { mandatory, recommended, optional: [] };
      }
    }

    // Project category → business_description section
    if (categorizedRequirements.project && Array.isArray(categorizedRequirements.project)) {
      const mandatory: string[] = [];
      const recommended: string[] = [];
      categorizedRequirements.project.forEach((req: any) => {
        const reqName = typeof req.value === 'string' ? req.value : req.description || 'Project requirement';
        if (req.required) {
          mandatory.push(reqName);
        } else {
          recommended.push(reqName);
        }
      });
      if (mandatory.length > 0 || recommended.length > 0) {
        requirements['business_description'] = { mandatory, recommended, optional: [] };
      }
    }

    // Market analysis section (from market_size, revenue_model)
    const marketRequirements: string[] = [];
    if (categorizedRequirements.market_size) {
      categorizedRequirements.market_size.forEach((req: any) => {
        const reqName = typeof req.value === 'string' ? req.value : req.description || 'Market requirement';
        marketRequirements.push(reqName);
      });
    }
    if (categorizedRequirements.revenue_model) {
      categorizedRequirements.revenue_model.forEach((req: any) => {
        const reqName = typeof req.value === 'string' ? req.value : req.description || 'Revenue requirement';
        marketRequirements.push(reqName);
      });
    }
    if (marketRequirements.length > 0) {
      requirements['market_analysis'] = {
        mandatory: marketRequirements.slice(0, Math.ceil(marketRequirements.length / 2)),
        recommended: marketRequirements.slice(Math.ceil(marketRequirements.length / 2)),
        optional: []
      };
    }

    // Build eligibility object
    const eligibility: Record<string, any> = {};
    if (categorizedRequirements.geographic) {
      const location = categorizedRequirements.geographic.find((r: any) => r.type === 'location');
      if (location) eligibility.location = location.value;
    }
    if (categorizedRequirements.team) {
      const maxAge = categorizedRequirements.team.find((r: any) => r.type === 'max_company_age');
      if (maxAge) eligibility.company_age = maxAge.value;
      const minTeam = categorizedRequirements.team.find((r: any) => r.type === 'min_team_size');
      if (minTeam) eligibility.team_size = minTeam.value;
    }
    if (categorizedRequirements.financial) {
      const revenue = categorizedRequirements.financial.find((r: any) => r.type === 'revenue_range' || r.type === 'revenue');
      if (revenue && typeof revenue.value === 'object') {
        eligibility.revenue_min = revenue.value.min;
        eligibility.revenue_max = revenue.value.max;
      }
      const coFinancing = categorizedRequirements.financial.find((r: any) => r.type === 'co_financing');
      if (coFinancing) eligibility.cofinancing_pct = coFinancing.value;
    }

    // Determine program type
    const programType = programData?.funding_types?.[0] || programData?.type || 'grant';

    // Build scoring (simple equal weighting)
    const scoring: Record<string, Record<string, number>> = {};
    Object.keys(requirements).forEach(section => {
      scoring[section] = {};
      const sectionReqs = requirements[section];
      const totalReqs = sectionReqs.mandatory.length + sectionReqs.recommended.length;
      const weight = totalReqs > 0 ? 100 / totalReqs : 0;
      [...sectionReqs.mandatory, ...sectionReqs.recommended].forEach((req) => {
        scoring[section][req] = Math.round(weight);
      });
    });

    return {
      id: programData?.id || 'unknown',
      name: programData?.name || programData?.title || 'Program',
      type: programType as 'grant' | 'loan' | 'equity' | 'visa',
      requirements,
      eligibility,
      scoring
    };
  } catch (error) {
    console.error('Error transforming categorized requirements:', error);
    return null;
  }
}

/**
 * Create readiness validator
 */
export async function createReadinessValidator(programType: string, planContent: Record<string, any>): Promise<ReadinessValidator | null> {
  const requirements = await getProgramRequirements(programType);
  if (!requirements) {
    return null;
  }
  return new ReadinessValidator(requirements, planContent);
}

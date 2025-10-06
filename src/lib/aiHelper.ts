/**
 * AI Helper for editor - Enhanced with Phase 3 Features
 * Provides section-scoped prompts, bound to 200 words, cites program hints
 * Integrates with Dynamic Decision Trees and Program-Specific Templates
 */

import { Program } from './prefill';
import { ProgramTemplate, TemplateSection } from './programTemplates';

interface AIHelperConfig {
  maxWords: number;
  sectionScope: string;
  programHints: any;
  userAnswers: Record<string, any>;
  tone?: 'neutral'|'formal'|'concise';
  language?: 'de'|'en';
  // Phase 3 Enhancements
  decisionTreeAnswers?: Record<string, any>;
  programTemplate?: ProgramTemplate;
  currentSection?: TemplateSection;
  aiGuidance?: {
    context: string;
    tone: 'professional' | 'academic' | 'enthusiastic' | 'technical';
    key_points: string[];
    prompts?: Record<string, string>;
  };
}

interface AIResponse {
  content: string;
  wordCount: number;
  suggestions: string[];
  citations: string[];
  // Phase 3 Enhancements
  programSpecific?: boolean;
  sectionGuidance?: string[];
  complianceTips?: string[];
  readinessScore?: number;
}

export class AIHelper {
  private config: AIHelperConfig;
  private programHints: any;

  constructor(config: AIHelperConfig) {
    this.config = config;
    this.programHints = config.programHints;
  }

  /**
   * Generate AI content for a specific section
   */
  async generateSectionContent(
    section: string,
    context: string,
    program: Program
  ): Promise<AIResponse> {
    const prompt = this.buildSectionPrompt(section, context, program);
    const response = await this.callAI(prompt);
    
    return {
      content: response.content,
      wordCount: this.countWords(response.content),
      suggestions: response.suggestions || [],
      citations: response.citations || []
    };
  }

  /**
   * Build section-specific prompt
   */
  private buildSectionPrompt(section: string, context: string, program: Program): string {
    const programType = program.type;
    const hints = this.programHints[programType] || this.programHints.general;
    const tone = this.config.tone || 'neutral';
    const language = this.config.language || 'en';
    
    const toneInstructions = {
      neutral: 'Use a balanced, professional tone that is clear and accessible.',
      formal: 'Use a formal, academic tone with sophisticated language and structure.',
      concise: 'Use a concise, direct tone with short sentences and clear points.'
    };
    
    return `
You are an AI writing assistant helping to create a ${programType} application for ${program.name}.

Section: ${section}
Context: ${context}
Language: ${language.toUpperCase()}
Tone: ${tone} - ${toneInstructions[tone]}

Program-specific guidance:
${hints.reviewer_tips.map((tip: string) => `- ${tip}`).join('\n')}

User answers:
${Object.entries(this.config.userAnswers).map(([key, value]) => `- ${key}: ${value}`).join('\n')}

Requirements:
- Maximum ${this.config.maxWords} words
- Focus on ${section} content
- Use program-specific guidance
- Include relevant user answers
- Write in ${language.toUpperCase()}
- Use ${tone} tone: ${toneInstructions[tone]}
- Be professional and compelling
- Address common mistakes to avoid

Generate content for the ${section} section:
`;
  }

  /**
   * Generate counterfactual content when information is missing
   */
  async generateCounterfactualContent(
    section: string,
    missingInfo: string[],
    program: Program
  ): Promise<AIResponse> {
    const prompt = this.buildCounterfactualPrompt(section, missingInfo, program);
    const response = await this.callAI(prompt);
    
    return {
      content: response.content,
      wordCount: this.countWords(response.content),
      suggestions: response.suggestions || [],
      citations: response.citations || []
    };
  }

  /**
   * Build counterfactual prompt for missing information
   */
  private buildCounterfactualPrompt(
    section: string, 
    missingInfo: string[], 
    program: Program
  ): string {
    const programType = program.type;
    const hints = this.programHints[programType] || this.programHints.general;
    
    return `
You are an AI writing assistant helping to create a ${programType} application for ${program.name}.

Section: ${section}
Missing information: ${missingInfo.join(', ')}

Program-specific guidance:
${hints.reviewer_tips.map((tip: string) => `- ${tip}`).join('\n')}

Common mistakes to avoid:
${hints.common_mistakes.map((mistake: string) => `- ${mistake}`).join('\n')}

Requirements:
- Maximum ${this.config.maxWords} words
- Address missing information with TBD placeholders
- Provide guidance on what information is needed
- Use program-specific guidance
- Be professional and helpful
- Include suggestions for improvement

Generate content that addresses the missing information:
`;
  }

  /**
   * Generate improvement suggestions
   */
  async generateImprovementSuggestions(
    content: string,
    section: string,
    program: Program
  ): Promise<string[]> {
    const programType = program.type;
    const hints = this.programHints[programType] || this.programHints.general;
    
    const prompt = `
Review this ${section} content for a ${programType} application:

${content}

Program-specific success factors:
${hints.success_factors.map((factor: string) => `- ${factor}`).join('\n')}

Common mistakes to avoid:
${hints.common_mistakes.map((mistake: string) => `- ${mistake}`).join('\n')}

Provide 3-5 specific improvement suggestions:
`;

    const response = await this.callAI(prompt);
    return response.suggestions || [];
  }

  /**
   * Generate program-specific citations
   */
  generateCitations(program: Program): string[] {
    const citations: string[] = [];
    
    // Add program-specific citations
    if (program.eligibility) {
      citations.push(`Eligibility requirements: ${program.eligibility.join(', ')}`);
    }
    
    if (program.requirements) {
      citations.push(`Program requirements: ${program.requirements.join(', ')}`);
    }
    
    if (program.reasons) {
      citations.push(`Why this program: ${program.reasons.join(', ')}`);
    }
    
    // Add general citations
    citations.push(`Program: ${program.name}`);
    citations.push(`Type: ${program.type}`);
    citations.push(`Amount: ${program.amount}`);
    
    return citations;
  }

  /**
   * Generate section-level toolbar actions
   */
  async generateToolbarActions(
    content: string,
    section: string,
    program: Program
  ): Promise<{
    draft: string;
    improve: string;
    summarize: string;
    translate: { en: string; de: string };
    makeFormal: string;
    bulletToParagraph: string;
    paragraphToBullet: string;
    addRisks: string;
  }> {
    const actions = {
      draft: await this.generateDraft(content, section, program),
      improve: await this.generateImprovement(content, section, program),
      summarize: await this.generateSummary(content, section, program),
      translate: {
        en: await this.generateTranslation(content, 'en', section, program),
        de: await this.generateTranslation(content, 'de', section, program)
      },
      makeFormal: await this.generateFormalVersion(content, section, program),
      bulletToParagraph: await this.convertBulletsToParagraphs(content, section, program),
      paragraphToBullet: await this.convertParagraphsToBullets(content, section, program),
      addRisks: await this.addRiskAnalysis(content, section, program)
    };
    
    return actions;
  }

  /**
   * Generate draft content (≤200 words)
   */
  private async generateDraft(content: string, section: string, program: Program): Promise<string> {
    const prompt = `
Generate a draft for the ${section} section of a ${program.type} application.

Current content: ${content}

Program guidance:
${this.programHints[program.type]?.reviewer_tips.map((tip: string) => `- ${tip}`).join('\n')}

Requirements:
- Maximum 200 words
- Professional tone
- Address program requirements
- Include relevant user answers

Generate draft content:
`;
    
    const response = await this.callAI(prompt);
    return this.truncateToWordLimit(response.content);
  }

  /**
   * Generate improvement suggestions
   */
  private async generateImprovement(content: string, section: string, program: Program): Promise<string> {
    const prompt = `
Improve this ${section} content for a ${program.type} application:

${content}

Program success factors:
${this.programHints[program.type]?.success_factors.map((factor: string) => `- ${factor}`).join('\n')}

Common mistakes to avoid:
${this.programHints[program.type]?.common_mistakes.map((mistake: string) => `- ${mistake}`).join('\n')}

Provide improved content:
`;
    
    const response = await this.callAI(prompt);
    return this.truncateToWordLimit(response.content);
  }

  /**
   * Generate summary
   */
  private async generateSummary(content: string, section: string, program: Program): Promise<string> {
    const prompt = `
Summarize this ${section} content for a ${program.type} application:

${content}

Create a concise summary (max 100 words):
`;
    
    const response = await this.callAI(prompt);
    return this.truncateToWordLimit(response.content);
  }

  /**
   * Generate translation
   */
  private async generateTranslation(content: string, language: string, section: string, program: Program): Promise<string> {
    const prompt = `
Translate this ${section} content to ${language} for a ${program.type} application:

${content}

Provide professional translation:
`;
    
    const response = await this.callAI(prompt);
    return response.content;
  }

  /**
   * Generate formal version
   */
  private async generateFormalVersion(content: string, section: string, program: Program): Promise<string> {
    const prompt = `
Make this ${section} content more formal for a ${program.type} application:

${content}

Program requirements:
${this.programHints[program.type]?.reviewer_tips.map((tip: string) => `- ${tip}`).join('\n')}

Provide formal version:
`;
    
    const response = await this.callAI(prompt);
    return this.truncateToWordLimit(response.content);
  }

  /**
   * Convert bullets to paragraphs
   */
  private async convertBulletsToParagraphs(content: string, section: string, _program: Program): Promise<string> {
    const prompt = `
Convert bullet points to paragraph format for this ${section} content:

${content}

Create flowing paragraphs:
`;
    
    const response = await this.callAI(prompt);
    return response.content;
  }

  /**
   * Convert paragraphs to bullets
   */
  private async convertParagraphsToBullets(content: string, section: string, _program: Program): Promise<string> {
    const prompt = `
Convert paragraph content to bullet points for this ${section} content:

${content}

Create clear bullet points:
`;
    
    const response = await this.callAI(prompt);
    return response.content;
  }

  /**
   * Add risk analysis
   */
  private async addRiskAnalysis(content: string, section: string, program: Program): Promise<string> {
    const prompt = `
Add risk analysis to this ${section} content for a ${program.type} application:

${content}

Program considerations:
${this.programHints[program.type]?.common_mistakes.map((mistake: string) => `- ${mistake}`).join('\n')}

Add relevant risks and mitigation strategies:
`;
    
    const response = await this.callAI(prompt);
    return this.truncateToWordLimit(response.content);
  }

  /**
   * Call AI service with real AI integration
   */
  private async callAI(prompt: string): Promise<any> {
    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          maxWords: this.config.maxWords,
          tone: this.config.tone,
          language: this.config.language,
          sectionScope: this.config.sectionScope
        })
      });

      if (!response.ok) {
        throw new Error(`AI service error: ${response.status}`);
      }

      const data = await response.json();
      return {
        content: data.content || this.generateFallbackContent(prompt),
        suggestions: data.suggestions || this.generateDefaultSuggestions(),
        citations: data.citations || this.generateDefaultCitations()
      };
    } catch (error) {
      console.error('AI service error:', error);
      // Fallback to enhanced mock content
      return {
        content: this.generateEnhancedMockContent(prompt),
        suggestions: this.generateDefaultSuggestions(),
        citations: this.generateDefaultCitations()
      };
    }
  }

  /**
   * Generate enhanced mock content for fallback
   */
  private generateEnhancedMockContent(prompt: string): string {
    const section = this.config.sectionScope;
    const programType = prompt.includes('grant') ? 'grant' : prompt.includes('loan') ? 'loan' : 'business plan';
    
    const templates = {
      'executive_summary': `Our innovative business solution addresses critical market needs through a scalable model that delivers measurable value to customers. We are seeking funding to accelerate growth and expand market reach.`,
      'business_description': `Our company operates in the ${programType} sector, providing innovative solutions that solve real-world problems. We have developed a unique value proposition that differentiates us from competitors.`,
      'market_analysis': `The target market represents a significant opportunity with strong growth potential. Our analysis shows clear demand for our solution with favorable market conditions.`,
      'financial_projections': `Our financial model demonstrates strong unit economics with clear path to profitability. Revenue projections show sustainable growth over the next 3-5 years.`,
      'team': `Our experienced team brings together diverse expertise in technology, business development, and market strategy. We have the skills and passion to execute our vision.`
    };

    return templates[section as keyof typeof templates] || `This section requires detailed content specific to your ${programType} application. Please provide more specific information about your business, market, and goals.`;
  }

  /**
   * Generate fallback content when AI service fails
   */
  private generateFallbackContent(prompt: string): string {
    return this.generateEnhancedMockContent(prompt);
  }

  /**
   * Generate default suggestions
   */
  private generateDefaultSuggestions(): string[] {
    return [
      "Consider adding more specific details and metrics",
      "Include relevant industry data and benchmarks",
      "Address potential concerns and risks upfront",
      "Provide concrete examples and case studies",
      "Ensure content aligns with program requirements"
    ];
  }

  /**
   * Generate default citations
   */
  private generateDefaultCitations(): string[] {
    return [
      "Program guidelines and requirements",
      "Industry best practices and standards",
      "Market research and analysis",
      "Financial modeling and projections"
    ];
  }

  /**
   * Count words in content
   */
  private countWords(content: string): number {
    return content.split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Validate content against word limit
   */
  validateWordLimit(content: string): { valid: boolean; wordCount: number; limit: number } {
    const wordCount = this.countWords(content);
    return {
      valid: wordCount <= this.config.maxWords,
      wordCount,
      limit: this.config.maxWords
    };
  }

  /**
   * Truncate content to word limit
   */
  truncateToWordLimit(content: string): string {
    const words = content.split(/\s+/);
    if (words.length <= this.config.maxWords) {
      return content;
    }
    
    const truncatedWords = words.slice(0, this.config.maxWords);
    return truncatedWords.join(' ') + '...';
  }

  // ========== PHASE 3 ENHANCEMENTS ==========

  /**
   * Generate content using program-specific template guidance
   */
  async generateTemplateBasedContent(
    sectionId: string,
    context: string,
    program: Program
  ): Promise<AIResponse> {
    if (!this.config.programTemplate || !this.config.currentSection) {
      return this.generateSectionContent(sectionId, context, program);
    }

    const template = this.config.programTemplate;
    const section = this.config.currentSection;
    
    const prompt = this.buildTemplatePrompt(section, context, program, template);
    const response = await this.callAI(prompt);
    
    return {
      content: response.content,
      wordCount: this.countWords(response.content),
      suggestions: response.suggestions || [],
      citations: response.citations || [],
      programSpecific: true,
      sectionGuidance: section.ai_prompts || [],
      complianceTips: this.extractComplianceTips(section),
      readinessScore: this.calculateReadinessScore(response.content, section)
    };
  }

  /**
   * Generate content using decision tree answers
   */
  async generateDecisionTreeBasedContent(
    sectionId: string,
    context: string,
    program: Program,
    decisionTreeAnswers: Record<string, any>
  ): Promise<AIResponse> {
    const prompt = this.buildDecisionTreePrompt(sectionId, context, program, decisionTreeAnswers);
    const response = await this.callAI(prompt);
    
    return {
      content: response.content,
      wordCount: this.countWords(response.content),
      suggestions: response.suggestions || [],
      citations: response.citations || [],
      programSpecific: true,
      sectionGuidance: this.generateSectionGuidanceFromAnswers(decisionTreeAnswers),
      complianceTips: this.generateComplianceTipsFromAnswers(decisionTreeAnswers),
      readinessScore: this.calculateReadinessFromAnswers(decisionTreeAnswers)
    };
  }

  /**
   * Build template-based prompt
   */
  private buildTemplatePrompt(
    section: TemplateSection,
    context: string,
    program: Program,
    template: ProgramTemplate
  ): string {
    const aiGuidance = this.config.aiGuidance;
    const tone = aiGuidance?.tone || this.config.tone || 'neutral';
    const language = this.config.language || 'en';
    
    return `
You are an AI writing assistant creating content for a ${program.type} application for ${program.name}.

Section: ${section.title}
Description: ${section.description}
Program: ${template.program_name}
Target Audience: ${template.target_audience.join(', ')}

AI Guidance Context: ${aiGuidance?.context || 'Standard business plan guidance'}
Tone: ${tone} - ${this.getToneInstructions(tone)}
Language: ${language.toUpperCase()}

Template Requirements:
- Required: ${section.required ? 'Yes' : 'No'}
- Difficulty: ${section.difficulty_level}
- Industry Hints: ${section.industry_hints?.join(', ') || 'General'}

AI Prompts for this section:
${section.ai_prompts.map(prompt => `- ${prompt}`).join('\n')}

Validation Rules:
${Object.entries(section.validation_rules).map(([key, value]) => `- ${key}: ${value}`).join('\n')}

User Context: ${context}

Decision Tree Answers:
${Object.entries(this.config.decisionTreeAnswers || {}).map(([key, value]) => `- ${key}: ${value}`).join('\n')}

Requirements:
- Maximum ${this.config.maxWords} words
- Follow template structure: ${section.content_template}
- Use program-specific guidance
- Address validation requirements
- Include relevant decision tree answers
- Write in ${language.toUpperCase()}
- Use ${tone} tone
- Be professional and compelling

Generate content for the ${section.title} section:
`;
  }

  /**
   * Build decision tree-based prompt
   */
  private buildDecisionTreePrompt(
    sectionId: string,
    context: string,
    program: Program,
    decisionTreeAnswers: Record<string, any>
  ): string {
    const tone = this.config.tone || 'neutral';
    const language = this.config.language || 'en';
    
    return `
You are an AI writing assistant creating content for a ${program.type} application for ${program.name}.

Section: ${sectionId}
Program: ${program.name}
Type: ${program.type}

Decision Tree Analysis:
${Object.entries(decisionTreeAnswers).map(([key, value]) => {
  const question = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  return `- ${question}: ${value}`;
}).join('\n')}

User Context: ${context}
Tone: ${tone} - ${this.getToneInstructions(tone)}
Language: ${language.toUpperCase()}

Requirements:
- Maximum ${this.config.maxWords} words
- Use decision tree answers to personalize content
- Focus on ${sectionId} content
- Write in ${language.toUpperCase()}
- Use ${tone} tone
- Be professional and compelling
- Address program-specific requirements

Generate personalized content for the ${sectionId} section:
`;
  }

  /**
   * Extract compliance tips from template section
   */
  private extractComplianceTips(section: TemplateSection): string[] {
    const tips: string[] = [];
    
    if (section.validation_rules.required_fields) {
      tips.push(`Required fields: ${section.validation_rules.required_fields.join(', ')}`);
    }
    
    if (section.validation_rules.format_requirements) {
      tips.push(`Format requirements: ${section.validation_rules.format_requirements.join(', ')}`);
    }
    
    if (section.program_specific) {
      tips.push('This section is program-specific - ensure compliance with funding requirements');
    }
    
    return tips;
  }

  /**
   * Generate section guidance from decision tree answers
   */
  private generateSectionGuidanceFromAnswers(answers: Record<string, any>): string[] {
    const guidance: string[] = [];
    
    // Analyze answers to provide contextual guidance
    if (answers.company_stage) {
      guidance.push(`Focus on ${answers.company_stage} stage considerations`);
    }
    
    if (answers.industry) {
      guidance.push(`Include ${answers.industry} industry-specific insights`);
    }
    
    if (answers.funding_amount) {
      guidance.push(`Justify funding amount of ${answers.funding_amount}`);
    }
    
    return guidance;
  }

  /**
   * Generate compliance tips from decision tree answers
   */
  private generateComplianceTipsFromAnswers(answers: Record<string, any>): string[] {
    const tips: string[] = [];
    
    if (answers.has_business_plan === false) {
      tips.push('Business plan required - consider creating one first');
    }
    
    if (answers.has_financial_projections === false) {
      tips.push('Financial projections required - include 3-year projections');
    }
    
    if (answers.team_size && answers.team_size < 2) {
      tips.push('Consider expanding team or explaining solo founder approach');
    }
    
    return tips;
  }

  /**
   * Calculate readiness score based on content and section requirements
   */
  private calculateReadinessScore(content: string, section: TemplateSection): number {
    let score = 0;
    const maxScore = 100;
    
    // Word count compliance
    const wordCount = this.countWords(content);
    if (section.validation_rules.min_words && wordCount >= section.validation_rules.min_words) {
      score += 20;
    }
    if (section.validation_rules.max_words && wordCount <= section.validation_rules.max_words) {
      score += 20;
    }
    
    // Required fields check
    if (section.validation_rules.required_fields) {
      const hasRequiredFields = section.validation_rules.required_fields.every(field => 
        content.toLowerCase().includes(field.toLowerCase())
      );
      if (hasRequiredFields) score += 30;
    }
    
    // Program-specific content
    if (section.program_specific && content.length > 50) {
      score += 20;
    }
    
    // Content quality indicators
    if (content.includes('.')) score += 5; // Has sentences
    if (content.length > 100) score += 5; // Substantial content
    
    return Math.min(score, maxScore);
  }

  /**
   * Calculate readiness from decision tree answers
   */
  private calculateReadinessFromAnswers(answers: Record<string, any>): number {
    let score = 0;
    const maxScore = 100;
    
    // Basic readiness indicators
    if (answers.has_business_plan) score += 25;
    if (answers.has_financial_projections) score += 25;
    if (answers.team_size && answers.team_size >= 2) score += 20;
    if (answers.market_research) score += 15;
    if (answers.legal_structure) score += 15;
    
    return Math.min(score, maxScore);
  }

  /**
   * Get tone instructions
   */
  private getToneInstructions(tone: string): string {
    const instructions = {
      professional: 'Use a balanced, professional tone that is clear and accessible.',
      academic: 'Use a formal, academic tone with sophisticated language and structure.',
      enthusiastic: 'Use an enthusiastic, energetic tone that conveys passion and excitement.',
      technical: 'Use a technical, precise tone with industry-specific terminology.',
      neutral: 'Use a balanced, professional tone that is clear and accessible.',
      formal: 'Use a formal, academic tone with sophisticated language and structure.',
      concise: 'Use a concise, direct tone with short sentences and clear points.'
    };
    
    return instructions[tone as keyof typeof instructions] || instructions.neutral;
  }
}

/**
 * Create AI Helper instance
 */
export function createAIHelper(
  userAnswers: Record<string, any>,
  programHints: any,
  maxWords: number = 200,
  tone: 'neutral'|'formal'|'concise' = 'neutral',
  language: 'de'|'en' = 'en'
): AIHelper {
  return new AIHelper({
    maxWords,
    sectionScope: 'general',
    programHints,
    userAnswers,
    tone,
    language
  });
}

/**
 * Create enhanced AI Helper instance with Phase 3 features
 */
export function createEnhancedAIHelper(
  userAnswers: Record<string, any>,
  programHints: any,
  maxWords: number = 200,
  tone: 'neutral'|'formal'|'concise' = 'neutral',
  language: 'de'|'en' = 'en',
  // Phase 3 enhancements
  decisionTreeAnswers?: Record<string, any>,
  programTemplate?: ProgramTemplate,
  currentSection?: TemplateSection,
  aiGuidance?: {
    context: string;
    tone: 'professional' | 'academic' | 'enthusiastic' | 'technical';
    key_points: string[];
    prompts?: Record<string, string>;
  }
): AIHelper {
  return new AIHelper({
    maxWords,
    sectionScope: 'general',
    programHints,
    userAnswers,
    tone,
    language,
    decisionTreeAnswers,
    programTemplate,
    currentSection,
    aiGuidance
  });
}

/**
 * Load program hints
 */
export async function loadProgramHints(): Promise<any> {
  try {
    const response = await fetch('/data/program_hints.json');
    if (!response.ok) {
      throw new Error('Failed to load program hints');
    }
    return await response.json();
  } catch (error) {
    console.error('Error loading program hints:', error);
    return { general: { reviewer_tips: [], common_mistakes: [], success_factors: [] } };
  }
}

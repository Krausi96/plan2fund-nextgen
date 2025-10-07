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
   * Generate AI content for a specific section using structured requirements
   */
  async generateSectionContent(
    section: string,
    context: string,
    program: Program
  ): Promise<AIResponse> {
    // Get structured requirements for this program
    const structuredRequirements = await this.getStructuredRequirements(program.id);
    
    const prompt = this.buildSectionPromptWithStructured(section, context, program, structuredRequirements);
    const response = await this.callAI(prompt);
    
    return {
      content: response.content,
      wordCount: this.countWords(response.content),
      suggestions: response.suggestions || [],
      citations: response.citations || [],
      programSpecific: true,
      sectionGuidance: this.getSectionGuidanceFromStructured(section, structuredRequirements),
      complianceTips: this.getComplianceTipsFromStructured(section, structuredRequirements),
      readinessScore: this.calculateReadinessScoreFromStructured(section, context, structuredRequirements)
    };
  }

  /**
   * Get structured requirements for a program
   */
  async getStructuredRequirements(programId: string): Promise<any> {
    try {
      const response = await fetch(`/api/programmes/${programId}/requirements`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn(`Failed to load structured requirements for ${programId}:`, error);
    }
    return { decision_tree: [], editor: [], library: [] };
  }

  /**
   * Build section prompt with structured requirements
   */
  private buildSectionPromptWithStructured(
    section: string, 
    context: string,
    program: Program,
    structuredRequirements: any
  ): string {
    const editorRequirements = structuredRequirements.editor || [];
    const sectionRequirement = editorRequirements.find((req: any) => 
      req.section_name.toLowerCase().includes(section.toLowerCase())
    );

    let structuredGuidance = '';
    if (sectionRequirement) {
      structuredGuidance = `
Structured Requirements for ${section}:
- Prompt: ${sectionRequirement.prompt || 'No specific prompt'}
- Hints: ${(sectionRequirement.hints || []).join(', ')}
- Word Count: ${sectionRequirement.word_count_min || 0}-${sectionRequirement.word_count_max || 'unlimited'}
- AI Guidance: ${sectionRequirement.ai_guidance || 'No specific guidance'}
- Template: ${sectionRequirement.template || 'No template provided'}
`;
    }
    
    return `
You are an AI writing assistant helping to create a ${program.type} application for ${program.name}.

Section: ${section}
Context: ${context}
${structuredGuidance}

Program-specific guidance:
${this.programHints[program.type]?.reviewer_tips?.map((tip: string) => `- ${tip}`).join('\n') || 'No specific guidance'}

User answers:
${Object.entries(this.config.userAnswers).map(([key, value]) => `- ${key}: ${value}`).join('\n')}

Requirements:
- Maximum ${this.config.maxWords} words
- Use ${this.config.language || 'en'} language
- Follow ${this.config.tone || 'neutral'} tone

Generate helpful content for this section.
`;
  }

  /**
   * Get section guidance from structured requirements
   */
  private getSectionGuidanceFromStructured(section: string, structuredRequirements: any): string[] {
    const editorRequirements = structuredRequirements.editor || [];
    const sectionRequirement = editorRequirements.find((req: any) => 
      req.section_name.toLowerCase().includes(section.toLowerCase())
    );
    
    return sectionRequirement?.hints || [];
  }

  /**
   * Get compliance tips from structured requirements
   */
  private getComplianceTipsFromStructured(_section: string, structuredRequirements: any): string[] {
    const libraryRequirements = structuredRequirements.library || [];
    const complianceRequirements = libraryRequirements.flatMap((req: any) => 
      req.compliance_requirements || []
    );
    
    return complianceRequirements;
  }

  /**
   * Calculate readiness score from structured requirements
   */
  private calculateReadinessScoreFromStructured(section: string, context: string, structuredRequirements: any): number {
    const editorRequirements = structuredRequirements.editor || [];
    const sectionRequirement = editorRequirements.find((req: any) => 
      req.section_name.toLowerCase().includes(section.toLowerCase())
    );
    
    if (!sectionRequirement) return 0;
    
    const wordCount = this.countWords(context);
    const minWords = sectionRequirement.word_count_min || 0;
    const maxWords = sectionRequirement.word_count_max || Infinity;
    
    if (wordCount < minWords) return Math.round((wordCount / minWords) * 50);
    if (wordCount > maxWords) return Math.max(0, 100 - ((wordCount - maxWords) / maxWords) * 50);
    
    return 100;
  }

  /**
   * Build section-specific prompt
   */
  // private buildSectionPrompt(_section: string, _context: string, _program: Program): string {
  //   const programType = _program.type;
  //   const hints = this.programHints[programType] || this.programHints.general;
  //   const tone = this.config.tone || 'neutral';
  //   const language = this.config.language || 'en';
  //   
  //   const toneInstructions = {
  //     neutral: 'Use a balanced, professional tone that is clear and accessible.',
  //     formal: 'Use a formal, academic tone with sophisticated language and structure.',
  //     concise: 'Use a concise, direct tone with short sentences and clear points.'
  //   };
  //   
  //   return `
  // You are an AI writing assistant helping to create a ${programType} application for ${program.name}.
  // 
  // Section: ${section}
  // Context: ${context}
  // Language: ${language.toUpperCase()}
  // Tone: ${tone} - ${toneInstructions[tone]}
  // 
  // Program-specific guidance:
  // ${hints.reviewer_tips.map((tip: string) => `- ${tip}`).join('\n')}
  // 
  // User answers:
  // ${Object.entries(this.config.userAnswers).map(([key, value]) => `- ${key}: ${value}`).join('\n')}
  // 
  // Requirements:
  // - Maximum ${this.config.maxWords} words
  // - Use ${language} language
  // - Follow ${tone} tone
  // - Be specific and actionable
  // - Include relevant examples
  // - Address the reviewer's perspective
  // 
  // Generate helpful content for this section.
  // `;
  // }

  /**
   * Call AI service
   */
  private async callAI(prompt: string): Promise<{ content: string; suggestions?: string[]; citations?: string[] }> {
    // Mock AI response for now
    return {
      content: `This is a sample response for the prompt: ${prompt.substring(0, 100)}...`,
      suggestions: ['Add more specific examples', 'Include financial projections'],
      citations: ['Program guidelines', 'Best practices']
    };
  }

  /**
   * Count words in text
   */
  private countWords(text: string): number {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }
}

/**
 * Create AI helper with enhanced features
 */
export function createAIHelper(config: AIHelperConfig): AIHelper {
  return new AIHelper(config);
}

/**
 * Create enhanced AI helper with Phase 3 features
 */
export function createEnhancedAIHelper(
  config: AIHelperConfig,
  programHints: any,
  userAnswers: Record<string, any>,
  tone: 'neutral' | 'formal' | 'concise' = 'neutral',
  language: 'de' | 'en' = 'en',
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
    ...config,
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

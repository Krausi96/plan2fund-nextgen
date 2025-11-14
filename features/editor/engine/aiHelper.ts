/**
 * AI Helper for editor - Enhanced with Phase 3 Features
 * Provides section-scoped prompts, bound to 200 words, cites program hints
 * Integrates with Dynamic Decision Trees and Program-Specific Templates
 */

import type { ConversationMessage } from '@/shared/types/plan';

// ProgramTemplate and TemplateSection types removed - using Enhanced Data Pipeline instead

interface Program {
  id: string;
  name: string;
  type: string;
  amount?: string;
  eligibility?: string[];
  requirements?: string[];
  score?: number;
  reasons?: string[];
  risks?: string[];
}

interface AIHelperConfig {
  maxWords: number;
  sectionScope: string;
  programHints: any;
  userAnswers: Record<string, any>;
  tone?: 'neutral'|'formal'|'concise';
  language?: 'de'|'en';
  // Phase 3 Enhancements
  decisionTreeAnswers?: Record<string, any>;
  programTemplate?: any; // Using Enhanced Data Pipeline instead
  currentSection?: any; // Using Enhanced Data Pipeline instead
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
    program: Program,
    conversationHistory?: ConversationMessage[]
  ): Promise<AIResponse> {
    // Get structured requirements for this program
    const structuredRequirements = await this.getStructuredRequirements(program.id);
    
    const prompt = this.buildSectionPromptWithStructured(section, context, program, structuredRequirements);
    
    // Get section guidance from structured requirements
    const sectionGuidance = this.getSectionGuidanceFromStructured(section, structuredRequirements);
    const complianceTips = this.getComplianceTipsFromStructured(section, structuredRequirements);
    
    // Call OpenAI API with enhanced context
    const response = await this.callAIWithContext(prompt, {
      sectionId: section,
      sectionTitle: section,
      currentContent: context,
      programType: program.type,
      programName: program.name,
      sectionGuidance: sectionGuidance,
      hints: this.config.programHints?.[program.type]?.reviewer_tips || [],
      conversationHistory: conversationHistory || []
    });
    
    return {
      content: response.content,
      wordCount: this.countWords(response.content),
      suggestions: response.suggestions || [],
      citations: response.citations || [],
      programSpecific: true,
      sectionGuidance: sectionGuidance,
      complianceTips: complianceTips,
      readinessScore: this.calculateReadinessScoreFromStructured(section, context, structuredRequirements)
    };
  }
  
  /**
   * Call AI service with enhanced context
   */
  private async callAIWithContext(
    prompt: string,
    context: {
      sectionId: string;
      sectionTitle: string;
      currentContent: string;
      programType: string;
      programName?: string;
      sectionGuidance?: string[];
      hints?: string[];
      conversationHistory?: ConversationMessage[];
    }
  ): Promise<{ content: string; suggestions?: string[]; citations?: string[] }> {
    try {
      // Call OpenAI API endpoint with full context
      const response = await fetch('/api/ai/openai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: prompt,
          context: {
            sectionId: context.sectionId,
            sectionTitle: context.sectionTitle,
            currentContent: context.currentContent,
            programType: context.programType,
            programName: context.programName,
            sectionGuidance: context.sectionGuidance,
            hints: context.hints
          },
          conversationHistory: context.conversationHistory || [],
          action: 'generate'
        })
      });
      
      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }
      
      const aiResponse = await response.json();
      
      // Return structured response
      return {
        content: aiResponse.content || '',
        suggestions: aiResponse.suggestions || [],
        citations: aiResponse.citations || []
      };
    } catch (error) {
      console.error('OpenAI API call failed:', error);
      // Fallback to mock response if API fails (non-fatal)
      return {
        content: `AI generation temporarily unavailable. Please try again or write your content manually.

${context.sectionTitle} Section
${context.sectionGuidance?.map(g => `- ${g}`).join('\n') || ''}

This is a placeholder response. The AI service will be available shortly.`,
        suggestions: ['Try again in a moment', 'Write content manually', 'Check your internet connection'],
        citations: []
      };
    }
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
  programTemplate?: any, // Using Enhanced Data Pipeline instead
  currentSection?: any, // Using Enhanced Data Pipeline instead
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

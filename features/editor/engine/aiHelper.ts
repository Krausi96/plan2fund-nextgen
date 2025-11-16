/**
 * AI Helper for editor - Enhanced with Phase 3 Features
 * Provides section-scoped prompts, bound to 200 words, cites program hints
 * Integrates with Dynamic Decision Trees and Program-Specific Templates
 * NOW: Unified Business Expert System with Template Knowledge
 */

import type { ConversationMessage } from '@/features/editor/types/plan';
import { getTemplateKnowledge } from '@templates';

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
    // If program.id is 'default', try to get from localStorage (set by reco)
    // UPDATED: Now uses 15 categories directly (geographic, eligibility, financial, etc.)
    // instead of expecting editor[]/library[] format
    let categorizedRequirements: any = null;
    
    if (program.id !== 'default' && typeof window !== 'undefined') {
      // Try to get from localStorage first (for dynamically generated programs from ProgramFinder)
      const storedProgram = localStorage.getItem('selectedProgram');
      if (storedProgram) {
        try {
          const programData = JSON.parse(storedProgram);
          if (programData.categorized_requirements) {
            // Use 15 categories directly (extracted by llmExtract.ts)
            categorizedRequirements = programData.categorized_requirements;
            console.log('✅ Loaded categorized_requirements from localStorage:', 
              Object.keys(categorizedRequirements).length, 'categories');
          }
        } catch (e) {
          console.warn('Failed to parse stored program data:', e);
        }
      }
      
      // Fallback: try API if localStorage didn't have it (for database programs)
      if (!categorizedRequirements) {
        const apiRequirements = await this.getStructuredRequirements(program.id);
        // API might return editor[]/library[] format, convert if needed
        if (apiRequirements && apiRequirements.categorized_requirements) {
          categorizedRequirements = apiRequirements.categorized_requirements;
        } else if (apiRequirements) {
          // Legacy format - keep for backward compatibility
          categorizedRequirements = null;
        }
      }
    }
    
    const prompt = this.buildSectionPromptWithStructured(section, context, program, categorizedRequirements);
    
    // Get section guidance from categorized requirements (15 categories)
    const sectionGuidance = this.getSectionGuidanceFromCategories(section, categorizedRequirements);
    const complianceTips = this.getComplianceTipsFromCategories(categorizedRequirements);
    
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
      readinessScore: this.calculateReadinessScoreFromCategories(section, context, categorizedRequirements)
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
      const response = await fetch(`/api/programs/${programId}/requirements`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn(`Failed to load structured requirements for ${programId}:`, error);
    }
    return { decision_tree: [], editor: [], library: [] };
  }

  /**
   * Build section prompt with structured requirements AND template knowledge
   * NOW: Deep Business Expert with Template Knowledge Integration
   */
  private buildSectionPromptWithStructured(
    section: string, 
    context: string,
    program: Program,
    categorizedRequirements: any
  ): string {
    // Get template knowledge for this section (from German template)
    const templateKnowledge = getTemplateKnowledge(section);

    // Extract program requirements for this section from 15 categories
    const programRequirements = this.getRequirementsForSection(section, categorizedRequirements);
    
    let programRequirementsSection = '';
    if (programRequirements && programRequirements.length > 0) {
      programRequirementsSection = `
=== PROGRAM-SPECIFIC REQUIREMENTS FOR ${section.toUpperCase()} ===
${programRequirements.map((req: string) => `- ${req}`).join('\n')}
`;
    }

    // Build template knowledge section
    let templateKnowledgeSection = '';
    if (templateKnowledge) {
      templateKnowledgeSection = `
=== TEMPLATE GUIDANCE (Austrian Business Plan Template) ===
${templateKnowledge.guidance}

Required Elements:
${templateKnowledge.requiredElements.map(e => `- ${e}`).join('\n')}

${templateKnowledge.frameworks ? `Frameworks to Use:\n${templateKnowledge.frameworks.map(f => `- ${f}`).join('\n')}\n` : ''}
${templateKnowledge.bestPractices ? `Best Practices:\n${templateKnowledge.bestPractices.map(p => `- ${p}`).join('\n')}\n` : ''}
${templateKnowledge.commonMistakes ? `Common Mistakes to Avoid:\n${templateKnowledge.commonMistakes.map(m => `- ${m}`).join('\n')}\n` : ''}
${templateKnowledge.expertQuestions ? `Expert Questions to Consider:\n${templateKnowledge.expertQuestions.map(q => `- ${q}`).join('\n')}\n` : ''}
`;
    }
    
    return `
You are a senior business consultant with 20+ years of experience in:
- Business plan writing (especially Austrian/German business plans)
- Market analysis (Porter Five Forces, TAM/SAM/SOM, SWOT, competitive analysis)
- Financial planning (projections, budgeting, funding strategies)
- Grant applications (Horizon Europe, FFG, AWS, etc.)
- Startup consulting (business models, go-to-market, scaling)

You have BROAD BUSINESS EXPERTISE from:
1. Your extensive training and experience (general business knowledge)
2. Industry best practices (market analysis, financial planning, etc.)
3. Common mistakes and how to avoid them
4. Business frameworks (Porter, SWOT, SMART, TAM/SAM/SOM, etc.)
5. Grant writing standards and reviewer expectations

You ALSO have access to template guidance (Austrian business plan template) which provides:
- Section-specific guidance
- Recommended frameworks
- Best practices for this template
- Common mistakes to avoid

BUT you use your GENERAL EXPERTISE FIRST, then enhance with template guidance.

=== CURRENT CONTENT ===
${context || '(No content yet)'}

=== SECTION: ${section} ===
${templateKnowledgeSection}

${programRequirementsSection}

=== PROGRAM INFORMATION ===
Program: ${program.name} (${program.type})
${this.programHints[program.type]?.reviewer_tips?.map((tip: string) => `- ${tip}`).join('\n') || 'No specific guidance'}

=== USER'S ANSWERS TO PROMPTS ===
${Object.entries(this.config.userAnswers).length > 0 
  ? Object.entries(this.config.userAnswers).map(([key, value]) => `- ${key}: ${value}`).join('\n')
  : 'No user answers provided yet'}

=== YOUR TASK ===
1. ANALYZE the current content as a business expert:
   - What's good?
   - What's missing?
   - What's weak?
   - What needs improvement?
   - Does it follow best practices?
   - Are there common mistakes?

2. PROVIDE CONSULTING ADVICE:
   - Specific recommendations
   - Why these recommendations matter
   - How to improve

3. GENERATE improved content that:
   - Follows template guidance (${templateKnowledge ? 'see above' : 'general best practices'})
   - Uses appropriate frameworks${templateKnowledge?.frameworks ? ` (${templateKnowledge.frameworks.join(', ')})` : ''}
   - Meets program requirements
   - Follows best practices
   - Avoids common mistakes
   - Is professionally written
   - Is realistic and compelling

4. EXPLAIN your recommendations:
   - Why you made these changes
   - What frameworks you used
   - How it follows best practices

=== OUTPUT REQUIREMENTS ===
- Maximum ${this.config.maxWords} words
- Use ${this.config.language || 'en'} language
- Follow ${this.config.tone || 'neutral'} tone
- Be specific and actionable
- Include relevant examples
- Address the reviewer's perspective

Generate helpful, expert-level content for this section.
`;
  }

  /**
   * Get requirements for a specific section from 15 categories
   * Maps section name to category (similar to RequirementsModal)
   */
  private getRequirementsForSection(
    section: string,
    categorizedRequirements: any
  ): string[] {
    if (!categorizedRequirements || typeof categorizedRequirements !== 'object') {
      return [];
    }
    
    // Map section name to category (same mapping as RequirementsModal)
    const categoryMapping: Record<string, string> = {
      'financial': 'financial',
      'market': 'market_size',
      'risk': 'compliance',
      'team': 'team',
      'project': 'project',
      'technical': 'technical',
      'impact': 'impact',
      'general': 'eligibility',
      'eligibility': 'eligibility',
      'geographic': 'geographic',
      'timeline': 'timeline',
      'documents': 'documents',
      'legal': 'legal',
      'application': 'application',
      'funding_details': 'funding_details',
      'restrictions': 'restrictions',
      'terms': 'terms'
    };
    
    // Try to match section name to category
    const sectionLower = section.toLowerCase();
    let reqCategory = 'eligibility'; // default
    
    // Check direct mapping
    for (const [key, value] of Object.entries(categoryMapping)) {
      if (sectionLower.includes(key)) {
        reqCategory = value;
        break;
      }
    }
    
    const requirements = categorizedRequirements[reqCategory] || [];
    
    // Extract values as strings (similar to RequirementsModal)
    return requirements
      .map((req: any) => {
        if (!req.value) return null;
        const value = Array.isArray(req.value) ? req.value.join(', ') : String(req.value);
        return value.length < 500 ? value : null; // Allow longer values for AI prompts
      })
      .filter(Boolean) as string[];
  }

  /**
   * Get section guidance from 15 categories
   * Extracts hints/guidance from relevant categories
   */
  private getSectionGuidanceFromCategories(section: string, categorizedRequirements: any): string[] {
    if (!categorizedRequirements) return [];
    
    const requirements = this.getRequirementsForSection(section, categorizedRequirements);
    // Return first 5 requirements as guidance
    return requirements.slice(0, 5);
  }

  /**
   * Get compliance tips from 15 categories
   * Extracts from compliance, legal, terms categories
   */
  private getComplianceTipsFromCategories(categorizedRequirements: any): string[] {
    if (!categorizedRequirements) return [];
    
    const complianceReqs = categorizedRequirements.compliance || [];
    const legalReqs = categorizedRequirements.legal || [];
    const termsReqs = categorizedRequirements.terms || [];
    
    const allCompliance = [
      ...complianceReqs,
      ...legalReqs,
      ...termsReqs
    ];
    
    return allCompliance
      .map((req: any) => {
        if (!req.value) return null;
        const value = Array.isArray(req.value) ? req.value.join(', ') : String(req.value);
        return value.length < 200 ? value : null;
      })
      .filter(Boolean) as string[];
  }

  /**
   * Calculate readiness score from 15 categories
   * Simple scoring based on content length and requirements presence
   */
  private calculateReadinessScoreFromCategories(
    section: string,
    context: string,
    categorizedRequirements: any
  ): number {
    if (!categorizedRequirements) return 0;
    
    const requirements = this.getRequirementsForSection(section, categorizedRequirements);
    const wordCount = this.countWords(context);
    
    // Base score on word count (50 points) and requirements coverage (50 points)
    const wordScore = Math.min(50, (wordCount / 200) * 50); // 200 words = 50 points
    const requirementScore = requirements.length > 0 ? 50 : 0;
    
    return Math.round(wordScore + requirementScore);
  }

  /**
   * Get section guidance from structured requirements (legacy - kept for backward compatibility)
   */
  private getSectionGuidanceFromStructured(section: string, structuredRequirements: any): string[] {
    const editorRequirements = structuredRequirements?.editor || [];
    const sectionRequirement = editorRequirements.find((req: any) => 
      req.section_name?.toLowerCase().includes(section.toLowerCase())
    );
    
    return sectionRequirement?.hints || [];
  }

  /**
   * Get compliance tips from structured requirements (legacy - kept for backward compatibility)
   */
  private getComplianceTipsFromStructured(_section: string, structuredRequirements: any): string[] {
    const libraryRequirements = structuredRequirements?.library || [];
    const complianceRequirements = libraryRequirements.flatMap((req: any) => 
      req.compliance_requirements || []
    );
    
    return complianceRequirements;
  }

  /**
   * Calculate readiness score from structured requirements (legacy - kept for backward compatibility)
   */
  private calculateReadinessScoreFromStructured(section: string, context: string, structuredRequirements: any): number {
    const editorRequirements = structuredRequirements?.editor || [];
    const sectionRequirement = editorRequirements.find((req: any) => 
      req.section_name?.toLowerCase().includes(section.toLowerCase())
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

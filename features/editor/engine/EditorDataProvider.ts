// ========= PLAN2FUND — EDITOR DATA PROVIDER =========
// Data layer for the unified editor architecture
// Handles API calls and data transformation

import { EditorProduct, EditorTemplate, UnifiedEditorSection } from '@/features/editor/types/editor';
import { getSections } from '@/shared/lib/templates';

export class EditorDataProvider {
  private baseUrl: string;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
  }

  // ============================================================================
  // PRODUCT/PROGRAM DATA
  // ============================================================================

  /**
   * Get program data by ID
   */
  async getProduct(productId: string): Promise<EditorProduct> {
    try {
      const response = await fetch(`${this.baseUrl}/api/programmes/${productId}/requirements`);
      
      if (!response.ok) {
        throw new Error(`Failed to load product: ${response.statusText}`);
      }
      
      const data = await response.json();
      // Base fields from API
      const programType = (data.program_type || 'grant') as string;
      const fundingType: 'grants' | 'bankLoans' | 'equity' | 'visa' =
        programType.includes('loan') ? 'bankLoans' : programType.includes('equity') ? 'equity' : programType.includes('visa') ? 'visa' : 'grants';
      // Fallback template for gap-filling - use unified system
      // Default to submission product for fallback sections
      let fallbackById: Record<string, UnifiedEditorSection> = {};
      try {
        const fallbackSections = await getSections(fundingType, 'submission');
        fallbackSections.forEach((s) => {
          fallbackById[s.id] = {
            id: s.id,
            title: s.title,
            placeholder: s.description || '',
            required: s.required !== false,
            wordCountMin: s.wordCountMin || 200,
            wordCountMax: s.wordCountMax || 800,
            hints: s.prompts || [],
            validationRules: s.validationRules || { requiredFields: [], formatRequirements: [] },
            template: s.prompts?.join(' ') || '',
            guidance: s.description || '',
            requirements: [s.category],
            prefillData: {},
            section_name: s.title,
            description: s.description,
            word_count_min: s.wordCountMin || 200,
            word_count_max: s.wordCountMax || 800,
            ai_guidance: s.prompts?.join(' ') || '',
            order: s.order || 0
          } as UnifiedEditorSection;
        });
      } catch (error) {
        console.warn('Could not load fallback sections:', error);
      }
      // Merge API sections with fallback prompts/guidance if partial
      const apiSections: any[] = Array.isArray(data.editor) ? data.editor : [];
      const mergedSections: UnifiedEditorSection[] = apiSections.length > 0
        ? apiSections.map((s: any) => {
            const back = fallbackById[s.id] || {} as any;
            return {
              id: s.id || back.id,
              title: s.section_name || back.title || 'Untitled Section',
              required: s.required !== false,
              template: s.template || s.prompt || back.template || (((back as any).prompts ? (back as any).prompts.join(' ') : '')),
              guidance: s.guidance || back.guidance || back.description || '',
              requirements: s.validation_rules || back.requirements || [],
              prefillData: {},
              section_name: s.section_name || back.title,
              description: s.placeholder || back.description || '',
              hints: s.hints || back.hints || [],
              word_count_min: s.word_count_min ?? back.word_count_min,
              word_count_max: s.word_count_max ?? back.word_count_max,
              ai_guidance: s.ai_guidance || (((back as any).prompts ? (back as any).prompts.join(' ') : ''))
            } as any;
          })
        : [];
      
      return {
        id: productId,
        name: data.program_name || `Program ${productId}`,
        type: (programType.includes('loan') ? 'loan' : programType.includes('equity') ? 'equity' : programType.includes('visa') ? 'visa' : programType.includes('grant') ? 'grant' : 'other') as any,
        description: data.description,
        sections: mergedSections,
        requirements: data
      };
    } catch (error) {
      console.error('Error loading product:', error);
      throw error;
    }
  }

  /**
   * Get all available programs
   */
  async getProducts(): Promise<EditorProduct[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/programs?enhanced=true`);
      
      if (!response.ok) {
        throw new Error(`Failed to load products: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      return (data.programs || []).map((program: any) => ({
        id: program.id,
        name: program.name,
        type: program.type || program.program_type || 'grant',
        description: program.description,
        sections: program.editor_sections || [],
        requirements: program
      }));
    } catch (error) {
      console.error('Error loading products:', error);
      throw error;
    }
  }

  // ============================================================================
  // TEMPLATE DATA
  // ============================================================================

  /**
   * Generate template from real program data using categoryConverters
   */
  private async generateTemplateFromProgram(programId: string): Promise<EditorTemplate> {
    try {
      // Fetch program data from API
      const response = await fetch(`/api/programmes/${programId}/requirements`);
      if (!response.ok) {
        throw new Error(`Failed to fetch program data: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Extract program info and categorized requirements
      const program = data.program || {};
      // const categorizedRequirements = data.categorized_requirements || {};
      const editorSections = data.editor || [];
      
      // Determine program type for template selection
      // const programType = program.program_type || 'grants';
      
      // Generate template using real data
      const template: EditorTemplate = {
        id: `program-${programId}`,
        name: program.name || 'Program Template',
        description: program.description || 'Template based on program requirements',
        route: 'business-plan', // Default route
        sections: editorSections.map((section: any) => ({
          id: section.id,
          title: section.section_name,
          required: section.required,
          template: section.prompt,
          guidance: section.guidance || section.placeholder,
          requirements: section.validation_rules || [],
          prefillData: {},
          description: section.placeholder,
          hints: section.hints || [],
          word_count_min: section.word_count_min || 200,
          word_count_max: section.word_count_max || 800
        })),
      };
      
      return template;
    } catch (error) {
      console.error('Error generating template from program:', error);
      // Fallback to mock template
      return this.getMockTemplate('fallback-template');
    }
  }

  /**
   * Generate template inputs based on program type
   */
  // Removed unused method: generateTemplateInputs

  /**
   * Generate template outputs based on program type
   */
  // Removed unused method: generateTemplateOutputs

  /**
   * Generate compliance checklist from categorized requirements
   */
  // Removed unused method: generateComplianceChecklist

  /**
   * Get mock template as fallback
   */
  private getMockTemplate(templateId: string): EditorTemplate {
    // Return a basic mock template
    return {
      id: templateId,
      name: 'Mock Template',
      description: 'Mock template for development',
      route: 'business-plan',
      sections: []
    };
  }

  /**
   * Get template by ID
   * Enhanced to use real program data + standard sections
   */
  async getTemplate(templateId: string, programId?: string): Promise<EditorTemplate> {
    try {
      // If we have a programId, fetch real program data and generate template
      if (programId) {
        return await this.generateTemplateFromProgram(programId);
      }

      // Fallback to mock templates for development
      const mockTemplates: Record<string, EditorTemplate> = {
        'business-plan': {
          id: 'business-plan',
          name: 'Business Plan',
          description: 'Comprehensive business plan template',
          route: 'business-plan',
          sections: [
            {
              id: 'executive-summary',
              title: 'Executive Summary',
              required: true,
              template: 'Provide a compelling executive summary...',
              guidance: 'Keep it concise and highlight key points',
              requirements: [],
              prefillData: {},
              description: 'Brief overview of your business',
              hints: ['Include mission statement', 'Mention key metrics', 'Highlight competitive advantages'],
              word_count_min: 200,
              word_count_max: 500
            },
            {
              id: 'market-analysis',
              title: 'Market Analysis',
              required: true,
              template: 'Describe your target market...',
              guidance: 'Use data and research to support your analysis',
              requirements: [],
              prefillData: {},
              description: 'Analysis of your target market',
              hints: ['Include market size', 'Identify target customers', 'Analyze competition'],
              word_count_min: 300,
              word_count_max: 800
            }
          ]
        },
        'pitch-deck': {
          id: 'pitch-deck',
          name: 'Pitch Deck',
          description: 'Investor pitch presentation template',
          route: 'pitch-deck',
          sections: [
            {
              id: 'problem-solution',
              title: 'Problem & Solution',
              required: true,
              template: 'What problem are you solving...',
              guidance: 'Be clear and compelling',
              requirements: [],
              prefillData: {},
              description: 'Define the problem and your solution',
              hints: ['Make it relatable', 'Show market need', 'Explain your approach'],
              word_count_min: 150,
              word_count_max: 300
            }
          ]
        }
      };

      return mockTemplates[templateId] || mockTemplates['business-plan'];
    } catch (error) {
      console.error('Error loading template:', error);
      throw error;
    }
  }

  /**
   * Get all available templates
   */
  async getTemplates(): Promise<EditorTemplate[]> {
    try {
      // For now, return mock templates - will be implemented when template API is ready
      return [
        {
          id: 'business-plan',
          name: 'Business Plan',
          description: 'Comprehensive business plan template',
          route: 'business-plan',
          sections: []
        },
        {
          id: 'pitch-deck',
          name: 'Pitch Deck',
          description: 'Investor pitch presentation template',
          route: 'pitch-deck',
          sections: []
        },
        {
          id: 'grant-proposal',
          name: 'Grant Proposal',
          description: 'Grant application template',
          route: 'grant-proposal',
          sections: []
        }
      ];
    } catch (error) {
      console.error('Error loading templates:', error);
      throw error;
    }
  }

  // ============================================================================
  // CONTENT MANAGEMENT
  // ============================================================================

  /**
   * Save editor content
   */
  async saveContent(content: Record<string, string>, documentId?: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/editor/content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentId,
          content,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to save content: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error saving content:', error);
      // Fallback to localStorage
      const planData = {
        content,
        documentId: documentId || 'current-plan',
        lastSaved: new Date().toISOString()
      };
      
      localStorage.setItem('currentPlan', JSON.stringify(planData));
      console.log('💾 Plan content saved to localStorage (fallback)');
      
      // Also save to planStore for preview page
      if (typeof window !== 'undefined') {
        const { savePlanSections } = await import('@/shared/lib/planStore');
        const planSections = Object.entries(content).map(([id, content]) => ({
          id,
          title: id.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          content
        }));
        savePlanSections(planSections);
      }
      
      // Don't throw error since we saved to localStorage
    }
  }

  /**
   * Load editor content
   */
  async loadContent(documentId: string): Promise<Record<string, string>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/editor/content/${documentId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to load content: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.content || {};
    } catch (error) {
      console.error('Error loading content:', error);
      // Fallback to localStorage
      const saved = localStorage.getItem('editorContent');
      return saved ? JSON.parse(saved) : {};
    }
  }

  // ============================================================================
  // AI ASSISTANT
  // ============================================================================

  /**
   * Get AI assistant response
   */
  async getAIResponse(message: string, context: any): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/api/ai/openai`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          context
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to get AI response: ${response.statusText}`);
      }

      const data = await response.json();
      return data.response || 'Sorry, I could not process your request.';
    } catch (error) {
      console.error('Error getting AI response:', error);
      return 'Sorry, the AI assistant is currently unavailable.';
    }
  }

  // ============================================================================
  // READINESS CHECK
  // ============================================================================

  /**
   * Calculate readiness score
   */
  async calculateReadiness(sections: UnifiedEditorSection[], content: Record<string, string>): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/editor/readiness`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sections,
          content
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to calculate readiness: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error calculating readiness:', error);
      // Return mock readiness data
      return {
        score: 75,
        dimensions: [
          { id: 'completeness', title: 'Content Completeness', score: 80, status: 'passed', message: 'Good progress' },
          { id: 'quality', title: 'Content Quality', score: 70, status: 'warning', message: 'Could be improved' }
        ]
      };
    }
  }

  // ============================================================================
  // EXPORT
  // ============================================================================

  /**
   * Export document
   */
  async exportDocument(content: Record<string, string>, format: string): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/api/editor/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          format
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to export document: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      return url;
    } catch (error) {
      console.error('Error exporting document:', error);
      throw error;
    }
  }
}

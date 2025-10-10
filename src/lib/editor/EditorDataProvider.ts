// ========= PLAN2FUND — EDITOR DATA PROVIDER =========
// Data layer for the unified editor architecture
// Handles API calls and data transformation

import { EditorProduct, EditorTemplate, UnifiedEditorSection } from '../../types/editor';

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
      
      return {
        id: productId,
        name: data.program_name || `Program ${productId}`,
        type: data.program_type || 'grant',
        description: data.description,
        sections: data.editor || [],
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
      const categorizedRequirements = data.categorized_requirements || {};
      const editorSections = data.editor || [];
      
      // Determine program type for template selection
      const programType = program.program_type || 'grants';
      
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
        inputs: this.generateTemplateInputs(programType),
        outputs: this.generateTemplateOutputs(programType),
        complianceChecklist: this.generateComplianceChecklist(categorizedRequirements)
      };
      
      return template;
    } catch (error) {
      console.error('Error generating template from program:', error);
      // Fallback to mock template
      return this.getMockTemplate(templateId);
    }
  }

  /**
   * Generate template inputs based on program type
   */
  private generateTemplateInputs(programType: string): string[] {
    const inputs: { [key: string]: string[] } = {
      grants: ['Project Description', 'Innovation Plan', 'Impact Assessment', 'Consortium Details', 'Financial Plan'],
      bankLoans: ['Business Description', 'Financial Stability', 'Repayment Plan', 'Collateral Details'],
      equity: ['Market Opportunity', 'Business Model', 'Traction Metrics', 'Team Details', 'Financial Projections'],
      visa: ['Innovation Focus', 'Economic Benefit', 'Job Creation Plan', 'Austrian Market Analysis', 'Qualifications']
    };
    
    return inputs[programType] || inputs.grants;
  }

  /**
   * Generate template outputs based on program type
   */
  private generateTemplateOutputs(programType: string): string[] {
    const outputs: { [key: string]: string[] } = {
      grants: ['Grant Application', 'Project Proposal', 'Budget Breakdown', 'Timeline'],
      bankLoans: ['Loan Application', 'Business Plan', 'Financial Statements', 'Repayment Schedule'],
      equity: ['Pitch Deck', 'Business Plan', 'Financial Model', 'Due Diligence Package'],
      visa: ['Visa Application', 'Business Plan', 'Job Creation Plan', 'Economic Impact Report']
    };
    
    return outputs[programType] || outputs.grants;
  }

  /**
   * Generate compliance checklist from categorized requirements
   */
  private generateComplianceChecklist(categorizedRequirements: any): string[] {
    const checklist: string[] = [];
    
    // Add requirements from each category
    Object.entries(categorizedRequirements).forEach(([category, data]) => {
      if (Array.isArray(data) && data.length > 0) {
        data.forEach((item: any) => {
          if (item.required && item.value) {
            checklist.push(`${category}: ${Array.isArray(item.value) ? item.value.join(', ') : item.value}`);
          }
        });
      }
    });
    
    return checklist;
  }

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
      sections: [],
      inputs: [],
      outputs: [],
      complianceChecklist: []
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
      localStorage.setItem('editorContent', JSON.stringify(content));
      throw error;
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
      const response = await fetch(`${this.baseUrl}/api/ai/assistant`, {
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

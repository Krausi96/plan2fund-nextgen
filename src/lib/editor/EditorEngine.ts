// ========= PLAN2FUND — EDITOR ENGINE =========
// Core business logic for the unified editor architecture

import { EditorProduct, EditorTemplate, UnifiedEditorSection, EditorProgress, SectionProgress } from '../../types/editor';
import { EditorDataProvider } from './EditorDataProvider';
import { PRODUCT_SECTION_TEMPLATES } from '../templates/productSectionTemplates';

export class EditorEngine {
  private dataProvider: EditorDataProvider;

  constructor(dataProvider: EditorDataProvider) {
    this.dataProvider = dataProvider;
  }

  // ============================================================================
  // PRODUCT MANAGEMENT
  // ============================================================================

  /**
   * Load product data
   */
  async loadProduct(productId: string): Promise<EditorProduct> {
    return await this.dataProvider.getProduct(productId);
  }

  /**
   * Load all available products
   */
  async loadProducts(): Promise<EditorProduct[]> {
    return await this.dataProvider.getProducts();
  }

  // ============================================================================
  // TEMPLATE MANAGEMENT
  // ============================================================================

  /**
   * Load template data
   */
  async loadTemplate(templateId: string): Promise<EditorTemplate> {
    return await this.dataProvider.getTemplate(templateId);
  }

  /**
   * Load all available templates
   */
  async loadTemplates(): Promise<EditorTemplate[]> {
    return await this.dataProvider.getTemplates();
  }

  // ============================================================================
  // SECTION MANAGEMENT
  // ============================================================================

  /**
   * Load sections for a product and template combination
   */
  async loadSections(productId: string, templateId?: string): Promise<UnifiedEditorSection[]> {
    try {
      // Try to load from program data first
      const product = await this.loadProduct(productId);
      let sections = product.sections || [];

      // If template is specified, merge with template sections
      if (templateId) {
        const template = await this.loadTemplate(templateId);
        sections = this.mergeSections(sections, template.sections);
      }

      // If we have sections from program data, return them
      if (sections.length > 0) {
        return sections;
      }
    } catch (error) {
      console.log('No program data available, using template system');
    }

    // Fallback to template system based on product type
    return this.loadSectionsFromTemplates(productId, templateId);
  }

  /**
   * Load sections from template system when program data is not available
   */
  private loadSectionsFromTemplates(productId: string, templateId?: string): UnifiedEditorSection[] {
    // Map productId to product type (this could be improved with a mapping)
    const productType = this.mapProductIdToType(productId);
    const fundingType = templateId ? this.mapTemplateIdToFundingType(templateId) : 'grants';
    
    // Get template for product type and funding type
    const template = PRODUCT_SECTION_TEMPLATES[productType]?.[fundingType];
    
    if (!template) {
      console.warn(`No template found for productType: ${productType}, fundingType: ${fundingType}`);
      return this.getDefaultSections();
    }

    // Convert template sections to UnifiedEditorSection format
    return template.sections.map(section => ({
      id: section.id,
      title: section.title,
      required: section.required,
      template: section.prompts.join(' ') || '',
      guidance: section.description,
      requirements: [section.category],
      prefillData: {},
      section_name: section.title,
      description: section.description,
      word_count_min: section.wordCountMin,
      word_count_max: section.wordCountMax,
      ai_guidance: section.prompts.join(' '),
      hints: section.prompts
    }));
  }

  /**
   * Map product ID to product type
   */
  private mapProductIdToType(productId: string): 'strategy' | 'review' | 'submission' {
    // This is a simple mapping - could be improved with a proper mapping system
    if (productId.includes('strategy') || productId.includes('Strategy')) return 'strategy';
    if (productId.includes('review') || productId.includes('Review')) return 'review';
    if (productId.includes('submission') || productId.includes('Submission')) return 'submission';
    return 'strategy'; // Default
  }

  /**
   * Map template ID to funding type
   */
  private mapTemplateIdToFundingType(templateId: string): 'grants' | 'bankLoans' | 'equity' | 'visa' {
    // This is a simple mapping - could be improved with a proper mapping system
    if (templateId.includes('grant') || templateId.includes('Grant')) return 'grants';
    if (templateId.includes('loan') || templateId.includes('Loan')) return 'bankLoans';
    if (templateId.includes('equity') || templateId.includes('Equity')) return 'equity';
    if (templateId.includes('visa') || templateId.includes('Visa')) return 'visa';
    return 'grants'; // Default
  }

  /**
   * Get default sections when no template is available
   */
  private getDefaultSections(): UnifiedEditorSection[] {
    return [
      {
        id: 'executive-summary',
        title: 'Executive Summary',
        required: true,
        template: '',
        guidance: 'Brief overview of your business plan',
        requirements: [],
        prefillData: {},
        section_name: 'Executive Summary',
        description: 'Brief overview of your business plan',
        word_count_min: 150,
        word_count_max: 300,
        ai_guidance: 'Focus on key value propositions and market opportunity',
        hints: ['Keep it concise and compelling']
      },
      {
        id: 'project-description',
        title: 'Project Description',
        required: true,
        template: '',
        guidance: 'Detailed description of your project',
        requirements: [],
        prefillData: {},
        section_name: 'Project Description',
        description: 'Detailed description of your project',
        word_count_min: 300,
        word_count_max: 800,
        ai_guidance: 'Explain the problem you solve and how',
        hints: ['Be specific about your solution']
      }
    ];
  }

  /**
   * Merge product sections with template sections
   */
  private mergeSections(productSections: UnifiedEditorSection[], templateSections: UnifiedEditorSection[]): UnifiedEditorSection[] {
    const merged = [...productSections];
    
    templateSections.forEach(templateSection => {
      const existingIndex = merged.findIndex(section => section.id === templateSection.id);
      if (existingIndex >= 0) {
        // Merge with existing section
        merged[existingIndex] = {
          ...merged[existingIndex],
          ...templateSection,
          required: merged[existingIndex].required || templateSection.required
        };
      } else {
        // Add new section
        merged.push(templateSection);
      }
    });
    
    return merged;
  }

  // ============================================================================
  // CONTENT MANAGEMENT
  // ============================================================================

  /**
   * Save content
   */
  async saveContent(content: Record<string, string>, documentId?: string): Promise<void> {
    await this.dataProvider.saveContent(content, documentId);
  }

  /**
   * Load content
   */
  async loadContent(documentId: string): Promise<Record<string, string>> {
    return await this.dataProvider.loadContent(documentId);
  }

  // ============================================================================
  // PROGRESS CALCULATION
  // ============================================================================

  /**
   * Calculate overall progress
   */
  calculateProgress(sections: UnifiedEditorSection[], content: Record<string, string>): EditorProgress {
    const totalSections = sections.length;
    const completedSections = sections.filter(section => 
      this.isSectionCompleted(section, content[section.id])
    ).length;
    
    const overallProgress = totalSections > 0 ? (completedSections / totalSections) * 100 : 0;
    
    const now = Date.now();
    const sectionProgress: SectionProgress[] = sections.map(section => ({
      id: section.id,
      title: section.title || section.section_name || 'Untitled Section',
      completed: this.isSectionCompleted(section, content[section.id]),
      progress: this.calculateSectionProgress(section, content[section.id]),
      wordCount: this.getWordCount(content[section.id] || ''),
      wordCountTarget: {
        min: section.word_count_min,
        max: section.word_count_max
      },
      lastModified: new Date(now)
    }));

    return {
      overall: Math.round(overallProgress),
      sections: sectionProgress,
      lastUpdated: new Date(now)
    };
  }

  /**
   * Check if a section is completed
   */
  private isSectionCompleted(section: UnifiedEditorSection, content: string): boolean {
    if (!content || content.trim().length === 0) {
      return false;
    }

    // Check word count requirements
    const wordCount = this.getWordCount(content);
    if (section.word_count_min && wordCount < section.word_count_min) {
      return false;
    }
    if (section.word_count_max && wordCount > section.word_count_max) {
      return false;
    }

    return true;
  }

  /**
   * Calculate section-specific progress
   */
  private calculateSectionProgress(section: UnifiedEditorSection, content: string): number {
    if (!content || content.trim().length === 0) {
      return 0;
    }

    const wordCount = this.getWordCount(content);
    const minWords = section.word_count_min || 0;
    const maxWords = section.word_count_max || minWords + 100;

    if (wordCount < minWords) {
      return (wordCount / minWords) * 50; // 0-50% for reaching minimum
    } else if (wordCount <= maxWords) {
      return 50 + ((wordCount - minWords) / (maxWords - minWords)) * 50; // 50-100% for optimal range
    } else {
      return 100; // Over maximum, but still complete
    }
  }

  /**
   * Get word count for content
   */
  private getWordCount(content: string): number {
    if (!content) return 0;
    return content.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  // ============================================================================
  // AI ASSISTANT
  // ============================================================================

  /**
   * Get AI assistant response
   */
  async getAIResponse(message: string, context: any): Promise<string> {
    return await this.dataProvider.getAIResponse(message, context);
  }

  // ============================================================================
  // READINESS CHECK
  // ============================================================================

  /**
   * Calculate readiness score
   */
  async calculateReadiness(sections: UnifiedEditorSection[], content: Record<string, string>): Promise<any> {
    return await this.dataProvider.calculateReadiness(sections, content);
  }

  // ============================================================================
  // EXPORT
  // ============================================================================

  /**
   * Export document
   */
  async exportDocument(content: Record<string, string>, format: string): Promise<string> {
    return await this.dataProvider.exportDocument(content, format);
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Validate section content
   */
  validateSectionContent(section: UnifiedEditorSection, content: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Check required field
    if (section.required && (!content || content.trim().length === 0)) {
      errors.push(`${section.title || section.section_name} is required`);
    }

    // Check word count
    if (content) {
      const wordCount = this.getWordCount(content);
      
      if (section.word_count_min && wordCount < section.word_count_min) {
        errors.push(`${section.title || section.section_name} needs at least ${section.word_count_min} words (currently ${wordCount})`);
      }
      
      if (section.word_count_max && wordCount > section.word_count_max) {
        errors.push(`${section.title || section.section_name} should not exceed ${section.word_count_max} words (currently ${wordCount})`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get section statistics
   */
  getSectionStats(sections: UnifiedEditorSection[], content: Record<string, string>) {
    const totalSections = sections.length;
    const completedSections = sections.filter(section => 
      this.isSectionCompleted(section, content[section.id])
    ).length;
    
    const totalWords = Object.values(content).reduce((sum, text) => sum + this.getWordCount(text), 0);
    const totalTargetWords = sections.reduce((sum, section) => {
      const min = section.word_count_min || 0;
      const max = section.word_count_max || min + 100;
      return sum + ((min + max) / 2);
    }, 0);

    return {
      totalSections,
      completedSections,
      completionRate: totalSections > 0 ? (completedSections / totalSections) * 100 : 0,
      totalWords,
      totalTargetWords,
      wordProgress: totalTargetWords > 0 ? (totalWords / totalTargetWords) * 100 : 0
    };
  }

}

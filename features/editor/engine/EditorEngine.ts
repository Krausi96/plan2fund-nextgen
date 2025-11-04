// ========= PLAN2FUND — EDITOR ENGINE =========
// Core business logic for the unified editor architecture

import { EditorProduct, EditorTemplate, UnifiedEditorSection, EditorProgress, SectionProgress } from '@/features/editor/types/editor';
import { EditorDataProvider } from './EditorDataProvider';
import { getSections } from '@/shared/lib/templates';

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
  async loadSections(productId: string, templateId?: string, productType?: string): Promise<UnifiedEditorSection[]> {
    try {
      // Try to load from program data first
      const product = await this.loadProduct(productId);
      let sections = (product.sections || []).map(s => this.sanitizeSection(s));

      // If template is specified, merge with template sections
      if (templateId) {
        const template = await this.loadTemplate(templateId);
        sections = this.mergeSections(sections, template.sections.map(s => this.sanitizeSection(s)));
      }

      // If we have sections from program data, return them
      if (sections.length > 0) {
        return sections;
      }
    } catch (error) {
      console.log('No program data available, using template system');
    }

    // Fallback to template system based on product type
    return await this.loadSectionsFromTemplates(productId, templateId, productType);
  }

  /**
   * Load sections from template system when program data is not available
   */
  private async loadSectionsFromTemplates(_productId: string, templateId?: string, productType?: string): Promise<UnifiedEditorSection[]> {
    // Map productId to product type (this could be improved with a mapping)
    // Not needed anymore - using unified system
    const fundingType = templateId ? this.mapTemplateIdToFundingType(templateId) : 'grants';
    const product = productType || 'submission'; // Default to submission
    
    // Use unified template system
    try {
      const sections = await getSections(fundingType, product);
      
      if (!sections || sections.length === 0) {
        console.warn(`No sections found for fundingType: ${fundingType}, productType: ${product}`);
        return this.getDefaultSections();
      }

      // Convert unified sections to UnifiedEditorSection format
      return sections.map(section => ({
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
    } catch (error) {
      console.error('Error loading sections from unified templates:', error);
      return this.getDefaultSections();
    }
  }

  /**
   * Map product ID to product type
   * @deprecated Not used anymore - kept for potential future use
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  // @ts-expect-error - Intentionally unused for now
  private _mapProductIdToType(_productId: string): 'strategy' | 'review' | 'submission' {
    // Prefer exact matches, then substring heuristics
    const id = _productId.toLowerCase();
    if (id === 'submission') return 'submission';
    if (id === 'review') return 'review';
    if (id === 'strategy') return 'strategy';
    if (id.includes('submission')) return 'submission';
    if (id.includes('review')) return 'review';
    if (id.includes('strategy')) return 'strategy';
    return 'submission';
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
    const merged = productSections.map(s => this.sanitizeSection(s));
    
    templateSections.forEach(templateSection => {
      const existingIndex = merged.findIndex(section => section.id === templateSection.id);
      if (existingIndex >= 0) {
        // Merge with existing section
        const existing = merged[existingIndex];
        const combined: UnifiedEditorSection = {
          ...existing,
          // prefer existing title if present, else template
          title: existing.title || templateSection.title,
          section_name: existing.section_name || templateSection.section_name || existing.title || templateSection.title,
          required: existing.required || templateSection.required,
          // fill missing content with template prompts/guidance
          template: existing.template && existing.template.trim().length > 0 ? existing.template : (templateSection.template || templateSection.ai_guidance || ''),
          guidance: existing.guidance || templateSection.guidance || templateSection.description || '',
          description: existing.description || templateSection.description || '',
          ai_guidance: existing.ai_guidance || templateSection.ai_guidance || '',
          hints: (existing.hints && existing.hints.length > 0) ? existing.hints : (templateSection.hints || []),
          word_count_min: existing.word_count_min ?? templateSection.word_count_min,
          word_count_max: existing.word_count_max ?? templateSection.word_count_max,
          requirements: existing.requirements && existing.requirements.length ? existing.requirements : (templateSection.requirements || []),
          prefillData: existing.prefillData || templateSection.prefillData || {}
        } as any;
        merged[existingIndex] = this.sanitizeSection(combined);
      } else {
        // Add new section
        merged.push(this.sanitizeSection(templateSection));
      }
    });
    
    return merged;
  }

  /**
   * Ensure a section has viable defaults for all fields
   */
  private sanitizeSection(section: UnifiedEditorSection): UnifiedEditorSection {
    const title = section.title || section.section_name || 'Untitled Section';
    const template = section.template || section.ai_guidance || section.description || '';
    const guidance = section.guidance || section.description || '';
    const hints = section.hints || [];
    const requirements = section.requirements || [];
    const prefillData = section.prefillData || {};
    const required = section.required !== false;
    const word_count_min = section.word_count_min ?? 150;
    const word_count_max = section.word_count_max ?? 600;
    return {
      ...section,
      title,
      section_name: section.section_name || title,
      template,
      guidance,
      hints,
      requirements,
      prefillData,
      required,
      word_count_min,
      word_count_max
    };
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

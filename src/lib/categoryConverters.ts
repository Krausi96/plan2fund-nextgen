// ========= PLAN2FUND — CATEGORY CONVERTERS =========
// Convert 18 categories from Layer 1&2 into frontend-ready formats
// Input: categorized_requirements (18 categories)
// Output: editor, library formats (decision tree moved to dynamicDecisionTree.ts)

import { getStandardSections, StandardSection } from './standardSectionTemplates';

// ============================================================================
// INTERFACES
// ============================================================================

export interface CategoryData {
  type: string;
  value: string[];
  required: boolean;
  confidence: number;
  evidence: string[];
  source?: string;
  institutions?: string[];
}

export interface CategorizedRequirements {
  eligibility: CategoryData[];
  documents: CategoryData[];
  financial: CategoryData[];
  technical: CategoryData[];
  legal: CategoryData[];
  timeline: CategoryData[];
  geographic: CategoryData[];
  team: CategoryData[];
  project: CategoryData[];
  compliance: CategoryData[];
  impact: CategoryData[];
  capex_opex: CategoryData[];
  use_of_funds: CategoryData[];
  revenue_model: CategoryData[];
  market_size: CategoryData[];
  co_financing: CategoryData[];
  trl_level: CategoryData[];
  consortium: CategoryData[];
}

export interface EditorSection {
  id: string;
  section_name: string;
  prompt: string;
  placeholder: string;
  required: boolean;
  validation_rules: any[];
  values: string[];
  category: string;
  confidence: number;
  evidence: string[];
  word_count_min?: number;
  word_count_max?: number;
  order?: number;
  hints?: string[];
  guidance?: string;
}

export interface LibraryRequirement {
  id: string;
  eligibility_text: string;
  documents: string[];
  funding_amount: string;
  deadlines: string[];
  application_procedures: string[];
  compliance_requirements: string[];
  contact_info: any;
}

// ============================================================================
// CATEGORY CONVERTER CLASS
// ============================================================================

export class CategoryConverter {
  
  // Decision tree functionality moved to dynamicDecisionTree.ts to avoid duplication

  /**
   * Convert categorized requirements to editor sections
   * Enhanced to use standard sections + program-specific requirements
   */
  public convertToEditorSections(
    categorizedRequirements: CategorizedRequirements, 
    programType: string = 'grants'
  ): EditorSection[] {
    // Get standard sections for the program type
    const standardSections = getStandardSections(programType);
    
    // Convert standard sections to editor sections, enhanced with program requirements
    const sections: EditorSection[] = standardSections.map(standardSection => {
      return this.enhanceStandardSectionWithRequirements(standardSection, categorizedRequirements);
    });

    return sections;
  }

  /**
   * Enhance a standard section with program-specific requirements
   */
  private enhanceStandardSectionWithRequirements(
    standardSection: StandardSection, 
    categorizedRequirements: CategorizedRequirements
  ): EditorSection {
    // Get relevant requirements for this section's category
    const relevantRequirements = this.getRelevantRequirements(standardSection.category, categorizedRequirements);
    
    // Extract values from requirements
    const values = this.extractValues(relevantRequirements);
    
    // Create enhanced prompts combining standard prompts with specific requirements
    const enhancedPrompts = this.createEnhancedPrompts(standardSection, relevantRequirements);
    
    // Create validation rules combining standard rules with requirement-specific rules
    const enhancedValidationRules = this.createEnhancedValidationRules(standardSection, relevantRequirements);

    return {
      id: standardSection.id,
      section_name: standardSection.title,
      prompt: enhancedPrompts.join(' '),
      placeholder: standardSection.description,
      required: standardSection.required,
      validation_rules: enhancedValidationRules,
      values: values,
      word_count_min: standardSection.wordCountMin,
      word_count_max: standardSection.wordCountMax,
      order: standardSection.order,
      category: standardSection.category,
      hints: standardSection.prompts,
      guidance: standardSection.description,
      confidence: this.calculateAverageConfidence(relevantRequirements),
      evidence: relevantRequirements.flatMap(req => req.evidence || [])
    };
  }

  /**
   * Get requirements relevant to a specific category
   */
  private getRelevantRequirements(category: string, categorizedRequirements: CategorizedRequirements): CategoryData[] {
    // Map standard section categories to requirement categories
    const categoryMapping: { [key: string]: keyof CategorizedRequirements } = {
      'general': 'eligibility',
      'project': 'project',
      'technical': 'technical',
      'impact': 'impact',
      'consortium': 'consortium',
      'financial': 'financial',
      'legal': 'legal',
      'team': 'team',
      'market_size': 'market_size',
      'revenue_model': 'revenue_model',
      'geographic': 'geographic'
    };

    const requirementCategory = categoryMapping[category] || 'eligibility';
    return categorizedRequirements[requirementCategory] || [];
  }

  /**
   * Create enhanced prompts combining standard prompts with specific requirements
   */
  private createEnhancedPrompts(standardSection: StandardSection, requirements: CategoryData[]): string[] {
    const prompts = [...standardSection.prompts];
    
    // Add requirement-specific prompts
    requirements.forEach(req => {
      if (req.value && req.value.length > 0) {
        prompts.push(`Consider: ${req.value.join(', ')}`);
      }
    });

    return prompts;
  }

  /**
   * Create enhanced validation rules combining standard rules with requirement-specific rules
   */
  private createEnhancedValidationRules(standardSection: StandardSection, requirements: CategoryData[]): any[] {
    const rules: any[] = [...standardSection.validationRules.requiredFields];
    
    // Add requirement-specific validation
    requirements.forEach(req => {
      if (req.required && req.value && req.value.length > 0) {
        rules.push({
          field: req.type,
          required: true,
          values: req.value
        });
      }
    });

    return rules;
  }

  /**
   * Convert categorized requirements to library data
   */
  public convertToLibraryData(categorizedRequirements: CategorizedRequirements, programData: any): LibraryRequirement {
    return {
      id: programData.id || 'unknown',
      eligibility_text: this.generateEligibilityText(categorizedRequirements),
      documents: this.extractDocuments(categorizedRequirements),
      funding_amount: this.extractFundingAmount(categorizedRequirements),
      deadlines: this.extractDeadlines(categorizedRequirements),
      application_procedures: this.extractProcedures(categorizedRequirements),
      compliance_requirements: this.extractCompliance(categorizedRequirements),
      contact_info: programData.contact_info || {}
    };
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private extractValues(data: CategoryData[]): string[] {
    return data.flatMap(d => {
      if (Array.isArray(d.value)) {
        return d.value;
      } else if (typeof d.value === 'object') {
        return [JSON.stringify(d.value)];
      } else {
        return [String(d.value)];
      }
    });
  }

  private calculateAverageConfidence(allData: CategoryData[]): number {
    if (allData.length === 0) return 0;
    const totalConfidence = allData.reduce((sum, data) => sum + data.confidence, 0);
    return totalConfidence / allData.length;
  }

  // Placeholder methods for library data generation
  private generateEligibilityText(_categorizedRequirements: CategorizedRequirements): string {
    return "Eligibility requirements based on categorized data";
  }

  private extractDocuments(_categorizedRequirements: CategorizedRequirements): string[] {
    return [];
  }

  private extractFundingAmount(_categorizedRequirements: CategorizedRequirements): string {
    return "Funding amount based on categorized data";
  }

  private extractDeadlines(_categorizedRequirements: CategorizedRequirements): string[] {
    return [];
  }

  private extractProcedures(_categorizedRequirements: CategorizedRequirements): string[] {
    return [];
  }

  private extractCompliance(_categorizedRequirements: CategorizedRequirements): string[] {
    return [];
  }


}

// ============================================================================
// EXPORT INSTANCE
// ============================================================================

export const categoryConverter = new CategoryConverter();

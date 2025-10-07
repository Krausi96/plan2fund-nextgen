// Requirements Mapper - Maps scraped text to structured requirement objects
import { DecisionTreeRequirement, EditorRequirement, LibraryRequirement } from '../types/requirements';

export class RequirementsMapper {
  /**
   * Map scraped data to structured requirements
   */
  static mapScrapedToStructured(scrapedData: any): {
    decisionTree: DecisionTreeRequirement[];
    editor: EditorRequirement[];
    library: LibraryRequirement[];
  } {
    return {
      decisionTree: this.mapDecisionTreeRequirements(scrapedData),
      editor: this.mapEditorRequirements(scrapedData),
      library: this.mapLibraryRequirements(scrapedData)
    };
  }

  /**
   * Map to Decision Tree Requirements
   */
  private static mapDecisionTreeRequirements(scrapedData: any): DecisionTreeRequirement[] {
    const requirements: DecisionTreeRequirement[] = [];
    
    // Extract eligibility questions from scraped data
    if (scrapedData.eligibilityQuestions) {
      scrapedData.eligibilityQuestions.forEach((question: any, index: number) => {
        requirements.push({
          id: `dt_${scrapedData.program_id}_${index}`,
          program_id: scrapedData.program_id,
          question_text: question.text,
          answer_options: question.options || [],
          validation_rules: this.extractValidationRules(question.text),
          required: true,
          category: 'eligibility'
        });
      });
    }

    return requirements;
  }

  /**
   * Map to Editor Requirements
   */
  private static mapEditorRequirements(scrapedData: any): EditorRequirement[] {
    const requirements: EditorRequirement[] = [];
    
    // Extract business plan sections from scraped data
    if (scrapedData.businessPlanSections) {
      scrapedData.businessPlanSections.forEach((section: any, index: number) => {
        requirements.push({
          id: `ed_${scrapedData.program_id}_${index}`,
          program_id: scrapedData.program_id,
          section_name: section.name,
          prompt: section.prompt || 'Please provide detailed information for this section.',
          hints: section.hints || [],
          word_count_min: section.wordCountMin,
          word_count_max: section.wordCountMax,
          required: section.required || true,
          ai_guidance: section.aiGuidance,
          template: section.template
        });
      });
    }

    return requirements;
  }

  /**
   * Map to Library Requirements
   */
  private static mapLibraryRequirements(scrapedData: any): LibraryRequirement[] {
    const requirements: LibraryRequirement[] = [];
    
    // Extract comprehensive program details
    if (scrapedData.programDetails) {
      requirements.push({
        id: `lib_${scrapedData.program_id}`,
        program_id: scrapedData.program_id,
        eligibility_text: scrapedData.programDetails.eligibility || '',
        documents: scrapedData.programDetails.documents || [],
        funding_amount: scrapedData.programDetails.fundingAmount || '',
        deadlines: scrapedData.programDetails.deadlines || [],
        application_procedures: scrapedData.programDetails.procedures || [],
        compliance_requirements: scrapedData.programDetails.compliance || [],
        contact_info: scrapedData.programDetails.contact || {}
      });
    }

    return requirements;
  }

  /**
   * Extract validation rules from text
   */
  private static extractValidationRules(text: string): any[] {
    const rules = [];
    
    if (/required|erforderlich|pflicht/i.test(text)) {
      rules.push({ type: 'required', message: 'This field is required' });
    }
    
    if (/minimum|mindest|min/i.test(text)) {
      const match = text.match(/(\d+)/);
      if (match) {
        rules.push({ type: 'min', value: parseInt(match[1]), message: `Minimum value: ${match[1]}` });
      }
    }
    
    if (/maximum|maximal|max/i.test(text)) {
      const match = text.match(/(\d+)/);
      if (match) {
        rules.push({ type: 'max', value: parseInt(match[1]), message: `Maximum value: ${match[1]}` });
      }
    }
    
    return rules;
  }
}

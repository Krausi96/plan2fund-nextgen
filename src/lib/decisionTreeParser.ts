// Decision Tree Parser - Interprets text with conditional logic
import { DecisionTreeRequirement } from '../types/requirements';

export class DecisionTreeParser {
  /**
   * Parse conditional logic from text
   */
  static parseConditionalLogic(text: string): DecisionTreeRequirement[] {
    const requirements: DecisionTreeRequirement[] = [];
    
    // Parse yes/no questions
    const yesNoQuestions = this.parseYesNoQuestions(text);
    requirements.push(...yesNoQuestions);
    
    // Parse multiple choice questions
    const multipleChoiceQuestions = this.parseMultipleChoiceQuestions(text);
    requirements.push(...multipleChoiceQuestions);
    
    // Parse numeric questions
    const numericQuestions = this.parseNumericQuestions(text);
    requirements.push(...numericQuestions);
    
    return requirements;
  }

  /**
   * Parse yes/no questions from text
   */
  private static parseYesNoQuestions(text: string): DecisionTreeRequirement[] {
    const requirements: DecisionTreeRequirement[] = [];
    const yesNoPatterns = [
      /is your company.*?\?/gi,
      /are you.*?\?/gi,
      /do you have.*?\?/gi,
      /ist ihr unternehmen.*?\?/gi,
      /haben sie.*?\?/gi
    ];

    yesNoPatterns.forEach((pattern, index) => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          requirements.push({
            id: `dt_yesno_${Date.now()}_${index}`,
            program_id: 'unknown',
            question_text: match.trim(),
            answer_options: ['Yes', 'No'],
            validation_rules: [{ type: 'required', message: 'Please select an option' }],
            required: true,
            category: 'eligibility'
          });
        });
      }
    });

    return requirements;
  }

  /**
   * Parse multiple choice questions from text
   */
  private static parseMultipleChoiceQuestions(text: string): DecisionTreeRequirement[] {
    const requirements: DecisionTreeRequirement[] = [];
    const multipleChoicePatterns = [
      /what is your company size\?/gi,
      /which sector.*?\?/gi,
      /where is your company located\?/gi,
      /wie groß ist ihr unternehmen\?/gi,
      /welche branche.*?\?/gi,
      /wo befindet sich ihr unternehmen\?/gi
    ];

    multipleChoicePatterns.forEach((pattern, index) => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const options = this.extractOptionsFromContext(text, match);
          requirements.push({
            id: `dt_multiple_${Date.now()}_${index}`,
            program_id: 'unknown',
            question_text: match.trim(),
            answer_options: options,
            validation_rules: [{ type: 'required', message: 'Please select an option' }],
            required: true,
            category: 'eligibility'
          });
        });
      }
    });

    return requirements;
  }

  /**
   * Parse numeric questions from text
   */
  private static parseNumericQuestions(text: string): DecisionTreeRequirement[] {
    const requirements: DecisionTreeRequirement[] = [];
    const numericPatterns = [
      /how many employees.*?\?/gi,
      /what is your annual revenue.*?\?/gi,
      /wie viele mitarbeiter.*?\?/gi,
      /wie hoch ist ihr jahresumsatz.*?\?/gi
    ];

    numericPatterns.forEach((pattern, index) => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const validationRules = this.extractNumericValidation(text, match);
          requirements.push({
            id: `dt_numeric_${Date.now()}_${index}`,
            program_id: 'unknown',
            question_text: match.trim(),
            answer_options: [],
            validation_rules: validationRules,
            required: true,
            category: 'eligibility'
          });
        });
      }
    });

    return requirements;
  }

  /**
   * Extract options from context around a question
   */
  private static extractOptionsFromContext(text: string, question: string): string[] {
    const options: string[] = [];
    
    // Look for bullet points or numbered lists after the question
    const questionIndex = text.indexOf(question);
    if (questionIndex !== -1) {
      const afterQuestion = text.substring(questionIndex + question.length, questionIndex + 500);
      
      // Extract from bullet points
      const bulletMatches = afterQuestion.match(/[-•]\s*([^\n]+)/g);
      if (bulletMatches) {
        bulletMatches.forEach(match => {
          const option = match.replace(/[-•]\s*/, '').trim();
          if (option) options.push(option);
        });
      }
      
      // Extract from numbered lists
      const numberedMatches = afterQuestion.match(/\d+\.\s*([^\n]+)/g);
      if (numberedMatches) {
        numberedMatches.forEach(match => {
          const option = match.replace(/\d+\.\s*/, '').trim();
          if (option) options.push(option);
        });
      }
    }
    
    return options;
  }

  /**
   * Extract numeric validation rules from context
   */
  private static extractNumericValidation(text: string, question: string): any[] {
    const rules = [];
    
    // Look for minimum/maximum values in the context
    const questionIndex = text.indexOf(question);
    if (questionIndex !== -1) {
      const context = text.substring(Math.max(0, questionIndex - 200), questionIndex + 200);
      
      // Extract minimum value
      const minMatch = context.match(/minimum.*?(\d+)/i);
      if (minMatch) {
        rules.push({ type: 'min', value: parseInt(minMatch[1]), message: `Minimum value: ${minMatch[1]}` });
      }
      
      // Extract maximum value
      const maxMatch = context.match(/maximum.*?(\d+)/i);
      if (maxMatch) {
        rules.push({ type: 'max', value: parseInt(maxMatch[1]), message: `Maximum value: ${maxMatch[1]}` });
      }
    }
    
    return rules;
  }

  /**
   * Generate skip logic for questions
   */
  static generateSkipLogic(requirements: DecisionTreeRequirement[]): void {
    requirements.forEach((req, index) => {
      if (index < requirements.length - 1) {
        req.next_question_id = requirements[index + 1].id;
      }
      
      // Add skip logic based on answer patterns
      if (req.answer_options.includes('No')) {
        req.skip_logic = [{
          condition: 'answer === "No"',
          skip_to_question_id: requirements[index + 1]?.id || 'end'
        }];
      }
    });
  }
}

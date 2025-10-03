// Enhanced Advanced Search with Doctor-Like Diagnostic Logic
import { doctorDiagnostic } from './doctorDiagnostic';
import { scoreProgramsEnhanced } from './enhancedRecoEngine';

export interface AdvancedSearchResult {
  chips: Array<{
    id: string;
    label: string;
    value: string;
    required: boolean;
    confidence: number;
  }>;
  clarifications: string[];
  diagnosis: {
    primary: string;
    confidence: number;
    reasoning: string;
  };
  recommendations: any[];
}

export class AdvancedSearchDoctor {
  async processFreeTextInput(input: string): Promise<AdvancedSearchResult> {
    try {
      // Parse free text using doctor diagnostic
      const symptoms = doctorDiagnostic.parseFreeTextInput(input);
      
      // Generate chips from symptoms
      const chips = symptoms.map(symptom => ({
        id: symptom.id,
        label: symptom.label,
        value: symptom.value.toString(),
        required: symptom.weight > 0.7,
        confidence: symptom.weight
      }));

      // Generate clarifications for missing important information
      const clarifications = this.generateClarifications(symptoms);

      // Make diagnosis
      const diagnosis = await doctorDiagnostic.makeDiagnosis(symptoms);

      // Get recommendations
      const answers = this.symptomsToAnswers(symptoms);
      const recommendations = await scoreProgramsEnhanced(answers, "strict");

      return {
        chips,
        clarifications,
        diagnosis: {
          primary: diagnosis.primary,
          confidence: diagnosis.confidence,
          reasoning: diagnosis.reasoning
        },
        recommendations
      };

    } catch (error) {
      console.error('Advanced search doctor failed:', error);
      return {
        chips: [],
        clarifications: ['Sorry, I had trouble understanding your request. Could you try rephrasing?'],
        diagnosis: {
          primary: 'Unable to analyze',
          confidence: 0,
          reasoning: 'Error processing input'
        },
        recommendations: []
      };
    }
  }

  private generateClarifications(symptoms: any[]): string[] {
    const clarifications: string[] = [];
    
    // Check for missing important information
    if (!symptoms.find(s => s.id === 'funding_amount')) {
      clarifications.push('How much funding do you need? (e.g., "I need 50k")');
    }
    
    if (!symptoms.find(s => s.id === 'location')) {
      clarifications.push('Where are you located? (e.g., "Vienna", "Austria")');
    }
    
    if (!symptoms.find(s => s.id === 'business_stage')) {
      clarifications.push('What stage is your business? (e.g., "startup", "idea", "SME")');
    }
    
    if (!symptoms.find(s => s.id === 'funding_type')) {
      clarifications.push('What type of funding do you prefer? (e.g., "grant", "loan", "equity")');
    }

    return clarifications;
  }

  private symptomsToAnswers(symptoms: any[]): Record<string, any> {
    const answers: Record<string, any> = {};
    
    symptoms.forEach(symptom => {
      switch (symptom.id) {
        case 'location':
          if (symptom.value === 'AT') {
            answers.q1_country = 'AT';
          } else if (symptom.value === 'EU') {
            answers.q1_country = 'EU';
          } else {
            answers.q1_country = 'NON_EU';
          }
          break;
        case 'business_stage':
          if (symptom.value === 'startup') {
            answers.q2_entity_stage = 'INC_LT_6M';
          } else if (symptom.value === 'idea') {
            answers.q2_entity_stage = 'PRE_COMPANY';
          } else if (symptom.value === 'sme') {
            answers.q2_entity_stage = 'INC_GT_36M';
          }
          break;
        case 'funding_type':
          answers.q8_funding_types = symptom.value.toUpperCase();
          break;
        case 'funding_amount':
          answers.fundingAmount = symptom.value;
          break;
        case 'innovation_level':
          answers.innovationLevel = symptom.value;
          break;
      }
    });

    return answers;
  }
}

// Export singleton instance
export const advancedSearchDoctor = new AdvancedSearchDoctor();

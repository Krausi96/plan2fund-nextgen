// Doctor-Like Diagnostic Engine - Converts user input to funding diagnosis
import { dataSource } from './dataSource';
import { Program } from '@/shared/types/requirements';

export interface Symptom {
  id: string;
  label: string;
  value: any;
  weight: number;
  category: 'basic' | 'financial' | 'business' | 'technical' | 'location';
}

export interface Diagnosis {
  primary: string;
  secondary: string[];
  confidence: number;
  programs: Program[];
  reasoning: string;
  nextQuestions?: string[];
}

export class DoctorDiagnostic {
  private diagnosis: Diagnosis | null = null;

  // Convert user answers to symptoms (like a doctor analyzing symptoms)
  analyzeSymptoms(userAnswers: Record<string, any>): Symptom[] {
    const symptoms: Symptom[] = [];

    // Basic symptoms
    if (userAnswers.q1_country) {
      symptoms.push({
        id: 'location',
        label: 'Location',
        value: userAnswers.q1_country,
        weight: 0.9,
        category: 'location'
      });
    }

    if (userAnswers.q2_entity_stage) {
      symptoms.push({
        id: 'business_stage',
        label: 'Business Stage',
        value: userAnswers.q2_entity_stage,
        weight: 0.8,
        category: 'business'
      });
    }

    if (userAnswers.q3_company_size) {
      symptoms.push({
        id: 'company_size',
        label: 'Company Size',
        value: userAnswers.q3_company_size,
        weight: 0.7,
        category: 'business'
      });
    }

    if (userAnswers.q4_theme) {
      symptoms.push({
        id: 'sector',
        label: 'Sector/Theme',
        value: userAnswers.q4_theme,
        weight: 0.6,
        category: 'technical'
      });
    }

    // Financial symptoms
    if (userAnswers.q8_funding_types) {
      symptoms.push({
        id: 'funding_type',
        label: 'Preferred Funding Type',
        value: userAnswers.q8_funding_types,
        weight: 0.8,
        category: 'financial'
      });
    }

    // Additional symptoms from advanced search
    if (userAnswers.fundingAmount) {
      symptoms.push({
        id: 'funding_amount',
        label: 'Funding Amount Needed',
        value: userAnswers.fundingAmount,
        weight: 0.9,
        category: 'financial'
      });
    }

    if (userAnswers.innovationLevel) {
      symptoms.push({
        id: 'innovation_level',
        label: 'Innovation Level',
        value: userAnswers.innovationLevel,
        weight: 0.7,
        category: 'technical'
      });
    }

    return symptoms;
  }

  // Make diagnosis based on symptoms using structured requirements
  async makeDiagnosis(symptoms: Symptom[]): Promise<Diagnosis> {
    // Get programs that match the symptoms
    const symptomData = this.symptomsToData(symptoms);
    const matchingPrograms = await dataSource.getProgramsBySymptoms(symptomData);

    // Enhance programs with structured requirements
    const enhancedPrograms = await this.enhanceProgramsWithStructuredRequirements(matchingPrograms);

    // Calculate confidence based on symptom matches and structured requirements
    const confidence = this.calculateConfidenceWithStructured(symptoms, enhancedPrograms);

    // Generate diagnosis reasoning using structured requirements
    const reasoning = this.generateReasoningWithStructured(symptoms, enhancedPrograms);

    // Determine primary and secondary diagnoses using structured requirements
    const primary = this.determinePrimaryDiagnosisWithStructured(symptoms, enhancedPrograms);
    const secondary = this.determineSecondaryDiagnosesWithStructured(symptoms, enhancedPrograms);

    // Suggest next questions if confidence is low, using structured requirements
    const nextQuestions = confidence < 0.7 ? this.suggestNextQuestionsWithStructured(symptoms, enhancedPrograms) : undefined;

    this.diagnosis = {
      primary,
      secondary,
      confidence,
      programs: enhancedPrograms,
      reasoning,
      nextQuestions
    };

    return this.diagnosis;
  }

  private symptomsToData(symptoms: Symptom[]): Record<string, any> {
    const data: Record<string, any> = {};
    
    symptoms.forEach(symptom => {
      data[symptom.id] = symptom.value;
    });

    return data;
  }

  private calculateConfidence(symptoms: Symptom[], programs: Program[]): number {
    if (programs.length === 0) return 0;

    // Base confidence on number of matching programs and symptom weights
    const totalWeight = symptoms.reduce((sum, s) => sum + s.weight, 0);
    const matchedWeight = symptoms.reduce((sum, symptom) => {
      // Check if this symptom is relevant to any program
      const isRelevant = programs.some(program => 
        this.symptomMatchesProgram(symptom, program)
      );
      return isRelevant ? sum + symptom.weight : sum;
    }, 0);

    return Math.min(matchedWeight / totalWeight, 1);
  }

  private symptomMatchesProgram(symptom: Symptom, program: Program): boolean {
    switch (symptom.id) {
      case 'location':
        return program.notes?.toLowerCase().includes(symptom.value.toLowerCase()) || false;
      
      case 'business_stage':
        return program.type?.toLowerCase().includes(symptom.value.toLowerCase()) || false;
      
      case 'funding_type':
        return program.type === symptom.value;
      
      case 'funding_amount':
        if (!program.maxAmount) return false;
        const amount = parseInt(symptom.value);
        return amount <= program.maxAmount;
      
      default:
        return true; // Default to true for other symptoms
    }
  }

  private generateReasoning(symptoms: Symptom[], _programs: Program[]): string {
    const reasoning: string[] = [];

    // Location reasoning
    const locationSymptom = symptoms.find(s => s.id === 'location');
    if (locationSymptom) {
      reasoning.push(`Based on your location (${locationSymptom.value}), we found programs available in your area.`);
    }

    // Business stage reasoning
    const stageSymptom = symptoms.find(s => s.id === 'business_stage');
    if (stageSymptom) {
      reasoning.push(`Your business stage (${stageSymptom.value}) matches several funding programs.`);
    }

    // Funding type reasoning
    const fundingSymptom = symptoms.find(s => s.id === 'funding_type');
    if (fundingSymptom) {
      reasoning.push(`We focused on ${fundingSymptom.value} programs as you requested.`);
    }

    // Innovation level reasoning
    const innovationSymptom = symptoms.find(s => s.id === 'innovation_level');
    if (innovationSymptom) {
      reasoning.push(`Your innovation level (${innovationSymptom.value}) is well-suited for these programs.`);
    }

    return reasoning.join(' ');
  }

  private determinePrimaryDiagnosis(symptoms: Symptom[], programs: Program[]): string {
    if (programs.length === 0) {
      return "No suitable funding programs found for your current situation";
    }

    const fundingSymptom = symptoms.find(s => s.id === 'funding_type');
    const stageSymptom = symptoms.find(s => s.id === 'business_stage');
    
    if (fundingSymptom && stageSymptom) {
      return `${fundingSymptom.value} funding for ${stageSymptom.value} businesses`;
    } else if (fundingSymptom) {
      return `${fundingSymptom.value} funding programs`;
    } else if (stageSymptom) {
      return `Funding programs for ${stageSymptom.value} businesses`;
    } else {
      return "General funding programs";
    }
  }

  private determineSecondaryDiagnoses(symptoms: Symptom[], _programs: Program[]): string[] {
    const secondary: string[] = [];
    
    // Add alternative funding types
    const fundingSymptom = symptoms.find(s => s.id === 'funding_type');
    if (fundingSymptom) {
      const alternatives = ['grant', 'loan', 'equity'].filter(t => t !== fundingSymptom.value);
      secondary.push(...alternatives.map(t => `Alternative: ${t} funding`));
    }

    // Add sector-specific options
    const sectorSymptom = symptoms.find(s => s.id === 'sector');
    if (sectorSymptom) {
      secondary.push(`Sector-specific: ${sectorSymptom.value} programs`);
    }

    return secondary;
  }

  private suggestNextQuestions(symptoms: Symptom[]): string[] {
    const questions: string[] = [];
    
    if (!symptoms.find(s => s.id === 'funding_amount')) {
      questions.push("How much funding do you need?");
    }
    
    if (!symptoms.find(s => s.id === 'innovation_level')) {
      questions.push("What's your innovation level?");
    }
    
    if (!symptoms.find(s => s.id === 'company_size')) {
      questions.push("How many employees do you have?");
    }

    return questions;
  }

  // Parse free text input (for advanced search)
  parseFreeTextInput(input: string): Symptom[] {
    const symptoms: Symptom[] = [];
    const lowerInput = input.toLowerCase();

    // Extract location
    if (lowerInput.includes('vienna') || lowerInput.includes('austria')) {
      symptoms.push({
        id: 'location',
        label: 'Location',
        value: 'AT',
        weight: 0.9,
        category: 'location'
      });
    }

    // Extract funding amount
    const amountMatch = lowerInput.match(/(\d+)[k€]/);
    if (amountMatch) {
      const amount = parseInt(amountMatch[1]) * 1000;
      symptoms.push({
        id: 'funding_amount',
        label: 'Funding Amount',
        value: amount,
        weight: 0.9,
        category: 'financial'
      });
    }

    // Extract business stage
    if (lowerInput.includes('idea') || lowerInput.includes('startup')) {
      symptoms.push({
        id: 'business_stage',
        label: 'Business Stage',
        value: 'startup',
        weight: 0.8,
        category: 'business'
      });
    }

    // Extract innovation level
    if (lowerInput.includes('ai') || lowerInput.includes('tech') || lowerInput.includes('innovation')) {
      symptoms.push({
        id: 'innovation_level',
        label: 'Innovation Level',
        value: 'high',
        weight: 0.7,
        category: 'technical'
      });
    }

    return symptoms;
  }

  /**
   * Enhance programs with structured requirements
   */
  private async enhanceProgramsWithStructuredRequirements(programs: Program[]): Promise<Program[]> {
    try {
      const enhancedPrograms = await Promise.all(
        programs.map(async (program) => {
          try {
            const response = await fetch(`/api/programmes/${program.id}/requirements`);
            if (response.ok) {
              const requirements = await response.json();
              return {
                ...program,
                structured_requirements: {
                  decision_tree: requirements.decision_tree || [],
                  editor: requirements.editor || [],
                  library: requirements.library || []
                }
              };
            }
          } catch (error) {
            console.warn(`Failed to load structured requirements for ${program.id}:`, error);
          }
          return program;
        })
      );
      return enhancedPrograms;
    } catch (error) {
      console.error('Error enhancing programs with structured requirements:', error);
      return programs;
    }
  }

  /**
   * Calculate confidence with structured requirements
   */
  private calculateConfidenceWithStructured(symptoms: Symptom[], programs: Program[]): number {
    const baseConfidence = this.calculateConfidence(symptoms, programs);
    
    // Boost confidence if programs have structured requirements
    const programsWithStructured = programs.filter(p => 
      (p as any).structured_requirements && 
      ((p as any).structured_requirements.decision_tree?.length > 0 || 
       (p as any).structured_requirements.editor?.length > 0 || 
       (p as any).structured_requirements.library?.length > 0)
    );
    
    const structuredBoost = programsWithStructured.length / programs.length * 0.2;
    return Math.min(1, baseConfidence + structuredBoost);
  }

  /**
   * Generate reasoning with structured requirements
   */
  private generateReasoningWithStructured(symptoms: Symptom[], programs: Program[]): string {
    const baseReasoning = this.generateReasoning(symptoms, programs);
    
    const programsWithStructured = programs.filter(p => 
      (p as any).structured_requirements && 
      ((p as any).structured_requirements.decision_tree?.length > 0 || 
       (p as any).structured_requirements.editor?.length > 0 || 
       (p as any).structured_requirements.library?.length > 0)
    );
    
    if (programsWithStructured.length > 0) {
      return `${baseReasoning} Enhanced with structured requirements for ${programsWithStructured.length} programs.`;
    }
    
    return baseReasoning;
  }

  /**
   * Determine primary diagnosis with structured requirements
   */
  private determinePrimaryDiagnosisWithStructured(symptoms: Symptom[], programs: Program[]): string {
    const baseDiagnosis = this.determinePrimaryDiagnosis(symptoms, programs);
    
    const programsWithStructured = programs.filter(p => 
      (p as any).structured_requirements && 
      ((p as any).structured_requirements.decision_tree?.length > 0 || 
       (p as any).structured_requirements.editor?.length > 0 || 
       (p as any).structured_requirements.library?.length > 0)
    );
    
    if (programsWithStructured.length > 0) {
      return `${baseDiagnosis} (Enhanced with structured requirements)`;
    }
    
    return baseDiagnosis;
  }

  /**
   * Determine secondary diagnoses with structured requirements
   */
  private determineSecondaryDiagnosesWithStructured(symptoms: Symptom[], programs: Program[]): string[] {
    const baseDiagnoses = this.determineSecondaryDiagnoses(symptoms, programs);
    
    const programsWithStructured = programs.filter(p => 
      (p as any).structured_requirements && 
      ((p as any).structured_requirements.decision_tree?.length > 0 || 
       (p as any).structured_requirements.editor?.length > 0 || 
       (p as any).structured_requirements.library?.length > 0)
    );
    
    if (programsWithStructured.length > 0) {
      return [...baseDiagnoses, 'Structured requirements available for detailed analysis'];
    }
    
    return baseDiagnoses;
  }

  /**
   * Suggest next questions with structured requirements
   */
  private suggestNextQuestionsWithStructured(symptoms: Symptom[], programs: Program[]): string[] {
    const baseQuestions = this.suggestNextQuestions(symptoms);
    
    const programsWithStructured = programs.filter(p => 
      (p as any).structured_requirements && 
      ((p as any).structured_requirements.decision_tree?.length > 0 || 
       (p as any).structured_requirements.editor?.length > 0 || 
       (p as any).structured_requirements.library?.length > 0)
    );
    
    if (programsWithStructured.length > 0) {
      return [...baseQuestions, 'Would you like to see detailed program requirements?'];
    }
    
    return baseQuestions;
  }
}

// Export singleton instance
export const doctorDiagnostic = new DoctorDiagnostic();

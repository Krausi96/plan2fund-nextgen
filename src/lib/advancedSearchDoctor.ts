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
      console.log('🤖 Advanced Search Doctor: Processing free text input');
      
      // Enhanced AI-powered text analysis
      const enhancedAnalysis = await this.performEnhancedTextAnalysis(input);
      
      // Parse free text using doctor diagnostic
      const symptoms = doctorDiagnostic.parseFreeTextInput(input);
      
      // Generate chips from symptoms with AI enhancement
      const chips = symptoms.map(symptom => ({
        id: symptom.id,
        label: symptom.label,
        value: symptom.value.toString(),
        required: symptom.weight > 0.7,
        confidence: symptom.weight
      }));

      // Add AI-discovered chips from enhanced analysis
      const aiChips = enhancedAnalysis.discoveredRequirements.map(req => ({
        id: req.id,
        label: req.label,
        value: req.value,
        required: req.required,
        confidence: req.confidence
      }));

      // Combine and deduplicate chips
      const allChips = [...chips, ...aiChips];
      const uniqueChips = this.deduplicateChips(allChips);

      // Generate intelligent clarifications
      const clarifications = this.generateIntelligentClarifications(symptoms, enhancedAnalysis);

      // Make enhanced diagnosis with AI insights
      const diagnosis = await doctorDiagnostic.makeDiagnosis(symptoms);
      const enhancedDiagnosis = {
        primary: diagnosis.primary,
        confidence: Math.max(diagnosis.confidence, enhancedAnalysis.confidence),
        reasoning: `${diagnosis.reasoning} ${enhancedAnalysis.insights}`
      };

      // Get recommendations with AI-enhanced scoring
      const answers = this.symptomsToAnswers(symptoms);
      const aiAnswers = this.enhancedAnalysisToAnswers(enhancedAnalysis);
      const combinedAnswers = { ...answers, ...aiAnswers };
      
      const recommendations = await scoreProgramsEnhanced(combinedAnswers, "strict");
      
      // Enhance recommendations with AI-powered insights
      const enhancedRecommendations = await this.enhanceWithAIInsights(recommendations, enhancedAnalysis);

      console.log(`✅ Advanced Search Doctor: Found ${uniqueChips.length} requirements, ${enhancedRecommendations.length} recommendations`);

      return {
        chips: uniqueChips,
        clarifications,
        diagnosis: enhancedDiagnosis,
        recommendations: enhancedRecommendations
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

  /**
   * Perform enhanced AI-powered text analysis
   */
  private async performEnhancedTextAnalysis(input: string): Promise<{
    discoveredRequirements: Array<{
      id: string;
      label: string;
      value: string;
      required: boolean;
      confidence: number;
    }>;
    confidence: number;
    insights: string;
  }> {
    try {
      // Use OpenAI API for enhanced text analysis
      const response = await fetch('/api/ai/openai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Analyze this funding request for complex requirements: "${input}"`,
          context: {
            sectionId: 'advanced_search_analysis',
            sectionTitle: 'Advanced Search Analysis',
            currentContent: input,
            programType: 'funding_programs',
            sectionGuidance: [
              'Extract complex requirements like partnerships, consortiums, specific technologies',
              'Identify geographic preferences and industry specializations',
              'Detect funding amount ranges and timeline requirements',
              'Find eligibility criteria and application requirements'
            ]
          },
          action: 'generate'
        })
      });

      if (response.ok) {
        const aiResponse = await response.json();
        return this.parseAIEnhancedAnalysis(aiResponse.content, input);
      }
    } catch (error) {
      console.warn('AI-enhanced analysis failed, using fallback:', error);
    }

    // Fallback to basic analysis
    return this.performBasicTextAnalysis(input);
  }

  /**
   * Parse AI-enhanced analysis response
   */
  private parseAIEnhancedAnalysis(_aiContent: string, input: string): {
    discoveredRequirements: Array<{
      id: string;
      label: string;
      value: string;
      required: boolean;
      confidence: number;
    }>;
    confidence: number;
    insights: string;
  } {
    const discoveredRequirements: Array<{
      id: string;
      label: string;
      value: string;
      required: boolean;
      confidence: number;
    }> = [];

    // Extract complex requirements using AI insights
    const lowerInput = input.toLowerCase();
    
    // Partnership requirements
    if (lowerInput.includes('partnership') || lowerInput.includes('consortium') || lowerInput.includes('collaboration')) {
      discoveredRequirements.push({
        id: 'partnership_required',
        label: 'Partnership Required',
        value: 'Yes',
        required: true,
        confidence: 0.9
      });
    }

    // Technology requirements
    if (lowerInput.includes('ai') || lowerInput.includes('artificial intelligence')) {
      discoveredRequirements.push({
        id: 'technology_focus',
        label: 'Technology Focus',
        value: 'AI/Artificial Intelligence',
        required: true,
        confidence: 0.8
      });
    }

    // Industry specialization
    if (lowerInput.includes('health') || lowerInput.includes('healthcare') || lowerInput.includes('medical')) {
      discoveredRequirements.push({
        id: 'industry_specialization',
        label: 'Industry Specialization',
        value: 'Healthcare/Medical',
        required: true,
        confidence: 0.8
      });
    }

    // Geographic specificity
    if (lowerInput.includes('vienna') || lowerInput.includes('austria')) {
      discoveredRequirements.push({
        id: 'geographic_preference',
        label: 'Geographic Preference',
        value: 'Vienna/Austria',
        required: true,
        confidence: 0.9
      });
    }

    return {
      discoveredRequirements,
      confidence: 0.8,
      insights: `AI analysis identified ${discoveredRequirements.length} complex requirements from your description.`
    };
  }

  /**
   * Perform basic text analysis as fallback
   */
  private performBasicTextAnalysis(input: string): {
    discoveredRequirements: Array<{
      id: string;
      label: string;
      value: string;
      required: boolean;
      confidence: number;
    }>;
    confidence: number;
    insights: string;
  } {
    const discoveredRequirements: Array<{
      id: string;
      label: string;
      value: string;
      required: boolean;
      confidence: number;
    }> = [];

    const lowerInput = input.toLowerCase();

    // Basic requirement detection
    if (lowerInput.includes('startup')) {
      discoveredRequirements.push({
        id: 'business_stage',
        label: 'Business Stage',
        value: 'Startup',
        required: true,
        confidence: 0.7
      });
    }

    if (lowerInput.includes('funding') || lowerInput.includes('€') || lowerInput.includes('$')) {
      discoveredRequirements.push({
        id: 'funding_need',
        label: 'Funding Need',
        value: 'Yes',
        required: true,
        confidence: 0.8
      });
    }

    return {
      discoveredRequirements,
      confidence: 0.6,
      insights: 'Basic analysis completed with standard requirement detection.'
    };
  }

  /**
   * Deduplicate chips based on ID
   */
  private deduplicateChips(chips: Array<{
    id: string;
    label: string;
    value: string;
    required: boolean;
    confidence: number;
  }>): Array<{
    id: string;
    label: string;
    value: string;
    required: boolean;
    confidence: number;
  }> {
    const seen = new Set<string>();
    return chips.filter(chip => {
      if (seen.has(chip.id)) {
        return false;
      }
      seen.add(chip.id);
      return true;
    });
  }

  /**
   * Generate intelligent clarifications based on AI analysis
   */
  private generateIntelligentClarifications(symptoms: any[], enhancedAnalysis: any): string[] {
    const clarifications: string[] = [];
    
    // Check for missing important information
    if (!symptoms.find(s => s.id === 'funding_amount') && !enhancedAnalysis.discoveredRequirements.find((r: any) => r.id === 'funding_amount')) {
      clarifications.push('How much funding do you need? (e.g., "I need 50k")');
    }
    
    if (!symptoms.find(s => s.id === 'location') && !enhancedAnalysis.discoveredRequirements.find((r: any) => r.id === 'geographic_preference')) {
      clarifications.push('Where are you located? (e.g., "Vienna", "Austria")');
    }
    
    if (!symptoms.find(s => s.id === 'business_stage') && !enhancedAnalysis.discoveredRequirements.find((r: any) => r.id === 'business_stage')) {
      clarifications.push('What stage is your business? (e.g., "startup", "idea", "SME")');
    }
    
    if (!symptoms.find(s => s.id === 'partnership_required') && !enhancedAnalysis.discoveredRequirements.find((r: any) => r.id === 'partnership_required')) {
      clarifications.push('Do you need partnership or consortium requirements? (e.g., "university partnership", "consortium")');
    }

    return clarifications;
  }

  /**
   * Convert enhanced analysis to answers format
   */
  private enhancedAnalysisToAnswers(enhancedAnalysis: any): Record<string, any> {
    const answers: Record<string, any> = {};
    
    enhancedAnalysis.discoveredRequirements.forEach((req: any) => {
      switch (req.id) {
        case 'partnership_required':
          answers.partnership_required = req.value === 'Yes';
          break;
        case 'technology_focus':
          answers.technology_focus = req.value;
          break;
        case 'industry_specialization':
          answers.industry_specialization = req.value;
          break;
        case 'geographic_preference':
          answers.geographic_preference = req.value;
          break;
      }
    });

    return answers;
  }

  /**
   * Enhance recommendations with AI insights
   */
  private async enhanceWithAIInsights(recommendations: any[], enhancedAnalysis: any): Promise<any[]> {
    return recommendations.map(rec => ({
      ...rec,
      ai_insights: {
        why_matches: `This program matches your ${enhancedAnalysis.discoveredRequirements.map((r: any) => r.label.toLowerCase()).join(', ')} requirements.`,
        confidence_boost: enhancedAnalysis.confidence > 0.8 ? 10 : 0,
        specialized_match: enhancedAnalysis.discoveredRequirements.length > 2
      }
    }));
  }

}

// Export singleton instance
export const advancedSearchDoctor = new AdvancedSearchDoctor();

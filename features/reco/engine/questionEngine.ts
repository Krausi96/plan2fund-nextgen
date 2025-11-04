// Symptom-Based Question Engine - Phase 2 Step 2.1 + Validation Integration
// Generates smart, conditional questions based on funding requirements
// Questions get more specific over time (broad → specific)
// No jargon - symptom-based language
// INTEGRATED: Advanced validation from validationRules.ts

import { Program } from '@/shared/types/requirements';

export interface SymptomQuestion {
  id: string;
  symptom: string; // User-friendly question text
  type: 'single-select' | 'multi-select' | 'text' | 'number' | 'boolean';
  options: Array<{
    value: string;
    label: string;
    description?: string; // Additional context for the option
    fundingTypes?: string[]; // Which funding types this answer suggests
    nextQuestions?: string[]; // Which questions to ask next
  }>;
  required: boolean;
  category: 'funding_need' | 'business_stage' | 'innovation_level' | 'team_size' | 'location' | 'specific_requirements';
  phase: 1 | 2 | 3; // 1: Broad, 2: Specific, 3: Refinement
  conditionalLogic?: QuestionCondition[];
  skipConditions?: QuestionCondition[]; // NEW: Conditions to skip this question
  followUpQuestions?: string[]; // NEW: Questions to ask after this one
  isCoreQuestion?: boolean;
  questionNumber?: number;
  aiGuidance?: string; // AI guidance for the question
  metadata?: {
    programsAffected?: number;
    informationValue?: number;
    decisiveness?: 'HARD' | 'SOFT' | 'UNCERTAIN';
    uxWeight?: number;
    priority?: number;
  };
}

export interface QuestionCondition {
  questionId: string;
  operator: 'equals' | 'contains' | 'not_equals' | 'in' | 'not_in' | 'greater_than' | 'less_than';
  value: any;
  action: 'show' | 'hide' | 'require' | 'optional';
  logic?: 'AND' | 'OR'; // NEW: Support for AND/OR logic
}

export interface EligibilityAnalysis {
  location: Map<string, number>;
  companyAge: Map<number, number>;
  revenue: Map<string, number>;
  teamSize: Map<number, number>;
  researchFocus: Map<string, number>;
  internationalCollaboration: Map<string, number>;
  impact: Map<string, number>;
  documents: Map<string, number>;
  other: Map<string, number>;
}

export interface BranchingRule {
  id: string;
  condition: {
    field: string;
    operator: 'equals' | 'contains' | 'not_equals' | 'in' | 'not_in' | 'greater_than' | 'less_than';
    value: any;
  };
  action: 'show' | 'hide' | 'require' | 'optional';
  targetQuestion: string;
}


// QUESTION ENGINE CLASS
// ============================================================================

export class QuestionEngine {
  private allPrograms: Program[]; // Keep original programs
  private remainingPrograms: Program[]; // Currently matching programs (DYNAMIC)
  private questions: SymptomQuestion[] = [];
  private askedQuestions: string[] = []; // Track which questions we've asked

  constructor(programs: Program[]) {
    this.allPrograms = programs;
    this.remainingPrograms = programs; // Start with all programs
    console.log(`🔄 Initializing QuestionEngine with ${programs.length} programs`);
    
    // DEBUG: Check if programs have eligibility_criteria AND categorized_requirements
    if (programs.length > 0) {
      const sample = programs[0] as any;
      console.log('🔍 DEBUG: First program sample:', {
        id: sample.id,
        name: sample.name,
        hasEligibilityCriteria: !!sample.eligibility_criteria,
        hasCategorizedRequirements: !!sample.categorized_requirements,
        eligibilityKeys: Object.keys(sample.eligibility_criteria || {}),
        categorizedKeys: Object.keys(sample.categorized_requirements || {})
      });
      console.log('🔍 DEBUG: Full eligibility_criteria:', sample.eligibility_criteria);
      console.log('🔍 DEBUG: Full categorized_requirements:', sample.categorized_requirements);
      console.log('🔍 DEBUG: Total programs:', programs.length);
    }
    
    try {
      this.initializeQuestions();
    } catch (error) {
      console.error('❌ Error initializing QuestionEngine:', error);
      console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    }
  }

  /**
   * Analyze eligibility criteria from ALL programs to generate dynamic questions
   */
  private initializeQuestions(): void {
    console.log('🔄 Analyzing eligibility criteria from ALL programs...');
    console.log(`📊 Programs available: ${this.allPrograms.length}`);
    
    // STEP 1: Extract ALL eligibility criteria from programs
    const eligibilityAnalysis = this.analyzeEligibilityCriteria();
    
    // STEP 2: Generate questions based on frequency and importance
    this.generateQuestionsFromEligibilityAnalysis(eligibilityAnalysis);
    
    console.log(`✅ Generated ${this.questions.length} dynamic questions from eligibility criteria`);
  }

  /**
   * Analyze all eligibility criteria from programs
   */
  private analyzeEligibilityCriteria(): EligibilityAnalysis {
    const analysis: EligibilityAnalysis = {
      location: new Map(),
      companyAge: new Map(),
      revenue: new Map(),
      teamSize: new Map(),
      researchFocus: new Map(),
      internationalCollaboration: new Map(),
      impact: new Map(),
      documents: new Map(),
      other: new Map()
    };
    
    // NEW: Also analyze categorized_requirements for deeper requirements
    let programsWithCategorizedRequirements = 0;
    for (const program of this.allPrograms) {
      const categorized = (program as any).categorized_requirements;
      if (categorized && Object.keys(categorized).length > 0) {
        programsWithCategorizedRequirements++;
        
        // Analyze co_financing
        if (categorized?.financial) {
          const coFinancing = categorized.financial.find((req: any) => req.type === 'co_financing');
          if (coFinancing) {
            analysis.other.set(`cofinancing_${coFinancing.value}`, (analysis.other.get(`cofinancing_${coFinancing.value}`) || 0) + 1);
          }
        }
        
        // Analyze trl_level
        if (categorized?.technical) {
          const trlLevel = categorized.technical.find((req: any) => req.type === 'trl_level');
          if (trlLevel) {
            analysis.other.set(`trl_${trlLevel.value}`, (analysis.other.get(`trl_${trlLevel.value}`) || 0) + 1);
          }
        }
        
        // Analyze impact
        if (categorized?.impact && categorized.impact.length > 0) {
          categorized.impact.forEach((req: any) => {
            analysis.other.set(`impact_${req.value}`, (analysis.other.get(`impact_${req.value}`) || 0) + 1);
          });
        }
        
        // Analyze consortium
        if (categorized?.consortium && categorized.consortium.length > 0) {
          const consortiumReq = categorized.consortium[0];
          analysis.other.set(`consortium_${consortiumReq.value}`, (analysis.other.get(`consortium_${consortiumReq.value}`) || 0) + 1);
        }
        
        // FIX: Analyze ALL 18 categories
        if (categorized?.documents && categorized.documents.length > 0) {
          categorized.documents.forEach((req: any) => {
            analysis.other.set(`documents_${req.type}`, (analysis.other.get(`documents_${req.type}`) || 0) + 1);
          });
        }
        
        if (categorized?.legal && categorized.legal.length > 0) {
          categorized.legal.forEach((req: any) => {
            analysis.other.set(`legal_${req.type}`, (analysis.other.get(`legal_${req.type}`) || 0) + 1);
          });
        }
        
        if (categorized?.timeline && categorized.timeline.length > 0) {
          categorized.timeline.forEach((req: any) => {
            analysis.other.set(`timeline_${req.type}`, (analysis.other.get(`timeline_${req.type}`) || 0) + 1);
          });
        }
        
        if (categorized?.capex_opex && categorized.capex_opex.length > 0) {
          categorized.capex_opex.forEach((req: any) => {
            analysis.other.set(`capex_opex_${req.type}`, (analysis.other.get(`capex_opex_${req.type}`) || 0) + 1);
          });
        }
        
        if (categorized?.use_of_funds && categorized.use_of_funds.length > 0) {
          categorized.use_of_funds.forEach((req: any) => {
            analysis.other.set(`use_of_funds_${req.type}`, (analysis.other.get(`use_of_funds_${req.type}`) || 0) + 1);
          });
        }
        
        if (categorized?.revenue_model && categorized.revenue_model.length > 0) {
          categorized.revenue_model.forEach((req: any) => {
            analysis.other.set(`revenue_model_${req.type}`, (analysis.other.get(`revenue_model_${req.type}`) || 0) + 1);
          });
        }
        
        if (categorized?.market_size && categorized.market_size.length > 0) {
          categorized.market_size.forEach((req: any) => {
            analysis.other.set(`market_size_${req.type}`, (analysis.other.get(`market_size_${req.type}`) || 0) + 1);
          });
        }
      }
    }
    console.log(`✅ Found ${programsWithCategorizedRequirements} programs with categorized_requirements`);

    console.log('🔍 Analyzing eligibility criteria from programs...');
    let programsWithCriteria = 0;
    
    for (const program of this.allPrograms) {
      const eligibility = (program as any).eligibility_criteria;
      const categorized = (program as any).categorized_requirements;
      
      if (!eligibility && !categorized) continue;
      programsWithCriteria++;

      // Location analysis
      if (eligibility?.location) {
        const location = eligibility.location.toLowerCase();
        analysis.location.set(location, (analysis.location.get(location) || 0) + 1);
      }

      // Company age analysis
      if (eligibility?.max_company_age) {
        const age = eligibility.max_company_age;
        analysis.companyAge.set(age, (analysis.companyAge.get(age) || 0) + 1);
      }
      
      // Industry focus analysis (from eligibility OR categorized)
      if (eligibility?.industry_focus) {
        const industry = eligibility.industry_focus;
        analysis.other.set(`industry_${industry}`, (analysis.other.get(`industry_${industry}`) || 0) + 1);
      } else if (categorized?.project) {
        const industryReq = categorized.project.find((req: any) => req.type === 'industry_focus');
        if (industryReq) {
          analysis.other.set(`industry_${industryReq.value}`, (analysis.other.get(`industry_${industryReq.value}`) || 0) + 1);
        }
      }

      // Revenue analysis (from eligibility OR categorized)
      if (eligibility?.revenue_min || eligibility?.revenue_max) {
        const revenueRange = `${eligibility.revenue_min || 0}-${eligibility.revenue_max || 'unlimited'}`;
        analysis.revenue.set(revenueRange, (analysis.revenue.get(revenueRange) || 0) + 1);
      } else if (categorized?.financial) {
        const revenueReq = categorized.financial.find((req: any) => req.type === 'revenue_range');
        if (revenueReq && revenueReq.value) {
          const revenueRange = `${revenueReq.value.min || 0}-${revenueReq.value.max || 'unlimited'}`;
          analysis.revenue.set(revenueRange, (analysis.revenue.get(revenueRange) || 0) + 1);
        }
      }

      // Team size analysis (from eligibility OR categorized)
      if (eligibility?.min_team_size) {
        const teamSize = eligibility.min_team_size;
        analysis.teamSize.set(teamSize, (analysis.teamSize.get(teamSize) || 0) + 1);
      } else if (categorized?.team) {
        const teamReq = categorized.team.find((req: any) => req.type === 'min_team_size');
        if (teamReq) {
          analysis.teamSize.set(teamReq.value, (analysis.teamSize.get(teamReq.value) || 0) + 1);
        }
      }

      // Research focus analysis (from eligibility OR categorized)
      if (eligibility?.research_focus) {
        analysis.researchFocus.set('required', (analysis.researchFocus.get('required') || 0) + 1);
      } else if (categorized?.project) {
        const researchReq = categorized.project.find((req: any) => req.type === 'research_focus');
        if (researchReq && researchReq.value) {
          analysis.researchFocus.set('required', (analysis.researchFocus.get('required') || 0) + 1);
        }
      }

      // International collaboration analysis (from eligibility OR categorized)
      if (eligibility?.international_collaboration) {
        analysis.internationalCollaboration.set('required', (analysis.internationalCollaboration.get('required') || 0) + 1);
      } else if (categorized?.consortium) {
        const collabReq = categorized.consortium.find((req: any) => req.type === 'international_collaboration');
        if (collabReq && collabReq.value) {
          analysis.internationalCollaboration.set('required', (analysis.internationalCollaboration.get('required') || 0) + 1);
        }
      }
      
      // Extract project type from categorized (NEW!)
      if (categorized?.project) {
        const projectTypeReq = categorized.project.find((req: any) => req.type === 'project_type');
        if (projectTypeReq) {
          analysis.other.set(`project_${projectTypeReq.value}`, (analysis.other.get(`project_${projectTypeReq.value}`) || 0) + 1);
        }
      }
      
      // Extract innovation level from categorized (NEW!)
      if (categorized?.innovation) {
        const innovationReq = categorized.innovation.find((req: any) => req.type === 'innovation_level');
        if (innovationReq) {
          analysis.other.set(`innovation_${innovationReq.value}`, (analysis.other.get(`innovation_${innovationReq.value}`) || 0) + 1);
        }
      }
      
      // Extract TRL level from categorized (NEW!)
      if (categorized?.technical) {
        const trlReq = categorized.technical.find((req: any) => req.type === 'trl_level');
        if (trlReq) {
          analysis.other.set(`trl_${trlReq.value}`, (analysis.other.get(`trl_${trlReq.value}`) || 0) + 1);
        }
      }
      
      // Extract market stage from categorized (NEW!)
      if (categorized?.market) {
        const marketReq = categorized.market.find((req: any) => req.type === 'market_stage');
        if (marketReq) {
          analysis.other.set(`market_${marketReq.value}`, (analysis.other.get(`market_${marketReq.value}`) || 0) + 1);
        }
      }
      
      // Extract co-financing from categorized (NEW!)
      if (categorized?.financial) {
        const coFinancingReq = categorized.financial.find((req: any) => req.type === 'co_financing');
        if (coFinancingReq) {
          analysis.other.set(`cofinancing_${coFinancingReq.value}`, (analysis.other.get(`cofinancing_${coFinancingReq.value}`) || 0) + 1);
        }
      }
    }

    console.log(`✅ Found ${programsWithCriteria} programs with eligibility criteria`);
    console.log('📊 Analysis results:');
    console.log(`  - Location: ${analysis.location.size} unique values`);
    console.log(`  - Company Age: ${analysis.companyAge.size} unique values`);
    console.log(`  - Revenue: ${analysis.revenue.size} unique values`);
    console.log(`  - Team Size: ${analysis.teamSize.size} unique values`);
    console.log(`  - Research Focus: ${analysis.researchFocus.size} unique values`);
    console.log(`  - International Collaboration: ${analysis.internationalCollaboration.size} unique values`);

    return analysis;
  }

  /**
   * Generate questions from eligibility analysis
   */
  private generateQuestionsFromEligibilityAnalysis(analysis: EligibilityAnalysis): void {
    this.questions = [];

    // Generate all questions first
    const questionCandidates: Array<{question: any, importance: number}> = [];

    // Location question (always most important - major filter)
    if (analysis.location.size > 0) {
      const locationQuestion = this.createLocationQuestion(analysis.location);
      // Calculate importance dynamically: how much does location filter programs?
      const locationPrograms = analysis.location.size;
      const filterPower = (locationPrograms / this.allPrograms.length) * 100;
      questionCandidates.push({ question: locationQuestion, importance: filterPower });
    }

    // Company Age question (high importance - major filter)
    if (analysis.companyAge.size > 0) {
      const companyAgeQuestion = this.createCompanyAgeQuestion(analysis.companyAge);
      const totalPrograms = Array.from(analysis.companyAge.values()).reduce((a, b) => a + b, 0);
      // Calculate filter power dynamically
      const filterPower = (totalPrograms / this.allPrograms.length) * 90;
      questionCandidates.push({ question: companyAgeQuestion, importance: filterPower });
    }

    // Revenue question (high importance - major filter)
    if (analysis.revenue.size > 0) {
      const revenueQuestion = this.createRevenueQuestion(analysis.revenue);
      const totalPrograms = Array.from(analysis.revenue.values()).reduce((a, b) => a + b, 0);
      // Calculate filter power dynamically
      const filterPower = (totalPrograms / this.allPrograms.length) * 85;
      questionCandidates.push({ question: revenueQuestion, importance: filterPower });
    }

    // Team Size question (medium importance)
    if (analysis.teamSize.size > 0) {
      const teamSizeQuestion = this.createTeamSizeQuestion(analysis.teamSize);
      const totalPrograms = Array.from(analysis.teamSize.values()).reduce((a, b) => a + b, 0);
      questionCandidates.push({ question: teamSizeQuestion, importance: 70 + (totalPrograms / this.allPrograms.length) * 15 });
    }

    // Research Focus question (medium importance)
    if (analysis.researchFocus.size > 0) {
      const researchQuestion = this.createResearchFocusQuestion(analysis.researchFocus);
      const totalPrograms = Array.from(analysis.researchFocus.values()).reduce((a, b) => a + b, 0);
      questionCandidates.push({ question: researchQuestion, importance: 60 + (totalPrograms / this.allPrograms.length) * 20 });
    }

    // International Collaboration question (lower importance)
    if (analysis.internationalCollaboration.size > 0) {
      const collaborationQuestion = this.createInternationalCollaborationQuestion(analysis.internationalCollaboration);
      const totalPrograms = Array.from(analysis.internationalCollaboration.values()).reduce((a, b) => a + b, 0);
      questionCandidates.push({ question: collaborationQuestion, importance: 50 + (totalPrograms / this.allPrograms.length) * 25 });
    }

    // Industry Focus question (from extracted criteria)
    const industryPrograms = Array.from(analysis.other.entries()).filter(([key]) => key.startsWith('industry_'));
    if (industryPrograms.length > 0) {
      const industryQuestion = this.createIndustryFocusQuestion(industryPrograms);
      const totalPrograms = industryPrograms.reduce((sum, [, count]) => sum + count, 0);
      questionCandidates.push({ question: industryQuestion, importance: 55 + (totalPrograms / this.allPrograms.length) * 20 });
    }

    // NEW: Co-financing question (how much own money do you have?)
    const coFinancingPrograms = Array.from(analysis.other.entries()).filter(([key]) => key.startsWith('cofinancing_'));
    if (coFinancingPrograms.length > 0) {
      const coFinancingQuestion = this.createCoFinancingQuestion(coFinancingPrograms);
      const totalPrograms = coFinancingPrograms.reduce((sum, [, count]) => sum + count, 0);
      questionCandidates.push({ question: coFinancingQuestion, importance: 60 + (totalPrograms / this.allPrograms.length) * 20 });
    }

    // NEW: TRL Level question (how developed is your project?)
    const trlPrograms = Array.from(analysis.other.entries()).filter(([key]) => key.startsWith('trl_'));
    if (trlPrograms.length > 0) {
      const trlQuestion = this.createTRLQuestion(trlPrograms);
      const totalPrograms = trlPrograms.reduce((sum, [, count]) => sum + count, 0);
      questionCandidates.push({ question: trlQuestion, importance: 65 + (totalPrograms / this.allPrograms.length) * 15 });
    }

    // NEW: Impact question (what will your project achieve?)
    const impactPrograms = Array.from(analysis.other.entries()).filter(([key]) => key.startsWith('impact_'));
    if (impactPrograms.length > 0) {
      const impactQuestion = this.createImpactQuestion(impactPrograms);
      const totalPrograms = impactPrograms.reduce((sum, [, count]) => sum + count, 0);
      questionCandidates.push({ question: impactQuestion, importance: 55 + (totalPrograms / this.allPrograms.length) * 20 });
    }

    // NEW: Consortium question (do you have partners?)
    const consortiumPrograms = Array.from(analysis.other.entries()).filter(([key]) => key.startsWith('consortium_'));
    if (consortiumPrograms.length > 0) {
      const consortiumQuestion = this.createConsortiumQuestion(consortiumPrograms);
      const totalPrograms = consortiumPrograms.reduce((sum, [, count]) => sum + count, 0);
      questionCandidates.push({ question: consortiumQuestion, importance: 50 + (totalPrograms / this.allPrograms.length) * 25 });
    }

    // AUTO-GENERATED: Create questions for ANY other requirement type found
    console.log('🔍 Auto-generating questions from all requirement types found...');
    const requirementTypes = new Set(Array.from(analysis.other.keys()).map(key => key.split('_')[0]));
    
    for (const requirementType of requirementTypes) {
      // Skip already handled categories
      if (['industry', 'cofinancing', 'trl', 'impact', 'consortium'].includes(requirementType)) {
        continue;
      }

      const programsForType = [...analysis.other.entries()].filter(([k]) => k.startsWith(requirementType + '_'));
      const totalCount = programsForType.reduce((sum, [, count]) => sum + count, 0);
      
      if (totalCount >= 3) { // Only if at least 3 programs require this
        const autoQuestion = this.createAutoQuestion(requirementType, '', totalCount, programsForType);
        if (autoQuestion) {
          console.log(`✅ Auto-generated question for: ${requirementType} (${totalCount} programs)`);
          questionCandidates.push({ 
            question: autoQuestion, 
            importance: 40 + (totalCount / this.allPrograms.length) * 30 
          });
        }
      }
    }

    // FALLBACK: Always ensure we have at least 12-15 questions minimum
    // If not enough questions from analysis, add standard questions
    const MIN_REQUIRED_QUESTIONS = 12;
    if (questionCandidates.length < MIN_REQUIRED_QUESTIONS) {
      console.log(`⚠️ Only ${questionCandidates.length} questions from analysis, adding fallback questions to reach ${MIN_REQUIRED_QUESTIONS}`);
      
      // Add standard business questions (always add these core questions)
      const fallbackQuestions = [
        { question: this.createBusinessStageQuestion(), importance: 80 },
        { question: this.createFundingNeedQuestion(), importance: 75 },
        { question: this.createInnovationLevelQuestion(), importance: 70 },
        { question: this.createTeamExperienceQuestion(), importance: 65 },
        { question: this.createMarketQuestion(), importance: 60 }
      ];
      
      // Only add questions that don't already exist
      for (const fallback of fallbackQuestions) {
        const exists = questionCandidates.some(c => c.question.id === fallback.question.id);
        if (!exists) {
          questionCandidates.push(fallback);
          console.log(`✅ Added fallback question: ${fallback.question.id}`);
        }
      }
      
      // If still not enough, add more generic questions
      while (questionCandidates.length < MIN_REQUIRED_QUESTIONS) {
        const genericQuestion = this.createGenericQuestion(questionCandidates.length);
        if (genericQuestion) {
          questionCandidates.push({ question: genericQuestion, importance: 50 });
          console.log(`✅ Added generic question: ${genericQuestion.id}`);
        } else {
          break; // Can't create more
        }
      }
    }

    // Sort by importance (highest first) and assign question numbers
    questionCandidates
      .sort((a, b) => b.importance - a.importance)
      .forEach((candidate, index) => {
        candidate.question.questionNumber = index + 1;
        this.questions.push(candidate.question);
      });

    console.log(`📊 Question ranking by importance:`);
    questionCandidates.forEach((candidate, index) => {
      console.log(`  ${index + 1}. ${candidate.question.id} (importance: ${candidate.importance.toFixed(1)})`);
    });

    // Ensure entry point is always consistent - Location is always first
    if (this.questions.length > 0 && this.questions[0].id !== 'location') {
      console.log(`⚠️  Warning: Location question is not first! Reordering...`);
      const locationIndex = this.questions.findIndex(q => q.id === 'location');
      if (locationIndex > 0) {
        const locationQuestion = this.questions.splice(locationIndex, 1)[0];
        this.questions.unshift(locationQuestion);
        // Reassign question numbers
        this.questions.forEach((q, index) => {
          q.questionNumber = index + 1;
        });
        console.log(`✅ Reordered: Location is now question 1`);
      }
    }
  }

  /**
   * Create location question from analysis
   */
  private createLocationQuestion(locationMap: Map<string, number>): any {
    // Map location values to translation keys
    const locationKeyMap: Record<string, string> = {
      'austria': 'austria',
      'at': 'austria',
      'österreich': 'austria',
      'germany': 'germany',
      'de': 'germany',
      'deutschland': 'germany',
      'eu': 'eu',
      'europe': 'eu',
      'european union': 'eu',
      'international': 'international',
      'switzerland': 'switzerland',
      'ch': 'switzerland'
    };
    
    const options = Array.from(locationMap.entries())
      .sort(([,a], [,b]) => b - a) // Sort by frequency
      .map(([location, frequency]) => {
        const normalizedLocation = location.toLowerCase().trim();
        const translationKey = locationKeyMap[normalizedLocation] || normalizedLocation;
        return {
          value: location,
          label: `wizard.options.${translationKey}`,
          description: `${frequency} programs available`,
          fundingTypes: ['grants', 'loans']
        };
      });

    return {
      id: 'location',
      symptom: 'wizard.questions.location',
      type: 'single-select',
      options,
      required: true,
      category: 'location',
      phase: 1,
      isCoreQuestion: true,
      skipConditions: [] // Location is always asked first
    };
  }

  /**
   * Create company age question from analysis
   */
  private createCompanyAgeQuestion(ageMap: Map<number, number>): any {
    const ageRanges = this.createAgeRanges(ageMap);
    const options = ageRanges.map(range => ({
      value: range.value,
      label: range.label,
      description: `${range.programs} programs available`,
      fundingTypes: ['grants', 'loans']
    }));

    return {
      id: 'company_age',
      symptom: 'wizard.questions.companyAge',
      type: 'single-select',
      options,
      required: true,
      category: 'business_stage',
      phase: 1,
      isCoreQuestion: true,
      // NEW: Ask this question after location is answered (conditional flow)
      skipConditions: [] // Will be asked after location
    };
  }

  /**
   * Create revenue question from analysis
   */
  private createRevenueQuestion(revenueMap: Map<string, number>): any {
    const revenueRanges = this.createRevenueRanges(revenueMap);
    const options = revenueRanges.map(range => ({
      value: range.value,
      label: range.label,
      description: `${range.programs} programs available`,
      fundingTypes: ['grants', 'loans', 'equity']
    }));

    return {
      id: 'current_revenue',
      symptom: 'wizard.questions.currentRevenue',
      type: 'single-select',
      options,
      required: true,
      category: 'funding_need',
      phase: 1,
      isCoreQuestion: true,
      skipConditions: [] // No skip conditions - can be asked anytime
    };
  }

  /**
   * Create team size question from analysis
   */
  private createTeamSizeQuestion(teamSizeMap: Map<number, number>): any {
    const teamRanges = this.createTeamRanges(teamSizeMap);
    const options = teamRanges.map(range => ({
      value: range.value,
      label: range.label,
      description: `${range.programs} programs available`,
      fundingTypes: ['grants', 'loans']
    }));

    return {
      id: 'team_size',
      symptom: 'wizard.questions.teamSize',
      type: 'single-select',
      options,
      required: true,
      category: 'team_size',
      phase: 1,
      isCoreQuestion: true,
      skipConditions: [] // No skip conditions
    };
  }

  /**
   * Create research focus question from analysis
   */
  private createResearchFocusQuestion(researchMap: Map<string, number>): any {
    const totalPrograms = Array.from(researchMap.values()).reduce((a, b) => a + b, 0);
    const options = [
      {
        value: 'yes',
        label: 'wizard.options.yes',
        description: `${totalPrograms} research programs available`,
        fundingTypes: ['grants']
      },
      {
        value: 'no',
        label: 'wizard.options.no',
        description: 'Commercial/market programs',
        fundingTypes: ['grants', 'loans', 'equity']
      }
    ];

    return {
      id: 'research_focus',
      symptom: 'wizard.questions.researchFocus',
      type: 'single-select',
      options,
      required: true,
      category: 'specific_requirements',
      phase: 2,
      isCoreQuestion: true,
      skipConditions: [] // Can be asked after basics are covered
    };
  }

  /**
   * Create international collaboration question from analysis
   */
  private createInternationalCollaborationQuestion(collaborationMap: Map<string, number>): any {
    const totalPrograms = Array.from(collaborationMap.values()).reduce((a, b) => a + b, 0);
    const options = [
      {
        value: 'yes',
        label: 'wizard.options.yes',
        description: `${totalPrograms} consortium programs available`,
        fundingTypes: ['grants']
      },
      {
        value: 'no',
        label: 'wizard.options.no',
        description: 'Individual application programs',
        fundingTypes: ['grants', 'loans', 'equity']
      }
    ];

    return {
      id: 'international_collaboration',
      symptom: 'wizard.questions.internationalCollaboration',
      type: 'single-select',
      options,
      required: true,
      category: 'specific_requirements',
      phase: 2,
      isCoreQuestion: true
    };
  }

  /**
   * Create age ranges from company age data
   */
  private createAgeRanges(ageMap: Map<number, number>): Array<{value: string, label: string, programs: number}> {
    const ages = Array.from(ageMap.keys()).sort((a, b) => a - b);
    const ranges = [];

    // ALWAYS include 0-2 years option (even if no programs have max_age <= 2, companies can still be that young)
    const ageUnder2 = ages.filter(age => age <= 2).reduce((sum, age) => sum + (ageMap.get(age) || 0), 0);
    ranges.push({ value: '0_2_years', label: 'wizard.options.under2Years', programs: ageUnder2 || 100 }); // Default 100 if no data

    if (ages.some(age => age > 2 && age <= 5)) {
      ranges.push({ value: '2_5_years', label: 'wizard.options.2to5Years', programs: ages.filter(age => age > 2 && age <= 5).reduce((sum, age) => sum + (ageMap.get(age) || 0), 0) });
    }
    if (ages.some(age => age > 5 && age <= 10)) {
      ranges.push({ value: '5_10_years', label: 'wizard.options.5to10Years', programs: ages.filter(age => age > 5 && age <= 10).reduce((sum, age) => sum + (ageMap.get(age) || 0), 0) });
    }
    if (ages.some(age => age > 10)) {
      ranges.push({ value: 'over_10_years', label: 'wizard.options.over10Years', programs: ages.filter(age => age > 10).reduce((sum, age) => sum + (ageMap.get(age) || 0), 0) });
    }

    return ranges;
  }

  /**
   * Create revenue ranges from revenue data
   */
  private createRevenueRanges(revenueMap: Map<string, number>): Array<{value: string, label: string, programs: number}> {
    const ranges = [];
    
    // Analyze revenue ranges and create meaningful options
    for (const [range, count] of revenueMap.entries()) {
      const [min] = range.split('-');
      const minNum = parseInt(min) || 0;
      
      if (minNum < 100000) {
        ranges.push({ value: 'under_100k', label: 'wizard.options.under100k', programs: count });
      } else if (minNum < 500000) {
        ranges.push({ value: '100k_500k', label: 'wizard.options.100kto500k', programs: count });
      } else if (minNum < 2000000) {
        ranges.push({ value: '500k_2m', label: 'wizard.options.500kto2m', programs: count });
      } else {
        ranges.push({ value: 'over_2m', label: 'wizard.options.over2m', programs: count });
      }
    }

    return ranges;
  }

  /**
   * Create team size ranges from team size data
   */
  private createTeamRanges(teamSizeMap: Map<number, number>): Array<{value: string, label: string, programs: number}> {
    const teamSizes = Array.from(teamSizeMap.keys()).sort((a, b) => a - b);
    const ranges = [];

    if (teamSizes.some(size => size <= 2)) {
      ranges.push({ value: '1_2_people', label: 'wizard.options.1to2People', programs: teamSizes.filter(size => size <= 2).reduce((sum, size) => sum + (teamSizeMap.get(size) || 0), 0) });
    }
    if (teamSizes.some(size => size > 2 && size <= 5)) {
      ranges.push({ value: '3_5_people', label: 'wizard.options.3to5People', programs: teamSizes.filter(size => size > 2 && size <= 5).reduce((sum, size) => sum + (teamSizeMap.get(size) || 0), 0) });
    }
    if (teamSizes.some(size => size > 5 && size <= 10)) {
      ranges.push({ value: '6_10_people', label: 'wizard.options.6to10People', programs: teamSizes.filter(size => size > 5 && size <= 10).reduce((sum, size) => sum + (teamSizeMap.get(size) || 0), 0) });
    }
    if (teamSizes.some(size => size > 10)) {
      ranges.push({ value: 'over_10_people', label: 'wizard.options.over10People', programs: teamSizes.filter(size => size > 10).reduce((sum, size) => sum + (teamSizeMap.get(size) || 0), 0) });
    }

    return ranges;
  }

  /**
   * Get first question (for SmartWizard compatibility)
   */
  public async getFirstQuestion(): Promise<SymptomQuestion | null> {
    console.log('🎯 Getting first question...');
    console.log('🎯 Available questions:', this.questions.length);
    
    // Use dynamic scoring even for first question (based on ALL programs)
    const question = await this.getNextQuestionEnhanced({});
    console.log('🎯 First question result:', question ? question.id : 'null');
    return question;
  }

  /**
   * Get next question with enhanced logic - PROGRESSIVE FILTERING
   */
  public async getNextQuestionEnhanced(answers: Record<string, any>): Promise<SymptomQuestion | null> {
    console.log(`🔍 Getting next question from ${Object.keys(answers).length} answers`);
    console.log(`📊 Total programs: ${this.allPrograms.length}`);
    console.log(`📊 Current answers:`, Object.keys(answers).map(k => `${k}=${answers[k]}`).join(', '));
    
    // NEW: Calculate remaining programs after filtering AND UPDATE STATE
    this.remainingPrograms = this.applyMajorFilters(answers);
    const filterPercent = this.allPrograms.length > 0 
      ? ((1 - this.remainingPrograms.length / this.allPrograms.length) * 100).toFixed(1)
      : 0;
    console.log(`📊 Programs remaining: ${this.remainingPrograms.length} / ${this.allPrograms.length} (${filterPercent}% filtered)`);
    
    // NEW: Only stop early if we have ≤5 programs AND answered at least 12 questions
    // This ensures we ask enough questions to properly narrow down
    const answerCount = Object.keys(answers).length;
    if (this.remainingPrograms.length <= 5 && answerCount >= 12) {
      console.log(`✅ Only ${this.remainingPrograms.length} programs remain (well narrowed), stopping questions after ${answerCount} answers`);
      return null;
    }
    
    // CRITICAL: Never stop before 12 questions minimum
    if (answerCount < 12) {
      console.log(`⏳ Must ask at least 12 questions, currently at ${answerCount}`);
      // Continue asking questions
    }
    
    // Check if we should stop asking questions based on match quality
    const shouldStop = await this.shouldStopQuestions(answers);
    if (shouldStop) {
      console.log('✅ Stopping questions due to excellent match quality');
      return null;
    }
    
    console.log('🔍 Continuing with question selection...');
    
    // NEW: Generate contextual follow-up questions based on answers
    // This creates NEW questions based on what the user has answered
    this.generateContextualQuestions(answers);
    
    // DYNAMIC: Score ALL unanswered questions and select best
    // Also prioritize questions that are relevant to the CURRENT remaining programs
    const unansweredQuestions = this.questions.filter(q => 
      !answers[q.id] && !this.askedQuestions.includes(q.id) && this.shouldShowQuestion(q, answers)
    );
    
    // NEW: If we have location but not company_age, prioritize company_age
    // If we have company_age but not revenue, prioritize revenue
    // This creates a logical flow: location → company_age → revenue → team_size → specific requirements
    if (answers.location && !answers.company_age) {
      const companyAgeQuestion = unansweredQuestions.find(q => q.id === 'company_age');
      if (companyAgeQuestion) {
        console.log(`🎯 Prioritizing company_age question after location answer`);
        // Boost its score by moving it to front
        unansweredQuestions.sort((a, b) => {
          if (a.id === 'company_age') return -1;
          if (b.id === 'company_age') return 1;
          return 0;
        });
      }
    }
    
    if (answers.company_age && !answers.current_revenue) {
      const revenueQuestion = unansweredQuestions.find(q => q.id === 'current_revenue');
      if (revenueQuestion) {
        console.log(`🎯 Prioritizing revenue question after company_age answer`);
        unansweredQuestions.sort((a, b) => {
          if (a.id === 'current_revenue') return -1;
          if (b.id === 'current_revenue') return 1;
          return 0;
        });
      }
    }
    
    if (answers.current_revenue && !answers.team_size) {
      const teamSizeQuestion = unansweredQuestions.find(q => q.id === 'team_size');
      if (teamSizeQuestion) {
        console.log(`🎯 Prioritizing team_size question after revenue answer`);
        unansweredQuestions.sort((a, b) => {
          if (a.id === 'team_size') return -1;
          if (b.id === 'team_size') return 1;
          return 0;
        });
      }
    }
    
    // Score each question dynamically based on CURRENT program pool
    const scoredQuestions = unansweredQuestions.map(question => {
      const baseScore = this.calculateInformationValue(question, answers, this.remainingPrograms);
      
      // NEW: Bonus for sequential flow questions (location → company_age → revenue → team_size)
      let flowBonus = 0;
      if (question.id === 'company_age' && answers.location && !answers.company_age) {
        flowBonus = 50; // High priority after location
      } else if (question.id === 'current_revenue' && answers.company_age && !answers.current_revenue) {
        flowBonus = 40; // High priority after company_age
      } else if (question.id === 'team_size' && answers.current_revenue && !answers.team_size) {
        flowBonus = 30; // High priority after revenue
      } else if (question.id === 'research_focus' && answers.team_size && !answers.research_focus) {
        flowBonus = 20; // Medium priority after team_size
      } else if (question.id === 'international_collaboration' && answers.research_focus && !answers.international_collaboration) {
        flowBonus = 15; // Medium priority after research_focus
      }
      
      return {
        question,
        score: baseScore + flowBonus
      };
    });
    
    // Sort by score (highest first) - THIS IS THE DYNAMIC PART
    scoredQuestions.sort((a, b) => b.score - a.score);
    
    console.log('📊 Question rankings (top 10):');
    scoredQuestions.slice(0, 10).forEach(({question, score}, idx) => {
      const relevance = this.remainingPrograms.filter(p => {
        const cat = (p as any).categorized_requirements?.[this.mapCategoryToCategorizedKey(question.category)];
        return cat && cat.length > 0;
      }).length;
      console.log(`  ${idx + 1}. ${question.id} (${question.category}): score=${score.toFixed(1)}, relevant=${relevance}/${this.remainingPrograms.length}`);
    });
    
    // Select highest scoring question
    const bestQuestion = scoredQuestions[0]?.question || null;
    const bestQuestionScore = scoredQuestions[0]?.score || 0;
    
    if (bestQuestion) {
      // Track that we asked this question
      this.askedQuestions.push(bestQuestion.id);
      console.log(`✅ Selected question: ${bestQuestion.id} (score: ${bestQuestionScore.toFixed(2)})`);
      return bestQuestion;
    }
    
    console.log('❌ No more questions to ask');
    return null;
  }

  /**
   * Check if we should stop asking questions
   */
  public async shouldStopQuestions(answers: Record<string, any>): Promise<boolean> {
    const answerCount = Object.keys(answers).length;
    
    // CRITICAL FIX: Always ask at least 10-12 questions minimum, regardless of how many questions exist
    // This prevents stopping too early when only a few questions are generated
    const MINIMUM_QUESTIONS = 12;
    if (answerCount < MINIMUM_QUESTIONS) {
      console.log(`⏳ Need at least ${MINIMUM_QUESTIONS} answers, currently have ${answerCount}`);
      return false;
    }
    
    // If we have 15+ answers, we can stop (good enough)
    if (answerCount >= 15) {
      console.log(`✅ Sufficient answers provided (${answerCount})`);
      return true;
    }
    
    // Only check if we've answered all questions if we have enough questions AND enough answers
    const totalQuestions = this.questions.length;
    if (totalQuestions >= MINIMUM_QUESTIONS && answerCount >= totalQuestions) {
      console.log(`✅ All ${totalQuestions} questions answered`);
      return true;
    }
    
    // If we have very few questions (< 12), keep asking contextual questions
    if (totalQuestions < MINIMUM_QUESTIONS) {
      console.log(`⚠️ Only ${totalQuestions} questions generated, will keep asking contextual questions`);
      return false; // Don't stop - let contextual questions fill the gap
    }
    
    return false;
  }

  /**
   * Get next question (for SmartWizard compatibility)
   */
  public async getNextQuestion(answers: Record<string, any>): Promise<SymptomQuestion | null> {
    return this.getNextQuestionEnhanced(answers);
  }

  /**
   * Get core questions
   */
  public getCoreQuestions(): SymptomQuestion[] {
    return this.questions.filter(q => q.isCoreQuestion);
  }

  /**
   * Get estimated total questions
   */
  public getEstimatedTotalQuestions(): number {
    return Math.min(this.questions.length, 40);
  }

  /**
   * Get question by ID
   */
  public getQuestionById(id: string): SymptomQuestion | undefined {
    return this.questions.find(q => q.id === id);
  }

  /**
   * Get current remaining program count
   */
  public getRemainingProgramCount(): number {
    return this.remainingPrograms.length;
  }

  /**
   * Apply major filters to programs - ENHANCED to use categorized_requirements
   */
  public applyMajorFilters(answers: Record<string, any>): Program[] {
    let filteredPrograms = [...this.allPrograms];
    const initialCount = filteredPrograms.length;
    
    // Location filter - check both eligibility_criteria AND categorized_requirements
    if (answers.location) {
      const beforeLocation = filteredPrograms.length;
      filteredPrograms = filteredPrograms.filter(program => {
        const eligibility = (program as any).eligibility_criteria;
        const categorized = (program as any).categorized_requirements;
        
        // Check categorized_requirements first (more detailed)
        if (categorized?.geographic) {
          const geoReqs = categorized.geographic.filter((r: any) => r.type === 'location');
          if (geoReqs.length > 0) {
            const userLocation = answers.location.toLowerCase();
            const programLocations = geoReqs.map((r: any) => String(r.value).toLowerCase());
            
            // Check if any program location matches user location
            const matches = programLocations.some((loc: string) => {
              if (userLocation === 'austria' && (loc === 'austria' || loc === 'vienna' || loc === 'at' || loc.includes('austria'))) return true;
              if (userLocation === 'eu' && (loc === 'eu' || loc === 'europe' || loc === 'austria' || loc === 'vienna' || loc.includes('europe'))) return true;
              if (userLocation === 'international' || userLocation === 'germany' || userLocation === 'switzerland') return true;
              return loc === userLocation || loc.includes(userLocation);
            });
            
            if (!matches) return false;
          }
        }
        
        // Fallback to eligibility_criteria if categorized not available
        if (!categorized?.geographic && eligibility) {
          // If no location criteria, include the program (available to all)
          if (!eligibility.location) return true;
          
          const programLocation = eligibility.location.toLowerCase();
          const userLocation = answers.location.toLowerCase();
          
          // Exact match or broader scope
          if (userLocation === 'austria' && (programLocation === 'austria' || programLocation === 'vienna')) {
            return true;
          }
          if (userLocation === 'eu' && (programLocation === 'eu' || programLocation === 'austria' || programLocation === 'vienna')) {
            return true;
          }
          if (userLocation === 'international' && (programLocation === 'international' || programLocation === 'eu' || programLocation === 'austria' || programLocation === 'vienna')) {
            return true;
          }
          
          return programLocation === userLocation;
        }
        
        // If no location requirements at all, include the program
        return true;
      });
      
      console.log(`📊 Location filter (${answers.location}): ${beforeLocation} → ${filteredPrograms.length} programs`);
    }
    
    // Company age filter - check categorized_requirements
    if (answers.company_age) {
      const beforeAge = filteredPrograms.length;
      const userAge = this.parseAgeAnswer(answers.company_age);
      filteredPrograms = filteredPrograms.filter(program => {
        const eligibility = (program as any).eligibility_criteria;
        const categorized = (program as any).categorized_requirements;
        
        // Check categorized_requirements first
        if (categorized?.team) {
          const ageReqs = categorized.team.filter((r: any) => 
            r.type === 'max_company_age' || r.type === 'company_age'
          );
          if (ageReqs.length > 0) {
            const maxAge = ageReqs[0].value;
            if (typeof maxAge === 'number' && userAge > maxAge) {
              return false;
            }
          }
        }
        
        // Fallback to eligibility_criteria
        if (!categorized?.team && eligibility) {
          if (!eligibility.max_company_age) return true; // No age restriction = available
          const maxAge = eligibility.max_company_age;
          if (userAge > maxAge) return false;
        }
        
        return true;
      });
      console.log(`📊 Company age filter (${answers.company_age}, userAge: ${userAge}): ${beforeAge} → ${filteredPrograms.length} programs`);
    }
    
    // Revenue filter - check categorized_requirements
    if (answers.current_revenue) {
      const beforeRevenue = filteredPrograms.length;
      const userRevenue = this.parseRevenueAnswer(answers.current_revenue);
      filteredPrograms = filteredPrograms.filter(program => {
        const eligibility = (program as any).eligibility_criteria;
        const categorized = (program as any).categorized_requirements;
        
        // Check categorized_requirements first
        if (categorized?.financial) {
          const revenueReqs = categorized.financial.filter((r: any) => 
            r.type === 'revenue' || r.type === 'revenue_range'
          );
          if (revenueReqs.length > 0) {
            const req = revenueReqs[0];
            if (req.value && typeof req.value === 'object') {
              const min = req.value.min || 0;
              const max = req.value.max || Infinity;
              if (userRevenue < min || userRevenue > max) return false;
            }
          }
        }
        
        // Fallback to eligibility_criteria
        if (!categorized?.financial && eligibility) {
          if (!eligibility.revenue_min && !eligibility.revenue_max) return true;
          if (eligibility.revenue_min && userRevenue < eligibility.revenue_min) return false;
          if (eligibility.revenue_max && userRevenue > eligibility.revenue_max) return false;
        }
        
        return true;
      });
      console.log(`📊 Revenue filter (${answers.current_revenue}, userRevenue: ${userRevenue}): ${beforeRevenue} → ${filteredPrograms.length} programs`);
    }
    
    // Team size filter - check categorized_requirements
    if (answers.team_size) {
      const beforeTeam = filteredPrograms.length;
      const userTeamSize = this.parseTeamSizeAnswer(answers.team_size);
      filteredPrograms = filteredPrograms.filter(program => {
        const eligibility = (program as any).eligibility_criteria;
        const categorized = (program as any).categorized_requirements;
        
        // Check categorized_requirements first
        if (categorized?.team) {
          const teamReqs = categorized.team.filter((r: any) => 
            r.type === 'min_team_size' || r.type === 'team_size'
          );
          if (teamReqs.length > 0) {
            const minTeamSize = teamReqs[0].value;
            if (typeof minTeamSize === 'number' && userTeamSize < minTeamSize) {
              return false;
            }
          }
        }
        
        // Fallback to eligibility_criteria
        if (!categorized?.team && eligibility) {
          if (!eligibility.min_team_size) return true;
          const minTeamSize = eligibility.min_team_size;
          if (userTeamSize < minTeamSize) return false;
        }
        
        return true;
      });
      console.log(`📊 Team size filter (${answers.team_size}, userTeamSize: ${userTeamSize}): ${beforeTeam} → ${filteredPrograms.length} programs`);
    }
    
    // Research focus filter (if answered)
    if (answers.research_focus) {
      const beforeResearch = filteredPrograms.length;
      filteredPrograms = filteredPrograms.filter(program => {
        const categorized = (program as any).categorized_requirements;
        const eligibility = (program as any).eligibility_criteria;
        
        // Check categorized_requirements
        if (categorized?.project) {
          const hasResearch = categorized.project.some((r: any) => 
            r.type === 'research_focus' && r.value
          );
          if (answers.research_focus === 'yes' && !hasResearch) {
            // If user says yes but program doesn't require research, might still include
            // But if program requires research and user says no, exclude
          } else if (answers.research_focus === 'no' && hasResearch) {
            // If program requires research but user says no, exclude
            return false;
          }
        }
        
        // Fallback to eligibility
        if (!categorized?.project && eligibility) {
          if (eligibility.research_focus && answers.research_focus === 'no') {
            return false;
          }
        }
        
        return true;
      });
      console.log(`📊 Research focus filter (${answers.research_focus}): ${beforeResearch} → ${filteredPrograms.length} programs`);
    }
    
    // International collaboration filter (if answered)
    if (answers.international_collaboration) {
      const beforeCollab = filteredPrograms.length;
      filteredPrograms = filteredPrograms.filter(program => {
        const categorized = (program as any).categorized_requirements;
        const eligibility = (program as any).eligibility_criteria;
        
        // Check categorized_requirements
        if (categorized?.consortium) {
          const requiresCollab = categorized.consortium.some((r: any) => 
            r.type === 'international_collaboration' && r.value === true
          );
          if (requiresCollab && answers.international_collaboration === 'no') {
            return false;
          }
        }
        
        // Fallback to eligibility
        if (!categorized?.consortium && eligibility) {
          if (eligibility.international_collaboration && answers.international_collaboration === 'no') {
            return false;
          }
        }
        
        return true;
      });
      console.log(`📊 International collaboration filter (${answers.international_collaboration}): ${beforeCollab} → ${filteredPrograms.length} programs`);
    }
    
    console.log(`📊 Total filtering: ${initialCount} → ${filteredPrograms.length} programs (${((1 - filteredPrograms.length / initialCount) * 100).toFixed(1)}% filtered)`);
    return filteredPrograms;
  }

  /**
   * Get all remaining programs (for final scoring)
   */
  public getRemainingPrograms(): Program[] {
    return this.remainingPrograms;
  }

  private parseAgeAnswer(answer: string): number {
    // Convert answer like 'under_2_years', '2_5_years' to max age
    if (answer.includes('under_2') || answer.includes('2_years')) return 2;
    if (answer.includes('2_5') || answer.includes('5_years')) return 5;
    if (answer.includes('5_10') || answer.includes('10_years')) return 10;
    return 20; // older companies
  }

  private parseRevenueAnswer(answer: string): number {
    // Convert answer to approximate revenue number
    if (answer.includes('under_100')) return 50000;
    if (answer.includes('100k_500')) return 250000;
    if (answer.includes('500k_2m')) return 1000000;
    if (answer.includes('over_2m')) return 5000000;
    return 0;
  }

  private parseTeamSizeAnswer(answer: string): number {
    // Convert answer like '1_2_people', '3_5_people' to min size
    if (answer.includes('1_2') || answer.includes('1-2')) return 1;
    if (answer.includes('3_5') || answer.includes('3-5')) return 3;
    if (answer.includes('6_10') || answer.includes('6-10')) return 6;
    if (answer.includes('over_10')) return 10;
    return 1;
  }

  /**
   * Validate answers
   */
  public validateAnswers(answers: Record<string, any>): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    recommendations: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];
    
    // Validate required questions
    for (const question of this.questions) {
      if (question.required && !answers[question.id]) {
        errors.push(`Required question "${question.symptom}" not answered`);
      }
    }
    
    // Add validation logic here
    if (errors.length === 0) {
      recommendations.push('All required questions answered');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      recommendations
    };
  }

  /**
   * NEW: Check if a question should be shown based on conditional logic
   */
  private shouldShowQuestion(question: SymptomQuestion, answers: Record<string, any>): boolean {
    // If no conditional logic, show the question
    if (!question.skipConditions || question.skipConditions.length === 0) {
      return true;
    }
    
    // Check skip conditions - if any condition says to hide, hide the question
    for (const condition of question.skipConditions) {
      const answerValue = answers[condition.questionId];
      
      // If required prerequisite question hasn't been answered, don't show this question yet
      if (condition.action === 'show' && (answerValue === undefined || answerValue === null)) {
        console.log(`⏳ Deferring question ${question.id} - prerequisite ${condition.questionId} not answered yet`);
        return false;
      }
      
      // If prerequisite question has been answered, check if we should show
      if (answerValue !== undefined && answerValue !== null) {
        let conditionMet = false;
        
        if (condition.operator === 'equals' && answerValue === condition.value) {
          conditionMet = true;
        } else if (condition.operator === 'contains' && 
                   Array.isArray(condition.value) && 
                   condition.value.includes(answerValue)) {
          conditionMet = true;
        } else if (condition.operator === 'in' && 
                   Array.isArray(condition.value) && 
                   condition.value.includes(answerValue)) {
          conditionMet = true;
        } else if (condition.operator === 'not_equals' && answerValue !== condition.value) {
          conditionMet = true;
        } else if (condition.operator === 'not_in' && 
                   Array.isArray(condition.value) && 
                   !condition.value.includes(answerValue)) {
          conditionMet = true;
        }
        
        // If condition says to hide and condition is met, hide the question
        if (condition.action === 'hide' && conditionMet) {
          console.log(`🚫 Skipping question ${question.id} due to condition: ${condition.questionId} ${condition.operator} ${condition.value}`);
          return false;
        }
        
        // If condition says to show and condition is NOT met, hide the question
        if (condition.action === 'show' && !conditionMet) {
          console.log(`🚫 Skipping question ${question.id} - condition not met: ${condition.questionId} ${condition.operator} ${condition.value}`);
          return false;
        }
      }
    }
    
    return true;
  }

  /**
   * NEW: Calculate information value - how much does this question narrow down the program pool?
   */
  private calculateInformationValue(
    question: SymptomQuestion,
    answers: Record<string, any>,
    remainingPrograms: Program[]
  ): number {
    // Base score starts with question phase (earlier questions are more valuable)
    // REDUCED PHASE WEIGHT: Let relevance score dominate instead
    let score = (4 - question.phase) * 5; // Phase 1 = 15, Phase 2 = 10, Phase 3 = 5 (reduced from 30/20/10)
    
    // Check how many programs have requirements for this question's category
    let relevantPrograms = 0;
    
    for (const program of remainingPrograms) {
      const eligibility = (program as any).eligibility_criteria;
      
      if (!eligibility) {
        relevantPrograms += 0.1; // No requirements = less relevant
        continue;
      }
      
      // Check if this question is relevant to this program
      let isRelevant = false;
      
      // Check both eligibility_criteria AND categorized_requirements
      const categorized = (program as any).categorized_requirements;
      
      switch (question.category) {
        case 'location':
          if (eligibility.location || categorized?.geographic) isRelevant = true;
          break;
        case 'business_stage':
          if (eligibility.max_company_age || eligibility.min_company_age) isRelevant = true;
          break;
        case 'funding_need':
          if (eligibility.revenue_min || eligibility.revenue_max || categorized?.financial) isRelevant = true;
          break;
        case 'team_size':
          if (eligibility.min_team_size || eligibility.max_team_size || categorized?.team) isRelevant = true;
          break;
        case 'specific_requirements':
          if (eligibility.research_focus || eligibility.international_collaboration || 
              categorized?.project || categorized?.consortium) isRelevant = true;
          break;
        case 'innovation_level':
          if (eligibility.industry_focus || eligibility.research_focus || 
              categorized?.innovation || categorized?.technical) isRelevant = true;
          break;
        default:
          isRelevant = true; // Default to relevant
      }
      
      // Check for categorized fields based on question ID
      if (!isRelevant && categorized) {
        if (question.id.includes('project') && categorized.project?.length > 0) isRelevant = true;
        if (question.id.includes('innovation') && categorized.innovation?.length > 0) isRelevant = true;
        if (question.id.includes('trl') && categorized.technical?.length > 0) isRelevant = true;
        if (question.id.includes('market') && categorized.market?.length > 0) isRelevant = true;
      }
      
      if (isRelevant) {
        relevantPrograms++;
      }
    }
    
    // Higher score if question is relevant to many programs
    // INCREASED RELEVANCE WEIGHT: This should be the main factor
    const relevanceScore = remainingPrograms.length > 0 
      ? (relevantPrograms / remainingPrograms.length) * 200 // Increased to 200 to prioritize filtering
      : 0;
    score += relevanceScore;
    
    // NEW: Calculate how much this question would filter programs (estimate)
    // This is the KEY metric - questions that filter more programs are more valuable
    const estimatedFilterPower = this.estimateQuestionFilterPower(question, remainingPrograms);
    score += estimatedFilterPower * 100; // High weight for filtering power
    
    // Penalize if we already answered similar questions (avoid redundant questions)
    const similarAnswers = Object.keys(answers).filter(key => {
      const keyCategory = question.category;
      const answerCategory = this.getQuestionCategory(key);
      return keyCategory === answerCategory;
    });
    
    if (similarAnswers.length > 0) {
      score -= similarAnswers.length * 10;
    }
    
    // Boost score for core questions
    if (question.isCoreQuestion) {
      score += 20;
    }
    
    // Don't penalize for asking more questions - we want to get good matches
    // Only slightly reduce score after 15 answers to encourage eventual stopping
    const answerCount = Object.keys(answers).length;
    if (answerCount >= 15) {
      score *= 0.8; // Small reduction after 15 answers (was 0.5 after 8)
    }
    
    console.log(`📊 Question ${question.id} scoring: base=${((4 - question.phase) * 5).toFixed(1)}, relevance=${relevanceScore.toFixed(1)}, filterPower=${estimatedFilterPower.toFixed(2)}, final=${Math.max(0, score).toFixed(1)}`);
    
    return Math.max(0, score);
  }

  /**
   * NEW: Estimate how much a question would filter the remaining programs
   */
  private estimateQuestionFilterPower(question: SymptomQuestion, remainingPrograms: Program[]): number {
    if (remainingPrograms.length === 0) return 0;
    
    // Count how many programs have requirements for this question's category
    let programsWithRequirement = 0;
    let programsWithoutRequirement = 0;
    
    for (const program of remainingPrograms) {
      const eligibility = (program as any).eligibility_criteria;
      const categorized = (program as any).categorized_requirements;
      
      let hasRequirement = false;
      
      switch (question.category) {
        case 'location':
          hasRequirement = !!(eligibility?.location || (categorized?.geographic && categorized.geographic.length > 0));
          break;
        case 'business_stage':
          hasRequirement = !!(eligibility?.max_company_age || eligibility?.min_company_age || 
                            (categorized?.team && categorized.team.some((r: any) => r.type === 'max_company_age' || r.type === 'company_age')));
          break;
        case 'funding_need':
          hasRequirement = !!(eligibility?.revenue_min || eligibility?.revenue_max || 
                            (categorized?.financial && categorized.financial.length > 0));
          break;
        case 'team_size':
          hasRequirement = !!(eligibility?.min_team_size || 
                            (categorized?.team && categorized.team.some((r: any) => r.type === 'min_team_size' || r.type === 'team_size')));
          break;
        case 'specific_requirements':
          hasRequirement = !!(eligibility?.research_focus || eligibility?.international_collaboration || 
                            (categorized?.project && categorized.project.length > 0) || 
                            (categorized?.consortium && categorized.consortium.length > 0));
          break;
        case 'innovation_level':
          hasRequirement = !!(eligibility?.industry_focus || eligibility?.research_focus || 
                            (categorized?.innovation && categorized.innovation.length > 0) || 
                            (categorized?.technical && categorized.technical.length > 0));
          break;
        default:
          hasRequirement = true; // Default to relevant
      }
      
      if (hasRequirement) {
        programsWithRequirement++;
      } else {
        programsWithoutRequirement++;
      }
    }
    
    // Higher filter power = more programs have this requirement (so asking it will filter more)
    // But also consider: if 50% have requirement and 50% don't, that's maximum filter power
    const total = programsWithRequirement + programsWithoutRequirement;
    if (total === 0) return 0;
    
    // Calculate entropy/diversity - questions that split programs more evenly have higher filter power
    const pWith = programsWithRequirement / total;
    const pWithout = programsWithoutRequirement / total;
    
    // Entropy calculation: higher entropy = more filtering power
    let entropy = 0;
    if (pWith > 0) entropy -= pWith * Math.log2(pWith);
    if (pWithout > 0) entropy -= pWithout * Math.log2(pWithout);
    
    // Normalize to 0-1 scale (max entropy is 1 when 50/50 split)
    return entropy;
  }

  /**
   * NEW: Get question category from question ID (helper for similarity checking)
   */
  private getQuestionCategory(questionId: string): string {
    if (questionId === 'location') return 'location';
    if (questionId.includes('age') || questionId.includes('stage')) return 'business_stage';
    if (questionId.includes('revenue') || questionId.includes('funding')) return 'funding_need';
    if (questionId.includes('team') || questionId.includes('size')) return 'team_size';
    if (questionId.includes('research') || questionId.includes('innovation')) return 'innovation_level';
    return 'specific_requirements';
  }

  /**
   * NEW: Map question category to categorized_requirements key
   */
  private mapCategoryToCategorizedKey(category: string): string {
    const mapping: Record<string, string> = {
      'location': 'geographic',
      'business_stage': 'team',
      'funding_need': 'financial',
      'team_size': 'team',
      'innovation_level': 'technical',
      'specific_requirements': 'project'
    };
    return mapping[category] || 'project';
  }

  /**
   * Create fallback business stage question
   */
  private createBusinessStageQuestion(): SymptomQuestion {
    return {
      id: 'business_stage',
      symptom: 'wizard.questions.businessStage',
      type: 'single-select',
      options: [
        { label: 'wizard.options.idea', value: 'idea' },
        { label: 'wizard.options.mvp', value: 'mvp' },
        { label: 'wizard.options.revenue', value: 'revenue' },
        { label: 'wizard.options.scaling', value: 'scaling' }
      ],
      required: true,
      category: 'business_stage',
      phase: 1,
      questionNumber: 0
    };
  }

  /**
   * Create fallback funding need question
   */
  private createFundingNeedQuestion(): SymptomQuestion {
    return {
      id: 'funding_need',
      symptom: 'wizard.questions.fundingNeed',
      type: 'single-select',
      options: [
        { label: 'wizard.options.seed', value: 'seed' },
        { label: 'wizard.options.growth', value: 'growth' },
        { label: 'wizard.options.expansion', value: 'expansion' },
        { label: 'wizard.options.research', value: 'research' }
      ],
      required: true,
      category: 'funding_need',
      phase: 1,
      questionNumber: 0
    };
  }

  /**
   * Create fallback innovation level question
   */
  private createInnovationLevelQuestion(): SymptomQuestion {
    return {
      id: 'innovation_level',
      symptom: 'wizard.questions.innovationLevel',
      type: 'single-select',
      options: [
        { label: 'wizard.options.breakthrough', value: 'breakthrough' },
        { label: 'wizard.options.incremental', value: 'incremental' },
        { label: 'wizard.options.improvement', value: 'improvement' },
        { label: 'wizard.options.standard', value: 'standard' }
      ],
      required: true,
      category: 'innovation_level',
      phase: 2,
      questionNumber: 0
    };
  }

  /**
   * Create fallback team experience question
   */
  private createTeamExperienceQuestion(): SymptomQuestion {
    return {
      id: 'team_experience',
      symptom: 'wizard.questions.teamExperience',
      type: 'single-select',
      options: [
        { label: 'wizard.options.experienced', value: 'experienced' },
        { label: 'wizard.options.moderate', value: 'moderate' },
        { label: 'wizard.options.junior', value: 'junior' },
        { label: 'wizard.options.new', value: 'new' }
      ],
      required: true,
      category: 'team_size',
      phase: 2,
      questionNumber: 0
    };
  }

  /**
   * Create generic question for fallback (when not enough questions)
   */
  private createGenericQuestion(index: number): SymptomQuestion | null {
    // Create simple questions based on index
    const genericQuestions = [
      {
        id: 'business_type',
        symptom: 'wizard.questions.businessType',
        type: 'single-select' as const,
        options: [
          { label: 'wizard.options.tech', value: 'tech' },
          { label: 'wizard.options.service', value: 'service' },
          { label: 'wizard.options.product', value: 'product' },
          { label: 'wizard.options.other', value: 'other' }
        ],
        category: 'specific_requirements' as const,
        phase: 2 as const
      },
      {
        id: 'funding_goal',
        symptom: 'wizard.questions.fundingGoal',
        type: 'single-select' as const,
        options: [
          { label: 'wizard.options.product_development', value: 'product_development' },
          { label: 'wizard.options.marketing', value: 'marketing' },
          { label: 'wizard.options.research', value: 'research' },
          { label: 'wizard.options.expansion', value: 'expansion' }
        ],
        category: 'funding_need' as const,
        phase: 2 as const
      },
      {
        id: 'project_status',
        symptom: 'wizard.questions.projectStatus',
        type: 'single-select' as const,
        options: [
          { label: 'wizard.options.concept', value: 'concept' },
          { label: 'wizard.options.proof_of_concept', value: 'proof_of_concept' },
          { label: 'wizard.options.prototype', value: 'prototype' },
          { label: 'wizard.options.market_ready', value: 'market_ready' }
        ],
        category: 'business_stage' as const,
        phase: 2 as const
      }
    ];
    
    if (index < genericQuestions.length) {
      return {
        ...genericQuestions[index],
        required: false,
        questionNumber: 0
      };
    }
    
    return null;
  }

  /**
   * Create fallback market question
   */
  private createMarketQuestion(): SymptomQuestion {
    return {
      id: 'market_focus',
      symptom: 'wizard.questions.marketFocus',
      type: 'single-select',
      options: [
        { label: 'wizard.options.local', value: 'local' },
        { label: 'wizard.options.national', value: 'national' },
        { label: 'wizard.options.european', value: 'european' },
        { label: 'wizard.options.global', value: 'global' }
      ],
      required: true,
      category: 'specific_requirements',
      phase: 3,
      questionNumber: 0
    };
  }

  /**
   * Create industry focus question from extracted criteria
   */
  private createIndustryFocusQuestion(industryPrograms: [string, number][]): SymptomQuestion {
    const options = industryPrograms.map(([key, count]) => {
      const industry = key.replace('industry_', '');
      return {
        label: `wizard.options.${industry}`,
        value: industry,
        description: `${count} programs available`
      };
    });

    return {
      id: 'industry_focus',
      symptom: 'wizard.questions.industryFocus',
      type: 'single-select',
      options: options,
      required: true,
      category: 'specific_requirements',
      phase: 2,
      questionNumber: 0
    };
  }

  private createCoFinancingQuestion(cofinancingPrograms: [string, number][]): SymptomQuestion {
    const options = cofinancingPrograms.map(([key, count]) => {
      const percent = key.replace('cofinancing_', '');
      return {
        label: `≥${percent}%`,
        value: percent,
        description: `${count} programs require this`
      };
    });

    return {
      id: 'co_financing',
      symptom: 'How much of your own money can you invest?',
      type: 'single-select',
      options,
      required: true,
      category: 'funding_need',
      phase: 2
    };
  }

  private createTRLQuestion(trlPrograms: [string, number][]): SymptomQuestion {
    // Standard TRL levels to ensure we always have complete options
    const allTRLLevels = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
    const trlCounts = new Map<string, number>();
    
    // Count from programs
    trlPrograms.forEach(([key, count]) => {
      const trl = key.replace('trl_', '').replace(/TRL\s*/gi, '').trim();
      if (trl && trl !== 'unknown') {
        trlCounts.set(trl, count);
      }
    });

    // Create options - include all TRL levels, but only show those that exist in programs
    const options = allTRLLevels.map(trl => {
      const count = trlCounts.get(trl) || 0;
      return {
        label: `TRL ${trl}`,
        value: trl,
        description: count > 0 ? `${count} programs require this level` : undefined
      };
    });

    // Add "Unknown" option if needed
    const hasUnknown = trlPrograms.some(([key]) => key.toLowerCase().includes('unknown'));
    if (hasUnknown) {
      options.push({
        label: 'Unknown',
        value: 'unknown',
        description: 'Not yet determined'
      });
    }

    return {
      id: 'trl_level',
      symptom: 'How developed is your project?',
      type: 'single-select',
      options,
      required: true,
      category: 'specific_requirements',
      phase: 2
    };
  }

  private createImpactQuestion(impactPrograms: [string, number][]): SymptomQuestion {
    const options = impactPrograms.map(([key, count]) => {
      const impact = key.replace('impact_', '');
      return {
        label: impact,
        value: impact,
        description: `${count} programs targeting this`
      };
    });

    return {
      id: 'impact',
      symptom: 'What impact will your project create?',
      type: 'multi-select',
      options,
      required: false,
      category: 'specific_requirements',
      phase: 2
    };
  }

  private createConsortiumQuestion(_consortiumPrograms: [string, number][]): SymptomQuestion {
    return {
      id: 'consortium',
      symptom: 'Do you have partners working with you?',
      type: 'single-select',
      options: [
        { label: 'Yes, we have partners', value: 'yes' },
        { label: 'No, working alone', value: 'no' }
      ],
      required: false,
      category: 'specific_requirements',
      phase: 2
    };
  }

  /**
   * AUTO-GENERATE question for ANY requirement type
   * This ensures questions adapt to new requirements automatically
   */
  private createAutoQuestion(
    requirementType: string,
    _category: string,
    count: number,
    allProgramsForType: [string, number][]
  ): SymptomQuestion | null {
    if (count < 3) return null; // Skip if too few programs

    const options = allProgramsForType.map(([key, programCount]) => {
      const value = key.replace(`${requirementType}_`, '');
      return {
        label: this.formatQuestionLabel(requirementType, value),
        value: value,
        description: `${programCount} programs require this`
      };
    });

    // Ensure we have options - if not, create default options
    let finalOptions = options;
    if (!finalOptions || finalOptions.length === 0) {
      console.warn(`⚠️ No options generated for ${requirementType}, creating defaults`);
      finalOptions = [
        { value: 'yes', label: 'Yes', description: 'Yes' },
        { value: 'no', label: 'No', description: 'No' }
      ];
    }

    // Determine question type - always use select, never text
    const questionType = requirementType.includes('multiple') ? 'multi-select' : 'single-select';

    return {
      id: requirementType,
      symptom: this.formatQuestionPrompt(requirementType),
      type: questionType,
      options: finalOptions,
      required: count > this.allPrograms.length * 0.5, // Required if >50% of programs need it
      category: 'specific_requirements',
      phase: 2,
      questionNumber: 0
    };
  }

  private formatQuestionLabel(requirementType: string, value: string): string {
    // Format label based on requirement type
    if (requirementType === 'target_group') {
      return value.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
    if (requirementType === 'funding_type') {
      return value.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
    if (requirementType === 'market_size') {
      return value.replace(/_/g, ' ');
    }
    // Fix TRL formatting - remove redundant "TRL" prefix
    if (requirementType === 'trl' || requirementType === 'trl_level') {
      if (value.includes('TRL')) {
        // Extract just the number if it's "TRL 3" or "Unknown TRL"
        const match = value.match(/TRL\s*(\d+)/i) || value.match(/(\d+)/);
        if (match) {
          return `TRL ${match[1]}`;
        }
        if (value.toLowerCase().includes('unknown')) {
          return 'Unknown';
        }
        return value.replace(/TRL\s*/gi, '').trim() || 'Unknown';
      }
      return value;
    }
    // General formatting: replace underscores, capitalize
    return value.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  private formatQuestionPrompt(requirementType: string): string {
    const prompts: Record<string, string> = {
      'target_group': 'Who is your target group?',
      'funding_type': 'What type of funding are you seeking?',
      'market_size': 'What is your target market size?',
      'use_of_funds': 'How will you use the funds?',
      'revenue_model': 'What is your revenue model?',
      'capex_opex': 'Are you seeking CAPEX or OPEX funding?',
      'compliance': 'Do you need compliance certifications?',
      'documents': 'Do you have the required documents?'
    };
    return prompts[requirementType] || `What is your ${requirementType}?`;
  }

  /**
   * DYNAMIC: Generate contextual follow-up questions based on remaining programs
   * Analyzes what requirements need clarification instead of hardcoded checks
   */
  private generateContextualQuestions(answers: Record<string, any>): void {
    const needsClarification = this.analyzeRemainingProgramRequirements(answers);
    
    // CRITICAL: Always generate contextual questions if we have fewer than 12 questions total
    // This ensures we reach the minimum question count
    const currentQuestionCount = this.questions.length;
    const answerCount = Object.keys(answers).length;
    
    console.log(`📋 Generating contextual questions: ${currentQuestionCount} questions exist, ${answerCount} answers given`);
    
    for (const need of needsClarification) {
      const question = this.createDynamicContextualQuestion(need);
      if (!this.questions.find(q => q.id === question.id)) {
        this.questions.push(question);
        console.log(`📋 Added contextual question: ${question.id} from ${need.programCount} programs needing clarification`);
      }
    }
    
    // If still not enough questions, generate more based on remaining programs
    if (currentQuestionCount < 12 && answerCount < 12) {
      console.log(`⚠️ Still only ${currentQuestionCount} questions, generating more contextual questions`);
      this.generateAdditionalContextualQuestions(answers);
    }
  }

  /**
   * Generate additional contextual questions when we need more
   */
  private generateAdditionalContextualQuestions(_answers: Record<string, any>): void {
    // Analyze what we haven't asked about yet
    const askedCategories = new Set(
      this.questions.map(q => q.category).filter(Boolean)
    );
    
    // Generate questions for missing categories
    const allCategories: Array<'location' | 'business_stage' | 'funding_need' | 'team_size' | 'innovation_level' | 'specific_requirements'> = 
      ['location', 'business_stage', 'funding_need', 'team_size', 'innovation_level', 'specific_requirements'];
    const missingCategories = allCategories.filter(cat => !askedCategories.has(cat));
    
    for (const category of missingCategories.slice(0, 5)) { // Max 5 more
      const question = this.createQuestionForCategory(category);
      if (question && !this.questions.find(q => q.id === question.id)) {
        this.questions.push(question);
        console.log(`📋 Added category question: ${question.id} for category ${category}`);
      }
    }
  }

  /**
   * Create a question for a specific category
   */
  private createQuestionForCategory(category: string): SymptomQuestion | null {
    switch (category) {
      case 'business_stage':
        return this.createBusinessStageQuestion();
      case 'funding_need':
        return this.createFundingNeedQuestion();
      case 'innovation_level':
        return this.createInnovationLevelQuestion();
      case 'team_size':
        return this.createTeamExperienceQuestion();
      case 'specific_requirements':
        return this.createMarketQuestion();
      default:
        return null;
    }
  }

  /**
   * NEW: Analyze remainingPrograms for requirements needing clarification
   */
  private analyzeRemainingProgramRequirements(answers: Record<string, any>): Array<{field: string, category: string, programCount: number, values: string[]}> {
    const needsClarification: Array<{field: string, category: string, programCount: number, values: string[]}> = [];
    const valueFrequency = new Map<string, number>();
    
    for (const program of this.remainingPrograms) {
      const categorized = (program as any).categorized_requirements;
      
      if (!categorized) continue;

      // Check geographic detail if location answered but not detail
      if (answers.location && categorized.geographic && !answers.geographic_detail) {
        for (const geoReq of categorized.geographic) {
          if (geoReq.type === 'location_detail' || geoReq.type === 'region' || geoReq.type === 'city') {
            const key = `geographic_${geoReq.value}`;
            valueFrequency.set(key, (valueFrequency.get(key) || 0) + 1);
          }
        }
      }
      
      // Check consortium detail if consortium answered but not detail
      if (answers.consortium && categorized.consortium && !answers.consortium_detail) {
        for (const consReq of categorized.consortium) {
          if (consReq.type === 'partner_count' || consReq.type === 'team_size') {
            const key = `consortium_${consReq.value}`;
            valueFrequency.set(key, (valueFrequency.get(key) || 0) + 1);
          }
        }
      }
      
      // Check funding amount detail if type answered but not range
      if (answers.funding_type && categorized.financial && !answers.funding_range) {
        for (const finReq of categorized.financial) {
          if (finReq.type === 'funding_range' || finReq.type === 'amount') {
            const key = `financial_${finReq.value}`;
            valueFrequency.set(key, (valueFrequency.get(key) || 0) + 1);
          }
        }
      }
    }
    
    // Add to needsClarification if significant programs need it
    if (valueFrequency.has('geographic_') || Array.from(valueFrequency.keys()).some(k => k.startsWith('geographic_'))) {
      const geoValues = Array.from(valueFrequency.entries())
        .filter(([key]) => key.startsWith('geographic_'))
        .map(([key, count]) => ({ value: key.replace('geographic_', ''), count }));
      
      if (geoValues.length >= 2) {
        needsClarification.push({
          field: 'geographic_detail',
          category: 'geographic',
          programCount: geoValues.reduce((sum, v) => sum + v.count, 0),
          values: geoValues.map(v => v.value)
        });
      }
    }
    
    if (valueFrequency.has('consortium_') || Array.from(valueFrequency.keys()).some(k => k.startsWith('consortium_'))) {
      const consValues = Array.from(valueFrequency.entries())
        .filter(([key]) => key.startsWith('consortium_'))
        .map(([key, count]) => ({ value: key.replace('consortium_', ''), count }));
      
      if (consValues.length >= 2) {
        needsClarification.push({
          field: 'consortium_detail',
          category: 'consortium',
          programCount: consValues.reduce((sum, v) => sum + v.count, 0),
          values: consValues.map(v => v.value)
        });
      }
    }
    
    return needsClarification;
  }

  /**
   * NEW: Create contextual question dynamically from requirement analysis
   */
  private createDynamicContextualQuestion(need: {field: string, category: string, programCount: number, values: string[]}): SymptomQuestion {
    const options = this.extractOptionsFromPrograms(need);
    
    return {
      id: need.field,
      symptom: this.getContextualQuestionPrompt(need.field),
      type: 'single-select',
      options,
      required: false,
      category: need.category as any,
      phase: 2,
      questionNumber: 0
    };
  }

  /**
   * NEW: Extract options from programs dynamically
   */
  private extractOptionsFromPrograms(need: {field: string, category: string, programCount: number, values: string[]}): Array<{value: string, label: string, description?: string}> {
    const valueCount = new Map<string, number>();
    
    for (const program of this.remainingPrograms) {
      const categorized = (program as any).categorized_requirements;
      if (!categorized) continue;
      
      if (need.category === 'geographic' && categorized.geographic) {
        for (const req of categorized.geographic) {
          if (req.type === 'location_detail' || req.type === 'region' || req.type === 'city') {
            const value = String(req.value || '').trim();
            if (value) {
              const count = valueCount.get(value) || 0;
              valueCount.set(value, count + 1);
            }
          }
        }
      }
      
      if (need.category === 'consortium' && categorized.consortium) {
        for (const req of categorized.consortium) {
          if (req.type === 'partner_count' || req.type === 'team_size') {
            const value = String(req.value || '').trim();
            if (value) {
              const count = valueCount.get(value) || 0;
              valueCount.set(value, count + 1);
            }
          }
        }
      }
      
      // Also check for required_documents and other fields
      if (need.field === 'required_documents' && categorized.documents) {
        for (const doc of categorized.documents) {
          const value = String(doc.type || doc.value || '').trim();
          if (value) {
            const count = valueCount.get(value) || 0;
            valueCount.set(value, count + 1);
          }
        }
      }
    }
    
    // Convert to options, sorted by frequency
    const options = Array.from(valueCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10) // Limit to top 10 to avoid overwhelming UI
      .map(([value, count]) => ({
        value: value || 'unknown',
        label: this.formatLabel(value),
        description: `${count} programs require this`
      }));
    
    // If we still have no options, return empty array (will be handled by caller)
    return options;
  }

  /**
   * NEW: Get question prompt based on field
   */
  private getContextualQuestionPrompt(field: string): string {
    const prompts: Record<string, string> = {
      'geographic_detail': 'What is your specific location?',
      'consortium_detail': 'How many partners do you need?',
      'funding_range': 'What funding range are you seeking?',
      'partner_count': 'How many partners do you have?'
    };
    return prompts[field] || `What is your ${field}?`;
  }

  private formatLabel(value: string): string {
    return value
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  }
}
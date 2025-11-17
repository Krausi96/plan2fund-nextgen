/**
 * ProgramFinder - Unified interface for SmartWizard and Advanced Search
 * Simplified version without QuestionEngine - uses static form
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import { Wand2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card } from '@/shared/components/ui/card';
// Progress bar implemented with custom div (not using Progress component)
import { scoreProgramsEnhanced, EnhancedProgramResult } from '@/features/reco/engine/enhancedRecoEngine';
import { useI18n } from '@/shared/contexts/I18nContext';

// Path Indicator Component
function PathIndicator({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  return (
    <div className="text-center">
      <div className="flex items-center justify-center">
        <div className="relative flex-1 max-w-md h-2 bg-gray-200 rounded-full overflow-visible">
          <div 
            className="h-full bg-blue-600 transition-all duration-300 rounded-full"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
          <span 
            className="absolute text-xs text-gray-700 font-semibold whitespace-nowrap"
            style={{ 
              left: `${Math.min((currentStep / totalSteps) * 100, 85)}%`,
              top: '50%',
              transform: 'translateY(-50%)',
              marginLeft: '4px'
            }}
          >
            {currentStep}/{totalSteps}
          </span>
        </div>
      </div>
    </div>
  );
}

interface ProgramFinderProps {
  onProgramSelect?: (programId: string, route: string) => void;
}

// Static questions - optimized order and with skip logic
// CRITICAL QUESTIONS (used in matching logic - required for MIN_QUESTIONS_FOR_RESULTS):
// 1. company_type - CRITICAL (line 185 in recommend.ts - must match)
// 2. location - CRITICAL (line 156 in recommend.ts - must match)
// 3. funding_amount - Used in matching (line 250 in recommend.ts)
// 4. company_stage - Used in matching (line 215 in recommend.ts)
// OPTIONAL QUESTIONS (used in matching but not critical):
// 5. industry_focus - Used in matching (line 273 in recommend.ts)
// 6. co_financing - Used in matching (line 288 in recommend.ts)
// NOT USED IN MATCHING (can be removed or made optional):
// - legal_type, team_size, revenue_status, use_of_funds, impact, deadline_urgency, project_duration
  const CORE_QUESTIONS = [
  {
    id: 'company_type', // CRITICAL - Used in matching (must match)
    label: 'What type of company are you?',
    type: 'single-select' as const,
    options: [
      { value: 'prefounder', label: 'Pre-founder (Idea Stage)' },
      { value: 'startup', label: 'Startup' },
      { value: 'sme', label: 'SME (Small/Medium Enterprise)' },
      { value: 'research', label: 'Research Institution' },
      { value: 'other', label: 'Other' },
    ],
    required: false,
    priority: 1,
    hasOtherTextInput: true,
    hasLegalType: true, // Enable conditional legal type dropdown
    isAdvanced: false, // Core question
  },
  {
    id: 'location', // CRITICAL - Used in matching (must match)
    label: 'Where is your company based?',
    type: 'single-select' as const,
    options: [
      { value: 'austria', label: 'Austria' },
      { value: 'germany', label: 'Germany' },
      { value: 'eu', label: 'EU' },
      { value: 'international', label: 'International' },
    ],
    required: false,
    priority: 2,
    isAdvanced: false, // Core question
    // Optional region input (text field, not dropdown)
    hasOptionalRegion: (value: string) => {
      return value === 'austria' || value === 'germany' || value === 'eu' || value === 'international';
    },
  },
  {
    id: 'funding_amount', // CRITICAL - Used in matching
    label: 'How much funding do you need?',
    type: 'range' as const,
    min: 0,
    max: 2000000,
    step: 1000,
    unit: 'EUR',
    required: false,
    priority: 3,
    editableValue: true, // Allow editing the number directly
    isAdvanced: false, // Core question
  },
  {
    id: 'industry_focus', // OPTIONAL - Used in matching but not critical
    label: 'What industry are you in?',
    type: 'multi-select' as const,
    options: [
      { value: 'digital', label: 'Digital/ICT' },
      { value: 'sustainability', label: 'Sustainability/Green Tech' },
      { value: 'health', label: 'Health/Life Sciences' },
      { value: 'manufacturing', label: 'Manufacturing' },
      { value: 'export', label: 'Export/International' },
      { value: 'other', label: 'Other' },
    ],
    required: false,
    priority: 4,
    hasOtherTextInput: true,
    isAdvanced: false, // Core question - helps with matching
    // Enhanced: Industry subcategories for better matching
    subCategories: {
      digital: [
        { value: 'ai', label: 'AI/Machine Learning' },
        { value: 'fintech', label: 'FinTech' },
        { value: 'healthtech', label: 'HealthTech' },
        { value: 'edtech', label: 'EdTech' },
        { value: 'iot', label: 'IoT' },
        { value: 'blockchain', label: 'Blockchain' },
        { value: 'cybersecurity', label: 'Cybersecurity' },
        { value: 'cloud_computing', label: 'Cloud Computing' },
        { value: 'software_development', label: 'Software Development' },
      ],
      sustainability: [
        { value: 'greentech', label: 'GreenTech' },
        { value: 'cleantech', label: 'CleanTech' },
        { value: 'circular_economy', label: 'Circular Economy' },
        { value: 'renewable_energy', label: 'Renewable Energy' },
        { value: 'climate_tech', label: 'Climate Tech' },
        { value: 'waste_management', label: 'Waste Management' },
        { value: 'water_management', label: 'Water Management' },
        { value: 'sustainable_agriculture', label: 'Sustainable Agriculture' },
      ],
      health: [
        { value: 'biotech', label: 'Biotech' },
        { value: 'medtech', label: 'MedTech' },
        { value: 'pharma', label: 'Pharmaceuticals' },
        { value: 'digital_health', label: 'Digital Health' },
        { value: 'medical_devices', label: 'Medical Devices' },
        { value: 'diagnostics', label: 'Diagnostics' },
        { value: 'therapeutics', label: 'Therapeutics' },
      ],
      manufacturing: [
        { value: 'industry_4_0', label: 'Industry 4.0' },
        { value: 'smart_manufacturing', label: 'Smart Manufacturing' },
        { value: 'robotics', label: 'Robotics' },
        { value: 'automation', label: 'Automation' },
        { value: 'additive_manufacturing', label: 'Additive Manufacturing (3D Printing)' },
        { value: 'advanced_materials', label: 'Advanced Materials' },
        { value: 'quality_control', label: 'Quality Control & Testing' },
      ],
      export: [
        { value: 'export_eu', label: 'EU Export' },
        { value: 'export_global', label: 'Global Export' },
        { value: 'export_services', label: 'Export Services' },
        { value: 'export_products', label: 'Export Products' },
        { value: 'export_technology', label: 'Export Technology' },
      ],
    },
  },
  {
    id: 'co_financing', // OPTIONAL - Used in matching but not critical
    label: 'Can you provide co-financing?',
    type: 'single-select' as const,
    options: [
      { value: 'co_yes', label: 'Yes' },
      { value: 'co_no', label: 'No' },
      { value: 'co_uncertain', label: 'Uncertain' },
    ],
    required: false,
    priority: 5, // Moved up - helps with matching
    hasCoFinancingPercentage: true, // Ask for percentage if Yes
    isAdvanced: false, // Core question
  },
  {
    id: 'impact', // NOT USED IN MATCHING - Advanced/optional
    label: 'What impact does your project have?',
    type: 'multi-select' as const,
    options: [
      { value: 'economic', label: 'Economic (Jobs, Growth)' },
      { value: 'social', label: 'Social (Community, Society)' },
      { value: 'environmental', label: 'Environmental (Climate, Sustainability)' },
      { value: 'other', label: 'Other' },
    ],
    required: false,
    priority: 6,
    hasOtherTextInput: true, // Show text field when "other" is selected
    hasImpactDetails: true, // Allow specifying details for each impact type
    isAdvanced: true, // Advanced question - hide by default
  },
  {
    id: 'company_stage', // CRITICAL - Used in matching
    label: 'What stage is your company at?',
    type: 'range' as const,
    min: -12,
    max: 36,
    step: 6,
    unit: 'months',
    required: false,
    priority: 4, // Moved up - this is critical!
    editableValue: false, // Slider only, no direct input
    isAdvanced: false, // Core question
  },
  {
    id: 'use_of_funds', // NOT USED IN MATCHING - Advanced/optional
    label: 'How will you use the funds?',
    type: 'multi-select' as const,
    options: [
      { value: 'rd', label: 'Research & Development' },
      { value: 'personnel', label: 'Personnel/Hiring' },
      { value: 'equipment', label: 'Equipment/Infrastructure' },
      { value: 'marketing', label: 'Marketing' },
      { value: 'working_capital', label: 'Working Capital' },
      { value: 'other', label: 'Other' },
    ],
    required: false,
    priority: 7,
    hasOtherTextInput: true, // Show text field when "other" is selected
    allowMultipleOther: true, // Allow multiple "other" entries
    isAdvanced: true, // Advanced question - hide by default
  },
  {
    id: 'project_duration', // NOT USED IN MATCHING - Advanced/optional
    label: 'How long is your project?',
    type: 'range' as const,
    min: 1,
    max: 36,
    step: 1,
    unit: 'months',
    required: false,
    priority: 8,
    editableValue: true, // Allow editing the number directly
    isAdvanced: true, // Advanced question - hide by default
  },
  {
    id: 'deadline_urgency', // NOT USED IN MATCHING - Advanced/optional
    label: 'When do you need funding by?',
    type: 'range' as const,
    min: 1,
    max: 12,
    step: 1,
    unit: 'months',
    required: false,
    priority: 9,
    editableValue: true, // Allow editing the number directly
    isAdvanced: true, // Advanced question - hide by default
    skipIf: (answers: Record<string, any>) => {
      const duration = answers.project_duration;
      // Skip if project duration is more than 36 months (3 years)
      if (typeof duration === 'number' && duration > 36) return true;
      return false;
    },
  },
  {
    id: 'revenue_status', // NOT USED IN MATCHING - Advanced/optional
    label: 'What is your current revenue status?',
    type: 'single-select' as const,
    options: [
      { value: 'pre_revenue', label: 'Pre-revenue' },
      { value: 'early_revenue', label: 'Early revenue (< €1M)' },
      { value: 'growing_revenue', label: 'Growing revenue (€1M+)' },
      { value: 'not_applicable', label: 'Not applicable' },
    ],
    required: false,
    priority: 10,
    isAdvanced: true, // Advanced question - hide by default
    skipIf: (answers: Record<string, any>) => {
      // Only skip for very early stages where revenue doesn't make sense
      return answers.company_stage === 'idea' || 
             answers.company_stage === 'pre_company';
    },
  },
  {
    id: 'team_size', // NOT USED IN MATCHING - Advanced/optional
    label: 'How many people are in your team?',
    type: 'range' as const,
    min: 1,
    max: 50,
    step: 1,
    unit: 'people',
    quickSelectOptions: [
      { value: '1to2', label: '1-2 people', min: 1, max: 2 },
      { value: '3to5', label: '3-5 people', min: 3, max: 5 },
      { value: '6to10', label: '6-10 people', min: 6, max: 10 },
      { value: 'over10', label: 'Over 10 people', min: 10, max: 50 },
    ],
    required: false,
    priority: 11,
    editableValue: true, // Allow editing the number directly
    isAdvanced: true, // Advanced question - hide by default
  },
];

export default function ProgramFinder({ 
  onProgramSelect
}: ProgramFinderProps) {
  const router = useRouter();
  const { t, locale } = useI18n();
  
  // Get translated questions
  const getTranslatedQuestions = useMemo(() => {
    return CORE_QUESTIONS.map(q => ({
      ...q,
      label: (t(`reco.questions.${q.id}` as any) as string) || q.label,
      options: (q as any).options ? (q as any).options.map((opt: any) => ({
        ...opt,
        label: (t(`reco.options.${q.id}.${opt.value}` as any) as string) || opt.label
      })) : []
    }));
  }, [t]);
  const [results, setResults] = useState<EnhancedProgramResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Guided mode state
  const [answers, setAnswers] = useState<Record<string, any>>({});
  
  // All questions are visible by default - no progressive disclosure
  // Results only shown after ALL questions are answered
  
  // Horizontal question navigation (carousel)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  
  // Mobile: Track active tab (questions vs results)
  const [mobileActiveTab, setMobileActiveTab] = useState<'questions' | 'results'>('questions');
  
  // A/B Testing: Explanation variant (A=Score-First, B=LLM-First, C=LLM-Only)
  const [_explanationVariant] = useState<'A' | 'B' | 'C'>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('explanationVariant');
      if (stored && ['A', 'B', 'C'].includes(stored)) return stored as 'A' | 'B' | 'C';
      // Random assignment on first visit (33% each)
      const variant = ['A', 'B', 'C'][Math.floor(Math.random() * 3)] as 'A' | 'B' | 'C';
      localStorage.setItem('explanationVariant', variant);
      return variant;
    }
    return 'A';
  });
  

  // Get visible questions (with skip logic)
  const getVisibleQuestions = () => {
    return getTranslatedQuestions.filter(q => {
      // Skip if skipIf condition is met
      if (q.skipIf && q.skipIf(answers)) return false;
      // Always show advanced questions (toggle removed)
      return true;
    });
  };
  
  const visibleQuestions = getVisibleQuestions();
  
  // Ensure currentQuestionIndex is within bounds
  useEffect(() => {
    if (currentQuestionIndex >= visibleQuestions.length && visibleQuestions.length > 0) {
      setCurrentQuestionIndex(visibleQuestions.length - 1);
    }
  }, [visibleQuestions.length, currentQuestionIndex]);
  
  
  // Count only non-empty answers (fix logic flaw)
  // Only count main question IDs, exclude sub-options and sub-categories
  const mainQuestionIds = getTranslatedQuestions.map(q => q.id);
  const answeredCount = mainQuestionIds.filter(questionId => {
    const value = answers[questionId];
    if (value === undefined || value === null || value === '') {
      return false;
    }
    // Don't count "not_applicable" or "no_partnerships" as valid answers
    if (value === 'not_applicable' || value === 'no_partnerships') {
      return false;
    }
    if (Array.isArray(value)) {
      // For arrays, exclude if empty or only contains "not_applicable"/"no_partnerships"
      return value.length > 0 && !value.every(v => v === 'not_applicable' || v === 'no_partnerships');
    }
    return true;
  }).length;
  
  // Minimum questions for results (4 critical questions: location, company_type, funding_amount, company_stage)
  const MIN_QUESTIONS_FOR_RESULTS = 4;
  const hasEnoughAnswers = answeredCount >= MIN_QUESTIONS_FOR_RESULTS;
  
  // Reserved for future use - commented out to pass TypeScript checks
  /* eslint-disable @typescript-eslint/no-unused-vars */
  // @ts-ignore
  const _updateGuidedResults = useCallback(async () => {
    // Require at least MIN_QUESTIONS_FOR_RESULTS to fetch results
    if (!hasEnoughAnswers) {
      setResults([]);
      return;
    }
    
    let timeoutId: NodeJS.Timeout | null = null;
    try {
      setIsLoading(true);
      
      // Add timeout to prevent infinite loading
      timeoutId = setTimeout(() => {
        setIsLoading(false);
        console.error('Request timeout');
        alert('Request timed out. Please try again.');
      }, 60000); // 60 second timeout (LLM can take time)
      
      // Use on-demand recommendation API
      // LLM generation is primary (unrestricted, like ChatGPT)
      // Seed extraction is optional (set USE_SEED_EXTRACTION=true to enable)
      const response = await fetch('/api/programs/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers,
          max_results: 20,
          extract_all: false,
          use_seeds: false, // LLM generation is primary, seeds are optional
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to fetch recommendations: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      const extractedPrograms = data.programs || [];
      
      // Log extraction results for debugging
      const extractionResults = data.extraction_results || data.extractionResults || [];
      if (extractionResults.length > 0) {
        console.log('📊 Extraction results:', extractionResults);
        const llmResult = extractionResults.find((r: any) => r.source === 'llm_generated');
        if (llmResult) {
          if (llmResult.error) {
            console.error('❌ LLM generation error:', llmResult.error, llmResult.details);
            if (llmResult.error.includes('No LLM available')) {
              alert('LLM is not configured. Please set OPENAI_API_KEY or CUSTOM_LLM_ENDPOINT environment variable.');
            }
          } else {
            console.log('✅ LLM generation:', llmResult.message);
          }
        }
      }
      
      if (extractedPrograms.length === 0) {
        console.warn('⚠️ No programs returned from API');
        console.warn('API response:', JSON.stringify(data, null, 2));
        console.warn('Answers sent:', JSON.stringify(answers, null, 2));
        // Show user-friendly message
        if (data.error) {
          console.error('API Error:', data.error, data.message);
          alert(`Error generating programs: ${data.message || data.error}. Please check your LLM configuration (OPENAI_API_KEY or CUSTOM_LLM_ENDPOINT).`);
        } else {
          console.warn('API returned success but no programs. Check LLM response.');
          alert('No programs were generated. Please try again or check server logs for details.');
        }
        setResults([]);
        return;
      }
      
      console.log(`✅ API returned ${extractedPrograms.length} programs`);
      
      // Convert extracted programs to Program format
      const programsForScoring = extractedPrograms.map((p: any) => ({
        id: p.id,
        name: p.name,
        type: p.funding_types?.[0] || 'grant',
        program_type: p.funding_types?.[0] || 'grant',
        description: p.metadata?.description || '',
        funding_amount_max: p.metadata?.funding_amount_max || 0,
        funding_amount_min: p.metadata?.funding_amount_min || 0,
        currency: p.metadata?.currency || 'EUR',
        source_url: p.url,
        url: p.url,
        deadline: p.metadata?.deadline,
        open_deadline: p.metadata?.open_deadline || false,
        contact_email: p.metadata?.contact_email,
        contact_phone: p.metadata?.contact_phone,
        eligibility_criteria: {},
        categorized_requirements: p.categorized_requirements || {},
        region: p.metadata?.region,
        funding_types: p.funding_types || [],
        program_focus: p.metadata?.program_focus || [],
      }));
      
      // Score the programs
      console.log(`📊 Scoring ${programsForScoring.length} programs with answers:`, Object.keys(answers));
      const scored = await scoreProgramsEnhanced(answers, 'strict', programsForScoring);
      
      // Log score distribution for debugging
      const scoreDistribution = scored.map(p => ({ name: p.name, score: p.score }));
      console.log('📈 Score distribution:', scoreDistribution);
      
      // Show ALL programs sorted by score (even with score 0) - let user see what's available
      // Sort by score (highest first), then take top 5
      const sorted = scored.sort((a, b) => b.score - a.score);
      const top5 = sorted.slice(0, 5);
      
      console.log(`✅ Scored ${scored.length} programs, showing top ${top5.length}`);
      console.log('📊 Top programs:', top5.map(p => ({ name: p.name, score: p.score })));
      
      // Always set results if we have any programs
      if (top5.length > 0) {
        setResults(top5);
      } else {
        console.warn('⚠️ No programs to display after scoring');
        setResults([]);
      }
      
      // Store in localStorage for persistence
      if (typeof window !== 'undefined') {
        localStorage.setItem('recoResults', JSON.stringify(scored));
        localStorage.setItem('userAnswers', JSON.stringify(answers));
      }
    } catch (error: any) {
      console.error('Error updating guided results:', error);
      setResults([]);
      // Show user-friendly error message
      alert(`Error generating recommendations: ${error.message || 'Unknown error'}. Please try again.`);
    } finally {
      setIsLoading(false);
      if (timeoutId) clearTimeout(timeoutId);
    }
  }, [answers, hasEnoughAnswers]);
  
  // State to control when to show results
  const [_showResults, _setShowResults] = useState(false);
  
  // State for raw input values (to allow typing without formatting interference)
  const [rawInputValues, setRawInputValues] = useState<Record<string, string>>({});
  
  // Only update results when user explicitly requests them (after completing or clicking button)
  // Don't auto-update on every answer change
  
  const handleAnswer = useCallback((questionId: string, value: any) => {
    setAnswers((prevAnswers) => {
      const newAnswers = { ...prevAnswers, [questionId]: value };
      console.log('handleAnswer called:', { questionId, value, newAnswers });
      return newAnswers;
    });
  }, []);

  // Initialize company_stage classification if months value exists but classification doesn't
  useEffect(() => {
    if (typeof answers.company_stage === 'number' && !answers.company_stage_classified) {
      const months = answers.company_stage;
      let stage = 'pre_company';
      if (months < 0) {
        stage = 'pre_company';
      } else if (months < 6) {
        stage = 'early_stage';
      } else if (months < 12) {
        stage = 'launch_stage';
      } else if (months < 24) {
        stage = 'growth_stage';
      } else if (months < 36) {
        stage = 'established';
      } else {
        stage = 'mature';
      }
      handleAnswer('company_stage_classified', stage);
    }
  }, [answers.company_stage, answers.company_stage_classified, handleAnswer]);

  // Reserved for future use - commented out to pass TypeScript checks
  /* eslint-disable @typescript-eslint/no-unused-vars */
  // @ts-ignore
  const _handleProgramSelect = (program: EnhancedProgramResult) => {
    // Store program data in localStorage (programs don't have stable IDs)
    // Editor will read this data directly instead of fetching by ID
    // Include timestamp so editor knows when it was selected
    if (typeof window !== 'undefined') {
      const programData = {
        id: program.id,
        name: program.name || program.id,
        categorized_requirements: program.categorized_requirements || {},
        type: program.type || 'grant',
        url: program.url || program.source_url,
        selectedAt: new Date().toISOString(), // Track when program was selected
        // Store any other relevant data
        metadata: {
          funding_amount_min: program.amount?.min,
          funding_amount_max: program.amount?.max,
          currency: program.amount?.currency || 'EUR',
        }
      };
      localStorage.setItem('selectedProgram', JSON.stringify(programData));
    }
    
    // Navigate to editor (no programId in URL - editor reads from localStorage)
    if (onProgramSelect) {
      onProgramSelect(program.id, 'grant'); // Default route
    } else {
      router.push(`/editor?product=submission`);
    }
  };
  
  // Removed handleViewAllResults - results are shown inline in ProgramFinder
  
  // Helper function to format answer for display
  const formatAnswerForDisplay = (questionId: string, value: any): string => {
    if (value === undefined || value === null || value === '') return '';
    
    const question = getTranslatedQuestions.find(q => q.id === questionId);
    if (!question) return String(value);
    
    if (question.type === 'single-select') {
      const option = question.options?.find((opt: any) => opt.value === value);
      if (option) {
        let display = option.label;
        // Add region if present
        if (answers[`${questionId}_region`]) {
          display += `, ${answers[`${questionId}_region`]}`;
        }
        // Add "other" text if present
        if (value === 'other' && answers[`${questionId}_other`]) {
          display += `: ${answers[`${questionId}_other`]}`;
        }
        // Add percentage if co-financing
        if (questionId === 'co_financing' && value === 'co_yes' && answers[`${questionId}_percentage`]) {
          display += ` (${answers[`${questionId}_percentage`]})`;
        }
        return display;
      }
    } else if (question.type === 'multi-select' && Array.isArray(value)) {
      const selectedOptions = value
        .map((v: string) => {
          const option = question.options?.find((opt: any) => opt.value === v);
          return option ? option.label : v;
        })
        .filter(Boolean);
      let display = selectedOptions.join(', ');
      // Add "other" text if present
      if (value.includes('other') && answers[`${questionId}_other`]) {
        const otherText = Array.isArray(answers[`${questionId}_other`]) 
          ? answers[`${questionId}_other`].join(', ')
          : answers[`${questionId}_other`];
        display += `: ${otherText}`;
      }
      return display;
    } else if (question.type === 'range') {
      if (typeof value === 'number') {
        if (question.unit === 'EUR') {
          return `€${value.toLocaleString('de-DE')}`;
        } else if (question.unit === 'months') {
          return `${value} ${t('reco.ui.sliderMonths') || 'months'}`;
        } else if (question.unit === 'people') {
          return `${value} ${t('reco.ui.sliderPeople') || 'people'}`;
        }
        return `${value} ${question.unit}`;
      }
    }
    
    return String(value);
  };
  
  // State for answers summary collapse
  const [answersSummaryExpanded, setAnswersSummaryExpanded] = useState(false);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className={`max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-2 ${answeredCount > 0 ? 'pb-24' : ''}`}>
        {/* Header - Centered with Wizard Icon - Better Spacing */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center shadow-lg">
              <Wand2 className="w-6 h-6 text-yellow-400" />
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">
              {t('reco.pageTitle')}
            </h1>
          </div>
          <p className="text-gray-600 text-base sm:text-lg mb-8">
            {t('reco.pageSubtitle')}
          </p>
          
          {/* Scroll Indicator - Animated arrow pointing down */}
          {answeredCount === 0 && (
            <div className="flex justify-center mb-4">
              <button
                onClick={() => {
                  const questionsSection = document.querySelector('[data-questions-section]');
                  if (questionsSection) {
                    questionsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
                className="flex flex-col items-center gap-2 animate-bounce hover:opacity-80 transition-opacity cursor-pointer"
              >
                <p className="text-sm text-gray-500 font-medium text-center">
                  {locale === 'de' ? 'Scrollen Sie nach unten, um zu beginnen' : 'Scroll down to begin'}
                </p>
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </button>
            </div>
          )}
          
          {results.length > 0 && (
            <div className="mt-2 text-sm text-gray-600">
              {results.length} program{results.length !== 1 ? 's' : ''} found
            </div>
          )}
        </div>
        
        {/* Mobile: Tab Toggle (only on mobile) */}
        <div className="lg:hidden mb-4">
          <div className="flex bg-white rounded-lg border border-gray-200 p-1">
            <button
              onClick={() => setMobileActiveTab('questions')}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                mobileActiveTab === 'questions'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {t('reco.ui.questions') || 'Questions'}
            </button>
            <button
              onClick={() => setMobileActiveTab('results')}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                mobileActiveTab === 'results'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {t('reco.ui.results') || 'Results'} ({results.length})
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-2" data-questions-section>
          {/* Answers Summary Section - Fixed Position, Non-Overlapping */}
          {answeredCount > 0 && (
            <div className="fixed right-6 top-32 z-30 max-w-xs">
              <Card className="p-3 bg-white border-2 border-blue-100 shadow-xl">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">📊</span>
                    <h2 className="text-sm font-semibold text-gray-800">
                      {answeredCount}/{visibleQuestions.length}
                    </h2>
                  </div>
                  <button
                    onClick={() => setAnswersSummaryExpanded(!answersSummaryExpanded)}
                    className="text-gray-500 hover:text-gray-700 transition-colors p-1"
                    aria-label={answersSummaryExpanded ? 'Collapse' : 'Expand'}
                  >
                    {answersSummaryExpanded ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    )}
                  </button>
                </div>
                
                
                {answersSummaryExpanded && (
                  <div className="mt-2 pt-2 border-t border-gray-200 max-h-96 overflow-y-auto">
                    <div className="space-y-1.5 text-xs">
                      {visibleQuestions.map((q, idx) => {
                        const value = answers[q.id];
                        const isAnswered = value !== undefined && value !== null && value !== '' && 
                                         !(Array.isArray(value) && value.length === 0);
                        const formattedAnswer = isAnswered ? formatAnswerForDisplay(q.id, value) : null;
                        
                        return (
                          <div key={q.id} className="flex items-start gap-2 p-1.5 hover:bg-gray-50 rounded">
                            <span className={`flex-shrink-0 mt-0.5 ${isAnswered ? 'text-green-600' : 'text-gray-400'}`}>
                              {isAnswered ? (
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                              ) : (
                                <span className="text-xs">-</span>
                              )}
                            </span>
                            <div className="flex-1 min-w-0">
                              <span className="font-medium text-gray-700">Q{idx + 1}:</span>{' '}
                              {formattedAnswer ? (
                                <span className="text-gray-900 break-words text-xs">{formattedAnswer}</span>
                              ) : (
                                <span className="text-gray-400 italic text-xs">{t('reco.ui.notAnswered') || 'Not answered'}</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </Card>
            </div>
          )}
          
          {/* Questions/Filters - More Visually Separated */}
          <div className={`${mobileActiveTab === 'results' ? 'hidden lg:block' : ''}`}>
            <Card className="p-4 max-w-2xl mx-auto w-full bg-gradient-to-br from-white to-blue-50/30 border-2 border-blue-300 shadow-lg">
              <div className="space-y-3">
                  {/* Path Indicator with Typing Animation */}
                  <div className="mb-4">
                    <PathIndicator currentStep={currentQuestionIndex + 1} totalSteps={visibleQuestions.length} />
                  </div>
                  
                  {/* Horizontal Question Navigation */}
                  {visibleQuestions.length > 0 && (
                    <div className="relative">
                      {/* Question Navigation Dots - More Compact */}
                      <div className="flex justify-center gap-1 mb-2 flex-wrap">
                        {visibleQuestions.map((_, idx) => {
                          const q = visibleQuestions[idx];
                          const isAnswered = answers[q.id] !== undefined && answers[q.id] !== null && answers[q.id] !== '' && 
                                           !(Array.isArray(answers[q.id]) && answers[q.id].length === 0);
                          return (
                            <button
                              key={idx}
                              onClick={() => setCurrentQuestionIndex(idx)}
                              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                                idx === currentQuestionIndex
                                  ? 'bg-blue-600 text-white shadow-lg scale-110'
                                  : isAnswered
                                  ? 'bg-green-500 text-white'
                                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                              }`}
                            >
                              {idx + 1}
                            </button>
                          );
                        })}
                      </div>
                      
                      {/* Current Question Display - Navigation Inside Box */}
                      <div className="relative bg-white rounded-lg border-2 border-blue-200 shadow-md p-6">
                        {/* Navigation Buttons - Side */}
                        {currentQuestionIndex > 0 && (
                          <button
                            onClick={() => setCurrentQuestionIndex(currentQuestionIndex - 1)}
                            className="absolute left-0 top-1/2 -translate-x-12 -translate-y-1/2 w-10 h-10 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition-all flex items-center justify-center z-10"
                            aria-label="Previous question"
                          >
                            <ChevronLeft className="w-5 h-5" />
                          </button>
                        )}
                        {currentQuestionIndex < visibleQuestions.length - 1 && (
                          <button
                            onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
                            className="absolute right-0 top-1/2 translate-x-12 -translate-y-1/2 w-10 h-10 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition-all flex items-center justify-center z-10"
                            aria-label="Next question"
                          >
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        )}
                        {(() => {
                          const question = visibleQuestions[currentQuestionIndex];
                          if (!question) return null;
                          const value = answers[question.id];
                          const isAnswered = value !== undefined && value !== null && value !== '';
                          return (
                            <div className="space-y-4">
                              {/* Question Header */}
                              <div className="mb-4">
                                <div className="flex items-start gap-2 mb-3">
                                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                                    {currentQuestionIndex + 1}
                                  </span>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <h3 className="text-xl font-semibold text-gray-900 break-words leading-relaxed">
                                        {question.label}
                                      </h3>
                                      {!question.required && (
                                        <span className="text-sm text-gray-500 font-normal">(Optional)</span>
                                      )}
                                    </div>
                                  </div>
                                  {isAnswered && (
                                    <span className="text-green-600 flex-shrink-0 mt-0.5">
                                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                      </svg>
                                    </span>
                                  )}
                                </div>
                              </div>
                              
                              {/* Question Options */}
                              {question.type === 'single-select' && (
                                <div className="space-y-2">
                                  {question.options.map((option: any) => {
                                    const isSelected = value === option.value;
                                    const showRegionInput = question.hasOptionalRegion && isSelected && question.hasOptionalRegion(option.value);
                                    const regionValue = showRegionInput ? (answers[`${question.id}_region`] || '') : '';
                                    const isOtherOption = option.value === 'other';
                                    const otherTextValue = isOtherOption && answers[question.id] === 'other' ? (answers[`${question.id}_other`] || '') : '';
                                    
                                    // Force re-render key based on selection state
                                    const renderKey = `${question.id}-${option.value}-${isSelected ? 'selected' : 'unselected'}-${answers[question.id]}`;
                                    
                                    return (
                                      <div key={renderKey} className="space-y-2">
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            // Toggle: if already selected, deselect; otherwise select
                                            if (isSelected) {
                                              console.log('Deselecting:', option.value, 'question:', question.id);
                                              handleAnswer(question.id, undefined);
                                              // Clear "other" text when deselecting
                                              if (isOtherOption) {
                                                handleAnswer(`${question.id}_other`, undefined);
                                              }
                                              // Clear region when deselecting
                                              if (showRegionInput) {
                                                handleAnswer(`${question.id}_region`, undefined);
                                              }
                                            } else {
                                              console.log('Selecting:', option.value, 'question:', question.id, 'isOther:', isOtherOption);
                                              handleAnswer(question.id, option.value);
                                              // Clear region if switching main option
                                              if (showRegionInput && value !== option.value) {
                                                handleAnswer(`${question.id}_region`, undefined);
                                              }
                                              // Clear "other" text if switching away
                                              if (isOtherOption && value !== option.value) {
                                                handleAnswer(`${question.id}_other`, undefined);
                                              }
                                            }
                                            // Don't auto-advance - let user manually proceed
                                          }}
                                          className={`w-full text-left px-4 py-3 border-2 rounded-lg transition-all duration-150 ${
                                            isSelected
                                              ? 'bg-blue-600 border-blue-600 text-white font-medium shadow-md'
                                              : 'bg-white border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                                          }`}
                                        >
                                          <div className="flex items-center gap-2">
                                            {isSelected && (
                                              <span className="text-lg font-bold">✓</span>
                                            )}
                                            <span className="text-sm">{option.label}</span>
                                          </div>
                                        </button>
                                        
                                        {/* Optional region text input - Only show if main option is selected and hasOptionalRegion is true */}
                                        {showRegionInput && (
                                          <div className="ml-4 space-y-1.5 border-l-2 border-blue-200 pl-3 pt-1">
                                            <label className="text-xs font-medium text-gray-600 mb-1 block">
                                              {t('reco.ui.regionOptional') || 'Region (optional)'}
                                            </label>
                                            <input
                                              type="text"
                                              placeholder={
                                                option.value === 'austria' ? (t('reco.ui.regionPlaceholderAustria') || 'e.g., Vienna, Tyrol, Salzburg') : 
                                                option.value === 'germany' ? (t('reco.ui.regionPlaceholderGermany') || 'e.g., Bavaria, Berlin, Hamburg') : 
                                                option.value === 'eu' ? (t('reco.ui.regionPlaceholderEU') || 'e.g., France, Italy, Spain, or specific region') :
                                                (t('reco.ui.regionPlaceholderInternational') || 'e.g., USA, UK, Switzerland, or specific country/region')
                                              }
                                              value={regionValue}
                                              onChange={(e) => {
                                                handleAnswer(`${question.id}_region`, e.target.value);
                                              }}
                                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                            <p className="text-xs text-gray-500">
                                              {t('reco.ui.regionLeaveEmpty') || 'Leave empty if not applicable'}
                                            </p>
                                          </div>
                                        )}
                                        
                                        {/* Text input for "Other" option - Force render check */}
                                        {isOtherOption && answers[question.id] === 'other' && question.hasOtherTextInput && (
                                          <div className="ml-4 space-y-1.5 border-l-2 border-blue-200 pl-3 pt-1 mt-2 animate-in fade-in duration-200">
                                            <label className="text-xs font-medium text-gray-600 mb-1 block">
                                              {t('reco.ui.pleaseSpecify') || 'Please specify:'}
                                            </label>
                                            <input
                                              type="text"
                                              placeholder={
                                                locale === 'de' 
                                                  ? (question.id === 'company_type' 
                                                      ? 'z.B. Verein, Genossenschaft, Stiftung'
                                                      : question.id === 'impact'
                                                      ? 'z.B. Bildung, Gesundheit, Kultur'
                                                      : question.id === 'company_stage'
                                                      ? 'z.B. Spin-off, Ausgründung, etc.'
                                                      : 'Bitte angeben...')
                                                  : (question.id === 'company_type'
                                                      ? 'e.g., Association, Cooperative, Foundation'
                                                      : question.id === 'impact'
                                                      ? 'e.g., Education, Health, Culture'
                                                      : question.id === 'company_stage'
                                                      ? 'e.g., Spin-off, Spin-out, etc.'
                                                      : 'Please specify...')
                                              }
                                              value={otherTextValue}
                                              onChange={(e) => {
                                                handleAnswer(`${question.id}_other`, e.target.value);
                                              }}
                                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                              autoFocus
                                            />
                                            {question.id === 'company_type' && (
                                              <p className="text-xs text-gray-500 mt-1">
                                                {locale === 'de' 
                                                  ? 'Beispiele: Verein, Genossenschaft, Stiftung, GmbH, AG, etc.'
                                                  : 'Examples: Association, Cooperative, Foundation, LLC, Inc., etc.'}
                                              </p>
                                            )}
                                            {question.id === 'impact' && (
                                              <p className="text-xs text-gray-500 mt-1">
                                                {locale === 'de'
                                                  ? 'Beispiele: Bildung, Gesundheit, Kultur, Forschung, Innovation, etc.'
                                                  : 'Examples: Education, Health, Culture, Research, Innovation, etc.'}
                                              </p>
                                            )}
                                            {question.id === 'company_stage' && (
                                              <p className="text-xs text-gray-500 mt-1">
                                                {locale === 'de'
                                                  ? 'Beispiele: Spin-off, Ausgründung, Tochtergesellschaft, etc.'
                                                  : 'Examples: Spin-off, Spin-out, Subsidiary, etc.'}
                                              </p>
                                            )}
                                          </div>
                                        )}
                                        
                                        {/* Co-financing percentage input - ask for percentage if Yes */}
                                        {question.hasCoFinancingPercentage && isSelected && option.value === 'co_yes' && (
                                          <div className="ml-4 space-y-1.5 border-l-2 border-blue-200 pl-3 pt-1">
                                            <label className="text-xs font-medium text-gray-600 mb-1 block">
                                              {t('reco.ui.coFinancingPercentage') || 'What percentage can you provide? (e.g., 20%, 30%, 50%)'}
                                            </label>
                                            <input
                                              type="text"
                                              placeholder={t('reco.ui.coFinancingPercentagePlaceholder') || 'e.g., 30%'}
                                              value={(answers[`${question.id}_percentage`] as string) || ''}
                                              onChange={(e) => {
                                                handleAnswer(`${question.id}_percentage`, e.target.value);
                                              }}
                                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                            <p className="text-xs text-gray-500">
                                              {t('reco.ui.coFinancingPercentageHint') || 'Many programs require 20-50% co-financing'}
                                            </p>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                  
                                  {/* Legal Type Dropdown - Conditional on company_type selection */}
                                  {question.id === 'company_type' && question.hasLegalType && value && value !== 'prefounder' && (
                                    <div className="mt-4 space-y-1.5 border-t border-gray-200 pt-4">
                                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                                        {locale === 'de' ? 'Rechtsform:' : 'Legal Structure:'}
                                      </label>
                                      <select
                                        value={answers.legal_type || ''}
                                        onChange={(e) => {
                                          handleAnswer('legal_type', e.target.value || undefined);
                                        }}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                      >
                                        <option value="">{locale === 'de' ? 'Bitte wählen...' : 'Please select...'}</option>
                                        {(() => {
                                          // Legal type options based on company type
                                          if (value === 'startup' || value === 'sme') {
                                            return (
                                              <>
                                                <option value="gmbh">{locale === 'de' ? 'GmbH' : 'GmbH'}</option>
                                                <option value="ag">{locale === 'de' ? 'AG' : 'AG'}</option>
                                                <option value="og">{locale === 'de' ? 'OG' : 'OG'}</option>
                                                <option value="kg">{locale === 'de' ? 'KG' : 'KG'}</option>
                                                <option value="einzelunternehmer">{locale === 'de' ? 'Einzelunternehmer (Solo Founder)' : 'Einzelunternehmer (Solo Founder)'}</option>
                                                <option value="other">{locale === 'de' ? 'Sonstige' : 'Other'}</option>
                                              </>
                                            );
                                          } else if (value === 'research') {
                                            return (
                                              <>
                                                <option value="verein">{locale === 'de' ? 'Verein' : 'Verein (Association)'}</option>
                                                <option value="genossenschaft">{locale === 'de' ? 'Genossenschaft' : 'Genossenschaft (Cooperative)'}</option>
                                                <option value="stiftung">{locale === 'de' ? 'Stiftung' : 'Stiftung (Foundation)'}</option>
                                                <option value="gmbh">{locale === 'de' ? 'GmbH' : 'GmbH'}</option>
                                                <option value="other">{locale === 'de' ? 'Sonstige' : 'Other'}</option>
                                              </>
                                            );
                                          } else if (value === 'other') {
                                            return (
                                              <>
                                                <option value="gmbh">{locale === 'de' ? 'GmbH' : 'GmbH'}</option>
                                                <option value="ag">{locale === 'de' ? 'AG' : 'AG'}</option>
                                                <option value="og">{locale === 'de' ? 'OG' : 'OG'}</option>
                                                <option value="kg">{locale === 'de' ? 'KG' : 'KG'}</option>
                                                <option value="verein">{locale === 'de' ? 'Verein' : 'Verein (Association)'}</option>
                                                <option value="genossenschaft">{locale === 'de' ? 'Genossenschaft' : 'Genossenschaft (Cooperative)'}</option>
                                                <option value="stiftung">{locale === 'de' ? 'Stiftung' : 'Stiftung (Foundation)'}</option>
                                                <option value="einzelunternehmer">{locale === 'de' ? 'Einzelunternehmer (Solo Founder)' : 'Einzelunternehmer (Solo Founder)'}</option>
                                                <option value="other">{locale === 'de' ? 'Sonstige' : 'Other'}</option>
                                              </>
                                            );
                                          }
                                          return null;
                                        })()}
                                      </select>
                                      {answers.legal_type === 'other' && (
                                        <input
                                          type="text"
                                          placeholder={locale === 'de' ? 'z.B. LLC, Inc., etc.' : 'e.g., LLC, Inc., etc.'}
                                          value={(answers.legal_type_other as string) || ''}
                                          onChange={(e) => {
                                            handleAnswer('legal_type_other', e.target.value);
                                          }}
                                          className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                          autoFocus
                                        />
                                      )}
                                    </div>
                                  )}
                                  
                                  {/* Skip Button - More Visible */}
                                  {!question.required && (
                                    <button
                                      onClick={() => {
                                        handleAnswer(question.id, undefined);
                                        // Auto-advance after skipping
                                        if (currentQuestionIndex < visibleQuestions.length - 1) {
                                          setTimeout(() => setCurrentQuestionIndex(currentQuestionIndex + 1), 300);
                                        }
                                      }}
                                      className="w-full mt-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 border-2 border-gray-300 rounded-lg hover:bg-gray-100 hover:border-gray-400 transition-all"
                                    >
                                      {t('reco.skipQuestion') || 'Skip this question'} →
                                    </button>
                                  )}
                                </div>
                              )}
                              {question.type === 'multi-select' && (
                                <div className="space-y-2">
                                  {question.options.map((option: any) => {
                                    const isSelected = Array.isArray(value) && value.includes(option.value);
                                    const subCategories = question.subCategories && isSelected && option.value in question.subCategories 
                                      ? question.subCategories[option.value as keyof typeof question.subCategories] 
                                      : [];
                                    const hasSubCategories = subCategories && subCategories.length > 0;
                                    const subCategoryKey = `${question.id}_${option.value}`;
                                    const subCategoryValue = answers[subCategoryKey];
                                    const isOtherOption = option.value === 'other';
                                    const otherTextValue = isOtherOption && isSelected && Array.isArray(value) && value.includes('other') ? (answers[`${question.id}_other`] || '') : '';
                                    
                                    // Force re-render key based on selection state
                                    const selectedArray = Array.isArray(value) ? value : [];
                                    const renderKey = `${question.id}-${option.value}-${isSelected ? 'selected' : 'unselected'}-${selectedArray.join(',')}`;
                                    
                                    return (
                                      <div key={renderKey} className="space-y-1.5">
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            const current = Array.isArray(value) ? value : [];
                                            let newValue: any[];
                                            
                                            console.log('Multi-select toggle:', {
                                              questionId: question.id,
                                              optionValue: option.value,
                                              isSelected,
                                              isOtherOption,
                                              currentValue: current,
                                              hasOtherTextInput: question.hasOtherTextInput
                                            });
                                            
                                            // Special handling for "no_partnerships" - mutually exclusive
                                            if (option.value === 'no_partnerships') {
                                              if (isSelected) {
                                                // Deselecting "no partnerships" - allow other selections
                                                newValue = current.filter(v => v !== option.value);
                                              } else {
                                                // Selecting "no partnerships" - clear all other options
                                                newValue = ['no_partnerships'];
                                              }
                                            } else {
                                              // For other options, if selecting and "no_partnerships" is selected, remove it
                                              if (!isSelected && current.includes('no_partnerships')) {
                                                newValue = [...current.filter(v => v !== 'no_partnerships'), option.value];
                                              } else {
                                                // Toggle: if selected, deselect; if not selected, select
                                                newValue = isSelected
                                                  ? current.filter(v => v !== option.value)
                                                  : [...current, option.value];
                                              }
                                            }
                                            
                                            console.log('New value after toggle:', newValue);
                                            
                                            // Set to undefined if array is empty (to properly clear the answer)
                                            handleAnswer(question.id, newValue.length > 0 ? newValue : undefined);
                                            // Clear sub-categories if deselecting
                                            if (isSelected && hasSubCategories) {
                                              handleAnswer(subCategoryKey, undefined);
                                            }
                                            // Clear "other" text if deselecting
                                            if (isSelected && isOtherOption) {
                                              handleAnswer(`${question.id}_other`, undefined);
                                            }
                                          }}
                                          className={`w-full text-left px-4 py-3 border-2 rounded-lg transition-all duration-150 ${
                                            isSelected
                                              ? 'bg-blue-600 border-blue-600 text-white font-medium shadow-md'
                                              : 'bg-white border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                                          }`}
                                        >
                                          <div className="flex items-center gap-2">
                                            <span className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                              isSelected 
                                                ? 'bg-white border-white' 
                                                : 'border-gray-400'
                                            }`}>
                                              {isSelected && (
                                                <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                              )}
                                            </span>
                                            <span className="text-sm">{option.label}</span>
                                          </div>
                                        </button>
                                        
                                        {/* Sub-categories (e.g., industry subcategories) - Simplified, only show if selected */}
                                        {hasSubCategories && isSelected && (
                                          <div className="ml-4 space-y-1 border-l-2 border-blue-200 pl-3 pt-1">
                                            <p className="text-xs font-medium text-gray-600 mb-1">Specific areas:</p>
                                            <div className="space-y-1">
                                              {subCategories.map((subCat: any) => {
                                                const isSubSelected = Array.isArray(subCategoryValue) && subCategoryValue.includes(subCat.value);
                                                return (
                                                  <button
                                                    key={subCat.value}
                                                    onClick={() => {
                                                      const current = Array.isArray(subCategoryValue) ? subCategoryValue : [];
                                                      const newSubValue = isSubSelected
                                                        ? current.filter(v => v !== subCat.value)
                                                        : [...current, subCat.value];
                                                      handleAnswer(subCategoryKey, newSubValue);
                                                    }}
                                                    className={`w-full text-left px-3 py-1.5 border rounded-lg transition-all duration-150 ${
                                                      isSubSelected
                                                        ? 'bg-blue-500 border-blue-500 text-white font-medium'
                                                        : 'bg-gray-50 border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                                                    }`}
                                                  >
                                                    <div className="flex items-center gap-1.5">
                                                      <span className={`w-4 h-4 rounded border flex items-center justify-center ${
                                                        isSubSelected 
                                                          ? 'bg-white border-white' 
                                                          : 'border-gray-400'
                                                      }`}>
                                                        {isSubSelected && (
                                                          <svg className="w-2.5 h-2.5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                          </svg>
                                                        )}
                                                      </span>
                                                      <span className="text-xs">{subCat.label}</span>
                                                    </div>
                                                  </button>
                                                );
                                              })}
                                            </div>
                                          </div>
                                        )}
                                        
                                        {/* Text input for "Other" option - support multiple entries for use_of_funds */}
                                        {isOtherOption && Array.isArray(value) && value.includes('other') && question.hasOtherTextInput && (
                                          <div className="ml-4 space-y-1.5 border-l-2 border-blue-200 pl-3 pt-1 mt-2 animate-in fade-in duration-200">
                                            <label className="text-xs font-medium text-gray-600 mb-1 block">
                                              {question.allowMultipleOther 
                                                ? (t('reco.ui.pleaseSpecifyMultiple') || 'Please specify (you can add multiple):')
                                                : (t('reco.ui.pleaseSpecify') || 'Please specify:')}
                                            </label>
                                            {question.allowMultipleOther ? (
                                              // Multiple "other" entries - show array of inputs
                                              <div className="space-y-2">
                                                {Array.isArray(answers[`${question.id}_other`]) && answers[`${question.id}_other`].length > 0 ? (
                                                  (answers[`${question.id}_other`] as string[]).map((item: string, idx: number) => (
                                                    <div key={idx} className="flex gap-2">
                                                      <input
                                                        type="text"
                                                        placeholder={t('reco.ui.enterAnswer') || 'Enter your answer...'}
                                                        value={item}
                                                        onChange={(e) => {
                                                          const current = answers[`${question.id}_other`] as string[] || [];
                                                          const updated = [...current];
                                                          updated[idx] = e.target.value;
                                                          handleAnswer(`${question.id}_other`, updated);
                                                        }}
                                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                      />
                                                      <button
                                                        onClick={() => {
                                                          const current = answers[`${question.id}_other`] as string[] || [];
                                                          const updated = current.filter((_, i) => i !== idx);
                                                          handleAnswer(`${question.id}_other`, updated.length > 0 ? updated : undefined);
                                                        }}
                                                        className="px-2 text-red-600 hover:text-red-800"
                                                        type="button"
                                                      >
                                                        ×
                                                      </button>
                                                    </div>
                                                  ))
                                                ) : (
                                                  <input
                                                    type="text"
                                                    placeholder={
                                                      locale === 'de'
                                                        ? (question.id === 'industry_focus'
                                                            ? 'z.B. Tourismus, Landwirtschaft, Energie'
                                                            : question.id === 'use_of_funds'
                                                            ? 'z.B. Marketing, Vertrieb, etc.'
                                                            : 'Bitte angeben...')
                                                        : (question.id === 'industry_focus'
                                                            ? 'e.g., Tourism, Agriculture, Energy'
                                                            : question.id === 'use_of_funds'
                                                            ? 'e.g., Marketing, Sales, etc.'
                                                            : 'Please specify...')
                                                    }
                                                    value={otherTextValue}
                                                    onChange={(e) => {
                                                      handleAnswer(`${question.id}_other`, [e.target.value]);
                                                    }}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                    autoFocus
                                                  />
                                                )}
                                                <button
                                                  onClick={() => {
                                                    const current = answers[`${question.id}_other`] as string[] || [];
                                                    handleAnswer(`${question.id}_other`, [...(current.length > 0 ? current : ['']), '']);
                                                  }}
                                                  className="text-xs text-blue-600 hover:text-blue-800 underline"
                                                  type="button"
                                                >
                                                  {t('reco.ui.addAnother') || '+ Add another'}
                                                </button>
                                              </div>
                                            ) : (
                                              // Single "other" entry
                                              <div>
                                                <input
                                                  type="text"
                                                  placeholder={
                                                    locale === 'de'
                                                      ? (question.id === 'industry_focus'
                                                          ? 'z.B. Tourismus, Landwirtschaft, Energie'
                                                          : question.id === 'use_of_funds'
                                                          ? 'z.B. Marketing, Vertrieb, etc.'
                                                          : 'Bitte angeben...')
                                                      : (question.id === 'industry_focus'
                                                          ? 'e.g., Tourism, Agriculture, Energy'
                                                          : question.id === 'use_of_funds'
                                                          ? 'e.g., Marketing, Sales, etc.'
                                                          : 'Please specify...')
                                                  }
                                                  value={otherTextValue}
                                                  onChange={(e) => {
                                                    handleAnswer(`${question.id}_other`, e.target.value);
                                                  }}
                                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                  autoFocus
                                                />
                                                {question.id === 'industry_focus' && (
                                                  <p className="text-xs text-gray-500 mt-1">
                                                    {locale === 'de'
                                                      ? 'Beispiele: Tourismus, Landwirtschaft, Energie, Handel, Dienstleistungen, etc.'
                                                      : 'Examples: Tourism, Agriculture, Energy, Trade, Services, etc.'}
                                                  </p>
                                                )}
                                                {question.id === 'use_of_funds' && (
                                                  <p className="text-xs text-gray-500 mt-1">
                                                    {locale === 'de'
                                                      ? 'Beispiele: Marketing, Vertrieb, IT-Infrastruktur, etc.'
                                                      : 'Examples: Marketing, Sales, IT Infrastructure, etc.'}
                                                  </p>
                                                )}
                                              </div>
                                            )}
                                          </div>
                                        )}
                                        
                                        {/* Impact details input - allow specifying details for each impact type */}
                                        {question.hasImpactDetails && isSelected && !isOtherOption && (option.value === 'economic' || option.value === 'social' || option.value === 'environmental') && (
                                          <div className="ml-4 space-y-1.5 border-l-2 border-blue-200 pl-3 pt-1">
                                            <label className="text-xs font-medium text-gray-600 mb-1 block">
                                              {option.value === 'economic' 
                                                ? (t('reco.ui.specifyEconomicImpact') || 'Specify economic impact (e.g., job creation, GDP growth):')
                                                : option.value === 'social'
                                                ? (t('reco.ui.specifySocialImpact') || 'Specify social impact (e.g., community benefit, accessibility):')
                                                : (t('reco.ui.specifyEnvironmentalImpact') || 'Specify environmental impact (e.g., CO2 reduction, sustainability):')}
                                            </label>
                                            <input
                                              type="text"
                                              placeholder={option.value === 'economic' 
                                                ? (t('reco.ui.impactEconomicPlaceholder') || 'e.g., Create 50 jobs, increase regional GDP')
                                                : option.value === 'social'
                                                ? (t('reco.ui.impactSocialPlaceholder') || 'e.g., Improve healthcare access, support education')
                                                : (t('reco.ui.impactEnvironmentalPlaceholder') || 'e.g., Reduce CO2 by 30%, promote circular economy')}
                                              value={(answers[`${question.id}_${option.value}`] as string) || ''}
                                              onChange={(e) => {
                                                handleAnswer(`${question.id}_${option.value}`, e.target.value);
                                              }}
                                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                  
                                  {/* Skip Button for Multi-Select - More Visible */}
                                  {!question.required && (
                                    <button
                                      onClick={() => {
                                        handleAnswer(question.id, undefined);
                                        // Auto-advance after skipping
                                        if (currentQuestionIndex < visibleQuestions.length - 1) {
                                          setTimeout(() => setCurrentQuestionIndex(currentQuestionIndex + 1), 300);
                                        }
                                      }}
                                      className="w-full mt-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 border-2 border-gray-300 rounded-lg hover:bg-gray-100 hover:border-gray-400 transition-all"
                                    >
                                      {t('reco.skipQuestion') || 'Skip this question'} →
                                    </button>
                                  )}
                                </div>
                              )}
                              {question.type === 'range' && (
                                <div className="space-y-4">
                                  {/* Slider */}
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-sm text-gray-600">
                                        {question.unit === 'EUR' ? '€' : ''}
                                        {question.min.toLocaleString('de-DE')}
                                        {question.unit === 'EUR' ? '' : question.unit === 'months' ? ` ${t('reco.ui.sliderMonths') || 'months'}` : question.unit === 'people' ? ` ${t('reco.ui.sliderPeople') || 'people'}` : ` ${question.unit}`}
                                      </span>
                                      <span className="text-sm text-gray-600">
                                        {question.unit === 'EUR' ? '€' : ''}
                                        {question.max.toLocaleString('de-DE')}
                                        {question.unit === 'EUR' ? '' : question.unit === 'months' ? ` ${t('reco.ui.sliderMonths') || 'months'}` : question.unit === 'people' ? ` ${t('reco.ui.sliderPeople') || 'people'}` : ` ${question.unit}`}
                                      </span>
                                    </div>
                                    <input
                                      type="range"
                                      min={question.min}
                                      max={question.max}
                                      step={question.step}
                                      value={typeof value === 'number' ? value : question.min}
                                      onChange={(e) => {
                                        const numValue = question.unit === 'years' 
                                          ? parseFloat(e.target.value)
                                          : parseInt(e.target.value);
                                        handleAnswer(question.id, numValue);
                                        // Auto-classify company stage for Q6
                                        if (question.id === 'company_stage') {
                                          const months = numValue;
                                          let stage = 'pre_company';
                                          if (months < 0) {
                                            stage = 'pre_company';
                                          } else if (months < 6) {
                                            stage = 'early_stage';
                                          } else if (months < 12) {
                                            stage = 'launch_stage';
                                          } else if (months < 24) {
                                            stage = 'growth_stage';
                                          } else if (months < 36) {
                                            stage = 'established';
                                          } else {
                                            stage = 'mature';
                                          }
                                          handleAnswer('company_stage_classified', stage);
                                        }
                                      }}
                                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                      style={{
                                        background: question.min < 0 
                                          ? `linear-gradient(to right, #2563eb 0%, #2563eb ${Math.max(0, Math.min(100, ((typeof value === 'number' ? value : question.min) - question.min) / (question.max - question.min) * 100))}%, #e5e7eb ${Math.max(0, Math.min(100, ((typeof value === 'number' ? value : question.min) - question.min) / (question.max - question.min) * 100))}%, #e5e7eb 100%)`
                                          : `linear-gradient(to right, #2563eb 0%, #2563eb ${((typeof value === 'number' ? value : question.min) - question.min) / (question.max - question.min) * 100}%, #e5e7eb ${((typeof value === 'number' ? value : question.min) - question.min) / (question.max - question.min) * 100}%, #e5e7eb 100%)`
                                      }}
                                    />
                                    <div className="text-center mt-3">
                                      {/* Company Stage: Show months + classification */}
                                      {question.id === 'company_stage' && (
                                        <div className="space-y-1">
                                          <div className="text-base font-semibold text-gray-800">
                                            {typeof value === 'number' ? value : question.min} {t('reco.ui.sliderMonths') || 'months'}
                                          </div>
                                          <div className="text-base font-semibold text-blue-600">
                                            {(() => {
                                              const months = typeof value === 'number' ? value : question.min;
                                              if (months < 0) {
                                                return locale === 'de' ? 'Vor Gründung' : 'Pre Incorporation';
                                              } else if (months < 6) {
                                                return locale === 'de' ? 'Frühe Phase (0-6 Monate)' : 'Early Stage (0-6 months)';
                                              } else if (months < 12) {
                                                return locale === 'de' ? 'Launch Phase (6-12 Monate)' : 'Launch Stage (6-12 months)';
                                              } else if (months < 24) {
                                                return locale === 'de' ? 'Wachstumsphase (12-24 Monate)' : 'Growth Stage (12-24 months)';
                                              } else if (months < 36) {
                                                return locale === 'de' ? 'Etabliert (24-36 Monate)' : 'Established (24-36 months)';
                                              } else {
                                                return locale === 'de' ? 'Reif (36+ Monate)' : 'Mature (36+ months)';
                                              }
                                            })()}
                                          </div>
                                        </div>
                                      )}
                                      {question.id !== 'company_stage' && question.editableValue ? (
                                        <>
                                          <input
                                            type="text"
                                            value={rawInputValues[question.id] !== undefined 
                                              ? rawInputValues[question.id]
                                              : typeof value === 'number' 
                                              ? (question.unit === 'EUR' 
                                                  ? value.toString()
                                                  : question.unit === 'years'
                                                  ? value.toFixed(1)
                                                  : value.toString())
                                              : question.min.toString()}
                                            onChange={(e) => {
                                              let inputValue = e.target.value;
                                              // Store raw input for free typing
                                              setRawInputValues(prev => ({ ...prev, [question.id]: inputValue }));
                                              
                                              // Remove non-numeric (except decimal for years)
                                              if (question.unit === 'EUR' || question.unit === 'months' || question.unit === 'people') {
                                                inputValue = inputValue.replace(/[^\d]/g, '');
                                              } else if (question.unit === 'years') {
                                                inputValue = inputValue.replace(/[^\d.]/g, '');
                                                const parts = inputValue.split('.');
                                                if (parts.length > 2) inputValue = parts[0] + '.' + parts.slice(1).join('');
                                              }
                                              
                                              if (inputValue === '' || inputValue === '.') return;
                                              
                                              const numValue = question.unit === 'years' 
                                                ? parseFloat(inputValue)
                                                : Math.floor(parseFloat(inputValue));
                                                
                                              if (!isNaN(numValue)) {
                                                if (numValue >= question.min && numValue <= question.max) {
                                                  handleAnswer(question.id, numValue);
                                                } else if (numValue > question.max) {
                                                  handleAnswer(question.id, question.max);
                                                  setRawInputValues(prev => ({ ...prev, [question.id]: question.max.toString() }));
                                                }
                                              }
                                            }}
                                            onFocus={() => {
                                              const currentValue = typeof value === 'number' ? value : question.min;
                                              setRawInputValues(prev => ({ 
                                                ...prev, 
                                                [question.id]: question.unit === 'years' 
                                                  ? currentValue.toFixed(1) 
                                                  : currentValue.toString() 
                                              }));
                                            }}
                                            onBlur={(e) => {
                                              let cleaned = e.target.value.replace(/[^\d.]/g, '');
                                              if (question.unit === 'EUR' || question.unit === 'months' || question.unit === 'people') {
                                                cleaned = cleaned.replace(/\./g, '');
                                              }
                                              const numValue = question.unit === 'years' 
                                                ? parseFloat(cleaned || '0')
                                                : Math.floor(parseFloat(cleaned || '0'));
                                              setRawInputValues(prev => {
                                                const newState = { ...prev };
                                                delete newState[question.id];
                                                return newState;
                                              });
                                              if (isNaN(numValue) || numValue < question.min) {
                                                handleAnswer(question.id, question.min);
                                              } else if (numValue > question.max) {
                                                handleAnswer(question.id, question.max);
                                              } else if (!isNaN(numValue)) {
                                                handleAnswer(question.id, numValue);
                                              }
                                            }}
                                            placeholder={question.unit === 'EUR' 
                                              ? `€${question.min.toLocaleString('de-DE')} - €${question.max.toLocaleString('de-DE')}`
                                              : `${question.min} - ${question.max} ${question.unit}`}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center font-medium"
                                          />
                                          <div className="text-xs text-gray-500 mt-1">
                                            {question.unit === 'EUR' && typeof value === 'number' && (
                                              <span>€{value.toLocaleString('de-DE')}</span>
                                            )}
                                          </div>
                                        </>
                                      ) : question.id !== 'company_stage' && (
                                        <div className="text-base font-semibold text-gray-800">
                                          {typeof value === 'number' 
                                            ? (question.unit === 'EUR' 
                                                ? `€${value.toLocaleString('de-DE')}`
                                                : question.unit === 'years'
                                                ? `${value.toFixed(1)} ${question.unit}`
                                                : question.unit === 'months'
                                                ? `${value} ${t('reco.ui.sliderMonths') || 'months'}`
                                                : question.unit === 'people'
                                                ? `${value} ${t('reco.ui.sliderPeople') || 'people'}`
                                                : `${value} ${question.unit}`)
                                            : (question.unit === 'EUR' 
                                                ? `€${question.min.toLocaleString('de-DE')}`
                                                : question.unit === 'years'
                                                ? `${question.min.toFixed(1)} ${question.unit}`
                                                : question.unit === 'months'
                                                ? `${question.min} ${t('reco.ui.sliderMonths') || 'months'}`
                                                : question.unit === 'people'
                                                ? `${question.min} ${t('reco.ui.sliderPeople') || 'people'}`
                                                : `${question.min} ${question.unit}`)}
                                        </div>
                                      )}
                                    </div>
                                    {question.editableValue && question.unit === 'EUR' && (
                                      <div className="text-xs text-gray-500 text-center mt-1">
                                        {typeof value === 'number' ? `€${value.toLocaleString('de-DE')}` : `€${question.min.toLocaleString('de-DE')}`}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                              
                              {question.type !== 'range' && question.type !== 'single-select' && question.type !== 'multi-select' && (
                                <div className="text-sm text-gray-500">
                                  Unsupported question type
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  )}
              </div>
            </Card>
            
            {/* Generate Button */}
            <div className="max-w-2xl mx-auto mt-4 flex justify-start">
              <button
                onClick={async () => {
                  if (!hasEnoughAnswers) {
                    alert(locale === 'de' 
                      ? `Bitte beantworten Sie mindestens ${MIN_QUESTIONS_FOR_RESULTS} Fragen, um Förderprogramme zu generieren.`
                      : `Please answer at least ${MIN_QUESTIONS_FOR_RESULTS} questions to generate funding programs.`);
                    return;
                  }
                setIsLoading(true);
                console.log('🚀 Starting program generation...');
                console.log('📋 Answers being sent:', answers);
                console.log('✅ Has enough answers:', hasEnoughAnswers);
                
                try {
                  const response = await fetch('/api/programs/recommend', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      answers,
                      max_results: 20,
                      extract_all: false,
                      use_seeds: false,
                    }),
                  });
                  
                  console.log('📡 API Response status:', response.status, response.statusText);
                  
                  if (!response.ok) {
                    const errorText = await response.text();
                    console.error('❌ API Error Response:', errorText);
                    throw new Error(`API returned ${response.status}: ${errorText.substring(0, 200)}`);
                  }
                  
                  const data = await response.json();
                  console.log('📦 API Response data:', {
                    success: data.success,
                    count: data.count,
                    programsLength: data.programs?.length || 0,
                    extractionResults: data.extraction_results?.length || 0,
                    source: data.source,
                  });
                  
                  const extractedPrograms = data.programs || [];
                  console.log(`✅ Received ${extractedPrograms.length} programs from API`);
                  
                  if (extractedPrograms.length === 0) {
                    console.warn('⚠️ No programs in API response');
                    console.warn('Full API response:', JSON.stringify(data, null, 2));
                    // Don't show alert, just set empty results and let the UI show the "no results" message
                    setResults([]);
                    setIsLoading(false);
                    return;
                  }
                    const programsForScoring = extractedPrograms.map((p: any) => ({
                      id: p.id,
                      name: p.name,
                      type: p.type || p.funding_types?.[0] || 'grant',
                      program_type: p.program_type || p.funding_types?.[0] || 'grant',
                      description: p.metadata?.description || p.description || '',
                      funding_amount_max: p.metadata?.funding_amount_max || 0,
                      funding_amount_min: p.metadata?.funding_amount_min || 0,
                      currency: p.metadata?.currency || 'EUR',
                      amount: {
                        min: p.metadata?.funding_amount_min || 0,
                        max: p.metadata?.funding_amount_max || 0,
                        currency: p.metadata?.currency || 'EUR',
                      },
                      source_url: p.url || p.source_url,
                      url: p.url || p.source_url,
                      deadline: p.metadata?.deadline,
                      open_deadline: p.metadata?.open_deadline || false,
                      contact_email: p.metadata?.contact_email,
                      contact_phone: p.metadata?.contact_phone,
                      eligibility_criteria: {},
                      categorized_requirements: p.categorized_requirements || {},
                      region: p.metadata?.region,
                      funding_types: p.funding_types || [],
                      program_focus: p.metadata?.program_focus || [],
                    }));
                  console.log(`📊 Scoring ${programsForScoring.length} programs...`);
                  const scored = await scoreProgramsEnhanced(answers, 'strict', programsForScoring);
                  console.log(`✅ Scored ${scored.length} programs`);
                  console.log('📈 Score distribution:', scored.map(p => ({ name: p.name, score: p.score })));
                  
                  const sorted = scored.sort((a, b) => b.score - a.score);
                  const top5 = sorted.slice(0, 5);
                  console.log(`🎯 Top 5 programs:`, top5.map(p => ({ name: p.name, score: p.score })));
                  
                  setResults(top5);
                  console.log(`✅ Set ${top5.length} results in state`);
                  
                  if (top5.length > 0) {
                    setMobileActiveTab('results');
                    console.log('✅ Switched to results tab');
                  } else {
                    console.warn('⚠️ No programs to display after scoring');
                    // Results are already empty, UI will show "no results" message
                  }
                } catch (error: any) {
                  console.error('❌ Error generating programs:', error);
                  console.error('Error details:', {
                    message: error.message,
                    stack: error.stack,
                  });
                  alert(locale === 'de' 
                    ? `Fehler beim Generieren der Förderprogramme: ${error.message || 'Unbekannter Fehler'}`
                    : `Error generating programs: ${error.message || 'Unknown error'}`);
                } finally {
                  setIsLoading(false);
                  console.log('🏁 Program generation finished');
                }
              }}
                disabled={isLoading || !hasEnoughAnswers}
                className="px-8 py-3 rounded-lg font-semibold text-base transition-all flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-400 disabled:hover:bg-gray-400 min-w-[280px]"
                title={!hasEnoughAnswers ? (locale === 'de' 
                  ? `Bitte beantworten Sie mindestens ${MIN_QUESTIONS_FOR_RESULTS} Fragen`
                  : `Please answer at least ${MIN_QUESTIONS_FOR_RESULTS} questions`) : undefined}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {locale === 'de' ? 'Generiere Programme...' : 'Generating Programs...'}
                  </>
                ) : !hasEnoughAnswers ? (
                  <>
                    <Wand2 className="w-5 h-5" />
                    {locale === 'de' 
                      ? `Noch ${MIN_QUESTIONS_FOR_RESULTS - answeredCount} Fragen` 
                      : `${MIN_QUESTIONS_FOR_RESULTS - answeredCount} more questions`}
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5" />
                    {locale === 'de' ? 'Förderprogramm generieren' : 'Generate Funding Programs'}
                  </>
                )}
              </button>
            </div>
          </div>
          
          {/* Results Display Section */}
          <div className={`${mobileActiveTab === 'questions' ? 'hidden lg:block' : 'block'} ${results.length === 0 && !isLoading ? 'hidden' : ''}`}>
            {isLoading ? (
              <div className="max-w-2xl mx-auto mt-6">
                <Card className="p-8 border-2 border-blue-200">
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <svg className="animate-spin h-12 w-12 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <div className="text-center">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {locale === 'de' ? 'Förderprogramme werden generiert...' : 'Generating Funding Programs...'}
                      </h3>
                      <p className="text-gray-600">
                        {locale === 'de' 
                          ? 'Dies kann 15-30 Sekunden dauern. Bitte haben Sie etwas Geduld.'
                          : 'This may take 15-30 seconds. Please be patient.'}
                      </p>
                    </div>
                    {/* Progress steps */}
                    <div className="w-full max-w-md space-y-2 mt-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></div>
                        <span>{locale === 'de' ? 'Analysiere Ihr Profil...' : 'Analyzing your profile...'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                        <span>{locale === 'de' ? 'Finde passende Programme...' : 'Finding matching programs...'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                        <span>{locale === 'de' ? 'Bewerte Relevanz...' : 'Scoring relevance...'}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            ) : results.length > 0 ? (
              <div className="max-w-4xl mx-auto mt-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  {locale === 'de' ? 'Gefundene Förderprogramme' : 'Found Funding Programs'} ({results.length})
                </h2>
                <div className="space-y-4">
                  {results.map((program, index) => (
                    <Card key={program.id || index} className="p-6 border-2 border-blue-200 hover:border-blue-400 transition-all">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-semibold text-gray-900">
                              {program.name || `Program ${index + 1}`}
                            </h3>
                            {program.score !== undefined && (
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                program.score >= 70 ? 'bg-green-100 text-green-800' :
                                program.score >= 40 ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {Math.round(program.score)}% Match
                              </span>
                            )}
                          </div>
                          {(program.description || (program as any).metadata?.description) && (
                            <p className="text-gray-600 mb-3">{program.description || (program as any).metadata?.description}</p>
                          )}
                          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                            {program.amount && (
                              <span>
                                <strong>{locale === 'de' ? 'Betrag:' : 'Amount:'}</strong>{' '}
                                €{program.amount.min?.toLocaleString('de-DE') || '0'} - €{program.amount.max?.toLocaleString('de-DE') || '0'}
                              </span>
                            )}
                            {program.type && (
                              <span>
                                <strong>{locale === 'de' ? 'Typ:' : 'Type:'}</strong> {program.type}
                              </span>
                            )}
                          </div>
                          {program.url && (
                            <a 
                              href={program.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 text-sm mt-2 inline-block"
                            >
                              {locale === 'de' ? 'Mehr erfahren →' : 'Learn more →'}
                            </a>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            if (onProgramSelect) {
                              onProgramSelect(program.id, program.type || 'grant');
                            } else {
                              // Store in localStorage for editor
                              if (typeof window !== 'undefined') {
                                localStorage.setItem('selectedProgram', JSON.stringify({
                                  id: program.id,
                                  name: program.name,
                                  categorized_requirements: program.categorized_requirements || {},
                                  type: program.type || 'grant',
                                  url: program.url,
                                }));
                                router.push('/editor?product=submission');
                              }
                            }
                          }}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium whitespace-nowrap"
                        >
                          {locale === 'de' ? 'Auswählen' : 'Select'}
                        </button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ) : results.length === 0 && answeredCount >= MIN_QUESTIONS_FOR_RESULTS ? (
              <div className="max-w-2xl mx-auto mt-6 text-center">
                <Card className="p-8 border-2 border-gray-200">
                  <p className="text-gray-600 text-lg mb-2">
                    {locale === 'de' ? 'Keine Programme gefunden' : 'No programs found'}
                  </p>
                  <p className="text-gray-500 text-sm">
                    {locale === 'de' 
                      ? 'Versuchen Sie, andere Antworten zu wählen oder klicken Sie erneut auf "Förderprogramm generieren".'
                      : 'Try selecting different answers or click "Generate Funding Programs" again.'}
                  </p>
                </Card>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

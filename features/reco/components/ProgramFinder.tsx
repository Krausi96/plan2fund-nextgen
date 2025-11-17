/**
 * ProgramFinder - Unified interface for SmartWizard and Advanced Search
 * Simplified version without QuestionEngine - uses static form
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import { Wand2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card } from '@/shared/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/shared/components/ui/dialog';
// Progress bar implemented with custom div (not using Progress component)
import { scoreProgramsEnhanced, EnhancedProgramResult } from '@/features/reco/engine/enhancedRecoEngine';
import { useI18n } from '@/shared/contexts/I18nContext';

// Path Indicator Component with merged numbered bubbles
function PathIndicator({ 
  currentStep, 
  totalSteps, 
  visibleQuestions, 
  currentQuestionIndex, 
  answers, 
  onStepClick 
}: { 
  currentStep: number; 
  totalSteps: number;
  visibleQuestions: any[];
  currentQuestionIndex: number;
  answers: any;
  onStepClick: (idx: number) => void;
}) {
  return (
    <div className="text-center">
      <div className="flex items-center justify-center">
        <div className="relative flex-1 max-w-4xl h-10 bg-gray-200 rounded-full overflow-visible">
          {/* Progress fill */}
          <div 
            className="h-full bg-blue-600 transition-all duration-300 rounded-full"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
          {/* Numbered bubbles merged into progress bar */}
          {visibleQuestions.map((q: QuestionDefinition, idx) => {
            const isAnswered = answers[q.id] !== undefined && answers[q.id] !== null && answers[q.id] !== '' && 
                             !(Array.isArray(answers[q.id]) && answers[q.id].length === 0);
            const position = totalSteps > 1 ? (idx / (totalSteps - 1)) * 100 : 50;
            return (
              <button
                key={idx}
                onClick={() => onStepClick(idx)}
                className={`absolute w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all -translate-x-1/2 -translate-y-1/2 ${
                  idx === currentQuestionIndex
                    ? 'bg-blue-800 text-white shadow-lg scale-110 z-10 border-2 border-white'
                    : isAnswered
                    ? 'bg-blue-500 text-white border-2 border-white'
                    : 'bg-gray-300 text-gray-700 hover:bg-gray-400 border-2 border-white'
                }`}
                style={{ 
                  left: `${position}%`,
                  top: '50%'
                }}
              >
                {idx + 1}
              </button>
            );
          })}
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
type BaseQuestion = {
  id: string;
  label: string;
  required: boolean;
  priority: number;
  isAdvanced: boolean;
};

type SingleSelectQuestion = BaseQuestion & {
  type: 'single-select';
  options: Array<{ value: string; label: string }>;
  hasOtherTextInput?: boolean;
  hasLegalType?: boolean;
  hasOptionalRegion?: (value: string) => boolean;
  hasCoFinancingPercentage?: boolean;
};

type MultiSelectQuestion = BaseQuestion & {
  type: 'multi-select';
  options: Array<{ value: string; label: string }>;
  hasOtherTextInput?: boolean;
  subCategories?: Record<string, { value: string; label: string }[]>;
};

type RangeQuestion = BaseQuestion & {
  type: 'range';
  min: number;
  max: number;
  step: number;
  unit: string;
  editableValue?: boolean;
};

type QuestionDefinition = SingleSelectQuestion | MultiSelectQuestion | RangeQuestion;

const CORE_QUESTIONS: QuestionDefinition[] = [
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
    required: true,
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
    required: true,
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
    required: true,
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
    id: 'use_of_funds',
    label: 'How will you use the funding?',
    type: 'multi-select' as const,
    options: [
      { value: 'product_development', label: 'Product development & R&D' },
      { value: 'hiring', label: 'Hiring & team growth' },
      { value: 'equipment', label: 'Equipment & infrastructure' },
      { value: 'marketing', label: 'Marketing & go-to-market' },
      { value: 'internationalization', label: 'International expansion' },
      { value: 'working_capital', label: 'Working capital' },
      { value: 'other', label: 'Other' },
    ],
    required: false,
    priority: 6,
    hasOtherTextInput: true,
    isAdvanced: false,
  },
  {
    id: 'company_stage', // CRITICAL - Used in matching
    label: 'What stage is your company at?',
    type: 'single-select' as const,
    options: [
      { value: 'idea', label: 'Idea / Concept' },
      { value: 'pre_company', label: 'Pre-company (not incorporated)' },
      { value: 'inc_lt_6m', label: 'Newly incorporated (< 6 months)' },
      { value: 'inc_6_36m', label: 'Growing (6-36 months)' },
      { value: 'inc_gt_36m', label: 'Established (36+ months)' },
      { value: 'research_org', label: 'Research institution / University' },
    ],
    required: true,
    priority: 4,
    isAdvanced: false,
  },
];

const ADVANCED_QUESTIONS: QuestionDefinition[] = [
  {
    id: 'team_size',
    label: 'How large is your team?',
    type: 'single-select' as const,
    options: [
      { value: 'solo', label: 'Solo founder' },
      { value: 'team_2_5', label: '2-5 people' },
      { value: 'team_6_20', label: '6-20 people' },
      { value: 'team_20_plus', label: '20+ people' },
    ],
    required: false,
    priority: 10,
    isAdvanced: true,
  },
  {
    id: 'revenue_status',
    label: 'What best describes your revenue stage?',
    type: 'single-select' as const,
    options: [
      { value: 'pre_revenue', label: 'Pre-revenue' },
      { value: 'early_revenue', label: 'Early revenue (< €500k)' },
      { value: 'scaling_revenue', label: 'Scaling (€500k+)' },
      { value: 'profitable', label: 'Profitable' },
    ],
    required: false,
    priority: 11,
    isAdvanced: true,
  },
  {
    id: 'impact_focus',
    label: 'Which impact areas apply?',
    type: 'multi-select' as const,
    options: [
      { value: 'environmental', label: 'Environmental / Climate' },
      { value: 'social', label: 'Social / Inclusion' },
      { value: 'regional', label: 'Regional development' },
      { value: 'research', label: 'Research & innovation' },
      { value: 'education', label: 'Education / Workforce' },
      { value: 'other', label: 'Other' },
    ],
    hasOtherTextInput: true,
    required: false,
    priority: 12,
    isAdvanced: true,
  },
  {
    id: 'deadline_urgency',
    label: 'When do you need the funding?',
    type: 'single-select' as const,
    options: [
      { value: 'immediate', label: 'Within 1 month' },
      { value: 'short_term', label: '1-3 months' },
      { value: 'medium_term', label: '3-6 months' },
      { value: 'long_term', label: '6+ months' },
    ],
    required: false,
    priority: 13,
    isAdvanced: true,
  },
  {
    id: 'project_duration',
    label: 'How long will your project run?',
    type: 'range' as const,
    min: 1,
    max: 36,
    step: 1,
    unit: 'months',
    required: false,
    priority: 14,
    isAdvanced: true,
  },
];

const ALL_QUESTIONS: QuestionDefinition[] = [...CORE_QUESTIONS, ...ADVANCED_QUESTIONS];

export default function ProgramFinder({ 
  onProgramSelect
}: ProgramFinderProps) {
  const router = useRouter();
  const { t, locale } = useI18n();
  
  // Get translated questions
  const translatedQuestions = useMemo<QuestionDefinition[]>(() => {
    return ALL_QUESTIONS.map((q) => {
      const translatedLabel = (t(`reco.questions.${q.id}` as any) as string) || q.label;
      if (q.type === 'single-select' || q.type === 'multi-select') {
        const translatedOptions = q.options.map((opt) => ({
          ...opt,
          label: (t(`reco.options.${q.id}.${opt.value}` as any) as string) || opt.label,
        }));

        if (q.type === 'multi-select' && q.subCategories) {
          const translatedSubCategories = Object.fromEntries(
            Object.entries(q.subCategories).map(([key, items]) => [
              key,
              items.map((subItem) => ({
                ...subItem,
                label:
                  (t(`reco.options.${q.id}.${subItem.value}` as any) as string) ||
                  subItem.label,
              })),
            ])
          );

          return {
            ...q,
            label: translatedLabel,
            options: translatedOptions,
            subCategories: translatedSubCategories,
          };
        }

        return {
          ...q,
          label: translatedLabel,
          options: translatedOptions,
        };
      }

      return {
        ...q,
        label: translatedLabel,
      };
    });
  }, [t]);
  const [results, setResults] = useState<EnhancedProgramResult[]>([]);
  const [debugInfo, setDebugInfo] = useState<Record<string, any> | null>(null);
  const [noResultsHint, setNoResultsHint] = useState<{ en: string; de: string } | null>(null);
  const defaultNoResultsHint = useMemo(() => ({
    en: 'No programs matched yet. Increase your funding range or allow additional funding types such as loans or equity.',
    de: 'Noch keine Programme gefunden. Erhöhen Sie den Finanzierungsbedarf oder erlauben Sie weitere Finanzierungstypen wie Darlehen oder Beteiligungen.',
  }), []);

  const setEmptyResults = useCallback((customHint?: { en: string; de: string }) => {
    setResults([]);
    setNoResultsHint(customHint || defaultNoResultsHint);
  }, [defaultNoResultsHint]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showPromptPreview, setShowPromptPreview] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasAttemptedGeneration, setHasAttemptedGeneration] = useState(false); // Track if user clicked generate
  
  // Guided mode state
  const [answers, setAnswers] = useState<Record<string, any>>({});
  
  // All questions are visible by default - no progressive disclosure
  // Results only shown after ALL questions are answered
  
  // Horizontal question navigation (carousel)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  
  // Mobile: Track active tab (questions vs results)
  const [mobileActiveTab, setMobileActiveTab] = useState<'questions' | 'results'>('questions');
  
  // Get visible questions (with skip logic)
  const visibleQuestions = useMemo(
    () => translatedQuestions.filter((q) => !q.isAdvanced || showAdvancedFilters),
    [translatedQuestions, showAdvancedFilters]
  );
  const advancedQuestions = useMemo(
    () => translatedQuestions.filter((q) => q.isAdvanced),
    [translatedQuestions]
  );
  
  // Ensure currentQuestionIndex is within bounds
  useEffect(() => {
    if (currentQuestionIndex >= visibleQuestions.length && visibleQuestions.length > 0) {
      setCurrentQuestionIndex(visibleQuestions.length - 1);
    }
  }, [visibleQuestions.length, currentQuestionIndex]);
  
  
  // Count only non-empty answers (fix logic flaw)
  // Only count main question IDs, exclude sub-options and sub-categories
  const mainQuestionIds = visibleQuestions.map(q => q.id);
  const isAnswerProvided = (value: any) => {
    if (value === undefined || value === null) return false;
    if (typeof value === 'string') {
      return value.trim().length > 0;
    }
    if (Array.isArray(value)) {
      return value.length > 0;
    }
    return true;
  };

  const answeredCount = mainQuestionIds.filter(questionId => {
  const value = answers[questionId];
  if (!isAnswerProvided(value)) {
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
  const advancedAnsweredCount = useMemo(() => {
    return advancedQuestions.filter((question) => isAnswerProvided(answers[question.id])).length;
  }, [advancedQuestions, answers]);
  
  // Minimum questions for results (4 critical questions: location, company_type, funding_amount, company_stage)
  const MIN_QUESTIONS_FOR_RESULTS = 4;
  const REQUIRED_QUESTION_IDS = ['company_type', 'location', 'funding_amount', 'company_stage'] as const;
  const missingRequiredAnswers = REQUIRED_QUESTION_IDS.filter((questionId) => !isAnswerProvided(answers[questionId]));
  const missingRequiredLabels = missingRequiredAnswers.map((questionId) => {
    const question = translatedQuestions.find((q) => q.id === questionId);
    return question?.label || questionId;
  });
  const hasRequiredAnswers = missingRequiredAnswers.length === 0;
  const hasEnoughAnswers = answeredCount >= MIN_QUESTIONS_FOR_RESULTS && hasRequiredAnswers;
  const remainingQuestions = Math.max(0, MIN_QUESTIONS_FOR_RESULTS - answeredCount);
  const promptPreviewPayload = useMemo(() => ({
    answers,
    max_results: 20,
    requiredQuestionsMet: hasRequiredAnswers,
    advancedFiltersIncluded: showAdvancedFilters,
    questionOrder: visibleQuestions.map((q) => ({
      id: q.id,
      required: REQUIRED_QUESTION_IDS.includes(q.id as typeof REQUIRED_QUESTION_IDS[number]),
      advanced: q.isAdvanced,
    })),
  }), [answers, hasRequiredAnswers, showAdvancedFilters, visibleQuestions]);
  
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

  // Removed handleViewAllResults - results are shown inline in ProgramFinder
  
  // Helper function to format answer for display
  const formatAnswerForDisplay = (questionId: string, value: any): string => {
    if (value === undefined || value === null || value === '') return '';
    
    const question = translatedQuestions.find(q => q.id === questionId);
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
                      {visibleQuestions.map((q: QuestionDefinition, idx) => {
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
                  {/* Path Indicator with merged numbered bubbles */}
                  <div className="mb-4">
                    <PathIndicator 
                      currentStep={currentQuestionIndex + 1} 
                      totalSteps={visibleQuestions.length}
                      visibleQuestions={visibleQuestions}
                      currentQuestionIndex={currentQuestionIndex}
                      answers={answers}
                      onStepClick={setCurrentQuestionIndex}
                    />
                  </div>
                  
                  {/* Horizontal Question Navigation */}
                  {visibleQuestions.length > 0 && (
                    <div className="relative">
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
                                                      : 'Bitte angeben...')
                                                  : (question.id === 'company_type'
                                                      ? 'e.g., Association, Cooperative, Foundation'
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
                                        
                                        {/* Text input for "Other" option */}
                                        {isOtherOption && Array.isArray(value) && value.includes('other') && question.hasOtherTextInput && (
                                          <div className="ml-4 space-y-1.5 border-l-2 border-blue-200 pl-3 pt-1 mt-2 animate-in fade-in duration-200">
                                            <label className="text-xs font-medium text-gray-600 mb-1 block">
                                              {t('reco.ui.pleaseSpecify') || 'Please specify:'}
                                            </label>
                                            <input
                                              type="text"
                                              placeholder={
                                                locale === 'de'
                                                  ? 'Bitte angeben...'
                                                  : 'Please specify...'
                                              }
                                              value={otherTextValue}
                                              onChange={(e) => {
                                                handleAnswer(`${question.id}_other`, e.target.value);
                                              }}
                                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                              autoFocus
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
                              {question.type === 'range' && (() => {
                                const rangeQuestion = question;
                                const sliderValue = typeof value === 'number' ? value : rangeQuestion.min;

                                const formatRangeValue = (val: number) => {
                                  if (rangeQuestion.unit === 'EUR') {
                                    return `€${val.toLocaleString('de-DE')}`;
                                  }
                                  if (rangeQuestion.unit === 'months') {
                                    return `${val} ${t('reco.ui.sliderMonths') || 'months'}`;
                                  }
                                  if (rangeQuestion.unit === 'people') {
                                    return `${val} ${t('reco.ui.sliderPeople') || 'people'}`;
                                  }
                                  if (rangeQuestion.unit === 'years') {
                                    return `${val.toFixed(1)} ${rangeQuestion.unit}`;
                                  }
                                  return `${val} ${rangeQuestion.unit}`;
                                };

                                return (
                                  <div className="space-y-4">
                                    <div className="space-y-2">
                                      <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm text-gray-600">
                                          {rangeQuestion.unit === 'EUR' ? '€' : ''}
                                          {rangeQuestion.min.toLocaleString('de-DE')}
                                          {rangeQuestion.unit === 'EUR'
                                            ? ''
                                            : rangeQuestion.unit === 'months'
                                            ? ` ${t('reco.ui.sliderMonths') || 'months'}`
                                            : rangeQuestion.unit === 'people'
                                            ? ` ${t('reco.ui.sliderPeople') || 'people'}`
                                            : ` ${rangeQuestion.unit}`}
                                        </span>
                                        <span className="text-sm text-gray-600">
                                          {rangeQuestion.unit === 'EUR' ? '€' : ''}
                                          {rangeQuestion.max.toLocaleString('de-DE')}
                                          {rangeQuestion.unit === 'EUR'
                                            ? ''
                                            : rangeQuestion.unit === 'months'
                                            ? ` ${t('reco.ui.sliderMonths') || 'months'}`
                                            : rangeQuestion.unit === 'people'
                                            ? ` ${t('reco.ui.sliderPeople') || 'people'}`
                                            : ` ${rangeQuestion.unit}`}
                                        </span>
                                      </div>
                                      <input
                                        type="range"
                                        min={rangeQuestion.min}
                                        max={rangeQuestion.max}
                                        step={rangeQuestion.step}
                                        value={sliderValue}
                                        onChange={(e) => {
                                          const numValue =
                                            rangeQuestion.unit === 'years'
                                              ? parseFloat(e.target.value)
                                              : parseInt(e.target.value, 10);
                                          handleAnswer(rangeQuestion.id, numValue);
                                        }}
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                        style={{
                                          background: rangeQuestion.min < 0
                                            ? `linear-gradient(to right, #2563eb 0%, #2563eb ${Math.max(
                                                0,
                                                Math.min(
                                                  100,
                                                  ((sliderValue - rangeQuestion.min) /
                                                    (rangeQuestion.max - rangeQuestion.min)) *
                                                    100
                                                )
                                              )}%, #e5e7eb ${Math.max(
                                                0,
                                                Math.min(
                                                  100,
                                                  ((sliderValue - rangeQuestion.min) /
                                                    (rangeQuestion.max - rangeQuestion.min)) *
                                                    100
                                                )
                                              )}%, #e5e7eb 100%)`
                                            : `linear-gradient(to right, #2563eb 0%, #2563eb ${
                                                ((sliderValue - rangeQuestion.min) /
                                                  (rangeQuestion.max - rangeQuestion.min)) *
                                                100
                                              }%, #e5e7eb ${
                                                ((sliderValue - rangeQuestion.min) /
                                                  (rangeQuestion.max - rangeQuestion.min)) *
                                                100
                                              }%, #e5e7eb 100%)`,
                                        }}
                                      />
                                      <div className="text-center mt-3">
                                        {rangeQuestion.editableValue && rangeQuestion.unit === 'EUR' ? (
                                          <div className="mt-4">
                                            <div className="flex items-center justify-center gap-2">
                                              <span className="text-lg font-semibold text-gray-700">€</span>
                                              <input
                                                type="text"
                                                value={
                                                  rawInputValues[rangeQuestion.id] !== undefined
                                                    ? rawInputValues[rangeQuestion.id]
                                                    : sliderValue.toLocaleString('de-DE')
                                                }
                                                onChange={(e) => {
                                                  const inputValue = e.target.value.replace(/[^\d]/g, '');
                                                  setRawInputValues((prev) => ({
                                                    ...prev,
                                                    [rangeQuestion.id]: inputValue,
                                                  }));
                                                  if (inputValue === '') return;
                                                  const numValue = Math.floor(parseFloat(inputValue));
                                                  if (!isNaN(numValue)) {
                                                    const clamped = Math.max(
                                                      rangeQuestion.min,
                                                      Math.min(rangeQuestion.max, numValue)
                                                    );
                                                    handleAnswer(rangeQuestion.id, clamped);
                                                  }
                                                }}
                                                onFocus={() => {
                                                  setRawInputValues((prev) => ({
                                                    ...prev,
                                                    [rangeQuestion.id]: sliderValue.toString(),
                                                  }));
                                                }}
                                                onBlur={(e) => {
                                                  const cleaned = e.target.value.replace(/[^\d]/g, '');
                                                  const numValue = Math.floor(parseFloat(cleaned || '0'));
                                                  setRawInputValues((prev) => {
                                                    const next = { ...prev };
                                                    delete next[rangeQuestion.id];
                                                    return next;
                                                  });
                                                  if (isNaN(numValue) || numValue < rangeQuestion.min) {
                                                    handleAnswer(rangeQuestion.id, rangeQuestion.min);
                                                  } else if (numValue > rangeQuestion.max) {
                                                    handleAnswer(rangeQuestion.id, rangeQuestion.max);
                                                  } else {
                                                    handleAnswer(rangeQuestion.id, numValue);
                                                  }
                                                }}
                                                placeholder={`${rangeQuestion.min.toLocaleString(
                                                  'de-DE'
                                                )} - ${rangeQuestion.max.toLocaleString('de-DE')}`}
                                                className="w-48 px-4 py-3 border-2 border-blue-300 rounded-lg text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center bg-white shadow-sm"
                                              />
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="text-base font-semibold text-gray-800">
                                            {formatRangeValue(sliderValue)}
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    {!rangeQuestion.required && (
                                      <button
                                        onClick={() => {
                                          handleAnswer(rangeQuestion.id, undefined);
                                          if (currentQuestionIndex < visibleQuestions.length - 1) {
                                            setTimeout(
                                              () => setCurrentQuestionIndex(currentQuestionIndex + 1),
                                              300
                                            );
                                          }
                                        }}
                                        className="w-full mt-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 border-2 border-gray-300 rounded-lg hover:bg-gray-100 hover:border-gray-400 transition-all"
                                      >
                                        {t('reco.skipQuestion') || 'Skip this question'} →
                                      </button>
                                    )}
                                  </div>
                                );
                              })()}
                              
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
          </div>

        <div className="max-w-2xl mx-auto w-full mt-4">
          <Card className="p-4 border-2 border-dashed border-blue-200 bg-white/80 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-base font-semibold text-gray-900">Advanced filters</p>
                <p className="text-sm text-gray-600">
                  Optional details like team size, revenue stage, impact focus, and project timeline.
                </p>
              </div>
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="px-3 py-2 rounded-md text-sm font-medium border border-blue-500 text-blue-600 hover:bg-blue-50 transition-colors"
              >
                {showAdvancedFilters ? 'Hide advanced' : 'Add detail'}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              {showAdvancedFilters
                ? `${advancedAnsweredCount}/${advancedQuestions.length} advanced questions answered. They now appear at the end of your question path.`
                : 'Currently hidden. Toggle to refine recommendations with more context.'}
            </p>
          </Card>
        </div>

        <div className="max-w-2xl mx-auto w-full mt-4">
          <Card className="p-4 border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-base font-semibold text-gray-900">Prompt preview</p>
                <p className="text-sm text-gray-600">Review the structured payload we send to the recommendation engine.</p>
              </div>
              <button
                onClick={() => setShowPromptPreview(!showPromptPreview)}
                className="px-3 py-2 rounded-md text-sm font-medium border border-gray-400 text-gray-700 hover:bg-gray-100 transition-colors"
              >
                {showPromptPreview ? 'Hide preview' : 'Show preview'}
              </button>
            </div>
            {showPromptPreview && (
              <pre className="mt-3 text-xs text-gray-800 bg-gray-50 border border-gray-200 rounded-lg p-3 max-h-64 overflow-auto whitespace-pre-wrap">
                {JSON.stringify(promptPreviewPayload, null, 2)}
              </pre>
            )}
          </Card>
        </div>
          
          {/* Loading Indicator - Inline */}
          {isLoading && (
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
          )}
          
          {/* Results Modal/Popup - Open when we have results OR when generation finished with no results */}
          <Dialog open={(results.length > 0 && !isLoading) || (!isLoading && hasAttemptedGeneration && results.length === 0)} onOpenChange={(open) => {
            if (!open) {
              setEmptyResults();
              setHasAttemptedGeneration(false); // Reset when dialog closes
            }
          }}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {locale === 'de' ? 'Gefundene Förderprogramme' : 'Found Funding Programs'} ({results.length})
                </DialogTitle>
                <DialogDescription>
                  {locale === 'de' 
                    ? 'Hier sind die passendsten Förderprogramme für Sie.'
                    : 'Here are the most suitable funding programs for you.'}
                </DialogDescription>
              </DialogHeader>
              {debugInfo && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs text-gray-600 mb-4 space-y-1">
                  <div>
                    <strong>LLM:</strong>{' '}
                    {debugInfo.llmError
                      ? `Error - ${debugInfo.llmError}`
                      : 'Success'}
                  </div>
                  <div>
                    <strong>Generated:</strong> {debugInfo.llmProgramCount ?? 'n/a'} / <strong>After filtering:</strong> {debugInfo.afterFiltering ?? 'n/a'}
                  </div>
                  {typeof debugInfo.fallbackUsed === 'boolean' && (
                    <div>
                      <strong>Fallback used:</strong> {debugInfo.fallbackUsed ? 'Yes' : 'No'}
                    </div>
                  )}
                </div>
              )}
              <div className="space-y-4 mt-4">
                {results.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600 text-lg mb-2">
                      {locale === 'de' ? 'Keine Programme gefunden' : 'No programs found'}
                    </p>
                    <p className="text-gray-500 text-sm">
                      {locale === 'de' 
                        ? (noResultsHint?.de || 'Aktuell passt kein Programm. Bitte passen Sie Ihre Antworten an.')
                        : (noResultsHint?.en || 'No programs matched yet. Please adjust your answers and try again.')}
                    </p>
                    <p className="text-gray-400 text-xs mt-4">
                      {locale === 'de' 
                        ? 'Tipp: Erhöhen Sie das Budget oder erlauben Sie andere Finanzierungstypen (z. B. Darlehen).'
                        : 'Tip: Increase your budget or allow other funding instruments (e.g., loans).'}
                    </p>
                  </div>
                ) : (
                  results.map((program, index) => (
                  <Card key={program.id || index} className="p-6 border-2 border-blue-200 hover:border-blue-400 transition-all">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-semibold text-gray-900">
                            {program.name || `Program ${index + 1}`}
                          </h3>
                        {program.source === 'fallback' && (
                          <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800 border border-yellow-300">
                            Fallback
                          </span>
                        )}
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
                  ))
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      {/* Sticky Bottom Bar - Centered Generate Button - Always visible on desktop */}
      <div className="fixed bottom-0 left-0 right-0 bg-white shadow-2xl z-50 border-t-2 border-gray-200 hidden lg:block">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-center">
              <button
                onClick={async () => {
                  if (!hasEnoughAnswers) {
                  if (!hasRequiredAnswers) {
                    const requiredList = missingRequiredLabels.join(', ');
                    alert(locale === 'de'
                      ? `Bitte beantworten Sie zuerst die Pflichtfragen: ${requiredList}.`
                      : `Please complete the required questions first: ${requiredList}.`);
                    return;
                  }
                    alert(locale === 'de' 
                      ? `Bitte beantworten Sie mindestens ${MIN_QUESTIONS_FOR_RESULTS} Fragen, um Förderprogramme zu generieren.`
                      : `Please answer at least ${MIN_QUESTIONS_FOR_RESULTS} questions to generate funding programs.`);
                    return;
                  }
                setIsLoading(true);
                setHasAttemptedGeneration(true); // Mark that user clicked generate
                console.log('🚀 Starting program generation...');
                console.log('📋 Answers being sent:', answers);
                console.log('✅ Has enough answers:', hasEnoughAnswers);
                
                try {
                  // Use debug endpoint to see what's happening
                  const useDebug = process.env.NODE_ENV === 'development';
                  const endpoint = useDebug ? '/api/programs/recommend-debug' : '/api/programs/recommend';
                  
                  console.log(`📡 Calling API endpoint: ${endpoint}`);
                  const response = await fetch(endpoint, {
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
                    let parsedError: any = null;
                    try {
                      parsedError = JSON.parse(errorText);
                    } catch (_parseErr) {
                      parsedError = null;
                    }

                    const missingFields: string[] = Array.isArray(parsedError?.missing) ? parsedError.missing : [];
                    const missingFieldLabels = missingFields
                      .map((fieldId) => {
                        const question = translatedQuestions.find((q) => q.id === fieldId);
                        return question?.label || fieldId;
                      })
                      .join(', ');

                    const friendlyMessage = missingFieldLabels
                      ? (locale === 'de'
                          ? `Bitte beantworten Sie zuerst: ${missingFieldLabels}.`
                          : `Please complete: ${missingFieldLabels} before generating programs.`)
                      : (locale === 'de'
                          ? 'Es konnten keine Programme generiert werden. Bitte versuchen Sie es später erneut.'
                          : 'We could not generate programs right now. Please try again shortly.');

                    alert(friendlyMessage);
                    setEmptyResults();
                    setIsLoading(false);
                    return;
                  }
                  
                  const data = await response.json();
                  setDebugInfo(data.debug || null);
                  console.log('📦 API Response data:', {
                    success: data.success,
                    count: data.count,
                    programsLength: data.programs?.length || 0,
                    extractionResults: data.extraction_results?.length || 0,
                    source: data.source,
                  });
                  
                  // Log debug info if available
                  if (data.debug) {
                    console.log('🔍 DEBUG INFO:', JSON.stringify(data.debug, null, 2));
                    console.log('🔍 Step-by-step breakdown:');
                    console.log(`   1. Received answers: ${data.debug.step1_receivedAnswers?.join(', ') || 'none'}`);
                    console.log(`   2. LLM Config: OpenAI=${data.debug.step2_llmConfig?.hasOpenAI}, Custom=${data.debug.step2_llmConfig?.hasCustomLLM}`);
                    console.log(`   3. Programs generated: ${data.debug.step3_programsGenerated}`);
                    console.log(`   4. Breakdown: Real LLM=${data.debug.step4_programBreakdown?.realLLM}, Fallback=${data.debug.step4_programBreakdown?.fallback}`);
                    console.log(`   5. After filtering: ${data.debug.step5_afterFiltering}`);
                    if (data.debug.step6_samplePrograms?.length > 0) {
                      console.log(`   6. Sample programs:`);
                      data.debug.step6_samplePrograms.forEach((p: any, i: number) => {
                        console.log(`      ${i + 1}. ${p.name} (${p.source}, fallback=${p.isFallback}, funding=€${p.funding})`);
                      });
                    }
                  }
                  
                  const extractedPrograms = data.programs || [];
                  console.log(`✅ Received ${extractedPrograms.length} programs from API`);
                  
                  if (extractedPrograms.length === 0) {
                    console.error('❌ CRITICAL: No programs returned from API');
                    console.error('API response:', JSON.stringify(data, null, 2));
                    console.error('Answers sent:', JSON.stringify(answers, null, 2));
                    
                    // Check extraction results for more details
                    const extractionResults = data.extraction_results || data.extractionResults || [];
                    const hasLLMError = extractionResults.some((r: any) => r.error);
                    
                    // Show user-friendly message
                    if (data.error) {
                      console.error('API Error:', data.error, data.message);
                      alert(`Error generating programs: ${data.message || data.error}. Please check your LLM configuration (OPENAI_API_KEY or CUSTOM_LLM_ENDPOINT).`);
                    } else if (hasLLMError) {
                      const llmError = extractionResults.find((r: any) => r.error);
                      console.error('LLM Error:', llmError);
                      alert(`Error generating programs: ${llmError.error || 'LLM generation failed'}. Please check your LLM configuration and try again.`);
                    } else {
                      console.error('API returned success but no programs. This should not happen with the new fixes.');
                      console.error('Check server logs for details. Emergency fallback should have triggered.');
                      alert('No programs were generated. This is unexpected - please try again or contact support. The system should always return at least some programs.');
                    }
                    setEmptyResults();
                    setDebugInfo(null);
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
                  console.log(`🎯 Sorted programs:`, sorted.map(p => ({ name: p.name, score: p.score })));
                  
                  if (sorted.length > 0) {
                    setResults(sorted);
                    setNoResultsHint(null);
                  } else {
                    setEmptyResults();
                  }
                  console.log(`✅ Set ${sorted.length} results in state`);
                  
                  if (sorted.length > 0) {
                    setMobileActiveTab('results');
                    console.log('✅ Switched to results tab');
                    console.log('✅ Dialog should open now (results.length > 0 && !isLoading)');
                  } else {
                    console.error('❌ CRITICAL: No programs to display after scoring!');
                    console.error('❌ This means either:');
                    console.error('   1. API returned 0 programs');
                    console.error('   2. Scoring returned 0 programs');
                    console.error('   3. Programs were filtered out');
                    console.error('❌ Check browser console and server logs for details');
                    alert(locale === 'de' 
                      ? 'Keine Programme gefunden. Bitte überprüfen Sie die Server-Logs für Details.'
                      : 'No programs found. Please check server logs for details.');
                  }
                } catch (error: any) {
                  console.error('❌ Error generating programs:', error);
                  console.error('Error details:', {
                    message: error.message,
                    stack: error.stack,
                  });
                  setDebugInfo(null);
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
                  ? (hasRequiredAnswers
                      ? `Bitte beantworten Sie mindestens ${MIN_QUESTIONS_FOR_RESULTS} Fragen`
                      : 'Bitte füllen Sie alle Pflichtfragen aus')
                  : (hasRequiredAnswers
                      ? `Please answer at least ${MIN_QUESTIONS_FOR_RESULTS} questions`
                      : 'Please complete all required questions')) : undefined}
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
                    {hasRequiredAnswers
                      ? (locale === 'de' 
                          ? `Noch ${remainingQuestions} Fragen` 
                          : `${remainingQuestions} more questions`)
                      : (locale === 'de'
                          ? 'Pflichtfragen fehlen'
                          : 'Required answers missing')}
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
        </div>
    </div>
  );
}

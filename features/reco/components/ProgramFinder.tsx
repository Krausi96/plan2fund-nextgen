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

const DAILY_GENERATION_LIMIT = 3;
const QUOTA_STORAGE_KEY = 'programFinderDailyQuota';

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
// REQUIRED CORE QUESTIONS (simple flow):
// 1. funding_intent (gate – not sent to LLM/API)
// 2. company_type (merged persona + maturity signal)
// 3. project_scope (ensures a project/venture exists)
// 4. location (CRITICAL for eligibility)
// 5. industry_focus (CRITICAL for thematic matching)
// 6. funding_amount (CRITICAL for amount matching)
// OPTIONAL CORE QUESTION:
// 7. use_of_funds (improves scoring + LLM profile)
// ADVANCED QUESTIONS (optional refinements):
// - project_duration, deadline_urgency, impact_focus, co_financing, team_size
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
  // hasLegalType?: boolean; // REMOVED - not used in matching
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
    id: 'funding_intent',
    label: 'Are you looking for a funding option for a project or venture?',
    type: 'single-select' as const,
    options: [
      { value: 'funding_yes', label: 'Yes, I want to find funding programs' },
      { value: 'planning_only', label: 'Not yet – I just need planning/editor help' },
    ],
    required: true,
    priority: 1,
    isAdvanced: false,
  },
  {
    id: 'company_type', // CRITICAL - Used in matching (must match)
    label: 'Which description best fits you right now?',
    type: 'single-select' as const,
    options: [
      { value: 'founder_idea', label: 'Founder exploring an idea (no company yet)' },
      { value: 'startup_building', label: 'Startup building its first product/prototype' },
      { value: 'startup_traction', label: 'Startup with first traction (incorporated < ~3 years)' },
      { value: 'sme_established', label: 'Established SME (3+ years of operations)' },
      { value: 'other', label: 'Other – please specify (e.g., institutional team, advisor, municipality)' },
    ],
    required: true,
    priority: 4,
    hasOtherTextInput: true,
    isAdvanced: false, // Core question
  },
  {
    id: 'project_scope',
    label: 'What are you working on?',
    type: 'single-select' as const,
    options: [
      { value: 'exploring_plan', label: 'Exploring or drafting a plan' },
      { value: 'building_product', label: 'Building a product or prototype' },
      { value: 'research_innovation', label: 'Running research or innovation work' },
      { value: 'scaling_expansion', label: 'Scaling or market expansion' },
      { value: 'other', label: 'Other – please specify' },
    ],
    required: true,
    priority: 3,
    hasOtherTextInput: true,
    isAdvanced: false,
  },
  {
    id: 'location', // CRITICAL - Used in matching (must match)
    label: 'Where will the project or venture take place?',
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
    label: 'How much funding do you plan to request (if any)?',
    type: 'range' as const,
    min: 0,
    max: 1000000,
    step: 1000,
    unit: 'EUR',
    required: true,
    priority: 6,
    editableValue: true, // Allow editing the number directly
    isAdvanced: false, // Core question
  },
  {
    id: 'industry_focus', // OPTIONAL - Used in matching but not critical
    label: 'Which focus best describes your project?',
    type: 'multi-select' as const,
    options: [
      { value: 'digital', label: 'Digital & Software' },
      { value: 'sustainability', label: 'Climate & Sustainability' },
      { value: 'health', label: 'Health & Life Sciences' },
      { value: 'manufacturing', label: 'Manufacturing & Hardware' },
      { value: 'export', label: 'Internationalisation' },
      { value: 'other', label: 'Something else' },
    ],
    required: true,
    priority: 5,
    hasOtherTextInput: true,
    isAdvanced: false, // Core question - helps with matching
    // Enhanced: Industry subcategories for better matching
    subCategories: {
      digital: [
        { value: 'ai', label: 'AI & Machine Learning' },
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
    id: 'use_of_funds',
    label: 'How will you invest support or funding?',
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
    priority: 7,
    hasOtherTextInput: true,
    isAdvanced: false,
  },
];

const ADVANCED_QUESTIONS: QuestionDefinition[] = [
  {
    id: 'project_duration',
    label: 'How long will the funded work run?',
    type: 'range' as const,
    min: 1,
    max: 36,
    step: 1,
    unit: 'months',
    required: false,
    priority: 8,
    isAdvanced: true,
  },
  {
    id: 'deadline_urgency',
    label: 'When do you need a funding decision?',
    type: 'single-select' as const,
    options: [
      { value: 'immediate', label: 'Within 1 month' },
      { value: 'short_term', label: 'Within 1-3 months' },
      { value: 'medium_term', label: 'Within 3-6 months' },
      { value: 'long_term', label: '6+ months' },
    ],
    required: false,
    priority: 9,
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
    priority: 10,
    isAdvanced: true,
  },
  {
    id: 'co_financing',
    label: 'Can you contribute part of the project budget yourself?',
    type: 'single-select' as const,
    options: [
      { value: 'co_yes', label: 'Yes, we can cover a share (e.g., 20%+)' },
      { value: 'co_no', label: 'No, we need full external funding' },
      { value: 'co_uncertain', label: 'Not sure yet' },
    ],
    required: false,
    priority: 11,
    hasCoFinancingPercentage: true,
    isAdvanced: true,
  },
  {
    id: 'team_size',
    label: 'How large is your active team?',
    type: 'single-select' as const,
    options: [
      { value: 'solo', label: 'Solo founder' },
      { value: 'team_2_5', label: '2-5 people' },
      { value: 'team_6_20', label: '6-20 people' },
      { value: 'team_20_plus', label: '20+ people' },
    ],
    required: false,
    priority: 12,
    isAdvanced: true,
  },
];

const COMPANY_STAGE_MAP: Record<string, string> = {
  founder_idea: 'idea',
  startup_building: 'inc_lt_6m',
  startup_traction: 'inc_6_36m',
  sme_established: 'inc_gt_36m',
};

function inferCompanyStageFromAnswers(answersSnapshot: Record<string, any>): string | undefined {
  const companyTypeValue = answersSnapshot.company_type as string | undefined;
  if (!companyTypeValue) {
    return undefined;
  }

  if (COMPANY_STAGE_MAP[companyTypeValue]) {
    return COMPANY_STAGE_MAP[companyTypeValue];
  }

  if (companyTypeValue === 'other') {
    const otherRaw = (answersSnapshot['company_type_other'] || '').toString().toLowerCase();
    if (otherRaw.includes('research') || otherRaw.includes('university') || otherRaw.includes('lab')) {
      return 'research_org';
    }
    return 'other';
  }

  return 'other';
}

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

  const setEmptyResults = useCallback(() => {
    setResults([]);
  }, []);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false); // Hide advanced by default
  const [isLoading, setIsLoading] = useState(false);
  const [hasAttemptedGeneration, setHasAttemptedGeneration] = useState(false); // Track if user clicked generate
  const [confirmProgram, setConfirmProgram] = useState<EnhancedProgramResult | null>(null);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const confirmDialogCopy = useMemo(() => ({
    title: (t('reco.confirmDialog.title' as any) as string) || 'Use this program in your plan?',
    description: (t('reco.confirmDialog.description' as any) as string) ||
      'We’ll bring this program’s requirements, document checklist, deadlines, and funding range into the editor. Your answers in ProgramFinder stay here—editor sections remain blank until you fill them.',
    points: [
      t('reco.confirmDialog.point1' as any) as string,
      t('reco.confirmDialog.point2' as any) as string,
      t('reco.confirmDialog.point3' as any) as string,
    ].filter(Boolean) as string[],
    useButton: (t('reco.confirmDialog.useButton' as any) as string) || 'Use this program',
    pasteButton: (t('reco.confirmDialog.pasteButton' as any) as string) || 'Paste a program link instead',
    quota: (t('reco.quota.limitReached' as any) as string) ||
      'You’ve reached today’s limit of {limit} AI searches. Paste a program link directly in the editor or try again tomorrow.',
    emptyTitle: (t('reco.results.empty.title' as any) as string) || 'No matching programs yet',
    emptyBody: (t('reco.results.empty.body' as any) as string) ||
      'We couldn’t find specific programs for these answers. Adjust answers or connect a program you already know.',
    retryButton: (t('reco.results.empty.retry' as any) as string) || 'Try again in ProgramFinder',
    manualButton: (t('reco.results.empty.manual' as any) as string) || 'Add program in editor',
  }), [t]);
  const quotaLimitMessage = useMemo(
    () => confirmDialogCopy.quota.replace('{limit}', String(DAILY_GENERATION_LIMIT)),
    [confirmDialogCopy]
  );

  const getQuotaStatus = useCallback(() => {
    if (typeof window === 'undefined') {
      return { count: 0, remaining: DAILY_GENERATION_LIMIT };
    }
    try {
      const raw = window.localStorage.getItem(QUOTA_STORAGE_KEY);
      const today = new Date().toISOString().slice(0, 10);
      if (!raw) {
        return { count: 0, remaining: DAILY_GENERATION_LIMIT };
      }
      const parsed = JSON.parse(raw);
      if (parsed?.date === today) {
        const count = Number(parsed.count) || 0;
        return { count, remaining: Math.max(DAILY_GENERATION_LIMIT - count, 0) };
      }
      return { count: 0, remaining: DAILY_GENERATION_LIMIT };
    } catch (error) {
      console.warn('Failed to read ProgramFinder quota status:', error);
      return { count: 0, remaining: DAILY_GENERATION_LIMIT };
    }
  }, []);

  const registerGenerationAttempt = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      const today = new Date().toISOString().slice(0, 10);
      const raw = window.localStorage.getItem(QUOTA_STORAGE_KEY);
      let count = 0;
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.date === today) {
          count = Number(parsed.count) || 0;
        }
      }
      const nextCount = Math.min(count + 1, DAILY_GENERATION_LIMIT);
      window.localStorage.setItem(
        QUOTA_STORAGE_KEY,
        JSON.stringify({ date: today, count: nextCount })
      );
    } catch (error) {
      console.warn('Failed to register ProgramFinder quota usage:', error);
    }
  }, []);

  const persistSelectedProgram = useCallback((program: EnhancedProgramResult) => {
    if (typeof window === 'undefined') return;
    const programId = program.id || `program_${Date.now()}`;
    try {
      localStorage.setItem('selectedProgram', JSON.stringify({
        id: programId,
        name: program.name,
        categorized_requirements: program.categorized_requirements || {},
        type: program.type || (program.funding_types?.[0]) || 'grant',
        url: (program as any).url || (program as any).source_url || null,
      }));
    } catch (error) {
      console.warn('Failed to persist selected program:', error);
    }
    const params = new URLSearchParams({
      product: 'submission',
      programId: programId,
    });
    router.push(`/editor?${params.toString()}`);
  }, [router]);

  const handleManualProgramEntry = useCallback(() => {
    setIsConfirmDialogOpen(false);
    setConfirmProgram(null);
    router.push('/editor?product=submission&connect=manual');
  }, [router]);

  const handleUseSelectedProgram = useCallback(() => {
    if (!confirmProgram) return;
    persistSelectedProgram(confirmProgram);
    setIsConfirmDialogOpen(false);
    setConfirmProgram(null);
  }, [confirmProgram, persistSelectedProgram]);

  const handleRetryWizard = useCallback(() => {
    setEmptyResults();
    setHasAttemptedGeneration(false);
    setIsConfirmDialogOpen(false);
    setConfirmProgram(null);
    setMobileActiveTab('questions');
  }, [setEmptyResults]);
  
  // Guided mode state
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [planningModalOpen, setPlanningModalOpen] = useState(false);
  const answersForApi = useMemo(() => {
    const { funding_intent, ...rest } = answers;
    return rest;
  }, [answers]);
  
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
  
// Minimum questions for results (core questions before showing programs)
const MIN_QUESTIONS_FOR_RESULTS = 5;
const REQUIRED_QUESTION_IDS = ['company_type', 'project_scope', 'location', 'industry_focus', 'funding_amount'] as const;
  const missingRequiredAnswers = REQUIRED_QUESTION_IDS.filter((questionId) => !isAnswerProvided(answers[questionId]));
  const missingRequiredLabels = missingRequiredAnswers.map((questionId) => {
    const question = translatedQuestions.find((q) => q.id === questionId);
    return question?.label || questionId;
  });
  const hasRequiredAnswers = missingRequiredAnswers.length === 0;
  const hasEnoughAnswers = answeredCount >= MIN_QUESTIONS_FOR_RESULTS && hasRequiredAnswers;
  const remainingQuestions = Math.max(0, MIN_QUESTIONS_FOR_RESULTS - answeredCount);
  
  // State to control when to show results
  const [_showResults, _setShowResults] = useState(false);
  
  // State for raw input values (to allow typing without formatting interference)
  const [rawInputValues, setRawInputValues] = useState<Record<string, string>>({});
  
  // Only update results when user explicitly requests them (after completing or clicking button)
  // Don't auto-update on every answer change
  
  const handleAnswer = useCallback((questionId: string, value: any) => {
    setAnswers((prevAnswers) => {
      const newAnswers = { ...prevAnswers };

      if (value === undefined || value === null || value === '') {
        delete newAnswers[questionId];
      } else {
        newAnswers[questionId] = value;
      }

      if (questionId === 'company_type' || questionId === 'company_type_other') {
        const derivedStage = inferCompanyStageFromAnswers(newAnswers);
        if (derivedStage) {
          newAnswers.company_stage = derivedStage;
        } else {
          delete newAnswers.company_stage;
        }
      }

      console.log('handleAnswer called:', { questionId, value, newAnswers });
      return newAnswers;
    });

    if (questionId === 'funding_intent') {
      if (value === 'planning_only') {
        setPlanningModalOpen(true);
      } else {
        setPlanningModalOpen(false);
      }
    }
  }, [setPlanningModalOpen]);

  // Removed handleViewAllResults - results are shown inline in ProgramFinder
  
  // Helper function to format answer for display
  const formatAnswerForDisplay = useCallback((questionId: string, value: any, contextAnswers?: Record<string, any>): string => {
    if (value === undefined || value === null || value === '') return '';
    const referenceAnswers = contextAnswers ?? answers;
    const question = translatedQuestions.find(q => q.id === questionId);
    if (!question) return String(value);
    
    if (question.type === 'single-select') {
      const option = question.options?.find((opt: any) => opt.value === value);
      if (option) {
        let display = option.label;
        // Add region if present
        if (referenceAnswers[`${questionId}_region`]) {
          display += `, ${referenceAnswers[`${questionId}_region`]}`;
        }
        // Add "other" text if present
        if (value === 'other' && referenceAnswers[`${questionId}_other`]) {
          display += `: ${referenceAnswers[`${questionId}_other`]}`;
        }
        // Add percentage if co-financing
        if (questionId === 'co_financing' && value === 'co_yes' && referenceAnswers[`${questionId}_percentage`]) {
          display += ` (${referenceAnswers[`${questionId}_percentage`]})`;
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
      if (value.includes('other') && referenceAnswers[`${questionId}_other`]) {
        const otherText = Array.isArray(referenceAnswers[`${questionId}_other`]) 
          ? referenceAnswers[`${questionId}_other`].join(', ')
          : referenceAnswers[`${questionId}_other`];
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
  }, [answers, t, translatedQuestions]);
  
  // State for answers summary collapse
  const [answersSummaryExpanded, setAnswersSummaryExpanded] = useState(false);
  const visibleResults = useMemo(() => {
    return results.filter((program: any) => {
      const source = program?.source;
      const name = (program?.name || '').toLowerCase();
      const isGenericName = name.startsWith('general ') || name.includes('general grant option') || name.includes('general loan option');
      return source !== 'fallback' && !isGenericName;
    });
  }, [results]);
  const hasVisibleResults = visibleResults.length > 0;


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
          
          {hasVisibleResults && (
            <div className="mt-2 text-sm text-gray-600">
              {visibleResults.length} program{visibleResults.length !== 1 ? 's' : ''} found
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
              {t('reco.ui.results') || 'Results'} ({visibleResults.length})
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
                                  
                                  {/* Legal Type Dropdown - REMOVED
                                      Legal type was collected but not used in matching logic.
                                      Removed to simplify UI and reduce user friction.
                                      Can be re-added if matching logic is implemented in the future.
                                  */}
                                  
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
                <p className="text-base font-semibold text-gray-900">{t('reco.ui.advancedFiltersTitle')}</p>
                <p className="text-sm text-gray-600">
                  {t('reco.ui.advancedFiltersDescription')}
                </p>
              </div>
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="px-3 py-2 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                {showAdvancedFilters ? t('reco.ui.advancedFiltersHide') : t('reco.ui.advancedFiltersShow')}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              {showAdvancedFilters
                ? t('reco.ui.advancedFiltersSummaryActive').replace('{answered}', String(advancedAnsweredCount)).replace('{total}', String(advancedQuestions.length))
                : t('reco.ui.advancedFiltersSummaryHidden')}
            </p>
          </Card>
        </div>
          
        </div>
          
          {/* Loading Indicator - Enhanced with animations */}
          {isLoading && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <Card className="p-8 border-2 border-blue-200 bg-white shadow-2xl max-w-md w-full animate-in fade-in zoom-in duration-300">
                <div className="flex flex-col items-center justify-center space-y-6">
                  {/* Animated spinner with pulsing effect */}
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full border-4 border-blue-200 animate-ping"></div>
                    <svg className="animate-spin h-16 w-16 text-blue-600 relative z-10" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                  
                  <div className="text-center space-y-2">
                    <h3 className="text-2xl font-bold text-gray-900 animate-pulse">
                      {locale === 'de' ? 'Förderprogramme werden generiert...' : 'Generating Funding Programs...'}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {locale === 'de' 
                        ? 'Dies kann ein paar Momente dauern. Bitte haben Sie etwas Geduld.'
                        : 'This may take just a moment. Thanks for your patience.'}
                    </p>
                  </div>
                  
                  {/* Animated progress steps with staggered animation */}
                  <div className="w-full space-y-3 mt-6">
                    <div className="flex items-center gap-3 text-sm text-gray-700 animate-in slide-in-from-left duration-500">
                      <div className="w-3 h-3 rounded-full bg-blue-600 animate-pulse"></div>
                      <span className="font-medium">{locale === 'de' ? 'Analysiere Ihr Profil...' : 'Analyzing your profile...'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-600 animate-in slide-in-from-left duration-700 delay-200">
                      <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse delay-300"></div>
                      <span>{locale === 'de' ? 'Finde passende Programme...' : 'Finding matching programs...'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-600 animate-in slide-in-from-left duration-700 delay-500">
                      <div className="w-3 h-3 rounded-full bg-blue-400 animate-pulse delay-500"></div>
                      <span>{locale === 'de' ? 'Bewerte Relevanz...' : 'Scoring relevance...'}</span>
                    </div>
                  </div>
                  
                  {/* Progress bar animation */}
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mt-4">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full animate-pulse" style={{ width: '60%', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}></div>
                  </div>
                </div>
              </Card>
            </div>
          )}
          
          {/* Planning intent modal */}
          <Dialog
            open={planningModalOpen}
            onOpenChange={(open) => {
              setPlanningModalOpen(open);
              if (!open && answers.funding_intent === 'planning_only') {
                handleAnswer('funding_intent', undefined);
              }
            }}
          >
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {locale === 'de' ? 'Projekt zuerst vorbereiten' : 'Set up your project first'}
                </DialogTitle>
                <DialogDescription className="text-sm text-gray-600">
                  {locale === 'de'
                    ? 'ProgramFinder benötigt ein konkretes Projekt oder Vorhaben. Starten Sie im Editor, erstellen Sie grob Ihren Plan und kommen Sie dann zurück, um passende Förderungen zu finden.'
                    : 'ProgramFinder needs a defined project or venture to match funding. Jump into the editor, sketch your plan, and then return to discover the best programs.'}
                </DialogDescription>
              </DialogHeader>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => {
                    setPlanningModalOpen(false);
                    router.push('/editor');
                  }}
                  className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-blue-700 transition-colors"
                >
                  {locale === 'de' ? 'Editor öffnen' : 'Open editor'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPlanningModalOpen(false);
                    handleAnswer('funding_intent', undefined);
                  }}
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  {locale === 'de' ? 'Hier bleiben' : 'Stay in ProgramFinder'}
                </button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Results Modal/Popup - Open when we have results OR when generation finished with no results */}
          <Dialog open={(hasVisibleResults && !isLoading) || (!isLoading && hasAttemptedGeneration && !hasVisibleResults)} onOpenChange={(open) => {
            if (!open) {
              setEmptyResults();
              setHasAttemptedGeneration(false); // Reset when dialog closes
            }
          }}>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-6 md:p-8">
              <DialogHeader className="mb-6">
                <DialogTitle className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                  {locale === 'de' ? 'Gefundene Förderprogramme' : 'Found Funding Programs'} 
                  <span className="ml-2 text-lg md:text-xl font-semibold text-gray-600">({visibleResults.length})</span>
                </DialogTitle>
                <DialogDescription className="text-base text-gray-600">
                  {locale === 'de' 
                    ? 'Hier sind die passendsten Förderprogramme für Sie.'
                    : 'Here are the most suitable funding programs for you.'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-5 md:space-y-6 mt-2">
                {visibleResults.length === 0 ? (
                  <div className="text-center py-10 px-4">
                    <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 105.65 5.65a7.5 7.5 0 0010.6 10.6z" />
                      </svg>
                    </div>
                    <p className="text-gray-900 text-lg font-semibold mb-2">
                      {confirmDialogCopy.emptyTitle}
                    </p>
                    <p className="text-gray-600 text-sm mb-6">
                      {confirmDialogCopy.emptyBody}
                    </p>
                    <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                      <button
                        type="button"
                        onClick={handleRetryWizard}
                        className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-blue-700 transition-colors"
                      >
                        {confirmDialogCopy.retryButton}
                      </button>
                      <button
                        type="button"
                        onClick={handleManualProgramEntry}
                        className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        {confirmDialogCopy.manualButton}
                      </button>
                    </div>
                  </div>
                ) : (
                  visibleResults.map((program, index) => {
                    const fundingTypes = (program as any).funding_types || (program.type ? [program.type] : ['grant']);
                    const getFundingTypeColor = (type: string) => {
                      const normalized = type.toLowerCase();
                      // Financial instruments - grants/subsidies
                      if (normalized.includes('grant') || normalized.includes('subsidy') || normalized.includes('gründungsprogramm')) {
                        return 'bg-green-100 text-green-800 border-green-300';
                      }
                      // Loans
                      if (normalized.includes('loan') || normalized.includes('bank_loan') || normalized.includes('micro_credit') || normalized.includes('repayable_advance')) {
                        return 'bg-blue-100 text-blue-800 border-blue-300';
                      }
                      // Equity/Investment
                      if (normalized.includes('equity') || normalized.includes('venture_capital') || normalized.includes('angel_investment') || normalized.includes('crowdfunding')) {
                        return 'bg-purple-100 text-purple-800 border-purple-300';
                      }
                      // Guarantees/Insurance
                      if (normalized.includes('guarantee') || normalized.includes('export_insurance')) {
                        return 'bg-orange-100 text-orange-800 border-orange-300';
                      }
                      // Convertible instruments
                      if (normalized.includes('convertible') || normalized.includes('leasing')) {
                        return 'bg-indigo-100 text-indigo-800 border-indigo-300';
                      }
                      // Support services
                      if (normalized.includes('coaching') || normalized.includes('mentoring') || normalized.includes('consultation') || normalized.includes('consulting_support') || normalized.includes('networking') || normalized.includes('workshop') || normalized.includes('support_program') || normalized.includes('acceleration_program')) {
                        return 'bg-teal-100 text-teal-800 border-teal-300';
                      }
                      // Specialized support
                      if (normalized.includes('intellectual_property') || normalized.includes('patent_support') || normalized.includes('export_support') || normalized.includes('innovation_support')) {
                        return 'bg-cyan-100 text-cyan-800 border-cyan-300';
                      }
                      return 'bg-gray-100 text-gray-800 border-gray-300';
                    };
                    const getFundingTypeLabel = (type: string) => {
                      const normalized = type.toLowerCase();
                      // Financial instruments
                      if (normalized.includes('grant')) return locale === 'de' ? 'Zuschuss' : 'Grant';
                      if (normalized.includes('subsidy')) return locale === 'de' ? 'Subvention' : 'Subsidy';
                      if (normalized.includes('gründungsprogramm')) return locale === 'de' ? 'Gründungsprogramm' : 'Startup Program';
                      if (normalized.includes('loan') && !normalized.includes('bank_loan')) return locale === 'de' ? 'Darlehen' : 'Loan';
                      if (normalized.includes('bank_loan')) return locale === 'de' ? 'Bankdarlehen' : 'Bank Loan';
                      if (normalized.includes('micro_credit')) return locale === 'de' ? 'Mikrokredit' : 'Micro Credit';
                      if (normalized.includes('repayable_advance')) return locale === 'de' ? 'Rückzahlbarer Vorschuss' : 'Repayable Advance';
                      if (normalized.includes('equity')) return locale === 'de' ? 'Beteiligung' : 'Equity';
                      if (normalized.includes('venture_capital')) return locale === 'de' ? 'Wagniskapital' : 'Venture Capital';
                      if (normalized.includes('angel_investment')) return locale === 'de' ? 'Business Angel' : 'Angel Investment';
                      if (normalized.includes('crowdfunding')) return locale === 'de' ? 'Crowdfunding' : 'Crowdfunding';
                      if (normalized.includes('guarantee')) return locale === 'de' ? 'Bürgschaft' : 'Guarantee';
                      if (normalized.includes('export_insurance')) return locale === 'de' ? 'Exportversicherung' : 'Export Insurance';
                      if (normalized.includes('convertible')) return locale === 'de' ? 'Wandelanleihe' : 'Convertible';
                      if (normalized.includes('leasing')) return locale === 'de' ? 'Leasing' : 'Leasing';
                      // Support services
                      if (normalized.includes('coaching')) return locale === 'de' ? 'Coaching' : 'Coaching';
                      if (normalized.includes('mentoring')) return locale === 'de' ? 'Mentoring' : 'Mentoring';
                      if (normalized.includes('consultation') || normalized.includes('consulting_support')) return locale === 'de' ? 'Beratung' : 'Consultation';
                      if (normalized.includes('networking')) return locale === 'de' ? 'Netzwerk' : 'Networking';
                      if (normalized.includes('workshop')) return locale === 'de' ? 'Workshop' : 'Workshop';
                      if (normalized.includes('support_program')) return locale === 'de' ? 'Unterstützungsprogramm' : 'Support Program';
                      if (normalized.includes('acceleration_program')) return locale === 'de' ? 'Beschleunigungsprogramm' : 'Acceleration Program';
                      // Specialized
                      if (normalized.includes('intellectual_property')) return locale === 'de' ? 'Geistiges Eigentum' : 'Intellectual Property';
                      if (normalized.includes('patent_support')) return locale === 'de' ? 'Patentunterstützung' : 'Patent Support';
                      if (normalized.includes('export_support')) return locale === 'de' ? 'Exportunterstützung' : 'Export Support';
                      if (normalized.includes('innovation_support')) return locale === 'de' ? 'Innovationsunterstützung' : 'Innovation Support';
                      // Fallback: capitalize first letter
                      return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
                    };
                    
                    return (
                      <Card key={program.id || index} className="p-5 md:p-6 border-2 border-gray-200 hover:border-blue-400 hover:shadow-lg transition-all bg-white">
                        <div className="flex flex-col md:flex-row md:items-start gap-4">
                          <div className="flex-1 min-w-0">
                            {/* Header with title and match score */}
                            <div className="flex flex-wrap items-start gap-3 mb-3">
                              <h3 className="text-lg md:text-xl font-semibold text-gray-900 flex-1 min-w-[200px]">
                                {program.name || `Program ${index + 1}`}
                              </h3>
                              {program.score !== undefined && (
                                <span className={`px-3 py-1 rounded-full text-xs md:text-sm font-semibold whitespace-nowrap ${
                                  program.score >= 70 ? 'bg-green-100 text-green-800 border border-green-300' :
                                  program.score >= 40 ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' :
                                  'bg-gray-100 text-gray-800 border border-gray-300'
                                }`}>
                                  {Math.round(program.score)}% {locale === 'de' ? 'Match' : 'Match'}
                                </span>
                              )}
                            </div>

                            {/* Funding Type Badge - Show only primary type */}
                            {fundingTypes.length > 0 && (
                              <div className="mb-3">
                                <span
                                  className={`px-3 py-1 rounded-full text-xs font-medium border ${getFundingTypeColor(fundingTypes[0])}`}
                                >
                                  {getFundingTypeLabel(fundingTypes[0])}
                                </span>
                              </div>
                            )}

                            {/* Description */}
                            {(program.description || (program as any).metadata?.description) && (
                              <p className="text-gray-600 mb-4 text-sm md:text-base leading-relaxed">
                                {program.description || (program as any).metadata?.description}
                              </p>
                            )}

                            {/* Smart, concise explanation */}
                            {(() => {
                              const reason = program.reason;
                              const matchedCriteria = Array.isArray((program as any).matchedCriteria) ? (program as any).matchedCriteria : [];
                              const gaps = Array.isArray((program as any).gaps) ? (program as any).gaps : [];
                              
                              // Build concise LLM-style explanation
                              let explanation = '';
                              if (reason) {
                                explanation = reason;
                              } else if (matchedCriteria.length > 0) {
                                const topMatch = matchedCriteria[0];
                                explanation = topMatch.reason || topMatch.description || '';
                              }
                              
                              // Add watch-outs if gaps exist
                              const watchOuts = gaps.slice(0, 2).map((gap: any) => gap.description || gap.key).filter(Boolean);
                              
                              if (!explanation && matchedCriteria.length === 0 && gaps.length === 0) {
                                return null;
                              }
                              
                              return (
                                <div className="mb-4 space-y-3">
                                  {explanation && (
                                    <p className="text-sm text-gray-700 leading-relaxed">
                                      {explanation}
                                    </p>
                                  )}
                                  {watchOuts.length > 0 && (
                                    <div className="text-xs text-gray-600 italic">
                                      {locale === 'de' ? 'Zu beachten: ' : 'Note: '}
                                      {watchOuts.join(', ')}
                                    </div>
                                  )}
                                </div>
                              );
                            })()}

                            {/* Program Details Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 text-sm">
                              {program.amount && (program.amount.min > 0 || program.amount.max > 0) && (
                                <div className="flex items-start gap-2">
                                  <span className="font-semibold text-gray-700 min-w-[80px]">
                                    {locale === 'de' ? 'Betrag:' : 'Amount:'}
                                  </span>
                                  <span className="text-gray-600">
                                    €{program.amount.min?.toLocaleString('de-DE') || '0'} - €{program.amount.max?.toLocaleString('de-DE') || '0'}
                                    {program.amount.currency && program.amount.currency !== 'EUR' && ` ${program.amount.currency}`}
                                  </span>
                                </div>
                              )}
                              {(program as any).region && (
                                <div className="flex items-start gap-2">
                                  <span className="font-semibold text-gray-700 min-w-[80px]">
                                    {locale === 'de' ? 'Region:' : 'Region:'}
                                  </span>
                                  <span className="text-gray-600">{(program as any).region}</span>
                                </div>
                              )}
                              {(program as any).metadata?.organization && (
                                <div className="flex items-start gap-2">
                                  <span className="font-semibold text-gray-700 min-w-[80px]">
                                    {locale === 'de' ? 'Organisation:' : 'Organization:'}
                                  </span>
                                  <span className="text-gray-600">{(program as any).metadata.organization}</span>
                                </div>
                              )}
                              {(program as any).metadata?.co_financing_required === true && (
                                <div className="flex items-start gap-2">
                                  <span className="font-semibold text-gray-700 min-w-[80px]">
                                    {locale === 'de' ? 'Co-Finanzierung:' : 'Co-Financing:'}
                                  </span>
                                  <span className="text-orange-600 font-medium">
                                    {(program as any).metadata.co_financing_percentage 
                                      ? `${(program as any).metadata.co_financing_percentage}% ${locale === 'de' ? 'erforderlich' : 'required'}`
                                      : locale === 'de' ? 'Erforderlich' : 'Required'}
                                  </span>
                                </div>
                              )}
                              {(program as any).metadata?.application_deadlines && (
                                <div className="flex items-start gap-2">
                                  <span className="font-semibold text-gray-700 min-w-[80px]">
                                    {locale === 'de' ? 'Fristen:' : 'Deadlines:'}
                                  </span>
                                  <span className="text-gray-600">{(program as any).metadata.application_deadlines}</span>
                                </div>
                              )}
                              {(program as any).metadata?.typical_timeline && (
                                <div className="flex items-start gap-2">
                                  <span className="font-semibold text-gray-700 min-w-[80px]">
                                    {locale === 'de' ? 'Zeitrahmen:' : 'Timeline:'}
                                  </span>
                                  <span className="text-gray-600">{(program as any).metadata.typical_timeline}</span>
                                </div>
                              )}
                              {(program as any).metadata?.competitiveness && (
                                <div className="flex items-start gap-2">
                                  <span className="font-semibold text-gray-700 min-w-[80px]">
                                    {locale === 'de' ? 'Wettbewerb:' : 'Competitiveness:'}
                                  </span>
                                  <span className={`font-medium ${
                                    (program as any).metadata.competitiveness === 'high' ? 'text-red-600' :
                                    (program as any).metadata.competitiveness === 'medium' ? 'text-yellow-600' :
                                    'text-green-600'
                                  }`}>
                                    {(program as any).metadata.competitiveness === 'high' ? (locale === 'de' ? 'Hoch' : 'High') :
                                     (program as any).metadata.competitiveness === 'medium' ? (locale === 'de' ? 'Mittel' : 'Medium') :
                                     (locale === 'de' ? 'Niedrig' : 'Low')}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Select Button */}
                          <div className="flex-shrink-0">
                            <button
                              onClick={() => {
                                if (onProgramSelect) {
                                  onProgramSelect(program.id, program.type || fundingTypes[0] || 'grant');
                                } else {
                                  setConfirmProgram(program);
                                  setIsConfirmDialogOpen(true);
                                }
                              }}
                              className="w-full md:w-auto px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-sm shadow-sm hover:shadow-md whitespace-nowrap"
                            >
                              {locale === 'de' ? 'Auswählen' : 'Select'}
                            </button>
                          </div>
                        </div>
                      </Card>
                    );
                  })
                )}
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog
            open={isConfirmDialogOpen && !!confirmProgram}
            onOpenChange={(open) => {
              setIsConfirmDialogOpen(open);
              if (!open) {
                setConfirmProgram(null);
              }
            }}
          >
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {confirmDialogCopy.title}
                </DialogTitle>
                <DialogDescription className="text-sm text-gray-600">
                  {confirmDialogCopy.description}
                </DialogDescription>
              </DialogHeader>

              <div className="mt-4 space-y-3 text-sm text-gray-700">
                <p className="font-semibold text-gray-900">
                  {confirmProgram?.name || (locale === 'de' ? 'Gewähltes Programm' : 'Selected program')}
                </p>
                {confirmDialogCopy.points.length > 0 && (
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    {confirmDialogCopy.points.map((point, idx) => (
                      <li key={idx}>{point}</li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  onClick={handleUseSelectedProgram}
                  className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-blue-700 transition-colors"
                >
                  {confirmDialogCopy.useButton}
                </button>
                <button
                  type="button"
                  onClick={handleManualProgramEntry}
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  {confirmDialogCopy.pasteButton}
                </button>
              </div>
            </DialogContent>
          </Dialog>
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
                const quotaStatus = getQuotaStatus();
                if (quotaStatus.count >= DAILY_GENERATION_LIMIT) {
                  alert(quotaLimitMessage);
                  return;
                }
                registerGenerationAttempt();
                setIsLoading(true);
                setHasAttemptedGeneration(true); // Mark that user clicked generate
                console.log('🚀 Starting program generation...');
                console.log('📋 Answers being sent:', answersForApi);
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
                      answers: answersForApi,
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
                    console.error('Answers sent:', JSON.stringify(answersForApi, null, 2));
                    
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
                  const scored = await scoreProgramsEnhanced(answersForApi, 'strict', programsForScoring);
                  console.log(`✅ Scored ${scored.length} programs`);
                  console.log('📈 Score distribution:', scored.map(p => ({ name: p.name, score: p.score })));
                  
                  const sorted = scored.sort((a, b) => b.score - a.score);
                  console.log(`🎯 Sorted programs:`, sorted.map(p => ({ name: p.name, score: p.score })));
                  
                  if (sorted.length > 0) {
                    setResults(sorted);
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

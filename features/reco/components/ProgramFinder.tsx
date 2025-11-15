/**
 * ProgramFinder - Unified interface for SmartWizard and Advanced Search
 * Simplified version without QuestionEngine - uses static form
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import { Search, Sparkles, TrendingUp, Info, ChevronLeft, ChevronRight, Wand2 } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
// Progress bar implemented with custom div (not using Progress component)
import { scoreProgramsEnhanced, EnhancedProgramResult } from '@/features/reco/engine/enhancedRecoEngine';
import { useRecommendation } from '@/features/reco/contexts/RecommendationContext';
import { useI18n } from '@/shared/contexts/I18nContext';

interface ProgramFinderProps {
  onProgramSelect?: (programId: string, route: string) => void;
}

// Static questions - optimized order and with skip logic
  const CORE_QUESTIONS = [
  {
    id: 'company_type',
    label: 'What type of company are you?',
    type: 'single-select' as const,
    options: [
      { value: 'startup', label: 'Startup' },
      { value: 'sme', label: 'SME (Small/Medium Enterprise)' },
      { value: 'large', label: 'Large Company' },
      { value: 'research', label: 'Research Institution' },
    ],
    required: false,
    priority: 1,
  },
  {
    id: 'location',
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
    // Enhanced: Subregion support for Austria
    subOptions: (value: string) => {
      if (value === 'austria') {
        return [
          { value: 'vienna', label: 'Vienna' },
          { value: 'upper_austria', label: 'Upper Austria' },
          { value: 'lower_austria', label: 'Lower Austria' },
          { value: 'styria', label: 'Styria' },
          { value: 'tyrol', label: 'Tyrol' },
          { value: 'salzburg', label: 'Salzburg' },
          { value: 'carinthia', label: 'Carinthia' },
          { value: 'vorarlberg', label: 'Vorarlberg' },
          { value: 'burgenland', label: 'Burgenland' },
        ];
      }
      return [];
    },
  },
  {
    id: 'funding_amount',
    label: 'How much funding do you need?',
    type: 'single-select' as const,
    options: [
      { value: 'under100k', label: 'Under €100k' },
      { value: '100kto500k', label: '€100k - €500k' },
      { value: '500kto2m', label: '€500k - €2M' },
      { value: 'over2m', label: 'Over €2M' },
    ],
    required: false,
    priority: 3,
  },
  {
    id: 'industry_focus',
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
    // Enhanced: Industry subcategories for better matching
    subCategories: {
      digital: [
        { value: 'ai', label: 'AI/Machine Learning' },
        { value: 'fintech', label: 'FinTech' },
        { value: 'healthtech', label: 'HealthTech' },
        { value: 'edtech', label: 'EdTech' },
        { value: 'iot', label: 'IoT' },
        { value: 'blockchain', label: 'Blockchain' },
      ],
      sustainability: [
        { value: 'greentech', label: 'GreenTech' },
        { value: 'cleantech', label: 'CleanTech' },
        { value: 'circular_economy', label: 'Circular Economy' },
        { value: 'renewable_energy', label: 'Renewable Energy' },
        { value: 'climate_tech', label: 'Climate Tech' },
      ],
      health: [
        { value: 'biotech', label: 'Biotech' },
        { value: 'medtech', label: 'MedTech' },
        { value: 'pharma', label: 'Pharmaceuticals' },
        { value: 'digital_health', label: 'Digital Health' },
      ],
      manufacturing: [
        { value: 'industry_4_0', label: 'Industry 4.0' },
        { value: 'smart_manufacturing', label: 'Smart Manufacturing' },
        { value: 'robotics', label: 'Robotics' },
        { value: 'automation', label: 'Automation' },
      ],
    },
  },
  {
    id: 'impact',
    label: 'What impact does your project have?',
    type: 'multi-select' as const,
    options: [
      { value: 'economic', label: 'Economic (Jobs, Growth)' },
      { value: 'social', label: 'Social (Community, Society)' },
      { value: 'environmental', label: 'Environmental (Climate, Sustainability)' },
    ],
    required: false,
    priority: 5,
  },
  {
    id: 'company_stage',
    label: 'What stage is your company at?',
    type: 'single-select' as const,
    options: [
      { value: 'idea', label: 'Idea/Concept' },
      { value: 'pre_company', label: 'Pre-Company (Team of Founders)' },
      { value: 'inc_lt_6m', label: 'Incorporated < 6 months' },
      { value: 'inc_6_36m', label: 'Incorporated 6-36 months' },
      { value: 'inc_gt_36m', label: 'Incorporated > 36 months' },
      { value: 'research_org', label: 'Research Organization' },
    ],
    required: false,
    priority: 6,
  },
  {
    id: 'use_of_funds',
    label: 'How will you use the funds?',
    type: 'multi-select' as const,
    options: [
      { value: 'rd', label: 'Research & Development' },
      { value: 'marketing', label: 'Marketing' },
      { value: 'equipment', label: 'Equipment/Infrastructure' },
      { value: 'personnel', label: 'Personnel/Hiring' },
      { value: 'working_capital', label: 'Working capital' },
      { value: 'expansion', label: 'Expansion/Growth' },
    ],
    required: false,
    priority: 7,
  },
  {
    id: 'project_duration',
    label: 'How long is your project?',
    type: 'single-select' as const,
    options: [
      { value: 'under2', label: 'Under 2 years' },
      { value: '2to5', label: '2-5 years' },
      { value: '5to10', label: '5-10 years' },
      { value: 'over10', label: 'Over 10 years' },
    ],
    required: false,
    priority: 8,
  },
  {
    id: 'deadline_urgency',
    label: 'When do you need funding by?',
    type: 'single-select' as const,
    options: [
      { value: 'urgent', label: 'Within 1 month' },
      { value: 'soon', label: 'Within 3 months' },
      { value: 'flexible', label: 'Within 6 months or flexible' },
    ],
    required: false,
    priority: 9,
    skipIf: (answers: Record<string, any>) => answers.project_duration === 'over10',
  },
  {
    id: 'co_financing',
    label: 'Can you provide co-financing?',
    type: 'single-select' as const,
    options: [
      { value: 'co_yes', label: 'Yes, required' },
      { value: 'co_partial', label: 'Partial (up to 50%)' },
      { value: 'co_no', label: 'No co-financing available' },
      { value: 'co_uncertain', label: 'Uncertain / Need to check' },
    ],
    required: false,
    priority: 10,
  },
  {
    id: 'revenue_status',
    label: 'What is your current revenue status?',
    type: 'single-select' as const,
    options: [
      { value: 'pre_revenue', label: 'Pre-revenue' },
      { value: 'early_revenue', label: 'Early revenue (< €1M)' },
      { value: 'growing_revenue', label: 'Growing revenue (€1M+)' },
      { value: 'not_applicable', label: 'Not applicable' },
    ],
    required: false,
    priority: 11,
    skipIf: (answers: Record<string, any>) => {
      // Only skip for very early stages where revenue doesn't make sense
      return answers.company_stage === 'idea' || 
             answers.company_stage === 'pre_company';
    },
  },
  {
    id: 'team_size',
    label: 'How many people are in your team?',
    type: 'single-select' as const,
    options: [
      { value: '1to2', label: '1-2 people' },
      { value: '3to5', label: '3-5 people' },
      { value: '6to10', label: '6-10 people' },
      { value: 'over10', label: 'Over 10 people' },
    ],
    required: false,
    priority: 12,
  },
  {
    id: 'previous_funding',
    label: 'Have you received previous funding?',
    type: 'single-select' as const,
    options: [
      { value: 'none', label: 'No previous funding' },
      { value: 'grants', label: 'Yes, grants' },
      { value: 'loans', label: 'Yes, loans' },
      { value: 'equity', label: 'Yes, equity investment' },
      { value: 'mixed', label: 'Yes, mixed funding' },
    ],
    required: false,
    priority: 13,
  },
  {
    id: 'intellectual_property',
    label: 'Do you have intellectual property (patents, trademarks, etc.)?',
    type: 'single-select' as const,
    options: [
      { value: 'yes_patents', label: 'Yes, patents' },
      { value: 'yes_trademarks', label: 'Yes, trademarks' },
      { value: 'yes_both', label: 'Yes, both patents and trademarks' },
      { value: 'pending', label: 'Pending applications' },
      { value: 'no', label: 'No IP' },
    ],
    required: false,
    priority: 14,
  },
  {
    id: 'partnerships',
    label: 'Are you looking for partnerships or collaborations?',
    type: 'multi-select' as const,
    options: [
      { value: 'research_partners', label: 'Research partners' },
      { value: 'industry_partners', label: 'Industry partners' },
      { value: 'international_partners', label: 'International partners' },
      { value: 'no_partnerships', label: 'Not looking for partnerships' },
    ],
    required: false,
    priority: 15,
  },
  {
    id: 'market_focus',
    label: 'What is your primary market focus?',
    type: 'multi-select' as const,
    options: [
      { value: 'b2b', label: 'B2B (Business to Business)' },
      { value: 'b2c', label: 'B2C (Business to Consumer)' },
      { value: 'b2g', label: 'B2G (Business to Government)' },
      { value: 'b2b2c', label: 'B2B2C (Business to Business to Consumer)' },
    ],
    required: false,
    priority: 16,
  },
  {
    id: 'export_plans',
    label: 'Do you have export plans?',
    type: 'single-select' as const,
    options: [
      { value: 'yes_eu', label: 'Yes, within EU' },
      { value: 'yes_international', label: 'Yes, international' },
      { value: 'planning', label: 'Planning to export' },
      { value: 'no', label: 'No export plans' },
    ],
    required: false,
    priority: 17,
  },
  {
    id: 'sustainability_goals',
    label: 'What are your sustainability goals?',
    type: 'multi-select' as const,
    options: [
      { value: 'carbon_neutral', label: 'Carbon neutrality' },
      { value: 'renewable_energy', label: 'Renewable energy use' },
      { value: 'circular_economy', label: 'Circular economy practices' },
      { value: 'social_impact', label: 'Social impact' },
      { value: 'not_applicable', label: 'Not applicable' },
    ],
    required: false,
    priority: 18,
  },
];

export default function ProgramFinder({ 
  onProgramSelect
}: ProgramFinderProps) {
  const router = useRouter();
  const { setRecommendations } = useRecommendation();
  const { t } = useI18n();
  
  // Get translated questions
  const getTranslatedQuestions = useMemo(() => {
    return CORE_QUESTIONS.map(q => ({
      ...q,
      label: (t(`reco.questions.${q.id}` as any) as string) || q.label,
      options: q.options.map(opt => ({
        ...opt,
        label: (t(`reco.options.${q.id}.${opt.value}` as any) as string) || opt.label
      }))
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
  const [explanationVariant] = useState<'A' | 'B' | 'C'>(() => {
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
  

  // Get visible questions (with skip logic only - no progressive disclosure)
  const getVisibleQuestions = () => {
    // Show all questions, only filter by skip logic
    return getTranslatedQuestions.filter(q => {
      if (q.skipIf && q.skipIf(answers)) return false;
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
  
  // Minimum questions for results (6 questions)
  const MIN_QUESTIONS_FOR_RESULTS = 6;
  const hasEnoughAnswers = answeredCount >= MIN_QUESTIONS_FOR_RESULTS;
  
  const updateGuidedResults = useCallback(async () => {
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
      
      if (extractedPrograms.length === 0) {
        console.warn('No programs returned from API');
        // Show user-friendly message
        setResults([]);
        return;
      }
      
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
      const scored = await scoreProgramsEnhanced(answers, 'strict', programsForScoring);
      // Filter out zero-score programs and sort by score (highest first), then take top 5
      const validPrograms = scored.filter(p => p.score > 0);
      const top5 = validPrograms.sort((a, b) => b.score - a.score).slice(0, 5);
      setResults(top5);
      
      // Store in context for results page
      setRecommendations(scored);
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
  }, [answers, hasEnoughAnswers, setRecommendations]);
  
  // State to control when to show results
  const [showResults, setShowResults] = useState(false);
  
  // Only update results when user explicitly requests them (after completing or clicking button)
  // Don't auto-update on every answer change
  
  const handleAnswer = (questionId: string, value: any) => {
    const newAnswers = { ...answers, [questionId]: value };
    setAnswers(newAnswers);
  };

  const handleProgramSelect = (program: EnhancedProgramResult) => {
    // Store program data in localStorage (programs don't have stable IDs)
    // Editor will read this data directly instead of fetching by ID
    if (typeof window !== 'undefined') {
      const programData = {
        id: program.id,
        name: program.name || program.id,
        categorized_requirements: program.categorized_requirements || {},
        type: program.type || 'grant',
        url: program.url || program.source_url,
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
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header - Centered with Wizard Icon */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center shadow-lg">
              <Wand2 className="w-7 h-7 text-yellow-400" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              {t('reco.pageTitle')}
            </h1>
          </div>
          <p className="text-gray-600 text-lg">
            {t('reco.pageSubtitle')}
          </p>
          
          {results.length > 0 && (
            <div className="mt-4 text-sm text-gray-600">
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
              Questions
            </button>
            <button
              onClick={() => setMobileActiveTab('results')}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                mobileActiveTab === 'results'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Results ({results.length})
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-8">
          {/* Questions/Filters - Centered and full width */}
          <div className={`${mobileActiveTab === 'results' ? 'hidden lg:block' : ''}`}>
            <Card className="p-4 max-w-2xl mx-auto w-full">
              <div className="space-y-4">
                  {/* Simple Header with Generate Button */}
                  <div className="flex items-center justify-end mb-4">
                    {/* Generate Button - appears when user has enough answers (6+) */}
                    {hasEnoughAnswers && !showResults && (
                      <button
                        onClick={() => {
                          setShowResults(true);
                          updateGuidedResults();
                        }}
                        disabled={isLoading}
                        className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {isLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Generating...</span>
                          </>
                        ) : (
                          <>
                            <Wand2 className="w-4 h-4" />
                            <span>{t('reco.generateButton')}</span>
                          </>
                        )}
                      </button>
                    )}
                    {/* Message when user hasn't answered enough questions yet */}
                    {answeredCount > 0 && !hasEnoughAnswers && (
                      <div className="text-xs text-gray-500">
                        {answeredCount} / {MIN_QUESTIONS_FOR_RESULTS} required
                      </div>
                    )}
                  </div>
                  
                  {/* Horizontal Question Navigation */}
                  {visibleQuestions.length > 0 && (
                    <div className="relative">
                      {/* Question Navigation Header */}
                      <div className="text-center mb-3">
                        <p className="text-sm font-medium text-gray-700">Questions</p>
                      </div>
                      {/* Question Navigation Dots */}
                      <div className="flex justify-center gap-2 mb-4 flex-wrap">
                        {visibleQuestions.map((_, idx) => {
                          const q = visibleQuestions[idx];
                          const isAnswered = answers[q.id] !== undefined && answers[q.id] !== null && answers[q.id] !== '';
                          return (
                            <button
                              key={idx}
                              onClick={() => setCurrentQuestionIndex(idx)}
                              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
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
                      
                      {/* Current Question Display */}
                      <div className="relative bg-white rounded-lg border border-gray-200 shadow-sm p-5">
                        {(() => {
                          const question = visibleQuestions[currentQuestionIndex];
                          if (!question) return null;
                          const value = answers[question.id];
                          const isAnswered = value !== undefined && value !== null && value !== '';
                          return (
                            <div className="space-y-4">
                              {/* Question Header */}
                              <div className="mb-6">
                                <div className="flex items-start gap-3 mb-4">
                                  <span className="w-7 h-7 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                                    {currentQuestionIndex + 1}
                                  </span>
                                  <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-gray-900 break-words leading-relaxed">
                                      {question.label}
                                    </h3>
                                  </div>
                                  {isAnswered && (
                                    <span className="text-green-600 flex-shrink-0 mt-0.5">
                                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                      </svg>
                                    </span>
                                  )}
                                </div>
                              </div>
                              
                              {/* Question Options */}
                              {question.type === 'single-select' && (
                                <div className="space-y-3">
                                  {question.options.map((option) => {
                                    const isSelected = value === option.value;
                                    const subOptions = question.subOptions && isSelected ? question.subOptions(option.value) : [];
                                    const hasSubOptions = subOptions.length > 0;
                                    const subValue = hasSubOptions ? answers[`${question.id}_sub`] : null;
                                    
                                    return (
                                      <div key={option.value} className="space-y-2">
                                        <button
                                          onClick={() => {
                                            handleAnswer(question.id, option.value);
                                            // Clear sub-option if switching main option
                                            if (hasSubOptions && value !== option.value) {
                                              handleAnswer(`${question.id}_sub`, undefined);
                                            }
                                            // Auto-advance only if no sub-options or sub-options already selected
                                            if (!hasSubOptions && currentQuestionIndex < visibleQuestions.length - 1) {
                                              setTimeout(() => setCurrentQuestionIndex(currentQuestionIndex + 1), 300);
                                            }
                                          }}
                                          className={`w-full text-left px-5 py-4 border-2 rounded-lg transition-all duration-150 ${
                                            isSelected
                                              ? 'bg-blue-600 border-blue-600 text-white font-medium shadow-md'
                                              : 'bg-white border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                                          }`}
                                        >
                                          <div className="flex items-center gap-3">
                                            {isSelected && (
                                              <span className="text-xl font-bold">✓</span>
                                            )}
                                            <span className="text-base">{option.label}</span>
                                          </div>
                                        </button>
                                        
                                        {/* Sub-options (e.g., Austrian regions) */}
                                        {hasSubOptions && isSelected && (
                                          <div className="ml-6 space-y-2 border-l-2 border-blue-200 pl-4 pt-2">
                                            <p className="text-sm font-medium text-gray-700 mb-2">Select region:</p>
                                            {subOptions.map((subOption: any) => (
                                              <button
                                                key={subOption.value}
                                                onClick={() => {
                                                  handleAnswer(`${question.id}_sub`, subOption.value);
                                                  // Auto-advance after selecting sub-option
                                                  if (currentQuestionIndex < visibleQuestions.length - 1) {
                                                    setTimeout(() => setCurrentQuestionIndex(currentQuestionIndex + 1), 300);
                                                  }
                                                }}
                                                className={`w-full text-left px-4 py-3 border rounded-lg transition-all duration-150 ${
                                                  subValue === subOption.value
                                                    ? 'bg-blue-500 border-blue-500 text-white font-medium'
                                                    : 'bg-gray-50 border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                                                }`}
                                              >
                                                <div className="flex items-center gap-2">
                                                  {subValue === subOption.value && (
                                                    <span className="text-lg font-bold">✓</span>
                                                  )}
                                                  <span className="text-sm">{subOption.label}</span>
                                                </div>
                                              </button>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                              {question.type === 'multi-select' && (
                                <div className="space-y-3">
                                  {question.options.map((option) => {
                                    const isSelected = Array.isArray(value) && value.includes(option.value);
                                    const subCategories = question.subCategories && isSelected ? question.subCategories[option.value] : [];
                                    const hasSubCategories = subCategories && subCategories.length > 0;
                                    const subCategoryKey = `${question.id}_${option.value}`;
                                    const subCategoryValue = answers[subCategoryKey];
                                    
                                    return (
                                      <div key={option.value} className="space-y-2">
                                        <button
                                          onClick={() => {
                                            const current = Array.isArray(value) ? value : [];
                                            let newValue: any[];
                                            
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
                                                newValue = isSelected
                                                  ? current.filter(v => v !== option.value)
                                                  : [...current, option.value];
                                              }
                                            }
                                            
                                            handleAnswer(question.id, newValue);
                                            // Clear sub-categories if deselecting
                                            if (isSelected && hasSubCategories) {
                                              handleAnswer(subCategoryKey, undefined);
                                            }
                                          }}
                                          className={`w-full text-left px-5 py-4 border-2 rounded-lg transition-all duration-150 ${
                                            isSelected
                                              ? 'bg-blue-600 border-blue-600 text-white font-medium shadow-md'
                                              : 'bg-white border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                                          }`}
                                        >
                                          <div className="flex items-center gap-3">
                                            <span className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                                              isSelected 
                                                ? 'bg-white border-white' 
                                                : 'border-gray-400'
                                            }`}>
                                              {isSelected && (
                                                <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                              )}
                                            </span>
                                            <span className="text-base">{option.label}</span>
                                          </div>
                                        </button>
                                        
                                        {/* Sub-categories (e.g., industry subcategories) */}
                                        {hasSubCategories && isSelected && (
                                          <div className="ml-6 space-y-2 border-l-2 border-blue-200 pl-4 pt-2">
                                            <p className="text-sm font-medium text-gray-700 mb-2">Select specific areas:</p>
                                            <div className="space-y-2">
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
                                                    className={`w-full text-left px-4 py-2 border rounded-lg transition-all duration-150 ${
                                                      isSubSelected
                                                        ? 'bg-blue-500 border-blue-500 text-white font-medium'
                                                        : 'bg-gray-50 border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                                                    }`}
                                                  >
                                                    <div className="flex items-center gap-2">
                                                      <span className={`w-5 h-5 rounded border flex items-center justify-center ${
                                                        isSubSelected 
                                                          ? 'bg-white border-white' 
                                                          : 'border-gray-400'
                                                      }`}>
                                                        {isSubSelected && (
                                                          <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                          </svg>
                                                        )}
                                                      </span>
                                                      <span className="text-sm">{subCat.label}</span>
                                                    </div>
                                                  </button>
                                                );
                                              })}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })()}
                        
                        {/* Navigation Arrows - Smaller */}
                        <div className="absolute top-1/2 -translate-y-1/2 left-0 -translate-x-4">
                          <button
                            onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                            disabled={currentQuestionIndex === 0}
                            className={`w-10 h-10 rounded-full bg-blue-600 border-2 border-blue-700 flex items-center justify-center shadow-lg transition-all ${
                              currentQuestionIndex === 0
                                ? 'opacity-40 cursor-not-allowed bg-gray-400 border-gray-500'
                                : 'hover:bg-blue-700 hover:scale-105 active:scale-95'
                            }`}
                          >
                            <ChevronLeft className="w-5 h-5 text-white font-bold" />
                          </button>
                        </div>
                        <div className="absolute top-1/2 -translate-y-1/2 right-0 translate-x-4">
                          <button
                            onClick={() => setCurrentQuestionIndex(Math.min(visibleQuestions.length - 1, currentQuestionIndex + 1))}
                            disabled={currentQuestionIndex === visibleQuestions.length - 1}
                            className={`w-10 h-10 rounded-full bg-blue-600 border-2 border-blue-700 flex items-center justify-center shadow-lg transition-all ${
                              currentQuestionIndex === visibleQuestions.length - 1
                                ? 'opacity-40 cursor-not-allowed bg-gray-400 border-gray-500'
                                : 'hover:bg-blue-700 hover:scale-105 active:scale-95'
                            }`}
                          >
                            <ChevronRight className="w-5 h-5 text-white font-bold" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
            </Card>
          </div>
          
          {/* Results - Below questions, centered, only shown when showResults is true */}
          {showResults && (
            <div className={`${mobileActiveTab === 'questions' ? 'hidden lg:flex' : 'flex'} flex-col max-w-4xl mx-auto w-full mt-8`}>
              {isLoading ? (
              <Card className="p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Finding programs...</p>
              </Card>
            ) : results.length === 0 ? (
              <Card className="p-12 text-center">
                <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">
                  No matching programs found
                </p>
                <p className="text-sm text-gray-500">
                  Try answering more questions or adjusting your answers
                </p>
              </Card>
            ) : (
              <div className="space-y-4">
                {results.length > 0 && (
                  <div className="mb-4 text-sm text-gray-600">
                    Showing top {Math.min(5, results.length)} of {results.length} program{results.length !== 1 ? 's' : ''} found
                  </div>
                )}
                {results.slice(0, 5).map((program) => (
                  <div key={program.id} onClick={() => handleProgramSelect(program)}>
                    <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-semibold text-gray-900">
                            {program.name || program.id}
                          </h3>
                          <Badge variant={program.score >= 80 ? 'default' : program.score >= 60 ? 'secondary' : 'outline'}>
                            {Math.round(program.score)}% match
                          </Badge>
                        </div>
                        {program.amount && (
                          <p className="text-sm text-gray-600 mb-2">
                            {program.amount.currency || 'EUR'} {program.amount.min?.toLocaleString()}
                            {program.amount.max && ` - ${program.amount.max.toLocaleString()}`}
                          </p>
                        )}
                      </div>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleProgramSelect(program);
                        }}
                        size="sm"
                      >
                        View Details
                      </Button>
                    </div>
                    
                    {/* Enhanced Results Display with Matches & Gaps */}
                    <div className="space-y-3 mb-4">
                      {/* Matches Section */}
                      {program.matches && program.matches.length > 0 && (
                        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span className="text-sm font-semibold text-green-900">Matches ({program.matches.length})</span>
                          </div>
                          <ul className="text-sm text-green-800 space-y-1.5">
                            {program.matches.slice(0, 4).map((match: string, i: number) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-green-600 mt-0.5 flex-shrink-0">✓</span>
                                <span>{match}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Gaps Section */}
                      {program.gaps && program.gaps.length > 0 && (
                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Info className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                            <span className="text-sm font-semibold text-yellow-900">Considerations ({program.gaps.length})</span>
                          </div>
                          <ul className="text-sm text-yellow-800 space-y-1.5">
                            {program.gaps.slice(0, 3).map((gap, i: number) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-yellow-600 mt-0.5 flex-shrink-0">ℹ</span>
                                <span>{typeof gap === 'string' ? gap : gap.description}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Why This Fits Explanation */}
                      {(program.reasons || program.founderFriendlyReasons) && (program.reasons?.length || program.founderFriendlyReasons?.length || 0) > 0 && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="w-4 h-4 text-blue-600 flex-shrink-0" />
                            <span className="text-sm font-semibold text-blue-900">Why This Fits</span>
                          </div>
                          <p className="text-sm text-blue-800 leading-relaxed">
                            {(program.reasons || program.founderFriendlyReasons || [])[0] || 'This program matches your requirements.'}
                          </p>
                        </div>
                      )}

                      {/* Strategic Advice */}
                      {program.strategicAdvice && (
                        <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <TrendingUp className="w-4 h-4 text-purple-600 flex-shrink-0" />
                            <span className="text-xs font-semibold text-purple-900">Strategic Tip</span>
                          </div>
                          <p className="text-xs text-purple-800">{program.strategicAdvice}</p>
                        </div>
                      )}

                      {/* Application Info */}
                      {program.applicationInfo && (
                        <details className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                          <summary className="text-xs font-semibold text-gray-900 cursor-pointer hover:text-gray-700 flex items-center gap-2">
                            <span>📋</span>
                            <span>Application Information</span>
                          </summary>
                          <p className="text-xs text-gray-700 mt-2">{program.applicationInfo}</p>
                        </details>
                      )}
                    </div>

                    {/* Legacy A/B Testing Variants (kept for backward compatibility) */}
                    {explanationVariant === 'A' && !program.matches && (
                      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-semibold text-blue-900">Match Score: {Math.round(program.score)}%</span>
                        </div>
                        <div className="text-xs text-blue-700 mb-2">
                          Score Breakdown: Location (22%) ✓ | Company Type (20%) ✓ | Funding (18%) ✓
                        </div>
                        <div className="text-sm font-medium text-blue-900 mb-1">Why this matches:</div>
                        <ul className="text-sm text-blue-800 space-y-1">
                          {(program.reasons || program.founderFriendlyReasons || []).slice(0, 3).map((reason: string, i: number) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-blue-500 mt-1">•</span>
                              <span>{reason}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                        {explanationVariant === 'B' && (
                          // Variant B: LLM-First
                          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <div className="text-sm font-semibold text-green-900 mb-2">Why this program fits your needs:</div>
                            <p className="text-sm text-green-800 mb-2">
                              {(program.reasons || program.founderFriendlyReasons || [])[0] || 'This program matches your requirements.'}
                            </p>
                            {/* Enhanced explanations */}
                            {program.strategicAdvice && (
                              <div className="mt-2 pt-2 border-t border-green-300">
                                <div className="text-xs font-semibold text-green-900 mb-1">💡 Strategic Tip:</div>
                                <p className="text-xs text-green-800">{program.strategicAdvice}</p>
                              </div>
                            )}
                            {program.applicationInfo && (
                              <div className="mt-2">
                                <div className="text-xs font-semibold text-green-900 mb-1">📋 Application:</div>
                                <p className="text-xs text-green-800">{program.applicationInfo}</p>
                              </div>
                            )}
                            <div className="flex items-center justify-between text-xs text-green-700 mt-2">
                              <span>Match Score: {Math.round(program.score)}%</span>
                              <button className="text-green-600 hover:underline">Show breakdown →</button>
                            </div>
                          </div>
                        )}
                        {explanationVariant === 'C' && (
                          // Variant C: LLM-Only (Minimal)
                          <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                            <p className="text-sm text-gray-800 mb-1">
                              {(program.reasons || program.founderFriendlyReasons || [])[0] || 'This program matches your requirements.'}
                            </p>
                            {/* Enhanced explanations (minimal) */}
                            {program.strategicAdvice && (
                              <p className="text-xs text-gray-700 mt-2 italic">{program.strategicAdvice}</p>
                            )}
                            <span className="text-xs text-gray-600">{Math.round(program.score)}% match</span>
                          </div>
                        )}
                    
                    {(program.risks || program.founderFriendlyRisks || program.riskMitigation) && ((program.risks?.length || program.founderFriendlyRisks?.length || 0) > 0 || program.riskMitigation) && (
                      <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Info className="h-4 w-4 text-yellow-600" />
                          <span className="text-sm font-semibold text-yellow-900">Considerations:</span>
                        </div>
                        <ul className="text-sm text-yellow-800 space-y-1">
                          {(program.risks || program.founderFriendlyRisks || []).slice(0, 2).map((risk: string, i: number) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-yellow-500 mt-1">•</span>
                              <span>{risk}</span>
                            </li>
                          ))}
                        </ul>
                        {/* Enhanced risk mitigation */}
                        {program.riskMitigation && (
                          <details className="mt-2 pt-2 border-t border-yellow-300">
                            <summary className="text-xs font-semibold text-yellow-900 cursor-pointer hover:text-yellow-700">🛡️ Mitigation (click to expand)</summary>
                            <p className="text-xs text-yellow-800 mt-1">{program.riskMitigation}</p>
                          </details>
                        )}
                      </div>
                    )}
                    
                    {program.matchedCriteria && program.matchedCriteria.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {program.matchedCriteria.slice(0, 5).map((criteria: any, i: number) => (
                          <Badge
                            key={i}
                            variant={criteria.status === 'passed' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {criteria.key}: {String(criteria.value).slice(0, 30)}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </Card>
                  </div>
                ))}
              </div>
            )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

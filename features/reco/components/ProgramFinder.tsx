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
      { value: 'prefounder', label: 'Pre-founder (Idea Stage)' },
      { value: 'startup', label: 'Startup' },
      { value: 'sme', label: 'SME (Small/Medium Enterprise)' },
      { value: 'research', label: 'Research Institution' },
      { value: 'other', label: 'Other' },
    ],
    required: false,
    priority: 1,
    hasOtherTextInput: true,
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
    // Optional region input (text field, not dropdown)
    hasOptionalRegion: (value: string) => {
      return value === 'austria' || value === 'germany' || value === 'eu' || value === 'international';
    },
  },
  {
    id: 'funding_amount',
    label: 'How much funding do you need?',
    type: 'range' as const,
    min: 0,
    max: 3000000,
    step: 1000,
    unit: 'EUR',
    required: false,
    priority: 3,
    editableValue: true, // Allow editing the number directly
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
    id: 'impact',
    label: 'What impact does your project have?',
    type: 'multi-select' as const,
    options: [
      { value: 'economic', label: 'Economic (Jobs, Growth)' },
      { value: 'social', label: 'Social (Community, Society)' },
      { value: 'environmental', label: 'Environmental (Climate, Sustainability)' },
      { value: 'other', label: 'Other' },
    ],
    required: false,
    priority: 5,
    hasOtherTextInput: true, // Show text field when "other" is selected
    hasImpactDetails: true, // Allow specifying details for each impact type
  },
  {
    id: 'company_stage',
    label: 'What stage is your company at?',
    type: 'single-select' as const,
    options: [
      { value: 'idea', label: 'Idea/Concept (Not yet founded)' },
      { value: 'pre_company', label: 'Pre-Company (Team formed, not incorporated)' },
      { value: 'early_stage', label: 'Early Stage (Incorporated < 2 years)' },
      { value: 'growth_stage', label: 'Growth Stage (Incorporated 2+ years)' },
      { value: 'other', label: 'Other' },
    ],
    required: false,
    priority: 6,
    hasOtherTextInput: true, // Show text field when "other" is selected
  },
  {
    id: 'use_of_funds',
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
  },
  {
    id: 'project_duration',
    label: 'How long is your project?',
    type: 'range' as const,
    min: 1,
    max: 36,
    step: 1,
    unit: 'months',
    required: false,
    priority: 8,
    editableValue: true, // Allow editing the number directly
  },
  {
    id: 'deadline_urgency',
    label: 'When do you need funding by?',
    type: 'range' as const,
    min: 1,
    max: 12,
    step: 1,
    unit: 'months',
    required: false,
    priority: 9,
    editableValue: true, // Allow editing the number directly
    skipIf: (answers: Record<string, any>) => {
      const duration = answers.project_duration;
      // Skip if project duration is more than 36 months (3 years)
      if (typeof duration === 'number' && duration > 36) return true;
      return false;
    },
  },
  {
    id: 'co_financing',
    label: 'Can you provide co-financing?',
    type: 'single-select' as const,
    options: [
      { value: 'co_yes', label: 'Yes' },
      { value: 'co_no', label: 'No' },
      { value: 'co_uncertain', label: 'Uncertain' },
    ],
    required: false,
    priority: 10,
    hasCoFinancingPercentage: true, // Ask for percentage if Yes
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
    priority: 12,
    editableValue: true, // Allow editing the number directly
  },
];

export default function ProgramFinder({ 
  onProgramSelect
}: ProgramFinderProps) {
  const router = useRouter();
  const { t } = useI18n();
  
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
        console.warn('API response:', data);
        // Show user-friendly message
        setResults([]);
        if (data.error) {
          alert(`No programs found: ${data.message || data.error}`);
        }
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
      console.log(`📊 Scoring ${programsForScoring.length} programs with answers:`, Object.keys(answers));
      const scored = await scoreProgramsEnhanced(answers, 'strict', programsForScoring);
      
      // Log score distribution for debugging
      const scoreDistribution = scored.map(p => ({ name: p.name, score: p.score }));
      console.log('📈 Score distribution:', scoreDistribution);
      
      // Filter out zero-score programs and sort by score (highest first), then take top 5
      // Be more lenient - show programs with score > 0
      const validPrograms = scored.filter(p => p.score > 0);
      const top5 = validPrograms.sort((a, b) => b.score - a.score).slice(0, 5);
      
      console.log(`✅ Scored ${scored.length} programs, ${validPrograms.length} valid (score > 0), showing top ${top5.length}`);
      
      // If no valid programs, show ALL programs (even with score 0) for debugging
      if (validPrograms.length === 0 && scored.length > 0) {
        console.warn('⚠️ All programs have score 0! Showing all programs for debugging:', {
          totalPrograms: programsForScoring.length,
          scoredPrograms: scored.length,
          scoreDistribution,
          sampleProgram: programsForScoring[0],
          sampleScored: scored[0],
        });
        // Show all programs even with 0 score for debugging
        setResults(scored.slice(0, 5));
      } else {
        setResults(top5);
      }
      
      // If no results, log for debugging
      if (top5.length === 0 && validPrograms.length === 0) {
        console.warn('⚠️ No valid programs after scoring:', {
          totalPrograms: programsForScoring.length,
          scoredPrograms: scored.length,
          validPrograms: validPrograms.length,
          answers,
          sampleProgram: programsForScoring[0],
        });
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
  const [answersSummaryExpanded, setAnswersSummaryExpanded] = useState(true);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        {/* Header - Centered with Wizard Icon - Larger but more compact */}
        <div className="mb-2 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center shadow-lg">
              <Wand2 className="w-5 h-5 text-yellow-400" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {t('reco.pageTitle')}
            </h1>
          </div>
          <p className="text-gray-600 text-xs sm:text-sm">
            {t('reco.pageSubtitle')}
          </p>
          
          {results.length > 0 && (
            <div className="mt-1 text-xs text-gray-600">
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

        <div className="flex flex-col gap-2">
          {/* Answers Summary Section - NEW - More Compact */}
          {answeredCount > 0 && (
            <Card className="p-3 max-w-5xl mx-auto w-full bg-white border-2 border-blue-100 shadow-md">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-base">📊</span>
                  <h2 className="text-base font-semibold text-gray-800">
                    {t('reco.ui.yourAnswers') || 'Deine Antworten'} ({answeredCount}/{visibleQuestions.length})
                  </h2>
                </div>
                <div className="flex items-center gap-3">
                  {/* Generate Button - Prominent */}
                  {hasEnoughAnswers && !showResults && (
                    <button
                      onClick={() => {
                        setShowResults(true);
                        updateGuidedResults();
                      }}
                      disabled={isLoading}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all text-sm font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transform hover:scale-105"
                    >
                      {isLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>{t('reco.generating') || 'Generating...'}</span>
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-4 h-4" />
                          <span>{t('reco.generateButton')}</span>
                        </>
                      )}
                    </button>
                  )}
                  {answeredCount > 0 && !hasEnoughAnswers && (
                    <div className="text-xs text-gray-500 text-right">
                      <div className="font-medium">{answeredCount} / {MIN_QUESTIONS_FOR_RESULTS} {t('reco.ui.required') || 'required'}</div>
                      <div className="text-gray-400">
                        {(t('reco.ui.answerMore') || 'Answer {count} more to generate results').replace('{count}', String(MIN_QUESTIONS_FOR_RESULTS - answeredCount))}
                      </div>
                    </div>
                  )}
                  <button
                    onClick={() => setAnswersSummaryExpanded(!answersSummaryExpanded)}
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                    aria-label={answersSummaryExpanded ? 'Collapse' : 'Expand'}
                  >
                    {answersSummaryExpanded ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              
              {answersSummaryExpanded && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5 text-xs">
                    {visibleQuestions.map((q, idx) => {
                      const value = answers[q.id];
                      const isAnswered = value !== undefined && value !== null && value !== '' && 
                                       !(Array.isArray(value) && value.length === 0);
                      const formattedAnswer = isAnswered ? formatAnswerForDisplay(q.id, value) : null;
                      
                      return (
                        <div key={q.id} className="flex items-start gap-2">
                          <span className={`flex-shrink-0 mt-0.5 ${isAnswered ? 'text-green-600' : 'text-gray-400'}`}>
                            {isAnswered ? (
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            ) : (
                              <span className="text-xs">-</span>
                            )}
                          </span>
                          <div className="flex-1 min-w-0">
                            <span className="font-medium text-gray-700">Q{idx + 1}:</span>{' '}
                            {formattedAnswer ? (
                              <span className="text-gray-900 break-words">{formattedAnswer}</span>
                            ) : (
                              <span className="text-gray-400 italic">{t('reco.ui.notAnswered') || 'Not answered'}</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </Card>
          )}
          
          {/* Questions/Filters - More Visually Separated */}
          <div className={`${mobileActiveTab === 'results' ? 'hidden lg:block' : ''}`}>
            <Card className="p-4 max-w-2xl mx-auto w-full bg-gradient-to-br from-white to-blue-50/30 border-2 border-blue-300 shadow-lg">
              <div className="space-y-3">
                  {/* Question Navigation Header */}
                  <div className="mb-2">
                    <p className="text-base font-semibold text-gray-800">{t('reco.ui.questions') || 'Questions'}</p>
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
                      
                      {/* Current Question Display - With Prominent Navigation */}
                      <div className="relative bg-white rounded-lg border-2 border-blue-200 shadow-md p-4">
                        {/* Prominent Previous Button - Left Side */}
                        <button
                          onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                          disabled={currentQuestionIndex === 0}
                          className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-16 sm:-translate-x-20 flex items-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-2.5 rounded-lg font-medium text-xs sm:text-sm transition-all shadow-lg z-10 whitespace-nowrap ${
                            currentQuestionIndex === 0
                              ? 'opacity-40 cursor-not-allowed bg-gray-300 text-gray-500'
                              : 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-105 active:scale-95'
                          }`}
                        >
                          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                          <span className="hidden sm:inline">{t('reco.ui.previous') || 'Previous'}</span>
                        </button>
                        
                        {/* Prominent Next Button - Right Side */}
                        <button
                          onClick={() => setCurrentQuestionIndex(Math.min(visibleQuestions.length - 1, currentQuestionIndex + 1))}
                          disabled={currentQuestionIndex === visibleQuestions.length - 1}
                          className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-16 sm:translate-x-20 flex items-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-2.5 rounded-lg font-medium text-xs sm:text-sm transition-all shadow-lg z-10 whitespace-nowrap ${
                            currentQuestionIndex === visibleQuestions.length - 1
                              ? 'opacity-40 cursor-not-allowed bg-gray-300 text-gray-500'
                              : 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-105 active:scale-95'
                          }`}
                        >
                          <span className="hidden sm:inline">{t('reco.ui.next') || 'Next'}</span>
                          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
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
                                      <h3 className="text-base font-semibold text-gray-900 break-words leading-relaxed">
                                        {question.label}
                                      </h3>
                                      {!question.required && (
                                        <span className="text-xs text-gray-500 font-normal">(Optional)</span>
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
                                    const otherTextValue = isOtherOption && isSelected ? (answers[`${question.id}_other`] || '') : '';
                                    
                                    return (
                                      <div key={option.value} className="space-y-2">
                                        <button
                                          onClick={() => {
                                            handleAnswer(question.id, option.value);
                                            // Clear region if switching main option
                                            if (showRegionInput && value !== option.value) {
                                              handleAnswer(`${question.id}_region`, undefined);
                                            }
                                            // Clear "other" text if switching away
                                            if (isOtherOption && value !== option.value) {
                                              handleAnswer(`${question.id}_other`, undefined);
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
                                        
                                        {/* Text input for "Other" option */}
                                        {isOtherOption && isSelected && question.hasOtherTextInput && (
                                          <div className="ml-4 space-y-1.5 border-l-2 border-blue-200 pl-3 pt-1">
                                            <label className="text-xs font-medium text-gray-600 mb-1 block">
                                              {t('reco.ui.pleaseSpecify') || 'Please specify:'}
                                            </label>
                                            <input
                                              type="text"
                                              placeholder={t('reco.ui.enterAnswer') || 'Enter your answer...'}
                                              value={otherTextValue}
                                              onChange={(e) => {
                                                handleAnswer(`${question.id}_other`, e.target.value);
                                              }}
                                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
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
                                    const otherTextValue = isOtherOption && isSelected ? (answers[`${question.id}_other`] || '') : '';
                                    
                                    return (
                                      <div key={option.value} className="space-y-1.5">
                                        <button
                                          onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
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
                                                // Toggle: if selected, deselect; if not selected, select
                                                newValue = isSelected
                                                  ? current.filter(v => v !== option.value)
                                                  : [...current, option.value];
                                              }
                                            }
                                            
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
                                        {isOtherOption && isSelected && question.hasOtherTextInput && (
                                          <div className="ml-4 space-y-1.5 border-l-2 border-blue-200 pl-3 pt-1">
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
                                                    placeholder="Enter your answer..."
                                                    value={otherTextValue}
                                                    onChange={(e) => {
                                                      handleAnswer(`${question.id}_other`, [e.target.value]);
                                                    }}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                                              <input
                                                type="text"
                                                placeholder="Enter your answer..."
                                                value={otherTextValue}
                                                onChange={(e) => {
                                                  handleAnswer(`${question.id}_other`, e.target.value);
                                                }}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                              />
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
                                      }}
                                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                      style={{
                                        background: `linear-gradient(to right, #2563eb 0%, #2563eb ${((typeof value === 'number' ? value : question.min) - question.min) / (question.max - question.min) * 100}%, #e5e7eb ${((typeof value === 'number' ? value : question.min) - question.min) / (question.max - question.min) * 100}%, #e5e7eb 100%)`
                                      }}
                                    />
                                    <div className="text-center">
                                      {question.editableValue ? (
                                        <input
                                          type="text"
                                          value={typeof value === 'number' 
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
                                          onChange={(e) => {
                                            let cleaned = e.target.value;
                                            // Remove currency symbol, unit text, and spaces
                                            if (question.unit === 'EUR') {
                                              cleaned = cleaned.replace(/[€,\s]/g, '');
                                              const numValue = parseInt(cleaned);
                                              if (!isNaN(numValue) && numValue >= question.min && numValue <= question.max) {
                                                handleAnswer(question.id, numValue);
                                              }
                                            } else if (question.unit === 'years') {
                                              cleaned = cleaned.replace(/[years\s]/gi, '');
                                              const numValue = parseFloat(cleaned);
                                              if (!isNaN(numValue) && numValue >= question.min && numValue <= question.max) {
                                                handleAnswer(question.id, numValue);
                                              }
                                            } else if (question.unit === 'months') {
                                              // Remove translated months text
                                              const monthsText = t('reco.ui.sliderMonths') || 'months';
                                              cleaned = cleaned.replace(new RegExp(`[${monthsText}\\s]`, 'gi'), '');
                                              cleaned = cleaned.replace(/[months\s]/gi, '');
                                              const numValue = parseInt(cleaned);
                                              if (!isNaN(numValue) && numValue >= question.min && numValue <= question.max) {
                                                handleAnswer(question.id, numValue);
                                              }
                                            } else if (question.unit === 'people') {
                                              // Remove translated people text
                                              const peopleText = t('reco.ui.sliderPeople') || 'people';
                                              cleaned = cleaned.replace(new RegExp(`[${peopleText}\\s]`, 'gi'), '');
                                              cleaned = cleaned.replace(/[people\s]/gi, '');
                                              const numValue = parseInt(cleaned);
                                              if (!isNaN(numValue) && numValue >= question.min && numValue <= question.max) {
                                                handleAnswer(question.id, numValue);
                                              }
                                            } else {
                                              cleaned = cleaned.replace(/[months\speople\s]/gi, '');
                                              const numValue = parseInt(cleaned);
                                              if (!isNaN(numValue) && numValue >= question.min && numValue <= question.max) {
                                                handleAnswer(question.id, numValue);
                                              }
                                            }
                                          }}
                                          onBlur={(e) => {
                                            // Ensure value is within bounds
                                            let cleaned = e.target.value;
                                            if (question.unit === 'EUR') {
                                              cleaned = cleaned.replace(/[€,\s]/g, '');
                                              const numValue = parseInt(cleaned);
                                              if (isNaN(numValue) || numValue < question.min) {
                                                handleAnswer(question.id, question.min);
                                              } else if (numValue > question.max) {
                                                handleAnswer(question.id, question.max);
                                              }
                                            } else if (question.unit === 'years') {
                                              cleaned = cleaned.replace(/[years\s]/gi, '');
                                              const numValue = parseFloat(cleaned);
                                              if (isNaN(numValue) || numValue < question.min) {
                                                handleAnswer(question.id, question.min);
                                              } else if (numValue > question.max) {
                                                handleAnswer(question.id, question.max);
                                              }
                                            } else if (question.unit === 'months') {
                                              const monthsText = t('reco.ui.sliderMonths') || 'months';
                                              cleaned = cleaned.replace(new RegExp(`[${monthsText}\\s]`, 'gi'), '');
                                              cleaned = cleaned.replace(/[months\s]/gi, '');
                                              const numValue = parseInt(cleaned);
                                              if (isNaN(numValue) || numValue < question.min) {
                                                handleAnswer(question.id, question.min);
                                              } else if (numValue > question.max) {
                                                handleAnswer(question.id, question.max);
                                              }
                                            } else if (question.unit === 'people') {
                                              const peopleText = t('reco.ui.sliderPeople') || 'people';
                                              cleaned = cleaned.replace(new RegExp(`[${peopleText}\\s]`, 'gi'), '');
                                              cleaned = cleaned.replace(/[people\s]/gi, '');
                                              const numValue = parseInt(cleaned);
                                              if (isNaN(numValue) || numValue < question.min) {
                                                handleAnswer(question.id, question.min);
                                              } else if (numValue > question.max) {
                                                handleAnswer(question.id, question.max);
                                              }
                                            } else {
                                              cleaned = cleaned.replace(/[months\speople\s]/gi, '');
                                              const numValue = parseInt(cleaned);
                                              if (isNaN(numValue) || numValue < question.min) {
                                                handleAnswer(question.id, question.min);
                                              } else if (numValue > question.max) {
                                                handleAnswer(question.id, question.max);
                                              }
                                            }
                                          }}
                                          className="text-lg font-semibold text-blue-600 text-center border-2 border-blue-200 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-40"
                                        />
                                      ) : (
                                        <span className="text-lg font-semibold text-blue-600">
                                          {question.unit === 'EUR' ? '€' : ''}
                                          {typeof value === 'number' 
                                            ? value.toLocaleString('de-DE', { minimumFractionDigits: question.unit === 'years' ? 1 : 0, maximumFractionDigits: question.unit === 'years' ? 1 : 0 })
                                            : question.min.toLocaleString('de-DE')}
                                          {question.unit === 'EUR' ? '' : question.unit === 'months' ? ` ${t('reco.ui.sliderMonths') || 'months'}` : question.unit === 'people' ? ` ${t('reco.ui.sliderPeople') || 'people'}` : ` ${question.unit}`}
                                        </span>
                                      )}
                                    </div>
                                    
                                    {/* Human icons for team size */}
                                    {question.id === 'team_size' && (
                                      <div className="flex items-center justify-center gap-1 mt-2">
                                        {Array.from({ length: Math.min(Math.ceil((typeof value === 'number' ? value : 1) / 2), 10) }, (_, i) => (
                                          <svg key={i} className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                                          </svg>
                                        ))}
                                        {(typeof value === 'number' ? value : 1) > 20 && (
                                          <span className="text-sm text-gray-600 ml-1">+</span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                  
                                  {/* Skip Button for Range */}
                                  {!question.required && (
                                    <button
                                      onClick={() => {
                                        handleAnswer(question.id, undefined);
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
                            </div>
                          );
                        })()}
                        
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          
          {/* Results Modal/Popup - Overlay */}
          {showResults && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={() => setShowResults(false)}>
              <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
                  <h2 className="text-2xl font-bold text-gray-900">Funding Program Recommendations</h2>
                  <button
                    onClick={() => setShowResults(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="p-6">
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
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

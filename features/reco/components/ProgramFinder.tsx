/**
 * ProgramFinder - Unified interface for SmartWizard and Advanced Search
 * Simplified version without QuestionEngine - uses static form
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { Search, Filter, Sparkles, TrendingUp, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Progress } from '@/shared/components/ui/progress';
import { scoreProgramsEnhanced, EnhancedProgramResult } from '@/features/reco/engine/enhancedRecoEngine';
import { useRecommendation } from '@/features/reco/contexts/RecommendationContext';

interface ProgramFinderProps {
  onProgramSelect?: (programId: string, route: string) => void;
  initialMode?: 'guided' | 'manual';
}

type SearchMode = 'guided' | 'manual';

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
    required: true,
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
    required: true,
    priority: 2,
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
    priority: 4,
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
    priority: 5,
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
    ],
    required: false,
    priority: 6,
    skipIf: (answers: Record<string, any>) => answers.company_type === 'research', // Research orgs have different funding structures, use of funds handled separately
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
    priority: 7,
    skipIf: (answers: Record<string, any>) => answers.company_type === 'research', // Research orgs have different structures
  },
  {
    id: 'co_financing',
    label: 'Can you provide co-financing?',
    type: 'single-select' as const,
    options: [
      { value: 'co_yes', label: 'Yes, required' },
      { value: 'co_partial', label: 'Partial (up to 50%)' },
      { value: 'co_no', label: 'No co-financing available' },
    ],
    required: false,
    priority: 8,
    skipIf: (answers: Record<string, any>) => answers.funding_amount === 'under100k', // Small amounts usually don't require co-financing
  },
  {
    id: 'revenue_status',
    label: 'What is your current revenue status?',
    type: 'single-select' as const,
    options: [
      { value: 'pre_revenue', label: 'Pre-revenue' },
      { value: 'early_revenue', label: 'Early revenue (< €1M)' },
      { value: 'growing_revenue', label: 'Growing revenue (€1M+)' },
    ],
    required: false,
    priority: 9,
    skipIf: (answers: Record<string, any>) => {
      // Skip if pre-revenue stage or research
      return answers.company_stage === 'idea' || 
             answers.company_stage === 'pre_company' || 
             answers.company_stage === 'inc_lt_6m' ||
             answers.company_type === 'research';
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
    priority: 10,
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
    priority: 11,
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
    priority: 12,
    skipIf: (answers: Record<string, any>) => answers.project_duration === 'over10', // Long-term projects are usually flexible with deadlines
  },
];

export default function ProgramFinder({ 
  onProgramSelect,
  initialMode = 'guided'
}: ProgramFinderProps) {
  const router = useRouter();
  const { setRecommendations } = useRecommendation();
  
  const [mode, setMode] = useState<SearchMode>(initialMode);
  const [results, setResults] = useState<EnhancedProgramResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Guided mode state
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [showFilters, setShowFilters] = useState(false);
  
  // Manual mode state
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    fundingAmount: { min: '', max: '' },
    companyStage: '',
    trl: '',
    location: '',
    fundingType: '',
    industry: ''
  });

  // Get visible questions (with skip logic)
  const getVisibleQuestions = () => {
    return CORE_QUESTIONS.filter(q => {
      if (q.skipIf && q.skipIf(answers)) return false;
      return true;
    });
  };

  const visibleQuestions = getVisibleQuestions();
  const answeredCount = Object.keys(answers).length;
  const totalQuestions = visibleQuestions.length;
  
  const updateGuidedResults = useCallback(async () => {
    if (answeredCount === 0) return;
    
    try {
      setIsLoading(true);
      
      // Use on-demand recommendation API
      const response = await fetch('/api/programs/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers,
          max_results: 20,
          extract_all: false,
        }),
      });
      
      if (!response.ok) throw new Error('Failed to fetch recommendations');
      
      const data = await response.json();
      const extractedPrograms = data.programs || [];
      
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
      setResults(scored);
      
      // Store in context for results page
      setRecommendations(scored);
      if (typeof window !== 'undefined') {
        localStorage.setItem('recoResults', JSON.stringify(scored));
        localStorage.setItem('userAnswers', JSON.stringify(answers));
      }
    } catch (error) {
      console.error('Error updating guided results:', error);
    } finally {
      setIsLoading(false);
    }
  }, [answers, answeredCount, setRecommendations]);
  
  const updateManualResults = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Convert filters to answers format for on-demand API
      const answersFromFilters = {
        location: filters.location,
        company_stage: filters.companyStage,
        funding_amount: filters.fundingAmount.max || filters.fundingAmount.min,
        industry_focus: filters.industry,
        ...(searchQuery ? { project_description: searchQuery } : {}),
      };
      
      // Use on-demand recommendation API
      const response = await fetch('/api/programs/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers: answersFromFilters,
          max_results: 50,
          extract_all: Object.keys(answersFromFilters).length === 0,
        }),
      });
      
      if (!response.ok) throw new Error('Failed to fetch recommendations');
      
      const data = await response.json();
      const extractedPrograms = data.programs || [];
      
      // Convert to Program format and score
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
      
      const scored = await scoreProgramsEnhanced(answersFromFilters as any, 'strict', programsForScoring);
      setResults(scored);
      setRecommendations(scored);
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('recoResults', JSON.stringify(scored));
        localStorage.setItem('userAnswers', JSON.stringify(answersFromFilters));
      }
    } catch (error) {
      console.error('Error updating manual results:', error);
    } finally {
      setIsLoading(false);
    }
  }, [filters, searchQuery, setRecommendations]);
  
  // Update results when answers/filters change
  useEffect(() => {
    if (mode === 'guided' && answeredCount > 0) {
      updateGuidedResults();
    } else if (mode === 'manual' && (searchQuery || Object.values(filters).some(v => v !== '' && v !== null))) {
      updateManualResults();
    }
  }, [answers, filters, searchQuery, mode, answeredCount, updateGuidedResults, updateManualResults]);
  
  const handleAnswer = (questionId: string, value: any) => {
    const newAnswers = { ...answers, [questionId]: value };
    setAnswers(newAnswers);
  };

  const handleProgramSelect = (program: EnhancedProgramResult) => {
    const programRoute = program.route || (program as any).program_type || 'grant';
    if (onProgramSelect) {
      onProgramSelect(program.id, programRoute);
    } else {
      router.push(`/editor?programId=${program.id}&route=${programRoute}`);
    }
  };
  
  const handleViewAllResults = () => {
    setRecommendations(results);
    if (typeof window !== 'undefined') {
      localStorage.setItem('recoResults', JSON.stringify(results));
      localStorage.setItem('userAnswers', JSON.stringify(mode === 'guided' ? answers : { ...filters, project_description: searchQuery }));
    }
    router.push('/results');
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Find Your Funding Program
          </h1>
          <p className="text-gray-600">
            Answer a few questions or use filters to discover the best funding opportunities
          </p>
        </div>
        
        {/* Mode Toggle */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex bg-white rounded-lg border border-gray-200 p-1">
            <button
              onClick={() => setMode('guided')}
              className={`
                px-4 py-2 rounded-md text-sm font-medium transition-colors
                ${mode === 'guided'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
                }
              `}
            >
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                <span>Guided Mode</span>
              </div>
            </button>
            <button
              onClick={() => setMode('manual')}
              className={`
                px-4 py-2 rounded-md text-sm font-medium transition-colors
                ${mode === 'manual'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
                }
              `}
            >
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <span>Manual Filters</span>
              </div>
            </button>
          </div>
          
          {results.length > 0 && (
            <div className="ml-auto text-sm text-gray-600">
              {results.length} program{results.length !== 1 ? 's' : ''} found
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Questions/Filters */}
          <div className="lg:col-span-1">
            <Card className="p-6">
              {mode === 'guided' ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">Guided Questions</h2>
                  </div>
                  
                  <div className="space-y-4 max-h-[600px] overflow-y-auto">
                    {visibleQuestions.map((question) => {
                      const value = answers[question.id];
                      return (
                        <div key={question.id} className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            {question.label}
                            {question.required && <span className="text-red-500 ml-1">*</span>}
                          </label>
                          {question.type === 'single-select' && (
                            <div className="space-y-2">
                              {question.options.map((option) => (
                                <button
                                  key={option.value}
                                  onClick={() => handleAnswer(question.id, option.value)}
                                  className={`w-full text-left px-4 py-2 border rounded-lg transition-colors ${
                                    value === option.value
                                      ? 'bg-blue-50 border-blue-300 text-blue-900'
                                      : 'border-gray-200 hover:bg-gray-50'
                                  }`}
                                >
                                  {option.label}
                                </button>
                              ))}
                            </div>
                          )}
                          {question.type === 'multi-select' && (
                            <div className="space-y-2">
                              {question.options.map((option) => {
                                const isSelected = Array.isArray(value) && value.includes(option.value);
                                return (
                                  <button
                                    key={option.value}
                                    onClick={() => {
                                      const current = Array.isArray(value) ? value : [];
                                      const newValue = isSelected
                                        ? current.filter(v => v !== option.value)
                                        : [...current, option.value];
                                      handleAnswer(question.id, newValue);
                                    }}
                                    className={`w-full text-left px-4 py-2 border rounded-lg transition-colors ${
                                      isSelected
                                        ? 'bg-blue-50 border-blue-300 text-blue-900'
                                        : 'border-gray-200 hover:bg-gray-50'
                                    }`}
                                  >
                                    {isSelected ? '✓ ' : ''}{option.label}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Progress */}
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                      <span>Progress</span>
                      <span>{answeredCount} of {totalQuestions} questions answered</span>
                    </div>
                    <div className="h-2">
                      <Progress value={(answeredCount / totalQuestions) * 100} />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
                    <Button
                      onClick={() => setShowFilters(!showFilters)}
                      size="sm"
                      variant="outline"
                    >
                      {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </div>
                  
                  {/* Search Query */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Project Description
                    </label>
                    <textarea
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Describe your project (e.g., AI climate analytics for urban planning)..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={3}
                    />
                  </div>
                  
                  {showFilters && (
                    <div className="space-y-4 pt-4 border-t border-gray-200">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Funding Amount
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={filters.fundingAmount.min}
                            onChange={(e) => setFilters({ ...filters, fundingAmount: { ...filters.fundingAmount, min: e.target.value } })}
                            placeholder="Min"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                          />
                          <input
                            type="number"
                            value={filters.fundingAmount.max}
                            onChange={(e) => setFilters({ ...filters, fundingAmount: { ...filters.fundingAmount, max: e.target.value } })}
                            placeholder="Max"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Company Stage
                        </label>
                        <select
                          value={filters.companyStage}
                          onChange={(e) => setFilters({ ...filters, companyStage: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        >
                          <option value="">Any</option>
                          <option value="pre-seed">Pre-seed</option>
                          <option value="seed">Seed</option>
                          <option value="series-a">Series A</option>
                          <option value="growth">Growth</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          TRL Level
                        </label>
                        <select
                          value={filters.trl}
                          onChange={(e) => setFilters({ ...filters, trl: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        >
                          <option value="">Any</option>
                          <option value="1-3">TRL 1-3 (Concept)</option>
                          <option value="4-6">TRL 4-6 (Prototype)</option>
                          <option value="7-9">TRL 7-9 (Product)</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Location
                        </label>
                        <input
                          type="text"
                          value={filters.location}
                          onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                          placeholder="Austria, Germany, EU..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Funding Type
                        </label>
                        <select
                          value={filters.fundingType}
                          onChange={(e) => setFilters({ ...filters, fundingType: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        >
                          <option value="">Any</option>
                          <option value="grants">Grants</option>
                          <option value="loans">Loans</option>
                          <option value="equity">Equity</option>
                          <option value="services">Services</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Card>
          </div>
          
          {/* Right: Results */}
          <div className="lg:col-span-2">
            {isLoading ? (
              <Card className="p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Finding programs...</p>
              </Card>
            ) : results.length === 0 ? (
              <Card className="p-12 text-center">
                <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  {mode === 'guided' 
                    ? 'Answer questions to see matching programs'
                    : 'Enter search query or apply filters to find programs'
                  }
                </p>
              </Card>
            ) : (
              <div className="space-y-4">
                {results.length > 0 && (
                  <div className="flex justify-end mb-4">
                    <Button
                      onClick={handleViewAllResults}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <Search className="h-4 w-4" />
                      View All Results ({results.length})
                    </Button>
                  </div>
                )}
                {results.map((program) => (
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
                    
                    {(program.reasons || program.founderFriendlyReasons) && (program.reasons?.length || program.founderFriendlyReasons?.length || 0) > 0 && (
                      <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-semibold text-green-900">Why this matches:</span>
                        </div>
                        <ul className="text-sm text-green-800 space-y-1">
                          {(program.reasons || program.founderFriendlyReasons || []).slice(0, 3).map((reason: string, i: number) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-green-500 mt-1">•</span>
                              <span>{reason}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {(program.risks || program.founderFriendlyRisks) && (program.risks?.length || program.founderFriendlyRisks?.length || 0) > 0 && (
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
    </div>
  );
}

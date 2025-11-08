/**
 * ProgramFinder - Unified interface for SmartWizard and Advanced Search
 * Based on strategic analysis report recommendations
 * Merges guided wizard flow with manual filters in single UI
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { Search, Filter, Sparkles, TrendingUp, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Progress } from '@/shared/components/ui/progress';
import { QuestionEngine, SymptomQuestion } from '@/features/reco/engine/questionEngine';
import { scoreProgramsEnhanced, EnhancedProgramResult } from '@/features/reco/engine/enhancedRecoEngine';
import { useRecommendation } from '@/features/reco/contexts/RecommendationContext';
import { useUser } from '@/shared/contexts/UserContext';
import { isFeatureEnabled, getSubscriptionTier, FeatureFlag } from '@/shared/lib/featureFlags';
import UpgradeModal from '@/shared/components/UpgradeModal';

interface ProgramFinderProps {
  onProgramSelect?: (programId: string, route: string) => void;
  initialMode?: 'guided' | 'manual';
}

type SearchMode = 'guided' | 'manual';

export default function ProgramFinder({ 
  onProgramSelect,
  initialMode = 'guided'
}: ProgramFinderProps) {
  const router = useRouter();
  const { setRecommendations } = useRecommendation();
  const { userProfile } = useUser();
  
  const [mode, setMode] = useState<SearchMode>(initialMode);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState<FeatureFlag | undefined>();
  const [programs, setPrograms] = useState<any[]>([]);
  const [questionEngine, setQuestionEngine] = useState<QuestionEngine | null>(null);
  const [results, setResults] = useState<EnhancedProgramResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Guided mode state
  const [currentQuestion, setCurrentQuestion] = useState<SymptomQuestion | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [questionHistory, setQuestionHistory] = useState<string[]>([]);
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
  
  // Load programs on mount
  useEffect(() => {
    loadPrograms();
  }, []);
  
  const loadPrograms = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/programs?enhanced=true');
      if (!response.ok) throw new Error('Failed to load programs');
      
      const data = await response.json();
      const loadedPrograms = data.programs || [];
      setPrograms(loadedPrograms);
      
      // Initialize question engine
      const engine = new QuestionEngine(loadedPrograms);
      setQuestionEngine(engine);
      
      // Start with first question
      const firstQuestion = await engine.getNextQuestion({});
      setCurrentQuestion(firstQuestion);
    } catch (error) {
      console.error('Error loading programs:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Update results when answers/filters change
  useEffect(() => {
    if (programs.length === 0) return;
    
    if (mode === 'guided' && Object.keys(answers).length > 0) {
      updateGuidedResults();
    } else if (mode === 'manual' && (searchQuery || Object.values(filters).some(v => v !== '' && v !== null))) {
      updateManualResults();
    }
  }, [answers, filters, searchQuery, mode, programs]);
  
  const updateGuidedResults = useCallback(async () => {
    if (!questionEngine) return;
    
    try {
      setIsLoading(true);
      const scored = await scoreProgramsEnhanced(answers, 'strict', programs);
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
  }, [questionEngine, programs, answers, setRecommendations]);
  
  const updateManualResults = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Check if semantic search is enabled (premium feature)
      const subscriptionTier = getSubscriptionTier(userProfile);
      const canUseSemanticSearch = isFeatureEnabled('semantic_search', subscriptionTier);
      
      // Use semantic search API if query provided, otherwise use rule-based
      if (searchQuery && searchQuery.trim().length > 0) {
        if (!canUseSemanticSearch) {
          // Show upgrade modal for semantic search
          setUpgradeFeature('semantic_search');
          setShowUpgradeModal(true);
          // Fall back to rule-based search
          const scored = await scoreProgramsEnhanced({
            ...filters,
            project_description: searchQuery
          } as any, 'strict', programs);
          setResults(scored);
          return;
        }
        
        // Use semantic search API (combines rule-based + semantic)
        const response = await fetch('/api/programmes/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: searchQuery,
            filters: filters,
            mode: 'manual',
            limit: 50
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          setResults(data.programs || []);
          // Store in context for results page
          if (data.programs) {
            setRecommendations(data.programs);
            if (typeof window !== 'undefined') {
              localStorage.setItem('recoResults', JSON.stringify(data.programs));
              localStorage.setItem('userAnswers', JSON.stringify({ ...filters, project_description: searchQuery }));
            }
          }
        } else {
          // Fallback to rule-based if API fails
          const scored = await scoreProgramsEnhanced({
            ...filters,
            project_description: searchQuery
          } as any, 'strict', programs);
          setResults(scored);
        }
      } else {
        // No query, use rule-based filtering only
        const scored = await scoreProgramsEnhanced(filters as any, 'strict', programs);
        setResults(scored);
      }
    } catch (error) {
      console.error('Error updating manual results:', error);
      // Fallback to rule-based on error
      const scored = await scoreProgramsEnhanced({
        ...filters,
        project_description: searchQuery
      } as any, 'strict', programs);
      setResults(scored);
    } finally {
      setIsLoading(false);
    }
  }, [programs, filters, searchQuery, setRecommendations]);
  
  const handleAnswer = async (questionId: string, value: any) => {
    const newAnswers = { ...answers, [questionId]: value };
    setAnswers(newAnswers);
    setQuestionHistory([...questionHistory, questionId]);
    
    if (questionEngine) {
      const nextQuestion = await questionEngine.getNextQuestion(newAnswers);
      setCurrentQuestion(nextQuestion);
    }
  };
  
  const handleBack = async () => {
    if (questionHistory.length > 0) {
      const newHistory = [...questionHistory];
      newHistory.pop();
      setQuestionHistory(newHistory);
      
      const previousQuestionId = newHistory[newHistory.length - 1];
      if (questionEngine && previousQuestionId) {
        const prevAnswers = { ...answers };
        delete prevAnswers[previousQuestionId];
        setAnswers(prevAnswers);
        
        const question = await questionEngine.getNextQuestion(prevAnswers);
        setCurrentQuestion(question);
      }
    }
  };
  
  const handleProgramSelect = (program: EnhancedProgramResult) => {
    const programRoute = program.route || (program as any).program_type || 'grant';
    if (onProgramSelect) {
      onProgramSelect(program.id, programRoute);
    } else {
      // Route directly to editor
      router.push(`/editor?programId=${program.id}&route=${programRoute}`);
    }
  };
  
  const handleViewAllResults = () => {
    // Store results and route to results page
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
                    {questionHistory.length > 0 && (
                      <Button
                        onClick={handleBack}
                        size="sm"
                        variant="outline"
                      >
                        ← Back
                      </Button>
                    )}
                  </div>
                  
                  {currentQuestion && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {currentQuestion.symptom}
                        </label>
                        {(currentQuestion.type === 'single-select' || currentQuestion.type === 'multi-select') && currentQuestion.options && (
                          <div className="space-y-2">
                            {currentQuestion.options.map((option: any) => (
                              <button
                                key={option.value}
                                onClick={() => handleAnswer(currentQuestion.id, option.value)}
                                className="w-full text-left px-4 py-2 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors"
                              >
                                {option.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      {/* Progress */}
                      <div className="pt-4 border-t border-gray-200">
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                          <span>Progress</span>
                          <span>{Object.keys(answers).length} questions answered</span>
                        </div>
                        <div className="h-2">
                          <Progress 
                            value={(Object.keys(answers).length / 10) * 100} 
                          />
                        </div>
                      </div>
                    </div>
                  )}
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
                {/* View All Results Button */}
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
                    
                    {/* Explanations */}
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
                    
                    {/* Risks/Gaps */}
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
                    
                    {/* Matched Criteria */}
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
      
      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        feature={upgradeFeature}
      />
    </div>
  );
}


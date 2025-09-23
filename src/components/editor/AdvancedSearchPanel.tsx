/**
 * Visual Search Panel for editor
 * Interactive scenario testing with visual impact charts
 */

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface SearchResult {
  id: string;
  title: string;
  content: string;
  score: number;
  beforeScore: number;
  afterScore: number;
  delta: number;
  reasons: string[];
  risks: string[];
}

interface ScenarioParams {
  fundingAmount: number;
  teamSize: number;
  timeline: number;
  revenue: number;
  marketSize: number;
}

interface AdvancedSearchPanelProps {
  onSearch: (query: string) => void;
  onResultSelect: (result: SearchResult) => void;
  searchResults: SearchResult[];
  isLoading: boolean;
  currentQuery: string;
}

export default function AdvancedSearchPanel({
  onSearch,
  onResultSelect,
  searchResults,
  isLoading,
  currentQuery
}: AdvancedSearchPanelProps) {
  const [query, setQuery] = useState(currentQuery);
  const [showDeltas, setShowDeltas] = useState(true);
  const [sortBy, setSortBy] = useState<'score' | 'delta' | 'title'>('score');
  const [showScenarioTesting, setShowScenarioTesting] = useState(false);
  const [scenarioParams, setScenarioParams] = useState<ScenarioParams>({
    fundingAmount: 100000,
    teamSize: 5,
    timeline: 12,
    revenue: 50000,
    marketSize: 1000000
  });
  const [baselineParams] = useState<ScenarioParams>({
    fundingAmount: 100000,
    teamSize: 5,
    timeline: 12,
    revenue: 50000,
    marketSize: 1000000
  });

  useEffect(() => {
    setQuery(currentQuery);
  }, [currentQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  const handleResultClick = (result: SearchResult) => {
    onResultSelect(result);
  };

  const sortedResults = [...searchResults].sort((a, b) => {
    switch (sortBy) {
      case 'score':
        return b.score - a.score;
      case 'delta':
        return b.delta - a.delta;
      case 'title':
        return a.title.localeCompare(b.title);
      default:
        return 0;
    }
  });

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getDeltaColor = (delta: number) => {
    if (delta > 0) return 'text-green-600';
    if (delta < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getDeltaIcon = (delta: number) => {
    if (delta > 0) return '↗';
    if (delta < 0) return '↘';
    return '→';
  };

  const calculateScenarioImpact = (params: ScenarioParams) => {
    // Simulate impact calculation based on parameters
    const fundingImpact = Math.min(params.fundingAmount / 50000, 2) * 20;
    const teamImpact = Math.min(params.teamSize / 3, 2) * 15;
    const timelineImpact = Math.max(0, (24 - params.timeline) / 24) * 25;
    const revenueImpact = Math.min(params.revenue / 100000, 2) * 20;
    const marketImpact = Math.min(params.marketSize / 2000000, 2) * 20;
    
    return Math.min(100, fundingImpact + teamImpact + timelineImpact + revenueImpact + marketImpact);
  };

  const getScenarioRecommendations = (params: ScenarioParams) => {
    const recommendations = [];
    
    if (params.fundingAmount < 50000) {
      recommendations.push("Consider increasing funding amount for better program eligibility");
    }
    if (params.teamSize < 3) {
      recommendations.push("Expand team size to strengthen application");
    }
    if (params.timeline > 18) {
      recommendations.push("Shorten timeline to improve competitiveness");
    }
    if (params.revenue < 25000) {
      recommendations.push("Focus on revenue generation strategies");
    }
    if (params.marketSize < 500000) {
      recommendations.push("Expand market size or target additional segments");
    }
    
    return recommendations;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };


  const baselineScore = calculateScenarioImpact(baselineParams);
  const currentScore = calculateScenarioImpact(scenarioParams);
  const scoreDelta = currentScore - baselineScore;
  const recommendations = getScenarioRecommendations(scenarioParams);

  return (
    <Card className="p-4">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold">Visual Search & Testing</h3>
          <button
            onClick={() => setShowScenarioTesting(!showScenarioTesting)}
            className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
          >
            {showScenarioTesting ? 'Hide Testing' : 'Show Testing'}
          </button>
        </div>
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search programs, requirements, eligibility..."
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Searching...' : 'Search'}
          </Button>
        </form>
      </div>

      {/* Scenario Testing Section */}
      {showScenarioTesting && (
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border">
          <h4 className="font-semibold text-gray-900 mb-3">What-If Scenario Testing</h4>
          
          {/* Visual Impact Chart */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Eligibility Score Impact</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Baseline: {baselineScore.toFixed(0)}%</span>
                <span className={`text-sm font-medium ${scoreDelta >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {scoreDelta >= 0 ? '+' : ''}{scoreDelta.toFixed(0)}%
                </span>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, currentScore))}%` }}
              ></div>
            </div>
            <div className="text-xs text-gray-600">
              Current Score: <span className="font-medium">{currentScore.toFixed(0)}%</span>
            </div>
          </div>

          {/* Interactive Parameter Sliders */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Funding Amount: {formatCurrency(scenarioParams.fundingAmount)}
              </label>
              <input
                type="range"
                min="10000"
                max="500000"
                step="10000"
                value={scenarioParams.fundingAmount}
                onChange={(e) => setScenarioParams(prev => ({ ...prev, fundingAmount: parseInt(e.target.value) }))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>€10K</span>
                <span>€500K</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Team Size: {scenarioParams.teamSize} people
              </label>
              <input
                type="range"
                min="1"
                max="20"
                step="1"
                value={scenarioParams.teamSize}
                onChange={(e) => setScenarioParams(prev => ({ ...prev, teamSize: parseInt(e.target.value) }))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>1</span>
                <span>20</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Timeline: {scenarioParams.timeline} months
              </label>
              <input
                type="range"
                min="3"
                max="36"
                step="1"
                value={scenarioParams.timeline}
                onChange={(e) => setScenarioParams(prev => ({ ...prev, timeline: parseInt(e.target.value) }))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>3m</span>
                <span>36m</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Revenue: {formatCurrency(scenarioParams.revenue)}
              </label>
              <input
                type="range"
                min="0"
                max="500000"
                step="5000"
                value={scenarioParams.revenue}
                onChange={(e) => setScenarioParams(prev => ({ ...prev, revenue: parseInt(e.target.value) }))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>€0</span>
                <span>€500K</span>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <div className="mb-4">
              <h5 className="text-sm font-medium text-gray-700 mb-2">Actionable Recommendations:</h5>
              <ul className="space-y-1">
                {recommendations.map((rec, index) => (
                  <li key={index} className="text-xs text-gray-600 flex items-start">
                    <span className="text-blue-500 mr-2">•</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Reset Button */}
          <div className="flex justify-end">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setScenarioParams(baselineParams)}
              className="text-xs"
            >
              Reset to Baseline
            </Button>
          </div>
        </div>
      )}

      {searchResults.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">
              {searchResults.length} results found
            </span>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="text-sm border border-gray-300 rounded px-2 py-1"
              >
                <option value="score">Score</option>
                <option value="delta">Delta</option>
                <option value="title">Title</option>
              </select>
            </div>
          </div>
          
          <div className="flex items-center gap-2 mb-2">
            <label className="text-sm text-gray-600">Show deltas:</label>
            <input
              type="checkbox"
              checked={showDeltas}
              onChange={(e) => setShowDeltas(e.target.checked)}
              className="rounded"
            />
          </div>
        </div>
      )}

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {sortedResults.map((result) => (
          <div
            key={result.id}
            className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 cursor-pointer transition-all duration-200 hover:shadow-md"
            onClick={() => handleResultClick(result)}
          >
            <div className="flex items-start justify-between mb-2 gap-2">
              <h4 className="font-medium text-gray-900 text-sm flex-1 min-w-0">{result.title}</h4>
              <div className="flex items-center gap-1 flex-shrink-0">
                <Badge className={getScoreColor(result.score)}>
                  {result.score}%
                </Badge>
                {showDeltas && (
                  <span className={`text-xs ${getDeltaColor(result.delta)}`}>
                    {getDeltaIcon(result.delta)} {Math.abs(result.delta)}%
                  </span>
                )}
              </div>
            </div>
            
            {/* Visual Score Bar */}
            <div className="mb-3">
              <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                <span>Eligibility Score</span>
                <span className="font-medium">{result.score}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    result.score >= 80 ? 'bg-gradient-to-r from-green-400 to-green-600' :
                    result.score >= 60 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                    'bg-gradient-to-r from-red-400 to-red-600'
                  }`}
                  style={{ width: `${result.score}%` }}
                ></div>
              </div>
            </div>
            
            <p className="text-xs text-gray-600 mb-2 line-clamp-2">
              {result.content}
            </p>
            
            {showDeltas && (
              <div className="text-xs text-gray-500 mb-2 p-2 bg-gray-50 rounded">
                <div className="flex items-center justify-between">
                  <span>Before: {result.beforeScore}%</span>
                  <span className="text-gray-400">→</span>
                  <span>After: {result.afterScore}%</span>
                </div>
              </div>
            )}
            
            {result.reasons.length > 0 && (
              <div className="mb-2">
                <div className="text-xs text-green-600 font-medium mb-1 flex items-center">
                  <span className="mr-1">✓</span>
                  Why this program:
                </div>
                <ul className="text-xs text-gray-600 space-y-1">
                  {result.reasons.slice(0, 2).map((reason, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-green-500 mr-1">•</span>
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {result.risks.length > 0 && (
              <div>
                <div className="text-xs text-yellow-600 font-medium mb-1 flex items-center">
                  <span className="mr-1">⚠</span>
                  Considerations:
                </div>
                <ul className="text-xs text-gray-600 space-y-1">
                  {result.risks.slice(0, 2).map((risk, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-yellow-500 mr-1">•</span>
                      {risk}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>

      {searchResults.length === 0 && !isLoading && (
        <div className="text-center text-gray-500 py-8">
          <svg className="w-12 h-12 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p>No results found</p>
          <p className="text-xs text-gray-400 mt-1">
            Try different search terms or check your spelling
          </p>
        </div>
      )}

      {isLoading && (
        <div className="text-center text-gray-500 py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p>Searching...</p>
        </div>
      )}
    </Card>
  );
}

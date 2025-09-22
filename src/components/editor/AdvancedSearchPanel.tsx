/**
 * Advanced Search Panel for editor
 * Wires to same scorer, shows Before/After deltas
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

  return (
    <Card className="p-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Advanced Search</h3>
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
            className="border border-gray-200 rounded p-3 hover:bg-gray-50 cursor-pointer"
            onClick={() => handleResultClick(result)}
          >
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-medium text-gray-900 text-sm">{result.title}</h4>
              <div className="flex items-center gap-2">
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
            
            <p className="text-xs text-gray-600 mb-2 line-clamp-2">
              {result.content}
            </p>
            
            {showDeltas && (
              <div className="text-xs text-gray-500 mb-2">
                Before: {result.beforeScore}% → After: {result.afterScore}%
              </div>
            )}
            
            {result.reasons.length > 0 && (
              <div className="mb-2">
                <div className="text-xs text-green-600 font-medium mb-1">Why this program:</div>
                <ul className="text-xs text-gray-600 space-y-1">
                  {result.reasons.slice(0, 2).map((reason, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-green-500 mr-1">+</span>
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {result.risks.length > 0 && (
              <div>
                <div className="text-xs text-yellow-600 font-medium mb-1">Considerations:</div>
                <ul className="text-xs text-gray-600 space-y-1">
                  {result.risks.slice(0, 2).map((risk, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-yellow-500 mr-1">⚠</span>
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

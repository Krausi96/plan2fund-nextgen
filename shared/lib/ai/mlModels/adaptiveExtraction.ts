import { AdaptiveExtractionInput, AdaptiveExtractionDecision } from './types';

export function recommendExtractionStrategy(input: AdaptiveExtractionInput): AdaptiveExtractionDecision {
  const rationale: string[] = [];

  if (input.previousAccuracy !== undefined) {
    if (input.previousAccuracy >= 0.75) {
      rationale.push('Previous extraction highly accurate');
      return {
        strategy: 'custom_llm',
        confidence: 'high',
        rationale,
      };
    }
    if (input.previousAccuracy >= 0.5) {
      rationale.push('Moderate accuracy  keep hybrid approach');
      return {
        strategy: 'hybrid',
        confidence: 'medium',
        rationale,
      };
    }
  }

  if (input.pageType.includes('requirements')) {
    rationale.push('Requirements page detected  prefer LLM extraction');
    return {
      strategy: 'llm',
      confidence: 'medium',
      rationale,
    };
  }

  rationale.push('Defaulting to regex for structured pages');
  return {
    strategy: 'regex',
    confidence: 'low',
    rationale,
  };
}

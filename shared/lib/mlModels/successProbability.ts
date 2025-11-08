import { SuccessProbabilityFeatures, SuccessProbabilityResult, ConfidenceLevel } from './types';

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function determineConfidence(probability: number, factors: number): ConfidenceLevel {
  if (probability >= 0.7 && factors >= 3) return 'high';
  if (probability >= 0.4 && factors >= 2) return 'medium';
  return 'low';
}

export function estimateSuccessProbability(features: SuccessProbabilityFeatures): SuccessProbabilityResult {
  const factors: string[] = [];

  const historical = features.historicalRate ?? 0.30; // default baseline 30%
  let score = historical;

  if (features.baseScore >= 70) {
    score += 0.15;
    factors.push('High program match score');
  } else if (features.baseScore >= 50) {
    score += 0.08;
    factors.push('Moderate program match score');
  } else {
    score -= 0.05;
    factors.push('Low program match score');
  }

  const matchRatio = features.totalCriteria > 0 ? features.matchedCriteria / features.totalCriteria : 0;
  if (matchRatio >= 0.75) {
    score += 0.1;
    factors.push('Most requirements satisfied');
  } else if (matchRatio >= 0.4) {
    score += 0.05;
    factors.push('Some requirements satisfied');
  } else {
    score -= 0.05;
    factors.push('Few requirements matched');
  }

  if (features.gaps > 3) {
    score -= 0.1;
    factors.push('Several requirements missing');
  } else if (features.gaps === 0) {
    score += 0.05;
    factors.push('No major gaps');
  }

  if (features.qualityScore !== undefined) {
    if (features.qualityScore >= 75) {
      score += 0.05;
      factors.push('Strong plan quality metrics');
    } else if (features.qualityScore < 50) {
      score -= 0.05;
      factors.push('Plan quality needs improvement');
    }
  }

  score = clamp(score, 0.05, 0.95);

  const confidence = determineConfidence(score, factors.length);

  return {
    probability: Number(score.toFixed(2)),
    confidence,
    factors,
  };
}

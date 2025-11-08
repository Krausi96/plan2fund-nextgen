import { QualityPredictionInput, QualityPredictionResult } from './types';

function weightedAverage(values: number[], weights: number[]): number {
  const totalWeight = weights.reduce((acc, w) => acc + w, 0) || 1;
  return values.reduce((sum, value, index) => sum + value * (weights[index] || 0), 0) / totalWeight;
}

export function predictQualityScores(input: QualityPredictionInput): QualityPredictionResult {
  const coverageRatio = input.requiredWordCount
    ? Math.min(1, input.wordCount / input.requiredWordCount)
    : 1;

  const predictedCompleteness = weightedAverage(
    [input.completeness, coverageRatio * 100],
    [0.7, 0.3]
  );

  const predictedReadability = weightedAverage(
    [input.readability, input.observedOverall],
    [0.6, 0.4]
  );

  const predictedPersuasiveness = weightedAverage(
    [input.persuasiveness, input.observedOverall],
    [0.7, 0.3]
  );

  const predictedOverall = weightedAverage(
    [input.observedOverall, predictedCompleteness, predictedReadability, predictedPersuasiveness],
    [0.4, 0.2, 0.2, 0.2]
  );

  const notes: string[] = [];
  if (coverageRatio < 0.8) {
    notes.push('Increase content length to improve completeness.');
  }
  if (input.gaps && input.gaps > 0) {
    notes.push(`${input.gaps} requirement gap(s) detected  address them to raise predicted score.`);
  }

  const variance = Math.abs(predictedOverall - input.observedOverall);
  const confidence = variance < 10 ? 'high' : variance < 20 ? 'medium' : 'low';

  return {
    predictedOverall: Number(predictedOverall.toFixed(1)),
    predictedReadability: Number(predictedReadability.toFixed(1)),
    predictedCompleteness: Number(predictedCompleteness.toFixed(1)),
    predictedPersuasiveness: Number(predictedPersuasiveness.toFixed(1)),
    confidence,
    notes,
  };
}

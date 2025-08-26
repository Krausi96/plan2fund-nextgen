export function getConfidence(score: number) {
  if (score > 85) return "High";
  if (score > 70) return "Medium";
  return "Low";
}

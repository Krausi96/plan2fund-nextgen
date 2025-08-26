export function getConfidence(score: number, strictMode: boolean = false): "High" | "Medium" | "Low" {
  if (strictMode) {
    if (score >= 90) return "High";
    if (score >= 75) return "Medium";
    return "Low";
  } else {
    if (score >= 80) return "High";
    if (score >= 60) return "Medium";
    return "Low";
  }
}

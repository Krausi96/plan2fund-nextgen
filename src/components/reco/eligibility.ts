export function getEligibility(program: string, answers: Record<string, string>) {
  // Stub logic: if "sector" answer includes "tech" → eligible
  if (answers[1]?.toLowerCase().includes("tech")) return "Eligible";
  return "Not Eligible";
}

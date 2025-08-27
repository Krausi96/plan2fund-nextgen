export interface Answers {
  [key: number]: string;
}

export function getEligibility(program: string, answers: Answers): "Eligible" | "Not Eligible" {
  const sector = answers[1]?.toLowerCase() || "";
  const location = answers[2]?.toLowerCase() || "";
  const stage = answers[3]?.toLowerCase() || "";

  if (program === "AWS PreSeed") {
    if (sector.includes("tech") && stage.includes("early")) return "Eligible";
    return "Not Eligible";
  }

  if (program === "FFG Basisprogramm") {
    if (sector.includes("r&d") || sector.includes("innovation")) return "Eligible";
    return "Not Eligible";
  }

  if (program === "WKO Gründerfonds") {
    if (location.includes("austria") && stage.includes("sme")) return "Eligible";
    return "Not Eligible";
  }

  return "Not Eligible";
}

export default function Eligibility() { return null }

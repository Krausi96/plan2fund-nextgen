// Client-side recommendation engine for static export
import { normalizeAnswers, scorePrograms } from "./recoEngine";
import { scorePrograms as scoreBreakdown } from "./scoring";
import { decisionTreeEngine } from "./decisionTree";

export interface RecommendationResult {
  normalizedAnswers: any;
  recommendations: any[];
  explanations?: any[];
  gaps?: any[];
  fallbackPrograms?: any[];
  hasMatches: boolean;
}

export class ClientRecoEngine {
  static async processRecommendation(
    rawAnswers: any,
    mode: string = "strict",
    useDecisionTree: boolean = true
  ): Promise<RecommendationResult> {
    try {
      if (useDecisionTree) {
        // Use decision tree logic
        const result = await decisionTreeEngine.processDecisionTree(rawAnswers);
        
        return {
          normalizedAnswers: rawAnswers,
          recommendations: result.recommendations,
          explanations: result.explanations,
          gaps: result.gaps,
          fallbackPrograms: result.fallbackPrograms,
          hasMatches: result.recommendations.length > 0
        };
      } else {
        // Use legacy scoring logic
        const normalized = normalizeAnswers(rawAnswers);
        const scored = scorePrograms(normalized, mode as "strict" | "explorer");
        const breakdown = scoreBreakdown({ answers: normalized });
        const whyById = new Map(breakdown.map((b) => [b.id, b]));

        const recommendations = scored
          .map((r) => ({
            ...r,
            why: whyById.get(r.id)?.why || [],
            scores: whyById.get(r.id)?.scores,
          }))
          .sort((a, b) => b.score - a.score);

        return {
          normalizedAnswers: normalized,
          recommendations,
          hasMatches: recommendations.length > 0
        };
      }
    } catch (error) {
      console.error("Error in client recommendation engine:", error);
      throw new Error("Failed to generate recommendations");
    }
  }

  static async processFreeText(description: string): Promise<RecommendationResult> {
    try {
      // Simple free text processing - extract basic signals
      const answers = this.extractSignalsFromText(description);
      return await this.processRecommendation(answers, "explorer", true);
    } catch (error) {
      console.error("Error processing free text:", error);
      throw new Error("Failed to process free text");
    }
  }

  private static extractSignalsFromText(text: string): any {
    const lowerText = text.toLowerCase();
    const answers: any = {};

    // Location signals
    if (lowerText.includes("vienna")) answers.country = "Austria";
    if (lowerText.includes("austria")) answers.country = "Austria";
    if (lowerText.includes("germany")) answers.country = "Germany";
    
    // Sector signals
    if (lowerText.includes("bakery") || lowerText.includes("food")) answers.sector = "Food";
    if (lowerText.includes("tech") || lowerText.includes("software")) answers.sector = "Technology";
    if (lowerText.includes("creative") || lowerText.includes("design")) answers.sector = "Creative";
    
    // Stage signals
    if (lowerText.includes("startup") || lowerText.includes("new")) answers.stage = "Startup";
    if (lowerText.includes("expand") || lowerText.includes("growth")) answers.stage = "Growth";
    
    // Funding type signals
    if (lowerText.includes("loan")) answers.fundingType = "Loan";
    if (lowerText.includes("grant")) answers.fundingType = "Grant";
    if (lowerText.includes("investment")) answers.fundingType = "Investment";
    
    // TRL signals
    if (lowerText.includes("prototype") || lowerText.includes("proof")) answers.trl = "3-4";
    if (lowerText.includes("market") || lowerText.includes("commercial")) answers.trl = "7-9";

    // Amount signals
    const amountMatch = text.match(/(\d+)[kK]?/);
    if (amountMatch) {
      const amount = parseInt(amountMatch[1]);
      if (amount < 10) answers.amount = "0-10k";
      else if (amount < 50) answers.amount = "10-50k";
      else if (amount < 100) answers.amount = "50-100k";
      else if (amount < 500) answers.amount = "100-500k";
      else answers.amount = "500k+";
    }

    return answers;
  }
}

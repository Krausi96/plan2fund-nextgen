import type { NextApiRequest, NextApiResponse } from "next";
import { normalizeAnswers, scorePrograms } from "@/lib/recoEngine";
import { scorePrograms as scoreBreakdown } from "@/lib/scoring";
import { decisionTreeEngine } from "@/lib/decisionTree";
import analytics from "@/lib/analytics";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const rawAnswers = req.body?.answers || {};
    const mode = req.body?.mode || "strict";
    const useDecisionTree = req.body?.useDecisionTree !== false; // Default to true
    
    // Track wizard start
    await analytics.trackWizardStart(mode.toUpperCase() as 'STRICT' | 'EXPLORER');

    if (useDecisionTree) {
      // Use decision tree logic
      const result = await decisionTreeEngine.processDecisionTree(rawAnswers);
      
      return res.status(200).json({
        normalizedAnswers: rawAnswers,
        recommendations: result.recommendations,
        explanations: result.explanations,
        gaps: result.gaps,
        fallbackPrograms: result.fallbackPrograms,
        hasMatches: result.recommendations.length > 0
      });
    } else {
      // Use legacy scoring logic
      const normalized = normalizeAnswers(rawAnswers);
      const scored = await scorePrograms(normalized, mode);
      const breakdown = await scoreBreakdown({ answers: normalized });
      const whyById = new Map(breakdown.map((b) => [b.id, b]));

      // Optional: attach simple signals in a header for client-side panels
      try {
        const signals = {
          country: (normalized as any)?.country,
          amount: (normalized as any)?.amount,
          duration: (normalized as any)?.duration,
          teamSize: (normalized as any)?.teamSize,
        }
        res.setHeader("x-pf-signals", encodeURIComponent(JSON.stringify(signals)))
      } catch {}

      const recommendations = scored
        .map((r) => ({
          ...r,
          why: whyById.get(r.id)?.why || [],
          scores: whyById.get(r.id)?.scores,
        }))
        .sort((a, b) => b.score - a.score);

      // Track wizard completion
      await analytics.trackWizardComplete(normalized, recommendations);

      return res.status(200).json({
        normalizedAnswers: normalized,
        recommendations,
      });
    }
  } catch (error: any) {
    console.error("Error in /api/recommend:", error);
    
    // Track error
    await analytics.trackError(error, 'recommendation_api');
    
    return res.status(500).json({ error: "Failed to generate recommendations" });
  }
}

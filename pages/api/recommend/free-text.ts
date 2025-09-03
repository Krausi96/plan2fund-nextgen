import type { NextApiRequest, NextApiResponse } from "next";
import { analyzeFreeText, scorePrograms } from "@/lib/recoEngine";
import { scorePrograms as scoreBreakdown } from "@/lib/scoring";
import { featureFlags } from "@/lib/utils";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    let description: string = req.body?.description || "";
    // Sanitize free text
    description = description.replace(/[\x00-\x08\x0E-\x1F\x7F]/g, "").trim().slice(0, 2000)
    const mode: "strict" | "explorer" = req.body?.mode || "strict";

    if (!description.trim()) {
      return res.status(400).json({ error: "Description is required" });
    }

    // Use analyzeFreeText to normalize, but rescore with chosen mode
    const normalized = featureFlags.AI_ENABLED ? analyzeFreeText(description).normalized : {};
    const scored = scorePrograms(normalized, mode);
    const breakdown = scoreBreakdown({ answers: normalized });
    const whyById = new Map(breakdown.map((b) => [b.id, b]));

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

    return res.status(200).json({
      normalizedAnswers: normalized,
      recommendations,
    });
  } catch (error: any) {
    console.error("Error in /api/recommend/free-text:", error);
    return res.status(500).json({ error: "Failed to process free text recommendation" });
  }
}

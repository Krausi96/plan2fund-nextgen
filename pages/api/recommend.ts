import type { NextApiRequest, NextApiResponse } from "next";
import { normalizeAnswers, scorePrograms } from "@/lib/recoEngine";
import { scorePrograms as scoreBreakdown } from "@/lib/scoring";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const rawAnswers = req.body?.answers || {};
    const mode = req.body?.mode || "strict";
    const normalized = normalizeAnswers(rawAnswers);
    const scored = scorePrograms(normalized, mode);
    const breakdown = scoreBreakdown({ answers: normalized });
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

    return res.status(200).json({
      normalizedAnswers: normalized,
      recommendations,
    });
  } catch (error: any) {
    console.error("Error in /api/recommend:", error);
    return res.status(500).json({ error: "Failed to generate recommendations" });
  }
}

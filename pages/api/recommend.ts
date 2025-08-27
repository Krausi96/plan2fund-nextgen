import type { NextApiRequest, NextApiResponse } from "next";
import { normalizeAnswers, scorePrograms } from "@/lib/recoEngine";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const rawAnswers = req.body?.answers || {};
    const mode = req.body?.mode || "strict";
    const normalized = normalizeAnswers(rawAnswers);
    const scored = scorePrograms(normalized, mode);

    return res.status(200).json({
      normalizedAnswers: normalized,
      recommendations: scored,
    });
  } catch (error: any) {
    console.error("Error in /api/recommend:", error);
    return res.status(500).json({ error: "Failed to generate recommendations" });
  }
}

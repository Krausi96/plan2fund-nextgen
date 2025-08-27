import type { NextApiRequest, NextApiResponse } from "next";
import { analyzeFreeText, scorePrograms } from "@/lib/recoEngine";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const description: string = req.body?.description || "";
    const mode: "strict" | "explorer" = req.body?.mode || "strict";

    if (!description.trim()) {
      return res.status(400).json({ error: "Description is required" });
    }

    // Use analyzeFreeText to normalize, but rescore with chosen mode
    const { normalized } = analyzeFreeText(description);
    const scored = scorePrograms(normalized, mode);

    return res.status(200).json({
      normalizedAnswers: normalized,
      recommendations: scored,
    });
  } catch (error: any) {
    console.error("Error in /api/recommend/free-text:", error);
    return res.status(500).json({ error: "Failed to process free text recommendation" });
  }
}

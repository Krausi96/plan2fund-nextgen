import type { NextApiRequest, NextApiResponse } from "next";
import { scoreProgramsEnhanced } from "@/features/reco/engine/enhancedRecoEngine";
import analytics from "@/shared/lib/analytics";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const rawAnswers = req.body?.answers || {};
    const mode = req.body?.mode || "strict";
    
    console.log('🔍 API Debug: Received answers:', rawAnswers);
    console.log('🔍 API Debug: Mode:', mode);
    
    // Track wizard start
    await analytics.trackWizardStart(mode.toUpperCase() as 'STRICT' | 'EXPLORER');

    console.log('🔍 API Debug: Calling scoreProgramsEnhanced...');
    // Use enhanced scoring engine
    const recommendations = await scoreProgramsEnhanced(rawAnswers, mode);
    console.log('🔍 API Debug: Got recommendations:', recommendations.length);

    // Track wizard completion
    await analytics.trackWizardComplete(rawAnswers, recommendations);

    return res.status(200).json({
      normalizedAnswers: rawAnswers,
      recommendations,
    });
  } catch (error: any) {
    console.error("Error in /api/recommend:", error);
    
    // Track error
    await analytics.trackError(error, 'recommendation_api');
    
    return res.status(500).json({ error: "Failed to generate recommendations" });
  }
}

import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Get git information
    const gitHash = process.env.VERCEL_GIT_COMMIT_SHA || "local-dev";
    const gitBranch = process.env.VERCEL_GIT_COMMIT_REF || "main";
    
    // Get feature flags
    const featureFlags = {
      AI_ENABLED: process.env.AI_ENABLED === "true",
      DYNAMIC_WIZARD: true,
      ENHANCED_SCORING: true,
      NO_MATCH_FALLBACK: true,
      AI_HELPER_GUARDRAILS: true,
      COVERAGE_CHECKER: true,
      SOURCE_REGISTER: true
    };

    // Modules that use Enhanced Data Pipeline
    const programsModules = [
      "features/reco/components/ProgramFinder.tsx",
      "pages/reco.tsx",
      "shared/lib/enhancedRecoEngine.ts",
      "shared/lib/questionEngine.ts",
      "shared/lib/enhancedDataPipeline.ts",
      "shared/lib/dataSource.ts"
    ];

    // Check core system health
    const health = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      git: {
        hash: gitHash,
        branch: gitBranch,
        shortHash: gitHash.substring(0, 7)
      },
      features: featureFlags,
      system: {
        node: process.version,
        platform: process.platform,
        uptime: process.uptime()
      },
      programs: {
        source: "Enhanced Data Pipeline",
        modules: programsModules,
        version: "2025-01-15",
        count: "dynamic"
      },
      endpoints: {
        recommend: "/api/recommend",
        programs: "/api/programs",
        health: "/api/health"
      }
    };

    return res.status(200).json(health);
  } catch (error: any) {
    console.error("Health check error:", error);
    return res.status(500).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
}
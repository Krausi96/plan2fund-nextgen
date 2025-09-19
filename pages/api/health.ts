// Health endpoint
import { NextApiRequest, NextApiResponse } from 'next';
import { sourceRegister } from '@/lib/sourceRegister';
import { coverageChecker } from '@/lib/coverageChecker';
import { aiHelperGuardrails } from '@/lib/aiHelperGuardrails';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const startTime = Date.now();
    
    // Get system status
    const sourceRegisterData = sourceRegister.getRegister();
    const coverageReport = coverageChecker.generateCoverageReport();
    const aiMetrics = aiHelperGuardrails.getMetrics();
    
    const responseTime = Date.now() - startTime;
    
    // Determine overall health
    const isHealthy = 
      sourceRegisterData.stats.stale === 0 &&
      coverageReport.coveragePercentage >= 70 &&
      responseTime < 2500; // P95 ≤ 2.5s

    const health = {
      status: isHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '0.0.3',
      commit: process.env.VERCEL_GIT_COMMIT_SHA || 'unknown',
      environment: process.env.NODE_ENV || 'development',
      responseTime: `${responseTime}ms`,
      components: {
        sourceRegister: {
          status: sourceRegisterData.stats.stale === 0 ? 'healthy' : 'stale',
          total: sourceRegisterData.stats.total,
          active: sourceRegisterData.stats.active,
          stale: sourceRegisterData.stats.stale,
          error: sourceRegisterData.stats.error
        },
        coverage: {
          status: coverageReport.coveragePercentage >= 70 ? 'healthy' : 'low',
          percentage: coverageReport.coveragePercentage,
          totalPrograms: coverageReport.totalPrograms,
          totalFields: coverageReport.totalFields,
          criticalGaps: coverageReport.criticalGaps.length
        },
        aiHelper: {
          status: 'healthy',
          totalRequests: aiMetrics.totalRequests,
          averageConfidence: aiMetrics.averageConfidence
        },
        performance: {
          status: responseTime < 2500 ? 'healthy' : 'slow',
          responseTime: `${responseTime}ms`,
          threshold: '2500ms'
        }
      },
      flags: {
        dynamicWizard: true,
        coverageValidation: true,
        aiHelperGuardrails: true,
        sourceRegister: true
      }
    };

    const statusCode = isHealthy ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

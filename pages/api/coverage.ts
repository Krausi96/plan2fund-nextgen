// Coverage API endpoint
import { NextApiRequest, NextApiResponse } from 'next';
import { coverageChecker } from '../../legacy/_quarantine/coverageChecker';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const report = coverageChecker.generateCoverageReport();
    const validation = coverageChecker.validateCoverage();
    const table = coverageChecker.generateCoverageTable();

    res.status(200).json({
      success: true,
      report,
      validation,
      table,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Coverage check error:', error);
    res.status(500).json({ 
      error: 'Failed to generate coverage report',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

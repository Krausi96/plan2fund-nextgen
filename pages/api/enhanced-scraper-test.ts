// Enhanced Scraper Test - Full Scraping
import { NextApiRequest, NextApiResponse } from 'next';
import { EnhancedWebScraperService } from '../../src/lib/enhancedWebScraperService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔄 Running enhanced scraper test (full)...');
    
    // Initialize the ENHANCED web scraper service with real eligibility extraction
    const scraperService = new EnhancedWebScraperService();
    
    // Run the actual scraper to get fresh data with real eligibility criteria
    const programs = await scraperService.scrapeAllProgramsWithLearning();
    
    console.log(`✅ Enhanced scraper test completed: ${programs.length} programs`);
    
    return res.status(200).json({
      success: true,
      totalPrograms: programs.length,
      programs: programs,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Enhanced scraper test error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

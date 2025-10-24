// Enhanced Scraper Test - Full Scraping
import { NextApiRequest, NextApiResponse } from 'next';
import { WebScraperService } from '../../src/lib/webScraperService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔄 Running enhanced scraper test (full)...');
    
    // Initialize the ORIGINAL web scraper service with your keywords
    const scraperService = new WebScraperService();
    
    // Run the actual scraper to get fresh data with your configured keywords
    const programs = await scraperService.scrapeAllPrograms();
    
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

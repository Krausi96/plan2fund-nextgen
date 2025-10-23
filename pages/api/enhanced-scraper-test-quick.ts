// Enhanced Scraper Test - Quick Scraping
import { NextApiRequest, NextApiResponse } from 'next';
import { WebScraperService } from '../../src/lib/webScraperService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔄 Running enhanced scraper test (quick)...');
    
    // Initialize the real web scraper service
    const scraperService = new WebScraperService();
    
    // Run the actual scraper to get fresh data
    const programs = await scraperService.scrapeAllPrograms();
    
    console.log(`✅ Enhanced scraper test (quick) completed: ${programs.length} programs`);
    
    return res.status(200).json({
      success: true,
      totalPrograms: programs.length,
      programs: programs,
      timestamp: new Date().toISOString(),
      mode: 'quick'
    });
  } catch (error) {
    console.error('❌ Enhanced scraper test (quick) error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

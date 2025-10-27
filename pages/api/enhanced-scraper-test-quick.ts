// Scraper Endpoint - Single endpoint for scraping
import { NextApiRequest, NextApiResponse } from 'next';
import { WebScraperService } from '../../src/lib/webScraperService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔄 Running scraper...');
    
    const scraperService = new WebScraperService();
    const programs = await scraperService.scrapeAllPrograms();
    
    console.log(`✅ Scraper completed: ${programs.length} programs`);
    
    return res.status(200).json({
      success: true,
      totalPrograms: programs.length,
      programs: programs,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Scraper error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

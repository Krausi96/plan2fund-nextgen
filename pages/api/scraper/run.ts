// Web Scraper API Endpoint - Phase 2 Step 1
import { NextApiRequest, NextApiResponse } from 'next';
import { WebScraperService } from '../../../src/lib/webScraper';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST to run scraper.' });
  }

  try {
    const { source } = req.body;
    
    // Initialize scraper
    const scraper = new WebScraperService();
    await scraper.init();

    let programs = [];

    if (source) {
      // Scrape specific source
      switch (source.toLowerCase()) {
        case 'aws':
          programs = await scraper.scrapeAustrianPrograms();
          break;
        case 'ffg':
          programs = await scraper.scrapeAustrianPrograms();
          break;
        case 'all':
          programs = await scraper.scrapeAllPrograms();
          break;
        default:
          return res.status(400).json({ 
            error: 'Invalid source. Use: aws, ffg, or all',
            availableSources: ['aws', 'ffg', 'all']
          });
      }
    } else {
      // Scrape all programs by default
      programs = await scraper.scrapeAllPrograms();
    }

    // Close browser
    await scraper.close();

    return res.status(200).json({
      success: true,
      data: programs,
      count: programs.length,
      message: `Successfully scraped ${programs.length} programs from ${source || 'all sources'}`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Scraper API Error:', error);
    return res.status(500).json({
      error: 'Scraper failed',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: new Date().toISOString()
    });
  }
}
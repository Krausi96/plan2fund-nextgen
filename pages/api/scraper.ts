import { NextApiRequest, NextApiResponse } from 'next';
import { WebScraperService } from '../../src/lib/webScraperService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST to trigger scraping.' });
  }

  try {
    const { cycleOnly } = req.body;
    
    console.log(`🚀 Starting scraper (cycleOnly: ${cycleOnly || false})...`);
    console.log(`📊 Request body:`, req.body);
    
    const scraper = new WebScraperService();
    console.log(`📊 Scraper instance created`);
    
    const programs = await scraper.scrapeAllPrograms(cycleOnly);
    console.log(`✅ Scraped ${programs.length} programs with 18 categories`);

    return res.status(200).json({
      success: true,
      message: 'Scraping completed successfully',
      totalPrograms: programs.length,
      categoriesExtracted: 18,
      programs: programs.slice(0, 3), // Return first 3 as sample
    });
  } catch (error) {
    console.error('❌ Scraper error:', error);
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
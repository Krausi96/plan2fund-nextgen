import { NextApiRequest, NextApiResponse } from 'next';
import { WebScraperService } from '../../../src/lib/webScraper';
import { DatabaseService } from '../../../src/lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const scraper = new WebScraperService();
  const db = new DatabaseService();
  
  try {
    console.log('Starting scraper...');
    
    // Test database connection
    const dbConnected = await db.testConnection();
    if (!dbConnected) {
      throw new Error('Database connection failed');
    }
    
    // Initialize scraper
    await scraper.init();
    console.log('Scraper initialized');
    
    // Scrape all programs
    const programs = await scraper.scrapeAllPrograms();
    console.log(`Scraped ${programs.length} programs`);
    
    // Save to database
    await db.savePrograms(programs);
    console.log('Programs saved to database');
    
    // Get final count
    const totalPrograms = await db.getProgramCount();
    
    res.json({ 
      success: true, 
      programsScraped: programs.length,
      totalPrograms,
      timestamp: new Date().toISOString(),
      programs: programs.map(p => ({
        id: p.id,
        name: p.name,
        program_type: p.program_type,
        funding_amount_min: p.funding_amount_min,
        funding_amount_max: p.funding_amount_max
      }))
    });
  } catch (error) {
    console.error('Scraper error:', error);
    res.status(500).json({ 
      error: 'Scraping failed', 
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  } finally {
    await scraper.close();
    await db.close();
  }
}

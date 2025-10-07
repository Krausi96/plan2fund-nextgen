// Cron Job API Endpoint for Automatic Scraping
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify this is a cron request (optional security)
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && req.headers.authorization !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log('🕐 Cron job triggered - starting automatic scraping...');
    
    // Trigger scraper
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/scraper/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.INTERNAL_API_SECRET || 'internal'}`
      },
      body: JSON.stringify({ action: 'scrape' })
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log(`✅ Cron job completed successfully: ${result.message}`);
      return res.status(200).json({ 
        success: true, 
        message: 'Scraper triggered successfully',
        programsScraped: result.count,
        timestamp: new Date().toISOString()
      });
    } else {
      console.error('❌ Cron job failed:', result.error);
      return res.status(500).json({ 
        success: false, 
        error: 'Scraper failed',
        message: result.message || 'Unknown error'
      });
    }
    
  } catch (error) {
    console.error('❌ Cron job error:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Cron job failed',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
}

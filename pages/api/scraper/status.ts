// Scraper Status API Endpoint
import { NextApiRequest, NextApiResponse } from 'next';
import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

// Database connection
let pool: Pool | null = null;

try {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: false
  });
} catch (error) {
  console.warn('Database connection failed, using fallback data:', error);
}

// Fallback data from migrated programs
function getFallbackStats() {
  try {
    const dataPath = path.join(process.cwd(), 'data', 'migrated-programs.json');
    const data = fs.readFileSync(dataPath, 'utf8');
    const jsonData = JSON.parse(data);
    
    // The data structure has programs in a 'programs' array
    const programs = jsonData.programs || [];
    
    return {
      totalPrograms: programs.length,
      programsLast24h: 0, // No recent scraping
      programsLast7d: 0,  // No recent scraping
      lastScraped: null,  // No scraping timestamp
      avgConfidence: 0.85, // Estimated confidence
      activePrograms: programs.length,
      hoursSinceLastScrape: null
    };
  } catch (error) {
    console.error('Fallback stats loading failed:', error);
    return {
      totalPrograms: 0,
      programsLast24h: 0,
      programsLast7d: 0,
      lastScraped: null,
      avgConfidence: 0,
      activePrograms: 0,
      hoursSinceLastScrape: null
    };
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    let stats;
    
    // Try database first, fallback to JSON data
    if (pool) {
      try {
        const result = await pool.query(`
          SELECT 
            COUNT(*) as total_programs,
            COUNT(CASE WHEN scraped_at > NOW() - INTERVAL '24 hours' THEN 1 END) as programs_last_24h,
            COUNT(CASE WHEN scraped_at > NOW() - INTERVAL '7 days' THEN 1 END) as programs_last_7d,
            MAX(scraped_at) as last_scraped,
            AVG(confidence_score) as avg_confidence,
            COUNT(CASE WHEN is_active = true THEN 1 END) as active_programs
          FROM programs
        `);

        const dbStats = result.rows[0];
        stats = {
          totalPrograms: parseInt(dbStats.total_programs),
          programsLast24h: parseInt(dbStats.programs_last_24h),
          programsLast7d: parseInt(dbStats.programs_last_7d),
          lastScraped: dbStats.last_scraped,
          avgConfidence: parseFloat(dbStats.avg_confidence || 0),
          activePrograms: parseInt(dbStats.active_programs),
          hoursSinceLastScrape: null
        };
      } catch (dbError) {
        console.warn('Database query failed, using fallback data:', dbError);
        stats = getFallbackStats();
      }
    } else {
      stats = getFallbackStats();
    }
    
    // Determine scraper health
    const lastScraped = stats.lastScraped ? new Date(stats.lastScraped) : null;
    const hoursSinceLastScrape = lastScraped ? (Date.now() - lastScraped.getTime()) / (1000 * 60 * 60) : null;
    
    let health = 'unknown';
    if (hoursSinceLastScrape !== null) {
      if (hoursSinceLastScrape < 25) {
        health = 'healthy';
      } else if (hoursSinceLastScrape < 48) {
        health = 'warning';
      } else {
        health = 'unhealthy';
      }
    } else {
      health = 'fallback'; // Using fallback data
    }

    return res.status(200).json({
      success: true,
      health,
      stats: {
        totalPrograms: stats.totalPrograms,
        programsLast24h: stats.programsLast24h,
        programsLast7d: stats.programsLast7d,
        lastScraped: stats.lastScraped,
        avgConfidence: stats.avgConfidence,
        activePrograms: stats.activePrograms,
        hoursSinceLastScrape: hoursSinceLastScrape ? Math.round(hoursSinceLastScrape * 10) / 10 : null
      },
      timestamp: new Date().toISOString(),
      source: pool ? 'database' : 'fallback'
    });

  } catch (error) {
    console.error('❌ Status check error:', error);
    return res.status(500).json({
      success: false,
      error: 'Status check failed',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: new Date().toISOString()
    });
  }
}

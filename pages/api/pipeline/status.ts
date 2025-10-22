// Pipeline Status API - Simple monitoring for data pipeline layers
import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const dataDir = path.join(process.cwd(), 'data');
    const status = {
      timestamp: new Date().toISOString(),
      layers: {
        scraper: {
          status: 'unknown',
          lastRun: null as string | null,
          programsCount: 0,
          errors: [] as string[]
        },
        pipeline: {
          status: 'unknown', 
          lastProcessed: null as string | null,
          programsCount: 0,
          categoriesApplied: 0,
          qualityScore: 0,
          errors: [] as string[]
        },
        api: {
          status: 'unknown',
          lastResponse: null as string | null,
          responseTime: 0,
          errors: [] as string[]
        }
      },
      health: 'unknown'
    };

    // Check Scraper Layer
    try {
      const latestFile = path.join(dataDir, 'scraped-programs-latest.json');
      if (fs.existsSync(latestFile)) {
        const stats = fs.statSync(latestFile);
        const data = JSON.parse(fs.readFileSync(latestFile, 'utf-8'));
        
        status.layers.scraper = {
          status: 'healthy',
          lastRun: stats.mtime.toISOString(),
          programsCount: data.programs?.length || 0,
          errors: []
        };
      } else {
        status.layers.scraper.status = 'no_data';
        status.layers.scraper.errors.push('No scraped data found');
      }
    } catch (error) {
      status.layers.scraper.status = 'error';
      status.layers.scraper.errors.push(error instanceof Error ? error.message : 'Unknown error');
    }

    // Check Pipeline Layer
    try {
      const cacheFile = path.join(dataDir, 'pipeline-cache.json');
      if (fs.existsSync(cacheFile)) {
        const stats = fs.statSync(cacheFile);
        const data = JSON.parse(fs.readFileSync(cacheFile, 'utf-8'));
        
        status.layers.pipeline = {
          status: 'healthy',
          lastProcessed: stats.mtime.toISOString(),
          programsCount: data.length || 0,
          categoriesApplied: 18, // Core 18 categories
          qualityScore: data.length > 0 ? 
            (data.reduce((sum: number, p: any) => sum + (p.quality_score || 0), 0) / data.length) : 0,
          errors: []
        };
      } else {
        status.layers.pipeline.status = 'no_cache';
        status.layers.pipeline.errors = ['Pipeline cache not found'];
      }
    } catch (error) {
      status.layers.pipeline.status = 'error';
      status.layers.pipeline.errors.push(error instanceof Error ? error.message : 'Unknown error');
    }

    // Check API Layer (test response)
    try {
      const startTime = Date.now();
      const baseUrl = process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}` 
        : 'http://localhost:3000';
      
      const response = await fetch(`${baseUrl}/api/programs?enhanced=true&source=pipeline`, {
        headers: { 'Cache-Control': 'no-cache' }
      });
      
      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        await response.json();
        status.layers.api = {
          status: 'healthy',
          lastResponse: new Date().toISOString(),
          responseTime,
          errors: []
        };
      } else {
        status.layers.api.status = 'error';
        status.layers.api.errors = [`HTTP ${response.status}`];
      }
    } catch (error) {
      status.layers.api.status = 'error';
      status.layers.api.errors.push(error instanceof Error ? error.message : 'Unknown error');
    }

    // Overall Health
    const allHealthy = Object.values(status.layers).every(layer => layer.status === 'healthy');
    const hasErrors = Object.values(status.layers).some(layer => layer.errors && layer.errors.length > 0);
    
    status.health = allHealthy ? 'healthy' : hasErrors ? 'degraded' : 'unknown';

    // Add notifications
    const notifications = [];
    
    if (status.layers.scraper.status === 'no_data') {
      notifications.push({
        level: 'warning',
        message: 'No scraped data available - run scraper',
        layer: 'scraper'
      });
    }
    
    if (status.layers.pipeline.status === 'no_cache') {
      notifications.push({
        level: 'warning', 
        message: 'Pipeline cache missing - will auto-populate on next request',
        layer: 'pipeline'
      });
    }
    
    if (status.layers.api.responseTime > 5000) {
      notifications.push({
        level: 'warning',
        message: `API response slow: ${status.layers.api.responseTime}ms`,
        layer: 'api'
      });
    }

    if (status.layers.scraper.programsCount === 0) {
      notifications.push({
        level: 'error',
        message: 'No programs found in scraped data',
        layer: 'scraper'
      });
    }

    res.status(200).json({
      ...status,
      notifications,
      summary: {
        totalPrograms: status.layers.scraper.programsCount,
        processedPrograms: status.layers.pipeline.programsCount,
        apiResponseTime: status.layers.api.responseTime,
        overallHealth: status.health
      }
    });

  } catch (error) {
    res.status(500).json({
      error: 'Failed to get pipeline status',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
}

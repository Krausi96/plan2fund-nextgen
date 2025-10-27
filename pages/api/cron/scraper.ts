// Background Scraper Cron - Step 1.4
import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

// Helper function to send notifications
async function sendNotification(level: 'info' | 'warning' | 'error' | 'success', message: string, layer: 'scraper' | 'pipeline' | 'api' | 'system', data?: any) {
  try {
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000';
    
    await fetch(`${baseUrl}/api/notifications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ level, message, layer, data })
    });
  } catch (error) {
    console.warn('Failed to send notification:', error);
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { mode = 'quick', auth } = req.body;
  
  // Simple auth check (use environment variable in production)
  // For development, allow test-key or environment variable
  const validAuth = process.env.CRON_AUTH_KEY || 'test-key';
  if (auth !== validAuth) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const lockFile = path.join(process.cwd(), 'data', '.scraper.lock');
  const results = {
    success: false,
    mode,
    startTime: new Date().toISOString(),
    endTime: null as string | null,
    duration: 0,
    scraper: { success: false, programs: 0, errors: [] as string[] },
    pipeline: { success: false, programs: 0, errors: [] as string[] },
    notifications: [] as Array<{ level: string; message: string }>
  };

  try {
    // Check for existing lock
    if (fs.existsSync(lockFile)) {
      const lockData = JSON.parse(fs.readFileSync(lockFile, 'utf-8'));
      const lockAge = Date.now() - new Date(lockData.timestamp).getTime();
      
      if (lockAge < 30 * 60 * 1000) { // 30 minutes
        return res.status(409).json({
          error: 'Scraper already running',
          lockAge: Math.round(lockAge / 1000) + 's',
          ...results
        });
      } else {
        // Remove stale lock
        fs.unlinkSync(lockFile);
      }
    }

    // Create lock file
    fs.writeFileSync(lockFile, JSON.stringify({
      timestamp: new Date().toISOString(),
      mode,
      pid: process.pid
    }));

    console.log(`🔄 Starting ${mode} scraper cron job...`);

    // Send start notification
    await sendNotification('info', `Starting ${mode} scraper cron job`, 'system');

    // Step 1: Run Scraper
    try {
      const baseUrl = process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}` 
        : 'http://localhost:3000';
      
      const scraperUrl = `${baseUrl}/api/enhanced-scraper-test-quick`;
      
      console.log(`🔄 Running ${mode} scraper...`);
      const scraperResponse = await fetch(scraperUrl, {
        headers: { 'Cache-Control': 'no-cache' }
      });
      
      if (scraperResponse.ok) {
        const scraperData = await scraperResponse.json();
        results.scraper = {
          success: true,
          programs: scraperData.totalPrograms || 0,
          errors: []
        };
        console.log(`✅ Scraper completed: ${results.scraper.programs} programs`);
        
        // Send success notification
        await sendNotification('success', `Scraper completed: ${results.scraper.programs} programs found`, 'scraper', {
          programs: results.scraper.programs,
          mode
        });
      } else {
        throw new Error(`Scraper failed: ${scraperResponse.status}`);
      }
    } catch (error) {
      results.scraper.errors.push(error instanceof Error ? error.message : 'Unknown error');
      console.error('Scraper error:', error);
      
      // Send error notification
      await sendNotification('error', `Scraper failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'scraper', {
        mode,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Step 2: Warm up Pipeline
    try {
      const baseUrl = process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}` 
        : 'http://localhost:3000';
      
      console.log('🔄 Warming up pipeline...');
      const pipelineResponse = await fetch(`${baseUrl}/api/programs?enhanced=true&source=pipeline`, {
        headers: { 'Cache-Control': 'no-cache' }
      });
      
      if (pipelineResponse.ok) {
        const pipelineData = await pipelineResponse.json();
        results.pipeline = {
          success: true,
          programs: pipelineData.programs?.length || 0,
          errors: []
        };
        console.log(`✅ Pipeline warmed up: ${results.pipeline.programs} programs`);
        
        // Send success notification
        await sendNotification('success', `Pipeline warmed up: ${results.pipeline.programs} programs processed`, 'pipeline', {
          programs: results.pipeline.programs
        });
      } else {
        throw new Error(`Pipeline failed: ${pipelineResponse.status}`);
      }
    } catch (error) {
      results.pipeline.errors.push(error instanceof Error ? error.message : 'Unknown error');
      console.error('Pipeline error:', error);
      
      // Send error notification
      await sendNotification('error', `Pipeline failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'pipeline', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Step 3: Clean up old data (keep last 7 days)
    try {
      const dataDir = path.join(process.cwd(), 'data');
      const files = fs.readdirSync(dataDir)
        .filter(f => /^scraped-programs-\d{4}-\d{2}-\d{2}\.json$/.test(f))
        .sort()
        .reverse();
      
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 7);
      
      let deletedCount = 0;
      for (const file of files.slice(7)) { // Keep 7 most recent
        const filePath = path.join(dataDir, file);
        const stats = fs.statSync(filePath);
        if (stats.mtime < cutoffDate) {
          fs.unlinkSync(filePath);
          deletedCount++;
        }
      }
      
      if (deletedCount > 0) {
        results.notifications.push({
          level: 'info',
          message: `Cleaned up ${deletedCount} old data files`
        });
      }
    } catch (error) {
      console.warn('Cleanup error:', error);
    }

    // Determine overall success
    results.success = results.scraper.success && results.pipeline.success;
    
    if (results.scraper.success && results.scraper.programs === 0) {
      results.notifications.push({
        level: 'warning',
        message: 'Scraper completed but found 0 programs'
      });
    }

    if (results.pipeline.success && results.pipeline.programs === 0) {
      results.notifications.push({
        level: 'warning', 
        message: 'Pipeline completed but processed 0 programs'
      });
    }

    results.endTime = new Date().toISOString();
    results.duration = new Date(results.endTime).getTime() - new Date(results.startTime).getTime();

    console.log(`✅ Cron job completed in ${Math.round(results.duration / 1000)}s`);
    
    // Send completion notification
    await sendNotification(
      results.success ? 'success' : 'warning',
      `Cron job completed in ${Math.round(results.duration / 1000)}s: ${results.scraper.programs} scraped, ${results.pipeline.programs} processed`,
      'system',
      {
        duration: results.duration,
        scraperPrograms: results.scraper.programs,
        pipelinePrograms: results.pipeline.programs,
        success: results.success,
        mode
      }
    );

  } catch (error) {
    results.endTime = new Date().toISOString();
    results.duration = new Date(results.endTime).getTime() - new Date(results.startTime).getTime();
    console.error('Cron job error:', error);
  } finally {
    // Remove lock file
    if (fs.existsSync(lockFile)) {
      fs.unlinkSync(lockFile);
    }
  }

  res.status(results.success ? 200 : 500).json(results);
}

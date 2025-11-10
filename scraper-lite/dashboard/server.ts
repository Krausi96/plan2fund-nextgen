/**
 * Dashboard Server - Simple Express API
 * Provides metrics and stats for the scraper
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import express from 'express';
import cors from 'cors';

// Load env
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath, override: false });
}
dotenv.config({ override: false });

import { getPool } from '../db/db';
import { getLearningStatus } from '../src/learning/auto-learning';

const app = express();
const PORT = process.env.DASHBOARD_PORT || 3001;

app.use(cors());
app.use(express.json());

// Serve static files (dashboard HTML)
const clientPath = path.join(__dirname, 'client');
app.use(express.static(clientPath));

// Serve index.html for root
app.get('/', (req, res) => {
  res.sendFile(path.join(clientPath, 'index.html'));
});

// ============================================================================
// API ENDPOINTS
// ============================================================================

// Overview stats
app.get('/api/stats/overview', async (req, res) => {
  try {
    const pool = getPool();
    
    // Discovery stats
    const discoveredSeeds = await pool.query(`
      SELECT COUNT(*) as total, 
             COUNT(*) FILTER (WHERE source_type = 'overview_page') as overview,
             COUNT(*) FILTER (WHERE source_type = 'listing_page') as listing
      FROM discovered_seed_urls
      WHERE is_active = true
    `);
    
    const queueStats = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'queued') as queued,
        COUNT(*) FILTER (WHERE status = 'processing') as processing,
        COUNT(*) FILTER (WHERE status = 'failed') as failed
      FROM scraping_jobs
    `);
    
    // Scraping stats
    const scrapingStats = await pool.query(`
      SELECT 
        COUNT(*) as total_pages,
        COUNT(*) FILTER (WHERE array_length(requirements, 1) >= 5) as good_pages,
        AVG(array_length(requirements, 1)) as avg_requirements,
        COUNT(*) FILTER (WHERE fetched_at > NOW() - INTERVAL '24 hours') as scraped_today
      FROM pages
      WHERE funding_types IS NOT NULL
    `);
    
    // Learning stats
    const learningStatus = await getLearningStatus();
    
    res.json({
      discovery: {
        totalSeeds: parseInt(discoveredSeeds.rows[0]?.total || '0'),
        overviewSeeds: parseInt(discoveredSeeds.rows[0]?.overview || '0'),
        listingSeeds: parseInt(discoveredSeeds.rows[0]?.listing || '0'),
        urlsQueued: parseInt(queueStats.rows[0]?.queued || '0'),
        urlsProcessing: parseInt(queueStats.rows[0]?.processing || '0'),
        urlsFailed: parseInt(queueStats.rows[0]?.failed || '0')
      },
      scraping: {
        totalPages: parseInt(scrapingStats.rows[0]?.total_pages || '0'),
        goodPages: parseInt(scrapingStats.rows[0]?.good_pages || '0'),
        avgRequirements: parseFloat(scrapingStats.rows[0]?.avg_requirements || '0').toFixed(1),
        scrapedToday: parseInt(scrapingStats.rows[0]?.scraped_today || '0')
      },
      learning: {
        accuracy: learningStatus.classificationAccuracy,
        qualityRules: learningStatus.qualityRulesLearned,
        requirementPatterns: learningStatus.urlPatternsLearned,
        urlPatterns: learningStatus.urlPatternsLearned,
        totalFeedback: learningStatus.totalFeedback
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Discovery sources
app.get('/api/discovery/sources', async (req, res) => {
  try {
    const pool = getPool();
    const sources = await pool.query(`
      SELECT 
        source_type,
        COUNT(*) as count,
        COUNT(*) FILTER (WHERE last_checked IS NOT NULL) as checked
      FROM discovered_seed_urls
      WHERE is_active = true
      GROUP BY source_type
      ORDER BY count DESC
    `);
    
    res.json(sources.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Recent issues
app.get('/api/issues/recent', async (req, res) => {
  try {
    const pool = getPool();
    
    // 404 errors
    const errors404 = await pool.query(`
      SELECT COUNT(*) as count
      FROM scraping_jobs
      WHERE last_error LIKE '%404%'
        AND updated_at > NOW() - INTERVAL '7 days'
    `);
    
    // Login required
    const loginRequired = await pool.query(`
      SELECT COUNT(*) as count
      FROM scraping_jobs
      WHERE last_error LIKE '%login%' OR last_error LIKE '%403%'
        AND updated_at > NOW() - INTERVAL '7 days'
    `);
    
    // Low quality pages
    const lowQuality = await pool.query(`
      SELECT COUNT(*) as count
      FROM pages
      WHERE array_length(requirements, 1) < 5
        AND fetched_at > NOW() - INTERVAL '7 days'
    `);
    
    res.json([
      { type: '404', count: parseInt(errors404.rows[0]?.count || '0') },
      { type: 'login_required', count: parseInt(loginRequired.rows[0]?.count || '0') },
      { type: 'low_quality', count: parseInt(lowQuality.rows[0]?.count || '0') }
    ]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Funding types distribution
app.get('/api/data/funding-types', async (req, res) => {
  try {
    const pool = getPool();
    const distribution = await pool.query(`
      SELECT 
        unnest(funding_types) as funding_type,
        COUNT(*) as count
      FROM pages
      WHERE funding_types IS NOT NULL
      GROUP BY unnest(funding_types)
      ORDER BY count DESC
    `);
    
    res.json(distribution.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`📊 Dashboard server running on http://localhost:${PORT}`);
  console.log(`   Open http://localhost:${PORT} in your browser`);
});


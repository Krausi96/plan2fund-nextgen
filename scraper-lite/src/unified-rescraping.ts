/**
 * Unified Re-Scraping System
 * Handles re-scraping of overview pages, blacklisted URLs, and manually flagged pages
 */

import { getPool } from '../db/db';

export interface ReScrapeTask {
  url: string;
  type: 'overview' | 'blacklist' | 'manual';
  priority: number; // Higher = more important
  lastChecked: Date | null;
  reason: string;
  metadata?: Record<string, any>;
}

/**
 * Get all re-scrape tasks (overview pages, blacklisted URLs, etc.)
 */
export async function getReScrapeTasks(
  overviewDays: number = 7,
  blacklistDays: number = 30,
  maxTasks: number = 50
): Promise<ReScrapeTask[]> {
  const pool = getPool();
  const tasks: ReScrapeTask[] = [];
  
  // 1. Overview pages older than N days
  const overviewPages = await pool.query(`
    SELECT url, fetched_at, metadata_json
    FROM pages
    WHERE metadata_json->>'is_overview_page' = 'true'
      AND (fetched_at IS NULL OR fetched_at < NOW() - INTERVAL '${overviewDays} days')
    ORDER BY fetched_at ASC NULLS FIRST
    LIMIT $1
  `, [Math.floor(maxTasks * 0.6)]); // 60% for overview pages
  
  overviewPages.rows.forEach((row: any) => {
    tasks.push({
      url: row.url,
      type: 'overview',
      priority: 8, // High priority - overview pages discover new programs
      lastChecked: row.fetched_at ? new Date(row.fetched_at) : null,
      reason: `Overview page not checked in ${overviewDays} days`,
      metadata: row.metadata_json
    });
  });
  
  // 2. Blacklisted URLs with low confidence (older than N days)
  const blacklistedUrls = await pool.query(`
    SELECT DISTINCT learned_from_url as url, confidence, usage_count
    FROM url_patterns
    WHERE pattern_type = 'exclude'
      AND confidence < 0.8
      AND confidence > 0.5
    ORDER BY confidence ASC, usage_count ASC
    LIMIT $1
  `, [Math.floor(maxTasks * 0.3)]); // 30% for blacklisted URLs
  
  blacklistedUrls.rows.forEach((row: any) => {
    tasks.push({
      url: row.url,
      type: 'blacklist',
      priority: 5, // Medium priority - might be false positives
      lastChecked: null, // We don't track last check for blacklisted URLs
      reason: `Low confidence exclusion (${(row.confidence * 100).toFixed(0)}%) - might be false positive`,
      metadata: { confidence: row.confidence, usage_count: row.usage_count }
    });
  });
  
  // 3. Manually flagged pages (future: add manual flagging)
  // For now, this is empty but structure is ready
  
  // Sort by priority (highest first), then by lastChecked (oldest first)
  tasks.sort((a, b) => {
    if (a.priority !== b.priority) {
      return b.priority - a.priority; // Higher priority first
    }
    // If same priority, oldest first
    if (!a.lastChecked && !b.lastChecked) return 0;
    if (!a.lastChecked) return -1;
    if (!b.lastChecked) return 1;
    return a.lastChecked.getTime() - b.lastChecked.getTime();
  });
  
  return tasks.slice(0, maxTasks);
}

/**
 * Mark a re-scrape task as completed
 */
export async function markReScrapeCompleted(
  url: string,
  type: 'overview' | 'blacklist' | 'manual',
  success: boolean
): Promise<void> {
  const pool = getPool();
  
  if (type === 'overview') {
    // Update fetched_at for overview pages
    await pool.query(
      `UPDATE pages SET fetched_at = NOW() WHERE url = $1`,
      [url]
    );
  } else if (type === 'blacklist') {
    // Update confidence for blacklisted URLs
    // This is handled by the blacklist re-check system
    // Just log for now
  }
}

/**
 * Get statistics about re-scrape tasks
 */
export async function getReScrapeStats(): Promise<{
  overview: number;
  blacklist: number;
  manual: number;
  total: number;
}> {
  const tasks = await getReScrapeTasks();
  
  return {
    overview: tasks.filter(t => t.type === 'overview').length,
    blacklist: tasks.filter(t => t.type === 'blacklist').length,
    manual: tasks.filter(t => t.type === 'manual').length,
    total: tasks.length
  };
}


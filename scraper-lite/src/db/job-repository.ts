/**
 * Job Repository
 * Database operations for scraping jobs queue
 */
import { getPool, queryWithRetry } from './neon-client';

export interface DbJob {
  id: number;
  url: string;
  status: 'queued' | 'running' | 'done' | 'failed';
  depth: number;
  seed_url: string | null;
  attempts: number;
  max_attempts: number;
  last_error: string | null;
  last_fetched_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export async function saveJob(job: {
  url: string;
  status?: string;
  depth?: number;
  seed?: string;
  attempts?: number;
  lastError?: string;
}): Promise<number> {
  const pool = getPool();
  
  const result = await queryWithRetry<{ id: number }>(
    `INSERT INTO scraping_jobs (url, status, depth, seed_url, attempts, last_error)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (url)
     DO UPDATE SET
       status = EXCLUDED.status,
       depth = EXCLUDED.depth,
       seed_url = EXCLUDED.seed_url,
       attempts = EXCLUDED.attempts,
       last_error = EXCLUDED.last_error,
       updated_at = NOW()
     RETURNING id`,
    [
      job.url,
      job.status || 'queued',
      job.depth || 1,
      job.seed || null,
      job.attempts || 0,
      job.lastError || null
    ]
  );
  
  return result[0].id;
}

export async function getQueuedJobs(limit = 100): Promise<DbJob[]> {
  return queryWithRetry<DbJob>(
    'SELECT * FROM scraping_jobs WHERE status = $1 ORDER BY created_at ASC LIMIT $2',
    ['queued', limit]
  );
}

export async function updateJobStatus(
  url: string,
  status: string,
  error?: string
): Promise<void> {
  const pool = getPool();
  
  await queryWithRetry(
    `UPDATE scraping_jobs 
     SET status = $1, last_error = $2, last_fetched_at = NOW(), updated_at = NOW(), attempts = attempts + 1
     WHERE url = $3`,
    [status, error || null, url]
  );
}

export async function markJobDone(url: string): Promise<void> {
  await updateJobStatus(url, 'done');
}

export async function markJobFailed(url: string, error: string): Promise<void> {
  await updateJobStatus(url, 'failed', error);
}


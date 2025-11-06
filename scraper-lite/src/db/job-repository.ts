/**
 * Job Repository
 * Manages scraping jobs in database
 */

import { getPool } from './neon-client';

export async function markJobDone(url: string): Promise<void> {
  const pool = getPool();
  await pool.query(
    'UPDATE scraping_jobs SET status = $1, updated_at = NOW() WHERE url = $2',
    ['done', url]
  );
}


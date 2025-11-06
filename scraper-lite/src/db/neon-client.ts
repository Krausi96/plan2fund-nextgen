/**
 * NEON Database Client
 * Connects to NEON Postgres and provides database operations
 */
import { Pool } from 'pg';

// Singleton pool connection
let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set. Set it to your NEON connection string.');
    }
    
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL.includes('neon.tech') ? { rejectUnauthorized: false } : false,
      max: 20, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });
  }
  
  return pool;
}

export async function testConnection(): Promise<boolean> {
  try {
    if (!process.env.DATABASE_URL) {
      return false;
    }
    const pool = getPool();
    
    // CRITICAL FIX: Add timeout to prevent hanging (5 seconds max)
    const queryPromise = pool.query('SELECT NOW() as current_time');
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Connection test timeout after 5s')), 5000)
    );
    
    const result = await Promise.race([queryPromise, timeoutPromise]) as any;
    if (!result || !result.rows || result.rows.length === 0) {
      return false;
    }
    return true;
  } catch (e: any) {
    if (e.message && e.message.includes('timeout')) {
      console.error('Database connection test timeout - database may be slow or unavailable');
    } else {
      console.error('Database connection test failed:', e.message);
    }
    return false;
  }
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

// Helper to execute queries with automatic retry
export async function queryWithRetry<T = any>(
  query: string,
  params?: any[],
  retries = 3
): Promise<T[]> {
  const pool = getPool();
  
  for (let i = 0; i < retries; i++) {
    try {
      const result = await pool.query(query, params);
      return result.rows;
    } catch (e: any) {
      if (i === retries - 1) throw e;
      console.warn(`Query failed, retrying (${i + 1}/${retries}):`, e.message);
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  
  throw new Error('Query failed after retries');
}


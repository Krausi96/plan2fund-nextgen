/**
 * LLM Extraction Cache
 * Caches LLM extraction results to avoid repeated API calls
 * Uses URL hash as cache key
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

interface CachedExtraction {
  urlHash: string;
  result: any;
  modelVersion: string;
  timestamp: number;
  url: string;
}

const CACHE_DIR = path.join(__dirname, '..', 'data', 'lite', 'llm-cache');
const CACHE_FILE = path.join(CACHE_DIR, 'cache.json');
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days
const MODEL_VERSION = process.env.SCRAPER_MODEL_VERSION || 'gpt-4o-mini-v1';

// Ensure cache directory exists
function ensureCacheDir(): void {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
}

// In-memory cache for faster access (avoids disk I/O on every lookup)
let memoryCache: Map<string, CachedExtraction> | null = null;
let cacheLoadTime: number = 0;
const CACHE_RELOAD_INTERVAL = 5 * 60 * 1000; // Reload from disk every 5 minutes

// Load cache from disk
function loadCache(): Map<string, CachedExtraction> {
  // Use in-memory cache if recently loaded
  const now = Date.now();
  if (memoryCache && (now - cacheLoadTime) < CACHE_RELOAD_INTERVAL) {
    return memoryCache;
  }
  
  ensureCacheDir();
  
  if (!fs.existsSync(CACHE_FILE)) {
    memoryCache = new Map();
    cacheLoadTime = now;
    return memoryCache;
  }
  
  try {
    const data = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
    const cache = new Map<string, CachedExtraction>();
    
    // Filter out expired entries
    Object.entries(data).forEach(([key, value]: [string, any]) => {
      if (now - value.timestamp < CACHE_TTL) {
        cache.set(key, value);
      }
    });
    
    memoryCache = cache;
    cacheLoadTime = now;
    return cache;
  } catch (error) {
    console.warn('Failed to load LLM cache:', error);
    memoryCache = new Map();
    cacheLoadTime = now;
    return memoryCache;
  }
}

// Save cache to disk
function saveCache(cache: Map<string, CachedExtraction>): void {
  ensureCacheDir();
  
  try {
    const data: Record<string, CachedExtraction> = {};
    cache.forEach((value, key) => {
      data[key] = value;
    });
    
    fs.writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.warn('Failed to save LLM cache:', error);
  }
}

// Compute URL hash
export function computeUrlHash(url: string): string {
  return crypto.createHash('sha256').update(url).digest('hex');
}

// Get cached extraction
export function getCachedExtraction(
  urlHash: string,
  modelVersion: string = MODEL_VERSION
): any | null {
  const cache = loadCache();
  const key = `${urlHash}:${modelVersion}`;
  const cached = cache.get(key);
  
  if (!cached) {
    return null;
  }
  
  // Check if expired
  const now = Date.now();
  if (now - cached.timestamp > CACHE_TTL) {
    cache.delete(key);
    saveCache(cache);
    return null;
  }
  
  return cached.result;
}

// Store cached extraction
export function storeCachedExtraction(
  urlHash: string,
  result: any,
  modelVersion: string = MODEL_VERSION,
  url?: string
): void {
  const cache = loadCache();
  const key = `${urlHash}:${modelVersion}`;
  
  const entry: CachedExtraction = {
    urlHash,
    result,
    modelVersion,
    timestamp: Date.now(),
    url: url || ''
  };
  
  cache.set(key, entry);
  // Update in-memory cache immediately
  if (memoryCache) {
    memoryCache.set(key, entry);
  }
  
  // Save to disk asynchronously (don't block)
  setImmediate(() => saveCache(cache));
}

// Clear expired entries
export function clearExpiredCache(): void {
  const cache = loadCache();
  const now = Date.now();
  let cleared = 0;
  
  cache.forEach((value, key) => {
    if (now - value.timestamp > CACHE_TTL) {
      cache.delete(key);
      cleared++;
    }
  });
  
  if (cleared > 0) {
    saveCache(cache);
    console.log(`Cleared ${cleared} expired cache entries`);
  }
}

// Get cache stats
export function getCacheStats(): { total: number; size: number } {
  const cache = loadCache();
  const cacheFile = fs.existsSync(CACHE_FILE) ? fs.statSync(CACHE_FILE).size : 0;
  
  return {
    total: cache.size,
    size: cacheFile
  };
}


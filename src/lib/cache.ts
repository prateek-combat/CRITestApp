interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class SimpleCache {
  private cache = new Map<string, CacheEntry<any>>();
  private maxSize = 100; // Maximum cache entries

  set<T>(key: string, data: T, ttlSeconds: number = 300): void {
    // Clear old entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstEntry = this.cache.keys().next();
      if (firstEntry.value) {
        this.cache.delete(firstEntry.value);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlSeconds * 1000,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Helper method to generate cache keys
  generateKey(prefix: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map((key) => `${key}:${params[key]}`)
      .join('|');
    return `${prefix}:${sortedParams}`;
  }

  // Clean expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

// Singleton instance
export const apiCache = new SimpleCache();

// Cleanup expired entries every 5 minutes
setInterval(
  () => {
    apiCache.cleanup();
  },
  5 * 60 * 1000
);

// Cache helper for API routes
export function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number = 300
): Promise<T> {
  const cached = apiCache.get<T>(key);

  if (cached) {
    return Promise.resolve(cached);
  }

  return fetcher().then((data) => {
    apiCache.set(key, data, ttlSeconds);
    return data;
  });
}

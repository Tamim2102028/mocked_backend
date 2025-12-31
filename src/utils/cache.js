/**
 * ====================================
 * SIMPLE IN-MEMORY CACHE
 * ====================================
 *
 * Basic caching system for search results.
 * In production, replace with Redis or similar.
 */

class SimpleCache {
  constructor(defaultTTL = 5 * 60 * 1000) {
    // 5 minutes default
    this.cache = new Map();
    this.defaultTTL = defaultTTL;

    // Clean up expired entries every minute
    setInterval(() => {
      this.cleanup();
    }, 60 * 1000);
  }

  /**
   * Set a cache entry with TTL
   */
  set(key, value, ttl = this.defaultTTL) {
    const expiresAt = Date.now() + ttl;
    this.cache.set(key, {
      value,
      expiresAt,
      createdAt: Date.now(),
    });
  }

  /**
   * Get a cache entry if not expired
   */
  get(key) {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  /**
   * Check if key exists and is not expired
   */
  has(key) {
    return this.get(key) !== null;
  }

  /**
   * Delete a specific key
   */
  delete(key) {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const now = Date.now();
    let expired = 0;
    let active = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        expired++;
      } else {
        active++;
      }
    }

    return {
      total: this.cache.size,
      active,
      expired,
      hitRate: this.hitCount / (this.hitCount + this.missCount) || 0,
    };
  }

  /**
   * Clean up expired entries
   */
  cleanup() {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`🧹 Cache cleanup: removed ${cleaned} expired entries`);
    }
  }

  /**
   * Get or set pattern - useful for search caching
   */
  async getOrSet(key, fetchFunction, ttl = this.defaultTTL) {
    // Try to get from cache first
    const cached = this.get(key);
    if (cached !== null) {
      return cached;
    }

    // Not in cache, fetch the data
    try {
      const data = await fetchFunction();
      this.set(key, data, ttl);
      return data;
    } catch (error) {
      // Don't cache errors
      throw error;
    }
  }
}

// Create a global cache instance for search results
export const searchCache = new SimpleCache(5 * 60 * 1000); // 5 minutes TTL

/**
 * Cache middleware for search endpoints
 */
export const cacheMiddleware = (ttl = 5 * 60 * 1000) => {
  return (req, res, next) => {
    // Generate cache key from request
    const cacheKey = `${req.originalUrl}:${req.user._id}`;

    // Try to get from cache
    const cached = searchCache.get(cacheKey);
    if (cached) {
      console.log(`📦 Cache hit: ${cacheKey}`);
      return res.status(200).json(cached);
    }

    // Store original json method
    const originalJson = res.json;

    // Override json method to cache the response
    res.json = function (data) {
      // Only cache successful responses
      if (res.statusCode === 200) {
        searchCache.set(cacheKey, data, ttl);
        console.log(`💾 Cached: ${cacheKey}`);
      }

      // Call original json method
      return originalJson.call(this, data);
    };

    next();
  };
};

/**
 * Cache invalidation helpers
 */
export const invalidateSearchCache = (pattern) => {
  let invalidated = 0;

  for (const key of searchCache.cache.keys()) {
    if (key.includes(pattern)) {
      searchCache.delete(key);
      invalidated++;
    }
  }

  console.log(
    `🗑️ Invalidated ${invalidated} cache entries matching: ${pattern}`
  );
  return invalidated;
};

/**
 * Cache warming - pre-populate cache with common searches
 */
export const warmSearchCache = async (commonQueries = []) => {
  console.log("🔥 Warming search cache...");

  for (const query of commonQueries) {
    try {
      // This would trigger actual search and cache the results
      console.log(`   Warming cache for: "${query}"`);
      // Implementation would depend on your search service
    } catch (error) {
      console.error(`   Failed to warm cache for "${query}":`, error.message);
    }
  }

  console.log("✅ Cache warming completed");
};

export default SimpleCache;

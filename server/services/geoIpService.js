const Redis = require('ioredis');

class GeoIpService {
  constructor() {
    this.redis = null;
    this.isRedisReady = false;
    this.apiUrl = process.env.IP_LOOKUP_API_URL || 'https://ipstatus.com/api/ip-lookup';

    const redisUrl = process.env.REDIS_URL;
    if (redisUrl) {
      try {
        this.redis = new Redis(redisUrl, {
          maxRetriesPerRequest: 1,
          enableReadyCheck: true,
          lazyConnect: true,
          retryStrategy: (times) => {
            if (times > 3) return null; // stop retrying after 3 attempts
            return Math.min(times * 1000, 3000);
          }
        });

        this.redis.on('connect', () => {
          this.isRedisReady = true;
          console.log('[GeoIpService] Connected to Redis for GeoIP caching.');
        });

        this.redis.on('ready', () => {
          this.isRedisReady = true;
        });

        this.redis.on('error', (err) => {
          this.isRedisReady = false;
          // Silent warning to avoid cluttering logs
          // console.warn('[GeoIpService] Redis connection error (proceeding without cache):', err.message);
        });

        this.redis.on('close', () => {
          this.isRedisReady = false;
        });

        this.redis.connect().catch(() => {
          this.isRedisReady = false;
        });
      } catch (err) {
        this.isRedisReady = false;
      }
    }
  }

  isPrivateIp(ip) {
    if (!ip || typeof ip !== 'string') return true;
    const trimmed = ip.trim();
    if (
      trimmed === '127.0.0.1' ||
      trimmed === '::1' ||
      trimmed === 'localhost' ||
      trimmed === '0.0.0.0' ||
      trimmed.startsWith('10.') ||
      trimmed.startsWith('192.168.') ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(trimmed) ||
      trimmed.startsWith('fc00:') ||
      trimmed.startsWith('fe80:')
    ) {
      return true;
    }
    return false;
  }

  async lookupIp(ip) {
    if (!ip || this.isPrivateIp(ip)) {
      return null;
    }

    const trimmedIp = ip.trim();
    const cacheKey = `geoip:${trimmedIp}`;

    // 1. Check Redis cache if connected
    if (this.redis && this.isRedisReady) {
      try {
        const cached = await this.redis.get(cacheKey);
        if (cached) {
          return JSON.parse(cached);
        }
      } catch (err) {
        // Ignore redis get errors
      }
    }

    // 2. Fetch from external GeoIP API with 3s timeout
    try {
      const url = `${this.apiUrl.replace(/\/$/, '')}?ip=${encodeURIComponent(trimmedIp)}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json'
        }
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        return null;
      }

      const data = await res.json();
      if (!data || typeof data !== 'object') {
        return null;
      }

      // 3. Cache in Redis if connected (24 hours = 86400s)
      if (this.redis && this.isRedisReady) {
        try {
          await this.redis.set(cacheKey, JSON.stringify(data), 'EX', 86400);
        } catch (err) {
          // Ignore redis set errors
        }
      }

      return data;
    } catch (err) {
      // Return null on any error/timeout without throwing
      return null;
    }
  }
}

module.exports = new GeoIpService();

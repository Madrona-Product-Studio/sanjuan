/**
 * Shared utilities for API routes.
 */

// ─── Rate Limiting ──────────────────────────────────────────────────────────
const rateLimitStore = new Map();

const RATE_LIMITS = {
  'places-search': { maxRequests: 60, windowMs: 60 * 60 * 1000 },
  'place-photo':   { maxRequests: 120, windowMs: 60 * 60 * 1000 },
};

export function checkRateLimit(req, res, endpointKey) {
  const config = RATE_LIMITS[endpointKey];
  if (!config) return true;

  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
           || req.headers['x-real-ip']
           || req.socket?.remoteAddress
           || 'unknown';
  const key = `${endpointKey}:${ip}`;
  const now = Date.now();

  let entry = rateLimitStore.get(key);
  if (!entry || now - entry.windowStart > config.windowMs) {
    entry = { windowStart: now, count: 0 };
  }

  entry.count++;
  rateLimitStore.set(key, entry);

  if (rateLimitStore.size > 500) {
    for (const [k, v] of rateLimitStore) {
      if (now - v.windowStart > config.windowMs) rateLimitStore.delete(k);
    }
  }

  if (entry.count > config.maxRequests) {
    const retryAfter = Math.ceil((config.windowMs - (now - entry.windowStart)) / 1000);
    res.setHeader('Retry-After', String(retryAfter));
    res.status(429).json({ error: 'Too many requests. Please try again later.', retryAfter });
    return false;
  }

  return true;
}

// ─── Origin Checking ────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  'https://sjiboating.com',
  'https://www.sjiboating.com',
  'https://sanjuan.vercel.app',
];

if (process.env.NODE_ENV !== 'production' && process.env.VERCEL_ENV !== 'production') {
  ALLOWED_ORIGINS.push('http://localhost:5173', 'http://localhost:3000', 'http://localhost:8080');
}

// Also allow the Vercel preview deployment URLs
export function checkOrigin(req, res) {
  const origin = req.headers.origin || req.headers.referer;

  if (!origin) {
    if (req.method === 'GET') return true;
    res.status(403).json({ error: 'Forbidden' });
    return false;
  }

  const allowed = ALLOWED_ORIGINS.some(ao => origin.startsWith(ao))
    || origin.includes('vercel.app');

  if (!allowed) {
    res.status(403).json({ error: 'Forbidden' });
    return false;
  }

  res.setHeader('Access-Control-Allow-Origin', origin);
  return true;
}

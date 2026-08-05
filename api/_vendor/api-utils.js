/**
 * @madrona/api-utils
 *
 * Shared serverless API utilities for Madrona Product Studio apps.
 *
 * Design: dependency injection. This package holds the logic; each app passes
 * in its own config (rate limits, allowed origins) and its own clients
 * (Supabase, Sentry). That keeps this package zero-dependency — apps that don't
 * use Supabase/Sentry never have to install them.
 *
 * Works with Node-style serverless handlers (Vercel Functions): `req` exposes
 * `headers`, `method`, `socket`; `res` exposes `setHeader`, `status().json()`.
 */

/**
 * Extract the client IP from a request, normalized to the first forwarded hop.
 * @param {any} req
 * @returns {string}
 */
export function getClientIp(req) {
  const xff = req.headers?.['x-forwarded-for'];
  const firstHop = typeof xff === 'string' ? xff.split(',')[0]?.trim() : undefined;
  return (
    firstHop ||
    req.headers?.['x-real-ip'] ||
    req.socket?.remoteAddress ||
    'unknown'
  );
}

/**
 * Create an in-memory, per-instance rate limiter.
 *
 * Vercel keeps instances warm for ~15min, so this catches sustained abuse from
 * a single IP within that window. Resets on cold start — for hard global caps
 * use {@link createDurableLimiter}.
 *
 * @param {Record<string, { maxRequests: number, windowMs: number }>} limits
 *   Map of endpoint key → limit config.
 * @param {{ maxStoreSize?: number }} [options]
 * @returns {(req: any, res: any, endpointKey: string) => boolean}
 *   `checkRateLimit` — returns true if allowed; on block, sets 429 + Retry-After and returns false.
 */
export function createRateLimiter(limits = {}, { maxStoreSize = 500 } = {}) {
  const store = new Map();

  return function checkRateLimit(req, res, endpointKey) {
    const config = limits[endpointKey];
    if (!config) return true; // no limit configured for this endpoint

    const ip = getClientIp(req);
    const key = `${endpointKey}:${ip}`;
    const now = Date.now();

    let entry = store.get(key);
    if (!entry || now - entry.windowStart > config.windowMs) {
      // Store windowMs per entry so cleanup uses each endpoint's own expiry,
      // not whichever endpoint happened to trigger the sweep.
      entry = { windowStart: now, count: 0, windowMs: config.windowMs };
    }
    entry.count++;
    store.set(key, entry);

    // Opportunistic cleanup of expired entries.
    if (store.size > maxStoreSize) {
      for (const [k, v] of store) {
        if (now - v.windowStart > (v.windowMs ?? config.windowMs)) store.delete(k);
      }
    }

    if (entry.count > config.maxRequests) {
      const retryAfter = Math.ceil((config.windowMs - (now - entry.windowStart)) / 1000);
      res.setHeader('Retry-After', String(retryAfter));
      res.status(429).json({ error: 'Too many requests. Please try again later.', retryAfter });
      return false;
    }

    return true;
  };
}

/**
 * Create an origin/CORS checker bound to an allowlist.
 *
 * @param {{
 *   allowedOrigins?: string[],
 *   allowVercelPreview?: boolean,
 *   allowLocalhostInDev?: boolean,
 *   localhostOrigins?: string[],
 * }} [options]
 * @returns {(req: any, res: any) => boolean}
 *   `checkOrigin` — returns true if allowed (and sets ACAO header); on block, sets 403 and returns false.
 */
export function createOriginChecker({
  allowedOrigins = [],
  allowVercelPreview = false,
  allowLocalhostInDev = true,
  localhostOrigins = ['http://localhost:5173', 'http://localhost:3000'],
} = {}) {
  const origins = [...allowedOrigins];
  const isDev =
    process.env.NODE_ENV !== 'production' && process.env.VERCEL_ENV !== 'production';
  if (allowLocalhostInDev && isDev) origins.push(...localhostOrigins);

  return function checkOrigin(req, res) {
    const origin = req.headers?.origin || req.headers?.referer;

    // No Origin header: allow same-origin/server-to-server GETs, block POSTs.
    if (!origin) {
      if (req.method === 'GET') return true;
      res.status(403).json({ error: 'Forbidden' });
      return false;
    }

    const allowed =
      origins.some((ao) => origin.startsWith(ao)) ||
      (allowVercelPreview && origin.includes('vercel.app'));

    if (!allowed) {
      res.status(403).json({ error: 'Forbidden' });
      return false;
    }

    res.setHeader('Access-Control-Allow-Origin', origin);
    return true;
  };
}

/**
 * Create a durable (Postgres-backed) rate limiter for expensive endpoints.
 *
 * Unlike {@link createRateLimiter}, this persists across cold starts and is
 * shared across all instances, so per-IP and global daily caps actually hold.
 * Requires the `check_api_limits` RPC + `api_usage_logs` table — see
 * `migrations/check_api_limits.sql`.
 *
 * Fails OPEN: if Supabase is unreachable the request is allowed (and logged to
 * Sentry if provided) rather than taking the feature down.
 *
 * @param {{
 *   supabase: any,
 *   limits?: Record<string, { ipHour: number, ipDay: number, globalDay: number }>,
 *   sentry?: any,
 *   rpcName?: string,
 *   messages?: { global?: string, perIp?: string },
 * }} options
 *   `supabase` is a service-role client; `sentry` is optional.
 * @returns {(req: any, res: any, endpointKey: string) => Promise<boolean>}
 *   `checkApiLimitsDurable` — async; on block sets 429 (with `atCapacity: true` for the global case) and returns false.
 */
export function createDurableLimiter({
  supabase,
  limits = {},
  sentry = null,
  rpcName = 'check_api_limits',
  messages = {},
} = {}) {
  const msg = {
    global: "We're at capacity for today. Please check back tomorrow.",
    perIp: "You've made a lot of requests in a short window. Please try again a little later.",
    ...messages,
  };

  return async function checkApiLimitsDurable(req, res, endpointKey) {
    const limit = limits[endpointKey];
    if (!limit) return true; // no durable limit configured

    if (!supabase) {
      sentry?.captureMessage?.(
        `Durable limiter skipped (no Supabase client) for ${endpointKey}`,
        'warning',
      );
      return true;
    }

    const ip = getClientIp(req);

    let result;
    try {
      const { data, error } = await supabase.rpc(rpcName, {
        p_ip: ip,
        p_endpoint: endpointKey,
        p_ip_hour_limit: limit.ipHour,
        p_ip_day_limit: limit.ipDay,
        p_global_day_limit: limit.globalDay,
      });
      if (error) throw error;
      result = data;
    } catch (err) {
      // Fail open: availability beats a perfect cap. Provider caps still backstop.
      sentry?.captureException?.(err, {
        tags: { area: 'durable-rate-limit', endpoint: endpointKey },
      });
      return true;
    }

    if (result?.allowed) return true;

    if (result?.reason === 'global') {
      sentry?.captureMessage?.(
        `Global daily cap hit for ${endpointKey} (count=${result.global}/${limit.globalDay})`,
        'error',
      );
      res.setHeader('Retry-After', '3600');
      res.status(429).json({ error: msg.global, atCapacity: true });
      return false;
    }

    // Per-IP limit (hour or day).
    const retryAfter = result?.reason === 'ip_day' ? 3600 : 600;
    res.setHeader('Retry-After', String(retryAfter));
    res.status(429).json({ error: msg.perIp, retryAfter });
    return false;
  };
}

// ─── Input validators (pure) ─────────────────────────────────────────────────

/**
 * Escape HTML special characters to prevent injection in email templates.
 * @param {unknown} str
 * @returns {string}
 */
export function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Basic RFC-compatible email format check.
 * @param {unknown} str
 * @returns {boolean}
 */
export function isValidEmail(str) {
  if (!str || typeof str !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
}

/**
 * Validate that a URL is a safe HTTP(S) URL (not javascript:, data:, etc.).
 * @param {unknown} url
 * @returns {boolean}
 */
export function isSafeUrl(url) {
  if (!url) return false;
  try {
    const parsed = new URL(String(url));
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

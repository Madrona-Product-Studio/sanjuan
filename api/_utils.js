/**
 * Shared utilities for API routes — San Juan's config.
 *
 * The implementations (rate limiting, origin/CORS) come from
 * @madrona/api-utils, vendored at api/_vendor/api-utils.js. Edit the canonical
 * copy in madrona-studio/packages/api-utils and re-copy — never edit the
 * vendored file directly (a reapply overwrites it).
 */

import { createRateLimiter, createOriginChecker } from './_vendor/api-utils.js';

export const checkRateLimit = createRateLimiter({
  // endpoint key → { maxRequests, windowMs }
  'places-search': { maxRequests: 60, windowMs: 60 * 60 * 1000 },
  'place-photo':   { maxRequests: 120, windowMs: 60 * 60 * 1000 },
});

export const checkOrigin = createOriginChecker({
  allowedOrigins: [
    'https://sjiboating.com',
    'https://www.sjiboating.com',
    'https://sanjuan.vercel.app',
  ],
  allowVercelPreview: true, // preview deployments call these routes too
  localhostOrigins: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:8080'],
});

/**
 * Read the query string off the request with the WHATWG URL API.
 *
 * Use this instead of `req.query`. On Node 24 the platform's `req.query`
 * helper goes through the legacy `url.parse()`, which prints a DEP0169
 * deprecation warning to stderr on first use in each function instance, and
 * Vercel records stderr as an error-level log line. `req.query` is lazy, so
 * not touching it is enough to keep the old parser from running.
 *
 * Same shape as `req.query`: a key given once is a string, a key repeated is
 * an array of strings (the routes reject anything that is not a string).
 *
 * @param {{ url?: string }} req
 * @returns {Record<string, string | string[]>}
 */
export function getQuery(req) {
  let params;
  try {
    params = new URL(req.url || '/', 'http://localhost').searchParams;
  } catch {
    return {};
  }
  const out = {};
  for (const key of new Set(params.keys())) {
    const values = params.getAll(key);
    out[key] = values.length > 1 ? values : values[0];
  }
  return out;
}

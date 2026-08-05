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

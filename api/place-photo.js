/**
 * Google Place Photo proxy.
 * Fetches the photo server-side so the API key stays off the client.
 *
 * GET /api/place-photo?ref=PHOTO_REFERENCE&maxwidth=800
 * Returns: image/jpeg (or whatever Google sends)
 */

import { checkOrigin, checkRateLimit } from './_utils.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!checkOrigin(req, res)) return;
  if (!checkRateLimit(req, res, 'place-photo')) return;

  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) {
    return res.status(500).json({ error: 'Google Places API key not configured' });
  }

  const { ref, maxwidth = '800' } = req.query;
  if (!ref || typeof ref !== 'string' || ref.length > 2000) {
    return res.status(400).json({ error: 'Invalid or missing ref parameter' });
  }

  const mw = Math.min(Math.max(parseInt(maxwidth, 10) || 800, 100), 1600);

  try {
    const url = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${mw}&photo_reference=${encodeURIComponent(ref)}&key=${key}`;
    const response = await fetch(url);

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Photo fetch failed' });
    }

    const buffer = await response.arrayBuffer();
    res.setHeader('Content-Type', response.headers.get('content-type') || 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=604800');
    return res.send(Buffer.from(buffer));
  } catch (err) {
    console.error('Place photo error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch photo' });
  }
}

/**
 * Google Places text search proxy.
 * Keeps GOOGLE_PLACES_API_KEY server-side.
 *
 * GET /api/places-search?query=Friday+Harbor+Marina+San+Juan+Island
 * Returns: { placeId, name, rating, userRatingsTotal, address, phone, photoRefs }
 */

import { checkOrigin, checkRateLimit } from './_utils.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!checkOrigin(req, res)) return;
  if (!checkRateLimit(req, res, 'places-search')) return;

  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) {
    return res.status(500).json({ error: 'Google Places API key not configured' });
  }

  const { query } = req.query;
  if (!query || typeof query !== 'string' || query.length > 200) {
    return res.status(400).json({ error: 'Invalid or missing query parameter (max 200 chars)' });
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(query)}&inputtype=textquery&fields=place_id,name,rating,user_ratings_total,photos,formatted_address,geometry&key=${key}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK' || !data.candidates?.length) {
      // Surface Google's specific reason (e.g. REQUEST_DENIED) so config issues
      // (key restriction / API not enabled / billing) are diagnosable instead of
      // hidden behind a generic 404. error_message contains no secrets.
      if (data.status && data.status !== 'ZERO_RESULTS') {
        console.error('Places search denied:', data.status, '-', data.error_message || '(no message)');
      }
      return res.status(404).json({
        error: 'Place not found',
        status: data.status,
        googleError: data.error_message ?? null,
      });
    }

    const candidate = data.candidates[0];

    let phone = null;
    let website = null;
    let photoRefs = candidate.photos?.map(p => p.photo_reference) ?? [];
    if (candidate.place_id) {
      try {
        const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${candidate.place_id}&fields=formatted_phone_number,website,photos&key=${key}`;
        const detailsRes = await fetch(detailsUrl);
        const detailsData = await detailsRes.json();
        phone = detailsData.result?.formatted_phone_number || null;
        website = detailsData.result?.website || null;
        const detailPhotos = detailsData.result?.photos?.map(p => p.photo_reference) ?? [];
        if (detailPhotos.length > photoRefs.length) photoRefs = detailPhotos;
      } catch (_) { /* details are optional */ }
    }

    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=172800');
    return res.json({
      placeId: candidate.place_id,
      name: candidate.name,
      rating: candidate.rating,
      userRatingsTotal: candidate.user_ratings_total,
      address: candidate.formatted_address,
      phone,
      website,
      photoRefs: photoRefs.slice(0, 6),
    });
  } catch (err) {
    console.error('Places search error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch place data' });
  }
}

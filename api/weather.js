/**
 * Weather API — Aggregates NOAA data for the San Juan Islands / Salish Sea.
 *
 * Sources:
 *   - NOAA CO-OPS (tides, water temp, wind): tidesandcurrents.noaa.gov
 *   - NOAA NDBC  (buoy / C-MAN wind):       ndbc.noaa.gov
 *   - NWS        (marine forecast, alerts):  api.weather.gov
 *
 * All data is from US federal agencies — free, no API keys required.
 */

import { checkOrigin } from './_utils.js';

// ─── Cache (10 min server-side) ─────────────────────────────────────────────
let cache = null;
let cacheTime = 0;
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

// ─── NOAA Station IDs ───────────────────────────────────────────────────────
const FRIDAY_HARBOR = '9449880';
const CHERRY_POINT  = '9449424';
const SMITH_ISLAND  = 'SISW1';
const MARINE_ZONE   = 'PZZ135'; // San Juan Islands marine zone

// ─── Helpers ────────────────────────────────────────────────────────────────
const NWS_HEADERS = {
  'User-Agent': '(SanJuanIslandsBoatingGuide, github.com/sanjuan)',
  Accept: 'application/geo+json',
};

function coopsUrl(station, product, extra = '') {
  return `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?station=${station}&product=${product}&units=english&time_zone=lst_ldt&application=SanJuanBoatingGuide&format=json${extra}`;
}

async function fetchJson(url, headers = {}) {
  const res = await fetch(url, { headers, signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

async function fetchText(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.text();
}

// ─── Data Fetchers ──────────────────────────────────────────────────────────

/** Today's high/low tide predictions at Friday Harbor */
async function fetchTides() {
  const data = await fetchJson(
    coopsUrl(FRIDAY_HARBOR, 'predictions', '&date=today&interval=hilo&datum=MLLW')
  );
  return (data.predictions || []).map(p => ({
    time: p.t,
    height: parseFloat(p.v),
    type: p.type === 'H' ? 'High' : 'Low',
  }));
}

/** Latest water temperature at Friday Harbor */
async function fetchWaterTemp() {
  const data = await fetchJson(
    coopsUrl(FRIDAY_HARBOR, 'water_temperature', '&date=latest')
  );
  const d = data.data?.[0];
  return d ? { tempF: parseFloat(d.v), time: d.t, station: 'Friday Harbor' } : null;
}

/** Latest wind from NOAA CO-OPS (Cherry Point — reliable full met station) */
async function fetchWind() {
  const data = await fetchJson(
    coopsUrl(CHERRY_POINT, 'wind', '&date=latest')
  );
  const d = data.data?.[0];
  if (!d) return null;
  return {
    speed: parseFloat(d.s),  // knots
    gust: parseFloat(d.g),   // knots
    direction: parseFloat(d.d),
    directionCompass: d.dr,
    time: d.t,
    station: 'Cherry Point',
    stationId: CHERRY_POINT,
  };
}

/** Latest wind from NDBC Smith Island C-MAN station (closest to San Juans) */
async function fetchSmithIslandWind() {
  const text = await fetchText(
    `https://www.ndbc.noaa.gov/data/realtime2/${SMITH_ISLAND}.txt`
  );
  const lines = text.split('\n').filter(l => l && !l.startsWith('#'));
  if (!lines.length) return null;

  const cols = lines[0].trim().split(/\s+/);
  // Columns: YY MM DD hh mm WDIR WSPD GST WVHT DPD APD MWD PRES ATMP WTMP DEWP VIS PTDY TIDE
  const wdir = cols[5];
  const wspd = cols[6]; // m/s
  const gst  = cols[7]; // m/s
  const pres = cols[12]; // hPa
  const atmp = cols[13]; // degC

  if (wspd === 'MM') return null;

  const msToKnots = 1.94384;
  const compassDir = degreesToCompass(parseFloat(wdir));

  return {
    speed: +(parseFloat(wspd) * msToKnots).toFixed(1),
    gust: gst !== 'MM' ? +(parseFloat(gst) * msToKnots).toFixed(1) : null,
    direction: wdir !== 'MM' ? parseFloat(wdir) : null,
    directionCompass: wdir !== 'MM' ? compassDir : null,
    pressure: pres !== 'MM' ? +(parseFloat(pres) * 0.02953).toFixed(2) : null, // hPa to inHg
    airTemp: atmp !== 'MM' ? +(parseFloat(atmp) * 9/5 + 32).toFixed(1) : null,
    time: `${cols[0]}-${cols[1]}-${cols[2]} ${cols[3]}:${cols[4]} UTC`,
    station: 'Smith Island',
    stationId: SMITH_ISLAND,
  };
}

/** NWS marine forecast for the San Juan Islands zone */
async function fetchMarineForecast() {
  const data = await fetchJson(
    `https://api.weather.gov/zones/marine/${MARINE_ZONE}/forecast`,
    NWS_HEADERS
  );
  const periods = data.properties?.periods || [];
  return periods.slice(0, 6).map(p => ({
    name: p.name,
    forecast: p.detailedForecast,
  }));
}

/** Active NWS marine alerts for the San Juan Islands */
async function fetchAlerts() {
  const data = await fetchJson(
    `https://api.weather.gov/alerts/active?zone=${MARINE_ZONE}`,
    NWS_HEADERS
  );
  return (data.features || []).map(f => ({
    event: f.properties.event,
    headline: f.properties.headline,
    description: f.properties.description,
    severity: f.properties.severity,
    urgency: f.properties.urgency,
    onset: f.properties.onset,
    expires: f.properties.expires,
  }));
}

/** Air pressure from CO-OPS Cherry Point */
async function fetchPressure() {
  const data = await fetchJson(
    coopsUrl(CHERRY_POINT, 'air_pressure', '&date=latest')
  );
  const d = data.data?.[0];
  return d ? { pressure: parseFloat(d.v), time: d.t, station: 'Cherry Point' } : null;
}

function degreesToCompass(deg) {
  const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
  return dirs[Math.round(deg / 22.5) % 16];
}

// ─── Main Handler ───────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (!checkOrigin(req, res)) return;

  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }

  // Return cache if fresh
  if (cache && Date.now() - cacheTime < CACHE_TTL) {
    res.setHeader('X-Cache', 'HIT');
    return res.status(200).json(cache);
  }

  try {
    const [tides, waterTemp, wind, smithWind, forecast, alerts, pressure] =
      await Promise.allSettled([
        fetchTides(),
        fetchWaterTemp(),
        fetchWind(),
        fetchSmithIslandWind(),
        fetchMarineForecast(),
        fetchAlerts(),
        fetchPressure(),
      ]);

    // Prefer Smith Island wind (closer to San Juans), fall back to Cherry Point
    const primaryWind = smithWind.status === 'fulfilled' && smithWind.value
      ? smithWind.value
      : wind.status === 'fulfilled' ? wind.value : null;

    const result = {
      tides: tides.status === 'fulfilled' ? tides.value : [],
      waterTemp: waterTemp.status === 'fulfilled' ? waterTemp.value : null,
      wind: primaryWind,
      forecast: forecast.status === 'fulfilled' ? forecast.value : [],
      alerts: alerts.status === 'fulfilled' ? alerts.value : [],
      pressure: pressure.status === 'fulfilled' ? pressure.value : null,
      sources: {
        tides: { name: 'NOAA CO-OPS', station: 'Friday Harbor (#9449880)' },
        wind: { name: 'NOAA NDBC / CO-OPS', station: primaryWind?.station || 'Smith Island' },
        forecast: { name: 'National Weather Service', zone: 'PZZ135 — San Juan Islands' },
      },
      fetchedAt: new Date().toISOString(),
    };

    cache = result;
    cacheTime = Date.now();

    res.setHeader('Cache-Control', 'public, max-age=600');
    res.setHeader('X-Cache', 'MISS');
    return res.status(200).json(result);

  } catch (err) {
    console.error('Weather API error:', err);
    // Return stale cache if available
    if (cache) {
      res.setHeader('X-Cache', 'STALE');
      return res.status(200).json(cache);
    }
    return res.status(502).json({ error: 'Unable to fetch weather data' });
  }
}

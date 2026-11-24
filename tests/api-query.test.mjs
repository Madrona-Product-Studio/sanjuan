/**
 * The two Google proxies must read their query string without the legacy
 * `url.parse()` (Node DEP0169). On Vercel, `req.query` is a lazy getter that
 * goes through it, so these tests hand the handlers a request whose `query`
 * getter throws, and listen for the deprecation warning.
 *
 * Run: npm test   (no network: fetch is replaced with a stub)
 */
import test from 'node:test';
import assert from 'node:assert/strict';

process.env.GOOGLE_PLACES_API_KEY = 'test-key';

const { getQuery } = await import('../api/_utils.js');
const { default: placesSearch } = await import('../api/places-search.js');
const { default: placePhoto } = await import('../api/place-photo.js');

const deprecations = [];
process.on('warning', (w) => { if (w.name === 'DeprecationWarning') deprecations.push(w.code); });

function makeReq(url) {
  return {
    method: 'GET',
    url,
    headers: {},
    socket: { remoteAddress: '127.0.0.1' },
    get query() { throw new Error('req.query was read: it runs the deprecated url.parse()'); },
  };
}

function makeRes() {
  const res = { statusCode: 200, headers: {}, body: undefined };
  res.setHeader = (k, v) => { res.headers[k.toLowerCase()] = v; };
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (data) => { res.body = data; return res; };
  res.send = (data) => { res.body = data; return res; };
  return res;
}

function stubFetch(responder) {
  const calls = [];
  const real = globalThis.fetch;
  globalThis.fetch = async (url) => { calls.push(String(url)); return responder(String(url)); };
  return { calls, restore: () => { globalThis.fetch = real; } };
}

test('getQuery: single values are strings, repeats are arrays, + and %20 decode', () => {
  assert.deepEqual(getQuery({ url: '/api/places-search?query=Friday+Harbor%20Marina' }), { query: 'Friday Harbor Marina' });
  assert.deepEqual(getQuery({ url: '/api/place-photo?ref=abc&maxwidth=400' }), { ref: 'abc', maxwidth: '400' });
  assert.deepEqual(getQuery({ url: '/api/places-search?query=a&query=b' }), { query: ['a', 'b'] });
  assert.deepEqual(getQuery({ url: '/api/places-search' }), {});
  assert.deepEqual(getQuery({}), {});
});

test('places-search: reads the query from the URL and returns the place', async () => {
  const f = stubFetch((url) => {
    if (url.includes('findplacefromtext')) {
      return new Response(JSON.stringify({ status: 'OK', candidates: [{ place_id: 'p1', name: 'Friday Harbor Marina', rating: 4.6, user_ratings_total: 10, formatted_address: 'Friday Harbor, WA', photos: [{ photo_reference: 'r1' }] }] }));
    }
    return new Response(JSON.stringify({ result: { formatted_phone_number: '(360) 555-0100', website: 'https://example.com', photos: [{ photo_reference: 'r1' }, { photo_reference: 'r2' }] } }));
  });
  try {
    const res = makeRes();
    await placesSearch(makeReq('/api/places-search?query=Friday+Harbor+Marina+San+Juan+Island'), res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.placeId, 'p1');
    assert.deepEqual(res.body.photoRefs, ['r1', 'r2']);
    assert.match(f.calls[0], /input=Friday%20Harbor%20Marina%20San%20Juan%20Island&/);
  } finally { f.restore(); }
});

test('places-search: missing, repeated and over-long queries are still a 400', async () => {
  const f = stubFetch(() => { throw new Error('must not call Google'); });
  try {
    for (const url of ['/api/places-search', '/api/places-search?query=', '/api/places-search?query=a&query=b', `/api/places-search?query=${'x'.repeat(201)}`]) {
      const res = makeRes();
      await placesSearch(makeReq(url), res);
      assert.equal(res.statusCode, 400, url.slice(0, 60));
    }
    assert.equal(f.calls.length, 0);
  } finally { f.restore(); }
});

test('place-photo: reads ref and maxwidth from the URL, clamps the width, returns the image', async () => {
  const f = stubFetch(() => new Response(new Uint8Array([1, 2, 3]), { headers: { 'content-type': 'image/jpeg' } }));
  try {
    const res = makeRes();
    await placePhoto(makeReq('/api/place-photo?ref=AbC%2F123&maxwidth=5000'), res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.headers['content-type'], 'image/jpeg');
    assert.equal(res.body.length, 3);
    assert.match(f.calls[0], /maxwidth=1600&photo_reference=AbC%2F123&/);

    const res2 = makeRes();
    await placePhoto(makeReq('/api/place-photo?ref=abc'), res2);
    assert.match(f.calls[1], /maxwidth=800&/);
  } finally { f.restore(); }
});

test('place-photo: a missing ref is still a 400', async () => {
  const res = makeRes();
  await placePhoto(makeReq('/api/place-photo?maxwidth=800'), res);
  assert.equal(res.statusCode, 400);
});

test('no url.parse() deprecation warning (DEP0169) was raised by any of the above', async () => {
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(deprecations.includes('DEP0169'), false);
});

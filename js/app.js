/**
 * San Juan Islands Discovery Guide — Main Application
 */

// ========== STATE ==========
let map = null;
let markers = [];
let activeTab = 'map';
let activeIsland = null;
let activeDiningFilter = 'all';
let activeTrailFilter = 'all';
const placesCache = {};
let activePlacesController = null;

// ========== ITEM TYPE REGISTRY ==========
// Maps URL segment -> collection, modal builder, and the tab the route lives under.
const ITEM_TYPES = {
  marinas:        { list: () => MARINAS,      toModal: m => marinaToModalItem(m),      tab: 'map' },
  dining:         { list: () => DINING,       toModal: d => diningToModalItem(d),      tab: 'dining' },
  trails:         { list: () => TRAILS,       toModal: t => trailToModalItem(t),       tab: 'trails' },
  'marine-parks': { list: () => MARINE_PARKS, toModal: p => marineParksToModalItem(p), tab: 'marine-parks' },
  farms:          { list: () => FARMS,        toModal: f => farmToModalItem(f),        tab: 'farms' },
  culture:        { list: () => GALLERIES,    toModal: g => galleryToModalItem(g),     tab: 'culture' }
};

// ========== ANALYTICS ==========
function track(event, params) {
  if (typeof gtag === 'function') gtag('event', event, params || {});
}

// ========== ROUTE METADATA ==========
const ROUTE_META = {
  map:            { title: 'San Juan Islands Boating Guide', desc: 'Anchorages, marinas, and local knowledge for cruising the San Juan Islands.' },
  islands:        { title: 'Islands — San Juan Islands Boating Guide', desc: 'Seven islands spanning walkable harbor towns to wilderness marine parks in the San Juan archipelago.' },
  dining:         { title: 'Dining — San Juan Islands Boating Guide', desc: 'From dockside fish & chips to James Beard-nominated kitchens across the San Juan Islands.' },
  trails:         { title: 'Trails & Hiking — San Juan Islands Boating Guide', desc: 'From easy waterfront strolls to 2,400-foot summit climbs across the San Juan Islands.' },
  'marine-parks': { title: 'Marine Parks — San Juan Islands Boating Guide', desc: 'Boat-access destinations worth planning a trip around in the San Juan Islands.' },
  farms:          { title: 'Farms & Producers — San Juan Islands Boating Guide', desc: 'Lavender fields, shellfish farms, distilleries, and tasting rooms in the San Juan Islands.' },
  culture:        { title: 'Galleries & Culture — San Juan Islands Boating Guide', desc: 'Art, books, and creative spaces across the San Juan Islands.' },
  logistics:      { title: 'Cruising Logistics — San Juan Islands Boating Guide', desc: 'Water taxis, ferries, fuel, customs, and getting around the San Juan Islands.' },
  about:          { title: 'About — San Juan Islands Boating Guide', desc: 'A hand-curated boating guide to the San Juan Islands, written from the dock across three summers of cruising.' }
};

// ========== INITIALIZATION ==========
document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initMap();
  renderIslands();
  renderMarineParks();
  renderDining();
  renderTrails();
  renderFarms();
  renderCulture();
  renderLogistics();
  initModal();
  initWeatherModal();
  initRouter();
  initWelcomeModal();
  initSearch();
  initWindChip();
});

// ========== ROUTING ==========
function parseRoute(path) {
  const segments = path.replace(/^\/|\/$/g, '').split('/').filter(Boolean);
  if (segments.length === 0) return { tab: 'map' };
  if (ITEM_TYPES[segments[0]] && segments[1]) {
    return { tab: ITEM_TYPES[segments[0]].tab, itemType: segments[0], itemId: segments[1] };
  }
  const validTabs = ['islands', 'dining', 'trails', 'marine-parks', 'farms', 'culture', 'logistics', 'about'];
  if (validTabs.includes(segments[0])) {
    const result = { tab: segments[0] };
    if (segments[0] === 'islands' && segments[1]) result.islandId = segments[1];
    return result;
  }
  return { tab: 'map' };
}

function initRouter() {
  const route = parseRoute(window.location.pathname);
  if (route.tab !== 'map') {
    switchTab(route.tab, { pushState: false });
  }
  if (route.islandId) {
    showIslandDetail(route.islandId, { pushState: false });
  }
  if (route.itemType) {
    openModalFor(route.itemType, route.itemId, { pushState: false });
  }

  window.addEventListener('popstate', () => {
    const r = parseRoute(window.location.pathname);
    if (isModalOpen()) closeModal({ pushState: false });
    switchTab(r.tab || 'map', { pushState: false });
    if (r.itemType) {
      openModalFor(r.itemType, r.itemId, { pushState: false });
    } else if (r.islandId) {
      showIslandDetail(r.islandId, { pushState: false });
    } else if (r.tab === 'islands' && activeIsland) {
      hideIslandDetail({ pushState: false });
    }
  });
}

function updateMeta(tab, islandId, item) {
  let meta, path;
  if (item) {
    meta = { title: item.title, desc: item.desc };
    path = item.path;
  } else if (islandId && typeof ISLANDS !== 'undefined') {
    const island = ISLANDS.find(i => i.id === islandId);
    if (island) {
      meta = { title: island.name + ' — San Juan Islands Boating Guide', desc: island.description.substring(0, 155) };
    }
  }
  if (!meta) meta = ROUTE_META[tab] || ROUTE_META.map;
  if (!path) path = tab === 'map' ? '/' : islandId ? `/islands/${islandId}` : `/${tab}`;

  document.title = meta.title;
  const descTag = document.querySelector('meta[name="description"]');
  if (descTag) descTag.setAttribute('content', meta.desc);
  const canonTag = document.querySelector('link[rel="canonical"]');
  if (canonTag) {
    canonTag.setAttribute('href', 'https://www.sjiboating.com' + path);
  }
  // OG tags
  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) ogTitle.setAttribute('content', meta.title);
  const ogDesc = document.querySelector('meta[property="og:description"]');
  if (ogDesc) ogDesc.setAttribute('content', meta.desc);
}

// ========== GOOGLE PLACES ==========
async function fetchPlaceData(name, area) {
  const cacheKey = `${name}|${area}`;
  if (placesCache[cacheKey]) return placesCache[cacheKey];

  if (activePlacesController) activePlacesController.abort();
  activePlacesController = new AbortController();

  const query = encodeURIComponent(`${name} ${area} Washington`);
  const res = await fetch(`/api/places-search?query=${query}`, {
    signal: activePlacesController.signal
  });
  if (!res.ok) return null;

  const data = await res.json();
  const photos = (data.photoRefs || []).slice(0, 6).map(ref =>
    `/api/place-photo?ref=${encodeURIComponent(ref)}&maxwidth=800`
  );

  const result = {
    placeId: data.placeId,
    name: data.name,
    rating: data.rating,
    userRatingsTotal: data.userRatingsTotal,
    address: data.address,
    phone: data.phone,
    website: data.website,
    photos,
  };
  placesCache[cacheKey] = result;
  return result;
}

function renderStars(rating) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.3;
  let stars = '';
  for (let i = 0; i < full; i++) stars += '<span class="star full">&#9733;</span>';
  if (half) stars += '<span class="star half">&#9733;</span>';
  const empty = 5 - full - (half ? 1 : 0);
  for (let i = 0; i < empty; i++) stars += '<span class="star empty">&#9734;</span>';
  return stars;
}

// ========== DETAIL MODAL ==========
let currentItemRoute = null;

// Site-wide content review date; individual entries can override with
// verified: "YYYY-MM" as they get re-checked.
const CONTENT_REVIEWED = 'July 2026';
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function formatVerified(v) {
  if (!v) return CONTENT_REVIEWED;
  const m = /^(\d{4})-(\d{2})$/.exec(v);
  if (m) return MONTH_NAMES[parseInt(m[2], 10) - 1] + ' ' + m[1];
  return v;
}

function isModalOpen() {
  const overlay = document.getElementById('detailModalOverlay');
  return overlay && overlay.classList.contains('active');
}

// Open a listing by type + id (the deep-linkable path). Used by cards, map markers, and the router.
function openModalFor(type, id, opts) {
  opts = opts || {};
  const reg = ITEM_TYPES[type];
  if (!reg) return;
  const item = reg.list().find(x => x.id === id);
  if (!item) return;
  const modalItem = reg.toModal(item);
  modalItem.verified = item.verified;
  openModal(modalItem, { path: `/${type}/${id}`, type: type, pushState: opts.pushState });
}

// Anchor click handler: allow cmd/ctrl-click to open in a new tab, otherwise open the modal.
function openItem(e, type, id) {
  if (e && (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1)) return true;
  if (e) e.preventDefault();
  openModalFor(type, id);
  return false;
}

function navTab(e, tab) {
  if (e && (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1)) return true;
  if (e) e.preventDefault();
  switchTab(tab);
  return false;
}

function initModal() {
  const overlay = document.getElementById('detailModalOverlay');
  const closeBtn = document.getElementById('modalClose');

  closeBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });
}

function openModal(item, opts) {
  opts = opts || {};
  const overlay = document.getElementById('detailModalOverlay');
  const photosEl = document.getElementById('modalPhotos');
  const bodyEl = document.getElementById('modalBody');

  // Build modal body from item data
  let bodyHtml = '';

  // Title
  bodyHtml += `<h2 class="modal-title">${item.name}</h2>`;

  // Meta row
  if (item.meta && item.meta.length) {
    bodyHtml += `<div class="modal-meta">${item.meta.map(m => `<span>${m}</span>`).join('')}</div>`;
  }

  // Description
  if (item.description) {
    bodyHtml += `<p class="modal-description">${item.description}</p>`;
  }

  // Extra details (rates, amenities, hours, caution — varies by type)
  if (item.extras) {
    bodyHtml += item.extras;
  }

  // Places loading placeholder
  bodyHtml += `<div class="modal-places-loading" id="modalPlacesLoading"><div class="loading-shimmer"></div><div class="loading-shimmer short"></div></div>`;
  bodyHtml += `<div id="modalPlacesContent"></div>`;

  photosEl.innerHTML = '<div class="modal-photos-placeholder"></div>';
  bodyEl.innerHTML = bodyHtml;

  // "Suggest an update" — keeps listings fresh and starts conversations with businesses
  const suggestWrap = document.createElement('div');
  suggestWrap.className = 'modal-suggest';
  const verifiedEl = document.createElement('span');
  verifiedEl.className = 'modal-verified';
  verifiedEl.textContent = 'Last verified ' + formatVerified(item.verified);
  suggestWrap.appendChild(verifiedEl);
  const suggestBtn = document.createElement('button');
  suggestBtn.type = 'button';
  suggestBtn.className = 'modal-suggest-link';
  suggestBtn.textContent = 'See something out of date? Suggest an update';
  suggestBtn.addEventListener('click', () => {
    track('suggest_update', { listing_name: item.name });
    if (window.MPSFeedback) window.MPSFeedback.open('Update for: ' + item.name);
  });
  suggestWrap.appendChild(suggestBtn);
  bodyEl.appendChild(suggestWrap);

  // Deep-link URL + meta for shareable listings
  currentItemRoute = opts.path || null;
  if (opts.path) {
    if (opts.pushState !== false) {
      history.pushState({ modal: opts.path }, '', opts.path);
    }
    updateMeta(activeTab, activeIsland, {
      title: item.name + ' — San Juan Islands Boating Guide',
      desc: (item.description || '').substring(0, 155),
      path: opts.path
    });
  }
  track('listing_view', { listing_name: item.name, listing_type: opts.type || 'other' });

  // Lock scroll first so mobile browser chrome settles before animating
  document.body.style.overflow = 'hidden';
  // Force reflow so viewport units stabilize before transition starts
  void overlay.offsetHeight;
  overlay.classList.add('active');

  // Fetch Places data
  if (item.placeName && item.placeArea) {
    fetchPlaceData(item.placeName, item.placeArea).then(places => {
      const loadingEl = document.getElementById('modalPlacesLoading');
      const contentEl = document.getElementById('modalPlacesContent');
      if (loadingEl) loadingEl.classList.add('hidden');

      if (!places) {
        if (contentEl) contentEl.innerHTML = '';
        return;
      }

      // Render photos in the photo area with dots
      if (places.photos.length) {
        photosEl.innerHTML = `
          <div class="modal-carousel" id="modalCarousel">
            <div class="carousel-track" id="carouselTrack">
              ${places.photos.map((url, i) =>
                `<img src="${url}" alt="Photo ${i + 1}" class="carousel-slide" loading="lazy" />`
              ).join('')}
            </div>
            ${places.photos.length > 1 ? `
              <div class="carousel-dots" id="carouselDots">
                ${places.photos.map((_, i) =>
                  `<button class="carousel-dot${i === 0 ? ' active' : ''}" data-index="${i}"></button>`
                ).join('')}
              </div>
              <button class="carousel-arrow carousel-prev" id="carouselPrev">&lsaquo;</button>
              <button class="carousel-arrow carousel-next" id="carouselNext">&rsaquo;</button>
            ` : ''}
          </div>`;
        // Trigger smooth reveal after a frame
        requestAnimationFrame(() => photosEl.classList.add('loaded'));
        if (places.photos.length > 1) initCarousel();
      } else {
        photosEl.innerHTML = '';
      }

      // Render Places info in the body
      let placesHtml = '';

      if (places.rating) {
        placesHtml += `<div class="places-rating">`;
        placesHtml += `<span class="rating-stars">${renderStars(places.rating)}</span>`;
        placesHtml += `<span class="rating-text">${places.rating}</span>`;
        if (places.userRatingsTotal) {
          placesHtml += `<span class="rating-count">(${places.userRatingsTotal} reviews)</span>`;
        }
        placesHtml += `</div>`;
      }

      if (places.address) {
        placesHtml += `<div class="modal-address">${places.address}</div>`;
      }

      const buttons = [];
      if (places.placeId) {
        buttons.push(`<a href="https://www.google.com/maps/place/?q=place_id:${places.placeId}" target="_blank" rel="noopener noreferrer" class="action-btn action-directions"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>Directions</a>`);
      }
      if (places.phone) {
        buttons.push(`<a href="tel:${places.phone}" class="action-btn action-phone"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>${places.phone}</a>`);
      }
      if (places.website) {
        buttons.push(`<a href="${places.website}" target="_blank" rel="noopener noreferrer" class="action-btn action-website"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>Website</a>`);
      }
      if (buttons.length) {
        placesHtml += `<div class="action-buttons">${buttons.join('')}</div>`;
      }

      if (contentEl) {
        contentEl.innerHTML = placesHtml;
        // Outbound referral tracking — the core sponsorship metric
        contentEl.querySelectorAll('.action-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const outType = btn.classList.contains('action-directions') ? 'directions'
              : btn.classList.contains('action-phone') ? 'phone' : 'website';
            track('outbound_click', { listing_name: item.name, outbound_type: outType });
          });
        });
        requestAnimationFrame(() => contentEl.classList.add('loaded'));
      }
    }).catch(() => {
      const loadingEl = document.getElementById('modalPlacesLoading');
      if (loadingEl) loadingEl.classList.add('hidden');
    });
  } else {
    document.getElementById('modalPlacesLoading').classList.add('hidden');
  }
}

function closeModal(opts) {
  opts = opts || {};
  const overlay = document.getElementById('detailModalOverlay');
  overlay.classList.remove('active');
  document.body.style.overflow = '';
  // Reset photo state for next open
  const photosEl = document.getElementById('modalPhotos');
  if (photosEl) photosEl.classList.remove('loaded');
  // Restore the parent route if this modal owned a deep link
  if (currentItemRoute) {
    currentItemRoute = null;
    if (opts.pushState !== false) {
      const path = activeIsland ? '/islands/' + activeIsland : activeTab === 'map' ? '/' : '/' + activeTab;
      history.pushState({ tab: activeTab }, '', path);
      updateMeta(activeTab, activeIsland);
    }
  }
}

function initCarousel() {
  const track = document.getElementById('carouselTrack');
  const dots = document.querySelectorAll('#carouselDots .carousel-dot');
  const prev = document.getElementById('carouselPrev');
  const next = document.getElementById('carouselNext');
  let current = 0;
  const total = dots.length;

  function goTo(i) {
    current = Math.max(0, Math.min(i, total - 1));
    track.style.transform = `translateX(-${current * 100}%)`;
    dots.forEach((d, idx) => d.classList.toggle('active', idx === current));
  }

  prev.addEventListener('click', (e) => { e.stopPropagation(); goTo(current - 1); });
  next.addEventListener('click', (e) => { e.stopPropagation(); goTo(current + 1); });
  dots.forEach(d => d.addEventListener('click', (e) => { e.stopPropagation(); goTo(+d.dataset.index); }));

  // Touch swipe support
  let startX = 0;
  let dragging = false;
  track.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; dragging = true; });
  track.addEventListener('touchend', (e) => {
    if (!dragging) return;
    dragging = false;
    const diff = startX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) goTo(current + (diff > 0 ? 1 : -1));
  });
}

// Build modal item from a dining entry
function diningToModalItem(d) {
  const meta = [d.cuisine, d.price, d.area];
  if (d.walkFromDock) meta.push(d.walkFromDock + ' from dock');
  let extras = '';
  if (d.hours) extras += `<div class="modal-extra"><strong>Hours:</strong> ${d.hours}</div>`;
  return { name: d.name, meta, description: d.description, extras, placeName: d.name, placeArea: d.area };
}

// Build modal item from a trail entry
function trailToModalItem(t) {
  const meta = [];
  meta.push(`<span class="difficulty-badge difficulty-${t.difficulty.toLowerCase().replace(/[^a-z]/g, '-')}" style="color:${difficultyColor(t.difficulty)};font-weight:700">${t.difficulty}</span>`);
  meta.push(t.distance);
  if (t.elevGain) meta.push(t.elevGain + ' gain');
  meta.push(t.area);
  if (t.discoverPass) meta.push('<span style="color:#e65100;font-weight:600">Discover Pass Required</span>');
  return { name: t.name, meta, description: t.description, extras: '', placeName: t.name, placeArea: t.area };
}

// Build modal item from a marina entry
function marinaToModalItem(m) {
  const cat = MARINA_CATEGORIES[m.category] || { color: '#999', label: m.type };
  const meta = [`<span style="color:${cat.color};font-weight:600">${cat.label}</span>`];
  if (m.area) meta.push(m.area);
  if (m.vhf) meta.push('VHF ' + m.vhf);
  if (m.fuel) meta.push('Fuel');

  let extras = '';
  if (m.rates) extras += `<div class="modal-extra"><strong>Rates:</strong> ${m.rates}</div>`;
  if (m.amenities) extras += `<div class="modal-extra"><strong>Amenities:</strong> ${m.amenities.join(', ')}</div>`;
  if (m.caution) extras += `<div class="info-caution">${m.caution}</div>`;

  return { name: m.name, meta, description: m.details, extras, placeName: m.name, placeArea: m.area };
}

// Build modal item from a gallery entry
function galleryToModalItem(g) {
  const meta = [g.area];
  if (g.walkFromDock) meta.push(g.walkFromDock + ' from dock');
  return { name: g.name, meta, description: g.description, extras: '', placeName: g.name, placeArea: g.area };
}

// ========== TAB NAVIGATION ==========
function initTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      switchTab(tab);
    });
  });
}

function switchTab(tab, opts) {
  opts = opts || {};
  const panel = document.getElementById(`panel-${tab}`);
  if (!panel) return;
  activeTab = tab;
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  const tabBtn = document.querySelector(`.tab-btn[data-tab="${tab}"]`);
  if (tabBtn) tabBtn.classList.add('active');
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  panel.classList.add('active');
  track('tab_view', { tab: tab });
  if (tab === 'map' && map) {
    setTimeout(() => map.invalidateSize(), 100);
  }
  // Hide feedback button on map tab to avoid overlapping map controls
  const fbBtn = document.getElementById('mps-fb-btn');
  if (fbBtn) fbBtn.style.setProperty('display', tab === 'map' ? 'none' : 'flex', 'important');
  if (tab === 'islands') {
    hideIslandDetail({ pushState: false });
  }
  if (opts.pushState !== false) {
    const url = tab === 'map' ? '/' : '/' + tab;
    history.pushState({ tab: tab }, '', url);
    updateMeta(tab);
  }
}

// ========== MAP ==========
function initMap() {
  // Frame the core archipelago (Lopez up through Sucia/Patos). Pan limits are
  // padded around this same box — deriving them from the marker extent skewed
  // the view east toward the Anacortes/Bellingham home marinas.
  const coreBounds = L.latLngBounds([[48.40, -123.17], [48.80, -122.80]]);
  const maxBounds = coreBounds.pad(2);

  map = L.map('map', {
    center: [48.58, -122.95],
    zoom: 10,
    zoomControl: true,
    touchZoom: true,
    scrollWheelZoom: true,
    maxBounds: maxBounds,
    maxBoundsViscosity: 0.8,
    minZoom: 9
  });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 18
  }).addTo(map);

  renderMapMarkers('all');
  initMapOverlays();

  // Start with the legend collapsed on small screens so it doesn't cover the map
  const legend = document.getElementById('mapLegend');
  if (legend && window.innerWidth < 768) legend.classList.add('collapsed');

  map.fitBounds(coreBounds, { padding: window.innerWidth < 768 ? [10, 10] : [20, 20] });
}

// ========== MAP OVERLAY LAYERS ==========
// Marine parks already appear via the State Parks marina markers, so overlays
// cover the categories that add new map information.
const MAP_OVERLAYS = {
  dining:  { label: 'Dining',  color: '#e8890c', type: 'dining',  data: () => DINING },
  trails:  { label: 'Trails',  color: '#2f9e44', type: 'trails',  data: () => TRAILS },
  farms:   { label: 'Farms',   color: '#b0578d', type: 'farms',   data: () => FARMS },
  culture: { label: 'Culture', color: '#0e7f8c', type: 'culture', data: () => GALLERIES }
};
const MAP_LAYER_DEFAULTS = { dining: true, trails: true, farms: false, culture: false };
const overlayGroups = {};

function mapLayerPrefs() {
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem('sji-map-layers') || '{}'); } catch (e) { /* corrupted prefs */ }
  return Object.assign({}, MAP_LAYER_DEFAULTS, saved);
}

function initMapOverlays() {
  const prefs = mapLayerPrefs();
  Object.entries(MAP_OVERLAYS).forEach(([key, cfg]) => {
    const group = L.layerGroup();
    cfg.data().forEach(item => {
      if (item.lat == null || item.lng == null) return;
      const mk = L.circleMarker([item.lat, item.lng], {
        radius: 5.5,
        fillColor: cfg.color,
        color: 'rgba(255,255,255,0.9)',
        weight: 1.5,
        opacity: 1,
        fillOpacity: 0.8
      });
      mk.bindTooltip(item.name, { direction: 'top', offset: [0, -6] });
      mk.on('click', (e) => {
        e.originalEvent.stopPropagation();
        openModalFor(cfg.type, item.id);
      });
      group.addLayer(mk);
    });
    overlayGroups[key] = group;
    if (prefs[key]) map.addLayer(group);
    const box = document.querySelector(`.legend-toggle input[data-layer="${key}"]`);
    if (box) box.checked = !!prefs[key];
  });
}

function toggleMapLayer(key, on) {
  const group = overlayGroups[key];
  if (!group || !map) return;
  if (on) map.addLayer(group);
  else map.removeLayer(group);
  const prefs = mapLayerPrefs();
  prefs[key] = !!on;
  try { localStorage.setItem('sji-map-layers', JSON.stringify(prefs)); } catch (e) { /* storage full/blocked */ }
  track('map_layer_toggle', { layer: key, enabled: !!on });
}

function renderMapMarkers(filter) {
  markers.forEach(m => map.removeLayer(m));
  markers = [];

  MARINAS.forEach(marina => {
    if (filter !== 'all' && marina.category !== filter) return;

    const cat = MARINA_CATEGORIES[marina.category] || { color: '#999', label: marina.type };
    const baseRadius = window.innerWidth < 768 ? 9 : 7;
    const marker = L.circleMarker([marina.lat, marina.lng], {
      radius: baseRadius,
      fillColor: cat.color,
      color: 'rgba(255,255,255,0.9)',
      weight: 2.5,
      opacity: 1,
      fillOpacity: 0.85
    }).addTo(map);

    marker.on('click', (e) => {
      e.originalEvent.stopPropagation();
      openModalFor('marinas', marina.id);
    });

    if (window.innerWidth >= 768) {
      marker.on('mouseover', function () { this.setRadius(10); this.setStyle({ fillOpacity: 1, weight: 3 }); });
      marker.on('mouseout', function () { this.setRadius(baseRadius); this.setStyle({ fillOpacity: 0.85, weight: 2.5 }); });
    }

    markers.push(marker);
  });
}



// ========== ISLANDS ==========
function renderIslands() {
  const grid = document.getElementById('islandGrid');
  grid.innerHTML = ISLANDS.map(island => `
    <a class="island-card" href="/islands/${island.id}" onclick="return islandNav(event, '${island.id}')">
      <div class="island-card-banner" style="background:${island.imageColor}"></div>
      <div class="island-card-body">
        <span class="badge ${island.ferryServed ? 'badge-ferry' : 'badge-boat'}">
          ${island.ferryServed ? 'Ferry Served' : 'Boat Access Only'}
        </span>
        <h3>${island.name}</h3>
        <div class="tagline">${island.tagline}</div>
        <p>${island.description.substring(0, 120)}...</p>
        <div class="highlights">
          ${island.highlights.map(h => `<span class="highlight-tag">${h}</span>`).join('')}
        </div>
      </div>
    </a>
  `).join('');
}

function islandNav(e, id) {
  if (e && (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1)) return true;
  if (e) e.preventDefault();
  showIslandDetail(id);
  return false;
}

function showIslandDetail(islandId, opts) {
  opts = opts || {};
  const island = ISLANDS.find(i => i.id === islandId);
  if (!island) return;

  activeIsland = islandId;
  document.getElementById('islandGrid').style.display = 'none';
  document.querySelector('#panel-islands .section-header').style.display = 'none';

  if (opts.pushState !== false) {
    history.pushState({ tab: 'islands', islandId: islandId }, '', '/islands/' + islandId);
    updateMeta('islands', islandId);
  }

  const detail = document.getElementById('islandDetail');
  const islandMarinas = MARINAS.filter(m => m.island === islandId);
  const islandDining = DINING.filter(d => d.island === islandId);
  const islandTrails = TRAILS.filter(t => t.island === islandId);
  const islandGalleries = GALLERIES.filter(g => g.island === islandId);
  const islandWellness = WELLNESS.filter(w => w.island === islandId);

  let html = `
    <div class="island-detail-header">
      <button class="back-btn" onclick="hideIslandDetail()">&larr; All Islands</button>
      <h2>${island.name}</h2>
      <div class="tagline">${island.tagline}</div>
    </div>
    <p style="margin-bottom:20px;color:var(--color-text-light);font-size:0.9rem">${island.description}</p>
  `;

  if (islandMarinas.length) {
    html += `<div class="detail-section"><h3>Marinas & Moorage</h3><div class="activity-list">`;
    html += islandMarinas.map(m => {
      const cat = MARINA_CATEGORIES[m.category] || { color: '#999', label: m.type };
      return `
        <a class="activity-card modal-trigger" href="/marinas/${m.id}" onclick="return openItem(event, 'marinas', '${m.id}')">
          <h4>${m.name}</h4>
          <div class="meta">
            <span style="color:${cat.color};font-weight:600">${cat.label}</span>
            ${m.vhf ? '<span>VHF ' + m.vhf + '</span>' : ''}
            ${m.fuel ? '<span>Fuel</span>' : ''}
          </div>
          <p>${m.details.substring(0, 100)}${m.details.length > 100 ? '...' : ''}</p>
        </a>
      `;
    }).join('');
    html += `</div></div>`;
  }

  if (islandDining.length) {
    html += `<div class="detail-section"><h3>Dining</h3><div class="activity-list">`;
    html += islandDining.map(d => renderDiningCard(d)).join('');
    html += `</div></div>`;
  }

  if (islandTrails.length) {
    html += `<div class="detail-section"><h3>Trails & Hiking</h3><div class="activity-list">`;
    html += islandTrails.map(t => renderTrailCard(t)).join('');
    html += `</div></div>`;
  }

  if (islandGalleries.length) {
    html += `<div class="detail-section"><h3>Art & Galleries</h3><div class="activity-list">`;
    html += islandGalleries.map(g => `
      <a class="activity-card gallery-card" href="/culture/${g.id}" onclick="return openItem(event, 'culture', '${g.id}')">
        <h4>${g.name}</h4>
        <div class="meta"><span>${g.area}</span>${g.walkFromDock ? '<span>' + g.walkFromDock + ' from dock</span>' : ''}</div>
        <p>${g.description}</p>
      </a>
    `).join('');
    html += `</div></div>`;
  }

  if (islandWellness.length) {
    html += `<div class="detail-section"><h3>Wellness & Yoga</h3><div class="activity-list">`;
    html += islandWellness.map(w => `
      <div class="activity-card wellness-card">
        <h4>${w.name}</h4>
        <div class="meta"><span>${w.area}</span></div>
        <p>${w.description}</p>
      </div>
    `).join('');
    html += `</div></div>`;
  }

  detail.innerHTML = html;
  detail.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function hideIslandDetail(opts) {
  opts = opts || {};
  activeIsland = null;
  document.getElementById('islandDetail').classList.remove('active');
  document.getElementById('islandDetail').innerHTML = '';
  document.getElementById('islandGrid').style.display = '';
  document.querySelector('#panel-islands .section-header').style.display = '';
  if (opts.pushState !== false) {
    history.pushState({ tab: 'islands' }, '', '/islands');
    updateMeta('islands');
  }
}

// ========== SHARED CARD RENDERERS ==========
function renderDiningCard(d) {
  return `
    <a class="activity-card modal-trigger" href="/dining/${d.id}" onclick="return openItem(event, 'dining', '${d.id}')">
      <div class="card-top-row">
        <h4>${d.name}</h4>
        <span class="price-badge price-${d.price.length}">${d.price}</span>
      </div>
      <div class="meta">
        <span>${d.cuisine}</span>
        <span>${d.area}</span>
        ${d.walkFromDock ? '<span class="dock-badge">' + d.walkFromDock + '</span>' : ''}
      </div>
      <p>${d.description}</p>
      ${d.hours ? '<div class="card-hours">' + d.hours + '</div>' : ''}
    </a>
  `;
}

function renderTrailCard(t) {
  return `
    <a class="activity-card modal-trigger" href="/trails/${t.id}" onclick="return openItem(event, 'trails', '${t.id}')">
      <div class="card-top-row">
        <h4>${t.name}</h4>
        <span class="difficulty-pill" style="background:${difficultyColor(t.difficulty)}20;color:${difficultyColor(t.difficulty)}">${t.difficulty}</span>
      </div>
      <div class="meta">
        <span>${t.distance}</span>
        ${t.elevGain ? '<span>' + t.elevGain + '</span>' : ''}
        <span>${t.area}</span>
        ${t.discoverPass ? '<span class="discover-pass-badge">Discover Pass</span>' : ''}
      </div>
      <p>${t.description}</p>
    </a>
  `;
}

// ========== DINING ==========
function renderDining() {
  const grid = document.getElementById('diningGrid');
  renderDiningCards(grid, 'all');

  document.querySelectorAll('#panel-dining .cat-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      activeDiningFilter = btn.dataset.island;
      document.querySelectorAll('#panel-dining .cat-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderDiningCards(grid, activeDiningFilter);
    });
  });
}

function renderDiningCards(container, filter) {
  const items = filter === 'all' ? DINING : DINING.filter(d => d.island === filter);
  container.innerHTML = items.map(d => renderDiningCard(d)).join('');
}

// ========== TRAILS ==========
function renderTrails() {
  const grid = document.getElementById('trailsGrid');
  renderTrailCards(grid, 'all');

  document.querySelectorAll('#panel-trails .cat-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      activeTrailFilter = btn.dataset.island;
      document.querySelectorAll('#panel-trails .cat-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderTrailCards(grid, activeTrailFilter);
    });
  });
}

function renderTrailCards(container, filter) {
  const items = filter === 'all' ? TRAILS : TRAILS.filter(t => t.island === filter);
  container.innerHTML = items.map(t => renderTrailCard(t)).join('');
}

function difficultyColor(d) {
  if (d.includes('Difficult')) return '#b44340';
  if (d.includes('Moderate')) return '#c8956c';
  return '#3d8b6e';
}

// ========== MARINE PARKS ==========
function marineParksToModalItem(p) {
  const meta = [p.access, p.managingAgency];
  let extras = '';
  extras += `<div class="modal-extra"><strong>Moorage:</strong> ${p.moorage}</div>`;
  if (p.camping) extras += `<div class="modal-extra"><strong>Camping:</strong> ${p.camping}</div>`;
  if (p.trails) extras += `<div class="modal-extra"><strong>Trails:</strong> ${p.trails}</div>`;
  if (p.water) extras += `<div class="modal-extra"><strong>Water:</strong> ${p.water}</div>`;
  if (p.cellular) extras += `<div class="modal-extra"><strong>Cellular:</strong> ${p.cellular}</div>`;
  if (p.seasonalNotes) extras += `<div class="info-caution">${p.seasonalNotes}</div>`;
  if (p.hazards) extras += `<div class="info-caution">${p.hazards}</div>`;
  return { name: p.name, meta, description: p.description, extras, placeName: p.name, placeArea: p.area };
}

function renderMarineParks() {
  const grid = document.getElementById('marineParksGrid');
  grid.innerHTML = MARINE_PARKS.map(p => `
    <a class="activity-card modal-trigger" href="/marine-parks/${p.id}" onclick="return openItem(event, 'marine-parks', '${p.id}')">
      <div class="card-top-row">
        <h4>${p.name}</h4>
        <span class="difficulty-pill" style="background:var(--color-surface-cool);color:var(--color-text-mid)">${p.access}</span>
      </div>
      <div class="meta">
        <span>${p.managingAgency}</span>
        <span>${p.area}</span>
      </div>
      <p>${p.description.substring(0, 120)}${p.description.length > 120 ? '...' : ''}</p>
      ${p.seasonalNotes ? '<div class="card-hours">' + p.seasonalNotes + '</div>' : ''}
    </a>
  `).join('');
}

// ========== FARMS & PRODUCERS ==========
function farmToModalItem(f) {
  const meta = [f.type, f.area];
  if (f.price) meta.push(f.price);
  let extras = '';
  if (f.hours) extras += `<div class="modal-extra"><strong>Hours:</strong> ${f.hours}</div>`;
  if (f.seasonalNotes) extras += `<div class="info-caution">${f.seasonalNotes}</div>`;
  return { name: f.name, meta, description: f.description, extras, placeName: f.name, placeArea: f.area };
}

function renderFarms() {
  const grid = document.getElementById('farmsGrid');

  // Dedicated farm entries
  let items = FARMS.map(f => `
    <a class="activity-card modal-trigger" href="/farms/${f.id}" onclick="return openItem(event, 'farms', '${f.id}')">
      <div class="card-top-row">
        <h4>${f.name}</h4>
        <span class="difficulty-pill" style="background:var(--color-surface-cool);color:var(--color-text-mid)">${f.type}</span>
      </div>
      <div class="meta">
        <span>${f.area}</span>
        ${f.hours ? '<span>' + f.hours + '</span>' : ''}
      </div>
      <p>${f.description}</p>
    </a>
  `);

  // Cross-listed dining entries with producer: true
  const producers = DINING.filter(d => d.producer);
  items = items.concat(producers.map(d => `
    <a class="activity-card modal-trigger" href="/dining/${d.id}" onclick="return openItem(event, 'dining', '${d.id}')">
      <div class="card-top-row">
        <h4>${d.name}</h4>
        <span class="price-badge price-${d.price.length}">${d.price}</span>
      </div>
      <div class="meta">
        <span>${d.cuisine}</span>
        <span>${d.area}</span>
        ${d.walkFromDock ? '<span>' + d.walkFromDock + ' from dock</span>' : ''}
      </div>
      <p>${d.description}</p>
    </a>
  `));

  grid.innerHTML = items.join('');
}

// ========== GALLERIES & CULTURE ==========
let activeCultureFilter = 'all';

function renderCulture() {
  const grid = document.getElementById('cultureGrid');
  renderCultureCards(grid, 'all');

  document.querySelectorAll('#panel-culture .cat-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      activeCultureFilter = btn.dataset.island;
      document.querySelectorAll('#panel-culture .cat-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderCultureCards(grid, activeCultureFilter);
    });
  });
}

function renderCultureCards(container, filter) {
  const items = filter === 'all' ? GALLERIES : GALLERIES.filter(g => g.island === filter);
  container.innerHTML = items.map(g => `
    <a class="activity-card modal-trigger" href="/culture/${g.id}" onclick="return openItem(event, 'culture', '${g.id}')">
      <h4>${g.name}</h4>
      <div class="meta">
        <span>${g.type ? g.type.replace('_', ' ') : 'gallery'}</span>
        <span>${g.area}</span>
        ${g.walkFromDock ? '<span>' + g.walkFromDock + ' from dock</span>' : ''}
      </div>
      <p>${g.description}</p>
    </a>
  `).join('');
}

// ========== LOGISTICS ==========
function renderLogistics() {
  // Static content rendered in HTML
}

// ========== WEATHER MODAL ==========
let weatherData = null;
let weatherFetching = false;

function initWeatherModal() {
  const overlay = document.getElementById('weatherModalOverlay');
  const closeBtn = document.getElementById('weatherModalClose');

  closeBtn.addEventListener('click', closeWeatherModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeWeatherModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('active')) closeWeatherModal();
  });
}

function openWeatherModal() {
  track('weather_open');
  const overlay = document.getElementById('weatherModalOverlay');
  document.body.style.overflow = 'hidden';
  void overlay.offsetHeight;
  overlay.classList.add('active');

  if (weatherData) {
    renderWeatherModal(weatherData);
  } else if (!weatherFetching) {
    fetchWeatherData();
  }
}

// Live wind chip in the header — the number boaters check all day
async function initWindChip() {
  try {
    const res = await fetch('/api/weather');
    if (!res.ok) return;
    weatherData = await res.json();
    const w = weatherData.wind;
    if (w && w.speed != null) {
      const label = document.querySelector('.weather-btn-label');
      if (label) {
        label.textContent = ((w.directionCompass ? w.directionCompass + ' ' : '') + w.speed + ' kt');
      }
      const btn = document.getElementById('weatherBtn');
      if (btn) btn.setAttribute('aria-label', 'Current conditions: wind ' + w.speed + ' knots');
    }
  } catch (e) { /* offline or API down — button keeps its default label */ }
}

function closeWeatherModal() {
  const overlay = document.getElementById('weatherModalOverlay');
  overlay.classList.remove('active');
  document.body.style.overflow = '';
}

async function fetchWeatherData() {
  weatherFetching = true;
  try {
    const res = await fetch('/api/weather');
    if (!res.ok) throw new Error('Failed to fetch');
    weatherData = await res.json();
    renderWeatherModal(weatherData);
  } catch (err) {
    document.getElementById('weatherModalBody').innerHTML =
      '<div class="wx-no-data">Unable to load conditions. Please try again later.</div>';
  } finally {
    weatherFetching = false;
  }
}

function renderWeatherModal(data) {
  const body = document.getElementById('weatherModalBody');
  let html = '';

  // ── Alerts ──
  if (data.alerts && data.alerts.length) {
    html += '<div class="wx-section">';
    html += '<div class="wx-section-title">Active Alerts</div>';
    data.alerts.forEach(a => {
      html += `<div class="wx-alert">
        <div class="wx-alert-event">${esc(a.event)}</div>
        <div class="wx-alert-headline">${esc(a.headline || '')}</div>
        ${a.description ? `<div class="wx-alert-details">${esc(a.description).substring(0, 500)}</div>` : ''}
      </div>`;
    });
    html += '</div>';
  }

  // ── Wind ──
  if (data.wind) {
    const w = data.wind;
    const arrowDeg = w.direction != null ? (w.direction + 180) % 360 : 0;
    html += '<div class="wx-section">';
    html += '<div class="wx-section-title">Wind</div>';
    html += `<div class="wx-wind-card">
      <div class="wx-wind-compass">
        <svg class="wx-wind-arrow" style="transform:rotate(${arrowDeg}deg)" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L6 18h12L12 2z"/>
        </svg>
      </div>
      <div class="wx-wind-info">
        <div class="wx-wind-speed">${w.speed}<small> kt</small>${w.gust ? ` <span style="font-size:0.78rem;color:var(--color-text-mid);font-weight:500">gusting ${w.gust} kt</span>` : ''}</div>
        <div class="wx-wind-detail">From the ${w.directionCompass || '—'} (${w.direction != null ? w.direction + '°' : '—'})</div>
        <div class="wx-wind-station">NOAA ${esc(w.station)} Station</div>
      </div>
    </div>`;

    // Pressure + air temp row
    const chips = [];
    if (w.pressure != null) {
      chips.push(`<div class="wx-condition-chip"><div class="wx-condition-value">${w.pressure}"</div><div class="wx-condition-label">Barometer</div></div>`);
    } else if (data.pressure) {
      chips.push(`<div class="wx-condition-chip"><div class="wx-condition-value">${data.pressure.pressure}"</div><div class="wx-condition-label">Barometer</div></div>`);
    }
    if (w.airTemp != null) {
      chips.push(`<div class="wx-condition-chip"><div class="wx-condition-value">${w.airTemp}°F</div><div class="wx-condition-label">Air Temp</div></div>`);
    }
    if (data.waterTemp) {
      chips.push(`<div class="wx-condition-chip"><div class="wx-condition-value">${data.waterTemp.tempF}°F</div><div class="wx-condition-label">Water Temp</div></div>`);
    }
    if (chips.length) {
      html += `<div class="wx-conditions-row">${chips.join('')}</div>`;
    }
    html += '</div>';
  } else {
    // Still show water temp if no wind
    if (data.waterTemp) {
      html += '<div class="wx-section">';
      html += '<div class="wx-section-title">Conditions</div>';
      html += `<div class="wx-conditions-row">
        <div class="wx-condition-chip"><div class="wx-condition-value">${data.waterTemp.tempF}°F</div><div class="wx-condition-label">Water Temp</div></div>
      </div>`;
      html += '</div>';
    }
  }

  // ── Tides ──
  if (data.tides && data.tides.length) {
    html += '<div class="wx-section">';
    html += '<div class="wx-section-title">Tides — Friday Harbor</div>';
    html += '<div class="wx-tides">';
    data.tides.forEach(t => {
      const timeStr = formatTideTime(t.time);
      const typeClass = t.type === 'High' ? 'high' : 'low';
      html += `<div class="wx-tide">
        <div class="wx-tide-type ${typeClass}">${t.type}</div>
        <div class="wx-tide-height">${t.height.toFixed(1)}<small> ft</small></div>
        <div class="wx-tide-time">${timeStr}</div>
      </div>`;
    });
    html += '</div>';
    html += '<div class="wx-tide-station">NOAA Station #9449880 — Datum: MLLW</div>';
    html += '</div>';
  }

  // ── Marine Forecast ──
  if (data.forecast && data.forecast.length) {
    html += '<div class="wx-section">';
    html += '<div class="wx-section-title">Marine Forecast — NWS Zone PZZ135</div>';
    data.forecast.forEach(p => {
      html += `<div class="wx-forecast-period">
        <div class="wx-forecast-name">${esc(p.name)}</div>
        <div class="wx-forecast-text">${esc(p.forecast)}</div>
      </div>`;
    });
    html += '</div>';
  }

  body.innerHTML = html;

  // Update timestamp
  if (data.fetchedAt) {
    const d = new Date(data.fetchedAt);
    document.getElementById('weatherUpdatedAt').textContent =
      'Updated ' + d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }
}

function formatTideTime(timeStr) {
  // timeStr like "2024-05-11 06:32"
  const parts = timeStr.split(' ');
  if (parts.length < 2) return timeStr;
  const [h, m] = parts[1].split(':');
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${h12}:${m} ${ampm}`;
}

function esc(str) {
  const el = document.createElement('span');
  el.textContent = str;
  return el.innerHTML;
}

// ========== SEARCH ==========
let searchIndex = null;

const SEARCH_TYPE_LABELS = {
  marinas: 'Marina',
  dining: 'Dining',
  trails: 'Trail',
  'marine-parks': 'Marine Park',
  farms: 'Farm',
  culture: 'Culture',
  island: 'Island'
};

function buildSearchIndex() {
  const ix = [];
  const seen = new Set();
  // Some places are cross-listed (e.g. shellfish farms in both Dining and
  // Farms) — first occurrence wins so search shows each place once
  const add = (type, item, sub) => {
    const key = item.name.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    ix.push({
      type: type,
      id: item.id,
      name: item.name,
      sub: sub || '',
      hay: (item.name + ' ' + (sub || '') + ' ' + (item.description || item.details || '')).toLowerCase()
    });
  };
  MARINAS.forEach(m => add('marinas', m, [m.type, m.area].filter(Boolean).join(' · ')));
  DINING.forEach(d => add('dining', d, [d.cuisine, d.area].filter(Boolean).join(' · ')));
  TRAILS.forEach(t => add('trails', t, [t.difficulty, t.area].filter(Boolean).join(' · ')));
  MARINE_PARKS.forEach(p => add('marine-parks', p, p.area));
  FARMS.forEach(f => add('farms', f, [f.type, f.area].filter(Boolean).join(' · ')));
  GALLERIES.forEach(g => add('culture', g, g.area));
  ISLANDS.forEach(i => ix.push({
    type: 'island', id: i.id, name: i.name, sub: i.tagline,
    hay: (i.name + ' ' + i.tagline + ' ' + i.description).toLowerCase()
  }));
  return ix;
}

function initSearch() {
  const overlay = document.getElementById('searchOverlay');
  const input = document.getElementById('searchInput');
  if (!overlay || !input) return;

  input.addEventListener('input', () => runSearch(input.value));
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const first = document.querySelector('#searchResults .search-result');
      if (first) first.click();
    }
  });
  document.getElementById('searchClose').addEventListener('click', closeSearch);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeSearch();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('active')) closeSearch();
  });
}

function openSearch() {
  if (!searchIndex) searchIndex = buildSearchIndex();
  const overlay = document.getElementById('searchOverlay');
  const input = document.getElementById('searchInput');
  document.body.style.overflow = 'hidden';
  overlay.classList.add('active');
  input.value = '';
  runSearch('');
  setTimeout(() => input.focus(), 50);
  track('search_open');
}

function closeSearch() {
  const overlay = document.getElementById('searchOverlay');
  overlay.classList.remove('active');
  document.body.style.overflow = '';
}

function runSearch(q) {
  const results = document.getElementById('searchResults');
  q = q.trim().toLowerCase();
  if (q.length < 2) {
    results.innerHTML = '<div class="search-hint">Search everything in the guide — marinas, dining, trails, parks, farms, galleries, islands.</div>';
    return;
  }
  const scored = [];
  searchIndex.forEach(e => {
    const nameLower = e.name.toLowerCase();
    let score = -1;
    if (nameLower.startsWith(q)) score = 0;
    else if (nameLower.includes(q)) score = 1;
    else if (e.hay.includes(q)) score = 2;
    if (score >= 0) scored.push({ e, score });
  });
  scored.sort((a, b) => a.score - b.score || a.e.name.localeCompare(b.e.name));
  const top = scored.slice(0, 20);

  if (!top.length) {
    results.innerHTML = '<div class="search-hint">No matches for &ldquo;' + esc(q) + '&rdquo;.</div>';
    return;
  }
  results.innerHTML = top.map(({ e }) => {
    const href = e.type === 'island' ? '/islands/' + e.id : '/' + e.type + '/' + e.id;
    return `
      <a class="search-result" href="${href}" onclick="return selectSearchResult(event, '${e.type}', '${e.id}')">
        <span class="search-result-type">${SEARCH_TYPE_LABELS[e.type] || ''}</span>
        <span class="search-result-name">${esc(e.name)}</span>
        <span class="search-result-sub">${esc(e.sub)}</span>
      </a>`;
  }).join('');
}

function selectSearchResult(e, type, id) {
  if (e && (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1)) return true;
  if (e) e.preventDefault();
  closeSearch();
  track('search_select', { result_type: type, result_id: id });
  if (type === 'island') {
    switchTab('islands');
    showIslandDetail(id);
  } else {
    openModalFor(type, id);
  }
  return false;
}

// ========== SERVICE WORKER ==========
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

// ========== WELCOME MODAL ==========
function initWelcomeModal() {
  if (localStorage.getItem('sji-welcomed')) return;
  // Deep-link landings go straight to the listing they came for
  if (isModalOpen()) return;
  const overlay = document.getElementById('welcomeOverlay');
  if (!overlay) return;

  setTimeout(() => overlay.classList.add('active'), 500);

  function dismiss() {
    overlay.classList.remove('active');
    localStorage.setItem('sji-welcomed', '1');
  }

  document.getElementById('welcomeStart').addEventListener('click', dismiss);
  document.getElementById('welcomeClose').addEventListener('click', dismiss);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) dismiss();
  });

  // Fetch weather summary for welcome modal
  fetchWelcomeWeather();
}

async function fetchWelcomeWeather() {
  const container = document.getElementById('welcomeWeather');
  if (!container) return;
  try {
    const res = await fetch('/api/weather');
    if (!res.ok) throw new Error();
    const data = await res.json();

    const parts = [];
    if (data.wind && data.wind.speed != null) {
      let wind = data.wind.speed + ' kt';
      if (data.wind.directionCompass) wind = data.wind.directionCompass + ' ' + wind;
      if (data.wind.gust) wind += ', gusts ' + data.wind.gust + ' kt';
      parts.push(wind);
    }
    if (data.waterTemp && data.waterTemp.tempF != null) {
      parts.push('Water ' + Math.round(data.waterTemp.tempF) + '°F');
    }
    if (data.wind && data.wind.airTemp != null) {
      parts.push('Air ' + Math.round(data.wind.airTemp) + '°F');
    }

    if (parts.length) {
      container.innerHTML = `
        <div class="welcome-weather-summary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"/></svg>
          <span><strong>Current conditions:</strong> ${parts.join(' · ')}</span>
        </div>`;
    } else {
      container.style.display = 'none';
    }
  } catch {
    container.style.display = 'none';
  }
}


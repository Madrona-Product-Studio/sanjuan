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

// ========== INITIALIZATION ==========
document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initMap();
  initMapCard();
  renderIslands();
  renderMarineParks();
  renderDining();
  renderTrails();
  renderFarms();
  renderCulture();
  renderLogistics();
  initModal();
});

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

function openModal(item) {
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

function closeModal() {
  const overlay = document.getElementById('detailModalOverlay');
  overlay.classList.remove('active');
  document.body.style.overflow = '';
  // Reset photo state for next open
  const photosEl = document.getElementById('modalPhotos');
  if (photosEl) photosEl.classList.remove('loaded');
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

function switchTab(tab) {
  activeTab = tab;
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelector(`.tab-btn[data-tab="${tab}"]`).classList.add('active');
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.getElementById(`panel-${tab}`).classList.add('active');
  if (tab === 'map' && map) {
    setTimeout(() => map.invalidateSize(), 100);
  }
  // Hide feedback button on map tab to avoid overlapping map controls
  const fbBtn = document.getElementById('mps-fb-btn');
  if (fbBtn) fbBtn.style.setProperty('display', tab === 'map' ? 'none' : 'flex', 'important');
  if (tab === 'islands') {
    hideIslandDetail();
  }
}

// ========== MAP ==========
function initMap() {
  // Compute bounds from markers, then constrain the map to this region
  const markerBounds = L.latLngBounds(MARINAS.map(m => [m.lat, m.lng]));
  // Pad the bounds so you can pan a bit beyond the outermost markers
  const maxBounds = markerBounds.pad(0.5);

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

  // Fit map to show all markers with padding
  map.fitBounds(markerBounds, { padding: [30, 30] });
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
      showMapCard(marina, cat);
    });

    if (window.innerWidth >= 768) {
      marker.on('mouseover', function () { this.setRadius(10); this.setStyle({ fillOpacity: 1, weight: 3 }); });
      marker.on('mouseout', function () { this.setRadius(baseRadius); this.setStyle({ fillOpacity: 0.85, weight: 2.5 }); });
    }

    markers.push(marker);
  });
}


let currentMarinaId = null;
let currentMarinaData = null;

function showMapCard(marina, cat) {
  const card = document.getElementById('mapCard');
  const nameEl = document.getElementById('mapCardName');
  const metaEl = document.getElementById('mapCardMeta');
  const photoEl = document.getElementById('mapCardPhoto');

  // If same marina tapped while visible, hide
  if (currentMarinaId === marina.id && card.classList.contains('visible')) {
    hideMapCard();
    return;
  }

  currentMarinaId = marina.id;
  currentMarinaData = { marina, cat };

  nameEl.textContent = marina.name;
  metaEl.innerHTML = `
    <span class="category-badge" style="background:${cat.color}">${cat.label}</span>
    ${marina.area || ''}
  `;

  // Placeholder tint until photo loads
  photoEl.style.backgroundImage = '';
  photoEl.style.backgroundColor = cat.color + '22';

  card.classList.add('visible');

  // Fetch photo from Places API
  fetchPlaceData(marina.name, marina.area).then(places => {
    if (currentMarinaId !== marina.id) return;
    if (places && places.photos && places.photos.length > 0) {
      photoEl.style.backgroundImage = `url(${places.photos[0]})`;
    }
  }).catch(() => {});
}

function hideMapCard() {
  const card = document.getElementById('mapCard');
  card.classList.remove('visible');
  currentMarinaId = null;
  currentMarinaData = null;
}

function initMapCard() {
  const card = document.getElementById('mapCard');
  const closeBtn = document.getElementById('mapCardClose');

  closeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    hideMapCard();
  });

  // Tapping card opens full detail modal
  card.addEventListener('click', () => {
    if (!currentMarinaData) return;
    const item = marinaToModalItem(currentMarinaData.marina);
    openModal(item);
  });
}

// ========== ISLANDS ==========
function renderIslands() {
  const grid = document.getElementById('islandGrid');
  grid.innerHTML = ISLANDS.map(island => `
    <div class="island-card" onclick="showIslandDetail('${island.id}')">
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
    </div>
  `).join('');
}

function showIslandDetail(islandId) {
  const island = ISLANDS.find(i => i.id === islandId);
  if (!island) return;

  activeIsland = islandId;
  document.getElementById('islandGrid').style.display = 'none';
  document.querySelector('#panel-islands .section-header').style.display = 'none';

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
        <div class="activity-card modal-trigger" onclick="openModal(marinaToModalItem(MARINAS.find(x => x.id === '${m.id}')))">
          <h4>${m.name}</h4>
          <div class="meta">
            <span style="color:${cat.color};font-weight:600">${cat.label}</span>
            ${m.vhf ? '<span>VHF ' + m.vhf + '</span>' : ''}
            ${m.fuel ? '<span>Fuel</span>' : ''}
          </div>
          <p>${m.details.substring(0, 100)}${m.details.length > 100 ? '...' : ''}</p>
        </div>
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
      <div class="activity-card gallery-card" onclick="openModal(galleryToModalItem(GALLERIES.find(x => x.id === '${g.id}')))">
        <h4>${g.name}</h4>
        <div class="meta"><span>${g.area}</span>${g.walkFromDock ? '<span>' + g.walkFromDock + ' from dock</span>' : ''}</div>
        <p>${g.description}</p>
      </div>
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

function hideIslandDetail() {
  activeIsland = null;
  document.getElementById('islandDetail').classList.remove('active');
  document.getElementById('islandDetail').innerHTML = '';
  document.getElementById('islandGrid').style.display = '';
  document.querySelector('#panel-islands .section-header').style.display = '';
}

// ========== SHARED CARD RENDERERS ==========
function renderDiningCard(d) {
  return `
    <div class="activity-card modal-trigger" onclick="openModal(diningToModalItem(DINING.find(x => x.id === '${d.id}')))">
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
    </div>
  `;
}

function renderTrailCard(t) {
  return `
    <div class="activity-card modal-trigger" onclick="openModal(trailToModalItem(TRAILS.find(x => x.id === '${t.id}')))">
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
    </div>
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
    <div class="activity-card modal-trigger" onclick="openModal(marineParksToModalItem(MARINE_PARKS.find(x => x.id === '${p.id}')))">
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
    </div>
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
    <div class="activity-card modal-trigger" onclick="openModal(farmToModalItem(FARMS.find(x => x.id === '${f.id}')))">
      <div class="card-top-row">
        <h4>${f.name}</h4>
        <span class="difficulty-pill" style="background:var(--color-surface-cool);color:var(--color-text-mid)">${f.type}</span>
      </div>
      <div class="meta">
        <span>${f.area}</span>
        ${f.hours ? '<span>' + f.hours + '</span>' : ''}
      </div>
      <p>${f.description}</p>
    </div>
  `);

  // Cross-listed dining entries with producer: true
  const producers = DINING.filter(d => d.producer);
  items = items.concat(producers.map(d => `
    <div class="activity-card modal-trigger" onclick="openModal(diningToModalItem(DINING.find(x => x.id === '${d.id}')))">
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
    </div>
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
    <div class="activity-card modal-trigger" onclick="openModal(galleryToModalItem(GALLERIES.find(x => x.id === '${g.id}')))">
      <h4>${g.name}</h4>
      <div class="meta">
        <span>${g.type ? g.type.replace('_', ' ') : 'gallery'}</span>
        <span>${g.area}</span>
        ${g.walkFromDock ? '<span>' + g.walkFromDock + ' from dock</span>' : ''}
      </div>
      <p>${g.description}</p>
    </div>
  `).join('');
}

// ========== LOGISTICS ==========
function renderLogistics() {
  // Static content rendered in HTML
}

// ========== MAP CLICK HANDLER ==========
document.addEventListener('click', (e) => {
  if (activeTab === 'map' && !e.target.closest('.map-card') && !e.target.closest('.leaflet-interactive')) {
    hideMapCard();
  }
});

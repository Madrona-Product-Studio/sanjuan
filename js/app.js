/**
 * San Juan Islands Discovery Guide — Main Application
 */

// ========== STATE ==========
let map = null;
let markers = [];
let activeTab = 'map';
let activeIsland = null; // for island detail view
let activeMapFilter = 'all';
let activeDiningFilter = 'all';
let activeTrailFilter = 'all';

// ========== INITIALIZATION ==========
document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initMap();
  renderIslands();
  renderDining();
  renderTrails();
  renderLogistics();
});

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
  // Update buttons
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelector(`.tab-btn[data-tab="${tab}"]`).classList.add('active');
  // Update panels
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.getElementById(`panel-${tab}`).classList.add('active');
  // Resize map if switching to it
  if (tab === 'map' && map) {
    setTimeout(() => map.invalidateSize(), 100);
  }
  // Reset island detail when switching to islands tab
  if (tab === 'islands') {
    hideIslandDetail();
  }
}

// ========== MAP ==========
function initMap() {
  map = L.map('map', {
    center: [48.58, -122.95],
    zoom: 10,
    zoomControl: true,
    touchZoom: true,
    scrollWheelZoom: true
  });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 18
  }).addTo(map);

  renderMapMarkers('all');
  initMapFilters();
}

function renderMapMarkers(filter) {
  // Clear existing
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
      showMapInfo(marina, cat);
    });

    if (window.innerWidth >= 768) {
      marker.on('mouseover', function () { this.setRadius(10); this.setStyle({ fillOpacity: 1, weight: 3 }); });
      marker.on('mouseout', function () { this.setRadius(baseRadius); this.setStyle({ fillOpacity: 0.85, weight: 2.5 }); });
    }

    markers.push(marker);
  });
}

function initMapFilters() {
  document.querySelectorAll('.map-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;

      if (filter === 'bellingham') {
        map.setView([48.65, -122.60], 11);
        return;
      }
      if (filter === 'main-islands') {
        map.setView([48.58, -122.95], 10);
        return;
      }
      if (filter === 'outer') {
        map.setView([48.74, -122.88], 11);
        return;
      }

      activeMapFilter = filter;
      document.querySelectorAll('.map-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderMapMarkers(filter);
      hideMapInfo();
    });
  });
}

function showMapInfo(marina, cat) {
  const panel = document.getElementById('mapInfoPanel');
  const body = panel.querySelector('.info-body');

  let html = `
    <h3>${marina.name}</h3>
    <div class="info-meta">
      <span class="category-badge" style="background:${cat.color}">${cat.label}</span>
      ${marina.area || ''}
      ${marina.vhf ? ' &middot; VHF ' + marina.vhf : ''}
    </div>
    <div class="info-details">${marina.details}</div>
  `;

  if (marina.rates) {
    html += `<div class="info-details" style="margin-top:6px"><strong>Rates:</strong> ${marina.rates}</div>`;
  }
  if (marina.amenities) {
    html += `<div class="info-details" style="margin-top:6px"><strong>Amenities:</strong> ${marina.amenities.join(', ')}</div>`;
  }
  if (marina.caution) {
    html += `<div class="info-caution">${marina.caution}</div>`;
  }

  body.innerHTML = html;
  panel.classList.add('show');
}

function hideMapInfo() {
  document.getElementById('mapInfoPanel').classList.remove('show');
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
        <div class="activity-card">
          <h4>${m.name}</h4>
          <div class="meta">
            <span style="color:${cat.color};font-weight:600">${cat.label}</span>
            ${m.vhf ? '<span>VHF ' + m.vhf + '</span>' : ''}
            ${m.fuel ? '<span>Fuel</span>' : ''}
          </div>
          <p>${m.details}</p>
          ${m.caution ? '<div class="info-caution" style="margin-top:8px">' + m.caution + '</div>' : ''}
        </div>
      `;
    }).join('');
    html += `</div></div>`;
  }

  if (islandDining.length) {
    html += `<div class="detail-section"><h3>Dining</h3><div class="activity-list">`;
    html += islandDining.map(d => `
      <div class="activity-card">
        <h4>${d.name}</h4>
        <div class="meta">
          <span>${d.cuisine}</span>
          <span>${d.price}</span>
          ${d.walkFromDock ? '<span>' + d.walkFromDock + ' from dock</span>' : ''}
        </div>
        <p>${d.description}</p>
      </div>
    `).join('');
    html += `</div></div>`;
  }

  if (islandTrails.length) {
    html += `<div class="detail-section"><h3>Trails & Hiking</h3><div class="activity-list">`;
    html += islandTrails.map(t => `
      <div class="activity-card">
        <h4>${t.name}</h4>
        <div class="meta">
          <span>${t.difficulty}</span>
          <span>${t.distance}</span>
          ${t.elevGain ? '<span>' + t.elevGain + ' gain</span>' : ''}
          ${t.discoverPass ? '<span style="color:#e65100">Discover Pass</span>' : ''}
        </div>
        <p>${t.description}</p>
      </div>
    `).join('');
    html += `</div></div>`;
  }

  if (islandGalleries.length) {
    html += `<div class="detail-section"><h3>Art & Galleries</h3><div class="activity-list">`;
    html += islandGalleries.map(g => `
      <div class="activity-card">
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
      <div class="activity-card">
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
  container.innerHTML = items.map(d => `
    <div class="activity-card">
      <h4>${d.name}</h4>
      <div class="meta">
        <span>${d.cuisine}</span>
        <span>${d.price}</span>
        <span>${d.area}</span>
        ${d.walkFromDock ? '<span>' + d.walkFromDock + ' from dock</span>' : ''}
      </div>
      <p>${d.description}</p>
      ${d.hours ? '<div class="meta" style="margin-top:4px"><span>' + d.hours + '</span></div>' : ''}
    </div>
  `).join('');
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
  container.innerHTML = items.map(t => `
    <div class="activity-card">
      <h4>${t.name}</h4>
      <div class="meta">
        <span style="font-weight:600;color:${difficultyColor(t.difficulty)}">${t.difficulty}</span>
        <span>${t.distance}</span>
        ${t.elevGain ? '<span>' + t.elevGain + '</span>' : ''}
        <span>${t.area}</span>
        ${t.discoverPass ? '<span style="color:#e65100;font-weight:600">Discover Pass Required</span>' : ''}
      </div>
      <p>${t.description}</p>
    </div>
  `).join('');
}

function difficultyColor(d) {
  if (d.includes('Difficult')) return '#b44340';
  if (d.includes('Moderate')) return '#c8956c';
  return '#3d8b6e';
}

// ========== LOGISTICS ==========
function renderLogistics() {
  // Static content rendered in HTML, nothing dynamic needed for v1
}

// ========== MAP CLICK HANDLER ==========
document.addEventListener('click', (e) => {
  if (activeTab === 'map' && !e.target.closest('.map-info-panel') && !e.target.closest('.leaflet-interactive')) {
    hideMapInfo();
  }
});

#!/usr/bin/env node
/**
 * Static site generator for SEO.
 * Reads data files, generates pre-rendered HTML pages per route.
 */

import { readFileSync, writeFileSync, mkdirSync, cpSync, existsSync, rmSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import vm from 'vm';
import { ROUTE_META, islandMeta, itemMeta, itemJsonLd, generateJsonLd, BASE_URL } from './seo.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DIST = join(ROOT, 'dist');

// ===== LOAD DATA =====
function loadDataFile(filename) {
  let code = readFileSync(join(ROOT, 'data', filename), 'utf-8');
  // Convert const/let to var so vm.runInNewContext exposes them on the context object
  code = code.replace(/^(const|let)\s+/gm, 'var ');
  const ctx = {};
  vm.runInNewContext(code, ctx);
  return ctx;
}

const { ISLANDS } = loadDataFile('islands.js');
const { MARINAS, MARINA_CATEGORIES } = loadDataFile('marinas.js');
const { DINING, TRAILS, GALLERIES, WELLNESS } = loadDataFile('activities.js');
const { MARINE_PARKS } = loadDataFile('marine-parks.js');
const { FARMS } = loadDataFile('farms.js');

const allData = { ISLANDS, MARINAS, MARINA_CATEGORIES, DINING, TRAILS, GALLERIES, WELLNESS, MARINE_PARKS, FARMS };

// ===== CARD RENDERERS (mirror app.js logic) =====

function difficultyColor(d) {
  if (d.includes('Difficult')) return '#b44340';
  if (d.includes('Moderate')) return '#c8956c';
  return '#3d8b6e';
}

function renderIslandCard(island) {
  return `
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
    </a>`;
}

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
    </a>`;
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
    </a>`;
}

function renderMarineParkCard(p) {
  return `
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
    </a>`;
}

function renderFarmCard(f) {
  return `
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
    </a>`;
}

function renderProducerDiningCard(d) {
  return `
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
    </a>`;
}

function renderCultureCard(g) {
  return `
    <a class="activity-card modal-trigger" href="/culture/${g.id}" onclick="return openItem(event, 'culture', '${g.id}')">
      <h4>${g.name}</h4>
      <div class="meta">
        <span>${g.type ? g.type.replace('_', ' ') : 'gallery'}</span>
        <span>${g.area}</span>
        ${g.walkFromDock ? '<span>' + g.walkFromDock + ' from dock</span>' : ''}
      </div>
      <p>${g.description}</p>
    </a>`;
}

function renderIslandDetail(island) {
  const islandMarinas = MARINAS.filter(m => m.island === island.id);
  const islandDining = DINING.filter(d => d.island === island.id);
  const islandTrails = TRAILS.filter(t => t.island === island.id);
  const islandGalleries = GALLERIES.filter(g => g.island === island.id);
  const islandWellness = WELLNESS.filter(w => w.island === island.id);

  let html = `
    <div class="island-detail-header">
      <button class="back-btn" onclick="hideIslandDetail()">&larr; All Islands</button>
      <h2>${island.name}</h2>
      <div class="tagline">${island.tagline}</div>
    </div>
    <p style="margin-bottom:20px;color:var(--color-text-light);font-size:0.9rem">${island.description}</p>`;

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
        </a>`;
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
      </a>`).join('');
    html += `</div></div>`;
  }

  if (islandWellness.length) {
    html += `<div class="detail-section"><h3>Wellness & Yoga</h3><div class="activity-list">`;
    html += islandWellness.map(w => `
      <div class="activity-card wellness-card">
        <h4>${w.name}</h4>
        <div class="meta"><span>${w.area}</span></div>
        <p>${w.description}</p>
      </div>`).join('');
    html += `</div></div>`;
  }

  return html;
}

// ===== GRID CONTENT PER TAB =====
const TAB_CONTENT = {
  islands: () => ({ gridId: 'islandGrid', html: ISLANDS.map(renderIslandCard).join('') }),
  dining: () => ({ gridId: 'diningGrid', html: DINING.map(renderDiningCard).join('') }),
  trails: () => ({ gridId: 'trailsGrid', html: TRAILS.map(renderTrailCard).join('') }),
  'marine-parks': () => ({ gridId: 'marineParksGrid', html: MARINE_PARKS.map(renderMarineParkCard).join('') }),
  farms: () => ({
    gridId: 'farmsGrid',
    html: FARMS.map(renderFarmCard).join('') + DINING.filter(d => d.producer).map(renderProducerDiningCard).join('')
  }),
  culture: () => ({ gridId: 'cultureGrid', html: GALLERIES.map(renderCultureCard).join('') }),
};

// ===== HTML TRANSFORMS =====

function transformPage(template, route, meta, jsonLd) {
  let html = template;

  // Title
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${meta.title}</title>`);

  // Meta description
  html = html.replace(
    /(<meta name="description" content=")[^"]*(")/,
    `$1${meta.description}$2`
  );

  // Canonical
  html = html.replace(
    /(<link rel="canonical" href=")[^"]*(")/,
    `$1${BASE_URL}${route === '/' ? '' : route}$2`
  );

  // OG tags
  html = html.replace(
    /(<meta property="og:title" content=")[^"]*(")/,
    `$1${meta.title}$2`
  );
  html = html.replace(
    /(<meta property="og:description" content=")[^"]*(")/,
    `$1${meta.description}$2`
  );
  html = html.replace(
    /(<meta name="twitter:title" content=")[^"]*(")/,
    `$1${meta.title}$2`
  );
  html = html.replace(
    /(<meta name="twitter:description" content=")[^"]*(")/,
    `$1${meta.description}$2`
  );

  // Inject JSON-LD before </head>
  if (jsonLd) {
    const ldScript = `  <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>\n`;
    html = html.replace('</head>', ldScript + '</head>');
  }

  return html;
}

function setActiveTab(html, tab) {
  // Set active tab button
  html = html.replace(
    /(<button class="tab-btn) active(" data-tab="map">)/,
    '$1$2'
  );
  if (tab !== 'map') {
    html = html.replace(
      new RegExp(`(<button class="tab-btn)(" data-tab="${tab}">)`),
      '$1 active$2'
    );
  }

  // Set active panel
  html = html.replace(
    /(<section id="panel-map" class="tab-panel) active(">)/,
    '$1$2'
  );
  if (tab !== 'map') {
    html = html.replace(
      new RegExp(`(<section id="panel-${tab}" class="tab-panel)(">)`),
      '$1 active$2'
    );
  }

  return html;
}

function injectGridContent(html, gridId, content) {
  const pattern = new RegExp(`(<div class="[^"]*" id="${gridId}">)(</div>)`);
  return html.replace(pattern, `$1${content}$2`);
}

function injectIslandDetail(html, island) {
  const detailHtml = renderIslandDetail(island);
  // Hide grid and section header, show detail
  html = html.replace(
    '<div class="island-grid" id="islandGrid">',
    '<div class="island-grid" id="islandGrid" style="display:none">'
  );
  html = html.replace(
    /<div class="section-header">\s*<h2>Explore the Islands<\/h2>/,
    '<div class="section-header" style="display:none"><h2>Explore the Islands</h2>'
  );
  html = html.replace(
    '<div class="island-detail" id="islandDetail">',
    `<div class="island-detail active" id="islandDetail">${detailHtml}`
  );
  return html;
}

// ===== BUILD ALL ROUTES =====

function build() {
  const template = readFileSync(join(ROOT, 'index.html'), 'utf-8');
  const routes = [];

  // Clean and create dist
  if (existsSync(DIST)) {
    rmSync(DIST, { recursive: true, force: true });
  }
  mkdirSync(DIST, { recursive: true });

  // --- Homepage (map) ---
  {
    const meta = ROUTE_META['/'];
    const jsonLd = generateJsonLd('/', allData);
    let page = transformPage(template, '/', meta, jsonLd);
    // Pre-render all grids so crawlers see content even on homepage
    for (const [tab, gen] of Object.entries(TAB_CONTENT)) {
      const { gridId, html: gridHtml } = gen();
      page = injectGridContent(page, gridId, gridHtml);
    }
    writeFile(join(DIST, 'index.html'), page);
    routes.push({ path: '/', ...meta });
  }

  // --- Section pages ---
  for (const [route, meta] of Object.entries(ROUTE_META)) {
    if (route === '/') continue;
    const tab = route.slice(1); // e.g. 'dining'
    const jsonLd = generateJsonLd(route, allData);
    let page = transformPage(template, route, meta, jsonLd);
    page = setActiveTab(page, tab);
    // Pre-render all grids
    for (const [t, gen] of Object.entries(TAB_CONTENT)) {
      const { gridId, html: gridHtml } = gen();
      page = injectGridContent(page, gridId, gridHtml);
    }
    const dir = join(DIST, tab);
    mkdirSync(dir, { recursive: true });
    writeFile(join(dir, 'index.html'), page);
    routes.push({ path: route, ...meta });
  }

  // --- Island detail pages ---
  for (const island of ISLANDS) {
    const route = `/islands/${island.id}`;
    const meta = islandMeta(island);
    const jsonLd = generateJsonLd(route, { ...allData, _island: island });
    let page = transformPage(template, route, meta, jsonLd);
    page = setActiveTab(page, 'islands');
    // Pre-render all grids
    for (const [t, gen] of Object.entries(TAB_CONTENT)) {
      const { gridId, html: gridHtml } = gen();
      page = injectGridContent(page, gridId, gridHtml);
    }
    page = injectIslandDetail(page, island);
    const dir = join(DIST, 'islands', island.id);
    mkdirSync(dir, { recursive: true });
    writeFile(join(dir, 'index.html'), page);
    routes.push({ path: route, ...meta });
  }

  // --- Listing detail pages (deep-linkable modals) ---
  const ITEM_ROUTES = {
    marinas:        { list: MARINAS,      tab: 'map' },
    dining:         { list: DINING,       tab: 'dining' },
    trails:         { list: TRAILS,       tab: 'trails' },
    'marine-parks': { list: MARINE_PARKS, tab: 'marine-parks' },
    farms:          { list: FARMS,        tab: 'farms' },
    culture:        { list: GALLERIES,    tab: 'culture' }
  };
  for (const [type, cfg] of Object.entries(ITEM_ROUTES)) {
    for (const item of cfg.list) {
      const route = `/${type}/${item.id}`;
      const meta = itemMeta(type, item);
      const jsonLd = itemJsonLd(type, item);
      let page = transformPage(template, route, meta, jsonLd);
      if (cfg.tab !== 'map') page = setActiveTab(page, cfg.tab);
      for (const [t, gen] of Object.entries(TAB_CONTENT)) {
        const { gridId, html: gridHtml } = gen();
        page = injectGridContent(page, gridId, gridHtml);
      }
      const dir = join(DIST, type, item.id);
      mkdirSync(dir, { recursive: true });
      writeFile(join(dir, 'index.html'), page);
      routes.push({ path: route, ...meta });
    }
  }

  // --- Copy static assets ---
  const assetDirs = ['css', 'js', 'data', 'images'];
  for (const dir of assetDirs) {
    const src = join(ROOT, dir);
    if (existsSync(src)) {
      cpSync(src, join(DIST, dir), { recursive: true });
    }
  }
  // Copy root files
  for (const file of ['favicon.svg', 'og-image.png', 'og-image.svg', 'robots.txt', 'sw.js', 'manifest.webmanifest']) {
    const src = join(ROOT, file);
    if (existsSync(src)) {
      cpSync(src, join(DIST, file));
    }
  }

  // --- Generate sitemap ---
  generateSitemap(routes);

  console.log(`Built ${routes.length} pages to dist/`);
}

function writeFile(path, content) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content, 'utf-8');
}

function generateSitemap(routes) {
  const today = new Date().toISOString().split('T')[0];
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  for (const r of routes) {
    xml += `  <url>\n`;
    xml += `    <loc>${BASE_URL}${r.path}</loc>\n`;
    xml += `    <lastmod>${today}</lastmod>\n`;
    xml += `    <changefreq>${r.changefreq || 'weekly'}</changefreq>\n`;
    xml += `    <priority>${r.priority || 0.5}</priority>\n`;
    xml += `  </url>\n`;
  }
  xml += '</urlset>\n';
  writeFileSync(join(DIST, 'sitemap.xml'), xml, 'utf-8');
}

// ===== RUN =====
build();

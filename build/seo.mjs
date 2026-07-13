/**
 * SEO metadata and JSON-LD generators for each route.
 */

const BASE_URL = 'https://sjiboating.com';

export const ROUTE_META = {
  '/': {
    title: 'San Juan Islands Boating Guide',
    description: 'Anchorages, marinas, and local knowledge for cruising the San Juan Islands.',
    priority: 1.0,
    changefreq: 'weekly'
  },
  '/islands': {
    title: 'Islands — San Juan Islands Boating Guide',
    description: 'Seven islands spanning walkable harbor towns to wilderness marine parks in the San Juan archipelago.',
    priority: 0.9,
    changefreq: 'monthly'
  },
  '/dining': {
    title: 'Dining — San Juan Islands Boating Guide',
    description: 'From dockside fish & chips to James Beard-nominated kitchens across the San Juan Islands.',
    priority: 0.8,
    changefreq: 'monthly'
  },
  '/trails': {
    title: 'Trails & Hiking — San Juan Islands Boating Guide',
    description: 'From easy waterfront strolls to 2,400-foot summit climbs across the San Juan Islands.',
    priority: 0.8,
    changefreq: 'monthly'
  },
  '/marine-parks': {
    title: 'Marine Parks — San Juan Islands Boating Guide',
    description: 'Boat-access destinations worth planning a trip around in the San Juan Islands.',
    priority: 0.8,
    changefreq: 'monthly'
  },
  '/farms': {
    title: 'Farms & Producers — San Juan Islands Boating Guide',
    description: 'Lavender fields, shellfish farms, distilleries, and tasting rooms in the San Juan Islands.',
    priority: 0.7,
    changefreq: 'monthly'
  },
  '/culture': {
    title: 'Galleries & Culture — San Juan Islands Boating Guide',
    description: 'Art, books, and creative spaces across the San Juan Islands.',
    priority: 0.7,
    changefreq: 'monthly'
  },
  '/logistics': {
    title: 'Cruising Logistics — San Juan Islands Boating Guide',
    description: 'Water taxis, ferries, fuel, customs, and getting around the San Juan Islands.',
    priority: 0.7,
    changefreq: 'monthly'
  },
  '/about': {
    title: 'About — San Juan Islands Boating Guide',
    description: 'A hand-curated boating guide to the San Juan Islands, written from the dock across three summers of cruising.',
    priority: 0.5,
    changefreq: 'yearly'
  }
};

/** Generate listing detail route metadata */
export function itemMeta(type, item) {
  const desc = (item.description || item.details || '').substring(0, 155);
  return {
    title: `${item.name} — San Juan Islands Boating Guide`,
    description: desc,
    priority: 0.6,
    changefreq: 'monthly'
  };
}

const ITEM_SCHEMA_TYPES = {
  marinas: 'Marina',
  dining: 'Restaurant',
  trails: 'Place',
  'marine-parks': 'Park',
  farms: 'LocalBusiness',
  culture: 'LocalBusiness'
};

/** Generate JSON-LD for a listing detail route */
export function itemJsonLd(type, item) {
  const ld = {
    '@context': 'https://schema.org',
    '@type': ITEM_SCHEMA_TYPES[type] || 'Place',
    name: item.name,
    description: item.description || item.details || '',
    address: {
      '@type': 'PostalAddress',
      addressLocality: item.area || item.name,
      addressRegion: 'WA',
      addressCountry: 'US'
    }
  };
  if (item.lat != null && item.lng != null) {
    ld.geo = { '@type': 'GeoCoordinates', latitude: item.lat, longitude: item.lng };
  }
  if (type === 'dining') {
    if (item.cuisine) ld.servesCuisine = item.cuisine;
    if (item.price) ld.priceRange = item.price;
  }
  return ld;
}

/** Generate island detail route metadata from data */
export function islandMeta(island) {
  return {
    title: `${island.name} — San Juan Islands Boating Guide`,
    description: island.description.substring(0, 155),
    priority: 0.8,
    changefreq: 'monthly'
  };
}

/** Generate JSON-LD for a route */
export function generateJsonLd(route, data) {
  if (route === '/') {
    return {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'San Juan Islands Boating Guide',
      url: BASE_URL,
      description: ROUTE_META['/'].description
    };
  }

  if (route === '/dining') {
    return {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: ROUTE_META['/dining'].title,
      description: ROUTE_META['/dining'].description,
      mainEntity: {
        '@type': 'ItemList',
        itemListElement: data.DINING.map((d, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          item: {
            '@type': 'Restaurant',
            name: d.name,
            description: d.description,
            servesCuisine: d.cuisine,
            priceRange: d.price,
            address: {
              '@type': 'PostalAddress',
              addressLocality: d.area,
              addressRegion: 'WA',
              addressCountry: 'US'
            }
          }
        }))
      }
    };
  }

  if (route === '/trails') {
    return {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: ROUTE_META['/trails'].title,
      description: ROUTE_META['/trails'].description,
      mainEntity: {
        '@type': 'ItemList',
        itemListElement: data.TRAILS.map((t, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          item: {
            '@type': 'Place',
            name: t.name,
            description: t.description,
            address: { '@type': 'PostalAddress', addressLocality: t.area, addressRegion: 'WA' }
          }
        }))
      }
    };
  }

  if (route === '/marine-parks') {
    return {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: ROUTE_META['/marine-parks'].title,
      description: ROUTE_META['/marine-parks'].description,
      mainEntity: {
        '@type': 'ItemList',
        itemListElement: data.MARINE_PARKS.map((p, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          item: {
            '@type': 'Park',
            name: p.name,
            description: p.description,
            address: { '@type': 'PostalAddress', addressLocality: p.area, addressRegion: 'WA' }
          }
        }))
      }
    };
  }

  if (route === '/islands') {
    return {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: ROUTE_META['/islands'].title,
      description: ROUTE_META['/islands'].description,
      mainEntity: {
        '@type': 'ItemList',
        itemListElement: data.ISLANDS.map((isl, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          item: {
            '@type': 'Place',
            name: isl.name,
            description: isl.description,
            geo: { '@type': 'GeoCoordinates', latitude: isl.center.lat, longitude: isl.center.lng }
          }
        }))
      }
    };
  }

  if (route === '/logistics') {
    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      name: ROUTE_META['/logistics'].title,
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Where can I get fuel in the San Juan Islands?',
          acceptedAnswer: { '@type': 'Answer', text: 'Gas and diesel available at Friday Harbor, Roche Harbor, Deer Harbor, Rosario, West Sound, and Lopez Islander Resort.' }
        },
        {
          '@type': 'Question',
          name: 'How do I clear customs in the San Juan Islands?',
          acceptedAnswer: { '@type': 'Answer', text: 'Use the CBP ROAM App before departing. Friday Harbor has a staffed customs dock. Roche Harbor has an unstaffed ROAM booth on G Dock. Vessels 30+ feet require a CBP User Fee Decal.' }
        },
        {
          '@type': 'Question',
          name: 'Are there water taxis in the San Juan Islands?',
          acceptedAnswer: { '@type': 'Answer', text: 'Island Express Charters from Anacortes serves the widest network. Outer Island Excursions operates from Orcas Island with daily service to Sucia. San Juan Safaris offers charter water taxi from Friday Harbor.' }
        }
      ]
    };
  }

  // Island detail pages
  if (route.startsWith('/islands/') && data._island) {
    const isl = data._island;
    return {
      '@context': 'https://schema.org',
      '@type': 'Place',
      name: isl.name,
      description: isl.description,
      geo: { '@type': 'GeoCoordinates', latitude: isl.center.lat, longitude: isl.center.lng },
      address: { '@type': 'PostalAddress', addressLocality: isl.name, addressRegion: 'WA', addressCountry: 'US' }
    };
  }

  return null;
}

export { BASE_URL };

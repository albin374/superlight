import React from 'react';
import { STATIC_CATALOG, getProductUrl } from './productUrl.js';

// Standard comprehensive Categories & Subcategories
export const ALL_CATEGORIES = [
  // 1. Wires & Cables
  { id: 'cat-wires', name: 'Wires & Cables', slug: 'wires-cables', path: '/wires-cables', isMain: true },
  { id: 'sub-bld-wires', name: 'Building Wires', slug: 'buliding-wires', path: '/wires-cables?sub=buliding-wires', parentName: 'Wires & Cables', isMain: false },
  { id: 'sub-flex-cables', name: 'Flexible Cables', slug: 'felxible-cables', path: '/wires-cables?sub=felxible-cables', parentName: 'Wires & Cables', isMain: false },
  { id: 'sub-rubber-cables', name: 'Rubber Cables', slug: 'rubber-cables', path: '/wires-cables?sub=rubber-cables', parentName: 'Wires & Cables', isMain: false },
  { id: 'sub-heat-cables', name: 'Heat Resistance Cable', slug: 'heat-resistance-cable', path: '/wires-cables?sub=heat-resistance-cable', parentName: 'Wires & Cables', isMain: false },
  { id: 'sub-ctrl-cables', name: 'Control Cables', slug: 'control-cables', path: '/wires-cables?sub=control-cables', parentName: 'Wires & Cables', isMain: false },
  { id: 'sub-knx-cables', name: 'KNX Cables & Fire Alarm Cables', slug: 'knx-cables-fire-alarm-cables', path: '/wires-cables?sub=knx-cables-fire-alarm-cables', parentName: 'Wires & Cables', isMain: false },
  { id: 'sub-net-cables', name: 'Network Cables', slug: 'network-cables', path: '/wires-cables?sub=network-cables', parentName: 'Wires & Cables', isMain: false },

  // 2. LED Lighting & Special Lamp
  { id: 'cat-lighting', name: 'LED Lighting & Special Lamp', slug: 'led-lighting-special-lamp', path: '/led-lighting-special-lamp', isMain: true },
  { id: 'sub-down-lights', name: 'Down Lights', slug: 'down-lights', path: '/led-lighting-special-lamp?sub=down-lights', parentName: 'LED Lighting & Special Lamp', isMain: false },
  { id: 'sub-panel-lights', name: 'Panel Lights', slug: 'panel-lights', path: '/led-lighting-special-lamp?sub=panel-lights', parentName: 'LED Lighting & Special Lamp', isMain: false },
  { id: 'sub-spot-lights', name: 'Spot Lights', slug: 'spot-lights', path: '/led-lighting-special-lamp?sub=spot-lights', parentName: 'LED Lighting & Special Lamp', isMain: false },
  { id: 'sub-track-lights', name: 'Track Lights', slug: 'track-lights', path: '/led-lighting-special-lamp?sub=track-lights', parentName: 'LED Lighting & Special Lamp', isMain: false },
  { id: 'sub-flood-lights', name: 'Flood Lights', slug: 'flood-lights', path: '/led-lighting-special-lamp?sub=flood-lights', parentName: 'LED Lighting & Special Lamp', isMain: false },
  { id: 'sub-street-lights', name: 'Street Lights', slug: 'street-lights', path: '/led-lighting-special-lamp?sub=street-lights', parentName: 'LED Lighting & Special Lamp', isMain: false },
  { id: 'sub-highbay-lights', name: 'High Bay Lights', slug: 'high-bay-lights', path: '/led-lighting-special-lamp?sub=high-bay-lights', parentName: 'LED Lighting & Special Lamp', isMain: false },
  { id: 'sub-outdoor-lights', name: 'Outdoor Lights', slug: 'outdoor-lights', path: '/led-lighting-special-lamp?sub=outdoor-lights', parentName: 'LED Lighting & Special Lamp', isMain: false },
  { id: 'sub-strip-lights', name: 'LED Strip Lights', slug: 'led-strip-lights', path: '/led-lighting-special-lamp?sub=led-strip-lights', parentName: 'LED Lighting & Special Lamp', isMain: false },

  // 3. Switches, Sockets & Electrical Accessories
  { id: 'cat-switches', name: 'Switches, Sockets & Electrical Accessories', slug: 'switches-sockets-electrical-accessories', path: '/switches-sockets-electrical-accessories', isMain: true },
  { id: 'sub-mk-switches', name: 'MK Switches', slug: 'mk-switches', path: '/switches-sockets-electrical-accessories?sub=mk-switches', parentName: 'Switches, Sockets & Electrical Accessories', isMain: false },
  { id: 'sub-wall-switches', name: 'Wall Switches & Dimmers', slug: 'wall-switches-dimmers', path: '/switches-sockets-electrical-accessories?sub=wall-switches-dimmers', parentName: 'Switches, Sockets & Electrical Accessories', isMain: false },
  { id: 'sub-power-sockets', name: 'Power Sockets & Outlets', slug: 'power-sockets-outlets', path: '/switches-sockets-electrical-accessories?sub=power-sockets-outlets', parentName: 'Switches, Sockets & Electrical Accessories', isMain: false },
  { id: 'sub-wp-sockets', name: 'Weatherproof Sockets & Boxes', slug: 'weatherproof-sockets-boxes', path: '/switches-sockets-electrical-accessories?sub=weatherproof-sockets-boxes', parentName: 'Switches, Sockets & Electrical Accessories', isMain: false },
  { id: 'sub-bells', name: 'Door Bells & Chimes', slug: 'door-bells-chimes', path: '/switches-sockets-electrical-accessories?sub=door-bells-chimes', parentName: 'Switches, Sockets & Electrical Accessories', isMain: false },
  { id: 'sub-ind-plugs', name: 'Industrial Plugs & Sockets', slug: 'industrial-plugs-sockets', path: '/switches-sockets-electrical-accessories?sub=industrial-plugs-sockets', parentName: 'Switches, Sockets & Electrical Accessories', isMain: false },

  // 4. Switchgear & Control Panel Products
  { id: 'cat-switchgear', name: 'Switchgear & Control Panel Products', slug: 'switchgear-control-panel-products', path: '/switchgear-control-panel-products', isMain: true },
  { id: 'sub-mcb', name: 'MCB Miniature Circuit Breakers', slug: 'mcb', path: '/switchgear-control-panel-products?sub=mcb', parentName: 'Switchgear & Control Panel Products', isMain: false },
  { id: 'sub-mccb', name: 'MCCB Breakers', slug: 'mccb-breakers', path: '/switchgear-control-panel-products?sub=mccb-breakers', parentName: 'Switchgear & Control Panel Products', isMain: false },
  { id: 'sub-dist-boards', name: 'Distribution Boards & Enclosures', slug: 'distribution-boards-enclosures', path: '/switchgear-control-panel-products?sub=distribution-boards-enclosures', parentName: 'Switchgear & Control Panel Products', isMain: false },
  { id: 'sub-ats', name: 'Automatic Transfer Switch (ATS)', slug: 'automatic-transfer-switch', path: '/switchgear-control-panel-products?sub=automatic-transfer-switch', parentName: 'Switchgear & Control Panel Products', isMain: false },
  { id: 'sub-hubs', name: 'Smart Automation Hubs & Relays', slug: 'smart-automation-hubs-relays', path: '/switchgear-control-panel-products?sub=smart-automation-hubs-relays', parentName: 'Switchgear & Control Panel Products', isMain: false },
  { id: 'sub-contactors', name: 'Contactors & Overload Relays', slug: 'contactors-overload-relays', path: '/switchgear-control-panel-products?sub=contactors-overload-relays', parentName: 'Switchgear & Control Panel Products', isMain: false },

  // 5. Building Materials & Supplies
  { id: 'cat-building', name: 'Building Materials & Supplies', slug: 'building-materials', path: '/building-materials', isMain: true },
  { id: 'sub-clamps', name: 'Clamps & Fasteners', slug: 'clamps', path: '/building-materials?sub=clamps', parentName: 'Building Materials & Supplies', isMain: false },
  { id: 'sub-paints', name: 'Paints & Adjustments', slug: 'paints-adjustments', path: '/building-materials?sub=paints-adjustments', parentName: 'Building Materials & Supplies', isMain: false },
  { id: 'sub-nails', name: 'Steel Nails', slug: 'steel-nail', path: '/building-materials?sub=steel-nail', parentName: 'Building Materials & Supplies', isMain: false },
  { id: 'sub-bolts', name: 'Bolts & Nuts', slug: 'bolts-nuts', path: '/building-materials?sub=bolts-nuts', parentName: 'Building Materials & Supplies', isMain: false },
  { id: 'sub-upvc', name: 'UPVC Pipes & Fittings', slug: 'upvc-pipes-fittings', path: '/building-materials?sub=upvc-pipes-fittings', parentName: 'Building Materials & Supplies', isMain: false },
  { id: 'sub-valves', name: 'Brass Valves & Bibcocks', slug: 'brass-valves-bibcocks', path: '/building-materials?sub=brass-valves-bibcocks', parentName: 'Building Materials & Supplies', isMain: false },
  { id: 'sub-sanitary', name: 'Sanitary Ware & Sinks', slug: 'sanitary-ware-sinks', path: '/building-materials?sub=sanitary-ware-sinks', parentName: 'Building Materials & Supplies', isMain: false },

  // 6. Safety Products & PPE
  { id: 'cat-safety', name: 'Safety Products & PPE', slug: 'safety-products', path: '/safety-products', isMain: true },
  { id: 'sub-helmets', name: 'Helmets & Hard Hats', slug: 'helmets', path: '/safety-products?sub=helmets', parentName: 'Safety Products & PPE', isMain: false },
  { id: 'sub-jackets', name: 'Safety Jackets & High-Vis Vests', slug: 'safety-jackets', path: '/safety-products?sub=safety-jackets', parentName: 'Safety Products & PPE', isMain: false },
  { id: 'sub-gloves', name: 'Gloves & Masks', slug: 'gloves-masks', path: '/safety-products?sub=gloves-masks', parentName: 'Safety Products & PPE', isMain: false },
  { id: 'sub-shoes', name: 'Safety Shoes & Industrial Boots', slug: 'safety-shoes', path: '/safety-products?sub=safety-shoes', parentName: 'Safety Products & PPE', isMain: false },
  { id: 'sub-firstaid', name: 'First Aid Kit', slug: 'first-aid-kit', path: '/safety-products?sub=first-aid-kit', parentName: 'Safety Products & PPE', isMain: false },
  { id: 'sub-tapes', name: 'Warning Tapes', slug: 'warning-tapes', path: '/safety-products?sub=warning-tapes', parentName: 'Safety Products & PPE', isMain: false },
  { id: 'sub-goggles', name: 'Safety Goggles & Eye Protection', slug: 'safety-goggles', path: '/safety-products?sub=safety-goggles', parentName: 'Safety Products & PPE', isMain: false },

  // 7. AC Spare Parts & HVAC
  { id: 'cat-ac', name: 'AC Spare Parts & HVAC', slug: 'ac-spare-parts', path: '/ac-spare-parts', isMain: true },
  { id: 'sub-capacitor', name: 'Capacitors', slug: 'capacitor', path: '/ac-spare-parts?sub=capacitor', parentName: 'AC Spare Parts & HVAC', isMain: false },
  { id: 'sub-gas', name: 'Refrigerant Gas', slug: 'refrigerant-gas', path: '/ac-spare-parts?sub=refrigerant-gas', parentName: 'AC Spare Parts & HVAC', isMain: false },
  { id: 'sub-compressors', name: 'AC Compressors', slug: 'ac-compressors', path: '/ac-spare-parts?sub=ac-compressors', parentName: 'AC Spare Parts & HVAC', isMain: false },
  { id: 'sub-copper-pipe', name: 'Copper Pipe & Line Sets', slug: 'copper-pipe', path: '/ac-spare-parts?sub=copper-pipe', parentName: 'AC Spare Parts & HVAC', isMain: false },
  { id: 'sub-blower', name: 'Blower Motor', slug: 'blower-motor', path: '/ac-spare-parts?sub=blower-motor', parentName: 'AC Spare Parts & HVAC', isMain: false },
  { id: 'sub-pcb', name: 'PCB Control Board', slug: 'pcb-control-board', path: '/ac-spare-parts?sub=pcb-control-board', parentName: 'AC Spare Parts & HVAC', isMain: false },
  { id: 'sub-sensor', name: 'Temperature Sensor & Thermistor', slug: 'temperature-sensor-thermistor', path: '/ac-spare-parts?sub=temperature-sensor-thermistor', parentName: 'AC Spare Parts & HVAC', isMain: false },

  // 8. Adhesives, Tools & Hardware
  { id: 'cat-tools', name: 'Adhesives, Tools & Hardware', slug: 'adhesives-tools-hardware', path: '/adhesives-tools-hardware', isMain: true },
  { id: 'sub-cordless', name: 'Cordless Power Tools', slug: 'cordless-tools', path: '/adhesives-tools-hardware?sub=cordless-tools', parentName: 'Adhesives, Tools & Hardware', isMain: false },
  { id: 'sub-handtools', name: 'Electrician Hand Tools', slug: 'hand-tools', path: '/adhesives-tools-hardware?sub=hand-tools', parentName: 'Adhesives, Tools & Hardware', isMain: false },
  { id: 'sub-fasteners', name: 'Hardware Fasteners & Bits', slug: 'hardware-fasteners', path: '/adhesives-tools-hardware?sub=hardware-fasteners', parentName: 'Adhesives, Tools & Hardware', isMain: false },
  { id: 'sub-adhesives', name: 'Adhesives & Sealants', slug: 'adhesives-sealants', path: '/adhesives-tools-hardware?sub=adhesives-sealants', parentName: 'Adhesives, Tools & Hardware', isMain: false }
];

// Standard comprehensive Brands
export const ALL_BRANDS = [
  { id: 'brand-dewalt', name: 'DeWalt', slug: 'dewalt', path: '/dewalt', logo: '/logo/DeWalt_Logo.svg' },
  { id: 'brand-makita', name: 'Makita', slug: 'makita', path: '/makita', logo: '/logo/makitha.png' },
  { id: 'brand-ducab', name: 'Ducab', slug: 'ducab', path: '/ducab', logo: '/logo/Ducab.png' },
  { id: 'brand-fluke', name: 'Fluke', slug: 'fluke', path: '/fluke', logo: '/logo/Fluke_Logo2.webp' },
  { id: 'brand-philips', name: 'Philips', slug: 'philips', path: '/philips', logo: '/logo/philips.png' },
  { id: 'brand-osram', name: 'Osram', slug: 'osram', path: '/osram', logo: '/logo/osram.png' },
  { id: 'brand-belden', name: 'Belden', slug: 'belden', path: '/belden', logo: '/logo/belden.png' },
  { id: 'brand-legrand', name: 'Legrand', slug: 'legrand', path: '/legrand', logo: '/logo/Legrand.png' },
  { id: 'brand-schneider', name: 'Schneider Electric', slug: 'schneider-electric', path: '/schneider-electric', logo: '/logo/Schneider Electric.png' },
  { id: 'brand-abb', name: 'ABB', slug: 'abb', path: '/switchgear-control-panel-products', logo: null },
  { id: 'brand-eaton', name: 'Eaton', slug: 'eaton', path: '/switchgear-control-panel-products', logo: null },
  { id: 'brand-himel', name: 'Himel', slug: 'himel', path: '/switchgear-control-panel-products', logo: null }
];

// Helper to determine brand path
export function getBrandPath(brand) {
  if (!brand) return '/';
  const name = (brand.name || '').toLowerCase();
  const slug = (brand.slug || '').toLowerCase();

  if (name.includes('dewalt') || slug.includes('dewalt')) return '/dewalt';
  if (name.includes('makita') || slug.includes('makita')) return '/makita';
  if (name.includes('ducab') || slug.includes('ducab')) return '/ducab';
  if (name.includes('fluke') || slug.includes('fluke')) return '/fluke';
  if (name.includes('philips') || slug.includes('philips')) return '/philips';
  if (name.includes('osram') || slug.includes('osram')) return '/osram';
  if (name.includes('belden') || slug.includes('belden')) return '/belden';
  if (name.includes('legrand') || slug.includes('legrand')) return '/legrand';
  if (name.includes('schneider') || slug.includes('schneider')) return '/schneider-electric';
  if (name.includes('abb') || slug.includes('abb')) return '/switchgear-control-panel-products';
  if (name.includes('eaton') || slug.includes('eaton')) return '/switchgear-control-panel-products';
  if (name.includes('himel') || slug.includes('himel')) return '/switchgear-control-panel-products';

  return `/brand/${brand.slug || slug || name}`;
}

// Helper to determine category path
export function getCategoryPath(cat) {
  if (!cat) return '/';
  if (cat.path) return cat.path;
  const slug = (cat.slug || '').toLowerCase();
  const name = (cat.name || '').toLowerCase();

  if (cat.parent_slug || cat.parent_id) {
    // Subcategory
    let parentSlug = cat.parent_slug;
    if (!parentSlug) {
      if (slug.includes('cable') || slug.includes('wire') || name.includes('cable') || name.includes('wire')) parentSlug = 'wires-cables';
      else if (slug.includes('light') || slug.includes('lamp') || name.includes('light') || name.includes('lamp') || name.includes('led')) parentSlug = 'led-lighting-special-lamp';
      else if (slug.includes('switch') || slug.includes('socket') || slug.includes('accessories') || name.includes('switch') || name.includes('socket') || name.includes('accessories')) parentSlug = 'switches-sockets-electrical-accessories';
      else if (slug.includes('mcb') || slug.includes('panel') || slug.includes('breaker') || slug.includes('switchgear')) parentSlug = 'switchgear-control-panel-products';
      else if (slug.includes('pipe') || slug.includes('clamp') || slug.includes('valve') || slug.includes('bibcock')) parentSlug = 'building-materials';
      else if (slug.includes('safety') || slug.includes('jacket') || slug.includes('helmet') || slug.includes('glove')) parentSlug = 'safety-products';
      else if (slug.includes('compressor') || slug.includes('refrigerant') || slug.includes('capacitor') || slug.includes('hvac') || slug.startsWith('ac-') || slug.includes('spare')) parentSlug = 'ac-spare-parts';
      else parentSlug = 'adhesives-tools-hardware';
    }
    return `/${parentSlug}?sub=${slug}`;
  }

  // Main Categories
  if (slug.includes('switchgear') || name.includes('switchgear')) return '/switchgear-control-panel-products';
  if (slug.includes('switches') || slug.includes('switch') || slug.includes('socket') || slug.includes('electrical-accessories') || slug.includes('accessories') || name.includes('switch') || name.includes('socket') || name.includes('accessories')) return '/switches-sockets-electrical-accessories';
  if (slug.includes('wire') || slug.includes('cable') || name.includes('cable') || name.includes('wire')) return '/wires-cables';
  if (slug.includes('light') || slug.includes('lamp') || name.includes('light') || name.includes('lamp') || name.includes('led')) return '/led-lighting-special-lamp';
  if (slug.includes('building') || slug.includes('plumb') || name.includes('building') || name.includes('plumb')) return '/building-materials';
  if (slug.includes('safety') || name.includes('safety') || slug.includes('ppe')) return '/safety-products';
  if (slug.includes('spare') || slug.includes('spair') || slug.includes('hvac') || slug === 'ac' || slug.startsWith('ac-') || name.includes('spare') || name.includes('spair') || name.includes('hvac') || /\bac\b/i.test(name)) return '/ac-spare-parts';
  if (slug.includes('tool') || slug.includes('hardw') || slug.includes('adhes') || name.includes('tool') || name.includes('hardware')) return '/adhesives-tools-hardware';

  return `/${slug}`;
}

// Scoring matcher: checks prefix, word boundary, or substring
function calculateMatchScore(text, query) {
  if (!text || !query) return 0;
  const t = text.toLowerCase();
  const q = query.toLowerCase();

  if (t === q) return 100; // exact match
  if (t.startsWith(q)) return 90; // starts with query (e.g. "a" matches "AC Spair Parts")
  
  // Word starts with query (e.g. "d" matches "Down Lights" or "DeWalt")
  const words = t.split(/[\s,/-]+/);
  if (words.some(w => w.startsWith(q))) return 80;

  if (t.includes(q)) return 50; // substring match
  return 0;
}

// React component or helper to highlight matching text
export function renderHighlightedText(text, query) {
  if (!text) return '';
  if (!query || !query.trim()) return text;

  const escaped = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = String(text).split(regex);

  return parts.map((part, i) => 
    regex.test(part) ? (
      React.createElement('mark', { key: i, className: 'search-highlight' }, part)
    ) : (
      part
    )
  );
}

/**
 * Client-side search across Categories, Brands, and Products
 */
export function searchLocalCatalog(rawQuery, { liveProducts = [], liveCategories = [], liveBrands = [] } = {}) {
  const query = (rawQuery || '').trim();
  if (!query) {
    return {
      query: '',
      categories: [],
      brands: [],
      products: [],
      totalCount: 0
    };
  }

  // 1. Process Categories (merge live + static)
  const categoryPool = [...ALL_CATEGORIES];
  if (Array.isArray(liveCategories) && liveCategories.length > 0) {
    liveCategories.forEach(c => {
      if (!categoryPool.some(p => (p.slug && p.slug === c.slug) || (p.name && p.name.toLowerCase() === c.name.toLowerCase()))) {
        categoryPool.push({
          id: `db-cat-${c.id}`,
          name: c.name,
          slug: c.slug,
          path: getCategoryPath(c),
          parentName: c.parent_name || null,
          isMain: !c.parent_id
        });
      }
      if (Array.isArray(c.subcategories)) {
        c.subcategories.forEach(s => {
          if (!categoryPool.some(p => (p.slug && p.slug === s.slug) || (p.name && p.name.toLowerCase() === s.name.toLowerCase()))) {
            categoryPool.push({
              id: `db-sub-${s.id}`,
              name: s.name,
              slug: s.slug,
              path: getCategoryPath({ ...s, parent_slug: c.slug }),
              parentName: c.name,
              isMain: false
            });
          }
        });
      }
    });
  }

  const scoredCategories = categoryPool
    .map(c => {
      const score = Math.max(
        calculateMatchScore(c.name, query),
        calculateMatchScore(c.slug, query),
        c.parentName ? calculateMatchScore(c.parentName, query) * 0.7 : 0
      );
      return { ...c, score };
    })
    .filter(c => c.score > 0)
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    .slice(0, 6);

  // 2. Process Brands (merge live + static)
  const brandPool = [...ALL_BRANDS];
  if (Array.isArray(liveBrands) && liveBrands.length > 0) {
    liveBrands.forEach(b => {
      const existing = brandPool.find(p => p.name.toLowerCase() === b.name.toLowerCase() || (p.slug && p.slug === b.slug));
      if (!existing) {
        brandPool.push({
          id: `db-brand-${b.id}`,
          name: b.name,
          slug: b.slug,
          path: getBrandPath(b),
          logo: b.image || null
        });
      } else if (b.image && !existing.logo) {
        existing.logo = b.image;
      }
    });
  }

  const scoredBrands = brandPool
    .map(b => {
      const score = Math.max(
        calculateMatchScore(b.name, query),
        calculateMatchScore(b.slug, query)
      );
      return { ...b, score };
    })
    .filter(b => b.score > 0)
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    .slice(0, 6);

  // 3. Process Products (merge live DB products + static catalog)
  const productPool = [];
  const seenProductKeys = new Set();

  const addProductToPool = (p) => {
    const key = (p.name || '').toLowerCase().trim();
    if (!key || seenProductKeys.has(key)) return;
    seenProductKeys.add(key);

    const priceNum = typeof p.price === 'number' ? p.price : parseFloat(String(p.price || '').replace(/[^0-9.]/g, '')) || 0;
    const formattedPrice = `AED ${priceNum.toFixed(2)}`;
    const oldPriceNum = p.old_price ? Number(p.old_price) : (p.oldPrice ? parseFloat(String(p.oldPrice).replace(/[^0-9.]/g, '')) : null);
    const formattedOldPrice = oldPriceNum ? `AED ${oldPriceNum.toFixed(2)}` : null;
    const mainImg = (Array.isArray(p.images) && p.images.length > 0) ? p.images[0] : (p.image || '/prod_downlight_1791451418016.png');

    productPool.push({
      ...p,
      realId: p.realId || p.id,
      name: p.name,
      price: formattedPrice,
      rawPrice: priceNum,
      oldPrice: formattedOldPrice,
      image: mainImg,
      brand: p.brand || '',
      category_name: p.category_name || p.category || '',
      subcategory_name: p.subcategory_name || p.subcategory || '',
      targetUrl: getProductUrl(p)
    });
  };

  // Add live DB products first
  if (Array.isArray(liveProducts)) {
    liveProducts.forEach(addProductToPool);
  }
  // Add static catalog products
  STATIC_CATALOG.forEach(addProductToPool);

  const scoredProducts = productPool
    .map(p => {
      const nameScore = calculateMatchScore(p.name, query) * 1.5;
      const brandScore = calculateMatchScore(p.brand, query) * 1.2;
      const catScore = calculateMatchScore(p.category_name, query);
      const subScore = calculateMatchScore(p.subcategory_name, query);
      const modelScore = calculateMatchScore(p.model, query);
      const skuScore = calculateMatchScore(p.sku, query);
      const descScore = calculateMatchScore(p.description, query) * 0.5;

      const maxScore = Math.max(nameScore, brandScore, catScore, subScore, modelScore, skuScore, descScore);
      return { ...p, score: maxScore };
    })
    .filter(p => p.score > 0)
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    .slice(0, 10);

  const totalCount = scoredCategories.length + scoredBrands.length + scoredProducts.length;

  return {
    query,
    categories: scoredCategories,
    brands: scoredBrands,
    products: scoredProducts,
    totalCount
  };
}

import React from 'react';
import { STATIC_CATALOG, getProductUrl } from './productUrl.js';

// Real Website Categories & Subcategories matching live database
export const ALL_CATEGORIES = [
  // 1. Wires & Cables
  { id: 'cat-5', name: 'Wires & Cables', slug: 'wires-cables', path: '/wires-cables', isMain: true },
  { id: 'sub-6', name: 'Buliding wires', slug: 'buliding-wires', path: '/wires-cables?sub=buliding-wires', parentName: 'Wires & Cables', isMain: false },
  { id: 'sub-7', name: 'Felxible cables', slug: 'felxible-cables', path: '/wires-cables?sub=felxible-cables', parentName: 'Wires & Cables', isMain: false },
  { id: 'sub-23', name: 'Rubber Cables', slug: 'rubber-cables', path: '/wires-cables?sub=rubber-cables', parentName: 'Wires & Cables', isMain: false },
  { id: 'sub-24', name: 'Heat Resistance Cable', slug: 'heat-resistance-cable', path: '/wires-cables?sub=heat-resistance-cable', parentName: 'Wires & Cables', isMain: false },
  { id: 'sub-25', name: 'control Cables', slug: 'control-cables', path: '/wires-cables?sub=control-cables', parentName: 'Wires & Cables', isMain: false },
  { id: 'sub-26', name: 'KNX Cables & Fire Alarm Cables', slug: 'knx-cables-fire-alarm-cables', path: '/wires-cables?sub=knx-cables-fire-alarm-cables', parentName: 'Wires & Cables', isMain: false },
  { id: 'sub-27', name: 'Network Cables', slug: 'network-cables', path: '/wires-cables?sub=network-cables', parentName: 'Wires & Cables', isMain: false },
  { id: 'sub-75', name: 'Armoured Cables', slug: 'armoured-cables', path: '/wires-cables?sub=armoured-cables', parentName: 'Wires & Cables', isMain: false },

  // 2. LED Lighting & Special Lamp
  { id: 'cat-8', name: 'LED Lighting & Special Lamp', slug: 'led-lighting-special-lamp', path: '/led-lighting-special-lamp', isMain: true },
  { id: 'sub-9', name: 'Down Lights', slug: 'down-lights', path: '/led-lighting-special-lamp?sub=down-lights', parentName: 'LED Lighting & Special Lamp', isMain: false },
  { id: 'sub-28', name: 'Panel Lights', slug: 'panel-lights', path: '/led-lighting-special-lamp?sub=panel-lights', parentName: 'LED Lighting & Special Lamp', isMain: false },
  { id: 'sub-29', name: 'Spot Lights', slug: 'spot-lights', path: '/led-lighting-special-lamp?sub=spot-lights', parentName: 'LED Lighting & Special Lamp', isMain: false },
  { id: 'sub-30', name: 'Track Lights', slug: 'track-lights', path: '/led-lighting-special-lamp?sub=track-lights', parentName: 'LED Lighting & Special Lamp', isMain: false },
  { id: 'sub-31', name: 'Flood Lights', slug: 'flood-lights', path: '/led-lighting-special-lamp?sub=flood-lights', parentName: 'LED Lighting & Special Lamp', isMain: false },
  { id: 'sub-32', name: 'Street Lights', slug: 'street-lights', path: '/led-lighting-special-lamp?sub=street-lights', parentName: 'LED Lighting & Special Lamp', isMain: false },
  { id: 'sub-33', name: 'High bay lights', slug: 'high-bay-lights', path: '/led-lighting-special-lamp?sub=high-bay-lights', parentName: 'LED Lighting & Special Lamp', isMain: false },
  { id: 'sub-34', name: 'Outdoor lights', slug: 'outdoor-lights', path: '/led-lighting-special-lamp?sub=outdoor-lights', parentName: 'LED Lighting & Special Lamp', isMain: false },
  { id: 'sub-58', name: 'Led Strip Lights', slug: 'led-strip-lights', path: '/led-lighting-special-lamp?sub=led-strip-lights', parentName: 'LED Lighting & Special Lamp', isMain: false },

  // 3. Switches, Sockets & Electrical Accessories
  { id: 'cat-10', name: 'Switches, Sockets & Electrical Accessories', slug: 'switches-sockets-electrical-accessories', path: '/switches-sockets-electrical-accessories', isMain: true },
  { id: 'sub-11', name: 'Mk Switches', slug: 'mk-switches', path: '/switches-sockets-electrical-accessories?sub=mk-switches', parentName: 'Switches, Sockets & Electrical Accessories', isMain: false },
  { id: 'sub-76', name: 'Legrand Switch', slug: 'legrand-switch', path: '/switches-sockets-electrical-accessories?sub=legrand-switch', parentName: 'Switches, Sockets & Electrical Accessories', isMain: false },
  { id: 'sub-77', name: 'Schneider Switch', slug: 'schneider-switch', path: '/switches-sockets-electrical-accessories?sub=schneider-switch', parentName: 'Switches, Sockets & Electrical Accessories', isMain: false },
  { id: 'sub-78', name: 'Panasomic  Switch', slug: 'panasomic-switch', path: '/switches-sockets-electrical-accessories?sub=panasomic-switch', parentName: 'Switches, Sockets & Electrical Accessories', isMain: false },
  { id: 'sub-79', name: 'Industrial Sockets & Plugs', slug: 'industrial-sockets-plugs', path: '/switches-sockets-electrical-accessories?sub=industrial-sockets-plugs', parentName: 'Switches, Sockets & Electrical Accessories', isMain: false },

  // 4. Switchgear & Control Panel Products
  { id: 'cat-12', name: 'Switchgear & Control Panel Products', slug: 'switchgear-control-panel-products', path: '/switchgear-control-panel-products', isMain: true },
  { id: 'sub-13', name: 'MCB', slug: 'mcb', path: '/switchgear-control-panel-products?sub=mcb', parentName: 'Switchgear & Control Panel Products', isMain: false },
  { id: 'sub-59', name: 'ABB', slug: 'abb', path: '/switchgear-control-panel-products?sub=abb', parentName: 'Switchgear & Control Panel Products', isMain: false },
  { id: 'sub-60', name: 'Eaton', slug: 'eaton', path: '/switchgear-control-panel-products?sub=eaton', parentName: 'Switchgear & Control Panel Products', isMain: false },
  { id: 'sub-61', name: 'Himel', slug: 'himel', path: '/switchgear-control-panel-products?sub=himel', parentName: 'Switchgear & Control Panel Products', isMain: false },
  { id: 'sub-62', name: 'Broys control', slug: 'broys-control', path: '/switchgear-control-panel-products?sub=broys-control', parentName: 'Switchgear & Control Panel Products', isMain: false },
  { id: 'sub-63', name: 'Schneider', slug: 'schneider', path: '/switchgear-control-panel-products?sub=schneider', parentName: 'Switchgear & Control Panel Products', isMain: false },

  // 5. Building Materials
  { id: 'cat-14', name: 'Building Materials', slug: 'building-materials', path: '/building-materials', isMain: true },
  { id: 'sub-15', name: 'clamps', slug: 'clamps', path: '/building-materials?sub=clamps', parentName: 'Building Materials', isMain: false },
  { id: 'sub-20', name: 'Paints & Adjustments', slug: 'paints-adjustments', path: '/building-materials?sub=paints-adjustments', parentName: 'Building Materials', isMain: false },
  { id: 'sub-21', name: 'Steel Nail', slug: 'steel-nail', path: '/building-materials?sub=steel-nail', parentName: 'Building Materials', isMain: false },
  { id: 'sub-22', name: 'Bolts &  Nuts', slug: 'bolts-nuts', path: '/building-materials?sub=bolts-nuts', parentName: 'Building Materials', isMain: false },

  // 6. Safety Products (Real website categories - NO PPE)
  { id: 'cat-16', name: 'Safety Products', slug: 'safety-products', path: '/safety-products', isMain: true },
  { id: 'sub-64', name: 'safety jackets', slug: 'safety-jackets', path: '/safety-products?sub=safety-jackets', parentName: 'Safety Products', isMain: false },
  { id: 'sub-65', name: 'Gloves & Masks', slug: 'gloves-masks', path: '/safety-products?sub=gloves-masks', parentName: 'Safety Products', isMain: false },
  { id: 'sub-66', name: 'Helmets', slug: 'helmets', path: '/safety-products?sub=helmets', parentName: 'Safety Products', isMain: false },
  { id: 'sub-67', name: 'Safety shoes', slug: 'safety-shoes', path: '/safety-products?sub=safety-shoes', parentName: 'Safety Products', isMain: false },
  { id: 'sub-68', name: 'First Aid Kit', slug: 'first-aid-kit', path: '/safety-products?sub=first-aid-kit', parentName: 'Safety Products', isMain: false },
  { id: 'sub-69', name: 'Warning Tapes', slug: 'warning-tapes', path: '/safety-products?sub=warning-tapes', parentName: 'Safety Products', isMain: false },
  { id: 'sub-70', name: 'Safety Goggles', slug: 'safety-goggles', path: '/safety-products?sub=safety-goggles', parentName: 'Safety Products', isMain: false },

  // 7. AC Spair Parts
  { id: 'cat-18', name: 'AC Spair Parts', slug: 'ac-spair-parts', path: '/ac-spare-parts', isMain: true },
  { id: 'sub-19', name: 'Capacitor', slug: 'capacitor', path: '/ac-spare-parts?sub=capacitor', parentName: 'AC Spair Parts', isMain: false },
  { id: 'sub-56', name: 'AC Compressors', slug: 'ac-compressors', path: '/ac-spare-parts?sub=ac-compressors', parentName: 'AC Spair Parts', isMain: false },
  { id: 'sub-71', name: 'Blower motor', slug: 'blower-motor', path: '/ac-spare-parts?sub=blower-motor', parentName: 'AC Spair Parts', isMain: false },
  { id: 'sub-72', name: 'PCB Control Board', slug: 'pcb-control-board', path: '/ac-spare-parts?sub=pcb-control-board', parentName: 'AC Spair Parts', isMain: false },
  { id: 'sub-73', name: 'Copper pipe', slug: 'copper-pipe', path: '/ac-spare-parts?sub=copper-pipe', parentName: 'AC Spair Parts', isMain: false },
  { id: 'sub-74', name: 'Temperature sensor & Thermistor', slug: 'temperature-sensor-thermistor', path: '/ac-spare-parts?sub=temperature-sensor-thermistor', parentName: 'AC Spair Parts', isMain: false }
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
      else if (slug.includes('safety') || slug.includes('jacket') || slug.includes('helmet') || slug.includes('glove') || slug.includes('goggle') || slug.includes('shoe') || slug.includes('tape') || slug.includes('first-aid')) parentSlug = 'safety-products';
      else if (slug.includes('compressor') || slug.includes('refrigerant') || slug.includes('capacitor') || slug.includes('hvac') || slug.startsWith('ac-') || slug.includes('spare') || slug.includes('spair')) parentSlug = 'ac-spare-parts';
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
  if (slug.includes('safety') || name.includes('safety')) return '/safety-products';
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

  // 1. Process Categories (strictly use liveCategories if provided, otherwise ALL_CATEGORIES)
  const categoryPool = [];
  const seenCatKeys = new Set();

  const addCatToPool = (cat) => {
    const slugKey = (cat.slug || '').toLowerCase().trim();
    const nameKey = (cat.name || '').toLowerCase().trim();
    const uniqueKey = slugKey || nameKey;
    if (!uniqueKey || seenCatKeys.has(uniqueKey)) return;
    seenCatKeys.add(uniqueKey);

    categoryPool.push({
      id: cat.id || `cat-${slugKey}`,
      name: cat.name,
      slug: cat.slug,
      path: cat.path || getCategoryPath(cat),
      parentName: cat.parentName || cat.parent_name || null,
      isMain: cat.isMain !== undefined ? cat.isMain : !cat.parent_id
    });
  };

  if (Array.isArray(liveCategories) && liveCategories.length > 0) {
    liveCategories.forEach(c => {
      addCatToPool({
        id: `db-cat-${c.id}`,
        name: c.name,
        slug: c.slug,
        path: getCategoryPath(c),
        parentName: null,
        isMain: true
      });
      if (Array.isArray(c.subcategories)) {
        c.subcategories.forEach(s => {
          addCatToPool({
            id: `db-sub-${s.id}`,
            name: s.name,
            slug: s.slug,
            path: getCategoryPath({ ...s, parent_slug: c.slug }),
            parentName: c.name,
            isMain: false
          });
        });
      }
    });
  } else {
    ALL_CATEGORIES.forEach(addCatToPool);
  }

  const scoredCategories = categoryPool
    .map(c => {
      // Score only on the category's OWN name and slug
      const nameScore = calculateMatchScore(c.name, query);
      const slugScore = calculateMatchScore(c.slug, query);
      const score = Math.max(nameScore, slugScore);
      return { ...c, score };
    })
    .filter(c => c.score > 0)
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    .slice(0, 6);

  // 2. Process Brands (strictly use liveBrands if provided, otherwise ALL_BRANDS)
  const brandPool = [];
  const seenBrandKeys = new Set();

  const addBrandToPool = (b) => {
    const slugKey = (b.slug || '').toLowerCase().trim();
    const nameKey = (b.name || '').toLowerCase().trim();
    const uniqueKey = slugKey || nameKey;
    if (!uniqueKey || seenBrandKeys.has(uniqueKey)) return;
    seenBrandKeys.add(uniqueKey);

    brandPool.push({
      id: b.id || `brand-${slugKey}`,
      name: b.name,
      slug: b.slug,
      path: b.path || getBrandPath(b),
      logo: b.image || b.logo || null
    });
  };

  if (Array.isArray(liveBrands) && liveBrands.length > 0) {
    liveBrands.forEach(addBrandToPool);
  } else {
    ALL_BRANDS.forEach(addBrandToPool);
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

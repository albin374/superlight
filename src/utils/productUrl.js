/**
 * Utilities for semantic, SEO-friendly product URLs:
 * e.g. /{categorySlug}/{subcategorySlug}/{productSlug}
 * or /{categorySlug}/{productSlug}
 */

export function slugify(text) {
  if (!text) return '';
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/&+/g, 'and')
    .replace(/[\/\\]+/g, '-')
    .replace(/\./g, '-')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export const CATEGORY_MAP = {
  'wires': { slug: 'wires-cables', name: 'Wires & Cables' },
  'wires-cables': { slug: 'wires-cables', name: 'Wires & Cables' },
  'cables-cable-management': { slug: 'wires-cables', name: 'Wires & Cables' },
  'cable-management': { slug: 'wires-cables', name: 'Wires & Cables' },
  'cables': { slug: 'wires-cables', name: 'Wires & Cables' },

  'lighting': { slug: 'led-lighting-special-lamp', name: 'LED Lighting & Special Lamp' },
  'led-lighting-special-lamp': { slug: 'led-lighting-special-lamp', name: 'LED Lighting & Special Lamp' },
  'lighting-solutions': { slug: 'led-lighting-special-lamp', name: 'LED Lighting & Special Lamp' },

  'switches': { slug: 'switches-sockets-electrical-accessories', name: 'Switches, Sockets & Electrical Accessories' },
  'switches-sockets-electrical-accessories': { slug: 'switches-sockets-electrical-accessories', name: 'Switches, Sockets & Electrical Accessories' },
  'electrical-accessories': { slug: 'switches-sockets-electrical-accessories', name: 'Switches, Sockets & Electrical Accessories' },

  'switchgear': { slug: 'switchgear-control-panel-products', name: 'Switchgear & Control Panel Products' },
  'switchgear-control-panel-products': { slug: 'switchgear-control-panel-products', name: 'Switchgear & Control Panel Products' },
  'home-automation': { slug: 'switchgear-control-panel-products', name: 'Switchgear & Control Panel Products' },
  'smart-home': { slug: 'switchgear-control-panel-products', name: 'Switchgear & Control Panel Products' },

  'building': { slug: 'building-materials', name: 'Building Materials' },
  'building-materials': { slug: 'building-materials', name: 'Building Materials' },
  'plumbing-materials': { slug: 'building-materials', name: 'Building Materials' },
  'plumbing': { slug: 'building-materials', name: 'Building Materials' },

  'safety': { slug: 'safety-products', name: 'Safety Products' },
  'safety-products': { slug: 'safety-products', name: 'Safety Products' },

  'ac': { slug: 'ac-spare-parts', name: 'AC Spair Parts' },
  'ac-spare-parts': { slug: 'ac-spare-parts', name: 'AC Spair Parts' },
  'ac-spair-parts': { slug: 'ac-spare-parts', name: 'AC Spair Parts' },
  'hvac': { slug: 'ac-spare-parts', name: 'AC Spair Parts' },

  'tools': { slug: 'adhesives-tools-hardware', name: 'Adhesives, Tools & Hardware' },
  'adhesives-tools-hardware': { slug: 'adhesives-tools-hardware', name: 'Adhesives, Tools & Hardware' },
  'adhesives-sealants': { slug: 'adhesives-tools-hardware', name: 'Adhesives, Tools & Hardware' },
  'tools-hardware': { slug: 'adhesives-tools-hardware', name: 'Adhesives, Tools & Hardware' }
};

export const CATEGORY_NAMES = {
  'wires-cables': 'Wires & Cables',
  'led-lighting-special-lamp': 'LED Lighting & Special Lamp',
  'switches-sockets-electrical-accessories': 'Switches, Sockets & Electrical Accessories',
  'switchgear-control-panel-products': 'Switchgear & Control Panel Products',
  'building-materials': 'Building Materials',
  'safety-products': 'Safety Products',
  'ac-spare-parts': 'AC Spair Parts',
  'adhesives-tools-hardware': 'Adhesives, Tools & Hardware'
};

export function getProductSku(product) {
  if (!product) return '';
  if (product.sku) return String(product.sku).toLowerCase();
  
  let brand = (product.brand || '').trim();
  const name = product.name || '';
  if (!brand) {
    if (name.includes('Ducab')) brand = 'DUCAB';
    else if (name.includes('Legrand')) brand = 'LEGRAND';
    else if (name.includes('Schneider')) brand = 'SCHNEIDER';
    else if (name.includes('Fluke')) brand = 'FLUKE';
    else if (name.includes('Dewalt')) brand = 'DEWALT';
    else if (name.includes('Makita')) brand = 'MAKITA';
    else if (name.includes('Osram')) brand = 'OSRAM';
    else if (name.includes('Belden')) brand = 'BELDEN';
    else if (name.includes('Philips')) brand = 'PHILIPS';
    else brand = 'PHILIPS';
  }

  const brandPrefix = brand.substring(0, 3).toLowerCase();
  if (product.model) {
    return `${brandPrefix}-${slugify(product.model)}`;
  }
  const rawId = product.realId || product.id || 1;
  const skuNumber = ((typeof rawId === 'number' ? rawId : String(rawId).charCodeAt(0) || 1) * 367 + 3000) % 8999 + 1000;
  return `${brandPrefix}-${skuNumber}`;
}

export function getProductCategorySlug(product) {
  if (!product) return 'wires-cables';

  // 1. Explicit category_slug
  if (product.category_slug) {
    const key = String(product.category_slug).toLowerCase();
    if (CATEGORY_MAP[key]) return CATEGORY_MAP[key].slug;
    return slugify(product.category_slug);
  }

  // 2. Explicit category / category_name
  const catRaw = String(product.category_name || product.category || '').toLowerCase();
  if (catRaw) {
    for (const [k, v] of Object.entries(CATEGORY_MAP)) {
      if (catRaw.includes(k)) return v.slug;
    }
  }

  // 3. Match against built-in STATIC_CATALOG by id or name
  if (product.id || product.name) {
    const catalogMatch = STATIC_CATALOG.find(p => 
      (product.id && (String(p.id) === String(product.id) || String(p.realId) === String(product.id))) ||
      (product.name && p.name && p.name.toLowerCase() === product.name.toLowerCase())
    );
    if (catalogMatch && catalogMatch.category_slug) {
      return catalogMatch.category_slug;
    }
  }

  // 4. Name keyword heuristic (Higher priority: what the product actually IS takes precedence over who made it)
  const name = String(product.name || '').toLowerCase();
  if (name.includes('jacket') || name.includes('vest') || name.includes('helmet') || name.includes('glove') || name.includes('mask') || name.includes('boot') || name.includes('shoe') || name.includes('goggle') || name.includes('eyewear') || name.includes('ppe') || name.includes('first aid') || name.includes('safety') || name.includes('reflective') || name.includes('high-visibility') || name.includes('high visibility') || name.includes('warning tape')) return 'safety-products';
  if (name.includes('cable') || name.includes('wire') || name.includes('conduit')) return 'wires-cables';
  if (name.includes('light') || name.includes('lamp') || name.includes('led') || name.includes('flood') || name.includes('downlight') || name.includes('spot') || name.includes('panel light') || name.includes('bulb')) return 'led-lighting-special-lamp';
  if (name.includes('socket') || name.includes('outlet') || name.includes('dimmer') || name.includes('gang') || name.includes('switch') || name.includes('doorbell') || name.includes('chime')) return 'switches-sockets-electrical-accessories';
  if (name.includes('mcb') || name.includes('rccb') || name.includes('mccb') || name.includes('breaker') || name.includes('switchgear') || name.includes('contactor') || name.includes('relay') || name.includes('distribution board')) return 'switchgear-control-panel-products';
  if (name.includes('compressor') || name.includes('refrigerant') || name.includes('hvac') || name.includes('capacitor') || name.includes('thermistor') || name.includes('blower motor') || name.includes('copper pipe')) return 'ac-spare-parts';
  if (name.includes('pipe') || name.includes('valve') || name.includes('fitting') || name.includes('plumb') || name.includes('clamp') || name.includes('nail') || name.includes('paint')) return 'building-materials';
  if (name.includes('drill') || name.includes('tester') || name.includes('thermometer') || name.includes('multimeter') || name.includes('hardware') || name.includes('tool') || name.includes('adhesive') || name.includes('sealant') || name.includes('silicone') || name.includes('screw') || name.includes('fastener')) return 'adhesives-tools-hardware';

  // 5. Brand heuristic (Fallback only if product name contains no specific keywords)
  const brand = String(product.brand || '').toLowerCase();
  if (brand.includes('ducab') || brand.includes('belden')) return 'wires-cables';
  if (brand.includes('philips') || brand.includes('osram')) return 'led-lighting-special-lamp';
  if (brand.includes('legrand')) return 'switches-sockets-electrical-accessories';
  if (brand.includes('schneider') || brand.includes('abb') || brand.includes('himel') || brand.includes('eaton')) return 'switchgear-control-panel-products';
  if (brand.includes('dewalt') || brand.includes('makita') || brand.includes('fluke')) return 'adhesives-tools-hardware';

  return 'wires-cables';
}

export function getProductSubcategorySlug(product) {
  if (!product) return 'general';

  // 1. Explicit subcategory_slug
  if (product.subcategory_slug) {
    return slugify(product.subcategory_slug);
  }

  // 2. Explicit subcategory_name / subcategory
  const subRaw = String(product.subcategory_name || product.subcategory || product.subCategory || '').trim();
  if (subRaw && subRaw.toLowerCase() !== 'general' && subRaw.toLowerCase() !== 'all') {
    return slugify(subRaw);
  }

  // 3. Match against built-in STATIC_CATALOG by id or name
  if (product.id || product.name) {
    const catalogMatch = STATIC_CATALOG.find(p => 
      (product.id && (String(p.id) === String(product.id) || String(p.realId) === String(product.id))) ||
      (product.name && p.name && p.name.toLowerCase() === product.name.toLowerCase())
    );
    if (catalogMatch && catalogMatch.subcategory_slug) {
      return catalogMatch.subcategory_slug;
    }
  }

  // 4. Fallback based on category and name keywords
  const catSlug = getProductCategorySlug(product);
  const name = String(product.name || '').toLowerCase();

  if (catSlug === 'wires-cables') {
    if (name.includes('rubber')) return 'rubber-cables';
    if (name.includes('flex')) return 'flexible-cables';
    if (name.includes('heat')) return 'heat-resistance-cable';
    if (name.includes('control')) return 'control-cables';
    if (name.includes('fire') || name.includes('alarm') || name.includes('knx')) return 'knx-cables-fire-alarm-cables';
    if (name.includes('network') || name.includes('cat6') || name.includes('cat5')) return 'network-cables';
    return 'building-wires';
  }

  if (catSlug === 'led-lighting-special-lamp') {
    if (name.includes('down') || name.includes('downlight')) return 'down-lights';
    if (name.includes('panel')) return 'panel-lights';
    if (name.includes('spot')) return 'spot-lights';
    if (name.includes('track')) return 'track-lights';
    if (name.includes('flood')) return 'flood-lights';
    if (name.includes('street')) return 'street-lights';
    if (name.includes('high') || name.includes('bay')) return 'high-bay-lights';
    if (name.includes('strip')) return 'led-strip-lights';
    if (name.includes('outdoor')) return 'outdoor-lights';
    return 'down-lights';
  }

  if (catSlug === 'switches-sockets-electrical-accessories') {
    if (name.includes('socket') || name.includes('outlet')) return 'power-sockets-outlets';
    if (name.includes('weather') || name.includes('box')) return 'weatherproof-sockets-boxes';
    if (name.includes('bell') || name.includes('chime')) return 'door-bells-chimes';
    if (name.includes('plug')) return 'industrial-plugs-sockets';
    if (name.includes('mk')) return 'mk-switches';
    return 'wall-switches-dimmers';
  }

  if (catSlug === 'switchgear-control-panel-products') {
    if (name.includes('rccb') || name.includes('mcb')) return 'mcb';
    if (name.includes('mccb')) return 'mccb-breakers';
    if (name.includes('board') || name.includes('enclosure')) return 'distribution-boards-enclosures';
    if (name.includes('transfer') || name.includes('ats')) return 'automatic-transfer-switch';
    if (name.includes('contactor') || name.includes('relay')) return 'contactors-overload-relays';
    if (name.includes('automation') || name.includes('smart')) return 'smart-automation-hubs-relays';
    return 'mcb';
  }

  if (catSlug === 'safety-products') {
    if (name.includes('jacket') || name.includes('vest')) return 'safety-jackets';
    if (name.includes('glove') || name.includes('mask')) return 'gloves-masks';
    if (name.includes('helmet')) return 'helmets';
    if (name.includes('shoe') || name.includes('boot')) return 'safety-shoes';
    if (name.includes('first aid')) return 'first-aid-kit';
    if (name.includes('tape')) return 'warning-tapes';
    if (name.includes('goggle') || name.includes('eyewear')) return 'safety-goggles';
    return 'safety-jackets';
  }

  if (catSlug === 'ac-spare-parts') {
    if (name.includes('compressor')) return 'ac-compressors';
    if (name.includes('motor') || name.includes('blower')) return 'blower-motor';
    if (name.includes('board') || name.includes('pcb')) return 'pcb-control-board';
    if (name.includes('pipe') || name.includes('tube')) return 'copper-pipe';
    if (name.includes('sensor') || name.includes('thermistor')) return 'temperature-sensor-thermistor';
    if (name.includes('capacitor')) return 'capacitor';
    if (name.includes('gas') || name.includes('refrigerant')) return 'refrigerant-gas';
    return 'ac-compressors';
  }

  if (catSlug === 'adhesives-tools-hardware') {
    if (name.includes('cordless') || name.includes('drill') || name.includes('driver')) return 'cordless-tools';
    if (name.includes('tester') || name.includes('thermometer') || name.includes('meter') || name.includes('probe')) return 'hand-tools';
    if (name.includes('adhesive') || name.includes('sealant') || name.includes('silicone') || name.includes('glue')) return 'adhesives-sealants';
    if (name.includes('fastener') || name.includes('screw') || name.includes('bolt') || name.includes('bit')) return 'hardware-fasteners';
    return 'hand-tools';
  }

  if (catSlug === 'building-materials') {
    if (name.includes('clamp')) return 'clamps';
    if (name.includes('paint')) return 'paints-adjustments';
    if (name.includes('nail')) return 'steel-nail';
    if (name.includes('bolt') || name.includes('nut')) return 'bolts-nuts';
    if (name.includes('pipe') || name.includes('fitting')) return 'upvc-pipes-fittings';
    if (name.includes('valve') || name.includes('bibcock')) return 'brass-valves-bibcocks';
    if (name.includes('sanitary') || name.includes('sink')) return 'sanitary-ware-sinks';
    return 'upvc-pipes-fittings';
  }

  return 'general';
}

export function getProductItemSlug(product) {
  if (!product) return 'item';
  if (product.slug) return slugify(product.slug);
  if (product.name) return slugify(product.name);
  if (product.sku) return slugify(product.sku);
  return `product-${product.realId || product.id || 'item'}`;
}

export function getProductUrl(product) {
  if (!product) return '/product-details';
  const categorySlug = getProductCategorySlug(product);
  const subcategorySlug = getProductSubcategorySlug(product);
  const itemSlug = getProductItemSlug(product);

  if (categorySlug && subcategorySlug && itemSlug) {
    return `/${categorySlug}/${subcategorySlug}/${itemSlug}`;
  }
  if (categorySlug && itemSlug) {
    return `/${categorySlug}/${itemSlug}`;
  }
  return '/product-details';
}

// Built-in static catalog of all pre-populated products (featured, best sellers, etc.)
// for instant resolution on hard reload or direct navigation
export const STATIC_CATALOG = [
  {
    id: 1,
    name: 'Philips LED Downlight 15W Round (Cool White)',
    price: 'AED 35.00',
    image: '/prod_downlight_1791451418016.png',
    brand: 'PHILIPS',
    category_slug: 'led-lighting-special-lamp',
    category_name: 'LED Lighting & Special Lamp',
    subcategory_slug: 'down-lights',
    subcategory_name: 'Down Lights',
    wattage: '15W',
    warranty: '2 Years Manufacturer Warranty'
  },
  {
    id: 2,
    name: 'Ducab Electrical Cable 3 Core 2.5mm (100m)',
    price: 'AED 320.00',
    image: '/prod_cable_1791451428788.png',
    brand: 'DUCAB',
    category_slug: 'wires-cables',
    category_name: 'Wires & Cables',
    subcategory_slug: 'building-wires',
    subcategory_name: 'Building Wires',
    warranty: 'Certified BASEC / Civil Defence Approved'
  },
  {
    id: 3,
    name: 'Legrand 13A Switch Socket White',
    price: 'AED 18.00',
    image: '/prod_socket_1791451439423.png',
    brand: 'LEGRAND',
    category_slug: 'switches-sockets-electrical-accessories',
    category_name: 'Switches, Sockets & Electrical Accessories',
    subcategory_slug: 'power-sockets-outlets',
    subcategory_name: 'Power Sockets & Outlets',
    warranty: '5 Years Manufacturer Warranty'
  },
  {
    id: 4,
    name: 'Schneider MCB 63A 1P',
    price: 'AED 25.00',
    image: '/prod_mcb_1791451449276.png',
    brand: 'SCHNEIDER',
    category_slug: 'switchgear-control-panel-products',
    category_name: 'Switchgear & Control Panel Products',
    subcategory_slug: 'mcb',
    subcategory_name: 'MCB',
    warranty: '5 Years Official Warranty'
  },
  {
    id: 5,
    name: 'LED Flood Light 100W IP65 (Outdoor)',
    price: 'AED 120.00',
    image: '/prod_floodlight_1791451459906.png',
    brand: 'PHILIPS',
    category_slug: 'led-lighting-special-lamp',
    category_name: 'LED Lighting & Special Lamp',
    subcategory_slug: 'flood-lights',
    subcategory_name: 'Flood Lights',
    wattage: '100W',
    warranty: '2 Years Official Warranty'
  },
  {
    id: 'bs-1',
    name: 'Legrand 2 Gang Switch White',
    price: 'AED 28.00',
    image: '/switch.png',
    brand: 'LEGRAND',
    category_slug: 'switches-sockets-electrical-accessories',
    category_name: 'Switches, Sockets & Electrical Accessories',
    subcategory_slug: 'wall-switches-dimmers',
    subcategory_name: 'Wall Switches & Dimmers',
    warranty: '5 Years Manufacturer Warranty'
  },
  {
    id: 'bs-2',
    name: 'Fluke 62 MAX MINI Thermometer',
    price: 'AED 350.00',
    image: '/Fluke 62 MAX MINI Thermometer.png',
    brand: 'FLUKE',
    category_slug: 'adhesives-tools-hardware',
    category_name: 'Adhesives, Tools & Hardware',
    subcategory_slug: 'hand-tools',
    subcategory_name: 'Electrician Hand Tools',
    warranty: 'Lifetime Limited Warranty'
  },
  {
    id: 'bs-3',
    name: 'Fluke T140 Voltage Tester with Probes',
    price: 'AED 480.00',
    image: '/Fluke T140 Voltage Tester with Probes.png',
    brand: 'FLUKE',
    category_slug: 'adhesives-tools-hardware',
    category_name: 'Adhesives, Tools & Hardware',
    subcategory_slug: 'hand-tools',
    subcategory_name: 'Electrician Hand Tools',
    warranty: 'Lifetime Limited Warranty'
  },
  {
    id: 'bs-4',
    name: 'Schneider RCCB 40A 2P',
    price: 'AED 95.00',
    image: '/prod_mcb_1791451449276.png',
    brand: 'SCHNEIDER',
    category_slug: 'switchgear-control-panel-products',
    category_name: 'Switchgear & Control Panel Products',
    subcategory_slug: 'mcb',
    subcategory_name: 'MCB',
    warranty: '5 Years Official Warranty'
  },
  {
    id: 'bs-5',
    name: 'LED Street Light 150W IP65',
    price: 'AED 280.00',
    image: '/prod_floodlight_1791451459906.png',
    brand: 'PHILIPS',
    category_slug: 'led-lighting-special-lamp',
    category_name: 'LED Lighting & Special Lamp',
    subcategory_slug: 'street-lights',
    subcategory_name: 'Street Lights',
    wattage: '150W',
    warranty: '3 Years Official Warranty'
  },
  {
    id: 6,
    realId: 6,
    name: 'High-Visibility Reflective Safety Jacket (Neon Yellow)',
    price: 'AED 100.00',
    old_price: 'AED 120.00',
    image: 'https://res.cloudinary.com/iiai36zv/image/upload/v1792131867/superlight/uploads/upload_1792131866150_243734552.png',
    images: [
      'https://res.cloudinary.com/iiai36zv/image/upload/v1792131867/superlight/uploads/upload_1792131866150_243734552.png',
      'https://res.cloudinary.com/iiai36zv/image/upload/v1792131885/superlight/uploads/upload_1792131884152_110043095.png'
    ],
    brand: 'fluke',
    category_slug: 'safety-products',
    category_name: 'Safety Products',
    subcategory_slug: 'safety-jackets',
    subcategory_name: 'Safety Jackets',
    model: 'FLU-SFT-JKT',
    warranty: 'Official Standard',
    wattage: 'EN 471 Standard',
    description: 'The High-Visibility Reflective Safety Jacket is designed to improve visibility and safety in low-light and outdoor working environments.'
  }
];

export function findProductInCatalog(catalog, targetSlug, categorySlug = null) {
  if (!Array.isArray(catalog) || !targetSlug) return null;
  const cleanTarget = String(targetSlug).toLowerCase().trim();
  const norm = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const normTarget = norm(cleanTarget);

  // 1. Exact match on slugify(name)
  for (const p of catalog) {
    if (slugify(p.name) === cleanTarget) return p;
  }

  // 2. Exact match on SKU or dynamic SKU
  for (const p of catalog) {
    if (p.sku && String(p.sku).toLowerCase() === cleanTarget) return p;
    if (getProductSku(p).toLowerCase() === cleanTarget) return p;
  }

  // 3. Exact match on model
  for (const p of catalog) {
    if (p.model && slugify(p.model) === cleanTarget) return p;
  }

  // 4. Exact match on alphanumeric normalized strings
  for (const p of catalog) {
    if (norm(p.name) === normTarget) return p;
    if (p.sku && norm(p.sku) === normTarget) return p;
    if (norm(getProductSku(p)) === normTarget) return p;
    if (p.model && norm(p.model) === normTarget) return p;
  }

  // 5. Exact match on id or db-id
  for (const p of catalog) {
    if (String(p.id) === cleanTarget) return p;
    if (p.realId && String(p.realId) === cleanTarget) return p;
    if (`db-${p.id}` === cleanTarget) return p;
  }

  // 6. Partial alphanumeric contains match
  for (const p of catalog) {
    const pNorm = norm(p.name);
    if (pNorm.includes(normTarget) || normTarget.includes(pNorm)) return p;
  }

  // 7. If cleanTarget looks like a brand SKU (e.g. duc-3601, flu-4336)
  const skuPrefixMatch = cleanTarget.match(/^([a-z]{3})[-_]?(\d+)?$/i);
  if (skuPrefixMatch) {
    const prefix = skuPrefixMatch[1].toLowerCase();
    const candidate = catalog.find(p => {
      const b = (p.brand || '').toLowerCase();
      const n = (p.name || '').toLowerCase();
      return b.startsWith(prefix) || n.startsWith(prefix);
    });
    if (candidate) return candidate;
  }

  return null;
}

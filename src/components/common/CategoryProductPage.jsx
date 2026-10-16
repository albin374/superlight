import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Heart, 
  ShoppingCart, 
  Star, 
  Check, 
  RotateCcw, 
  ChevronUp, 
  ChevronDown, 
  Search, 
  LayoutGrid, 
  List,
  Filter,
  ArrowUpDown,
  X,
  Layers
} from 'lucide-react';
import './CategoryProductPage.css';
import WhatsAppOrderModal, { WhatsAppIcon } from './WhatsAppOrderModal';
import { useShop } from '../../context/ShopContext';
import { getProductUrl } from '../../utils/productUrl';

const CATEGORY_DEFAULT_SUBCATEGORIES = {
  lighting: [
    { id: 'down-lights', name: 'Down Lights' },
    { id: 'panel-lights', name: 'Panel Lights' },
    { id: 'spot-lights', name: 'Spot Lights' },
    { id: 'track-lights', name: 'Track Lights' },
    { id: 'flood-lights', name: 'Flood Lights' },
    { id: 'street-lights', name: 'Street Lights' },
    { id: 'high-bay-lights', name: 'High bay lights' },
    { id: 'outdoor-lights', name: 'Outdoor lights' },
  ],
  wires: [
    { id: 'buliding-wires', name: 'Buliding wires' },
    { id: 'felxible-cables', name: 'Felxible cables' },
    { id: 'rubber-cables', name: 'Rubber Cables' },
    { id: 'heat-resistance-cable', name: 'Heat Resistance Cable' },
    { id: 'control-cables', name: 'control Cables' },
    { id: 'knx-cables-fire-alarm-cables', name: 'KNX Cables & Fire Alarm Cables' },
    { id: 'network-cables', name: 'Network Cables' },
  ],
  switches: [
    { id: 'mk-switches', name: 'Mk Switches' },
    { id: 'wall-switches-dimmers', name: 'Wall Switches & Dimmers' },
    { id: 'power-sockets-outlets', name: 'Power Sockets & Outlets' },
    { id: 'weatherproof-sockets-boxes', name: 'Weatherproof Sockets & Boxes' },
    { id: 'door-bells-chimes', name: 'Door Bells & Chimes' },
    { id: 'industrial-plugs-sockets', name: 'Industrial Plugs & Sockets' },
  ],
  switchgear: [
    { id: 'mcb', name: 'MCB' },
    { id: 'mccb-breakers', name: 'MCCB Breakers' },
    { id: 'distribution-boards-enclosures', name: 'Distribution Boards & Enclosures' },
    { id: 'automatic-transfer-switch', name: 'Automatic Transfer Switch (ATS)' },
    { id: 'smart-automation-hubs-relays', name: 'Smart Automation Hubs & Relays' },
    { id: 'contactors-overload-relays', name: 'Contactors & Overload Relays' },
  ],
  building: [
    { id: 'clamps', name: 'clamps' },
    { id: 'paints-adjustments', name: 'Paints & Adjustments' },
    { id: 'steel-nail', name: 'Steel Nail' },
    { id: 'bolts-nuts', name: 'Bolts &  Nuts' },
    { id: 'upvc-pipes-fittings', name: 'UPVC Pipes & Fittings' },
    { id: 'brass-valves-bibcocks', name: 'Brass Valves & Bibcocks' },
    { id: 'sanitary-ware-sinks', name: 'Sanitary Ware & Sinks' },
  ],
  safety: [
    { id: 'helmets', name: 'Helmets' },
    { id: 'high-vis-safety-vests', name: 'High-Vis Safety Vests' },
    { id: 'work-gloves-hand-protection', name: 'Work Gloves & Hand Protection' },
    { id: 'protective-eyewear-goggles', name: 'Protective Eyewear & Goggles' },
    { id: 'industrial-safety-boots', name: 'Industrial Safety Boots' },
    { id: 'respirators-dust-masks', name: 'Respirators & Dust Masks' },
  ],
  ac: [
    { id: 'capacitor', name: 'Capacitor' },
    { id: 'refrigerant-gas', name: 'Refrigerant Gas' },
    { id: 'copper-pipes-line-sets', name: 'Copper Pipes & Line Sets' },
    { id: 'split-ac-remote-controllers', name: 'Split AC Remote Controllers' },
    { id: 'ac-compressors', name: 'AC Compressors' },
    { id: 'flare-nuts-brass-fittings', name: 'Flare Nuts & Brass Fittings' },
  ],
  tools: [
    { id: 'cordless-tools', name: 'Cordless Power Tools' },
    { id: 'hand-tools', name: 'Electrician Hand Tools' },
    { id: 'hardware-fasteners', name: 'Hardware Fasteners & Bits' },
    { id: 'adhesives-sealants', name: 'Adhesives & Sealants' },
  ]
};

const getCategoryKey = (str) => {
  const s = (str || '').toLowerCase();
  if (s.includes('switchgear') || s.includes('control-panel') || s.includes('control panel') || s.includes('automation')) return 'switchgear';
  if (s.includes('lighting') || s.includes('lamp') || s.includes('led') || s.includes('light')) return 'lighting';
  if (s.includes('socket') || (s.includes('switch') && !s.includes('switchgear')) || s.includes('accessories')) return 'switches';
  if (s.includes('wire') || s.includes('cable')) return 'wires';
  if (s.includes('building') || s.includes('plumb')) return 'building';
  if (s.includes('safety') || s.includes('ppe')) return 'safety';
  if (s.includes('ac-') || s.includes('spair') || s.includes('spare') || s.includes('air conditioning')) return 'ac';
  if (s.includes('adhesiv') || s.includes('tool') || s.includes('hardware')) return 'tools';
  return '';
};


const CategoryProductPage = ({
  categoryName = 'Wires & Cables',
  heroTitle = 'Wires & Cables',
  heroHighlight = 'Cables',
  heroDesc = 'Certified low & medium voltage power cables, building wires, industrial conduits, and organized cable routing systems engineered for ultimate safety and performance.',
  heroBannerClass = 'cm-hero-banner',
  products = [],
  onProductClick
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = (location.pathname || '').toLowerCase();

  // Backend Data States
  const [dbProducts, setDbProducts] = useState([]);
  const [apiCategories, setApiCategories] = useState([]);
  const [apiBrands, setApiBrands] = useState([]);

  // Filter States
  const [selectedSubcategory, setSelectedSubcategory] = useState('all');
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [brandSearch, setBrandSearch] = useState('');
  const [showAllBrands, setShowAllBrands] = useState(true);
  const [maxPrice, setMaxPrice] = useState(2000);
  const [isSubcategoriesOpen, setIsSubcategoriesOpen] = useState(true);
  const [sortBy, setSortBy] = useState('default');
  const [viewMode, setViewMode] = useState('grid');
  const [activeMobileSheet, setActiveMobileSheet] = useState(null); // 'subcategories' | 'filter' | 'sort' | null

  // Global Shop State
  const { addToCart: shopAddToCart, toggleWishlist: shopToggleWishlist, isInWishlist } = useShop();

  // Interaction States
  const [addedCart, setAddedCart] = useState({});
  const [waProduct, setWaProduct] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    const params = new URLSearchParams(location.search);
    const subParam = params.get('sub');
    if (subParam) {
      setSelectedSubcategory(subParam);
    } else {
      setSelectedSubcategory('all');
    }
    setSelectedBrands([]);
    setBrandSearch('');
    setActiveMobileSheet(null);
  }, [currentPath, location.search]);

  // Lock body scroll when mobile sheet is open
  useEffect(() => {
    if (activeMobileSheet) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [activeMobileSheet]);

  // Fetch live products, categories and brands from API
  useEffect(() => {
    let isMounted = true;
    const fetchApiData = async () => {
      try {
        const [prodRes, catRes, brandRes] = await Promise.all([
          fetch('/api/products').catch(() => null),
          fetch('/api/categories').catch(() => null),
          fetch('/api/brands').catch(() => null)
        ]);

        if (prodRes && prodRes.ok) {
          const pData = await prodRes.json();
          if (pData.success && isMounted) {
            setDbProducts(pData.products || []);
          }
        }
        if (catRes && catRes.ok) {
          const cData = await catRes.json();
          if (cData.success && isMounted) {
            setApiCategories(cData.categories || []);
          }
        }
        if (brandRes && brandRes.ok) {
          const bData = await brandRes.json();
          if (bData.success && isMounted) {
            setApiBrands(bData.brands || []);
          }
        }
      } catch (e) {
        console.error('[CategoryProductPage] Error fetching API data:', e);
      }
    };

    fetchApiData();
    return () => { isMounted = false; };
  }, [categoryName, currentPath]);

  // Category matching helper
  const pageCategoryKey = useMemo(() => {
    return getCategoryKey(currentPath) || getCategoryKey(categoryName) || 'wires';
  }, [currentPath, categoryName]);

  const isMatchingThisPage = (p) => {
    const pCatName = (p.category_name || p.name || '').toLowerCase();
    const pCatSlug = (p.category_slug || p.slug || '').toLowerCase();
    const itemKey = getCategoryKey(pCatSlug) || getCategoryKey(pCatName);

    if (itemKey && pageCategoryKey && itemKey === pageCategoryKey) {
      return true;
    }

    const cleanPath = currentPath.replace(/^\//, '').replace(/\/$/, '');
    if (cleanPath && (pCatSlug === cleanPath || pCatSlug.includes(cleanPath) || cleanPath.includes(pCatSlug))) {
      return true;
    }

    const target = (categoryName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanCat = pCatName.replace(/[^a-z0-9]/g, '');
    const cleanSlug = pCatSlug.replace(/[^a-z0-9]/g, '');
    if (target && cleanCat && (target.includes(cleanCat) || cleanCat.includes(target))) return true;
    if (target && cleanSlug && (target.includes(cleanSlug) || cleanSlug.includes(target))) return true;

    return false;
  };

  // Format backend products into frontend schema
  const formattedDbProducts = useMemo(() => {
    return dbProducts
      .filter(isMatchingThisPage)
      .map(p => {
        let pPrice = typeof p.price === 'number' ? `AED ${p.price.toFixed(2)}` : p.price;
        let pOldPrice = p.old_price ? `AED ${parseFloat(p.old_price).toFixed(2)}` : null;
        let mainImg = (Array.isArray(p.images) && p.images.length > 0) ? p.images[0] : (p.image || '/prod_downlight_1791451418016.png');

        return {
          id: `db-${p.id}`,
          realId: p.id,
          name: p.name,
          price: pPrice,
          oldPrice: pOldPrice,
          image: mainImg,
          images: Array.isArray(p.images) && p.images.length > 0 ? p.images : [mainImg],
          brand: (p.brand || '').trim(),
          subcategory: (p.subcategory_name || '').trim(),
          category: p.category_name || categoryName,
          category_name: p.category_name || categoryName,
          category_slug: p.category_slug,
          subcategory_name: p.subcategory_name,
          subcategory_slug: p.subcategory_slug,
          sku: p.sku,
          rating: p.rating || 5,
          reviews: p.reviews_count || 24,
          warranty: p.warranty,
          wattage: p.wattage,
          model: p.model,
          description: p.description,
          is_bestseller: !!p.is_bestseller,
          is_featured: !!p.is_featured,
          isDbProduct: true
        };
      });
  }, [dbProducts, categoryName, currentPath, pageCategoryKey]);

  // Live products catalog strictly from database (no static products)
  const combinedProducts = useMemo(() => {
    return formattedDbProducts;
  }, [formattedDbProducts]);

  // Dynamic Subcategories (strictly for this category)
  const dynamicSubcategories = useMemo(() => {
    const list = [{ id: 'all', name: 'All Products', count: combinedProducts.length }];
    const subMap = new Map();

    // 1. First, populate from matching API main category from backend
    const matchingMainCat = apiCategories.find(isMatchingThisPage);
    if (matchingMainCat && Array.isArray(matchingMainCat.subcategories) && matchingMainCat.subcategories.length > 0) {
      matchingMainCat.subcategories.forEach(s => {
        const key = s.name.toLowerCase().trim();
        subMap.set(key, {
          id: s.slug || key.replace(/[^a-z0-9]+/g, '-'),
          name: s.name.trim()
        });
      });
    }

    // 2. If API hasn't loaded or category had no subcategories in DB, use default subcategories for this category
    if (subMap.size === 0) {
      const defaults = CATEGORY_DEFAULT_SUBCATEGORIES[pageCategoryKey] || [];
      defaults.forEach(d => {
        const key = d.name.toLowerCase().trim();
        subMap.set(key, {
          id: d.id,
          name: d.name
        });
      });
    }

    // 3. For any DB product belonging to this category, if it has a subcategory not in map, add it
    formattedDbProducts.forEach(p => {
      if (p.subcategory && p.subcategory.trim()) {
        const key = p.subcategory.toLowerCase().trim();
        if (!subMap.has(key)) {
          subMap.set(key, {
            id: key.replace(/[^a-z0-9]+/g, '-'),
            name: p.subcategory.trim()
          });
        }
      }
    });

    // 4. Calculate counts for each subcategory
    subMap.forEach(s => {
      const count = combinedProducts.filter(p => {
        if (!p.subcategory) return false;
        const pSub = p.subcategory.toLowerCase().trim();
        const sName = s.name.toLowerCase().trim();
        return pSub === sName || pSub.includes(sName) || sName.includes(pSub);
      }).length;
      list.push({ ...s, count });
    });

    return list;
  }, [combinedProducts, formattedDbProducts, apiCategories, pageCategoryKey, isMatchingThisPage]);

  // Dynamic Brands list (strictly from backend apiBrands)
  const dynamicBrands = useMemo(() => {
    if (!Array.isArray(apiBrands) || apiBrands.length === 0) {
      return [];
    }

    const list = apiBrands.map(b => {
      const bName = (b.name || '').trim();
      const bSlug = b.slug || bName.toLowerCase().replace(/[^a-z0-9]+/g, '-');

      // Count products matching this brand on the current page
      const count = combinedProducts.filter(p => {
        if (!p.brand) return false;
        const pBrand = p.brand.toLowerCase().trim();
        const brandTarget = bName.toLowerCase().trim();
        return pBrand === brandTarget || pBrand.includes(brandTarget) || brandTarget.includes(pBrand);
      }).length;

      return {
        id: bSlug,
        name: bName,
        count: count,
        image: b.image || null,
        is_featured: !!b.is_featured
      };
    });

    // Sort: brands with products on this page first, then alphabetical
    return list.sort((a, b) => {
      if (b.count !== a.count) {
        return b.count - a.count;
      }
      return a.name.localeCompare(b.name);
    });
  }, [combinedProducts, apiBrands]);

  const handleCardClick = (product) => {
    if (onProductClick) {
      onProductClick(product);
    } else {
      navigate(getProductUrl(product), { state: { product } });
    }
  };

  const toggleWishlist = (e, product) => {
    e.stopPropagation();
    shopToggleWishlist(product);
  };

  const handleAddToCart = (e, product) => {
    e.stopPropagation();
    shopAddToCart(product, 1);
    setAddedCart((prev) => ({
      ...prev,
      [product.id]: true
    }));
    setTimeout(() => {
      setAddedCart((prev) => ({
        ...prev,
        [product.id]: false
      }));
    }, 1800);
  };

  const handleReset = () => {
    setSelectedSubcategory('all');
    setSelectedBrands([]);
    setBrandSearch('');
    setMaxPrice(2000);
    setSortBy('default');
  };

  const handleBrandToggle = (brandName) => {
    setSelectedBrands((prev) => 
      prev.includes(brandName) 
        ? prev.filter((b) => b !== brandName) 
        : [...prev, brandName]
    );
  };

  // Filtered brands for brand checklist
  const visibleBrands = useMemo(() => {
    let list = dynamicBrands;
    if (brandSearch.trim()) {
      list = list.filter((b) => 
        b.name.toLowerCase().includes(brandSearch.toLowerCase().trim())
      );
    }
    return showAllBrands ? list : list.slice(0, 7);
  }, [brandSearch, showAllBrands, dynamicBrands]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let list = [...combinedProducts];

    // Subcategory Filter
    if (selectedSubcategory !== 'all') {
      const activeSubObj = dynamicSubcategories.find((s) => s.id === selectedSubcategory);
      if (activeSubObj) {
        list = list.filter((p) => {
          if (!p.subcategory) return false;
          const pSub = p.subcategory.toLowerCase().trim();
          const targetSub = activeSubObj.name.toLowerCase().trim();
          return pSub === targetSub || pSub.includes(targetSub) || targetSub.includes(pSub);
        });
      }
    }

    // Brand Filter
    if (selectedBrands.length > 0) {
      list = list.filter((p) => {
        const pBrand = (p.brand || '').toLowerCase().trim();
        return selectedBrands.some((b) => {
          const bLower = b.toLowerCase().trim();
          return pBrand === bLower || pBrand.includes(bLower) || bLower.includes(pBrand);
        });
      });
    }

    // Price Filter
    list = list.filter((p) => {
      const numPrice = typeof p.price === 'number'
        ? p.price
        : parseFloat(String(p.price).replace(/[^0-9.]/g, '')) || 0;
      return numPrice <= maxPrice;
    });

    // Sort
    if (sortBy === 'price-low') {
      list.sort((a, b) => {
        const pa = parseFloat(String(a.price).replace(/[^0-9.]/g, '')) || 0;
        const pb = parseFloat(String(b.price).replace(/[^0-9.]/g, '')) || 0;
        return pa - pb;
      });
    } else if (sortBy === 'price-high') {
      list.sort((a, b) => {
        const pa = parseFloat(String(a.price).replace(/[^0-9.]/g, '')) || 0;
        const pb = parseFloat(String(b.price).replace(/[^0-9.]/g, '')) || 0;
        return pb - pa;
      });
    } else if (sortBy === 'rating') {
      list.sort((a, b) => (b.reviews || 0) - (a.reviews || 0));
    }

    return list;
  }, [combinedProducts, selectedSubcategory, dynamicSubcategories, selectedBrands, maxPrice, sortBy]);

  return (
    <div className="cpp-page">
      {/* Top Banner */}
      <section className={`cpp-hero-banner ${heroBannerClass}`} aria-label={categoryName}>
        <div className="cpp-hero-overlay"></div>
        <div className="container cpp-hero-container">
          <div className="cpp-hero-content">
            <h1 className="cpp-hero-title">
              {heroHighlight ? (
                <>
                  {heroTitle.replace(heroHighlight, '')}
                  <span className="title-pink">{heroHighlight}</span>
                </>
              ) : (
                heroTitle
              )}
            </h1>
            <p className="cpp-hero-desc">{heroDesc}</p>
          </div>
        </div>
      </section>

      {/* Main Container: Sidebar + Product Grid */}
      <div className="cpp-layout-container">
        {/* Left Sidebar Filter */}
        <aside className="cpp-sidebar">
          <div className="cpp-filter-header">
            <h3 className="cpp-filter-title">Filters</h3>
            <button 
              type="button" 
              className="cpp-reset-btn" 
              onClick={handleReset}
              title="Reset all filters"
            >
              <RotateCcw size={14} />
              Reset
            </button>
          </div>

          {/* Subcategories Block */}
          <div className="cpp-filter-group">
            <div 
              className="cpp-group-header" 
              onClick={() => setIsSubcategoriesOpen(!isSubcategoriesOpen)}
            >
              <h4 className="cpp-group-title">Subcategories</h4>
              {isSubcategoriesOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>

            {isSubcategoriesOpen && (
              <div className="cpp-subcat-list">
                {dynamicSubcategories.map((sub) => {
                  const isChecked = selectedSubcategory === sub.id;
                  return (
                    <div 
                      key={sub.id} 
                      className={`cpp-subcat-item ${isChecked ? 'active' : ''}`}
                      onClick={() => setSelectedSubcategory(sub.id)}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="cpp-subcat-left">
                        <div className={`cpp-custom-checkbox ${isChecked ? 'checked' : ''}`}>
                          {isChecked && <Check size={12} strokeWidth={3} />}
                        </div>
                        <span className="cpp-subcat-name">{sub.name}</span>
                      </div>
                      <span className="cpp-subcat-count">({sub.count})</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Brand Filter Block */}
          <div className="cpp-filter-group">
            <h4 className="cpp-group-title">Brand</h4>
            
            {/* Search Brand Input */}
            <div className="cpp-search-input-wrapper">
              <Search size={14} className="cpp-search-icon" />
              <input 
                type="text" 
                placeholder="Search brand" 
                className="cpp-brand-search-input"
                value={brandSearch}
                onChange={(e) => setBrandSearch(e.target.value)}
              />
            </div>

            {/* Brand Checkboxes */}
            <div className="cpp-brand-list">
              {visibleBrands.map((b) => {
                const isChecked = selectedBrands.includes(b.name);
                return (
                  <div 
                    key={b.id} 
                    className="cpp-brand-item"
                    onClick={() => handleBrandToggle(b.name)}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="cpp-brand-left">
                      <div className={`cpp-custom-checkbox ${isChecked ? 'checked' : ''}`}>
                        {isChecked && <Check size={12} strokeWidth={3} />}
                      </div>
                      <span className="cpp-brand-name-label">{b.name}</span>
                    </div>
                    <span className="cpp-brand-count">({b.count})</span>
                  </div>
                );
              })}
            </div>

            {dynamicBrands.length > 7 && !brandSearch && (
              <button 
                type="button" 
                className="cpp-show-more-btn"
                onClick={() => setShowAllBrands(!showAllBrands)}
              >
                {showAllBrands ? 'Show Less -' : 'Show More +'}
              </button>
            )}
          </div>

          {/* Price Range Block */}
          <div className="cpp-filter-group">
            <h4 className="cpp-group-title">Price Range (AED)</h4>
            
            <div className="cpp-slider-wrapper">
              <input 
                type="range" 
                min="0" 
                max="2000" 
                step="25"
                value={maxPrice} 
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="cpp-price-slider"
                style={{
                  background: `linear-gradient(to right, #e6005c 0%, #e6005c ${(maxPrice / 2000) * 100}%, #e2e8f0 ${(maxPrice / 2000) * 100}%, #e2e8f0 100%)`
                }}
              />
              <div className="cpp-slider-labels">
                <span className="cpp-price-min">AED 0</span>
                <span className="cpp-price-max">AED {maxPrice.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Right Main Content */}
        <main className="cpp-main-content">
          {/* Top Bar Controls */}
          <div className="cpp-top-bar">
            <div className="cpp-top-title-group">
              <h2 className="cpp-main-heading">All {categoryName} Products</h2>
              <span className="cpp-top-count">
                Showing 1 - {filteredProducts.length} of {combinedProducts.length} products
              </span>
            </div>

            <div className="cpp-top-controls">
              <div className="cpp-sort-wrapper">
                <label htmlFor="cpp-sort-select">Sort by:</label>
                <select 
                  id="cpp-sort-select"
                  className="cpp-sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="default">Default</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Customer Rating</option>
                </select>
              </div>

              <div className="cpp-view-toggles">
                <button 
                  type="button"
                  className={`cpp-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                  onClick={() => setViewMode('grid')}
                  title="Grid view"
                  aria-label="Grid view"
                >
                  <LayoutGrid size={18} />
                </button>
                <button 
                  type="button"
                  className={`cpp-view-btn ${viewMode === 'list' ? 'active' : ''}`}
                  onClick={() => setViewMode('list')}
                  title="List view"
                  aria-label="List view"
                >
                  <List size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Product Grid / List */}
          {filteredProducts.length > 0 ? (
            <div className={`cpp-products-grid ${viewMode === 'list' ? 'list-view' : ''}`}>
              {filteredProducts.map((product) => {
                const isFavorited = isInWishlist(product.id);
                const isAdded = !!addedCart[product.id];

                return (
                  <div 
                    key={product.id}
                    className="cpp-product-card"
                    onClick={() => handleCardClick(product)}
                  >
                    {/* Badges Container for Best Seller & Featured */}
                    {(product.is_bestseller || product.is_featured) && (
                      <div className="cpp-badge-container">
                        {product.is_bestseller && (
                          <span className="cpp-badge bestseller">Best Seller</span>
                        )}
                        {product.is_featured && (
                          <span className="cpp-badge featured">Featured</span>
                        )}
                      </div>
                    )}

                    {/* Wishlist Button */}
                    <button 
                      type="button"
                      className={`cpp-heart-btn ${isFavorited ? 'active' : ''}`}
                      onClick={(e) => toggleWishlist(e, product)}
                      title={isFavorited ? "Remove from wishlist" : "Add to wishlist"}
                      aria-label="Add to wishlist"
                    >
                      <Heart 
                        size={17} 
                        fill={isFavorited ? '#e6005c' : 'none'} 
                        color={isFavorited ? '#e6005c' : '#475569'} 
                      />
                    </button>

                    {/* Image */}
                    <div className="cpp-image-wrapper">
                      <img 
                        src={product.image} 
                        alt={product.name} 
                        className="cpp-product-img" 
                        loading="lazy"
                        onError={(e) => { e.target.onerror = null; e.target.src = '/prod_downlight_1791451418016.png'; }}
                      />
                    </div>

                    {/* Card Content */}
                    <div className="cpp-card-body">
                      <span className="cpp-brand-name">{product.brand}</span>
                      <h3 className="cpp-product-title" title={product.name}>{product.name}</h3>

                      {/* Ratings */}
                      <div className="cpp-rating-row">
                        <div className="cpp-rating-stars">
                          {[...Array(product.rating || 5)].map((_, i) => (
                            <Star key={i} size={13} fill="#f59e0b" color="#f59e0b" />
                          ))}
                        </div>
                        <span className="cpp-rating-count">({product.reviews || 20})</span>
                      </div>

                      {/* Price Row */}
                      <div className="cpp-price-row">
                        <span className="cpp-current-price">{product.price}</span>
                        {product.oldPrice && (
                          <span className="cpp-old-price">{product.oldPrice}</span>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="cpp-card-actions">
                        <button 
                          type="button"
                          className={`cpp-add-cart-btn ${isAdded ? 'added' : ''}`}
                          onClick={(e) => handleAddToCart(e, product)}
                        >
                          {isAdded ? (
                            <>
                              <Check size={16} />
                              <span>Added</span>
                            </>
                          ) : (
                            <>
                              <ShoppingCart size={16} />
                              <span>Add to Cart</span>
                            </>
                          )}
                        </button>

                        <button 
                          type="button"
                          className="cpp-whatsapp-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            setWaProduct(product);
                          }}
                          title="Order via WhatsApp"
                          aria-label="Order via WhatsApp"
                        >
                          <WhatsAppIcon size={15} />
                          <span>Order via</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="cpp-empty-state">
              <p>No products match your selected filters.</p>
              <button type="button" className="cpp-reset-btn-large" onClick={handleReset}>
                Reset Filters
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (Fixed at bottom on mobile) */}
      <div className="cpp-mobile-bottom-bar">
        <button
          type="button"
          className={`cpp-mobile-bottom-btn ${selectedSubcategory !== 'all' ? 'active' : ''}`}
          onClick={() => setActiveMobileSheet('subcategories')}
        >
          <Layers size={16} />
          <span>Subcategories</span>
          {selectedSubcategory !== 'all' && <span className="cpp-mobile-active-dot" />}
        </button>

        <button
          type="button"
          className={`cpp-mobile-bottom-btn ${(selectedBrands.length > 0 || maxPrice < 2000) ? 'active' : ''}`}
          onClick={() => setActiveMobileSheet('filter')}
        >
          <Filter size={16} />
          <span>Filter</span>
          {(selectedBrands.length > 0 || maxPrice < 2000) && (
            <span className="cpp-mobile-filter-badge">
              {selectedBrands.length + (maxPrice < 2000 ? 1 : 0)}
            </span>
          )}
        </button>

        <button
          type="button"
          className={`cpp-mobile-bottom-btn ${sortBy !== 'default' ? 'active' : ''}`}
          onClick={() => setActiveMobileSheet('sort')}
        >
          <ArrowUpDown size={16} />
          <span>Sort</span>
          {sortBy !== 'default' && <span className="cpp-mobile-active-dot" />}
        </button>
      </div>

      {/* Mobile Bottom Sheets (Subcategories, Filter, Sort) */}
      {activeMobileSheet && (
        <div className="cpp-mobile-sheet-overlay" onClick={() => setActiveMobileSheet(null)}>
          <div className="cpp-mobile-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="cpp-mobile-sheet-drag-handle"></div>

            {/* 1. Subcategories Sheet */}
            {activeMobileSheet === 'subcategories' && (
              <>
                <div className="cpp-mobile-sheet-header">
                  <div>
                    <h3 className="cpp-mobile-sheet-title">Select Subcategory</h3>
                    <p className="cpp-mobile-sheet-subtitle">{dynamicSubcategories.length} subcategories available</p>
                  </div>
                  <button 
                    type="button" 
                    className="cpp-mobile-sheet-close"
                    onClick={() => setActiveMobileSheet(null)}
                    aria-label="Close"
                  >
                    <X size={18} />
                  </button>
                </div>
                <div className="cpp-mobile-sheet-body">
                  <div className="cpp-mobile-subcat-list">
                    {dynamicSubcategories.map((sub) => {
                      const isSelected = selectedSubcategory === sub.id;
                      return (
                        <div
                          key={sub.id}
                          className={`cpp-mobile-subcat-row ${isSelected ? 'selected' : ''}`}
                          onClick={() => {
                            setSelectedSubcategory(sub.id);
                            setActiveMobileSheet(null);
                          }}
                        >
                          <div className="cpp-mobile-subcat-row-left">
                            <div className={`cpp-mobile-radio-indicator ${isSelected ? 'checked' : ''}`}>
                              {isSelected && <div className="cpp-mobile-radio-dot" />}
                            </div>
                            <span className="cpp-mobile-subcat-label">{sub.name}</span>
                          </div>
                          <span className="cpp-mobile-subcat-count">({sub.count})</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {/* 2. Filter Sheet: Brand & Price Range (AED) only */}
            {activeMobileSheet === 'filter' && (
              <>
                <div className="cpp-mobile-sheet-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <h3 className="cpp-mobile-sheet-title">Filters</h3>
                    {(selectedBrands.length > 0 || maxPrice < 2000) && (
                      <button 
                        type="button" 
                        className="cpp-mobile-sheet-reset-btn"
                        onClick={() => {
                          setSelectedBrands([]);
                          setBrandSearch('');
                          setMaxPrice(2000);
                        }}
                      >
                        Reset
                      </button>
                    )}
                  </div>
                  <button 
                    type="button" 
                    className="cpp-mobile-sheet-close"
                    onClick={() => setActiveMobileSheet(null)}
                    aria-label="Close"
                  >
                    <X size={18} />
                  </button>
                </div>
                <div className="cpp-mobile-sheet-body">
                  {/* Brand Filter */}
                  <div className="cpp-mobile-filter-section">
                    <h4 className="cpp-mobile-section-title">Brand</h4>
                    <div className="cpp-brand-list cpp-mobile-brand-scroll">
                      {dynamicBrands.map((b) => {
                        const isChecked = selectedBrands.includes(b.name);
                        return (
                          <div 
                            key={b.id} 
                            className="cpp-brand-item"
                            onClick={() => handleBrandToggle(b.name)}
                            role="button"
                            tabIndex={0}
                          >
                            <div className="cpp-brand-left">
                              <div className={`cpp-custom-checkbox ${isChecked ? 'checked' : ''}`}>
                                {isChecked && <Check size={12} strokeWidth={3} />}
                              </div>
                              <span className="cpp-brand-name-label">{b.name}</span>
                            </div>
                            <span className="cpp-brand-count">({b.count})</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="cpp-mobile-divider" />

                  {/* Price Range (AED) */}
                  <div className="cpp-mobile-filter-section">
                    <h4 className="cpp-mobile-section-title">Price Range (AED)</h4>
                    <div className="cpp-slider-wrapper" style={{ marginTop: '14px' }}>
                      <input 
                        type="range" 
                        min="0" 
                        max="2000" 
                        step="25"
                        value={maxPrice} 
                        onChange={(e) => setMaxPrice(Number(e.target.value))}
                        className="cpp-price-slider"
                        style={{
                          background: `linear-gradient(to right, #e6005c 0%, #e6005c ${(maxPrice / 2000) * 100}%, #e2e8f0 ${(maxPrice / 2000) * 100}%, #e2e8f0 100%)`
                        }}
                      />
                      <div className="cpp-slider-labels">
                        <span className="cpp-price-min">AED 0</span>
                        <span className="cpp-price-max">AED {maxPrice.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="cpp-mobile-sheet-footer">
                  <button 
                    type="button"
                    className="cpp-mobile-sheet-clear-btn"
                    onClick={() => {
                      setSelectedBrands([]);
                      setBrandSearch('');
                      setMaxPrice(2000);
                    }}
                  >
                    Clear All
                  </button>
                  <button 
                    type="button"
                    className="cpp-mobile-sheet-apply-btn"
                    onClick={() => setActiveMobileSheet(null)}
                  >
                    Apply ({filteredProducts.length} Products)
                  </button>
                </div>
              </>
            )}

            {/* 3. Sort Sheet */}
            {activeMobileSheet === 'sort' && (
              <>
                <div className="cpp-mobile-sheet-header">
                  <h3 className="cpp-mobile-sheet-title">Sort By</h3>
                  <button 
                    type="button" 
                    className="cpp-mobile-sheet-close"
                    onClick={() => setActiveMobileSheet(null)}
                    aria-label="Close"
                  >
                    <X size={18} />
                  </button>
                </div>
                <div className="cpp-mobile-sheet-body">
                  <div className="cpp-mobile-sort-list">
                    {[
                      { value: 'default', label: 'Default / Popularity' },
                      { value: 'price-low', label: 'Price: Low to High' },
                      { value: 'price-high', label: 'Price: High to Low' },
                      { value: 'rating', label: 'Customer Rating' }
                    ].map((opt) => {
                      const isSelected = sortBy === opt.value;
                      return (
                        <div
                          key={opt.value}
                          className={`cpp-mobile-sort-row ${isSelected ? 'selected' : ''}`}
                          onClick={() => {
                            setSortBy(opt.value);
                            setActiveMobileSheet(null);
                          }}
                        >
                          <span className="cpp-mobile-sort-label">{opt.label}</span>
                          <div className={`cpp-mobile-radio-indicator ${isSelected ? 'checked' : ''}`}>
                            {isSelected && <div className="cpp-mobile-radio-dot" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* WhatsApp Order Modal */}
      <WhatsAppOrderModal 
        isOpen={!!waProduct} 
        product={waProduct} 
        onClose={() => setWaProduct(null)} 
      />
    </div>
  );
};

export default CategoryProductPage;

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
  LayoutGrid, 
  List,
  ShieldCheck
} from 'lucide-react';
import './BrandProductPage.css';
import WhatsAppOrderModal, { WhatsAppIcon } from '../common/WhatsAppOrderModal';
import { useShop } from '../../context/ShopContext';
import { getProductUrl } from '../../utils/productUrl';

const BRAND_INFO = {
  dewalt: {
    logo: '/logo/DeWalt_Logo.svg',
    origin: 'USA / Global',
    category: 'Power Tools & Jobsite Equipment',
    warranty: 'Up to 3 Years Official Warranty',
    cert: 'Guaranteed Tough® / ISO 9001',
    tagline: 'High-performance cordless power tools, rotary hammers & jobsite accessories.'
  },
  makita: {
    logo: '/logo/makitha.png',
    origin: 'Japan / Global',
    category: 'Cordless Tools & Machinery',
    warranty: '2 Years Manufacturer Warranty',
    cert: 'Brushless LXT® / CE Certified',
    tagline: 'Leading innovation in cordless motors, cutting equipment & jobsite tools.'
  },
  ducab: {
    logo: '/logo/Ducab.png',
    origin: 'UAE / Global',
    category: 'Cables & Building Wires',
    warranty: 'Certified Standard Compliance',
    cert: 'BASEC / LPCB / Civil Defence Approved',
    tagline: 'Certified high, medium & low voltage cables and fire performance solutions.'
  },
  fluke: {
    logo: '/logo/Fluke_Logo2.webp',
    origin: 'USA / Global',
    category: 'Test & Measurement Instruments',
    warranty: 'Up to Lifetime Limited Warranty',
    cert: 'CAT III / CAT IV Industrial Safety',
    tagline: 'The global standard in digital multimeters, clamp meters & calibration tools.'
  },
  philips: {
    logo: '/logo/philips.png',
    origin: 'Netherlands / Global',
    category: 'LED Lighting & Special Luminaires',
    warranty: '2 to 5 Years Warranty',
    cert: 'Energy Star / CE / RoHS Certified',
    tagline: 'Energy-efficient LED downlights, high bays, floodlights & commercial fixtures.'
  },
  osram: {
    logo: '/logo/osram.png',
    origin: 'Germany / Global',
    category: 'Industrial Optical Lamps',
    warranty: '3 to 5 Years Warranty',
    cert: 'DIN / IEC Optical Standards',
    tagline: 'Precision optical semiconductors, high-lumen industrial lamps & floodlights.'
  },
  belden: {
    logo: '/logo/belden.png',
    origin: 'USA / Global',
    category: 'Enterprise Networking & Cabling',
    warranty: '25-Year System Warranty',
    cert: 'ANSI/TIA-568-C.2 / ISO 11801',
    tagline: 'Mission-critical signal transmission, Cat6/6A network cables & patch panels.'
  },
  legrand: {
    logo: '/logo/Legrand.png',
    origin: 'France / Global',
    category: 'Wiring Devices & Enclosures',
    warranty: '5 Years Manufacturer Warranty',
    cert: 'BS 1363 / IEC 60669 / IP55',
    tagline: 'Luxury switches, sockets, weatherproof boxes & distribution enclosures.'
  },
  schneider: {
    logo: '/logo/Schneider Electric.png',
    origin: 'France / Global',
    category: 'Switchgear & Circuit Protection',
    warranty: '5 Years Manufacturer Warranty',
    cert: 'IEC 60947-2 / VisiTrip™ Certified',
    tagline: 'Low-voltage switchgear, MCBs, MCCBs, contactors & electrical distribution.'
  }
};

const getBrandInfo = (name) => {
  const s = (name || '').toLowerCase();
  for (const [k, v] of Object.entries(BRAND_INFO)) {
    if (s.includes(k)) return v;
  }
  return {
    logo: null,
    origin: 'Global',
    category: 'Electrical & Hardware',
    warranty: 'Manufacturer Warranty',
    cert: 'International Quality Certified',
    tagline: 'Genuine certified products with fast UAE distribution.'
  };
};

const BrandProductPage = ({
  brandName = 'DeWalt',
  heroTitle,
  heroHighlight,
  heroDesc = '',
  bannerImage = '/DEWALT .png',
  products = [],
  onProductClick
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Backend Data States
  const [dbProducts, setDbProducts] = useState([]);
  
  // Filter States
  const [selectedSubcategory, setSelectedSubcategory] = useState('all');
  const [maxPrice, setMaxPrice] = useState(3000);
  const [isSubcategoriesOpen, setIsSubcategoriesOpen] = useState(true);
  const [sortBy, setSortBy] = useState('default');
  const [viewMode, setViewMode] = useState('grid');

  // Global Shop State
  const { addToCart: shopAddToCart, toggleWishlist: shopToggleWishlist, isInWishlist } = useShop();

  // Interaction States
  const [addedCart, setAddedCart] = useState({});
  const [waProduct, setWaProduct] = useState(null);

  const brandInfo = useMemo(() => getBrandInfo(brandName), [brandName]);

  useEffect(() => {
    window.scrollTo(0, 0);
    setSelectedSubcategory('all');
  }, [location.pathname]);

  // Fetch live products from backend API matching this brand
  useEffect(() => {
    let isMounted = true;
    const fetchBrandProducts = async () => {
      try {
        const prodRes = await fetch('/api/products').catch(() => null);
        if (prodRes && prodRes.ok) {
          const pData = await prodRes.json();
          if (pData.success && isMounted) {
            setDbProducts(pData.products || []);
          }
        }
      } catch (e) {
        console.error('[BrandProductPage] Error fetching products:', e);
      }
    };

    fetchBrandProducts();
    return () => { isMounted = false; };
  }, [brandName]);

  // Check if a backend product belongs to this brand
  const isMatchingBrand = (p) => {
    if (!p) return false;
    const targetBrand = (brandName || '').toLowerCase().trim();
    const pBrand = (p.brand || '').toLowerCase().trim();
    const pName = (p.name || '').toLowerCase();

    // Direct match (e.g. "ducab" === "ducab", "belden" === "belden", "fluke" === "fluke")
    if (pBrand && (pBrand === targetBrand || pBrand.includes(targetBrand) || targetBrand.includes(pBrand))) {
      return true;
    }
    // Schneider variations
    if (targetBrand.includes('schneider') && (pBrand.includes('schneider') || pName.includes('schneider'))) {
      return true;
    }
    // Dewalt variations
    if (targetBrand.includes('dewalt') && (pBrand.includes('dewalt') || pName.includes('dewalt'))) {
      return true;
    }
    // Fluke variations
    if (targetBrand.includes('fluke') && (pBrand.includes('fluke') || pName.includes('fluke'))) {
      return true;
    }
    // Name contains brand
    if (pName.includes(targetBrand)) {
      return true;
    }
    return false;
  };

  // Format backend products into display schema
  const formattedDbProducts = useMemo(() => {
    return dbProducts
      .filter(isMatchingBrand)
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
          images: Array.isArray(p.images) && p.images.length > 0 ? p.images : (p.image ? [p.image] : []),
          brand: (p.brand || brandName).toUpperCase(),
          category: p.category_name || '',
          category_name: p.category_name || '',
          category_slug: p.category_slug,
          subcategory: (p.subcategory_name || p.category_name || 'General').trim(),
          subcategory_name: p.subcategory_name,
          subcategory_slug: p.subcategory_slug,
          sku: p.sku,
          model: p.model,
          wattage: p.wattage,
          warranty: p.warranty,
          rating: p.rating || 5,
          reviews: p.reviews_count || 24,
          description: p.description || '',
          is_featured: !!p.is_featured,
          is_bestseller: !!p.is_bestseller
        };
      });
  }, [dbProducts, brandName]);

  // Live products catalog strictly from database (no static products)
  const combinedProducts = useMemo(() => {
    return formattedDbProducts;
  }, [formattedDbProducts]);

  // Calculate dynamic subcategories from all available products
  const dynamicSubcategories = useMemo(() => {
    const subMap = new Map();

    combinedProducts.forEach(p => {
      const rawSub = (p.subcategory || 'General').trim();
      const lowerKey = rawSub.toLowerCase();

      if (subMap.has(lowerKey)) {
        subMap.get(lowerKey).count += 1;
      } else {
        subMap.set(lowerKey, {
          id: lowerKey.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
          name: rawSub,
          count: 1
        });
      }
    });

    return [
      { id: 'all', name: 'All Products', count: combinedProducts.length },
      ...Array.from(subMap.values())
    ];
  }, [combinedProducts]);

  // Interaction Handlers
  const toggleWishlist = (e, product) => {
    e.stopPropagation();
    shopToggleWishlist(product);
  };

  const handleAddToCart = (e, product) => {
    e.stopPropagation();
    shopAddToCart(product, 1);
    setAddedCart(prev => ({
      ...prev,
      [product.id]: true
    }));
    setTimeout(() => {
      setAddedCart(prev => ({
        ...prev,
        [product.id]: false
      }));
    }, 1800);
  };

  const handleCardClick = (product) => {
    if (onProductClick) {
      onProductClick(product);
    } else {
      navigate(getProductUrl(product), { state: { product } });
    }
  };

  const handleReset = () => {
    setSelectedSubcategory('all');
    setMaxPrice(3000);
    setSortBy('default');
  };

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let list = [...combinedProducts];

    // Subcategory Filter
    if (selectedSubcategory !== 'all') {
      const activeSubObj = dynamicSubcategories.find(s => s.id === selectedSubcategory);
      if (activeSubObj) {
        const targetSub = activeSubObj.name.toLowerCase().trim();
        list = list.filter(p => {
          const pSub = (p.subcategory || '').toLowerCase().trim();
          return pSub === targetSub || pSub.includes(targetSub) || targetSub.includes(pSub);
        });
      }
    }

    // Price Filter
    list = list.filter(p => {
      const numPrice = typeof p.price === 'number'
        ? p.price
        : parseFloat(String(p.price).replace(/[^0-9.]/g, '')) || 0;
      return numPrice <= maxPrice;
    });

    // Sort
    if (sortBy === 'price-low') {
      list.sort((a, b) => {
        const pA = typeof a.price === 'number' ? a.price : parseFloat(String(a.price).replace(/[^0-9.]/g, '')) || 0;
        const pB = typeof b.price === 'number' ? b.price : parseFloat(String(b.price).replace(/[^0-9.]/g, '')) || 0;
        return pA - pB;
      });
    } else if (sortBy === 'price-high') {
      list.sort((a, b) => {
        const pA = typeof a.price === 'number' ? a.price : parseFloat(String(a.price).replace(/[^0-9.]/g, '')) || 0;
        const pB = typeof b.price === 'number' ? b.price : parseFloat(String(b.price).replace(/[^0-9.]/g, '')) || 0;
        return pB - pA;
      });
    } else if (sortBy === 'rating') {
      list.sort((a, b) => (b.reviews || 0) - (a.reviews || 0));
    }

    return list;
  }, [combinedProducts, selectedSubcategory, dynamicSubcategories, maxPrice, sortBy]);

  // Clean banner image path for CSS url (encode spaces)
  const encodedBanner = encodeURI(bannerImage || '');
  const displayTitle = heroTitle || `${brandName} Brand Products`;
  const displayHighlight = heroHighlight !== undefined ? heroHighlight : 'Brand Products';

  return (
    <div className="cpp-page">
      {/* Top Banner with Brand Image */}
      <section 
        className="cpp-hero-banner" 
        style={{ 
          backgroundImage: `url("${encodedBanner}")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
        aria-label={brandName}
      >
        <div className="cpp-hero-overlay"></div>
        <div className="container cpp-hero-container">
          <div className="cpp-hero-content">
            <h1 className="cpp-hero-title">
              {displayHighlight && displayTitle.toLowerCase().includes(displayHighlight.toLowerCase()) ? (
                (() => {
                  const idx = displayTitle.toLowerCase().indexOf(displayHighlight.toLowerCase());
                  const before = displayTitle.slice(0, idx);
                  const match = displayTitle.slice(idx, idx + displayHighlight.length);
                  const after = displayTitle.slice(idx + displayHighlight.length);
                  return (
                    <>
                      {before}
                      <span className="title-pink">{match}</span>
                      {after}
                    </>
                  );
                })()
              ) : (
                displayTitle
              )}
            </h1>
            {heroDesc ? <p className="cpp-hero-desc">{heroDesc}</p> : null}
          </div>
        </div>
      </section>

      {/* Main Container: Full-Height Left Sidebar + Product Grid (0 Left Gap) */}
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

          {/* Price Range Block */}
          <div className="cpp-filter-group">
            <h4 className="cpp-group-title">Price Range (AED)</h4>
            
            <div className="cpp-slider-wrapper">
              <input 
                type="range" 
                min="0" 
                max="3000" 
                step="25"
                value={maxPrice} 
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="cpp-price-slider"
                style={{
                  background: `linear-gradient(to right, #e6005c 0%, #e6005c ${(maxPrice / 3000) * 100}%, #e2e8f0 ${(maxPrice / 3000) * 100}%, #e2e8f0 100%)`
                }}
              />
              <div className="cpp-slider-labels">
                <span className="cpp-price-min">AED 0</span>
                <span className="cpp-price-max">AED {maxPrice.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Brand Specification Card */}
          <div className="cpp-brand-spec-card">
            {brandInfo.logo && (
              <div className="cpp-brand-spec-logo-wrap">
                <img 
                  src={brandInfo.logo} 
                  alt={`${brandName} Logo`} 
                  className="cpp-brand-spec-logo"
                />
              </div>
            )}
            
            <h5 className="cpp-brand-spec-title">{brandName} Specification</h5>
            <p className="cpp-brand-spec-tagline">{brandInfo.tagline}</p>

            <div className="cpp-brand-spec-divider"></div>

            <div className="cpp-brand-spec-list">
              <div className="cpp-brand-spec-item">
                <span className="cpp-spec-label">Warranty:</span>
                <span className="cpp-spec-val">{brandInfo.warranty}</span>
              </div>
              <div className="cpp-brand-spec-item">
                <span className="cpp-spec-label">Availability:</span>
                <span className="cpp-spec-val in-stock">✓ 100% Genuine & In Stock</span>
              </div>
            </div>

            <div className="cpp-brand-spec-footer">
              <ShieldCheck size={16} className="cpp-spec-shield" />
              <span>Super Light Verified Brand Partner</span>
            </div>
          </div>
        </aside>

        {/* Right Main Content */}
        <main className="cpp-main-content">
          {/* Top Bar Controls */}
          <div className="cpp-top-bar">
            <div className="cpp-top-title-group">
              <h2 className="cpp-main-heading">All {brandName} Products</h2>
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

          {/* Product Grid / List - Same card as WE ARE OFFERING, without warranty or model */}
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
                      <span className="cpp-brand-name">{product.brand || brandName}</span>
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

                      {/* Add to Cart Button */}
                      <button 
                        type="button"
                        className={`cpp-add-cart-btn ${isAdded ? 'added' : ''}`}
                        onClick={(e) => handleAddToCart(e, product)}
                      >
                        {isAdded ? (
                          <>
                            <Check size={16} />
                            Added to Cart
                          </>
                        ) : (
                          <>
                            <ShoppingCart size={16} />
                            Add to Cart
                          </>
                        )}
                      </button>

                      {/* Order via WhatsApp Button */}
                      <button 
                        type="button"
                        className="cpp-whatsapp-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setWaProduct(product);
                        }}
                      >
                        <WhatsAppIcon size={16} />
                        Order via WhatsApp
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="cpp-empty-state">
              <p>No products found matching your current filter.</p>
              <button 
                type="button" 
                className="cpp-reset-btn-large" 
                onClick={handleReset}
              >
                Reset All Filters
              </button>
            </div>
          )}
        </main>
      </div>

      {/* WhatsApp Order Modal */}
      <WhatsAppOrderModal 
        isOpen={!!waProduct} 
        product={waProduct} 
        onClose={() => setWaProduct(null)} 
      />
    </div>
  );
};

export default BrandProductPage;

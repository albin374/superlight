import React, { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  LayoutGrid, 
  List, 
  Heart, 
  ShoppingCart, 
  Star, 
  RotateCcw, 
  ChevronRight, 
  Layers, 
  SlidersHorizontal,
  X,
  ArrowRight
} from 'lucide-react';
import './SearchResultsPage.css';
import WhatsAppOrderModal, { WhatsAppIcon } from '../common/WhatsAppOrderModal';
import { useShop } from '../../context/ShopContext';
import { useAuth } from '../../context/AuthContext';
import { getProductUrl, STATIC_CATALOG } from '../../utils/productUrl';
import { ALL_CATEGORIES, ALL_BRANDS, searchLocalCatalog, renderHighlightedText, getCategoryPath, getBrandPath } from '../../utils/searchEngine';

const SearchResultsPage = ({ onProductClick }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { addToCart, toggleWishlist, isInWishlist } = useShop();
  const { requireAuth } = useAuth();

  // Query parameter extraction
  const searchParams = new URLSearchParams(location.search);
  const query = searchParams.get('q') || searchParams.get('query') || '';

  // Data states
  const [dbProducts, setDbProducts] = useState([]);
  const [categories, setCategories] = useState(ALL_CATEGORIES);
  const [brands, setBrands] = useState(ALL_BRANDS);
  const [isLoading, setIsLoading] = useState(true);

  // Filter & Sort states
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [maxPrice, setMaxPrice] = useState(2500);
  const [sortBy, setSortBy] = useState('relevance');
  const [viewMode, setViewMode] = useState('grid');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Interaction states
  const [waProduct, setWaProduct] = useState(null);
  const [addedCartAlert, setAddedCartAlert] = useState({});

  // Fetch live products, categories, brands from backend
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    Promise.all([
      fetch('/api/products').then(res => res.ok ? res.json() : null).catch(() => null),
      fetch('/api/categories').then(res => res.ok ? res.json() : null).catch(() => null),
      fetch('/api/brands').then(res => res.ok ? res.json() : null).catch(() => null)
    ]).then(([pData, cData, bData]) => {
      if (!isMounted) return;

      if (pData && pData.success && Array.isArray(pData.products)) {
        setDbProducts(pData.products);
      }
      if (cData && cData.success && Array.isArray(cData.categories)) {
        setCategories(cData.categories);
      }
      if (bData && bData.success && Array.isArray(bData.brands)) {
        setBrands(bData.brands);
      }
      setIsLoading(false);
    }).catch(() => {
      if (isMounted) setIsLoading(false);
    });

    return () => { isMounted = false; };
  }, []);

  // Compute matched categories and brands based on query
  const searchMeta = useMemo(() => {
    return searchLocalCatalog(query, {
      liveProducts: dbProducts,
      liveCategories: categories,
      liveBrands: brands
    });
  }, [query, dbProducts, categories, brands]);

  // Combine and format all products
  const allFormattedProducts = useMemo(() => {
    const pool = [];
    const seen = new Set();

    const formatItem = (p) => {
      const key = (p.name || '').toLowerCase().trim();
      if (!key || seen.has(key)) return;
      seen.add(key);

      const priceNum = typeof p.price === 'number' ? p.price : parseFloat(String(p.price || '').replace(/[^0-9.]/g, '')) || 0;
      const oldPriceNum = p.old_price ? Number(p.old_price) : (p.oldPrice ? parseFloat(String(p.oldPrice).replace(/[^0-9.]/g, '')) : null);
      const mainImg = (Array.isArray(p.images) && p.images.length > 0) ? p.images[0] : (p.image || '/prod_downlight_1791451418016.png');

      pool.push({
        id: p.realId || p.id,
        realId: p.realId || p.id,
        name: p.name,
        price: `AED ${priceNum.toFixed(2)}`,
        rawPrice: priceNum,
        oldPrice: oldPriceNum ? `AED ${oldPriceNum.toFixed(2)}` : null,
        image: mainImg,
        images: Array.isArray(p.images) && p.images.length > 0 ? p.images : [mainImg],
        brand: (p.brand || '').trim(),
        category_name: p.category_name || p.category || '',
        category_slug: p.category_slug || '',
        subcategory_name: p.subcategory_name || p.subcategory || '',
        subcategory_slug: p.subcategory_slug || '',
        model: p.model || '',
        sku: p.sku || '',
        rating: p.rating || 5,
        reviews: p.reviews_count || p.reviews || 24,
        description: p.description || '',
        is_featured: !!p.is_featured,
        is_bestseller: !!p.is_bestseller
      });
    };

    if (Array.isArray(dbProducts)) dbProducts.forEach(formatItem);
    STATIC_CATALOG.forEach(formatItem);

    return pool;
  }, [dbProducts]);

  // Filter products by search query
  const searchMatchedProducts = useMemo(() => {
    if (!query.trim()) return allFormattedProducts;
    const q = query.toLowerCase().trim();

    return allFormattedProducts.filter(p => {
      const name = (p.name || '').toLowerCase();
      const brand = (p.brand || '').toLowerCase();
      const cat = (p.category_name || '').toLowerCase();
      const sub = (p.subcategory_name || '').toLowerCase();
      const model = (p.model || '').toLowerCase();
      const sku = (p.sku || '').toLowerCase();
      const desc = (p.description || '').toLowerCase();

      return name.includes(q) ||
             brand.includes(q) ||
             cat.includes(q) ||
             sub.includes(q) ||
             model.includes(q) ||
             sku.includes(q) ||
             desc.includes(q);
    });
  }, [allFormattedProducts, query]);

  // Apply user sidebar filters: Category, Brand, Price Range, Sort
  const filteredProducts = useMemo(() => {
    let list = [...searchMatchedProducts];

    // Filter by category
    if (selectedCategory !== 'all') {
      const targetCat = selectedCategory.toLowerCase();
      list = list.filter(p => {
        const pCat = (p.category_name || '').toLowerCase();
        const pSub = (p.subcategory_name || '').toLowerCase();
        return pCat.includes(targetCat) || pSub.includes(targetCat);
      });
    }

    // Filter by brand
    if (selectedBrand !== 'all') {
      const targetBrand = selectedBrand.toLowerCase();
      list = list.filter(p => (p.brand || '').toLowerCase() === targetBrand);
    }

    // Filter by price
    list = list.filter(p => p.rawPrice <= maxPrice);

    // Sorting
    if (sortBy === 'price-low') {
      list.sort((a, b) => a.rawPrice - b.rawPrice);
    } else if (sortBy === 'price-high') {
      list.sort((a, b) => b.rawPrice - a.rawPrice);
    } else if (sortBy === 'name-asc') {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'rating') {
      list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    return list;
  }, [searchMatchedProducts, selectedCategory, selectedBrand, maxPrice, sortBy]);

  // Distinct categories and brands for sidebar filters
  const filterOptions = useMemo(() => {
    const cats = new Set();
    const brs = new Set();

    searchMatchedProducts.forEach(p => {
      if (p.category_name) cats.add(p.category_name);
      if (p.brand) brs.add(p.brand);
    });

    return {
      categories: Array.from(cats),
      brands: Array.from(brs)
    };
  }, [searchMatchedProducts]);

  const handleProductCardClick = (product) => {
    if (onProductClick) {
      onProductClick(product);
    } else {
      const targetUrl = getProductUrl(product);
      navigate(targetUrl, { state: { product } });
    }
  };

  const handleAddToCart = (e, product) => {
    e.stopPropagation();
    addToCart(product);
    setAddedCartAlert(prev => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedCartAlert(prev => ({ ...prev, [product.id]: false }));
    }, 1500);
  };

  const handleWishlistToggle = (e, product) => {
    e.stopPropagation();
    toggleWishlist(product);
  };

  const resetFilters = () => {
    setSelectedCategory('all');
    setSelectedBrand('all');
    setMaxPrice(2500);
    setSortBy('relevance');
  };

  return (
    <div className="srp-page-container">
      {/* Breadcrumb Bar */}
      <div className="srp-breadcrumb-bar">
        <div className="container">
          <nav className="srp-breadcrumb">
            <Link to="/">Home</Link>
            <ChevronRight size={14} className="srp-breadcrumb-sep" />
            <span>Search</span>
            {query && (
              <>
                <ChevronRight size={14} className="srp-breadcrumb-sep" />
                <span className="srp-breadcrumb-current">"{query}"</span>
              </>
            )}
          </nav>
        </div>
      </div>

      {/* Hero Search Header */}
      <div className="srp-header-banner">
        <div className="container">
          <div className="srp-header-content">
            <div className="srp-title-badge">
              <Search size={16} />
              <span>Catalog Search</span>
            </div>
            <h1 className="srp-main-title">
              {query ? (
                <>Results for <span className="srp-highlight-title">"{query}"</span></>
              ) : (
                <>All Catalog Products</>
              )}
            </h1>
            <p className="srp-subtitle">
              {filteredProducts.length === 1 
                ? 'Showing 1 product matching your search criteria' 
                : `Showing ${filteredProducts.length} products found in SuperLight catalog`}
            </p>

            {/* Related Categories & Brands Quick Pills */}
            {(searchMeta.categories.length > 0 || searchMeta.brands.length > 0) && (
              <div className="srp-quick-tags-section">
                {searchMeta.categories.length > 0 && (
                  <div className="srp-tag-group">
                    <span className="srp-tag-label">Matched Categories:</span>
                    <div className="srp-tags-row">
                      {searchMeta.categories.slice(0, 4).map(cat => (
                        <button
                          key={cat.id}
                          type="button"
                          className="srp-tag-chip srp-cat-chip"
                          onClick={() => navigate(cat.path || getCategoryPath(cat))}
                        >
                          <Layers size={13} />
                          <span>{cat.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {searchMeta.brands.length > 0 && (
                  <div className="srp-tag-group">
                    <span className="srp-tag-label">Matched Brands:</span>
                    <div className="srp-tags-row">
                      {searchMeta.brands.slice(0, 4).map(brand => (
                        <button
                          key={brand.id}
                          type="button"
                          className="srp-tag-chip srp-brand-chip"
                          onClick={() => navigate(brand.path || getBrandPath(brand))}
                        >
                          <span>{brand.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="container srp-main-layout">
        
        {/* Mobile Filter Trigger Button */}
        <div className="srp-mobile-filter-bar">
          <button 
            type="button" 
            className="srp-mobile-filter-toggle"
            onClick={() => setIsMobileFilterOpen(true)}
          >
            <SlidersHorizontal size={16} />
            <span>Filter Products</span>
          </button>
          <div className="srp-results-count-mobile">
            {filteredProducts.length} products found
          </div>
        </div>

        {/* Sidebar Filters */}
        <aside className={`srp-sidebar ${isMobileFilterOpen ? 'mobile-open' : ''}`}>
          <div className="srp-sidebar-inner">
            <div className="srp-sidebar-header">
              <div className="srp-sidebar-title">
                <Filter size={18} />
                <span>Filters</span>
              </div>
              {(selectedCategory !== 'all' || selectedBrand !== 'all' || maxPrice < 2500) && (
                <button type="button" className="srp-reset-btn" onClick={resetFilters}>
                  <RotateCcw size={13} />
                  <span>Reset</span>
                </button>
              )}
              {isMobileFilterOpen && (
                <button 
                  type="button" 
                  className="srp-close-mobile-filter"
                  onClick={() => setIsMobileFilterOpen(false)}
                >
                  <X size={20} />
                </button>
              )}
            </div>

            {/* Filter Group: Category */}
            {filterOptions.categories.length > 0 && (
              <div className="srp-filter-group">
                <h3 className="srp-filter-heading">Category</h3>
                <div className="srp-filter-list">
                  <label className={`srp-filter-item ${selectedCategory === 'all' ? 'active' : ''}`}>
                    <input 
                      type="radio" 
                      name="srp-category" 
                      checked={selectedCategory === 'all'} 
                      onChange={() => setSelectedCategory('all')} 
                    />
                    <span>All Categories</span>
                  </label>
                  {filterOptions.categories.map(cat => (
                    <label key={cat} className={`srp-filter-item ${selectedCategory === cat ? 'active' : ''}`}>
                      <input 
                        type="radio" 
                        name="srp-category" 
                        checked={selectedCategory === cat} 
                        onChange={() => setSelectedCategory(cat)} 
                      />
                      <span>{cat}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Filter Group: Brand */}
            {filterOptions.brands.length > 0 && (
              <div className="srp-filter-group">
                <h3 className="srp-filter-heading">Brand</h3>
                <div className="srp-filter-list">
                  <label className={`srp-filter-item ${selectedBrand === 'all' ? 'active' : ''}`}>
                    <input 
                      type="radio" 
                      name="srp-brand" 
                      checked={selectedBrand === 'all'} 
                      onChange={() => setSelectedBrand('all')} 
                    />
                    <span>All Brands</span>
                  </label>
                  {filterOptions.brands.map(brand => (
                    <label key={brand} className={`srp-filter-item ${selectedBrand === brand ? 'active' : ''}`}>
                      <input 
                        type="radio" 
                        name="srp-brand" 
                        checked={selectedBrand === brand} 
                        onChange={() => setSelectedBrand(brand)} 
                      />
                      <span>{brand}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Filter Group: Max Price */}
            <div className="srp-filter-group">
              <div className="srp-price-heading-row">
                <h3 className="srp-filter-heading">Max Price</h3>
                <span className="srp-price-val">AED {maxPrice}</span>
              </div>
              <input 
                type="range" 
                min="20" 
                max="2500" 
                step="20" 
                value={maxPrice} 
                onChange={(e) => setMaxPrice(Number(e.target.value))} 
                className="srp-price-slider"
              />
              <div className="srp-price-labels">
                <span>AED 20</span>
                <span>AED 2,500+</span>
              </div>
            </div>

            {/* Mobile Apply Button */}
            {isMobileFilterOpen && (
              <button 
                type="button" 
                className="srp-apply-mobile-filter"
                onClick={() => setIsMobileFilterOpen(false)}
              >
                Apply Filters ({filteredProducts.length} Results)
              </button>
            )}
          </div>
        </aside>

        {/* Product Catalog Column */}
        <main className="srp-results-column">
          
          {/* Controls Bar: Results Count, Sort, View Mode */}
          <div className="srp-controls-bar">
            <div className="srp-results-count-text">
              <strong>{filteredProducts.length}</strong> {filteredProducts.length === 1 ? 'Product' : 'Products'} Found
            </div>

            <div className="srp-controls-actions">
              <div className="srp-sort-wrapper">
                <label htmlFor="srp-sort-select">Sort by:</label>
                <select 
                  id="srp-sort-select"
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value)}
                  className="srp-sort-select"
                >
                  <option value="relevance">Relevance</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="name-asc">Name: A to Z</option>
                  <option value="rating">Highest Rated</option>
                </select>
              </div>

              <div className="srp-view-toggles">
                <button 
                  type="button" 
                  className={`srp-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                  onClick={() => setViewMode('grid')}
                  title="Grid View"
                >
                  <LayoutGrid size={18} />
                </button>
                <button 
                  type="button" 
                  className={`srp-view-btn ${viewMode === 'list' ? 'active' : ''}`}
                  onClick={() => setViewMode('list')}
                  title="List View"
                >
                  <List size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Product Cards Grid / List OR Empty State */}
          {filteredProducts.length > 0 ? (
            <div className={`srp-product-list ${viewMode === 'list' ? 'srp-list-view' : 'srp-grid-view'}`}>
              {filteredProducts.map(product => {
                const inWishlist = isInWishlist(product.id);
                const isJustAdded = addedCartAlert[product.id];

                return (
                  <div 
                    key={product.id} 
                    className="srp-product-card"
                    onClick={() => handleProductCardClick(product)}
                  >
                    <div className="srp-card-image-box">
                      <img 
                        src={product.image} 
                        alt={product.name} 
                        className="srp-card-img" 
                        loading="lazy"
                        onError={(e) => { e.target.src = '/prod_downlight_1791451418016.png'; }}
                      />
                      <button 
                        type="button"
                        className={`srp-wishlist-btn ${inWishlist ? 'active' : ''}`}
                        onClick={(e) => handleWishlistToggle(e, product)}
                        title={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                      >
                        <Heart size={16} fill={inWishlist ? '#e6005c' : 'none'} color={inWishlist ? '#e6005c' : '#475569'} />
                      </button>
                      {product.brand && (
                        <span className="srp-card-brand-badge">{product.brand}</span>
                      )}
                    </div>

                    <div className="srp-card-details">
                      {product.category_name && (
                        <span className="srp-card-category">{product.category_name}</span>
                      )}

                      <h3 className="srp-card-title">
                        {renderHighlightedText(product.name, query)}
                      </h3>

                      <div className="srp-card-rating">
                        <div className="srp-stars">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              size={13} 
                              fill={i < Math.floor(product.rating) ? '#f59e0b' : '#e2e8f0'} 
                              color={i < Math.floor(product.rating) ? '#f59e0b' : '#e2e8f0'} 
                            />
                          ))}
                        </div>
                        <span className="srp-reviews-count">({product.reviews})</span>
                      </div>

                      <div className="srp-card-pricing">
                        <span className="srp-card-price">{product.price}</span>
                        {product.oldPrice && (
                          <span className="srp-card-old-price">{product.oldPrice}</span>
                        )}
                      </div>

                      <div className="srp-card-actions">
                        <button 
                          type="button" 
                          className={`srp-add-cart-btn ${isJustAdded ? 'added' : ''}`}
                          onClick={(e) => handleAddToCart(e, product)}
                        >
                          <ShoppingCart size={15} />
                          <span>{isJustAdded ? 'Added!' : 'Add to Cart'}</span>
                        </button>

                        <button 
                          type="button" 
                          className="srp-whatsapp-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            requireAuth(() => setWaProduct(product), {
                              message: 'Please login first and then continue',
                              subtitle: 'Please login to your account to order via WhatsApp. If you do not have an account, please register to proceed.'
                            });
                          }}
                          title="Order via WhatsApp"
                        >
                          <WhatsAppIcon size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* NO PRODUCTS FOUND EMPTY STATE */
            <div className="srp-empty-state-card">
              <div className="srp-empty-icon-wrap">
                <Search size={48} className="srp-empty-search-icon" />
              </div>
              <h2 className="srp-empty-title">
                No products found for "{query}"
              </h2>
              <p className="srp-empty-desc">
                We couldn't find any products matching your search query. Please verify your spelling or try using more general keywords.
              </p>

              {/* Suggestions Box */}
              <div className="srp-suggestions-box">
                <h4 className="srp-suggestions-title">Search Recommendations:</h4>
                <ul className="srp-suggestions-list">
                  <li>Check your search text for typos or misspellings.</li>
                  <li>Try searching by category name (e.g., <strong>Wires</strong>, <strong>Lighting</strong>, <strong>Switchgear</strong>).</li>
                  <li>Try searching by brand name (e.g., <strong>Ducab</strong>, <strong>Schneider</strong>, <strong>DeWalt</strong>, <strong>Philips</strong>).</li>
                  <li>Use broader keywords to find more relevant electrical products.</li>
                </ul>
              </div>

              {/* Popular Category Shortcuts */}
              <div className="srp-popular-categories">
                <span className="srp-popular-label">Popular Categories:</span>
                <div className="srp-popular-chips">
                  <button type="button" onClick={() => navigate('/led-lighting-special-lamp')}>LED Lighting</button>
                  <button type="button" onClick={() => navigate('/wires-cables')}>Wires & Cables</button>
                  <button type="button" onClick={() => navigate('/switches-sockets-electrical-accessories')}>Switches & Sockets</button>
                  <button type="button" onClick={() => navigate('/switchgear-control-panel-products')}>Switchgear</button>
                  <button type="button" onClick={() => navigate('/adhesives-tools-hardware')}>Tools & Hardware</button>
                </div>
              </div>

              <div className="srp-empty-action-buttons">
                <button 
                  type="button" 
                  className="srp-clear-search-btn"
                  onClick={() => {
                    navigate('/search');
                    resetFilters();
                  }}
                >
                  Clear Search & View All
                </button>
                <button 
                  type="button" 
                  className="srp-home-btn"
                  onClick={() => navigate('/')}
                >
                  Back to Homepage
                </button>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* WhatsApp Order Modal */}
      {waProduct && (
        <WhatsAppOrderModal 
          isOpen={!!waProduct}
          onClose={() => setWaProduct(null)}
          product={waProduct}
        />
      )}
    </div>
  );
};

export default SearchResultsPage;


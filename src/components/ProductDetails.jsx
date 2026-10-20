import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import './ProductDetails.css';
import { 
  ChevronRight, 
  ChevronLeft, 
  Maximize, 
  CheckCircle2, 
  ShieldCheck, 
  Truck, 
  Headphones, 
  Plus, 
  Minus, 
  ShoppingCart, 
  Zap, 
  Heart, 
  ArrowRight
} from 'lucide-react';

import WhatsAppOrderModal, { WhatsAppIcon } from './common/WhatsAppOrderModal';
import { useShop } from '../context/ShopContext';
import { useAuth } from '../context/AuthContext';
import { 
  getProductSku, 
  getProductCategorySlug, 
  getProductSubcategorySlug, 
  getProductUrl, 
  CATEGORY_NAMES, 
  STATIC_CATALOG, 
  findProductInCatalog,
  slugify
} from '../utils/productUrl';

const ProductDetails = ({ goHome, product: propProduct, onProductClick }) => {
  const params = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const urlCategorySlug = params.categorySlug;
  const urlSubcategorySlug = params.subcategorySlug;
  const urlProductSlug = params.productSlug;

  const [dbProducts, setDbProducts] = useState([]);

  // Resolve initial active product prioritizing navigation state (explicitly clicked item)
  const [activeProduct, setActiveProduct] = useState(() => {
    if (location.state?.product) return location.state.product;
    if (urlProductSlug) {
      const match = findProductInCatalog(STATIC_CATALOG, urlProductSlug, urlCategorySlug);
      if (match) return match;
    }
    return propProduct || null;
  });

  // Sync / resolve product on URL change or navigation
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // 1. Initial quick seed: prioritize location.state?.product (the item user just clicked)
    const seed = location.state?.product || (
      urlProductSlug ? findProductInCatalog(STATIC_CATALOG, urlProductSlug, urlCategorySlug) : null
    ) || propProduct;

    if (seed) {
      const initialImages = Array.isArray(seed.images) && seed.images.length > 0
        ? seed.images
        : (seed.image ? [seed.image] : ['/prod_downlight_1791451418016.png']);

      setActiveProduct(seed);
      setActiveImage(initialImages[0]);
    }

    // 2. Query live database products to ensure complete product details & actual images
    let isMounted = true;
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        if (!isMounted) return;
        if (data && data.success && Array.isArray(data.products)) {
          setDbProducts(data.products);

          const targetProd = location.state?.product || seed;
          const targetId = targetProd?.realId || targetProd?.id;
          const cleanId = String(targetId || '').replace(/^db-/, '');

          const apiMatch = (cleanId && data.products.find(p => String(p.id) === cleanId))
            || findProductInCatalog(data.products, urlProductSlug, urlCategorySlug)
            || (targetProd?.name && data.products.find(p => p.name && p.name.toLowerCase() === targetProd.name.toLowerCase()));

          if (apiMatch) {
            const pPrice = typeof apiMatch.price === 'number' ? `AED ${apiMatch.price.toFixed(2)}` : apiMatch.price;
            const fullImages = (Array.isArray(apiMatch.images) && apiMatch.images.length > 0)
              ? apiMatch.images
              : (apiMatch.image ? [apiMatch.image] : ['/prod_downlight_1791451418016.png']);
            const mainImg = fullImages[0];

            setActiveProduct({
              ...apiMatch,
              realId: apiMatch.id,
              price: pPrice,
              image: mainImg,
              images: fullImages,
              brand: apiMatch.brand || 'PHILIPS',
              subcategory: apiMatch.subcategory_name || '',
              category: apiMatch.category_name || ''
            });

            setActiveImage(curr => (fullImages.includes(curr) ? curr : mainImg));
          }
        }
      })
      .catch(err => {
        console.warn('[ProductDetails] Error fetching /api/products:', err);
      });

    return () => { isMounted = false; };
  }, [location.pathname, location.search, location.state, urlProductSlug, urlCategorySlug, propProduct]);

  const pName = activeProduct?.name || (urlProductSlug 
    ? urlProductSlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) 
    : 'Philips LED Downlight 15W Round (Cool White)');
    
  const pPrice = (typeof activeProduct?.price === 'number' ? `AED ${activeProduct.price.toFixed(2)}` : activeProduct?.price) || 'AED 35.00';
  const pImage = activeProduct?.image || (Array.isArray(activeProduct?.images) && activeProduct.images.length > 0 ? activeProduct.images[0] : '/prod_downlight_1791451418016.png');

  // Brand heuristic or explicit product brand
  let brand = activeProduct?.brand || 'PHILIPS';
  if (!activeProduct?.brand) {
    if (pName.includes('Ducab')) brand = 'DUCAB';
    else if (pName.includes('Legrand')) brand = 'LEGRAND';
    else if (pName.includes('Schneider')) brand = 'SCHNEIDER';
    else if (pName.includes('Fluke')) brand = 'FLUKE';
    else if (pName.includes('Dewalt')) brand = 'DEWALT';
    else if (pName.includes('Makita')) brand = 'MAKITA';
  }

  // Stable SKU generator
  const displaySku = (activeProduct ? getProductSku(activeProduct) : null) || 'duc-3601';

  // Category & Subcategory Resolution for Breadcrumbs
  const resolvedCategorySlug = getProductCategorySlug(activeProduct) || urlCategorySlug || 'wires-cables';
  const resolvedCategoryName = CATEGORY_NAMES[resolvedCategorySlug] 
    || activeProduct?.category_name 
    || activeProduct?.category 
    || resolvedCategorySlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  const resolvedSubcategorySlug = getProductSubcategorySlug(activeProduct) || urlSubcategorySlug;
  const resolvedSubcategoryName = activeProduct?.subcategory_name 
    || activeProduct?.subcategory 
    || (resolvedSubcategorySlug && resolvedSubcategorySlug !== 'general' 
        ? resolvedSubcategorySlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) 
        : null);

  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('Description');
  const [activeImage, setActiveImage] = useState(pImage);
  const [isWaModalOpen, setIsWaModalOpen] = useState(false);
  const [isAddedFeedback, setIsAddedFeedback] = useState(false);
  const { addToCart, toggleWishlist, isInWishlist } = useShop();
  const { requireAuth } = useAuth();

  const currentProductId = activeProduct?.id || String(pName).toLowerCase().replace(/\s+/g, '-');
  const isFavorited = isInWishlist(currentProductId);

  useEffect(() => {
    setActiveImage(pImage);
    window.scrollTo(0, 0);
  }, [pImage, urlProductSlug]);

  const thumbnails = (activeProduct?.images && Array.isArray(activeProduct.images) && activeProduct.images.length > 0)
    ? activeProduct.images.filter(Boolean)
    : (pImage ? [pImage] : ['/prod_downlight_1791451418016.png']);

  const handleQtyChange = (type) => {
    if (type === 'inc') setQuantity(q => q + 1);
    if (type === 'dec' && quantity > 1) setQuantity(q => q - 1);
  };

  const handlePrevImage = () => {
    if (!thumbnails || thumbnails.length <= 1) return;
    const currentIndex = thumbnails.indexOf(activeImage);
    const prevIndex = (currentIndex - 1 + thumbnails.length) % thumbnails.length;
    setActiveImage(thumbnails[prevIndex]);
  };

  const handleNextImage = () => {
    if (!thumbnails || thumbnails.length <= 1) return;
    const currentIndex = thumbnails.indexOf(activeImage);
    const nextIndex = (currentIndex + 1) % thumbnails.length;
    setActiveImage(thumbnails[nextIndex]);
  };

  // Live database related products (strictly from DB, never static dummy data)
  const relatedProducts = useMemo(() => {
    if (!Array.isArray(dbProducts) || dbProducts.length === 0) {
      return [];
    }

    const currentId = activeProduct?.realId || activeProduct?.id;
    const currentName = (activeProduct?.name || '').toLowerCase().trim();
    const currentCatSlug = (activeProduct?.category_slug || resolvedCategorySlug || '').toLowerCase().trim();
    const currentSubSlug = (activeProduct?.subcategory_slug || resolvedSubcategorySlug || '').toLowerCase().trim();
    const currentBrand = (brand || activeProduct?.brand || '').toLowerCase().trim();

    // 1. Exclude the current active product
    const candidatePool = dbProducts.filter(p => {
      if (currentId && (String(p.id) === String(currentId) || String(p.realId) === String(currentId))) return false;
      if (currentName && p.name && p.name.toLowerCase().trim() === currentName) return false;
      return true;
    });

    if (candidatePool.length === 0) return [];

    // 2. Score candidates by relevance to current product
    const scored = candidatePool.map(p => {
      let score = 0;
      const pCatSlug = (p.category_slug || '').toLowerCase().trim();
      const pSubSlug = (p.subcategory_slug || '').toLowerCase().trim();
      const pBrand = (p.brand || '').toLowerCase().trim();

      if (currentSubSlug && pSubSlug && pSubSlug === currentSubSlug) {
        score += 10;
      }
      if (currentCatSlug && pCatSlug && pCatSlug === currentCatSlug) {
        score += 5;
      }
      if (currentBrand && pBrand && pBrand === currentBrand) {
        score += 3;
      }

      return { product: p, score };
    });

    scored.sort((a, b) => b.score - a.score);

    return scored.slice(0, 4).map(item => {
      const p = item.product;
      const formattedPrice = typeof p.price === 'number'
        ? `AED ${p.price.toFixed(2)}`
        : (p.price ? (String(p.price).startsWith('AED') ? p.price : `AED ${p.price}`) : 'AED 0.00');

      const fullImages = (Array.isArray(p.images) && p.images.length > 0)
        ? p.images
        : (p.image ? [p.image] : ['/prod_downlight_1791451418016.png']);

      return {
        ...p,
        realId: p.id,
        price: formattedPrice,
        image: fullImages[0],
        images: fullImages,
        brand: p.brand || 'Super Light',
        name: p.name
      };
    });
  }, [dbProducts, activeProduct, resolvedCategorySlug, resolvedSubcategorySlug, brand]);

  const handleRelatedClick = (p) => {
    setActiveProduct(p);
    const pImages = (Array.isArray(p.images) && p.images.length > 0)
      ? p.images
      : (p.image ? [p.image] : ['/prod_downlight_1791451418016.png']);
    setActiveImage(pImages[0]);
    setQuantity(1);

    if (onProductClick) {
      onProductClick(p);
    } else {
      const targetUrl = getProductUrl(p);
      navigate(targetUrl, { state: { product: p } });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="product-details-page container">
      {/* Dynamic Breadcrumbs */}
      <div className="breadcrumbs">
        <Link to="/" onClick={(e) => { e.preventDefault(); if (goHome) goHome(); else navigate('/'); }}>Home</Link>
        <span>›</span>
        <Link to={`/${resolvedCategorySlug}`}>{resolvedCategoryName}</Link>
        {resolvedSubcategoryName && (
          <>
            <span>›</span>
            <span>{resolvedSubcategoryName}</span>
          </>
        )}
        <span>›</span>
        <span className="current">{pName}</span>
      </div>

      <div className="product-main">
        {/* Image Gallery */}
        <div className="product-gallery">
          {thumbnails.length > 1 && (
            <div className="thumbnails">
              {thumbnails.map((img, i) => (
                <div 
                  key={i} 
                  className={`thumbnail ${activeImage === img ? 'active' : ''}`}
                  onClick={() => setActiveImage(img)}
                >
                  <img src={img} alt={`Thumbnail ${i+1}`} />
                </div>
              ))}
            </div>
          )}
          <div className="main-image">
            {thumbnails.length > 1 && (
              <div className="image-nav prev" onClick={handlePrevImage} title="Previous image">
                <ChevronLeft size={20} />
              </div>
            )}
            <img src={activeImage} alt={pName} />
            {thumbnails.length > 1 && (
              <div className="image-nav next" onClick={handleNextImage} title="Next image">
                <ChevronRight size={20} />
              </div>
            )}
            <div className="image-expand" onClick={() => window.open(activeImage, '_blank')} title="View full image">
              <Maximize size={18} />
            </div>
          </div>
        </div>

        {/* Product Info */}
        <div className="product-info">
          <div className="product-meta">
            <div className="brand-logo">{(brand || '').toUpperCase()}</div>
          </div>

          <h1 className="product-title">{(pName || '').toUpperCase()}</h1>

          <div className="price-row">
            <span className="price">{pPrice}</span>
            <span className="vat">(Incl. VAT)</span>
          </div>

          <div className="sku-stock-row">
            <span className="sku-text">SKU: <strong>{displaySku}</strong></span>
            <span className="stock-divider">•</span>
            <span className="in-stock"><CheckCircle2 size={16} /> In Stock</span>
          </div>

          <div className="actions-row">
            <div className="quantity-selector">
              <button className="qty-btn" onClick={() => handleQtyChange('dec')}><Minus size={16} /></button>
              <input type="text" className="qty-input" value={quantity} readOnly />
              <button className="qty-btn" onClick={() => handleQtyChange('inc')}><Plus size={16} /></button>
            </div>
            <button 
              className="add-to-cart-btn"
              onClick={() => {
                addToCart({
                  ...activeProduct,
                  id: currentProductId,
                  name: pName,
                  price: pPrice,
                  image: activeImage,
                  brand
                }, quantity);
                setIsAddedFeedback(true);
                setTimeout(() => setIsAddedFeedback(false), 1800);
              }}
            >
              {isAddedFeedback ? (
                <>
                  <CheckCircle2 size={18} /> Added to Cart!
                </>
              ) : (
                <>
                  <ShoppingCart size={18} /> Add to Cart
                </>
              )}
            </button>
            <button 
              className={`wishlist-btn ${isFavorited ? 'active' : ''}`}
              onClick={() => {
                toggleWishlist({
                  ...activeProduct,
                  id: currentProductId,
                  name: pName,
                  price: pPrice,
                  image: activeImage,
                  brand
                });
              }}
              style={{
                borderColor: isFavorited ? '#e6005c' : '#e5e7eb',
                color: isFavorited ? '#e6005c' : '#1b253c'
              }}
            >
              <Heart 
                size={18} 
                fill={isFavorited ? '#e6005c' : 'none'} 
                color={isFavorited ? '#e6005c' : '#1b253c'} 
              /> 
              <span className="wishlist-btn-text">{isFavorited ? 'In Wishlist' : 'Add to Wishlist'}</span>
            </button>
          </div>

          <button 
            type="button" 
            className="details-whatsapp-btn"
            onClick={() => {
              requireAuth(() => setIsWaModalOpen(true), {
                message: 'Please login first and then continue',
                subtitle: 'Please login to your account to order via WhatsApp. If you do not have an account, please register to proceed.'
              });
            }}
          >
            <WhatsAppIcon size={19} />
            Order via WhatsApp
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-container" data-active-tab={activeTab}>
        <div className="tabs-header">
          {['Description', 'Specifications'].map(tab => (
            <button 
              key={tab}
              className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="tab-content">
          <div className="tab-content-left">
            <h3>Product Overview</h3>
            <p>
              {activeProduct?.description || `${pName} delivers industry-leading durability, safety, and efficiency. Built with premium materials to meet rigorous electrical and architectural specifications.`}
            </p>
            <h3>Key Features</h3>
            <ul className="key-features">
              {activeProduct?.wattage && <li><CheckCircle2 size={16} className="feature-check" /> Power / Wattage: {activeProduct.wattage}</li>}
              {activeProduct?.model && <li><CheckCircle2 size={16} className="feature-check" /> Model Identifier: {activeProduct.model}</li>}
              {activeProduct?.warranty && <li><CheckCircle2 size={16} className="feature-check" /> Manufacturer Warranty: {activeProduct.warranty}</li>}
              <li><CheckCircle2 size={16} className="feature-check" /> Certified Genuine Brand Partner Product</li>
              <li><CheckCircle2 size={16} className="feature-check" /> Compliant with UAE & GCC Safety Standards</li>
              <li><CheckCircle2 size={16} className="feature-check" /> High quality, long-lasting construction</li>
            </ul>
          </div>
          <div className="tab-content-right">
            <table className="specs-table">
              <tbody>
                <tr><td>Brand</td><td>{(brand || '').toUpperCase()}</td></tr>
                <tr><td>Product Name</td><td>{(pName || '').toUpperCase()}</td></tr>
                {activeProduct?.model && <tr><td>Model</td><td>{activeProduct.model}</td></tr>}
                {activeProduct?.wattage && <tr><td>Wattage</td><td>{activeProduct.wattage}</td></tr>}
                {activeProduct?.warranty && <tr><td>Warranty</td><td>{activeProduct.warranty}</td></tr>}
                {resolvedSubcategoryName && <tr><td>Subcategory</td><td>{resolvedSubcategoryName}</td></tr>}
                <tr><td>Availability</td><td>In Stock (Fast Delivery Across UAE)</td></tr>
                <tr><td>Standard Price</td><td>{pPrice}</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Related Products - only display live products from database */}
      {relatedProducts.length > 0 && (
        <div className="related-products">
          <h2>
            Related Products 
            {resolvedCategorySlug && (
              <a 
                href={`/${resolvedCategorySlug}`} 
                className="view-all"
                onClick={(e) => {
                  e.preventDefault();
                  navigate(`/${resolvedCategorySlug}`);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                View All <ArrowRight size={14} />
              </a>
            )}
          </h2>
          <div className="products-grid">
            {relatedProducts.map(p => {
              const isFavorited = isInWishlist(p.id);
              return (
                <div 
                  key={p.id} 
                  onClick={() => handleRelatedClick(p)}
                  style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    padding: '16px',
                    position: 'relative',
                    cursor: 'pointer',
                    background: '#ffffff',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleWishlist(p);
                    }}
                    style={{
                      position: 'absolute',
                      right: '16px',
                      top: '16px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                      zIndex: 2
                    }}
                    aria-label="Add to Wishlist"
                  >
                    <Heart size={20} color={isFavorited ? '#e6005c' : '#9ca3af'} fill={isFavorited ? '#e6005c' : 'none'} />
                  </button>
                  <div style={{
                    width: '100%',
                    height: '200px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '16px',
                    overflow: 'hidden'
                  }}>
                    <img 
                      src={p.image} 
                      alt={p.name} 
                      style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} 
                      onError={(e) => { e.target.onerror = null; e.target.src = '/prod_downlight_1791451418016.png'; }}
                    />
                  </div>
                  {p.brand && (
                    <div style={{
                      fontSize: '11px',
                      fontWeight: '700',
                      color: '#6b7280',
                      marginBottom: '4px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      {(p.brand || '').toUpperCase()}
                    </div>
                  )}
                  <div style={{
                    fontWeight: '600',
                    color: '#1b253c',
                    marginBottom: '12px',
                    fontSize: '14px',
                    textTransform: 'uppercase',
                    lineHeight: '1.35',
                    flex: 1
                  }}>
                    {(p.name || '').toUpperCase()}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                    <div style={{ color: '#e6005c', fontWeight: '700', fontSize: '15px' }}>{p.price}</div>
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(p, 1);
                      }}
                      style={{
                        width: '32px',
                        height: '32px',
                        border: '1px solid #e6005c',
                        background: 'transparent',
                        color: '#e6005c',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                      aria-label="Add to cart"
                    >
                      <ShoppingCart size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <WhatsAppOrderModal 
        isOpen={isWaModalOpen} 
        product={{
          name: pName,
          price: pPrice,
          image: activeImage,
          brand
        }} 
        onClose={() => setIsWaModalOpen(false)} 
      />
    </div>
  );
};

export default ProductDetails;

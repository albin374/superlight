import React, { useState, useEffect } from 'react';
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
  ArrowRight,
  Star
} from 'lucide-react';
import WhatsAppOrderModal, { WhatsAppIcon } from './common/WhatsAppOrderModal';
import { useShop } from '../context/ShopContext';
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

const ProductDetails = ({ goHome, product: propProduct }) => {
  const params = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const urlCategorySlug = params.categorySlug;
  const urlSubcategorySlug = params.subcategorySlug;
  const urlProductSlug = params.productSlug;

  // Resolve initial active product from prop, location state, or static catalog
  const [activeProduct, setActiveProduct] = useState(() => {
    if (propProduct) return propProduct;
    if (location.state?.product) return location.state.product;
    if (urlProductSlug) {
      const match = findProductInCatalog(STATIC_CATALOG, urlProductSlug, urlCategorySlug);
      if (match) return match;
    }
    return null;
  });

  // Sync / resolve product on URL change or navigation
  useEffect(() => {
    if (propProduct) {
      setActiveProduct(propProduct);
      return;
    }
    if (location.state?.product) {
      setActiveProduct(location.state.product);
      return;
    }

    if (urlProductSlug) {
      // 1. Try static catalog first for instant response
      const staticMatch = findProductInCatalog(STATIC_CATALOG, urlProductSlug, urlCategorySlug);
      if (staticMatch) {
        setActiveProduct(staticMatch);
      }

      // 2. Query live database products
      let isMounted = true;
      fetch('/api/products')
        .then(res => res.json())
        .then(data => {
          if (!isMounted) return;
          if (data && data.success && Array.isArray(data.products)) {
            const apiMatch = findProductInCatalog(data.products, urlProductSlug, urlCategorySlug);
            if (apiMatch) {
              const pPrice = typeof apiMatch.price === 'number' ? `AED ${apiMatch.price.toFixed(2)}` : apiMatch.price;
              const mainImg = (Array.isArray(apiMatch.images) && apiMatch.images.length > 0)
                ? apiMatch.images[0]
                : (apiMatch.image || '/prod_downlight_1791451418016.png');

              setActiveProduct({
                ...apiMatch,
                realId: apiMatch.id,
                price: pPrice,
                image: mainImg,
                images: Array.isArray(apiMatch.images) && apiMatch.images.length > 0 ? apiMatch.images : [mainImg],
                brand: apiMatch.brand || 'PHILIPS',
                subcategory: apiMatch.subcategory_name || '',
                category: apiMatch.category_name || ''
              });
            }
          }
        })
        .catch(err => {
          console.warn('[ProductDetails] Error fetching /api/products:', err);
        });

      return () => { isMounted = false; };
    }
  }, [propProduct, location.state, urlProductSlug, urlCategorySlug]);

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

  const currentProductId = activeProduct?.id || String(pName).toLowerCase().replace(/\s+/g, '-');
  const isFavorited = isInWishlist(currentProductId);

  useEffect(() => {
    setActiveImage(pImage);
    window.scrollTo(0, 0);
  }, [pImage, urlProductSlug]);

  const thumbnails = (activeProduct?.images && Array.isArray(activeProduct.images) && activeProduct.images.length > 0)
    ? activeProduct.images
    : [
        pImage, 
        '/prod_cable_1791451428788.png', 
        '/prod_socket_1791451439423.png', 
        '/prod_mcb_1791451449276.png'
      ];

  const handleQtyChange = (type) => {
    if (type === 'inc') setQuantity(q => q + 1);
    if (type === 'dec' && quantity > 1) setQuantity(q => q - 1);
  };

  const handleRelatedClick = (p) => {
    const fullItem = STATIC_CATALOG.find(c => c.id === p.id) || p;
    const targetUrl = getProductUrl(fullItem);
    setActiveProduct(fullItem);
    navigate(targetUrl, { state: { product: fullItem } });
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
          <div className="main-image">
            <div className="image-nav prev"><ChevronLeft size={20} /></div>
            <img src={activeImage} alt={pName} />
            <div className="image-nav next"><ChevronRight size={20} /></div>
            <div className="image-expand"><Maximize size={20} /></div>
          </div>
        </div>

        {/* Product Info */}
        <div className="product-info">
          <div className="product-meta">
            <div className="brand-logo">{brand}</div>
          </div>

          <h1 className="product-title">{pName}</h1>

          <div className="reviews-row">
            <div className="stars">
              <Star size={16} fill="#e6005c" color="#e6005c" />
              <Star size={16} fill="#e6005c" color="#e6005c" />
              <Star size={16} fill="#e6005c" color="#e6005c" />
              <Star size={16} fill="#e6005c" color="#e6005c" />
              <Star size={16} fill="#e6005c" color="#e6005c" />
            </div>
            <span className="rating-text">4.8</span>
            <span className="review-count">(24 reviews)</span>
            <span>|</span>
            <span className="write-review">Write a review</span>
          </div>

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
              {isFavorited ? 'In Wishlist' : 'Add to Wishlist'}
            </button>
          </div>

          <button 
            type="button" 
            className="details-whatsapp-btn"
            onClick={() => setIsWaModalOpen(true)}
          >
            <WhatsAppIcon size={19} />
            Order via WhatsApp
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-container">
        <div className="tabs-header">
          {['Description', 'Specifications', 'Downloads', 'Reviews (24)'].map(tab => (
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
                <tr><td>Brand</td><td>{brand}</td></tr>
                <tr><td>Product Name</td><td>{pName}</td></tr>
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

      {/* Related Products */}
      <div className="related-products">
        <h2>Related Products <a href="#" className="view-all">View All <ArrowRight size={14} /></a></h2>
        <div className="products-grid">
          {[
            { id: 1, name: 'Ducab Cable', img: '/prod_cable_1791451428788.png', price: 'AED 320.00' },
            { id: 2, name: 'Legrand Switch', img: '/prod_socket_1791451439423.png', price: 'AED 18.00' },
            { id: 3, name: 'Schneider MCB', img: '/prod_mcb_1791451449276.png', price: 'AED 25.00' },
            { id: 4, name: 'LED Flood Light', img: '/prod_floodlight_1791451459906.png', price: 'AED 120.00' }
          ].map(p => (
            <div 
              key={p.id} 
              onClick={() => handleRelatedClick(p)}
              style={{border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px', position: 'relative', cursor: 'pointer'}}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleWishlist(p);
                }}
                style={{position: 'absolute', right: '16px', top: '16px', background: 'none', border: 'none', cursor: 'pointer', padding: 0}}
                aria-label="Add to Wishlist"
              >
                <Heart size={20} color={isInWishlist(p.id) ? '#e6005c' : '#9ca3af'} fill={isInWishlist(p.id) ? '#e6005c' : 'none'} />
              </button>
              <img src={p.img} alt={p.name} style={{width: '100%', height: '200px', objectFit: 'contain', marginBottom: '16px'}} />
              <div style={{fontSize: '12px', color: '#6b7280', marginBottom: '4px'}}>Brand</div>
              <div style={{fontWeight: '600', color: '#1b253c', marginBottom: '12px', fontSize: '14px'}}>{p.name}</div>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <div style={{color: '#e6005c', fontWeight: '700'}}>{p.price}</div>
                <button 
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    addToCart(p, 1);
                  }}
                  style={{width: '32px', height: '32px', border: '1px solid #e6005c', background: 'transparent', color: '#e6005c', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'}}
                  aria-label="Add to cart"
                >
                  <ShoppingCart size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

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

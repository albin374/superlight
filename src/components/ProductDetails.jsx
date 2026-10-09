import React, { useState, useEffect } from 'react';
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

const ProductDetails = ({ goHome, product }) => {
  const pName = product?.name || 'Philips LED Downlight 15W Round (Cool White)';
  const pPrice = product?.price || 'AED 35.00';
  const pImage = product?.image || '/prod_downlight_1791451418016.png';
  
  // Basic heuristic to get a brand name
  let brand = 'PHILIPS';
  if (pName.includes('Ducab')) brand = 'DUCAB';
  if (pName.includes('Legrand')) brand = 'LEGRAND';
  if (pName.includes('Schneider')) brand = 'SCHNEIDER';
  if (pName.includes('LED Flood Light')) brand = 'LED';

  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('Description');
  const [activeImage, setActiveImage] = useState(pImage);

  useEffect(() => {
    setActiveImage(pImage);
    window.scrollTo(0, 0);
  }, [pImage]);

  const thumbnails = [
    pImage, 
    '/prod_cable_1791451428788.png', 
    '/prod_socket_1791451439423.png', 
    '/prod_mcb_1791451449276.png'
  ];

  const handleQtyChange = (type) => {
    if (type === 'inc') setQuantity(q => q + 1);
    if (type === 'dec' && quantity > 1) setQuantity(q => q - 1);
  };

  return (
    <div className="product-details-page container">
      {/* Breadcrumbs */}
      <div className="breadcrumbs">
        <a href="#" onClick={(e) => { e.preventDefault(); goHome(); }}>Home</a> <span>›</span>
        <a href="#">Shop</a> <span>›</span>
        <a href="#">{brand.charAt(0) + brand.slice(1).toLowerCase()}</a> <span>›</span>
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
            <div className="sku-stock">
              <span>SKU: {brand.substring(0, 3)}-{Math.floor(Math.random() * 10000)}</span>
              <span className="in-stock"><CheckCircle2 size={16} /> In Stock</span>
            </div>
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

          <p className="short-desc">
            Reliable 15W LED Downlight, providing excellent illumination and energy savings. Designed for modern interiors. Suitable for residential and commercial applications.
          </p>

          <div className="actions-row">
            <div className="quantity-selector">
              <button className="qty-btn" onClick={() => handleQtyChange('dec')}><Minus size={16} /></button>
              <input type="text" className="qty-input" value={quantity} readOnly />
              <button className="qty-btn" onClick={() => handleQtyChange('inc')}><Plus size={16} /></button>
            </div>
            <button className="add-to-cart-btn">
              <ShoppingCart size={20} /> Add to Cart
            </button>
            <button className="wishlist-btn">
              <Heart size={20} /> Add to Wishlist
            </button>
          </div>
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
              The Philips LED Downlight 15W is a high-quality round downlight that offers reliable performance, elegant design, and easy installation, making it ideal for both residential and commercial interiors. Its clean modern look blends seamlessly with contemporary spaces.
            </p>
            <h3>Key Features</h3>
            <ul className="key-features">
              <li><CheckCircle2 size={16} className="feature-check" /> 15W Power Output</li>
              <li><CheckCircle2 size={16} className="feature-check" /> Cool White (6500K) Light</li>
              <li><CheckCircle2 size={16} className="feature-check" /> Modern and elegant design</li>
              <li><CheckCircle2 size={16} className="feature-check" /> Easy installation</li>
              <li><CheckCircle2 size={16} className="feature-check" /> Suitable for residential and commercial use</li>
              <li><CheckCircle2 size={16} className="feature-check" /> High quality and durable build</li>
            </ul>
          </div>
          <div className="tab-content-right">
            <table className="specs-table">
              <tbody>
                <tr><td>Brand</td><td>Philips</td></tr>
                <tr><td>Model</td><td>Essential LED Downlight</td></tr>
                <tr><td>Type</td><td>Round Downlight</td></tr>
                <tr><td>Wattage</td><td>15W</td></tr>
                <tr><td>Color Temperature</td><td>Cool White (6500K)</td></tr>
                <tr><td>Material</td><td>Polycarbonate</td></tr>
                <tr><td>Mounting Type</td><td>Recessed</td></tr>
                <tr><td>Application</td><td>Residential & Commercial</td></tr>
                <tr><td>Warranty</td><td>1 Year (Manufacturer Warranty)</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Related Products */}
      <div className="related-products">
        <h2>Related Products <a href="#" className="view-all">View All <ArrowRight size={14} /></a></h2>
        <div className="products-grid">
          {/* Mockup for 4 simple product cards. If ProductCard exists, ideally we'd use it */}
          {[
            { id: 1, name: 'Ducab Cable', img: '/prod_cable_1791451428788.png', price: 'AED 320.00' },
            { id: 2, name: 'Legrand Switch', img: '/prod_socket_1791451439423.png', price: 'AED 18.00' },
            { id: 3, name: 'Schneider MCB', img: '/prod_mcb_1791451449276.png', price: 'AED 25.00' },
            { id: 4, name: 'LED Flood Light', img: '/prod_floodlight_1791451459906.png', price: 'AED 120.00' }
          ].map(p => (
            <div key={p.id} style={{border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px', position: 'relative'}}>
              <Heart size={20} color="#9ca3af" style={{position: 'absolute', right: '16px', top: '16px', cursor: 'pointer'}} />
              <img src={p.img} alt={p.name} style={{width: '100%', height: '200px', objectFit: 'contain', marginBottom: '16px'}} />
              <div style={{fontSize: '12px', color: '#6b7280', marginBottom: '4px'}}>Brand</div>
              <div style={{fontWeight: '600', color: '#1b253c', marginBottom: '12px', fontSize: '14px'}}>{p.name}</div>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <div style={{color: '#e6005c', fontWeight: '700'}}>{p.price}</div>
                <button style={{width: '32px', height: '32px', border: '1px solid #e6005c', background: 'transparent', color: '#e6005c', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'}}>
                  <ShoppingCart size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;

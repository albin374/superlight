import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, Star, Check } from 'lucide-react';
import './HomeAutomation.css';

const products = [
  {
    id: 501,
    name: 'Tuya Smart WiFi 2-Gang Touch Wall Switch (Tempered Glass)',
    price: 'AED 120.00',
    oldPrice: 'AED 155.00',
    image: '/prod_smart_switch.png',
    brand: 'TUYA',
    rating: 5,
    reviews: 31
  },
  {
    id: 502,
    name: 'Aqara 2K Smart Video Doorbell with Wireless Chime & AI Detection',
    price: 'AED 340.00',
    oldPrice: 'AED 410.00',
    image: '/prod_smart_doorbell.png',
    brand: 'AQARA',
    rating: 5,
    reviews: 45
  },
  {
    id: 503,
    name: 'Yale Biometric Keyless Smart Lock with Fingerprint & PIN Access',
    price: 'AED 890.00',
    oldPrice: 'AED 1,050.00',
    image: '/prod_smart_lock.png',
    brand: 'YALE',
    rating: 5,
    reviews: 27
  },
  {
    id: 504,
    name: 'BroadLink Zigbee 3.0 & Matter Universal Smart Gateway Hub',
    price: 'AED 185.00',
    oldPrice: 'AED 230.00',
    image: '/prod_smart_hub.png',
    brand: 'BROADLINK',
    rating: 5,
    reviews: 38
  }
];

const HomeAutomation = ({ onProductClick }) => {
  const navigate = useNavigate();
  const [wishlist, setWishlist] = useState({});
  const [addedCart, setAddedCart] = useState({});

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleCardClick = (product) => {
    if (onProductClick) {
      onProductClick(product);
    } else {
      navigate('/product-details');
    }
  };

  const toggleWishlist = (e, productId) => {
    e.stopPropagation();
    setWishlist((prev) => ({
      ...prev,
      [productId]: !prev[productId]
    }));
  };

  const handleAddToCart = (e, productId) => {
    e.stopPropagation();
    setAddedCart((prev) => ({
      ...prev,
      [productId]: true
    }));
    setTimeout(() => {
      setAddedCart((prev) => ({
        ...prev,
        [productId]: false
      }));
    }, 1800);
  };

  return (
    <div className="home-automation-page">
      {/* Hero Showcase Banner */}
      <section className="ha-hero-banner" aria-label="Home Automation Banner">
        <div className="ha-hero-overlay"></div>
        <div className="container ha-hero-container">
          <div className="ha-hero-content">
            <h1 className="ha-hero-title">
              Home <span className="title-pink">Automation</span>
            </h1>
          </div>
        </div>
      </section>

      {/* Products Section After Banner */}
      <section className="ha-products-section">
        <div className="container ha-products-container">
          <div className="ha-products-header">
            <h2 className="ha-section-title">Explore Our Collection</h2>
          </div>

          <div className="ha-products-grid">
            {products.map((product) => (
              <div 
                key={product.id} 
                className="ha-product-card" 
                onClick={() => handleCardClick(product)}
              >
                {/* Wishlist Button */}
                <button 
                  className={`ha-heart-btn ${wishlist[product.id] ? 'active' : ''}`} 
                  onClick={(e) => toggleWishlist(e, product.id)}
                  title={wishlist[product.id] ? "Remove from wishlist" : "Add to wishlist"}
                  aria-label="Add to wishlist"
                >
                  <Heart 
                    size={18} 
                    className="ha-heart-icon" 
                    fill={wishlist[product.id] ? '#e6005c' : 'none'} 
                    color={wishlist[product.id] ? '#e6005c' : '#475569'}
                  />
                </button>

                {/* Image Wrapper */}
                <div className="ha-product-image-wrapper">
                  <img src={product.image} alt={product.name} className="ha-product-image" />
                </div>

                {/* Product Details */}
                <div className="ha-product-details">
                  <span className="ha-product-brand">{product.brand}</span>
                  <h3 className="ha-product-name">{product.name}</h3>
                  
                  {/* Rating Stars */}
                  <div className="ha-product-rating">
                    <div className="ha-stars">
                      {[...Array(product.rating)].map((_, i) => (
                        <Star key={i} size={14} fill="#f59e0b" color="#f59e0b" />
                      ))}
                    </div>
                    <span className="ha-reviews-count">({product.reviews})</span>
                  </div>

                  {/* Price Row */}
                  <div className="ha-price-row">
                    <span className="ha-product-price">{product.price}</span>
                    {product.oldPrice && (
                      <span className="ha-product-old-price">{product.oldPrice}</span>
                    )}
                  </div>

                  {/* Add to Cart Button */}
                  <button 
                    className={`ha-add-to-cart-btn ${addedCart[product.id] ? 'added' : ''}`}
                    onClick={(e) => handleAddToCart(e, product.id)}
                  >
                    {addedCart[product.id] ? (
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
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomeAutomation;

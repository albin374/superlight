import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, Star, Check } from 'lucide-react';
import './LightingSolutions.css';

const products = [
  {
    id: 1,
    name: 'Philips LED Downlight 15W Round (Cool White)',
    price: 'AED 35.00',
    oldPrice: 'AED 45.00',
    image: '/prod_downlight_1791451418016.png',
    brand: 'PHILIPS',
    rating: 5,
    reviews: 24
  },
  {
    id: 3,
    name: 'Legrand 13A Switch Socket White',
    price: 'AED 18.00',
    oldPrice: 'AED 24.00',
    image: '/prod_socket_1791451439423.png',
    brand: 'LEGRAND',
    rating: 5,
    reviews: 18
  }
];

const LightingSolutions = ({ onProductClick }) => {
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
    <div className="lighting-solutions-page">
      {/* Hero Showcase Banner */}
      <section className="ls-hero-banner" aria-label="Lighting Solutions Banner">
        <div className="ls-hero-overlay"></div>
        <div className="container ls-hero-container">
          <div className="ls-hero-content">
            <h1 className="ls-hero-title">
              Lighting <span className="title-pink">Solutions</span>
            </h1>
          </div>
        </div>
      </section>

      {/* Products Section After Banner */}
      <section className="ls-products-section">
        <div className="container ls-products-container">
          <div className="ls-products-header">
            <h2 className="ls-section-title">Explore Our Collection</h2>
          </div>

          <div className="ls-products-grid">
            {products.map((product) => (
              <div 
                key={product.id} 
                className="ls-product-card" 
                onClick={() => handleCardClick(product)}
              >
                {/* Wishlist Button */}
                <button 
                  className={`ls-heart-btn ${wishlist[product.id] ? 'active' : ''}`} 
                  onClick={(e) => toggleWishlist(e, product.id)}
                  title={wishlist[product.id] ? "Remove from wishlist" : "Add to wishlist"}
                  aria-label="Add to wishlist"
                >
                  <Heart 
                    size={18} 
                    className="ls-heart-icon" 
                    fill={wishlist[product.id] ? '#e6005c' : 'none'} 
                    color={wishlist[product.id] ? '#e6005c' : '#475569'}
                  />
                </button>

                {/* Image Wrapper */}
                <div className="ls-product-image-wrapper">
                  <img src={product.image} alt={product.name} className="ls-product-image" />
                </div>

                {/* Product Details */}
                <div className="ls-product-details">
                  <span className="ls-product-brand">{product.brand}</span>
                  <h3 className="ls-product-name">{product.name}</h3>
                  
                  {/* Rating Stars */}
                  <div className="ls-product-rating">
                    <div className="ls-stars">
                      {[...Array(product.rating)].map((_, i) => (
                        <Star key={i} size={14} fill="#f59e0b" color="#f59e0b" />
                      ))}
                    </div>
                    <span className="ls-reviews-count">({product.reviews})</span>
                  </div>

                  {/* Price Row */}
                  <div className="ls-price-row">
                    <span className="ls-product-price">{product.price}</span>
                    {product.oldPrice && (
                      <span className="ls-product-old-price">{product.oldPrice}</span>
                    )}
                  </div>

                  {/* Add to Cart Button */}
                  <button 
                    className={`ls-add-to-cart-btn ${addedCart[product.id] ? 'added' : ''}`}
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

export default LightingSolutions;

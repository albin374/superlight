import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, Star, Check } from 'lucide-react';
import './CableManagement.css';

const products = [
  {
    id: 101,
    name: 'Ducab Electrical Cable 3 Core 2.5mm (100m)',
    price: 'AED 320.00',
    oldPrice: 'AED 360.00',
    image: '/prod_cable_1791451428788.png',
    brand: 'DUCAB',
    rating: 5,
    reviews: 32
  },
  {
    id: 102,
    name: 'Heavy-Duty PVC Conduit & Trunking Set',
    price: 'AED 85.00',
    oldPrice: 'AED 110.00',
    image: '/Industrial Conduit and Trunking Components.png',
    brand: 'MARSHALL-TUFFLEX',
    rating: 5,
    reviews: 19
  },
  {
    id: 103,
    name: 'Belden CAT6 24-Port UTP Patch Panel',
    price: 'AED 145.00',
    oldPrice: 'AED 180.00',
    image: '/patch panel.png',
    brand: 'BELDEN',
    rating: 5,
    reviews: 26
  }
];

const CableManagement = ({ onProductClick }) => {
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
    <div className="cable-management-page">
      {/* Hero Showcase Banner */}
      <section className="cm-hero-banner" aria-label="Cables and Cable Management Banner">
        <div className="cm-hero-overlay"></div>
        <div className="container cm-hero-container">
          <div className="cm-hero-content">
            <h1 className="cm-hero-title">
              Cables & <span className="title-pink">Cable Management</span>
            </h1>
          </div>
        </div>
      </section>

      {/* Products Section After Banner */}
      <section className="cm-products-section">
        <div className="container cm-products-container">
          <div className="cm-products-header">
            <h2 className="cm-section-title">Explore Our Collection</h2>
          </div>

          <div className="cm-products-grid">
            {products.map((product) => (
              <div 
                key={product.id} 
                className="cm-product-card" 
                onClick={() => handleCardClick(product)}
              >
                {/* Wishlist Button */}
                <button 
                  className={`cm-heart-btn ${wishlist[product.id] ? 'active' : ''}`} 
                  onClick={(e) => toggleWishlist(e, product.id)}
                  title={wishlist[product.id] ? "Remove from wishlist" : "Add to wishlist"}
                  aria-label="Add to wishlist"
                >
                  <Heart 
                    size={18} 
                    className="cm-heart-icon" 
                    fill={wishlist[product.id] ? '#e6005c' : 'none'} 
                    color={wishlist[product.id] ? '#e6005c' : '#475569'}
                  />
                </button>

                {/* Product Image */}
                <div className="cm-product-image-wrapper">
                  <img src={product.image} alt={product.name} className="cm-product-image" />
                </div>

                {/* Product Details */}
                <div className="cm-product-details">
                  <span className="cm-product-brand">{product.brand}</span>
                  <h3 className="cm-product-name">{product.name}</h3>
                  
                  {/* Rating Stars */}
                  <div className="cm-product-rating">
                    <div className="cm-stars">
                      {[...Array(product.rating)].map((_, i) => (
                        <Star key={i} size={14} fill="#f59e0b" color="#f59e0b" />
                      ))}
                    </div>
                    <span className="cm-reviews-count">({product.reviews})</span>
                  </div>

                  {/* Price Row */}
                  <div className="cm-price-row">
                    <span className="cm-product-price">{product.price}</span>
                    {product.oldPrice && (
                      <span className="cm-product-old-price">{product.oldPrice}</span>
                    )}
                  </div>

                  {/* Add to Cart Button */}
                  <button 
                    className={`cm-add-to-cart-btn ${addedCart[product.id] ? 'added' : ''}`}
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

export default CableManagement;

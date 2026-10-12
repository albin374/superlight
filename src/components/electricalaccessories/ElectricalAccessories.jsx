import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, Star, Check } from 'lucide-react';
import './ElectricalAccessories.css';

const products = [
  {
    id: 301,
    name: 'Legrand 13A Switch Socket White',
    price: 'AED 18.00',
    oldPrice: 'AED 24.00',
    image: '/prod_socket_1791451439423.png',
    brand: 'LEGRAND',
    rating: 5,
    reviews: 18
  },
  {
    id: 302,
    name: 'Schneider MCB 63A 1P',
    price: 'AED 25.00',
    oldPrice: 'AED 32.00',
    image: '/prod_mcb_1791451449276.png',
    brand: 'SCHNEIDER',
    rating: 5,
    reviews: 21
  },
  {
    id: 303,
    name: 'Modular Electrical Switch 1-Gang',
    price: 'AED 12.00',
    oldPrice: 'AED 16.00',
    image: '/switch.png',
    brand: 'LEGRAND',
    rating: 5,
    reviews: 14
  },
  {
    id: 304,
    name: 'Ding Dong Door Bell Accessory',
    price: 'AED 22.00',
    oldPrice: 'AED 28.00',
    image: '/bell.png',
    brand: 'HONEYWELL',
    rating: 5,
    reviews: 11
  }
];

const ElectricalAccessories = ({ onProductClick }) => {
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
    <div className="electrical-accessories-page">
      <section className="ea-hero-banner" aria-label="Electrical Accessories Banner">
        <div className="ea-hero-overlay"></div>
        <div className="container ea-hero-container">
          <div className="ea-hero-content">
            <h1 className="ea-hero-title">
              Electrical <span className="title-pink">Accessories</span>
            </h1>
          </div>
        </div>
      </section>

      <section className="ea-products-section">
        <div className="container ea-products-container">
          <div className="ea-products-header">
            <h2 className="ea-section-title">Explore Our Collection</h2>
          </div>

          <div className="ea-products-grid">
            {products.map((product) => (
              <div
                key={product.id}
                className="ea-product-card"
                onClick={() => handleCardClick(product)}
              >
                <button
                  className={`ea-heart-btn ${wishlist[product.id] ? 'active' : ''}`}
                  onClick={(e) => toggleWishlist(e, product.id)}
                  title={wishlist[product.id] ? 'Remove from wishlist' : 'Add to wishlist'}
                  aria-label="Add to wishlist"
                >
                  <Heart
                    size={18}
                    className="ea-heart-icon"
                    fill={wishlist[product.id] ? '#e6005c' : 'none'}
                    color={wishlist[product.id] ? '#e6005c' : '#475569'}
                  />
                </button>

                <div className="ea-product-image-wrapper">
                  <img src={product.image} alt={product.name} className="ea-product-image" />
                </div>

                <div className="ea-product-details">
                  <span className="ea-product-brand">{product.brand}</span>
                  <h3 className="ea-product-name">{product.name}</h3>

                  <div className="ea-product-rating">
                    <div className="ea-stars">
                      {[...Array(product.rating)].map((_, i) => (
                        <Star key={i} size={14} fill="#f59e0b" color="#f59e0b" />
                      ))}
                    </div>
                    <span className="ea-reviews-count">({product.reviews})</span>
                  </div>

                  <div className="ea-price-row">
                    <span className="ea-product-price">{product.price}</span>
                    {product.oldPrice && (
                      <span className="ea-product-old-price">{product.oldPrice}</span>
                    )}
                  </div>

                  <button
                    className={`ea-add-to-cart-btn ${addedCart[product.id] ? 'added' : ''}`}
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

export default ElectricalAccessories;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, Star, Check } from 'lucide-react';
import './AdhesivesToolsHardware.css';

const products = [
  {
    id: 201,
    name: 'DeWalt 18V Cordless Combo Tool Kit',
    price: 'AED 1,250.00',
    oldPrice: 'AED 1,480.00',
    image: '/Professional Cordless Tool Kit Display.png',
    brand: 'DEWALT',
    rating: 5,
    reviews: 41
  },
  {
    id: 202,
    name: 'Professional Electrician Hand Tool Set',
    price: 'AED 285.00',
    oldPrice: 'AED 340.00',
    image: '/Neon Electrician Tools Showcase.png',
    brand: 'STANLEY',
    rating: 5,
    reviews: 28
  },
  {
    id: 203,
    name: 'Hardware Fasteners, Drill Bits & Accessories Kit',
    price: 'AED 95.00',
    oldPrice: 'AED 125.00',
    image: '/Modern Hardware Store Tool Display (1).png',
    brand: 'BOSCH',
    rating: 5,
    reviews: 22
  },
  {
    id: 204,
    name: 'Construction Adhesive & Sealant Multi-Pack',
    price: 'AED 48.00',
    oldPrice: 'AED 62.00',
    image: '/Neon Electrician Tools Showcase.png',
    brand: 'SIKA',
    rating: 5,
    reviews: 16
  }
];

const AdhesivesToolsHardware = ({ onProductClick }) => {
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
    <div className="adhesives-tools-page">
      <section className="ath-hero-banner" aria-label="Adhesives, Tools and Hardware Banner">
        <div className="ath-hero-overlay"></div>
        <div className="container ath-hero-container">
          <div className="ath-hero-content">
            <h1 className="ath-hero-title">
              Adhesives & Tools & <span className="title-pink">Hardware</span>
            </h1>
          </div>
        </div>
      </section>

      <section className="ath-products-section">
        <div className="container ath-products-container">
          <div className="ath-products-header">
            <h2 className="ath-section-title">Explore Our Collection</h2>
          </div>

          <div className="ath-products-grid">
            {products.map((product) => (
              <div
                key={product.id}
                className="ath-product-card"
                onClick={() => handleCardClick(product)}
              >
                <button
                  className={`ath-heart-btn ${wishlist[product.id] ? 'active' : ''}`}
                  onClick={(e) => toggleWishlist(e, product.id)}
                  title={wishlist[product.id] ? 'Remove from wishlist' : 'Add to wishlist'}
                  aria-label="Add to wishlist"
                >
                  <Heart
                    size={18}
                    className="ath-heart-icon"
                    fill={wishlist[product.id] ? '#e6005c' : 'none'}
                    color={wishlist[product.id] ? '#e6005c' : '#475569'}
                  />
                </button>

                <div className="ath-product-image-wrapper">
                  <img src={product.image} alt={product.name} className="ath-product-image" />
                </div>

                <div className="ath-product-details">
                  <span className="ath-product-brand">{product.brand}</span>
                  <h3 className="ath-product-name">{product.name}</h3>

                  <div className="ath-product-rating">
                    <div className="ath-stars">
                      {[...Array(product.rating)].map((_, i) => (
                        <Star key={i} size={14} fill="#f59e0b" color="#f59e0b" />
                      ))}
                    </div>
                    <span className="ath-reviews-count">({product.reviews})</span>
                  </div>

                  <div className="ath-price-row">
                    <span className="ath-product-price">{product.price}</span>
                    {product.oldPrice && (
                      <span className="ath-product-old-price">{product.oldPrice}</span>
                    )}
                  </div>

                  <button
                    className={`ath-add-to-cart-btn ${addedCart[product.id] ? 'added' : ''}`}
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

export default AdhesivesToolsHardware;

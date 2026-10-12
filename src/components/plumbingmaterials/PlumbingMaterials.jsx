import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, Star, Check } from 'lucide-react';
import './PlumbingMaterials.css';

const products = [
  {
    id: 401,
    name: 'Grohe Eurosmart Chrome Basin Mixer & Hand Shower Set',
    price: 'AED 285.00',
    oldPrice: 'AED 350.00',
    image: '/Polished Chrome Bathroom Fixture Collection.png',
    brand: 'GROHE',
    rating: 5,
    reviews: 36
  },
  {
    id: 402,
    name: 'ERA Schedule 40 UPVC Pressure Pipe & Fittings Kit',
    price: 'AED 140.00',
    oldPrice: 'AED 175.00',
    image: '/cat_plumbing_1791448831573.png',
    brand: 'ERA',
    rating: 5,
    reviews: 29
  },
  {
    id: 403,
    name: 'Pegler Heavy-Duty Brass Ball & Gate Valves Set',
    price: 'AED 195.00',
    oldPrice: 'AED 245.00',
    image: '/plumbing_brass_valves.png',
    brand: 'PEGLER',
    rating: 5,
    reviews: 24
  },
  {
    id: 404,
    name: 'Franke Stainless Steel Double Bowl Kitchen Sink & Strainer Kit',
    price: 'AED 480.00',
    oldPrice: 'AED 590.00',
    image: '/plumbing_kitchen_sink.png',
    brand: 'FRANKE',
    rating: 5,
    reviews: 18
  }
];

const PlumbingMaterials = ({ onProductClick }) => {
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
    <div className="plumbing-materials-page">
      {/* Hero Showcase Banner */}
      <section className="pm-hero-banner" aria-label="Plumbing Materials Banner">
        <div className="pm-hero-overlay"></div>
        <div className="container pm-hero-container">
          <div className="pm-hero-content">
            <h1 className="pm-hero-title">
              Plumbing <span className="title-pink">Materials</span>
            </h1>
          </div>
        </div>
      </section>

      {/* Products Section After Banner */}
      <section className="pm-products-section">
        <div className="container pm-products-container">
          <div className="pm-products-header">
            <h2 className="pm-section-title">Explore Our Collection</h2>
          </div>

          <div className="pm-products-grid">
            {products.map((product) => (
              <div
                key={product.id}
                className="pm-product-card"
                onClick={() => handleCardClick(product)}
              >
                <button
                  className={`pm-heart-btn ${wishlist[product.id] ? 'active' : ''}`}
                  onClick={(e) => toggleWishlist(e, product.id)}
                  title={wishlist[product.id] ? 'Remove from wishlist' : 'Add to wishlist'}
                  aria-label="Add to wishlist"
                >
                  <Heart
                    size={18}
                    className="pm-heart-icon"
                    fill={wishlist[product.id] ? '#e6005c' : 'none'}
                    color={wishlist[product.id] ? '#e6005c' : '#475569'}
                  />
                </button>

                <div className="pm-product-image-wrapper">
                  <img src={product.image} alt={product.name} className="pm-product-image" />
                </div>

                <div className="pm-product-details">
                  <span className="pm-product-brand">{product.brand}</span>
                  <h3 className="pm-product-name">{product.name}</h3>

                  <div className="pm-product-rating">
                    <div className="pm-stars">
                      {[...Array(product.rating)].map((_, i) => (
                        <Star key={i} size={14} fill="#f59e0b" color="#f59e0b" />
                      ))}
                    </div>
                    <span className="pm-reviews-count">({product.reviews})</span>
                  </div>

                  <div className="pm-price-row">
                    <span className="pm-product-price">{product.price}</span>
                    {product.oldPrice && (
                      <span className="pm-product-old-price">{product.oldPrice}</span>
                    )}
                  </div>

                  <button
                    className={`pm-add-to-cart-btn ${addedCart[product.id] ? 'added' : ''}`}
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

export default PlumbingMaterials;

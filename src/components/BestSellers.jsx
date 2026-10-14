import React, { useState } from 'react';
import { Heart, ShoppingCart, ArrowRight } from 'lucide-react';
import './BestSellers.css';
import WhatsAppOrderModal, { WhatsAppIcon } from './common/WhatsAppOrderModal';
import { useShop } from '../context/ShopContext';

const products = [
  {
    id: 1,
    name: 'Legrand 2 Gang Switch White',
    price: 'AED 28.00',
    image: '/switch.png'
  },
  {
    id: 2,
    name: 'Fluke 62 MAX MINI Thermometer',
    price: 'AED 350.00',
    image: '/Fluke 62 MAX MINI Thermometer.png'
  },
  {
    id: 3,
    name: 'Fluke T140 Voltage Tester with Probes',
    price: 'AED 480.00',
    image: '/Fluke T140 Voltage Tester with Probes.png'
  },
  {
    id: 4,
    name: 'Schneider RCCB 40A 2P',
    price: 'AED 95.00',
    image: '/prod_mcb_1791451449276.png'
  },
  {
    id: 5,
    name: 'LED Street Light 150W IP65',
    price: 'AED 280.00',
    image: '/prod_floodlight_1791451459906.png'
  }
];

const BestSellers = ({ onProductClick }) => {
  const [waProduct, setWaProduct] = useState(null);
  const { addToCart, toggleWishlist, isInWishlist } = useShop();

  return (
    <div className="best-sellers-section">
      <div className="container">

        <div className="best-sellers-header">
          <div className="best-sellers-header-left">
            <h4 className="best-sellers-subtitle">BEST SELLING PRODUCTS</h4>
            <h2 className="best-sellers-title">Our Best Sellers</h2>
          </div>
          <a href="#" className="bs-view-all">
            View All Products <ArrowRight size={16} />
          </a>
        </div>

        <div className="bs-products-grid">
          {products.map(product => {
            const isFavorited = isInWishlist(product.id);

            return (
              <div 
                key={product.id} 
                className="bs-product-card"
                onClick={() => onProductClick && onProductClick(product)}
                style={{ cursor: 'pointer' }}
              >
                <button 
                  className="bs-heart-btn" 
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleWishlist(product);
                  }}
                  title={isFavorited ? "Remove from wishlist" : "Add to wishlist"}
                >
                  <Heart 
                    size={20} 
                    className="heart-icon" 
                    fill={isFavorited ? '#e6005c' : 'none'} 
                    color={isFavorited ? '#e6005c' : '#1b253c'} 
                  />
                </button>

                <div className="bs-product-image-wrapper">
                  <img src={product.image} alt={product.name} className="bs-product-image" />
                </div>

                <div className="bs-product-details">
                  <h3 className="bs-product-name">{product.name}</h3>
                  <p className="bs-product-price">{product.price}</p>
                  <button 
                    className="bs-add-to-cart-btn" 
                    onClick={(e) => {
                      e.stopPropagation();
                      addToCart(product, 1);
                    }}
                  >
                    <ShoppingCart size={16} />
                    Add to Cart
                  </button>
                <button 
                  type="button" 
                  className="bs-whatsapp-btn" 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    setWaProduct(product); 
                  }}
                >
                  <WhatsAppIcon size={16} />
                  Order via WhatsApp
                </button>
              </div>
            </div>
            );
          })}
        </div>

      </div>

      <WhatsAppOrderModal 
        isOpen={!!waProduct} 
        product={waProduct} 
        onClose={() => setWaProduct(null)} 
      />
    </div>
  );
};

export default BestSellers;

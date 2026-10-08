import React from 'react';
import { Heart, ShoppingCart, ArrowRight } from 'lucide-react';
import './FeaturedProducts.css';

const products = [
  {
    id: 1,
    name: 'Philips LED Downlight 15W Round (Cool White)',
    price: 'AED 35.00',
    image: '/prod_downlight_1791451418016.png'
  },
  {
    id: 2,
    name: 'Ducab Electrical Cable 3 Core 2.5mm (100m)',
    price: 'AED 320.00',
    image: '/prod_cable_1791451428788.png'
  },
  {
    id: 3,
    name: 'Legrand 13A Switch Socket White',
    price: 'AED 18.00',
    image: '/prod_socket_1791451439423.png'
  },
  {
    id: 4,
    name: 'Schneider MCB 63A 1P',
    price: 'AED 25.00',
    image: '/prod_mcb_1791451449276.png'
  },
  {
    id: 5,
    name: 'LED Flood Light 100W IP65 (Outdoor)',
    price: 'AED 120.00',
    image: '/prod_floodlight_1791451459906.png'
  }
];

const categories = ['All', 'Lighting', 'Switches', 'Cables', 'Electrical Equipment >', 'Tools'];

const FeaturedProducts = () => {
  return (
    <div className="featured-section">
      <div className="container">
        
        <div className="featured-header-top">
          <h4 className="featured-subtitle">FEATURED PRODUCTS</h4>
          <a href="#" className="view-all">
            View All Products <ArrowRight size={16} />
          </a>
        </div>
        
        <div className="featured-header-bottom">
          <h2 className="featured-title">Popular Electrical Products</h2>
          <div className="featured-filters">
            {categories.map((category, index) => (
              <button 
                key={index} 
                className={`filter-btn ${index === 0 ? 'active' : ''}`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        <div className="products-grid">
          {products.map(product => (
            <div key={product.id} className="product-card">
              <button className="heart-btn">
                <Heart size={20} className="heart-icon" />
              </button>
              
              <div className="product-image-wrapper">
                <img src={product.image} alt={product.name} className="product-image" />
              </div>
              
              <div className="product-details">
                <h3 className="product-name">{product.name}</h3>
                <p className="product-price">{product.price}</p>
                <button className="add-to-cart-btn">
                  <ShoppingCart size={16} />
                  Add to Cart
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default FeaturedProducts;

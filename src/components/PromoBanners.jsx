import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import './PromoBanners.css';

const PromoBanners = () => {
  const navigate = useNavigate();

  return (
    <section className="promo-banners-section">
      <div className="container promo-banners-container">
        
        {/* Banner 1 */}
        <div 
          className="promo-banner"
          style={{ backgroundImage: 'url("/Industrial Cable Reels in Bright Warehouse.png")' }}
        >
          <div className="promo-content">
            <h4 className="promo-subtitle">QUALITY CABLES & WIRING</h4>
            <h2 className="promo-title">Reliable Connections<br/>for Every Project.</h2>
            <p className="promo-desc">
              High-quality cables and wiring solutions for residential, commercial and industrial use.
            </p>
            <button className="promo-btn" onClick={() => navigate('/cables-cable-management')}>
              Shop Cables <ArrowRight size={16} />
            </button>
          </div>
        </div>

        {/* Banner 2 */}
        <div 
          className="promo-banner"
          style={{ 
            backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.45) 0%, transparent 35%), url("/Industrial Safety Gear Still Life.png")',
            cursor: 'pointer'
          }}
          onClick={() => navigate('/safety-products')}
        >
          <div className="promo-content">
            <h4 className="promo-subtitle">SAFETY PRODUCTS</h4>
            <h2 className="promo-title">Safety Equipment for<br/>Professionals.</h2>
            <p className="promo-desc">
              Certified protective gear, high-visibility apparel,<br/>and worksite safety essentials.
            </p>
            <button 
              className="promo-btn"
              onClick={(e) => {
                e.stopPropagation();
                navigate('/safety-products');
              }}
            >
              Shop Safety Products <ArrowRight size={16} />
            </button>
          </div>
        </div>

      </div>
    </section>
  );
};

export default PromoBanners;

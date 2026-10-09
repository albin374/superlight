import React from 'react';
import { ArrowRight } from 'lucide-react';
import './PromoBanners.css';

const PromoBanners = () => {
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
            <button className="promo-btn">
              Shop Cables <ArrowRight size={16} />
            </button>
          </div>
        </div>

        {/* Banner 2 */}
        <div 
          className="promo-banner"
          style={{ backgroundImage: 'url("/Digital Multimeter and Electrical Tools.png")' }}
        >
          <div className="promo-content">
            <h4 className="promo-subtitle">TOOLS & HARDWARE</h4>
            <h2 className="promo-title">Power Tools for<br/>Professionals.</h2>
            <p className="promo-desc">
              Durable and reliable tools for construction and electrical work.
            </p>
            <button className="promo-btn">
              Shop Tools <ArrowRight size={16} />
            </button>
          </div>
        </div>

      </div>
    </section>
  );
};

export default PromoBanners;

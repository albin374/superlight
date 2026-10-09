import React from 'react';
import { ArrowRight } from 'lucide-react';
import './LightingBanner.css';

const LightingBanner = () => {
  return (
    <section className="lighting-banner-section">
      <div className="container">
        <div 
          className="lighting-banner"
          style={{ backgroundImage: 'url("/Luxurious Warm-Toned Modern Living Room.png")' }}
        >
          <div className="lighting-banner-overlay"></div>
          <div className="lighting-banner-content">
            <h4 className="lighting-subtitle">MODERN LIGHTING SOLUTIONS</h4>
            <h2 className="lighting-title">Transform Your<br/>Spaces with Light.</h2>
            <p className="lighting-desc">
              Stylish and energy-efficient lighting for homes, offices and commercial projects.
            </p>
            <button className="lighting-btn">
              Shop Lighting <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LightingBanner;

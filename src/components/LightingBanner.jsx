import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import './LightingBanner.css';

const LightingBanner = () => {
  const navigate = useNavigate();

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
            <button className="lighting-btn" onClick={() => navigate('/lighting-solutions')}>
              Shop Lighting <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LightingBanner;

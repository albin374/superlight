import React from 'react';
import './CompanyBanner.css';

const CompanyBanner = () => {
  return (
    <section className="showcase-banner-section" aria-label="Superlight Corporate Showcase Banner">
      <div className="showcase-banner-wrapper">
        
        {/* Content Container */}
        <div className="showcase-banner-content-container">
          <div className="showcase-banner-card">
            
            {/* Headline */}
            <h1 className="showcase-banner-title">
              Powering A <br />
              <span className="title-pink">Brighter Tomorrow.</span>
            </h1>

            {/* Description */}
            <p className="showcase-banner-desc">
              Your trusted supplier of electrical products, lighting solutions, 
              wires and cables, tools, sanitary products, and essential building materials.
            </p>

          </div>
        </div>

      </div>
    </section>
  );
};

export default CompanyBanner;

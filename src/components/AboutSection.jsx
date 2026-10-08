import React from 'react';
import { ArrowRight, Package, ShieldCheck, Headset } from 'lucide-react';
import './AboutSection.css';

const AboutSection = () => {
  return (
    <section className="about-section">
      <div className="about-content-wrapper">
        <div className="about-text-content">
          <h4 className="about-subtitle">ABOUT SUPER LIGHT</h4>
          <h2 className="about-title">Your Reliable Electrical Trading Partner in Dubai</h2>
          <p className="about-description">
            Super Light Electrical Trading L.L.C. is a trusted supplier of electrical, lighting and building materials in the UAE. We provide high-quality products from leading global brands, serving contractors, businesses and individual customers with reliable solutions and excellent service.
          </p>
          <button className="about-btn">
            Learn More About Us <ArrowRight size={18} />
          </button>

          <div className="about-features">
            <div className="feature-item">
              <div className="feature-icon-wrapper">
                <Package size={28} className="feature-icon" />
              </div>
              <div className="feature-text">
                <h5 className="feature-title">Wide Product Range</h5>
                <p className="feature-desc">Electrical, lighting & more</p>
              </div>
            </div>
            
            <div className="feature-item">
              <div className="feature-icon-wrapper">
                <ShieldCheck size={28} className="feature-icon" />
              </div>
              <div className="feature-text">
                <h5 className="feature-title">Trusted Global Brands</h5>
                <p className="feature-desc">100% genuine products</p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon-wrapper">
                <Headset size={28} className="feature-icon" />
              </div>
              <div className="feature-text">
                <h5 className="feature-title">Dedicated Support</h5>
                <p className="feature-desc">We're here to help</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="about-image-wrapper">
        <img 
          src="/Modern Superlight Corporate Building.png" 
          alt="Super Light Corporate Building" 
          className="about-image"
        />
      </div>
    </section>
  );
};

export default AboutSection;

import React from 'react';
import { useNavigate } from 'react-router-dom';
import './AboutUs.css';
import { ArrowRight, Target, Eye, Calendar, Users, Handshake, Store, Award, ClipboardCheck } from 'lucide-react';

const AboutUs = () => {
  const navigate = useNavigate();
  const trustedBrands = [
    { id: 1, name: 'Schneider Electric', logo: '/logo/Schneider Electric.png' },
    { id: 2, name: 'Legrand', logo: '/logo/Legrand.png' },
    { id: 3, name: 'Philips', logo: '/logo/philips.png' },
    { id: 4, name: 'Osram', logo: '/logo/osram.png' },
    { id: 5, name: 'Makita', logo: '/logo/makitha.png' },
    { id: 6, name: 'DeWalt', logo: '/logo/DeWalt_Logo.svg' },
    { id: 7, name: 'Ducab', logo: '/logo/Ducab.png' },
    { id: 8, name: 'Belden', logo: '/logo/belden.png' },
    { id: 9, name: 'Fluke', logo: '/logo/Fluke_Logo2.webp' }
  ];

  return (
    <div className="about-us-page">
      {/* 1. Hero Showcase Banner */}
      <section className="about-hero-banner" aria-label="About Us Showcase Banner">
        <div className="about-hero-wrapper">
          <div className="about-hero-content">
            
            <div className="about-hero-tag-row">
              <span className="about-hero-tag">GET TO KNOW US</span>
              <span className="about-hero-pink-line"></span>
            </div>

            <h1 className="about-hero-title">
              About <span className="title-pink">Us</span>
            </h1>

            <p className="about-hero-desc">
              Delivering trusted electrical and lighting solutions for a brighter and more connected tomorrow.
            </p>

          </div>
        </div>
      </section>

      {/* 2. Main About Details */}
      <section id="about-us" className="about-us-section">
        <div className="container about-us-container">
          {/* Left Content */}
          <div className="about-us-content">
            <div className="about-subtitle-wrapper">
              <span className="about-subtitle">SUPER LIGHT ELECTRICAL TRADING LLC</span>
              <div className="subtitle-line"></div>
            </div>
            
            <div className="about-text">
              <p>
                Super Light Electrical Trading is a firm established in 2020 as the 
                stockiest supplier of all electrical and sanitary products in the UAE.
              </p>
              <p>
                Over the years Super Light has steadily developed into a professionally 
                managed organisation, wholly dedicated to the most exacting standards 
                of quality, customer service and consistently motivated by end-user 
                to ensure total product statisfaction.
              </p>
              <p>
                We are dealers of top brands such as Philips, Quanta, SKILLTECH, ALMANIA, 
                MODI, Osram, FSL, NOVEX, Schneider, KDK, Legrand, ABB, Belden, RR Kabel, 
                Ramcro, Ducab, Dewalt, Makita and many more.
              </p>
            </div>

            <button className="learn-more-btn" onClick={() => navigate('/company-overview')}>
              Learn More <ArrowRight size={18} />
            </button>
          </div>

          {/* Right Visual Image */}
          <div className="about-us-visual">
            <div className="about-showroom-card">
              <img 
                src="/Modern Superlight Electrical Showroom.png" 
                alt="Modern Superlight Electrical Showroom" 
                className="about-showroom-img" 
              />
            </div>
          </div>
        </div>
      </section>

    {/* 2. Our Vision and Mission Section */}
    <section className="about-mv-section" aria-label="Our Vision and Mission">
      <div className="container about-mv-container">
        <div className="about-mv-grid">
          
          {/* Left: Our Vision */}
          <div className="about-mv-col">
            <div className="about-mv-header">
              <div className="about-mv-icon-box">
                <Eye size={48} strokeWidth={1.75} />
              </div>
              <div className="about-mv-header-text">
                <div className="about-mv-tag-row">
                  <span className="about-mv-tag">OUR VISION</span>
                  <span className="about-mv-pink-line"></span>
                </div>
                <h3 className="about-mv-heading">
                  Building a Brighter <br />
                  <span className="title-pink">Tomorrow</span>
                </h3>
              </div>
            </div>
            <p className="about-mv-desc">
              To become a dominant and most reputed distributor and supplier of electrical products and sanitary materials in the UAE.
            </p>
          </div>

          {/* Vertical Divider */}
          <div className="about-mv-divider"></div>

          {/* Right: Our Mission */}
          <div className="about-mv-col">
            <div className="about-mv-header">
              <div className="about-mv-icon-box">
                <Target size={48} strokeWidth={1.75} />
              </div>
              <div className="about-mv-header-text">
                <div className="about-mv-tag-row">
                  <span className="about-mv-tag">OUR MISSION</span>
                  <span className="about-mv-pink-line"></span>
                </div>
                <h3 className="about-mv-heading">
                  Delivering Value <br />
                  <span className="title-pink">Every Day</span>
                </h3>
              </div>
            </div>
            <p className="about-mv-desc">
              Ensuring quality standard services in all forms. Provide quality products. Welcoming new ideas and concepts to implement for better growth and premium services to clients.
            </p>
          </div>

        </div>
      </div>

      {/* Bottom wave ribbon aesthetic */}
      <div className="about-mv-waves" aria-hidden="true">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
          <path d="M-50,85 C220,125 420,35 720,80 C1020,125 1240,45 1490,90" stroke="rgba(230, 0, 92, 0.45)" strokeWidth="1.5" />
          <path d="M-50,65 C240,110 470,20 720,65 C970,110 1200,30 1490,70" stroke="rgba(255, 26, 117, 0.3)" strokeWidth="1.2" />
          <path d="M-50,105 C260,55 520,120 720,95 C920,70 1180,115 1490,55" stroke="rgba(230, 0, 92, 0.2)" strokeWidth="1" />
        </svg>
      </div>
    </section>

      {/* 3. Our Journey In Numbers Showcase Banner */}
      <section className="about-journey-banner" aria-label="Our Journey in Numbers">
        <div className="about-journey-wrapper">
          <div className="about-journey-content">
            
            <div className="about-journey-tag-row">
              <span className="about-journey-tag">OUR JOURNEY IN NUMBERS</span>
              <span className="about-journey-pink-line"></span>
            </div>

            <h2 className="about-journey-title">
              Growth Driven<br />
              by <span className="title-pink">Trust</span>
            </h2>

            <div className="about-journey-grid">
              <div className="journey-stat-card">
                <div className="journey-stat-icon">
                  <Calendar size={28} strokeWidth={1.75} />
                </div>
                <div className="journey-stat-number">6+</div>
                <div className="journey-stat-label">
                  <span>Years of</span>
                  <span>Experience</span>
                </div>
              </div>

              <div className="journey-stat-card">
                <div className="journey-stat-icon">
                  <Users size={28} strokeWidth={1.75} />
                </div>
                <div className="journey-stat-number">800</div>
                <div className="journey-stat-label">
                  <span>Happy</span>
                  <span>Customers</span>
                </div>
              </div>

              <div className="journey-stat-card">
                <div className="journey-stat-icon">
                  <Handshake size={28} strokeWidth={1.75} />
                </div>
                <div className="journey-stat-number">600</div>
                <div className="journey-stat-label">
                  <span>Companies</span>
                  <span>Work With Us</span>
                </div>
              </div>

              <div className="journey-stat-card">
                <div className="journey-stat-icon">
                  <Store size={28} strokeWidth={1.75} />
                </div>
                <div className="journey-stat-number">3</div>
                <div className="journey-stat-label">
                  <span>Outlets</span>
                </div>
              </div>

              <div className="journey-stat-card">
                <div className="journey-stat-icon">
                  <Award size={28} strokeWidth={1.75} />
                </div>
                <div className="journey-stat-number">21</div>
                <div className="journey-stat-label">
                  <span>Team</span>
                  <span>Members</span>
                </div>
              </div>

              <div className="journey-stat-card">
                <div className="journey-stat-icon">
                  <ClipboardCheck size={28} strokeWidth={1.75} />
                </div>
                <div className="journey-stat-number">750</div>
                <div className="journey-stat-label">
                  <span>Projects</span>
                  <span>Completed</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 4. Global Brands Section */}
      <section className="about-brands-section">
        <div className="container about-brands-container">
          <div className="about-brands-header">
            <div className="about-brands-tag-wrapper">
              <span className="about-brands-tag">GLOBAL BRANDS</span>
              <span className="about-brands-pink-line"></span>
            </div>
            <h2 className="about-brands-title">
              Our <span className="title-pink">Trusted Brands</span>
            </h2>
            <p className="about-brands-desc">
              We work with leading global brands to bring you reliable and high-performance products.
            </p>
          </div>

          <div className="about-brands-rows">
            <div className="about-brands-row row-5">
              {trustedBrands.slice(0, 5).map((brand) => (
                <div key={brand.id} className="about-brand-card">
                  <img src={brand.logo} alt={brand.name} className="about-brand-logo" />
                </div>
              ))}
            </div>

            <div className="about-brands-row row-4">
              {trustedBrands.slice(5, 9).map((brand) => (
                <div key={brand.id} className="about-brand-card">
                  <img src={brand.logo} alt={brand.name} className="about-brand-logo" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
  </div>
  );
};

export default AboutUs;

import React, { useState, useEffect } from 'react';
import { Phone, Mail, Search, User, Heart, ShoppingCart, Menu, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import './HeroSection.css';

const HeroSection = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    { id: 1, image: '/home page banner 1.png' },
    { id: 2, image: '/home page banner 2.png' }
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  useEffect(() => {
    const timer = setInterval(() => {
      nextSlide();
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="superlight-hero-container">
      {/* Top Bar */}
      <div className="top-bar">
        <div className="container top-bar-content">
          <div className="top-bar-left">
            <span className="top-bar-item"><Phone size={14} /> +971 50 123 4567</span>
            <span className="top-bar-item"><Mail size={14} /> sales@superlight.ae</span>
          </div>
          <div className="top-bar-right">
            <span>Track Order</span>
            <span className="divider">|</span>
            <span>Help & Support</span>
            <span className="divider">|</span>
            <span>AED <span style={{fontSize: '10px'}}>▼</span></span>
            <span className="divider">|</span>
            <img src="https://flagcdn.com/w20/ae.png" alt="UAE Flag" className="flag-icon" />
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="main-header">
        <div className="container main-header-content">
          {/* Logo */}
          <div className="logo">
            <img src="/Superlight-Logo-01.svg" alt="Superlight Logo" className="logo-image" />
          </div>

          {/* Search Bar */}
          <div className="search-container">
            <input type="text" placeholder="Search for products, brands or categories..." className="search-input" />
            <button className="search-button">
              <Search size={20} />
            </button>
          </div>

          {/* User Actions */}
          <div className="user-actions">
            <div className="action-item">
              <User size={24} className="action-icon" />
              <div className="action-text">
                <span className="action-title">My Account</span>
                <span className="action-subtitle">Login / Register</span>
              </div>
            </div>
            
            <div className="action-item icon-only">
              <div className="icon-wrapper">
                <Heart size={24} className="action-icon" />
                <span className="badge">0</span>
              </div>
            </div>

            <div className="action-item icon-only">
              <div className="icon-wrapper">
                <ShoppingCart size={24} className="action-icon" />
                <span className="badge">0</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="navigation">
        <div className="container nav-content">
          <button className="all-categories-btn">
            <Menu size={20} />
            <span>All Categories</span>
            <ArrowRight size={16} />
          </button>
          
          <ul className="nav-links">
            <li><a href="#">BELCABLE</a></li>
            <li><a href="#">SHOP BY BRAND</a></li>
            <li><a href="#">WE ARE OFFERING</a></li>
            <li><a href="#">CONTACT US</a></li>
            <li><a href="#">COMPANY OVERVIEW</a></li>
            <li><a href="#">PARENT COMPANY</a></li>
          </ul>
        </div>
      </div>

      {/* Hero Banner */}
      <div 
        className="hero-banner" 
        style={{ backgroundImage: `url('${slides[currentSlide].image}')`, transition: 'background-image 0.5s ease-in-out' }}
      >
        <div className="container hero-content-wrapper">
          <div className="hero-text-content">
            <h3 className="hero-subtitle">ELECTRICAL SOLUTIONS FOR A</h3>
            <h1 className="hero-title">
              <span className="title-pink">Brighter</span><br/>
              <span className="title-pink">Tomorrow.</span>
            </h1>
            <p className="hero-description">
              Wide range of electrical, lighting and building materials for homes, businesses and every project in the UAE.
            </p>
            <div className="hero-buttons">
              <button className="btn-primary">Shop Products <ArrowRight size={16} /></button>
              <button className="btn-secondary">Explore Categories</button>
            </div>
          </div>
          
          {/* Slider Controls */}
          <div className="slider-controls">
            <div className="slider-dots">
              {slides.map((_, index) => (
                <span 
                  key={index} 
                  className={`dot ${currentSlide === index ? 'active' : ''}`}
                  onClick={() => setCurrentSlide(index)}
                ></span>
              ))}
            </div>
            <div className="slider-arrows">
              <button className="arrow-btn" onClick={prevSlide}><ChevronLeft size={20} /></button>
              <button className="arrow-btn" onClick={nextSlide}><ChevronRight size={20} /></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;

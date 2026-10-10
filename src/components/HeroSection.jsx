import React, { useState, useEffect } from 'react';
import { Phone, Mail, Search, User, Heart, ShoppingCart, Menu, X, ArrowRight, ChevronLeft, ChevronRight, Server, ToggleRight, Zap, Box, Layers, Shield, Sliders, Database, ArrowDown, ChevronDown, Activity, Lightbulb, BellRing, Cpu } from 'lucide-react';
import './HeroSection.css';

const HeroSection = ({ isHome = true, goHome, goToAboutUs, goToContactUs, goToFaqs }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const slides = [
    { 
      id: 1, 
      desktopImage: '/home page banner 1.png',
      mobileImage: '/Sunlit Modern Dining Kitchen.png'
    },
    { 
      id: 2, 
      desktopImage: '/home page banner 2.png',
      mobileImage: '/Sunlit Luxury Kitchen with Skyline Views.png'
    },
    {
      id: 3,
      desktopImage: '/Warm Modern Open-Plan Interior.png',
      mobileImage: '/Luxurious Warm-Toned Open-Plan Interior.png'
    }
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
      
      {/* Mobile Menu Overlay & Drawer */}
      <div className={`mobile-menu-overlay ${isMobileMenuOpen ? 'open' : ''}`} onClick={() => setIsMobileMenuOpen(false)}></div>
      <div className={`mobile-menu-drawer ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="mobile-menu-header">
          <img src="/Superlight-Logo-01.svg" alt="Superlight" className="logo-image" style={{height: '35px'}} />
          <button className="close-menu-btn" onClick={() => setIsMobileMenuOpen(false)}>
            <X size={24} />
          </button>
        </div>
        <div className="mobile-menu-content">
          <div className="mobile-top-bar-items">
            <div className="mobile-menu-item"><Phone size={16} /> +971 50 123 4567</div>
            <div className="mobile-menu-item"><Mail size={16} /> sales@superlight.ae</div>
            <div className="mobile-menu-item">Track Order</div>
            <div className="mobile-menu-item">Help & Support</div>
          </div>
          <div className="mobile-nav-links">
            <a href="#" style={{color: '#e6005c', display: 'flex', alignItems: 'center', gap: '8px'}}><Menu size={18} /> All Categories</a>
            <a href="#">BELCABLE</a>
            <a href="#">SHOP BY BRAND</a>
            <a href="#">WE ARE OFFERING</a>
            <a href="#" onClick={(e) => { e.preventDefault(); goToContactUs(); setIsMobileMenuOpen(false); }}>CONTACT US</a>
            <a href="#">COMPANY OVERVIEW</a>
            <a href="#">PARENT COMPANY</a>
          </div>
        </div>
      </div>

      {/* Top Bar */}
      <div className="top-bar">
        <div className="container top-bar-content">
          <div className="top-bar-left">
            <span className="top-bar-item" style={{cursor: 'pointer', fontWeight: '600'}} onClick={goToAboutUs}>ABOUT US</span>
            <span className="divider">|</span>
            <span className="top-bar-item" style={{cursor: 'pointer', fontWeight: '600'}} onClick={goToContactUs}>CONTACT US</span>
            <span className="divider">|</span>
            <span className="top-bar-item" style={{cursor: 'pointer', fontWeight: '600'}} onClick={goToFaqs}>FAQS</span>
          </div>
          <div className="top-bar-right">
            <div style={{display: 'flex', gap: '16px', alignItems: 'center'}}>
              <a href="#" style={{color: 'white', display: 'flex', alignItems: 'center'}}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg></a>
              <a href="#" style={{color: 'white', display: 'flex', alignItems: 'center'}}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4l11.733 16h4.267l-11.733 -16z"/><path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772"/></svg></a>
              <a href="#" style={{color: 'white', display: 'flex', alignItems: 'center'}}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg></a>
              <a href="#" style={{color: 'white', display: 'flex', alignItems: 'center'}}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg></a>
            </div>
            <span className="divider" style={{marginLeft: '12px', marginRight: '4px'}}>|</span>
            <span className="top-bar-item" style={{fontWeight: '600'}}>Email: Sales1@superlight.ae</span>
            <span className="divider" style={{marginLeft: '4px', marginRight: '4px'}}>|</span>
            <span className="top-bar-item" style={{fontWeight: '600'}}>WhatsApp: +971545810080</span>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="main-header">
        <div className="container main-header-content">
          <button className="mobile-menu-btn" onClick={() => setIsMobileMenuOpen(true)}>
            <Menu size={24} />
          </button>
          
          {/* Logo */}
          <div className="logo" onClick={goHome} style={{cursor: 'pointer'}}>
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
          <div className="all-categories-wrapper dropdown">
            <button className="all-categories-btn">
              <Menu size={24} strokeWidth={1.5} />
              <span>All Categories</span>
              <ArrowRight size={20} strokeWidth={2} />
            </button>
            <div className="dropdown-menu categories-menu">
              <div className="category-item-container">
                <a href="#" className="category-item">
                  <div className="category-item-left">
                    <Server size={20} strokeWidth={1.5} />
                    <span>Load Centers & Circuit Breakers</span>
                  </div>
                </a>
                
                <div className="submenu-panel">
                  <div className="submenu-column">
                    <h4>LOAD CENTERS</h4>
                    <ul>
                      <li><a href="#">Flush - Curved Doors</a></li>
                      <li><a href="#">Flush - Flat Doors</a></li>
                      <li><a href="#">Flush - Square Key</a></li>
                      <li><a href="#">Surface Curved Doors</a></li>
                      <li><a href="#">Surface - Flat Doors</a></li>
                      <li><a href="#">Consumer Units</a></li>
                    </ul>
                  </div>
                  <div className="submenu-column">
                    <h4>CIRCUIT BREAKERS</h4>
                    <ul>
                      <li><a href="#">MCB</a></li>
                      <li><a href="#">MCCB</a></li>
                      <li><a href="#">RCBO & RCCB</a></li>
                      <li><a href="#">ACB</a></li>
                      <li><a href="#">Switches</a></li>
                    </ul>
                  </div>
                  <div className="submenu-column">
                    <h4>CIRCUIT BREAKERS ACCESSORIES</h4>
                    <ul>
                      <li><a href="#">Bases</a></li>
                      <li><a href="#">Busbars</a></li>
                      <li><a href="#">Connectors Adaptors & Plates</a></li>
                      <li><a href="#">External Neutral CT</a></li>
                      <li><a href="#">Locks & Blocks</a></li>
                      <li><a href="#">Motors</a></li>
                      <li><a href="#">Rotary Handles</a></li>
                      <li><a href="#">Terminals & Accessories</a></li>
                      <li><a href="#">Trips & Releases</a></li>
                      <li><a href="#">VIGI</a></li>
                    </ul>
                  </div>
                </div>
              </div>
              <a href="#" className="category-item">
                <div className="category-item-left">
                  <ToggleRight size={20} strokeWidth={1.5} />
                  <span>Electrical Switches & Sockets</span>
                </div>
              </a>
              <a href="#" className="category-item">
                <div className="category-item-left">
                  <Zap size={20} strokeWidth={1.5} />
                  <span>Cables & Wires</span>
                </div>
              </a>
              <a href="#" className="category-item">
                <div className="category-item-left">
                  <Box size={20} strokeWidth={1.5} />
                  <span>Conduits & Boxes</span>
                </div>
              </a>
              <a href="#" className="category-item">
                <div className="category-item-left">
                  <Layers size={20} strokeWidth={1.5} />
                  <span>Busbars</span>
                </div>
              </a>
              <a href="#" className="category-item">
                <div className="category-item-left">
                  <Shield size={20} strokeWidth={1.5} />
                  <span>Protection</span>
                </div>
              </a>
              <a href="#" className="category-item">
                <div className="category-item-left">
                  <Sliders size={20} strokeWidth={1.5} />
                  <span>Control</span>
                </div>
              </a>
              <a href="#" className="category-item">
                <div className="category-item-left">
                  <Database size={20} strokeWidth={1.5} />
                  <span>Enclosures</span>
                </div>
              </a>
              <a href="#" className="category-item">
                <div className="category-item-left">
                  <ArrowDown size={20} strokeWidth={1.5} />
                  <span>Earthing & Grounding Equipment</span>
                </div>
              </a>
              <a href="#" className="category-item">
                <div className="category-item-left">
                  <Activity size={20} strokeWidth={1.5} />
                  <span>Measurement & Testing</span>
                </div>
              </a>
              <a href="#" className="category-item">
                <div className="category-item-left">
                  <Lightbulb size={20} strokeWidth={1.5} />
                  <span>Lighting</span>
                </div>
              </a>
              <a href="#" className="category-item">
                <div className="category-item-left">
                  <BellRing size={20} strokeWidth={1.5} />
                  <span>Bells</span>
                </div>
              </a>
              <a href="#" className="category-item">
                <div className="category-item-left">
                  <Cpu size={20} strokeWidth={1.5} />
                  <span>Patch Panels</span>
                </div>
              </a>
            </div>
          </div>
          
          <ul className="nav-links">
            <li><a href="#">BELCABLE</a></li>
            <li className="dropdown">
              <a href="#">SHOP BY BRAND</a>
              <div className="dropdown-menu mega-menu">
                <div className="mega-menu-item">
                  <a href="#">
                    Belden
                    <span className="best-seller-tag">BEST SELLER</span>
                  </a>
                </div>
                <div className="mega-menu-item"><a href="#">Schneider</a></div>
                <div className="mega-menu-item"><a href="#">Legrand</a></div>
                <div className="mega-menu-item"><a href="#">Phlilips</a></div>
                <div className="mega-menu-item"><a href="#">Osram</a></div>
                <div className="mega-menu-item"><a href="#">Makita</a></div>
                <div className="mega-menu-item"><a href="#">Dewalt</a></div>
                <div className="mega-menu-item"><a href="#">Ducab</a></div>
              </div>
            </li>
            <li className="dropdown">
              <a href="#">WE ARE OFFERING</a>
              <div className="dropdown-menu mega-menu">
                <div className="mega-menu-item">
                  <a href="#">Electrical Switchgear</a>
                </div>
                <div className="mega-menu-item">
                  <a href="#">Lighting Solutions</a>
                </div>
                <div className="mega-menu-item">
                  <a href="#">Cables & Cable Management</a>
                </div>
                <div className="mega-menu-item">
                  <a href="#">Electrical Accessories</a>
                </div>
                <div className="mega-menu-item">
                  <a href="#">Home Automation</a>
                </div>
                <div className="mega-menu-item">
                  <a href="#">Electrical Equipment</a>
                </div>
                <div className="mega-menu-item">
                  <a href="#">Adhesives & Sealants</a>
                </div>
                <div className="mega-menu-item">
                  <a href="#">Plumbing Materials</a>
                </div>
                <div className="mega-menu-item">
                  <a href="#">Tools & Hardware</a>
                </div>
                <div className="mega-menu-item">
                  <a href="#">Paints</a>
                </div>
              </div>
            </li>
            <li><a href="#">COMPANY OVERVIEW</a></li>
            <li><a href="#">PARENT COMPANY</a></li>
            <li><a href="#" onClick={(e) => { e.preventDefault(); goToContactUs(); }}>CONTACT US</a></li>
          </ul>
        </div>
      </div>

      {/* Hero Banner */}
      {isHome && (
        <div 
          className="hero-banner" 
          style={{ backgroundImage: `url('${isMobile ? slides[currentSlide].mobileImage : slides[currentSlide].desktopImage}')`, transition: 'background-image 0.5s ease-in-out' }}
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
      )}
    </div>
  );
};

export default HeroSection;

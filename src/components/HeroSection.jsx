import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Phone, Mail, Search, User, Heart, ShoppingCart, Package, Menu, X, ArrowRight, ChevronLeft, ChevronRight, Server, ToggleRight, Zap, Box, Layers, Shield, Sliders, Database, ArrowDown, ChevronDown, Activity, Lightbulb, BellRing, Cpu } from 'lucide-react';
import './HeroSection.css';
import { useShop } from '../context/ShopContext';
import { searchLocalCatalog, renderHighlightedText, getCategoryPath, getBrandPath } from '../utils/searchEngine';
import { getProductUrl } from '../utils/productUrl';

const HeroSection = ({ 
  isHome = true, 
  goHome, 
  goToAboutUs, 
  goToContactUs, 
  goToFaqs, 
  goToCompanyOverview, 
  goToLightingSolutions, 
  goToCableManagement, 
  goToWiresCables,
  goToLedLighting,
  goToSwitchesSockets,
  goToAdhesivesToolsHardware, 
  goToElectricalAccessories, 
  goToPlumbingMaterials, 
  goToHomeAutomation,
  goToSwitchgear,
  goToBuildingMaterials,
  goToSafetyProducts,
  goToAcSpareParts,
  onProductClick
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isMenuLockedRef = useRef(false);
  const { cartCount, wishlistCount, ordersCount } = useShop();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [allDbProducts, setAllDbProducts] = useState([]);
  const [isOfferingMobileOpen, setIsOfferingMobileOpen] = useState(false);
  const [isBrandMobileOpen, setIsBrandMobileOpen] = useState(false);
  const [isAllCatMobileOpen, setIsAllCatMobileOpen] = useState(false);
  const [expandedMobileCatId, setExpandedMobileCatId] = useState(null);
  const [isAllCatHovered, setIsAllCatHovered] = useState(false);
  const navRef = useRef(null);
  const [navBottomOffset, setNavBottomOffset] = useState(190);

  // Search Bar States
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState({ categories: [], brands: [], products: [], totalCount: 0 });
  const [activeSearchIndex, setActiveSearchIndex] = useState(-1);
  const searchContainerRef = useRef(null);
  const searchInputRef = useRef(null);
  const debounceTimerRef = useRef(null);

  useEffect(() => {
    isMenuLockedRef.current = false;
    setIsAllCatHovered(false);
    setIsMobileMenuOpen(false);
    setIsSearchOpen(false);
    setActiveSearchIndex(-1);
  }, [location.pathname]);

  // Click outside listener for search dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setIsSearchOpen(false);
        setActiveSearchIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const updateNavOffset = () => {
      if (navRef.current) {
        const rect = navRef.current.getBoundingClientRect();
        setNavBottomOffset(Math.round(rect.bottom + window.scrollY));
      }
    };
    updateNavOffset();
    window.addEventListener('resize', updateNavOffset);
    return () => window.removeEventListener('resize', updateNavOffset);
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const fetchMenuData = async () => {
      try {
        const [catRes, brandRes, prodRes] = await Promise.all([
          fetch('/api/categories').catch(() => null),
          fetch('/api/brands').catch(() => null),
          fetch('/api/products').catch(() => null)
        ]);
        if (catRes && catRes.ok) {
          const cData = await catRes.json();
          if (cData.success && Array.isArray(cData.categories) && isMounted) {
            setCategories(cData.categories);
          }
        }
        if (brandRes && brandRes.ok) {
          const bData = await brandRes.json();
          if (bData.success && Array.isArray(bData.brands) && isMounted) {
            setBrands(bData.brands);
          }
        }
        if (prodRes && prodRes.ok) {
          const pData = await prodRes.json();
          if (pData.success && Array.isArray(pData.products) && isMounted) {
            setAllDbProducts(pData.products);
          }
        }
      } catch (err) {
        console.error('Failed to load menu data:', err);
      }
    };
    fetchMenuData();
    return () => { isMounted = false; };
  }, []);

  // Real-time search change handler (works instantly from 1st letter like A, d, etc.)
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    setActiveSearchIndex(-1);

    if (val.trim()) {
      setIsSearchOpen(true);
      // 1. Instantaneous local client-side search (0ms delay)
      const instant = searchLocalCatalog(val, {
        liveProducts: allDbProducts,
        liveCategories: categories,
        liveBrands: brands
      });
      setSearchResults(instant);

      // 2. Debounced query to backend search API for live synced records
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(async () => {
        try {
          const res = await fetch(`/api/search?q=${encodeURIComponent(val.trim())}`);
          if (res.ok) {
            const apiData = await res.json();
            if (apiData.success) {
              const merged = searchLocalCatalog(val, {
                liveProducts: [...(apiData.products || []), ...allDbProducts],
                liveCategories: [...(apiData.categories || []), ...categories],
                liveBrands: [...(apiData.brands || []), ...brands]
              });
              setSearchResults(merged);
            }
          }
        } catch (err) {
          // Instant search results are already displayed!
        }
      }, 150);
    } else {
      setIsSearchOpen(false);
      setSearchResults({ categories: [], brands: [], products: [], totalCount: 0 });
    }
  };

  const handleSearchSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const q = searchQuery.trim();
    if (q) {
      setIsSearchOpen(false);
      setActiveSearchIndex(-1);
      if (searchInputRef.current) searchInputRef.current.blur();
      navigate(`/search?q=${encodeURIComponent(q)}`);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setIsSearchOpen(false);
    setActiveSearchIndex(-1);
    setSearchResults({ categories: [], brands: [], products: [], totalCount: 0 });
    if (searchInputRef.current) searchInputRef.current.focus();
  };

  const triggerQuickSearch = (term) => {
    setSearchQuery(term);
    setIsSearchOpen(true);
    setActiveSearchIndex(-1);
    const instant = searchLocalCatalog(term, {
      liveProducts: allDbProducts,
      liveCategories: categories,
      liveBrands: brands
    });
    setSearchResults(instant);
    if (searchInputRef.current) searchInputRef.current.focus();
  };

  const handleProductClick = (product) => {
    setIsSearchOpen(false);
    setActiveSearchIndex(-1);
    if (onProductClick) {
      onProductClick(product);
    } else {
      const targetUrl = getProductUrl(product);
      navigate(targetUrl, { state: { product } });
    }
  };

  const handleSelectCategory = (cat) => {
    setIsSearchOpen(false);
    setActiveSearchIndex(-1);
    handleCategoryClick(null, cat);
  };

  const handleSelectBrand = (brand) => {
    setIsSearchOpen(false);
    setActiveSearchIndex(-1);
    handleBrandClick(null, brand);
  };

  // Keyboard navigation for dropdown
  const handleSearchKeyDown = (e) => {
    if (!isSearchOpen || !searchQuery.trim()) return;

    const flatItems = [
      ...searchResults.categories.map(c => ({ type: 'category', item: c })),
      ...searchResults.brands.map(b => ({ type: 'brand', item: b })),
      ...searchResults.products.map(p => ({ type: 'product', item: p }))
    ];

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSearchIndex(prev => (prev < flatItems.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSearchIndex(prev => (prev > 0 ? prev - 1 : flatItems.length - 1));
    } else if (e.key === 'Enter') {
      if (activeSearchIndex >= 0 && activeSearchIndex < flatItems.length) {
        e.preventDefault();
        const selected = flatItems[activeSearchIndex];
        if (selected.type === 'category') handleSelectCategory(selected.item);
        else if (selected.type === 'brand') handleSelectBrand(selected.item);
        else if (selected.type === 'product') handleProductClick(selected.item);
      } else {
        handleSearchSubmit(e);
      }
    } else if (e.key === 'Escape') {
      setIsSearchOpen(false);
      setActiveSearchIndex(-1);
    }
  };

  const handleCategoryClick = (e, cat, parentCat = null) => {
    if (e && e.preventDefault) e.preventDefault();
    const target = parentCat || cat;
    const slug = (target?.slug || target?.path || '').toLowerCase();
    const name = (target?.name || '').toLowerCase();

    isMenuLockedRef.current = true;
    setIsAllCatHovered(false);
    setIsMobileMenuOpen(false);

    if (slug.includes('switchgear') || slug.includes('control-panel') || name.includes('switchgear') || name.includes('control panel')) {
      if (goToSwitchgear) goToSwitchgear();
      else navigate('/switchgear-control-panel-products');
    } else if (slug.includes('building') || name.includes('building') || slug.includes('plumb') || name.includes('plumb')) {
      if (goToBuildingMaterials) goToBuildingMaterials();
      else navigate('/building-materials');
    } else if (slug.includes('safety') || name.includes('safety')) {
      if (goToSafetyProducts) goToSafetyProducts();
      else navigate('/safety-products');
    } else if (slug.includes('spair') || slug.includes('spare') || slug.includes('ac') || name.includes('spare') || name.includes('spair') || name.includes('ac')) {
      if (goToAcSpareParts) goToAcSpareParts();
      else navigate('/ac-spare-parts');
    } else if (slug.includes('cable') || slug.includes('wire') || name.includes('cable') || name.includes('wire')) {
      if (goToWiresCables) goToWiresCables();
      else navigate('/wires-cables');
    } else if (slug.includes('light') || slug.includes('lamp') || name.includes('light') || name.includes('lamp')) {
      if (goToLedLighting) goToLedLighting();
      else navigate('/led-lighting-special-lamp');
    } else if (slug.includes('switch') || slug.includes('access') || slug.includes('socket') || name.includes('switch')) {
      if (goToSwitchesSockets) goToSwitchesSockets();
      else navigate('/switches-sockets-electrical-accessories');
    } else if (slug.includes('tool') || slug.includes('hardw') || slug.includes('adhes') || name.includes('tool')) {
      if (goToAdhesivesToolsHardware) goToAdhesivesToolsHardware();
      else navigate('/adhesives-tools-hardware');
    } else if (slug.includes('automat') || slug.includes('smart') || name.includes('automation')) {
      if (goToHomeAutomation) goToHomeAutomation();
      else navigate('/home-automation');
    } else {
      navigate(`/${target.slug || ''}`);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBrandClick = (e, brand) => {
    if (e && e.preventDefault) e.preventDefault();
    isMenuLockedRef.current = true;
    setIsAllCatHovered(false);
    setIsMobileMenuOpen(false);

    const bName = (brand?.name || '').toLowerCase();
    const bSlug = (brand?.slug || '').toLowerCase();

    if (bName.includes('dewalt') || bSlug.includes('dewalt')) {
      navigate('/dewalt');
    } else if (bName.includes('makita') || bSlug.includes('makita')) {
      navigate('/makita');
    } else if (bName.includes('ducab') || bSlug.includes('ducab')) {
      navigate('/ducab');
    } else if (bName.includes('fluke') || bSlug.includes('fluke')) {
      navigate('/fluke');
    } else if (bName.includes('philips') || bSlug.includes('philips')) {
      navigate('/philips');
    } else if (bName.includes('osram') || bSlug.includes('osram')) {
      navigate('/osram');
    } else if (bName.includes('belden') || bSlug.includes('belden')) {
      navigate('/belden');
    } else if (bName.includes('legrand') || bSlug.includes('legrand')) {
      navigate('/legrand');
    } else if (bName.includes('schneider') || bSlug.includes('schneider')) {
      navigate('/schneider-electric');
    } else {
      navigate(`/brand/${brand.slug || brand.name.toLowerCase()}`);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
          <img src="/Superlight-Logo-01.svg" alt="Superlight" className="mobile-drawer-logo" />
          <button className="close-menu-btn" onClick={() => setIsMobileMenuOpen(false)}>
            <X size={24} />
          </button>
        </div>
        <div className="mobile-menu-content">
          <div className="mobile-nav-links">
            <div className="mobile-offering-wrapper">
              <a 
                href="#" 
                onClick={(e) => { 
                  e.preventDefault(); 
                  setIsAllCatMobileOpen(!isAllCatMobileOpen); 
                  if (isAllCatMobileOpen) setExpandedMobileCatId(null);
                }}
                style={{ color: '#e6005c', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: '700' }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Menu size={18} /> All Categories</span>
                <ChevronDown size={16} style={{ transform: isAllCatMobileOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
              </a>
              {isAllCatMobileOpen && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px 0 10px 14px' }}>
                  {categories.map((cat) => {
                    const isExpanded = expandedMobileCatId === cat.id;
                    const hasSub = cat.subcategories && cat.subcategories.length > 0;
                    return (
                      <div key={cat.id} style={{ display: 'flex', flexDirection: 'column' }}>
                        <div
                          onClick={(e) => {
                            if (hasSub) {
                              e.preventDefault();
                              setExpandedMobileCatId(isExpanded ? null : cat.id);
                            } else {
                              handleCategoryClick(e, cat);
                              setIsMobileMenuOpen(false);
                            }
                          }}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '9px 0',
                            cursor: 'pointer',
                            fontSize: '13px',
                            color: isExpanded ? '#e6005c' : '#1b253c',
                            fontWeight: '700',
                            textTransform: 'uppercase',
                            letterSpacing: '0.4px',
                            transition: 'color 0.2s',
                            lineHeight: '1.35'
                          }}
                        >
                          <span>{cat.name}</span>
                          {hasSub && (
                            <ChevronDown
                              size={15}
                              style={{
                                transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                transition: 'transform 0.2s',
                                color: isExpanded ? '#e6005c' : '#64748b'
                              }}
                            />
                          )}
                        </div>

                        {isExpanded && hasSub && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '6px 0 12px 14px' }}>
                            {cat.subcategories.map((sub) => (
                              <a
                                key={sub.id}
                                href={`#${sub.slug}`}
                                onClick={(e) => { handleCategoryClick(e, sub, cat); setIsMobileMenuOpen(false); }}
                                style={{ fontSize: '13px', color: '#64748b', padding: '4px 0', textDecoration: 'none', display: 'block', lineHeight: '1.4' }}
                              >
                                {sub.name}
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="mobile-offering-wrapper">
              <a 
                href="#" 
                onClick={(e) => { e.preventDefault(); setIsBrandMobileOpen(!isBrandMobileOpen); }}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <span>SHOP BY BRAND</span>
                <ChevronDown size={16} style={{ transform: isBrandMobileOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
              </a>
              {isBrandMobileOpen && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '8px 0 10px 14px' }}>
                  {brands.map((b) => (
                    <a 
                      key={b.id} 
                      href={`/${b.slug || ''}`} 
                      onClick={(e) => handleBrandClick(e, b)}
                      style={{ fontSize: '13px', color: '#4b5563', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.3px', padding: '5px 0' }}
                    >
                      {b.name}
                    </a>
                  ))}
                </div>
              )}
            </div>
            <div className="mobile-offering-wrapper">
              <a 
                href="#" 
                onClick={(e) => { e.preventDefault(); setIsOfferingMobileOpen(!isOfferingMobileOpen); }}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <span>WE ARE OFFERING</span>
                <ChevronDown size={16} style={{ transform: isOfferingMobileOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
              </a>
              {isOfferingMobileOpen && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '8px 0 10px 14px' }}>
                  {categories.map((cat) => (
                    <a 
                      key={cat.id} 
                      href={`#${cat.slug}`} 
                      onClick={(e) => { handleCategoryClick(e, cat); setIsMobileMenuOpen(false); }}
                      style={{ fontSize: '13px', color: '#4b5563', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.3px', padding: '5px 0' }}
                    >
                      {cat.name}
                    </a>
                  ))}
                </div>
              )}
            </div>
            <a href="#" onClick={(e) => { e.preventDefault(); goToAboutUs && goToAboutUs(); setIsMobileMenuOpen(false); }}>ABOUT US</a>
            <a href="#" onClick={(e) => { e.preventDefault(); goToCompanyOverview && goToCompanyOverview(); setIsMobileMenuOpen(false); }}>COMPANY OVERVIEW</a>
            <a href="https://cableshouse-me.com/en/" target="_blank" rel="noopener noreferrer">PARENT COMPANY</a>
            <a href="#" onClick={(e) => { e.preventDefault(); goToContactUs && goToContactUs(); setIsMobileMenuOpen(false); }}>CONTACT US</a>
            <a href="#" onClick={(e) => { e.preventDefault(); goToFaqs && goToFaqs(); setIsMobileMenuOpen(false); }}>FAQS</a>
          </div>

          <div className="mobile-menu-contact">
            <a href="tel:+971501234567" className="mobile-menu-item">
              <Phone size={16} /> <span>+971 50 123 4567</span>
            </a>
            <a href="mailto:sales@superlight.ae" className="mobile-menu-item">
              <Mail size={16} /> <span>sales@superlight.ae</span>
            </a>
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

          {/* Search Bar Container */}
          <div 
            className={`search-container ${isSearchOpen && searchQuery.trim() ? 'active' : ''}`}
            ref={searchContainerRef}
          >
            <form className="search-box-bar" onSubmit={handleSearchSubmit}>
              <input 
                ref={searchInputRef}
                type="text" 
                placeholder="Search for products, brands or categories..." 
                className="search-input"
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => {
                  if (searchQuery.trim()) setIsSearchOpen(true);
                }}
                onKeyDown={handleSearchKeyDown}
                autoComplete="off"
              />
              {searchQuery && (
                <button 
                  type="button" 
                  className="search-clear-btn" 
                  onClick={handleClearSearch}
                  title="Clear search"
                >
                  <X size={16} />
                </button>
              )}
              <button type="submit" className="search-button" title="Search">
                <Search size={20} />
              </button>
            </form>

            {/* Live Autocomplete Dropdown under search bar */}
            {isSearchOpen && searchQuery.trim() && (
              <div className="search-dropdown-menu" role="listbox">
                {searchResults.totalCount > 0 ? (
                  <div className="search-results-wrapper">
                    
                    {/* Categories Section */}
                    {searchResults.categories.length > 0 && (
                      <div className="search-dropdown-section">
                        <div className="search-dropdown-section-title">
                          <Layers size={13} />
                          <span>Categories ({searchResults.categories.length})</span>
                        </div>
                        <div className="search-dropdown-items-list">
                          {searchResults.categories.map((cat, idx) => (
                            <div 
                              key={cat.id || idx}
                              className={`search-dropdown-item search-category-item ${activeSearchIndex === idx ? 'focused' : ''}`}
                              onClick={() => handleSelectCategory(cat)}
                            >
                              <div className="search-item-icon-box">
                                <Layers size={15} />
                              </div>
                              <div className="search-item-info">
                                <span className="search-item-main-name">
                                  {renderHighlightedText(cat.name, searchQuery)}
                                </span>
                                <span className="search-item-subtext">
                                  {cat.isMain ? 'Main Category' : (cat.parentName ? `in ${cat.parentName}` : 'Subcategory')}
                                </span>
                              </div>
                              <ChevronRight size={15} className="search-item-arrow" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Brands Section */}
                    {searchResults.brands.length > 0 && (
                      <div className="search-dropdown-section">
                        <div className="search-dropdown-section-title">
                          <span>Brands ({searchResults.brands.length})</span>
                        </div>
                        <div className="search-dropdown-items-list">
                          {searchResults.brands.map((b, idx) => {
                            const itemIdx = searchResults.categories.length + idx;
                            return (
                              <div 
                                key={b.id || idx}
                                className={`search-dropdown-item search-brand-item ${activeSearchIndex === itemIdx ? 'focused' : ''}`}
                                onClick={() => handleSelectBrand(b)}
                              >
                                <div className="search-brand-logo-box">
                                  {b.logo ? (
                                    <img src={b.logo} alt={b.name} className="search-brand-logo-img" />
                                  ) : (
                                    <span className="search-brand-initials">{(b.name || 'B').substring(0, 2).toUpperCase()}</span>
                                  )}
                                </div>
                                <div className="search-item-info">
                                  <span className="search-item-main-name">
                                    {renderHighlightedText(b.name, searchQuery)}
                                  </span>
                                  <span className="search-brand-store-tag">Official Brand</span>
                                </div>
                                <ChevronRight size={15} className="search-item-arrow" />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Products Section */}
                    {searchResults.products.length > 0 && (
                      <div className="search-dropdown-section">
                        <div className="search-dropdown-section-title">
                          <span>Products ({searchResults.products.length})</span>
                        </div>
                        <div className="search-dropdown-items-list">
                          {searchResults.products.map((prod, idx) => {
                            const itemIdx = searchResults.categories.length + searchResults.brands.length + idx;
                            return (
                              <div 
                                key={prod.id || idx}
                                className={`search-dropdown-item search-product-item ${activeSearchIndex === itemIdx ? 'focused' : ''}`}
                                onClick={() => handleProductClick(prod)}
                              >
                                <div className="search-prod-thumb-box">
                                  <img 
                                    src={prod.image} 
                                    alt={prod.name} 
                                    className="search-prod-thumb-img" 
                                    onError={(e) => { e.target.src = '/prod_downlight_1791451418016.png'; }}
                                  />
                                </div>
                                <div className="search-item-info">
                                  <span className="search-prod-name">
                                    {renderHighlightedText(prod.name, searchQuery)}
                                  </span>
                                  <div className="search-prod-meta-row">
                                    {prod.brand && <span className="search-prod-brand-tag">{prod.brand}</span>}
                                    {prod.category_name && <span className="search-prod-cat-tag">{prod.category_name}</span>}
                                  </div>
                                </div>
                                <div className="search-prod-pricing">
                                  <span className="search-prod-price">{prod.price}</span>
                                  {prod.oldPrice && <span className="search-prod-old-price">{prod.oldPrice}</span>}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* View all results footer */}
                    <div 
                      className="search-dropdown-footer"
                      onClick={handleSearchSubmit}
                    >
                      <span>View all {searchResults.totalCount} results for <strong>"{searchQuery}"</strong></span>
                      <ArrowRight size={16} />
                    </div>

                  </div>
                ) : (
                  /* NO PRODUCTS FOUND EMPTY STATE IN DROPDOWN */
                  <div className="search-dropdown-empty">
                    <div className="search-empty-icon-circle">
                      <Search size={22} />
                    </div>
                    <h4 className="search-empty-title">No products found</h4>
                    <p className="search-empty-text">
                      No products, categories, or brands found matching <strong>"{searchQuery}"</strong>.
                    </p>
                    <div className="search-empty-quick-suggestions">
                      <span className="search-quick-label">Try searching:</span>
                      <div className="search-quick-chips">
                        <button type="button" onClick={() => triggerQuickSearch('Wires')}>Wires</button>
                        <button type="button" onClick={() => triggerQuickSearch('Lighting')}>Lighting</button>
                        <button type="button" onClick={() => triggerQuickSearch('DeWalt')}>DeWalt</button>
                        <button type="button" onClick={() => triggerQuickSearch('Schneider')}>Schneider</button>
                        <button type="button" onClick={() => triggerQuickSearch('Switch')}>Switch</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
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
            
            <div 
              className="action-item icon-only" 
              onClick={() => navigate('/wishlist')} 
              style={{ cursor: 'pointer' }}
              title="My Wishlist"
            >
              <div className="icon-wrapper">
                <Heart size={24} className="action-icon" />
                <span className="badge">{wishlistCount}</span>
              </div>
            </div>

            <div 
              className="action-item icon-only" 
              onClick={() => navigate('/cart')} 
              style={{ cursor: 'pointer' }}
              title="Shopping Cart"
            >
              <div className="icon-wrapper">
                <ShoppingCart size={24} className="action-icon" />
                <span className="badge">{cartCount}</span>
              </div>
            </div>

            <div 
              className="action-item icon-only" 
              onClick={() => navigate('/my-orders')} 
              style={{ cursor: 'pointer' }}
              title="My Orders"
            >
              <div className="icon-wrapper">
                <Package size={24} className="action-icon" />
                {ordersCount > 0 && <span className="badge">{ordersCount}</span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="navigation" ref={navRef}>
        <div className="container nav-content">
          <div 
            className={`all-categories-wrapper ${isAllCatHovered ? 'hovered' : ''}`}
            onMouseEnter={() => {
              if (!isMenuLockedRef.current) {
                setIsAllCatHovered(true);
              }
            }}
            onMouseLeave={() => {
              isMenuLockedRef.current = false;
              setIsAllCatHovered(false);
            }}
          >
            <button 
              className="all-categories-btn" 
              type="button" 
              aria-expanded={isAllCatHovered}
              onClick={() => {
                isMenuLockedRef.current = false;
                setIsAllCatHovered(prev => !prev);
              }}
            >
              <div className="all-cat-btn-left">
                <Menu size={22} strokeWidth={2} />
                <span>All Categories</span>
              </div>
              <ChevronDown size={18} strokeWidth={2.5} className="all-cat-arrow" />
            </button>

            <div 
              className="all-categories-mega-menu"
              style={{ minHeight: `calc(100vh - ${navBottomOffset}px)` }}
            >
              <div className="all-cat-container">
                <div className="all-cat-grid">
                  {categories.length > 0 ? (
                    categories.map((cat) => (
                      <div key={cat.id} className="all-cat-column">
                        {/* Main Category Header Button */}
                        <a 
                          href={`#${cat.slug}`}
                          className="all-cat-header-btn"
                          onClick={(e) => {
                            handleCategoryClick(e, cat);
                            setIsAllCatHovered(false);
                          }}
                        >
                          {cat.name}
                        </a>
                        
                        {/* Subcategories Vertical List */}
                        <div className="all-cat-sub-list">
                          {cat.subcategories && cat.subcategories.length > 0 ? (
                            cat.subcategories.map((sub) => (
                              <a 
                                key={sub.id}
                                href={`#${sub.slug}`}
                                className="all-cat-sub-item"
                                onClick={(e) => {
                                  handleCategoryClick(e, sub, cat);
                                }}
                              >
                                <span className="all-cat-sub-name">{sub.name}</span>
                                <ChevronRight size={14} strokeWidth={2} className="all-cat-sub-chevron" />
                              </a>
                            ))
                          ) : (
                            <a 
                              href={`#${cat.slug}`}
                              className="all-cat-sub-item view-all"
                              onClick={(e) => {
                                handleCategoryClick(e, cat);
                                setIsAllCatHovered(false);
                              }}
                            >
                              <span className="all-cat-sub-name">View all products</span>
                              <ChevronRight size={14} strokeWidth={2} className="all-cat-sub-chevron" />
                            </a>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="all-cat-loading">
                      Loading categories...
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <ul className="nav-links">
            <li><a href="#">BELCABLE</a></li>
            <li className="dropdown">
              <a href="#" onClick={(e) => e.preventDefault()}>SHOP BY BRAND</a>
              <div className="dropdown-menu mega-menu">
                {brands.length > 0 ? (
                  brands.map((b) => (
                    <div key={b.id} className="mega-menu-item">
                      <a href={`/${b.slug || ''}`} onClick={(e) => handleBrandClick(e, b)}>
                        {b.name}
                        {b.is_featured ? <span className="best-seller-tag">FEATURED</span> : null}
                      </a>
                    </div>
                  ))
                ) : (
                  <div className="mega-menu-item" style={{ gridColumn: 'span 2', color: '#6b7280', fontSize: '14px', fontStyle: 'italic', padding: '8px 0' }}>
                    Loading brands...
                  </div>
                )}
              </div>
            </li>
            <li className="dropdown">
              <a href="#" onClick={(e) => e.preventDefault()}>WE ARE OFFERING</a>
              <div className="dropdown-menu mega-menu">
                {categories.length > 0 ? (
                  categories.map((cat) => (
                    <div key={cat.id} className="mega-menu-item">
                      <a 
                        href={`#${cat.slug}`}
                        onClick={(e) => handleCategoryClick(e, cat)}
                      >
                        {cat.name}
                      </a>
                    </div>
                  ))
                ) : (
                  <div className="mega-menu-item" style={{ gridColumn: 'span 2', color: '#6b7280', fontSize: '14px', fontStyle: 'italic', padding: '8px 0' }}>
                    Loading categories...
                  </div>
                )}
              </div>
            </li>
            <li><a href="#" onClick={(e) => { e.preventDefault(); goToCompanyOverview && goToCompanyOverview(); }}>COMPANY OVERVIEW</a></li>
            <li><a href="https://cableshouse-me.com/en/" target="_blank" rel="noopener noreferrer">PARENT COMPANY</a></li>
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

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './CategorySection.css';

const categories = [
  { 
    id: 1, 
    name: 'Wires & Cables', 
    image: '/Red Insulated Cable Coil with Exposed Copper Strands.png',
    path: '/wires-cables'
  },
  { 
    id: 2, 
    name: 'LED Lighting & Special Lamp', 
    image: '/lights.png',
    path: '/led-lighting-special-lamp'
  },
  { 
    id: 3, 
    name: 'Switches, Sockets & Electrical Accessories', 
    image: '/switch.png',
    path: '/switches-sockets-electrical-accessories'
  },
  { 
    id: 4, 
    name: 'Switchgear & Control Panel Products', 
    image: '/brakers .png',
    path: '/switchgear-control-panel-products'
  },
  { 
    id: 5, 
    name: 'Building Materials', 
    image: '/painting.png',
    path: '/building-materials'
  },
  { 
    id: 6, 
    name: 'Safety Products', 
    image: '/safety.png',
    path: '/safety-products'
  },
  { 
    id: 7, 
    name: 'AC Spair Parts', 
    image: '/ac.png',
    path: '/ac-spare-parts'
  }
];

const loopedCategories = [
  ...categories.map((c) => ({ ...c, uniqueKey: `loop1-${c.id}` })),
  ...categories.map((c) => ({ ...c, uniqueKey: `loop2-${c.id}` })),
  ...categories.map((c) => ({ ...c, uniqueKey: `loop3-${c.id}` }))
];

const CategorySection = () => {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(categories.length);
  const [withTransition, setWithTransition] = useState(true);
  const [visibleCount, setVisibleCount] = useState(6);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width <= 640) {
        setVisibleCount(2);
      } else if (width <= 900) {
        setVisibleCount(3);
      } else if (width <= 1180) {
        setVisibleCount(4);
      } else {
        setVisibleCount(6);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Seamless infinite loop jump on transition end
  const handleTransitionEnd = () => {
    if (currentIndex >= categories.length * 2) {
      setWithTransition(false);
      setCurrentIndex((prev) => prev - categories.length);
    } else if (currentIndex < categories.length) {
      setWithTransition(false);
      setCurrentIndex((prev) => prev + categories.length);
    }
  };

  // Re-enable transition on next frame after invisible index jump
  useEffect(() => {
    if (!withTransition) {
      const frame = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setWithTransition(true);
        });
      });
      return () => cancelAnimationFrame(frame);
    }
  }, [withTransition]);

  // Continuous auto-play: moving to left 1 card at a time in loop
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setWithTransition(true);
      setCurrentIndex((prev) => prev + 1);
    }, 3500);
    return () => clearInterval(interval);
  }, [isPaused]);

  const handlePrev = () => {
    setWithTransition(true);
    setCurrentIndex((prev) => prev - 1);
  };

  const handleNext = () => {
    setWithTransition(true);
    setCurrentIndex((prev) => prev + 1);
  };

  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance > 50) {
      handleNext();
    } else if (distance < -50) {
      handlePrev();
    }
    setTouchStart(0);
    setTouchEnd(0);
  };

  return (
    <div className="category-section">
      <div className="container">
        <div className="category-header">
          <div className="header-text">
            <h4 className="subtitle">SHOP BY CATEGORY</h4>
            <h2 className="title">Explore Our Product Categories</h2>
          </div>
          <div className="category-header-actions">
            <div className="carousel-nav-controls">
              <button 
                type="button" 
                className="carousel-arrow-btn" 
                onClick={handlePrev} 
                aria-label="Previous categories"
              >
                <ChevronLeft size={18} strokeWidth={2.5} />
              </button>
              <button 
                type="button" 
                className="carousel-arrow-btn" 
                onClick={handleNext} 
                aria-label="Next categories"
              >
                <ChevronRight size={18} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>
        
        <div 
          className="category-carousel-viewport"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div 
            className="category-carousel-track"
            onTransitionEnd={handleTransitionEnd}
            style={{
              transform: `translateX(-${currentIndex * (100 / visibleCount)}%)`,
              transition: withTransition ? 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)' : 'none'
            }}
          >
            {loopedCategories.map((category) => (
              <div 
                key={category.uniqueKey} 
                className="category-card-slide"
                style={{ flex: `0 0 ${100 / visibleCount}%` }}
              >
                <div 
                  className="category-card"
                  onClick={() => {
                    navigate(category.path);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  <div className="card-image-wrapper">
                    <img 
                      src={category.image} 
                      alt={category.name} 
                      className="category-image" 
                      loading="lazy"
                    />
                  </div>
                  <div className="card-content">
                    <h3 className="category-name">{category.name}</h3>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategorySection;

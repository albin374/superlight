import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './CategorySection.css';

const DEFAULT_CATEGORIES = [
  { 
    id: 8, 
    name: 'LED Lighting & Special Lamp', 
    image: '/lights.png',
    path: '/led-lighting-special-lamp',
    slug: 'led-lighting-special-lamp'
  },
  { 
    id: 5, 
    name: 'Wires & Cables', 
    image: '/Red Insulated Cable Coil with Exposed Copper Strands.png',
    path: '/wires-cables',
    slug: 'wires-cables'
  },
  { 
    id: 10, 
    name: 'Switches, Sockets & Electrical Accessories', 
    image: '/switch.png',
    path: '/switches-sockets-electrical-accessories',
    slug: 'switches-sockets-electrical-accessories'
  },
  { 
    id: 12, 
    name: 'Switchgear & Control Panel Products', 
    image: '/brakers .png',
    path: '/switchgear-control-panel-products',
    slug: 'switchgear-control-panel-products'
  },
  { 
    id: 14, 
    name: 'Building Materials', 
    image: '/painting.png',
    path: '/building-materials',
    slug: 'building-materials'
  },
  { 
    id: 16, 
    name: 'Safety Products', 
    image: '/safety.png',
    path: '/safety-products',
    slug: 'safety-products'
  },
  { 
    id: 18, 
    name: 'AC Spare Parts', 
    image: '/ac.png',
    path: '/ac-spare-parts',
    slug: 'ac-spare-parts'
  }
];

const normalizeCategoryKey = (str) => {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/spair/g, 'spare')
    .replace(/[^a-z0-9]/g, '');
};

const isSameCategory = (catA, catB) => {
  if (!catA || !catB) return false;
  // If either has ID and they match
  if (catA.id && catB.id && Number(catA.id) === Number(catB.id)) return true;

  // Special match for AC Spare Parts (ID 18 or 7 or slug/name variation)
  const isAcA = (Number(catA.id) === 18 || Number(catA.id) === 7 || normalizeCategoryKey(catA.slug) === 'acspareparts' || normalizeCategoryKey(catA.name).includes('acspare'));
  const isAcB = (Number(catB.id) === 18 || Number(catB.id) === 7 || normalizeCategoryKey(catB.slug) === 'acspareparts' || normalizeCategoryKey(catB.name).includes('acspare'));
  if (isAcA && isAcB) return true;

  const keySlugA = normalizeCategoryKey(catA.slug);
  const keySlugB = normalizeCategoryKey(catB.slug);
  if (keySlugA && keySlugB && keySlugA === keySlugB) return true;

  const keyNameA = normalizeCategoryKey(catA.name);
  const keyNameB = normalizeCategoryKey(catB.name);
  if (keyNameA && keyNameB && keyNameA === keyNameB) return true;

  return false;
};

const CategorySection = () => {
  const navigate = useNavigate();
  const [categoriesList, setCategoriesList] = useState(DEFAULT_CATEGORIES);
  const [currentIndex, setCurrentIndex] = useState(DEFAULT_CATEGORIES.length);
  const [withTransition, setWithTransition] = useState(true);
  const [visibleCount, setVisibleCount] = useState(6);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  useEffect(() => {
    let isMounted = true;
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => {
        if (data && data.success && Array.isArray(data.categories) && data.categories.length > 0 && isMounted) {
          const updated = DEFAULT_CATEGORIES.map(def => {
            const match = data.categories.find(c => isSameCategory(c, def));
            if (match) {
              const displayName = (match.name || def.name).toUpperCase().replace(/SPAIR/g, 'SPARE');
              return {
                ...def,
                name: displayName,
                id: match.id || def.id,
                image: match.image || match.icon_url || def.image,
                path: def.path || `/${match.slug || def.slug}`
              };
            }
            return {
              ...def,
              name: def.name.toUpperCase().replace(/SPAIR/g, 'SPARE')
            };
          });

          // Add any newly created main categories from backend
          data.categories.forEach(c => {
            if (c.parent_id) return; // Only top-level main categories

            const alreadyExists = updated.some(u => isSameCategory(u, c));
            if (!alreadyExists) {
              updated.push({
                id: c.id,
                name: (c.name || '').toUpperCase().replace(/SPAIR/g, 'SPARE'),
                image: c.image || c.icon_url || '/prod_downlight_1791451418016.png',
                path: `/${c.slug || c.id}`,
                slug: c.slug
              });
            }
          });

          // Final deduplication safety pass to ensure absolutely no duplicate categories
          const seen = new Set();
          const deduplicated = [];
          for (const item of updated) {
            const key = normalizeCategoryKey(item.slug || item.name) || item.id;
            if (!seen.has(key)) {
              seen.add(key);
              deduplicated.push(item);
            }
          }

          const getCatRank = (cat) => {
            const slug = (cat.slug || '').toLowerCase();
            const name = (cat.name || '').toLowerCase();
            if (slug.includes('lighting') || name.includes('lighting') || Number(cat.id) === 8) return 1;
            if (slug.includes('wire') || name.includes('wire') || (name.includes('cable') && !name.includes('management')) || Number(cat.id) === 5) return 2;
            return 100;
          };
          deduplicated.sort((a, b) => {
            const rA = getCatRank(a);
            const rB = getCatRank(b);
            if (rA !== rB) return rA - rB;
            return (Number(a.id) || 0) - (Number(b.id) || 0);
          });

          setCategoriesList(deduplicated);
          setCurrentIndex(deduplicated.length);
        }
      })
      .catch(() => {});

    return () => { isMounted = false; };
  }, []);

  const loopedCategories = useMemo(() => {
    if (!categoriesList.length) return [];
    return [
      ...categoriesList.map((c) => ({ ...c, uniqueKey: `loop1-${c.id}` })),
      ...categoriesList.map((c) => ({ ...c, uniqueKey: `loop2-${c.id}` })),
      ...categoriesList.map((c) => ({ ...c, uniqueKey: `loop3-${c.id}` }))
    ];
  }, [categoriesList]);

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
    const total = categoriesList.length;
    if (currentIndex >= total * 2) {
      setWithTransition(false);
      setCurrentIndex((prev) => prev - total);
    } else if (currentIndex < total) {
      setWithTransition(false);
      setCurrentIndex((prev) => prev + total);
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
    <div className="category-section" id="explore-categories">
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
                    <h3 className="category-name">{(category.name || '').toUpperCase()}</h3>
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

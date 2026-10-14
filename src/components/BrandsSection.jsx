import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import './BrandsSection.css';

const defaultBrands = [
  { id: 1, name: 'Schneider Electric', image: '/logo/Schneider Electric.png' },
  { id: 2, name: 'Legrand', image: '/logo/Legrand.png' },
  { id: 3, name: 'Philips', image: '/logo/philips.png' },
  { id: 4, name: 'Osram', image: '/logo/osram.png' },
  { id: 5, name: 'Makita', image: '/logo/makitha.png' },
  { id: 6, name: 'DeWalt', image: '/logo/DeWalt_Logo.svg' },
  { id: 7, name: 'Belden', image: '/logo/belden.png' },
  { id: 8, name: 'Fluke', image: '/logo/Fluke_Logo2.webp' },
  { id: 9, name: 'Ducab', image: '/logo/Ducab.png' }
];

const BrandsSection = () => {
  const scrollRef = useRef(null);
  const [brandsList, setBrandsList] = useState(defaultBrands);

  useEffect(() => {
    fetch('/api/brands')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.brands) && data.brands.length > 0) {
          const withImages = data.brands.filter(b => b.image && b.image.trim());
          if (withImages.length > 0) {
            setBrandsList(withImages);
          }
        }
      })
      .catch(() => {});
  }, []);

  const extendedBrands = [...brandsList, ...brandsList, ...brandsList];

  useEffect(() => {
    const container = scrollRef.current;
    let animationId;

    const scroll = () => {
      if (container) {
        container.scrollLeft += 1;
        
        if (container.scrollLeft >= (container.scrollWidth * 2) / 3) {
          container.scrollLeft = container.scrollWidth / 3;
        }
      }
      animationId = requestAnimationFrame(scroll);
    };

    animationId = requestAnimationFrame(scroll);

    const handleMouseEnter = () => cancelAnimationFrame(animationId);
    const handleMouseLeave = () => { animationId = requestAnimationFrame(scroll); };

    if (container) {
      container.addEventListener('mouseenter', handleMouseEnter);
      container.addEventListener('mouseleave', handleMouseLeave);
    }

    return () => {
      cancelAnimationFrame(animationId);
      if (container) {
        container.removeEventListener('mouseenter', handleMouseEnter);
        container.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, []);

  const scrollLeftBtn = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const scrollRightBtn = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  const handleBrandClick = (brand) => {
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

  return (
    <div className="brands-section">
      <div className="container">
        <div className="brands-header">
          <div className="brands-title-wrapper">
            <h4 className="brands-subtitle">OUR BRANDS</h4>
            <h2 className="brands-title">Trusted Global Brands</h2>
          </div>
          <a href="#" className="view-all" onClick={(e) => { e.preventDefault(); navigate('/dewalt'); }}>
            View All Brands <ArrowRight size={16} />
          </a>
        </div>

        <div className="brands-carousel-container">
          <button className="carousel-arrow left" onClick={scrollLeftBtn}>
            <ChevronLeft size={20} />
          </button>
          
          <div className="brands-carousel" ref={scrollRef}>
            {extendedBrands.map((brand, index) => (
              <div 
                key={`${brand.id}-${index}`} 
                className="brand-logo-wrapper"
                onClick={() => handleBrandClick(brand)}
                style={{ cursor: 'pointer' }}
                title={`Shop ${brand.name}`}
              >
                <img src={brand.image} alt={brand.name} className="brand-logo" />
              </div>
            ))}
          </div>

          <button className="carousel-arrow right" onClick={scrollRightBtn}>
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default BrandsSection;

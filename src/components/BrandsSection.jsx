import React, { useRef, useEffect } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import './BrandsSection.css';

const brands = [
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

const extendedBrands = [...brands, ...brands, ...brands];

const BrandsSection = () => {
  const scrollRef = useRef(null);

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

  return (
    <div className="brands-section">
      <div className="container">
        <div className="brands-header">
          <div className="brands-title-wrapper">
            <h4 className="brands-subtitle">OUR BRANDS</h4>
            <h2 className="brands-title">Trusted Global Brands</h2>
          </div>
          <a href="#" className="view-all">
            View All Brands <ArrowRight size={16} />
          </a>
        </div>

        <div className="brands-carousel-container">
          <button className="carousel-arrow left" onClick={scrollLeftBtn}>
            <ChevronLeft size={20} />
          </button>
          
          <div className="brands-carousel" ref={scrollRef}>
            {extendedBrands.map((brand, index) => (
              <div key={`${brand.id}-${index}`} className="brand-logo-wrapper">
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

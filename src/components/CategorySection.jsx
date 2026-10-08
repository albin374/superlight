import React from 'react';
import { ArrowRight } from 'lucide-react';
import './CategorySection.css';

const categories = [
  { id: 1, name: 'BELLS', image: '/bell.png' },
  { id: 2, name: 'ELECTRICAL SWITCHES & SOCKETS', image: '/switch.png' },
  { id: 3, name: 'LIGHTING', image: '/lighting.png' },
  { id: 4, name: 'LOAD CENTERS & CIRCUIT BREAKERS', image: '/brakers .png' },
  { id: 5, name: 'MEASUREMENT & TESTING TOOLS', image: '/measurmentsand testing.png' },
  { id: 6, name: 'PATCH PANELS', image: '/patch panel.png' }
];

const CategorySection = () => {
  return (
    <div className="category-section">
      <div className="container">
        <div className="category-header">
          <div className="header-text">
            <h4 className="subtitle">SHOP BY CATEGORY</h4>
            <h2 className="title">Explore Our Product Categories</h2>
          </div>
          <a href="#" className="view-all">
            View All Categories <ArrowRight size={16} />
          </a>
        </div>
        
        <div className="category-grid">
          {categories.map((category) => (
            <div key={category.id} className="category-card">
              <div className="card-image-wrapper">
                <img src={category.image} alt={category.name} className="category-image" />
              </div>
              <div className="card-content">
                <h3 className="category-name">{category.name}</h3>
                {category.subtext && <span className="category-subtext">{category.subtext}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CategorySection;

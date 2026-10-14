import React from 'react';
import CategoryProductPage from '../common/CategoryProductPage';
import './PlumbingMaterials.css';

const PlumbingMaterials = ({ 
  onProductClick,
  title = "Building Materials",
  highlightWord = "Materials",
  description = "Top-tier construction materials, robust piping systems, plumbing valves, and fittings engineered to international standards for commercial and residential infrastructure."
}) => {
  return (
    <CategoryProductPage
      categoryName="Building Materials"
      heroTitle={title}
      heroHighlight={highlightWord}
      heroDesc={description}
      heroBannerClass="pm-hero-banner"
      onProductClick={onProductClick}
    />
  );
};

export default PlumbingMaterials;

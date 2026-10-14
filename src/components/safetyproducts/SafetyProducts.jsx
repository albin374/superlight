import React from 'react';
import CategoryProductPage from '../common/CategoryProductPage';
import './SafetyProducts.css';

const SafetyProducts = ({ 
  onProductClick,
  title = "Safety Products",
  highlightWord = "Products",
  description = "Comprehensive industrial PPE, safety helmets, protective eyewear, high-visibility clothing, and occupational safety equipment engineered for uncompromised workplace protection."
}) => {
  return (
    <CategoryProductPage
      categoryName="Safety Products"
      heroTitle={title}
      heroHighlight={highlightWord}
      heroDesc={description}
      heroBannerClass="sp-hero-banner"
      onProductClick={onProductClick}
    />
  );
};

export default SafetyProducts;

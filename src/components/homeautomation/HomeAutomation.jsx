import React from 'react';
import CategoryProductPage from '../common/CategoryProductPage';
import './HomeAutomation.css';

const HomeAutomation = ({ 
  onProductClick,
  title = "Switchgear & Control Panel Products",
  highlightWord = "Products",
  description = "High-performance electrical switchgear, circuit breakers, smart automation modules, and industrial control panel equipment designed for maximum power safety and distribution efficiency."
}) => {
  return (
    <CategoryProductPage
      categoryName="Switchgear & Control Panel"
      heroTitle={title}
      heroHighlight={highlightWord}
      heroDesc={description}
      heroBannerClass="ha-hero-banner"
      onProductClick={onProductClick}
    />
  );
};

export default HomeAutomation;

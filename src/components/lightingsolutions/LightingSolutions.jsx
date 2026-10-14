import React from 'react';
import CategoryProductPage from '../common/CategoryProductPage';
import './LightingSolutions.css';

const LightingSolutions = ({ onProductClick }) => {
  return (
    <CategoryProductPage
      categoryName="LED Lighting & Special Lamp"
      heroTitle="LED Lighting & Special Lamp"
      heroHighlight="Lamp"
      heroDesc="Energy-efficient architectural fixtures, commercial LED panels, high-lumen downlights, and specialized industrial lamps designed for brilliant spaces."
      heroBannerClass="ls-hero-banner"
      onProductClick={onProductClick}
    />
  );
};

export default LightingSolutions;

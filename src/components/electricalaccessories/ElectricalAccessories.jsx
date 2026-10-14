import React from 'react';
import CategoryProductPage from '../common/CategoryProductPage';
import './ElectricalAccessories.css';

const ElectricalAccessories = ({ 
  onProductClick,
  title = "Switches, Sockets & Electrical Accessories",
  highlightWord = "Accessories",
  description = "Premium decorative wall switches, heavy-duty industrial sockets, weather-resistant outdoor plates, and commercial distribution modules."
}) => {
  return (
    <CategoryProductPage
      categoryName="Switches & Sockets"
      heroTitle={title}
      heroHighlight={highlightWord}
      heroDesc={description}
      heroBannerClass="ea-hero-banner"
      onProductClick={onProductClick}
    />
  );
};

export default ElectricalAccessories;

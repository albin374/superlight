import React from 'react';
import CategoryProductPage from '../common/CategoryProductPage';
import './AcSpareParts.css';

const AcSpareParts = ({ 
  onProductClick,
  title = "AC Spare Parts",
  highlightWord = "Parts",
  description = "Heavy-duty HVAC compressors, dual-run motor capacitors, copper tubing, vibration isolators, and precision cooling spare parts engineered for maximum climate control efficiency."
}) => {
  return (
    <CategoryProductPage
      categoryName="AC Spare Parts"
      heroTitle={title}
      heroHighlight={highlightWord}
      heroDesc={description}
      heroBannerClass="ac-hero-banner"
      onProductClick={onProductClick}
    />
  );
};

export default AcSpareParts;

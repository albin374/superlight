import React from 'react';
import CategoryProductPage from '../common/CategoryProductPage';
import './CableManagement.css';

const CableManagement = ({ onProductClick }) => {
  return (
    <CategoryProductPage
      categoryName="Wires & Cables"
      heroTitle="Wires & Cables"
      heroHighlight="Cables"
      heroDesc="Certified low & medium voltage power cables, building wires, industrial conduits, and organized cable routing systems engineered for ultimate safety and performance."
      heroBannerClass="cm-hero-banner"
      onProductClick={onProductClick}
    />
  );
};

export default CableManagement;

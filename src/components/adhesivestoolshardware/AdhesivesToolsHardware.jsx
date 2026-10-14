import React from 'react';
import CategoryProductPage from '../common/CategoryProductPage';
import './AdhesivesToolsHardware.css';

const AdhesivesToolsHardware = ({ onProductClick }) => {
  return (
    <CategoryProductPage
      categoryName="Adhesives, Tools & Hardware"
      heroTitle="Adhesives, Tools & Hardware"
      heroHighlight="Hardware"
      heroDesc="Professional power tools, precision electrician hand tools, industrial adhesives, sealants, and robust hardware fasteners built for site performance."
      heroBannerClass="ath-hero-banner"
      onProductClick={onProductClick}
    />
  );
};

export default AdhesivesToolsHardware;

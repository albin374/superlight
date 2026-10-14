import React from 'react';
import BrandProductPage from './BrandProductPage';

const OsramBrand = ({ onProductClick }) => {
  return (
    <BrandProductPage
      brandName="Osram"
      heroTitle="OSRAM Brand Products"
      heroHighlight="Brand Products"
      heroDesc="Pioneering optical lighting solutions, high-lumen industrial LED high bays, precision spotlighting, tubes, and specialty commercial lamps."
      bannerImage="/OSRAM .png"
      onProductClick={onProductClick}
    />
  );
};

export default OsramBrand;

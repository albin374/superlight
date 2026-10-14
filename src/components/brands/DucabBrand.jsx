import React from 'react';
import BrandProductPage from './BrandProductPage';

const DucabBrand = ({ onProductClick }) => {
  return (
    <BrandProductPage
      brandName="Ducab"
      heroTitle="Ducab Brand Products"
      heroHighlight="Brand Products"
      heroDesc="UAE’s trusted global manufacturer of premium building wires, low & medium voltage power cables, flexible control cables, and fire performance solutions."
      bannerImage="/Ducab .png"
      onProductClick={onProductClick}
    />
  );
};

export default DucabBrand;

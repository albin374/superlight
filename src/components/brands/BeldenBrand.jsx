import React from 'react';
import BrandProductPage from './BrandProductPage';

const BeldenBrand = ({ onProductClick }) => {
  return (
    <BrandProductPage
      brandName="Belden"
      heroTitle="Belden Brand Products"
      heroHighlight="Brand Products"
      heroDesc="Mission-critical signal transmission infrastructure, Cat6 & Cat6A enterprise network cables, modular patch panels, and industrial data connectivity hardware."
      bannerImage="/belden.png"
      onProductClick={onProductClick}
    />
  );
};

export default BeldenBrand;

import React from 'react';
import BrandProductPage from './BrandProductPage';

const MakitaBrand = ({ onProductClick }) => {
  return (
    <BrandProductPage
      brandName="Makita"
      heroTitle="Makita Brand Products"
      heroHighlight="Brand Products"
      heroDesc="Engineered for excellence with class-leading brushless motor technology, industrial rotary hammers, circular saws, and jobsite tools."
      bannerImage="/Makita .png"
      onProductClick={onProductClick}
    />
  );
};

export default MakitaBrand;

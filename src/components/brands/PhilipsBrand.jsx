import React from 'react';
import BrandProductPage from './BrandProductPage';

const PhilipsBrand = ({ onProductClick }) => {
  return (
    <BrandProductPage
      brandName="Philips"
      heroTitle="Philips Brand Products"
      heroHighlight="Brand Products"
      heroDesc="World leader in energy-efficient LED luminaires, recessed downlights, outdoor floodlights, architectural panel lights, and smart lighting solutions."
      bannerImage="/Philips .png"
      onProductClick={onProductClick}
    />
  );
};

export default PhilipsBrand;
